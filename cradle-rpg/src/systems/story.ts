/**
 * STORY STATE — the narrative memory of a playthrough (M4a).
 *
 * Owns:
 *  - flags: a string -> boolean|number map. Flags NEVER reset (enemies
 *    respawn on map re-entry; story does not). Saved in SaveData.flags.
 *  - the three choice axes: Reputation (per-faction), Resolve, Knowledge.
 *  - quests: data-driven (QuestDef registry) with ordered objectives, each
 *    keyed to a completion FLAG — quest progress is therefore derived state
 *    and survives saves for free. Active/completed id lists are saved in
 *    systems.story.
 *
 * Also defines the shared Condition / Effect vocabulary used by dialogue
 * nodes, dialogue choices, cutscene steps, and quest rewards. Conditions are
 * evaluated against a StoryQuery; effects are dispatched through an
 * EffectHandler the game provides (World implements it) — this module stays
 * pure and headless-testable.
 */

// ------------------------------------------------------------- conditions

export type FlagValue = boolean | number;

/** What conditions are checked against (World adapts itself to this). */
export interface StoryQuery {
  getFlag(key: string): FlagValue | undefined;
  /** Player stage (Stage enum value). */
  stage: number;
  /** Player origin id ("wei" | "li" | "kazan" | "unsouled"). */
  origin: string;
  /** Current scales (currency). */
  scales: number;
}

export type Condition =
  /** Flag truthiness / exact value / numeric >= check. */
  | { kind: "flag"; key: string; truthy?: boolean; equals?: FlagValue; gte?: number }
  | { kind: "stageGte"; stage: number }
  | { kind: "origin"; origin: string; not?: boolean }
  | { kind: "scalesGte"; amount: number };

export function checkCondition(c: Condition, q: StoryQuery): boolean {
  switch (c.kind) {
    case "flag": {
      const v = q.getFlag(c.key);
      if (c.equals !== undefined) return v === c.equals;
      if (c.gte !== undefined) return typeof v === "number" && v >= c.gte;
      const truthy = v === true || (typeof v === "number" && v !== 0);
      return (c.truthy ?? true) ? truthy : !truthy;
    }
    case "stageGte":
      return q.stage >= c.stage;
    case "origin":
      return c.not ? q.origin !== c.origin : q.origin === c.origin;
    case "scalesGte":
      return q.scales >= c.amount;
  }
}

export function checkConditions(cs: Condition[] | undefined, q: StoryQuery): boolean {
  if (!cs || cs.length === 0) return true;
  return cs.every((c) => checkCondition(c, q));
}

// ---------------------------------------------------------------- effects

export type Effect =
  | { kind: "setFlag"; key: string; value?: FlagValue } // default true
  | { kind: "reputation"; faction: string; amount: number }
  | { kind: "resolve"; amount: number }
  | { kind: "knowledge"; amount: number }
  | { kind: "giveScales"; amount: number }
  | { kind: "takeScales"; amount: number }
  | { kind: "startQuest"; quest: string }
  /** Marks one quest objective done (sets its completion flag). */
  | { kind: "completeObjective"; quest: string; objective: string }
  /** Items are flags ("item.<id>") until a real inventory exists. */
  | { kind: "giveItem"; item: string; label?: string }
  | { kind: "heal"; fraction?: number } // default full
  /** Move the player to another map ("" entry = the map's spawn). */
  | { kind: "moveMap"; map: string; entry?: string }
  | { kind: "cutscene"; id: string }
  /** STORY-GATED ADVANCEMENT (Jade/Gold): grant the next stage with the
   *  ceremony visuals. `stage` is the Stage enum value to reach. */
  | { kind: "giveStage"; stage: number; title?: string; sub?: string };

export type EffectHandler = (e: Effect) => void;

export function runEffects(es: Effect[] | undefined, handler: EffectHandler): void {
  if (!es) return;
  for (const e of es) handler(e);
}

// ----------------------------------------------------------------- quests

export interface QuestObjective {
  id: string;
  /** Journal line. */
  text: string;
  /** The story flag that marks this objective complete. */
  flag: string;
}

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  /** Ordered; the journal highlights the first incomplete one. */
  objectives: QuestObjective[];
  /** Run through the game's EffectHandler when the quest completes. */
  reward?: Effect[];
  /** Started automatically for fresh characters (tutorial quests). */
  autoStart?: boolean;
}

const questRegistry = new Map<string, QuestDef>();

export function registerQuest(def: QuestDef): void {
  questRegistry.set(def.id, def);
}

export function getQuest(id: string): QuestDef | undefined {
  return questRegistry.get(id);
}

export function allQuests(): QuestDef[] {
  return [...questRegistry.values()];
}

/** Test/seed helper: drop every registered quest. */
export function clearQuestRegistry(): void {
  questRegistry.clear();
}

