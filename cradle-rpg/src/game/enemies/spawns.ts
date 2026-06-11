/**
 * Enemy spawning from map-registry data (M4a).
 *
 * Each MapEntry carries an EnemySpawn[] (kind + tile coords); World calls
 * spawnEnemies() on every map entry — enemies are PER-MAP state and respawn
 * on re-entry by design (story flags do not; see maps/registry.ts).
 *
 * Roster: slitherers are fodder, mad boars teach positioning, hollow
 * stalkers say RUN (until Iron).
 */

import { TILE_SIZE } from "../../engine/tilemap.js";
import { Dreadbeast, type EnemyContext } from "./dreadbeast.js";
import { Slitherer } from "./slitherer.js";
import { MadBoar } from "./boar.js";
import { HollowStalker } from "./stalker.js";

export type EnemyKind = "slitherer" | "boar" | "stalker";

export interface EnemySpawn {
  kind: EnemyKind;
  /** Tile coordinates (must be walkable — asserted by tools/checkworld.mjs). */
  tx: number;
  ty: number;
}

/** Build + register every enemy in a MapEntry's spawn table. */
export function spawnEnemies(spawns: EnemySpawn[], world: EnemyContext): Dreadbeast[] {
  const out: Dreadbeast[] = [];
  for (const s of spawns) {
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
