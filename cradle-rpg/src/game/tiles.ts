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

// ---- M4a palettes -----------------------------------------------------------

const STONE_PAL = {
  s: "#8d8e96", // paving
  S: "#9da0aa", // light slab
  d: "#777881", // crack/shadow
};

const SWALL_PAL = {
  s: "#6f7077", // block
  S: "#84858e", // block light
  m: "#56575f", // mortar seam
};

const SROOF_PAL = {
  u: "#4a5468", // slate shingle
  U: "#5c6a84", // shingle light
  v: "#39414f", // seam
  g: "#c9a85c", // gilded ridge (Heaven's Glory gold)
};

const STAIRS_PAL = {
  s: "#8d8e96",
  S: "#aaabb4",
  d: "#6f7077",
};

const SNOW_PAL = {
  n: "#dde3ec", // snow
  N: "#f1f4f8", // bright drift
  b: "#c2cad8", // blue shadow
};

const CLIFF_PAL = {
  c: "#5d5e66", // rock face
  C: "#73747d", // lit edge
  k: "#494a52", // crevice
};

const CLOUD_PAL = {
  c: "#cfd6e4", // cloud body
  C: "#e8ecf4", // sunlit crest
  b: "#aeb8cc", // underside
};

const IFLOOR_PAL = {
  p: "#8a6a44", // polished plank
  P: "#997853", // plank light
  l: "#6e5334", // seam
};

const LANTERN_PAL = {
  p: "#4a3119", // post
  f: "#c9433a", // paper (festival red)
  F: "#e0c9a8", // glow panel
  g: "#f2d98a", // flame glow
};

const DUMMY_PAL = {
  p: "#5d4126", // post
  s: "#c9b58a", // straw body
  S: "#dbc99e", // straw light
  r: "#8a4a52", // rope binding
};

const ROPE_PAL = {
  p: "#5d4126", // stake
  r: "#c9b58a", // rope
  f: "#b04a8a", // Wei festival flag
  F: "#e0c9a8", // flag light
};

const ORCHARD_PAL = {
  o: "#274428", // canopy dark
  k: "#356c33", // canopy
  K: "#428544", // canopy mid
  L: "#5a9c52", // canopy light
  a: "#e08a3c", // orus fruit
  b: "#5d4126", // trunk
  B: "#4a3119", // trunk dark
};

