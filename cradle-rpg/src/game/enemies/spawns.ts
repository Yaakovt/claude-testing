/**
 * Enemy placement for the testValley map.
 *
 * Zones (see maps/testValley.ts ASCII):
 *  - Slitherers haunt the southern fields near the player spawn — fodder.
 *  - Mad boars roam mid-map open ground — the positioning lesson.
 *  - ONE hollow stalker guards the northern building's courtyard. At
 *    Foundation it says, clearly: RUN.
 */

import { TILE_SIZE } from "../../engine/tilemap.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";
import { Slitherer } from "./slitherer.js";
import { MadBoar } from "./boar.js";
import { HollowStalker } from "./stalker.js";

export type EnemyKind = "slitherer" | "boar" | "stalker";

export interface EnemySpawn {
  kind: EnemyKind;
  /** Tile coordinates (must be walkable — asserted by tools/smoke.mjs). */
  tx: number;
  ty: number;
}

export const TEST_VALLEY_ENEMIES: EnemySpawn[] = [
  // Southern fields, near the trailhead spawn.
  { kind: "slitherer", tx: 10, ty: 25 },
  { kind: "slitherer", tx: 24, ty: 24 },
  { kind: "slitherer", tx: 30, ty: 26 },
  // Mid-map open ground.
  { kind: "boar", tx: 9, ty: 11 },
  { kind: "boar", tx: 24, ty: 9 },
  { kind: "boar", tx: 30, ty: 20 },
  // The northern building's doorstep. One is enough.
  { kind: "stalker", tx: 9, ty: 8 },
];

export function spawnTestValleyEnemies(world: EnemyContext): Dreadbeast[] {
  const out: Dreadbeast[] = [];
  for (const s of TEST_VALLEY_ENEMIES) {
    const x = s.tx * TILE_SIZE + TILE_SIZE / 2;
    const y = s.ty * TILE_SIZE + TILE_SIZE * 0.75;
    let beast: Dreadbeast;
    switch (s.kind) {
      case "slitherer":
        beast = new Slitherer(world, x, y);
        break;
      case "boar":
        beast = new MadBoar(world, x, y);
        break;
      case "stalker":
        beast = new HollowStalker(world, x, y);
        break;
    }
    out.push(world.entities.add(beast));
  }
  return out;
}
