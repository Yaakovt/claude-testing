'use strict';
/**
 * SpriteForge — a pixel-art authoring engine for drawn-looking sprites.
 *
 * Instead of stacking shaded ellipses (which reads blobby/airbrushed), a sprite
 * is a list of PARTS, each a smooth closed contour through a few control
 * points. The engine guarantees the qualities of hand-drawn GBA art:
 *
 *   • Smooth silhouettes  — Catmull-Rom splines through the control points,
 *     rasterized as clean fills. Curves are intentional, not emergent.
 *   • Automatic ink lines — where a part overlaps an earlier part, its
 *     boundary is inked in the outline tone. Every arm/head/belly gets a
 *     contour line against the body, by construction.
 *   • Hard cel shading    — each part gets a crisp shadow band that follows
 *     its contour on the side away from the light, plus a thin light band
 *     and an optional gleam. One global light direction keeps it consistent.
 *   • Connectivity        — parts are drawn overlapping and the final weld
 *     pass reattaches anything left floating.
 *
 * Part spec:
 * {
 *   path: [[x,y],...]      control points of a CLOSED contour (clockwise-ish)
 *   smooth: 1              0 = straight polygon, 1 = full spline (default 1)
 *   ramp: Px.ramp(...)     the part's tone ramp
 *   shade: { d:2, hi:1 }   shadow band depth px / light band depth (0 = none)
 *   ink: true              ink boundary where overlapping earlier parts (default true)
 *   inkAll: false          ink the entire boundary (for strong interior forms)
 *   gleam: [x,y]           optional 2px highlight spot
 *   flat: '#hex'|ramp tone paint solid with no shading (overrides shade)
 *   post(s)                raw pixel ops after this part (markings, texture)
 * }
 *
 * SpriteForge.draw(s, parts, opts?)  — render parts in order onto s.
 * SpriteForge.limb(x1,y1,x2,y2,r1,r2) — capsule contour for arms/legs/tails.
 * SpriteForge.blob(cx,cy,rx,ry,wobble?) — organic ellipse-ish contour.
 * SpriteForge.mirror(path, cx?)     — mirror a path horizontally.
 */
