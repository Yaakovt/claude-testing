/**
 * Dreadbeast base: corrupted beasts whose spirits are mangled into their
 * flesh (lore bible §6.3). Mindlessly aggressive, XP-poor and danger-rich,
 * and they leave NO Remnant when killed — the game drops madra "scales"
 * instead (see main.ts onDeath).
 *
 * Shared behavior built here:
 *  - small state machine scaffolding (idle/patrol → aggro → windup/attack →
 *    recover, plus stunned and leash states)
 *  - aggro = proximity + line of sight (no aggro through solid tiles)
 *  - de-aggro + leash back home when the player escapes
 *  - separation steering so beasts never stack on the player's exact pixel
 *  - HP pips above damaged beasts, windup jitter telegraph, hit flash and
 *    death dissolve via Combatant.drawWithEffects
 */

import { Combatant, type CombatSystem } from "../../systems/combat.js";
import { Stage, type Stats } from "../../systems/stats.js";
import { moveAndCollide } from "../../engine/collision.js";
import type { Tilemap } from "../../engine/tilemap.js";
import type { EntityManager } from "../../engine/entity.js";
import type { PixelSprite } from "../../engine/sprites.js";

export interface EnemyContext {
  map: Tilemap;
  combat: CombatSystem;
  player: Combatant;
  entities: EntityManager;
}

export type BeastState =
  | "idle"
  | "patrol"
  | "aggro"
  | "windup"
  | "attack"
  | "recover"
  | "stunned"
  | "leash";

