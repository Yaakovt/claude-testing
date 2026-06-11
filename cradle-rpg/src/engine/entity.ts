/**
 * Minimal entity base + manager.
 *
 * Entities live in world-pixel space. (x, y) is the entity's *anchor*: the
 * center of its feet — the natural point for y-sorting and tile logic.
 * The hitbox is expressed relative to that anchor.
 *
 * Positions are double-buffered (prevX/prevY) so rendering can interpolate
 * between simulation ticks (see loop.ts).
 *
 * Combat/systems agents: extend Entity, override update()/draw(), and add
 * your own hooks — the manager only assumes these basics.
 */

import type { AABB } from "./collision.js";
import type { SortedDrawable } from "./tilemap.js";

export type Facing = "up" | "down" | "left" | "right";

export abstract class Entity {
  /** Anchor: center of feet, world pixels. */
  x = 0;
  y = 0;
  /** Velocity, world pixels per second. */
  vx = 0;
  vy = 0;
  /** Hitbox relative to the anchor (offsetX/offsetY from anchor to box top-left). */
  hitbox = { offsetX: -6, offsetY: -10, w: 12, h: 10 };
  facing: Facing = "down";
  /** Set true to be removed by the manager after this tick. */
  dead = false;

  /** Previous tick position, for render interpolation. */
  prevX = 0;
  prevY = 0;

  /** Snap interpolation history (call after teleports/spawn). */
  resetInterpolation(): void {
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /** Interpolated anchor position for rendering. */
  renderX(alpha: number): number {
    return this.prevX + (this.x - this.prevX) * alpha;
  }
  renderY(alpha: number): number {
    return this.prevY + (this.y - this.prevY) * alpha;
  }

  /** Hitbox as a world-space AABB. */
  get aabb(): AABB {
    return {
      x: this.x + this.hitbox.offsetX,
      y: this.y + this.hitbox.offsetY,
      w: this.hitbox.w,
      h: this.hitbox.h,
    };
  }

  abstract update(dt: number): void;
  abstract draw(ctx: CanvasRenderingContext2D, alpha: number): void;
}

export class EntityManager {
  private entities: Entity[] = [];

  add<T extends Entity>(e: T): T {
    e.resetInterpolation();
    this.entities.push(e);
    return e;
  }

  remove(e: Entity): void {
    e.dead = true;
  }

  /** Immediately drop every entity matching the filter (map changes). */
  purge(filter: (e: Entity) => boolean): void {
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (filter(this.entities[i]!)) this.entities.splice(i, 1);
    }
  }

  get all(): readonly Entity[] {
    return this.entities;
  }

  update(dt: number): void {
    for (const e of this.entities) {
      e.prevX = e.x;
      e.prevY = e.y;
      e.update(dt);
    }
    // Sweep removals after the tick.
    for (let i = this.entities.length - 1; i >= 0; i--) {
      if (this.entities[i]!.dead) this.entities.splice(i, 1);
    }
  }

  /**
   * Draw entities y-sorted (by feet position) merged with extra drawables
   * such as sortable decor tiles, so the player correctly walks behind and
   * in front of trees, buildings, and other entities.
   */
  drawSorted(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    extras: SortedDrawable[] = [],
  ): void {
    const items: SortedDrawable[] = [...extras];
    for (const e of this.entities) {
      items.push({
        sortY: e.renderY(alpha),
        draw: (c, a) => e.draw(c, a),
      });
    }
    items.sort((a, b) => a.sortY - b.sortY);
    for (const item of items) item.draw(ctx, alpha);
  }
}
