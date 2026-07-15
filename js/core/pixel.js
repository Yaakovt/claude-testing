'use strict';
/**
 * Gen-3-style pixel art toolkit.
 *
 * All shapes are rasterized manually onto a PixelSurface (a grid of color
 * strings) so every edge is crisp — no canvas antialiasing anywhere.
 * The Gen-3 look comes from:
 *   - 3-tone sphere shading (light from the upper-left)
 *   - checker dithering between tone bands on big forms
 *   - an automatic dark outline pass around the silhouette
 */

const Px = {
  // ---- color math ----------------------------------------------------
  hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgbToHex(r, g, b) {
    const c = (v) => Util.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  },
  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  },
  hslToRgb(h, s, l) {
    if (s === 0) { const v = l * 255; return [v, v, v]; }
    const hue = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
  },
  shift(hex, dh, ds, dl) {
    const [r, g, b] = Px.hexToRgb(hex);
    let [h, s, l] = Px.rgbToHsl(r, g, b);
    h = (h + dh + 1) % 1;
    s = Util.clamp(s + ds, 0, 1);
    l = Util.clamp(l + dl, 0, 1);
    const [r2, g2, b2] = Px.hslToRgb(h, s, l);
    return Px.rgbToHex(r2, g2, b2);
  },
  /**
   * Build a Gen-3 tone ramp from a base color. Shadows shift cool (toward
   * violet), highlights shift warm — livelier color than flat lightness steps.
   *   o  = outline (very dark, hue-shifted cool)
   *   d2 = deep core shadow      d = dark shade
   *   b  = base   l = light   h = highlight
   */
  ramp(base) {
    return {
      o: Px.shift(base, 0.045, 0.10, -0.36),
      d2: Px.shift(base, 0.030, 0.08, -0.21),
      d: Px.shift(base, 0.015, 0.05, -0.11),
      b: base,
      l: Px.shift(base, -0.020, -0.05, 0.10),
      h: Px.shift(base, -0.045, -0.12, 0.22),
    };
  },
};

