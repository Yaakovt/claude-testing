/**
 * AdvancementFlow — the game-side advancement controller. Owns:
 *  - progress counters (madra fills, the Unsouled's practice strikes)
 *  - shrine interaction (E): Copper meditation, the Iron elixir purchase,
 *    and the 10-second Iron refining channel (ticking damage; moving,
 *    acting, or dying fails it — scales are refunded only if you step away
 *    BEFORE drinking)
 *  - stage-up application (stats via systems/advancement.ts, technique slot
 *    unlocks via paths.ts, the player's Iron look) and ceremony cues
 *  - the Unsouled Empty Palm learn trigger (real code path: lands of basic
 *    strikes are reported by PlayerCombat.onBasicHit)
 *
 * Pure requirement math lives in src/systems/advancement.ts; this module is
 * the wiring + feel.
 */

import type { Input } from "../engine/input.js";
import { Stage, STAGE_NAMES } from "../systems/stats.js";
import type { CombatSystem } from "../systems/combat.js";
import type { FxManager } from "../systems/fx.js";
import type { Entity } from "../engine/entity.js";
import {
  applyStageUp,
  channelTickDamage,
  copperReady,
  emptyPalmReady,
  freshProgress,
  COPPER_MADRA_FILLS,
  EMPTY_PALM_PRACTICE_HITS,
  IRON_CHANNEL_SECONDS,
  IRON_CHANNEL_TICKS,
  IRON_SCALE_COST,
  type AdvancementProgress,
} from "../systems/advancement.js";
import { slotsFor, PATHS } from "./paths.js";
import type { Player } from "./player.js";
import type { Shrine } from "./shrine.js";
import { ExpandingRing } from "./techniqueEntities.js";

const INTERACT_RADIUS = 22;
const CHANNEL_TICK_EVERY = IRON_CHANNEL_SECONDS / IRON_CHANNEL_TICKS; // 0.5 s

export interface Ceremony {
  title: string;
  sub: string;
  t: number;
}

interface ShakeCamera {
  shake(intensity: number, duration: number): void;
}

export interface AdvancementFlowOpts {
  player: Player;
  input: Input;
  combat: CombatSystem;
  fx: FxManager;
  shrines: Shrine[];
  gameState: { scales: number };
  spawn: (e: Entity) => void;
  camera?: ShakeCamera | null;
  /** Fired after any stage-up (aura sight enable, autosave, …). */
  onStageUp?: (to: Stage) => void;
}

export class AdvancementFlow {
  progress: AdvancementProgress = freshProgress();
  state: "idle" | "offer" | "channel" = "idle";
  /** Seconds into the Iron refining channel. */
  channelT = 0;
  /** World-space interaction prompt near a shrine (world.ts draws it). */
  prompt: { x: number; y: number; lines: string[] } | null = null;
  /** Stage-up/learn banner (world.ts draws + ages it). */
  ceremony: Ceremony | null = null;

  private fillArmed = true;
  private tickAcc = 0;
  private offerShrine: Shrine | null = null;
  private channelStart = { x: 0, y: 0 };

  constructor(private o: AdvancementFlowOpts) {}

  // -------------------------------------------------------------- restore

  /** Re-apply a saved state without ceremonies (load path). */
  restore(saved: Partial<AdvancementProgress> & { stage?: number }): void {
    this.progress = {
      madraFills: typeof saved.madraFills === "number" ? saved.madraFills : 0,
      basicHits: typeof saved.basicHits === "number" ? saved.basicHits : 0,
      emptyPalmLearned: saved.emptyPalmLearned === true,
    };
    const target = Math.min(
      Math.max(typeof saved.stage === "number" ? saved.stage : Stage.Foundation, Stage.Foundation),
      Stage.Gold,
    );
    while (this.o.player.stats.stage < target) {
      applyStageUp(this.o.player.stats, this.o.player.stats.stage + 1);
    }
    if (this.o.player.stats.stage >= Stage.Iron) this.o.player.applyIronLook();
    this.assignSlots();
  }

  // --------------------------------------------------------------- update

  update(dt: number): void {
    if (this.ceremony) {
      this.ceremony.t += dt;
      if (this.ceremony.t > 4) this.ceremony = null;
    }
    this.trackMadraFills();

    const p = this.o.player;
    if (p.stats.health <= 0) {
      // Dying mid-flow: the M2 death sequence takes over; no refunds once
      // the elixir is drunk.
      if (this.state === "offer") this.cancelOffer(true);
      if (this.state === "channel") this.failChannel("The refining devours you.");
      this.prompt = null;
      return;
    }

    switch (this.state) {
      case "idle":
        this.updateIdle();
        break;
      case "offer":
        this.updateOffer();
        break;
      case "channel":
        this.updateChannel(dt);
        break;
    }
  }

  /** PlayerCombat.onBasicHit → Empty Palm practice (real learn path). */
  recordBasicHits(count: number): void {
    this.progress.basicHits += count;
    this.maybeLearnEmptyPalm();
  }

