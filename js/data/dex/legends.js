'use strict';
/** #100 AURORYX — the Storm-Heart of the North. Dragon/Electric legendary. */
(() => {
  const K = SpriteKit;
  const BODY = Px.ramp('#4a5f9e');   // deep storm-blue hide
  const PALE = Px.ramp('#cdd8ef');   // pale underbelly
  const TEAL = Px.ramp('#59e6b8');   // aurora band 1
  const VIOL = Px.ramp('#8d7bf0');   // aurora band 2
  const PINK = Px.ramp('#f08bd8');   // aurora band 3
  const GOLD = Px.ramp('#f3d558');   // storm-charge accents

  function auroraRibbon(s, pts, r) {
    // Ribbon of three shifted aurora bands following a polyline.
    const bands = [[TEAL, 0], [VIOL, 1], [PINK, 2]];
    for (const [ramp, off] of bands) {
      for (let i = 0; i + 1 < pts.length; i++) {
        s.stroke(pts[i][0], pts[i][1] - off * r, pts[i + 1][0], pts[i + 1][1] - off * r,
          Math.max(1, r - off), ramp);
      }
    }
  }

  Dex.add({
    id: 100, key: 'auroryx', name: 'Auroryx', types: ['Dragon', 'Electric'],
    base: { hp: 90, atk: 95, def: 90, spa: 125, spd: 100, spe: 100 },
    ability: 'aurora_heart', catchRate: 3, expYield: 306, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'spark_nip'], [1, 'twister'], [1, 'static_snare'], [10, 'dragon_breath'],
      [20, 'storm_bolt'], [30, 'wyrm_pulse'], [40, 'quickening'], [50, 'stormheart_ray'],
      [55, 'sky_fury'], [60, 'aurora_cataclysm'], [65, 'star_cataclysm']],
    tms: ['tm01', 'tm03', 'tm12', 'tm13', 'tm16', 'tm17', 'tm21', 'tm22'],
    dex: { species: 'Storm-Heart', h: '5.2m', w: '???kg',
      entry: 'The aurora over Norvenna is the light of its sleeping heartbeat. The sagas warn: the sky it dreams is gentler than the sky it wakes to.' },
    cry: { base: 170, sweep: 1.6, wave: 'sawtooth', dur: 0.9, vib: 14, vibRate: 6, grit: 0.35, sub: true },
    draw(s) {
      // Great serpent arcing across the frame like a ribbon of light.
      // Body path: tail lower-left, rising loop, head upper-right.
      const spine = [[6, 52], [16, 44], [28, 40], [40, 42], [50, 36], [52, 24]];
      // aurora mane flowing above the whole spine
      auroraRibbon(s, [[8, 46], [20, 36], [34, 34], [48, 30]], 3);
      // body segments
      for (let i = 0; i + 1 < spine.length; i++) {
        const r = i < 2 ? 4 : i < 4 ? 6 : 5;
        s.stroke(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], r, BODY);
      }
      // belly plates along the underside
      s.line(12, 50, 24, 46, PALE.b); s.line(26, 46, 38, 48, PALE.b);
      s.line(14, 52, 22, 48, PALE.d);
      // charge runes along flank
      s.set(20, 42, GOLD.b); s.set(30, 39, GOLD.b); s.set(40, 40, GOLD.b); s.set(47, 34, GOLD.b);
      // tail tip: forked aurora streamer
      auroraRibbon(s, [[7, 53], [2, 58]], 2);
      // chest core (the Storm-Heart)
      s.fillCircle(46, 34, 3, GOLD.b);
      s.set(46, 33, GOLD.h); s.set(45, 34, GOLD.l);
      // head: regal wedge with antler crown
      s.ball(52, 18, 7, 6, BODY);
      s.tri(57, 16, 63, 18, 57, 21, BODY.b); // muzzle
      s.line(58, 19, 61, 19, '#1a1418');
      K.fang(s, 58, 19, '#fff');
      // antler crown (glowing)
      K.horn(s, 48, 13, -0.7, -0.7, 8, 2, TEAL);
      K.horn(s, 52, 11, -0.2, -1, 8, 2, VIOL);
      K.horn(s, 56, 12, 0.5, -0.9, 7, 2, PINK);
      // eye: golden, fierce
      K.eye(s, 52, 17, 2, '#f3d558');
      K.brow(s, 52, 14, 2);
      // jaw whisker-streamers
      s.line(57, 22, 54, 26, TEAL.b); s.line(58, 22, 56, 27, VIOL.b);
      // crackles of static around the body
      s.set(24, 32, GOLD.h); s.set(36, 30, GOLD.h); s.set(12, 40, GOLD.h);
    },
    drawBack(s) {
      // Rear: the great coil seen from behind — crown from the back, mane falling
      // toward the camera, spine ridge of aurora fins running down the back.
      const spine = [[10, 26], [16, 38], [30, 46], [44, 42], [54, 50]];
      auroraRibbon(s, [[12, 22], [20, 32], [34, 40], [50, 38]], 3);
      for (let i = 0; i + 1 < spine.length; i++) {
        const r = i === 0 ? 5 : 6;
        s.stroke(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], r, BODY);
      }
      // dorsal fin ridge toward camera
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const x = 14 + t * 34, y = 34 + Math.sin(t * 2.4) * 9 + t * 6;
        K.horn(s, x, y, 0.15, -1, 5, 2, [TEAL, VIOL, PINK][i % 3]);
      }
      // charge runes on the back
      s.set(22, 38, GOLD.b); s.set(32, 44, GOLD.b); s.set(44, 40, GOLD.b);
      // tail streamer sweeping bottom-right (toward player)
      auroraRibbon(s, [[54, 50], [60, 56]], 2);
      s.stroke(52, 48, 58, 56, 4, BODY);
      // back of head upper-left: crown seen from behind, no face
      s.ball(10, 20, 7, 6, BODY, { lx: 0, ly: -0.5 });
      s.ball(10, 20, 5, 4, PALE, { flat: true }); // pale nape patch
      K.horn(s, 5, 15, -0.7, -0.7, 8, 2, PINK);
      K.horn(s, 10, 13, -0.1, -1, 9, 2, VIOL);
      K.horn(s, 15, 14, 0.6, -0.8, 8, 2, TEAL);
      // static crackles
      s.set(28, 30, GOLD.h); s.set(44, 32, GOLD.h); s.set(56, 44, GOLD.h);
    },
  });
})();
