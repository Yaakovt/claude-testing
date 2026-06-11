/**
 * Shared ASCII -> TilemapData builder for hand-authored maps (M4a).
 *
 * One char per tile. The default legend covers the whole tileset; maps can
 * extend/override it (e.g. a lantern standing on stone paving instead of
 * grass). Collision derives from TILESET solidity (ground OR decor solid).
 *
 * Default legend:
 *   .  grass (variant auto)   P  dirt path        W  water (solid)
 *   #  wooden wall            ^  wooden roof      D  door (solid)
 *   T  tree                   R  rock             f  flowers
 *   s  stone paving           S  stone wall       %  stone roof
 *   >  stone stairs           n  snow             C  cliff face (solid)
 *   c  cloud bank (solid)     i  interior floor
 *   l  lantern   d  training dummy   r  festival rope   O  orus tree
 *   y  laundry line (walkable decor)
 */

import type { TilemapData } from "../../engine/tilemap.js";
import { T, TILESET } from "../tiles.js";

export interface CharDef {
  /** Ground tile id; omit for auto grass. */
  ground?: number;
  /** Decor tile id (-1/omit = none). */
  decor?: number;
}

export const DEFAULT_LEGEND: Record<string, CharDef> = {
  ".": {},
  P: { ground: T.PATH },
  W: { ground: T.WATER },
  "#": { ground: T.WALL },
  "^": { ground: T.ROOF },
  D: { ground: T.DOOR },
  T: { decor: T.TREE },
  R: { decor: T.ROCK },
  f: { decor: T.FLOWERS },
  s: { ground: T.STONE },
  S: { ground: T.STONE_WALL },
  "%": { ground: T.STONE_ROOF },
  ">": { ground: T.STAIRS },
  n: { ground: T.SNOW },
  C: { ground: T.CLIFF },
  c: { ground: T.CLOUD },
  i: { ground: T.IFLOOR },
  l: { decor: T.LANTERN },
  d: { decor: T.DUMMY },
  r: { decor: T.ROPE },
  O: { decor: T.ORCHARD },
  y: { decor: T.LAUNDRY },
};

/** Deterministic per-cell hash for grass variety (same look every boot). */
export function grassVariant(x: number, y: number): number {
  const n = (x * 73856093) ^ (y * 19349663);
  const r = (n >>> 4) % 10;
  if (r < 7) return T.GRASS1;
  return r < 9 ? T.GRASS2 : T.GRASS3;
}

export function buildFromAscii(
  name: string,
  rows: string[],
  legendOverrides: Record<string, CharDef> = {},
): TilemapData {
  const legend = { ...DEFAULT_LEGEND, ...legendOverrides };
  const height = rows.length;
  const width = rows[0]!.length;
  const ground: number[][] = [];
  const decor: number[][] = [];
  const collision: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row = rows[y]!;
    if (row.length !== width) {
      throw new Error(`${name} row ${y}: ${row.length} chars, expected ${width}`);
    }
    const g: number[] = [];
    const d: number[] = [];
    const c: number[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x]!;
      const def = legend[ch];
      if (!def) throw new Error(`${name}: unknown tile char '${ch}' at ${x},${y}`);
      const groundId = def.ground ?? grassVariant(x, y);
      const decorId = def.decor ?? -1;
      const solid = TILESET[groundId]!.solid || (decorId >= 0 && TILESET[decorId]!.solid);
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
