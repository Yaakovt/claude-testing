/**
 * Wei Village (45x35) — the M4a STARTING map. Purple-roofed Wei clan town
 * on the valley floor, in sight of Samara's Ring (lore bible §1.1).
 *
 * Features: the family home inside an enterable walled courtyard (NW), the
 * clan square with the festival arena (a roped, flagged ring on stone
 * paving), the elder's hall (NE), two more homes, training dummies, festival
 * lanterns, laundry lines — and the south gate to the wilds, watched by a
 * guard until the story lets new artists through.
 *
 * New characters spawn in the courtyard, in front of the family home.
 */

import { buildFromAscii } from "./builder.js";
import type { MapEntry } from "./registry.js";

export const WEI_VILLAGE_ROWS: string[] = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T..................f........................T",
  "T..#############.............^^^^^^^^^^^^...T",
  "T..#.^^^^^^^^^.#.............^^^^^^^^^^^^...T",
  "T..#.^^^^^^^^^.#.............^^^^^^^^^^^^...T",
  "T..#.^^^^^^^^^.#.............############...T",
  "T..#.####D####.#.............#####D######...T",
  "T..#...........#..................P.........T",
  "T..#.y.........#..................P.........T",
  "T..#..f........#..................P.........T",
  "T..#...........#..................P.........T",
  "T..######P######..................P.........T",
  "T........P........................P.........T",
  "T........PPPPPPPPPPPPPPPPPPPPPPPPPP.........T",
  "T.............l................l............T",
  "T.............lssssssssssssssssl............T",
  "T..............ssrrrrrrrrrrrsss.............T",
  "T.........d....ssrsssssssssrsss.............T",
  "T..............ssrsssssssssrsss.............T",
  "T...........d..ssrsssssssssrsss.............T",
  "T..............ssrsssssssssrsss.............T",
  "T..............ssrrrrrsrrrrrsss.............T",
  "T..............ssssssssssssssss.............T",
  "T.............lssssssssssssssssl............T",
  "T...^^^^^^^^^.........P.........^^^^^^^^^...T",
  "T...^^^^^^^^^.........P.........^^^^^^^^^...T",
  "T...^^^^^^^^^.........P.........^^^^^^^^^...T",
  "T...####D####.........P.........####D####...T",
  "T.......P.............P.............P.......T",
  "T....y................P............f........T",
  "T.....................P.....................T",
  "T....................lPl....................T",
  "T....................PPP....................T",
  "T....................PPP....................T",
  "TTTTTTTTTTTTTTTTTTTTTPPPTTTTTTTTTTTTTTTTTTTTT",
];

/** New-character spawn: the courtyard, in front of the family home door. */
export const WEI_VILLAGE_SPAWN = { x: 9 * 16 + 8, y: 8 * 16 + 12 };

export const WEI_VILLAGE: MapEntry = {
  id: "weiVillage",
  name: "the Wei Village",
  build: () => buildFromAscii("weiVillage", WEI_VILLAGE_ROWS),
  spawn: { ...WEI_VILLAGE_SPAWN },
  entries: {
    /** Coming home through the south gate. */
    fromWilds: { x: 22 * 16 + 8, y: 32 * 16 + 12, facing: "up" },
  },
  transitions: [
    { zone: { tx: 21, ty: 33, w: 3, h: 2 }, to: "valleyWilds", entry: "fromVillage" },
  ],
  enemies: [], // the village is safe ground
  shrines: [
    { tx: 13, ty: 9 }, // the family courtyard's quiet corner
    { tx: 29, ty: 22 }, // beside the festival arena
  ],
  npcs: [], // content (src/content/*) adds the people
};
