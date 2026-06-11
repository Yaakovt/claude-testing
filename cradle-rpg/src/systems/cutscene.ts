/**
 * CUTSCENE PRIMITIVES — a small step sequencer for scripted scenes (M4a).
 *
 * Content agents register step lists by id; the game plays one as a UI
 * state that owns the update loop (player control suspended, enemies
 * frozen — World handles that gating). The sequencer itself is pure: every
 * world interaction goes through the CutsceneHost interface, so the whole
 * thing runs headless (tools/checkstory.mjs drives it with a mock host).
 *
 * Steps (authoring vocabulary):
 *   { kind: "walk", entity, to: {x,y}, speed? }     walk an entity (collision-aware)
 *   { kind: "face", entity, facing }                turn an entity
 *   { kind: "say", speaker, text }                  text box; waits for confirm
 *   { kind: "wait", seconds }
 *   { kind: "fadeOut", seconds? } / { kind: "fadeIn", seconds? }   (default 0.3)
 *   { kind: "shake", intensity, seconds }
 *   { kind: "spawn", entity, def } / { kind: "despawn", entity }   (def is game data, e.g. an NpcDef)
 *   { kind: "panCamera", to: {x,y}, seconds }       glide the camera off the player
 *   { kind: "resetCamera", seconds? }               glide back + re-follow
 *   { kind: "effect", effect }                      any story Effect (setFlag, giveStage, moveMap, …)
 *
 * Sugar: setFlag/giveStage/moveMap exist as first-class kinds and are
 * routed through host.runEffect like "effect".
 */

import type { Effect, FlagValue } from "./story.js";

export type CutsceneFacing = "up" | "down" | "left" | "right";

export type CutsceneStep =
  | { kind: "walk"; entity: string; to: { x: number; y: number }; speed?: number }
  | { kind: "face"; entity: string; facing: CutsceneFacing }
  | { kind: "say"; speaker: string; text: string }
  | { kind: "wait"; seconds: number }
  | { kind: "fadeOut"; seconds?: number }
  | { kind: "fadeIn"; seconds?: number }
  | { kind: "shake"; intensity: number; seconds: number }
  | { kind: "spawn"; entity: string; def: unknown }
  | { kind: "despawn"; entity: string }
  | { kind: "panCamera"; to: { x: number; y: number }; seconds: number }
  | { kind: "resetCamera"; seconds?: number }
  | { kind: "effect"; effect: Effect }
  | { kind: "setFlag"; key: string; value?: FlagValue }
  | { kind: "giveStage"; stage: number; title?: string; sub?: string }
  | { kind: "moveMap"; map: string; entry?: string };

/**
 * Everything a cutscene may do to the world. World implements this; tests
 * mock it. Time-based steps poll per tick; the host does the actual motion.
 */
export interface CutsceneHost {
  /** Step `entity` toward `to`; return true when it has arrived. */
  walkEntity(id: string, to: { x: number; y: number }, speed: number, dt: number): boolean;
  faceEntity(id: string, facing: CutsceneFacing): void;
  /** Present a line; the host signals completion via sayDone(). */
  say(speaker: string, text: string): void;
  /** True once the presented line has been confirmed/dismissed. */
  sayDone(): boolean;
  /** Start a fade ("out" -> black, "in" -> clear) lasting `seconds`. */
  fade(dir: "out" | "in", seconds: number): void;
  shake(intensity: number, seconds: number): void;
  spawn(id: string, def: unknown): void;
  despawn(id: string): void;
  /** Glide the camera to a world point over `seconds`. */
  panCamera(to: { x: number; y: number }, seconds: number): void;
  /** Glide the camera back to its follow target over `seconds`. */
  resetCamera(seconds: number): void;
  /** Dispatch a story Effect (the game's shared effect executor). */
  runEffect(effect: Effect): void;
}

export const CUTSCENE_DEFAULT_FADE = 0.3;
export const CUTSCENE_WALK_SPEED = 60;