  // ------------------------------------------------------- copper tracking

  private trackMadraFills(): void {
    const s = this.o.player.stats;
    if (s.madra < s.maxMadra * 0.5) this.fillArmed = true;
    if (this.fillArmed && this.o.player.cyclingActive && s.madra >= s.maxMadra - 0.001) {
      this.fillArmed = false;
      this.progress.madraFills++;
      if (s.stage === Stage.Foundation) {
        const n = Math.min(this.progress.madraFills, COPPER_MADRA_FILLS);
        this.o.fx.spawnText(
          this.o.player.x,
          this.o.player.y - 28,
          `cycled to full (${n}/${COPPER_MADRA_FILLS})`,
          "#baa4e0",
          1,
        );
      }
    }
  }

  // ----------------------------------------------------------- idle + E

  private nearestShrine(): Shrine | null {
    let best: Shrine | null = null;
    let bestD = INTERACT_RADIUS;
    for (const s of this.o.shrines) {
      const d = Math.hypot(s.x - this.o.player.x, s.y - this.o.player.y);
      if (d <= bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  }

  private updateIdle(): void {
    const shrine = this.nearestShrine();
    if (!shrine) {
      this.prompt = null;
      return;
    }
    const p = this.o.player;
    const scales = this.o.gameState.scales;
    let lines: string[];
    switch (p.stats.stage) {
      case Stage.Foundation:
        lines = copperReady(this.progress)
          ? ["E — sit and open your senses", "(advance to Copper)"]
          : [
              `cycle to full: ${Math.min(this.progress.madraFills, COPPER_MADRA_FILLS)}/${COPPER_MADRA_FILLS}`,
              "(hold C to cycle; fill your madra)",
            ];
        break;
      case Stage.Copper:
        lines =
          scales >= IRON_SCALE_COST
            ? [`E — buy the body-refining elixir (${IRON_SCALE_COST} scales)`]
            : [`the body-refining elixir costs ${IRON_SCALE_COST} scales (${scales}/${IRON_SCALE_COST})`];
        break;
      default:
        lines = ["the incense curls; the seat is quiet"];
        break;
    }
    this.prompt = { x: shrine.x, y: shrine.y, lines };

    if (!this.o.input.pressed("interact")) return;
    if (p.stats.stage === Stage.Foundation && copperReady(this.progress)) {
      this.advanceTo(Stage.Copper);
    } else if (p.stats.stage === Stage.Copper && scales >= IRON_SCALE_COST) {
      this.o.gameState.scales -= IRON_SCALE_COST;
      this.offerShrine = shrine;
      this.state = "offer";
      this.o.fx.spawnText(p.x, p.y - 28, "the elixir is cold in your hands", "#e0c9a8", 1.2);
    }
  }

  // ---------------------------------------------------------------- offer

  private updateOffer(): void {
    const p = this.o.player;
    const shrine = this.offerShrine;
    if (!shrine) {
      this.state = "idle";
      return;
    }
    this.prompt = {
      x: shrine.x,
      y: shrine.y,
      lines: ["E — drink, and endure the refining", "(step away to cancel — refunded)"],
    };
    const moved =
      this.o.input.held("up") ||
      this.o.input.held("down") ||
      this.o.input.held("left") ||
      this.o.input.held("right");
    const tooFar = Math.hypot(shrine.x - p.x, shrine.y - p.y) > INTERACT_RADIUS + 6;
    if (moved || tooFar || this.o.input.pressed("dodge")) {
      this.cancelOffer(false);
      return;
    }
    if (this.o.input.pressed("interact")) {
      this.state = "channel";
      this.channelT = 0;
      this.tickAcc = 0;
      this.channelStart = { x: p.x, y: p.y };
      this.o.fx.spawnText(p.x, p.y - 28, "it sears going down", "#e86a5e", 1.2);
    }
  }

  private cancelOffer(died: boolean): void {
    // Refund applies only BEFORE the channel starts.
    this.o.gameState.scales += IRON_SCALE_COST;
    this.state = "idle";
    this.offerShrine = null;
    if (!died) {
      this.o.fx.spawnText(
        this.o.player.x,
        this.o.player.y - 28,
        "the elixir is set back (refunded)",
        "#8d97a8",
        1,
      );
    }
  }

  // -------------------------------------------------------------- channel

  private updateChannel(dt: number): void {
    const p = this.o.player;
    this.prompt = null;
    const acted =
      this.o.input.held("up") ||
      this.o.input.held("down") ||
      this.o.input.held("left") ||
      this.o.input.held("right") ||
      this.o.input.pressed("attack") ||
      this.o.input.pressed("dodge");
    const displaced = Math.hypot(p.x - this.channelStart.x, p.y - this.channelStart.y) > 3;
    if (acted || displaced) {
      this.failChannel("the fire scatters — the refining fails");
      return;
    }

    this.channelT += dt;
    this.tickAcc += dt;
    while (this.tickAcc >= CHANNEL_TICK_EVERY) {
      this.tickAcc -= CHANNEL_TICK_EVERY;
      const dmg = channelTickDamage(p.stats.maxHealth);
      p.flash = 0.08;
      this.o.camera?.shake(1.5, 0.1);
      this.o.combat.applyDamage(p, dmg, null);
      if (p.stats.health <= 0) return; // death path handled next update
    }
    if (this.channelT >= IRON_CHANNEL_SECONDS && p.stats.health > 0) {
      this.offerShrine = null;
      this.state = "idle";
      this.advanceTo(Stage.Iron);
    }
  }

  private failChannel(message: string): void {
    // NO refund once the elixir is drunk; the damage taken stays taken.
    this.state = "idle";
    this.offerShrine = null;
    this.channelT = 0;
    this.o.fx.spawnText(this.o.player.x, this.o.player.y - 28, message, "#e86a5e", 1.4);
  }

  // ------------------------------------------------------------- stage-ups

  private advanceTo(stage: Stage): void {
    const p = this.o.player;
    applyStageUp(p.stats, stage);
    this.assignSlots();
    if (stage === Stage.Iron) p.applyIronLook();
    this.o.camera?.shake(4, 0.5);
    this.o.spawn(new ExpandingRing(p.x, p.y, stage === Stage.Iron ? "#aaabb4" : "#dba35e", 6, 60, 0.9));
    this.ceremony =
      stage === Stage.Copper
        ? {
            title: "COPPER",
            sub: "Your senses open. The world was always this bright.",
            t: 0,
          }
        : {
            title: STAGE_NAMES[stage].toUpperCase(),
            sub:
              stage === Stage.Iron
                ? "The agony ebbs. Your body is remade — iron beneath the skin."
                : "You advance.",
            t: 0,
          };
    this.maybeLearnEmptyPalm(); // hits may already be banked at Copper
    this.o.onStageUp?.(stage);
  }

  private maybeLearnEmptyPalm(): void {
    if (this.o.player.origin !== "unsouled") return;
    if (!emptyPalmReady(this.o.player.stats.stage, this.progress)) return;
    this.progress.emptyPalmLearned = true;
    this.assignSlots();
    const p = this.o.player;
    this.o.spawn(new ExpandingRing(p.x, p.y, "#e8dcf6", 4, 40, 0.8));
    this.ceremony = {
      title: "EMPTY PALM",
      sub: "Pure madra, driven into the core. Your own technique — no one gave it to you.",
      t: 0,
    };
  }

  /** Point the K/L/U/I slots at the right techniques for origin + stage. */
  assignSlots(): void {
    const p = this.o.player;
    p.pc?.setSlots(slotsFor(p.origin, p.stats.stage, this.progress));
  }

  // ------------------------------------------------------------ panel data

  /** Spirit-panel lines describing progress toward the next stage. */
  progressLines(): string[] {
    const p = this.o.player;
    const scales = this.o.gameState.scales;
    const out: string[] = [];
    switch (p.stats.stage) {
      case Stage.Foundation:
        out.push("Next: Copper — open the spiritual senses");
        out.push(
          `  cycled to full: ${Math.min(this.progress.madraFills, COPPER_MADRA_FILLS)}/${COPPER_MADRA_FILLS}`,
        );
        out.push("  then meditate at a shrine (E)");
        break;
      case Stage.Copper:
        out.push("Next: Iron — forge the body");
        out.push(`  scales: ${Math.min(scales, IRON_SCALE_COST)}/${IRON_SCALE_COST}`);
        out.push("  buy the elixir at a shrine and endure");
        break;
      case Stage.Iron:
        out.push("Next: Jade — the elders speak of trials");
        out.push("  (the story continues — M4)");
        break;
      default:
        out.push("The valley believes nothing lies beyond.");
        break;
    }
    if (p.origin === "unsouled" && !this.progress.emptyPalmLearned) {
      out.push(
        p.stats.stage < Stage.Copper
          ? "Empty Palm: reach Copper, keep practicing"
          : `Empty Palm: ${Math.min(this.progress.basicHits, EMPTY_PALM_PRACTICE_HITS)}/${EMPTY_PALM_PRACTICE_HITS} strikes landed`,
      );
    }
    return out;
  }

  /** Save bucket for systems.advancement. */
  serialize(): { stage: number; madraFills: number; basicHits: number; emptyPalmLearned: boolean } {
    return {
      stage: this.o.player.stats.stage,
      madraFills: this.progress.madraFills,
      basicHits: this.progress.basicHits,
      emptyPalmLearned: this.progress.emptyPalmLearned,
    };
  }

  /** Path label for the spirit panel. */
  get pathLabel(): string {
    const def = PATHS[this.o.player.origin];
    return `${def.clanLabel} — ${def.pathName}`;
  }
}
