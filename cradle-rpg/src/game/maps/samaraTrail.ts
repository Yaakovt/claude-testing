/**
 * Samara Trail (40x40, vertical) — the climb up Mount Samara toward the
 * Heaven's Glory School. Switchback paths between cliff ridges, rockfalls,
 * snow on the upper third, and tougher dreadbeasts than the wilds (two
 * hollow stalkers prowl the heights — at Foundation, RUN).
 *
 * Bottom gate: the Valley Wilds. Top gate: Heaven's Glory on the peak.
 */

import { buildFromAscii } from "./builder.js";
import type { MapEntry } from "./registry.js";

export const SAMARA_TRAIL_ROWS: string[] = [
  "CCCCCCCCCCCCCCCCCCCPPCCCCCCCCCCCCCCCCCCC",
  "CnnnnnnnnnnnnnnnnnnPPnnnnnnnnnnnnnnnnnnC",
  "CccnnnnnnnnnnnnnnnnPPnnnnnnnnnnnnnnnnccC",
  "CnnnnnnnnnnnnnnnnnnPPnnnnnnnnnnnnnnnnnnC",
  "CCCCCCCCCCCCCCCCCCC>>CCCCCCCCCCCCCCCCCCC",
  "CnnnnnnnnnnnnnnnnnnPPnnnnnnnnnnnnnnnnnnC",
  "CnnnPPPPPPPPPPPPPPPPPnnnnnnnnnnnnnnnnnnC",
  "CnnnPnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnC",
  "CccnPnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnccC",
  "CCCC>>CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  "CnnnPnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnC",
  "CnnnPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPnnnnC",
  "C.................................P....C",
  "C..R..............................P..R.C",
  "C.................................P....C",
  "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC>CCCCC",
  "C.................................P....C",
  "C.....PPPPPPPPPPPPPPPPPPPPPPPPPPPPP....C",
  "C.....P.......T........................C",
  "C..T..P................................C",
  "C.....P....................R...........C",
  "CCCCCC>CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
  "C.....P................................C",
  "C.....PPPPPPPPPPPPP....................C",
  "C..R..............P........RR..........C",
  "C.................P.......RRR..........C",
  "C.................P....................C",
  "C.T...............P....................C",
  "C.................P.........T..........C",
  "C.................PP...................C",
  "C.................PP...................C",
  "C....R............PP...................C",
  "C.................PP......T............C",
  "C.................PP...................C",
  "C.T...............PP...................C",
  "C.................PP...................C",
  "C.................PP..........R........C",
  "C.................PP...................C",
  "C.................PP...................C",
  "CCCCCCCCCCCCCCCCCCPPCCCCCCCCCCCCCCCCCCCC",
];

/** Default spawn: the trailhead just inside the bottom gate. */
export const SAMARA_TRAIL_SPAWN = { x: 18 * 16 + 16, y: 37 * 16 + 12 };

export const SAMARA_TRAIL: MapEntry = {
  id: "samaraTrail",
  name: "the Samara Trail",
  build: () => buildFromAscii("samaraTrail", SAMARA_TRAIL_ROWS),
  spawn: { ...SAMARA_TRAIL_SPAWN },
  entries: {
    /** Up from the Valley Wilds. */
    base: { x: 18 * 16 + 16, y: 38 * 16 + 8, facing: "up" },
    /** Back down from the Heaven's Glory gate. */
    fromPeak: { x: 19 * 16 + 16, y: 2 * 16 + 8, facing: "down" },
  },
  transitions: [
    { zone: { tx: 18, ty: 39, w: 2, h: 1 }, to: "valleyWilds", entry: "fromTrail" },
    { zone: { tx: 19, ty: 0, w: 2, h: 1 }, to: "heavensGlory", entry: "gate" },
  ],
  enemies: [
    // The approach: leftovers from the wilds.
    { kind: "slitherer", tx: 24, ty: 34 },
    { kind: "boar", tx: 10, ty: 26 },
    { kind: "boar", tx: 25, ty: 24 },
    // The heights: two stalkers prowl the snow line.
    { kind: "stalker", tx: 20, ty: 13 },
    { kind: "stalker", tx: 10, ty: 7 },
  ],
  shrines: [
    { tx: 20, ty: 18 }, // a wind-scoured seat halfway up
  ],
  npcs: [],
};
