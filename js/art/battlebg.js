'use strict';
/**
 * Battle backgrounds — one per environment, painted once into offscreen
 * canvases. Each has a layered backdrop (sky bands, far/near silhouettes)
 * plus two textured ground platforms (enemy, player).
 */
const BattleBG = (() => {
  const cache = {};

  function surface() { return new PixelSurface(240, 112); }

  function paintSky(s, top, bottom) {
    // banded gradient (Gen-3 skies step, they don't blend smoothly)
    const BANDS = 8;
    for (let b = 0; b < BANDS; b++) {
      const t = b / (BANDS - 1);
      s.rect(0, Math.floor(b * 112 / BANDS), 240, Math.ceil(112 / BANDS) + 1, Px.mix(top, bottom, t));
    }
  }

  function clouds(s, y0, col, hi) {
    for (const [cx, cy, r] of [[30, y0, 14], [45, y0 + 3, 10], [130, y0 - 6, 16], [148, y0 - 2, 11], [210, y0 + 4, 12]]) {
      s.fillEllipse(cx, cy, r, 5, col);
      s.fillEllipse(cx - 3, cy - 2, r - 4, 3, hi);
    }
  }

  /** Textured battler platform: rim shadow, body, top light, edge tufts. */
  function platform(s, cx, cy, rx, ry, ramp, opts = {}) {
    s.fillEllipse(cx, cy + 2, rx, ry, ramp.o);                  // under-shadow
    s.fillEllipse(cx, cy, rx, ry, ramp.d);
    s.fillEllipse(cx - 2, cy - 1, rx - 3, ry - 1, ramp.b);
    s.fillEllipse(cx - 4, cy - 2, rx - 8, ry - 2, ramp.l);      // crown light
    s.dither(cx - rx + 4, cy - 2, rx * 2 - 8, ry, ramp.b, 1);
    // rim texture: tufts / stones around the front edge
    for (let i = -2; i <= 2; i++) {
      const tx = cx + i * Math.floor(rx / 3), ty = cy + ry - 2 + (i % 2 ? 0 : 1);
      s.set(tx, ty, opts.tuft || ramp.d);
      if (opts.tuft) s.set(tx, ty - 1, ramp.l);
    }
  }

  const defs = {
    grass(s) {
      paintSky(s, '#8cc8f4', '#e0f4fc');
      clouds(s, 18, '#ffffff', '#f0fbff');
      // two-depth treeline: hazy far row, saturated near row
      const far = Px.ramp('#7aa87e'), near = Px.ramp('#4e7a4a');
      for (let i = 0; i < 9; i++) s.fillEllipse(8 + i * 30, 58, 18, 9, far.b);
      for (let i = 0; i < 12; i++) {
        const r = i % 2 ? near.b : near.d;
        s.fillEllipse(10 + i * 22, 64 + (i % 3), 14, 10, r);
        s.set(10 + i * 22 - 4, 60 + (i % 3), near.l);           // canopy glint
      }
      // meadow floor
      s.rect(0, 70, 240, 42, '#8fc27c');
      s.dither(0, 70, 240, 42, '#a4d18e', 0);
      for (const [x, y] of [[20, 84], [66, 96], [120, 78], [200, 92], [228, 104]]) {
        s.set(x, y, '#6da05e'); s.set(x + 1, y - 1, '#bce0a8');  // grass flecks
      }
      platform(s, 172, 66, 42, 12, Px.ramp('#7ab06a'), { tuft: '#4e7a44' });
      platform(s, 56, 104, 52, 14, Px.ramp('#6da05e'), { tuft: '#48703e' });
    },

    snow(s) {
      paintSky(s, '#7898c8', '#dcecf8');
      // far ridge in haze, then crisp peaks with sunlit faces
      const haze = Px.ramp('#a0b8d4');
      s.fillPoly([[0, 62], [50, 40], [110, 62]], haze.b);
      s.fillPoly([[90, 62], [170, 36], [240, 62]], haze.b);
      const peak = Px.ramp('#bcd2e4');
      s.fillPoly([[0, 66], [40, 28], [80, 66]], peak.b);
      s.fillPoly([[54, 66], [110, 20], [166, 66]], peak.l);
      s.fillPoly([[140, 66], [196, 32], [240, 66]], peak.b);
      // snow caps + shadowed lee faces
      s.fillPoly([[30, 38], [40, 28], [50, 38]], '#ffffff');
      s.fillPoly([[98, 32], [110, 20], [124, 32]], '#ffffff');
      s.fillPoly([[186, 42], [196, 32], [208, 42]], '#ffffff');
      s.fillPoly([[110, 20], [124, 32], [118, 40]], peak.d);
      // drifting flakes
      for (let i = 0; i < 18; i++) s.set((i * 37 + 9) % 240, (i * 23) % 60, i % 3 ? '#ffffff' : '#d8e8f4');
      s.rect(0, 66, 240, 46, '#e8f2fa');
      s.dither(0, 66, 240, 46, '#ffffff', 0);
      s.fillEllipse(30, 80, 16, 3, '#d8e6f2'); s.fillEllipse(200, 96, 20, 4, '#d8e6f2');   // drifts
      platform(s, 172, 66, 42, 12, Px.ramp('#d8e8f4'));
      platform(s, 56, 104, 52, 14, Px.ramp('#c8dcec'));
    },

    cave(s) {
      paintSky(s, '#241e2e', '#4a3c58');
      const rock = Px.ramp('#5a4a68');
      // layered stalactites: far dim row, near lit row with drip tips
      for (let i = 0; i < 10; i++) {
        s.fillPoly([[i * 26 - 6, 0], [i * 26 + 4, 20 + (i % 3) * 6], [i * 26 + 14, 0]], rock.d2);
      }
      for (let i = 0; i < 8; i++) {
        const bx = i * 32 + 8;
        s.fillPoly([[bx - 10, 0], [bx, 30 + (i % 3) * 8], [bx + 10, 0]], rock.d);
        s.line(bx - 4, 8, bx, 24 + (i % 3) * 8, rock.b);        // lit edge
        s.set(bx, 31 + (i % 3) * 8, '#8cd8f0');                 // drip glint
      }
      // glowing crystals tucked in the dark
      for (const [x, y] of [[26, 52], [122, 46], [214, 55]]) {
        s.tri(x - 3, y + 8, x, y - 4, x + 3, y + 8, '#68b8d8');
        s.line(x, y - 4, x, y + 6, '#b8ecff');
      }
      s.rect(0, 64, 240, 48, '#463a52');
      s.dither(0, 64, 240, 48, '#5a4a68', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#6a5878'));
      platform(s, 56, 104, 52, 14, Px.ramp('#605070'));
    },

    water(s) {
      paintSky(s, '#78b8e8', '#d0ecfa');
      clouds(s, 16, '#ffffff', '#f0fbff');
      // horizon glint + distant isle
      s.rect(0, 56, 240, 2, '#e8f8ff');
      s.fillEllipse(196, 55, 18, 5, '#5a8a68');
      s.fillEllipse(190, 51, 6, 4, '#48703e');
      // open sea: banded swells growing toward the camera
      s.rect(0, 58, 240, 54, '#4890d8');
      for (let y = 60; y < 112; y += 5) {
        const w = Px.mix('#4890d8', '#2f6cb4', (y - 58) / 54);
        s.rect(0, y, 240, 5, w);
        for (let x = ((y * 7) % 20); x < 240; x += 20 + (y % 3) * 6) {
          s.line(x, y + 2, x + 6 + (y % 2) * 3, y + 2, '#a8d8f4');   // crest lines
        }
      }
      s.set(30, 62, '#e8f8ff'); s.set(150, 74, '#e8f8ff'); s.set(90, 94, '#e8f8ff');
      platform(s, 172, 66, 42, 10, Px.ramp('#5ea0dc'));
      platform(s, 56, 104, 52, 12, Px.ramp('#4e8cc8'));
      // foam rings around the platforms
      s.fillEllipse(172, 72, 44, 6, '#8cc4ec'); s.fillEllipse(172, 71, 42, 5, '#5ea0dc');
      s.fillEllipse(56, 110, 54, 6, '#7cb8e8');
    },

    volcano(s) {
      paintSky(s, '#4a3040', '#b06848');
      // smoke plume drifting off the far cone
      const crag = Px.ramp('#6a4438');
      s.fillEllipse(150, 12, 26, 7, '#5a4048'); s.fillEllipse(170, 8, 18, 5, '#524048');
      s.fillPoly([[0, 66], [50, 26], [100, 66]], crag.b);
      s.fillPoly([[80, 66], [150, 18], [220, 66]], crag.d);
      s.fillPoly([[180, 66], [230, 38], [240, 66]], crag.b);
      // crater rim glow + short lava tongues hugging the slope
      s.fillEllipse(150, 20, 5, 2, '#e86028');
      s.fillEllipse(150, 19, 3, 1, '#f8d048');
      s.stroke(148, 21, 143, 30, 1, Px.ramp('#e86028'));
      s.stroke(153, 21, 157, 33, 1, Px.ramp('#f8a030'));
      s.set(143, 31, '#f8d048'); s.set(157, 34, '#f8d048');
      // drifting embers
      for (let i = 0; i < 10; i++) s.set((i * 47 + 20) % 240, (i * 31 + 8) % 58, i % 2 ? '#f8a030' : '#e86028');
      s.rect(0, 66, 240, 46, '#7a5040');
      s.dither(0, 66, 240, 46, '#8a5c48', 0);
      // cooled lava cracks in the ground
      s.line(20, 84, 44, 88, '#e86028'); s.set(45, 89, '#f8a030');
      s.line(200, 100, 224, 96, '#e86028');
      platform(s, 172, 66, 42, 12, Px.ramp('#905848'));
      platform(s, 56, 104, 52, 14, Px.ramp('#7c4c40'));
    },

    aurora(s) {
      paintSky(s, '#101c3c', '#3c3468');
      // starfield + moon
      for (let i = 0; i < 30; i++) s.set((i * 53 + 7) % 240, (i * 29) % 56, i % 4 ? '#e8ecff' : '#8890c0');
      s.fillCircle(206, 14, 7, '#e8ecf8'); s.fillCircle(203, 12, 6, '#f8fbff');
      s.fillCircle(209, 16, 5, '#101c3c');                       // crescent bite
      // flowing ribbons with bright cores
      for (let i = 0; i < 3; i++) {
        const col = ['#59e6b8', '#8d7bf0', '#f08bd8'][i];
        const core = ['#a8f8dc', '#c8bcf8', '#f8c8ec'][i];
        for (let x = 0; x < 240; x += 2) {
          const y = 18 + i * 8 + Math.sin(x / 26 + i * 2) * 8;
          s.rect(x, y, 2, 6, col);
          if (x % 6 === 0) s.rect(x, y + 1, 2, 2, core);
        }
      }
      // jagged mountain silhouette under the lights
      const mt = Px.ramp('#20284a');
      s.fillPoly([[0, 66], [30, 48], [60, 66]], mt.b);
      s.fillPoly([[50, 66], [95, 42], [140, 66]], mt.d);
      s.fillPoly([[130, 66], [180, 50], [240, 66]], mt.b);
      s.line(80, 50, 95, 42, '#59e6b8');                         // ridge catching the glow
      s.rect(0, 66, 240, 46, '#3c4468');
      s.dither(0, 66, 240, 46, '#4c5478', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#545c88'));
      platform(s, 56, 104, 52, 14, Px.ramp('#485078'));
      // ribbon light pooling on the platforms
      s.fillEllipse(168, 62, 20, 3, '#59e6b8'); s.fillEllipse(52, 100, 24, 3, '#8d7bf0');
    },

    interior(s) {
      paintSky(s, '#b89c74', '#e8d8b8');
      const wall = Px.ramp('#a08058');
      // paneled hall: beams, wainscot rail, warm window light shafts
      for (let x = 10; x < 240; x += 44) {
        s.rect(x, 0, 3, 64, wall.d); s.line(x, 0, x, 64, wall.b);
      }
      s.rect(0, 20, 240, 2, wall.d);                             // picture rail
      for (const wx of [54, 142, 208]) {                          // glowing windows
        s.rect(wx, 26, 16, 22, '#f8ecc8');
        s.rect(wx, 26, 16, 1, wall.d); s.rect(wx, 47, 16, 1, wall.d);
        s.line(wx + 8, 26, wx + 8, 47, wall.d);
        // light shaft angling to the floor
        s.fillPoly([[wx, 48], [wx + 16, 48], [wx + 24, 66], [wx - 8, 66]], '#d8c294');
      }
      s.rect(0, 62, 240, 4, wall.d);                             // baseboard
      s.rect(0, 66, 240, 46, '#b89468');
      s.dither(0, 66, 240, 46, '#c8a478', 0);
      // plank seams
      for (let y = 74; y < 112; y += 10) s.line(0, y, 240, y, '#a8845c');
      platform(s, 172, 66, 42, 12, Px.ramp('#c0a070'));
      platform(s, 56, 104, 52, 14, Px.ramp('#b09060'));
    },
  };

  return {
    get(kind) {
      const k = defs[kind] ? kind : 'grass';
      if (typeof Assets !== 'undefined') {
        const ov = Assets.get('battlebg/' + k);
        if (ov) return ov;
      }
      if (!cache[k]) {
        const s = surface();
        defs[k](s);
        cache[k] = s.toCanvas();
      }
      return cache[k];
    },
  };
})();
