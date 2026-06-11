/**
 * Mad boar dreadbeast (Copper stage) — the positioning teacher.
 * Telegraphed charge that overshoots; slamming into a wall leaves it
 * stunned and extra-vulnerable for a long punish window.
 */

import { Animation, definePixelFrames } from "../../engine/sprites.js";
import { makeStats, Stage, type Stats } from "../../systems/stats.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";

const PAL = {
  o: "#2e2218", // outline
  B: "#5d4126", // hide
  b: "#4a3119", // dark bristle
  H: "#7a5a3a", // light bristle
  T: "#e3dcc4", // tusk
  E: "#cc4434", // mad red eye
  M: "#6d4f94", // madra-scarred corruption streaks
};

// 20x14, side view facing right (left = flipped). Two walk frames.
const BODY = [
  "....................",
  ".......ooooooo......",
  ".....oobbMbbboo.....",
  "....oBBbBBBMBBoo....",
  "...oBBBBBBBBBBBBo...",
  "..oBBMBBBBBBBBBBoo..",
  "..oBBBBBBBBBBBoBBo..",
  ".oHBBBBBBBBBBooBEo..",
  ".oHBBBBBBBBBBoBBBo..",
  ".oHBBBBBBBBBBBBBoo..",
  "..oBBBBBBBBBBBBoT...",
  "...oBBBBBBBBBBo.T...",
];

const FRAME_A = [
  ...BODY,
  "...obbo...obbo......",
  "...oo.o...oo.o......",
];

const FRAME_B = [
  ...BODY,
  "....obbo...obbo.....",
  "....o.oo...o.oo.....",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

const WALK_SPEED = 32;
const APPROACH_SPEED = 38;
const CHARGE_SPEED = 230;
const CHARGE_TRIGGER_RANGE = 100;
const OVERSHOOT = 48;
const WINDUP_TIME = 0.55;
const RECOVER_TIME = 0.9;
const WALL_STUN_TIME = 1.3;

export class MadBoar extends Dreadbeast {
  stats: Stats = makeStats({
    maxHealth: 26,
    maxMadra: 0,
    attackPower: 8,
    defense: 1,
    moveSpeed: WALK_SPEED,
    stage: Stage.Copper,
  });

  private anim = new Animation(frames, 7);
  private chargeX = 1;
  private chargeY = 0;
  private chargeDist = 0;
  private chargeTraveled = 0;
  private chargeHit = false;

  constructor(world: EnemyContext, x: number, y: number) {
    super(world, x, y);
    this.displayName = "Copper dreadbeast";
    this.hitbox = { offsetX: -8, offsetY: -7, w: 16, h: 7 };
    this.aggroRadius = 90;
    this.deaggroRadius = 180;
    this.leashRadius = 160;
    this.resetInterpolation();
  }

  protected override think(dt: number): void {
    const p = this.world.player;
    switch (this.state) {
      case "idle":
        if (this.canSeePlayer()) this.setState("aggro");
        else if (this.stateTime > 2) {
          this.pickPatrolPoint(50);
          this.setState("patrol");
        }
        break;
      case "patrol":
        if (this.canSeePlayer()) this.setState("aggro");
        else if (this.patrolStep(WALK_SPEED, dt) || this.stateTime > 4) this.setState("idle");
        break;
      case "aggro":
        if (this.shouldLeash()) {
          this.setState("leash");
          break;
        }
        if (this.distToPlayer() < CHARGE_TRIGGER_RANGE) {
          this.setState("windup"); // paw the ground — the tell
        } else {
          this.moveToward(p.x, p.y, APPROACH_SPEED, dt);
        }
        break;
      case "windup":
        this.faceToward(p.x, p.y); // tracks until the moment it commits
        if (this.stateTime >= WINDUP_TIME) {
          const d = Math.max(1, this.distToPlayer());
          this.chargeX = (p.x - this.x) / d;
          this.chargeY = (p.y - this.y) / d;
          this.chargeDist = d + OVERSHOOT; // always overshoots its mark
          this.chargeTraveled = 0;
          this.chargeHit = false;
          this.setState("attack");
        }
        break;
      case "attack": {
        const res = this.moveDir(this.chargeX, this.chargeY, CHARGE_SPEED, dt);
        this.chargeTraveled += CHARGE_SPEED * dt;
        if (!this.chargeHit) {
          this.chargeHit = this.world.combat.touchAttack(this, p, {
            multiplier: 1.2,
            knockback: 220,
            hitstun: 0.3,
          });
        }
        if (res.hitWall) {
          // Slammed into a wall: dazed and extra vulnerable. Punish it.
          this.vulnerability = 1.5;
          this.setState("stunned");
        } else if (this.chargeHit || this.chargeTraveled >= this.chargeDist) {
          this.setState("recover");
        }
        break;
      }
      case "recover":
        if (this.stateTime >= RECOVER_TIME) this.setState("aggro");
        break;
      case "stunned":
        if (this.stateTime >= WALL_STUN_TIME) {
          this.vulnerability = 1;
          this.setState("aggro");
        }
        break;
      case "leash":
        this.leashStep(WALK_SPEED + 10, dt);
        break;
    }
    if (this.moved) this.anim.update(dt * (this.state === "attack" ? 2 : 1));
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    this.drawBeast(ctx, alpha, this.anim.frame);
  }
}
