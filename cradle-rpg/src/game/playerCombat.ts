/**
 * Player combat controller: basic strike combo (J / left-click), dodge
 * burst (Space), CYCLING (hold C), and the K/L/U/I technique slots.
 * Owned by Player; split out so player.ts stays focused on movement and
 * rendering.
 *
 * Cycling (lore bible §2.1) is the signature trade-off: a rooted breathing
 * stance that visibly refills madra (~20%/s) while leaving the artist slow
 * (35% speed) and exposed (+50% incoming damage). Being hit-stunned breaks
 * the pattern.
 */

import type { Entity, EntityManager } from "../engine/entity.js";
import type { Input } from "../engine/input.js";
import type { Tilemap } from "../engine/tilemap.js";
import { facingVector, type CombatSystem } from "../systems/combat.js";
import type { FxManager } from "../systems/fx.js";
import {
  TechniqueCaster,
  TECHNIQUE_SLOT_ACTIONS,
  type TechniqueContext,
} from "../systems/techniques.js";
import type { Player } from "./player.js";

export const CYCLE_SPEED_FACTOR = 0.35;
export const CYCLE_VULNERABILITY = 1.5;
/** Madra regained per second while cycling, as a fraction of max. */
export const CYCLE_REGEN_PER_SEC = 0.2;
export const DODGE_MADRA_COST = 5;

const DODGE_TIME = 0.16;
const DODGE_SPEED = 280;
const DODGE_COOLDOWN = 0.6;
const SWING_TIME = 0.22;
const SWING_REACH = 14;
const SWING_WIDTH = 18;
/** A chain press only registers in the back portion of the first swing. */
const COMBO_BUFFER_FRACTION = 0.6;
const COMBO_RECOVERY = 0.18;

export type PlayerCombatState = "idle" | "swing" | "dodge";

export class PlayerCombat {
  state: PlayerCombatState = "idle";
  cycling = false;
  /** Seconds spent in the current cycling stance (drives the aura pulse). */
  cycleTime = 0;
  /** 0 = not swinging, 1 = first strike, 2 = combo finisher. */
  comboIndex = 0;
  dodgeCooldown = 0;
  readonly caster = new TechniqueCaster();
  /** M3 hook: called with the number of foes a basic strike connected with
   *  (the Unsouled's Empty Palm practice counter listens here). */
  onBasicHit: ((hits: number) => void) | null = null;

  private swingTimer = 0;
  private buffered = false;
  private recovery = 0;
  private dodgeTimer = 0;
  private dodgeDirX = 0;
  private dodgeDirY = 1;

  constructor(
    private player: Player,
    private input: Input,
    private combat: CombatSystem,
    private entities: EntityManager,
    private fx: FxManager | null,
    private map: Tilemap,
  ) {
    // Slot assignment is character knowledge: AdvancementFlow.assignSlots()
    // sets these from the chosen origin's Path (src/game/paths.ts).
  }

  /** K/L/U/I technique ids (null = empty slot). */
  setSlots(slots: (string | null)[]): void {
    this.caster.slots = [...slots];
  }

  /** Map transitions (M4a): casts must collide against the current map. */
  setMap(map: Tilemap): void {
    this.map = map;
  }

  /** Movement speed factor from combat state (cycling roots you; a parry
   *  stance — Still Surface — roots you completely). */
  get speedFactor(): number {
    if (this.player.parryTimer > 0) return 0;
    return this.cycling ? CYCLE_SPEED_FACTOR : 1;
  }

  /** 1→0 alpha of the slash visual right after a swing starts. */
  get slashAlpha(): number {
    if (this.state !== "swing") return 0;
    const elapsed = SWING_TIME - this.swingTimer;
    return elapsed < 0.1 ? 1 - elapsed / 0.1 : 0;
  }

  /** Velocity that overrides walking (dodge dash / small swing lunge). */
  velocityOverride(): { x: number; y: number } | null {
    if (this.state === "dodge") {
      return { x: this.dodgeDirX * DODGE_SPEED, y: this.dodgeDirY * DODGE_SPEED };
    }
    if (this.state === "swing") {
      const { dx, dy } = facingVector(this.player.facing);
      return { x: dx * 22, y: dy * 22 };
    }
    return null;
  }

