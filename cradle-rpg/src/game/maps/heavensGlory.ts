/**
 * Heaven's Glory School (45x30) — the school on Mount Samara's peak.
 *
 * Stone architecture inside a great wall, the ancestor's orchard of orus
 * fruit trees, an inner sanctum (open-front, plank-floored — top-down
 * cutaway), and cloud banks at the world's edge. Samara's Ring burns on the
 * horizon: World draws a white glow band across the top of this map
 * (MapEntry.ringGlow).
 *
 * The hostile-zone flag ("heavensGlory.hostile") is MACHINERY ONLY in M4a:
 * story content (M4b) sets/clears it to turn the school against the player;
 * World surfaces it in the HUD.
 */

import { buildFromAscii } from "./builder.js";
import { T } from "../tiles.js";
import type { MapEntry } from "./registry.js";

export const HEAVENS_GLORY_ROWS: string[] = [
  "ccccccccccccccccccccccccccccccccccccccccccccc",
  "cnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnc",
  "cnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnc",
  "cnSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSnc",
  "cnS...............SSSSSSSSSSS.............Snc",
  "cnS...............SiiiiiiiiiS.............Snc",
  "cnS..O...O...O....SiiiiiiiiiS....%%%%%%%..Snc",
  "cnS...............SiiiiiiiiiS....%%%%%%%..Snc",
  "cnS....O...O......SiiiiiiiiiS....%%%%%%%..Snc",
  "cnS...............SiiiiiiiiiS....SSSSSSS..Snc",
  "cnS..O...O...O....SSSsSSSSSSS.............Snc",
  "cnS................L.s.L..................Snc",
  "cnS.............ssssssssssssssssssss......Snc",
  "cnS.............ssssssssssssssssssss......Snc",
  "cnS.............ssssssssssssssssssss......Snc",
  "cnS.............ssssssssssssssssssss......Snc",
  "cnS.............ssssssssssssssssssss......Snc",
  "cnS..O....O.......s.......................Snc",
  "cnS...............s.......................Snc",
  "cnS....O....O.....s.......................Snc",
  "cnS..O....O.......s.......................Snc",
  "cnS...............s.......................Snc",
  "cnS...............s.......................Snc",
  "cnS...............s.......................Snc",
  "cnS...............s.......................Snc",
  "cnS...............s.......................Snc",
  "cnSSSSSSSSSSSSSSSSsSSSSSSSSSSSSSSSSSSSSSSSSnc",
  "cn................PPP.....................nnc",
  "cn................PPP.....................nnc",
  "ccccccccccccccccccPPPcccccccccccccccccccccccc",
];

/** Default spawn: inside the gate, on the sanctum approach. */
export const HEAVENS_GLORY_SPAWN = { x: 18 * 16 + 8, y: 24 * 16 + 12 };

export const HEAVENS_GLORY: MapEntry = {
  id: "heavensGlory",
  name: "Heaven's Glory School",
  build: () =>
    buildFromAscii("heavensGlory", HEAVENS_GLORY_ROWS, {
      // Lanterns flanking the sanctum door stand on stone, not grass.
      L: { ground: T.STONE, decor: T.LANTERN },
    }),
  spawn: { ...HEAVENS_GLORY_SPAWN },
  entries: {
    /** Through the great gate, up from the Samara trail. */
    gate: { x: 19 * 16 + 8, y: 27 * 16 + 12, facing: "up" },
  },
  transitions: [
    { zone: { tx: 18, ty: 29, w: 3, h: 1 }, to: "samaraTrail", entry: "fromPeak" },
  ],
  enemies: [], // the school is "safe" — until the story says otherwise
  shrines: [
    { tx: 7, ty: 18 }, // among the ancestor's orus trees
  ],
  npcs: [],
  hostileFlag: "heavensGlory.hostile",
  ringGlow: true,
};
