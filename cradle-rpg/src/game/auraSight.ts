/**
 * AURA SIGHT — the Copper benefit (lore bible §2.2: "seeing the world
 * overlaid with colored aura"). Below Copper the valley looks ordinary;
 * at Copper the world quietly blooms:
 *  - vital-aura motes drift near water (blue) and trees (green) — pure
 *    visual flavor, cheap deterministic particles (no allocation per frame)
 *  - a subtle cool screen tint + center bloom
 *
 * Mote sources are scanned from the map once; per-frame work is just the
 * sources inside the camera view.
 */

import type { Tilemap } from "../engine/tilemap.js";
import { T } from "./tiles.js";

interface MoteSource {
  x: number;
  y: number;
  kind: "water" | "life";
  phase: number;
}

export class AuraSight {
  /** Flip this when the player reaches Copper. */
  enabled = false;

  private sources: MoteSource[] = [];
  private t = 0;

  constructor(map: Tilemap) {
    const ts = map.tileSize;
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        const hash = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;
        const ground = map.ground[ty]![tx]!;
        const decor = map.decor[ty]![tx]!;
        // Water aura: walkable shore cells beside water (sparse).
        if (ground !== T.WATER && hash % 3 === 0) {
          const nearWater =
            (tx > 0 && map.ground[ty]![tx - 1]! === T.WATER) ||
            (tx < map.width - 1 && map.ground[ty]![tx + 1]! === T.WATER) ||
            (ty > 0 && map.ground[ty - 1]![tx]! === T.WATER) ||
            (ty < map.height - 1 && map.ground[ty + 1]![tx]! === T.WATER);
          if (nearWater) {
            this.sources.push({
              x: tx * ts + ts / 2,
              y: ty * ts + ts / 2,
              kind: "water",
              phase: (hash % 628) / 100,
            });
          }
        }
        // Life aura: around trees (sparse — 1 in 4).
        if (decor === T.TREE && hash % 4 === 0) {
          this.sources.push({
            x: tx * ts + ts / 2,
            y: ty * ts + ts,
            kind: "life",
            phase: (hash % 628) / 100,
          });
        }
      }
    }
  }

  update(dt: number): void {
    if (this.enabled) this.t += dt;
  }

  /** World-space pass: drifting vital-aura motes (call with camera applied). */
  drawWorld(
    ctx: CanvasRenderingContext2D,
    viewX: number,
    viewY: number,
    viewW: number,
    viewH: number,
  ): void {
    if (!this.enabled) return;
    const t = this.t;
    ctx.save();
    for (const s of this.sources) {
      if (s.x < viewX - 8 || s.x > viewX + viewW + 8) continue;
      if (s.y < viewY - 8 || s.y > viewY + viewH + 8) continue;
      const drift = ((t * 5 + s.phase * 13) % 14) - 7; // slow upward loop
      const mx = s.x + Math.sin(t * 0.7 + s.phase) * 4;
      const my = s.y - drift + Math.cos(t * 0.5 + s.phase * 2) * 2;
      const a = 0.22 + 0.18 * Math.sin(t * 1.3 + s.phase * 3);
      ctx.globalAlpha = Math.max(0.06, a);
      ctx.fillStyle = s.kind === "water" ? "#a8dcf0" : "#a8e8b0";
      ctx.fillRect(Math.round(mx), Math.round(my), 1, 1);
      // Occasional brighter twin mote.
      if (Math.sin(t * 0.9 + s.phase * 5) > 0.55) {
        ctx.fillRect(Math.round(mx) + 2, Math.round(my) - 3, 1, 1);
      }
    }
    ctx.restore();
  }

  /** Screen-space pass: the subtle Copper bloom/tint (no gradients — the
   *  headless harness's 2d-context shim has no gradient objects). */
  drawScreenTint(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.enabled) return;
    ctx.save();
    // Cool wash over everything.
    ctx.fillStyle = "rgba(150, 180, 230, 0.045)";
    ctx.fillRect(0, 0, w, h);
    // Soft center bloom: stacked translucent squares stand in for a radial
    // gradient (gradient objects aren't available headless).
    const cx = w / 2;
    const cy = h / 2;
    const breathe = 1 + 0.03 * Math.sin(this.t * 0.8);
    for (const [r, a] of [
      [0.62, 0.018],
      [0.45, 0.02],
      [0.3, 0.022],
    ] as const) {
      const rw = w * r * breathe;
      const rh = h * r * breathe;
      ctx.fillStyle = `rgba(214, 226, 255, ${a})`;
      ctx.fillRect(cx - rw / 2, cy - rh / 2, rw, rh);
    }
    ctx.restore();
  }
}
