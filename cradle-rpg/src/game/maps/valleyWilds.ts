/**
 * Valley Wilds — the M1 "testValley", renamed and kept as the middle zone
 * of the M4a world: the dreadbeast-haunted wilderness between the Wei
 * village and the foot of Mount Samara.
 *
 * Changes from testValley: a WEST opening (south-west corner) connecting to
 * the Wei village's south gate, and a NORTH opening to the Samara trail.
 * Everything else — pond, buildings, courtyard, enemies, shrines — is the
 * M1-M3 layout, so prior coordinates still hold.
 */

import { buildFromAscii } from "./builder.js";
import type { MapEntry } from "./registry.js";

export const VALLEY_WILDS_ROWS: string[] = [
  "TTTTTTTTTTTTTTTTTTPPTTTTTTTTTTTTTTTTTTTT",
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
  "P.................P.......f............T",
  "P..TT.............P...........R........T",
  "T......f..........P....................T",
  "T..TT.............P..............T.....T",
  "T.................P......R.............T",
  "T...........f.....P....................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
];

/** Player spawn (world pixels) — on the southern trail (the M1-M3 spot). */
export const VALLEY_WILDS_SPAWN = { x: 18 * 16 + 8, y: 26 * 16 + 12 };

export const VALLEY_WILDS: MapEntry = {
  id: "valleyWilds",
  name: "the Valley Wilds",
  build: () => buildFromAscii("valleyWilds", VALLEY_WILDS_ROWS),
  spawn: { ...VALLEY_WILDS_SPAWN },
  entries: {
    /** Arriving from the Wei village's south gate (west opening). */
    fromVillage: { x: 2 * 16 + 8, y: 23 * 16 + 12, facing: "right" },
    /** Arriving back down off the Samara trail (north opening). */
    fromTrail: { x: 18 * 16 + 16, y: 1 * 16 + 12, facing: "down" },
  },
  transitions: [
    { zone: { tx: 0, ty: 23, w: 1, h: 2 }, to: "weiVillage", entry: "fromWilds" },
    { zone: { tx: 18, ty: 0, w: 2, h: 1 }, to: "samaraTrail", entry: "base" },
  ],
  enemies: [
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
  ],
  shrines: [
    { tx: 21, ty: 25 }, // southern trail, near the spawn
    { tx: 16, ty: 16 }, // the walled courtyard's quiet heart
    { tx: 30, ty: 9 }, // northeast, in sight of the pond's water aura
  ],
  npcs: [],
};
