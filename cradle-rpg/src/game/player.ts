/**
 * The player: a young sacred artist of the Wei clan (black hair, white robe
 * with purple trim), still at Foundation.
 *
 * 8-directional movement (diagonals normalized), ~90 px/s, axis-separated
 * sliding collision, 4-direction facing with a 2-frame walk cycle.
 * Sprite is 16x24; the left-facing frames are the right-facing frames
 * flipped at draw time.
 */

import { Animation, definePixelFrames, type PixelSprite } from "../engine/sprites.js";
import { Entity, type Facing } from "../engine/entity.js";
import { moveAndCollide } from "../engine/collision.js";
import type { Input } from "../engine/input.js";
import type { Tilemap } from "../engine/tilemap.js";

export const PLAYER_WALK_SPEED = 90; // world px/s

const PAL = {
  H: "#15131c", // black hair
  S: "#e6b48d", // skin
  E: "#1a1a24", // eyes
  R: "#efece4", // Wei white robe
  r: "#d8d2c4", // robe shade
  P: "#6d4f94", // purple trim
  p: "#57407a", // purple sash
  F: "#3a3142", // shoes
};

// ---- facing down -----------------------------------------------------------

const DOWN_BODY = [
  "................",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHH..",
  "..HHSSSSSSSSHH..",
  "..HSSESSSSESSH..",
  "...SSSSSSSSSS...",
  "....SSSSSSSS....",
  ".....RRRRRR.....",
  "...RRRRRRRRRR...",
  "..RRPRRRRRRPRR..",
  "..RRPRRRRRRPRR..",
  ".SRRPRRRRRRPRRS.",
  ".SRRppppppppRRS.",
  "..RRPRRRRRRPRR..",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..rRRRRRRRRRRr..",
  "..rrRRRRRRRRrr..",
  "...rrrrrrrrrr...",
];

const downIdle = [...DOWN_BODY, "....FF....FF....", "................"];
const downWalkA = [...DOWN_BODY, "...FF.....FF....", "................"];
const downWalkB = [...DOWN_BODY, "....FF.....FF...", "................"];

// ---- facing up --------------------------------------------------------------

const UP_BODY = [
  "................",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHH..",
  "...HHHHHHHHHH...",
  "....SSSSSSSS....",
  ".....RPPPPR.....",
  "...RRRRRRRRRR...",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  ".SRRRRRRRRRRRRS.",
  ".SRRppppppppRRS.",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..RRRRRRRRRRRR..",
  "..rRRRRRRRRRRr..",
  "..rrRRRRRRRRrr..",
  "...rrrrrrrrrr...",
];

const upIdle = [...UP_BODY, "....FF....FF....", "................"];
const upWalkA = [...UP_BODY, "...FF.....FF....", "................"];
const upWalkB = [...UP_BODY, "....FF.....FF...", "................"];

// ---- facing right (left = flipped) ------------------------------------------

const SIDE_BODY = [
  "................",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHH..",
  "..HHHHSSSSSSH...",
  "..HHHHSSESSSS...",
  "..HHHSSSSSSS....",
  "....SSSSSS......",
  "....RRRRRRR.....",
  "...RRRRRRRRR....",
  "...RRRRRPRRR....",
  "...RRRRRPRRRS...",
  "...RRRRRPRRR....",
  "...RpppppppR....",
  "...RRRRRPRRR....",
  "...RRRRRRRRR....",
  "...RRRRRRRRR....",
  "...RRRRRRRRR....",
  "...rRRRRRRRr....",
  "...rrrrrrrrr....",
  "................",
];

const sideIdle = [...SIDE_BODY, ".....FFFF.......", "................"];
const sideWalkA = [...SIDE_BODY, "...FF....FF.....", "................"];
const sideWalkB = [...SIDE_BODY, "......FFFF......", "................"];

interface FacingSprites {
  idle: PixelSprite;
  walk: Animation;
  flip: boolean;
}

function makeSprites(): Record<Facing, FacingSprites> {
  const [dI, dA, dB] = definePixelFrames([downIdle, downWalkA, downWalkB], PAL);
  const [uI, uA, uB] = definePixelFrames([upIdle, upWalkA, upWalkB], PAL);
  const [sI, sA, sB] = definePixelFrames([sideIdle, sideWalkA, sideWalkB], PAL);
  return {
    down: { idle: dI!, walk: new Animation([dA!, dB!], 6), flip: false },
    up: { idle: uI!, walk: new Animation([uA!, uB!], 6), flip: false },
    right: { idle: sI!, walk: new Animation([sA!, sB!], 6), flip: false },
    left: { idle: sI!, walk: new Animation([sA!, sB!], 6), flip: true },
  };
}

export class Player extends Entity {
  speed = PLAYER_WALK_SPEED;
  moving = false;

  private input: Input;
  private map: Tilemap;
  private sprites: Record<Facing, FacingSprites>;

  constructor(input: Input, map: Tilemap, x: number, y: number) {
    super();
    this.input = input;
    this.map = map;
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: -5, offsetY: -8, w: 10, h: 8 };
    this.sprites = makeSprites();
    this.resetInterpolation();
  }

  override update(dt: number): void {
    // --- read directional input ---
    let dx = 0;
    let dy = 0;
    if (this.input.held("left")) dx -= 1;
    if (this.input.held("right")) dx += 1;
    if (this.input.held("up")) dy -= 1;
    if (this.input.held("down")) dy += 1;

    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      // Normalize so diagonals aren't faster.
      const len = Math.hypot(dx, dy);
      this.vx = (dx / len) * this.speed;
      this.vy = (dy / len) * this.speed;

      // Facing: dominant axis wins; horizontal wins ties so strafing reads well.
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.facing = dx > 0 ? "right" : "left";
      } else {
        this.facing = dy > 0 ? "down" : "up";
      }
      this.sprites[this.facing].walk.update(dt);
    } else {
      this.vx = 0;
      this.vy = 0;
      this.sprites[this.facing].walk.reset();
    }

    // --- move with axis-separated sliding collision ---
    const box = this.aabb;
    const res = moveAndCollide(box, this.vx * dt, this.vy * dt, this.map);
    this.x = res.x - this.hitbox.offsetX;
    this.y = res.y - this.hitbox.offsetY;
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const set = this.sprites[this.facing];
    const sprite = this.moving ? set.walk.frame : set.idle;
    // Anchor = center of feet; sprite is 16 wide, feet sit on row 22 of 24.
    const rx = this.renderX(alpha) - sprite.width / 2;
    const ry = this.renderY(alpha) - (sprite.height - 1);
    sprite.draw(ctx, rx, ry, set.flip);
  }
}

// Exported so other agents can reuse the player palette for related art.
export const PLAYER_PALETTE = PAL;
