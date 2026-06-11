/**
 * REMNANTS (M5) — the real system replacing remnantStub.ts.
 *
 * Canon (lore bible §6.1): when a sacred artist dies, their spirit tears
 * free as a Remnant — a living madra-creature keeping instincts and
 * fragments of skill. Dreadbeasts never leave one (§6.3) — World.combat
 * .onDeath only spawns these for humanoid foes (`leavesRemnant`, i.e. the
 * Heaven's Glory enforcers and any future sacred artists).
 *
 * The Remnant is a hostile Combatant with DEGRADED stats (same stage, ~60%
 * of the dead artist's HP/attack/defense), erratic drifting movement, and a
 * simple madra-bolt ranged attack. Two ways to deal with one:
 *  - FIGHT it: defeating it drops 2-4 scales AND a Remnant core pickup
 *    (a counted item flag, "item.remnantCore" — Soulsmithing stock, §6.2).
 *  - HARVEST it: while freshly risen (HARVEST_WINDOW) stand close and
 *    channel E for HARVEST_SECONDS to subdue it intact — +1 core + bonus
 *    scales, no fight. Its bolts interrupt the channel: the first bolt
 *    comes ATTACK_COOLDOWN seconds after rising, so an immediate harvest
 *    JUST fits — hesitate and you're timing channels between bolts.
 *    (A drudge would make this easier. You don't have a drudge.)
 *  World owns the channel state; see World.updateRemnantHarvest().
 */

import { Entity } from "../engine/entity.js";
import { aabbOverlap } from "../engine/collision.js";
import { Animation, definePixelFrames } from "../engine/sprites.js";
import { Combatant } from "../systems/combat.js";
import { makeStats, STAGE_NAMES, type Stats } from "../systems/stats.js";
import { hasLineOfSight, type EnemyContext } from "./enemies/dreadbeast.js";
import { MadraBolt } from "./techniqueEntities.js";

// --------------------------------------------------------------- balance

/** Fraction of the dead artist's stats the spirit keeps. */
export const REMNANT_STAT_FRACTION = 0.6;
/** Seconds after rising during which the Remnant can be harvested intact. */
export const HARVEST_WINDOW = 12;
/** Seconds of held-E channel to subdue a fresh Remnant. */
export const HARVEST_SECONDS = 2;
/** World px: how close the channel must be held. */
export const HARVEST_RADIUS = 30;
/** Seconds between madra bolts (also the grace before the FIRST bolt). */
export const ATTACK_COOLDOWN = 2.6;
/** Scales dropped when a Remnant is destroyed in combat: 2-4. */
export const REMNANT_SCALES_MIN = 2;
export const REMNANT_SCALES_MAX = 4;
/** Bonus scales granted by a clean harvest. */
export const HARVEST_BONUS_SCALES = 4;

/** PURE stat derivation (unit-tested): same stage, degraded everything. */
export function remnantStatsFor(source: Stats): Stats {
  return makeStats({
    maxHealth: Math.max(1, Math.round(source.maxHealth * REMNANT_STAT_FRACTION)),
    maxMadra: 0,
    attackPower: Math.max(1, Math.round(source.attackPower * REMNANT_STAT_FRACTION)),
    defense: Math.max(0, Math.round(source.defense * REMNANT_STAT_FRACTION)),
    moveSpeed: 55,
    stage: source.stage,
  });
}

// ----------------------------------------------------------------- sprite

const PAL = {
  w: "#9db8e8", // spirit blue
  W: "#cfdfef", // bright wisp
  v: "#b88fd4", // madra violet
};

// 12x16 abstract spirit wisp, two drift frames (kept from the M2 stub).
const FRAME_A = [
  "............",
  "....WW......",
  "...wWWw.....",
  "...wWWWw....",
  "..wWWvWWw...",
  "..wWvWWWw...",
  "..wWWWvWw...",
  "...wWWWw....",
  "...wvWw.....",
  "....wWw.....",
  "....wWw.....",
  "...wWw......",
  "....ww......",
  "...ww.......",
  "....w.......",
  "............",
];

