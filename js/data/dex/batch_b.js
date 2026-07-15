'use strict';
/**
 * Batch B (dex #28-#45): coast, open sea & drift ice.
 * Tidesend Harbor, the ferry crossing, the drift-ice shelf, Tidegrot Cave.
 */
(() => {
  const K = SpriteKit;

  // ---------- shared ramps ----------
  const INK = '#1a1418';

  // ============ #28 MINNOWISP ============
  const WISP = Px.ramp('#cfe8e4');
  const WISPD = Px.ramp('#8fc4c8');
  const WGLOW = Px.ramp('#8ff0e0');

  Dex.add({
    id: 28, key: 'minnowisp', name: 'Minnowisp', types: ['Water'],
    base: { hp: 35, atk: 25, def: 30, spa: 50, spd: 40, spe: 40 },
    ability: 'slippery', catchRate: 255, expYield: 92, growth: 'fast', gender: 50,
    evolve: { to: 'herrdart', level: 18 },
    learn: [[1, 'splash_jet'], [1, 'flop'], [5, 'growl'], [9, 'quick_jab'], [13, 'bubble_beam'],
      [17, 'aqua_jet'], [22, 'swift_stars'], [27, 'mend']],
    tms: ['tm12', 'tm17', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Lantern Minnow', h: '0.2m', w: '0.9kg',
      entry: 'Shoals of them drift under the Tidesend piers like sunken stars. A single one is said to light a drowned soul home.' },
    cry: { base: 840, sweep: 1.15, wave: 'sine', dur: 0.3, vib: 24, chirps: 2 },
    draw(s) {
      // trailing tail-wisp below
      s.stroke(32, 50, 30, 56, 1, WISPD);
      s.set(29, 57, WGLOW.b); s.set(31, 58, WGLOW.d);
      // side wisp fins, flowing outward
      s.tri(24, 40, 14, 36, 20, 46, WISPD.b);
      s.tri(40, 40, 50, 36, 44, 46, WISPD.b);
      s.set(15, 37, WGLOW.b); s.set(49, 37, WGLOW.b);
      // dorsal wisp
      K.horn(s, 32, 31, 0.2, -1, 6, 2, WISPD);
      // pale teardrop body, hovering
      s.ball(32, 40, 8, 10, WISP);
      // inner glow core
      s.ball(32, 44, 4, 5, WGLOW, { flat: true });
      s.set(32, 43, WGLOW.h); s.set(31, 45, WGLOW.l);
      // glow freckles along the flanks
      s.set(26, 38, WGLOW.b); s.set(38, 38, WGLOW.b);
      // face
      K.eye(s, 28, 37, 2, '#3878c8');
      K.eye(s, 36, 37, 2, '#3878c8');
      K.smile(s, 32, 42, 1);
    },
    drawBack(s) {
      // Rear: spine glow dots, tail-wisp swept toward camera, no face.
      s.tri(23, 40, 12, 36, 19, 46, WISPD.b);
      s.tri(41, 40, 52, 36, 45, 46, WISPD.b);
      K.horn(s, 32, 30, 0.2, -1, 7, 2, WISPD);
      s.ball(32, 40, 9, 11, WISP, { lx: 0, ly: -0.5 });
      // dorsal ridge glow dots
      s.set(32, 34, WGLOW.b); s.set(32, 38, WGLOW.b); s.set(32, 42, WGLOW.b); s.set(32, 46, WGLOW.d);
      s.dither(27, 36, 10, 10, WISPD.l, 1);
      // tail wisp curling into view
      s.stroke(32, 50, 36, 57, 2, WISPD);
      s.set(38, 58, WGLOW.b); s.set(35, 59, WGLOW.d);
    },
  });

  // ============ #29 HERRDART ============
  const HERR = Px.ramp('#4f86bd');
  const HERRD = Px.ramp('#2f5a8c');
  const SILV = Px.ramp('#dce8f0');

  Dex.add({
    id: 29, key: 'herrdart', name: 'Herrdart', types: ['Water'],
    base: { hp: 60, atk: 85, def: 55, spa: 65, spd: 60, spe: 125 },
    ability: 'rain_racer', catchRate: 90, expYield: 188, growth: 'fast', gender: 50,
    evolve: null,
    learn: [[1, 'splash_jet'], [1, 'quick_jab'], [1, 'leer'], [11, 'aqua_jet'], [16, 'bubble_beam'],
      [21, 'sky_cutter'], [26, 'aqua_tail'], [31, 'focus_energy'], [37, 'waterfall'], [44, 'deluge_cannon']],
    tms: ['tm12', 'tm16', 'tm17', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Arrow Pike', h: '1.1m', w: '14.5kg',
      entry: 'It crosses the ferry lane faster than the ferry. Fisherfolk mend the holes it punches clean through their nets.' },
    cry: { base: 560, sweep: 1.25, wave: 'square', dur: 0.32, vib: 10 },
    draw(s) {
      // forked tail at left
      s.tri(16, 40, 8, 32, 18, 44, HERR.b);
      s.tri(16, 42, 8, 50, 18, 44, HERRD.b);
      // fusiform body thickening to the head
      s.limb(19, 42, 42, 40, 3, 6, HERR);
      // silver belly line
      s.ball(34, 45, 10, 2, SILV, { flat: true });
      // dorsal fin swept back
      s.tri(32, 35, 38, 26, 41, 35, HERRD.b);
      s.line(38, 27, 41, 34, HERRD.l);
      // pelvic fin
      s.tri(32, 46, 30, 52, 37, 47, HERRD.b);
      // head + arrow snout
      s.ball(45, 40, 7, 6, HERR);
      s.tri(50, 36, 61, 40, 50, 44, HERR.b);
      s.line(52, 38, 59, 40, HERR.l);
      // speed-line markings along the flank
      s.line(20, 40, 42, 38, SILV.h);
      s.line(22, 43, 38, 42, HERRD.d);
      s.set(24, 39, SILV.b); s.set(30, 38, SILV.b);
      // fierce eye
      K.eye(s, 46, 39, 2, '#f0d048');
      K.brow(s, 46, 36, 2);
      s.line(50, 43, 53, 42, INK);
    },
    drawBack(s) {
      // Rear: darting away — head small up-left, big forked tail toward camera.
      // body diagonal, tail-end nearest
      s.limb(44, 47, 26, 31, 6, 3, HERR);
      // back is the dark dorsal side
      s.limb(43, 45, 27, 30, 3, 2, HERRD);
      // dorsal fin mid-spine
      s.tri(33, 36, 40, 28, 41, 38, HERRD.b);
      // speed stripe down the spine
      s.line(29, 32, 42, 44, SILV.h);
      // head away: arrow tip pointing up-left, no face
      s.ball(24, 29, 6, 5, HERR, { lx: 0, ly: -0.5 });
      s.tri(20, 25, 10, 22, 21, 32, HERR.b);
      // big forked tail flaring toward camera
      s.tri(46, 48, 58, 40, 49, 53, HERR.b);
      s.tri(46, 50, 56, 60, 44, 54, HERRD.b);
      s.line(56, 42, 49, 50, HERR.l);
    },
  });

  // ============ #30 KRILLBIT ============
  const KRILL = Px.ramp('#e87a6a');
  const KRILLD = Px.ramp('#b84c48');
  const KPLATE = Px.ramp('#f4cfae');
  const LANCE = Px.ramp('#c8d4dc');

  Dex.add({
    id: 30, key: 'krillbit', name: 'Krillbit', types: ['Water', 'Bug'],
    base: { hp: 55, atk: 90, def: 85, spa: 40, spd: 70, spe: 80 },
    ability: 'fine_craft', catchRate: 75, expYield: 175, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'nibble'], [1, 'harden'], [5, 'twin_sting'], [9, 'aqua_jet'], [13, 'quick_jab'],
      [17, 'metal_claw'], [22, 'bubble_beam'], [27, 'cross_scythe'], [33, 'tide_hammer'], [39, 'great_horn']],
    tms: ['tm08', 'tm12', 'tm17', 'tm20', 'tm21', 'hm03', 'hm06', 'hm07'],
    dex: { species: 'Lance Krill', h: '0.4m', w: '3.1kg',
      entry: 'A knight no larger than a herring bucket. It drills its lance-antenna against mooring posts each dawn.' },
    cry: { base: 700, sweep: 0.9, wave: 'square', dur: 0.3, vib: 16, chirps: 1 },
    draw(s) {
      // tail fan at the base
      s.tri(36, 52, 46, 56, 36, 58, KRILL.b);
      s.tri(36, 52, 44, 60, 34, 58, KRILLD.b);
      // segmented abdomen curving down-back
      s.ball(34, 50, 6, 4, KRILL, { flat: true });
      s.ball(33, 44, 7, 5, KRILL);
      s.ball(32, 37, 8, 6, KRILL);
      // pale plate bands on each segment
      s.line(28, 47, 38, 47, KPLATE.b);
      s.line(27, 40, 38, 40, KPLATE.b);
      // swimmeret legs
      s.stroke(28, 52, 24, 57, 1, KRILLD);
      s.stroke(31, 53, 29, 58, 1, KRILLD);
      s.stroke(35, 54, 35, 59, 1, KRILLD);
      // little claw arms
      s.limb(26, 36, 21, 42, 2, 2, KRILL);
      s.limb(38, 36, 43, 42, 2, 2, KRILL);
      s.set(20, 44, KPLATE.b); s.set(44, 44, KPLATE.b);
      // helmet head with crest ridge
      s.ball(32, 26, 8, 7, KRILL);
      s.ball(32, 21, 6, 3, KRILLD, { flat: true });
      // visor slit
      s.rect(26, 26, 12, 1, KRILLD.o);
      // lance-antenna, couched up-right
      s.stroke(36, 19, 47, 6, 1, LANCE);
      s.tri(46, 7, 52, 1, 49, 9, LANCE.b);
      s.set(47, 6, LANCE.h);
      // second small antenna
      s.stroke(28, 19, 23, 12, 1, KRILLD);
      // eyes under the visor
      K.eye(s, 28, 28, 2, '#38282c');
      K.eye(s, 36, 28, 2, '#38282c');
      K.cheek(s, 24, 31, '#f8b8a0'); K.cheek(s, 39, 31, '#f8b8a0');
    },
    drawBack(s) {
      // Rear: helmet crest, plate bands down the back, tail fan toward camera.
      s.tri(36, 50, 50, 56, 38, 60, KRILL.b);
      s.tri(34, 52, 44, 62, 30, 59, KRILLD.b);
      s.line(46, 56, 38, 58, KRILL.l);
      s.ball(34, 49, 7, 5, KRILL, { flat: true });
      s.ball(33, 43, 8, 6, KRILL, { lx: 0, ly: -0.5 });
      s.ball(32, 36, 9, 7, KRILL, { lx: 0, ly: -0.5 });
      // shell plate bands seen from behind
      s.line(26, 46, 40, 46, KPLATE.b);
      s.line(25, 39, 40, 39, KPLATE.b);
      s.dither(27, 33, 11, 5, KRILLD.b, 1);
      // arms peeking
      s.ball(23, 38, 2, 3, KRILL, { flat: true });
      s.ball(43, 38, 2, 3, KRILL, { flat: true });
      // helmet from behind with dark crest ridge
      s.ball(32, 25, 8, 7, KRILL, { lx: 0, ly: -0.5 });
      s.line(32, 19, 32, 30, KRILLD.b);
      // lance rising past the helmet
      s.stroke(37, 18, 48, 5, 1, LANCE);
      s.tri(47, 6, 53, 0, 50, 8, LANCE.b);
      s.stroke(27, 18, 22, 11, 1, KRILLD);
    },
  });

  // ============ PUFFIN LINE (#31-33) ============
  const NAVY = Px.ramp('#3c4c6e');
  const NAVYD = Px.ramp('#28344e');
  const SNOW = Px.ramp('#eef4f6');
  const BEAK = Px.ramp('#e8873a');
  const VEST = Px.ramp('#a8dcf0');
  const GOLD = Px.ramp('#e8c050');
  const ICEC = Px.ramp('#bfe8f8');

  Dex.add({
    id: 31, key: 'puffle', name: 'Puffle', types: ['Ice', 'Flying'],
    base: { hp: 45, atk: 40, def: 35, spa: 45, spd: 40, spe: 45 },
    ability: 'blubber', catchRate: 190, expYield: 104, growth: 'fast', gender: 50,
    evolve: { to: 'berguin', level: 16 },
    learn: [[1, 'peck'], [1, 'growl'], [5, 'frost_dust'], [9, 'wind_gust'], [13, 'quick_jab'],
      [17, 'ice_shard'], [21, 'wing_strike'], [26, 'wind_rest']],
    tms: ['tm03', 'tm13', 'tm16', 'tm17', 'tm21', 'hm02'],
    dex: { species: 'Frost Chick', h: '0.3m', w: '2.4kg',
      entry: 'It tumbles off the drift-ice shelf before its wings can carry it. The frost dusting its down never melts.' },
    cry: { base: 780, sweep: 1.05, wave: 'triangle', dur: 0.34, vib: 20, chirps: 2 },
    draw(s) {
      // orange webbed feet
      s.ball(26, 55, 3, 2, BEAK, { flat: true });
      s.ball(38, 55, 3, 2, BEAK, { flat: true });
      // round downy body
      s.ball(32, 42, 12, 12, NAVY);
      // white belly
      s.ball(32, 46, 7, 7, SNOW, { flat: true });
      // tiny stub wings
      s.tri(19, 38, 14, 47, 22, 46, NAVYD.b);
      s.tri(45, 38, 50, 47, 42, 46, NAVYD.b);
      // white face patches
      s.ball(27, 37, 4, 4, SNOW, { flat: true });
      s.ball(37, 37, 4, 4, SNOW, { flat: true });
      // frost dust on the crown
      s.set(26, 31, ICEC.h); s.set(31, 29, ICEC.h); s.set(36, 31, ICEC.h);
      s.set(29, 30, ICEC.l); s.set(34, 30, ICEC.l);
      // face
      K.eye(s, 27, 37, 2, '#28303c');
      K.eye(s, 37, 37, 2, '#28303c');
      s.tri(31, 41, 34, 41, 32, 44, BEAK.b);
      s.set(32, 41, BEAK.l);
      K.cheek(s, 22, 40, '#a8c8e0'); K.cheek(s, 41, 40, '#a8c8e0');
    },
    drawBack(s) {
      // Rear: frosted crown, dark down, tail nub — no face.
      s.ball(32, 42, 13, 13, NAVY, { lx: 0, ly: -0.5 });
      s.ball(32, 40, 9, 9, NAVYD, { flat: true });
      s.dither(25, 34, 14, 12, NAVY.d, 1);
      // frost dust across the crown
      s.set(26, 30, ICEC.h); s.set(31, 29, ICEC.h); s.set(37, 30, ICEC.h);
      s.set(28, 31, ICEC.l); s.set(34, 31, ICEC.l);
      // stub wings toward camera
      s.tri(18, 38, 12, 48, 22, 47, NAVYD.b);
      s.tri(46, 38, 52, 48, 42, 47, NAVYD.b);
      // tail nub
      s.tri(30, 53, 34, 53, 32, 58, NAVYD.b);
      // heels peeking
      s.set(26, 56, BEAK.b); s.set(38, 56, BEAK.b);
    },
  });

  Dex.add({
    id: 32, key: 'berguin', name: 'Berguin', types: ['Ice', 'Water'],
    base: { hp: 70, atk: 55, def: 70, spa: 80, spd: 75, spe: 70 },
    ability: 'blubber', catchRate: 90, expYield: 175, growth: 'medslow', gender: 50,
    evolve: { to: 'emperoyal', level: 34 },
    learn: [[1, 'peck'], [1, 'growl'], [1, 'frost_dust'], [9, 'wind_gust'], [13, 'ice_shard'],
      [18, 'bubble_beam'], [22, 'aqua_jet'], [27, 'icicle_crash'], [32, 'glacier_ray'], [38, 'frost_armor']],
    tms: ['tm03', 'tm12', 'tm13', 'tm16', 'tm17', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Waistcoat Bird', h: '0.9m', w: '21.0kg',
      entry: 'It waddles the ferry gangway like a purser inspecting tickets. Its ice-blue waistcoat marking never wrinkles.' },
    cry: { base: 480, sweep: 0.8, wave: 'triangle', dur: 0.45, vib: 14 },
    draw(s) {
      // feet
      s.ball(26, 56, 4, 2, BEAK, { flat: true });
      s.ball(38, 56, 4, 2, BEAK, { flat: true });
      // upright body
      s.ball(32, 40, 11, 15, NAVY);
      // white front
      s.ball(32, 43, 8, 10, SNOW, { flat: true });
      // ice-blue waistcoat with notched lapels
      s.fillPoly([[25, 33], [31, 35], [32, 48], [28, 46], [24, 44]], VEST.b);
      s.fillPoly([[39, 33], [33, 35], [32, 48], [36, 46], [40, 44]], VEST.b);
      s.line(25, 33, 24, 44, VEST.d); s.line(39, 33, 40, 44, VEST.d);
      s.set(31, 37, VEST.d); s.set(33, 37, VEST.d);
      // buttons
      s.set(32, 40, NAVYD.b); s.set(32, 43, NAVYD.b);
      // flippers
      s.tri(20, 34, 14, 48, 23, 47, NAVY.b);
      s.tri(44, 34, 50, 48, 41, 47, NAVYD.b);
      // head
      s.ball(32, 23, 9, 8, NAVY);
      s.ball(32, 26, 5, 4, SNOW, { flat: true });
      // beak
      s.tri(30, 25, 34, 25, 32, 30, BEAK.b);
      s.set(32, 26, BEAK.l);
      // eyes
      K.eye(s, 27, 22, 2, '#28303c');
      K.eye(s, 37, 22, 2, '#28303c');
      // neat frost brow-comb
      s.set(28, 16, ICEC.b); s.set(32, 15, ICEC.h); s.set(36, 16, ICEC.b);
    },
    drawBack(s) {
      // Rear: sleek dark back, waistcoat tails split at the bottom, no face.
      s.ball(32, 40, 12, 16, NAVY, { lx: 0, ly: -0.5 });
      s.ball(32, 38, 9, 12, NAVYD, { flat: true });
      s.dither(25, 30, 14, 16, NAVY.d, 1);
      // waistcoat tails peeking at the sides
      s.fillPoly([[23, 44], [27, 46], [26, 53], [21, 50]], VEST.b);
      s.fillPoly([[41, 44], [37, 46], [38, 53], [43, 50]], VEST.b);
      s.set(24, 47, VEST.d); s.set(40, 47, VEST.d);
      // flippers
      s.tri(19, 34, 13, 48, 22, 47, NAVY.b);
      s.tri(45, 34, 51, 48, 42, 47, NAVY.b);
      // tail
      s.tri(29, 54, 35, 54, 32, 59, NAVYD.b);
      // back of head + frost comb
      s.ball(32, 22, 9, 8, NAVY, { lx: 0, ly: -0.5 });
      s.ball(32, 21, 6, 5, NAVYD, { flat: true });
      s.set(28, 15, ICEC.b); s.set(32, 14, ICEC.h); s.set(36, 15, ICEC.b);
    },
  });

  Dex.add({
    id: 33, key: 'emperoyal', name: 'Emperoyal', types: ['Ice', 'Water'],
    base: { hp: 90, atk: 70, def: 85, spa: 110, spd: 95, spe: 70 },
    ability: 'blubber', catchRate: 45, expYield: 217, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'peck'], [1, 'leer'], [1, 'frost_dust'], [1, 'aqua_jet'], [13, 'ice_shard'],
      [18, 'bubble_beam'], [24, 'icicle_crash'], [30, 'glacier_ray'], [36, 'surf'], [42, 'frost_armor'],
      [48, 'whiteout'], [54, 'deluge_cannon']],
    tms: ['tm03', 'tm12', 'tm13', 'tm16', 'tm17', 'tm18', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Corsair Emperor', h: '1.8m', w: '96.0kg',
      entry: 'Old harbormasters dip their flags when it surfaces. Its wave-cloak marking is said to hold a piece of every storm it has outswum.' },
    cry: { base: 300, sweep: 0.6, wave: 'triangle', dur: 0.65, vib: 10, sub: true },
    draw(s) {
      // feet
      s.ball(25, 58, 4, 2, BEAK, { flat: true });
      s.ball(39, 58, 4, 2, BEAK, { flat: true });
      // tall body
      s.ball(32, 38, 13, 19, NAVY);
      // wave cloak: draped side panels with wavy hems
      s.fillPoly([[20, 25], [26, 28], [25, 42], [27, 48], [22, 45], [23, 52], [16, 46], [18, 34]], NAVYD.b);
      s.fillPoly([[44, 25], [38, 28], [39, 42], [37, 48], [42, 45], [41, 52], [48, 46], [46, 34]], NAVYD.b);
      // wave-curl glyphs on the cloak
      s.set(20, 34, VEST.b); s.set(21, 35, VEST.l); s.set(19, 38, VEST.b); s.set(20, 42, VEST.l);
      s.set(44, 34, VEST.b); s.set(43, 35, VEST.l); s.set(45, 38, VEST.b); s.set(44, 42, VEST.l);
      // white front
      s.ball(32, 42, 8, 13, SNOW, { flat: true });
      // regal chest medallion on a chain
      s.line(27, 29, 31, 33, GOLD.d); s.line(37, 29, 33, 33, GOLD.d);
      s.ball(32, 36, 3, 3, GOLD, { flat: true });
      s.set(32, 35, GOLD.h); s.set(32, 37, GOLD.d);
      // flippers
      s.tri(19, 30, 12, 50, 22, 48, NAVY.b);
      s.tri(45, 30, 52, 50, 42, 48, NAVYD.b);
      // head
      s.ball(32, 17, 10, 9, NAVY);
      // gold ear patches
      s.ball(24, 19, 2, 3, GOLD, { flat: true });
      s.ball(40, 19, 2, 3, GOLD, { flat: true });
      // ice tricorn crest
      K.horn(s, 24, 12, -0.8, -0.6, 7, 3, ICEC);
      K.horn(s, 32, 9, 0, -1, 8, 3, ICEC);
      K.horn(s, 40, 12, 0.8, -0.6, 7, 3, ICEC);
      // long beak
      s.tri(30, 20, 34, 20, 32, 27, BEAK.b);
      s.line(32, 21, 32, 25, BEAK.d);
      // stern eyes
      K.eye(s, 27, 16, 2, '#7fd8f0');
      K.eye(s, 37, 16, 2, '#7fd8f0');
      K.brow(s, 27, 13, 2); K.brow(s, 38, 13, 2);
    },
    drawBack(s) {
      // Rear: the wave cloak covers the whole back, tricorn from behind.
      s.ball(32, 38, 14, 20, NAVY, { lx: 0, ly: -0.5 });
      // full cloak with a rolling wavy hem
      s.fillPoly([[19, 24], [45, 24], [48, 42], [44, 55], [40, 48], [36, 55], [32, 49], [28, 55], [24, 48], [20, 55], [16, 42]], NAVYD.b);
      s.line(19, 24, 16, 42, NAVYD.d);
      s.dither(22, 28, 20, 18, NAVYD.l, 1);
      // wave-curl glyphs rolling across the cloak
      s.set(24, 32, VEST.b); s.set(25, 33, VEST.l); s.set(26, 32, VEST.d);
      s.set(38, 32, VEST.b); s.set(39, 33, VEST.l); s.set(40, 32, VEST.d);
      s.set(31, 40, VEST.b); s.set(32, 41, VEST.l); s.set(33, 40, VEST.d);
      s.set(24, 46, VEST.b); s.set(40, 46, VEST.b);
      // flippers
      s.tri(18, 30, 11, 50, 21, 48, NAVY.b);
      s.tri(46, 30, 53, 50, 43, 48, NAVY.b);
      // back of head + tricorn crest
      s.ball(32, 16, 10, 9, NAVY, { lx: 0, ly: -0.5 });
      s.ball(32, 16, 7, 6, NAVYD, { flat: true });
      s.set(24, 18, GOLD.b); s.set(40, 18, GOLD.b);
      K.horn(s, 23, 11, -0.8, -0.6, 7, 3, ICEC);
      K.horn(s, 32, 8, 0, -1, 8, 3, ICEC);
      K.horn(s, 41, 11, 0.8, -0.6, 7, 3, ICEC);
    },
  });

  // ============ CLAM LINE (#34-35) ============
  const SHELL = Px.ramp('#93a4b6');
  const SHELLD = Px.ramp('#5f7286');
  const PIKE = Px.ramp('#9aa860');
  const CORAL = Px.ramp('#e86a52');

  Dex.add({
    id: 34, key: 'clampike', name: 'Clampike', types: ['Water', 'Steel'],
    base: { hp: 40, atk: 55, def: 85, spa: 45, spd: 45, spe: 30 },
    ability: 'bedrock', catchRate: 140, expYield: 125, growth: 'medfast', gender: 50,
    evolve: { to: 'reefclad', level: 28 },
    learn: [[1, 'tackle'], [1, 'harden'], [7, 'splash_jet'], [12, 'metal_claw'], [17, 'bubble_beam'],
      [22, 'iron_ram'], [27, 'plate_guard'], [33, 'aqua_tail']],
    tms: ['tm12', 'tm17', 'tm20', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Snug Clam', h: '0.4m', w: '18.5kg',
      entry: 'The pike sheltering inside pays rent in scraps. When danger nears, the shell slams shut on friend and foe alike.' },
    cry: { base: 520, sweep: 0.7, wave: 'square', dur: 0.36, vib: 8, grit: 0.2 },
    draw(s) {
      // bottom valve
      s.ball(31, 49, 14, 7, SHELL, { lx: -0.2, ly: -0.6 });
      s.line(19, 51, 43, 51, SHELLD.b);
      // dark interior gap
      s.rect(22, 43, 19, 3, '#202c38');
      // top valve, propped open, ridged
      s.fillPoly([[17, 44], [22, 32], [34, 27], [44, 33], [45, 44]], SHELL.b);
      s.ball(32, 36, 12, 7, SHELL, { lx: -0.3, ly: -0.6 });
      // radial growth ridges
      s.line(20, 42, 26, 31, SHELLD.b);
      s.line(28, 43, 32, 29, SHELLD.b);
      s.line(36, 43, 38, 30, SHELLD.b);
      s.set(32, 28, SHELL.h); s.set(26, 30, SHELL.l);
      // pike head poking out of the gap
      s.limb(38, 44, 48, 43, 3, 3, PIKE);
      s.tri(50, 41, 58, 43, 50, 46, PIKE.b);
      s.line(52, 42, 56, 43, PIKE.l);
      K.eye(s, 47, 42, 2, '#e8c040');
      s.set(53, 45, INK);
      K.fang(s, 51, 45);
      // barnacle accent on the shell
      s.set(24, 36, CORAL.b); s.set(25, 36, CORAL.l);
    },
    drawBack(s) {
      // Rear: closed valves, hinge ridge, snout tip barely peeking on the far left.
      s.ball(32, 44, 15, 12, SHELL, { lx: 0, ly: -0.5 });
      // hinge knob at the top
      s.ball(32, 33, 6, 3, SHELLD, { flat: true });
      // growth ridge arcs
      s.line(21, 42, 26, 35, SHELLD.b);
      s.line(28, 45, 31, 34, SHELLD.b);
      s.line(37, 44, 37, 34, SHELLD.b);
      s.line(43, 42, 40, 36, SHELLD.b);
      // valve seam
      s.line(18, 48, 46, 48, SHELLD.d);
      s.dither(22, 50, 20, 4, SHELL.d, 1);
      // snout tip peeking around the far side
      s.tri(14, 44, 8, 45, 14, 47, PIKE.b);
      // barnacles
      s.set(40, 38, CORAL.b); s.set(41, 38, CORAL.l); s.set(25, 51, CORAL.d);
    },
  });

  Dex.add({
    id: 35, key: 'reefclad', name: 'Reefclad', types: ['Water', 'Steel'],
    base: { hp: 65, atk: 80, def: 135, spa: 55, spd: 95, spe: 60 },
    ability: 'bedrock', catchRate: 60, expYield: 204, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'splash_jet'], [12, 'metal_claw'], [17, 'bubble_beam'],
      [22, 'iron_ram'], [30, 'plate_guard'], [36, 'aqua_tail'], [43, 'anchor_slam'], [50, 'deluge_cannon']],
    tms: ['tm12', 'tm15', 'tm17', 'tm20', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Shell Knight', h: '1.4m', w: '128.0kg',
      entry: 'Its shell has turned away harpoon, anchor and gale. The coral plume atop it is a living banner grown over a hundred years.' },
    cry: { base: 340, sweep: 0.55, wave: 'square', dur: 0.6, vib: 6, grit: 0.35 },
    draw(s) {
      // greave-like foot rim
      s.ball(32, 55, 12, 3, SHELLD, { flat: true });
      // great upright shell, kite-shield shaped
      s.ball(32, 36, 16, 19, SHELL);
      s.fillPoly([[24, 51], [32, 56], [40, 51], [32, 53]], SHELLD.b);
      // plate ridges: horizontal armor bands with rivets
      s.line(20, 28, 44, 28, SHELLD.b);
      s.line(18, 36, 46, 36, SHELLD.b);
      s.line(20, 44, 44, 44, SHELLD.b);
      s.set(20, 28, SHELL.h); s.set(44, 28, SHELL.h);
      s.set(18, 36, SHELL.h); s.set(46, 36, SHELL.h);
      s.set(20, 44, SHELL.h); s.set(44, 44, SHELL.h);
      // visor slit with glowing watch-eyes
      s.rect(25, 31, 14, 3, '#1a2430');
      s.set(28, 32, '#7fe0d8'); s.set(29, 32, '#b8f8f0');
      s.set(35, 32, '#7fe0d8'); s.set(36, 32, '#b8f8f0');
      // pauldron bumps
      s.ball(18, 24, 4, 4, SHELLD, { flat: true });
      s.ball(46, 24, 4, 4, SHELLD, { flat: true });
      // coral plume crest, flowing right like a knight's plume
      s.stroke(32, 16, 32, 10, 2, CORAL);
      s.stroke(32, 10, 40, 7, 2, CORAL);
      s.ball(43, 8, 3, 3, CORAL, { flat: true });
      s.ball(47, 10, 2, 2, CORAL, { flat: true });
      s.set(36, 6, CORAL.l); s.set(41, 5, CORAL.b); s.set(46, 7, CORAL.l);
      // barnacle studs
      s.set(22, 48, CORAL.b); s.set(42, 48, CORAL.d);
    },
    drawBack(s) {
      // Rear: domed backplate, vertical hinge ridge, plume from behind.
      s.ball(32, 55, 13, 3, SHELLD, { flat: true });
      s.ball(32, 36, 17, 20, SHELL, { lx: 0, ly: -0.5 });
      // central hinge ridge
      s.rect(31, 18, 3, 34, SHELLD.b);
      s.line(32, 18, 32, 51, SHELLD.d);
      // armor band arcs
      s.line(19, 28, 30, 28, SHELLD.b); s.line(35, 28, 45, 28, SHELLD.b);
      s.line(17, 38, 30, 38, SHELLD.b); s.line(35, 38, 47, 38, SHELLD.b);
      s.line(19, 46, 30, 46, SHELLD.b); s.line(35, 46, 45, 46, SHELLD.b);
      s.set(19, 28, SHELL.h); s.set(45, 28, SHELL.h);
      s.set(17, 38, SHELL.h); s.set(47, 38, SHELL.h);
      s.dither(22, 40, 20, 10, SHELL.d, 1);
      // pauldrons
      s.ball(17, 24, 4, 4, SHELLD, { flat: true });
      s.ball(47, 24, 4, 4, SHELLD, { flat: true });
      // coral plume, fuller from behind, sweeping left
      s.stroke(32, 16, 32, 9, 2, CORAL);
      s.stroke(32, 9, 24, 6, 2, CORAL);
      s.ball(21, 7, 3, 3, CORAL, { flat: true });
      s.ball(17, 9, 2, 2, CORAL, { flat: true });
      s.set(28, 5, CORAL.l); s.set(23, 4, CORAL.b);
      // barnacles
      s.set(40, 50, CORAL.b); s.set(24, 33, CORAL.d);
    },
  });

  // ============ DRAGON LINE (#36-37) ============
  const DRAK = Px.ramp('#4a9a90');
  const DRAKD = Px.ramp('#2e6e6a');
  const DFIN = Px.ramp('#a8e0d4');
  const DBELLY = Px.ramp('#e0e8c8');
  const ROCKG = Px.ramp('#8a8a94');

  Dex.add({
    id: 36, key: 'draklet', name: 'Draklet', types: ['Dragon'],
    base: { hp: 50, atk: 60, def: 50, spa: 55, spd: 45, spe: 40 },
    ability: 'tidal_will', catchRate: 65, expYield: 125, growth: 'slow', gender: 50,
    evolve: { to: 'fjorddrake', level: 35 },
    learn: [[1, 'tackle'], [1, 'leer'], [6, 'twister'], [10, 'splash_jet'], [15, 'dragon_breath'],
      [20, 'bite'], [26, 'aqua_tail'], [32, 'dragon_claw'], [38, 'wyrm_dance']],
    tms: ['tm12', 'tm17', 'tm21', 'tm22', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Fjord Dragonet', h: '0.7m', w: '11.2kg',
      entry: 'It claims one wave-washed rock and defends it for life. Ferry pilots steer around its perch out of respect.' },
    cry: { base: 620, sweep: 0.85, wave: 'sawtooth', dur: 0.4, vib: 14 },
    draw(s) {
      // wave-washed perch rock
      s.ball(32, 53, 13, 6, ROCKG, { lx: -0.2, ly: -0.7 });
      s.dither(24, 52, 16, 5, ROCKG.d, 1);
      s.set(21, 50, '#d8ecf0'); s.set(44, 51, '#d8ecf0');
      // tail curling around the rock
      s.stroke(40, 48, 50, 45, 2, DRAK);
      s.tri(50, 41, 56, 43, 51, 48, DFIN.b);
      // plump seated body
      s.ball(30, 41, 9, 10, DRAK);
      // belly plates
      s.ball(30, 44, 5, 6, DBELLY, { flat: true });
      s.line(27, 42, 33, 42, DBELLY.d); s.line(27, 45, 33, 45, DBELLY.d);
      // stubby wings
      s.tri(21, 36, 15, 30, 22, 42, DRAKD.b);
      s.line(16, 31, 21, 39, DRAKD.l);
      s.tri(39, 36, 45, 30, 38, 42, DRAKD.b);
      // little forelegs on the rock
      s.limb(26, 46, 24, 51, 2, 2, DRAK);
      s.limb(35, 46, 37, 51, 2, 2, DRAK);
      // head
      s.ball(30, 27, 8, 7, DRAK);
      // fin ears fanning out
      s.tri(22, 26, 13, 22, 22, 31, DFIN.b);
      s.line(14, 23, 21, 28, DFIN.d);
      s.tri(38, 26, 47, 22, 38, 31, DFIN.b);
      s.line(46, 23, 39, 28, DFIN.d);
      // tiny horn nub
      s.set(30, 19, DRAKD.b); s.set(31, 18, DRAKD.l);
      // face
      K.eye(s, 27, 26, 2, '#e8b030');
      K.eye(s, 34, 26, 2, '#e8b030');
      K.smile(s, 30, 31, 2);
      K.fang(s, 28, 31);
    },
    drawBack(s) {
      // Rear: perched facing away — spine nubs, fin ears from behind, tail into view.
      s.ball(32, 53, 14, 6, ROCKG, { lx: 0, ly: -0.6 });
      s.dither(24, 52, 18, 5, ROCKG.d, 0);
      s.ball(30, 40, 10, 11, DRAK, { lx: 0, ly: -0.5 });
      // spine ridge nubs
      s.set(30, 32, DRAKD.b); s.set(30, 36, DRAKD.b); s.set(30, 40, DRAKD.b); s.set(30, 44, DRAKD.d);
      s.dither(24, 36, 12, 9, DRAKD.b, 1);
      // wings toward camera
      s.tri(20, 35, 13, 29, 21, 43, DRAKD.b);
      s.tri(40, 35, 47, 29, 39, 43, DRAKD.b);
      s.line(14, 30, 20, 40, DRAKD.l);
      // tail sweeping toward camera left
      s.stroke(24, 48, 12, 47, 2, DRAK);
      s.tri(12, 42, 6, 45, 12, 50, DFIN.b);
      // back of head with fin ears
      s.ball(30, 26, 8, 7, DRAK, { lx: 0, ly: -0.5 });
      s.ball(30, 25, 5, 4, DRAKD, { flat: true });
      s.tri(22, 25, 13, 21, 22, 30, DFIN.b);
      s.tri(38, 25, 47, 21, 38, 30, DFIN.b);
      s.set(30, 18, DRAKD.b);
    },
  });

  Dex.add({
    id: 37, key: 'fjorddrake', name: 'Fjorddrake', types: ['Dragon', 'Water'],
    base: { hp: 80, atk: 95, def: 75, spa: 105, spd: 80, spe: 85 },
    ability: 'tidal_will', catchRate: 45, expYield: 217, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [1, 'twister'], [10, 'splash_jet'], [15, 'dragon_breath'],
      [20, 'bite'], [26, 'aqua_tail'], [32, 'dragon_claw'], [38, 'surf'], [44, 'wyrm_dance'],
      [50, 'primal_rage'], [56, 'star_cataclysm']],
    tms: ['tm12', 'tm13', 'tm17', 'tm21', 'tm22', 'tm23', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Wave Wyrm', h: '3.4m', w: '152.0kg',
      entry: 'Seen from the cliffs it is just one more swell rolling up the fjord — until the swell opens its eyes.' },
    cry: { base: 260, sweep: 0.55, wave: 'sawtooth', dur: 0.7, vib: 9, grit: 0.3, sub: true },
    draw(s) {
      // body arcs like a breaking wave: tail low-left, crest high, head diving right
      s.stroke(12, 54, 20, 36, 4, DRAK);
      s.stroke(20, 36, 32, 24, 5, DRAK);
      s.stroke(32, 24, 44, 27, 5, DRAK);
      // tail fluke
      s.tri(13, 50, 5, 44, 12, 56, DFIN.b);
      s.tri(13, 52, 6, 58, 15, 58, DFIN.d);
      // belly plates along the inner curve
      s.line(17, 42, 22, 34, DBELLY.b);
      s.line(24, 32, 31, 28, DBELLY.b);
      s.line(35, 28, 41, 30, DBELLY.b);
      // fin crest running down the spine
      K.horn(s, 15, 44, -1, -0.3, 6, 2, DFIN);
      K.horn(s, 20, 32, -0.7, -0.7, 7, 2, DFIN);
      K.horn(s, 28, 22, -0.3, -1, 7, 3, DFIN);
      K.horn(s, 37, 20, 0.2, -1, 6, 2, DFIN);
      // sea-spray glints under the arc
      s.set(24, 40, '#d8f4f8'); s.set(30, 36, '#d8f4f8'); s.set(36, 38, '#a8dce8');
      // head diving toward the viewer
      s.ball(47, 31, 8, 6, DRAK);
      s.tri(42, 34, 34, 38, 44, 37, DRAK.b); // jaw toward lower-left
      s.line(37, 37, 42, 36, INK);
      K.fang(s, 38, 37);
      // fin ears swept back
      s.tri(51, 26, 59, 20, 53, 31, DFIN.b);
      s.line(58, 21, 53, 28, DFIN.d);
      // eye
      K.eye(s, 45, 30, 2, '#7fe0d8');
      K.brow(s, 45, 27, 2);
      // small horns
      K.horn(s, 49, 25, 0.5, -0.9, 5, 2, DRAKD);
    },
    drawBack(s) {
      // Rear: the wave rolls away — crest fins toward camera, head turned away top-right.
      s.stroke(50, 54, 42, 36, 5, DRAK);
      s.stroke(42, 36, 30, 24, 5, DRAK);
      s.stroke(30, 24, 20, 27, 5, DRAK);
      // tail fluke toward camera, big
      s.tri(51, 48, 60, 42, 50, 55, DFIN.b);
      s.tri(50, 52, 58, 60, 46, 58, DFIN.d);
      // spine crest fins facing the viewer
      K.horn(s, 48, 44, 1, -0.3, 7, 3, DFIN);
      K.horn(s, 42, 32, 0.7, -0.7, 8, 3, DFIN);
      K.horn(s, 34, 22, 0.3, -1, 8, 3, DFIN);
      K.horn(s, 25, 20, -0.2, -1, 6, 2, DFIN);
      // dark dorsal ridge along the arc
      s.line(46, 48, 40, 36, DRAKD.b);
      s.line(40, 36, 30, 27, DRAKD.b);
      // back of head, facing away up-left
      s.ball(17, 26, 7, 6, DRAK, { lx: 0, ly: -0.5 });
      s.ball(17, 25, 5, 4, DRAKD, { flat: true });
      s.tri(12, 21, 5, 15, 13, 27, DFIN.b);
      K.horn(s, 21, 21, 0.4, -0.9, 5, 2, DRAKD);
      // spray glints
      s.set(38, 42, '#d8f4f8'); s.set(30, 34, '#d8f4f8'); s.set(44, 50, '#a8dce8');
    },
  });

  // ============ #38 SHIVERFIN ============
  const SHIV = Px.ramp('#7fa8cc');
  const SHIVD = Px.ramp('#527ca4');
  const CREAMW = Px.ramp('#e9f0f2');
  const IVORY = Px.ramp('#efe8d2');

  Dex.add({
    id: 38, key: 'shiverfin', name: 'Shiverfin', types: ['Ice', 'Water'],
    base: { hp: 90, atk: 95, def: 70, spa: 85, spd: 75, spe: 55 },
    ability: 'keen_edge', catchRate: 60, expYield: 196, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'frost_dust'], [8, 'aqua_jet'], [13, 'ice_shard'], [18, 'bubble_beam'],
      [24, 'zen_ram'], [30, 'icicle_crash'], [36, 'aqua_tail'], [42, 'glacier_ray'], [48, 'whiteout']],
    tms: ['tm03', 'tm12', 'tm13', 'tm17', 'tm21', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'Star Whale', h: '2.6m', w: '310.0kg',
      entry: 'Its spiral horn is cold enough to freeze the spray it breaches through. Skippers navigate the drift ice by the stars on its back.' },
    cry: { base: 400, sweep: 0.65, wave: 'sine', dur: 0.6, vib: 20 },
    draw(s) {
      // tail peduncle + fluke at left
      s.limb(17, 44, 10, 47, 3, 2, SHIV);
      s.tri(10, 46, 3, 40, 9, 51, SHIV.b);
      s.tri(10, 47, 4, 55, 12, 53, SHIVD.b);
      // plump body
      s.ball(30, 42, 15, 10, SHIV);
      // cream belly
      s.ball(29, 47, 10, 4, CREAMW, { flat: true });
      // flippers
      s.tri(24, 49, 19, 56, 29, 53, SHIVD.b);
      s.tri(38, 49, 43, 56, 33, 53, SHIVD.b);
      // head toward the viewer at right
      s.ball(41, 39, 8, 8, SHIV);
      // starry spots across the back
      s.set(20, 38, CREAMW.h); s.set(26, 35, CREAMW.h); s.set(33, 34, CREAMW.h);
      s.set(23, 41, SHIV.h); s.set(30, 37, SHIV.h);
      // one bright plus-star
      s.set(27, 39, '#ffffff'); s.set(26, 39, CREAMW.l); s.set(28, 39, CREAMW.l); s.set(27, 38, CREAMW.l); s.set(27, 40, CREAMW.l);
      // spiral ice horn from the brow, up-right
      s.stroke(44, 33, 57, 13, 1, IVORY);
      s.set(58, 12, IVORY.h);
      // spiral bands
      s.set(46, 30, SHIVD.b); s.set(49, 25, SHIVD.b); s.set(52, 21, SHIVD.b); s.set(55, 16, SHIVD.b);
      // face
      K.eye(s, 38, 38, 2, '#28303c');
      K.eye(s, 45, 38, 2, '#28303c');
      K.smile(s, 42, 43, 2);
      K.cheek(s, 35, 42, '#b8d4e8'); K.cheek(s, 48, 42, '#b8d4e8');
    },
    drawBack(s) {
      // Rear: fluke toward camera, star constellation on the back, horn rising beyond the head.
      s.ball(32, 40, 15, 11, SHIV, { lx: 0, ly: -0.5 });
      // dark dorsal cape
      s.ball(32, 38, 11, 7, SHIVD, { flat: true });
      s.dither(24, 33, 17, 9, SHIV.d, 1);
      // constellation
      s.set(26, 36, CREAMW.h); s.set(31, 34, CREAMW.h); s.set(37, 36, CREAMW.h); s.set(33, 39, SHIV.h);
      s.set(29, 37, '#ffffff'); s.set(28, 37, CREAMW.l); s.set(30, 37, CREAMW.l); s.set(29, 36, CREAMW.l); s.set(29, 38, CREAMW.l);
      s.line(27, 36, 30, 34, SHIV.l);
      // blowhole
      s.set(41, 33, SHIVD.d);
      // head away at upper-right, horn rising past it
      s.ball(43, 35, 7, 7, SHIV, { lx: 0, ly: -0.5 });
      s.stroke(46, 29, 58, 10, 1, IVORY);
      s.set(48, 26, SHIVD.b); s.set(51, 21, SHIVD.b); s.set(54, 17, SHIVD.b); s.set(57, 12, SHIVD.b);
      // tail toward camera at lower-left, big
      s.limb(20, 46, 13, 51, 3, 2, SHIV);
      s.tri(13, 50, 4, 44, 11, 56, SHIV.b);
      s.tri(13, 51, 6, 60, 16, 57, SHIVD.b);
      // flippers peeking
      s.tri(21, 44, 15, 50, 24, 49, SHIVD.b);
      s.tri(44, 44, 50, 50, 41, 49, SHIVD.b);
    },
  });

  // ============ #39 WALRUST ============
  const WAL = Px.ramp('#9a7050');
  const WALD = Px.ramp('#6e4c36');
  const MUZ = Px.ramp('#c8a888');
  const RUST = Px.ramp('#b05a30');
  const CHAIN = Px.ramp('#8a8f9a');

  Dex.add({
    id: 39, key: 'walrust', name: 'Walrust', types: ['Ice', 'Steel'],
    base: { hp: 105, atk: 90, def: 110, spa: 50, spd: 75, spe: 50 },
    ability: 'blubber', catchRate: 60, expYield: 200, growth: 'slow', gender: 87.5,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [7, 'frost_dust'], [12, 'ice_fang'], [18, 'iron_ram'],
      [24, 'body_slam'], [30, 'icicle_crash'], [36, 'plate_guard'], [42, 'glacier_ray'], [48, 'anchor_slam']],
    tms: ['tm03', 'tm07', 'tm13', 'tm15', 'tm17', 'tm20', 'tm25', 'hm03', 'hm04', 'hm06', 'hm07'],
    dex: { species: 'Anchor Walrus', h: '1.9m', w: '480.0kg',
      entry: 'Its tusks rusted iron-red from a lifetime prying anchors off the seabed. The chain scar across its shoulder never fully healed.' },
    cry: { base: 170, sweep: 0.45, wave: 'sawtooth', dur: 0.75, vib: 6, grit: 0.5, sub: true },
    draw(s) {
      // rear flipper sweeping right
      s.tri(45, 50, 57, 45, 53, 57, WAL.b);
      s.line(55, 47, 49, 52, WALD.b);
      // massive body
      s.ball(31, 43, 17, 13, WAL);
      // neck folds
      s.line(20, 40, 26, 44, WALD.b);
      s.line(38, 42, 44, 40, WALD.b);
      // front flippers planted
      s.tri(21, 50, 14, 58, 27, 58, WALD.b);
      s.tri(38, 52, 43, 59, 32, 58, WALD.d);
      // head
      s.ball(29, 28, 10, 9, WAL);
      // heavy muzzle
      s.ball(29, 33, 8, 5, MUZ, { flat: true });
      s.set(29, 30, WALD.d);
      // whisker dots
      s.set(23, 32, WALD.b); s.set(24, 34, WALD.b); s.set(22, 34, WALD.b);
      s.set(35, 32, WALD.b); s.set(34, 34, WALD.b); s.set(36, 34, WALD.b);
      // rusted-iron tusks
      s.stroke(25, 36, 24, 46, 1, RUST);
      s.stroke(33, 36, 34, 46, 1, RUST);
      s.set(24, 40, RUST.d); s.set(34, 41, RUST.d);
      s.set(24, 45, RUST.l); s.set(34, 45, RUST.l);
      // small weathered eyes
      K.eye(s, 24, 25, 1, '#402818');
      K.eye(s, 34, 25, 1, '#402818');
      K.brow(s, 24, 23, 1); K.brow(s, 35, 23, 1);
      // anchor-chain scar across the left shoulder
      s.fillCircle(17, 36, 1, CHAIN.d); s.fillCircle(20, 33, 1, CHAIN.b);
      s.fillCircle(23, 30, 1, CHAIN.d); s.fillCircle(26, 27, 1, CHAIN.b);
      s.set(17, 36, MUZ.l); s.set(23, 30, MUZ.l);
      // scar line under the chain
      s.line(15, 39, 27, 26, MUZ.d);
    },
    drawBack(s) {
      // Rear: a hill of hide — wrinkle folds, chain scar over the shoulder, tusk tips at the head's sides.
      s.ball(31, 41, 18, 14, WAL, { lx: 0, ly: -0.5 });
      // blubber fold arcs
      s.line(18, 38, 44, 38, WALD.b);
      s.line(17, 44, 45, 44, WALD.b);
      s.line(20, 50, 42, 50, WALD.b);
      s.dither(20, 39, 24, 12, WAL.d, 1);
      // rear flippers toward camera
      s.tri(24, 53, 15, 61, 30, 59, WALD.b);
      s.tri(40, 53, 49, 61, 34, 59, WALD.b);
      // back of head
      s.ball(29, 26, 10, 9, WAL, { lx: 0, ly: -0.5 });
      s.ball(29, 25, 7, 6, WALD, { flat: true });
      // tusk tips visible past the jaw
      s.set(22, 33, RUST.b); s.set(22, 35, RUST.d);
      s.set(36, 33, RUST.b); s.set(36, 35, RUST.d);
      // chain scar wrapping the shoulder
      s.fillCircle(19, 30, 1, CHAIN.b); s.fillCircle(16, 33, 1, CHAIN.d);
      s.fillCircle(14, 37, 1, CHAIN.b);
      s.line(13, 40, 21, 28, MUZ.d);
    },
  });

  // ============ JELLY LINE (#40-41) ============
  const JELL = Px.ramp('#cfaede');
  const JELLD = Px.ramp('#9a7cb8');
  const MOON = Px.ramp('#f8eea8');
  const RIBB = Px.ramp('#f0a8c8');

  Dex.add({
    id: 40, key: 'jelluna', name: 'Jelluna', types: ['Water', 'Psychic'],
    base: { hp: 45, atk: 30, def: 40, spa: 70, spd: 65, spe: 40 },
    ability: 'updraft', catchRate: 190, expYield: 121, growth: 'fast', gender: 50,
    evolve: { to: 'lumedusa', stone: 'tide_stone' },
    learn: [[1, 'splash_jet'], [1, 'confusion'], [7, 'static_touch'], [12, 'psybeam'], [18, 'bubble_beam'],
      [24, 'mesmerize'], [30, 'mind_veil'], [36, 'dream_pulse']],
    tms: ['tm04', 'tm12', 'tm17', 'tm21', 'hm03', 'hm05', 'hm07'],
    dex: { species: 'Moon Jelly', h: '0.4m', w: '3.5kg',
      entry: 'On clear nights the ferry crossing glitters with them. Each carries a sliver of moonlight inside its bell, waxing as the month grows old.' },
    cry: { base: 880, sweep: 1.2, wave: 'sine', dur: 0.35, vib: 26 },
    draw(s) {
      // trailing tentacles (drawn first, behind the bell)
      s.stroke(25, 36, 22, 46, 1, JELLD);
      s.stroke(30, 38, 29, 50, 1, JELLD);
      s.stroke(35, 38, 36, 48, 1, JELLD);
      s.stroke(40, 36, 43, 45, 1, JELLD);
      s.set(21, 48, RIBB.b); s.set(29, 52, RIBB.b); s.set(37, 50, RIBB.b); s.set(44, 47, RIBB.b);
      // translucent bell
      s.ball(32, 29, 13, 10, JELL);
      s.dither(24, 23, 17, 9, JELL.l, 1);
      // scalloped rim
      s.set(21, 36, JELLD.b); s.set(26, 38, JELLD.b); s.set(32, 39, JELLD.b); s.set(38, 38, JELLD.b); s.set(43, 36, JELLD.b);
      // crescent moon glowing inside: full disc, then shade one side
      s.fillEllipse(32, 26, 4, 4, MOON.b);
      s.fillEllipse(34, 25, 3, 3, JELL.l);
      s.set(30, 24, MOON.h); s.set(29, 26, MOON.l);
      // soft halo dots
      s.set(26, 22, MOON.l); s.set(36, 21, MOON.l);
      // sleepy face on the bell rim
      K.eye(s, 27, 33, 1, '#4a3860');
      K.eye(s, 37, 33, 1, '#4a3860');
      s.set(32, 35, INK);
    },
    drawBack(s) {
      // Rear: bell from behind — dim crescent shows through, tentacles toward camera.
      s.ball(32, 29, 14, 11, JELL, { lx: 0, ly: -0.5 });
      s.dither(24, 23, 18, 11, JELLD.l, 0);
      // crescent glow bleeding through the bell
      s.fillEllipse(32, 27, 4, 4, JELLD.b);
      s.fillEllipse(34, 26, 3, 3, JELL.b);
      s.set(30, 25, MOON.d);
      // scallop rim
      s.set(20, 36, JELLD.b); s.set(26, 39, JELLD.b); s.set(32, 40, JELLD.b); s.set(38, 39, JELLD.b); s.set(44, 36, JELLD.b);
      // tentacles trailing toward the viewer, fuller
      s.stroke(24, 38, 20, 50, 1, JELLD);
      s.stroke(29, 40, 28, 53, 2, JELLD);
      s.stroke(36, 40, 37, 52, 2, JELLD);
      s.stroke(42, 38, 45, 48, 1, JELLD);
      s.set(19, 52, RIBB.b); s.set(27, 56, RIBB.b); s.set(38, 55, RIBB.b); s.set(46, 50, RIBB.b);
    },
  });

  Dex.add({
    id: 41, key: 'lumedusa', name: 'Lumedusa', types: ['Water', 'Psychic'],
    base: { hp: 75, atk: 40, def: 70, spa: 115, spd: 105, spe: 75 },
    ability: 'updraft', catchRate: 60, expYield: 200, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'splash_jet'], [1, 'confusion'], [1, 'static_touch'], [12, 'psybeam'], [18, 'bubble_beam'],
      [24, 'mesmerize'], [30, 'mind_temper'], [36, 'mind_crush'], [44, 'surf'], [52, 'dream_pulse']],
    tms: ['tm04', 'tm09', 'tm12', 'tm17', 'tm18', 'tm21', 'hm03', 'hm05', 'hm07'],
    dex: { species: 'Radiant Medusa', h: '1.6m', w: '44.0kg',
      entry: 'It rises from Tidegrot Cave when the moon is full, wearing the tide like a gown. Sailors who follow its glow are never seen wrecked — or again.' },
    cry: { base: 520, sweep: 0.75, wave: 'sine', dur: 0.62, vib: 18 },
    draw(s) {
      // long ribbon tentacles first (behind), rippling down
      s.stroke(20, 36, 16, 46, 2, JELLD); s.stroke(16, 46, 20, 56, 2, JELLD);
      s.stroke(28, 39, 26, 50, 2, RIBB); s.stroke(26, 50, 29, 59, 1, RIBB);
      s.stroke(36, 39, 38, 50, 2, RIBB); s.stroke(38, 50, 35, 59, 1, RIBB);
      s.stroke(44, 36, 48, 46, 2, JELLD); s.stroke(48, 46, 44, 56, 2, JELLD);
      s.stroke(32, 40, 32, 52, 1, MOON); s.set(32, 54, MOON.h);
      // lower frill bell (second layer)
      s.ball(32, 33, 17, 6, JELLD, { flat: true });
      s.ball(18, 35, 3, 3, JELLD, { flat: true });
      s.ball(25, 37, 3, 3, JELLD, { flat: true });
      s.ball(32, 38, 3, 3, JELLD, { flat: true });
      s.ball(39, 37, 3, 3, JELLD, { flat: true });
      s.ball(46, 35, 3, 3, JELLD, { flat: true });
      // grand top bell
      s.ball(32, 22, 15, 11, JELL);
      s.dither(22, 14, 20, 11, JELL.l, 1);
      // inner full-moon glow
      s.fillEllipse(32, 21, 5, 5, MOON.b);
      s.set(32, 20, MOON.h); s.set(31, 21, MOON.l); s.set(33, 22, MOON.l);
      // halo ring dots around the moon
      s.set(26, 17, MOON.l); s.set(38, 17, MOON.l); s.set(25, 25, MOON.d); s.set(39, 25, MOON.d);
      // bell rim beads
      s.set(19, 28, RIBB.l); s.set(25, 31, RIBB.l); s.set(32, 32, RIBB.l); s.set(39, 31, RIBB.l); s.set(45, 28, RIBB.l);
      // serene face on the lower bell
      K.eye(s, 27, 28, 2, '#f0e0f8');
      K.eye(s, 37, 28, 2, '#f0e0f8');
      s.line(31, 31, 33, 31, '#4a3860');
      // sparkle stars
      s.set(14, 20, '#ffffff'); s.set(50, 24, '#ffffff'); s.set(46, 12, MOON.l);
    },
    drawBack(s) {
      // Rear: layered bells from behind, moonlight shining through the crown, ribbons toward camera.
      // ribbons first
      s.stroke(19, 36, 14, 48, 2, JELLD); s.stroke(14, 48, 18, 58, 2, JELLD);
      s.stroke(27, 39, 24, 52, 2, RIBB); s.stroke(24, 52, 28, 60, 2, RIBB);
      s.stroke(37, 39, 40, 52, 2, RIBB); s.stroke(40, 52, 36, 60, 2, RIBB);
      s.stroke(45, 36, 50, 48, 2, JELLD); s.stroke(50, 48, 46, 58, 2, JELLD);
      s.stroke(32, 40, 32, 55, 2, JELLD);
      // frill layer
      s.ball(32, 33, 18, 6, JELLD, { flat: true });
      s.ball(17, 35, 3, 3, JELLD, { flat: true });
      s.ball(24, 37, 3, 3, JELLD, { flat: true });
      s.ball(32, 38, 4, 3, JELLD, { flat: true });
      s.ball(40, 37, 3, 3, JELLD, { flat: true });
      s.ball(47, 35, 3, 3, JELLD, { flat: true });
      // top bell, no face
      s.ball(32, 22, 16, 12, JELL, { lx: 0, ly: -0.5 });
      s.dither(21, 14, 22, 13, JELLD.l, 0);
      // moon glow bleeding through the crown
      s.fillEllipse(32, 19, 4, 4, MOON.d);
      s.set(32, 18, MOON.b);
      // rim beads
      s.set(18, 28, RIBB.l); s.set(25, 31, RIBB.l); s.set(32, 33, RIBB.l); s.set(39, 31, RIBB.l); s.set(46, 28, RIBB.l);
      s.set(13, 18, '#ffffff'); s.set(51, 22, MOON.l);
    },
  });

  // ============ #42 ANGLOW ============
  const ANG = Px.ramp('#3d4a72');
  const ANGD = Px.ramp('#28324e');
  const LURE = Px.ramp('#f8e060');
  const TEETH = '#f4f8fa';

  Dex.add({
    id: 42, key: 'anglow', name: 'Anglow', types: ['Water', 'Electric'],
    base: { hp: 70, atk: 65, def: 70, spa: 110, spd: 75, spe: 65 },
    ability: 'storm_drinker', catchRate: 75, expYield: 190, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'splash_jet'], [1, 'flash'], [1, 'leer'], [9, 'spark_nip'], [14, 'bite'],
      [20, 'bubble_beam'], [26, 'static_snare'], [32, 'crunch'], [38, 'storm_bolt'], [44, 'surf'], [50, 'sky_fury']],
    tms: ['tm01', 'tm12', 'tm17', 'tm18', 'tm21', 'tm23', 'hm03', 'hm05', 'hm07'],
    dex: { species: 'Storm Lure', h: '1.0m', w: '38.0kg',
      entry: 'It hangs below the drift ice where no light reaches, sipping stray lightning from winter storms. Its lure crackles like a bottled gale.' },
    cry: { base: 240, sweep: 0.5, wave: 'square', dur: 0.55, vib: 8, grit: 0.4 },
    draw(s) {
      // tail fin at right
      s.tri(44, 42, 53, 36, 46, 47, ANGD.b);
      s.tri(44, 44, 52, 50, 44, 49, ANGD.d);
      // round abyssal body
      s.ball(31, 42, 13, 11, ANG);
      // pectoral fins
      s.tri(20, 44, 13, 50, 22, 51, ANGD.b);
      s.tri(41, 47, 46, 54, 36, 52, ANGD.d);
      // dorsal spines
      K.horn(s, 26, 32, -0.3, -1, 5, 1, ANGD);
      K.horn(s, 33, 31, 0.1, -1, 5, 1, ANGD);
      // lateral glow dots
      s.set(21, 42, LURE.d); s.set(25, 44, LURE.d); s.set(29, 45, LURE.d);
      // huge mouth, slightly open with needle teeth
      s.fillPoly([[21, 44], [43, 43], [41, 50], [24, 51]], '#181c28');
      // top needle teeth
      s.set(24, 44, TEETH); s.set(25, 45, TEETH); s.set(29, 44, TEETH); s.set(30, 45, TEETH);
      s.set(34, 44, TEETH); s.set(35, 45, TEETH); s.set(39, 44, TEETH);
      // bottom needle teeth
      s.set(26, 50, TEETH); s.set(27, 49, TEETH); s.set(32, 50, TEETH); s.set(33, 49, TEETH); s.set(38, 49, TEETH);
      // glowing eyes
      K.eye(s, 25, 37, 2, '#f8e060');
      K.eye(s, 38, 37, 2, '#f8e060');
      K.brow(s, 25, 34, 2); K.brow(s, 39, 34, 2);
      // lure stalk arcing forward from the brow
      s.stroke(31, 31, 27, 22, 1, ANGD);
      s.stroke(27, 22, 34, 14, 1, ANGD);
      // crackling bulb
      s.ball(36, 13, 3, 3, LURE, { flat: true });
      s.set(36, 12, LURE.h);
      // sparks
      s.set(32, 9, '#f8f8b0'); s.set(40, 10, '#f8f8b0'); s.set(39, 16, LURE.l);
      s.line(41, 12, 43, 11, LURE.b);
    },
    drawBack(s) {
      // Rear: round back, dorsal spines, tail toward camera, lure bulb glowing above.
      s.ball(31, 42, 14, 12, ANG, { lx: 0, ly: -0.5 });
      s.ball(31, 40, 10, 8, ANGD, { flat: true });
      s.dither(24, 35, 15, 10, ANG.d, 1);
      // dorsal spine row down the back
      K.horn(s, 27, 32, -0.3, -1, 5, 1, ANGD);
      K.horn(s, 34, 31, 0.1, -1, 5, 1, ANGD);
      s.set(31, 44, LURE.d); s.set(28, 48, LURE.d);
      // tail fin swinging toward camera-left
      s.tri(19, 44, 9, 37, 17, 50, ANGD.b);
      s.tri(19, 46, 10, 54, 20, 51, ANGD.d);
      // pectorals
      s.tri(42, 44, 49, 50, 39, 51, ANGD.b);
      // lure stalk arcs over the head from behind
      s.stroke(31, 31, 35, 21, 1, ANGD);
      s.stroke(35, 21, 29, 13, 1, ANGD);
      s.ball(27, 12, 3, 3, LURE, { flat: true });
      s.set(27, 11, LURE.h);
      s.set(23, 9, '#f8f8b0'); s.set(31, 8, '#f8f8b0');
    },
  });

  // ============ MUDSKIPPER LINE (#43-44) ============
  const MUD = Px.ramp('#a38257');
  const MUDD = Px.ramp('#77603e');
  const MUDB = Px.ramp('#dbc9a0');
  const REED = Px.ramp('#7a9a4a');
  const CATT = Px.ramp('#8a6038');

  Dex.add({
    id: 43, key: 'mudlusk', name: 'Mudlusk', types: ['Water', 'Ground'],
    base: { hp: 55, atk: 60, def: 45, spa: 40, spd: 45, spe: 35 },
    ability: 'spring_sponge', catchRate: 200, expYield: 117, growth: 'fast', gender: 50,
    evolve: { to: 'mirelurk', level: 26 },
    learn: [[1, 'tackle'], [1, 'mud_fling'], [6, 'splash_jet'], [11, 'mud_shot'], [16, 'headbutt'],
      [21, 'bubble_beam'], [26, 'bulldoze'], [31, 'body_slam']],
    tms: ['tm07', 'tm12', 'tm14', 'tm17', 'tm25', 'hm03', 'hm04', 'hm07'],
    dex: { species: 'Mudskip', h: '0.5m', w: '9.6kg',
      entry: 'It hauls itself up the harbor steps on stiff fin-arms to watch the ferry come in. Its grin is stuck that way.' },
    cry: { base: 650, sweep: 1.0, wave: 'square', dur: 0.35, vib: 12, chirps: 1 },
    draw(s) {
      // flat tail curling left along the ground
      s.stroke(21, 52, 12, 51, 2, MUD);
      s.tri(12, 47, 6, 51, 12, 55, MUDD.b);
      // blobby head-body, propped up at the front
      s.ball(33, 42, 13, 11, MUD);
      // pale throat/belly
      s.ball(33, 48, 9, 5, MUDB, { flat: true });
      // dorsal sail fin
      s.tri(28, 33, 33, 24, 39, 33, MUDD.b);
      s.line(31, 28, 32, 32, MUDD.l); s.line(35, 27, 36, 32, MUDD.l);
      // stiff fin-arms propping it up
      s.limb(25, 47, 21, 57, 3, 2, MUDD);
      s.limb(41, 47, 45, 57, 3, 2, MUDD);
      s.tri(18, 57, 25, 57, 21, 60, MUDD.b);
      s.tri(42, 57, 49, 57, 45, 60, MUDD.b);
      // googly eye turrets on top
      s.ball(27, 32, 3, 3, MUD, { flat: true });
      s.ball(39, 32, 3, 3, MUD, { flat: true });
      K.eye(s, 27, 31, 2, '#f8f4e8');
      K.eye(s, 39, 31, 2, '#f8f4e8');
      // big goofy lips
      s.line(26, 42, 33, 44, INK); s.line(33, 44, 40, 42, INK);
      s.line(27, 41, 39, 41, MUDB.l);
      K.cheek(s, 23, 40, '#c89868'); K.cheek(s, 42, 40, '#c89868');
      // mud speckles
      s.set(30, 36, MUDD.b); s.set(36, 37, MUDD.b); s.set(25, 44, MUDD.d);
    },
    drawBack(s) {
      // Rear: dorsal sail toward camera, eye turrets from behind, tail into view.
      s.ball(33, 42, 14, 12, MUD, { lx: 0, ly: -0.5 });
      s.ball(33, 40, 10, 8, MUDD, { flat: true });
      s.dither(26, 36, 14, 10, MUD.d, 1);
      // dorsal sail fin, big from behind
      s.tri(27, 33, 33, 22, 40, 33, MUDD.b);
      s.line(31, 27, 32, 32, MUD.l); s.line(36, 26, 36, 32, MUD.l);
      // eye turrets, no pupils from behind
      s.ball(27, 31, 3, 3, MUD, { flat: true });
      s.ball(39, 31, 3, 3, MUD, { flat: true });
      s.set(27, 30, MUDD.b); s.set(39, 30, MUDD.b);
      // fin-arms at the sides
      s.limb(24, 47, 20, 57, 3, 2, MUDD);
      s.limb(42, 47, 46, 57, 3, 2, MUDD);
      // tail curling toward camera-right
      s.stroke(44, 52, 53, 53, 2, MUD);
      s.tri(53, 48, 59, 53, 53, 57, MUDD.b);
      // speckles
      s.set(30, 44, MUDD.d); s.set(36, 46, MUDD.d);
    },
  });

  Dex.add({
    id: 44, key: 'mirelurk', name: 'Mirelurk', types: ['Water', 'Ground'],
    base: { hp: 100, atk: 100, def: 90, spa: 55, spd: 80, spe: 50 },
    ability: 'spring_sponge', catchRate: 75, expYield: 198, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'mud_fling'], [1, 'splash_jet'], [11, 'mud_shot'], [16, 'headbutt'],
      [21, 'bubble_beam'], [28, 'bulldoze'], [34, 'body_slam'], [40, 'burrow_strike'], [46, 'earthshatter'], [52, 'deluge_cannon']],
    tms: ['tm07', 'tm12', 'tm14', 'tm15', 'tm17', 'tm25', 'hm03', 'hm04', 'hm06', 'hm07'],
    dex: { species: 'Fen Lurker', h: '1.7m', w: '210.0kg',
      entry: 'Wildfowl nest in the reeds on its back, never guessing the fen bank beneath them breathes. It surfaces once a day to yawn.' },
    cry: { base: 200, sweep: 0.45, wave: 'square', dur: 0.7, vib: 7, grit: 0.45, sub: true },
    draw(s) {
      // reed camouflage rising behind the shoulders
      s.stroke(19, 24, 15, 10, 1, REED);
      s.stroke(26, 22, 25, 7, 1, REED);
      s.stroke(39, 22, 42, 8, 1, REED);
      s.ball(15, 8, 1, 3, CATT, { flat: true });
      s.ball(25, 5, 1, 3, CATT, { flat: true });
      s.ball(42, 6, 1, 3, CATT, { flat: true });
      s.line(45, 14, 48, 12, REED.l);
      // stubby legs
      s.limb(24, 50, 23, 58, 4, 3, MUDD);
      s.limb(40, 50, 41, 58, 4, 3, MUDD);
      // hulking hunched body
      s.ball(32, 36, 15, 16, MUD);
      // mud-slick streaks
      s.line(22, 28, 20, 40, MUDD.b);
      s.line(42, 28, 44, 40, MUDD.b);
      s.line(37, 26, 38, 34, MUDD.d);
      // heavy arms with mud fists
      s.limb(20, 34, 12, 49, 5, 4, MUD);
      s.limb(44, 34, 52, 49, 5, 4, MUD);
      s.ball(12, 51, 5, 4, MUDD, { lx: -0.3, ly: -0.5 });
      s.ball(52, 51, 5, 4, MUDD, { lx: -0.3, ly: -0.5 });
      K.claws(s, 9, 54, 3, MUDB.b); K.claws(s, 49, 54, 3, MUDB.b);
      // segmented belly plates
      s.ball(32, 44, 8, 7, MUDB, { flat: true });
      s.line(26, 42, 38, 42, MUDB.d); s.line(25, 46, 39, 46, MUDB.d);
      // low-slung head sunk in the shoulders
      s.ball(32, 25, 9, 7, MUD);
      s.ball(32, 22, 7, 3, MUDD, { flat: true });
      // glowing swamp eyes
      K.eye(s, 28, 25, 2, '#d8e860');
      K.eye(s, 36, 25, 2, '#d8e860');
      K.brow(s, 28, 22, 2); K.brow(s, 37, 22, 2);
      // wide grim mouth with snag teeth
      s.line(28, 30, 36, 30, INK);
      s.set(29, 29, MUDB.b); s.set(35, 29, MUDB.b);
    },
    drawBack(s) {
      // Rear: the reed-thicket back is the whole show — hump, cattails, mud streaks.
      s.limb(24, 50, 23, 59, 4, 3, MUDD);
      s.limb(40, 50, 41, 59, 4, 3, MUDD);
      s.ball(32, 36, 16, 17, MUD, { lx: 0, ly: -0.5 });
      // muddy back patch
      s.ball(32, 36, 12, 13, MUDD, { flat: true });
      s.dither(22, 26, 20, 20, MUD.d, 1);
      // reed thicket growing from the back
      s.stroke(22, 30, 17, 12, 1, REED);
      s.stroke(28, 28, 27, 9, 1, REED);
      s.stroke(34, 28, 36, 10, 1, REED);
      s.stroke(40, 30, 45, 14, 1, REED);
      s.ball(17, 10, 1, 3, CATT, { flat: true });
      s.ball(27, 7, 1, 3, CATT, { flat: true });
      s.ball(36, 8, 1, 3, CATT, { flat: true });
      s.ball(45, 12, 1, 3, CATT, { flat: true });
      s.line(20, 20, 22, 26, REED.l);
      // arms at the sides
      s.limb(19, 34, 12, 49, 5, 4, MUD);
      s.limb(45, 34, 52, 49, 5, 4, MUD);
      s.ball(12, 51, 5, 4, MUDD, { lx: 0, ly: -0.5 });
      s.ball(52, 51, 5, 4, MUDD, { lx: 0, ly: -0.5 });
      // back of the sunken head, barely visible below the reeds
      s.ball(32, 24, 8, 6, MUD, { lx: 0, ly: -0.5 });
      s.ball(32, 23, 6, 4, MUDD, { flat: true });
    },
  });

  // ============ #45 CORALITH (fossil) ============
  const STONE = Px.ramp('#a89880');
  const STONED = Px.ramp('#786a54');
  const CORF = Px.ramp('#d87848');
  const PLATEB = Px.ramp('#cfc4a4');

  Dex.add({
    id: 45, key: 'coralith', name: 'Coralith', types: ['Rock', 'Water'],
    base: { hp: 70, atk: 85, def: 120, spa: 60, spd: 95, spe: 55 },
    ability: 'stone_hide', catchRate: 45, expYield: 202, growth: 'slow', gender: 87.5,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'rock_throw'], [8, 'splash_jet'], [14, 'pebble_volley'],
      [20, 'bubble_beam'], [26, 'rock_tomb'], [32, 'relic_power'], [38, 'aqua_tail'], [44, 'rock_slide'], [50, 'stone_spike']],
    tms: ['tm12', 'tm14', 'tm15', 'tm17', 'tm21', 'tm25', 'hm03', 'hm06', 'hm07'],
    dex: { species: 'Reef Relic', h: '1.2m', w: '86.0kg',
      entry: 'Revived from a Fin Fossil pried out of Tidegrot Cave. The reef it once anchored is long gone; it keeps patrolling where the reef used to be.' },
    cry: { base: 380, sweep: 0.5, wave: 'triangle', dur: 0.6, vib: 8, grit: 0.3 },
    draw(s) {
      // stone tail-fan rays at left
      s.tri(16, 40, 6, 32, 15, 42, STONE.b);
      s.tri(15, 42, 4, 42, 15, 45, STONED.b);
      s.tri(16, 44, 6, 52, 15, 47, STONE.b);
      s.set(7, 33, CORF.b); s.set(5, 42, CORF.b); s.set(7, 51, CORF.b);
      // fusiform stone body
      s.ball(30, 42, 14, 9, STONE);
      // trilobite belly plates
      s.ball(29, 47, 10, 4, PLATEB, { flat: true });
      s.line(23, 45, 23, 50, PLATEB.d); s.line(27, 45, 27, 51, PLATEB.d);
      s.line(31, 45, 31, 51, PLATEB.d); s.line(35, 45, 35, 50, PLATEB.d);
      // stone dorsal fin rays
      K.horn(s, 22, 34, -0.4, -1, 6, 2, STONED);
      K.horn(s, 28, 32, -0.1, -1, 7, 2, STONED);
      K.horn(s, 34, 32, 0.2, -1, 6, 2, STONED);
      // coral buds crusted on the back
      s.set(20, 37, CORF.b); s.set(21, 36, CORF.l); s.set(26, 35, CORF.b);
      // armored faceted head shield
      s.fillPoly([[36, 31], [50, 33], [54, 40], [50, 47], [38, 48]], STONED.b);
      s.line(36, 31, 38, 48, STONED.d);
      s.line(50, 33, 50, 47, STONED.l);
      s.line(38, 34, 48, 36, STONED.d);
      s.set(52, 36, STONE.h); s.set(49, 34, STONE.l);
      // pectoral stone fin
      s.tri(36, 48, 32, 56, 42, 52, STONED.b);
      s.line(34, 53, 40, 51, STONE.l);
      // glowing relic eye in the shield
      K.eye(s, 45, 39, 2, '#e87848');
      // mouth slit + fossil whisker barb
      s.line(48, 44, 52, 43, INK);
      s.set(53, 45, CORF.d);
    },
    drawBack(s) {
      // Rear: dorsal stone rays toward camera, head shield angled away, tail fan near.
      s.ball(32, 41, 15, 10, STONE, { lx: 0, ly: -0.5 });
      // dark dorsal ridge
      s.ball(32, 39, 11, 5, STONED, { flat: true });
      s.dither(24, 36, 17, 8, STONE.d, 1);
      // stone fin rays down the spine
      K.horn(s, 24, 34, -0.4, -1, 6, 2, STONED);
      K.horn(s, 31, 32, 0, -1, 7, 3, STONED);
      K.horn(s, 38, 34, 0.4, -1, 6, 2, STONED);
      // coral buds
      s.set(27, 37, CORF.b); s.set(36, 37, CORF.b); s.set(37, 36, CORF.l);
      // head shield away at right, seen edge-on (no face)
      s.fillPoly([[42, 34], [52, 36], [54, 42], [50, 47], [42, 47]], STONED.b);
      s.line(52, 36, 52, 45, STONED.d);
      s.set(50, 38, STONE.l);
      // tail fan swinging toward camera at left, big
      s.tri(18, 39, 6, 30, 16, 42, STONE.b);
      s.tri(17, 42, 3, 42, 16, 45, STONED.b);
      s.tri(18, 45, 6, 54, 16, 47, STONE.b);
      s.set(7, 31, CORF.b); s.set(4, 42, CORF.b); s.set(7, 53, CORF.b);
      // belly plate edges peeking below
      s.line(26, 50, 38, 50, PLATEB.b);
    },
  });
})();
