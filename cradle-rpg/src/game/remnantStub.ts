/**
 * Remnant STUB — placeholder for the M5 Remnant system.
 *
 * Canon (lore bible §6.1): when a sacred artist or sacred beast dies, its
 * spirit tears free as a Remnant — a living madra-creature. Dreadbeasts
 * never leave one (their spirit is fused into the flesh, §6.3), so nothing
 * in M2 actually spawns this except future humanoid foes via the
 * `leavesRemnant` flag handled in main.ts.
 *
 * TODO(M5): replace with the real Remnant system —
 *  - hostile Remnant AI (degraded versions of the dead artist's techniques)
 *  - Soulsmithing harvest (bindings, drudge-assisted dismantling)
 *  - Gold-advancement absorption hook
 * For now: a harmless, static, spirit-colored wisp that fades after a few
 * seconds.
 */

import { Entity } from "../engine/entity.js";
import { Animation, definePixelFrames } from "../engine/sprites.js";

const PAL = {
  w: "#9db8e8", // spirit blue
  W: "#cfdfef", // bright wisp
  v: "#b88fd4", // madra violet
};

// 12x16 abstract spirit wisp, two drift frames.
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

const LIFETIME = 4;

export class RemnantStub extends Entity {
  private anim = new Animation(frames, 4);
  private life = LIFETIME;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: -4, offsetY: -6, w: 8, h: 6 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.anim.update(dt);
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const sprite = this.anim.frame;
    const fade = Math.min(1, this.life / (LIFETIME * 0.5));
    ctx.globalAlpha = 0.75 * fade;
    sprite.draw(ctx, this.renderX(alpha) - sprite.width / 2, this.renderY(alpha) - sprite.height + 1);
    ctx.globalAlpha = 1;
  }
}
