/**
 * NPC SYSTEM (M4a) — pixel-sprite people declared per-map as DATA.
 *
 * Authoring (the M4b content agent adds people without new classes):
 *
 *   { id: "ren", name: "Auntie Ren", tx: 9, ty: 12,
 *     sprite: { hair: "#3a3142", robe: "#b04a8a", trim: "#efece4", skin: "#e6b48d" },
 *     behavior: { wanderRadius: 14 },            // omit = stand still
 *     facing: "down", dialogueId: "seed-ren" }
 *
 * - The sprite is parameterized (hair/robe/trim/skin) so distinct villagers
 *   are cheap; frame sets are cached per palette.
 * - Idle behaviors: stand, face the player when near (default true), and an
 *   optional small wander radius.
 * - World draws the "E — Talk" prompt + name label on approach and starts
 *   the dialogue; the NPC itself knows nothing about dialogue internals.
 * - GUARD variant: `guard: { untilFlag, stepAside? }` makes the NPC a solid
 *   blocker (pushes combatants out per tick, like StoneWallSegment — never
 *   a map edit) until the story flag clears it, at which point it steps
 *   aside once.
 */

import { Entity, type Facing, type EntityManager } from "../engine/entity.js";
import { aabbOverlap, moveAndCollide } from "../engine/collision.js";
import type { Tilemap } from "../engine/tilemap.js";
import { Animation, definePixelFrames, type PixelSprite } from "../engine/sprites.js";
import { TILE_SIZE } from "../engine/tilemap.js";
import { Combatant } from "../systems/combat.js";

// ----------------------------------------------------------------- sprite

export interface NpcSpriteParams {
  hair: string;
  robe: string;
  trim: string;
  skin: string;
}

/** A few ready palettes so content can mint villagers without hex codes. */
export const NPC_PALETTES: Record<string, NpcSpriteParams> = {
  villagerA: { hair: "#15131c", robe: "#b08a4a", trim: "#efece4", skin: "#e6b48d" },
  villagerB: { hair: "#4a3119", robe: "#7a9e6a", trim: "#e0c9a8", skin: "#d9a87e" },
  villagerC: { hair: "#5c5478", robe: "#b04a8a", trim: "#efece4", skin: "#e6b48d" },
  weiElder: { hair: "#c2cad8", robe: "#efece4", trim: "#6d4f94", skin: "#e0b490" },
  weiGuard: { hair: "#15131c", robe: "#57407a", trim: "#aaabb4", skin: "#d9a87e" },
  glorySchool: { hair: "#15131c", robe: "#e8dcc4", trim: "#c9a85c", skin: "#e6b48d" },
};

const DOWN_BODY = [
  "....HHHHHH....",
  "...HHHHHHHH...",
  "..HHHHHHHHHH..",
  "..HHSSSSSSHH..",
  "..HSESSSSESH..",
  "...SSSSSSSS...",
  "....SSSSSS....",
  "....RRRRRR....",
  "..RRRRRRRRRR..",
  "..RPRRRRRRPR..",
  ".SRPRRRRRRPRS.",
  ".SRPPPPPPPPRS.",
  "..RRRRRRRRRR..",
  "..RRRRRRRRRR..",
  "..RRRRRRRRRR..",
  "..rRRRRRRRRr..",
  "..rrRRRRRRrr..",
  "...rrrrrrrr...",
];

const UP_BODY = [
  "....HHHHHH....",
  "...HHHHHHHH...",
  "..HHHHHHHHHH..",
  "..HHHHHHHHHH..",
  "..HHHHHHHHHH..",
  "...HHHHHHHH...",
  "....SSSSSS....",
  "....RRRRRR....",
  "..RRRRRRRRRR..",
  "..RRRRRRRRRR..",
  ".SRRRRRRRRRRS.",
  ".SRPPPPPPPPRS.",
  "..RRRRRRRRRR..",
  "..RRRRRRRRRR..",
  "..RRRRRRRRRR..",
  "..rRRRRRRRRr..",
  "..rrRRRRRRrr..",
  "...rrrrrrrr...",
];

const SIDE_BODY = [
  "....HHHHHH....",
  "...HHHHHHHH...",
  "..HHHHHHHHHH..",
  "..HHHSSSSSH...",
  "..HHHSESSSS...",
  "...HSSSSSS....",
  "....SSSSS.....",
  "....RRRRRR....",
  "...RRRRRRRR...",
  "...RRRRPRRR...",
  "...RRRRPRRRS..",
  "...RPPPPPPR...",
  "...RRRRRRRR...",
  "...RRRRRRRR...",
  "...RRRRRRRR...",
  "...rRRRRRRr...",
  "...rrRRRRrr...",
  "....rrrrrr....",
];