const LAUNDRY_PAL = {
  p: "#5d4126", // pole
  l: "#3a3142", // line
  w: "#efece4", // white robe
  u: "#8a6cc0", // purple robe
  q: "#d8d2c4", // robe shade
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

// ------------------------------------------------------------- M4a tiles

const stone = definePixelSprite([
  "ssssssssdsssssss",
  "sSssssssdsssSsss",
  "ssssSsssdsssssss",
  "dddddddddddddddd",
  "ssssdssssssssdss",
  "sssSdssssSssssss",
  "ssssdsssssssssss",
  "dddddddddddddddd",
  "sdssssssdsssssss",
  "sdssSsssdssssSss",
  "sdssssssdsssssss",
  "dddddddddddddddd",
  "ssssssssssssdsss",
  "ssSsssssSsssdsss",
  "ssssssssssssdsss",
  "dddddddddddddddd",
], STONE_PAL);

const stoneWall = definePixelSprite([
  "mmmmmmmmmmmmmmmm",
  "sssSsssssssSssss",
  "ssssssssssssssss",
  "Ssssssssssssssss",
  "mmmmmmmmmmmmmmmm",
  "ssssSsssssssssss",
  "ssssssssSsssssss",
  "sssssssssssssSss",
  "mmmmmmmmmmmmmmmm",
  "sssssssssssSssss",
  "sSssssssssssssss",
  "ssssssssSsssssss",
  "mmmmmmmmmmmmmmmm",
  "ssssSsssssssssss",
  "sssssssssssssSss",
  "Ssssssssssssssss",
], SWALL_PAL);

const stoneRoof = definePixelSprite([
  "gggggggggggggggg",
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
], SROOF_PAL);

const stairs = definePixelSprite([
  "SSSSSSSSSSSSSSSS",
  "ssssssssssssssss",
  "dddddddddddddddd",
  "SSSSSSSSSSSSSSSS",
  "ssssssssssssssss",
  "dddddddddddddddd",
  "SSSSSSSSSSSSSSSS",
  "ssssssssssssssss",
  "dddddddddddddddd",
  "SSSSSSSSSSSSSSSS",
  "ssssssssssssssss",
  "dddddddddddddddd",
  "SSSSSSSSSSSSSSSS",
  "ssssssssssssssss",
  "dddddddddddddddd",
  "SSSSSSSSSSSSSSSS",
], STAIRS_PAL);

const snow = definePixelSprite([
  "nnnnnnnnnnnnnnnn",
  "nnNnnnnnnnnnnbnn",
  "nnnnnnnnNnnnnnnn",
  "nbnnnnnnnnnnnnnn",
  "nnnnnnNnnnnnnnnN",
  "nnnnnnnnnnnbnnnn",
  "nNnnnnnnnnnnnnnn",
  "nnnnnnnnnnNnnnnn",
  "nnnnbnnnnnnnnnnn",
  "nnnnnnnnnnnnNnnn",
  "nNnnnnnnnnnnnnnn",
  "nnnnnnNnnnnnbnnn",
  "nnnnnnnnnnnnnnnn",
  "nnbnnnnnnnNnnnnn",
  "nnnnnnnnnnnnnnNn",
  "nnnnnNnnnnnnnnnn",
], SNOW_PAL);

const cliff = definePixelSprite([
  "cccCcccccccCcccc",
  "ccccccckcccccccc",
  "Ccccccckcccccccc",
  "cckkkkkkkccccccC",
  "cckcccccccCccccc",
  "ccccccCccccccccc",
  "ccccccccccckkkkc",
  "Cccckccccccckccc",
  "ccccckcccccccckc",
  "ccccckkkkccccccc",
  "cCcccccckccccCcc",
  "ccccccccckcccccc",
  "ckkkcccccccccccc",
  "ccckkccccCcccccc",
  "Cccccccccccckccc",
  "cccccCcccccckccc",
], CLIFF_PAL);

const cloudA = definePixelSprite([
  "bbccccccbbcccccc",
  "ccCCccccccccCCcc",
  "cCCCCccccccCCCCc",
  "ccccccCCcccccccc",
  "bccccCCCCccccccb",
  "cbbcccccccccbbcc",
  "ccccccbbcccccccc",
  "cCCcccccccccCCcc",
  "cccccccCCccccccc",
  "bccccccccccccccb",
  "ccbbccCCCCccbbcc",
  "cccccCCCCCCccccc",
  "cccccccccccccccc",
  "cbccccccccccccbc",
  "ccccCCccccCCcccc",
  "bbccccccbbcccccc",
], CLOUD_PAL);

const cloudB = definePixelSprite([
  "ccccccbbccccccbb",
  "ccCCccccccCCcccc",
  "cCCCCccccCCCCccc",
  "ccccccccCCcccccc",
  "bcccccccCCCCcccb",
  "ccbbccccccccbbcc",
  "ccccbbcccccccccc",
  "cccCCcccccCCcccc",
  "ccCCccccccccCCcc",
  "bccccccccccccccb",
  "ccccbbCCCCbbcccc",
  "ccccCCCCCCcccccc",
  "cccccccccccccccc",
  "cbccccccccccccbc",
  "ccCCccccccCCcccc",
  "ccccccbbccccccbb",
], CLOUD_PAL);

const interiorFloor = definePixelSprite([
  "pppppppplppppppp",
  "pPpppppplppppPpp",
  "pppppPpplppppppp",
  "llllllllllllllll",
  "pppPpppppppplppp",
  "ppppppppPppplppp",
  "pPpppppppppplppp",
  "llllllllllllllll",
  "pplppppppppppppp",
  "pplpppPppppppPpp",
  "pplppppppppppppp",
  "llllllllllllllll",
  "ppppppplpppppppp",
  "ppPpppplpppPpppp",
  "ppppppplpppppppp",
  "llllllllllllllll",
], IFLOOR_PAL);

const lantern = definePixelSprite([
  "................",
  ".....gggg.......",
  "....gFFFFg......",
  "....fFFFFf......",
  "....fFggFf......",
  "....fFggFf......",
  "....fFFFFf......",
  "....ffffff......",
  "......pp........",
  "......pp........",
  "......pp........",
  "......pp........",
  "......pp........",
  "......pp........",
  ".....pppp.......",
  "................",
], LANTERN_PAL);

const dummy = definePixelSprite([
  "................",
  ".....ssss.......",
  "....sSSSSs......",
  "....sSssSs......",
  ".....ssss.......",
  "...ssrSSrss.....",
  "..sSSrssrSSs....",
  "..ssssrrssss....",
  "...ssSSSSss.....",
  "....ssrrss......",
  ".....ssss.......",
  "......pp........",
  "......pp........",
  "......pp........",
  ".....pppp.......",
  "................",
], DUMMY_PAL);

const ropeRing = definePixelSprite([
  "................",
  "..ff........ff..",
  "..fF........fF..",
  "..ff........ff..",
  "..p..........p..",
  "..p..........p..",
  "rrprrrrrrrrrrprr",
  "..p..........p..",
  "rrprrrrrrrrrrprr",
  "..p..........p..",
  "..p..........p..",
  "..p..........p..",
  "..p..........p..",
  ".ppp........ppp.",
  "................",
  "................",
], ROPE_PAL);

const orchardTree = definePixelSprite([
  "......oooo......",
  "....ookkkkoo....",
  "...okkKKKKkko...",
  "..okKKLLaLKKko..",
  "..okKLLLLLLKko..",
  ".okKaLLLLLLKKko.",
  ".okKLLLLaLKKKko.",
  ".okKKLLLLKKakko.",
  ".okkKKaKKKKkkko.",
  "..okkKKKKKkkko..",
  "..ookkkakkkkoo..",
  "....ookkkkoo....",
  "......BbbB......",
  "......BbbB......",
  "......BbbB......",
  ".....BBbbBB.....",
], ORCHARD_PAL);

const laundry = definePixelSprite([
  "................",
  ".p............p.",
  ".plllllllllllpp.",
  ".p..w...u.....p.",
  ".p.www.uuu....p.",
  ".p.www.uuu....p.",
  ".p.wqw.uqu....p.",
  ".p.www.uuu....p.",
  ".p..w...u.....p.",
  ".p............p.",
  ".p............p.",
  ".p............p.",
  ".p............p.",
  "ppp..........ppp",
  "................",
  "................",
], LAUNDRY_PAL);

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
  // M4a additions:
  STONE: 11, // stone paving / plaza (walkable)
  STONE_WALL: 12, // school architecture (solid)
  STONE_ROOF: 13, // slate + gilded ridge (solid)
  STAIRS: 14, // stone stairs (walkable)
  SNOW: 15, // peak ground (walkable)
  CLIFF: 16, // mountain rock face (solid)
  CLOUD: 17, // cloud bank at the peak's edge (solid, animated)
  IFLOOR: 18, // interior plank floor (walkable)
  LANTERN: 19, // festival lantern post (solid decor, y-sorted)
  DUMMY: 20, // training dummy (solid decor, y-sorted)
  ROPE: 21, // festival-ring rope + flags (solid decor)
  ORCHARD: 22, // orus fruit tree (solid decor, y-sorted)
  LAUNDRY: 23, // laundry line (walkable decor)
} as const;