  /**
   * @param canAct false while hit-stunned / dead / control-disabled —
   *               interrupts cycling and drops any swing in progress.
   * @param moveX/moveY raw input direction (for dodge direction).
   */
  update(dt: number, canAct: boolean, moveX: number, moveY: number): void {
    this.caster.update(dt);
    this.recovery = Math.max(0, this.recovery - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);

    if (!canAct) {
      this.setCycling(false, dt);
      this.state = "idle";
      this.buffered = false;
      this.comboIndex = 0;
      return;
    }

    const attackPressed = this.input.pressed("attack") || this.input.mouse.justClicked;

    switch (this.state) {
      case "idle": {
        if (this.input.pressed("dodge")) this.tryDodge(moveX, moveY);
        if (this.state === "idle" && attackPressed && this.recovery <= 0) {
          this.startSwing(1);
        }
        if (this.state === "idle") {
          for (let i = 0; i < TECHNIQUE_SLOT_ACTIONS.length; i++) {
            if (this.input.pressed(TECHNIQUE_SLOT_ACTIONS[i]!)) {
              this.caster.tryCast(i, this.castContext());
            }
          }
        }
        break;
      }
      case "swing": {
        this.swingTimer -= dt;
        if (
          attackPressed &&
          this.comboIndex === 1 &&
          this.swingTimer < SWING_TIME * COMBO_BUFFER_FRACTION
        ) {
          this.buffered = true; // rhythmic press → chain into the finisher
        }
        if (this.swingTimer <= 0) {
          if (this.buffered) {
            this.startSwing(2);
          } else {
            this.state = "idle";
            this.recovery = COMBO_RECOVERY;
            this.comboIndex = 0;
          }
        }
        break;
      }
      case "dodge": {
        this.dodgeTimer -= dt;
        if (this.dodgeTimer <= 0) this.state = "idle";
        break;
      }
    }

    // Cycling: hold C while otherwise idle. Any action interrupts it.
    this.setCycling(this.state === "idle" && this.input.held("cycle"), dt);
  }

  private setCycling(on: boolean, dt: number): void {
    this.cycling = on;
    const p = this.player;
    if (on) {
      this.cycleTime += dt;
      p.stats.madra = Math.min(
        p.stats.maxMadra,
        p.stats.madra + CYCLE_REGEN_PER_SEC * p.stats.maxMadra * dt,
      );
      p.vulnerability = CYCLE_VULNERABILITY;
    } else {
      this.cycleTime = 0;
      p.vulnerability = 1;
    }
  }

  private tryDodge(moveX: number, moveY: number): void {
    const p = this.player;
    if (this.dodgeCooldown > 0 || p.stats.madra < DODGE_MADRA_COST) return;
    let dx = moveX;
    let dy = moveY;
    if (dx === 0 && dy === 0) {
      const v = facingVector(p.facing);
      dx = v.dx;
      dy = v.dy;
    }
    const len = Math.hypot(dx, dy);
    this.dodgeDirX = dx / len;
    this.dodgeDirY = dy / len;
    p.stats.madra -= DODGE_MADRA_COST;
    p.iframes = Math.max(p.iframes, DODGE_TIME + 0.08);
    this.dodgeCooldown = DODGE_COOLDOWN;
    this.dodgeTimer = DODGE_TIME;
    this.state = "dodge";
  }

  /** Full world context handed to technique defs. */
  private castContext(): TechniqueContext {
    return {
      user: this.player,
      fx: this.fx,
      entities: this.entities,
      combat: this.combat,
      map: this.map,
      spawn: (e: Entity) => this.entities.add(e),
    };
  }

  private startSwing(index: number): void {
    this.state = "swing";
    this.comboIndex = index;
    this.swingTimer = SWING_TIME;
    this.buffered = false;
    const finisher = index === 2;
    const hits = this.combat.meleeAttack(
      this.player,
      this.entities.all,
      finisher ? SWING_REACH + 3 : SWING_REACH,
      SWING_WIDTH,
      {
        multiplier: finisher ? 1.35 : 1,
        knockback: finisher ? 190 : 140,
        hitstun: 0.2,
      },
    );
    if (hits.length > 0) this.onBasicHit?.(hits.length);
  }
}
