'use strict';
/**
 * Batch F (dex #101-#110): rare & postgame species for the new optional areas
 * (Wispgrove haunt, Sunhollow Reserve, Tempest Isle) and the second legendary,
 * UMBRYX — the Night-Heart, dark mirror of Auroryx.
 */
(() => {
  const K = SpriteKit;

  // ---- Mothpyre (Bug/Fire) ----
  const MOTH = Px.ramp('#e07838'); const MOTHW = Px.ramp('#f8c048'); const CHARM = Px.ramp('#7c4030');
  Dex.add({
    id: 101, key: 'mothpyre', name: 'Mothpyre', types: ['Bug', 'Fire'],
    base: { hp: 70, atk: 65, def: 60, spa: 100, spd: 70, spe: 95 }, ability: 'kindled_heart',
    catchRate: 75, expYield: 178, growth: 'medfast', gender: 50, evolve: null,
    learn: [[1, 'nibble'], [1, 'cinder_shot'], [10, 'prism_wing'], [18, 'heat_wave'], [26, 'scale_gale'], [34, 'inferno_burst'], [42, 'sap_bite']],
    tms: ['tm02', 'tm16', 'hm02'],
    dex: { species: 'Ember Moth', h: '1.1m', w: '18.0kg', entry: 'It drinks the heat of dying campfires. Its wing-dust glows like embers on the night wind.' },
    cry: { base: 560, sweep: 0.7, wave: 'triangle', dur: 0.45, vib: 16, chirps: 1 },
    draw(s) {
      s.ball(32, 38, 6, 9, CHARM);
      s.fillPoly([[26, 30], [10, 24], [12, 42], [28, 40]], MOTH.b);
      s.fillPoly([[38, 30], [54, 24], [52, 42], [36, 40]], MOTH.b);
      s.set(16, 30, MOTHW.b); s.set(48, 30, MOTHW.b); s.dither(14, 28, 8, 8, MOTHW.l, 1); s.dither(42, 28, 8, 8, MOTHW.l, 0);
      s.ball(32, 26, 5, 4, CHARM);
      K.horn(s, 29, 22, -0.6, -1, 6, 1, MOTHW); K.horn(s, 35, 22, 0.6, -1, 6, 1, MOTHW);
      K.eye(s, 30, 26, 2, '#f8e048'); K.eye(s, 34, 26, 2, '#f8e048');
      s.limb(28, 44, 26, 50, 2, 1, CHARM); s.limb(36, 44, 38, 50, 2, 1, CHARM);
    },
    drawBack(s) {
      s.ball(32, 38, 6, 9, CHARM, { lx: 0, ly: -0.5 });
      s.fillPoly([[26, 30], [9, 23], [11, 43], [28, 40]], MOTH.d);
      s.fillPoly([[38, 30], [55, 23], [53, 43], [36, 40]], MOTH.d);
      s.dither(13, 27, 9, 9, MOTH.b, 1); s.dither(42, 27, 9, 9, MOTH.b, 0);
      s.ball(32, 25, 5, 4, CHARM, { lx: 0, ly: -0.5 });
      K.horn(s, 29, 21, -0.6, -1, 6, 1, MOTHW); K.horn(s, 35, 21, 0.6, -1, 6, 1, MOTHW);
      s.set(30, 34, MOTHW.b); s.set(34, 34, MOTHW.b);
    },
  });

  // ---- Gloamcat -> Nocturnyx (Dark, Dark/Psychic) ----
  const CAT = Px.ramp('#4a4258'); const CATL = Px.ramp('#6a5e80'); const MOON = Px.ramp('#e8d868');
  Dex.add({
    id: 102, key: 'gloamcat', name: 'Gloamcat', types: ['Dark'],
    base: { hp: 48, atk: 60, def: 45, spa: 55, spd: 48, spe: 72 }, ability: 'keen_edge',
    catchRate: 150, expYield: 66, growth: 'medslow', gender: 50, evolve: { to: 'nocturnyx', level: 30 },
    learn: [[1, 'scratch'], [1, 'leer'], [6, 'cheap_shot'], [12, 'bite'], [18, 'night_slash'], [24, 'confusion']],
    tms: ['tm18', 'hm05'],
    dex: { species: 'Dusk Kit', h: '0.5m', w: '7.0kg', entry: 'A kitten of the twilight. The crescent on its brow glows faintly when it hunts by night.' },
    cry: { base: 640, sweep: 0.7, wave: 'square', dur: 0.4, vib: 14, chirps: 1 },
    draw(s) {
      s.limb(26, 48, 25, 56, 2, 1.5, CAT); s.limb(38, 48, 39, 56, 2, 1.5, CAT);
      s.ball(32, 42, 10, 8, CAT); s.ball(30, 46, 5, 4, CATL, { flat: true });
      s.stroke(41, 44, 50, 40, 2, CAT); s.set(51, 39, CATL.b);
      s.ball(30, 30, 8, 7, CAT);
      s.tri(24, 25, 22, 20, 27, 26, CAT.b); s.tri(36, 25, 38, 20, 33, 26, CAT.b);
      s.set(30, 24, MOON.b); s.set(29, 25, MOON.l);
      K.eye(s, 26, 30, 2, '#f8e048'); K.eye(s, 34, 30, 2, '#f8e048');
      s.set(30, 33, '#1a1418');
    },
    drawBack(s) {
      s.limb(26, 48, 25, 56, 2, 1.5, CAT); s.limb(38, 48, 39, 56, 2, 1.5, CAT);
      s.ball(32, 42, 11, 9, CAT, { lx: 0, ly: -0.5 }); s.dither(26, 38, 12, 8, CATL.b, 1);
      s.stroke(41, 44, 51, 38, 2, CAT);
      s.ball(30, 29, 8, 7, CAT, { lx: 0, ly: -0.5 });
      s.tri(24, 24, 22, 19, 27, 25, CAT.d); s.tri(36, 24, 38, 19, 33, 25, CAT.d);
      s.set(30, 23, MOON.b);
    },
  });
  Dex.add({
    id: 103, key: 'nocturnyx', name: 'Nocturnyx', types: ['Dark', 'Psychic'],
    base: { hp: 78, atk: 92, def: 72, spa: 98, spd: 80, spe: 108 }, ability: 'keen_edge',
    catchRate: 60, expYield: 198, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'scratch'], [1, 'cheap_shot'], [1, 'bite'], [18, 'night_slash'], [24, 'confusion'], [32, 'psi_blade'], [40, 'crunch'], [48, 'mind_crush']],
    tms: ['tm04', 'tm09', 'tm18', 'hm05'],
    dex: { species: 'Panther of Dusk', h: '1.4m', w: '54.0kg', entry: 'It stalks the space between waking and dreaming. Prey never hears it — they simply stop remembering the moment before.' },
    cry: { base: 300, sweep: 0.6, wave: 'sawtooth', dur: 0.6, vib: 8, grit: 0.3 },
    draw(s) {
      s.limb(24, 48, 22, 58, 3, 2, CAT); s.limb(40, 48, 42, 58, 3, 2, CAT);
      s.ball(32, 40, 13, 9, CAT); s.ball(31, 44, 7, 5, CATL, { flat: true });
      s.stroke(44, 42, 56, 34, 2, CAT); s.set(57, 33, MOON.b);
      s.ball(30, 26, 9, 8, CAT);
      s.tri(23, 20, 20, 12, 27, 22, CAT.b); s.tri(37, 20, 40, 12, 33, 22, CAT.b);
      s.set(30, 19, MOON.b); s.set(29, 20, MOON.l); s.set(31, 20, MOON.l);
      K.eye(s, 26, 26, 2, '#f8d838'); K.eye(s, 34, 26, 2, '#f8d838');
      K.brow(s, 26, 23, 2); K.brow(s, 35, 23, 2);
      s.line(28, 30, 32, 30, '#1a1418'); K.fang(s, 28, 30, '#fff');
    },
    drawBack(s) {
      s.limb(24, 48, 22, 58, 3, 2, CAT); s.limb(40, 48, 42, 58, 3, 2, CAT);
      s.ball(32, 40, 14, 10, CAT, { lx: 0, ly: -0.5 }); s.dither(24, 36, 16, 8, CATL.b, 1);
      s.stroke(44, 42, 57, 32, 2, CAT);
      s.ball(30, 25, 9, 8, CAT, { lx: 0, ly: -0.5 });
      s.tri(23, 19, 20, 11, 27, 21, CAT.d); s.tri(37, 19, 40, 11, 33, 21, CAT.d);
      s.set(30, 18, MOON.b);
    },
  });

  // ---- Lilypip -> Lotanic (Water/Grass) ----
  const LILY = Px.ramp('#58a86a'); const LILYD = Px.ramp('#3a7a4e'); const PETAL = Px.ramp('#f0b8d0');
  Dex.add({
    id: 104, key: 'lilypip', name: 'Lilypip', types: ['Water', 'Grass'],
    base: { hp: 55, atk: 45, def: 58, spa: 63, spd: 60, spe: 50 }, ability: 'spring_sponge',
    catchRate: 150, expYield: 66, growth: 'medslow', gender: 50, evolve: { to: 'lotanic', level: 28 },
    learn: [[1, 'splash_jet'], [1, 'vine_lash'], [8, 'bubble_beam'], [14, 'razor_leaf'], [20, 'siphon_seed'], [26, 'sap_surge']],
    tms: ['tm03', 'tm19', 'hm03'],
    dex: { species: 'Lilypad Frog', h: '0.4m', w: '5.0kg', entry: 'It rides a lily pad it grew itself. When startled, it curls the pad over its head like a green umbrella.' },
    cry: { base: 500, sweep: 0.8, wave: 'sine', dur: 0.4, vib: 18 },
    draw(s) {
      s.fillEllipse(32, 48, 15, 4, LILYD.b); s.fillEllipse(32, 47, 13, 3, LILY.b);
      s.ball(32, 40, 9, 7, LILY); s.ball(32, 44, 6, 4, Px.ramp('#c8e8b0'), { flat: true });
      s.ball(26, 32, 3, 3, LILY); s.ball(38, 32, 3, 3, LILY);
      K.eye(s, 26, 32, 2, '#e8c838'); K.eye(s, 38, 32, 2, '#e8c838');
      K.smile(s, 32, 40, 3);
      s.set(24, 38, PETAL.b); s.set(40, 38, PETAL.b);
    },
    drawBack(s) {
      s.fillEllipse(32, 48, 15, 4, LILYD.b);
      s.ball(32, 40, 10, 8, LILY, { lx: 0, ly: -0.5 }); s.dither(26, 36, 12, 8, LILYD.b, 1);
      s.ball(26, 31, 3, 3, LILY); s.ball(38, 31, 3, 3, LILY);
      s.set(32, 34, Px.ramp('#c8e8b0').l);
    },
  });
  Dex.add({
    id: 105, key: 'lotanic', name: 'Lotanic', types: ['Water', 'Grass'],
    base: { hp: 80, atk: 68, def: 88, spa: 100, spd: 95, spe: 62 }, ability: 'spring_sponge',
    catchRate: 55, expYield: 196, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'splash_jet'], [1, 'vine_lash'], [1, 'bubble_beam'], [20, 'siphon_seed'], [26, 'sap_surge'], [32, 'surf'], [40, 'seed_bomb'], [48, 'deluge_cannon']],
    tms: ['tm03', 'tm13', 'tm19', 'hm03', 'hm07'],
    dex: { species: 'Lotus Toad', h: '1.2m', w: '48.0kg', entry: 'A great lotus blooms from its back, opening at dawn. Ponds where it lives run crystal clear.' },
    cry: { base: 320, sweep: 0.7, wave: 'sine', dur: 0.55, vib: 12, sub: true },
    draw(s) {
      s.limb(24, 50, 22, 57, 3, 2, LILY); s.limb(40, 50, 42, 57, 3, 2, LILY);
      s.ball(32, 42, 13, 10, LILY); s.ball(32, 46, 8, 6, Px.ramp('#c8e8b0'), { flat: true });
      // lotus on back
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.5; K.horn(s, 32, 30, Math.cos(a), Math.sin(a) - 0.3, 8, 3, Px.ramp('#f4c0d8')); }
      s.ball(32, 28, 4, 3, MOON, { flat: true });
      s.ball(30, 28, 9, 8, LILY);
      K.eye(s, 26, 28, 2, '#e8c838'); K.eye(s, 34, 28, 2, '#e8c838');
      K.smile(s, 30, 33, 3);
    },
    drawBack(s) {
      s.limb(24, 50, 22, 57, 3, 2, LILY); s.limb(40, 50, 42, 57, 3, 2, LILY);
      s.ball(32, 42, 14, 11, LILY, { lx: 0, ly: -0.5 }); s.dither(24, 38, 16, 8, LILYD.b, 1);
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45; K.horn(s, 32, 30, Math.cos(a), Math.sin(a) - 0.2, 9, 3, PETAL); }
      s.ball(32, 30, 5, 4, LILYD, { flat: true });
    },
  });

  // ---- Volteel (Water/Electric) ----
  const EEL = Px.ramp('#3878b0'); const EELY = Px.ramp('#f0d848');
  Dex.add({
    id: 106, key: 'volteel', name: 'Volteel', types: ['Water', 'Electric'],
    base: { hp: 75, atk: 90, def: 62, spa: 95, spd: 62, spe: 96 }, ability: 'storm_drinker',
    catchRate: 60, expYield: 190, growth: 'medfast', gender: 50, evolve: null,
    learn: [[1, 'splash_jet'], [1, 'spark_nip'], [12, 'bubble_beam'], [20, 'spark_tackle'], [28, 'storm_bolt'], [36, 'aqua_tail'], [44, 'sky_fury']],
    tms: ['tm01', 'tm03', 'hm03'],
    dex: { species: 'Coil Eel', h: '1.8m', w: '22.0kg', entry: 'It coils in kelp and waits. A touch of its skin delivers a jolt strong enough to stun a Fjorddrake.' },
    cry: { base: 420, sweep: 0.6, wave: 'sawtooth', dur: 0.5, vib: 12, grit: 0.3 },
    draw(s) {
      s.stroke(10, 50, 24, 46, 4, EEL); s.stroke(24, 46, 40, 50, 4, EEL); s.stroke(40, 50, 52, 40, 4, EEL);
      s.stroke(52, 40, 50, 26, 4, EEL);
      for (let i = 0; i < 5; i++) { const t = i / 5; s.set(12 + t * 30, 48 - Math.sin(t * 3) * 3, EELY.b); }
      s.ball(50, 22, 6, 5, EEL);
      K.eye(s, 48, 21, 2, '#f8e848'); K.brow(s, 48, 18, 2);
      s.line(52, 25, 56, 25, EEL.o); K.horn(s, 46, 17, -0.4, -1, 5, 1, EELY);
    },
    drawBack(s) {
      s.stroke(10, 50, 24, 46, 4, EEL); s.stroke(24, 46, 40, 50, 4, EEL); s.stroke(40, 50, 52, 40, 4, EEL);
      s.stroke(52, 40, 50, 26, 4, EEL);
      for (let i = 0; i < 6; i++) K.horn(s, 14 + i * 6, 47, 0, -1, 3, 1, EELY);
      s.ball(50, 21, 6, 5, EEL, { lx: 0, ly: -0.5 }); s.set(50, 19, EELY.b);
    },
  });

  // ---- Claydoll (Rock/Fairy) ----
  const CLAY = Px.ramp('#c88860'); const CLAYL = Px.ramp('#e8b088'); const GLYPH = Px.ramp('#f0a8d8');
  Dex.add({
    id: 107, key: 'claydoll', name: 'Claydoll', types: ['Rock', 'Fairy'],
    base: { hp: 70, atk: 66, def: 100, spa: 82, spd: 100, spe: 40 }, ability: 'bedrock',
    catchRate: 70, expYield: 180, growth: 'medfast', gender: -1, evolve: null,
    learn: [[1, 'rock_throw'], [1, 'fae_wind'], [12, 'rock_tomb'], [20, 'prism_flare'], [28, 'rock_slide'], [36, 'moonveil_blast'], [44, 'stone_spike']],
    tms: ['tm09', 'tm15', 'hm06'],
    dex: { species: 'Kiln Doll', h: '0.8m', w: '40.0kg', entry: 'An ancient votive figure fired in a forgotten kiln. The glowing glyphs on its body are a prayer no one now can read.' },
    cry: { base: 340, sweep: 0.6, wave: 'triangle', dur: 0.5, vib: 8 },
    draw(s) {
      s.ball(32, 50, 8, 4, CLAY);
      s.fillPoly([[24, 48], [26, 26], [38, 26], [40, 48]], CLAY.b);
      s.line(24, 48, 26, 26, CLAYL.l);
      s.ball(32, 22, 8, 7, CLAY);
      s.set(28, 40, GLYPH.b); s.set(34, 44, GLYPH.b); s.set(31, 34, GLYPH.l);
      K.eye(s, 28, 22, 2, '#f078c0'); K.eye(s, 36, 22, 2, '#f078c0');
      s.line(29, 26, 35, 26, CLAY.o);
      K.horn(s, 28, 16, -0.3, -1, 4, 1, CLAYL); K.horn(s, 36, 16, 0.3, -1, 4, 1, CLAYL);
    },
    drawBack(s) {
      s.ball(32, 50, 8, 4, CLAY);
      s.fillPoly([[24, 48], [26, 26], [38, 26], [40, 48]], CLAY.d);
      s.line(32, 26, 32, 48, CLAY.o);
      s.set(29, 36, GLYPH.b); s.set(35, 40, GLYPH.b); s.set(32, 44, GLYPH.l);
      s.ball(32, 21, 8, 7, CLAY, { lx: 0, ly: -0.5 });
      K.horn(s, 28, 15, -0.3, -1, 4, 1, CLAYL); K.horn(s, 36, 15, 0.3, -1, 4, 1, CLAYL);
    },
  });

  // ---- Aurorpix (Fairy/Electric) ----
  const PIX = Px.ramp('#f0a8e0'); const PIXG = Px.ramp('#78e8c8'); const PIXV = Px.ramp('#8d7bf0');
  Dex.add({
    id: 108, key: 'aurorpix', name: 'Aurorpix', types: ['Fairy', 'Electric'],
    base: { hp: 68, atk: 55, def: 66, spa: 108, spd: 96, spe: 104 }, ability: 'storm_drinker',
    catchRate: 45, expYield: 200, growth: 'slow', gender: -1, evolve: null,
    learn: [[1, 'fae_wind'], [1, 'spark_nip'], [14, 'glimmer_kiss'], [22, 'storm_bolt'], [30, 'prism_flare'], [38, 'moonveil_blast'], [46, 'sky_fury']],
    tms: ['tm01', 'tm09', 'hm05'],
    dex: { species: 'Aurora Sprite', h: '0.6m', w: '2.0kg', entry: 'A sliver of the aurora that slipped loose and learned to dance. It leaves a trail of light that lingers for hours.' },
    cry: { base: 720, sweep: 1.2, wave: 'sine', dur: 0.5, vib: 22, chirps: 2 },
    draw(s) {
      s.ball(32, 34, 6, 7, PIX);
      // aurora ribbon wings/trail
      for (const [ramp, off] of [[PIXG, 0], [PIXV, 1], [PIX, 2]]) {
        s.stroke(24, 30, 12, 22 - off * 2, 2, ramp); s.stroke(40, 30, 52, 22 - off * 2, 2, ramp);
      }
      s.ball(32, 24, 5, 4, PIX);
      K.eye(s, 30, 24, 2, '#5848a0'); K.eye(s, 34, 24, 2, '#5848a0');
      K.smile(s, 32, 27, 1);
      s.set(30, 18, PIXG.h); s.set(34, 18, PIX.h); s.set(32, 16, PIXV.b);
      // sparkle trail below
      s.set(28, 44, PIXG.h); s.set(36, 46, PIX.h); s.set(32, 48, '#ffffff');
    },
    drawBack(s) {
      s.ball(32, 33, 7, 8, PIXV, { lx: 0, ly: -0.5 });
      for (const [ramp, off] of [[PIXG, 0], [PIXV, 1], [PIX, 2]]) {
        s.stroke(24, 29, 11, 21 - off * 2, 2, ramp); s.stroke(40, 29, 53, 21 - off * 2, 2, ramp);
      }
      s.ball(32, 23, 5, 4, PIXV, { lx: 0, ly: -0.5 });
      s.set(30, 17, PIXG.h); s.set(34, 17, PIX.h);
      s.set(30, 44, PIXG.h); s.set(34, 46, PIX.h);
    },
  });

  // ---- Mantasurge (Water/Flying) ----
  const MANTA = Px.ramp('#2f6aa8'); const MANTAL = Px.ramp('#78b0e0');
  Dex.add({
    id: 109, key: 'mantasurge', name: 'Mantasurge', types: ['Water', 'Flying'],
    base: { hp: 95, atk: 78, def: 85, spa: 92, spd: 95, spe: 85 }, ability: 'drizzlecall',
    catchRate: 45, expYield: 205, growth: 'slow', gender: 50, evolve: null,
    learn: [[1, 'wind_gust'], [1, 'splash_jet'], [14, 'bubble_beam'], [22, 'wing_strike'], [30, 'surf'], [38, 'gale_blade'], [46, 'cyclone'], [54, 'deluge_cannon']],
    tms: ['tm03', 'tm13', 'tm16', 'hm02', 'hm03'],
    dex: { species: 'Sky Ray', h: '2.6m', w: '96.0kg', entry: 'It breaches the waves and glides on sea-wind for miles. Sailors call a passing Mantasurge the promise of fair weather.' },
    cry: { base: 260, sweep: 0.7, wave: 'sine', dur: 0.6, vib: 10, sub: true },
    draw(s) {
      s.fillPoly([[32, 30], [8, 40], [20, 46], [32, 44]], MANTA.b);
      s.fillPoly([[32, 30], [56, 40], [44, 46], [32, 44]], MANTA.b);
      s.line(8, 40, 20, 46, MANTAL.l); s.line(56, 40, 44, 46, MANTAL.l);
      s.ball(32, 34, 8, 6, MANTA); s.ball(32, 37, 5, 3, MANTAL, { flat: true });
      s.stroke(32, 44, 34, 56, 1.5, MANTA);
      // cephalic fins
      K.horn(s, 28, 28, -0.4, -1, 5, 1, MANTA); K.horn(s, 36, 28, 0.4, -1, 5, 1, MANTA);
      K.eye(s, 28, 33, 2, '#e8f0f8'); K.eye(s, 36, 33, 2, '#e8f0f8');
    },
    drawBack(s) {
      s.fillPoly([[32, 30], [7, 39], [20, 46], [32, 44]], MANTA.d);
      s.fillPoly([[32, 30], [57, 39], [44, 46], [32, 44]], MANTA.d);
      s.dither(14, 36, 12, 8, MANTA.b, 1); s.dither(38, 36, 12, 8, MANTA.b, 0);
      s.ball(32, 33, 8, 6, MANTA, { lx: 0, ly: -0.5 });
      // pale back spots
      s.set(28, 33, MANTAL.l); s.set(36, 33, MANTAL.l); s.set(32, 30, MANTAL.b);
      s.stroke(32, 44, 34, 57, 1.5, MANTA);
    },
  });

  // ---- UMBRYX (Dark/Ghost) — the Night-Heart, second legendary ----
  const NIGHT = Px.ramp('#2e2740'); const NIGHTL = Px.ramp('#4a4068'); const VOID = Px.ramp('#7a5aa8'); const STAR = Px.ramp('#e8e0f8');
  Dex.add({
    id: 110, key: 'umbryx', name: 'Umbryx', types: ['Dark', 'Ghost'],
    base: { hp: 90, atk: 100, def: 90, spa: 125, spd: 100, spe: 100 }, ability: 'looming_dread',
    catchRate: 3, expYield: 306, growth: 'slow', gender: -1, evolve: null,
    learn: [[1, 'astonish'], [1, 'cheap_shot'], [1, 'confusion'], [10, 'shade_sneak'], [20, 'dread_pulse'],
      [30, 'phantom_orb'], [40, 'wicked_scheme'], [50, 'shadow_maw'], [55, 'haunt'], [60, 'mind_crush'], [65, 'dream_pulse']],
    tms: ['tm04', 'tm05', 'tm09', 'tm18', 'hm05'],
    dex: { species: 'Night-Heart', h: '4.8m', w: '???kg', entry: 'When the aurora sleeps, its shadow wakes. The sagas say Auroryx and Umbryx are one being split by the turning of day into night.' },
    cry: { base: 150, sweep: 1.5, wave: 'sawtooth', dur: 0.95, vib: 12, vibRate: 5, grit: 0.4, sub: true },
    draw(s) {
      // ==== FABLE ART v7: SpriteForge MENACE pass ====
      const SF = SpriteForge;
      const NIGHT = Px.ramp('#2e2842');
      const NIGHTL = Px.ramp('#4a4066');
      const VOID = Px.ramp('#6a4a9e');
      const STAR = Px.ramp('#e8e0ff');
      SF.draw(s, [
      // void mane: ragged shadow blades off the neck
      ...SF.spikes([[24, 16], [30, 24], [34, 34]], 12, 0.9, -0.4, 5).map((p) => (
        { path: p, smooth: 0.25, ramp: VOID, shade: { d: 1, hi: 0 }, ink: false })),
      // ground coil
      { path: SF.limb(22, 50, 44, 48, 6.5, 6), ramp: NIGHT, shade: { d: 3, hi: 1 } },
      { path: SF.limb(44, 48, 52, 40, 6, 5), ramp: NIGHT, shade: { d: 2, hi: 1 } },
      // smoke-wisp tail dissolving upward (attached)
      { path: [[51, 38], [56, 32], [59, 26], [58, 31], [54, 40]], smooth: 0.6, ramp: VOID, shade: { d: 1, hi: 0 } },
      // rising neck
      { path: SF.limb(24, 48, 20, 34, 6, 5.5), ramp: NIGHT, shade: { d: 2, hi: 1 } },
      { path: SF.limb(20, 34, 23, 22, 5.5, 5), ramp: NIGHT, shade: { d: 2, hi: 1 } },
      // jagged dorsal shadow-spikes
      ...SF.spikes([[26, 26], [24, 38], [30, 46], [42, 44]], 7, -0.7, -0.7, 6).map((p) => (
        { path: p, smooth: 0.15, ramp: VOID, shade: { d: 1, hi: 0 } })),
      // angular head striking down-left
      { path: [[20, 12], [28, 15], [30, 21], [26, 27], [17, 29], [9, 25], [7, 18], [12, 12]],
        smooth: 0.8, ramp: NIGHT, shade: { d: 2, hi: 1 } },
      // open jaws
      { path: [[10, 24], [2, 26], [1, 29], [9, 29], [14, 27]], smooth: 0.5, ramp: NIGHT, shade: { d: 1, hi: 0 } },
      { path: [[14, 33], [4, 38], [2, 41], [10, 40], [16, 36]], smooth: 0.5, ramp: NIGHT, shade: { d: 1, hi: 0 } },
      // crown: two crooked void horns
      { path: [[17, 14], [23, 6], [27, 2], [26, 4], [21, 11], [19, 16]], smooth: 0.3, ramp: VOID, shade: { d: 1, hi: 0 } },
      { path: [[21, 16], [30, 10], [37, 7], [36, 9], [27, 15], [23, 19]], smooth: 0.3, ramp: VOID, shade: { d: 1, hi: 0 } },
      // crescent-moon chest mark
      { path: SF.blob(22, 33, 3.2, 3.2), ramp: STAR, shade: null, inkAll: true },
      ], { light: [-1, -1] });

      // maw: starfield void inside the open mouth
      s.fillPoly([[13, 27], [3, 29], [3, 38], [13, 34]], '#0d0a16');
      s.set(6, 31, STAR.b); s.set(9, 35, STAR.d); s.set(4, 34, STAR.d);
      s.tri(5, 29, 8, 29, 6, 33, '#e8e0ff');
      // HOLLOW white eye — no pupil (the unsettling part)
      s.rect(17, 19, 5, 2, '#ffffff');
      s.set(17, 19, '#c8b8f8'); s.line(16, 17, 22, 18, '#0d0a16');
      // crescent moon over the chest orb
      s.fillCircle(23, 33, 2, NIGHT.b);
      // stars across the coils
      s.set(30, 46, STAR.b); s.set(40, 44, STAR.d); s.set(48, 40, STAR.b);
      s.set(26, 40, STAR.d); s.set(36, 50, STAR.d); s.set(21, 27, STAR.d);
    },
    drawBack(s) {
      const spine = [[10, 26], [16, 38], [30, 46], [44, 42], [54, 50]];
      for (let i = 0; i + 1 < spine.length; i++) s.stroke(spine[i][0], spine[i][1], spine[i + 1][0], spine[i + 1][1], 6, NIGHT);
      for (let i = 0; i < 5; i++) K.horn(s, 16 + i * 8, 40 - Math.sin(i) * 3, 0.15, -1, 6, 2, VOID);
      s.set(24, 40, STAR.h); s.set(36, 44, STAR.b); s.set(46, 42, STAR.h); s.set(30, 38, VOID.l);
      s.ball(10, 20, 7, 6, NIGHT, { lx: 0, ly: -0.5 });
      s.ball(10, 20, 5, 4, NIGHTL, { flat: true });
      K.horn(s, 5, 15, -0.6, -0.8, 8, 2, VOID); K.horn(s, 11, 13, 0.1, -1, 9, 2, VOID);
      s.fillCircle(50, 46, 3, STAR.b); s.fillCircle(52, 45, 3, NIGHT.b);
    },
  });
})();