/** A paintable grid of pixels; null = transparent. */
class PixelSurface {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.data = new Array(w * h).fill(null);
  }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, c) { x |= 0; y |= 0; if (this.inb(x, y)) this.data[y * this.w + x] = c; }
  get(x, y) { return this.inb(x, y) ? this.data[y * this.w + x] : null; }

  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  line(x1, y1, x2, y2, c) {
    x1 |= 0; y1 |= 0; x2 |= 0; y2 |= 0;
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.set(x1, y1, c);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  /** Thick line: stamps a disc along the path. Accepts a color or a ramp. */
  stroke(x1, y1, x2, y2, r, c) {
    const dx = x2 - x1, dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
    const isRamp = c && typeof c === 'object';
    for (let i = 0; i <= steps; i++) {
      const px = x1 + (dx * i) / steps, py = y1 + (dy * i) / steps;
      if (isRamp) this.ball(px, py, r, r, c, { flat: true, dither: false });
      else this.fillCircle(px, py, r, c);
    }
  }

  fillCircle(cx, cy, r, c) { this.fillEllipse(cx, cy, r, r, c); }

  fillEllipse(cx, cy, rx, ry, c) {
    if (rx <= 0 || ry <= 0) return;
    const y0 = Math.ceil(cy - ry), y1 = Math.floor(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const t = (y - cy) / ry;
      const span = rx * Math.sqrt(Math.max(0, 1 - t * t));
      const xa = Math.round(cx - span), xb = Math.round(cx + span);
      for (let x = xa; x <= xb; x++) this.set(x, y, c);
    }
  }

  /** Scanline polygon fill. pts = [[x,y],...] */
  fillPoly(pts, c) {
    let minY = Infinity, maxY = -Infinity;
    for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    minY = Math.max(0, Math.floor(minY)); maxY = Math.min(this.h - 1, Math.ceil(maxY));
    for (let y = minY; y <= maxY; y++) {
      const xs = [];
      const yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
          xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, c);
      }
    }
  }

  /** Filled triangle convenience. */
  tri(x1, y1, x2, y2, x3, y3, c) { this.fillPoly([[x1, y1], [x2, y2], [x3, y3]], c); }

  /**
   * Shaded ellipse: 3-tone ball with light from upper-left, plus a dithered
   * seam between base and dark for that Gen-3 texture. `ramp` from Px.ramp().
   * opts: {lx,ly} light offset direction override, {flat} skip highlight,
   *       {dither} enable checker dither at tone boundary (default true when big)
   */
  ball(cx, cy, rx, ry, ramp, opts = {}) {
    const lx = opts.lx !== undefined ? opts.lx : -0.30;
    const ly = opts.ly !== undefined ? opts.ly : -0.34;
    const dith = opts.dither !== undefined ? opts.dither : (rx + ry > 12);
    const deep = ramp.d2 || ramp.d;
    const y0 = Math.ceil(cy - ry), y1 = Math.floor(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const ty = (y - cy) / ry;
      const span = rx * Math.sqrt(Math.max(0, 1 - ty * ty));
      const xa = Math.round(cx - span), xb = Math.round(cx + span);
      for (let x = xa; x <= xb; x++) {
        const tx = (x - cx) / rx;
        // distance from the light pole
        const d = Math.hypot(tx - lx, ty - ly) / 1.55;
        // organic cluster jitter breaks the geometric band edges
        const jit = dith ? (((x * 7 + y * 13) ^ (x * 3)) % 5) * 0.012 - 0.024 : 0;
        const v = d + jit;
        let c;
        if (v < 0.30 && !opts.flat) c = ramp.h;
        else if (v < 0.58) c = ramp.l;
        else if (v < 0.85) c = ramp.b;
        else if (v < 1.02) c = ramp.d;
        else c = deep;                              // core shadow at the far rim
        this.set(x, y, c);
      }
    }
  }

  /** Shaded capsule limb between two points. */
  limb(x1, y1, x2, y2, r1, r2, ramp) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const r = r1 + (r2 - r1) * t;
      this.ball(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, r, r, ramp, { flat: true, dither: false });
    }
  }

  /** Checker dither region. */
  dither(x, y, w, h, c, phase = 0) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (((x + i + y + j + phase) & 1) === 0) this.set(x + i, y + j, c);
    }
  }

  /** Replace one color with another (for palette tweaks / shiny-style swaps). */
  replace(from, to) {
    for (let i = 0; i < this.data.length; i++) if (this.data[i] === from) this.data[i] = to;
  }

  /** Mirror the whole surface horizontally. */
  mirrored() {
    const s = new PixelSurface(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      s.data[y * s.w + (s.w - 1 - x)] = this.data[y * this.w + x];
    }
    return s;
  }

  /**
   * Outline pass: paint `color` on every transparent pixel 4-adjacent to a
   * filled pixel (exterior outline, the signature Gen-3 edge).
   */
  outline(color) {
    const src = this.data.slice();
    const idx = (x, y) => y * this.w + x;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[idx(x, y)] !== null) continue;
        const near =
          (x > 0 && src[idx(x - 1, y)]) || (x < this.w - 1 && src[idx(x + 1, y)]) ||
          (y > 0 && src[idx(x, y - 1)]) || (y < this.h - 1 && src[idx(x, y + 1)]);
        if (near) this.data[idx(x, y)] = color;
      }
    }
  }

  /**
   * Selective outline ("sel-out"): each outline pixel takes a deep-shadow
   * version of the color it borders, so green forms get deep-green edges,
   * flame gets maroon, etc. Under-edges (ground contact) go darker still.
   */
  outlineSel() {
    const src = this.data.slice();
    const idx = (x, y) => y * this.w + x;
    const memo = {};
    const darken = (c, extra) => {
      const k = c + (extra ? '+' : '');
      if (!memo[k]) memo[k] = Px.shift(c, 0.04, 0.12, extra ? -0.40 : -0.30);
      return memo[k];
    };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[idx(x, y)] !== null) continue;
        const up = y > 0 ? src[idx(x, y - 1)] : null;
        const dn = y < this.h - 1 ? src[idx(x, y + 1)] : null;
        const lf = x > 0 ? src[idx(x - 1, y)] : null;
        const rt = x < this.w - 1 ? src[idx(x + 1, y)] : null;
        const nb = up || lf || rt || dn;
        if (!nb) continue;
        // pixels UNDER the silhouette (filled neighbor above) ground the sprite
        this.data[idx(x, y)] = darken(nb, !!up && !dn);
      }
    }
  }

  /** Darken the silhouette's own border pixels (soft inner edge). */
  innerEdge(darken = 0.18) {
    const src = this.data.slice();
    const idx = (x, y) => y * this.w + x;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const c = src[idx(x, y)];
        if (!c) continue;
        const openAbove = y === 0 || !src[idx(x, y - 1)];
        const openLeft = x === 0 || !src[idx(x - 1, y)];
        if (openAbove || openLeft) continue;
        const openBelow = y === this.h - 1 || !src[idx(x, y + 1)];
        const openRight = x === this.w - 1 || !src[idx(x + 1, y)];
        if (openBelow || openRight) this.data[idx(x, y)] = Px.shift(c, 0, 0.02, -darken);
      }
    }
  }

  /** Render to a fresh canvas. */
  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (!c) continue;
      const [r, g, b] = Px.hexToRgb(c);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }

  /** Blit another surface onto this one at (x,y). */
  blit(surf, x, y) {
    for (let j = 0; j < surf.h; j++) for (let i = 0; i < surf.w; i++) {
      const c = surf.data[j * surf.w + i];
      if (c) this.set(x + i, y + j, c);
    }
  }
}
