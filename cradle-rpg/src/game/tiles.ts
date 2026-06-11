/**
 * The Sacred Valley tileset, defined entirely through the ASCII pixel-sprite
 * system. Tiles are 16x16 world pixels. Add new tiles by appending to `T`
 * and `TILESET` (keep indices in sync — TILESET[T.FOO] must be FOO's def).
 */

import { definePixelSprite } from "../engine/sprites.js";
import type { TileDef } from "../engine/tilemap.js";

// ---------------------------------------------------------------- palettes

const GRASS_PAL = {
  g: "#3a7434", // base green
  G: "#437f3c", // light blade
  d: "#316329", // dark speckle
  t: "#4f9347", // bright tuft
};

const PATH_PAL = {
  p: "#b39764", // packed dirt
  P: "#bfa371", // light
  q: "#93794e", // pebble/shadow
};

const WATER_PAL = {
  w: "#2d5d9c", // deep
  W: "#4a7fbe", // wave highlight
  b: "#27518a", // shadow
};

const TREE_PAL = {
  o: "#1d3f22", // canopy outline/dark
  k: "#2a5c2d", // canopy
  K: "#357036", // canopy mid
  L: "#428544", // canopy light
  b: "#5d4126", // trunk
  B: "#4a3119", // trunk dark
};

const ROCK_PAL = {
  s: "#6f7077", // dark
  r: "#8d8e96", // mid
  R: "#aaabb4", // light
  // 'g'/'d' in the rock art are intentionally unmapped = transparent,
  // so the ground tile shows through around the boulder.
};

const WALL_PAL = {
  p: "#7c5a36", // plank
  P: "#8b6843", // plank light
  l: "#5f4426", // seam
  n: "#9c7a50", // peg
};

const ROOF_PAL = {
  u: "#5a4a80", // shingle (Wei purple)
  U: "#6c5b96", // shingle light
  v: "#463a64", // seam
};

const DOOR_PAL = {
  ...WALL_PAL,
  D: "#3c2c1c", // door panel
  h: "#c9a85c", // handle
};

const FLOWER_PAL = {
  w: "#ece6f4", // white petal
  c: "#e3c54e", // center
  u: "#b88fd4", // purple petal
  s: "#356c33", // stem
};

// ------------------------------------------------------------------- tiles

const grass1 = definePixelSprite([
  "gggggggggggggggg",
  "gggGgggggggggdgg",
  "ggggggggtggggggg",
  "gdgggggggggggggg",
  "ggggggGggggggggG",
  "gggggggggggdgggg",
  "gGgggggggggggggg",
  "ggggggggggGggggg",
  "ggggdggggggggggg",
  "ggggggggggggGggg",
  "gtgggggggggggggg",
  "ggggggGgggggdggg",
  "gggggggggggggggg",
  "ggdggggggtgggggg",
  "ggggggggggggggGg",
  "gggggGgggggggggg",
], GRASS_PAL);

const grass2 = definePixelSprite([
  "gggggggggggggggg",
  "ggggggggGggggggg",
  "ggdggggggggggtgg",
  "gggggggggggggggg",
  "gggggggdgggggggg",
  "gGgggggggggGgggg",
  "gggggggggggggggg",
  "gggggtgggggggdgg",
  "gggggggggggggggg",
  "gdgggggggGgggggg",
  "gggggggggggggggg",
  "ggggGggggggggggg",
  "ggggggggdggggtgg",
  "gggggggggggggggg",
  "gGggggggggggGggg",
  "ggggggggggdggggg",
], GRASS_PAL);

const grass3 = definePixelSprite([
  "gggggggggggggggg",
  "gggggdgggggggggg",
  "ggggggggggGggggg",
  "ggGggggggggggggg",
  "ggggggggggggggdg",
  "ggggggtggggggggg",
  "gggggggggggggggg",
  "gGgggggggggGgggg",
  "gggggggdgggggggg",
  "gggggggggggggggg",
  "ggggGggggggtgggg",
  "gdgggggggggggggg",
  "gggggggggggggGgg",
  "ggggggdggggggggg",
  "gggggggggggggggg",
  "ggtggggggGgggggg",
], GRASS_PAL);

const path = definePixelSprite([
  "pppppppPpppppppp",
  "ppPpppppppppqppp",
  "pppppppppppppppp",
  "ppppppqppppppppP",
  "pPpppppppppppppp",
  "ppppppppppPppppp",
  "pppqpppppppppppp",
  "pppppppppppppqpp",
  "ppppppPppppppppp",
  "pqpppppppppppppp",
  "ppppppppppppPppp",
  "ppppPpppqppppppp",
  "pppppppppppppppp",
  "ppqppppppppppPpp",
  "pppppppPpppppppp",
  "pppppppppppqpppp",
], PATH_PAL);

const waterA = definePixelSprite([
  "wwwwwwwwwwwwwwww",
  "wwWWwwwwwwwwwwww",
  "wwwwwwwwwwWWWwww",
  "wwwwwwwwwwwwwwww",
  "wbwwwwwwwwwwwwbw",
  "wwwwwWWwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwWWwww",
  "wWWwwwwwwwwwwwww",
  "wwwwwwwbwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwWWWwwwwwwwww",
  "wwwwwwwwwwwwWWww",
  "wwwwwwwwwwwwwwww",
  "wwbwwwwwWWwwwwww",
  "wwwwwwwwwwwwwwww",
], WATER_PAL);