const FRAME_B = [
  "............",
  ".....WW.....",
  "....wWWw....",
  "...wWWWw....",
  "...wWvWWw...",
  "..wWWWvWw...",
  "..wWvWWWw...",
  "...wWWWw....",
  "....wWvw....",
  "....wWw.....",
  "...wWw......",
  "....wWw.....",
  "....ww......",
  ".....ww.....",
  ".....w......",
  "............",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

// ----------------------------------------------------------------- entity

const AGGRO_RANGE = 120; // it notices spirits-distance away
const BOLT_RANGE = 110;
const BOLT_SPEED = 130;
/** While harvestable it writhes near its rise point instead of roaming. */
const FRESH_DRIFT_RADIUS = 6;
const ROAM_DRIFT_RADIUS = 34;

export class Remnant extends Combatant {
  stats: Stats;
  /** Seconds left in which a channel can still subdue it intact. */
  harvestable = HARVEST_WINDOW;
  /** Set by a successful harvest so onDeath skips the combat drops. */
  subdued = false;

  private readonly world: EnemyContext;
  private readonly riseX: number;
  private readonly riseY: number;
  private anim = new Animation(frames, 5);
  private t = Math.random() * Math.PI * 2;
  private attackTimer = ATTACK_COOLDOWN;
  private driftTimer = 0;
  private driftX: number;
  private driftY: number;

  constructor(world: EnemyContext, x: number, y: number, source: Stats, sourceName = "sacred artist") {
    super();
    this.world = world;
    this.x = x;
    this.y = y;
    this.riseX = x;
    this.riseY = y;
    this.driftX = x;
    this.driftY = y;
    this.stats = remnantStatsFor(source);
    this.displayName = `${STAGE_NAMES[this.stats.stage]} Remnant (${sourceName})`;
    this.hitbox = { offsetX: -4, offsetY: -7, w: 8, h: 7 };
    this.leavesRemnant = false; // a Remnant leaves nothing but parts
    this.resetInterpolation();
  }

  /** True while a harvest attempt is still possible. */
  get fresh(): boolean {
    return this.alive && this.harvestable > 0;
  }

  override update(dt: number): void {
    if (this.tickCombat(dt, this.world.map)) return;
    this.t += dt;
    this.anim.update(dt);
    this.harvestable = Math.max(0, this.harvestable - dt);

    // ---- erratic drift -----------------------------------------------------
    // Fresh: writhes near where it tore free (a harvest stays in range).
    // Roaming: jitters between random points biased toward the player.
    this.driftTimer -= dt;
    if (this.driftTimer <= 0) {
      this.driftTimer = 0.5 + Math.random() * 0.9;
      const fresh = this.harvestable > 0;
      const r = fresh ? FRESH_DRIFT_RADIUS : ROAM_DRIFT_RADIUS;
      const p = this.world.player;
      const toPlayer = !fresh && this.distTo(p.x, p.y) < AGGRO_RANGE && Math.random() < 0.5;
      const ax = toPlayer ? (p.x + this.x) / 2 : fresh ? this.riseX : this.x;
      const ay = toPlayer ? (p.y + this.y) / 2 : fresh ? this.riseY : this.y;
      const a = Math.random() * Math.PI * 2;
      this.driftX = ax + Math.cos(a) * r * Math.random();
      this.driftY = ay + Math.sin(a) * r * Math.random();
    }
    const dx = this.driftX - this.x;
    const dy = this.driftY - this.y;
    const d = Math.hypot(dx, dy);
    if (d > 1.5) {
      // Spirits ignore knockback friction but not walls — glide via stats.
      const step = this.stats.moveSpeed * this.speedMult * dt;
      const wobble = Math.sin(this.t * 6) * 6 * dt; // sideways shimmer
      const nx = this.x + (dx / d) * step + (-dy / d) * wobble;
      const ny = this.y + (dy / d) * step + (dx / d) * wobble;
      if (!this.world.map.isSolidAtWorld(nx, ny)) {
        this.x = nx;
        this.y = ny;
      } else {
        this.driftTimer = 0; // pick somewhere else
      }
      this.facing = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    }

    // ---- madra-bolt attack ---------------------------------------------------
    const p = this.world.player;
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && p.stats.health > 0) {
      this.attackTimer = ATTACK_COOLDOWN;
      const dist = this.distTo(p.x, p.y);
      if (dist <= BOLT_RANGE && hasLineOfSight(this.world.map, this.x, this.y - 4, p.x, p.y - 4)) {
        const angle = Math.atan2(p.y - this.y, p.x - this.x) + (Math.random() - 0.5) * 0.12;
        this.world.entities.add(
          new MadraBolt({
            x: this.x,
            y: this.y - 2,
            angle,
            speed: BOLT_SPEED,
            range: BOLT_RANGE + 30,
            multiplier: 1,
            knockback: 90,
            style: "foxfire", // spirit-violet flame reads right for raw madra
            owner: this,
            combat: this.world.combat,
            entities: this.world.entities,
            map: this.world.map,
          }),
        );
      }
    }
  }

  private distTo(x: number, y: number): number {
    return Math.hypot(x - this.x, y - this.y);
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const sprite = this.anim.frame;
    const cx = this.renderX(alpha);
    const bob = Math.sin(this.t * 3) * 1.5;
    const ry = this.renderY(alpha) - sprite.height + 1 + bob;
    const rx = cx - sprite.width / 2;
    ctx.globalAlpha = 0.9;
    this.drawWithEffects(ctx, sprite, rx, ry, this.facing === "left");
    ctx.globalAlpha = 1;

    // Fresh shimmer ring: the harvest window, visible at a glance.
    if (this.fresh) {
      const f = this.harvestable / HARVEST_WINDOW;
      ctx.save();
      ctx.strokeStyle = `rgba(184, 143, 212, ${0.25 + 0.2 * Math.sin(this.t * 5)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, this.renderY(alpha) - 8, 9 + (1 - f) * 2, 0, Math.PI * 2 * f);
      ctx.stroke();
      ctx.restore();
    }

    // HP pips once it has been hurt (the Dreadbeast convention, inlined).
    if (this.dissolve < 0 && this.stats.health < this.stats.maxHealth) {
      const pips = 5;
      const filled = Math.max(1, Math.ceil((this.stats.health / this.stats.maxHealth) * pips));
      let px = Math.round(cx - (pips * 3 + pips - 1) / 2);
      const py = Math.round(ry - 4);
      for (let i = 0; i < pips; i++) {
        ctx.fillStyle = i < filled ? "#b88fd4" : "rgba(20, 16, 28, 0.8)";
        ctx.fillRect(px, py, 3, 2);
        px += 4;
      }
    }
  }
}

// ----------------------------------------------------------- core pickup

const CORE_PAL = {
  o: "#57407a", // dim edge
  c: "#8a6cc0", // edge
  m: "#b88fd4", // core violet
  W: "#e8dcf6", // glint
};

// 7x8 Remnant core, two glow frames (the scale diamond's violet cousin).
const CORE_A = [
  "...c...",
  "..cmc..",
  ".cmmmc.",
  "cmmWmmc",
  ".cmmmc.",
  "..cmc..",
  "...c...",
  "...o...",
];

const CORE_B = [
  "...o...",
  "..cmc..",
  ".cmWmc.",
  "cmWWWmc",
  ".cmWmc.",
  "..cmc..",
  "...o...",
  "...o...",
];

const coreFrames = definePixelFrames([CORE_A, CORE_B], CORE_PAL);

const CORE_LIFETIME = 90; // cores are precious — they linger

/** A Soulsmith-grade Remnant core; walking over it counts it into flags. */
export class RemnantCorePickup extends Entity {
  private anim = new Animation(coreFrames, 3);
  private t = Math.random() * Math.PI * 2;
  private life = CORE_LIFETIME;

  constructor(
    x: number,
    y: number,
    private collector: Entity,
    private onCollect: () => void,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: -4, offsetY: -5, w: 8, h: 6 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.t += dt;
    this.anim.update(dt);
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    if (aabbOverlap(this.aabb, this.collector.aabb)) {
      this.dead = true;
      this.onCollect();
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const bob = Math.sin(this.t * 2.4) * 1.5;
    const sprite = this.anim.frame;
    const fade = this.life < 4 ? Math.max(0.25, this.life / 4) : 1;
    ctx.globalAlpha = fade;
    sprite.draw(ctx, this.renderX(alpha) - sprite.width / 2, this.renderY(alpha) - sprite.height + bob);
    ctx.globalAlpha = 1;
  }
}
