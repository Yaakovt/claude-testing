/**
 * Hollow stalker (Iron stage) — the "RUN" lesson.
 * A gaunt, spirit-tainted thing that lurks around the northern buildings.
 * Faster than a Foundation artist in its prowl bursts and hits for most of
 * a Foundation health bar — books-accurate stage-gap horror. Escape is
 * genuinely viable: it slows to player parity while winding up its heavy
 * swing, pauses to "gather" between prowl bursts, and never strays more
 * than its leash from the ground it guards.
 */

import { Animation, definePixelFrames } from "../../engine/sprites.js";
import { makeStats, Stage, type Stats } from "../../systems/stats.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";

const PAL = {
  o: "#0f0d16", // outline
  K: "#1d1b26", // void-dark body
  k: "#2f2c3d", // body highlight
  C: "#aaabb4", // bone claws
  E: "#cfe8ee", // hollow pale eyes
  M: "#57407a", // spirit-taint wisps
};

// 18x24, lanky hunched biped, side view facing right (left = flipped).
const BODY = [
  "..................",
  "......ooo.........",
  ".....oKKKoo.......",
  ".....oKKKKKo......",
  ".....oKkEKKo......",
  "......oKKKo.......",
  "....ooKKKKoo......",
  "...oKKkKKKKKo.....",
  "..oKKKKKMKKKKo....",
  ".oKKkKKKKKKkKKo...",
  ".oKKKKKMKKKKKKo...",
  ".oKoKKKKKKKoKKo...",
  ".oKoKKkKKKKoKKo...",
  ".ooooKKKKKoooo....",
  ".oCo.oKKKKo.oCo...",
  ".oCo.oKKKKo.oCo...",
  ".oCo..oKKo..oCo...",
  "..o...oKKo...o....",
  "......oKKo........",
];

const FRAME_A = [
  ...BODY,
  ".....oKooKo.......",
  ".....oKo.oKo......",
  "....oKKo..oKo.....",
  "....oCCo..oCCo....",
  "..................",
];

const FRAME_B = [
  ...BODY,
  ".....oKooKo.......",
  "....oKo..oKo......",
  "....oKo...oKo.....",
  "...oCCo...oCCo....",
  "..................",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

const PROWL_SPEED = 135; // faster than the player (90)
const GATHER_SPEED = 60; // breather between prowl bursts
const WINDUP_SPEED = 55; // slower than the player — fleeing works
const PROWL_BURST = 0.8; // seconds of each prowl burst
const GATHER_TIME = 0.6; // seconds of each gather pause
const SWING_RANGE = 24;
const WINDUP_TIME = 0.5;
const RECOVER_TIME = 0.5;

export class HollowStalker extends Dreadbeast {
  stats: Stats = makeStats({
    maxHealth: 60,
    maxMadra: 0,
    attackPower: 9,
    defense: 3,
    moveSpeed: PROWL_SPEED,
    stage: Stage.Iron,
  });

  private anim = new Animation(frames, 8);

  constructor(world: EnemyContext, x: number, y: number) {
    super(world, x, y);
    this.displayName = "Iron dreadbeast";
    this.hitbox = { offsetX: -5, offsetY: -8, w: 10, h: 8 };
    this.aggroRadius = 80; // escapable — don't wander too close
    this.deaggroRadius = 200;
    this.leashRadius = 170; // it guards its ground, it doesn't hunt the map
    this.resetInterpolation();
  }

  protected override think(dt: number): void {
    const p = this.world.player;
    switch (this.state) {
      case "idle": // it lurks — no patrol, just stillness
      case "patrol":
        if (this.canSeePlayer()) this.setState("aggro");
        break;
      case "aggro": {
        if (this.shouldLeash()) {
          this.setState("leash");
          break;
        }
        if (this.distToPlayer() < SWING_RANGE) {
          this.setState("windup");
          break;
        }
        // Prowl bursts with gather pauses — terrifying but readable.
        const phase = this.stateTime % (PROWL_BURST + GATHER_TIME);
        const speed = phase < PROWL_BURST ? PROWL_SPEED : GATHER_SPEED;
        this.moveToward(p.x, p.y, speed, dt);
        break;
      }
      case "windup":
        // Still tracks, but at player-parity speed: run NOW.
        this.moveToward(p.x, p.y, WINDUP_SPEED, dt);
        if (this.stateTime >= WINDUP_TIME) {
          this.faceToward(p.x, p.y);
          this.world.combat.meleeAttack(this, [p], 16, 20, {
            multiplier: 1,
            knockback: 240,
            hitstun: 0.35,
            victimIframes: 0.6,
          });
          this.setState("recover");
        }
        break;
      case "attack": // resolved instantly out of windup
        this.setState("recover");
        break;
      case "recover":
        if (this.stateTime >= RECOVER_TIME) this.setState("aggro");
        break;
      case "stunned":
        this.setState("aggro");
        break;
      case "leash":
        this.leashStep(70, dt);
        break;
    }
    if (this.moved) this.anim.update(dt);
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    this.drawBeast(ctx, alpha, this.anim.frame);
  }
}
