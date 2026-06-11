/**
 * Short-lived entities spawned by Path techniques (M3): madra projectiles,
 * expanding aura rings, the Evening Tide slow pool, and Ridgeline's stone
 * wall segments (a TEMPORARY collision entity — never a map edit).
 *
 * All of these are plain Entities registered through ctx.spawn(); the
 * EntityManager knows nothing special about them.
 */

import { Entity } from "../engine/entity.js";
import { aabbOverlap, moveAndCollide, type AABB } from "../engine/collision.js";
import type { Tilemap } from "../engine/tilemap.js";
import type { EntityManager } from "../engine/entity.js";
import { Combatant, type CombatSystem } from "../systems/combat.js";
import { definePixelSprite } from "../engine/sprites.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";

// -------------------------------------------------------------- projectile

export interface BoltOptions {
  x: number;
  y: number;
  angle: number;
  speed: number;
  range: number;
  /** Damage = owner attackPower * multiplier through computeDamage. */
  multiplier: number;
  knockback: number;
  style: "foxfire" | "crescent";
  owner: Combatant;
  combat: CombatSystem;
  entities: EntityManager;
  map: Tilemap;
}

/** A traveling madra projectile; despawns on hit, wall, or max range. */
export class MadraBolt extends Entity {
  private traveled = 0;
  private t = 0;
  private readonly o: BoltOptions;