const FEET_IDLE = "....FF..FF....";
const FEET_A = "...FF...FF....";
const FEET_B = "....FF...FF...";
const FEET_SIDE_IDLE = ".....FFFF.....";
const FEET_SIDE_A = "....FF..FF....";
const FEET_SIDE_B = ".....FFFF.....";
const PAD = "..............";

interface FacingSprites {
  idle: PixelSprite;
  walk: Animation;
  flip: boolean;
}

const spriteCache = new Map<string, Record<Facing, FacingSprites>>();

function buildSprites(p: NpcSpriteParams): Record<Facing, FacingSprites> {
  const key = `${p.hair}|${p.robe}|${p.trim}|${p.skin}`;
  const cached = spriteCache.get(key);
  if (cached) {
    // Animations carry playback state — give each NPC fresh ones over the
    // shared frames.
    return {
      down: { ...cached.down, walk: new Animation(cached.down.walk.frames, 5) },
      up: { ...cached.up, walk: new Animation(cached.up.walk.frames, 5) },
      right: { ...cached.right, walk: new Animation(cached.right.walk.frames, 5) },
      left: { ...cached.left, walk: new Animation(cached.left.walk.frames, 5) },
    };
  }
  const pal = {
    H: p.hair,
    S: p.skin,
    E: "#1a1a24",
    R: p.robe,
    r: shade(p.robe),
    P: p.trim,
    F: "#3a3142",
  };
  const make = (body: string[], idleFeet: string, a: string, b: string) =>
    definePixelFrames(
      [
        [...body, idleFeet, PAD],
        [...body, a, PAD],
        [...body, b, PAD],
      ],
      pal,
    );
  const [dI, dA, dB] = make(DOWN_BODY, FEET_IDLE, FEET_A, FEET_B);
  const [uI, uA, uB] = make(UP_BODY, FEET_IDLE, FEET_A, FEET_B);
  const [sI, sA, sB] = make(SIDE_BODY, FEET_SIDE_IDLE, FEET_SIDE_A, FEET_SIDE_B);
  const set: Record<Facing, FacingSprites> = {
    down: { idle: dI!, walk: new Animation([dA!, dB!], 5), flip: false },
    up: { idle: uI!, walk: new Animation([uA!, uB!], 5), flip: false },
    right: { idle: sI!, walk: new Animation([sA!, sB!], 5), flip: false },
    left: { idle: sI!, walk: new Animation([sA!, sB!], 5), flip: true },
  };
  spriteCache.set(key, set);
  return set;
}

