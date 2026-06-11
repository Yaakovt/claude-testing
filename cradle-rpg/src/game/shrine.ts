/**
 * Cycling/meditation shrines — small stone seats with incense, scattered
 * through the valley (an INVENTED FOR GAME fixture; Sacred Valley's clans
 * train at such places). They are where advancement happens: Copper is
 * confirmed in meditation here, and the Iron body-refining elixir is taken
 * here (src/game/advancementFlow.ts owns the interaction rules).
 *
 * Entities y-sort automatically, so the player walks behind/in front of the
 * seat correctly. The seat doesn't block movement — you sit on it.
 */

import { Entity } from "../engine/entity.js";
import { Animation, definePixelFrames } from "../engine/sprites.js";
import { TILE_SIZE } from "../engine/tilemap.js";

const PAL = {
  s: "#6f7077", // stone dark
  r: "#8d8e96", // stone mid
  R: "#aaabb4", // stone light
  i: "#7a5a3a", // incense stick
  e: "#d8743c", // ember
  m: "#9a93a8", // smoke
  M: "#b8b2c4", // smoke light
};

// 16x18 stone seat + incense bowl; two frames animate the ember/smoke.
const FRAME_A = [
  "......m.........",
  "................",
  "......M.........",
  ".....m..........",
  "......e.........",
  "......i.........",
  "....rRRr........",
  "....srrs........",
  "................",
  "...RRRRRRRR.....",
  "..rRRRRRRRRr....",
  "..rrrrrrrrrr....",
  "...srrssrrs.....",
  "...srrssrrs.....",
  "...ssrssrss.....",
  "..ssssssssss....",
  "................",
  "................",
];

const FRAME_B = [
  "................",
  "......m.........",
  ".....M..........",
  "......m.........",
  "......e.........",
  "......i.........",
  "....rRRr........",
  "....srrs........",
  "................",
  "...RRRRRRRR.....",
  "..rRRRRRRRRr....",
  "..rrrrrrrrrr....",
  "...srrssrrs.....",
  "...srrssrrs.....",
  "...ssrssrss.....",
  "..ssssssssss....",
  "................",
  "................",
];

const frames = definePixelFrames([FRAME_A, FRAME_B], PAL);

export class Shrine extends Entity {
  private anim = new Animation(frames, 2);

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
    this.hitbox = { offsetX: -6, offsetY: -6, w: 12, h: 6 };
    this.resetInterpolation();
  }

  override update(dt: number): void {
    this.anim.update(dt);
  }

  override draw(ctx: CanvasRenderingContext2D, alpha: number): void {
    const sprite = this.anim.frame;
    sprite.draw(
      ctx,
      this.renderX(alpha) - sprite.width / 2 + 1,
      this.renderY(alpha) - (sprite.height - 2),
    );
  }
}

/** Build a MapEntry's shrines (tile coords -> world-pixel placement, like
 *  enemies/spawns.ts; tools/checkworld.mjs asserts each spot is walkable). */
export function spawnShrines(
  spots: { tx: number; ty: number }[],
  add: (s: Shrine) => Shrine,
): Shrine[] {
  return spots.map((p) =>
    add(new Shrine(p.tx * TILE_SIZE + TILE_SIZE / 2, p.ty * TILE_SIZE + TILE_SIZE * 0.75)),
  );
}
