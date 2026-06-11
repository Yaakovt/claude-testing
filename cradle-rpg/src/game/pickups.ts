/**
 * Pickups. M2: "scales" — currency Forged from madra (lore bible §2.3).
 * Dreadbeasts can't leave Remnants, so their madra-tainted flesh renders
 * down to a scale or three; mechanically they're glowing diamonds the
 * player walks over to collect.
 */

import { Entity } from "../engine/entity.js";
import { aabbOverlap } from "../engine/collision.js";
import { Animation, definePixelFrames } from "../engine/sprites.js";

const PAL = {
  o: "#5d86b0", // dim edge
  c: "#7fb4d8", // edge
  m: "#bfe3f2", // madra core
  W: "#eaf6fc", // glint
};

// 7x8 forged-madra diamond, two glow frames.
const FRAME_A = [
  "...c...",
  "..cmc..",
  ".cmmmc.",
  "cmmWmmc",
  ".cmmmc.",
  "..cmc..",
  "...c...",
  "...o...",
];

const FRAME_B = [
  "...o...",
  "..cmc..",
  ".cmWmc.",
  "cmWWWmc",
  ".cmWmc.",
  "..cmc..",
  "...o...",
  "...o...",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

const LIFETIME = 60; // seconds before an uncollected scale fades away

export class ScalePickup extends Entity {
  readonly value = 1;

  private anim = new Animation(frames, 3);
  private t = Math.random() * Math.PI * 2;
  private life = LIFETIME;

  constructor(
    x: number,
    y: number,
    private collector: Entity,
    private onCollect: (value: number) => void,
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
      this.onCollect(this.value);
    }
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const bob = Math.sin(this.t * 3) * 1.5;
    const sprite = this.anim.frame;
    const fade = this.life < 3 ? Math.max(0.2, this.life / 3) : 1;
    ctx.globalAlpha = fade;
    sprite.draw(ctx, this.renderX(alpha) - sprite.width / 2, this.renderY(alpha) - sprite.height + bob);
    ctx.globalAlpha = 1;
  }
}
