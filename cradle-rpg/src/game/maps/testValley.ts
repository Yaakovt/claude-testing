/**
 * Test Valley — a 40x30 slice of Sacred Valley for Milestone 1.
 *
 * Authored as an ASCII grid (one char per tile) and expanded into the three
 * Tilemap layers. Features: a pond, two Wei-clan buildings, a walled
 * courtyard with a gated opening, and a dirt path winding from the southern
 * trailhead past both buildings.
 *
 * Legend:
 *   .  grass (variant auto-picked)     P  dirt path
 *   W  water (animated, solid)         T  tree   (solid, y-sorted)
 *   R  rock  (solid, y-sorted)         f  flowers (walkable decor)
 *   #  wooden wall (solid)             ^  roof (solid)
 *   D  door (solid in M1 — interiors come later)
 */

import { Tilemap, type TilemapData } from "../../engine/tilemap.js";
import { T, TILESET } from "../tiles.js";

export const TEST_VALLEY_ROWS: string[] = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T.TT.....................WWWWW.........T",
  "T....f..................WWWWWWW....T...T",
  "T...^^^^^^^^...........WWWWWWWWW...T...T",
  "T...^^^^^^^^..R........WWWWWWWWW.......T",
  "T...^^^^^^^^............WWWWWWW.....f..T",
  "T...########....f........WWWWW.........T",
  "T...###D####..............WWW.....T....T",
  "T..f...P..........................T....T",
  "T......P.............R.................T",
  "T......PPPPPPPPPPPPPPPPPPPPPPPPPP......T",
  "T..T.............P.....................T",
  "T..T.T.......####P####.....^^^^^^^^....T",
  "T............#...P...#.....^^^^^^^^....T",
  "T............#.ffP.R.#.....^^^^^^^^....T",
  "T............#.f...f.#.....########....T",
  "T............#.......#.....###D####....T",
  "T............#..R..f.#........P........T",
  "T............#########........P........T",
  "T.......R.....................P.....T..T",
  "T....T..................f.....P........T",
  "T.................PPPPPPPPPPPPP........T",
  "T........R........P..............T.T...T",
  "T.................P.......f............T",
  "T..TT.............P...........R........T",
  "T......f..........P....................T",
  "T..TT.............P..............T.....T",
  "T.................P......R.............T",
  "T...........f.....P....................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

/** Player spawn (world pixels) — on the southern trail. */
export const TEST_VALLEY_SPAWN = { x: 18 * 16 + 8, y: 26 * 16 + 12 };

/** Deterministic per-cell hash for grass variety. */
function grassVariant(x: number, y: number): number {
  const n = (x * 73856093) ^ (y * 19349663);
  const r = (n >>> 4) % 10;
  if (r < 7) return T.GRASS1;
  return r < 9 ? T.GRASS2 : T.GRASS3;
}

export function buildTestValleyData(): TilemapData {
  const height = TEST_VALLEY_ROWS.length;
  const width = TEST_VALLEY_ROWS[0]!.length;
  const ground: number[][] = [];
  const decor: number[][] = [];
  const collision: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row = TEST_VALLEY_ROWS[y]!;
    if (row.length !== width) {
      throw new Error(`testValley row ${y}: ${row.length} chars, expected ${width}`);
    }
    const g: number[] = [];
    const d: number[] = [];
    const c: number[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x]!;
      let groundId = grassVariant(x, y);
      let decorId = -1;
      switch (ch) {
        case ".": break;
        case "P": groundId = T.PATH; break;
        case "W": groundId = T.WATER; break;
        case "#": groundId = T.WALL; break;
        case "^": groundId = T.ROOF; break;
        case "D": groundId = T.DOOR; break;
        case "T": decorId = T.TREE; break;
        case "R": decorId = T.ROCK; break;
        case "f": decorId = T.FLOWERS; break;
        default:
          throw new Error(`testValley: unknown tile char '${ch}' at ${x},${y}`);
      }
      const solid =
        TILESET[groundId]!.solid || (decorId >= 0 && TILESET[decorId]!.solid);
      g.push(groundId);
      d.push(decorId);
      c.push(solid ? 1 : 0);
    }
    ground.push(g);
    decor.push(d);
    collision.push(c);
  }

  return { width, height, ground, decor, collision };
}

export function createTestValley(): Tilemap {
  return new Tilemap(buildTestValleyData(), TILESET);
}
