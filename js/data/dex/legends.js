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
      // ==== FABLE ART v6: SpriteForge (contours, ink, cel, AA) ====
      const SF = SpriteForge;
      const BODY = Px.ramp('#4a5f9e');
      const PALEB = Px.ramp('#cdd8ef');
      const TEAL = Px.ramp('#59e6b8');
      const VIOL = Px.ramp('#8d7bf0');
      const PINK = Px.ramp('#f08bd8');
      const GOLD = Px.ramp('#f3d558');
      SF.draw(s, [
      // aurora mane: three ribbons draped along the spine's outer curve
      { path: [[10, 12], [24, 5], [40, 8], [50, 18], [46, 20], [36, 12], [24, 10], [12, 16]], smooth: 0.8, ramp: PINK, shade: { d: 1, hi: 0 }, ink: false },
      { path: [[10, 15], [24, 9], [38, 12], [48, 21], [44, 23], [34, 15], [24, 14], [12, 19]], smooth: 0.8, ramp: VIOL, shade: { d: 1, hi: 0 }, ink: false },
      { path: [[11, 18], [24, 13], [36, 16], [46, 24], [42, 26], [33, 19], [24, 18], [13, 22]], smooth: 0.8, ramp: TEAL, shade: { d: 1, hi: 0 }, ink: false },
      // serpent: one S — neck upper-left, dipping right, coiling down-left
      { path: SF.limb(15, 22, 27, 17, 5, 5.5), ramp: BODY, shade: { d: 2, hi: 1 } },
      { path: SF.limb(27, 17, 40, 22, 5.5, 6), ramp: BODY, shade: { d: 2, hi: 1 } },
      { path: SF.limb(40, 22, 47, 33, 6, 6), ramp: BODY, shade: { d: 2, hi: 1 } },
      { path: SF.limb(47, 33, 43, 44, 6, 5.5), ramp: BODY, shade: { d: 2, hi: 1 } },
      { path: SF.limb(43, 44, 31, 50, 5.5, 4.8), ramp: BODY, shade: { d: 2, hi: 1 } },
      { path: SF.limb(31, 50, 20, 50, 4.8, 4), ramp: BODY, shade: { d: 2, hi: 1 } },
      // tail fork streamers trailing off bottom-left
      { path: [[19, 47], [11, 44], [6, 41], [10, 47], [17, 52]], ramp: TEAL, shade: { d: 1, hi: 0 } },
      { path: [[18, 51], [10, 52], [4, 51], [10, 55], [17, 55]], ramp: PINK, shade: { d: 1, hi: 0 } },
      // pale belly plates along the lower coil
      { path: [[24, 52], [32, 53], [40, 48], [41, 51], [33, 56], [23, 55]], smooth: 0.7, ramp: PALEB, shade: { d: 1, hi: 0 } },
      // regal head facing down-left at the foe
      { path: [[12, 14], [20, 15], [24, 21], [22, 28], [14, 31], [7, 27], [5, 20], [8, 15]],
        ramp: BODY, shade: { d: 2, hi: 1 }, gleam: [11, 18] },
      // tapered muzzle
      { path: [[8, 26], [3, 30], [1, 33], [7, 32], [11, 29]], smooth: 0.6, ramp: BODY, shade: { d: 1, hi: 0 } },
      // antler crown: three aurora horns rising off the crown
      { path: [[11, 15], [7, 8], [5, 3], [11, 9], [13, 14]], ramp: TEAL, shade: { d: 1, hi: 0 } },
      { path: [[15, 13], [15, 5], [16, 1], [19, 7], [18, 13]], ramp: VIOL, shade: { d: 1, hi: 0 } },
      { path: [[19, 15], [23, 9], [27, 5], [24, 12], [21, 17]], ramp: PINK, shade: { d: 1, hi: 0 } },
      // the Storm-Heart glowing at the throat
      { path: SF.blob(17, 33, 3, 3), ramp: GOLD, shade: { d: 1, hi: 1 }, inkAll: true },
      ], { light: [-1, -1] });

      // fierce golden eye + brow
      K.eyeBig(s, 14, 21, 2, 2.5, '#e8b820', { lid: -1, look: [-1, 0] });
      // jaw + fang
      s.line(2, 32, 6, 32, '#1a1418');
      s.set(3, 33, '#ffffff');
      // storm runes along the coils (kept ON the body)
      s.set(32, 20, GOLD.b); s.set(43, 28, GOLD.b); s.set(44, 40, GOLD.b);
      s.set(34, 48, GOLD.b); s.set(25, 18, GOLD.h); s.set(46, 34, GOLD.h);
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

/** #121 VESPERYX — the Dusk-Heart, twilight between Auroryx's day and Umbryx's
 *  night. Psychic/Fairy legendary; completes the Storm-Heart trio. */