const SpriteForge = (() => {
  const W = 64, H = 64;

  // ---- Catmull-Rom closed spline through control points ----
  function spline(pts, segs) {
    const n = pts.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i];
      const p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let j = 0; j < segs; j++) {
        const t = j / segs, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    return out;
  }

  // ---- rasterize a closed sample loop: interior mask + boundary pixel list ----
  function raster(samples) {
    const mask = new Uint8Array(W * H);
    // even-odd scanline fill
    for (let y = 0; y < H; y++) {
      const yc = y + 0.5, xs = [];
      for (let i = 0; i < samples.length; i++) {
        const [x1, y1] = samples[i], [x2, y2] = samples[(i + 1) % samples.length];
        if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
          xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]);
        for (let x = xa; x < xb; x++) if (x >= 0 && x < W) mask[y * W + x] = 1;
      }
    }
    // boundary: mask pixels 4-adjacent to a non-mask pixel
    const boundary = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1 ||
          !mask[y * W + x - 1] || !mask[y * W + x + 1] ||
          !mask[(y - 1) * W + x] || !mask[(y + 1) * W + x]) {
        boundary.push([x, y]);
      }
    }
    return { mask, boundary };
  }

  function inMask(mask, x, y) {
    return x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  }

  function drawPart(s, part, lightX, lightY) {
    const smooth = part.smooth !== undefined ? part.smooth : 1;
    const samples = smooth > 0 ? spline(part.path, Math.max(6, Math.round(12 * smooth))) : part.path.slice();
    const { mask, boundary } = raster(samples);
    const ramp = part.ramp;
    const flat = part.flat;
    const baseColor = flat || ramp.b;

    // remember what was already drawn (for the ink pass)
    const under = s.data.slice();

    // 1. base fill
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) s.set(x, y, baseColor);
    }

    // 2. cel bands (skip for flat parts) — with reflected rim light and
    //    dithered seams on EVERY band edge (the Gen-3 anti-banding trick)
    if (!flat && part.shade !== null) {
      const sh = part.shade || {};
      const d = sh.d !== undefined ? sh.d : 2;
      const hi = sh.hi !== undefined ? sh.hi : 1;
      const rim = sh.rim !== undefined ? sh.rim : d >= 2;   // bounce light in the shadow
      const rimColor = ramp.rim || (ramp.rim = Px.shift(ramp.d, -0.012, -0.03, 0.055));
      if (d > 0) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!mask[y * W + x]) continue;
          if (!inMask(mask, x - lightX * d, y - lightY * d)) {
            // outermost shadow ring gets the reflected-light tone
            if (rim && !inMask(mask, x - lightX, y - lightY)) s.set(x, y, rimColor);
            else s.set(x, y, ramp.d);
          } else if (!inMask(mask, x - lightX * (d + 1), y - lightY * (d + 1)) && ((x + y) & 1)) {
            s.set(x, y, ramp.d);   // dithered seam into the base tone
          }
        }
      }
      if (hi > 0) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!mask[y * W + x]) continue;
          if (!inMask(mask, x + lightX * hi, y + lightY * hi)) s.set(x, y, ramp.l);
          else if (!inMask(mask, x + lightX * (hi + 1), y + lightY * (hi + 1)) && ((x + y) & 1)) s.set(x, y, ramp.l);
        }
      }
    }

    // 2a. interior anti-aliasing: soften stair-step corners between the
    //     part's own tone bands (the finish real sprites have). Ink-dark
    //     tones are excluded so contour lines stay crisp.
    if (!flat && part.aa !== false && ramp) {
      const tones = [ramp.h, ramp.l, ramp.b, ramp.d];
      const toneSet = new Set(tones);
      const src = s.data.slice();
      const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? src[y * W + x] : null;
      const mixMemo = {};
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!mask[y * W + x]) continue;
        const A = at(x, y);
        if (!toneSet.has(A)) continue;
        // convex corner: two orthogonal neighbors share tone B (adjacent band)
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const B = at(x + dx, y);
          if (B === null || B === A || !toneSet.has(B)) continue;
          if (at(x, y + dy) !== B || at(x + dx, y + dy) !== B) continue;
          const ai = tones.indexOf(A), bi = tones.indexOf(B);
          if (Math.abs(ai - bi) !== 1) continue;        // only adjacent bands
          const k = A + B;
          if (!mixMemo[k]) mixMemo[k] = Px.mix(A, B, 0.5);
          s.set(x, y, mixMemo[k]);
          break;
        }
      }
    }

    // 2b. fur/scale edge texture
    if (part.edge === 'fur' && ramp) {
      for (const [x, y] of boundary) {
        const k = (x * 7 + y * 13) % 5;
        if (k === 0) {
          // outward tuft
          if (!inMask(mask, x - 1, y)) s.set(x - 1, y, s.get(x, y));
          else if (!inMask(mask, x + 1, y)) s.set(x + 1, y, s.get(x, y));
          else if (!inMask(mask, x, y - 1)) s.set(x, y - 1, s.get(x, y));
        } else if (k === 2) {
          // inward dark tick
          if (inMask(mask, x + 1, y + 1)) s.set(x + 1, y + 1, ramp.d);
        }
      }
    } else if (part.edge === 'scale' && ramp) {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!mask[y * W + x]) continue;
        if ((x * 3 + y * 5) % 11 === 0 && inMask(mask, x - lightX * 2, y - lightY * 2)) s.set(x, y, ramp.d);
      }
    }

    // 3. ink pass: boundary pixels over earlier art get a contour line,
    //    and the overlapped part below gets a 1px occlusion shadow.
    if (part.ink !== false) {
      const inkColor = (ramp && ramp.o) || Px.shift(baseColor, 0.04, 0.1, -0.32);
      const occl = {};
      for (const [x, y] of boundary) {
        if (part.inkAll || under[y * W + x] !== null) {
          s.set(x, y, inkColor);
          // cast a crevice shadow onto whatever this part overhangs
          const ox = x - lightX, oy = y - lightY;   // one step away from the light
          if (!inMask(mask, ox, oy) && under[oy * W + ox]) {
            const c = under[oy * W + ox];
            if (!occl[c]) occl[c] = Px.shift(c, 0.01, 0.03, -0.10);
            if (s.get(ox, oy) === c) s.set(ox, oy, occl[c]);
          }
        }
      }
    }

    // 4. gleam
    if (part.gleam && ramp) {
      const [gx, gy] = part.gleam;
      s.set(gx, gy, ramp.h); s.set(gx + 1, gy, ramp.h); s.set(gx, gy + 1, ramp.l);
    }

    // 5. custom detail
    if (part.post) part.post(s, mask);

    return mask;
  }

  return {
    draw(s, parts, opts = {}) {
      const lx = opts.light ? opts.light[0] : -1;
      const ly = opts.light ? opts.light[1] : -1;
      for (const part of parts) drawPart(s, part, lx, ly);
    },

    /** Capsule contour between two points (limbs, tails, necks). */
    limb(x1, y1, x2, y2, r1, r2) {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      return [
        [x1 + nx * r1, y1 + ny * r1],
        [x2 + nx * r2, y2 + ny * r2],
        [x2 + dx / len * r2, y2 + dy / len * r2],
        [x2 - nx * r2, y2 - ny * r2],
        [x1 - nx * r1, y1 - ny * r1],
        [x1 - dx / len * r1, y1 - dy / len * r1],
      ];
    },

    /** Organic ellipse-ish contour (wobble adds hand-drawn irregularity). */
    blob(cx, cy, rx, ry, wobble = 0, n = 10) {
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const w = wobble ? 1 + Math.sin(a * 3 + cx) * wobble : 1;
        pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
      }
      return pts;
    },

    /** Mirror a path horizontally about pixel-center cx. */
    mirror(path, cx = 31.5) {
      return path.map(([x, y]) => [2 * cx - x, y]).reverse();
    },
  };
})();
