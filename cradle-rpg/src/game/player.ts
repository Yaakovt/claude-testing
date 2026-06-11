/**
 * The player: a young sacred artist of the Wei clan (black hair, white robe
 * with purple trim), still at Foundation.
 *
 * 8-directional movement (diagonals normalized), ~90 px/s, axis-separated
 * sliding collision, 4-direction facing with a 2-frame walk cycle.
 * Sprite is 16x24; the left-facing frames are the right-facing frames
 * flipped at draw time.
 *
 * M2: the Player is a Combatant (stats, knockback, i-frames, hit flash) and
 * delegates attacks/dodge/cycling/techniques to PlayerCombat — call
 * wireCombat() once after construction.
 */

import { Animation, definePixelFrames, type PixelSprite } from "../engine/sprites.js";
import { type Facing } from "../engine/entity.js";
import type { EntityManager } from "../engine/entity.js";
import { moveAndCollide } from "../engine/collision.js";
import type { Input } from "../engine/input.js";
import type { Tilemap } from "../engine/tilemap.js";
import { Combatant, facingVector, type CombatSystem } from "../systems/combat.js";
import { makeStats, Stage, type Stats } from "../systems/stats.js";
import type { FxManager } from "../systems/fx.js";
import { PlayerCombat } from "./playerCombat.js";
import { PATHS, type OriginId } from "./paths.js";

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

/** Iron benefit: the sash darkens to iron-grey — the body remade. */
const IRON_PAL = { ...PAL, p: "#5a6470", P: "#7d88a0" };

function makeSprites(pal: Record<string, string>): Record<Facing, FacingSprites> {
  const [dI, dA, dB] = definePixelFrames([downIdle, downWalkA, downWalkB], pal);
  const [uI, uA, uB] = definePixelFrames([upIdle, upWalkA, upWalkB], pal);
  const [sI, sA, sB] = definePixelFrames([sideIdle, sideWalkA, sideWalkB], pal);
  return {
    down: { idle: dI!, walk: new Animation([dA!, dB!], 6), flip: false },
    up: { idle: uI!, walk: new Animation([uA!, uB!], 6), flip: false },
    right: { idle: sI!, walk: new Animation([sA!, sB!], 6), flip: false },
    left: { idle: sI!, walk: new Animation([sA!, sB!], 6), flip: true },
  };
}

export class Player extends Combatant {
  stats: Stats;

  /** Character creation choices (M3). */
  readonly origin: OriginId;

  /** False during the death/respawn sequence (main.ts drives it). */
  controlEnabled = true;
  moving = false;
  /** Combat controller; assigned by wireCombat() right after construction. */
  pc: PlayerCombat | null = null;

  private input: Input;
  private map: Tilemap;
  private sprites: Record<Facing, FacingSprites>;
  /** Recent positions while the White Fox Cloak runs (afterimages). */
  private trail: { x: number; y: number }[] = [];

  constructor(
    input: Input,
    map: Tilemap,
    x: number,
    y: number,
    origin: OriginId = "wei",
    name = "Wei disciple",
  ) {
    super();
    this.input = input;
    this.map = map;
    this.x = x;
    this.y = y;
    this.origin = origin;
    // All starts share a Foundation body; the Unsouled's pure core runs a
    // little deeper (lore: weak but UNDEVELOPED, not absent — and pure).
    this.stats = makeStats({
      maxHealth: 40,
      maxMadra: PATHS[origin].baseMaxMadra,
      attackPower: 6,
      defense: 1,
      moveSpeed: PLAYER_WALK_SPEED,
      stage: Stage.Foundation,
    });
    this.hitbox = { offsetX: -5, offsetY: -8, w: 10, h: 8 };
    this.sprites = makeSprites(PAL);
    this.displayName = name;
    this.despawnOnDeath = false; // death = fade + respawn, handled in main.ts
    this.leavesRemnant = true; // a sacred artist (unused while we respawn)
    this.resetInterpolation();
  }

  /** Hook up the combat system (call once from main after construction). */
  wireCombat(combat: CombatSystem, entities: EntityManager, fx: FxManager | null): void {
    this.pc = new PlayerCombat(this, this.input, combat, entities, fx, this.map);
  }

  /** Point movement/techniques at a new Tilemap (M4a map transitions). */
  setMap(map: Tilemap): void {
    this.map = map;
    this.pc?.setMap(map);
  }

  /** Iron stage-up: rebake the sprite set with the iron-grey sash. */
  applyIronLook(): void {
    this.sprites = makeSprites(IRON_PAL);
  }

  get cyclingActive(): boolean {
    return this.pc?.cycling ?? false;
  }