// --------------------------------------------------------------- registry

const cutsceneRegistry = new Map<string, CutsceneStep[]>();

export function registerCutscene(id: string, steps: CutsceneStep[]): void {
  cutsceneRegistry.set(id, steps);
}

export function getCutscene(id: string): CutsceneStep[] | undefined {
  return cutsceneRegistry.get(id);
}

export function allCutsceneIds(): string[] {
  return [...cutsceneRegistry.keys()];
}

/** Test/seed helper. */
export function clearCutsceneRegistry(): void {
  cutsceneRegistry.clear();
}

// ----------------------------------------------------------------- player

export class CutscenePlayer {
  /** False once every step has finished. */
  active = true;

  private index = -1;
  private timer = 0;
  /** True while the current step is still running. */
  private stepLive = false;

  constructor(
    private steps: CutsceneStep[],
    private host: CutsceneHost,
    /** Called once, after the final step completes. */
    private onDone?: () => void,
  ) {
    this.next();
  }

  private get step(): CutsceneStep | undefined {
    return this.steps[this.index];
  }

  /** Begin the following step; instant steps resolve immediately. */
  private next(): void {
    while (this.active) {
      this.index++;
      const s = this.step;
      if (!s) {
        this.active = false;
        this.onDone?.();
        return;
      }
      this.timer = 0;
      this.stepLive = true;
      switch (s.kind) {
        case "face":
          this.host.faceEntity(s.entity, s.facing);
          break; // instant
        case "say":
          this.host.say(s.speaker, s.text);
          return;
        case "wait":
          return;
        case "walk":
          return;
        case "fadeOut":
          this.host.fade("out", s.seconds ?? CUTSCENE_DEFAULT_FADE);
          return;
        case "fadeIn":
          this.host.fade("in", s.seconds ?? CUTSCENE_DEFAULT_FADE);
          return;
        case "shake":
          this.host.shake(s.intensity, s.seconds);
          break; // instant (the shake itself runs in the camera)
        case "spawn":
          this.host.spawn(s.entity, s.def);
          break;
        case "despawn":
          this.host.despawn(s.entity);
          break;
        case "panCamera":
          this.host.panCamera(s.to, s.seconds);
          return;
        case "resetCamera":
          this.host.resetCamera(s.seconds ?? 0.6);
          return;
        case "effect":
          this.host.runEffect(s.effect);
          break;
        case "setFlag":
          this.host.runEffect({ kind: "setFlag", key: s.key, value: s.value });
          break;
        case "giveStage":
          this.host.runEffect({ kind: "giveStage", stage: s.stage, title: s.title, sub: s.sub });
          break;
        case "moveMap":
          this.host.runEffect({ kind: "moveMap", map: s.map, entry: s.entry });
          break;
      }
      // Instant step handled — loop on to the next one.
      this.stepLive = false;
    }
  }

  update(dt: number): void {
    if (!this.active || !this.stepLive) return;
    const s = this.step!;
    this.timer += dt;
    switch (s.kind) {
      case "wait":
        if (this.timer >= s.seconds) this.finishStep();
        return;
      case "walk": {
        const speed = s.speed ?? CUTSCENE_WALK_SPEED;
        if (this.host.walkEntity(s.entity, s.to, speed, dt)) this.finishStep();
        return;
      }
      case "say":
        if (this.host.sayDone()) this.finishStep();
        return;
      case "fadeOut":
      case "fadeIn":
        if (this.timer >= (s.seconds ?? CUTSCENE_DEFAULT_FADE)) this.finishStep();
        return;
      case "panCamera":
        if (this.timer >= s.seconds) this.finishStep();
        return;
      case "resetCamera":
        if (this.timer >= (s.seconds ?? 0.6)) this.finishStep();
        return;
      default:
        // Instant kinds never linger here.
        this.finishStep();
        return;
    }
  }

  private finishStep(): void {
    this.stepLive = false;
    this.next();
  }
}
