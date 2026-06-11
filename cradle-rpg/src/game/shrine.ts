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

/** Shrine placements on testValley (tile coords; tools/checkmap.mjs asserts
 *  each is walkable and reachable from spawn). */
export const TEST_VALLEY_SHRINES: { tx: number; ty: number }[] = [
  { tx: 21, ty: 25 }, // southern trail, near the spawn
  { tx: 16, ty: 16 }, // the walled courtyard's quiet heart
  { tx: 30, ty: 9 }, // northeast, in sight of the pond's water aura
];

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

/** Build the testValley shrines (world-pixel placement like spawns.ts). */
export function spawnTestValleyShrines(add: (s: Shrine) => Shrine): Shrine[] {
  return TEST_VALLEY_SHRINES.map((p) =>
    add(new Shrine(p.tx * TILE_SIZE + TILE_SIZE / 2, p.ty * TILE_SIZE + TILE_SIZE * 0.75)),
  );
}