  constructor(o: BoltOptions) {
    super();
    this.o = o;
    this.x = o.x;
    this.y = o.y;
    this.hitbox =
      o.style === "crescent"
        ? { offsetX: -5, offsetY: -5, w: 10, h: 10 }
        : { offsetX: -3, offsetY: -3, w: 6, h: 6 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.t += dt;
    const step = this.o.speed * dt;
    this.x += Math.cos(this.o.angle) * step;
    this.y += Math.sin(this.o.angle) * step;
    this.traveled += step;

    if (this.o.map.isSolidAtWorld(this.x, this.y - 2) || this.traveled >= this.o.range) {
      this.dead = true;
      return;
    }
    for (const e of this.o.entities.all) {
      if (e === this.o.owner || !(e instanceof Combatant)) continue;
      if (!e.alive || e.iframes > 0) continue;
      if (aabbOverlap(this.aabb, e.aabb)) {
        // victimIframes 0 so a point-blank fan (Fox Fire) can fully land.
        this.o.combat.strike(this.o.owner, e, {
          multiplier: this.o.multiplier,
          knockback: this.o.knockback,
          hitstun: 0.18,
          victimIframes: 0,
        });
        this.dead = true;
        return;
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const cx = this.renderX(alpha);
    const cy = this.renderY(alpha) - 2;
    ctx.save();
    if (this.o.style === "foxfire") {
      // Illusory violet flame — flickers between two hues.
      const flick = Math.sin(this.t * 40) > 0;
      ctx.fillStyle = flick ? "#b88fd4" : "#8a6cc0";
      ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 4, 4);
      ctx.fillStyle = "#e8dcf6";
      ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 2, 2);
    } else {
      // Water-light crescent: a stroked arc opening along the travel dir.
      ctx.strokeStyle = "#bfe3f2";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, this.o.angle - 1.1, this.o.angle + 1.1);
      ctx.stroke();
      ctx.strokeStyle = "rgba(127, 180, 216, 0.6)";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, this.o.angle - 0.9, this.o.angle + 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------- expanding ring

/** A purely visual expanding ring (Fox Dream pulse, stage-up ceremonies). */
export class ExpandingRing extends Entity {
  private t = 0;
  constructor(
    x: number,
    y: number,
    private color: string,
    private r0: number,
    private r1: number,
    private life: number,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: 0, offsetY: 0, w: 0, h: 0 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) this.dead = true;
  }

  override draw(ctx: CanvasRenderingContext2D, _alpha: number): void {
    const f = Math.min(1, this.t / this.life);
    ctx.save();
    ctx.globalAlpha = (1 - f) * 0.7;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y - 4, this.r0 + (this.r1 - this.r0) * f, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- slow pool

const POOL_SLOW_FACTOR = 0.45;

/** Evening Tide: a pool of heavy water-light that drags dreadbeasts down. */
export class SlowPool extends Entity {
  private t = 0;
  constructor(
    x: number,
    y: number,
    private radius: number,
    private life: number,
    private entities: EntityManager,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: 0, offsetY: 0, w: 0, h: 0 };
    this.resetInterpolation();
  }

  /** Pools paint the ground: sort under every real entity. */
  override renderY(_alpha: number): number {
    return -9999;
  }

  override update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) {
      this.dead = true;
      return;
    }
    for (const e of this.entities.all) {
      if (!(e instanceof Dreadbeast) || !e.alive) continue;
      if (Math.hypot(e.x - this.x, e.y - this.y) <= this.radius) {
        e.applySlow(POOL_SLOW_FACTOR, 0.2);
      }
    }
  }

  override draw(ctx: CanvasRenderingContext2D, _alpha: number): void {
    const fade = Math.min(1, Math.min(this.t / 0.3, (this.life - this.t) / 0.6));
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, 0.55);
    ctx.globalAlpha = 0.28 * fade;
    ctx.fillStyle = "#3f6f9e";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5 * fade;
    ctx.strokeStyle = "#bfe3f2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 1 + Math.sin(this.t * 3) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ------------------------------------------------------------- stone wall

const WALL_SPRITE = definePixelSprite(
  [
    "..ssssssssss..",
    ".sRRrrRRrrRRs.",
    "sRRrrsRRssRRrs",
    "srrRRrrRRrrsss",
    "sRRssRRrrRRrrs",
    "srrRRrrssrrRRs",
    "sRRrrRRrrRRsss",
    "ssrrssrrssrrRs",
    "sRRrrRRrrRRrrs",
    "srrRRssRRssRRs",
    "sRRrrRRrrRRrrs",
    ".ssssssssssss.",
  ],
  { s: "#5d5e66", r: "#8d8e96", R: "#aaabb4" },
);

/**
 * One Ridgeline segment: a Forged stone block that BLOCKS MOVEMENT by
 * pushing overlapping combatants out each tick (a temporary collision
 * entity — the tilemap is never edited). Crumbles after its lifetime.
 */
export class StoneWallSegment extends Entity {
  private t = 0;
  constructor(
    x: number,
    y: number,
    private life: number,
    private entities: EntityManager,
    private map: Tilemap,
  ) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: -7, offsetY: -9, w: 14, h: 9 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.t += dt;
    if (this.t >= this.life) {
      this.dead = true;
      return;
    }
    const wall = this.aabb;
    for (const e of this.entities.all) {
      if (!(e instanceof Combatant) || !e.alive) continue;
      const box = e.aabb;
      if (!aabbOverlap(wall, box)) continue;
      // Push out along the axis of least penetration (sliding vs the map).
      const pushLeft = box.x + box.w - wall.x;
      const pushRight = wall.x + wall.w - box.x;
      const pushUp = box.y + box.h - wall.y;
      const pushDown = wall.y + wall.h - box.y;
      const minX = Math.min(pushLeft, pushRight);
      const minY = Math.min(pushUp, pushDown);
      let dx = 0;
      let dy = 0;
      if (minX < minY) dx = pushLeft < pushRight ? -pushLeft : pushRight;
      else dy = pushUp < pushDown ? -pushUp : pushDown;
      const res = moveAndCollide(box, dx, dy, this.map);
      e.x = res.x - e.hitbox.offsetX;
      e.y = res.y - e.hitbox.offsetY;
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const crumble = Math.max(0, Math.min(1, (this.life - this.t) / 0.8));
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * crumble;
    WALL_SPRITE.draw(
      ctx,
      this.renderX(alpha) - WALL_SPRITE.width / 2,
      this.renderY(alpha) - (WALL_SPRITE.height - 2),
    );
    ctx.restore();
  }

  /** Exposed for tests: does this segment currently block `box`? */
  blocks(box: AABB): boolean {
    return aabbOverlap(this.aabb, box);
  }
}