(() => {
  const K = SpriteKit;
  const DUSK = Px.ramp('#5b4a86');   // deep twilight-violet hide
  const PALE = Px.ramp('#efe2f2');   // pale dusk underbelly
  const ROSE = Px.ramp('#f2a0c0');   // horizon-glow band 1
  const AMBER = Px.ramp('#f6c874');  // horizon-glow band 2
  const LILAC = Px.ramp('#b79cf2');  // horizon-glow band 3
  const STAR = Px.ramp('#fbf4c8');   // evening-star accents

  function duskRibbon(s, pts, r) {
    const bands = [[ROSE, 0], [AMBER, 1], [LILAC, 2]];
    for (const [ramp, off] of bands) {
      for (let i = 0; i + 1 < pts.length; i++) {
        s.stroke(pts[i][0], pts[i][1] - off * r, pts[i + 1][0], pts[i + 1][1] - off * r,
          Math.max(1, r - off), ramp);
      }
    }
  }

  Dex.add({
    id: 121, key: 'vesperyx', name: 'Vesperyx', types: ['Psychic', 'Fairy'],
    base: { hp: 90, atk: 95, def: 95, spa: 120, spd: 105, spe: 95 },
    ability: 'clear_mind', catchRate: 3, expYield: 306, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'confusion'], [1, 'fae_wind'], [1, 'twister'], [10, 'psybeam'], [20, 'glimmer_kiss'],
      [30, 'psi_blade'], [40, 'quickening'], [50, 'prism_flare'], [55, 'moonveil_blast'],
      [60, 'mind_crush'], [65, 'star_cataclysm']],
    tms: ['tm01', 'tm05', 'tm12', 'tm13', 'tm16', 'tm17', 'tm21', 'tm22'],
    dex: { species: 'Dusk-Heart', h: '5.0m', w: '???kg',
      entry: 'Neither day nor night, but the hush between them. The sagas say it keeps the peace Auroryx and Umbryx would shatter — and answers only to one who has calmed them both.' },
    cry: { base: 162, sweep: 1.55, wave: 'sawtooth', dur: 0.92, vib: 13, vibRate: 5, grit: 0.3, sub: true },
    draw(s) {
      // Serpent arcing like the trio, robed in the colors of dusk.
      const spine = [[6, 52], [16, 44], [28, 40], [40, 42], [50, 36], [53, 23]];
      duskRibbon(s, [[8, 46], [20, 36], [34, 34], [48, 30]], 3);
      for (let i = 0; i + 1 < spine.length; i++) {
        const r = i < 2 ? 4 : i < 4 ? 6 : 5;
        s.stroke(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], r, DUSK);
      }
      // belly plates
      s.line(12, 50, 24, 46, PALE.b); s.line(26, 46, 38, 48, PALE.b);
      s.line(14, 52, 22, 48, PALE.d);
      // horizon runes along the flank
      s.set(20, 42, STAR.b); s.set(30, 39, ROSE.h); s.set(40, 40, AMBER.h); s.set(47, 34, LILAC.h);
      // forked dusk streamer tail
      duskRibbon(s, [[7, 53], [2, 58]], 2);
      // chest core — the Dusk-Heart, a setting sun
      s.fillCircle(46, 34, 3, AMBER.b); s.set(46, 33, STAR.h); s.set(45, 34, ROSE.l);
      // head: regal wedge with a crescent-and-star crown
      s.ball(52, 18, 7, 6, DUSK);
      s.tri(57, 16, 63, 18, 57, 21, DUSK.b);
      s.line(58, 19, 61, 19, '#181022');
      K.fang(s, 58, 19, '#fff');
      // crown horns: rose, star, lilac
      K.horn(s, 48, 13, -0.7, -0.7, 8, 2, ROSE);
      K.horn(s, 52, 11, -0.2, -1, 8, 2, STAR);
      K.horn(s, 56, 12, 0.5, -0.9, 7, 2, LILAC);
      // eye: soft evening-star glow
      K.eye(s, 52, 17, 2, '#fbf4c8'); s.set(52, 17, ROSE.h);
      K.brow(s, 52, 14, 2);
      // whisker-streamers of dusklight
      s.line(57, 22, 54, 26, ROSE.b); s.line(58, 22, 56, 27, LILAC.b);
      // twinkle of the first evening stars
      s.set(24, 32, STAR.h); s.set(36, 30, STAR.h); s.set(12, 40, STAR.h);
    },
    drawBack(s) {
      const spine = [[10, 26], [16, 38], [30, 46], [44, 42], [54, 50]];
      duskRibbon(s, [[12, 22], [20, 32], [34, 40], [50, 38]], 3);
      for (let i = 0; i + 1 < spine.length; i++) {
        const r = i === 0 ? 5 : 6;
        s.stroke(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], r, DUSK);
      }
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const x = 14 + t * 34, y = 34 + Math.sin(t * 2.4) * 9 + t * 6;
        K.horn(s, x, y, 0.15, -1, 5, 2, [ROSE, AMBER, LILAC][i % 3]);
      }
      s.set(22, 38, STAR.b); s.set(32, 44, ROSE.h); s.set(44, 40, AMBER.h);
      duskRibbon(s, [[54, 50], [60, 56]], 2);
      s.stroke(52, 48, 58, 56, 4, DUSK);
      s.ball(10, 20, 7, 6, DUSK, { lx: 0, ly: -0.5 });
      s.ball(10, 20, 5, 4, PALE, { flat: true });
      K.horn(s, 5, 15, -0.7, -0.7, 8, 2, LILAC);
      K.horn(s, 10, 13, -0.1, -1, 9, 2, STAR);
      K.horn(s, 15, 14, 0.6, -0.8, 8, 2, ROSE);
      s.set(28, 30, STAR.h); s.set(44, 32, STAR.h); s.set(56, 44, STAR.h);
    },
  });
})();
