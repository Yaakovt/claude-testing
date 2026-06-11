/**
 * The in-game world: map, player, enemies, combat wiring, HUD, death
 * sequence, advancement flow, aura sight, spirit panel, and save building.
 *
 * M4a: the World is built from a MapEntry (src/game/maps/registry.ts) and
 * owns the whole narrative runtime:
 *  - StoryState (flags/axes/quests) + the shared Effect executor
 *    (runEffect handles every Effect kind, including moveMap and the
 *    story-gated giveStage advancement)
 *  - DialogueUi (E to talk to NPCs; the sim freezes while it is open)
 *  - CutscenePlayer (World implements CutsceneHost; the sim freezes)
 *  - map transitions: trigger zones fade out (300ms), rebuild the
 *    destination map's per-map state (enemies/shrines/NPCs respawn — story
 *    flags never reset), place the player at the named entry, fade in
 *  - hostileFlag HUD line + Samara's Ring horizon glow (both cheap)
 */

import { Input } from "../engine/input.js";
import { Camera } from "../engine/camera.js";
import { EntityManager, type Entity, type Facing } from "../engine/entity.js";
import { DebugOverlay } from "../engine/debug.js";
import { moveAndCollide, overlapsSolid } from "../engine/collision.js";
import { defaultSave, type SaveData } from "../engine/save.js";
import { Tilemap, TILE_SIZE } from "../engine/tilemap.js";
import { CombatSystem } from "../systems/combat.js";
import { FxManager } from "../systems/fx.js";
import { Stage, STAGE_NAMES } from "../systems/stats.js";
import {
  StoryState,
  getQuest,
  runEffects,
  type Effect,
  type StoryQuery,
  type StorySave,
} from "../systems/story.js";
import {
  CutscenePlayer,
  getCutscene,
  type CutsceneFacing,
  type CutsceneHost,
} from "../systems/cutscene.js";
import { Player } from "./player.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";
import { spawnEnemies } from "./enemies/spawns.js";
import { ScalePickup } from "./pickups.js";
import { RemnantStub } from "./remnantStub.js";
import { getMap, START_MAP, type MapEntry } from "./maps/registry.js";
import { Shrine, spawnShrines } from "./shrine.js";
import { Npc, type NpcContext, type NpcDef } from "./npc.js";
import { AdvancementFlow } from "./advancementFlow.js";
import { AuraSight } from "./auraSight.js";
import { DialogueUi } from "./dialogueUi.js";
import { drawJournalPanel, drawSpiritPanel } from "./spiritPanel.js";
import { kitInfo, PATHS, type OriginId } from "./paths.js";
import { IRON_CHANNEL_SECONDS } from "../systems/advancement.js";
import { TILESET } from "./tiles.js";

const PIXEL_SCALE = 3;

export interface CharacterInfo {
  origin: OriginId;
  name: string;
}

interface CombatSave {
  health: number;
  madra: number;
  scales: number;
}

export interface WorldOpts {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  character: CharacterInfo;
  /** Save to restore from (Continue), or null for a fresh start. */
  saveData: SaveData | null;
}

const DEATH_FADE_IN = 1.1; // screen fades to black
const DEATH_RESPAWN_AT = 2.4; // teleport + refill
const DEATH_DONE = 3.2; // fade back in, control returns
const TRANSITION_FADE = 0.3; // each side of a map swap
const NPC_TALK_RADIUS = 24;
const NPC_LABEL_RADIUS = 48;

export class World {
  map: Tilemap;
  mapEntry: MapEntry;
  readonly camera = new Camera(PIXEL_SCALE);
  readonly entities = new EntityManager();
  readonly debug = new DebugOverlay();
  readonly fx = new FxManager();
  readonly combat = new CombatSystem();
  readonly gameState = { scales: 0 };
  readonly player: Player;
  /** Mutated in place on map swaps (AdvancementFlow holds the reference). */
  readonly shrines: Shrine[] = [];
  npcs: Npc[] = [];
  readonly advancement: AdvancementFlow;
  auraSight: AuraSight;
  readonly character: CharacterInfo;
  readonly story = new StoryState();
  readonly dialogueUi: DialogueUi;
  cutscene: CutscenePlayer | null = null;

  panelOpen = false;
  panelPage: "spirit" | "journal" = "spirit";

