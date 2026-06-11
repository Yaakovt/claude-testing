/**
 * Debug overlay, toggled with F3: fps, player position, entity collision
 * boxes, camera info. Split into a world-space pass (boxes, drawn under the
 * camera transform) and a screen-space pass (text, drawn untransformed).
 */

import type { Camera } from "./camera.js";
import type { Entity } from "./entity.js";
import type { Tilemap } from "./tilemap.js";

export class DebugOverlay {
  visible = false;

  private frameTimes: number[] = [];
  private lastFrameAt = 0;

  toggle(): void {
    this.visible = !this.visible;
  }

  /** Call once per rendered frame (regardless of visibility) to track fps. */
  tickFrame(): void {
    const now = performance.now();
    if (this.lastFrameAt > 0) {
      this.frameTimes.push(now - this.lastFrameAt);
      if (this.frameTimes.length > 60) this.frameTimes.shift();
    }
    this.lastFrameAt = now;
  }

  get fps(): number {
    if (this.frameTimes.length === 0) return 0;
    const avg =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return avg > 0 ? 1000 / avg : 0;
  }

  /** Draw collision boxes; call while the camera transform is active. */
  drawWorld(
    ctx: CanvasRenderingContext2D,
    entities: readonly Entity[],
    map: Tilemap,
    camera: Camera,
  ): void {
    if (!this.visible) return;
    ctx.save();
    ctx.lineWidth = 1 / camera.scale;

    // Solid tiles in view.
    ctx.strokeStyle = "rgba(255, 80, 80, 0.5)";
    const ts = map.tileSize;
    const x0 = Math.max(0, Math.floor(camera.left / ts));
    const y0 = Math.max(0, Math.floor(camera.top / ts));
    const x1 = Math.min(map.width - 1, Math.floor((camera.left + camera.viewW) / ts));
    const y1 = Math.min(map.height - 1, Math.floor((camera.top + camera.viewH) / ts));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (map.isSolid(tx, ty)) {
          ctx.strokeRect(tx * ts + 0.5, ty * ts + 0.5, ts - 1, ts - 1);
        }
      }
    }

    // Entity hitboxes + anchors.
    for (const e of entities) {
      const box = e.aabb;
      ctx.strokeStyle = "rgba(80, 255, 120, 0.9)";
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
      ctx.fillRect(e.x - 0.5, e.y - 0.5, 1, 1);
    }
    ctx.restore();
  }

  /** Draw the text panel; call after resetting the transform. */
  drawScreen(ctx: CanvasRenderingContext2D, lines: string[]): void {
    if (!this.visible) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "12px monospace";
    const all = [`FPS ${this.fps.toFixed(0)}`, ...lines];
    const w = Math.max(...all.map((l) => l.length)) * 7.5 + 12;
    ctx.fillStyle = "rgba(10, 8, 18, 0.78)";
    ctx.fillRect(8, 36, w, all.length * 16 + 10);
    ctx.fillStyle = "#9ef09e";
    all.forEach((line, i) => ctx.fillText(line, 14, 52 + i * 16));
    ctx.restore();
  }
}
