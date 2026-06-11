/**
 * Slithering dreadbeast (Foundation stage) — the starter food.
 * A spirit-mangled serpent that haunts the fields near the southern trail.
 * Slow patroller; telegraphed lunge bite; low HP.
 */

import { Animation, definePixelFrames } from "../../engine/sprites.js";
import { makeStats, Stage, type Stats } from "../../systems/stats.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";

const PAL = {
  o: "#26301c", // outline
  s: "#46532e", // dark scale
  S: "#5a6b3c", // scale
  B: "#b8b294", // pale belly plates
  E: "#cc4434", // mad red eye
};

// 16x12, top-down coiled serpent, head left. Two frames = slither wiggle.
const FRAME_A = [
  "................",
  "..ooo...........",
  ".oSSSo...oooo...",
  ".oSESSo.oSSSSo..",
  ".oSSSSooSSsSSSo.",
  "..oSSSSSSooSSSo.",
  "...ooSSSo..oSSo.",
  ".....ooo...oSSo.",
  "..ooo......oSSo.",
  ".oSSSo....oSSSo.",
  "..oSSSooooSSSo..",
  "...ooBBBBBoo....",
];

const FRAME_B = [
  "................",
  "..ooo...........",
  ".oSSSo....oooo..",
  ".oSESSo..oSSSSo.",
  ".oSSSSo.oSsSSSo.",
  "..oSSSSooSSSSo..",
  "...ooSSSSSSoo...",
  ".....oooooo.....",
  "..ooo.....ooo...",
  ".oSSSo...oSSSo..",
  "..oSSSooooSSo...",
  "...ooBBBBBoo....",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

const PATROL_SPEED = 26;
const CHASE_SPEED = 45;
const LUNGE_SPEED = 175;
const LUNGE_RANGE = 26;
const WINDUP_TIME = 0.35;
const LUNGE_TIME = 0.16;
const RECOVER_TIME = 0.7;

export class Slitherer extends Dreadbeast {
  stats: Stats = makeStats({
    maxHealth: 14,
    maxMadra: 0,
    attackPower: 4,
    defense: 0,
    moveSpeed: CHASE_SPEED,
    stage: Stage.Foundation,
  });

  private anim = new Animation(frames, 6);
  private lungeX = 1;
  private lungeY = 0;

  constructor(world: EnemyContext, x: number, y: number) {
    super(world, x, y);
    this.displayName = "Foundation dreadbeast";
    this.hitbox = { offsetX: -6, offsetY: -5, w: 12, h: 5 };
    this.aggroRadius = 70;
    this.deaggroRadius = 150;
    this.leashRadius = 120;
    this.resetInterpolation();
  }

  protected override think(dt: number): void {
    const p = this.world.player;
    switch (this.state) {
      case "idle":
        if (this.canSeePlayer()) this.setState("aggro");
        else if (this.stateTime > 1.5) {
          this.pickPatrolPoint(40);
          this.setState("patrol");
        }
        break;
      case "patrol":
        if (this.canSeePlayer()) this.setState("aggro");
        else if (this.patrolStep(PATROL_SPEED, dt) || this.stateTime > 4) this.setState("idle");
        break;
      case "aggro": {
        if (this.shouldLeash()) {
          this.setState("leash");
          break;
        }
        if (this.distToPlayer() < LUNGE_RANGE) {
          this.faceToward(p.x, p.y);
          this.setState("windup");
        } else {
          this.moveToward(p.x, p.y, CHASE_SPEED, dt);
        }
        break;
      }
      case "windup":
        this.faceToward(p.x, p.y);
        if (this.stateTime >= WINDUP_TIME) {
          const d = Math.max(1, this.distToPlayer());
          this.lungeX = (p.x - this.x) / d;
          this.lungeY = (p.y - this.y) / d;
          this.setState("attack");
        }
        break;
      case "attack": {
        this.moveDir(this.lungeX, this.lungeY, LUNGE_SPEED, dt);
        const bit = this.world.combat.touchAttack(this, p, {
          multiplier: 1,
          knockback: 130,
          hitstun: 0.2,
        });
        if (bit || this.stateTime >= LUNGE_TIME) this.setState("recover");
        break;
      }
      case "recover":
        if (this.stateTime >= RECOVER_TIME) this.setState("aggro");
        break;
      case "stunned": // unused by this beast
        this.setState("aggro");
        break;
      case "leash":
        this.leashStep(40, dt);
        break;
    }
    if (this.moved) this.anim.update(dt);
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    this.drawBeast(ctx, alpha, this.anim.frame);
  }
}
