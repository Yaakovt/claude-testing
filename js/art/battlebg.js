'use strict';
/**
 * Battle backgrounds — one per environment, painted once into offscreen
 * canvases. Each has a sky/backdrop plus two ground platforms (enemy, player).
 */
const BattleBG = (() => {
  const cache = {};

  function surface() { return new PixelSurface(240, 112); }

  function paintSky(s, top, bottom) {
    for (let y = 0; y < 112; y++) {
      const t = y / 112;
      const mix = (a, b) => {
        const [r1, g1, b1] = Px.hexToRgb(a), [r2, g2, b2] = Px.hexToRgb(b);
        return Px.rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
      };
      s.rect(0, y, 240, 1, mix(top, bottom));
    }
  }

  function platform(s, cx, cy, rx, ry, ramp) {
    s.fillEllipse(cx, cy + 1, rx, ry, ramp.o);
    s.fillEllipse(cx, cy, rx, ry, ramp.d);
    s.fillEllipse(cx - 2, cy - 1, rx - 3, ry - 1, ramp.b);
    s.dither(cx - rx + 4, cy - ry + 1, rx, ry, ramp.l, 1);
  }

  const defs = {
    grass(s) {
      paintSky(s, '#a8d8f8', '#e0f4fc');
      // distant treeline
      const tree = Px.ramp('#4e7a4a');
      for (let i = 0; i < 12; i++) s.fillEllipse(10 + i * 22, 62 + (i % 3), 14, 10, i % 2 ? tree.b : tree.d);
      s.rect(0, 70, 240, 42, '#8fc27c');
      s.dither(0, 70, 240, 42, '#a4d18e', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#7ab06a'));
      platform(s, 56, 104, 52, 14, Px.ramp('#6da05e'));
    },
    snow(s) {
      paintSky(s, '#b8d0e8', '#eef6fc');
      const peak = Px.ramp('#c9d9ea');
      s.fillPoly([[0, 66], [40, 30], [80, 66]], peak.b);
      s.fillPoly([[60, 66], [110, 24], [160, 66]], peak.l);
      s.fillPoly([[140, 66], [190, 34], [240, 66]], peak.b);
      s.fillPoly([[30, 40], [40, 30], [50, 40]], '#ffffff');
      s.fillPoly([[100, 34], [110, 24], [120, 34]], '#ffffff');
      s.rect(0, 66, 240, 46, '#e8f2fa');
      s.dither(0, 66, 240, 46, '#ffffff', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#d8e8f4'));
      platform(s, 56, 104, 52, 14, Px.ramp('#c8dcec'));
    },
    cave(s) {
      paintSky(s, '#2c2436', '#4a3c58');
      const rock = Px.ramp('#5a4a68');
      for (let i = 0; i < 8; i++) {
        s.fillPoly([[i * 32, 0], [i * 32 + 10, 26 + (i % 3) * 8], [i * 32 + 22, 0]], rock.d); // stalactites
      }
      s.rect(0, 64, 240, 48, '#4e4058');
      s.dither(0, 64, 240, 48, '#5a4a68', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#6a5878'));
      platform(s, 56, 104, 52, 14, Px.ramp('#605070'));
    },
    water(s) {
      paintSky(s, '#88c0e8', '#c8e8f8');
      s.rect(0, 58, 240, 54, '#4890d8');
      for (let y = 60; y < 112; y += 6) s.dither(0, y, 240, 2, '#68b0e8', y);
      s.line(0, 58, 240, 58, '#e8f8ff');
      platform(s, 172, 66, 42, 10, Px.ramp('#5ea0dc'));
      platform(s, 56, 104, 52, 12, Px.ramp('#4e8cc8'));
    },
    volcano(s) {
      paintSky(s, '#584048', '#a86848');
      const crag = Px.ramp('#6a4438');
      s.fillPoly([[0, 66], [50, 26], [100, 66]], crag.b);
      s.fillPoly([[80, 66], [150, 18], [220, 66]], crag.d);
      s.line(148, 22, 150, 18, '#f8a030'); // lava glow at peak
      s.rect(0, 66, 240, 46, '#7a5040');
      s.dither(0, 66, 240, 46, '#8a5c48', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#905848'));
      platform(s, 56, 104, 52, 14, Px.ramp('#7c4c40'));
    },
    aurora(s) {
      paintSky(s, '#182448', '#3c3468');
      // aurora ribbons
      for (let i = 0; i < 3; i++) {
        const col = ['#59e6b8', '#8d7bf0', '#f08bd8'][i];
        for (let x = 0; x < 240; x += 2) {
          const y = 18 + i * 8 + Math.sin(x / 26 + i * 2) * 8;
          s.rect(x, y, 2, 5, col);
        }
      }
      // stars
      for (let i = 0; i < 24; i++) s.set((i * 53) % 240, (i * 29) % 50, '#e8ecff');
      s.rect(0, 66, 240, 46, '#3c4468');
      s.dither(0, 66, 240, 46, '#4c5478', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#545c88'));
      platform(s, 56, 104, 52, 14, Px.ramp('#485078'));
    },
    interior(s) {
      paintSky(s, '#c8b090', '#e8d8b8');
      const wall = Px.ramp('#a08058');
      for (let x = 0; x < 240; x += 30) s.rect(x, 0, 2, 66, wall.d); // beams
      s.rect(0, 64, 240, 2, wall.d);
      s.rect(0, 66, 240, 46, '#b89468');
      s.dither(0, 66, 240, 46, '#c8a478', 0);
      platform(s, 172, 66, 42, 12, Px.ramp('#c0a070'));
      platform(s, 56, 104, 52, 14, Px.ramp('#b09060'));
    },
  };

  return {
    get(kind) {
      const k = defs[kind] ? kind : 'grass';
      if (!cache[k]) {
        const s = surface();
        defs[k](s);
        cache[k] = s.toCanvas();
      }
      return cache[k];
    },
  };
})();