  /** Current map's spawn/respawn point. */
  get spawn(): { x: number; y: number } {
    return this.mapEntry.spawn;
  }

  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: Input;
  private readonly query: StoryQuery;
  private hudTime = 0;
  private deathSeq = { active: false, t: 0 };
  /** Map-swap fade state (null = no transition running). */
  private transition: {
    phase: "out" | "in";
    t: number;
    target: { map: string; entry?: string } | null;
  } | null = null;
  /** Cutscene fade overlay (host.fade drives the target). */
  private sceneFade = { alpha: 0, target: 0, speed: 0 };
  /** Entities spawned by cutscene "spawn" steps, by scene id. */
  private sceneEntities = new Map<string, Entity>();
  /** "— the Valley Wilds —" arrival caption. */
  private arrival = { name: "", t: 99 };

  constructor(opts: WorldOpts) {
    this.canvas = opts.canvas;
    this.ctx = opts.ctx;
    this.input = opts.input;
    this.character = opts.character;
    const { input } = this;
    const existing = opts.saveData;
    this.dialogueUi = new DialogueUi(input);

    // ---- story state (restore BEFORE anything reads flags) -----------------
    if (existing) {
      this.story.restore(existing.flags, existing.systems["story"] as Partial<StorySave>);
    }
    this.story.onQuestStart = (def) => {
      this.fx.spawnText(this.player.x, this.player.y - 32, `journal — ${def.title}`, "#e0c9a8", 1.6);
    };
    this.story.onQuestComplete = (def) => {
      this.fx.spawnText(this.player.x, this.player.y - 32, `${def.title} — complete`, "#e0c9a8", 1.8);
      runEffects(def.reward, this.runEffect);
    };

    // ---- map (the save's map id, or the start of the journey) --------------
    const savedMapId = existing?.player.map ?? "";
    this.mapEntry = getMap(savedMapId) ?? getMap(START_MAP)!;
    this.map = new Tilemap(this.mapEntry.build(), TILESET);
    this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);

    // Restore position from a previous session when it's still valid.
    let spawnAt = { ...this.mapEntry.spawn };
    if (existing && getMap(existing.player.map)?.id === this.mapEntry.id) {
      spawnAt = { x: existing.player.x, y: existing.player.y };
    }
    this.player = this.entities.add(
      new Player(input, this.map, spawnAt.x, spawnAt.y, opts.character.origin, opts.character.name),
    );
    if (overlapsSolid(this.player.aabb, this.map)) {
      // Stale/corrupt save put us inside a wall — fall back to the spawn.
      this.player.x = this.mapEntry.spawn.x;
      this.player.y = this.mapEntry.spawn.y;
      this.player.resetInterpolation();
    }

    this.combat.init({ player: this.player, camera: this.camera, fx: this.fx });
    this.player.wireCombat(this.combat, this.entities, this.fx);

    // Conditions are evaluated against live world state through this.
    const w = this;
    this.query = {
      getFlag: (key) => w.story.getFlag(key),
      get stage() {
        return w.player.stats.stage;
      },
      get origin() {
        return w.character.origin;
      },
      get scales() {
        return w.gameState.scales;
      },
    };

    // ---- per-map content (enemies + shrines + NPCs) -------------------------
    this.populateMap();

    // ---- advancement + aura sight ------------------------------------------
    this.auraSight = new AuraSight(this.map);
    this.advancement = new AdvancementFlow({
      player: this.player,
      input,
      combat: this.combat,
      fx: this.fx,
      shrines: this.shrines,
      gameState: this.gameState,
      spawn: (e) => this.entities.add(e),
      camera: this.camera,
      onStageUp: (to) => {
        if (to >= Stage.Copper) this.auraSight.enabled = true;
      },
    });
    this.player.pc!.onBasicHit = (n) => this.advancement.recordBasicHits(n);

    // Restore advancement FIRST (stage-ups rescale max stats), then clamp
    // health/madra/scales from the combat bucket.
    const adv = existing?.systems["advancement"] as
      | { stage?: number; madraFills?: number; basicHits?: number; emptyPalmLearned?: boolean }
      | undefined;
    this.advancement.restore(adv ?? {});
    this.auraSight.enabled = this.player.stats.stage >= Stage.Copper;

    const cs = existing?.systems["combat"] as Partial<CombatSave> | undefined;
    if (cs) {
      if (typeof cs.health === "number") {
        this.player.stats.health = Math.max(1, Math.min(this.player.stats.maxHealth, cs.health));
      }
      if (typeof cs.madra === "number") {
        this.player.stats.madra = Math.max(0, Math.min(this.player.stats.maxMadra, cs.madra));
      }
      if (typeof cs.scales === "number") this.gameState.scales = Math.max(0, cs.scales);
    }

