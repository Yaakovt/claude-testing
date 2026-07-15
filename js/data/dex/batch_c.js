'use strict';
/** Batch C (dex #46-#63): deep forest, caves & the Irondeep mines. */
(() => {
  const K = SpriteKit;

  // ============ FAIRY LINE: Glimmouse -> Sylphund ============
  const WHT = Px.ramp('#e9e4f0');
  const GLD = Px.ramp('#f4c84e');
  const RIB = Px.ramp('#e8a0c8');
  const INK = '#1a1418';

  Dex.add({
    id: 46, key: 'glimmouse', name: 'Glimmouse', types: ['Fairy'],
    base: { hp: 40, atk: 30, def: 35, spa: 55, spd: 50, spe: 50 },
    ability: 'slippery', catchRate: 190, expYield: 108, growth: 'fast', gender: 50,
    evolve: { to: 'sylphund', friendship: 160 },
    learn: [[1, 'scratch'], [1, 'growl'], [4, 'fae_wind'], [8, 'quick_jab'], [12, 'glimmer_kiss'],
      [16, 'charm'], [20, 'flash'], [25, 'prism_flare'], [30, 'starlight_heal']],
    tms: ['tm09', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Lantern Mouse', h: '0.3m', w: '2.1kg',
      entry: 'Miners of Irondeep follow its glowing tail-tuft through pitch-black galleries. It dims the light when strangers feel unkind.' },
    cry: { base: 820, sweep: 1.2, wave: 'sine', dur: 0.3, vib: 24, chirps: 2 },
    draw(s) {
      // tail curling up-right with lantern tuft
      s.stroke(38, 51, 46, 44, 1, WHT.d);
      s.stroke(46, 44, 48, 37, 1, WHT.d);
      s.ball(49, 32, 4, 4, GLD, { flat: true });
      s.ball(49, 32, 2, 2, Px.ramp('#fff8d8'), { flat: true });
      s.set(49, 26, GLD.b); s.set(54, 32, GLD.b); s.set(44, 31, GLD.b);
      // haunches + feet
      s.ball(24, 49, 4, 4, WHT, { flat: true });
      s.ball(25, 54, 3, 2, WHT, { flat: true });
      s.ball(37, 54, 3, 2, WHT, { flat: true });
      // sitting body
      s.ball(30, 46, 10, 9, WHT);
      s.ball(30, 49, 6, 5, Px.ramp('#f8f4fa'), { flat: true });
      s.set(30, 43, GLD.b); // chest gleam
      // paws
      s.ball(26, 51, 2, 2, WHT, { flat: true });
      s.ball(34, 51, 2, 2, WHT, { flat: true });
      // head
      s.ball(30, 32, 8, 7, WHT);
      // big round ears
      s.ball(22, 24, 4, 4, WHT);
      s.ball(38, 24, 4, 4, WHT);
      s.ball(22, 24, 2, 2, RIB, { flat: true });
      s.ball(38, 24, 2, 2, RIB, { flat: true });
      // face
      K.eye(s, 26, 32, 2, '#8858b0');
      K.eye(s, 34, 32, 2, '#8858b0');
      s.set(30, 36, '#d888a8');
      K.smile(s, 30, 38, 1);
      K.cheek(s, 22, 35, GLD.l); K.cheek(s, 37, 35, GLD.l);
    },
    drawBack(s) {
      // Rear: round white back, ear backs, lantern tail held high.
      s.ball(30, 45, 11, 10, WHT, { lx: 0, ly: -0.5 });
      s.ball(30, 45, 7, 7, Px.ramp('#d6cee2'), { flat: true });
      s.dither(24, 39, 13, 12, WHT.d, 1);
      s.ball(25, 54, 3, 2, WHT, { flat: true });
      s.ball(37, 54, 3, 2, WHT, { flat: true });
      // back of head + ears
      s.ball(30, 31, 8, 7, WHT, { lx: 0, ly: -0.5 });
      s.ball(22, 23, 4, 4, WHT, { lx: 0, ly: -0.4 });
      s.ball(38, 23, 4, 4, WHT, { lx: 0, ly: -0.4 });
      // gold spine sparks
      s.set(30, 38, GLD.d); s.set(30, 43, GLD.d);
      // tail curls right, big glow toward camera
      s.stroke(38, 50, 48, 43, 2, WHT.d);
      s.stroke(48, 43, 50, 36, 1, WHT.d);
      s.ball(51, 30, 5, 5, GLD, { flat: true });
      s.ball(51, 30, 2, 3, Px.ramp('#fff8d8'), { flat: true });
      s.set(51, 23, GLD.b); s.set(57, 30, GLD.b);
    },
  });

  Dex.add({
    id: 47, key: 'sylphund', name: 'Sylphund', types: ['Fairy'],
    base: { hp: 70, atk: 55, def: 65, spa: 100, spd: 90, spe: 90 },
    ability: 'clear_mind', catchRate: 60, expYield: 196, growth: 'fast', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'growl'], [1, 'fae_wind'], [1, 'quick_jab'], [12, 'glimmer_kiss'],
      [16, 'charm'], [20, 'flash'], [26, 'prism_flare'], [32, 'starlight_heal'],
      [38, 'moonveil_blast'], [46, 'dream_pulse']],
    tms: ['tm04', 'tm09', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Sylph Hound', h: '1.2m', w: '24.5kg',
      entry: 'It pads soundlessly through the Whisperwood depths, ribbon-ears streaming light. Lost children wake at the old lodge with no memory of the road.' },
    cry: { base: 560, sweep: 0.9, wave: 'sine', dur: 0.5, vib: 18 },
    draw(s) {
      // slender legs
      s.limb(25, 44, 23, 57, 2, 1.5, WHT);
      s.limb(31, 45, 30, 57, 2, 1.5, WHT);
      s.limb(41, 44, 44, 57, 2, 1.5, WHT);
      s.limb(37, 45, 38, 57, 2, 1.5, WHT);
      // plume tail
      s.stroke(45, 39, 52, 30, 2, WHT);
      s.ball(53, 28, 3, 3, GLD, { flat: true });
      // long graceful body
      s.ball(34, 40, 12, 7, WHT);
      s.ball(26, 40, 5, 5, Px.ramp('#f8f4fa'), { flat: true }); // chest ruff
      // neck + head
      s.limb(25, 37, 23, 26, 3, 3, WHT);
      s.ball(23, 22, 6, 5, WHT);
      s.tri(18, 21, 12, 23, 18, 26, WHT.b); // muzzle
      s.set(12, 23, INK);
      // ribbon ears flowing back
      s.stroke(26, 18, 34, 12, 2, RIB);
      s.stroke(34, 12, 42, 10, 1, RIB);
      s.stroke(28, 21, 38, 17, 2, RIB);
      s.stroke(38, 17, 46, 16, 1, RIB);
      s.set(44, 9, RIB.l); s.set(48, 15, RIB.l);
      // light motes trailing
      s.set(48, 22, GLD.b); s.set(44, 34, GLD.b); s.set(18, 14, GLD.b);
      s.set(52, 40, GLD.l); s.set(15, 32, GLD.l);
      // face
      K.eye(s, 22, 21, 2, '#5888c8');
      s.set(20, 25, RIB.b);
      // hip marking
      s.set(40, 38, GLD.d); s.set(42, 40, GLD.d);
    },
    drawBack(s) {
      // Rear: hindquarters near camera, neck rising away, ribbons streaming down.
      s.limb(25, 45, 23, 57, 2, 1.5, WHT);
      s.limb(39, 45, 41, 57, 2, 1.5, WHT);
      s.limb(30, 46, 29, 58, 2, 1.5, WHT);
      s.limb(35, 46, 36, 58, 2, 1.5, WHT);
      s.ball(32, 42, 10, 8, WHT, { lx: 0, ly: -0.5 });
      // plume tail toward camera
      s.stroke(38, 40, 48, 32, 3, WHT);
      s.ball(50, 29, 4, 4, GLD, { flat: true });
      s.set(50, 24, GLD.b);
      // spine glow dots
      s.set(32, 36, GLD.d); s.set(32, 40, GLD.d);
      // neck away + back of head
      s.limb(28, 38, 26, 25, 3, 3, WHT);
      s.ball(26, 21, 6, 5, WHT, { lx: 0, ly: -0.5 });
      s.ball(26, 20, 4, 3, Px.ramp('#d6cee2'), { flat: true });
      // ribbons flow toward camera-right
      s.stroke(29, 17, 38, 14, 2, RIB);
      s.stroke(38, 14, 46, 14, 1, RIB);
      s.stroke(30, 21, 40, 20, 2, RIB);
      s.stroke(40, 20, 48, 22, 1, RIB);
      s.set(49, 13, RIB.l); s.set(51, 23, RIB.l);
      s.set(18, 28, GLD.b); s.set(50, 38, GLD.b);
    },
  });

  // ============ FIGHTING LINE: Scrappup -> Gulomaul ============
  const TAN = Px.ramp('#c89058');
  const TAND = Px.ramp('#8a6038');
  const DKB = Px.ramp('#5f4a3a');
  const BAND = Px.ramp('#e8ddc2');

  Dex.add({
    id: 48, key: 'scrappup', name: 'Scrappup', types: ['Fighting'],
    base: { hp: 50, atk: 62, def: 45, spa: 30, spd: 40, spe: 53 },
    ability: 'grit', catchRate: 180, expYield: 117, growth: 'medslow', gender: 75,
    evolve: { to: 'gulomaul', level: 24 },
    learn: [[1, 'tackle'], [1, 'leer'], [5, 'quick_jab'], [9, 'chop_strike'], [13, 'sweep_kick'],
      [17, 'muscle_flex'], [21, 'slab_breaker'], [26, 'blur_punch'], [30, 'all_out_assault']],
    tms: ['tm08', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Scrapper Pup', h: '0.6m', w: '9.5kg',
      entry: 'It picks fights with creatures thrice its size behind the old lodge. The strap across its chest is a badge, not a bandage — it has never once given up.' },
    cry: { base: 480, sweep: 0.75, wave: 'square', dur: 0.35, vib: 14, chirps: 1 },
    draw(s) {
      // legs
      s.limb(27, 52, 26, 57, 3, 2, TAN);
      s.limb(37, 52, 38, 57, 3, 2, TAN);
      // body
      s.ball(32, 45, 9, 10, TAN);
      // bandage strap across chest
      s.line(25, 41, 39, 49, BAND.b);
      s.line(25, 42, 39, 50, BAND.b);
      s.line(25, 43, 39, 51, BAND.d);
      // raised fists
      s.limb(24, 43, 19, 37, 2, 2, TAN);
      s.ball(18, 34, 3, 3, TAN);
      s.line(15, 34, 20, 34, BAND.b); // fist wrap
      s.limb(40, 43, 45, 39, 2, 2, TAN);
      s.ball(46, 36, 3, 3, TAN);
      s.line(43, 36, 48, 36, BAND.b);
      // head
      s.ball(32, 30, 9, 8, TAN);
      // ears (right one nicked)
      K.horn(s, 25, 24, -0.4, -1, 6, 2, TAND);
      K.horn(s, 38, 25, 0.5, -1, 4, 2, TAND);
      s.set(41, 21, TAND.b);
      // face
      K.eye(s, 28, 29, 2, '#404048');
      K.eye(s, 37, 29, 2, '#404048');
      K.brow(s, 28, 26, 2); K.brow(s, 38, 26, 2);
      s.ball(32, 34, 4, 3, BAND, { flat: true });
      s.set(32, 32, INK);
      s.line(30, 36, 34, 36, INK);
      K.fang(s, 33, 36);
      // scuff mark on cheek
      s.set(25, 33, TAND.d); s.set(26, 34, TAND.d);
    },
    drawBack(s) {
      // Rear: dark back-stripe, strap crossing the back, fists up at the sides.
      s.limb(27, 52, 26, 58, 3, 2, TAN);
      s.limb(37, 52, 38, 58, 3, 2, TAN);
      s.ball(32, 44, 10, 11, TAN, { lx: 0, ly: -0.5 });
      s.ball(32, 44, 6, 9, TAND, { flat: true });
      s.dither(27, 37, 10, 14, TAN.d, 1);
      // strap across back
      s.line(39, 40, 25, 49, BAND.b);
      s.line(39, 41, 25, 50, BAND.d);
      // stub tail
      s.ball(32, 54, 3, 2, TAND, { flat: true });
      // fists
      s.limb(24, 42, 19, 36, 2, 2, TAN);
      s.ball(18, 33, 3, 3, TAN, { lx: 0, ly: -0.4 });
      s.limb(40, 42, 45, 38, 2, 2, TAN);
      s.ball(46, 35, 3, 3, TAN, { lx: 0, ly: -0.4 });
      // back of head, darker crown
      s.ball(32, 29, 9, 8, TAN, { lx: 0, ly: -0.5 });
      s.ball(32, 28, 6, 5, TAND, { flat: true });
      K.horn(s, 25, 23, -0.4, -1, 6, 2, TAND);
      K.horn(s, 38, 24, 0.5, -1, 4, 2, TAND);
    },
  });

  Dex.add({
    id: 49, key: 'gulomaul', name: 'Gulomaul', types: ['Fighting', 'Dark'],
    base: { hp: 90, atk: 115, def: 80, spa: 45, spd: 70, spe: 90 },
    ability: 'bloodlust', catchRate: 60, expYield: 204, growth: 'medslow', gender: 75,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [1, 'chop_strike'], [1, 'cheap_shot'], [13, 'sweep_kick'],
      [18, 'muscle_flex'], [22, 'slab_breaker'], [27, 'night_slash'], [33, 'crunch'],
      [40, 'all_out_assault'], [48, 'shadow_maw']],
    tms: ['tm08', 'tm15', 'tm17', 'tm18', 'tm23', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Wolverine Bruiser', h: '1.5m', w: '86.0kg',
      entry: 'Even the foremen of Irondeep down tools when one wanders into a gallery. Its torn ear marks the one fight it did not finish — the other fighter kept the rest.' },
    cry: { base: 210, sweep: 0.5, wave: 'sawtooth', dur: 0.65, vib: 9, grit: 0.5, sub: true },
    draw(s) {
      // legs
      s.limb(24, 50, 22, 58, 4, 4, DKB);
      s.limb(40, 50, 42, 58, 4, 4, DKB);
      // hulking torso
      s.ball(32, 38, 15, 14, DKB);
      // tan chest wedge
      s.tri(24, 30, 40, 30, 32, 47, TAN.b);
      s.dither(28, 32, 9, 8, TAN.d, 1);
      // shoulders + massive forearms
      s.ball(18, 30, 6, 5, DKB);
      s.ball(46, 30, 6, 5, DKB);
      s.limb(18, 32, 10, 45, 5, 6, DKB);
      s.limb(46, 32, 54, 45, 5, 6, DKB);
      s.ball(10, 48, 6, 4, DKB, { lx: -0.3, ly: -0.4 });
      s.ball(54, 48, 6, 4, DKB, { lx: -0.3, ly: -0.4 });
      K.claws(s, 7, 51, 3, BAND.b); K.claws(s, 51, 51, 3, BAND.b);
      // side stripes (wolverine flank markings)
      s.line(18, 34, 20, 42, TAND.b);
      s.line(46, 34, 44, 42, TAND.b);
      // head
      s.ball(32, 20, 9, 8, DKB);
      // ears: left whole, right torn ragged
      K.horn(s, 25, 15, -0.5, -1, 5, 2, DKB);
      s.tri(38, 15, 41, 11, 41, 15, DKB.b);
      s.tri(42, 15, 44, 13, 44, 16, DKB.d);
      // tan face mask
      s.ball(32, 23, 6, 4, TAN, { flat: true });
      K.eye(s, 27, 19, 2, '#e05838');
      K.eye(s, 37, 19, 2, '#e05838');
      K.brow(s, 27, 16, 2); K.brow(s, 38, 16, 2);
      s.set(32, 22, INK);
      s.line(29, 25, 35, 25, INK);
      K.fang(s, 28, 25, '#fff'); K.fang(s, 34, 25, '#fff');
    },
    drawBack(s) {
      // Rear: broad dark back with pale flank stripes, torn ear silhouette.
      s.limb(24, 50, 22, 59, 4, 4, DKB);
      s.limb(40, 50, 42, 59, 4, 4, DKB);
      s.ball(32, 38, 16, 15, DKB, { lx: 0, ly: -0.5 });
      // flank stripes wrap around
      s.stroke(20, 30, 18, 44, 1, TAND);
      s.stroke(44, 30, 46, 44, 1, TAND);
      s.dither(24, 30, 17, 16, DKB.d, 1);
      // bushy tail low
      s.ball(32, 52, 6, 4, DKB, { flat: true });
      s.dither(28, 50, 9, 5, TAND.d, 0);
      // forearms + fists at sides
      s.limb(17, 32, 10, 45, 5, 5, DKB);
      s.limb(47, 32, 54, 45, 5, 5, DKB);
      s.ball(10, 48, 6, 4, DKB, { lx: 0, ly: -0.5 });
      s.ball(54, 48, 6, 4, DKB, { lx: 0, ly: -0.5 });
      // back of head
      s.ball(32, 19, 9, 8, DKB, { lx: 0, ly: -0.5 });
      s.ball(32, 18, 6, 5, Px.ramp('#4a3a2e'), { flat: true });
      K.horn(s, 25, 14, -0.5, -1, 5, 2, DKB);
      s.tri(38, 14, 41, 10, 41, 14, DKB.b);
      s.tri(42, 14, 44, 12, 44, 15, DKB.d);
    },
  });

  // ============ ROCK LINE: Ramlet -> Boulderam ============
  const PEB = Px.ramp('#a8a098');
  const ROK = Px.ramp('#786858');
  const CRM2 = Px.ramp('#e0d6c4');
  const HRN = Px.ramp('#8a7a62');

  Dex.add({
    id: 50, key: 'ramlet', name: 'Ramlet', types: ['Rock'],
    base: { hp: 45, atk: 50, def: 70, spa: 25, spd: 45, spe: 35 },
    ability: 'bedrock', catchRate: 190, expYield: 112, growth: 'medslow', gender: 50,
    evolve: { to: 'boulderam', level: 22 },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'pebble_volley'], [9, 'headbutt'], [13, 'rock_throw'],
      [17, 'harden'], [21, 'rock_tomb'], [26, 'rock_slide'], [30, 'zen_ram']],
    tms: ['tm14', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Pebble Lamb', h: '0.5m', w: '22.0kg',
      entry: 'Its wool sets into pebbles as it grows, shed each spring in little cairns. Shepherds near Tidegrot Cave stack them for luck.' },
    cry: { base: 520, sweep: 0.66, wave: 'triangle', dur: 0.4, vib: 12 },
    draw(s) {
      // legs
      s.limb(26, 50, 25, 56, 2, 1.5, HRN);
      s.limb(31, 51, 31, 56, 2, 1.5, HRN);
      s.limb(37, 51, 37, 56, 2, 1.5, HRN);
      s.limb(42, 50, 43, 56, 2, 1.5, HRN);
      // pebble-wool body
      s.ball(34, 44, 11, 8, PEB);
      s.ball(27, 41, 3, 2, PEB, { flat: true, lx: -0.5, ly: -0.5 });
      s.ball(33, 39, 3, 2, PEB, { lx: -0.5, ly: -0.5 });
      s.ball(39, 41, 3, 2, PEB, { flat: true, lx: -0.5, ly: -0.5 });
      s.ball(30, 46, 2, 2, ROK, { flat: true });
      s.ball(38, 46, 2, 2, ROK, { flat: true });
      s.dither(26, 42, 16, 6, PEB.d, 1);
      // tail puff
      s.ball(46, 42, 3, 3, PEB, { flat: true });
      // cream face
      s.ball(24, 36, 6, 6, CRM2);
      // pebble-wool cap
      s.ball(24, 31, 6, 4, PEB, { flat: true });
      s.ball(20, 30, 2, 2, ROK, { flat: true });
      s.ball(27, 29, 2, 2, PEB, { lx: -0.5, ly: -0.5 });
      // little curled horns
      K.horn(s, 18, 33, -1, -0.2, 4, 2, HRN);
      s.set(15, 35, HRN.d);
      K.horn(s, 30, 33, 1, -0.2, 4, 2, HRN);
      s.set(33, 35, HRN.d);
      // face
      K.eye(s, 22, 36, 1, '#404048');
      K.eye(s, 27, 36, 1, '#404048');
      s.set(24, 39, '#5a4a44');
      K.smile(s, 24, 41, 1);
      K.cheek(s, 19, 38, '#c8a890');
    },
    drawBack(s) {
      // Rear: a walking cairn — pebble rump, wool cap over the head, tail puff.
      s.limb(26, 50, 25, 57, 2, 1.5, HRN);
      s.limb(42, 50, 43, 57, 2, 1.5, HRN);
      s.limb(31, 51, 31, 57, 2, 1.5, HRN);
      s.limb(37, 51, 37, 57, 2, 1.5, HRN);
      s.ball(33, 43, 12, 9, PEB, { lx: 0, ly: -0.5 });
      // pebbles all over the back
      s.ball(27, 39, 3, 2, PEB, { lx: 0, ly: -0.6 });
      s.ball(34, 37, 3, 2, ROK, { flat: true });
      s.ball(40, 40, 3, 2, PEB, { lx: 0, ly: -0.6 });
      s.ball(29, 45, 2, 2, ROK, { flat: true });
      s.ball(37, 45, 3, 2, PEB, { flat: true });
      s.dither(24, 40, 18, 8, PEB.d, 0);
      // tail puff toward camera
      s.ball(33, 50, 4, 3, PEB, { flat: true });
      // back of wool-capped head
      s.ball(25, 34, 6, 6, PEB, { lx: 0, ly: -0.5 });
      s.ball(23, 31, 2, 2, ROK, { flat: true });
      K.horn(s, 19, 33, -1, -0.2, 4, 2, HRN);
      K.horn(s, 31, 33, 1, -0.2, 4, 2, HRN);
    },
  });

  Dex.add({
    id: 51, key: 'boulderam', name: 'Boulderam', types: ['Rock', 'Fighting'],
    base: { hp: 80, atk: 105, def: 105, spa: 40, spd: 75, spe: 75 },
    ability: 'iron_frame', catchRate: 65, expYield: 200, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'pebble_volley'], [9, 'headbutt'], [13, 'rock_throw'],
      [17, 'harden'], [22, 'rock_smash'], [26, 'rock_tomb'], [30, 'slab_breaker'],
      [36, 'rock_slide'], [42, 'reckless_charge'], [50, 'stone_spike']],
    tms: ['tm07', 'tm08', 'tm14', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Battering Ram', h: '1.4m', w: '310.0kg',
      entry: 'Old raiding songs say fortress gates were tested against a charging Boulderam. Its stone horns strike sparks that light the Whisperwood at dusk.' },
    cry: { base: 230, sweep: 0.48, wave: 'square', dur: 0.7, vib: 7, grit: 0.4, sub: true },
    draw(s) {
      // legs
      s.limb(22, 50, 20, 58, 4, 3, HRN);
      s.limb(42, 50, 44, 58, 4, 3, HRN);
      s.limb(28, 52, 27, 58, 3, 2, HRN);
      s.limb(37, 52, 38, 58, 3, 2, HRN);
      // massive pebble body
      s.ball(32, 38, 16, 13, PEB);
      // boulder shoulders
      s.ball(19, 31, 7, 6, ROK);
      s.ball(45, 31, 7, 6, ROK);
      s.dither(14, 28, 10, 6, ROK.d, 1);
      s.dither(40, 28, 10, 6, ROK.d, 0);
      // pebble clusters on back
      s.ball(26, 30, 3, 2, PEB, { lx: -0.5, ly: -0.5 });
      s.ball(38, 30, 3, 2, ROK, { flat: true });
      s.ball(32, 46, 4, 3, ROK, { flat: true });
      // stone face, head-on
      s.ball(32, 32, 8, 8, HRN);
      // huge curled stone horns
      s.stroke(25, 27, 18, 28, 3, ROK);
      s.stroke(18, 28, 17, 35, 3, ROK);
      s.stroke(17, 35, 21, 37, 2, ROK);
      s.stroke(39, 27, 46, 28, 3, ROK);
      s.stroke(46, 28, 47, 35, 3, ROK);
      s.stroke(47, 35, 43, 37, 2, ROK);
      s.line(19, 29, 18, 33, HRN.l); s.line(45, 29, 46, 33, HRN.l);
      // stern face
      K.eye(s, 28, 31, 2, '#e0a030');
      K.eye(s, 36, 31, 2, '#e0a030');
      K.brow(s, 28, 28, 2); K.brow(s, 37, 28, 2);
      s.set(30, 36, INK); s.set(34, 36, INK);
      s.line(30, 38, 34, 38, INK);
      // forehead plate
      s.ball(32, 26, 5, 2, ROK, { flat: true });
    },
    drawBack(s) {
      // Rear: boulder rump and shoulders, horns curling out past the head.
      s.limb(22, 50, 20, 59, 4, 3, HRN);
      s.limb(42, 50, 44, 59, 4, 3, HRN);
      s.limb(28, 52, 27, 59, 3, 2, HRN);
      s.limb(37, 52, 38, 59, 3, 2, HRN);
      s.ball(32, 40, 17, 14, PEB, { lx: 0, ly: -0.5 });
      // rocky spine ridge
      s.ball(32, 32, 4, 3, ROK, { flat: true });
      s.ball(32, 40, 5, 3, ROK, { flat: true });
      s.ball(32, 48, 4, 3, ROK, { flat: true });
      s.ball(25, 36, 3, 2, PEB, { lx: 0, ly: -0.6 });
      s.ball(40, 37, 3, 2, PEB, { lx: 0, ly: -0.6 });
      s.dither(20, 32, 25, 16, PEB.d, 1);
      // tail puff
      s.ball(32, 53, 4, 3, PEB, { flat: true });
      // boulder shoulders
      s.ball(19, 29, 7, 6, ROK, { lx: 0, ly: -0.5 });
      s.ball(45, 29, 7, 6, ROK, { lx: 0, ly: -0.5 });
      // lowered head beyond, horns curling into view
      s.ball(32, 24, 7, 5, HRN, { lx: 0, ly: -0.5 });
      s.stroke(26, 22, 18, 23, 3, ROK);
      s.stroke(18, 23, 17, 30, 3, ROK);
      s.stroke(17, 30, 21, 32, 2, ROK);
      s.stroke(38, 22, 46, 23, 3, ROK);
      s.stroke(46, 23, 47, 30, 3, ROK);
      s.stroke(47, 30, 43, 32, 2, ROK);
    },
  });

  // ============ BAT LINE: Echomite -> Screechelon ============
  const PUR = Px.ramp('#7858a0');
  const MEM = Px.ramp('#4a3868');
  const PNK = Px.ramp('#d888a8');
  const VEN = Px.ramp('#a8d858');

  Dex.add({
    id: 52, key: 'echomite', name: 'Echomite', types: ['Poison', 'Flying'],
    base: { hp: 40, atk: 35, def: 30, spa: 45, spd: 35, spe: 60 },
    ability: 'hunter_eye', catchRate: 255, expYield: 102, growth: 'medfast', gender: 50,
    evolve: { to: 'screechelon', level: 20 },
    learn: [[1, 'venom_barb'], [1, 'leer'], [6, 'wind_gust'], [10, 'quick_jab'], [14, 'wing_strike'],
      [18, 'fang_of_rot'], [22, 'venom_dust'], [26, 'sludge']],
    tms: ['tm06', 'tm10', 'tm16', 'tm17', 'tm23', 'hm02'],
    dex: { species: 'Echo Bat', h: '0.4m', w: '1.8kg',
      entry: 'Swarms of them roost in Tidegrot Cave, ears twitching at every drip. A single drop of its fang-venom can numb a bear\'s paw.' },
    cry: { base: 880, sweep: 1.35, wave: 'square', dur: 0.3, vib: 30, chirps: 3 },
    draw(s) {
      // ragged little wings
      s.fillPoly([[25, 35], [12, 27], [13, 38], [18, 36], [17, 44], [23, 41]], MEM.b);
      s.line(13, 29, 24, 36, MEM.d);
      s.fillPoly([[39, 35], [52, 27], [51, 38], [46, 36], [47, 44], [41, 41]], MEM.b);
      s.line(51, 29, 40, 36, MEM.d);
      // body
      s.ball(32, 39, 7, 8, PUR);
      s.ball(32, 43, 4, 4, PNK, { flat: true });
      // huge ears
      K.horn(s, 28, 30, -0.35, -1, 11, 3, PUR);
      K.horn(s, 36, 30, 0.35, -1, 11, 3, PUR);
      s.tri(27, 28, 25, 22, 29, 26, PNK.b);
      s.tri(37, 28, 39, 22, 35, 26, PNK.b);
      // face
      K.eye(s, 29, 36, 2, '#f0d040');
      K.eye(s, 35, 36, 2, '#f0d040');
      s.set(32, 38, PNK.d);
      s.line(30, 41, 34, 41, INK);
      K.fang(s, 30, 41, '#fff');
      // venom drip from fang
      s.set(31, 44, VEN.b); s.set(31, 46, VEN.d);
      // dangling feet
      s.limb(30, 46, 29, 50, 1.5, 1, PUR);
      s.limb(34, 46, 35, 50, 1.5, 1, PUR);
    },
    drawBack(s) {
      // Rear: wings fold toward camera, furred back, ear backs only.
      s.fillPoly([[26, 34], [10, 26], [12, 39], [17, 36], [16, 45], [24, 41]], MEM.b);
      s.line(11, 28, 25, 36, MEM.d);
      s.fillPoly([[38, 34], [54, 26], [52, 39], [47, 36], [48, 45], [40, 41]], MEM.b);
      s.line(53, 28, 39, 36, MEM.d);
      s.ball(32, 39, 8, 9, PUR, { lx: 0, ly: -0.5 });
      s.ball(32, 39, 5, 6, MEM, { flat: true });
      s.dither(28, 34, 9, 10, PUR.d, 1);
      // ears from behind, no inner
      K.horn(s, 28, 30, -0.35, -1, 11, 3, PUR);
      K.horn(s, 36, 30, 0.35, -1, 11, 3, PUR);
      s.line(27, 26, 26, 22, PUR.d);
      s.line(37, 26, 38, 22, PUR.d);
      // feet
      s.limb(30, 47, 29, 51, 1.5, 1, PUR);
      s.limb(34, 47, 35, 51, 1.5, 1, PUR);
    },
  });

  Dex.add({
    id: 53, key: 'screechelon', name: 'Screechelon', types: ['Poison', 'Flying'],
    base: { hp: 70, atk: 60, def: 55, spa: 95, spd: 70, spe: 105 },
    ability: 'looming_dread', catchRate: 90, expYield: 190, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'venom_barb'], [1, 'leer'], [1, 'wind_gust'], [10, 'quick_jab'], [14, 'wing_strike'],
      [18, 'fang_of_rot'], [24, 'venom_dust'], [28, 'sludge'], [34, 'gale_blade'],
      [40, 'sludge_blast'], [46, 'cyclone'], [52, 'hyper_voice']],
    tms: ['tm06', 'tm10', 'tm16', 'tm17', 'tm23', 'hm02'],
    dex: { species: 'Radar Bat', h: '1.3m', w: '29.0kg',
      entry: 'Its dish-shaped ears map the Irondeep Mines to the last pebble. One screech at full pitch can shiver ore straight out of the wall.' },
    cry: { base: 700, sweep: 1.1, wave: 'sawtooth', dur: 0.55, vib: 26, grit: 0.3 },
    draw(s) {
      // vast ragged wings
      s.fillPoly([[26, 32], [6, 20], [8, 35], [14, 32], [12, 45], [19, 40], [18, 51], [26, 43]], MEM.b);
      s.line(7, 22, 25, 33, MEM.d);
      s.line(9, 34, 24, 37, MEM.d);
      s.fillPoly([[38, 32], [58, 20], [56, 35], [50, 32], [52, 45], [45, 40], [46, 51], [38, 43]], MEM.b);
      s.line(57, 22, 39, 33, MEM.d);
      s.line(55, 34, 40, 37, MEM.d);
      // body
      s.ball(32, 38, 9, 11, PUR);
      s.ball(32, 43, 5, 6, PNK, { flat: true });
      s.dither(28, 40, 9, 6, PUR.d, 1);
      // head
      s.ball(32, 25, 8, 7, PUR);
      // radar dish ears
      s.ball(22, 16, 6, 6, PUR);
      s.ball(22, 16, 4, 4, PNK, { flat: true });
      s.ball(22, 16, 1, 1, MEM, { flat: true });
      s.ball(42, 16, 6, 6, PUR);
      s.ball(42, 16, 4, 4, PNK, { flat: true });
      s.ball(42, 16, 1, 1, MEM, { flat: true });
      // face: shrieking
      K.eye(s, 28, 23, 2, '#f0d040');
      K.eye(s, 36, 23, 2, '#f0d040');
      K.brow(s, 28, 20, 2); K.brow(s, 37, 20, 2);
      s.rect(29, 28, 7, 3, '#2a1830');
      K.fang(s, 29, 28, '#fff'); K.fang(s, 33, 28, '#fff');
      s.set(31, 32, VEN.b); s.set(31, 34, VEN.d);
      // legs dangling
      s.limb(28, 47, 27, 54, 2, 1.5, PUR);
      s.limb(36, 47, 37, 54, 2, 1.5, PUR);
    },
    drawBack(s) {
      // Rear: wings wrap toward camera, dark furred spine, dish ears from behind.
      s.fillPoly([[27, 32], [4, 22], [7, 36], [13, 33], [11, 46], [18, 41], [17, 52], [27, 44]], MEM.b);
      s.line(5, 24, 26, 34, MEM.d);
      s.fillPoly([[37, 32], [60, 22], [57, 36], [51, 33], [53, 46], [46, 41], [47, 52], [37, 44]], MEM.b);
      s.line(59, 24, 38, 34, MEM.d);
      s.ball(32, 38, 10, 12, PUR, { lx: 0, ly: -0.5 });
      s.ball(32, 38, 6, 9, MEM, { flat: true });
      s.dither(27, 31, 11, 14, PUR.d, 1);
      // back of head
      s.ball(32, 24, 8, 7, PUR, { lx: 0, ly: -0.5 });
      s.ball(32, 23, 5, 4, MEM, { flat: true });
      // dishes seen from behind: solid backs with rims
      s.ball(22, 15, 6, 6, PUR, { lx: 0, ly: -0.5 });
      s.ball(22, 15, 4, 4, PUR, { flat: true });
      s.line(18, 12, 26, 12, PUR.l);
      s.ball(42, 15, 6, 6, PUR, { lx: 0, ly: -0.5 });
      s.ball(42, 15, 4, 4, PUR, { flat: true });
      s.line(38, 12, 46, 12, PUR.l);
      // legs
      s.limb(28, 48, 27, 55, 2, 1.5, PUR);
      s.limb(36, 48, 37, 55, 2, 1.5, PUR);
    },
  });

  // ============ MUSHROOM LINE: Sporeling -> Myceloom ============
  const CAP = Px.ramp('#8858b0');
  const CAPD = Px.ramp('#5f3a80');
  const STEM = Px.ramp('#c2cc96');
  const DOT = Px.ramp('#e8ddc2');

  Dex.add({
    id: 54, key: 'sporeling', name: 'Sporeling', types: ['Grass', 'Poison'],
    base: { hp: 55, atk: 35, def: 50, spa: 55, spd: 50, spe: 20 },
    ability: 'moss_mend', catchRate: 235, expYield: 110, growth: 'medfast', gender: 50,
    evolve: { to: 'myceloom', level: 23 },
    learn: [[1, 'tackle'], [1, 'venom_dust'], [5, 'siphon_seed'], [9, 'vine_lash'], [13, 'sludge'],
      [17, 'numb_spore'], [21, 'razor_leaf'], [25, 'drowse_spore'], [29, 'sap_surge']],
    tms: ['tm06', 'tm10', 'tm17', 'tm19', 'tm24', 'hm01'],
    dex: { species: 'Cap Sprite', h: '0.4m', w: '3.6kg',
      entry: 'It sprouts overnight in fairy rings deep in the Whisperwood. Foragers count the polka dots — an odd number means the whole ring is watching.' },
    cry: { base: 600, sweep: 0.85, wave: 'triangle', dur: 0.38, vib: 16, chirps: 1 },
    draw(s) {
      // feet
      s.ball(28, 54, 3, 2, STEM, { flat: true });
      s.ball(36, 54, 3, 2, STEM, { flat: true });
      // stem body
      s.ball(32, 46, 7, 8, STEM);
      // little arms
      s.limb(26, 45, 22, 49, 2, 1.5, STEM);
      s.limb(38, 45, 42, 49, 2, 1.5, STEM);
      // cap
      s.ball(32, 31, 13, 8, CAP);
      s.line(20, 35, 44, 35, CAPD.d);
      s.line(24, 37, 40, 37, STEM.d); // gills
      // polka dots
      s.ball(24, 29, 2, 1.5, DOT, { flat: true });
      s.ball(33, 26, 2, 1.5, DOT, { flat: true });
      s.ball(41, 30, 1.5, 1.5, DOT, { flat: true });
      s.ball(28, 33, 1.5, 1, DOT, { flat: true });
      s.ball(38, 34, 1.5, 1, DOT, { flat: true });
      // face on stem
      K.eye(s, 29, 44, 2, '#684898');
      K.eye(s, 35, 44, 2, '#684898');
      K.smile(s, 32, 48, 2);
      K.cheek(s, 25, 46, '#a8b878'); K.cheek(s, 38, 46, '#a8b878');
      // drifting spores
      s.set(16, 26, CAP.l); s.set(48, 25, CAP.l); s.set(32, 19, CAP.l);
      s.set(12, 34, CAPD.b);
    },
    drawBack(s) {
      // Rear: cap tips back showing more dome, stem below, no face.
      s.ball(28, 55, 3, 2, STEM, { flat: true });
      s.ball(36, 55, 3, 2, STEM, { flat: true });
      s.ball(32, 47, 8, 8, STEM, { lx: 0, ly: -0.5 });
      s.limb(26, 46, 22, 50, 2, 1.5, STEM);
      s.limb(38, 46, 42, 50, 2, 1.5, STEM);
      // bigger dome from behind
      s.ball(32, 30, 14, 9, CAP, { lx: 0, ly: -0.4 });
      s.line(19, 35, 45, 35, CAPD.d);
      s.dither(22, 28, 20, 6, CAP.d, 1);
      // dots
      s.ball(26, 27, 2, 1.5, DOT, { flat: true });
      s.ball(36, 25, 2, 1.5, DOT, { flat: true });
      s.ball(42, 31, 1.5, 1.5, DOT, { flat: true });
      s.ball(22, 32, 1.5, 1, DOT, { flat: true });
      s.ball(32, 32, 1.5, 1, DOT, { flat: true });
      s.set(15, 24, CAP.l); s.set(49, 27, CAP.l);
    },
  });

  Dex.add({
    id: 55, key: 'myceloom', name: 'Myceloom', types: ['Grass', 'Poison'],
    base: { hp: 90, atk: 60, def: 75, spa: 100, spd: 85, spe: 60 },
    ability: 'dream_dust', catchRate: 75, expYield: 196, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'venom_dust'], [1, 'siphon_seed'], [9, 'vine_lash'], [13, 'sludge'],
      [17, 'numb_spore'], [23, 'drowse_spore'], [28, 'sap_surge'], [34, 'verdant_orb'],
      [40, 'sludge_blast'], [46, 'dream_pulse'], [52, 'sunpierce']],
    tms: ['tm06', 'tm10', 'tm11', 'tm17', 'tm19', 'tm24', 'hm01', 'hm05'],
    dex: { species: 'Spore Shaman', h: '1.6m', w: '39.5kg',
      entry: 'It sways at the heart of the Whisperwood depths, swinging censers of dream-spores. Those who breathe deep sleep a year and wake speaking with mushrooms.' },
    cry: { base: 300, sweep: 0.6, wave: 'triangle', dur: 0.6, vib: 10 },
    draw(s) {
      // skirt robe
      s.fillPoly([[25, 42], [39, 42], [45, 57], [19, 57]], STEM.b);
      s.dither(22, 46, 20, 11, STEM.d, 1);
      s.line(20, 56, 44, 56, DOT.b); // hem
      // torso
      s.ball(32, 38, 9, 9, STEM);
      // censer arms
      s.limb(24, 37, 17, 45, 2, 2, STEM);
      s.stroke(16, 47, 16, 49, 1, HRN.d);
      s.ball(16, 51, 3, 3, HRN);
      s.set(16, 51, GLD.b);
      s.set(14, 46, CAP.l); s.set(13, 43, CAP.l); s.set(14, 40, CAPD.b);
      s.limb(40, 37, 47, 45, 2, 2, STEM);
      s.stroke(48, 47, 48, 49, 1, HRN.d);
      s.ball(48, 51, 3, 3, HRN);
      s.set(48, 51, GLD.b);
      s.set(50, 46, CAP.l); s.set(51, 43, CAP.l); s.set(50, 40, CAPD.b);
      // hood-cap: broad drooping dome
      s.ball(32, 21, 14, 9, CAP);
      s.tri(19, 20, 13, 32, 22, 27, CAP.b);
      s.tri(45, 20, 51, 32, 42, 27, CAP.b);
      s.line(14, 31, 20, 24, CAPD.d);
      s.line(50, 31, 44, 24, CAPD.d);
      // dots on hood
      s.ball(25, 18, 2, 1.5, DOT, { flat: true });
      s.ball(35, 15, 2, 1.5, DOT, { flat: true });
      s.ball(42, 20, 1.5, 1.5, DOT, { flat: true });
      s.ball(18, 23, 1.5, 1, DOT, { flat: true });
      // shadowed face under hood, glowing eyes
      s.ball(32, 29, 6, 4, Px.ramp('#3a2c48'), { flat: true });
      s.rect(29, 28, 2, 2, '#f4c84e');
      s.rect(34, 28, 2, 2, '#f4c84e');
      // robe rune ring
      s.set(30, 46, CAPD.b); s.set(34, 46, CAPD.b); s.set(32, 44, CAPD.b); s.set(32, 48, CAPD.b);
    },
    drawBack(s) {
      // Rear: the hood drapes fully down the back like a cloak, censers peeking.
      s.fillPoly([[25, 42], [39, 42], [46, 58], [18, 58]], STEM.b);
      s.dither(21, 46, 22, 12, STEM.d, 0);
      s.line(19, 57, 45, 57, DOT.b);
      s.ball(32, 38, 10, 9, STEM, { lx: 0, ly: -0.5 });
      // arms + censers at sides
      s.limb(24, 37, 17, 45, 2, 2, STEM);
      s.ball(16, 50, 3, 3, HRN, { lx: 0, ly: -0.4 });
      s.limb(40, 37, 47, 45, 2, 2, STEM);
      s.ball(48, 50, 3, 3, HRN, { lx: 0, ly: -0.4 });
      s.set(13, 44, CAP.l); s.set(51, 44, CAP.l);
      // hood dome from behind + long drape
      s.ball(32, 20, 15, 10, CAP, { lx: 0, ly: -0.4 });
      s.fillPoly([[22, 25], [42, 25], [39, 44], [25, 44]], CAPD.b);
      s.dither(26, 28, 13, 14, CAP.d, 1);
      // dots
      s.ball(26, 16, 2, 1.5, DOT, { flat: true });
      s.ball(38, 15, 2, 1.5, DOT, { flat: true });
      s.ball(45, 22, 1.5, 1.5, DOT, { flat: true });
      s.ball(19, 22, 1.5, 1, DOT, { flat: true });
      s.ball(32, 34, 1.5, 1, DOT, { flat: true });
      // spore drift
      s.set(12, 30, CAP.l); s.set(52, 28, CAP.l); s.set(32, 8, CAP.l);
    },
  });

  // ============ CRYSTAL LINE: Shardling -> Prismarok ============
  const ICE = Px.ramp('#a8d8e8');
  const ICED = Px.ramp('#6898c0');
  const BASE = Px.ramp('#6a6272');
  const BANDS = ['#f4c84e', '#e8a0c8', '#7fe0d8'];

  Dex.add({
    id: 56, key: 'shardling', name: 'Shardling', types: ['Rock', 'Ice'],
    base: { hp: 45, atk: 50, def: 85, spa: 40, spd: 55, spe: 25 },
    ability: 'bedrock', catchRate: 120, expYield: 125, growth: 'slow', gender: -1,
    evolve: { to: 'prismarok', level: 30 },
    learn: [[1, 'tackle'], [1, 'harden'], [6, 'frost_dust'], [10, 'pebble_volley'], [14, 'ice_shard'],
      [18, 'rock_throw'], [23, 'frost_armor'], [27, 'rock_tomb'], [31, 'icicle_crash']],
    tms: ['tm03', 'tm13', 'tm14', 'tm15', 'tm17', 'hm05'],
    dex: { species: 'Ice Quartz', h: '0.6m', w: '48.0kg',
      entry: 'Clusters of it stud the walls of Tidegrot Cave, blinking when lanterns pass. Prospectors who pocket one find their packs mysteriously heavier by morning.' },
    cry: { base: 740, sweep: 1.05, wave: 'triangle', dur: 0.35, vib: 6 },
    draw(s) {
      // rocky base
      s.ball(32, 53, 11, 4, BASE, { flat: true });
      s.dither(24, 51, 17, 4, BASE.d, 1);
      // shard cluster
      K.horn(s, 32, 52, 0, -1, 25, 5, ICE);
      K.horn(s, 24, 53, -0.3, -1, 13, 3, ICE);
      K.horn(s, 41, 53, 0.35, -1, 15, 3, ICE);
      K.horn(s, 36, 54, 0.1, -1, 8, 2, ICED);
      K.horn(s, 27, 54, -0.1, -1, 7, 2, ICED);
      // facet glints
      s.line(30, 32, 29, 44, '#f0fbff');
      s.line(21, 45, 20, 50, '#f0fbff');
      s.line(45, 42, 44, 48, ICE.h);
      // eyes set into the tall shard
      K.eye(s, 29, 40, 2, '#3878c8');
      K.eye(s, 35, 40, 2, '#3878c8');
      s.line(31, 45, 33, 45, ICED.d);
      // sparkles
      s.set(14, 36, '#fff'); s.set(13, 35, ICE.h); s.set(15, 35, ICE.h); s.set(14, 34, '#fff');
      s.set(50, 30, '#fff'); s.set(49, 29, ICE.h);
    },
    drawBack(s) {
      // Rear: same cluster from behind — a stouter back shard, no eyes.
      s.ball(32, 53, 12, 4, BASE, { flat: true });
      s.dither(23, 51, 19, 4, BASE.d, 0);
      K.horn(s, 32, 52, 0, -1, 26, 6, ICE);
      K.horn(s, 23, 53, -0.35, -1, 14, 3, ICE);
      K.horn(s, 41, 53, 0.3, -1, 13, 3, ICE);
      K.horn(s, 28, 54, -0.1, -1, 8, 2, ICED);
      K.horn(s, 37, 54, 0.15, -1, 9, 2, ICED);
      // heavy frost seam down the back facet
      s.line(32, 28, 33, 50, ICED.b);
      s.line(31, 34, 31, 48, '#f0fbff');
      s.dither(29, 38, 7, 12, ICE.d, 1);
      s.set(48, 34, '#fff'); s.set(16, 30, ICE.h);
    },
  });

  Dex.add({
    id: 57, key: 'prismarok', name: 'Prismarok', types: ['Rock', 'Ice'],
    base: { hp: 75, atk: 75, def: 125, spa: 85, spd: 90, spe: 50 },
    ability: 'stone_hide', catchRate: 45, expYield: 208, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'frost_dust'], [14, 'ice_shard'], [18, 'rock_throw'],
      [24, 'frost_armor'], [28, 'rock_tomb'], [34, 'icicle_crash'], [40, 'rock_slide'],
      [46, 'glacier_ray'], [52, 'whiteout'], [56, 'stone_spike']],
    tms: ['tm03', 'tm13', 'tm14', 'tm15', 'tm17', 'tm21', 'hm04', 'hm05', 'hm06'],
    dex: { species: 'Prism Monolith', h: '2.4m', w: '580.0kg',
      entry: 'A standing stone that was never raised by hands. Lantern light entering its facets leaves as ribbons of color that dance along the mine walls.' },
    cry: { base: 170, sweep: 0.55, wave: 'triangle', dur: 0.75, vib: 4, sub: true },
    draw(s) {
      // rocky feet
      s.ball(26, 56, 5, 3, BASE, { flat: true });
      s.ball(38, 56, 5, 3, BASE, { flat: true });
      // faceted pillar
      s.fillPoly([[24, 56], [40, 56], [42, 16], [32, 8], [22, 16]], ICE.b);
      s.fillPoly([[24, 56], [30, 56], [29, 13], [22, 16]], ICE.l);
      s.fillPoly([[34, 56], [40, 56], [42, 16], [34, 11]], ICE.d);
      s.line(32, 8, 22, 16, '#f0fbff');
      s.line(30, 14, 29, 54, '#f0fbff');
      s.line(34, 12, 35, 54, ICED.b);
      // refracted light bands
      s.line(25, 30, 40, 27, BANDS[0]);
      s.line(24, 38, 41, 35, BANDS[1]);
      s.line(25, 46, 40, 43, BANDS[2]);
      // shoulder shards
      K.horn(s, 21, 34, -0.9, -0.45, 11, 3, ICED);
      K.horn(s, 43, 34, 0.9, -0.45, 11, 3, ICED);
      // orbiting shard bits
      s.tri(12, 24, 15, 21, 15, 27, ICE.b);
      s.tri(52, 24, 49, 21, 49, 27, ICE.b);
      s.set(10, 30, ICE.h); s.set(54, 30, ICE.h);
      // glowing eye slits
      s.rect(27, 19, 3, 2, '#68e0f0');
      s.rect(35, 19, 3, 2, '#68e0f0');
      s.set(26, 20, ICED.d); s.set(38, 20, ICED.d);
    },
    drawBack(s) {
      // Rear: the monolith's spine — a glowing frost seam, no eyes.
      s.ball(26, 56, 5, 3, BASE, { flat: true });
      s.ball(38, 56, 5, 3, BASE, { flat: true });
      s.fillPoly([[23, 56], [41, 56], [43, 16], [32, 7], [21, 16]], ICE.b);
      s.fillPoly([[23, 56], [29, 56], [28, 13], [21, 16]], ICE.l);
      s.fillPoly([[35, 56], [41, 56], [43, 16], [35, 11]], ICE.d);
      // spine seam
      s.line(32, 9, 32, 55, '#c8f4ff');
      s.line(31, 20, 31, 50, ICED.b);
      s.dither(26, 20, 12, 32, ICE.d, 1);
      // faint bands wrap around the sides
      s.line(24, 29, 28, 28, BANDS[0]); s.line(37, 28, 41, 27, BANDS[0]);
      s.line(23, 37, 27, 36, BANDS[1]); s.line(38, 36, 42, 35, BANDS[1]);
      s.line(24, 45, 28, 44, BANDS[2]); s.line(37, 44, 41, 43, BANDS[2]);
      // shoulder shards
      K.horn(s, 21, 33, -0.9, -0.45, 11, 3, ICED);
      K.horn(s, 43, 33, 0.9, -0.45, 11, 3, ICED);
      s.tri(12, 25, 15, 22, 15, 28, ICE.b);
      s.tri(52, 25, 49, 22, 49, 28, ICE.b);
    },
  });

  // ============ GHOST-FLAME LINE: Wickwisp -> Pyrelight ============
  const WAX = Px.ramp('#e8dfc8');
  const WAXD = Px.ramp('#c0b498');
  const FLM = Px.ramp('#f09030');
  const SPF = Px.ramp('#70d8c0');
  const IRN = Px.ramp('#4e4e60');

  Dex.add({
    id: 58, key: 'wickwisp', name: 'Wickwisp', types: ['Ghost', 'Fire'],
    base: { hp: 40, atk: 30, def: 40, spa: 70, spd: 55, spe: 40 },
    ability: 'flame_eater', catchRate: 140, expYield: 115, growth: 'medslow', gender: 50,
    evolve: { to: 'pyrelight', stone: 'ember_stone' },
    learn: [[1, 'astonish'], [1, 'cinder_shot'], [6, 'wisp_lure'], [10, 'lick'], [14, 'haunt'],
      [18, 'shade_sneak'], [22, 'cinder_curse'], [27, 'gloom_veil'], [32, 'fire_lance']],
    tms: ['tm02', 'tm05', 'tm11', 'tm17', 'hm05'],
    dex: { species: 'Candle Wisp', h: '0.4m', w: '2.4kg',
      entry: 'It is the stub of a candle that lit the old lodge for a hundred winters. Its face melted long ago; it keeps smiling anyway, more or less.' },
    cry: { base: 640, sweep: 0.95, wave: 'sine', dur: 0.45, vib: 20 },
    draw(s) {
      // melted wax pool base (it floats just above it)
      s.ball(32, 51, 9, 3, WAX, { flat: true });
      s.set(23, 52, WAXD.b); s.set(41, 52, WAXD.b);
      // candle body
      s.ball(32, 42, 8, 9, WAX);
      // dribbling wax runnels
      s.stroke(25, 46, 24, 51, 1, WAXD);
      s.stroke(39, 44, 40, 50, 1, WAXD);
      s.set(24, 53, WAXD.l); s.set(40, 52, WAXD.l);
      s.stroke(32, 34, 33, 37, 1, WAXD);
      // half-melted face: one droopy eye
      K.eye(s, 28, 40, 2, '#f09030');
      K.eye(s, 36, 43, 1, '#f09030');
      s.line(29, 46, 32, 45, INK);
      s.line(32, 45, 35, 47, INK);
      // wick + flame
      s.stroke(32, 32, 32, 30, 1, Px.ramp('#3a3038'));
      s.ball(32, 25, 4, 5, FLM, { flat: true });
      s.ball(32, 26, 2, 3, Px.ramp('#f8e8a0'), { flat: true });
      s.set(32, 19, FLM.b); s.set(33, 18, FLM.d);
      // ghostly aura motes
      s.set(26, 22, SPF.b); s.set(38, 23, SPF.b); s.set(24, 30, SPF.d); s.set(41, 33, SPF.d);
    },
    drawBack(s) {
      // Rear: smooth waxen back with long drips, flame peeking over the crown.
      s.ball(32, 51, 10, 3, WAX, { flat: true });
      s.ball(32, 42, 9, 10, WAX, { lx: 0, ly: -0.5 });
      // long back runnels
      s.stroke(27, 36, 26, 50, 1, WAXD);
      s.stroke(36, 34, 38, 49, 1, WAXD);
      s.stroke(32, 38, 32, 46, 1, WAXD);
      s.set(26, 52, WAXD.l); s.set(38, 51, WAXD.l);
      s.dither(27, 40, 11, 8, WAX.d, 1);
      // flame from behind
      s.stroke(32, 32, 32, 30, 1, Px.ramp('#3a3038'));
      s.ball(32, 25, 4, 5, FLM, { flat: true });
      s.ball(32, 26, 2, 2, FLM, { flat: true });
      s.set(32, 19, FLM.b);
      s.set(26, 23, SPF.b); s.set(39, 26, SPF.d);
    },
  });

  Dex.add({
    id: 59, key: 'pyrelight', name: 'Pyrelight', types: ['Ghost', 'Fire'],
    base: { hp: 60, atk: 50, def: 70, spa: 115, spd: 95, spe: 100 },
    ability: 'updraft', catchRate: 60, expYield: 204, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'astonish'], [1, 'cinder_shot'], [1, 'wisp_lure'], [1, 'lick'], [14, 'haunt'],
      [18, 'shade_sneak'], [24, 'cinder_curse'], [30, 'phantom_orb'], [36, 'fire_lance'],
      [44, 'heat_wave'], [52, 'inferno_burst']],
    tms: ['tm02', 'tm05', 'tm11', 'tm17', 'tm18', 'tm23', 'hm05'],
    dex: { species: 'Pyre Lantern', h: '1.1m', w: '18.5kg',
      entry: 'An iron mine-lantern that outlived every hand that carried it. It drifts the Irondeep galleries at shift-end, counting miners out — and grieving any short count.' },
    cry: { base: 340, sweep: 0.7, wave: 'sine', dur: 0.65, vib: 14, grit: 0.2 },
    draw(s) {
      // hanging ring
      s.set(31, 7, IRN.b); s.set(33, 7, IRN.b); s.set(30, 8, IRN.b); s.set(34, 8, IRN.b);
      s.set(30, 9, IRN.d); s.set(34, 9, IRN.d); s.set(31, 10, IRN.d); s.set(33, 10, IRN.d);
      // top cap
      s.tri(32, 11, 24, 19, 40, 19, IRN.b);
      s.line(24, 19, 32, 12, IRN.l);
      // glass belly with inner glow
      s.fillPoly([[24, 19], [40, 19], [42, 40], [22, 40]], Px.ramp('#f8d878').b);
      s.fillPoly([[25, 20], [39, 20], [40, 26], [24, 26]], Px.ramp('#fdeeb0').b);
      // ghost flame heart with a face
      s.ball(32, 31, 5, 6, SPF, { flat: true });
      s.ball(32, 33, 3, 4, Px.ramp('#c8f8e8'), { flat: true });
      s.set(32, 24, SPF.b); s.set(31, 22, SPF.d);
      s.set(30, 30, '#1c4038'); s.set(34, 30, '#1c4038');
      s.line(31, 34, 33, 34, '#1c4038');
      // cage bars
      s.line(27, 19, 26, 40, IRN.b);
      s.line(37, 19, 38, 40, IRN.b);
      s.line(23, 29, 41, 29, IRN.b);
      s.line(24, 19, 22, 40, IRN.d);
      s.line(40, 19, 42, 40, IRN.d);
      // base + finial
      s.fillPoly([[22, 40], [42, 40], [39, 44], [25, 44]], IRN.b);
      s.tri(29, 44, 35, 44, 32, 50, IRN.d);
      // ghost trail below
      s.set(32, 52, SPF.d); s.set(31, 54, SPF.d);
      // spectral flame arms
      s.stroke(22, 27, 14, 22, 2, SPF);
      s.set(11, 20, SPF.l); s.set(12, 24, SPF.d); s.set(9, 18, SPF.d);
      s.stroke(42, 27, 50, 22, 2, SPF);
      s.set(53, 20, SPF.l); s.set(52, 24, SPF.d); s.set(55, 18, SPF.d);
    },
    drawBack(s) {
      // Rear: iron back-plate of the cage — dim glow at the edges, no face.
      s.set(31, 7, IRN.b); s.set(33, 7, IRN.b); s.set(30, 8, IRN.b); s.set(34, 8, IRN.b);
      s.set(30, 9, IRN.d); s.set(34, 9, IRN.d); s.set(31, 10, IRN.d); s.set(33, 10, IRN.d);
      s.tri(32, 11, 23, 19, 41, 19, IRN.b);
      s.line(23, 19, 32, 12, IRN.l);
      // solid iron back panel with rivets
      s.fillPoly([[23, 19], [41, 19], [43, 40], [21, 40]], IRN.b);
      s.line(23, 19, 21, 40, IRN.l);
      s.line(41, 19, 43, 40, IRN.d);
      s.dither(25, 22, 14, 16, IRN.d, 1);
      s.set(26, 22, IRN.l); s.set(38, 22, IRN.l); s.set(26, 37, IRN.l); s.set(38, 37, IRN.l);
      // glow leaking around the edges
      s.set(22, 26, '#f8d878'); s.set(42, 26, '#f8d878'); s.set(22, 34, '#f8d878'); s.set(42, 34, '#f8d878');
      s.set(32, 15, SPF.b);
      // base + finial
      s.fillPoly([[21, 40], [43, 40], [39, 44], [25, 44]], IRN.b);
      s.tri(29, 44, 35, 44, 32, 50, IRN.d);
      s.set(32, 52, SPF.d); s.set(33, 54, SPF.d);
      // arms curling forward from the sides
      s.stroke(21, 27, 13, 23, 2, SPF);
      s.set(10, 21, SPF.l); s.set(11, 25, SPF.d);
      s.stroke(43, 27, 51, 23, 2, SPF);
      s.set(54, 21, SPF.l); s.set(53, 25, SPF.d);
    },
  });

  // ============ #60 Barrowght (standalone) ============
  const GRS = Px.ramp('#6a9848');
  const ERT = Px.ramp('#7a5c3c');
  const GLW = Px.ramp('#a0e858');

  Dex.add({
    id: 60, key: 'barrowght', name: 'Barrowght', types: ['Ghost', 'Ground'],
    base: { hp: 100, atk: 85, def: 90, spa: 55, spd: 85, spe: 50 },
    ability: 'looming_dread', catchRate: 60, expYield: 194, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'astonish'], [1, 'mud_fling'], [1, 'harden'], [8, 'lick'], [12, 'mud_shot'],
      [16, 'shade_sneak'], [22, 'haunt'], [28, 'burrow_strike'], [34, 'phantom_orb'],
      [42, 'earthshatter'], [50, 'shadow_maw']],
    tms: ['tm05', 'tm07', 'tm14', 'tm17', 'tm18', 'tm23', 'hm04', 'hm05', 'hm06'],
    dex: { species: 'Barrow Wight', h: '1.7m', w: '410.0kg',
      entry: 'What hikers map as a mossy knoll behind the old lodge is sometimes gone by morning. Whatever was buried beneath it walks with it, and wants its ring back.' },
    cry: { base: 150, sweep: 0.42, wave: 'sine', dur: 0.8, vib: 6, grit: 0.35, sub: true },
    draw(s) {
      // earthen skirt
      s.ball(32, 52, 16, 6, ERT, { flat: true });
      s.dither(18, 50, 28, 6, ERT.d, 1);
      // grassy mound dome
      s.ball(32, 43, 17, 12, GRS);
      s.dither(20, 36, 24, 12, GRS.d, 1);
      // grass tufts on the crest
      s.tri(21, 35, 23, 29, 25, 35, GRS.d);
      s.tri(30, 32, 32, 25, 34, 32, GRS.b);
      s.tri(39, 35, 41, 29, 43, 35, GRS.d);
      s.set(26, 31, GRS.l); s.set(37, 30, GRS.l);
      // half-buried rune stone
      s.ball(32, 50, 6, 5, BASE, { flat: true });
      s.set(30, 48, GLW.b); s.set(34, 48, GLW.b); s.set(32, 51, GLW.d);
      // sunken glowing eyes
      s.ball(25, 41, 3, 2, Px.ramp('#26202b'), { flat: true });
      s.ball(39, 41, 3, 2, Px.ramp('#26202b'), { flat: true });
      s.set(25, 41, GLW.b); s.set(26, 41, GLW.l);
      s.set(39, 41, GLW.b); s.set(40, 41, GLW.l);
      // earthen hands clawing out of the soil
      s.ball(13, 53, 3, 3, ERT);
      s.stroke(11, 50, 10, 47, 1, ERT); s.stroke(13, 50, 13, 46, 1, ERT); s.stroke(15, 50, 16, 47, 1, ERT);
      s.ball(51, 53, 3, 3, ERT);
      s.stroke(49, 50, 48, 47, 1, ERT); s.stroke(51, 50, 51, 46, 1, ERT); s.stroke(53, 50, 54, 47, 1, ERT);
      // grave-wisps
      s.set(16, 34, GLW.b); s.set(48, 31, GLW.b); s.set(44, 25, GLW.d);
    },
    drawBack(s) {
      // Rear: the barrow's stone-crowned back — kerb stones, tufts, no eyes.
      s.ball(32, 52, 17, 6, ERT, { flat: true });
      s.dither(17, 50, 30, 6, ERT.d, 0);
      s.ball(32, 42, 18, 13, GRS, { lx: 0, ly: -0.5 });
      s.dither(18, 34, 28, 14, GRS.d, 1);
      // kerb stones arcing over the crest
      s.ball(22, 36, 3, 2, BASE, { flat: true });
      s.ball(32, 32, 3, 2, BASE, { flat: true });
      s.ball(42, 36, 3, 2, BASE, { flat: true });
      s.ball(27, 33, 2, 2, BASE, { flat: true });
      s.ball(37, 33, 2, 2, BASE, { flat: true });
      // tufts
      s.tri(20, 40, 22, 34, 24, 40, GRS.d);
      s.tri(40, 40, 42, 34, 44, 40, GRS.d);
      s.tri(31, 30, 32, 24, 34, 30, GRS.b);
      // hands barely visible at the sides
      s.ball(13, 53, 3, 3, ERT, { lx: 0, ly: -0.4 });
      s.ball(51, 53, 3, 3, ERT, { lx: 0, ly: -0.4 });
      // wisps
      s.set(15, 32, GLW.b); s.set(49, 30, GLW.b); s.set(32, 20, GLW.d);
    },
  });

  // ============ STEEL LINE: Oreling -> Ingotaur ============
  const ORE = Px.ramp('#9aa4b4');
  const SHV = Px.ramp('#525c6c');
  const GLO = Px.ramp('#f8a030');
  const STL = Px.ramp('#b8c2d0');

  Dex.add({
    id: 61, key: 'oreling', name: 'Oreling', types: ['Steel', 'Rock'],
    base: { hp: 50, atk: 55, def: 80, spa: 30, spd: 45, spe: 30 },
    ability: 'static_wool', catchRate: 150, expYield: 121, growth: 'slow', gender: -1,
    evolve: { to: 'ingotaur', level: 28 },
    learn: [[1, 'tackle'], [1, 'harden'], [6, 'metal_claw'], [10, 'pebble_volley'], [14, 'rock_throw'],
      [18, 'static_touch'], [22, 'iron_ram'], [26, 'rock_tomb'], [30, 'shriek_of_tin']],
    tms: ['tm14', 'tm15', 'tm17', 'tm20', 'hm04', 'hm05', 'hm06'],
    dex: { species: 'Ore Nugget', h: '0.4m', w: '60.0kg',
      entry: 'It bristles with magnetic shavings that stand on end when a pick swings nearby. Irondeep crews rate a seam by how many Oreling doze inside it.' },
    cry: { base: 760, sweep: 0.8, wave: 'square', dur: 0.32, vib: 8, chirps: 1 },
    draw(s) {
      // stubby feet
      s.ball(26, 54, 3, 2, SHV, { flat: true });
      s.ball(38, 54, 3, 2, SHV, { flat: true });
      // chunky nugget body
      s.ball(32, 45, 10, 9, ORE);
      // angular facets
      s.tri(24, 42, 28, 38, 28, 46, ORE.d);
      s.tri(41, 43, 37, 39, 38, 47, ORE.l);
      // magnetic shaving crest
      K.horn(s, 24, 41, -0.8, -0.6, 5, 1.5, SHV);
      K.horn(s, 26, 38, -0.5, -0.9, 6, 1.5, SHV);
      K.horn(s, 32, 36, 0, -1, 7, 2, SHV);
      K.horn(s, 38, 38, 0.5, -0.9, 6, 1.5, SHV);
      K.horn(s, 40, 41, 0.8, -0.6, 5, 1.5, SHV);
      // ore glints
      s.set(27, 44, GLO.b); s.set(36, 49, GLO.b); s.set(30, 50, GLO.d);
      // static sparks
      s.set(19, 37, '#f8e048'); s.set(45, 36, '#f8e048'); s.set(21, 34, '#f8e048');
      // face
      K.eye(s, 28, 45, 2, '#f0a030');
      K.eye(s, 36, 45, 2, '#f0a030');
      s.line(31, 49, 33, 49, INK);
      K.cheek(s, 24, 47, SHV.l); K.cheek(s, 39, 47, SHV.l);
    },
    drawBack(s) {
      // Rear: a hedgehog of iron filings over the nugget, glints, no face.
      s.ball(26, 55, 3, 2, SHV, { flat: true });
      s.ball(38, 55, 3, 2, SHV, { flat: true });
      s.ball(32, 45, 11, 10, ORE, { lx: 0, ly: -0.5 });
      s.tri(26, 48, 30, 44, 29, 51, ORE.d);
      // filings cover the whole back
      K.horn(s, 23, 44, -0.9, -0.4, 5, 1.5, SHV);
      K.horn(s, 25, 40, -0.6, -0.8, 6, 1.5, SHV);
      K.horn(s, 29, 37, -0.2, -1, 7, 2, SHV);
      K.horn(s, 35, 37, 0.2, -1, 7, 2, SHV);
      K.horn(s, 39, 40, 0.6, -0.8, 6, 1.5, SHV);
      K.horn(s, 41, 44, 0.9, -0.4, 5, 1.5, SHV);
      K.horn(s, 32, 42, 0, -1, 5, 1.5, SHV);
      s.set(28, 47, GLO.b); s.set(37, 45, GLO.b); s.set(32, 51, GLO.d);
      s.set(18, 38, '#f8e048'); s.set(46, 39, '#f8e048');
    },
  });

  Dex.add({
    id: 62, key: 'ingotaur', name: 'Ingotaur', types: ['Steel', 'Rock'],
    base: { hp: 85, atk: 120, def: 110, spa: 45, spd: 80, spe: 60 },
    ability: 'hearth_core', catchRate: 45, expYield: 208, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'metal_claw'], [14, 'rock_throw'], [18, 'static_touch'],
      [24, 'iron_ram'], [28, 'rock_tomb'], [32, 'slab_breaker'], [36, 'comet_fist'],
      [42, 'rock_slide'], [48, 'anchor_slam'], [55, 'stone_spike']],
    tms: ['tm07', 'tm08', 'tm14', 'tm15', 'tm17', 'tm20', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Ingot Minotaur', h: '2.1m', w: '740.0kg',
      entry: 'Smelted slab by slab in a forge nobody remembers firing, it still glows along every seam. It guards the deepest gallery of Irondeep, horns lowered.' },
    cry: { base: 180, sweep: 0.45, wave: 'sawtooth', dur: 0.72, vib: 5, grit: 0.55, sub: true },
    draw(s) {
      // legs
      s.limb(26, 48, 25, 57, 4, 4, SHV);
      s.limb(38, 48, 39, 57, 4, 4, SHV);
      s.line(22, 57, 28, 57, IRN.d); s.line(36, 57, 42, 57, IRN.d);
      // pelvis slab
      s.ball(32, 46, 9, 4, ORE, { flat: true });
      // stacked slab torso with forge-glow seams
      s.fillPoly([[21, 40], [43, 40], [42, 46], [22, 46]], ORE.b);
      s.fillPoly([[20, 33], [44, 33], [43, 40], [21, 40]], ORE.l);
      s.fillPoly([[22, 26], [42, 26], [44, 33], [20, 33]], ORE.b);
      s.line(21, 40, 43, 40, GLO.b);
      s.line(20, 33, 44, 33, GLO.b);
      s.set(32, 33, GLO.l); s.set(28, 40, GLO.l);
      s.dither(24, 27, 16, 5, ORE.d, 1);
      // core glow
      s.ball(32, 37, 2, 2, GLO, { flat: true });
      // shoulders + massive arms
      s.ball(18, 26, 6, 5, SHV);
      s.ball(46, 26, 6, 5, SHV);
      s.limb(17, 28, 10, 42, 5, 5, ORE);
      s.limb(47, 28, 54, 42, 5, 5, ORE);
      s.ball(10, 45, 5, 4, SHV, { lx: -0.3, ly: -0.4 });
      s.ball(54, 45, 5, 4, SHV, { lx: -0.3, ly: -0.4 });
      s.set(8, 43, GLO.b); s.set(52, 43, GLO.b); // knuckle glow
      // anvil head
      s.ball(32, 18, 8, 7, SHV);
      s.ball(32, 22, 5, 3, ORE, { flat: true });
      s.set(30, 22, GLO.b); s.set(34, 22, GLO.b); // nostril vents
      // steel horns
      s.stroke(25, 15, 19, 12, 2, STL);
      s.stroke(19, 12, 18, 8, 2, STL);
      s.stroke(39, 15, 45, 12, 2, STL);
      s.stroke(45, 12, 46, 8, 2, STL);
      // glowing eyes
      s.rect(28, 15, 2, 2, '#f8a030');
      s.rect(35, 15, 2, 2, '#f8a030');
      s.line(27, 14, 29, 13, IRN.d); s.line(36, 13, 38, 14, IRN.d);
    },
    drawBack(s) {
      // Rear: riveted slab back, dimmer seams, horns past the head, fists at sides.
      s.limb(26, 48, 25, 58, 4, 4, SHV);
      s.limb(38, 48, 39, 58, 4, 4, SHV);
      s.ball(32, 46, 10, 4, ORE, { flat: true });
      s.fillPoly([[20, 40], [44, 40], [43, 47], [21, 47]], ORE.b);
      s.fillPoly([[19, 33], [45, 33], [44, 40], [20, 40]], ORE.l);
      s.fillPoly([[21, 25], [43, 25], [45, 33], [19, 33]], ORE.b);
      s.line(20, 40, 44, 40, GLO.d);
      s.line(19, 33, 45, 33, GLO.d);
      // rivets
      s.set(24, 29, SHV.l); s.set(40, 29, SHV.l); s.set(23, 36, SHV.l); s.set(41, 36, SHV.l);
      s.set(24, 43, SHV.l); s.set(40, 43, SHV.l);
      s.dither(24, 26, 17, 6, ORE.d, 0);
      // vent slits down the spine
      s.rect(31, 28, 2, 3, IRN.d); s.rect(31, 35, 2, 3, IRN.d); s.rect(31, 42, 2, 3, IRN.d);
      // shoulders + arms
      s.ball(18, 25, 6, 5, SHV, { lx: 0, ly: -0.5 });
      s.ball(46, 25, 6, 5, SHV, { lx: 0, ly: -0.5 });
      s.limb(16, 28, 10, 42, 5, 5, ORE);
      s.limb(48, 28, 54, 42, 5, 5, ORE);
      s.ball(10, 45, 5, 4, SHV, { lx: 0, ly: -0.5 });
      s.ball(54, 45, 5, 4, SHV, { lx: 0, ly: -0.5 });
      // back of anvil head + horns
      s.ball(32, 17, 8, 7, SHV, { lx: 0, ly: -0.5 });
      s.ball(32, 16, 5, 4, Px.ramp('#3e4450'), { flat: true });
      s.stroke(25, 14, 19, 11, 2, STL);
      s.stroke(19, 11, 18, 7, 2, STL);
      s.stroke(39, 14, 45, 11, 2, STL);
      s.stroke(45, 11, 46, 7, 2, STL);
    },
  });

  // ============ #63 Loadstork (standalone) ============
  const MAG = Px.ramp('#d84838');
  const BLT = Px.ramp('#8a94a4');

  Dex.add({
    id: 63, key: 'loadstork', name: 'Loadstork', types: ['Steel', 'Flying'],
    base: { hp: 65, atk: 80, def: 95, spa: 60, spd: 75, spe: 85 },
    ability: 'updraft', catchRate: 60, expYield: 192, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'peck'], [1, 'leer'], [1, 'harden'], [8, 'wind_gust'], [12, 'quick_jab'],
      [16, 'steel_wing'], [22, 'wing_strike'], [28, 'sky_cutter'], [34, 'gale_blade'],
      [40, 'iron_ram'], [46, 'chrome_cannon']],
    tms: ['tm16', 'tm17', 'tm20', 'tm21', 'hm02', 'hm05'],
    dex: { species: 'Magnetite Stork', h: '1.5m', w: '44.0kg',
      entry: 'It wades the flooded levels of Irondeep on girder-straight legs, its magnet bill hoisting dropped bolts. Nests near Tidegrot Cave are held together by nothing but pull.' },
    cry: { base: 540, sweep: 0.88, wave: 'sawtooth', dur: 0.5, vib: 15, chirps: 2 },
    draw(s) {
      // girder legs with cross-braces
      s.limb(28, 42, 26, 56, 1.5, 1.5, SHV);
      s.limb(36, 42, 38, 56, 1.5, 1.5, SHV);
      s.set(26, 47, STL.l); s.set(28, 49, STL.l); s.set(37, 47, STL.l); s.set(36, 50, STL.l);
      s.line(23, 57, 29, 57, SHV.d);
      s.line(35, 57, 41, 57, SHV.d);
      // body
      s.ball(32, 36, 11, 7, STL);
      // folded plate wing
      s.ball(35, 34, 7, 5, BLT, { flat: true });
      s.line(30, 32, 40, 34, SHV.b);
      s.line(31, 36, 41, 37, SHV.b);
      // tail plates
      s.tri(42, 33, 50, 29, 44, 39, BLT.b);
      s.line(49, 30, 44, 36, SHV.d);
      // rivets on body
      s.set(28, 36, STL.h); s.set(33, 39, STL.h);
      // S-curve neck
      s.stroke(26, 34, 21, 26, 2, STL);
      s.stroke(21, 26, 23, 18, 2, STL);
      // head
      s.ball(25, 15, 5, 4, STL);
      s.set(27, 11, SHV.b); s.set(28, 10, SHV.d); // little crest
      // U-magnet beak: two prongs with pale tips
      s.stroke(21, 14, 13, 15, 1.5, MAG);
      s.stroke(21, 18, 14, 20, 1.5, MAG);
      s.rect(11, 14, 2, 2, STL.h);
      s.rect(12, 19, 2, 2, STL.h);
      // floating bolt caught in the field
      s.ball(8, 17, 2, 2, BLT, { flat: true });
      s.set(8, 17, BLT.l);
      s.set(6, 14, '#f8e048'); s.set(10, 21, '#f8e048'); s.set(5, 19, '#f8e048');
      // eye
      K.eye(s, 27, 14, 1, '#f8d040');
    },
    drawBack(s) {
      // Rear: plated back and tail toward camera, neck rising away, beak hidden.
      s.limb(28, 42, 26, 57, 1.5, 1.5, SHV);
      s.limb(36, 42, 38, 57, 1.5, 1.5, SHV);
      s.set(27, 48, STL.l); s.set(37, 49, STL.l);
      s.line(23, 58, 29, 58, SHV.d);
      s.line(35, 58, 41, 58, SHV.d);
      s.ball(32, 36, 12, 8, STL, { lx: 0, ly: -0.5 });
      // both folded wings visible from behind
      s.ball(25, 34, 6, 5, BLT, { flat: true });
      s.ball(39, 34, 6, 5, BLT, { flat: true });
      s.line(21, 32, 29, 35, SHV.b);
      s.line(35, 35, 43, 32, SHV.b);
      // tail fanning toward camera
      s.tri(32, 40, 26, 50, 38, 50, BLT.b);
      s.line(29, 46, 35, 46, SHV.d);
      // spine rivets
      s.set(32, 31, STL.h); s.set(32, 35, STL.h);
      // neck away + back of head
      s.stroke(30, 32, 27, 24, 2, STL);
      s.stroke(27, 24, 28, 16, 2, STL);
      s.ball(28, 13, 5, 4, STL, { lx: 0, ly: -0.5 });
      s.set(29, 9, SHV.b); s.set(30, 8, SHV.d);
      // magnet prong tips just peeking past the head
      s.set(23, 12, MAG.b); s.set(22, 12, MAG.d);
      s.set(24, 16, MAG.b); s.set(23, 17, MAG.d);
      // stray spark
      s.set(19, 10, '#f8e048');
    },
  });
})();
