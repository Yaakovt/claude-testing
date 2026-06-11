/**
 * Tile-based maps.
 *
 * A map is three number[][] layers of the same dimensions:
 *  - ground:    tile id drawn first (every cell filled)
 *  - decor:     tile id drawn above ground, or -1 for empty. Decor cells are
 *               y-sorted with entities so the player walks behind trees.
 *  - collision: 1 = solid, 0 = walkable (usually derived from tile defs)
 *
 * Tiles are 16x16 world pixels; the camera renders the world at 3x.
 * Only tiles inside the camera view are drawn. Tiles may be animated
 * (e.g. water) by supplying multiple frames.
 */

import type { PixelSprite } from "./sprites.js";

export const TILE_SIZE = 16;

export interface TileDef {
  /** One frame for static tiles, several for animated ones. */
  frames: PixelSprite[];
  /** Frames per second when animated. */
  fps?: number;
  solid: boolean;
  /**
   * If true this decor tile is y-sorted with entities (trees, rocks…).
   * Decor with sortWithEntities=false (e.g. flowers) draws flat under them.
   */
  sortWithEntities?: boolean;
}

export interface TilemapData {
  width: number;
  height: number;
  ground: number[][];
  decor: number[][];
  collision: number[][];
}

/** Something that can be merged into the y-sorted entity draw pass. */
export interface SortedDrawable {
  /** World-space y used for draw order (the object's "feet"). */
  sortY: number;
  draw(ctx: CanvasRenderingContext2D, alpha: number): void;
}

export class Tilemap {
  readonly width: number;
  readonly height: number;
  readonly tileSize = TILE_SIZE;
  readonly ground: number[][];
  readonly decor: number[][];
  readonly collision: number[][];
  private tiles: TileDef[];
  private animTime = 0;

  constructor(data: TilemapData, tiles: TileDef[]) {
    validateLayer(data.ground, data.width, data.height, "ground");
    validateLayer(data.decor, data.width, data.height, "decor");
    validateLayer(data.collision, data.width, data.height, "collision");
    this.width = data.width;
    this.height = data.height;
    this.ground = data.ground;
    this.decor = data.decor;
    this.collision = data.collision;
    this.tiles = tiles;
  }

  get pixelWidth(): number {
    return this.width * this.tileSize;
  }
  get pixelHeight(): number {
    return this.height * this.tileSize;
  }

  /** Solid query in tile coordinates. Out-of-bounds counts as solid. */
  isSolid(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    return this.collision[ty]![tx]! !== 0;
  }

  /** Solid query in world pixels. */
  isSolidAtWorld(wx: number, wy: number): boolean {
    return this.isSolid(
      Math.floor(wx / this.tileSize),
      Math.floor(wy / this.tileSize),
    );
  }

  update(dt: number): void {
    this.animTime += dt;
  }

  private frameOf(def: TileDef): PixelSprite {
    if (def.frames.length === 1) return def.frames[0]!;
    const fps = def.fps ?? 2;
    return def.frames[Math.floor(this.animTime * fps) % def.frames.length]!;
  }

  private visibleRange(viewX: number, viewY: number, viewW: number, viewH: number) {
    const ts = this.tileSize;
    return {
      x0: Math.max(0, Math.floor(viewX / ts)),
      y0: Math.max(0, Math.floor(viewY / ts)),
      x1: Math.min(this.width - 1, Math.floor((viewX + viewW) / ts)),
      y1: Math.min(this.height - 1, Math.floor((viewY + viewH) / ts)),
    };
  }

  /** Draw the ground layer plus flat (non-sorted) decor for the given world-pixel view rect. */
  drawGround(
    ctx: CanvasRenderingContext2D,
    viewX: number,
    viewY: number,
    viewW: number,
    viewH: number,
  ): void {
    const { x0, y0, x1, y1 } = this.visibleRange(viewX, viewY, viewW, viewH);
    const ts = this.tileSize;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const g = this.tiles[this.ground[ty]![tx]!];
        if (g) this.frameOf(g).draw(ctx, tx * ts, ty * ts);
        const d = this.decor[ty]![tx]!;
        if (d >= 0) {
          const def = this.tiles[d];
          if (def && !def.sortWithEntities) {
            this.frameOf(def).draw(ctx, tx * ts, ty * ts);
          }
        }
      }
    }
  }

  /**
   * Collect visible decor cells that participate in entity y-sorting
   * (trees, rocks, buildings). Their sortY is the bottom edge of the tile.
   */
  getSortedDecor(
    viewX: number,
    viewY: number,
    viewW: number,
    viewH: number,
  ): SortedDrawable[] {
    const out: SortedDrawable[] = [];
    const { x0, y0, x1, y1 } = this.visibleRange(viewX, viewY, viewW, viewH);
    const ts = this.tileSize;
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const d = this.decor[ty]![tx]!;
        if (d < 0) continue;
        const def = this.tiles[d];
        if (!def || !def.sortWithEntities) continue;
        const sprite = this.frameOf(def);
        out.push({
          sortY: (ty + 1) * ts,
          draw: (ctx) => sprite.draw(ctx, tx * ts, ty * ts),
        });
      }
    }
    return out;
  }
}

function validateLayer(
  layer: number[][],
  width: number,
  height: number,
  name: string,
): void {
  if (layer.length !== height) {
    throw new Error(`Tilemap: ${name} has ${layer.length} rows, expected ${height}`);
  }
  for (let y = 0; y < height; y++) {
    if (layer[y]!.length !== width) {
      throw new Error(
        `Tilemap: ${name} row ${y} has ${layer[y]!.length} cols, expected ${width}`,
      );
    }
  }
}
