/**
 * Enforcer (M5) — a HUMANOID hostile: an Iron sacred artist in school
 * colors. The M4b "Heaven's Glory enforcer" spawns (act3/the pursuit) were
 * placeholder stalkers; this is their real body. Reuses the Dreadbeast AI
 * base (it's a generic aggro/leash brain, not beast-specific) but:
 *
 *  - `leavesRemnant = true` — a sacred artist's spirit tears free on death
 *    (lore §6.1); World.combat.onDeath spawns the hostile Remnant
 *    (src/game/remnant.ts). Dreadbeasts still never leave one (§6.3).
 *  - readable swordsman pattern: advance, a told windup, one heavy cut,
 *    recover. Slightly slower than the wilds stalker but better drilled
 *    (higher defense).
 */

import { Animation, definePixelFrames } from "../../engine/sprites.js";
import { makeStats, Stage, type Stats } from "../../systems/stats.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";

const PAL = {
  o: "#15131c", // outline / hair
  R: "#e8dcc4", // cream school robe
  r: "#c4b89c", // robe shade
  G: "#c9a85c", // gold trim
  S: "#e6b48d", // skin
  E: "#1a1a24", // eyes
  B: "#aaabb4", // blade
  F: "#3a3142", // boots
};

// 16x24 robed swordsman, side view facing right (left = flipped).
const BODY = [
  "................",
  ".....oooooo.....",
  "....oooooooo....",
  "....oooSSSSo....",
  "....ooSSESSS....",
  "....ooSSSSS.....",
  ".....SSSSS......",
  ".....RRRRRR.....",
  "....RRRRRRRR..B.",
  "...RRRRGRRRR..B.",
  "...RRRRGRRRRS.B.",
  "...RRRRGRRRRSBB.",
  "...RGGGGGGGR.B..",
  "...RRRRGRRRR....",
  "...RRRRGRRRR....",
  "...RRRRRRRRR....",
  "...RRRRRRRRR....",
  "...rRRRRRRRr....",
  "...rrRRRRRrr....",
  "....rrrrrrr.....",
];

const FRAME_A = [...BODY, "....FF...FF.....", "................", "................", "................"];
const FRAME_B = [...BODY, ".....FFFF.......", "................", "................", "................"];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

const CHASE_SPEED = 92; // just over a Foundation walk; an Iron player outruns it
const WINDUP_SPEED = 40; // it plants its feet for the cut — punish window
const SWING_RANGE = 22;
const WINDUP_TIME = 0.45;
const RECOVER_TIME = 0.6;

export class Enforcer extends Dreadbeast {
  stats: Stats = makeStats({
    maxHealth: 55,
    maxMadra: 10,
    attackPower: 9,
    defense: 4,
    moveSpeed: CHASE_SPEED,
    stage: Stage.Iron,
  });

  private anim = new Animation(frames, 7);

  constructor(world: EnemyContext, x: number, y: number) {
    super(world, x, y);
    this.displayName = "Iron sacred artist";
    this.hitbox = { offsetX: -5, offsetY: -8, w: 10, h: 8 };
    this.aggroRadius = 90; // drilled sentries watch their ground
    this.deaggroRadius = 210;
    this.leashRadius = 190;
    // A HUMAN. The spirit tears free when the body dies (lore §6.1).
    this.leavesRemnant = true;
    this.resetInterpolation();
  }

  protected override think(dt: number): void {
    const p = this.world.player;
    switch (this.state) {
      case "idle":
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
        this.moveToward(p.x, p.y, CHASE_SPEED, dt);
        break;
      }
      case "windup":
        this.moveToward(p.x, p.y, WINDUP_SPEED, dt);
        if (this.stateTime >= WINDUP_TIME) {
          this.faceToward(p.x, p.y);
          this.world.combat.meleeAttack(this, [p], 16, 18, {
            multiplier: 1,
            knockback: 200,
            hitstun: 0.3,
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
