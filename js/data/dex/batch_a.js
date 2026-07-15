'use strict';
/**
 * Batch A (dex #10-#27): early-game taiga & meadows.
 *   Whisperwood taiga, the Route meadows, and the outskirts of Birchwick
 *   lumber town. Moss deer, seabirds, lemmings, glowworms, badgers,
 *   pinecone boars, static squirrels and standing stones.
 */
(() => {
  const K = SpriteKit;

  // ============ SPRIGFAWN LINE (moss deer) ============
  const FAWN = Px.ramp('#c89a5e');
  const MOSS = Px.ramp('#6aa84f');
  const MOSSD = Px.ramp('#3e7a38');
  const CREAM = Px.ramp('#eee2c4');
  const BARKA = Px.ramp('#8a6a44');
  const GLOWT = Px.ramp('#7fe0b8');

  Dex.add({
    id: 10, key: 'sprigfawn', name: 'Sprigfawn', types: ['Grass'],
    base: { hp: 40, atk: 35, def: 35, spa: 45, spd: 45, spe: 50 },
    ability: 'moss_mend', catchRate: 235, expYield: 104, growth: 'medslow', gender: 50,
    evolve: { to: 'mossbuck', level: 16 },
    learn: [[1, 'tackle'], [1, 'growl'], [4, 'vine_lash'], [8, 'siphon_seed'], [12, 'razor_leaf'],
      [15, 'photomend'], [19, 'sap_surge'], [23, 'verdant_orb']],
    tms: ['tm11', 'tm17', 'tm19', 'tm21', 'tm24', 'hm01'],
    dex: { species: 'Moss Fawn', h: '0.6m', w: '9.5kg',
      entry: 'Born where the Whisperwood moss grows thickest. If it stands still in a Route meadow, songbirds nest between its sprout-antlers.' },
    cry: { base: 700, sweep: 0.95, wave: 'sine', dur: 0.35, vib: 20, chirps: 1 },
    draw(s) {
      // slender legs with dark hooves
      s.limb(27, 47, 26, 55, 1.5, 1, FAWN); s.set(26, 56, BARKA.o);
      s.limb(31, 48, 31, 55, 1.5, 1, FAWN); s.set(31, 56, BARKA.o);
      s.limb(40, 47, 41, 55, 1.5, 1, FAWN); s.set(41, 56, BARKA.o);
      s.limb(44, 46, 46, 54, 1.5, 1, FAWN); s.set(46, 55, BARKA.o);
      // body
      s.ball(35, 44, 10, 7, FAWN);
      // mossy coat over the back
      s.ball(36, 40, 8, 4, MOSS, { flat: true });
      s.dither(30, 42, 12, 2, MOSS.l, 1);
      // cream chest + tail
      s.ball(28, 46, 4, 4, CREAM, { flat: true });
      s.ball(45, 41, 2, 2, CREAM, { flat: true });
      // fawn spots on the rump
      s.set(39, 44, CREAM.b); s.set(42, 46, CREAM.b); s.set(44, 44, CREAM.b);
      // neck + head
      s.limb(28, 41, 25, 34, 3, 3, FAWN);
      s.ball(24, 31, 6, 5.5, FAWN);
      // big gentle ears
      K.horn(s, 18, 27, -1, -0.4, 6, 2, FAWN);
      K.horn(s, 30, 26, 0.9, -0.6, 6, 2, FAWN);
      s.set(15, 25, BARKA.d); s.set(33, 23, BARKA.d);
      // twin sprout-antlers
      s.line(22, 26, 21, 21, MOSSD.d);
      s.line(26, 26, 27, 21, MOSSD.d);
      K.leaf(s, 20, 20, 4, MOSS);
      K.leaf(s, 27, 20, 4, MOSS);
      // face: big gentle eyes
      K.eye(s, 21, 31, 2, '#7a5a30');
      K.eye(s, 27, 31, 2, '#7a5a30');
      s.ball(24, 34, 3, 2, CREAM, { flat: true });
      s.set(24, 33, '#1a1418');
      K.smile(s, 24, 35, 1);
      K.cheek(s, 18, 33, '#e8b088'); K.cheek(s, 29, 33, '#e8b088');
    },
    drawBack(s) {
      // Rear: mossy back and spotted rump, head turned away above.
      s.limb(27, 48, 26, 56, 2, 1, FAWN);
      s.limb(38, 48, 39, 56, 2, 1, FAWN);
      s.ball(32, 44, 11, 8, FAWN, { lx: 0, ly: -0.5 });
      // moss cape down the spine
      s.ball(32, 41, 9, 5, MOSS, { flat: true });
      s.dither(25, 42, 14, 4, MOSSD.b, 1);
      // rump spots + tail
      s.set(27, 47, CREAM.b); s.set(37, 47, CREAM.b); s.set(32, 49, CREAM.b);
      s.ball(32, 44, 2.5, 2.5, CREAM, { flat: true });
      // neck + back of head (no face)
      s.limb(30, 40, 28, 32, 3, 3, FAWN);
      s.ball(28, 29, 6, 5.5, FAWN, { lx: 0, ly: -0.5 });
      s.ball(28, 28, 4, 3, MOSS, { flat: true });
      K.horn(s, 21, 25, -1, -0.4, 6, 2, FAWN);
      K.horn(s, 35, 25, 1, -0.4, 6, 2, FAWN);
      // sprouts from behind
      s.line(26, 24, 25, 19, MOSSD.d);
      s.line(30, 24, 31, 19, MOSSD.d);
      K.leaf(s, 24, 18, 4, MOSSD);
      K.leaf(s, 31, 18, 4, MOSSD);
    },
  });

  Dex.add({
    id: 11, key: 'mossbuck', name: 'Mossbuck', types: ['Grass'],
    base: { hp: 60, atk: 65, def: 65, spa: 70, spd: 70, spe: 70 },
    ability: 'moss_mend', catchRate: 120, expYield: 167, growth: 'medslow', gender: 50,
    evolve: { to: 'elderhorn', level: 32 },
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'vine_lash'], [8, 'siphon_seed'], [12, 'razor_leaf'],
      [15, 'photomend'], [20, 'seed_bomb'], [25, 'sap_surge'], [30, 'slam'], [35, 'verdant_orb'],
      [41, 'timber_crash']],
    tms: ['tm11', 'tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'hm01', 'hm04'],
    dex: { species: 'Sapling Buck', h: '1.2m', w: '38.0kg',
      entry: 'Its antlers are living saplings that leaf out each spring. Birchwick foresters follow its trails to find the healthiest stands of birch.' },
    cry: { base: 440, sweep: 0.8, wave: 'sine', dur: 0.5, vib: 14 },
    draw(s) {
      // legs
      s.limb(25, 48, 23, 57, 2, 1.5, FAWN); s.set(23, 58, BARKA.o);
      s.limb(30, 49, 29, 57, 2, 1.5, FAWN); s.set(29, 58, BARKA.o);
      s.limb(41, 48, 43, 57, 2.5, 1.5, FAWN); s.set(43, 58, BARKA.o);
      s.limb(46, 47, 48, 56, 2, 1.5, FAWN); s.set(48, 57, BARKA.o);
      // body
      s.ball(36, 42, 12, 9, FAWN);
      // moss saddle
      s.ball(37, 37, 10, 5, MOSS, { flat: true });
      s.dither(29, 39, 15, 3, MOSS.l, 0);
      s.set(33, 36, GLOWT.b); s.set(41, 37, GLOWT.b);
      // chest + tail
      s.ball(28, 46, 5, 5, CREAM, { flat: true });
      s.ball(47, 38, 2, 2.5, CREAM, { flat: true });
      // neck + head held high
      s.limb(27, 38, 23, 27, 4, 3, FAWN);
      s.ball(23, 24, 6, 5.5, FAWN);
      // ears
      K.horn(s, 17, 20, -1, -0.4, 6, 2, FAWN);
      K.horn(s, 29, 19, 0.9, -0.5, 6, 2, FAWN);
      // sapling antlers with leaves
      s.line(21, 19, 18, 12, BARKA.b); s.line(18, 12, 15, 13, BARKA.d);
      s.line(26, 19, 28, 12, BARKA.b); s.line(28, 15, 31, 14, BARKA.d);
      K.leaf(s, 17, 11, 5, MOSS);
      K.leaf(s, 14, 13, 4, MOSSD);
      K.leaf(s, 28, 11, 5, MOSS);
      K.leaf(s, 31, 13, 4, MOSSD);
      // face
      K.eye(s, 20, 24, 2, '#7a5a30');
      K.eye(s, 26, 24, 2, '#7a5a30');
      s.ball(23, 27, 3, 2, CREAM, { flat: true });
      s.set(23, 26, '#1a1418');
      K.smile(s, 23, 28, 1);
    },
    drawBack(s) {
      // Rear: moss saddle running down the spine, antler saplings from behind.
      s.limb(26, 48, 24, 57, 2.5, 1.5, FAWN);
      s.limb(38, 48, 40, 57, 2.5, 1.5, FAWN);
      s.ball(32, 43, 12, 10, FAWN, { lx: 0, ly: -0.5 });
      s.ball(32, 40, 10, 6, MOSS, { flat: true });
      s.dither(24, 40, 16, 6, MOSSD.b, 1);
      s.set(28, 38, GLOWT.d); s.set(36, 39, GLOWT.d);
      s.ball(32, 47, 2.5, 3, CREAM, { flat: true });
      // neck + back of head
      s.limb(30, 38, 27, 26, 4, 3, FAWN);
      s.ball(27, 23, 6, 5.5, FAWN, { lx: 0, ly: -0.5 });
      s.ball(27, 22, 4.5, 3, MOSS, { flat: true });
      K.horn(s, 20, 19, -1, -0.4, 6, 2, FAWN);
      K.horn(s, 34, 19, 1, -0.4, 6, 2, FAWN);
      // antlers
      s.line(25, 18, 22, 11, BARKA.b); s.line(22, 13, 19, 12, BARKA.d);
      s.line(29, 18, 32, 11, BARKA.b); s.line(32, 14, 35, 13, BARKA.d);
      K.leaf(s, 21, 10, 5, MOSSD);
      K.leaf(s, 18, 12, 4, MOSSD);
      K.leaf(s, 32, 10, 5, MOSSD);
      K.leaf(s, 35, 12, 4, MOSSD);
    },
  });

  Dex.add({
    id: 12, key: 'elderhorn', name: 'Elderhorn', types: ['Grass', 'Psychic'],
    base: { hp: 85, atk: 75, def: 80, spa: 105, spd: 95, spe: 70 },
    ability: 'moss_mend', catchRate: 45, expYield: 212, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'vine_lash'], [1, 'confusion'], [12, 'razor_leaf'],
      [15, 'photomend'], [20, 'seed_bomb'], [26, 'psybeam'], [32, 'zen_ram'], [38, 'mind_temper'],
      [44, 'verdant_orb'], [50, 'dream_pulse'], [56, 'sunpierce']],
    tms: ['tm04', 'tm09', 'tm11', 'tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'hm01', 'hm04', 'hm05'],
    dex: { species: 'Elk Spirit', h: '2.1m', w: '188.0kg',
      entry: 'The old wardens of Whisperwood swore oaths beneath its tree-crowned brow. Where its runic spots glow, the taiga dreams aloud.' },
    cry: { base: 300, sweep: 0.55, wave: 'sine', dur: 0.65, vib: 8, sub: true },
    draw(s) {
      // long legs
      s.limb(23, 46, 21, 58, 2.5, 1.5, FAWN); s.set(21, 59, BARKA.o);
      s.limb(29, 47, 28, 58, 2.5, 1.5, FAWN); s.set(28, 59, BARKA.o);
      s.limb(43, 46, 45, 58, 3, 1.5, FAWN); s.set(45, 59, BARKA.o);
      s.limb(48, 45, 51, 57, 2.5, 1.5, FAWN); s.set(51, 58, BARKA.o);
      // great body
      s.ball(36, 40, 14, 10, FAWN);
      // moss mantle
      s.ball(37, 34, 12, 5, MOSS, { flat: true });
      s.dither(28, 36, 18, 4, MOSS.l, 1);
      // runic glowing spots on the flank
      s.set(31, 42, GLOWT.b); s.set(32, 43, GLOWT.d);
      s.set(38, 44, GLOWT.b); s.set(39, 43, GLOWT.d);
      s.set(44, 41, GLOWT.b); s.set(44, 42, GLOWT.d);
      // chest + tail
      s.ball(26, 44, 5, 6, CREAM, { flat: true });
      s.ball(49, 36, 2, 3, CREAM, { flat: true });
      // proud neck + head
      s.limb(25, 34, 21, 21, 5, 4, FAWN);
      s.ball(21, 18, 6.5, 5.5, FAWN);
      s.ball(16, 20, 3, 2.5, CREAM, { flat: true });
      s.set(14, 20, '#1a1418');
      // serene eyes
      K.eye(s, 19, 17, 1, '#4a3a68');
      K.eye(s, 24, 17, 1, '#4a3a68');
      // third-eye gem
      s.set(21, 13, '#f0a0d0'); s.set(20, 14, '#e878b0'); s.set(22, 14, '#e878b0'); s.set(21, 15, '#b05888'); s.set(21, 14, '#f8d0e8');
      // ears
      K.horn(s, 14, 15, -1, -0.4, 5, 2, FAWN);
      K.horn(s, 27, 14, 0.9, -0.5, 5, 2, FAWN);
      // antlers: small glowing trees
      s.line(18, 13, 14, 6, BARKA.b); s.line(16, 10, 12, 9, BARKA.d);
      s.line(25, 12, 29, 4, BARKA.b); s.line(27, 8, 32, 7, BARKA.d); s.line(28, 6, 25, 3, BARKA.d);
      s.ball(13, 5, 3.5, 2.5, MOSS, { flat: true });
      s.ball(11, 9, 2.5, 2, MOSSD, { flat: true });
      s.ball(30, 3, 3.5, 2.5, MOSS, { flat: true });
      s.ball(33, 7, 2.5, 2, MOSSD, { flat: true });
      s.ball(25, 2, 2, 1.5, MOSS, { flat: true });
      // canopy glow dots
      s.set(13, 4, GLOWT.h); s.set(30, 2, GLOWT.h); s.set(33, 6, GLOWT.b); s.set(11, 8, GLOWT.b);
    },
    drawBack(s) {
      // Rear: rune-lit moss mantle down the spine, tree antlers from behind.
      s.limb(25, 46, 23, 58, 3, 1.5, FAWN);
      s.limb(39, 46, 41, 58, 3, 1.5, FAWN);
      s.ball(32, 41, 14, 11, FAWN, { lx: 0, ly: -0.5 });
      s.fillPoly([[22, 34], [42, 34], [44, 46], [32, 52], [20, 46]], MOSS.b);
      s.dither(24, 37, 16, 12, MOSSD.b, 1);
      // rune ring on the mantle
      s.set(32, 39, GLOWT.b); s.set(28, 42, GLOWT.b); s.set(36, 42, GLOWT.b);
      s.set(30, 46, GLOWT.d); s.set(34, 46, GLOWT.d);
      s.ball(32, 51, 2.5, 3, CREAM, { flat: true });
      // neck + back of head
      s.limb(30, 34, 27, 20, 5, 4, FAWN);
      s.ball(27, 17, 6.5, 5.5, FAWN, { lx: 0, ly: -0.5 });
      s.ball(27, 16, 5, 3.5, MOSS, { flat: true });
      K.horn(s, 20, 14, -1, -0.4, 5, 2, FAWN);
      K.horn(s, 34, 13, 1, -0.4, 5, 2, FAWN);
      // tree antlers
      s.line(24, 12, 20, 5, BARKA.b); s.line(22, 9, 18, 8, BARKA.d);
      s.line(31, 11, 35, 3, BARKA.b); s.line(33, 7, 38, 6, BARKA.d);
      s.ball(19, 4, 3.5, 2.5, MOSSD, { flat: true });
      s.ball(17, 8, 2.5, 2, MOSSD, { flat: true });
      s.ball(36, 2, 3.5, 2.5, MOSSD, { flat: true });
      s.ball(39, 6, 2.5, 2, MOSSD, { flat: true });
      s.set(19, 3, GLOWT.b); s.set(36, 1, GLOWT.b);
    },
  });

  // ============ PUFFINCH LINE (seabirds) ============
  const SLATE = Px.ramp('#5c6f80');
  const WHT = Px.ramp('#eef0ec');
  const ORG = Px.ramp('#f08828');
  const STORMB = Px.ramp('#3d5a80');
  const WAVE = Px.ramp('#5fc8d8');

  Dex.add({
    id: 13, key: 'puffinch', name: 'Puffinch', types: ['Normal', 'Flying'],
    base: { hp: 45, atk: 40, def: 35, spa: 35, spd: 40, spe: 50 },
    ability: 'hunter_eye', catchRate: 255, expYield: 102, growth: 'medfast', gender: 50,
    evolve: { to: 'galewing', level: 14 },
    learn: [[1, 'peck'], [1, 'growl'], [6, 'wind_gust'], [10, 'quick_jab'], [13, 'wing_strike'],
      [18, 'sky_cutter'], [23, 'gale_blade'], [28, 'wind_rest']],
    tms: ['tm16', 'tm17', 'tm21', 'tm25', 'hm02'],
    dex: { species: 'Puffball Chick', h: '0.3m', w: '2.1kg',
      entry: 'Too round to fly, it rolls downhill through the Route meadows to build up speed. Birchwick children race them down the lumber chutes.' },
    cry: { base: 860, sweep: 1.2, wave: 'square', dur: 0.3, vib: 24, chirps: 2 },
    draw(s) {
      // one round fluff of a bird
      s.ball(32, 43, 11, 11, SLATE);
      // white belly + face disc
      s.ball(32, 47, 7, 6, WHT, { flat: true });
      s.ball(32, 38, 7, 5, WHT, { flat: true });
      // fluff texture on the dark cap
      s.dither(26, 33, 13, 3, SLATE.l, 0);
      // cowlick tuft
      s.set(32, 31, SLATE.d); s.set(33, 30, SLATE.b); s.set(31, 30, SLATE.l);
      // stubby wings
      s.ball(21, 44, 3, 5, SLATE, { flat: true });
      s.ball(43, 44, 3, 5, SLATE, { flat: true });
      s.set(21, 48, SLATE.d); s.set(43, 48, SLATE.d);
      // round eyes on the white face
      K.eye(s, 27, 38, 2, '#28303c');
      K.eye(s, 37, 38, 2, '#28303c');
      // bright orange beak
      s.tri(30, 41, 35, 41, 32, 45, ORG.b);
      s.set(30, 41, ORG.l); s.set(32, 44, ORG.d);
      K.cheek(s, 23, 40, '#f8c8a0'); K.cheek(s, 40, 40, '#f8c8a0');
      // orange feet
      s.ball(27, 55, 2.5, 1.5, ORG, { flat: true });
      s.ball(37, 55, 2.5, 1.5, ORG, { flat: true });
    },
    drawBack(s) {
      // Rear: all dark cap and back, tiny tail nub, no face.
      s.ball(32, 42, 12, 12, SLATE, { lx: 0, ly: -0.5 });
      // darker back saddle + fluff
      s.ball(32, 41, 8, 8, SLATE, { flat: true });
      s.dither(24, 34, 16, 12, SLATE.d, 1);
      // white sides peeking
      s.ball(21, 48, 2, 4, WHT, { flat: true });
      s.ball(43, 48, 2, 4, WHT, { flat: true });
      // wings folded toward camera
      s.ball(20, 44, 3, 5.5, SLATE, { flat: true });
      s.ball(44, 44, 3, 5.5, SLATE, { flat: true });
      s.set(20, 40, SLATE.l); s.set(44, 40, SLATE.l);
      // cowlick + tail nub
      s.set(32, 29, SLATE.d); s.set(31, 28, SLATE.b);
      s.tri(29, 53, 35, 53, 32, 58, SLATE.d);
      s.ball(27, 56, 2, 1, ORG, { flat: true });
      s.ball(37, 56, 2, 1, ORG, { flat: true });
    },
  });

  Dex.add({
    id: 14, key: 'galewing', name: 'Galewing', types: ['Normal', 'Flying'],
    base: { hp: 65, atk: 80, def: 58, spa: 62, spd: 60, spe: 105 },
    ability: 'hunter_eye', catchRate: 120, expYield: 179, growth: 'medfast', gender: 50,
    evolve: { to: 'stormgull', level: 30 },
    learn: [[1, 'peck'], [1, 'growl'], [1, 'wind_gust'], [10, 'quick_jab'], [13, 'wing_strike'],
      [19, 'sky_cutter'], [25, 'gale_blade'], [31, 'wind_rest'], [37, 'hyper_voice'], [43, 'dive_bomber']],
    tms: ['tm16', 'tm17', 'tm21', 'tm25', 'hm02'],
    dex: { species: 'Gale Bird', h: '0.9m', w: '14.5kg',
      entry: 'It outruns squalls rolling in off the fjord and threads the Whisperwood pines at full speed. Its wingbeats sound like snapping sailcloth.' },
    cry: { base: 620, sweep: 0.9, wave: 'square', dur: 0.4, vib: 18 },
    draw(s) {
      // mid-flap: wings spread wide, body streamlined
      // left wing
      s.fillPoly([[26, 33], [9, 21], [7, 28], [24, 40]], SLATE.b);
      s.line(9, 21, 24, 32, SLATE.l);
      s.line(7, 28, 22, 39, SLATE.d);
      s.line(11, 25, 23, 35, WHT.b);
      // right wing
      s.fillPoly([[38, 33], [55, 21], [57, 28], [40, 40]], SLATE.b);
      s.line(55, 21, 40, 32, SLATE.l);
      s.line(57, 28, 42, 39, SLATE.d);
      s.line(53, 25, 41, 35, WHT.b);
      // forked tail
      s.fillPoly([[29, 45], [35, 45], [38, 55], [32, 51], [26, 55]], SLATE.b);
      s.line(26, 55, 31, 49, SLATE.d);
      // sleek white body
      s.ball(32, 37, 7, 10, WHT);
      // slate mantle over shoulders
      s.ball(32, 31, 7, 4, SLATE, { flat: true });
      // head
      s.ball(32, 25, 6, 5, WHT);
      s.ball(32, 22, 6, 3, SLATE, { flat: true });
      // eye-stripe goggles
      s.line(26, 25, 29, 25, SLATE.d); s.line(35, 25, 38, 25, SLATE.d);
      K.eye(s, 29, 25, 2, '#c8a020');
      K.eye(s, 35, 25, 2, '#c8a020');
      // sharp beak
      s.tri(30, 28, 34, 28, 32, 33, ORG.b);
      s.set(32, 32, ORG.d);
      // wind streaks
      s.set(14, 34, WHT.h); s.set(50, 34, WHT.h);
    },
    drawBack(s) {
      // Rear: slate back and wings, white rump, tail toward camera.
      // wings (upper surface: darker slate)
      s.fillPoly([[26, 33], [9, 21], [7, 28], [24, 40]], SLATE.b);
      s.line(9, 21, 24, 32, SLATE.d);
      s.line(9, 25, 22, 35, SLATE.l);
      s.fillPoly([[38, 33], [55, 21], [57, 28], [40, 40]], SLATE.b);
      s.line(55, 21, 40, 32, SLATE.d);
      s.line(55, 25, 42, 35, SLATE.l);
      // body: slate back
      s.ball(32, 36, 7.5, 10, SLATE, { lx: 0, ly: -0.5 });
      s.dither(27, 30, 10, 8, SLATE.l, 0);
      // white rump patch
      s.ball(32, 44, 4, 3, WHT, { flat: true });
      // forked tail flaring toward camera
      s.fillPoly([[28, 45], [36, 45], [40, 58], [32, 52], [24, 58]], SLATE.b);
      s.line(24, 58, 31, 50, SLATE.d); s.line(40, 58, 33, 50, SLATE.d);
      // back of head: cap only, no face
      s.ball(32, 24, 6, 5, SLATE, { lx: 0, ly: -0.5 });
      s.ball(32, 26, 4, 2, WHT, { flat: true });
      s.set(32, 19, SLATE.l);
    },
  });

  Dex.add({
    id: 15, key: 'stormgull', name: 'Stormgull', types: ['Water', 'Flying'],
    base: { hp: 75, atk: 80, def: 65, spa: 95, spd: 70, spe: 100 },
    ability: 'drizzlecall', catchRate: 45, expYield: 202, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'peck'], [1, 'growl'], [1, 'wind_gust'], [1, 'splash_jet'], [13, 'wing_strike'],
      [19, 'bubble_beam'], [25, 'gale_blade'], [30, 'aqua_jet'], [36, 'stormcall'], [42, 'cyclone'],
      [48, 'dive_bomber'], [54, 'deluge_cannon']],
    tms: ['tm12', 'tm13', 'tm16', 'tm17', 'tm21', 'tm25', 'hm02', 'hm03', 'hm07'],
    dex: { species: 'Storm Gull', h: '1.4m', w: '31.0kg',
      entry: 'Fisherfolk read the sea by its wings: when the wave-marks darken, a gale follows within the hour. It rides the storm it carries.' },
    cry: { base: 480, sweep: 0.7, wave: 'sawtooth', dur: 0.55, vib: 12, grit: 0.3 },
    draw(s) {
      // tail behind the legs
      s.tri(26, 47, 38, 47, 32, 57, STORMB.b);
      // raised storm-blue wings
      s.fillPoly([[24, 40], [12, 18], [5, 25], [10, 35], [22, 46]], STORMB.b);
      s.line(12, 18, 22, 40, STORMB.l);
      s.line(5, 25, 20, 44, STORMB.d);
      s.fillPoly([[40, 40], [52, 18], [59, 25], [54, 35], [42, 46]], STORMB.b);
      s.line(52, 18, 42, 40, STORMB.l);
      s.line(59, 25, 44, 44, STORMB.d);
      // wave markings on the wings
      s.line(10, 26, 13, 29, WAVE.b); s.line(13, 29, 10, 32, WAVE.b); s.line(10, 32, 13, 35, WAVE.l);
      s.line(54, 26, 51, 29, WAVE.b); s.line(51, 29, 54, 32, WAVE.b); s.line(54, 32, 51, 35, WAVE.l);
      // white body
      s.ball(32, 42, 10, 9, WHT);
      // wave-mark on the chest
      s.line(28, 44, 31, 46, WAVE.b); s.line(31, 46, 34, 44, WAVE.b); s.line(34, 44, 37, 46, WAVE.d);
      // orange legs
      s.limb(28, 50, 27, 56, 1.5, 1, ORG);
      s.limb(36, 50, 37, 56, 1.5, 1, ORG);
      // head with storm cap
      s.ball(32, 28, 7, 6, WHT);
      s.ball(32, 24, 7, 3, STORMB, { flat: true });
      // sea-spray crest
      K.horn(s, 28, 22, -0.5, -1, 5, 1.5, WAVE);
      K.horn(s, 32, 21, 0.1, -1, 6, 1.5, WHT);
      K.horn(s, 36, 22, 0.7, -0.9, 5, 1.5, WAVE);
      // fierce eyes
      K.eye(s, 28, 28, 2, '#e8b020');
      K.eye(s, 36, 28, 2, '#e8b020');
      K.brow(s, 28, 25, 2); K.brow(s, 37, 25, 2);
      // hooked beak
      s.tri(30, 31, 34, 31, 32, 37, ORG.b);
      s.set(32, 36, ORG.d); s.set(32, 37, ORG.o);
    },
    drawBack(s) {
      // Rear: storm-blue mantle, raised wings, tail fanning toward camera.
      s.fillPoly([[24, 40], [12, 18], [5, 25], [10, 35], [22, 46]], STORMB.b);
      s.line(12, 18, 22, 40, STORMB.d);
      s.line(7, 24, 20, 42, STORMB.l);
      s.fillPoly([[40, 40], [52, 18], [59, 25], [54, 35], [42, 46]], STORMB.b);
      s.line(52, 18, 42, 40, STORMB.d);
      s.line(57, 24, 44, 42, STORMB.l);
      // zigzag wave-marks visible from behind too
      s.line(11, 28, 14, 31, WAVE.d); s.line(14, 31, 11, 34, WAVE.d);
      s.line(53, 28, 50, 31, WAVE.d); s.line(50, 31, 53, 34, WAVE.d);
      // body: blue-grey back, white sides
      s.ball(32, 41, 10.5, 10, WHT, { lx: 0, ly: -0.5 });
      s.ball(32, 39, 8, 8, STORMB, { flat: true });
      s.dither(26, 33, 13, 9, STORMB.l, 1);
      // tail fan toward camera
      s.fillPoly([[27, 47], [37, 47], [41, 58], [32, 54], [23, 58]], STORMB.b);
      s.line(23, 58, 31, 52, STORMB.d); s.line(41, 58, 33, 52, STORMB.d);
      // back of head with crest, no face
      s.ball(32, 27, 7, 6, WHT, { lx: 0, ly: -0.5 });
      s.ball(32, 25, 7, 4, STORMB, { flat: true });
      K.horn(s, 28, 21, -0.5, -1, 5, 1.5, WAVE);
      K.horn(s, 32, 20, 0.1, -1, 6, 1.5, WAVE);
      K.horn(s, 36, 21, 0.7, -0.9, 5, 1.5, WAVE);
    },
  });

  // ============ NIBBIT LINE (lemmings) ============
  const BRN = Px.ramp('#b08850');
  const DKBRN = Px.ramp('#6a4a34');
  const SEED = Px.ramp('#e0b070');

  Dex.add({
    id: 16, key: 'nibbit', name: 'Nibbit', types: ['Normal'],
    base: { hp: 55, atk: 45, def: 40, spa: 30, spd: 35, spe: 35 },
    ability: 'slippery', catchRate: 255, expYield: 100, growth: 'fast', gender: 50,
    evolve: { to: 'lemmoth', level: 18 },
    learn: [[1, 'tackle'], [1, 'leer'], [5, 'quick_jab'], [9, 'bite'], [13, 'fury_swipes'],
      [17, 'harden'], [22, 'headbutt'], [27, 'body_slam'], [32, 'mend']],
    tms: ['tm11', 'tm17', 'tm21', 'tm25', 'hm01'],
    dex: { species: 'Seed Hoard', h: '0.3m', w: '3.4kg',
      entry: 'It stuffs one seed in its paws and refuses to share, even mid-battle. Route farmers lose a tithe of every harvest to its burrows.' },
    cry: { base: 780, sweep: 1.05, wave: 'triangle', dur: 0.3, vib: 26 },
    draw(s) {
      // plump round body
      s.ball(32, 45, 10, 10, BRN);
      // cream belly
      s.ball(32, 48, 6, 5, CREAM, { flat: true });
      // dark brow band across the crown
      s.ball(32, 37, 9, 3, DKBRN, { flat: true });
      // little round ears
      s.ball(25, 34, 2.5, 3, BRN); s.set(25, 34, DKBRN.b);
      s.ball(39, 34, 2.5, 3, BRN); s.set(39, 34, DKBRN.b);
      // face
      K.eye(s, 27, 42, 2, '#28303c');
      K.eye(s, 37, 42, 2, '#28303c');
      s.set(32, 44, '#3a2a20'); s.set(31, 44, '#5a4030');
      // buck teeth
      s.rect(30, 46, 1, 2, '#ffffff'); s.rect(33, 46, 1, 2, '#ffffff');
      K.cheek(s, 23, 44, '#e0a878'); K.cheek(s, 40, 44, '#e0a878');
      s.set(21, 43, DKBRN.d); s.set(43, 43, DKBRN.d); // whisker dots
      // paws hugging a seed
      s.ball(32, 52, 3, 2.5, SEED, { flat: true });
      s.set(32, 50, DKBRN.b); s.set(31, 51, SEED.l);
      s.limb(27, 49, 29, 52, 1.5, 1, BRN);
      s.limb(37, 49, 35, 52, 1.5, 1, BRN);
      // feet
      s.ball(26, 55, 3, 1.5, BRN, { flat: true });
      s.ball(38, 55, 3, 1.5, BRN, { flat: true });
    },
    drawBack(s) {
      // Rear: dark stripe down a round back, ears from behind, tail dot.
      s.ball(32, 44, 11, 11, BRN, { lx: 0, ly: -0.5 });
      // lemming stripe down the spine
      s.ball(32, 41, 4, 8, DKBRN, { flat: true });
      s.dither(26, 38, 13, 10, BRN.d, 1);
      // ears
      s.ball(25, 33, 2.5, 3, BRN); s.set(25, 32, DKBRN.b);
      s.ball(39, 33, 2.5, 3, BRN); s.set(39, 32, DKBRN.b);
      // haunches + tail nub
      s.ball(24, 50, 4, 4, BRN, { flat: true });
      s.ball(40, 50, 4, 4, BRN, { flat: true });
      s.set(32, 52, DKBRN.b); s.set(32, 53, DKBRN.d);
      s.ball(26, 55, 3, 1.5, BRN, { flat: true });
      s.ball(38, 55, 3, 1.5, BRN, { flat: true });
    },
  });

  Dex.add({
    id: 17, key: 'lemmoth', name: 'Lemmoth', types: ['Normal'],
    base: { hp: 115, atk: 85, def: 75, spa: 45, spd: 70, spe: 50 },
    ability: 'blubber', catchRate: 75, expYield: 183, growth: 'fast', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [5, 'quick_jab'], [9, 'bite'], [13, 'fury_swipes'],
      [18, 'headbutt'], [24, 'rest'], [30, 'body_slam'], [36, 'crunch'], [43, 'slam'],
      [50, 'reckless_charge']],
    tms: ['tm07', 'tm15', 'tm17', 'tm21', 'tm23', 'tm25', 'hm01', 'hm04'],
    dex: { species: 'Fur Avalanche', h: '1.6m', w: '142.0kg',
      entry: 'When it dozes off on a slope, whole snowbanks come down with it. Birchwick paid it in grain to sleep somewhere else.' },
    cry: { base: 170, sweep: 0.45, wave: 'triangle', dur: 0.75, vib: 6, sub: true },
    draw(s) {
      // enormous shaggy mound
      s.ball(32, 39, 19, 17, BRN);
      // shaggy skirt of fur
      s.ball(18, 51, 6, 5, BRN, { flat: true });
      s.ball(28, 54, 6, 4, BRN, { flat: true });
      s.ball(38, 54, 6, 4, BRN, { flat: true });
      s.ball(47, 51, 6, 5, BRN, { flat: true });
      // hanging fur fringe
      for (let i = 0; i < 7; i++) s.tri(15 + i * 5, 54, 19 + i * 5, 54, 17 + i * 5, 58, DKBRN.b);
      s.dither(18, 44, 28, 8, DKBRN.b, 1);
      // dark crown of fur
      s.ball(32, 25, 13, 5, DKBRN, { flat: true });
      for (let i = 0; i < 5; i++) K.horn(s, 22 + i * 5, 23, (i - 2) * 0.25, -1, 4, 1.5, DKBRN);
      // buried little ears
      s.ball(19, 27, 3, 3, BRN); s.set(19, 26, DKBRN.b);
      s.ball(45, 27, 3, 3, BRN); s.set(45, 26, DKBRN.b);
      // cream face
      s.ball(32, 34, 10, 8, CREAM, { flat: true });
      // sleepy half-shut eyes
      s.line(25, 33, 29, 33, '#1a1418'); s.set(27, 34, '#1a1418');
      s.line(35, 33, 39, 33, '#1a1418'); s.set(37, 34, '#1a1418');
      // nose + buck teeth
      s.set(32, 36, '#3a2a20'); s.set(31, 36, '#5a4030');
      s.rect(30, 38, 1, 3, '#ffffff'); s.rect(33, 38, 1, 3, '#ffffff');
      K.cheek(s, 22, 36, '#e0a878'); K.cheek(s, 41, 36, '#e0a878');
      // tiny paws lost in fur
      s.ball(24, 55, 3, 2, CREAM, { flat: true });
      s.ball(40, 55, 3, 2, CREAM, { flat: true });
    },
    drawBack(s) {
      // Rear: a hill of fur — spine stripe, fringe, ear tips, tail puff.
      s.ball(32, 38, 20, 18, BRN, { lx: 0, ly: -0.5 });
      s.ball(17, 51, 6, 5, BRN, { flat: true });
      s.ball(27, 54, 6, 4, BRN, { flat: true });
      s.ball(37, 54, 6, 4, BRN, { flat: true });
      s.ball(47, 51, 6, 5, BRN, { flat: true });
      for (let i = 0; i < 7; i++) s.tri(15 + i * 5, 54, 19 + i * 5, 54, 17 + i * 5, 59, DKBRN.b);
      // broad dark stripe down the back
      s.ball(32, 36, 7, 14, DKBRN, { flat: true });
      s.dither(20, 30, 25, 20, BRN.d, 0);
      // crown fur + ears from behind
      s.ball(32, 23, 13, 5, DKBRN, { flat: true });
      for (let i = 0; i < 5; i++) K.horn(s, 22 + i * 5, 21, (i - 2) * 0.25, -1, 4, 1.5, DKBRN);
      s.ball(19, 26, 3, 3, BRN); s.ball(45, 26, 3, 3, BRN);
      // tail puff
      s.ball(32, 54, 3.5, 3, CREAM, { flat: true });
    },
  });

  // ============ LARVEL LINE (aurora moths) ============
  const PALEG = Px.ramp('#d8d2b0');
  const GLOWG = Px.ramp('#c0e858');
  const ICEC = Px.ramp('#a8ccdc');
  const FROST = Px.ramp('#e4f4fa');
  const TEALW = Px.ramp('#4fd8bc');
  const VIOL = Px.ramp('#8878e0');
  const PINKW = Px.ramp('#f088c8');
  const FUZZ = Px.ramp('#ece4d0');

  Dex.add({
    id: 18, key: 'larvel', name: 'Larvel', types: ['Bug'],
    base: { hp: 45, atk: 35, def: 35, spa: 35, spd: 30, spe: 20 },
    ability: 'dream_dust', catchRate: 255, expYield: 83, growth: 'medfast', gender: 50,
    evolve: { to: 'chrysalisk', level: 10 },
    learn: [[1, 'nibble'], [1, 'silk_bind'], [3, 'tackle'], [5, 'flash'], [7, 'twin_sting'],
      [9, 'harden'], [12, 'sap_bite'], [15, 'prism_wing']],
    tms: ['tm17', 'tm19', 'tm21', 'tm25'],
    dex: { species: 'Glowworm', h: '0.3m', w: '2.6kg',
      entry: 'On moonless nights the Whisperwood floor is stitched with its faint green lights. Wanderers who follow them are led gently back to the road.' },
    cry: { base: 820, sweep: 0.75, wave: 'sine', dur: 0.3, vib: 30 },
    draw(s) {
      // segmented grub, tail curled up at right
      s.ball(45, 44, 3.5, 3.5, PALEG);
      s.ball(43, 48, 4.5, 4, PALEG);
      s.ball(37, 50, 5, 4.5, PALEG);
      s.ball(30, 50, 5.5, 5, PALEG);
      // head raised
      s.ball(22, 45, 6, 6, PALEG);
      // segment creases
      s.line(34, 47, 34, 54, PALEG.d);
      s.line(40, 46, 41, 52, PALEG.d);
      // glow dots along the side
      s.set(29, 48, GLOWG.b); s.set(29, 49, GLOWG.d);
      s.set(36, 48, GLOWG.b); s.set(36, 49, GLOWG.d);
      s.set(42, 46, GLOWG.b);
      s.set(45, 42, GLOWG.l); s.set(45, 41, GLOWG.h); // glowing tail tip
      // belly feet dots
      s.set(28, 55, PALEG.o); s.set(32, 55, PALEG.o); s.set(37, 54, PALEG.o);
      // stubby antennae
      s.set(19, 39, PALEG.d); s.set(18, 38, DKBRN.b);
      s.set(24, 39, PALEG.d); s.set(25, 38, DKBRN.b);
      // face
      K.eye(s, 20, 44, 2, '#4a6a28');
      K.eye(s, 25, 44, 2, '#4a6a28');
      K.smile(s, 22, 48, 1);
      K.cheek(s, 17, 47, '#d8e888'); K.cheek(s, 28, 47, '#d8e888');
    },
    drawBack(s) {
      // Rear: tail segment near camera, glow dots down the spine, head away.
      s.ball(20, 47, 5, 4.5, PALEG, { flat: true }); // far segment
      s.ball(26, 50, 5.5, 5, PALEG);
      s.ball(33, 50, 5.5, 5, PALEG);
      s.ball(40, 48, 5, 4.5, PALEG);
      s.ball(44, 43, 4, 4, PALEG); // curled tail toward camera
      // back of head at far left, no face
      s.ball(16, 43, 5.5, 5.5, PALEG, { lx: 0, ly: -0.5 });
      s.ball(16, 42, 4, 3, PALEG, { flat: true });
      s.dither(13, 40, 7, 4, PALEG.d, 0);
      s.set(13, 37, DKBRN.b); s.set(18, 36, DKBRN.b); // antennae tips
      // spine glow dots
      s.set(26, 47, GLOWG.b); s.set(33, 47, GLOWG.b); s.set(40, 45, GLOWG.b);
      s.set(26, 48, GLOWG.d); s.set(33, 48, GLOWG.d);
      s.set(44, 40, GLOWG.l); s.set(44, 39, GLOWG.h);
      // creases
      s.line(30, 47, 30, 54, PALEG.d);
      s.line(37, 46, 37, 53, PALEG.d);
    },
  });

  Dex.add({
    id: 19, key: 'chrysalisk', name: 'Chrysalisk', types: ['Bug'],
    base: { hp: 50, atk: 30, def: 95, spa: 30, spd: 20, spe: 15 },
    ability: 'stone_hide', catchRate: 190, expYield: 100, growth: 'medfast', gender: 50,
    evolve: { to: 'aurorwing', level: 22 },
    learn: [[1, 'nibble'], [1, 'silk_bind'], [1, 'harden'], [10, 'flash'], [13, 'twin_sting'],
      [16, 'frost_armor'], [20, 'sap_bite'], [24, 'prism_wing']],
    tms: ['tm13', 'tm17', 'tm19', 'tm21', 'tm25'],
    dex: { species: 'Ice Cocoon', h: '0.5m', w: '7.2kg',
      entry: 'It hangs among true icicles and lets the frost seal it shut. One patient eye watches winter pass through a window of clear ice.' },
    cry: { base: 520, sweep: 0.5, wave: 'triangle', dur: 0.35, vib: 8 },
    draw(s) {
      // branch stub across the top
      s.stroke(14, 8, 42, 10, 2, BARKA);
      s.set(43, 9, BARKA.d); s.set(44, 10, BARKA.o);
      s.line(16, 6, 20, 8, BARKA.l);
      // silk wrap attachment
      s.ball(32, 13, 2, 3, FROST, { flat: true });
      s.line(31, 11, 33, 11, FROST.d);
      // icicle body: bulk then taper
      s.ball(32, 25, 9, 11, ICEC);
      s.fillPoly([[24, 30], [40, 30], [34, 50], [32, 53], [30, 50]], ICEC.b);
      s.line(39, 31, 33, 50, ICEC.d);
      s.line(25, 31, 31, 50, ICEC.l);
      s.set(32, 52, FROST.b); s.set(32, 53, FROST.l);
      // segment ridges
      s.line(25, 20, 39, 20, ICEC.d);
      s.line(26, 27, 38, 27, ICEC.d);
      s.line(28, 35, 36, 35, ICEC.d);
      s.line(29, 41, 34, 41, ICEC.d);
      // frost sheen
      s.dither(27, 16, 6, 8, FROST.b, 0);
      s.dither(29, 32, 5, 8, FROST.d, 1);
      // side icicle drips
      s.tri(24, 30, 27, 30, 25, 36, FROST.b);
      s.tri(38, 32, 40, 32, 39, 37, FROST.b);
      // one eye through a frost window
      s.ball(28, 24, 3.5, 3, FROST, { flat: true });
      K.eye(s, 28, 24, 2, '#d8a020');
      s.line(26, 22, 31, 25, FROST.b); // frost streak half-covering it
    },
    drawBack(s) {
      // Rear: same hanging husk, no eye window — ridged spine and rime.
      s.stroke(14, 8, 42, 10, 2, BARKA);
      s.set(43, 9, BARKA.d);
      s.ball(32, 13, 2, 3, FROST, { flat: true });
      s.ball(32, 25, 9.5, 11, ICEC, { lx: 0, ly: -0.5 });
      s.fillPoly([[24, 30], [41, 30], [34, 50], [32, 53], [30, 50]], ICEC.b);
      s.line(40, 31, 33, 50, ICEC.d);
      s.line(25, 31, 31, 50, ICEC.l);
      // spine ridge down the middle
      s.line(32, 15, 32, 48, ICEC.d);
      s.line(33, 18, 33, 44, FROST.d);
      // ridges
      s.line(25, 21, 39, 21, ICEC.d);
      s.line(27, 28, 38, 28, ICEC.d);
      s.line(29, 36, 36, 36, ICEC.d);
      // heavy rime
      s.dither(26, 16, 12, 10, FROST.b, 1);
      s.dither(29, 33, 6, 9, FROST.d, 0);
      s.tri(24, 30, 27, 30, 25, 37, FROST.b);
      s.tri(38, 31, 41, 31, 40, 38, FROST.b);
      s.set(32, 52, FROST.l);
    },
  });

  Dex.add({
    id: 20, key: 'aurorwing', name: 'Aurorwing', types: ['Bug', 'Psychic'],
    base: { hp: 70, atk: 55, def: 60, spa: 115, spd: 90, spe: 110 },
    ability: 'updraft', catchRate: 45, expYield: 208, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'nibble'], [1, 'silk_bind'], [1, 'confusion'], [1, 'wind_gust'], [13, 'twin_sting'],
      [16, 'psybeam'], [22, 'prism_wing'], [28, 'mesmerize'], [34, 'scale_gale'], [40, 'mind_temper'],
      [46, 'mind_crush'], [52, 'dream_pulse']],
    tms: ['tm04', 'tm09', 'tm13', 'tm16', 'tm17', 'tm19', 'tm21', 'hm02', 'hm05'],
    dex: { species: 'Aurora Moth', h: '1.1m', w: '18.5kg',
      entry: 'Skalders say the northern lights are the wake of a thousand Aurorwing flying too high to see. Its wingbeats scatter dream-bright dust.' },
    cry: { base: 660, sweep: 1.3, wave: 'sine', dur: 0.6, vib: 34 },
    draw(s) {
      // upper wings in aurora bands (teal / violet / pink)
      s.fillPoly([[28, 31], [7, 15], [4, 22], [28, 35]], TEALW.b);
      s.fillPoly([[28, 35], [4, 22], [6, 29], [28, 39]], VIOL.b);
      s.fillPoly([[28, 39], [6, 29], [10, 36], [28, 43]], PINKW.b);
      s.fillPoly([[36, 31], [57, 15], [60, 22], [36, 35]], TEALW.b);
      s.fillPoly([[36, 35], [60, 22], [58, 29], [36, 39]], VIOL.b);
      s.fillPoly([[36, 39], [58, 29], [54, 36], [36, 43]], PINKW.b);
      // lower wings
      s.fillPoly([[28, 43], [15, 46], [19, 55], [30, 48]], VIOL.b);
      s.fillPoly([[36, 43], [49, 46], [45, 55], [34, 48]], VIOL.b);
      s.line(19, 54, 28, 47, PINKW.b);
      s.line(45, 54, 36, 47, PINKW.b);
      // aurora shimmer
      s.set(12, 19, '#ffffff'); s.set(52, 19, '#ffffff');
      s.set(16, 26, TEALW.h); s.set(48, 26, TEALW.h);
      s.set(13, 31, PINKW.l); s.set(51, 31, PINKW.l);
      s.dither(9, 21, 8, 4, VIOL.l, 0);
      s.dither(47, 21, 8, 4, VIOL.l, 1);
      // fuzzy body
      s.ball(32, 39, 4.5, 10, FUZZ);
      s.ball(32, 30, 6, 4, FUZZ, { flat: true }); // fluff collar
      // banded abdomen tip
      s.line(30, 46, 34, 46, TEALW.d);
      s.line(31, 49, 33, 49, VIOL.d);
      // head
      s.ball(32, 25, 5, 4.5, FUZZ);
      K.eye(s, 29, 25, 2, '#5848a0');
      K.eye(s, 35, 25, 2, '#5848a0');
      // feathered antennae
      s.line(30, 21, 26, 12, FUZZ.d);
      s.line(34, 21, 38, 12, FUZZ.d);
      for (let i = 0; i < 4; i++) {
        s.set(25 - i, 14 + i * 2, FUZZ.b); s.set(27 - i, 13 + i * 2, FUZZ.l);
        s.set(39 + i, 14 + i * 2, FUZZ.b); s.set(37 + i, 13 + i * 2, FUZZ.l);
      }
    },
    drawBack(s) {
      // Rear: wings from above — darker band order, fuzzy thorax, no face.
      s.fillPoly([[28, 31], [7, 15], [4, 22], [28, 35]], TEALW.b);
      s.fillPoly([[28, 35], [4, 22], [6, 29], [28, 39]], VIOL.b);
      s.fillPoly([[28, 39], [6, 29], [10, 36], [28, 43]], PINKW.b);
      s.fillPoly([[36, 31], [57, 15], [60, 22], [36, 35]], TEALW.b);
      s.fillPoly([[36, 35], [60, 22], [58, 29], [36, 39]], VIOL.b);
      s.fillPoly([[36, 39], [58, 29], [54, 36], [36, 43]], PINKW.b);
      s.fillPoly([[28, 43], [15, 46], [19, 55], [30, 48]], VIOL.b);
      s.fillPoly([[36, 43], [49, 46], [45, 55], [34, 48]], VIOL.b);
      // wing-vein shading seen from the back
      s.line(8, 17, 27, 33, TEALW.d); s.line(56, 17, 37, 33, TEALW.d);
      s.line(7, 25, 27, 37, VIOL.d); s.line(57, 25, 37, 37, VIOL.d);
      s.dither(10, 22, 8, 5, VIOL.d, 1); s.dither(46, 22, 8, 5, VIOL.d, 0);
      s.set(14, 20, TEALW.l); s.set(50, 20, TEALW.l);
      // fuzzy back of thorax and abdomen
      s.ball(32, 38, 5, 10, FUZZ, { lx: 0, ly: -0.5 });
      s.ball(32, 30, 6.5, 4, FUZZ, { flat: true });
      s.dither(29, 27, 7, 5, FUZZ.d, 0);
      s.line(30, 45, 34, 45, TEALW.d);
      s.line(31, 48, 33, 48, VIOL.d);
      // back of head + antennae
      s.ball(32, 24, 5, 4.5, FUZZ, { lx: 0, ly: -0.5 });
      s.ball(32, 23, 3.5, 2.5, FUZZ, { flat: true });
      s.line(30, 20, 26, 11, FUZZ.d);
      s.line(34, 20, 38, 11, FUZZ.d);
      for (let i = 0; i < 4; i++) {
        s.set(25 - i, 13 + i * 2, FUZZ.b);
        s.set(39 + i, 13 + i * 2, FUZZ.b);
      }
    },
  });

  // ============ BROCKLE (standalone badger) ============
  const BADG = Px.ramp('#8a7a6a');
  const DKST = Px.ramp('#3a3540');

  Dex.add({
    id: 21, key: 'brockle', name: 'Brockle', types: ['Dark', 'Normal'],
    base: { hp: 85, atk: 105, def: 80, spa: 45, spd: 65, spe: 65 },
    ability: 'grit', catchRate: 75, expYield: 185, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'leer'], [6, 'cheap_shot'], [11, 'fury_swipes'], [16, 'bite'],
      [21, 'snarl'], [26, 'night_slash'], [31, 'howl'], [36, 'crunch'], [42, 'body_slam'],
      [48, 'shadow_maw']],
    tms: ['tm07', 'tm08', 'tm15', 'tm17', 'tm18', 'tm21', 'tm23', 'tm25', 'hm01', 'hm04', 'hm06'],
    dex: { species: 'Sour Badger', h: '0.9m', w: '36.0kg',
      entry: 'It has never once been in a good mood. Birchwick loggers leave the day\'s first felled trunk across its den as rent, or lose their boots.' },
    cry: { base: 260, sweep: 0.5, wave: 'sawtooth', dur: 0.55, vib: 10, grit: 0.4 },
    draw(s) {
      // stocky legs
      s.limb(26, 50, 25, 56, 3, 2, BADG);
      s.limb(38, 50, 39, 56, 3, 2, BADG);
      // hunched body
      s.ball(32, 42, 11, 12, BADG);
      // dark belly
      s.ball(32, 47, 7, 6, DKST, { flat: true });
      // scruffy shoulder fur
      K.horn(s, 22, 34, -0.9, -0.4, 4, 2, BADG);
      K.horn(s, 42, 34, 0.9, -0.4, 4, 2, BADG);
      s.dither(25, 38, 14, 4, BADG.d, 0);
      // burly arms with long claws
      s.limb(23, 37, 18, 46, 3, 3, BADG);
      s.limb(41, 37, 46, 46, 3, 3, BADG);
      K.claws(s, 15, 49, 3, '#e8e4da'); K.claws(s, 16, 50, 3, '#c8c4ba');
      K.claws(s, 44, 49, 3, '#e8e4da'); K.claws(s, 43, 50, 3, '#c8c4ba');
      // white head
      s.ball(32, 26, 9, 8, WHT);
      // small round ears
      s.ball(25, 19, 2.5, 2, BADG); s.ball(39, 19, 2.5, 2, BADG);
      // dark face-stripes through the eyes
      s.stroke(28, 19, 27, 32, 1, DKST);
      s.stroke(36, 19, 37, 32, 1, DKST);
      // cranky eyes inside the stripes
      K.eye(s, 27, 26, 2, '#c04030');
      K.eye(s, 37, 26, 2, '#c04030');
      K.brow(s, 27, 23, 2); K.brow(s, 38, 23, 2);
      // muzzle: big nose, frown, fangs
      s.set(32, 30, '#1a1418'); s.set(31, 30, '#1a1418'); s.set(32, 29, '#3a3540');
      s.line(30, 33, 34, 33, '#1a1418');
      K.fang(s, 29, 33); K.fang(s, 33, 33);
      // cheek fur spikes
      s.tri(23, 28, 23, 31, 20, 30, WHT.b);
      s.tri(41, 28, 41, 31, 44, 30, WHT.b);
    },
    drawBack(s) {
      // Rear: grizzled dark mantle with pale spine stripe, claws at sides.
      s.limb(26, 50, 25, 57, 3, 2, BADG);
      s.limb(38, 50, 39, 57, 3, 2, BADG);
      s.ball(32, 41, 12, 13, BADG, { lx: 0, ly: -0.5 });
      // dark mantle over the back
      s.ball(32, 40, 9, 10, DKST, { flat: true });
      s.dither(24, 33, 17, 15, BADG.d, 1);
      // pale stripe down the spine
      s.line(32, 31, 32, 50, WHT.d); s.line(33, 33, 33, 48, BADG.l);
      // arms + claws peeking at the sides
      s.limb(22, 37, 18, 46, 3, 3, BADG);
      s.limb(42, 37, 46, 46, 3, 3, BADG);
      K.claws(s, 15, 48, 2, '#e8e4da'); K.claws(s, 46, 48, 2, '#e8e4da');
      // stubby tail
      s.ball(32, 52, 3, 3, DKST, { flat: true });
      // back of white head: stripes converge at the crown, no face
      s.ball(32, 25, 9, 8, WHT, { lx: 0, ly: -0.5 });
      s.stroke(29, 18, 27, 30, 1, DKST);
      s.stroke(35, 18, 37, 30, 1, DKST);
      s.line(32, 17, 32, 21, DKST.b);
      s.ball(25, 18, 2.5, 2, BADG); s.ball(39, 18, 2.5, 2, BADG);
      s.tri(23, 27, 23, 30, 20, 29, WHT.b);
      s.tri(41, 27, 41, 30, 44, 29, WHT.b);
    },
  });

  // ============ PINELING LINE (pinecone boars) ============
  const CONE = Px.ramp('#9a6a3c');
  const CONED = Px.ramp('#5e3f22');
  const PIGP = Px.ramp('#e8a888');

  Dex.add({
    id: 22, key: 'pineling', name: 'Pineling', types: ['Grass', 'Bug'],
    base: { hp: 50, atk: 55, def: 65, spa: 35, spd: 35, spe: 20 },
    ability: 'thorn_coat', catchRate: 220, expYield: 108, growth: 'slow', gender: 50,
    evolve: { to: 'conifurze', level: 20 },
    learn: [[1, 'tackle'], [1, 'harden'], [5, 'nibble'], [9, 'razor_leaf'], [13, 'siphon_seed'],
      [17, 'twin_sting'], [22, 'seed_bomb'], [27, 'sap_bite']],
    tms: ['tm17', 'tm19', 'tm21', 'tm24', 'hm01'],
    dex: { species: 'Pinecone Hog', h: '0.4m', w: '6.6kg',
      entry: 'It is exactly the size and shape of a Whisperwood pinecone, and naps in the litterfall. Squirrels that grab one never do it twice.' },
    cry: { base: 560, sweep: 0.65, wave: 'square', dur: 0.35, vib: 16 },
    draw(s) {
      // pinecone body
      s.ball(34, 45, 11, 10, CONE);
      // overlapping cone scales (staggered rows)
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          const x = 28 + i * 5 + (j % 2) * 3, y = 39 + j * 4;
          if (x > 45 - j || x < 26) continue;
          s.ball(x, y, 2, 1.5, CONED, { flat: true });
          s.set(x, y - 1, CONE.l);
        }
      }
      s.set(44, 44, CONED.b); s.set(43, 48, CONED.b); s.set(41, 52, CONED.d);
      // pale hoglet face
      s.ball(24, 43, 6, 5.5, CONE);
      s.ball(23, 44, 4.5, 4, CREAM, { flat: true });
      // pink snout
      s.ball(21, 46, 2.5, 2, PIGP, { flat: true });
      s.set(20, 46, CONED.o); s.set(22, 46, CONED.o);
      // eyes
      K.eye(s, 21, 41, 1, '#3a2a20');
      K.eye(s, 26, 41, 1, '#3a2a20');
      K.cheek(s, 18, 44, '#f0c0a0');
      // leafy little ears
      s.tri(25, 37, 28, 36, 27, 39, MOSS.b);
      s.set(26, 37, MOSS.l);
      // sprout on top
      s.line(31, 36, 32, 32, MOSSD.d);
      K.leaf(s, 32, 31, 4, MOSS);
      // stubby legs
      s.ball(25, 54, 2.5, 2, CONE, { flat: true });
      s.ball(31, 55, 2.5, 2, CONE, { flat: true });
      s.ball(38, 55, 2.5, 2, CONE, { flat: true });
      s.ball(43, 53, 2.5, 2, CONE, { flat: true });
    },
    drawBack(s) {
      // Rear: the cone butt — a rosette of scales, sprout above, no face.
      s.ball(32, 44, 11, 10.5, CONE, { lx: 0, ly: -0.5 });
      // rosette: rings of scales around the center
      s.ball(32, 45, 2.5, 2, CONED, { flat: true });
      const ring = [[32, 39], [27, 41], [37, 41], [25, 46], [39, 46], [27, 50], [37, 50], [32, 52]];
      for (const [x, y] of ring) { s.ball(x, y, 2, 1.5, CONED, { flat: true }); s.set(x, y - 1, CONE.l); }
      const ring2 = [[32, 35], [24, 38], [40, 38], [22, 44], [42, 44], [24, 50], [40, 50]];
      for (const [x, y] of ring2) s.set(x, y, CONED.b);
      // ear tips + sprout from behind
      s.tri(24, 34, 27, 33, 26, 36, MOSSD.b);
      s.tri(40, 34, 37, 33, 38, 36, MOSSD.b);
      s.line(32, 34, 32, 30, MOSSD.d);
      K.leaf(s, 32, 29, 4, MOSSD);
      // feet peeking
      s.ball(25, 55, 2.5, 1.5, CONE, { flat: true });
      s.ball(39, 55, 2.5, 1.5, CONE, { flat: true });
    },
  });

  Dex.add({
    id: 23, key: 'conifurze', name: 'Conifurze', types: ['Grass', 'Bug'],
    base: { hp: 80, atk: 105, def: 95, spa: 45, spd: 70, spe: 70 },
    ability: 'thorn_coat', catchRate: 60, expYield: 194, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'nibble'], [9, 'razor_leaf'], [13, 'siphon_seed'],
      [19, 'seed_bomb'], [24, 'sap_bite'], [29, 'cross_scythe'], [35, 'numb_spore'], [41, 'timber_crash'],
      [47, 'great_horn']],
    tms: ['tm07', 'tm15', 'tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'hm01', 'hm04', 'hm06'],
    dex: { species: 'Bristle Boar', h: '1.3m', w: '96.0kg',
      entry: 'Its cone-scale armor turns axes, and its needle mane drips stinging resin. When it charges, the whole taiga steps aside.' },
    cry: { base: 210, sweep: 0.48, wave: 'sawtooth', dur: 0.65, vib: 8, grit: 0.4, sub: true },
    draw(s) {
      // needle mane along the crest (behind the body)
      K.horn(s, 20, 32, -0.5, -0.9, 7, 2, MOSSD);
      K.horn(s, 26, 28, -0.2, -1, 8, 2, MOSSD);
      K.horn(s, 32, 26, 0, -1, 9, 2, MOSSD);
      K.horn(s, 38, 27, 0.2, -1, 8, 2, MOSSD);
      K.horn(s, 44, 29, 0.4, -0.9, 7, 2, MOSSD);
      // legs
      s.limb(23, 50, 21, 57, 3, 2, CONE); s.set(21, 58, CONED.o);
      s.limb(30, 51, 29, 58, 3, 2, CONE); s.set(29, 59, CONED.o);
      s.limb(42, 50, 44, 57, 3, 2, CONE); s.set(44, 58, CONED.o);
      s.limb(48, 49, 50, 56, 3, 2, CONE); s.set(50, 57, CONED.o);
      // bulky body
      s.ball(35, 40, 15, 11, CONE);
      // cone-scale armor rows over the back
      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 5; i++) {
          const x = 26 + i * 5 + (j % 2) * 2, y = 33 + j * 4;
          if (x > 48) continue;
          s.ball(x, y, 2.5, 2, CONED, { flat: true });
          s.set(x, y - 1, CONE.l);
        }
      }
      // belly bristle fringe
      s.dither(26, 47, 18, 3, CONED.b, 0);
      // head lowered at left
      s.ball(21, 39, 8, 7, CONE);
      s.ball(16, 42, 4, 3, CREAM, { flat: true });
      s.ball(14, 43, 2.5, 2, PIGP, { flat: true });
      s.set(13, 43, CONED.o); s.set(15, 43, CONED.o);
      // white tusks curving up
      s.tri(11, 41, 15, 41, 12, 36, '#f0ead0');
      s.tri(18, 43, 22, 43, 20, 38, '#f0ead0');
      // fierce eyes
      K.eye(s, 19, 36, 2, '#d87020');
      K.brow(s, 19, 33, 2);
      K.eye(s, 25, 35, 2, '#d87020');
      K.brow(s, 26, 32, 2);
      // leafy ears
      s.tri(26, 31, 30, 29, 29, 33, MOSS.b);
      // pine-tassel tail
      s.line(49, 37, 53, 33, CONE.d);
      K.leaf(s, 53, 32, 4, MOSSD);
      s.set(54, 30, MOSS.b);
    },
    drawBack(s) {
      // Rear: armored rump rosette, mane ridge running away, tassel tail.
      // mane ridge down the spine (seen end-on, rising over the head)
      K.horn(s, 26, 30, -0.4, -1, 7, 2, MOSSD);
      K.horn(s, 32, 27, 0, -1, 8, 2, MOSSD);
      K.horn(s, 38, 30, 0.4, -1, 7, 2, MOSSD);
      s.limb(24, 50, 22, 58, 3.5, 2, CONE);
      s.limb(40, 50, 42, 58, 3.5, 2, CONE);
      // big rump
      s.ball(32, 41, 15, 12, CONE, { lx: 0, ly: -0.5 });
      // scale rosette on the rump
      s.ball(32, 43, 3, 2, CONED, { flat: true });
      const r1 = [[32, 37], [26, 39], [38, 39], [24, 44], [40, 44], [27, 48], [37, 48], [32, 50]];
      for (const [x, y] of r1) { s.ball(x, y, 2.5, 2, CONED, { flat: true }); s.set(x, y - 1, CONE.l); }
      const r2 = [[32, 33], [22, 36], [42, 36], [20, 43], [44, 43], [23, 49], [41, 49]];
      for (const [x, y] of r2) s.set(x, y, CONED.b);
      // head beyond: ear + tusk tips peeking over the shoulders
      s.ball(32, 29, 8, 4, CONE, { flat: true });
      s.tri(24, 27, 28, 25, 27, 29, MOSSD.b);
      s.tri(40, 27, 36, 25, 37, 29, MOSSD.b);
      s.set(22, 30, '#f0ead0'); s.set(23, 29, '#f0ead0');
      s.set(42, 30, '#f0ead0'); s.set(41, 29, '#f0ead0');
      // tassel tail toward camera
      s.line(32, 51, 32, 55, CONE.d);
      K.leaf(s, 33, 55, 4, MOSS);
    },
  });

  // ============ SPARKIT LINE (static squirrels) ============
  const VOLT = Px.ramp('#f0c838');
  const RUST = Px.ramp('#c07830');

  Dex.add({
    id: 24, key: 'sparkit', name: 'Sparkit', types: ['Electric'],
    base: { hp: 40, atk: 50, def: 35, spa: 60, spd: 40, spe: 85 },
    ability: 'static_wool', catchRate: 190, expYield: 112, growth: 'medfast', gender: 50,
    evolve: { to: 'voltuft', stone: 'storm_stone' },
    learn: [[1, 'scratch'], [1, 'growl'], [5, 'spark_nip'], [9, 'quick_jab'], [13, 'static_touch'],
      [17, 'spark_tackle'], [22, 'static_snare'], [27, 'swift_stars'], [32, 'storm_bolt']],
    tms: ['tm01', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Static Kit', h: '0.4m', w: '3.8kg',
      entry: 'Its tail frays like a snapped rope and spits sparks when it sneezes. Petting one is a rite of passage on the Route meadows.' },
    cry: { base: 840, sweep: 1.1, wave: 'square', dur: 0.32, vib: 28, chirps: 1 },
    draw(s) {
      // frayed-wire tail rising behind
      s.stroke(38, 50, 45, 43, 3, RUST);
      s.stroke(45, 43, 44, 33, 3.5, RUST);
      s.dither(42, 34, 6, 12, RUST.l, 0);
      // spark fray at the tip
      s.ball(44, 29, 3, 3, VOLT, { flat: true });
      s.line(42, 26, 46, 30, VOLT.l);
      s.line(46, 26, 42, 30, VOLT.l);
      s.set(44, 24, '#ffffff'); s.set(48, 27, '#ffffff'); s.set(40, 27, VOLT.h);
      // haunches
      s.ball(30, 48, 9, 7, VOLT);
      // chest
      s.ball(29, 41, 7, 8, VOLT);
      s.ball(29, 45, 4, 5, CREAM, { flat: true });
      // chest bolt marking
      s.set(29, 42, RUST.b); s.set(30, 43, RUST.d); s.set(29, 44, RUST.b);
      // head
      s.ball(28, 31, 7, 6, VOLT);
      // rusty ear tufts
      K.horn(s, 23, 26, -0.4, -1, 5, 1.5, RUST);
      K.horn(s, 33, 26, 0.4, -1, 5, 1.5, RUST);
      // face
      K.eye(s, 25, 31, 2, '#28303c');
      K.eye(s, 32, 31, 2, '#28303c');
      s.set(28, 34, '#3a2a20');
      K.smile(s, 28, 35, 1);
      K.cheek(s, 21, 33, '#fff8a0'); K.cheek(s, 35, 33, '#fff8a0');
      // little paws
      s.limb(25, 44, 23, 47, 1.5, 1, VOLT);
      s.limb(33, 44, 35, 47, 1.5, 1, VOLT);
      // feet
      s.ball(25, 55, 3.5, 2, VOLT, { flat: true });
      s.ball(34, 55, 3.5, 2, VOLT, { flat: true });
    },
    drawBack(s) {
      // Rear: rusty back stripe, tail curling toward camera, ear tufts.
      s.ball(30, 45, 9, 10, VOLT, { lx: 0, ly: -0.5 });
      s.ball(30, 43, 4, 8, RUST, { flat: true });
      s.dither(25, 40, 11, 9, VOLT.d, 1);
      // back of head
      s.ball(29, 31, 7, 6, VOLT, { lx: 0, ly: -0.5 });
      s.ball(29, 30, 5, 3.5, RUST, { flat: true });
      K.horn(s, 24, 26, -0.4, -1, 5, 1.5, RUST);
      K.horn(s, 34, 26, 0.4, -1, 5, 1.5, RUST);
      // big tail sweeping right, toward camera
      s.stroke(36, 50, 46, 44, 3.5, RUST);
      s.stroke(46, 44, 45, 32, 4, RUST);
      s.dither(42, 34, 7, 14, RUST.l, 1);
      s.ball(45, 27, 3.5, 3.5, VOLT, { flat: true });
      s.line(43, 24, 47, 29, VOLT.l);
      s.line(48, 24, 43, 29, VOLT.l);
      s.set(45, 22, '#ffffff'); s.set(49, 26, '#ffffff');
      // feet heels
      s.ball(25, 55, 3.5, 2, VOLT, { flat: true });
      s.ball(35, 55, 3.5, 2, VOLT, { flat: true });
    },
  });

  Dex.add({
    id: 25, key: 'voltuft', name: 'Voltuft', types: ['Electric'],
    base: { hp: 65, atk: 75, def: 60, spa: 110, spd: 65, spe: 95 },
    ability: 'static_wool', catchRate: 60, expYield: 196, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'growl'], [1, 'spark_nip'], [1, 'static_touch'], [13, 'spark_tackle'],
      [18, 'static_snare'], [24, 'swift_stars'], [30, 'storm_bolt'], [37, 'quickening'], [44, 'sky_fury'],
      [51, 'volt_crash']],
    tms: ['tm01', 'tm12', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Storm Squirrel', h: '1.0m', w: '24.5kg',
      entry: 'The charge in its tail could light Birchwick for a week. Before a thunderstorm, whole drays of them climb the tallest pines to drink the sky.' },
    cry: { base: 380, sweep: 0.95, wave: 'sawtooth', dur: 0.5, vib: 20, grit: 0.3 },
    draw(s) {
      // colossal tail arcing from behind up over the head
      s.stroke(40, 48, 51, 38, 4, RUST);
      s.stroke(51, 38, 49, 20, 5, RUST);
      s.stroke(49, 20, 37, 10, 5, RUST);
      s.dither(44, 14, 10, 20, RUST.l, 0);
      s.line(50, 34, 48, 22, RUST.d);
      // crackling tail tip above the head
      s.ball(31, 9, 4, 3.5, VOLT, { flat: true });
      s.line(27, 6, 34, 12, VOLT.l);
      s.line(35, 5, 28, 12, VOLT.l);
      s.set(25, 8, '#ffffff'); s.set(37, 7, '#ffffff'); s.set(31, 4, '#ffffff');
      // arcing bolts off the tail
      s.line(54, 28, 57, 24, VOLT.b); s.set(58, 22, '#ffffff');
      s.line(45, 15, 42, 18, VOLT.h);
      // legs
      s.limb(26, 50, 24, 57, 3, 2, VOLT);
      s.limb(38, 50, 40, 57, 3, 2, VOLT);
      // body
      s.ball(32, 42, 10, 11, VOLT);
      s.ball(32, 46, 6, 6, CREAM, { flat: true });
      // zigzag flank markings
      s.line(24, 40, 27, 42, RUST.b); s.line(27, 42, 24, 44, RUST.b);
      s.line(40, 40, 37, 42, RUST.b); s.line(37, 42, 40, 44, RUST.b);
      // arms
      s.limb(25, 38, 21, 44, 2.5, 2, VOLT);
      s.limb(39, 38, 43, 44, 2.5, 2, VOLT);
      // head
      s.ball(32, 26, 8, 7, VOLT);
      // long ear tufts
      K.horn(s, 26, 20, -0.4, -1, 7, 2, RUST);
      K.horn(s, 38, 20, 0.4, -1, 7, 2, RUST);
      s.set(23, 14, VOLT.h); s.set(41, 14, VOLT.h);
      // fierce face
      K.eye(s, 28, 25, 2, '#4878c8');
      K.eye(s, 36, 25, 2, '#4878c8');
      K.brow(s, 28, 22, 2); K.brow(s, 37, 22, 2);
      s.set(32, 28, '#3a2a20');
      K.smile(s, 32, 30, 1);
      K.fang(s, 30, 30);
      K.cheek(s, 24, 28, '#fff8a0'); K.cheek(s, 39, 28, '#fff8a0');
      // static motes
      s.set(15, 32, VOLT.h); s.set(12, 28, '#ffffff');
    },
    drawBack(s) {
      // Rear: zigzag back markings, tail hugging the right side toward camera.
      s.limb(26, 50, 24, 58, 3, 2, VOLT);
      s.limb(38, 50, 40, 58, 3, 2, VOLT);
      s.ball(32, 41, 10.5, 12, VOLT, { lx: 0, ly: -0.5 });
      // rust back stripe + zigzags
      s.ball(32, 39, 4.5, 9, RUST, { flat: true });
      s.line(24, 38, 27, 40, RUST.b); s.line(27, 40, 24, 42, RUST.b);
      s.line(40, 38, 37, 40, RUST.b); s.line(37, 40, 40, 42, RUST.b);
      s.dither(27, 34, 11, 12, VOLT.d, 1);
      // back of head + tufts
      s.ball(32, 26, 8, 7, VOLT, { lx: 0, ly: -0.5 });
      s.ball(32, 25, 6, 4, RUST, { flat: true });
      K.horn(s, 26, 20, -0.4, -1, 7, 2, RUST);
      K.horn(s, 38, 20, 0.4, -1, 7, 2, RUST);
      // giant tail on the right, closer to camera (bulkier)
      s.stroke(38, 50, 52, 40, 5, RUST);
      s.stroke(52, 40, 50, 18, 6, RUST);
      s.stroke(50, 18, 40, 9, 5, RUST);
      s.dither(45, 13, 11, 26, RUST.l, 1);
      s.ball(35, 8, 4.5, 4, VOLT, { flat: true });
      s.line(31, 5, 38, 11, VOLT.l);
      s.line(39, 4, 32, 11, VOLT.l);
      s.set(29, 7, '#ffffff'); s.set(41, 6, '#ffffff');
      s.line(55, 30, 58, 26, VOLT.b); s.set(59, 24, '#ffffff');
    },
  });

  // ============ CAIRNLING LINE (standing stones) ============
  const STONE = Px.ramp('#9aa2ac');
  const STONED = Px.ramp('#5e6570');

  Dex.add({
    id: 26, key: 'cairnling', name: 'Cairnling', types: ['Rock'],
    base: { hp: 55, atk: 50, def: 85, spa: 30, spd: 40, spe: 20 },
    ability: 'bedrock', catchRate: 200, expYield: 117, growth: 'slow', gender: -1,
    evolve: { to: 'dolmenor', level: 25 },
    learn: [[1, 'tackle'], [1, 'harden'], [6, 'rock_throw'], [10, 'pebble_volley'], [14, 'rock_tomb'],
      [19, 'sand_veil'], [24, 'rock_slide'], [29, 'stone_polish'], [34, 'relic_power']],
    tms: ['tm07', 'tm14', 'tm15', 'tm17', 'tm21', 'hm04', 'hm06'],
    dex: { species: 'Waystone', h: '0.7m', w: '58.0kg',
      entry: 'Travelers stack trail-cairns to mark the way through the taiga; some of the cairns stack themselves. It shuffles a step whenever no one watches.' },
    cry: { base: 480, sweep: 0.42, wave: 'square', dur: 0.4, vib: 5 },
    draw(s) {
      // bottom stone (widest)
      s.ball(32, 51, 11, 6, STONE);
      // middle stone, slightly offset
      s.ball(31, 42, 8, 5.5, STONE, { lx: -0.4, ly: -0.4 });
      // top stone
      s.ball(33, 33, 6, 4.5, STONE);
      // moss cap draped on the top stone
      s.ball(33, 29, 5.5, 2.5, MOSS, { flat: true });
      s.set(29, 31, MOSS.d); s.set(37, 31, MOSS.d); s.set(31, 30, MOSS.l);
      // shadowed gap + peeking eyes between top and middle stones
      s.rect(28, 37, 10, 2, '#26222b');
      s.fillCircle(30, 38, 1, '#f8e048'); s.set(30, 37, '#ffffff');
      s.fillCircle(36, 38, 1, '#f8e048'); s.set(36, 37, '#ffffff');
      // cracks and pocks
      s.line(26, 50, 29, 51, STONED.d);
      s.line(36, 52, 39, 51, STONED.d);
      s.set(27, 42, STONED.b); s.set(35, 43, STONED.d);
      s.set(35, 33, STONED.b); s.set(30, 34, STONED.d);
      // runic scratch on the base stone
      s.set(31, 49, STONED.o); s.set(32, 50, STONED.o); s.set(33, 49, STONED.o);
      // lichen dots
      s.set(24, 50, MOSS.d); s.set(40, 52, MOSS.d);
      // hovering pebble hands
      s.ball(18, 44, 2, 2, STONE, { flat: true });
      s.ball(46, 44, 2, 2, STONE, { flat: true });
      s.dither(24, 54, 16, 2, STONED.b, 0);
    },
    drawBack(s) {
      // Rear: the same stack, mossier, no eyes — just weathered stone.
      s.ball(32, 51, 11.5, 6, STONE, { lx: 0, ly: -0.5 });
      s.ball(33, 42, 8, 5.5, STONE, { lx: 0, ly: -0.5 });
      s.ball(31, 33, 6, 4.5, STONE, { lx: 0, ly: -0.5 });
      // moss cap spills further down the back
      s.ball(31, 29, 6, 3, MOSS, { flat: true });
      s.line(27, 31, 26, 33, MOSS.d); s.line(35, 31, 36, 34, MOSS.d);
      s.set(31, 34, MOSS.b);
      // gap shadow (no eyes from behind)
      s.rect(28, 37, 9, 2, '#26222b');
      // heavy weathering
      s.dither(26, 48, 13, 6, STONED.b, 1);
      s.line(29, 41, 33, 43, STONED.d);
      s.line(28, 51, 32, 52, STONED.d);
      s.set(36, 42, STONED.b); s.set(34, 33, STONED.d);
      // lichen
      s.set(25, 44, MOSS.d); s.set(40, 50, MOSS.d); s.set(37, 34, MOSS.d);
      // pebble hands peeking
      s.ball(19, 44, 2, 2, STONE, { flat: true });
      s.ball(45, 44, 2, 2, STONE, { flat: true });
    },
  });

  Dex.add({
    id: 27, key: 'dolmenor', name: 'Dolmenor', types: ['Rock', 'Ground'],
    base: { hp: 90, atk: 110, def: 120, spa: 45, spd: 75, spe: 55 },
    ability: 'bedrock', catchRate: 50, expYield: 206, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'rock_throw'], [10, 'pebble_volley'], [14, 'rock_tomb'],
      [20, 'mud_shot'], [26, 'rock_slide'], [31, 'bulldoze'], [37, 'burrow_strike'], [43, 'stone_spike'],
      [49, 'relic_power'], [55, 'earthshatter']],
    tms: ['tm07', 'tm08', 'tm14', 'tm15', 'tm17', 'tm21', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Dolmen Golem', h: '2.4m', w: '520.0kg',
      entry: 'The oldest waystones on the moor rise on pillar legs when the fog is thick. Its capstone shoulders bear runes no living skald can read.' },
    cry: { base: 150, sweep: 0.4, wave: 'square', dur: 0.8, vib: 4, sub: true },
    draw(s) {
      // hanging stone arms (behind the capstone ends)
      s.limb(14, 31, 11, 44, 3, 3, STONED);
      s.limb(50, 31, 53, 44, 3, 3, STONED);
      s.ball(11, 47, 3.5, 3, STONE, { lx: -0.4, ly: -0.4 });
      s.ball(53, 47, 3.5, 3, STONE, { lx: -0.4, ly: -0.4 });
      // pillar legs
      s.fillPoly([[19, 34], [29, 34], [28, 56], [20, 56]], STONE.b);
      s.line(20, 35, 21, 55, STONE.l);
      s.line(28, 35, 27, 55, STONE.d);
      s.fillPoly([[35, 34], [45, 34], [44, 56], [36, 56]], STONE.b);
      s.line(36, 35, 37, 55, STONE.l);
      s.line(44, 35, 43, 55, STONE.d);
      // base stones underfoot
      s.ball(24, 56, 6, 2.5, STONED, { flat: true });
      s.ball(40, 56, 6, 2.5, STONED, { flat: true });
      // torso core between the pillars, with a glowing rune heart
      s.ball(32, 36, 8, 7, STONED);
      s.set(32, 35, GLOWT.b); s.set(31, 36, GLOWT.d); s.set(33, 36, GLOWT.d); s.set(32, 37, GLOWT.b); s.set(32, 34, GLOWT.l);
      // capstone shoulders
      s.fillPoly([[10, 25], [54, 25], [52, 33], [12, 33]], STONE.b);
      s.line(11, 26, 53, 26, STONE.l);
      s.line(12, 32, 52, 32, STONE.d);
      s.dither(14, 28, 36, 3, STONE.d, 0);
      // runic carvings on the capstone
      s.set(17, 29, GLOWT.b); s.set(18, 30, GLOWT.d);
      s.set(25, 28, GLOWT.b); s.set(25, 30, GLOWT.d);
      s.set(39, 28, GLOWT.b); s.set(39, 30, GLOWT.d);
      s.set(46, 29, GLOWT.b); s.set(47, 30, GLOWT.d);
      // pillar rune marks
      s.set(23, 42, GLOWT.d); s.set(24, 46, GLOWT.d);
      s.set(41, 42, GLOWT.d); s.set(40, 46, GLOWT.d);
      // cracks
      s.line(21, 50, 24, 52, STONED.d);
      s.line(42, 48, 40, 51, STONED.d);
      // moss on the capstone and feet
      s.ball(14, 25, 4, 2, MOSS, { flat: true });
      s.set(19, 25, MOSS.d); s.set(11, 27, MOSS.b);
      s.set(44, 25, MOSS.d);
      s.set(22, 55, MOSS.d); s.set(43, 55, MOSS.d);
      // dome head above the capstone
      s.ball(32, 20, 6, 5.5, STONE);
      s.ball(32, 16, 4, 2, MOSS, { flat: true });
      // deep glowing eyes, stoic slit mouth
      s.fillCircle(29, 20, 1, '#7fe0b8'); s.set(29, 19, '#d8fff0');
      s.fillCircle(35, 20, 1, '#7fe0b8'); s.set(35, 19, '#d8fff0');
      s.line(31, 23, 33, 23, STONED.o);
    },
    drawBack(s) {
      // Rear: rune ring on the back slab, mossy capstone spine, no face.
      s.limb(14, 31, 11, 44, 3, 3, STONED);
      s.limb(50, 31, 53, 44, 3, 3, STONED);
      s.ball(11, 47, 3.5, 3, STONE, { lx: 0, ly: -0.5 });
      s.ball(53, 47, 3.5, 3, STONE, { lx: 0, ly: -0.5 });
      // pillar legs
      s.fillPoly([[19, 34], [29, 34], [28, 57], [20, 57]], STONE.b);
      s.line(20, 35, 21, 56, STONE.l);
      s.line(28, 35, 27, 56, STONE.d);
      s.fillPoly([[35, 34], [45, 34], [44, 57], [36, 57]], STONE.b);
      s.line(36, 35, 37, 56, STONE.l);
      s.line(44, 35, 43, 56, STONE.d);
      // back slab between the pillars with a rune ring
      s.ball(32, 38, 9, 8, STONED, { lx: 0, ly: -0.5 });
      s.set(32, 34, GLOWT.b); s.set(29, 36, GLOWT.d); s.set(35, 36, GLOWT.d);
      s.set(28, 39, GLOWT.b); s.set(36, 39, GLOWT.b);
      s.set(30, 42, GLOWT.d); s.set(34, 42, GLOWT.d); s.set(32, 43, GLOWT.b);
      // capstone from behind, mossier
      s.fillPoly([[10, 25], [54, 25], [52, 33], [12, 33]], STONE.b);
      s.line(11, 26, 53, 26, STONE.l);
      s.line(12, 32, 52, 32, STONE.d);
      s.dither(14, 28, 36, 3, STONE.d, 1);
      s.ball(17, 26, 5, 2, MOSS, { flat: true });
      s.ball(44, 25, 5, 2, MOSS, { flat: true });
      s.line(24, 25, 30, 25, MOSS.d);
      // weathering
      s.line(22, 48, 25, 51, STONED.d);
      s.line(41, 46, 39, 50, STONED.d);
      s.set(23, 40, STONED.d); s.set(42, 38, STONED.d);
      // back of dome head under a moss cap
      s.ball(32, 20, 6, 5.5, STONE, { lx: 0, ly: -0.5 });
      s.ball(32, 17, 5, 2.5, MOSS, { flat: true });
      s.set(32, 21, STONED.b); s.set(31, 22, STONED.d);
    },
  });
})();