    // Tutorial quests begin only with a fresh character.
    if (!existing) this.story.startAutoQuests();

    // ---- death drops --------------------------------------------------------
    this.combat.onDeath = (victim) => {
      if (victim === this.player) return; // respawn sequence handles the player
      if (victim instanceof Dreadbeast) {
        // Dreadbeasts leave no Remnant (lore §6.3) — render down to scales.
        this.dropScales(victim.x, victim.y, 1 + Math.floor(Math.random() * 3));
      } else if (victim.leavesRemnant) {
        // TODO(M5): real Remnant system — this is the stub hook.
        this.entities.add(new RemnantStub(victim.x, victim.y));
      }
    };

    this.camera.follow(this.player);
    this.camera.setScreenSize(this.canvas.width, this.canvas.height);
    this.camera.snapToTarget();

    // An on-enter cutscene may greet even a restored save (once, by flag).
    this.maybeFireOnEnter();
  }

  // ----------------------------------------------------------- map content

  /** Build the current MapEntry's per-map state (everything but the player). */
  private populateMap(): void {
    spawnEnemies(this.mapEntry.enemies, {
      map: this.map,
      combat: this.combat,
      player: this.player,
      entities: this.entities,
    });
    this.shrines.length = 0;
    this.shrines.push(...spawnShrines(this.mapEntry.shrines, (s) => this.entities.add(s)));
    const ctx = this.npcContext();
    this.npcs = this.mapEntry.npcs.map((def) => this.entities.add(new Npc(def, ctx)));
  }

  private npcContext(): NpcContext {
    return {
      map: this.map,
      player: this.player,
      entities: this.entities,
      flagTruthy: (key) => this.story.flagTruthy(key),
    };
  }

  /** Swap to another map and place the player at a named entry (or spawn). */
  private switchMap(mapId: string, entryName?: string): void {
    const entry = getMap(mapId) ?? getMap(START_MAP)!;
    this.mapEntry = entry;
    this.map = new Tilemap(entry.build(), TILESET);
    this.entities.purge((e) => e !== this.player);
    this.sceneEntities.clear();
    this.npcs = [];
    this.player.setMap(this.map);

    const dest = entryName ? entry.entries[entryName] : undefined;
    const at = dest ?? entry.spawn;
    this.player.x = at.x;
    this.player.y = at.y;
    if (dest?.facing) this.player.facing = dest.facing;
    this.player.kbVx = 0;
    this.player.kbVy = 0;
    this.player.resetInterpolation();

    this.populateMap();
    this.auraSight = new AuraSight(this.map);
    this.auraSight.enabled = this.player.stats.stage >= Stage.Copper;
    this.camera.setBounds(this.map.pixelWidth, this.map.pixelHeight);
    this.camera.follow(this.player);
    this.camera.snapToTarget();
    this.arrival = { name: entry.name, t: 0 };

    this.maybeFireOnEnter();
  }

  /** TEST HOOK (tools/smoke*.mjs): instant map swap, no fade. */
  debugWarp(mapId: string, entryName?: string): void {
    this.transition = null;
    this.switchMap(mapId, entryName);
  }

  private maybeFireOnEnter(): void {
    const oe = this.mapEntry.onEnter;
    if (!oe || this.story.flagTruthy(oe.onceFlag)) return;
    if (!getCutscene(oe.cutscene)) return;
    this.story.setFlag(oe.onceFlag); // fire once, ever
    this.startCutscene(oe.cutscene);
  }

  // ------------------------------------------------------------ transitions

  /** Begin a fade-out -> swap -> fade-in to another map. */
  requestMoveMap(mapId: string, entryName?: string): void {
    if (this.transition) return; // one swap at a time
    this.transition = { phase: "out", t: 0, target: { map: mapId, entry: entryName } };
  }

  /** Player center entering a transition zone fires the swap. */
  private checkTransitionZones(): void {
    if (this.transition || this.deathSeq.active || this.player.stats.health <= 0) return;
    const tx = Math.floor(this.player.x / TILE_SIZE);
    const ty = Math.floor(this.player.y / TILE_SIZE);
    for (const tr of this.mapEntry.transitions) {
      const z = tr.zone;
      if (tx >= z.tx && tx < z.tx + z.w && ty >= z.ty && ty < z.ty + z.h) {
        this.requestMoveMap(tr.to, tr.entry);
        return;
      }
    }
  }

  private updateTransition(dt: number): void {
    const tr = this.transition;
    if (!tr) return;
    tr.t += dt;
    if (tr.t < TRANSITION_FADE) return;
    if (tr.phase === "out") {
      if (tr.target) this.switchMap(tr.target.map, tr.target.entry);
      tr.target = null;
      tr.phase = "in";
      tr.t = 0;
    } else {
      this.transition = null;
    }
  }

  /** 0..1 darkness of the map-swap fade. */
  private transitionFadeAlpha(): number {
    const tr = this.transition;
    if (!tr) return 0;
    const f = Math.min(1, tr.t / TRANSITION_FADE);
    return tr.phase === "out" ? f : 1 - f;
  }

  // -------------------------------------------------------- effect executor

  /** The game's shared story Effect executor (dialogue/cutscenes/rewards). */
  readonly runEffect = (e: Effect): void => {
    const p = this.player;
    switch (e.kind) {
      case "setFlag":
        this.story.setFlag(e.key, e.value ?? true);
        break;
      case "reputation":
        this.story.addReputation(e.faction, e.amount);
        break;
      case "resolve":
        this.story.addResolve(e.amount);
        break;
      case "knowledge":
        this.story.addKnowledge(e.amount);
        break;
      case "giveScales":
        this.gameState.scales += e.amount;
        this.fx.spawnText(p.x, p.y - 26, `+${e.amount} scales`, "#bfe3f2", 1);
        break;
      case "takeScales":
        this.gameState.scales = Math.max(0, this.gameState.scales - e.amount);
        this.fx.spawnText(p.x, p.y - 26, `-${e.amount} scales`, "#bfe3f2", 1);
        break;
      case "startQuest":
        this.story.startQuest(e.quest);
        break;
      case "completeObjective": {
        const obj = getQuest(e.quest)?.objectives.find((o) => o.id === e.objective);
        if (obj) this.story.setFlag(obj.flag);
        break;
      }
      case "giveItem":
        this.story.setFlag(`item.${e.item}`);
        this.fx.spawnText(p.x, p.y - 26, `received: ${e.label ?? e.item}`, "#e0c9a8", 1.4);
        break;
      case "heal": {
        const f = e.fraction ?? 1;
        p.stats.health = Math.min(p.stats.maxHealth, p.stats.health + p.stats.maxHealth * f);
        break;
      }
      case "moveMap":
        this.requestMoveMap(e.map, e.entry === "" ? undefined : e.entry);
        break;
      case "cutscene":
        this.startCutscene(e.id);
        break;
      case "giveStage":
        this.advancement.giveStage(e.stage as Stage, e.title, e.sub);
        break;
    }
  };

  // -------------------------------------------------------------- cutscenes

  startCutscene(id: string): boolean {
    const steps = getCutscene(id);
    if (!steps || this.cutscene) return false;
    this.cutscene = new CutscenePlayer(steps, this.cutsceneHost(), () => {
      this.cutscene = null;
      this.camera.follow(this.player);
      this.sceneFade.target = 0; // never leave the screen black
    });
    return true;
  }

  /** World's CutsceneHost adapter (the sequencer never touches us directly). */
  private cutsceneHost(): CutsceneHost {
    return {
      walkEntity: (id, to, speed, dt) => this.walkEntity(id, to, speed, dt),
      faceEntity: (id, facing) => this.faceEntity(id, facing),
      say: (speaker, text) => this.dialogueUi.say(speaker, text),
      sayDone: () => this.dialogueUi.sayConfirmed(),
      fade: (dir, seconds) => {
        this.sceneFade.target = dir === "out" ? 1 : 0;
        this.sceneFade.speed = 1 / Math.max(seconds, 0.01);
      },
      shake: (intensity, seconds) => this.camera.shake(intensity, seconds),
      spawn: (id, def) => this.spawnSceneNpc(id, def),
      despawn: (id) => this.despawnSceneNpc(id),
      // The camera's exponential follow does the glide; steps just time it.
      panCamera: (to) => this.camera.follow({ x: to.x, y: to.y }),
      resetCamera: () => this.camera.follow(this.player),
      runEffect: this.runEffect,
    };
  }

  private sceneEntity(id: string): Entity | null {
    if (id === "player") return this.player;
    return this.npcs.find((n) => n.def.id === id) ?? this.sceneEntities.get(id) ?? null;
  }

  private walkEntity(id: string, to: { x: number; y: number }, speed: number, dt: number): boolean {
    const e = this.sceneEntity(id);
    if (!e) return true;
    const dx = to.x - e.x;
    const dy = to.y - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return true;
    e.prevX = e.x; // entities are frozen during cutscenes — interpolate here
    e.prevY = e.y;
    const step = Math.min(speed * dt, d);
    const res = moveAndCollide(e.aabb, (dx / d) * step, (dy / d) * step, this.map);
    const nx = res.x - e.hitbox.offsetX;
    const ny = res.y - e.hitbox.offsetY;
    const moved = Math.hypot(nx - e.x, ny - e.y) > 0.01;
    e.x = nx;
    e.y = ny;
    if (Math.abs(dx) >= Math.abs(dy)) e.facing = dx > 0 ? "right" : "left";
    else e.facing = dy > 0 ? "down" : "up";
    return d - step < 1 || !moved; // arrived, or wedged against a wall
  }

  private faceEntity(id: string, facing: CutsceneFacing): void {
    const e = this.sceneEntity(id);
    if (e) e.facing = facing as Facing;
  }

  private spawnSceneNpc(id: string, def: unknown): void {
    const npc = new Npc(def as NpcDef, this.npcContext());
    this.sceneEntities.set(id, this.entities.add(npc));
  }

  private despawnSceneNpc(id: string): void {
    const e = this.sceneEntities.get(id) ?? this.sceneEntity(id);
    if (!e || e === this.player) return;
    this.entities.purge((x) => x === e);
    this.sceneEntities.delete(id);
    this.npcs = this.npcs.filter((n) => n !== e);
  }

  // ---------------------------------------------------------- npc dialogue

  private nearestNpc(maxDist: number): Npc | null {
    let best: Npc | null = null;
    let bestD = maxDist;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - this.player.x, n.y - this.player.y);
      if (d <= bestD) {
        best = n;
        bestD = d;
      }
    }
    return best;
  }

  /** E near an NPC starts its dialogue. True if a dialogue was opened. */
  private tryNpcInteract(): boolean {
    if (!this.input.pressed("interact")) return false;
    const npc = this.nearestNpc(NPC_TALK_RADIUS);
    if (!npc?.def.dialogueId) return false;
    return this.dialogueUi.start(npc.def.dialogueId, {
      vars: {
        playerName: this.character.name,
        clanName: PATHS[this.character.origin].clanLabel,
      },
      query: this.query,
      effects: this.runEffect,
    });
  }

  /** Scatter `count` scales near a death spot (never inside solid tiles). */
  private dropScales(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      let px = x + (Math.random() * 2 - 1) * 10;
      let py = y + (Math.random() * 2 - 1) * 8;
      if (overlapsSolid({ x: px - 4, y: py - 5, w: 8, h: 6 }, this.map)) {
        px = x;
        py = y;
      }
      this.entities.add(
        new ScalePickup(px, py, this.player, (value) => {
          this.gameState.scales += value;
          this.fx.spawnText(this.player.x, this.player.y - 26, `+${value} scale`, "#bfe3f2", 0.7);
        }),
      );
    }
  }

  // ----------------------------------------------------- death & respawn

  private updateDeathSequence(dt: number): void {
    const player = this.player;
    if (!this.deathSeq.active) {
      if (player.stats.health <= 0) {
        this.deathSeq.active = true;
        this.deathSeq.t = 0;
        player.controlEnabled = false;
      }
      return;
    }
    this.deathSeq.t += dt;
    if (this.deathSeq.t >= DEATH_RESPAWN_AT && player.stats.health <= 0) {
      // Forgiving respawn: full health, half madra, nothing lost.
      // Respawn point = the CURRENT map's spawn.
      player.x = this.mapEntry.spawn.x;
      player.y = this.mapEntry.spawn.y;
      player.resetInterpolation();
      player.stats.health = player.stats.maxHealth;
      player.stats.madra = player.stats.maxMadra / 2;
      player.kbVx = 0;
      player.kbVy = 0;
      player.hitstun = 0;
      player.iframes = 1.5;
      this.camera.snapToTarget();
    }
    if (this.deathSeq.t >= DEATH_DONE) {
      this.deathSeq.active = false;
      player.controlEnabled = true;
    }
  }

  /** 0..1 darkness of the death overlay. */
  private deathFadeAlpha(): number {
    if (!this.deathSeq.active) return 0;
    if (this.deathSeq.t < DEATH_RESPAWN_AT) return Math.min(1, this.deathSeq.t / DEATH_FADE_IN);
    return Math.max(0, (DEATH_DONE - this.deathSeq.t) / (DEATH_DONE - DEATH_RESPAWN_AT));
  }

  // ------------------------------------------------------------------- save

  buildSave(base: SaveData | null): SaveData {
    const data = base ?? defaultSave();
    data.player.x = Math.round(this.player.x);
    data.player.y = Math.round(this.player.y);
    data.player.map = this.mapEntry.id;
    data.player.facing = this.player.facing;
    data.player.stage = STAGE_NAMES[this.player.stats.stage];
    data.flags = { ...this.story.flags };
    data.systems["combat"] = {
      health: Math.round(this.player.stats.health),
      madra: Math.round(this.player.stats.madra),
      scales: this.gameState.scales,
    } satisfies CombatSave;
    data.systems["character"] = { ...this.character };
    data.systems["advancement"] = this.advancement.serialize();
    data.systems["story"] = this.story.serialize();
    return data;
  }

  // ------------------------------------------------------------------ update

  update(dt: number): void {
    if (this.input.pressed("debug")) this.debug.toggle();
    this.hudTime += dt;
    this.arrival.t += dt;

    // Fades + transitions always advance, even while the sim is frozen.
    const sf = this.sceneFade;
    if (sf.alpha !== sf.target) {
      const d = Math.sign(sf.target - sf.alpha) * sf.speed * dt;
      sf.alpha = sf.target > sf.alpha ? Math.min(sf.target, sf.alpha + d) : Math.max(sf.target, sf.alpha + d);
    }
    this.updateTransition(dt);

    // UI states own the loop: the world (entities, combat) freezes under
    // a cutscene or an open dialogue, like the M3 screens.
    if (this.cutscene) {
      this.dialogueUi.update(dt); // services the cutscene "say" box
      this.cutscene.update(dt);
      this.map.update(dt);
      this.camera.update(dt);
      return;
    }
    if (this.dialogueUi.active) {
      this.dialogueUi.update(dt);
      this.camera.update(dt);
      return;
    }
    if (this.transition) {
      // Frozen during the swap fade.
      this.camera.update(dt);
      return;
    }

    if (this.input.pressed("sheet")) {
      this.panelOpen = !this.panelOpen;
      if (this.panelOpen) this.panelPage = "spirit";
    }
    if (this.panelOpen && this.input.keyPressed("KeyQ")) {
      this.panelPage = this.panelPage === "spirit" ? "journal" : "spirit";
    }

    // Hit pause: freeze the world for a few frames on player hits.
    if (this.combat.hitPauseFrames > 0) {
      this.combat.hitPauseFrames--;
      this.camera.update(dt);
      return;
    }

    // E near an NPC opens its dialogue (and consumes the press before the
    // shrine flow can see it).
    if (this.tryNpcInteract()) return;

    this.combat.update(dt);
    this.entities.update(dt);
    this.fx.update(dt);
    this.advancement.update(dt);
    this.updateDeathSequence(dt);
    this.auraSight.update(dt);
    this.map.update(dt);
    this.camera.update(dt);
    this.checkTransitionZones();
  }

  // -------------------------------------------------------------------- HUD

  private drawBar(
    x: number,
    y: number,
    w: number,
    h: number,
    frac: number,
    fill: string,
    frame: string,
  ): void {
    const ctx = this.ctx;
    ctx.strokeStyle = frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.fillStyle = "rgba(10, 8, 18, 0.5)";
    ctx.fillRect(x + 1.5, y + 1.5, w - 2, h - 2);
    if (frac > 0) {
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1.5, y + 1.5, Math.max(1, (w - 2) * Math.min(1, frac)), h - 2);
    }
  }

  private drawHud(): void {
    const ctx = this.ctx;
    const player = this.player;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Samara's Ring on the horizon (the peak): a cheap white glow band.
    if (this.mapEntry.ringGlow) {
      const pulse = 0.02 * Math.sin(this.hudTime * 0.8);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = `rgba(240, 244, 255, ${Math.max(0, 0.1 - i * 0.025 + pulse)})`;
        ctx.fillRect(0, i * 12, this.canvas.width, 12);
      }
    }

    // Copper bloom under the HUD, over the world.
    this.auraSight.drawScreenTint(ctx, this.canvas.width, this.canvas.height);

    // Panel: stage label, health bar, madra bar, scales counter.
    ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
    ctx.fillRect(10, 10, 170, 84);
    ctx.font = "bold 14px Georgia, serif";
    ctx.fillStyle = "#cfc8e8";
    ctx.fillText(STAGE_NAMES[player.stats.stage], 20, 28);
    ctx.font = "10px Georgia, serif";
    ctx.fillStyle = "#5c5478";
    ctx.fillText("Tab — spirit", 118, 28);

    // Health.
    this.drawBar(20, 36, 130, 10, player.stats.health / player.stats.maxHealth, "#b8434e", "#8a4a52");

    // Madra — pulses while cycling.
    const cycling = player.cyclingActive;
    const pulse = cycling ? 0.65 + 0.35 * Math.sin(this.hudTime * 8) : 1;
    const madraFill = cycling
      ? `rgba(138, 108, 192, ${pulse})`
      : "rgba(138, 108, 192, 0.9)";
    this.drawBar(20, 50, 130, 10, player.stats.madra / player.stats.maxMadra, madraFill, "#6d4f94");

    // Scales: a small diamond glyph + count.
    ctx.save();
    ctx.translate(26, 74);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#bfe3f2";
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillStyle = "#bfe3f2";
    ctx.fillText(`${this.gameState.scales}`, 38, 79);
    ctx.fillStyle = "#8d97a8";
    ctx.font = "11px Georgia, serif";
    ctx.fillText("scales", 60, 79);

    // Hostile ground: the story has turned this place against you.
    let infoY = 100;
    if (this.mapEntry.hostileFlag && this.story.flagTruthy(this.mapEntry.hostileFlag)) {
      ctx.fillStyle = "rgba(40, 8, 12, 0.7)";
      ctx.fillRect(10, infoY, 170, 22);
      ctx.font = "italic 12px Georgia, serif";
      ctx.fillStyle = "#e86a5e";
      ctx.fillText("this ground is hostile", 20, infoY + 15);
      infoY += 26;
    }

    // Noticed enemy: stage label of whatever the player last traded blows with.
    if (this.combat.noticedLabel) {
      ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
      ctx.fillRect(10, infoY, 170, 22);
      ctx.font = "italic 12px Georgia, serif";
      ctx.fillStyle = "#e0c9a8";
      ctx.fillText(this.combat.noticedLabel, 20, infoY + 15);
    }

    // Arrival caption ("— the Valley Wilds —").
    if (this.arrival.t < 2.6 && this.arrival.name.length > 0) {
      const a = Math.min(1, this.arrival.t / 0.4) * Math.min(1, (2.6 - this.arrival.t) / 0.8);
      ctx.textAlign = "center";
      ctx.font = "italic 20px Georgia, serif";
      ctx.fillStyle = `rgba(224, 201, 168, ${a})`;
      ctx.fillText(`—  ${this.arrival.name}  —`, this.canvas.width / 2, 64);
      ctx.textAlign = "left";
    }

    this.drawChannelOverlay();
    this.drawCeremony();

    if (this.panelOpen) {
      if (this.panelPage === "spirit") {
        drawSpiritPanel(ctx, this.canvas.width, this.canvas.height, {
          name: this.character.name,
          pathLabel: this.advancement.pathLabel,
          stage: player.stats.stage,
          slots: kitInfo(this.character.origin, player.stats.stage, this.advancement.progress),
          progressLines: this.advancement.progressLines(),
        });
      } else {
        drawJournalPanel(ctx, this.canvas.width, this.canvas.height, {
          active: this.story.activeStatuses().map((s) => ({
            title: s.def.title,
            objectives: s.objectives,
            current: s.current,
          })),
          completed: this.story.completedDefs().map((d) => d.title),
        });
      }
    }

    // Fades: map transition + cutscene fade share one overlay; death below.
    const swapFade = Math.max(this.transitionFadeAlpha(), this.sceneFade.alpha);
    if (swapFade > 0) {
      ctx.fillStyle = `rgba(5, 4, 10, ${swapFade})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Dialogue/cutscene text box sits above the fades.
    this.dialogueUi.draw(ctx, this.canvas.width, this.canvas.height);

    // Death overlay: fade + message.
    const fade = this.deathFadeAlpha();
    if (fade > 0) {
      ctx.fillStyle = `rgba(5, 4, 10, ${fade * 0.92})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.deathSeq.t > 0.7 && this.deathSeq.t < DEATH_RESPAWN_AT + 0.4) {
        ctx.font = "italic 22px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(207, 200, 232, ${Math.min(1, fade * 1.2)})`;
        ctx.fillText("Your spirit fades...", this.canvas.width / 2, this.canvas.height / 2);
        ctx.textAlign = "left";
      }
    }
  }

  /** Iron refining: red vignette + endure bar while channeling. */
  private drawChannelOverlay(): void {
    if (this.advancement.state !== "channel") return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.advancement.channelT;
    const a = 0.07 + 0.05 * Math.sin(t * 6);
    ctx.fillStyle = `rgba(180, 40, 30, ${a})`;
    ctx.fillRect(0, 0, w, h);

    const bw = 260;
    const bx = w / 2 - bw / 2;
    const by = h - 70;
    ctx.fillStyle = "rgba(10, 8, 18, 0.75)";
    ctx.fillRect(bx - 10, by - 26, bw + 20, 52);
    ctx.font = "italic 14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e0c9a8";
    ctx.fillText("the refining — hold still and endure", w / 2, by - 8);
    ctx.textAlign = "left";
    this.drawBar(bx, by, bw, 10, t / IRON_CHANNEL_SECONDS, "#b8434e", "#8a4a52");
  }

  /** Stage-up / Empty Palm banner. */
  private drawCeremony(): void {
    const c = this.advancement.ceremony;
    if (!c) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const fadeIn = Math.min(1, c.t / 0.4);
    const fadeOut = Math.min(1, Math.max(0, (4 - c.t) / 0.8));
    const a = Math.min(fadeIn, fadeOut);
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillStyle = `rgba(224, 201, 168, ${a})`;
    ctx.fillText(c.title, w / 2, h * 0.3);
    ctx.font = "italic 15px Georgia, serif";
    ctx.fillStyle = `rgba(207, 200, 232, ${a * 0.9})`;
    ctx.fillText(c.sub, w / 2, h * 0.3 + 28);
    ctx.restore();
  }

  /** World-space shrine prompt (drawn with the camera transform active). */
  private drawPrompt(): void {
    const p = this.advancement.prompt;
    if (!p) return;
    this.drawWorldLines(p.x, p.y - 24, p.lines);
  }

  /** NPC name labels + "E — Talk" prompts (world space). */
  private drawNpcPrompts(): void {
    if (this.dialogueUi.active || this.cutscene) return;
    for (const npc of this.npcs) {
      const d = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (d > NPC_LABEL_RADIUS) continue;
      const lines = [npc.displayName];
      if (npc.def.dialogueId && d <= NPC_TALK_RADIUS) lines.push("E — Talk");
      this.drawWorldLines(npc.x, npc.y - 26, lines);
    }
  }

  private drawWorldLines(x: number, y: number, lines: string[]): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "6px Georgia, serif";
    ctx.textAlign = "center";
    for (let i = 0; i < lines.length; i++) {
      const ly = y + i * 8;
      ctx.fillStyle = "rgba(11, 10, 16, 0.8)";
      ctx.fillText(lines[i]!, Math.round(x) + 1, Math.round(ly) + 1);
      ctx.fillStyle = i === 0 ? "#e8e0c8" : "#9a93b4";
      ctx.fillText(lines[i]!, Math.round(x), Math.round(ly));
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ render

  render(alpha: number): void {
    const ctx = this.ctx;
    this.debug.tickFrame();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.camera.applyTransform(ctx);
    // Pad the view rect by a tile so edge tiles/sprites never pop.
    const ts = this.map.tileSize;
    const vx = this.camera.left - ts;
    const vy = this.camera.top - ts;
    const vw = this.camera.viewW + ts * 2;
    const vh = this.camera.viewH + ts * 2;

    this.map.drawGround(ctx, vx, vy, vw, vh);
    this.entities.drawSorted(ctx, alpha, this.map.getSortedDecor(vx, vy, vw, vh));
    this.fx.drawWorld(ctx);
    this.auraSight.drawWorld(ctx, vx, vy, vw, vh);
    this.drawPrompt();
    this.drawNpcPrompts();
    this.debug.drawWorld(ctx, this.entities.all, this.map, this.camera);

    this.drawHud();
    this.debug.drawScreen(ctx, [
      `map ${this.mapEntry.id}`,
      `pos ${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}`,
      `tile ${Math.floor(this.player.x / ts)}, ${Math.floor(this.player.y / ts)}`,
      `cam ${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)}`,
      `entities ${this.entities.all.length}`,
      `facing ${this.player.facing}`,
      `hp ${this.player.stats.health.toFixed(0)}/${this.player.stats.maxHealth} madra ${this.player.stats.madra.toFixed(1)}/${this.player.stats.maxMadra}`,
      `scales ${this.gameState.scales}  cycling ${this.player.cyclingActive}`,
      `stage ${STAGE_NAMES[this.player.stats.stage]}  adv ${this.advancement.state}`,
      `dialogue ${this.dialogueUi.active}  cutscene ${this.cutscene !== null}`,
    ]);
  }
}