const waterB = definePixelSprite([
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwWWwwwwwwwwwww",
  "wwwwwwwwwwwWWWww",
  "wwwwwwwwwwwwwwww",
  "wbwwwwwwwwwwwwbw",
  "wwwwwwWWwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwWWww",
  "wWWwwwwwbwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwww",
  "wwwwwWWWwwwwwwww",
  "wwwwwwwwwwwwwWWw",
  "wwwwwwwwwwwwwwww",
  "wwwbwwwwwWWwwwww",
], WATER_PAL);

const tree = definePixelSprite([
  "......oooo......",
  "....ookkkkoo....",
  "...okkKKKKkko...",
  "..okKKLLLLKKko..",
  "..okKLLLLLLKko..",
  ".okKLLLLLLLKKko.",
  ".okKLLLLLLKKKko.",
  ".okKKLLLLKKKkko.",
  ".okkKKKKKKKkkko.",
  "..okkKKKKKkkko..",
  "..ookkkkkkkkoo..",
  "....ookkkkoo....",
  "......BbbB......",
  "......BbbB......",
  "......BbbB......",
  ".....BBbbBB.....",
], TREE_PAL);

const rock = definePixelSprite([
  "gggggggggggggggg",
  "gggggggggggggggg",
  "ggggggrrrrgggggg",
  "ggggrrRRRrrggggg",
  "gggrRRRRRRrrgggg",
  "ggrrRRRRRRRrrggg",
  "ggrRRRRRRRRrrggg",
  "ggrrRRRRRRrrrggg",
  "ggsrrRRRRrrrsggg",
  "ggsrrrrrrrrssggg",
  "ggssrrrrrrssgggg",
  "gggssssssssggggg",
  "ggdggssssggdgggg",
  "gggggggggggggggg",
  "gggggggggggggggg",
  "gggggggggggggggg",
], ROCK_PAL);

const wall = definePixelSprite([
  "llllllllllllllll",
  "pppPpppppppPpppp",
  "pppppppnpppppppp",
  "PpppppppppppppPp",
  "llllllllllllllll",
  "ppPppppppppppppp",
  "pnppppppPppppppn",
  "ppppppPppppppppp",
  "llllllllllllllll",
  "pppppppppppPpppp",
  "pPpppnpppppppppp",
  "ppppppppppppPppp",
  "llllllllllllllll",
  "ppppPppppppppppp",
  "ppppppppnppppPpp",
  "Pppppppppppppppp",
], WALL_PAL);

const roof = definePixelSprite([
  "vvvvvvvvvvvvvvvv",
  "uUuuuuuUuuuuuuUu",
  "uuuuuuuuuuuuuuuu",
  "vvvvvvvvvvvvvvvv",
  "uuuUuuuuuuUuuuuu",
  "uuuuuuuuuuuuuuuu",
  "vvvvvvvvvvvvvvvv",
  "uUuuuuuuuUuuuuUu",
  "uuuuuuuuuuuuuuuu",
  "vvvvvvvvvvvvvvvv",
  "uuuuuUuuuuuuUuuu",
  "uuuuuuuuuuuuuuuu",
  "vvvvvvvvvvvvvvvv",
  "uUuuuuuuUuuuuuuu",
  "uuuuuuuuuuuuuuUu",
  "vvvvvvvvvvvvvvvv",
], ROOF_PAL);

const door = definePixelSprite([
  "llllllllllllllll",
  "pppPllDDDDllpppp",
  "ppppplDDDDlppppp",
  "PppppDDDDDDppppp",
  "lllllDDDDDDlllll",
  "ppPppDDDDDDppppp",
  "pnpppDDDDDDppppn",
  "pppppDDDDDDppppp",
  "lllllDDDDDDlllll",
  "pppppDDDDDDppppp",
  "pPpppDDDDhDppppp",
  "pppppDDDDhDppppp",
  "lllllDDDDDDlllll",
  "ppppPDDDDDDppppp",
  "pppppDDDDDDppPpp",
  "PppppDDDDDDppppp",
], DOOR_PAL);

const flowers = definePixelSprite([
  "................",
  "................",
  "...w......u.....",
  "..wcw....ucu....",
  "...w......u.....",
  "...s......s.....",
  "................",
  "................",
  "................",
  ".........w......",
  "....u...wcw.....",
  "...ucu...w......",
  "....u....s......",
  "....s...........",
  "................",
  "................",
], FLOWER_PAL);

/** Tile ids — indices into TILESET. */
export const T = {
  GRASS1: 0,
  GRASS2: 1,
  GRASS3: 2,
  PATH: 3,
  WATER: 4,
  TREE: 5,
  ROCK: 6,
  WALL: 7,
  ROOF: 8,
  DOOR: 9,
  FLOWERS: 10,
} as const;

export const TILESET: TileDef[] = [
  /* GRASS1  */ { frames: [grass1], solid: false },
  /* GRASS2  */ { frames: [grass2], solid: false },
  /* GRASS3  */ { frames: [grass3], solid: false },
  /* PATH    */ { frames: [path], solid: false },
  /* WATER   */ { frames: [waterA, waterB], fps: 1.6, solid: true },
  /* TREE    */ { frames: [tree], solid: true, sortWithEntities: true },
  /* ROCK    */ { frames: [rock], solid: true, sortWithEntities: true },
  /* WALL    */ { frames: [wall], solid: true },
  /* ROOF    */ { frames: [roof], solid: true },
  /* DOOR    */ { frames: [door], solid: true },
  /* FLOWERS */ { frames: [flowers], solid: false },
];