// ------------------------------------------------------------ story state

export interface StorySave {
  reputation: Record<string, number>;
  resolve: number;
  knowledge: number;
  questsActive: string[];
  questsCompleted: string[];
}

export interface QuestStatus {
  def: QuestDef;
  objectives: { text: string; done: boolean }[];
  /** Index of the first incomplete objective (-1 when all done). */
  current: number;
}

export class StoryState {
  /** Story flags — never reset. Persisted in SaveData.flags. */
  readonly flags: Record<string, FlagValue> = {};
  /** Reputation per faction (wei, li, kazan, heavensGlory, …). */
  readonly reputation: Record<string, number> = {};
  resolve = 0;
  knowledge = 0;

  questsActive: string[] = [];
  questsCompleted: string[] = [];

  /** Fired when a quest completes (World runs reward effects + a toast). */
  onQuestComplete: ((def: QuestDef) => void) | null = null;
  /** Fired when a quest starts (journal toast). */
  onQuestStart: ((def: QuestDef) => void) | null = null;

  // ----------------------------------------------------------------- flags

  setFlag(key: string, value: FlagValue = true): void {
    this.flags[key] = value;
    this.checkQuests();
  }

  getFlag(key: string): FlagValue | undefined {
    return this.flags[key];
  }

  flagTruthy(key: string): boolean {
    const v = this.flags[key];
    return v === true || (typeof v === "number" && v !== 0);
  }

  // ------------------------------------------------------------------ axes

  addReputation(faction: string, amount: number): void {
    this.reputation[faction] = (this.reputation[faction] ?? 0) + amount;
  }

  addResolve(amount: number): void {
    this.resolve += amount;
  }

  addKnowledge(amount: number): void {
    this.knowledge += amount;
  }

  // ---------------------------------------------------------------- quests

  startQuest(id: string): boolean {
    const def = getQuest(id);
    if (!def) return false;
    if (this.questsActive.includes(id) || this.questsCompleted.includes(id)) return false;
    this.questsActive.push(id);
    this.onQuestStart?.(def);
    this.checkQuests(); // objectives may already be satisfied
    return true;
  }

  /** Start every autoStart quest not already running/finished (new game). */
  startAutoQuests(): void {
    for (const def of allQuests()) {
      if (def.autoStart) this.startQuest(def.id);
    }
  }

  questStatus(id: string): QuestStatus | null {
    const def = getQuest(id);
    if (!def) return null;
    const objectives = def.objectives.map((o) => ({
      text: o.text,
      done: this.flagTruthy(o.flag),
    }));
    const current = objectives.findIndex((o) => !o.done);
    return { def, objectives, current };
  }

  /** Active quest statuses for the journal. */
  activeStatuses(): QuestStatus[] {
    return this.questsActive
      .map((id) => this.questStatus(id))
      .filter((s): s is QuestStatus => s !== null);
  }

  completedDefs(): QuestDef[] {
    return this.questsCompleted
      .map((id) => getQuest(id))
      .filter((d): d is QuestDef => d !== undefined);
  }

  /** Complete any active quest whose objective flags are all set. */
  private checkQuests(): void {
    for (let i = this.questsActive.length - 1; i >= 0; i--) {
      const id = this.questsActive[i]!;
      const def = getQuest(id);
      if (!def) continue;
      if (def.objectives.every((o) => this.flagTruthy(o.flag))) {
        this.questsActive.splice(i, 1);
        this.questsCompleted.push(id);
        this.onQuestComplete?.(def);
      }
    }
  }

  // ------------------------------------------------------------------ save

  serialize(): StorySave {
    return {
      reputation: { ...this.reputation },
      resolve: this.resolve,
      knowledge: this.knowledge,
      questsActive: [...this.questsActive],
      questsCompleted: [...this.questsCompleted],
    };
  }

  /** Restore from SaveData.flags + systems.story (load path; no callbacks). */
  restore(flags: Record<string, unknown> | undefined, saved: Partial<StorySave> | undefined): void {
    if (flags) {
      for (const [k, v] of Object.entries(flags)) {
        if (typeof v === "boolean" || typeof v === "number") this.flags[k] = v;
      }
    }
    if (!saved) return;
    if (saved.reputation) {
      for (const [k, v] of Object.entries(saved.reputation)) {
        if (typeof v === "number") this.reputation[k] = v;
      }
    }
    if (typeof saved.resolve === "number") this.resolve = saved.resolve;
    if (typeof saved.knowledge === "number") this.knowledge = saved.knowledge;
    if (Array.isArray(saved.questsActive)) {
      this.questsActive = saved.questsActive.filter((q): q is string => typeof q === "string");
    }
    if (Array.isArray(saved.questsCompleted)) {
      this.questsCompleted = saved.questsCompleted.filter(
        (q): q is string => typeof q === "string",
      );
    }
  }
}
