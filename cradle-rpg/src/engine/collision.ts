/**
 * Collision: AABB helpers + tile-based movement resolution.
 *
 * Movement uses axis-separated resolution: X is moved and resolved first,
 * then Y. Walking diagonally into a wall therefore slides along it instead
 * of sticking — the cornerstone of "movement feels good".
 */

import type { Tilemap } from "./tilemap.js";

/** Axis-aligned box; x,y is the top-left corner (world pixels). */
export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

const EPS = 0.001;

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export interface MoveResult {
  x: number;
  y: number;
  /** True if movement was blocked on that axis this step. */
  hitX: boolean;
  hitY: boolean;
}

/**
 * Move `box` by (dx, dy) against the map's solid tiles, resolving each axis
 * separately. Returns the new top-left position and which axes hit walls.
 */
export function moveAndCollide(
  box: AABB,
  dx: number,
  dy: number,
  map: Tilemap,
): MoveResult {
  const ts = map.tileSize;
  let x = box.x;
  let y = box.y;
  let hitX = false;
  let hitY = false;

  // ---- X axis ----
  if (dx !== 0) {
    x += dx;
    const top = Math.floor(y / ts);
    const bottom = Math.floor((y + box.h - EPS) / ts);
    if (dx > 0) {
      const right = Math.floor((x + box.w - EPS) / ts);
      for (let ty = top; ty <= bottom; ty++) {
        if (map.isSolid(right, ty)) {
          x = right * ts - box.w;
          hitX = true;
          break;
        }
      }
    } else {
      const left = Math.floor(x / ts);
      for (let ty = top; ty <= bottom; ty++) {
        if (map.isSolid(left, ty)) {
          x = (left + 1) * ts;
          hitX = true;
          break;
        }
      }
    }
  }

  // ---- Y axis ----
  if (dy !== 0) {
    y += dy;
    const left = Math.floor(x / ts);
    const right = Math.floor((x + box.w - EPS) / ts);
    if (dy > 0) {
      const bottom = Math.floor((y + box.h - EPS) / ts);
      for (let tx = left; tx <= right; tx++) {
        if (map.isSolid(tx, bottom)) {
          y = bottom * ts - box.h;
          hitY = true;
          break;
        }
      }
    } else {
      const top = Math.floor(y / ts);
      for (let tx = left; tx <= right; tx++) {
        if (map.isSolid(tx, top)) {
          y = (top + 1) * ts;
          hitY = true;
          break;
        }
      }
    }
  }

  return { x, y, hitX, hitY };
}

/** Does `box` overlap any solid tile? (spawn checks, teleports, …) */
export function overlapsSolid(box: AABB, map: Tilemap): boolean {
  const ts = map.tileSize;
  const left = Math.floor(box.x / ts);
  const right = Math.floor((box.x + box.w - EPS) / ts);
  const top = Math.floor(box.y / ts);
  const bottom = Math.floor((box.y + box.h - EPS) / ts);
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (map.isSolid(tx, ty)) return true;
    }
  }
  return false;
}
