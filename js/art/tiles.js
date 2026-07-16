'use strict';
/**
 * The region tileset. Every tile is hand-drawn at 16x16 through the pixel
 * toolkit. Tiles with `anim` get re-rendered per frame phase (water, flowers).
 *
 * Tile def: { draw(s, ph), solid, water, grass, ice, ledge, cut, boulder,
 *             smash, fall, counter, anim, over (drawn above player) }
 */
const Tiles = (() => {
  const defs = {};
  const cache = {};
  function T(id, props) { defs[id] = props; }

  // shared palettes
  const GRASS = Px.ramp('#7cb860');
  const DARKG = Px.ramp('#5a9a4e');
  const PATH = Px.ramp('#d8c088');
  const SNOW = Px.ramp('#e8f0f8');
  const WATER = Px.ramp('#4890d8');
  const TRUNK = Px.ramp('#7a5a38');
  const PINE = Px.ramp('#3e7a48');
  const ROCK = Px.ramp('#a89878');
  const CAVE = Px.ramp('#5a4a68');
  const WOOD = Px.ramp('#b08850');
  const ROOF_R = Px.ramp('#c85848');
  const ROOF_B = Px.ramp('#5878c8');
  const ROOF_G = Px.ramp('#48a868');
  const ROOF_P = Px.ramp('#9868b8');
  const WALLC = Px.ramp('#e8dcc0');
  const ICE = Px.ramp('#b8e0f0');

  /**
   * Per-position variant support: ground tiles marked `vary: 3` are rendered
   * in 3 speck layouts, picked by map position — kills the "wallpaper lattice"
   * effect of identical tiles across big open areas. vw() wraps an x-coord by
   * a per-variant offset.
   */
  const VOFF = [0, 6, 11];
  const vw = (x, vr) => (x + VOFF[vr % 3]) % 16;

  /**
   * Gen-3 meadow base: soft two-tone mowing bands, scattered V-tufts (a dark
   * root with two light blade tips) and single-pixel clover specks.
   */
  function grassBase(s, ramp = GRASS, vr = 0) {
    s.rect(0, 0, 16, 16, ramp.b);
    s.rect(0, 4, 16, 4, Px.mix(ramp.b, ramp.l, 0.10));    // faint mowing band
    s.rect(0, 12, 16, 4, Px.mix(ramp.b, ramp.d, 0.08));   // faint shaded band
    // V-tufts: root + blades
    for (const [x, y] of [[2, 2], [10, 5], [5, 9], [13, 12], [2, 14]]) {
      const wx = vw(x, vr);
      if (wx < 1 || wx > 14) continue;
      s.set(wx, y + 1, ramp.d);
      s.set(wx - 1, y, ramp.l); s.set(wx + 1, y, ramp.l);
    }
    // clover specks
    s.set(vw(7, vr), 1, ramp.l); s.set(vw(14, vr), 7, ramp.d);
    s.set(vw(8, vr), 13, ramp.l); s.set(vw(4, vr), 6, ramp.d);
  }

  T('grass', { vary: 3, draw: (s, ph, vr) => grassBase(s, GRASS, vr) });

  T('tallgrass', {
    grass: true, vary: 2,
    draw(s, ph, vr) {
      s.rect(0, 0, 16, 16, DARKG.b);
      // two staggered rows of layered grass clumps: dark base fan, mid blades,
      // bright tips — reads as deep rustling grass like R/S/E
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 4; i++) {
          const x = 1 + i * 4 + ((j + vr) % 2 ? 2 : 0), y = 6 + j * 8;
          if (x > 13) continue;
          s.tri(x - 1, y + 1, x + 3, y + 1, x + 1, y - 4, DARKG.d);   // clump body
          s.line(x + 1, y, x + 1, y - 4, DARKG.b);                    // center blade
          s.line(x, y, x - 1, y - 3, DARKG.d2);                       // left blade
          s.line(x + 2, y, x + 3, y - 3, DARKG.l);                    // right blade
          s.set(x + 1, y - 5, GRASS.l);                               // bright tip
          s.set(x - 1, y - 2, GRASS.l);
        }
      }
      s.rect(0, 15, 16, 1, DARKG.d);                                  // rooted base
    },
  });

  T('flowers', {
    anim: 4,
    draw(s, ph) {
      grassBase(s);
      const cols = [['#f8d048', '#b88818'], ['#f88888', '#c04848']];
      // 4-beat sway: lean left, center, lean right, center — like a breeze
      const lean = [-1, 0, 1, 0][ph % 4];
      for (const [x, y, c] of [[3, 3, 0], [11, 5, 1], [5, 11, 1], [12, 12, 0]]) {
        s.set(x + 1, y + 2, DARKG.d);                      // stem stays rooted
        s.set(x + lean, y + 2, GRASS.d);                   // leaf
        const fx = x + lean;
        // 4-petal blossom with a dark center
        s.set(fx, y, cols[c][0]); s.set(fx + 1, y, '#ffffff');
        s.set(fx, y + 1, '#ffffff'); s.set(fx + 1, y + 1, cols[c][0]);
        s.set(fx + (ph % 2), y + (ph > 1 ? 1 : 0), cols[c][1]);   // center winks
        if (ph % 4 === 1) s.set(fx + 1, y - 1, '#fff8d8'); // glint on the upbeat
      }
    },
  });

  T('path', {
    vary: 3,
    draw(s, ph, vr) {
      // packed dirt: flat base so long runs tile seamlessly, with sparse
      // pebbles and sun flecks for texture (no edge art — paths abut anything)
      s.rect(0, 0, 16, 16, PATH.b);
      for (const [x, y] of [[3, 5], [10, 3], [13, 8], [5, 11], [9, 14]]) {
        const wx = vw(x, vr);
        if (wx > 14) continue;
        s.set(wx, y, PATH.d); s.set(wx + 1, y, PATH.l); s.set(wx, y + 1, PATH.d2);
      }
      s.set(vw(7, vr), 7, PATH.l); s.set(vw(1, vr), 2, PATH.l); s.set(vw(14, vr), 13, PATH.l);
      s.set(vw(6, vr), 1, Px.mix(PATH.b, PATH.d, 0.5)); s.set(vw(12, vr), 15, Px.mix(PATH.b, PATH.d, 0.5));
    },
  });

  T('snow', {
    vary: 3,
    draw(s, ph, vr) {
      // quiet snowpack: near-flat with sparse glitter and the faintest
      // footprint dimples — loud patterns repeat badly across a whole town
      s.rect(0, 0, 16, 16, SNOW.b);
      s.set(vw(4, vr), 9, SNOW.d); s.set(vw(5, vr), 9, SNOW.d);
      s.set(vw(11, vr), 4, SNOW.d); s.set(vw(10, vr), 14, SNOW.d);
      s.set(vw(3, vr), 2, '#ffffff'); s.set(vw(13, vr), 6, '#ffffff'); s.set(vw(6, vr), 13, '#ffffff');
      s.set(vw(8, vr), 6, SNOW.l); s.set(vw(14, vr), 11, SNOW.l);
    },
  });

  T('tallsnow', {
    grass: true, vary: 2,
    draw(s, ph, vr) {
      s.rect(0, 0, 16, 16, SNOW.b);
      // frosted grass clumps poking through the snowpack
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 4; i++) {
          const x = 1 + i * 4 + ((j + vr) % 2 ? 2 : 0), y = 6 + j * 8;
          if (x > 13) continue;
          s.tri(x - 1, y + 1, x + 3, y + 1, x + 1, y - 4, '#a8c8d8');
          s.line(x + 1, y, x + 1, y - 4, '#c8e0ec');
          s.line(x + 2, y, x + 3, y - 3, '#ffffff');
          s.set(x + 1, y - 5, '#ffffff');
          s.set(x - 1, y + 1, SNOW.d);       // snow piled at the base
        }
      }
    },
  });

  T('ice', {
    ice: true,
    draw(s) {
      s.rect(0, 0, 16, 16, ICE.b);
      // glacial sheen: two diagonal light bands
      for (let i = 0; i < 16; i++) {
        const x = (i + 3) % 16; s.set(x, i, ICE.l);
        const x2 = (i + 9) % 16; s.set(x2, i, Px.mix(ICE.b, ICE.l, 0.5));
      }
      // deep cracks
      s.line(2, 3, 6, 7, ICE.d); s.line(6, 7, 5, 11, ICE.d2);
      s.line(10, 2, 13, 5, ICE.d); s.line(12, 10, 14, 13, ICE.d);
      // specular sparkles
      s.set(4, 4, '#ffffff'); s.set(11, 3, '#ffffff'); s.set(13, 12, '#ffffff');
      s.set(1, 14, ICE.h);
    },
  });

  T('water', {
    solid: true, water: true, anim: 4,
    draw(s, ph) {
      // FABLE ART: rolling swells — a deep gradient base, sinuous wave crests
      // that travel with the phase, and sparkling crest-glints.
      const DEEP = Px.shift(WATER.b, 0.01, 0.04, -0.08);
      s.rect(0, 0, 16, 16, WATER.b);
      s.rect(0, 10, 16, 6, DEEP);                    // deeper toward tile bottom
      s.dither(0, 9, 16, 2, DEEP, ph % 2);           // soft gradient seam
      const t = (ph % 4) / 4;
      // two rows of sinuous crests drifting right as the phase advances
      for (let row = 0; row < 2; row++) {
        const baseY = 3 + row * 8;
        for (let x = 0; x < 16; x++) {
          const w = Math.sin((x / 16 + t + row * 0.5) * Math.PI * 2);
          const y = baseY + Math.round(w * 1.5);
          if (w > 0.55) { s.set(x, y, WATER.h); }            // sunlit crest
          else if (w > -0.2) { s.set(x, y, WATER.l); }        // face of the swell
          else if (w < -0.75) { s.set(x, y + 1, WATER.d); }   // trough shadow
        }
      }
      // traveling sparkle glints
      const g1 = (ph * 5 + 2) % 16, g2 = (ph * 7 + 11) % 16;
      s.set(g1, 5, '#e8f8ff'); s.set(g2, 12, '#d8f0ff');
      if (ph % 2) s.set((g1 + 8) % 16, 13, WATER.h);
    },
  });

  T('waterfall', {
    solid: true, fall: true, anim: 4,
    draw(s, ph) {
      // sheeting columns of water with falling white streaks + churning foam base
      s.rect(0, 0, 16, 16, WATER.d);
      for (let x = 0; x < 16; x++) {
        const col = (x * 5) % 3;
        s.line(x, 0, x, 16, col === 0 ? WATER.b : col === 1 ? WATER.l : '#a8d8f8');
      }
      // streaks race downward with the phase (two per column pair)
      for (let x = 0; x < 16; x += 2) {
        const y1 = (x * 3 + ph * 4) % 16;
        const y2 = (x * 7 + ph * 4 + 8) % 16;
        s.set(x, y1, '#e8f8ff'); s.line(x, y1 + 1, x, Math.min(15, y1 + 2), '#c8ecff');
        s.set(x + 1, y2, '#e8f8ff');
      }
      // foam churns along the bottom rows
      for (let x = 0; x < 16; x++) {
        const bub = (x * 11 + ph * 3) % 4;
        if (bub < 2) s.set(x, 14 + (bub % 2), '#f0fcff');
        s.set(x, 13, ((x + ph) % 3) ? '#c8ecff' : WATER.h);
      }
    },
  });

  T('rock', {
    solid: true,
    draw(s) {
      // cliff face: sunlit top facet, strata seams, deep base shadow
      s.rect(0, 0, 16, 16, ROCK.d2);
      s.fillPoly([[0, 16], [1, 6], [4, 3], [9, 1], [13, 4], [16, 8], [16, 16]], ROCK.b);
      s.fillPoly([[3, 4], [9, 2], [12, 4], [8, 6]], ROCK.l);          // top facet
      s.line(1, 6, 4, 3, ROCK.h); s.line(4, 3, 9, 1, ROCK.h);         // lit rim
      s.line(9, 1, 13, 4, ROCK.l);
      // crevices
      s.line(5, 6, 4, 12, ROCK.d); s.line(4, 12, 6, 15, ROCK.d2);
      s.line(10, 5, 11, 10, ROCK.d); s.line(11, 10, 10, 15, ROCK.d);
      s.line(13, 8, 14, 12, ROCK.d);
      // base shadow + rubble
      s.rect(0, 14, 16, 2, ROCK.d);
      s.set(2, 13, ROCK.l); s.set(8, 14, ROCK.d2); s.set(13, 14, ROCK.l);
    },
  });

  T('boulder', {
    solid: true, boulder: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 13, 6, 2, Px.shift(GRASS.d, 0, 0, -0.08));   // ground shadow
      s.ball(8, 8, 6, 5, ROCK);
      s.fillEllipse(6, 6, 3, 2, ROCK.l);                            // top light
      s.set(5, 5, ROCK.h);
      s.line(9, 6, 11, 9, ROCK.d); s.line(4, 9, 6, 11, ROCK.d);     // facet seams
      s.set(10, 12, GRASS.d); s.set(4, 12, GRASS.l);                // grass lapping the base
    },
  });

  T('crackrock', {
    solid: true, smash: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 13, 6, 2, Px.shift(GRASS.d, 0, 0, -0.08));
      s.ball(8, 8, 6, 5, ROCK);
      s.fillEllipse(6, 6, 3, 2, ROCK.l);
      // spidering cracks from an impact point
      s.line(8, 8, 5, 4, '#3a3028'); s.line(8, 8, 7, 12, '#3a3028');
      s.line(8, 8, 12, 7, '#3a3028'); s.line(8, 8, 10, 11, '#4a3c30');
      s.set(8, 8, '#241c18');
    },
  });

  T('tree', {
    solid: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 14, 6, 2, Px.shift(GRASS.d, 0, 0, -0.10));   // canopy shadow
      // trunk with root flare
      s.rect(6, 10, 4, 5, TRUNK.b);
      s.line(6, 10, 6, 14, TRUNK.d); s.line(9, 10, 9, 14, TRUNK.l);
      s.set(5, 14, TRUNK.b); s.set(10, 14, TRUNK.d);
      // two-lobe canopy: dark under-layer, mid dome, leaf-cluster highlights
      s.fillEllipse(8, 8, 7, 4, DARKG.d);                           // under-canopy
      s.fillEllipse(8, 5, 6, 4, DARKG.b);                           // main dome
      s.fillEllipse(4, 4, 3, 2, DARKG.b);                           // side lobe
      s.fillEllipse(11, 4, 3, 2, DARKG.b);
      // clustered highlights (leaf bunches)
      s.fillEllipse(6, 3, 2, 1, DARKG.l); s.fillEllipse(11, 3, 2, 1, DARKG.l);
      s.set(4, 2, GRASS.l); s.set(9, 2, GRASS.l); s.set(12, 4, DARKG.l);
      s.set(7, 5, DARKG.l); s.set(10, 6, DARKG.d2);
      // notched silhouette pixels for a leafy edge
      s.set(1, 5, DARKG.d); s.set(14, 6, DARKG.d); s.set(2, 8, DARKG.d);
    },
  });

  T('pine', {
    solid: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 14, 5, 2, Px.shift(GRASS.d, 0, 0, -0.10));
      s.rect(7, 12, 2, 3, TRUNK.b); s.set(7, 12, TRUNK.d);
      // three stacked skirts, each with a lit left edge and dark hem
      s.tri(8, 0, 4, 6, 12, 6, PINE.b);
      s.tri(8, 3, 2, 10, 14, 10, PINE.b);
      s.tri(8, 6, 1, 13, 15, 13, PINE.b);
      s.line(8, 0, 4, 6, PINE.l); s.line(8, 3, 2, 10, PINE.l); s.line(8, 6, 1, 13, PINE.l);
      s.line(4, 6, 12, 6, PINE.d); s.line(2, 10, 14, 10, PINE.d); s.line(1, 13, 15, 13, PINE.d2);
      s.set(8, 1, PINE.h);
      // snow dusting on the tips
      s.set(8, 0, '#ffffff'); s.set(7, 1, '#eef6fc'); s.set(9, 3, '#ffffff'); s.set(3, 9, '#eef6fc');
    },
  });

  T('snowpine', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, SNOW.b);
      s.fillEllipse(8, 14, 5, 2, SNOW.l);
      s.rect(7, 12, 2, 3, TRUNK.b); s.set(7, 12, TRUNK.d);
      const DK = Px.ramp('#2e5c3a');
      s.tri(8, 0, 4, 6, 12, 6, DK.b);
      s.tri(8, 3, 2, 10, 14, 10, DK.b);
      s.tri(8, 6, 1, 13, 15, 13, DK.b);
      // heavy snow load on each skirt
      s.line(4, 6, 8, 0, '#ffffff'); s.line(2, 10, 8, 3, '#ffffff'); s.line(1, 13, 8, 6, '#ffffff');
      s.rect(5, 5, 4, 1, '#eef6fc'); s.rect(4, 9, 5, 1, '#eef6fc'); s.rect(3, 12, 6, 1, '#ffffff');
      s.line(8, 0, 12, 6, DK.d); s.line(8, 3, 14, 10, DK.d); s.line(8, 6, 15, 13, DK.d);
      s.set(8, 0, '#ffffff');
    },
  });

  T('cutbush', {
    solid: true, cut: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 13, 5, 2, Px.shift(GRASS.d, 0, 0, -0.08));
      s.ball(8, 9, 5, 4, DARKG);
      // leaf notches around the silhouette
      s.set(3, 8, GRASS.b); s.set(13, 9, GRASS.b); s.set(8, 5, GRASS.b);
      // leaf clusters
      s.set(6, 7, DARKG.l); s.set(10, 7, DARKG.l); s.set(8, 9, DARKG.l);
      s.set(5, 10, DARKG.d2); s.set(11, 11, DARKG.d2);
      s.line(7, 5, 9, 5, GRASS.l);                        // fresh sprout on top
      s.set(8, 4, GRASS.h);
    },
  });

  T('ledge', {
    ledge: 'down',
    draw(s) {
      grassBase(s);
      // chunky earthen lip: lit top edge, packed face, deep undercut
      s.rect(0, 8, 16, 2, PATH.b);
      s.rect(0, 8, 16, 1, PATH.l);
      s.rect(0, 10, 16, 3, PATH.d);
      s.rect(0, 13, 16, 1, Px.shift(PATH.d, 0, 0, -0.14));
      // face texture: root nubs + stones
      s.set(3, 11, PATH.b); s.set(11, 11, PATH.b); s.set(7, 12, PATH.d2);
      s.set(2, 9, PATH.h); s.set(12, 9, PATH.h);
      s.rect(0, 14, 16, 1, Px.shift(GRASS.d, 0, 0, -0.06));   // cast shadow on grass below
    },
  });

  T('fence', {
    solid: true,
    draw(s) {
      grassBase(s);
      // posts with caps + two rails with grain
      for (const px of [1, 13]) {
        s.rect(px, 5, 2, 8, WOOD.b);
        s.set(px, 5, WOOD.l); s.set(px + 1, 12, WOOD.d);
        s.rect(px, 4, 2, 1, WOOD.d);                       // cap
      }
      s.rect(0, 6, 16, 2, WOOD.l); s.line(0, 7, 16, 7, WOOD.b);
      s.rect(0, 10, 16, 2, WOOD.d); s.line(0, 10, 16, 10, WOOD.b);
      s.set(6, 6, WOOD.h); s.set(10, 11, WOOD.d2);          // nail glints
    },
  });

  T('sign', {
    solid: true, sign: true,
    draw(s) {
      grassBase(s);
      s.fillEllipse(8, 14, 4, 1, Px.shift(GRASS.d, 0, 0, -0.08));
      s.rect(7, 9, 2, 5, TRUNK.b); s.set(7, 9, TRUNK.l); s.set(8, 13, TRUNK.d);
      // plank board: lit top bevel, grain lines, nail heads
      s.rect(2, 3, 12, 7, WOOD.b);
      s.rect(2, 3, 12, 1, WOOD.l); s.rect(2, 9, 12, 1, WOOD.d);
      s.line(2, 3, 2, 9, WOOD.l); s.line(13, 3, 13, 9, WOOD.d);
      s.line(4, 5, 11, 5, WOOD.d); s.line(4, 7, 9, 7, WOOD.d);   // etched text
      s.set(3, 4, WOOD.d2); s.set(12, 4, WOOD.d2);               // nails
    },
  });

  T('sand', {
    vary: 3,
    draw(s, ph, vr) {
      const SAND = Px.ramp('#e8d8a0');
      s.rect(0, 0, 16, 16, SAND.b);
      // ripple crescents left by the tide
      const o = [0, 4, 9][vr % 3];
      s.line((2 + o) % 12, 4, (6 + o) % 12 + 2, 3, SAND.d);
      s.line((9 + o) % 12, 9, (9 + o) % 12 + 4, 8, SAND.d);
      s.line((3 + o) % 12, 13, (3 + o) % 12 + 4, 12, SAND.d);
      s.set(vw(4, vr), 3, SAND.h); s.set(vw(11, vr), 8, SAND.h); s.set(vw(5, vr), 12, SAND.h);
      // tiny shell + pebble (variant 1 hides the shell)
      if (vr !== 1) { s.set(vw(12, vr), 3, '#f0f0e8'); s.set(vw(13, vr), 3, '#d8c8b0'); }
      s.set(vw(3, vr), 8, '#c8b078');
    },
  });

  // ---- cave ----
  T('cavefloor', {
    vary: 3,
    draw(s, ph, vr = 0) {
      s.rect(0, 0, 16, 16, CAVE.b);
      // near-flat stony ground: sparse grit so big floors stay quiet
      s.set(vw(4, vr), 9, CAVE.d); s.set(vw(5, vr), 9, CAVE.d);
      s.set(vw(10, vr), 3, CAVE.d); s.set(vw(11, vr), 3, CAVE.d);
      for (const [x, y] of [[2, 2], [13, 5], [7, 12], [10, 14]]) s.set(vw(x, vr), y, CAVE.l);
      s.set(vw(6, vr), 5, CAVE.d2); s.set(vw(12, vr), 11, CAVE.d2);
    },
  });

  T('cavewall', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, CAVE.d2);
      // faceted wall: big lit slab + strata seams
      s.fillPoly([[0, 16], [1, 8], [4, 3], [9, 1], [13, 5], [16, 10], [16, 16]], CAVE.b);
      s.fillPoly([[3, 5], [9, 2], [11, 5], [6, 7]], CAVE.l);
      s.line(1, 8, 4, 3, CAVE.l); s.line(4, 3, 9, 1, CAVE.h);
      s.line(4, 8, 3, 13, CAVE.d); s.line(9, 6, 10, 12, CAVE.d);
      s.line(12, 8, 13, 13, CAVE.d2);
      s.rect(0, 14, 16, 2, CAVE.d);
      s.set(6, 10, CAVE.l); s.set(11, 14, CAVE.o);
    },
  });

  T('crystal', {
    solid: true, anim: 4,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, CAVE.b);
      // slow breathing pulse: dim -> bright -> peak -> bright
      const beat = [0, 1, 2, 1][ph % 4];
      const glow = ['#68b8d8', '#8cd8f0', '#b8f0ff'][beat];
      // aura halo around the spire at the pulse's peak
      if (beat === 2) { s.fillEllipse(8, 8, 7, 7, '#3a5a78'); }
      s.tri(5, 13, 8, 2, 11, 13, glow);
      s.line(8, 2, 8, 12, beat === 2 ? '#ffffff' : '#e8fcff');
      s.tri(2, 14, 4, 8, 6, 14, beat ? '#68b0d8' : '#5898c0');
      s.tri(10, 14, 13, 7, 15, 14, beat ? '#68b0d8' : '#5898c0');
      // drifting sparkle motes
      const m1 = [[3, 4], [12, 3], [13, 10], [2, 9]][ph % 4];
      s.set(m1[0], m1[1], '#e8fcff');
    },
  });

  // ---- buildings (exterior) ----
  function roofTile(s, ramp, part) {
    // shingle courses: each row has a lit crown and a shadowed underlap
    s.rect(0, 0, 16, 16, ramp.b);
    for (let y = 0; y < 16; y += 4) {
      s.line(0, y, 16, y, ramp.l);                       // course crown
      s.line(0, y + 3, 16, y + 3, ramp.d);               // underlap shadow
      // staggered shingle joints
      const off = (y / 4) % 2 ? 2 : 0;
      for (let x = off; x < 16; x += 5) s.set(x, y + 1, ramp.d);
    }
    s.rect(0, 0, 16, 1, ramp.h);                         // ridge light
    if (part === 'l') { s.rect(0, 0, 2, 16, ramp.l); s.line(0, 0, 0, 16, ramp.d2); }
    if (part === 'r') { s.rect(14, 0, 2, 16, ramp.d); s.line(15, 0, 15, 16, ramp.d2); }
  }
  T('roof_l', { solid: true, draw: (s) => roofTile(s, ROOF_R, 'l') });
  T('roof_m', { solid: true, draw: (s) => roofTile(s, ROOF_R, 'm') });
  T('roof_r', { solid: true, draw: (s) => roofTile(s, ROOF_R, 'r') });
  T('roofb_l', { solid: true, draw: (s) => roofTile(s, ROOF_B, 'l') });
  T('roofb_m', { solid: true, draw: (s) => roofTile(s, ROOF_B, 'm') });
  T('roofb_r', { solid: true, draw: (s) => roofTile(s, ROOF_B, 'r') });
  T('roofg_l', { solid: true, draw: (s) => roofTile(s, ROOF_G, 'l') });
  T('roofg_m', { solid: true, draw: (s) => roofTile(s, ROOF_G, 'm') });
  T('roofg_r', { solid: true, draw: (s) => roofTile(s, ROOF_G, 'r') });
  T('roofp_l', { solid: true, draw: (s) => roofTile(s, ROOF_P, 'l') });
  T('roofp_m', { solid: true, draw: (s) => roofTile(s, ROOF_P, 'm') });
  T('roofp_r', { solid: true, draw: (s) => roofTile(s, ROOF_P, 'r') });

  T('wall', {
    solid: true,
    draw(s) {
      // plaster wall over a stone footing course
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(0, 0, 16, 1, WALLC.d);                       // eave shadow
      s.rect(0, 1, 16, 1, Px.mix(WALLC.b, WALLC.d, 0.4));
      s.dither(0, 2, 16, 3, WALLC.l, 0);                  // plaster texture
      s.set(4, 6, WALLC.d); s.set(11, 8, WALLC.d);        // plaster nicks
      // footing stones
      s.rect(0, 12, 16, 4, Px.mix(WALLC.b, '#a09878', 0.55));
      s.line(0, 12, 16, 12, WALLC.d);
      s.line(5, 12, 5, 16, WALLC.d); s.line(10, 13, 10, 16, WALLC.d);
      s.set(2, 13, WALLC.l); s.set(12, 14, WALLC.l);
    },
  });

  T('window', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.dither(0, 0, 16, 2, WALLC.l, 0);
      // frame with sill
      s.rect(3, 2, 10, 10, '#4a3c30');
      s.rect(4, 3, 8, 8, ph % 2 ? '#a8d8f0' : '#98c8ec');
      // sky reflection: diagonal gleam
      s.line(5, 8, 9, 4, '#d8f0fc'); s.line(6, 9, 10, 5, '#c0e4f8');
      s.line(8, 3, 8, 10, '#4a3c30'); s.line(4, 6, 11, 6, '#4a3c30');   // muntins
      s.rect(2, 12, 12, 2, WALLC.d);                      // sill
      s.rect(2, 12, 12, 1, '#c8b898');
      // curtain hints in the top corners
      s.set(4, 3, '#e8e0d0'); s.set(11, 3, '#e8e0d0');
    },
  });

  T('door', {
    door: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.dither(0, 0, 16, 2, WALLC.l, 0);
      // frame + paneled door with lit top rail
      s.rect(3, 2, 10, 14, TRUNK.d);
      s.rect(4, 3, 8, 13, WOOD.b);
      s.rect(4, 3, 8, 1, WOOD.l);
      // two recessed panels
      s.rect(5, 5, 6, 4, WOOD.d); s.rect(6, 6, 4, 2, WOOD.b);
      s.rect(5, 10, 6, 4, WOOD.d); s.rect(6, 11, 4, 2, WOOD.b);
      s.set(10, 9, '#f8d048'); s.set(10, 10, '#b88818');   // knob + shadow
      s.line(4, 15, 11, 15, WOOD.d2);
    },
  });

  // Door-opening frames (event-driven overlay while entering a building —
  // drawn above the player so they vanish into the doorway, GBA-style).
  T('door_ajar', {
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.dither(0, 0, 16, 2, WALLC.l, 0);
      s.rect(3, 2, 10, 14, TRUNK.d);            // frame
      s.rect(4, 3, 8, 13, '#241a20');           // dark opening
      s.rect(4, 3, 3, 13, WOOD.b);              // panel swung inward, edge-on
      s.line(4, 3, 4, 15, WOOD.l);
      s.line(6, 3, 6, 15, WOOD.d);
    },
  });
  T('door_open', {
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.dither(0, 0, 16, 2, WALLC.l, 0);
      s.rect(3, 2, 10, 14, TRUNK.d);
      s.rect(4, 3, 8, 13, '#241a20');
      s.set(5, 13, '#3a2c34'); s.set(10, 5, '#3a2c34');   // faint interior glints
    },
  });

  T('mat', {
    draw(s) {
      s.rect(0, 0, 16, 16, PATH.b);
      // woven doormat: border weave + ribbed center
      s.rect(2, 3, 12, 10, PATH.d);
      s.rect(3, 4, 10, 8, PATH.l);
      for (let y = 5; y < 12; y += 2) s.line(4, y, 11, y, PATH.b);
      s.set(3, 4, PATH.h); s.set(12, 11, PATH.d2);
    },
  });

  T('center_sign', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(2, 2, 12, 12, '#f8f8f0');
      s.rect(2, 2, 12, 1, '#c8c0b0'); s.rect(2, 13, 12, 1, '#c8c0b0');
      s.rect(3, 3, 10, 10, ph % 2 ? '#f06858' : '#e05848');
      // orb emblem with a blinking glow ring
      if (ph % 2) { s.fillCircle(8, 8, 4.5, '#f8a8a0'); }
      s.fillCircle(8, 8, 3.5, '#fff');
      s.line(5, 8, 11, 8, '#e05848');
      s.fillCircle(8, 8, 1, '#303038');
      s.set(7, 6, '#ffe8e8');
    },
  });

  T('mart_sign', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(2, 2, 12, 12, '#f8f8f0');
      s.rect(2, 2, 12, 1, '#c8c0b0'); s.rect(2, 13, 12, 1, '#c8c0b0');
      s.rect(3, 3, 10, 10, '#4878d8');
      s.rect(3, 3, 10, 1, '#6a98e8');
      // bold M with a drop shadow
      s.line(6, 7, 6, 11, '#2a4888'); s.line(10, 7, 10, 11, '#2a4888');
      s.line(5, 6, 5, 10, '#fff'); s.line(5, 6, 7, 8, '#fff');
      s.line(7, 8, 9, 6, '#fff'); s.line(9, 6, 9, 10, '#fff');
    },
  });

  T('gym_statue', {
    solid: true, sign: true,
    draw(s) {
      const ST = Px.ramp('#c8c8d4');
      s.rect(0, 0, 16, 16, '#b8b8c4');
      s.dither(0, 0, 16, 16, '#c4c4d0', 0);
      // plinth
      s.rect(2, 12, 12, 3, ST.d); s.rect(2, 12, 12, 1, ST.l);
      s.rect(4, 9, 8, 3, ST.b); s.line(4, 9, 11, 9, ST.l);
      // orb held high on a pedestal figure
      s.rect(6, 6, 4, 3, ST.b); s.line(6, 6, 6, 8, ST.l);
      s.ball(8, 3, 3, 3, ST);
      s.line(6, 2, 10, 2, ST.h);                     // orb equator glint
      s.set(7, 1, '#ffffff');
      s.line(4, 12, 11, 12, ST.d2);
    },
  });

  // ---- interiors ----
  // Wood-plank floor, shared by the floor tile AND drawn under free-standing
  // furniture so those tiles never show the dark indoor clear-color around them.
  function woodFloor(s) {
    s.rect(0, 0, 16, 16, WOOD.b);
    for (const y of [5, 11]) s.line(0, y, 16, y, WOOD.d);
    s.line(8, 0, 8, 5, WOOD.d); s.line(3, 5, 3, 11, WOOD.d); s.line(12, 11, 12, 16, WOOD.d);
    s.set(2, 2, WOOD.l); s.set(12, 8, WOOD.l); s.set(5, 13, WOOD.l);
    s.set(13, 13, WOOD.d2);                             // knot
    s.rect(0, 0, 16, 1, Px.mix(WOOD.b, WOOD.l, 0.5));
  }
  T('floor_wood', { draw: (s) => woodFloor(s) });

  T('floor_tile', {
    draw(s) {
      // checkered ceramic with grout lines and corner glints
      s.rect(0, 0, 16, 16, '#e0e0d8');
      s.rect(0, 0, 8, 8, '#e8e8e0'); s.rect(8, 8, 8, 8, '#e8e8e0');
      s.line(0, 7, 16, 7, '#c0c0b8'); s.line(7, 0, 7, 16, '#c0c0b8');
      s.line(0, 8, 16, 8, '#f0f0e8'); s.line(8, 0, 8, 16, '#f0f0e8');
      s.set(1, 1, '#f8f8f0'); s.set(9, 9, '#f8f8f0');
      s.set(14, 6, '#d0d0c8'); s.set(6, 14, '#d0d0c8');
    },
  });

  T('rug', {
    draw(s) {
      const R = Px.ramp('#c86858');
      s.rect(0, 0, 16, 16, R.b);
      s.rect(1, 1, 14, 14, R.l);
      s.rect(3, 3, 10, 10, R.b);
      // woven diamond motif
      s.fillPoly([[8, 5], [11, 8], [8, 11], [5, 8]], R.d);
      s.fillPoly([[8, 6], [10, 8], [8, 10], [6, 8]], R.l);
      s.set(8, 8, R.h);
      // fringe stitches on the border
      for (let i = 2; i < 14; i += 3) { s.set(i, 1, R.d); s.set(i, 14, R.d); }
    },
  });

  T('wall_in', {
    solid: true,
    draw(s) {
      // wallpaper above a wainscot rail
      s.rect(0, 0, 16, 16, '#c8b090');
      s.rect(0, 0, 16, 1, '#d8c4a4');
      s.line(0, 3, 16, 3, '#d8c4a4');
      // subtle wallpaper stripes
      for (let x = 2; x < 16; x += 5) s.line(x, 4, x, 11, '#c0a888');
      // wainscot
      s.rect(0, 11, 16, 5, '#a08868');
      s.rect(0, 11, 16, 1, '#887050');
      s.line(0, 12, 16, 12, '#b09878');
      s.line(5, 13, 5, 16, '#8a7254'); s.line(11, 13, 11, 16, '#8a7254');
    },
  });

  T('table', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WOOD.l);
      s.rect(1, 1, 14, 11, WOOD.b);
      s.rect(1, 1, 14, 1, WOOD.l);
      // grain + edge bevel
      s.line(3, 4, 9, 4, WOOD.d); s.line(6, 8, 12, 8, WOOD.d);
      s.line(1, 11, 14, 11, WOOD.d);
      s.rect(2, 12, 2, 3, WOOD.d); s.rect(12, 12, 2, 3, WOOD.d);   // legs
      s.set(2, 12, WOOD.b); s.set(12, 12, WOOD.b);
    },
  });

  T('chair', {
    solid: true,
    draw(s) {
      woodFloor(s);
      s.rect(4, 2, 8, 3, WOOD.b); s.rect(4, 2, 8, 1, WOOD.l);      // backrest
      s.line(5, 3, 10, 3, WOOD.d);                                  // slat
      s.rect(4, 5, 8, 6, WOOD.l); s.rect(4, 5, 8, 1, WOOD.h);       // seat
      s.line(4, 10, 11, 10, WOOD.d);
      s.rect(4, 11, 2, 4, WOOD.d); s.rect(10, 11, 2, 4, WOOD.d);    // legs
    },
  });

  T('bed', {
    solid: true,
    draw(s) {
      s.rect(1, 0, 14, 16, WOOD.d);
      s.rect(2, 1, 12, 14, '#e8e8f0');
      // quilt with stitched checks
      s.rect(2, 6, 12, 9, '#d05858');
      for (let y = 7; y < 15; y += 3) s.line(3, y, 13, y, '#b04848');
      for (let x = 5; x < 14; x += 4) s.line(x, 6, x, 14, '#c05050');
      s.rect(2, 6, 12, 1, '#e87878');                     // quilt fold
      // pillow with an indent
      s.rect(4, 2, 8, 3, '#f8f8ff');
      s.rect(4, 2, 8, 1, '#ffffff'); s.line(6, 4, 10, 4, '#d8d8e8');
      s.rect(1, 15, 14, 1, Px.shift(WOOD.d, 0, 0, -0.1));
    },
  });

  T('bookshelf', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WOOD.d);
      s.rect(1, 1, 14, 14, WOOD.b);
      s.rect(1, 1, 14, 1, WOOD.l);
      for (let r = 0; r < 2; r++) {
        const y = 2 + r * 7;
        s.rect(2, y, 12, 5, '#463828');
        const cols = ['#c85848', '#4878c8', '#48a868', '#d8b848', '#9868b8', '#c87838'];
        for (let i = 0; i < 6; i++) {
          const bx = 3 + i * 2;
          s.rect(bx, y + (i % 3 === 2 ? 1 : 0), 1, 5 - (i % 3 === 2 ? 1 : 0), cols[(i + r * 2) % 6]);
          s.set(bx, y + 1, Px.shift(cols[(i + r * 2) % 6], 0, 0, 0.12));   // spine glint
        }
        s.set(14, y + 4, '#584838');                       // shelf lip shadow
      }
      s.rect(1, 14, 14, 1, WOOD.d2);
    },
  });

  T('counter', {
    solid: true, counter: true,
    draw(s) {
      // service counter: polished top, front face with trim
      s.rect(0, 0, 16, 8, '#e8e0c8');
      s.rect(0, 0, 16, 1, '#f8f0d8');
      s.line(3, 3, 8, 3, '#f8f0d8');                      // top sheen
      s.rect(0, 8, 16, 8, '#d8d0b8');
      s.line(0, 8, 16, 8, '#b0a888');
      s.rect(0, 9, 16, 1, '#c8c0a8');
      s.line(4, 10, 4, 16, '#c0b8a0'); s.line(11, 10, 11, 16, '#c0b8a0');   // panel seams
    },
  });

  T('pc', {
    solid: true, pc: true, anim: 4,
    draw(s, ph) {
      woodFloor(s);
      s.rect(2, 8, 12, 7, '#a8a8b0');
      s.rect(3, 2, 10, 8, '#484858');
      s.rect(4, 3, 8, 6, ph % 2 ? '#68d8a8' : '#58b890');
      s.line(4, 3 + (ph % 4), 11, 3 + (ph % 4), '#88f0c0');   // scanline rolls down
      s.set(5, 4, '#a8f8d8');
      s.rect(6, 12, 4, 2, '#888890');
      s.set(12, 13, ph % 4 === 3 ? '#58d048' : '#2a5a2a');    // power LED blink
    },
  });

  T('plant', {
    solid: true,
    draw(s) {
      woodFloor(s);
      // terracotta pot with rim + lush shrub
      s.rect(5, 10, 6, 5, '#c86848');
      s.rect(5, 10, 6, 1, '#e08868');
      s.rect(6, 9, 4, 1, '#a85838');
      s.line(6, 11, 6, 14, '#a85838');
      s.ball(8, 6, 4, 4, DARKG);
      s.set(5, 3, DARKG.l); s.set(11, 4, DARKG.l); s.set(8, 2, GRASS.l);
      s.set(6, 7, DARKG.d2); s.set(10, 8, DARKG.d2);
      s.set(4, 6, DARKG.b); s.set(12, 6, DARKG.b);        // leaf sprigs
    },
  });

  T('lab_machine', {
    solid: true, anim: 2,
    draw(s, ph) {
      woodFloor(s);
      s.rect(1, 2, 14, 13, '#909098');
      s.rect(1, 2, 14, 1, '#b0b0b8');
      s.rect(2, 3, 12, 5, '#585868');
      s.line(3, 4, 12, 4, '#6a6a80');                     // screen sheen
      s.set(4, 6, ph % 2 ? '#f05848' : '#883830');
      s.set(7, 6, ph % 2 ? '#f8d048' : '#887030');
      s.set(10, 6, ph % 2 ? '#58d048' : '#308830');
      s.rect(3, 10, 10, 3, '#c8c8d0');
      s.rect(3, 10, 10, 1, '#e0e0e8');
      s.line(5, 11, 7, 11, '#a0a0a8'); s.set(11, 11, '#787880');   // dials
      s.rect(1, 14, 14, 1, '#70707a');
    },
  });

  T('healer', {
    solid: true, healer: true, anim: 4,
    draw(s, ph) {
      woodFloor(s);
      s.rect(1, 6, 14, 9, '#d8d0c0');
      s.rect(1, 6, 14, 1, '#f0e8d8');
      s.rect(2, 7, 12, 7, '#e8e0d0');
      // lights chase left-to-right, then all rest on the 4th beat
      for (let i = 0; i < 3; i++) {
        const on = ph % 4 === i;
        s.fillCircle(4 + i * 4, 9, 1.5, on ? '#f8e048' : '#c05848');
        if (on) s.set(4 + i * 4, 8, '#fff8c0');
      }
      s.rect(3, 12, 10, 2, '#a8a098');
      s.rect(3, 12, 10, 1, '#c0b8a8');
      s.set(4 + (ph % 4) * 2, 13, '#c8c0b0');   // tray shimmer
    },
  });

  T('stairs_down', {
    stairs: true,
    draw(s) {
      s.rect(0, 0, 16, 16, CAVE.b);
      // descending steps with lit treads and deepening shadow
      for (let i = 0; i < 4; i++) {
        const shade = Px.shift(CAVE.b, 0, 0, -0.05 * (i + 1));
        s.rect(2, 2 + i * 3, 12, 3, shade);
        s.line(2, 2 + i * 3, 13, 2 + i * 3, Px.shift(CAVE.b, 0, 0, 0.06 - 0.04 * i));
      }
      s.rect(2, 14, 12, 2, CAVE.o);
      s.line(2, 2, 2, 15, CAVE.d2); s.line(13, 2, 13, 15, CAVE.d2);
    },
  });

  return {
    def(id) { return defs[id]; },
    list() { return Object.keys(defs).map((id) => ({ id, anim: defs[id].anim || 1 })); },
    /** Render tile to canvas (cached per phase + position variant). */
    canvas(id, phase = 0, variant = 0) {
      const d = defs[id];
      const ph = d.anim ? phase % d.anim : 0;
      const vr = d.vary ? variant % d.vary : 0;
      if (typeof Assets !== 'undefined') {
        const ov = Assets.get('tiles/' + id + (d.anim ? '_' + ph : '')) || Assets.get('tiles/' + id);
        if (ov) return ov;
      }
      const key = id + ':' + ph + ':' + vr;
      if (!cache[key]) {
        const s = new PixelSurface(16, 16);
        d.draw(s, ph, vr);
        cache[key] = s.toCanvas();
      }
      return cache[key];
    },
  };
})();
