/**
 * Melee combat resolution: directional attack arcs, hit detection against
 * entity hitboxes, damage application (via the pure stage-gap formula in
 * stats.ts), knockback, hit-stun, invulnerability frames, hit flash, hit
 * pause, and camera shake.
 *
 * Game-rule layering: this module knows nothing about the player's controls
 * or specific enemies — it operates on `Combatant`, a thin Entity subclass
 * carrying Stats + combat timers. Loot/Remnant decisions on death are made
 * by the game via the `onDeath` hook (dreadbeasts drop scales and leave NO
 * Remnant — lore bible §6.3; future humanoid foes spawn the Remnant stub).
 */

import { Entity, type Facing } from "../engine/entity.js";
import { aabbOverlap, moveAndCollide, type AABB } from "../engine/collision.js";
import type { Tilemap } from "../engine/tilemap.js";
import type { PixelSprite } from "../engine/sprites.js";
import { computeDamage, type Stats } from "./stats.js";
import type { FxManager } from "./fx.js";

/** Seconds an entity takes to dissolve after dying. */
export const DISSOLVE_TIME = 0.35;
/** Seconds of white-flash after taking a hit. */
export const FLASH_TIME = 0.12;

export function facingVector(f: Facing): { dx: number; dy: number } {
  switch (f) {
    case "up": return { dx: 0, dy: -1 };
    case "down": return { dx: 0, dy: 1 };
    case "left": return { dx: -1, dy: 0 };
    case "right": return { dx: 1, dy: 0 };
  }
}

/**
 * An entity that can deal and receive damage. Subclasses must call
 * tickCombat() at the top of update() and should draw through
 * drawWithEffects() to get hit-flash and the death dissolve for free.
 */
export abstract class Combatant extends Entity {
  abstract stats: Stats; // narrowed below — see constructor
  /** Shown in the HUD when the player notices this combatant. */
  displayName = "creature";
  /**
   * Sacred artists/beasts leave Remnants on death; dreadbeasts never do
   * (their spirits are fused into the flesh — lore bible §6.3).
   */
  leavesRemnant = false;
  /** False = death is handled externally (the player respawns instead). */
  despawnOnDeath = true;

  /** Seconds of hit-stun remaining (no acting while > 0). */
  hitstun = 0;
  /** Seconds of invulnerability remaining. */
  iframes = 0;
  /** Seconds of hit-flash remaining. */
  flash = 0;
  /** Incoming damage multiplier (cycling sets this to 1.5). */
  vulnerability = 1;
  /** Outgoing damage multiplier (Enforcer buffs). */
  damageMult = 1;
  /** Movement speed multiplier (Enforcer buffs). */
  speedMult = 1;
  /** Death dissolve countdown; < 0 means alive. */
  dissolve = -1;
  /** Knockback impulse velocity, px/s (decays exponentially). */
  kbVx = 0;
  kbVy = 0;
  /** Chance (0..1) incoming strikes whiff while evasionTimer > 0 (M3:
   *  White Fox Cloak). */
  evasion = 0;
  evasionTimer = 0;
  /** Flat incoming damage reduction while armorTimer > 0 (M3: Stone
   *  Mantle). Landed hits still chip at least 1. */
  armorFlat = 0;
  armorTimer = 0;
  /** Parry window seconds remaining (M3: Still Surface). While > 0, a
   *  strike against this combatant is negated, the attacker is staggered,
   *  and a riposte lands — resolved in CombatSystem.strike(). */
  parryTimer = 0;

  private buffTimer = 0;

  get alive(): boolean {
    return this.dissolve < 0 && this.stats.health > 0;
  }

  /** Timed Enforcer-style self buff (e.g. "Burst of Effort"). */
  applyBuff(speedMult: number, damageMult: number, seconds: number): void {
    this.speedMult = speedMult;
    this.damageMult = damageMult;
    this.buffTimer = seconds;
  }

  /** Timed evasion (incoming strikes whiff with `chance`). */
  applyEvasion(chance: number, seconds: number): void {
    this.evasion = chance;
    this.evasionTimer = seconds;
  }

  /** Timed flat damage reduction (Forged armor coat). */
  applyArmor(flat: number, seconds: number): void {
    this.armorFlat = flat;
    this.armorTimer = seconds;
  }