export const TILESET: TileDef[] = [
  /* GRASS1     */ { frames: [grass1], solid: false },
  /* GRASS2     */ { frames: [grass2], solid: false },
  /* GRASS3     */ { frames: [grass3], solid: false },
  /* PATH       */ { frames: [path], solid: false },
  /* WATER      */ { frames: [waterA, waterB], fps: 1.6, solid: true },
  /* TREE       */ { frames: [tree], solid: true, sortWithEntities: true },
  /* ROCK       */ { frames: [rock], solid: true, sortWithEntities: true },
  /* WALL       */ { frames: [wall], solid: true },
  /* ROOF       */ { frames: [roof], solid: true },
  /* DOOR       */ { frames: [door], solid: true },
  /* FLOWERS    */ { frames: [flowers], solid: false },
  /* STONE      */ { frames: [stone], solid: false },
  /* STONE_WALL */ { frames: [stoneWall], solid: true },
  /* STONE_ROOF */ { frames: [stoneRoof], solid: true },
  /* STAIRS     */ { frames: [stairs], solid: false },
  /* SNOW       */ { frames: [snow], solid: false },
  /* CLIFF      */ { frames: [cliff], solid: true },
  /* CLOUD      */ { frames: [cloudA, cloudB], fps: 0.8, solid: true },
  /* IFLOOR     */ { frames: [interiorFloor], solid: false },
  /* LANTERN    */ { frames: [lantern], solid: true, sortWithEntities: true },
  /* DUMMY      */ { frames: [dummy], solid: true, sortWithEntities: true },
  /* ROPE       */ { frames: [ropeRing], solid: true, sortWithEntities: true },
  /* ORCHARD    */ { frames: [orchardTree], solid: true, sortWithEntities: true },
  /* LAUNDRY    */ { frames: [laundry], solid: false },
];