/** Cheap darker shade of a #rrggbb color (robe folds). */
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.round(v * 0.78));
  const r = f((n >> 16) & 0xff);
  const g = f((n >> 8) & 0xff);
  const b = f(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ------------------------------------------------------------------- data

export interface NpcBehavior {
  /** Wander this many world px around home (omit = stand still). */
  wanderRadius?: number;
  /** Turn toward the player when near (default true). */
  facePlayer?: boolean;
}

export interface NpcGuardConfig {
  /** Solid + immovable until this story flag is truthy. */
  untilFlag: string;
  /** One-time sidestep (world px) when the flag clears. */
  stepAside?: { dx: number; dy: number };
}

export interface NpcDef {
  id: string;
  name: string;
  /** Tile coordinates (like enemy spawns). */
  tx: number;
  ty: number;
  sprite: NpcSpriteParams;
  facing?: Facing;
  behavior?: NpcBehavior;
  /** Dialogue tree id ("E — Talk"); omit for scenery people. */
  dialogueId?: string;
  guard?: NpcGuardConfig;
}

export interface NpcContext {
  map: Tilemap;
  player: Entity;
  entities: EntityManager;
  /** Story flag query (guards watch their flag through this). */
  flagTruthy(key: string): boolean;
}

const FACE_PLAYER_RADIUS = 28;
const WANDER_SPEED = 18;

// ----------------------------------------------------------------- entity

export class Npc extends Entity {
  readonly def: NpcDef;
  readonly displayName: string;
  /** True while the guard is actively blocking. */
  get blocking(): boolean {
    return this.def.guard !== undefined && !this.ctx.flagTruthy(this.def.guard.untilFlag) ;
  }

  private ctx: NpcContext;
  private sprites: Record<Facing, FacingSprites>;
  private homeX: number;
  private homeY: number;
  private wanderTarget: { x: number; y: number } | null = null;
  private wanderPause = 1 + Math.random() * 2;
  private moving = false;
  private steppedAside = false;
  private readonly baseFacing: Facing;

  constructor(def: NpcDef, ctx: NpcContext) {
    super();
    this.def = def;
    this.ctx = ctx;
    this.displayName = def.name;
    this.x = def.tx * TILE_SIZE + TILE_SIZE / 2;
    this.y = def.ty * TILE_SIZE + TILE_SIZE * 0.75;
    this.homeX = this.x;
    this.homeY = this.y;
    this.facing = def.facing ?? "down";
    this.baseFacing = this.facing;
    this.hitbox = { offsetX: -5, offsetY: -8, w: 10, h: 8 };
    this.sprites = buildSprites(def.sprite);
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.moving = false;

    // Guard duty: hold the line, push intruders out; step aside when freed.
    if (this.def.guard) {
      if (this.blocking) {
        this.pushOutOverlaps();
      } else if (!this.steppedAside) {
        this.steppedAside = true;
        const aside = this.def.guard.stepAside;
        if (aside) {
          const res = moveAndCollide(this.aabb, aside.dx, aside.dy, this.ctx.map);
          this.x = res.x - this.hitbox.offsetX;
          this.y = res.y - this.hitbox.offsetY;
          this.homeX = this.x;
          this.homeY = this.y;
        }
      }
    }

    const behavior = this.def.behavior ?? {};
    const playerDist = Math.hypot(this.ctx.player.x - this.x, this.ctx.player.y - this.y);
    const playerNear = playerDist <= FACE_PLAYER_RADIUS;

    // Wander (suspended while the player is close, and never for blockers).
    if (behavior.wanderRadius && !playerNear && !(this.def.guard && this.blocking)) {
      if (this.wanderTarget) {
        const t = this.wanderTarget;
        const dx = t.x - this.x;
        const dy = t.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d < 1.5) {
          this.wanderTarget = null;
          this.wanderPause = 1.5 + Math.random() * 3;
        } else {
          const step = WANDER_SPEED * dt;
          const res = moveAndCollide(this.aabb, (dx / d) * step, (dy / d) * step, this.ctx.map);
          this.x = res.x - this.hitbox.offsetX;
          this.y = res.y - this.hitbox.offsetY;
          this.moving = true;
          if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx > 0 ? "right" : "left";
          else this.facing = dy > 0 ? "down" : "up";
          if (res.hitX || res.hitY) this.wanderTarget = null;
        }
      } else {
        this.wanderPause -= dt;
        if (this.wanderPause <= 0) {
          const a = Math.random() * Math.PI * 2;
          const r = behavior.wanderRadius * (0.3 + Math.random() * 0.7);
          this.wanderTarget = { x: this.homeX + Math.cos(a) * r, y: this.homeY + Math.sin(a) * r };
        }
      }
    }

    // Face the player when near.
    if ((behavior.facePlayer ?? true) && playerNear && !this.moving) {
      const dx = this.ctx.player.x - this.x;
      const dy = this.ctx.player.y - this.y;
      if (Math.abs(dx) >= Math.abs(dy)) this.facing = dx > 0 ? "right" : "left";
      else this.facing = dy > 0 ? "down" : "up";
    } else if (!playerNear && !this.moving && !behavior.wanderRadius) {
      this.facing = this.baseFacing;
    }

    if (this.moving) this.sprites[this.facing].walk.update(dt);
    else this.sprites[this.facing].walk.reset();
  }

  /** Solid-guard behavior: shove overlapping combatants out (no map edit). */
  private pushOutOverlaps(): void {
    const wall = this.aabb;
    for (const e of this.ctx.entities.all) {
      if (e === this || !(e instanceof Combatant) || !e.alive) continue;
      const box = e.aabb;
      if (!aabbOverlap(wall, box)) continue;
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
      const res = moveAndCollide(box, dx, dy, this.ctx.map);
      e.x = res.x - e.hitbox.offsetX;
      e.y = res.y - e.hitbox.offsetY;
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const set = this.sprites[this.facing];
    const sprite = this.moving ? set.walk.frame : set.idle;
    sprite.draw(
      ctx,
      this.renderX(alpha) - sprite.width / 2,
      this.renderY(alpha) - (sprite.height - 2),
      set.flip,
    );
  }
}