  /**
   * Tick shared combat state: i-frames, flash, buffs, dissolve, knockback
   * (resolved against the map so knockback respects collision), hit-stun.
   * Returns true if the subclass must skip acting this tick (dissolving or
   * stunned).
   */
  protected tickCombat(dt: number, map: Tilemap): boolean {
    this.iframes = Math.max(0, this.iframes - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.parryTimer = Math.max(0, this.parryTimer - dt);
    if (this.evasionTimer > 0) {
      this.evasionTimer -= dt;
      if (this.evasionTimer <= 0) this.evasion = 0;
    }
    if (this.armorTimer > 0) {
      this.armorTimer -= dt;
      if (this.armorTimer <= 0) this.armorFlat = 0;
    }
    if (this.buffTimer > 0) {
      this.buffTimer -= dt;
      if (this.buffTimer <= 0) {
        this.speedMult = 1;
        this.damageMult = 1;
      }
    }

    if (this.dissolve >= 0) {
      this.dissolve -= dt;
      if (this.dissolve <= 0) this.dead = true;
      return true;
    }

    if (this.kbVx !== 0 || this.kbVy !== 0) {
      const res = moveAndCollide(this.aabb, this.kbVx * dt, this.kbVy * dt, map);
      this.x = res.x - this.hitbox.offsetX;
      this.y = res.y - this.hitbox.offsetY;
      const decay = Math.exp(-12 * dt);
      this.kbVx *= decay;
      this.kbVy *= decay;
      if (Math.hypot(this.kbVx, this.kbVy) < 4) {
        this.kbVx = 0;
        this.kbVy = 0;
      }
    }

    if (this.hitstun > 0) {
      this.hitstun -= dt;
      return true;
    }
    return false;
  }

  /** Draw `sprite` with dissolve fade + white hit-flash applied. */
  protected drawWithEffects(
    ctx: CanvasRenderingContext2D,
    sprite: PixelSprite,
    x: number,
    y: number,
    flip = false,
  ): void {
    const dissolving = this.dissolve >= 0;
    const baseAlpha = dissolving ? Math.max(0, this.dissolve / DISSOLVE_TIME) : 1;
    ctx.globalAlpha = baseAlpha;
    sprite.draw(ctx, x, y, flip);
    const flashAlpha = dissolving
      ? 0.8 * baseAlpha
      : this.flash > 0
        ? Math.min(1, this.flash / FLASH_TIME) * 0.85
        : 0;
    if (flashAlpha > 0) {
      ctx.globalAlpha = flashAlpha;
      sprite.drawFlash(ctx, x, y, flip);
    }
    ctx.globalAlpha = 1;
  }
}

/** Rectangle hit area in front of an attacker, oriented by its facing. */
export function attackArc(attacker: Entity, reach: number, width: number): AABB {
  const cy = attacker.y - 4; // middle of a typical feet hitbox
  switch (attacker.facing) {
    case "right":
      return { x: attacker.x + 2, y: cy - width / 2, w: reach, h: width };
    case "left":
      return { x: attacker.x - 2 - reach, y: cy - width / 2, w: reach, h: width };
    case "down":
      return { x: attacker.x - width / 2, y: attacker.y - 2, w: width, h: reach };
    case "up":
      return { x: attacker.x - width / 2, y: attacker.y - 6 - reach, w: width, h: reach };
  }
}

export interface StrikeOptions {
  /** Damage multiplier on top of attackPower (combo finishers, charges). */
  multiplier?: number;
  /** Knockback impulse in px/s (0 disables). */
  knockback?: number;
  /** Hit-stun applied to the victim, seconds. */
  hitstun?: number;
  /** I-frames granted to the victim, seconds (defaults differ for player). */
  victimIframes?: number;
}

interface ShakeCamera {
  shake(intensity: number, duration: number): void;
}

/** Riposte damage multiplier on a successful parry (Still Surface). */
export const PARRY_RIPOSTE_MULT = 1.5;
/** Stagger applied to a parried attacker, seconds. */
export const PARRY_STAGGER = 1.0;

export class CombatSystem {
  /** Frames left of global hit-pause (main loop freezes entities while > 0). */
  hitPauseFrames = 0;
  /** "Copper dreadbeast" — set when the player trades blows with something. */
  noticedLabel: string | null = null;
  /** Random source for evasion rolls — injectable for headless tests. */
  rng: () => number = Math.random;

  /** Game hook: decide drops/Remnants when something dies. */
  onDeath: ((victim: Combatant, killer: Combatant | null) => void) | null = null;

  private noticedTimer = 0;
  private player: Combatant | null = null;
  private camera: ShakeCamera | null = null;
  private fx: FxManager | null = null;

  init(opts: { player: Combatant; camera?: ShakeCamera | null; fx?: FxManager | null }): void {
    this.player = opts.player;
    this.camera = opts.camera ?? null;
    this.fx = opts.fx ?? null;
  }

  update(dt: number): void {
    if (this.noticedTimer > 0) {
      this.noticedTimer -= dt;
      if (this.noticedTimer <= 0) this.noticedLabel = null;
    }
  }

  /**
   * Swing a melee arc in front of `attacker` against every Combatant in
   * `targets`. Returns the combatants actually hit.
   */
  meleeAttack(
    attacker: Combatant,
    targets: readonly Entity[],
    reach: number,
    width: number,
    opts: StrikeOptions = {},
  ): Combatant[] {
    const arc = attackArc(attacker, reach, width);
    const hits: Combatant[] = [];
    for (const t of targets) {
      if (t === attacker || !(t instanceof Combatant)) continue;
      if (!t.alive || t.iframes > 0) continue;
      if (aabbOverlap(arc, t.aabb)) {
        this.strike(attacker, t, opts);
        hits.push(t);
      }
    }
    return hits;
  }

