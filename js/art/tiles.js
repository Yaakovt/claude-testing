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

  function grassBase(s, ramp = GRASS) {
    s.rect(0, 0, 16, 16, ramp.b);
    // scattered blade specks
    const pts = [[2, 3], [7, 1], [12, 4], [4, 9], [10, 11], [14, 8], [1, 13], [8, 14], [13, 14], [5, 6]];
    for (let i = 0; i < pts.length; i++) {
      s.set(pts[i][0], pts[i][1], i % 2 ? ramp.l : ramp.d);
    }
  }

  T('grass', { draw: (s) => grassBase(s) });

  T('tallgrass', {
    grass: true,
    draw(s) {
      grassBase(s, GRASS);
      // dense tufts
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          const x = 1 + i * 4, y = 2 + j * 8;
          s.line(x, y + 5, x, y + 1, DARKG.d);
          s.line(x + 1, y + 5, x + 1, y, DARKG.b);
          s.line(x + 2, y + 5, x + 2, y + 2, DARKG.l);
        }
      }
    },
  });

  T('flowers', {
    anim: 2,
    draw(s, ph) {
      grassBase(s);
      const cols = ['#f8d048', '#f88888'];
      const sway = ph % 2;
      for (const [x, y, c] of [[3, 3, 0], [11, 5, 1], [5, 11, 1], [12, 12, 0]]) {
        s.set(x, y + sway, cols[c]); s.set(x + 1, y + sway, '#fff');
        s.set(x, y + 1 + sway, '#fff'); s.set(x + 1, y + 1 + sway, cols[c]);
      }
    },
  });

  T('path', {
    draw(s) {
      s.rect(0, 0, 16, 16, PATH.b);
      s.dither(0, 0, 16, 2, GRASS.b, 0);
      const pts = [[3, 5], [9, 3], [13, 7], [5, 10], [11, 13], [2, 13]];
      pts.forEach(([x, y], i) => s.set(x, y, i % 2 ? PATH.d : PATH.l));
    },
  });

  T('snow', {
    draw(s) {
      s.rect(0, 0, 16, 16, SNOW.b);
      const pts = [[2, 2], [8, 5], [13, 3], [4, 10], [11, 12], [6, 14]];
      pts.forEach(([x, y], i) => s.set(x, y, i % 2 ? '#ffffff' : SNOW.d));
    },
  });

  T('tallsnow', {
    grass: true,
    draw(s) {
      s.rect(0, 0, 16, 16, SNOW.b);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 2; j++) {
          const x = 1 + i * 4, y = 2 + j * 8;
          s.line(x, y + 5, x, y + 1, '#a8c8d8');
          s.line(x + 1, y + 5, x + 1, y, '#c8e0ec');
          s.line(x + 2, y + 5, x + 2, y + 2, '#ffffff');
        }
      }
    },
  });

  T('ice', {
    ice: true,
    draw(s) {
      s.rect(0, 0, 16, 16, ICE.b);
      s.line(2, 3, 6, 7, ICE.l); s.line(10, 2, 13, 5, '#ffffff');
      s.line(4, 12, 8, 13, ICE.l); s.line(12, 10, 14, 13, ICE.d);
      s.set(1, 1, '#fff'); s.set(14, 14, ICE.d);
    },
  });

  T('water', {
    solid: true, water: true, anim: 4,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WATER.b);
      const off = [0, 1, 2, 1][ph % 4];
      for (let j = 0; j < 3; j++) {
        const y = 2 + j * 5 + off;
        s.line(1 + j * 2, y, 5 + j * 2, y, WATER.l);
        s.line(9 - j, y + 2, 12 - j, y + 2, WATER.d);
      }
      if (ph % 4 === 2) { s.set(13, 4, '#d8f0ff'); s.set(3, 11, '#d8f0ff'); }
    },
  });

  T('waterfall', {
    solid: true, fall: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WATER.b);
      for (let x = 0; x < 16; x += 2) {
        const y = (x * 3 + ph * 8) % 16;
        s.line(x, 0, x, 16, x % 4 ? WATER.l : '#a8d8f8');
        s.set(x, y, '#e8f8ff');
      }
    },
  });

  T('rock', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, ROCK.d);
      s.fillPoly([[0, 16], [3, 4], [8, 1], [13, 5], [16, 16]], ROCK.b);
      s.line(3, 4, 8, 1, ROCK.l); s.line(8, 1, 13, 5, ROCK.l);
      s.line(6, 8, 9, 12, ROCK.d);
      s.set(5, 6, ROCK.l); s.set(11, 9, ROCK.d);
    },
  });

  T('boulder', {
    solid: true, boulder: true,
    draw(s) {
      grassBase(s);
      s.ball(8, 9, 6, 5, ROCK);
      s.line(5, 7, 8, 6, ROCK.l);
      s.set(10, 11, ROCK.d); s.set(6, 10, ROCK.d);
    },
  });

  T('crackrock', {
    solid: true, smash: true,
    draw(s) {
      grassBase(s);
      s.ball(8, 9, 6, 5, ROCK);
      s.line(5, 5, 8, 9, '#3a3028'); s.line(8, 9, 7, 13, '#3a3028');
      s.line(8, 9, 12, 8, '#3a3028');
    },
  });

  T('tree', {
    solid: true,
    draw(s) {
      grassBase(s);
      s.rect(6, 10, 4, 5, TRUNK.b);
      s.line(6, 10, 6, 14, TRUNK.d);
      s.ball(8, 6, 7, 6, DARKG);
      s.ball(5, 4, 3, 3, DARKG, { flat: true });
      s.dither(3, 2, 10, 5, DARKG.l, 1);
    },
  });

  T('pine', {
    solid: true,
    draw(s) {
      grassBase(s);
      s.rect(7, 12, 2, 3, TRUNK.b);
      s.tri(8, 0, 2, 8, 14, 8, PINE.b);
      s.tri(8, 4, 1, 13, 15, 13, PINE.b);
      s.line(8, 0, 2, 8, PINE.l); s.line(8, 4, 1, 13, PINE.l);
      s.dither(5, 6, 7, 3, PINE.d, 0);
      s.set(8, 0, '#fff'); // snow cap
      s.set(7, 1, '#fff'); s.set(9, 1, '#e8f0f8');
    },
  });

  T('snowpine', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, SNOW.b);
      s.rect(7, 12, 2, 3, TRUNK.b);
      s.tri(8, 0, 2, 8, 14, 8, PINE.d);
      s.tri(8, 4, 1, 13, 15, 13, PINE.d);
      s.line(2, 8, 8, 0, '#ffffff'); s.line(1, 13, 8, 4, '#ffffff');
      s.line(8, 0, 14, 8, SNOW.b); s.line(8, 4, 15, 13, SNOW.b);
    },
  });

  T('cutbush', {
    solid: true, cut: true,
    draw(s) {
      grassBase(s);
      s.ball(8, 9, 5, 4, DARKG);
      s.set(5, 7, DARKG.l); s.set(10, 8, DARKG.l);
      s.set(8, 11, DARKG.d);
      s.line(7, 5, 9, 5, GRASS.l);
    },
  });

  T('ledge', {
    ledge: 'down',
    draw(s) {
      grassBase(s);
      s.rect(0, 10, 16, 3, PATH.d);
      s.rect(0, 8, 16, 2, PATH.b);
      s.line(0, 13, 16, 13, Px.shift(PATH.d, 0, 0, -0.12));
      s.set(3, 9, PATH.l); s.set(11, 9, PATH.l);
    },
  });

  T('fence', {
    solid: true,
    draw(s) {
      grassBase(s);
      s.rect(1, 6, 2, 7, WOOD.b); s.rect(13, 6, 2, 7, WOOD.b);
      s.rect(0, 7, 16, 2, WOOD.l);
      s.rect(0, 10, 16, 2, WOOD.d);
      s.set(1, 6, WOOD.l); s.set(13, 6, WOOD.l);
    },
  });

  T('sign', {
    solid: true, sign: true,
    draw(s) {
      grassBase(s);
      s.rect(7, 9, 2, 5, TRUNK.b);
      s.rect(2, 3, 12, 7, WOOD.b);
      s.line(2, 3, 13, 3, WOOD.l);
      s.line(2, 9, 13, 9, WOOD.d);
      s.line(4, 5, 11, 5, WOOD.d);
      s.line(4, 7, 9, 7, WOOD.d);
    },
  });

  T('sand', {
    draw(s) {
      s.rect(0, 0, 16, 16, '#e8d8a0');
      [[3, 4], [10, 2], [13, 9], [5, 12], [9, 14]].forEach(([x, y], i) =>
        s.set(x, y, i % 2 ? '#f8ecc0' : '#c8b078'));
    },
  });

  // ---- cave ----
  T('cavefloor', {
    draw(s) {
      s.rect(0, 0, 16, 16, CAVE.b);
      [[2, 3], [8, 6], [13, 2], [4, 11], [11, 13]].forEach(([x, y], i) =>
        s.set(x, y, i % 2 ? CAVE.l : CAVE.d));
    },
  });

  T('cavewall', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, CAVE.d);
      s.fillPoly([[0, 16], [2, 5], [7, 2], [12, 6], [16, 16]], Px.shift(CAVE.b, 0, 0, -0.06));
      s.line(2, 5, 7, 2, CAVE.l);
      s.line(5, 9, 8, 13, CAVE.o);
      s.set(10, 8, CAVE.l);
    },
  });

  T('crystal', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, CAVE.b);
      const glow = ph % 2 ? '#a8e8f8' : '#78c8e8';
      s.tri(5, 13, 8, 2, 11, 13, glow);
      s.line(8, 2, 8, 12, '#e8fcff');
      s.tri(2, 14, 4, 8, 6, 14, '#68b0d8');
      s.tri(10, 14, 13, 7, 15, 14, '#68b0d8');
    },
  });

  // ---- buildings (exterior) ----
  function roofTile(s, ramp, part) {
    s.rect(0, 0, 16, 16, ramp.b);
    for (let y = 2; y < 16; y += 4) s.line(0, y, 16, y, ramp.d);
    s.line(0, 0, 16, 0, ramp.l);
    if (part === 'l') { s.rect(0, 0, 2, 16, ramp.l); s.line(0, 0, 0, 16, ramp.d); }
    if (part === 'r') { s.rect(14, 0, 2, 16, ramp.d); }
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
      s.rect(0, 0, 16, 16, WALLC.b);
      s.line(0, 0, 16, 0, WALLC.d);
      s.line(0, 15, 16, 15, WALLC.d);
      for (let x = 0; x < 16; x += 5) s.line(x, 8, x + 3, 8, WALLC.d);
      s.dither(0, 12, 16, 3, WALLC.l, 0);
    },
  });

  T('window', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(3, 3, 10, 9, '#4a3c30');
      s.rect(4, 4, 8, 7, ph % 2 ? '#a8d8f0' : '#98c8ec');
      s.line(8, 4, 8, 10, '#4a3c30');
      s.line(4, 7, 11, 7, '#4a3c30');
      s.rect(2, 12, 12, 2, WALLC.d);
    },
  });

  T('door', {
    door: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(3, 2, 10, 14, TRUNK.d);
      s.rect(4, 3, 8, 13, WOOD.b);
      s.line(4, 3, 11, 3, WOOD.l);
      s.set(10, 9, '#f8d048');
      s.line(5, 5, 5, 14, WOOD.d);
    },
  });

  T('mat', { draw(s) { s.rect(0, 0, 16, 16, PATH.b); s.rect(2, 2, 12, 12, PATH.l); s.rect(4, 4, 8, 8, PATH.d); } });

  T('center_sign', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(2, 2, 12, 12, '#f8f8f0');
      s.rect(3, 3, 10, 10, ph % 2 ? '#f06858' : '#e05848');
      // orb emblem
      s.fillCircle(8, 8, 3.5, '#fff');
      s.line(5, 8, 11, 8, '#e05848');
      s.set(8, 8, '#303038');
    },
  });

  T('mart_sign', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WALLC.b);
      s.rect(2, 2, 12, 12, '#f8f8f0');
      s.rect(3, 3, 10, 10, '#4878d8');
      Fontish(s);
      function Fontish(s2) {
        s2.line(5, 6, 5, 10, '#fff'); s2.line(5, 6, 7, 8, '#fff'); s2.line(7, 8, 9, 6, '#fff'); s2.line(9, 6, 9, 10, '#fff');
      }
    },
  });

  T('gym_statue', {
    solid: true, sign: true,
    draw(s) {
      s.rect(0, 0, 16, 16, '#c8c8d0');
      s.rect(2, 12, 12, 3, '#a0a0b0');
      s.rect(4, 8, 8, 4, '#b8b8c8');
      s.ball(8, 4, 3, 3, Px.ramp('#d8d8e0'));
      s.line(4, 12, 11, 12, '#888898');
    },
  });

  // ---- interiors ----
  T('floor_wood', {
    draw(s) {
      s.rect(0, 0, 16, 16, WOOD.b);
      s.line(0, 5, 16, 5, WOOD.d);
      s.line(0, 11, 16, 11, WOOD.d);
      s.line(8, 0, 8, 5, WOOD.d); s.line(3, 5, 3, 11, WOOD.d); s.line(12, 11, 12, 16, WOOD.d);
      s.dither(0, 0, 16, 1, WOOD.l, 0);
    },
  });

  T('floor_tile', {
    draw(s) {
      s.rect(0, 0, 16, 16, '#e0e0d8');
      s.line(0, 7, 16, 7, '#c0c0b8'); s.line(7, 0, 7, 16, '#c0c0b8');
      s.set(2, 2, '#f0f0e8'); s.set(11, 11, '#f0f0e8');
    },
  });

  T('rug', { draw(s) { s.rect(0, 0, 16, 16, '#c86858'); s.rect(1, 1, 14, 14, '#d88878'); s.rect(3, 3, 10, 10, '#c86858'); } });

  T('wall_in', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, '#c8b090');
      s.rect(0, 12, 16, 4, '#a08868');
      s.line(0, 12, 16, 12, '#887050');
      s.line(0, 3, 16, 3, '#d8c4a4');
    },
  });

  T('table', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WOOD.l);
      s.rect(1, 1, 14, 11, WOOD.b);
      s.rect(2, 12, 2, 3, WOOD.d); s.rect(12, 12, 2, 3, WOOD.d);
      s.line(1, 1, 14, 1, WOOD.l);
    },
  });

  T('chair', {
    solid: true,
    draw(s) {
      s.rect(4, 2, 8, 3, WOOD.b);
      s.rect(4, 5, 8, 6, WOOD.l);
      s.rect(4, 11, 2, 4, WOOD.d); s.rect(10, 11, 2, 4, WOOD.d);
    },
  });

  T('bed', {
    solid: true,
    draw(s) {
      s.rect(1, 0, 14, 16, WOOD.d);
      s.rect(2, 1, 12, 14, '#e8e8f0');
      s.rect(2, 1, 12, 5, '#d05858');
      s.line(2, 6, 13, 6, '#b04848');
      s.rect(4, 2, 8, 3, '#f8f8ff');
    },
  });

  T('bookshelf', {
    solid: true,
    draw(s) {
      s.rect(0, 0, 16, 16, WOOD.d);
      s.rect(1, 1, 14, 14, WOOD.b);
      for (let r = 0; r < 2; r++) {
        const y = 2 + r * 7;
        s.rect(2, y, 12, 5, '#584838');
        const cols = ['#c85848', '#4878c8', '#48a868', '#d8b848', '#9868b8'];
        for (let i = 0; i < 6; i++) s.rect(3 + i * 2, y, 1, 5, cols[(i + r) % 5]);
      }
    },
  });

  T('counter', {
    solid: true, counter: true,
    draw(s) {
      s.rect(0, 0, 16, 16, '#d8d0b8');
      s.rect(0, 0, 16, 8, '#e8e0c8');
      s.line(0, 8, 16, 8, '#b0a888');
      s.line(0, 0, 16, 0, '#f8f0d8');
    },
  });

  T('pc', {
    solid: true, pc: true, anim: 2,
    draw(s, ph) {
      s.rect(2, 8, 12, 7, '#a8a8b0');
      s.rect(3, 2, 10, 8, '#484858');
      s.rect(4, 3, 8, 6, ph % 2 ? '#68d8a8' : '#58b890');
      s.set(5, 4, '#a8f8d8');
      s.rect(6, 12, 4, 2, '#888890');
    },
  });

  T('plant', {
    solid: true,
    draw(s) {
      s.rect(5, 10, 6, 5, '#c86848');
      s.rect(6, 9, 4, 1, '#a85838');
      s.ball(8, 6, 4, 4, DARKG);
      s.set(5, 3, DARKG.l); s.set(11, 4, DARKG.l);
    },
  });

  T('lab_machine', {
    solid: true, anim: 2,
    draw(s, ph) {
      s.rect(1, 2, 14, 13, '#909098');
      s.rect(2, 3, 12, 5, '#585868');
      s.set(4, 5, ph % 2 ? '#f05848' : '#883830');
      s.set(7, 5, ph % 2 ? '#f8d048' : '#887030');
      s.set(10, 5, ph % 2 ? '#58d048' : '#308830');
      s.rect(3, 10, 10, 3, '#c8c8d0');
    },
  });

  T('healer', {
    solid: true, healer: true, anim: 2,
    draw(s, ph) {
      s.rect(1, 6, 14, 9, '#d8d0c0');
      s.rect(2, 7, 12, 7, '#e8e0d0');
      for (let i = 0; i < 3; i++) {
        s.fillCircle(4 + i * 4, 9, 1.5, ph % 2 && i === 1 ? '#f8e048' : '#c05848');
      }
      s.rect(3, 12, 10, 2, '#a8a098');
    },
  });

  T('stairs_down', {
    stairs: true,
    draw(s) {
      s.rect(0, 0, 16, 16, CAVE.b);
      for (let i = 0; i < 4; i++) {
        s.rect(2, 2 + i * 3, 12, 2, Px.shift(CAVE.b, 0, 0, -0.05 * (i + 1)));
      }
      s.rect(2, 14, 12, 2, CAVE.o);
    },
  });

  return {
    def(id) { return defs[id]; },
    list() { return Object.keys(defs).map((id) => ({ id, anim: defs[id].anim || 1 })); },
    /** Render tile to canvas (cached per phase). */
    canvas(id, phase = 0) {
      const d = defs[id];
      const ph = d.anim ? phase % d.anim : 0;
      if (typeof Assets !== 'undefined') {
        const ov = Assets.get('tiles/' + id + (d.anim ? '_' + ph : '')) || Assets.get('tiles/' + id);
        if (ov) return ov;
      }
      const key = id + ':' + ph;
      if (!cache[key]) {
        const s = new PixelSurface(16, 16);
        d.draw(s, ph);
        cache[key] = s.toCanvas();
      }
      return cache[key];
    },
  };
})();