  override update(dt: number): void {
    const blocked = this.tickCombat(dt, this.map);
    const canAct = !blocked && this.controlEnabled && this.stats.health > 0;

    // --- read directional input ---
    let dx = 0;
    let dy = 0;
    if (canAct) {
      if (this.input.held("left")) dx -= 1;
      if (this.input.held("right")) dx += 1;
      if (this.input.held("up")) dy -= 1;
      if (this.input.held("down")) dy += 1;
    }

    this.pc?.update(dt, canAct, dx, dy);

    // --- decide velocity ---
    let vx = 0;
    let vy = 0;
    const override = canAct ? (this.pc?.velocityOverride() ?? null) : null;
    if (override) {
      vx = override.x;
      vy = override.y;
    } else if (canAct && (dx !== 0 || dy !== 0)) {
      // Normalize so diagonals aren't faster.
      const len = Math.hypot(dx, dy);
      const speed = this.stats.moveSpeed * this.speedMult * (this.pc?.speedFactor ?? 1);
      vx = (dx / len) * speed;
      vy = (dy / len) * speed;

      // Facing: dominant axis wins; horizontal wins ties so strafing reads well.
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.facing = dx > 0 ? "right" : "left";
      } else {
        this.facing = dy > 0 ? "down" : "up";
      }
    }

    this.vx = vx;
    this.vy = vy;
    this.moving = vx !== 0 || vy !== 0;
    if (this.moving) {
      this.sprites[this.facing].walk.update(dt);
    } else {
      this.sprites[this.facing].walk.reset();
    }

    // --- move with axis-separated sliding collision ---
    if (this.moving) {
      const res = moveAndCollide(this.aabb, this.vx * dt, this.vy * dt, this.map);
      this.x = res.x - this.hitbox.offsetX;
      this.y = res.y - this.hitbox.offsetY;
    }

    // White Fox Cloak afterimage trail.
    if (this.evasionTimer > 0) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 12) this.trail.shift();
    } else if (this.trail.length > 0) {
      this.trail.length = 0;
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const cx = this.renderX(alpha);
    const cy = this.renderY(alpha);

    // Cycling aura: soft pulsing rings of madra around the artist.
    if (this.pc?.cycling) {
      const t = this.pc.cycleTime;
      const pulse = Math.sin(t * 5);
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(138, 108, 192, ${0.45 + 0.2 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 11 + pulse * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(186, 164, 224, ${0.25 + 0.15 * -pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 6.5 - pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const set = this.sprites[this.facing];
    const sprite = this.moving ? set.walk.frame : set.idle;
    // Anchor = center of feet; sprite is 16 wide, feet sit on row 22 of 24.
    const rx = cx - sprite.width / 2;
    const ry = cy - (sprite.height - 1);

    // White Fox Cloak: ghost afterimages trail the true body.
    if (this.evasionTimer > 0 && this.trail.length > 4) {
      const ghosts: [number, number][] = [
        [Math.max(0, this.trail.length - 9), 0.12],
        [Math.max(0, this.trail.length - 5), 0.22],
      ];
      for (const [idx, a] of ghosts) {
        const g = this.trail[idx];
        if (!g) continue;
        ctx.globalAlpha = a;
        sprite.draw(ctx, g.x - sprite.width / 2, g.y - (sprite.height - 1), set.flip);
      }
      ctx.globalAlpha = 1;
    }

    // Stone Mantle: orbiting Forged stone chips.
    if (this.armorTimer > 0) {
      const t = this.armorTimer * 4;
      ctx.fillStyle = "#8d8e96";
      for (let i = 0; i < 3; i++) {
        const a = t + (i * Math.PI * 2) / 3;
        ctx.fillRect(
          Math.round(cx + Math.cos(a) * 10) - 1,
          Math.round(cy - 10 + Math.sin(a) * 4) - 1,
          2,
          2,
        );
      }
    }

    // Still Surface: a ring of still water shimmers during the parry stance.
    if (this.parryTimer > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(191, 227, 242, ${0.5 + 0.4 * Math.sin(this.parryTimer * 40)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.drawWithEffects(ctx, sprite, rx, ry, set.flip);

    // Short-lived slash arc in front of the player when a swing starts.
    const slash = this.pc?.slashAlpha ?? 0;
    if (slash > 0) {
      const { dx, dy } = facingVector(this.facing);
      const ang = Math.atan2(dy, dx);
      ctx.save();
      ctx.strokeStyle = `rgba(242, 236, 216, ${0.7 * slash})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 13, ang - 0.7, ang + 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Exported so other agents can reuse the player palette for related art.
export const PLAYER_PALETTE = PAL;