  /** Body-contact attack (lunges/charges). True if it connected. */
  touchAttack(attacker: Combatant, target: Combatant, opts: StrikeOptions = {}): boolean {
    if (!attacker.alive || !target.alive || target.iframes > 0) return false;
    const a = attacker.aabb;
    const grown: AABB = { x: a.x - 2, y: a.y - 2, w: a.w + 4, h: a.h + 4 };
    if (!aabbOverlap(grown, target.aabb)) return false;
    this.strike(attacker, target, opts);
    return true;
  }

  /** Resolve one landed hit: damage, knockback, stun, flash, feel. */
  strike(attacker: Combatant, target: Combatant, opts: StrikeOptions = {}): number {
    // Parry (Still Surface): the strike is turned on the attacker.
    if (target.parryTimer > 0 && attacker.alive) {
      target.parryTimer = 0;
      const riposte = computeDamage(
        target.stats.attackPower * PARRY_RIPOSTE_MULT,
        target.stats.stage,
        attacker.stats.stage,
        attacker.stats.defense,
      );
      const dx = attacker.x - target.x;
      const dy = attacker.y - target.y;
      const len = Math.hypot(dx, dy) || 1;
      attacker.kbVx = (dx / len) * 200;
      attacker.kbVy = (dy / len) * 200;
      attacker.hitstun = Math.max(attacker.hitstun, PARRY_STAGGER);
      attacker.flash = FLASH_TIME;
      target.iframes = Math.max(target.iframes, 0.4);
      this.hitPauseFrames = Math.max(this.hitPauseFrames, 4);
      if (attacker === this.player || target === this.player) {
        this.camera?.shake(2, 0.12);
      }
      this.fx?.spawnText(target.x, target.y - 24, "parried!", "#bfe3f2", 0.7);
      this.fx?.spawnText(attacker.x, attacker.y - 18, String(riposte), "#f2ecd8");
      this.applyDamage(attacker, riposte, target);
      return 0;
    }

    // Evasion (White Fox Cloak): the image was never where it seemed.
    if (target.evasionTimer > 0 && target.evasion > 0 && this.rng() < target.evasion) {
      target.iframes = Math.max(target.iframes, 0.15);
      this.fx?.spawnText(target.x, target.y - 20, "miss", "#8d97a8", 0.5);
      return 0;
    }

    let dmg = computeDamage(
      attacker.stats.attackPower * attacker.damageMult,
      attacker.stats.stage,
      target.stats.stage,
      target.stats.defense,
      opts.multiplier ?? 1,
    );
    if (target.vulnerability !== 1) {
      dmg = Math.max(1, Math.round(dmg * target.vulnerability));
    }
    // Forged armor (Stone Mantle): flat reduction, but always chip 1.
    if (target.armorTimer > 0 && target.armorFlat > 0) {
      dmg = Math.max(1, dmg - target.armorFlat);
    }

    const kb = opts.knockback ?? 140;
    if (kb > 0) {
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const len = Math.hypot(dx, dy) || 1;
      target.kbVx = (dx / len) * kb;
      target.kbVy = (dy / len) * kb;
    }
    target.hitstun = Math.max(target.hitstun, opts.hitstun ?? 0.2);
    target.iframes = Math.max(
      target.iframes,
      opts.victimIframes ?? (target === this.player ? 0.5 : 0.15),
    );
    target.flash = FLASH_TIME;

    // Game feel + "noticing" — only when the player is involved.
    const playerInvolved = attacker === this.player || target === this.player;
    if (playerInvolved) {
      this.hitPauseFrames = Math.max(this.hitPauseFrames, 3);
      this.camera?.shake(target === this.player ? 3 : 2, 0.15);
      const other = attacker === this.player ? target : attacker;
      this.noticedLabel = other.displayName;
      this.noticedTimer = 4;
    }
    this.fx?.spawnText(
      target.x,
      target.y - 18,
      String(dmg),
      target === this.player ? "#e86a5e" : "#f2ecd8",
    );

    this.applyDamage(target, dmg, attacker);
    return dmg;
  }

  /** Post-formula damage application (also used directly by hazards/tests). */
  applyDamage(target: Combatant, amount: number, source: Combatant | null = null): void {
    if (target.dissolve >= 0 || target.stats.health <= 0) return;
    target.stats.health -= amount;
    if (target.stats.health <= 0) {
      target.stats.health = 0;
      target.hitstun = 0;
      if (target.despawnOnDeath) target.dissolve = DISSOLVE_TIME;
      this.onDeath?.(target, source);
    }
  }
}
