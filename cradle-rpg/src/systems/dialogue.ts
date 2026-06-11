/**
 * DIALOGUE ENGINE — data-driven dialogue trees (M4a).
 *
 * Trees are plain data registered by id (content agents author them, NPCs
 * reference them by dialogueId). A DialogueRunner walks one tree:
 *
 *  - nodes have a speaker, text ({playerName}/{clanName} substitution),
 *    optional choices (label + next + optional conditions/effects), optional
 *    node-level effects (run ONCE, on node entry) and conditional branches.
 *  - conditions/effects use the shared vocabulary in systems/story.ts; the
 *    runner never touches game state directly — it queries a StoryQuery and
 *    dispatches Effects through an injected handler, so the whole engine is
 *    unit-testable headless (tools/checkstory.mjs).
 *
 * Presentation (text box, letter reveal, W/S+E choice list) lives in
 * src/game/dialogueUi.ts; the runner is pure state.
 */

import {
  checkConditions,
  runEffects,
  type Condition,
  type Effect,
  type EffectHandler,
  type StoryQuery,
} from "./story.js";

// ------------------------------------------------------------------- data

export interface DialogueChoice {
  label: string;
  /** Node id to jump to (omit to end the dialogue after the effects). */
  next?: string;
  /** Hidden unless these pass. */
  conditions?: Condition[];
  /** Run when the choice is picked. */
  effects?: Effect[];
}

export interface DialogueNode {
  id: string;
  /** Speaker name plate ("" = unattributed narration). */
  speaker: string;
  /** Supports {playerName} and {clanName} (any key in the vars map). */
  text: string;
  /** Run once when the node is entered. */
  effects?: Effect[];
  /** Player choices; mutually exclusive with next/branches advancing. */
  choices?: DialogueChoice[];
  /** Conditional branching, checked in order before falling back to next. */
  branches?: { when: Condition[]; next: string }[];
  /** Node to advance to (omit, with no choices/branches, to end). */
  next?: string;
}

export interface DialogueTree {
  id: string;
  /** Entry node id. */
  start: string;
  nodes: DialogueNode[];
}

const treeRegistry = new Map<string, DialogueTree>();

export function registerDialogue(tree: DialogueTree): void {
  const ids = new Set<string>();
  for (const n of tree.nodes) {
    if (ids.has(n.id)) throw new Error(`dialogue ${tree.id}: duplicate node "${n.id}"`);
    ids.add(n.id);
  }
  treeRegistry.set(tree.id, tree);
}

export function getDialogue(id: string): DialogueTree | undefined {
  return treeRegistry.get(id);
}

export function allDialogues(): DialogueTree[] {
  return [...treeRegistry.values()];
}

/** Test/seed helper. */
export function clearDialogueRegistry(): void {
  treeRegistry.clear();
}

/** {key} substitution from a vars map; unknown keys are left intact. */
export function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, key: string) => vars[key] ?? m);
}

// ----------------------------------------------------------------- runner

export interface DialogueRunnerOpts {
  /** Substitution variables (playerName, clanName, …). */
  vars: Record<string, string>;
  query: StoryQuery;
  effects: EffectHandler;
}

export interface DialogueView {
  speaker: string;
  /** Substituted text. */
  text: string;
  /** Visible (condition-passing) choices, in authored order. */
  choices: { label: string }[];
}

export class DialogueRunner {
  /** False once the tree has ended. */
  active = true;

  private node: DialogueNode;
  private visibleChoices: DialogueChoice[] = [];

  constructor(
    private tree: DialogueTree,
    private o: DialogueRunnerOpts,
  ) {
    const start = this.find(tree.start);
    if (!start) throw new Error(`dialogue ${tree.id}: missing start node "${tree.start}"`);
    this.node = start;
    this.enter(start);
  }

  private find(id: string): DialogueNode | undefined {
    return this.tree.nodes.find((n) => n.id === id);
  }

  private enter(node: DialogueNode): void {
    this.node = node;
    runEffects(node.effects, this.o.effects);
    this.visibleChoices = (node.choices ?? []).filter((c) =>
      checkConditions(c.conditions, this.o.query),
    );
  }

  /** Current node, ready for presentation. */
  view(): DialogueView {
    return {
      speaker: this.node.speaker,
      text: substitute(this.node.text, this.o.vars),
      choices: this.visibleChoices.map((c) => ({ label: substitute(c.label, this.o.vars) })),
    };
  }

  get hasChoices(): boolean {
    return this.visibleChoices.length > 0;
  }

  /**
   * Advance past the current node. For choice nodes pass the index into
   * view().choices; for linear nodes pass nothing. Ends the dialogue when
   * there is nowhere to go.
   */
  advance(choiceIndex?: number): void {
    if (!this.active) return;

    let nextId: string | undefined;
    if (this.hasChoices) {
      const choice = this.visibleChoices[choiceIndex ?? 0];
      if (!choice) return; // invalid index: stay put
      runEffects(choice.effects, this.o.effects);
      nextId = choice.next;
    } else {
      const branch = (this.node.branches ?? []).find((b) =>
        checkConditions(b.when, this.o.query),
      );
      nextId = branch ? branch.next : this.node.next;
    }

    if (nextId === undefined) {
      this.active = false;
      return;
    }
    const next = this.find(nextId);
    if (!next) throw new Error(`dialogue ${this.tree.id}: missing node "${nextId}"`);
    this.enter(next);
  }
}