/** Sampled tile raycast: false if any solid tile blocks the segment. */
export function hasLineOfSight(
  map: Tilemap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): boolean {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (map.isSolidAtWorld(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

export abstract class Dreadbeast extends Combatant {
  readonly homeX: number;
  readonly homeY: number;
  state: BeastState = "idle";

  /** M4b: story flag World sets when this beast dies (spawn-table data). */
  storyDeathFlag: string | null = null;

  protected stateTime = 0;
  protected world: EnemyContext;
  protected moved = false;

  // Subclass tuning (world px).
  protected aggroRadius = 70;
  protected deaggroRadius = 150;
  protected leashRadius = 130;

  // --- M3 spirit-disruption state (techniques act on these) ---------------
  /** While > 0 the beast loses aggro and wanders aimlessly (Fox Dream,
   *  Empty Palm). */
  dazeTimer = 0;
  /** While > 0 the beast's "techniques" (windup/attack specials) are sealed
   *  — its madra is scattered (Empty Palm). It can still chase and shove. */
  madraLockTimer = 0;
  /** Movement speed factor applied while slowTimer > 0 (Evening Tide). */
  slowFactor = 1;
  private slowTimer = 0;
  private dazeWanderT = 0;

  private patrolX: number;
  private patrolY: number;

  constructor(world: EnemyContext, x: number, y: number) {
    super();
    this.world = world;
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.patrolX = x;
    this.patrolY = y;
    // Dreadbeasts fuse spirit into flesh — no Remnant ever (lore §6.3).
    this.leavesRemnant = false;
  }

  abstract override stats: Stats;

  /** Daze: drop aggro and wander (illusion/spirit disruption). */
  applyDaze(seconds: number): void {
    this.dazeTimer = Math.max(this.dazeTimer, seconds);
    this.dazeWanderT = 0;
    this.setState("idle");
  }

  /** Madra lock: seal specials for a while (Empty Palm). */
  applyMadraLock(seconds: number): void {
    this.madraLockTimer = Math.max(this.madraLockTimer, seconds);
    if (this.state === "windup" || this.state === "attack") this.setState("recover");
  }

  /** Temporary movement slow (zone techniques). Re-applied per tick. */
  applySlow(factor: number, seconds: number): void {
    this.slowFactor = factor;
    this.slowTimer = Math.max(this.slowTimer, seconds);
  }

  protected setState(s: BeastState): void {
    this.state = s;
    this.stateTime = 0;
  }

  protected get playerAlive(): boolean {
    return this.world.player.stats.health > 0;
  }

  protected distToPlayer(): number {
    return Math.hypot(this.world.player.x - this.x, this.world.player.y - this.y);
  }

  protected distToHome(): number {
    return Math.hypot(this.homeX - this.x, this.homeY - this.y);
  }

  /** Proximity + line-of-sight aggro check. */
  protected canSeePlayer(): boolean {
    return (
      this.playerAlive &&
      this.distToPlayer() <= this.aggroRadius &&
      hasLineOfSight(this.world.map, this.x, this.y - 4, this.world.player.x, this.world.player.y - 4)
    );
  }

  protected shouldLeash(): boolean {
    return (
      !this.playerAlive ||
      this.distToHome() > this.leashRadius ||
      this.distToPlayer() > this.deaggroRadius
    );
  }

  protected faceToward(tx: number, ty: number): void {
    const dx = tx - this.x;
    const dy = ty - this.y;
    if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx > 0 ? "right" : "left";
    else this.facing = dy > 0 ? "down" : "up";
  }

  /** Move toward a point with sliding collision; updates facing. */
  protected moveToward(
    tx: number,
    ty: number,
    speed: number,
    dt: number,
  ): { hitWall: boolean; arrived: boolean } {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1) return { hitWall: false, arrived: true };
    this.faceToward(tx, ty);
    if (this.slowTimer > 0) speed *= this.slowFactor;
    const res = moveAndCollide(this.aabb, (dx / d) * speed * dt, (dy / d) * speed * dt, this.world.map);
    this.x = res.x - this.hitbox.offsetX;
    this.y = res.y - this.hitbox.offsetY;
    this.moved = true;
    return { hitWall: res.hitX || res.hitY, arrived: d < 3 };
  }

  /** Move in a fixed direction (charges/lunges). */
  protected moveDir(
    dirX: number,
    dirY: number,
    speed: number,
    dt: number,
  ): { hitWall: boolean } {
    if (this.slowTimer > 0) speed *= this.slowFactor;
    const res = moveAndCollide(this.aabb, dirX * speed * dt, dirY * speed * dt, this.world.map);
    this.x = res.x - this.hitbox.offsetX;
    this.y = res.y - this.hitbox.offsetY;
    this.moved = true;
    return { hitWall: res.hitX || res.hitY };
  }

  protected pickPatrolPoint(radius: number): void {
    const a = Math.random() * Math.PI * 2;
    const r = radius * (0.4 + Math.random() * 0.6);
    this.patrolX = this.homeX + Math.cos(a) * r;
    this.patrolY = this.homeY + Math.sin(a) * r;
  }

  /** Step toward the patrol point; true when arrived or blocked. */
  protected patrolStep(speed: number, dt: number): boolean {
    const res = this.moveToward(this.patrolX, this.patrolY, speed, dt);
    return res.arrived || res.hitWall;
  }

  /** Walk home; heal up and go idle on arrival. */
  protected leashStep(speed: number, dt: number): void {
    const res = this.moveToward(this.homeX, this.homeY, speed, dt);
    if (res.arrived || this.stateTime > 8) {
      this.stats.health = this.stats.maxHealth;
      this.setState("idle");
    }
  }

  override update(dt: number): void {
    this.moved = false;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }
    this.madraLockTimer = Math.max(0, this.madraLockTimer - dt);
    if (this.tickCombat(dt, this.world.map)) return;
    this.stateTime += dt;
    if (this.dazeTimer > 0) {
      this.dazeTimer -= dt;
      this.dazeWander(dt);
    } else {
      this.think(dt);
      // Madra sealed: cancel any special the brain just tried to start.
      if (this.madraLockTimer > 0 && (this.state === "windup" || this.state === "attack")) {
        this.setState("recover");
      }
    }
    this.separate(dt);
  }

  /** Aimless stumbling while dazed — aggro is forgotten. */
  private dazeWander(dt: number): void {
    this.dazeWanderT -= dt;
    if (this.dazeWanderT <= 0) {
      this.dazeWanderT = 0.5 + Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2;
      this.patrolX = this.x + Math.cos(a) * 18;
      this.patrolY = this.y + Math.sin(a) * 18;
    }
    this.moveToward(this.patrolX, this.patrolY, 22, dt);
  }

  protected abstract think(dt: number): void;

  /** Gentle push-apart so beasts never stack on each other or the player. */
  private separate(dt: number): void {
    let px = 0;
    let py = 0;
    for (const e of this.world.entities.all) {
      if (e === this) continue;
      const isPlayer = e === this.world.player;
      if (!isPlayer && !(e instanceof Dreadbeast)) continue;
      if (e instanceof Combatant && e.dissolve >= 0) continue;
      const dx = this.x - e.x;
      const dy = this.y - e.y;
      const d = Math.hypot(dx, dy);
      const min = isPlayer ? 10 : 12;
      if (d >= min) continue;
      if (d > 0.001) {
        px += (dx / d) * (min - d);
        py += (dy / d) * (min - d);
      } else {
        // Exact overlap: deterministic-ish nudge so they unstick.
        px += Math.random() * 2 - 1;
        py += Math.random() * 2 - 1;
      }
    }
    if (px !== 0 || py !== 0) {
      const res = moveAndCollide(this.aabb, px * 8 * dt, py * 8 * dt, this.world.map);
      this.x = res.x - this.hitbox.offsetX;
      this.y = res.y - this.hitbox.offsetY;
    }
  }

  protected get flip(): boolean {
    return this.facing === "left";
  }

  /** Standard beast rendering: windup jitter, effects, HP pips. */
  protected drawBeast(
    ctx: CanvasRenderingContext2D,
    alpha: number,
    sprite: PixelSprite,
  ): void {
    const jitter = this.state === "windup" ? Math.sin(this.stateTime * 50) * 0.8 : 0;
    const cx = this.renderX(alpha);
    const rx = cx - sprite.width / 2 + jitter;
    const ry = this.renderY(alpha) - (sprite.height - 2);
    this.drawWithEffects(ctx, sprite, rx, ry, this.flip);
    this.drawHpPips(ctx, cx, ry - 5);
    this.drawSpiritStatus(ctx, cx, ry);
    this.drawStageLabel(ctx, cx, ry);
  }

  /** Orbiting motes while dazed (violet) or madra-locked (pale blue). */
  private drawSpiritStatus(ctx: CanvasRenderingContext2D, cx: number, top: number): void {
    if (this.dazeTimer <= 0 && this.madraLockTimer <= 0) return;
    const t = (this.dazeTimer + this.madraLockTimer) * 6 + this.x;
    ctx.fillStyle = this.dazeTimer > 0 ? "#b88fd4" : "#9db8e8";
    for (let i = 0; i < 3; i++) {
      const a = t + (i * Math.PI * 2) / 3;
      ctx.fillRect(
        Math.round(cx + Math.cos(a) * 6) - 1,
        Math.round(top - 3 + Math.sin(a) * 2),
        1,
        1,
      );
    }
  }

  /**
   * Copper benefit: once the player's senses open, every beast's stage is
   * readable on sight (M2 only labeled foes after trading blows).
   */
  private drawStageLabel(ctx: CanvasRenderingContext2D, cx: number, top: number): void {
    if (this.world.player.stats.stage < Stage.Copper) return;
    if (this.dissolve >= 0 || this.distToPlayer() > 110) return;
    ctx.save();
    ctx.font = "5px Georgia, serif";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#0b0a10";
    ctx.fillText(this.displayName, Math.round(cx) + 1, Math.round(top) - 8);
    const byStage: Partial<Record<Stage, string>> = {
      [Stage.Foundation]: "#cfc8b4",
      [Stage.Copper]: "#dba35e",
      [Stage.Iron]: "#a8bccb",
    };
    ctx.fillStyle = byStage[this.stats.stage] ?? "#e0c9a8";
    ctx.fillText(this.displayName, Math.round(cx), Math.round(top) - 9);
    ctx.restore();
  }

  /** Five HP pips above the beast once it has taken any damage. */
  protected drawHpPips(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
    if (this.dissolve >= 0 || this.stats.health >= this.stats.maxHealth) return;
    const pips = 5;
    const w = 3;
    const gap = 1;
    const total = pips * w + (pips - 1) * gap;
    const filled = Math.max(1, Math.ceil((this.stats.health / this.stats.maxHealth) * pips));
    let x = Math.round(cx - total / 2);
    const yy = Math.round(y);
    for (let i = 0; i < pips; i++) {
      ctx.fillStyle = i < filled ? "#b8434e" : "rgba(20, 16, 28, 0.8)";
      ctx.fillRect(x, yy, w, 2);
      x += w + gap;
    }
  }
}
