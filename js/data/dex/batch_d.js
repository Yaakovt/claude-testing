'use strict';
/** Batch D (dex #64-#81): aurora highlands, dusk & folklore. */
(() => {
  const K = SpriteKit;

  // ============ WISPURR / MYSTRIX (mystic lynx) ============
  const LYNX = Px.ramp('#a292c8');
  const LYNXD = Px.ramp('#6d5e96');
  const LCREAM = Px.ramp('#eee6d8');
  const AURT = Px.ramp('#5ee0c8');
  const AURV = Px.ramp('#9b7ff0');
  const AURP = Px.ramp('#f48fd0');
  const MOON = Px.ramp('#f8d878');

  Dex.add({
    id: 64, key: 'wispurr', name: 'Wispurr', types: ['Psychic'],
    base: { hp: 40, atk: 30, def: 35, spa: 65, spd: 50, spe: 50 },
    ability: 'clear_mind', catchRate: 190, expYield: 112, growth: 'medfast', gender: 50,
    evolve: { to: 'mystrix', level: 28 },
    learn: [[1, 'scratch'], [1, 'growl'], [5, 'confusion'], [9, 'quick_jab'], [13, 'psybeam'],
      [17, 'charm'], [21, 'quickening'], [25, 'mind_crush'], [29, 'dream_pulse']],
    tms: ['tm04', 'tm09', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Moonspot Kit', h: '0.4m', w: '4.1kg',
      entry: 'It naps on dusk roads where the aurora first touches the heather. The moon-mark on its brow brightens when it dreams.' },
    cry: { base: 780, sweep: 0.9, wave: 'sine', dur: 0.35, vib: 20, chirps: 2 },
    draw(s) {
      // curled tail on the right
      s.stroke(40, 50, 48, 44, 3, LYNX);
      s.ball(49, 41, 3, 3, LYNXD, { flat: true });
      // sitting body
      s.ball(32, 46, 9, 9, LYNX);
      s.ball(32, 50, 6, 5, LCREAM, { flat: true });
      // front paws
      s.limb(28, 50, 27, 56, 2, 2, LYNX);
      s.limb(36, 50, 37, 56, 2, 2, LYNX);
      // big head
      s.ball(32, 33, 10, 9, LYNX);
      // huge tufted ears
      K.horn(s, 24, 27, -0.4, -1, 11, 4, LYNX);
      K.horn(s, 40, 27, 0.4, -1, 11, 4, LYNX);
      s.set(20, 15, LYNXD.d); s.set(44, 15, LYNXD.d); // tuft tips
      s.tri(23, 26, 27, 22, 26, 27, LYNXD.b);
      s.tri(41, 26, 37, 22, 38, 27, LYNXD.b);
      // moon spot on forehead
      s.set(32, 27, MOON.b); s.set(31, 27, MOON.l); s.set(32, 26, MOON.l);
      // face
      K.eye(s, 27, 34, 2, '#48d8c0');
      K.eye(s, 37, 34, 2, '#48d8c0');
      s.ball(32, 38, 3, 2, LCREAM, { flat: true });
      s.set(32, 37, '#1a1418');
      K.smile(s, 32, 39, 1);
      K.cheek(s, 23, 37, AURP.b); K.cheek(s, 40, 37, AURP.b);
    },
    drawBack(s) {
      // Rear: round back, ear backs with tufts, tail curling into view.
      s.ball(32, 45, 10, 10, LYNX, { lx: 0, ly: -0.5 });
      s.ball(32, 44, 7, 7, LYNXD, { flat: true });
      s.dither(26, 40, 12, 9, LYNX.d, 1);
      // back of head
      s.ball(32, 32, 10, 9, LYNX, { lx: 0, ly: -0.5 });
      s.ball(32, 30, 7, 5, LYNXD, { flat: true });
      // ears from behind
      K.horn(s, 24, 26, -0.4, -1, 11, 4, LYNXD);
      K.horn(s, 40, 26, 0.4, -1, 11, 4, LYNXD);
      s.set(20, 14, LYNXD.d); s.set(44, 14, LYNXD.d);
      // moon glow peeking over crown
      s.set(32, 24, MOON.d);
      // tail curls around the left toward camera
      s.stroke(26, 52, 16, 48, 3, LYNX);
      s.ball(14, 45, 3, 3, LYNXD, { flat: true });
      // haunches
      s.ball(24, 50, 4, 5, LYNX, { flat: true });
      s.ball(40, 50, 4, 5, LYNX, { flat: true });
    },
  });

  Dex.add({
    id: 65, key: 'mystrix', name: 'Mystrix', types: ['Psychic'],
    base: { hp: 70, atk: 55, def: 60, spa: 115, spd: 85, spe: 110 },
    ability: 'clear_mind', catchRate: 75, expYield: 206, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'growl'], [1, 'confusion'], [9, 'quick_jab'], [13, 'psybeam'],
      [18, 'charm'], [23, 'quickening'], [28, 'mind_crush'], [34, 'psi_blade'], [40, 'mesmerize'],
      [46, 'mind_temper'], [52, 'dream_pulse']],
    tms: ['tm04', 'tm05', 'tm09', 'tm17', 'tm18', 'tm21', 'tm23', 'tm25', 'hm05'],
    dex: { species: 'Aurora Lynx', h: '1.4m', w: '38.0kg',
      entry: 'Its ear-tassels stream ribbons of living light across the Lumenveil highlands. Herders read tomorrow\'s weather in their colors.' },
    cry: { base: 520, sweep: 0.75, wave: 'sine', dur: 0.5, vib: 16 },
    draw(s) {
      // ear tassels streaming back-left (drawn first, behind head)
      s.stroke(24, 14, 10, 10, 2, AURT);
      s.stroke(24, 14, 8, 16, 2, AURV);
      s.stroke(30, 12, 16, 4, 2, AURP);
      // lean standing body
      s.ball(28, 38, 13, 9, LYNX);
      // hind leg
      s.ball(20, 42, 5, 6, LYNX, { flat: true });
      s.limb(19, 46, 17, 56, 3, 2, LYNX);
      s.limb(27, 46, 27, 56, 3, 2, LYNXD);
      // front legs
      s.limb(37, 44, 36, 56, 3, 2, LYNX);
      s.limb(42, 43, 45, 56, 3, 2, LYNXD);
      // chest ruff
      s.ball(39, 39, 5, 6, LCREAM, { flat: true });
      s.dither(36, 35, 7, 6, LCREAM.l);
      // bob tail
      s.stroke(16, 34, 11, 29, 2, LYNX);
      s.ball(10, 27, 2, 2, LYNXD, { flat: true });
      // neck + head high on the right
      s.limb(40, 34, 44, 26, 5, 4, LYNX);
      s.ball(44, 23, 8, 7, LYNX);
      // tufted ears with tassel roots
      K.horn(s, 39, 17, -0.5, -1, 8, 3, LYNX);
      K.horn(s, 49, 17, 0.4, -1, 8, 3, LYNX);
      s.set(35, 9, LYNXD.d); s.set(52, 9, LYNXD.d);
      // moon crescent on brow
      s.set(44, 18, MOON.b); s.set(43, 19, MOON.l); s.set(45, 19, MOON.l);
      // aurora eyes
      K.eye(s, 41, 23, 2, '#48d8c0');
      K.eye(s, 48, 23, 2, '#9b7ff0');
      // muzzle
      s.ball(45, 27, 3, 2, LCREAM, { flat: true });
      s.set(46, 26, '#1a1418');
      // cheek fur spikes
      s.tri(37, 24, 33, 27, 38, 27, LYNXD.b);
      // flank marking
      s.set(24, 36, LYNXD.b); s.set(27, 38, LYNXD.b); s.set(23, 40, LYNXD.b);
    },
    drawBack(s) {
      // Rear: haunches to camera, tassels streaming toward viewer-right, spine stripe.
      s.ball(32, 40, 14, 11, LYNX, { lx: 0, ly: -0.5 });
      // spine stripe + flank marks
      s.line(32, 30, 32, 48, LYNXD.b);
      s.set(26, 38, LYNXD.b); s.set(38, 38, LYNXD.b); s.set(24, 43, LYNXD.b); s.set(40, 43, LYNXD.b);
      // haunches + legs
      s.ball(22, 44, 6, 7, LYNX, { flat: true });
      s.ball(42, 44, 6, 7, LYNX, { flat: true });
      s.limb(21, 49, 20, 57, 3, 2, LYNXD);
      s.limb(43, 49, 44, 57, 3, 2, LYNXD);
      // bob tail toward camera
      s.stroke(32, 48, 34, 55, 2, LYNX);
      s.ball(35, 56, 2, 2, LYNXD, { flat: true });
      // back of head
      s.ball(32, 24, 8, 7, LYNX, { lx: 0, ly: -0.5 });
      s.ball(32, 23, 5, 4, LYNXD, { flat: true });
      K.horn(s, 27, 18, -0.5, -1, 8, 3, LYNXD);
      K.horn(s, 37, 18, 0.5, -1, 8, 3, LYNXD);
      // tassels streaming outward
      s.stroke(24, 12, 12, 8, 2, AURT);
      s.stroke(24, 12, 14, 16, 2, AURV);
      s.stroke(40, 12, 52, 8, 2, AURP);
      s.stroke(40, 12, 50, 16, 2, AURT);
    },
  });

  // ============ NOKKOLT / NOKKMARE (nixie horse) ============
  const NOKK = Px.ramp('#33415e');
  const NOKKD = Px.ramp('#1f2940');
  const RIVER = Px.ramp('#58c8d8');
  const NEYE = '#c8f0e8';

  Dex.add({
    id: 66, key: 'nokkolt', name: 'Nokkolt', types: ['Water', 'Dark'],
    base: { hp: 50, atk: 55, def: 40, spa: 50, spd: 40, spe: 50 },
    ability: 'rain_racer', catchRate: 160, expYield: 119, growth: 'medslow', gender: 50,
    evolve: { to: 'nokkmare', level: 30 },
    learn: [[1, 'tackle'], [1, 'leer'], [5, 'splash_jet'], [9, 'cheap_shot'], [13, 'bubble_beam'],
      [17, 'snarl'], [21, 'aqua_jet'], [25, 'bite'], [29, 'aqua_tail']],
    tms: ['tm03', 'tm12', 'tm17', 'tm23', 'tm25', 'hm03', 'hm07'],
    dex: { species: 'River Foal', h: '0.9m', w: '31.5kg',
      entry: 'It grazes by fords at dusk, always dripping though it never rains. Children are told never to accept a ride.' },
    cry: { base: 400, sweep: 0.65, wave: 'triangle', dur: 0.45, vib: 14 },
    draw(s) {
      // small foal body
      s.ball(30, 40, 11, 7, NOKK);
      // legs (thin, knobby)
      s.limb(23, 44, 22, 56, 2, 2, NOKK);
      s.limb(28, 45, 28, 56, 2, 2, NOKKD);
      s.limb(35, 45, 34, 56, 2, 2, NOKK);
      s.limb(39, 44, 41, 56, 2, 2, NOKKD);
      // neck + head
      s.limb(38, 36, 42, 28, 4, 3, NOKK);
      s.ball(43, 25, 5, 4, NOKK);
      s.ball(47, 27, 3, 2, NOKKD, { flat: true }); // muzzle
      // dripping mane down the neck
      s.stroke(38, 22, 33, 34, 2, RIVER);
      s.set(34, 37, RIVER.b); s.set(35, 40, RIVER.d); // drips
      s.set(31, 30, RIVER.l);
      // forelock drip over face
      s.stroke(42, 20, 40, 26, 1, RIVER);
      s.set(40, 28, RIVER.d);
      // ears
      K.horn(s, 40, 21, -0.3, -1, 4, 2, NOKK);
      K.horn(s, 45, 21, 0.3, -1, 4, 2, NOKK);
      // glowing pale eye
      K.eye(s, 44, 25, 2, NEYE);
      // wet tail dripping
      s.stroke(20, 38, 15, 47, 2, RIVER);
      s.set(14, 50, RIVER.d); s.set(16, 52, RIVER.d);
      // belly droplet marks
      s.set(27, 44, RIVER.d); s.set(32, 45, RIVER.d);
    },
    drawBack(s) {
      // Rear: rump to camera, dripping tail prominent, mane over far side.
      s.ball(32, 42, 10, 9, NOKK, { lx: 0, ly: -0.5 });
      s.limb(26, 48, 25, 57, 2, 2, NOKKD);
      s.limb(38, 48, 39, 57, 2, 2, NOKKD);
      s.limb(28, 46, 27, 55, 2, 2, NOKK);
      s.limb(36, 46, 37, 55, 2, 2, NOKK);
      // spine drip-line
      s.line(32, 34, 32, 46, RIVER.d);
      // wet tail toward camera
      s.stroke(32, 44, 36, 54, 2, RIVER);
      s.set(37, 56, RIVER.d); s.set(35, 57, RIVER.d);
      // neck + back of head rising away
      s.limb(30, 36, 28, 26, 4, 3, NOKK);
      s.ball(28, 23, 5, 4, NOKK, { lx: 0, ly: -0.5 });
      K.horn(s, 25, 19, -0.3, -1, 4, 2, NOKKD);
      K.horn(s, 31, 19, 0.3, -1, 4, 2, NOKKD);
      // mane drips down the neck's near side
      s.stroke(31, 21, 34, 33, 2, RIVER);
      s.set(35, 36, RIVER.b); s.set(36, 39, RIVER.d);
    },
  });

  Dex.add({
    id: 67, key: 'nokkmare', name: 'Nokkmare', types: ['Water', 'Dark'],
    base: { hp: 85, atk: 100, def: 70, spa: 85, spd: 70, spe: 95 },
    ability: 'rain_racer', catchRate: 60, expYield: 210, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [1, 'splash_jet'], [1, 'cheap_shot'], [13, 'bubble_beam'],
      [18, 'snarl'], [23, 'aqua_jet'], [28, 'bite'], [34, 'aqua_tail'], [40, 'crunch'],
      [46, 'surf'], [52, 'shadow_maw'], [58, 'deluge_cannon']],
    tms: ['tm03', 'tm12', 'tm13', 'tm17', 'tm18', 'tm23', 'tm25', 'hm03', 'hm04', 'hm07'],
    dex: { species: 'Nixie Horse', h: '1.8m', w: '96.0kg',
      entry: 'A horse poured from black river-water. Its mane falls upward like an inverted falls, and riders who mount it are never seen ashore again.' },
    cry: { base: 220, sweep: 0.5, wave: 'sawtooth', dur: 0.65, vib: 8, grit: 0.4, sub: true },
    draw(s) {
      // upward-flowing mane (behind neck) — inverted waterfall
      s.stroke(36, 20, 32, 6, 2, RIVER);
      s.stroke(39, 18, 38, 4, 2, RIVER);
      s.stroke(33, 24, 27, 10, 2, RIVER);
      s.set(31, 3, RIVER.l); s.set(37, 2, RIVER.l); s.set(25, 7, RIVER.l);
      s.set(34, 8, RIVER.h); s.set(40, 10, RIVER.h);
      // powerful body
      s.ball(28, 38, 14, 9, NOKK);
      // legs
      s.limb(19, 43, 16, 57, 3, 2, NOKK);
      s.limb(25, 45, 25, 57, 3, 2, NOKKD);
      s.limb(35, 45, 34, 57, 3, 2, NOKK);
      s.limb(40, 42, 44, 57, 3, 2, NOKKD);
      // water hooves
      s.ball(16, 57, 2, 2, RIVER, { flat: true }); s.ball(44, 57, 2, 2, RIVER, { flat: true });
      // arched neck + head
      s.limb(38, 34, 43, 22, 6, 4, NOKK);
      s.ball(44, 19, 6, 5, NOKK);
      s.limb(48, 21, 52, 24, 3, 2, NOKKD); // muzzle
      // mane continues up from crest
      s.stroke(42, 14, 44, 3, 2, RIVER);
      s.set(45, 1, RIVER.l);
      // ears
      K.horn(s, 41, 14, -0.3, -1, 5, 2, NOKK);
      K.horn(s, 47, 14, 0.4, -1, 5, 2, NOKK);
      // glowing pale eyes
      K.eye(s, 45, 19, 2, NEYE);
      s.set(52, 23, RIVER.d); // dripping muzzle
      // upward tail-spray
      s.stroke(15, 36, 9, 26, 2, RIVER);
      s.set(8, 23, RIVER.l); s.set(11, 21, RIVER.d);
      // river seams on flank
      s.line(22, 36, 30, 42, RIVER.d);
      s.set(25, 43, RIVER.d); s.set(33, 40, RIVER.d);
      // chest froth
      s.dither(36, 38, 6, 5, NOKKD.b, 1);
    },
    drawBack(s) {
      // Rear: broad rump, mane geyser rising over the far head, tail-spray toward camera.
      s.ball(32, 40, 13, 11, NOKK, { lx: 0, ly: -0.5 });
      s.limb(24, 47, 21, 58, 3, 2, NOKKD);
      s.limb(40, 47, 43, 58, 3, 2, NOKKD);
      s.limb(27, 45, 26, 56, 3, 2, NOKK);
      s.limb(37, 45, 38, 56, 3, 2, NOKK);
      // spine river-seam
      s.line(32, 30, 32, 46, RIVER.d);
      s.set(27, 38, RIVER.d); s.set(37, 38, RIVER.d);
      // tail-spray rising toward camera-right
      s.stroke(38, 42, 46, 30, 2, RIVER);
      s.set(48, 27, RIVER.l); s.set(45, 25, RIVER.d);
      // neck + back of head
      s.limb(30, 34, 27, 22, 6, 4, NOKK);
      s.ball(27, 18, 6, 5, NOKK, { lx: 0, ly: -0.5 });
      K.horn(s, 23, 13, -0.4, -1, 5, 2, NOKKD);
      K.horn(s, 30, 13, 0.4, -1, 5, 2, NOKKD);
      // inverted-falls mane rising from crest
      s.stroke(26, 13, 24, 2, 2, RIVER);
      s.stroke(29, 15, 32, 4, 2, RIVER);
      s.stroke(23, 17, 18, 7, 2, RIVER);
      s.set(17, 4, RIVER.l); s.set(33, 2, RIVER.l); s.set(25, 1, RIVER.h);
    },
  });

  // ============ FROSTKIT / VULPAURA (aurora fox) ============
  const SNOW = Px.ramp('#e4ecf4');
  const SNOWD = Px.ramp('#a8bfd4');
  const FROST = Px.ramp('#8fd6ec');

  Dex.add({
    id: 68, key: 'frostkit', name: 'Frostkit', types: ['Ice'],
    base: { hp: 40, atk: 40, def: 35, spa: 55, spd: 45, spe: 50 },
    ability: 'snow_skater', catchRate: 200, expYield: 110, growth: 'fast', gender: 50,
    evolve: { to: 'vulpaura', stone: 'aurora_stone' },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'frost_dust'], [9, 'quick_jab'], [13, 'ice_shard'],
      [17, 'charm'], [21, 'ice_fang'], [25, 'icicle_crash'], [29, 'glacier_ray']],
    tms: ['tm03', 'tm13', 'tm17', 'tm21', 'tm25'],
    dex: { species: 'Arctic Kit', h: '0.4m', w: '5.2kg',
      entry: 'Its frost-tipped tail leaves a line of rime wherever it drags. Trappers follow the sparkle to find safe paths over thin ice.' },
    cry: { base: 820, sweep: 0.85, wave: 'square', dur: 0.3, vib: 14, chirps: 2 },
    draw(s) {
      // fluffy tail curled around the right, frost tip
      s.stroke(40, 50, 48, 46, 4, SNOW);
      s.ball(50, 42, 4, 4, FROST, { flat: true });
      s.set(50, 39, FROST.l); s.set(52, 41, FROST.l);
      // sitting body
      s.ball(31, 47, 8, 8, SNOW);
      // front paws
      s.limb(27, 51, 26, 56, 2, 2, SNOW);
      s.limb(35, 51, 36, 56, 2, 2, SNOWD);
      // head
      s.ball(31, 35, 9, 8, SNOW);
      // pointy ears
      s.tri(24, 31, 22, 21, 30, 28, SNOW.b);
      s.tri(38, 31, 40, 21, 32, 28, SNOW.b);
      s.tri(24, 29, 23, 24, 28, 28, SNOWD.d);
      s.tri(38, 29, 39, 24, 34, 28, SNOWD.d);
      // face
      K.eye(s, 27, 35, 2, '#4898d8');
      K.eye(s, 35, 35, 2, '#4898d8');
      s.ball(31, 39, 3, 2, SNOWD, { flat: true });
      s.set(31, 38, '#1a1418');
      K.smile(s, 31, 40, 1);
      K.cheek(s, 23, 38, FROST.b); K.cheek(s, 39, 38, FROST.b);
      // frost dusting on crown
      s.set(29, 28, FROST.l); s.set(33, 28, FROST.l); s.set(31, 27, FROST.b);
      // chest fluff
      s.dither(28, 44, 7, 4, SNOW.h);
    },
    drawBack(s) {
      // Rear: fluffy back, ear backs, frost tail sweeping toward camera.
      s.ball(31, 46, 9, 9, SNOW, { lx: 0, ly: -0.5 });
      s.ball(31, 45, 6, 6, SNOWD, { flat: true });
      s.dither(26, 41, 11, 8, SNOW.d, 1);
      // back of head
      s.ball(31, 34, 9, 8, SNOW, { lx: 0, ly: -0.5 });
      // ears from behind (dark backs)
      s.tri(24, 30, 22, 20, 30, 27, SNOWD.b);
      s.tri(38, 30, 40, 20, 32, 27, SNOWD.b);
      // frost dust on crown + spine
      s.set(31, 28, FROST.b); s.set(29, 30, FROST.l);
      s.line(31, 38, 31, 46, SNOWD.d);
      // tail curls around the left, frosted tip forward
      s.stroke(24, 52, 14, 48, 4, SNOW);
      s.ball(12, 44, 4, 4, FROST, { flat: true });
      s.set(11, 41, FROST.l); s.set(14, 42, FROST.h);
    },
  });

  Dex.add({
    id: 69, key: 'vulpaura', name: 'Vulpaura', types: ['Ice', 'Fairy'],
    base: { hp: 70, atk: 50, def: 65, spa: 110, spd: 95, spe: 105 },
    ability: 'snow_skater', catchRate: 75, expYield: 206, growth: 'fast', gender: 50,
    evolve: null,
    learn: [[1, 'frost_dust'], [1, 'charm'], [1, 'fae_wind'], [1, 'quick_jab'], [13, 'ice_shard'],
      [18, 'glimmer_kiss'], [24, 'icicle_crash'], [30, 'prism_flare'], [36, 'glacier_ray'],
      [43, 'moonveil_blast'], [50, 'whiteout'], [56, 'starlight_heal']],
    tms: ['tm03', 'tm09', 'tm13', 'tm16', 'tm17', 'tm21', 'tm25', 'hm05'],
    dex: { species: 'Aurora Fox', h: '1.1m', w: '26.5kg',
      entry: 'When it fans its banded tails the sky answers in the same colors. Highland folk say the northern lights are Vulpaura counting its tails.' },
    cry: { base: 600, sweep: 1.1, wave: 'sine', dur: 0.55, vib: 24 },
    draw(s) {
      // fanned aurora tails behind (5 tails, banded teal/violet/pink)
      const fan = [[10, 22, AURT], [19, 12, AURV], [32, 8, AURP], [45, 12, AURV], [54, 22, AURT]];
      for (const [tx, ty, R] of fan) {
        s.stroke(32, 42, (32 + tx) / 2, (42 + ty) / 2, 4, SNOW);
        s.stroke((32 + tx) / 2, (42 + ty) / 2, tx, ty, 3, R);
        s.ball(tx, ty - 1, 3, 3, R, { flat: true });
        s.set(tx, ty - 4, R.l);
      }
      // band seams
      s.set(21, 30, AURV.l); s.set(32, 25, AURP.l); s.set(43, 30, AURV.l);
      // elegant sitting body
      s.ball(32, 43, 9, 11, SNOW);
      s.dither(28, 38, 9, 5, SNOW.h);
      // front legs
      s.limb(28, 48, 27, 57, 2, 2, SNOW);
      s.limb(36, 48, 37, 57, 2, 2, SNOWD);
      // haunches
      s.ball(24, 48, 4, 5, SNOW, { flat: true });
      s.ball(40, 48, 4, 5, SNOW, { flat: true });
      // head
      s.ball(32, 27, 8, 7, SNOW);
      // long ears
      s.tri(25, 24, 22, 13, 30, 21, SNOW.b);
      s.tri(39, 24, 42, 13, 34, 21, SNOW.b);
      s.tri(25, 22, 24, 16, 28, 21, AURV.d);
      s.tri(39, 22, 40, 16, 36, 21, AURV.d);
      // face
      K.eye(s, 28, 27, 2, '#48d8c0');
      K.eye(s, 36, 27, 2, '#48d8c0');
      s.ball(32, 31, 3, 2, SNOWD, { flat: true });
      s.set(32, 30, '#1a1418');
      K.smile(s, 32, 32, 1);
      // crown gem-frost
      s.set(32, 21, AURP.b); s.set(31, 22, AURT.l); s.set(33, 22, AURV.l);
      // chest ruff
      s.tri(26, 36, 32, 44, 38, 36, SNOW.h);
    },
    drawBack(s) {
      // Rear: the tail fan dominates, seen from behind; back of head below it.
      const fan = [[8, 24, AURT], [17, 12, AURV], [32, 7, AURP], [47, 12, AURV], [56, 24, AURT]];
      for (const [tx, ty, R] of fan) {
        s.stroke(32, 40, (32 + tx) / 2, (40 + ty) / 2, 4, SNOW);
        s.stroke((32 + tx) / 2, (40 + ty) / 2, tx, ty, 4, R);
        s.ball(tx, ty - 1, 4, 4, R, { flat: true });
        s.set(tx, ty - 5, R.l);
      }
      s.set(20, 28, AURV.l); s.set(32, 22, AURP.l); s.set(44, 28, AURV.l);
      // body from behind
      s.ball(32, 45, 10, 10, SNOW, { lx: 0, ly: -0.5 });
      s.ball(32, 46, 7, 7, SNOWD, { flat: true });
      s.dither(27, 42, 11, 8, SNOW.d, 1);
      s.ball(24, 50, 4, 5, SNOW, { flat: true });
      s.ball(40, 50, 4, 5, SNOW, { flat: true });
      // back of head
      s.ball(32, 31, 8, 7, SNOW, { lx: 0, ly: -0.5 });
      s.tri(25, 28, 22, 17, 30, 25, SNOWD.b);
      s.tri(39, 28, 42, 17, 34, 25, SNOWD.b);
      s.set(32, 26, AURP.d);
    },
  });

  // ============ TROLLTOAD (standalone bruiser) ============
  const TOAD = Px.ramp('#6f8c3e');
  const TOADD = Px.ramp('#4a6230');
  const TBELLY = Px.ramp('#c9b3d8');
  const WART = Px.ramp('#8a5aa8');

  Dex.add({
    id: 70, key: 'trolltoad', name: 'Trolltoad', types: ['Poison', 'Fighting'],
    base: { hp: 95, atk: 100, def: 80, spa: 45, spd: 75, spe: 65 },
    ability: 'thorn_coat', catchRate: 75, expYield: 192, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'leer'], [5, 'venom_barb'], [9, 'rock_smash'], [13, 'sludge'],
      [17, 'muscle_flex'], [22, 'sweep_kick'], [27, 'fang_of_rot'], [32, 'slab_breaker'],
      [38, 'sludge_blast'], [44, 'ooze_shell'], [50, 'all_out_assault']],
    tms: ['tm06', 'tm08', 'tm10', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Bridge Troll', h: '1.3m', w: '88.0kg',
      entry: 'It squats beneath dusk-road bridges and demands a toll of berries. Those who refuse are knuckle-rolled into the ditch.' },
    cry: { base: 160, sweep: 0.45, wave: 'square', dur: 0.6, vib: 6, grit: 0.5, sub: true },
    draw(s) {
      // squat wide body
      s.ball(32, 40, 15, 12, TOAD);
      // pale warty belly
      s.ball(32, 45, 9, 7, TBELLY, { flat: true });
      s.dither(26, 42, 12, 5, TBELLY.d, 1);
      // squat hind legs
      s.ball(20, 49, 5, 5, TOAD, { flat: true });
      s.ball(44, 49, 5, 5, TOAD, { flat: true });
      K.claws(s, 17, 54, 3, TBELLY.b); K.claws(s, 42, 54, 3, TBELLY.b);
      // massive knuckle-walking arms
      s.limb(21, 34, 12, 50, 4, 5, TOAD);
      s.limb(43, 34, 52, 50, 4, 5, TOAD);
      s.ball(12, 52, 5, 4, WART, { lx: -0.3, ly: -0.5 });
      s.ball(52, 52, 5, 4, WART, { lx: -0.3, ly: -0.5 });
      K.claws(s, 9, 55, 3, TBELLY.b); K.claws(s, 50, 55, 3, TBELLY.b);
      // brow ridge + wide face on the body
      s.ball(32, 29, 12, 6, TOAD, { flat: true });
      s.ball(25, 25, 4, 3, TOADD, { flat: true });
      s.ball(39, 25, 4, 3, TOADD, { flat: true });
      K.eye(s, 25, 25, 2, '#e8b030');
      K.eye(s, 39, 25, 2, '#e8b030');
      K.brow(s, 25, 22, 2); K.brow(s, 40, 22, 2);
      // wide grumpy mouth with snaggle fangs
      s.line(24, 33, 32, 35, '#1a1418'); s.line(32, 35, 40, 33, '#1a1418');
      s.tri(26, 33, 28, 33, 27, 31, '#fff');
      s.tri(36, 33, 38, 33, 37, 31, '#fff');
      // warts
      s.set(20, 36, WART.b); s.set(27, 30, WART.b); s.set(44, 37, WART.b);
      s.set(37, 29, WART.l); s.set(23, 41, WART.d); s.set(41, 42, WART.d);
      s.set(32, 21, WART.b); s.set(31, 20, WART.l);
    },
    drawBack(s) {
      // Rear: warty humped back, knuckle arms planted wide, no face.
      s.ball(32, 38, 16, 13, TOAD, { lx: 0, ly: -0.5 });
      // dark hump + wart field
      s.ball(32, 34, 11, 8, TOADD, { flat: true });
      s.dither(24, 30, 17, 12, TOAD.d, 1);
      s.set(26, 32, WART.b); s.set(38, 30, WART.b); s.set(32, 37, WART.b);
      s.set(22, 39, WART.d); s.set(42, 40, WART.d); s.set(30, 26, WART.l);
      // hind legs
      s.ball(21, 49, 5, 5, TOAD, { flat: true });
      s.ball(43, 49, 5, 5, TOAD, { flat: true });
      // knuckle arms
      s.limb(20, 33, 11, 50, 4, 5, TOAD);
      s.limb(44, 33, 53, 50, 4, 5, TOAD);
      s.ball(11, 52, 5, 4, WART, { lx: 0, ly: -0.5 });
      s.ball(53, 52, 5, 4, WART, { lx: 0, ly: -0.5 });
      // head ridge from behind
      s.ball(32, 26, 10, 4, TOAD, { flat: true });
      s.ball(26, 23, 4, 3, TOADD, { flat: true });
      s.ball(38, 23, 4, 3, TOADD, { flat: true });
    },
  });

  // ============ MAMMOROST (fossil) ============
  const MAMM = Px.ramp('#9cb8cc');
  const MAMMD = Px.ramp('#5c7a94');
  const TUSK = Px.ramp('#e8f4fa');
  const CREV = Px.ramp('#2c4a66');

  Dex.add({
    id: 71, key: 'mammorost', name: 'Mammorost', types: ['Ice', 'Ground'],
    base: { hp: 105, atk: 100, def: 95, spa: 55, spd: 80, spe: 60 },
    ability: 'blubber', catchRate: 45, expYield: 206, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'frost_dust'], [7, 'mud_shot'], [13, 'ice_shard'],
      [19, 'bulldoze'], [25, 'ice_fang'], [31, 'icicle_crash'], [37, 'burrow_strike'],
      [43, 'glacier_ray'], [49, 'earthshatter'], [55, 'whiteout']],
    tms: ['tm03', 'tm07', 'tm13', 'tm14', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Frost Mammoth', h: '2.4m', w: '480.0kg',
      entry: 'Revived from a tusk locked in Glacier Cavern ice. The crevasse marks on its flanks deepen each winter, as if the glacier still remembers it.' },
    cry: { base: 140, sweep: 0.4, wave: 'sawtooth', dur: 0.8, vib: 5, grit: 0.35, sub: true },
    draw(s) {
      // massive shaggy body
      s.ball(33, 34, 17, 15, MAMM);
      s.ball(33, 22, 12, 8, MAMM, { flat: true }); // humped crown
      // shaggy skirt
      s.dither(19, 42, 29, 7, MAMMD.b, 1);
      for (let i = 0; i < 7; i++) s.tri(20 + i * 4, 48, 24 + i * 4, 48, 22 + i * 4, 52, MAMMD.b);
      // pillar legs
      s.limb(23, 46, 22, 57, 4, 4, MAMMD);
      s.limb(43, 46, 44, 57, 4, 4, MAMMD);
      s.limb(30, 48, 30, 57, 3, 3, MAMM);
      s.limb(38, 48, 38, 57, 3, 3, MAMM);
      // crevasse markings on flank
      s.line(22, 30, 26, 36, CREV.b); s.line(26, 36, 24, 41, CREV.b);
      s.line(44, 28, 41, 35, CREV.b); s.line(41, 35, 44, 40, CREV.b);
      s.set(23, 26, CREV.d); s.set(45, 24, CREV.d);
      // face low on the body
      K.eye(s, 27, 27, 2, '#385878');
      K.eye(s, 39, 27, 2, '#385878');
      s.ball(33, 34, 5, 4, MAMMD, { flat: true }); // muzzle base
      // trunk hanging down
      s.limb(33, 36, 32, 48, 3, 2, MAMM);
      s.limb(32, 48, 35, 52, 2, 2, MAMMD);
      // icicle tusks curving up-outward
      s.stroke(26, 36, 18, 42, 2, TUSK);
      s.stroke(18, 42, 13, 36, 2, TUSK);
      s.set(12, 33, TUSK.h); s.set(13, 34, TUSK.l);
      s.stroke(40, 36, 48, 42, 2, TUSK);
      s.stroke(48, 42, 53, 36, 2, TUSK);
      s.set(54, 33, TUSK.h); s.set(53, 34, TUSK.l);
      // small fuzzy ears
      s.ball(19, 20, 3, 4, MAMMD, { flat: true });
      s.ball(47, 20, 3, 4, MAMMD, { flat: true });
      // snow cap on crown
      s.dither(26, 15, 14, 4, TUSK.b);
      s.set(33, 13, TUSK.l);
    },
    drawBack(s) {
      // Rear: shaggy humped back with crevasse scars, tusk tips peeking past the head.
      s.ball(33, 34, 18, 16, MAMM, { lx: 0, ly: -0.5 });
      s.ball(33, 24, 13, 9, MAMM, { flat: true });
      // dark saddle + long fur
      s.ball(33, 34, 12, 10, MAMMD, { flat: true });
      s.dither(22, 26, 23, 18, MAMM.d, 1);
      for (let i = 0; i < 7; i++) s.tri(21 + i * 4, 48, 25 + i * 4, 48, 23 + i * 4, 53, MAMMD.b);
      // crevasse scars down the spine
      s.line(33, 18, 31, 28, CREV.b); s.line(31, 28, 34, 38, CREV.b);
      s.line(25, 30, 27, 38, CREV.d); s.line(41, 30, 39, 38, CREV.d);
      // legs
      s.limb(23, 46, 22, 58, 4, 4, MAMMD);
      s.limb(43, 46, 44, 58, 4, 4, MAMMD);
      // little tail tuft
      s.stroke(33, 46, 33, 52, 1, MAMMD);
      s.ball(33, 53, 2, 2, CREV, { flat: true });
      // ears + tusk tips visible past the silhouette
      s.ball(18, 22, 3, 4, MAMMD, { flat: true });
      s.ball(48, 22, 3, 4, MAMMD, { flat: true });
      s.stroke(15, 34, 11, 28, 2, TUSK);
      s.stroke(51, 34, 55, 28, 2, TUSK);
      s.set(10, 26, TUSK.l); s.set(56, 26, TUSK.l);
      // snow on the hump
      s.dither(27, 16, 12, 4, TUSK.b);
    },
  });

  // ============ CHIMEBUD / BELLSYLPH (carillon fae) ============
  const BELL = Px.ramp('#7a8ee8');
  const BELLD = Px.ramp('#5361b8');
  const STEM = Px.ramp('#5da24e');
  const FCREAM = Px.ramp('#f4ecd8');

  Dex.add({
    id: 72, key: 'chimebud', name: 'Chimebud', types: ['Fairy', 'Grass'],
    base: { hp: 45, atk: 30, def: 45, spa: 60, spd: 55, spe: 35 },
    ability: 'moss_mend', catchRate: 210, expYield: 112, growth: 'medfast', gender: 50,
    evolve: { to: 'bellsylph', stone: 'verdant_stone' },
    learn: [[1, 'fae_wind'], [1, 'growl'], [6, 'vine_lash'], [10, 'sugar_kiss'], [14, 'razor_leaf'],
      [18, 'glimmer_kiss'], [22, 'numb_spore'], [26, 'seed_bomb'], [30, 'photomend']],
    tms: ['tm09', 'tm17', 'tm19', 'tm24', 'hm05'],
    dex: { species: 'Bluebell Bud', h: '0.3m', w: '1.8kg',
      entry: 'It hangs from its own crooked stem among the harebells and rings softly at moonrise. Only the wind can tell which flower is listening.' },
    cry: { base: 880, sweep: 1.2, wave: 'sine', dur: 0.35, vib: 10, chirps: 3 },
    draw(s) {
      // crooked stem hook it dangles from
      s.stroke(30, 34, 30, 24, 1, STEM);
      s.stroke(30, 24, 35, 19, 1, STEM);
      s.stroke(35, 19, 40, 22, 1, STEM);
      K.leaf(s, 41, 21, 5, STEM);
      // sepal cap
      s.ball(30, 35, 6, 3, STEM, { flat: true });
      s.tri(24, 35, 27, 35, 25, 39, STEM.d);
      s.tri(33, 35, 36, 35, 35, 39, STEM.d);
      // dangling bell body
      s.ball(30, 43, 8, 9, BELL);
      // scalloped bell hem
      for (let i = 0; i < 4; i++) s.tri(23 + i * 5, 51, 28 + i * 5, 51, 25 + i * 5, 55, BELLD.b);
      s.dither(25, 47, 11, 4, BELL.l);
      // leaf arms
      K.leaf(s, 37, 44, 5, STEM);
      for (let i = 0; i < 5; i++) { // mirrored left leaf
        const w = Math.max(0, Math.round(Math.sin((i / 5) * Math.PI) * 2));
        for (let j = -w; j <= w; j++) s.set(23 - i, 45 - i + j, j < 0 ? STEM.l : STEM.b);
      }
      // sleepy face on the bell
      K.eye(s, 27, 42, 2, '#f4e8a8');
      K.eye(s, 34, 42, 2, '#f4e8a8');
      K.smile(s, 30, 46, 1);
      K.cheek(s, 23, 44, AURP.b); K.cheek(s, 37, 44, AURP.b);
      // clapper glow under the hem
      s.set(30, 56, MOON.b); s.set(30, 57, MOON.d);
    },
    drawBack(s) {
      // Rear: bell seen from behind — vein seams, sepals, stem hook; no face.
      s.stroke(31, 33, 31, 23, 1, STEM);
      s.stroke(31, 23, 26, 18, 1, STEM);
      s.stroke(26, 18, 21, 21, 1, STEM);
      K.leaf(s, 20, 20, 5, STEM);
      s.ball(31, 34, 6, 3, STEM, { flat: true });
      s.tri(26, 34, 29, 34, 27, 38, STEM.d);
      s.tri(34, 34, 37, 34, 36, 38, STEM.d);
      // bell body from behind (darker, veined)
      s.ball(31, 43, 9, 10, BELL, { lx: 0, ly: -0.5 });
      s.line(31, 36, 31, 52, BELLD.d);
      s.line(25, 38, 24, 50, BELLD.d);
      s.line(37, 38, 38, 50, BELLD.d);
      for (let i = 0; i < 4; i++) s.tri(24 + i * 5, 52, 29 + i * 5, 52, 26 + i * 5, 56, BELLD.b);
      // leaf arms peeking
      K.leaf(s, 38, 43, 4, STEM);
      s.set(22, 44, STEM.b); s.set(21, 43, STEM.l);
      s.set(31, 57, MOON.d);
    },
  });

  Dex.add({
    id: 73, key: 'bellsylph', name: 'Bellsylph', types: ['Fairy', 'Grass'],
    base: { hp: 75, atk: 50, def: 70, spa: 105, spd: 110, spe: 70 },
    ability: 'dream_dust', catchRate: 90, expYield: 200, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'fae_wind'], [1, 'vine_lash'], [1, 'sugar_kiss'], [1, 'growl'], [14, 'razor_leaf'],
      [20, 'glimmer_kiss'], [26, 'drowse_spore'], [32, 'prism_flare'], [38, 'verdant_orb'],
      [44, 'moonveil_blast'], [50, 'starlight_heal'], [56, 'sunpierce']],
    tms: ['tm09', 'tm11', 'tm17', 'tm19', 'tm21', 'tm24', 'hm05'],
    dex: { species: 'Carillon Sylph', h: '1.2m', w: '9.5kg',
      entry: 'It drifts over aurora fields, its skirt of bell-flowers pealing a lullaby. Whole caravans have slept sweetly through the coldest nights.' },
    cry: { base: 660, sweep: 1.3, wave: 'sine', dur: 0.6, vib: 26, chirps: 2 },
    draw(s) {
      // floating: skirt of bell-flowers (wide cone), hovering above ground
      s.fillPoly([[27, 26], [37, 26], [46, 48], [18, 48]], BELL.b);
      s.fillPoly([[27, 26], [32, 26], [24, 48], [18, 48]], BELL.l);
      s.line(32, 28, 30, 47, BELLD.b);
      s.line(37, 27, 41, 47, BELLD.b);
      // hanging bell-flowers along the hem
      for (let i = 0; i < 5; i++) {
        const bx = 20 + i * 6;
        s.ball(bx, 49, 2, 3, i % 2 ? BELLD : BELL, { flat: true });
        s.set(bx, 53, MOON.b);
      }
      // torso
      s.ball(32, 24, 6, 7, FCREAM);
      // petal sleeves (ringing, flared)
      K.leaf(s, 40, 24, 6, STEM);
      s.tri(38, 22, 47, 18, 44, 27, BELL.b);
      for (let i = 0; i < 6; i++) { // mirrored left petal sleeve
        const w = Math.max(0, Math.round(Math.sin((i / 6) * Math.PI) * 2.4));
        for (let j = -w; j <= w; j++) s.set(25 - i, 23 - i + j, j < 0 ? STEM.l : STEM.b);
      }
      s.tri(26, 22, 17, 18, 20, 27, BELL.b);
      // head with sepal-petal crown
      s.ball(32, 13, 6, 6, FCREAM);
      s.tri(26, 10, 24, 3, 30, 8, STEM.b);
      s.tri(38, 10, 40, 3, 34, 8, STEM.b);
      s.ball(32, 7, 4, 2, STEM, { flat: true });
      s.set(32, 4, MOON.b);
      // serene face
      K.eye(s, 29, 13, 2, '#5361b8');
      K.eye(s, 35, 13, 2, '#5361b8');
      K.smile(s, 32, 17, 1);
      K.cheek(s, 26, 15, AURP.b); K.cheek(s, 38, 15, AURP.b);
      // chime sparkles
      s.set(14, 44, MOON.l); s.set(50, 42, MOON.l); s.set(48, 30, '#ffffff');
    },
    drawBack(s) {
      // Rear: skirt from behind with vein seams, crown petals, hair-cap; no face.
      s.fillPoly([[27, 26], [37, 26], [47, 48], [17, 48]], BELL.b);
      s.line(32, 27, 32, 47, BELLD.d);
      s.line(26, 28, 22, 47, BELLD.b);
      s.line(38, 28, 42, 47, BELLD.b);
      s.dither(24, 34, 16, 12, BELL.l, 1);
      for (let i = 0; i < 5; i++) {
        const bx = 19 + i * 6;
        s.ball(bx, 49, 2, 3, i % 2 ? BELLD : BELL, { flat: true });
        s.set(bx, 53, MOON.d);
      }
      // torso + petal sleeves flaring outward
      s.ball(32, 24, 7, 7, FCREAM, { lx: 0, ly: -0.5 });
      s.tri(38, 22, 48, 17, 44, 27, BELL.d);
      s.tri(26, 22, 16, 17, 20, 27, BELL.d);
      K.leaf(s, 41, 23, 5, STEM);
      // back of head: cream cap + crown petals
      s.ball(32, 13, 6, 6, FCREAM, { lx: 0, ly: -0.5 });
      s.ball(32, 12, 5, 4, STEM, { flat: true });
      s.tri(26, 10, 24, 3, 30, 7, STEM.d);
      s.tri(38, 10, 40, 3, 34, 7, STEM.d);
      s.set(32, 4, MOON.d);
      s.set(15, 43, MOON.l); s.set(49, 45, MOON.l);
    },
  });

  // ============ ZAPKID / THUNDRAM (storm goats) ============
  const WOOL = Px.ramp('#f0e2a4');
  const GOAT = Px.ramp('#8a6a44');
  const STORMW = Px.ramp('#6a7290');
  const STORMD = Px.ramp('#454b68');
  const VOLT = Px.ramp('#f8d838');

  Dex.add({
    id: 74, key: 'zapkid', name: 'Zapkid', types: ['Electric'],
    base: { hp: 45, atk: 50, def: 40, spa: 60, spd: 40, spe: 45 },
    ability: 'static_wool', catchRate: 205, expYield: 117, growth: 'medfast', gender: 50,
    evolve: { to: 'thundram', level: 26 },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'spark_nip'], [9, 'static_touch'], [13, 'quick_jab'],
      [17, 'spark_tackle'], [21, 'static_snare'], [25, 'howl'], [29, 'storm_bolt']],
    tms: ['tm01', 'tm12', 'tm17', 'tm21', 'tm25', 'hm04', 'hm05'],
    dex: { species: 'Static Kid', h: '0.6m', w: '14.0kg',
      entry: 'Its wool stands on end with stored charge. Shearing one calls for wooden combs and a great deal of nerve.' },
    cry: { base: 560, sweep: 0.8, wave: 'square', dur: 0.35, vib: 18, chirps: 1 },
    draw(s) {
      // wool body puffed with static spikes
      s.ball(30, 42, 11, 9, WOOL);
      for (let i = 0; i < 5; i++) K.horn(s, 22 + i * 4, 34, (i - 2) * 0.25, -1, 4, 2, WOOL);
      K.horn(s, 19, 40, -1, -0.3, 4, 2, WOOL);
      K.horn(s, 41, 40, 1, -0.3, 4, 2, WOOL);
      // slender legs
      s.limb(24, 48, 23, 56, 2, 2, GOAT);
      s.limb(29, 49, 29, 56, 2, 2, GOAT);
      s.limb(35, 49, 35, 56, 2, 2, GOAT);
      s.limb(40, 48, 41, 56, 2, 2, GOAT);
      s.set(22, 57, STORMD.b); s.set(28, 57, STORMD.b); s.set(34, 57, STORMD.b); s.set(41, 57, STORMD.b);
      // head out the right side
      s.ball(41, 32, 6, 6, GOAT);
      // wool cap
      s.ball(39, 27, 5, 3, WOOL, { flat: true });
      K.horn(s, 37, 25, -0.4, -1, 4, 2, WOOL);
      K.horn(s, 42, 25, 0.3, -1, 4, 2, WOOL);
      // nub horns
      s.set(36, 26, VOLT.b); s.set(45, 25, VOLT.b);
      // floppy ear
      s.tri(34, 31, 30, 34, 35, 35, GOAT.d);
      // face
      K.eye(s, 41, 32, 2, '#f8d838');
      s.ball(45, 35, 2, 2, GOAT, { flat: true });
      s.set(46, 34, '#1a1418');
      K.smile(s, 44, 37, 1);
      // static sparks around the wool
      s.set(17, 34, VOLT.b); s.set(31, 27, VOLT.l); s.set(44, 42, VOLT.b);
      s.set(16, 45, VOLT.l); s.set(26, 30, VOLT.b);
      // tiny tail tuft
      K.horn(s, 18, 44, -1, -0.5, 3, 2, WOOL);
    },
    drawBack(s) {
      // Rear: static wool cloud from behind, tail tuft toward camera, ear backs.
      s.ball(31, 41, 12, 10, WOOL, { lx: 0, ly: -0.5 });
      for (let i = 0; i < 5; i++) K.horn(s, 23 + i * 4, 33, (i - 2) * 0.25, -1, 4, 2, WOOL);
      K.horn(s, 20, 39, -1, -0.3, 4, 2, WOOL);
      K.horn(s, 42, 39, 1, -0.3, 4, 2, WOOL);
      s.dither(25, 38, 13, 8, WOOL.d, 1);
      // legs
      s.limb(25, 48, 24, 57, 2, 2, GOAT);
      s.limb(31, 49, 31, 57, 2, 2, GOAT);
      s.limb(37, 49, 37, 57, 2, 2, GOAT);
      s.limb(41, 48, 42, 57, 2, 2, GOAT);
      // tail tuft toward camera
      K.horn(s, 32, 47, 0, 1, 5, 3, WOOL);
      s.set(32, 53, VOLT.b);
      // back of head peeking over wool at upper-left
      s.ball(23, 30, 5, 5, GOAT, { lx: 0, ly: -0.5 });
      s.ball(24, 27, 4, 3, WOOL, { flat: true });
      s.tri(19, 30, 15, 33, 20, 34, GOAT.d);
      s.set(21, 24, VOLT.b); s.set(27, 24, VOLT.b);
      // sparks
      s.set(16, 36, VOLT.l); s.set(45, 34, VOLT.b); s.set(36, 26, VOLT.l);
    },
  });

  Dex.add({
    id: 75, key: 'thundram', name: 'Thundram', types: ['Electric', 'Fighting'],
    base: { hp: 80, atk: 105, def: 75, spa: 70, spd: 65, spe: 95 },
    ability: 'static_wool', catchRate: 75, expYield: 204, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'spark_nip'], [9, 'static_touch'], [13, 'quick_jab'],
      [18, 'spark_tackle'], [22, 'static_snare'], [26, 'blur_punch'], [30, 'headbutt'],
      [35, 'storm_bolt'], [41, 'slab_breaker'], [47, 'sky_fury'], [53, 'volt_crash']],
    tms: ['tm01', 'tm08', 'tm12', 'tm15', 'tm17', 'tm25', 'hm04', 'hm05', 'hm06'],
    dex: { species: 'Thunder Ram', h: '1.5m', w: '82.0kg',
      entry: 'It stamps the high passes until thunderheads gather to answer. Its horns are said to be bolts that struck twice and stayed.' },
    cry: { base: 240, sweep: 0.55, wave: 'sawtooth', dur: 0.6, vib: 10, grit: 0.45, sub: true },
    draw(s) {
      // storm-cloud wool mass over shoulders and back
      s.ball(28, 32, 13, 9, STORMW);
      s.ball(20, 36, 7, 6, STORMW, { flat: true });
      s.ball(36, 28, 8, 6, STORMW, { flat: true });
      s.dither(18, 26, 24, 12, STORMW.l, 1);
      for (let i = 0; i < 5; i++) K.horn(s, 18 + i * 5, 25, (i - 2) * 0.2, -1, 4, 2, STORMW);
      // dark body under the wool
      s.ball(31, 42, 12, 8, STORMD);
      // stomping stance: near foreleg raised
      s.limb(40, 44, 45, 50, 3, 2, STORMD);
      s.limb(45, 50, 44, 53, 2, 2, STORMD); // raised, hoof up
      s.limb(36, 46, 37, 57, 3, 2, STORMD);
      s.limb(22, 46, 20, 57, 3, 2, STORMD);
      s.limb(27, 47, 27, 57, 3, 2, STORMW);
      s.set(19, 58, VOLT.b); s.set(37, 58, VOLT.b); // sparking hooves
      // head lowered, ready to ram
      s.ball(44, 34, 7, 6, STORMD);
      s.ball(44, 30, 6, 3, STORMW, { flat: true }); // wool brow
      // lightning-bolt horns (zigzag)
      s.line(40, 27, 36, 23, VOLT.b); s.line(36, 23, 39, 19, VOLT.b);
      s.line(39, 19, 35, 14, VOLT.b); s.set(35, 13, VOLT.l); s.set(36, 15, VOLT.d);
      s.line(48, 27, 52, 23, VOLT.b); s.line(52, 23, 49, 19, VOLT.b);
      s.line(49, 19, 53, 14, VOLT.b); s.set(53, 13, VOLT.l); s.set(52, 15, VOLT.d);
      // fierce face
      K.eye(s, 43, 34, 2, '#f8d838');
      K.brow(s, 43, 31, 2);
      s.ball(49, 37, 2, 2, STORMD, { flat: true });
      s.set(50, 36, '#1a1418');
      s.line(46, 39, 49, 39, '#1a1418');
      // charge sparks in the wool
      s.set(22, 28, VOLT.b); s.set(31, 24, VOLT.l); s.set(16, 34, VOLT.b);
      s.set(38, 25, VOLT.b); s.set(26, 33, VOLT.l);
      // tail tuft
      K.horn(s, 18, 42, -1, -0.4, 4, 2, STORMW);
    },
    drawBack(s) {
      // Rear: thundercloud wool from behind, bolt-horn tips past the head, stomping legs.
      s.ball(31, 34, 14, 11, STORMW, { lx: 0, ly: -0.5 });
      s.ball(31, 30, 10, 6, STORMW, { flat: true });
      s.dither(20, 26, 23, 14, STORMW.d, 1);
      for (let i = 0; i < 6; i++) K.horn(s, 18 + i * 5, 25, (i - 2.5) * 0.2, -1, 4, 2, STORMW);
      // dark rump
      s.ball(31, 44, 11, 7, STORMD, { lx: 0, ly: -0.5 });
      // legs
      s.limb(24, 48, 22, 58, 3, 2, STORMD);
      s.limb(38, 48, 40, 58, 3, 2, STORMD);
      s.limb(28, 47, 27, 56, 3, 2, STORMD);
      s.limb(35, 47, 36, 56, 3, 2, STORMD);
      s.set(21, 59, VOLT.b); s.set(41, 59, VOLT.b);
      // tail tuft toward camera
      K.horn(s, 31, 48, 0, 1, 5, 3, STORMW);
      s.set(31, 54, VOLT.b);
      // back of lowered head just visible over the wool, bolt horns flaring
      s.ball(31, 22, 6, 4, STORMD, { flat: true });
      s.line(26, 21, 22, 17, VOLT.b); s.line(22, 17, 25, 13, VOLT.b);
      s.line(25, 13, 21, 8, VOLT.b); s.set(21, 7, VOLT.l);
      s.line(36, 21, 40, 17, VOLT.b); s.line(40, 17, 37, 13, VOLT.b);
      s.line(37, 13, 41, 8, VOLT.b); s.set(41, 7, VOLT.l);
      // sparks
      s.set(17, 30, VOLT.b); s.set(44, 32, VOLT.l); s.set(31, 27, VOLT.b);
    },
  });

  // ============ CORVUSK / GRIMCORVID (doom ravens) ============
  const RAVEN = Px.ramp('#3d4258');
  const RAVEND = Px.ramp('#262a3c');
  const BONE = Px.ramp('#e8e4d4');
  const COIN = Px.ramp('#e8c048');
  const SHEEN = Px.ramp('#7a68b0');

  Dex.add({
    id: 76, key: 'corvusk', name: 'Corvusk', types: ['Dark', 'Flying'],
    base: { hp: 40, atk: 55, def: 40, spa: 40, spd: 40, spe: 55 },
    ability: 'hunter_eye', catchRate: 190, expYield: 112, growth: 'medfast', gender: 50,
    evolve: { to: 'grimcorvid', level: 31 },
    learn: [[1, 'peck'], [1, 'leer'], [5, 'cheap_shot'], [9, 'wind_gust'], [13, 'wing_strike'],
      [17, 'snarl'], [21, 'bite'], [25, 'sky_cutter'], [29, 'night_slash']],
    tms: ['tm16', 'tm17', 'tm18', 'tm21', 'tm23', 'hm02'],
    dex: { species: 'Masked Raven', h: '0.5m', w: '3.6kg',
      entry: 'It wears the bleached mask of a bird that came before it. Dusk-road travelers count them: one for secrets, two for storms.' },
    cry: { base: 480, sweep: 0.6, wave: 'square', dur: 0.4, vib: 12, grit: 0.3, chirps: 1 },
    draw(s) {
      // tail feathers down-left
      s.fillPoly([[26, 46], [20, 56], [26, 55], [30, 48]], RAVEND.b);
      s.line(21, 55, 26, 48, RAVEND.d);
      // plump perched body
      s.ball(32, 42, 9, 11, RAVEN);
      // folded wing on the near side
      s.fillPoly([[26, 36], [24, 50], [31, 52], [34, 40]], RAVEND.b);
      s.line(26, 38, 26, 49, SHEEN.d);
      s.set(28, 44, SHEEN.b); s.set(29, 48, SHEEN.d);
      // head
      s.ball(35, 28, 7, 6, RAVEN);
      // bone-white beak mask over the face
      s.ball(38, 28, 5, 4, BONE, { flat: true });
      s.tri(42, 26, 49, 28, 42, 31, BONE.b);
      s.line(43, 30, 47, 29, BONE.d);
      s.set(41, 24, BONE.l);
      // eye peering through the mask
      K.eye(s, 38, 27, 2, '#e8c048');
      // mask brow notch
      s.line(35, 24, 38, 23, RAVEND.d);
      // feet gripping
      s.limb(29, 52, 28, 57, 2, 1, RAVEND);
      s.limb(36, 52, 37, 57, 2, 1, RAVEND);
      K.claws(s, 26, 58, 2, BONE.d); K.claws(s, 36, 58, 2, BONE.d);
      // chest speckles
      s.set(34, 38, SHEEN.b); s.set(31, 41, SHEEN.d);
    },
    drawBack(s) {
      // Rear: folded wings crossed over the back, tail toward camera, mask edge past the head.
      s.ball(32, 41, 10, 12, RAVEN, { lx: 0, ly: -0.5 });
      // wing backs
      s.fillPoly([[24, 34], [22, 52], [31, 54], [32, 36]], RAVEND.b);
      s.fillPoly([[40, 34], [42, 52], [33, 54], [32, 36]], RAVEND.b);
      s.line(31, 37, 31, 52, SHEEN.d);
      s.line(26, 38, 25, 50, RAVEND.d); s.line(38, 38, 39, 50, RAVEND.d);
      s.set(28, 42, SHEEN.b); s.set(36, 44, SHEEN.b);
      // tail fanning down toward camera
      s.fillPoly([[28, 52], [24, 60], [32, 58], [40, 60], [36, 52]], RAVEND.b);
      s.line(28, 58, 32, 53, RAVEND.d); s.line(36, 58, 33, 53, RAVEND.d);
      // back of head, mask edges just visible at the sides
      s.ball(32, 27, 7, 6, RAVEN, { lx: 0, ly: -0.5 });
      s.set(26, 27, BONE.b); s.set(25, 28, BONE.d);
      s.set(38, 27, BONE.b); s.set(39, 28, BONE.d);
      s.ball(32, 24, 5, 3, RAVEND, { flat: true });
    },
  });

  Dex.add({
    id: 77, key: 'grimcorvid', name: 'Grimcorvid', types: ['Dark', 'Flying'],
    base: { hp: 75, atk: 100, def: 70, spa: 85, spd: 70, spe: 90 },
    ability: 'looming_dread', catchRate: 70, expYield: 204, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'peck'], [1, 'leer'], [1, 'cheap_shot'], [9, 'wind_gust'], [13, 'wing_strike'],
      [18, 'snarl'], [23, 'bite'], [28, 'sky_cutter'], [33, 'night_slash'], [38, 'gale_blade'],
      [44, 'crunch'], [50, 'dive_bomber'], [56, 'shadow_maw']],
    tms: ['tm16', 'tm17', 'tm18', 'tm21', 'tm23', 'tm25', 'hm02'],
    dex: { species: 'Doom Raven', h: '1.1m', w: '19.5kg',
      entry: 'It holds a rune-coin no smith remembers striking. Where it drops the coin, folk quietly rewrite their wills.' },
    cry: { base: 300, sweep: 0.48, wave: 'sawtooth', dur: 0.7, vib: 8, grit: 0.5 },
    draw(s) {
      // tattered cloak wings draping like a mantle
      s.fillPoly([[20, 22], [14, 50], [18, 46], [21, 52], [25, 47], [27, 54]], RAVEND.b);
      s.fillPoly([[44, 22], [50, 50], [46, 46], [43, 52], [39, 47], [37, 54]], RAVEND.b);
      s.line(17, 30, 16, 46, SHEEN.d);
      s.line(47, 30, 48, 46, SHEEN.d);
      // tall body
      s.ball(32, 36, 10, 14, RAVEN);
      // chest sheen feathers
      s.set(30, 34, SHEEN.b); s.set(34, 37, SHEEN.b); s.set(31, 41, SHEEN.d);
      s.dither(28, 30, 9, 6, RAVEND.b, 1);
      // tail
      s.fillPoly([[28, 48], [26, 58], [32, 55], [38, 58], [36, 48]], RAVEND.b);
      // legs
      s.limb(28, 50, 27, 56, 2, 1, RAVEND);
      s.limb(36, 50, 37, 56, 2, 1, RAVEND);
      K.claws(s, 25, 57, 2, BONE.d); K.claws(s, 36, 57, 2, BONE.d);
      // regal head with crest
      s.ball(32, 18, 8, 7, RAVEN);
      K.horn(s, 27, 12, -0.5, -1, 6, 2, RAVEND);
      K.horn(s, 33, 11, 0.2, -1, 6, 2, RAVEND);
      K.horn(s, 38, 12, 0.7, -0.8, 5, 2, RAVEND);
      // bone mask brow
      s.ball(34, 18, 5, 3, BONE, { flat: true });
      // long beak holding the rune-coin
      s.tri(38, 17, 47, 19, 38, 22, BONE.b);
      s.line(39, 21, 45, 20, BONE.d);
      s.ball(48, 22, 3, 3, COIN, { flat: true });
      s.set(48, 22, COIN.d); s.set(48, 21, COIN.l); // rune notch
      // baleful eyes
      K.eye(s, 30, 17, 2, '#e04848');
      K.eye(s, 36, 17, 2, '#e04848');
      K.brow(s, 30, 14, 2); K.brow(s, 37, 14, 2);
    },
    drawBack(s) {
      // Rear: full tattered cloak covering the back, crest from behind, tail to camera.
      s.ball(32, 34, 11, 14, RAVEN, { lx: 0, ly: -0.5 });
      // cloak mantle with ragged hem
      s.fillPoly([[21, 20], [43, 20], [48, 44], [44, 40], [41, 50], [36, 44], [32, 54], [28, 44], [23, 50], [20, 40], [16, 44]], RAVEND.b);
      s.line(21, 22, 17, 42, RAVEND.d);
      s.line(43, 22, 47, 42, RAVEND.d);
      s.dither(25, 26, 15, 14, RAVEN.d, 1);
      // sheen streaks
      s.set(28, 30, SHEEN.b); s.set(37, 33, SHEEN.b); s.set(32, 39, SHEEN.d);
      // rune mark on the cloak
      s.set(32, 27, SHEEN.l); s.set(31, 28, SHEEN.b); s.set(33, 28, SHEEN.b); s.set(32, 29, SHEEN.b); s.set(32, 31, SHEEN.d);
      // tail toward camera
      s.fillPoly([[27, 50], [24, 60], [32, 56], [40, 60], [37, 50]], RAVEND.b);
      s.line(28, 57, 32, 52, RAVEND.d); s.line(36, 57, 33, 52, RAVEND.d);
      // back of head + crest
      s.ball(32, 17, 8, 7, RAVEN, { lx: 0, ly: -0.5 });
      s.ball(32, 16, 6, 4, RAVEND, { flat: true });
      K.horn(s, 26, 11, -0.6, -1, 6, 2, RAVEND);
      K.horn(s, 32, 10, 0, -1, 6, 2, RAVEND);
      K.horn(s, 38, 11, 0.6, -0.9, 5, 2, RAVEND);
      // beak tip + coin glint peeking past the head
      s.set(41, 19, BONE.b); s.set(43, 20, COIN.b);
    },
  });

  // ============ SKIMMERLING / WYRMSKIM (dragonfly wyrms) ============
  const NYMPH = Px.ramp('#4aa890');
  const NYMPHD = Px.ramp('#2f7364');
  const JEWEL = Px.ramp('#38b8c8');
  const WING = Px.ramp('#cfe8f0');
  const WVIO = Px.ramp('#8a6fd8');

  Dex.add({
    id: 78, key: 'skimmerling', name: 'Skimmerling', types: ['Bug', 'Dragon'],
    base: { hp: 45, atk: 50, def: 45, spa: 50, spd: 45, spe: 55 },
    ability: 'slippery', catchRate: 180, expYield: 121, growth: 'medslow', gender: 50,
    evolve: { to: 'wyrmskim', level: 33 },
    learn: [[1, 'nibble'], [1, 'leer'], [5, 'twin_sting'], [9, 'silk_bind'], [13, 'twister'],
      [17, 'quick_jab'], [21, 'prism_wing'], [25, 'dragon_breath'], [29, 'cross_scythe']],
    tms: ['tm16', 'tm17', 'tm21', 'tm22', 'tm25', 'hm01'],
    dex: { species: 'Wyrm Nymph', h: '0.4m', w: '3.2kg',
      entry: 'It lurks in tarn shallows, whiskers tasting the current for storms. Anglers who hook one apologize twice and cut the line.' },
    cry: { base: 720, sweep: 0.95, wave: 'triangle', dur: 0.35, vib: 30 },
    draw(s) {
      // dragon-whisker antennae, long and curling
      s.stroke(24, 32, 15, 24, 1, WVIO);
      s.stroke(15, 24, 11, 27, 1, WVIO);
      s.stroke(30, 30, 27, 18, 1, WVIO);
      s.stroke(27, 18, 30, 14, 1, WVIO);
      s.set(10, 28, WVIO.l); s.set(31, 13, WVIO.l);
      // segmented nymph body, curling tail to the right
      s.ball(42, 46, 6, 5, NYMPHD, { flat: true });
      s.ball(47, 42, 4, 4, NYMPH, { flat: true });
      s.ball(50, 37, 3, 3, NYMPHD, { flat: true });
      s.tri(49, 33, 55, 30, 52, 36, NYMPH.b); // tail paddle
      s.ball(35, 45, 8, 7, NYMPH);
      // wing buds on the back
      s.tri(33, 38, 40, 33, 41, 39, WING.b);
      s.line(34, 37, 40, 34, WING.d);
      // big head
      s.ball(26, 40, 8, 8, NYMPH);
      // bulging jewel eyes
      s.ball(21, 37, 3, 4, JEWEL, { flat: true });
      s.ball(30, 36, 3, 4, JEWEL, { flat: true });
      s.set(20, 35, '#ffffff'); s.set(29, 34, '#ffffff');
      s.set(21, 39, JEWEL.d); s.set(30, 38, JEWEL.d);
      // mandible smile
      s.line(23, 45, 27, 46, '#1a1418');
      K.fang(s, 23, 45);
      // six stub legs
      s.limb(24, 47, 21, 54, 1, 1, NYMPHD);
      s.limb(29, 49, 27, 56, 1, 1, NYMPHD);
      s.limb(34, 50, 33, 57, 1, 1, NYMPHD);
      s.limb(39, 50, 40, 56, 1, 1, NYMPHD);
      s.limb(43, 49, 45, 54, 1, 1, NYMPHD);
      // belly stripes
      s.set(34, 48, NYMPHD.d); s.set(37, 49, NYMPHD.d);
    },
    drawBack(s) {
      // Rear: segmented back with wing buds, tail paddle toward camera, whiskers flaring.
      s.stroke(26, 28, 18, 20, 1, WVIO);
      s.stroke(38, 28, 46, 20, 1, WVIO);
      s.set(17, 18, WVIO.l); s.set(47, 18, WVIO.l);
      // back of head
      s.ball(32, 34, 8, 7, NYMPH, { lx: 0, ly: -0.5 });
      s.ball(32, 32, 6, 4, NYMPHD, { flat: true });
      // eye bulges peeking at the sides
      s.set(24, 34, JEWEL.b); s.set(23, 35, JEWEL.d);
      s.set(40, 34, JEWEL.b); s.set(41, 35, JEWEL.d);
      // thorax with wing buds
      s.ball(32, 44, 9, 8, NYMPH, { lx: 0, ly: -0.5 });
      s.tri(24, 40, 18, 36, 26, 45, WING.b);
      s.tri(40, 40, 46, 36, 38, 45, WING.b);
      s.line(24, 41, 20, 38, WING.d); s.line(40, 41, 44, 38, WING.d);
      // segment lines
      s.line(26, 46, 38, 46, NYMPHD.d);
      // tail segments curving toward camera
      s.ball(32, 52, 5, 4, NYMPHD, { flat: true });
      s.ball(32, 56, 4, 3, NYMPH, { flat: true });
      s.tri(28, 58, 36, 58, 32, 62, NYMPH.b);
    },
  });

  Dex.add({
    id: 79, key: 'wyrmskim', name: 'Wyrmskim', types: ['Bug', 'Dragon'],
    base: { hp: 70, atk: 95, def: 65, spa: 105, spd: 75, spe: 100 },
    ability: 'perfect_fit', catchRate: 60, expYield: 212, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'nibble'], [1, 'leer'], [1, 'twin_sting'], [9, 'silk_bind'], [13, 'twister'],
      [18, 'prism_wing'], [23, 'dragon_breath'], [28, 'cross_scythe'], [33, 'wyrm_dance'],
      [39, 'sky_cutter'], [45, 'wyrm_pulse'], [51, 'scale_gale'], [57, 'star_cataclysm']],
    tms: ['tm16', 'tm17', 'tm21', 'tm22', 'tm23', 'tm25', 'hm01', 'hm02'],
    dex: { species: 'Jeweled Darner', h: '1.6m', w: '18.0kg',
      entry: 'Four glass wings carry it faster than the eye can follow. Old wives say each wing was cut from a different frozen lake.' },
    cry: { base: 380, sweep: 0.7, wave: 'sawtooth', dur: 0.6, vib: 18, grit: 0.25 },
    draw(s) {
      // four glass wings (two per side), veined
      s.tri(28, 26, 6, 14, 26, 32, WING.b);
      s.tri(36, 26, 58, 14, 38, 32, WING.b);
      s.tri(28, 30, 10, 34, 27, 36, WING.l);
      s.tri(36, 30, 54, 34, 37, 36, WING.l);
      s.line(26, 28, 10, 17, WING.d); s.line(38, 28, 54, 17, WING.d);
      s.line(27, 32, 13, 33, WING.d); s.line(37, 32, 51, 33, WING.d);
      s.dither(12, 18, 12, 10, WING.h, 1);
      s.dither(40, 18, 12, 10, WING.h, 1);
      // jeweled thorax
      s.ball(32, 30, 6, 7, NYMPH);
      s.set(32, 27, JEWEL.l); s.set(31, 30, JEWEL.b); s.set(33, 30, JEWEL.b);
      // serpentine banded tail coiling below
      s.stroke(32, 36, 28, 46, 3, NYMPH);
      s.stroke(28, 46, 36, 52, 3, NYMPHD);
      s.stroke(36, 52, 45, 48, 3, NYMPH);
      s.stroke(45, 48, 49, 41, 2, WVIO);
      // band marks
      s.set(29, 42, WVIO.b); s.set(31, 49, WVIO.b); s.set(41, 51, WVIO.d);
      // tail fin
      s.tri(48, 38, 55, 33, 52, 42, WVIO.b);
      s.line(54, 35, 50, 40, WVIO.d);
      // head with helmet crest
      s.ball(32, 18, 7, 6, NYMPH);
      s.tri(27, 13, 32, 6, 37, 13, NYMPHD.b);
      s.set(32, 8, JEWEL.b);
      // huge jewel eyes
      s.ball(26, 18, 3, 4, JEWEL, { flat: true });
      s.ball(38, 18, 3, 4, JEWEL, { flat: true });
      s.set(25, 16, '#ffffff'); s.set(37, 16, '#ffffff');
      s.set(26, 20, JEWEL.d); s.set(38, 20, JEWEL.d);
      // dragon whiskers
      s.stroke(26, 14, 18, 8, 1, WVIO);
      s.stroke(38, 14, 46, 8, 1, WVIO);
      s.set(17, 7, WVIO.l); s.set(47, 7, WVIO.l);
      // mandibles
      s.line(30, 22, 34, 22, '#1a1418');
      K.fang(s, 30, 22); K.fang(s, 33, 22);
    },
    drawBack(s) {
      // Rear: wings swept toward viewer, banded tail hanging to camera, helmet crest from behind.
      s.tri(28, 24, 4, 12, 26, 31, WING.b);
      s.tri(36, 24, 60, 12, 38, 31, WING.b);
      s.tri(28, 29, 8, 34, 27, 35, WING.l);
      s.tri(36, 29, 56, 34, 37, 35, WING.l);
      s.line(26, 26, 8, 15, WING.d); s.line(38, 26, 56, 15, WING.d);
      s.line(27, 31, 11, 33, WING.d); s.line(37, 31, 53, 33, WING.d);
      s.dither(10, 16, 13, 11, WING.h, 0);
      s.dither(41, 16, 13, 11, WING.h, 0);
      // thorax from behind with spine gems
      s.ball(32, 29, 7, 8, NYMPH, { lx: 0, ly: -0.5 });
      s.set(32, 25, JEWEL.b); s.set(32, 29, JEWEL.b); s.set(32, 33, JEWEL.d);
      // tail hangs down toward camera, banded
      s.stroke(32, 36, 33, 48, 3, NYMPH);
      s.stroke(33, 48, 30, 56, 3, NYMPHD);
      s.set(32, 41, WVIO.b); s.set(33, 45, WVIO.b); s.set(31, 51, WVIO.d);
      s.tri(26, 58, 34, 58, 29, 63, WVIO.b);
      // back of head + crest
      s.ball(32, 17, 7, 6, NYMPH, { lx: 0, ly: -0.5 });
      s.ball(32, 16, 5, 4, NYMPHD, { flat: true });
      s.tri(27, 12, 32, 5, 37, 12, NYMPHD.b);
      s.set(32, 7, JEWEL.d);
      // eye bulges at the sides
      s.set(25, 17, JEWEL.b); s.set(39, 17, JEWEL.b);
      // whiskers flaring outward
      s.stroke(26, 13, 18, 7, 1, WVIO);
      s.stroke(38, 13, 46, 7, 1, WVIO);
    },
  });

  // ============ YETILING (standalone) ============
  const YETI = Px.ramp('#e9eef5');
  const YETID = Px.ramp('#b3c4d8');
  const YFACE = Px.ramp('#8ba4bc');
  const ICEK = Px.ramp('#a8e0f0');

  Dex.add({
    id: 80, key: 'yetiling', name: 'Yetiling', types: ['Ice', 'Fighting'],
    base: { hp: 90, atk: 110, def: 85, spa: 40, spd: 70, spe: 85 },
    ability: 'grit', catchRate: 60, expYield: 200, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'leer'], [5, 'frost_dust'], [9, 'rock_smash'], [13, 'ice_shard'],
      [17, 'muscle_flex'], [21, 'ice_fang'], [26, 'blur_punch'], [31, 'icicle_crash'],
      [36, 'slab_breaker'], [42, 'frost_armor'], [48, 'whiteout'], [54, 'all_out_assault']],
    tms: ['tm03', 'tm08', 'tm13', 'tm15', 'tm17', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Young Yeti', h: '1.4m', w: '72.0kg',
      entry: 'It shadow-boxes avalanches for practice on the Glacier Cavern approaches. Its icicle knuckles regrow overnight, sharper each time.' },
    cry: { base: 200, sweep: 0.5, wave: 'square', dur: 0.55, vib: 10, grit: 0.4, sub: true },
    draw(s) {
      // shaggy body
      s.ball(32, 38, 13, 14, YETI);
      s.dither(24, 32, 17, 12, YETI.h, 1);
      // shag fringe at the waist
      for (let i = 0; i < 6; i++) s.tri(22 + i * 4, 48, 26 + i * 4, 48, 24 + i * 4, 52, YETID.b);
      // stumpy legs + big feet
      s.limb(26, 50, 25, 55, 3, 3, YETI);
      s.limb(38, 50, 39, 55, 3, 3, YETI);
      s.ball(24, 57, 4, 2, YETID, { flat: true });
      s.ball(40, 57, 4, 2, YETID, { flat: true });
      // burly arms down to big mitts
      s.limb(21, 32, 13, 46, 4, 5, YETI);
      s.limb(43, 32, 51, 46, 4, 5, YETI);
      s.ball(13, 49, 5, 5, YETID, { lx: -0.3, ly: -0.5 });
      s.ball(51, 49, 5, 5, YETID, { lx: -0.3, ly: -0.5 });
      // icicle knuckles
      s.tri(9, 51, 11, 51, 10, 56, ICEK.b);
      s.tri(12, 52, 14, 52, 13, 58, ICEK.l);
      s.tri(15, 51, 17, 51, 16, 56, ICEK.b);
      s.tri(47, 51, 49, 51, 48, 56, ICEK.b);
      s.tri(50, 52, 52, 52, 51, 58, ICEK.l);
      s.tri(53, 51, 55, 51, 54, 56, ICEK.b);
      // head sunk in shoulders with fur crest
      s.ball(32, 22, 10, 9, YETI);
      K.horn(s, 26, 14, -0.4, -1, 5, 2, YETI);
      K.horn(s, 32, 13, 0, -1, 5, 2, YETI);
      K.horn(s, 38, 14, 0.4, -1, 5, 2, YETI);
      // blue-grey face patch
      s.ball(32, 24, 6, 5, YFACE, { flat: true });
      K.eye(s, 29, 23, 2, '#68d8f0');
      K.eye(s, 35, 23, 2, '#68d8f0');
      K.brow(s, 29, 20, 2); K.brow(s, 36, 20, 2);
      s.line(30, 27, 34, 27, '#1a1418');
      K.fang(s, 30, 27); K.fang(s, 33, 27);
      // chest frost mark
      s.set(32, 34, ICEK.b); s.set(31, 35, ICEK.d); s.set(33, 35, ICEK.d);
    },
    drawBack(s) {
      // Rear: shaggy white back with spine shag ridge, mitts with icicle tips at the sides.
      s.ball(32, 37, 14, 15, YETI, { lx: 0, ly: -0.5 });
      s.ball(32, 36, 9, 11, YETID, { flat: true });
      s.dither(24, 27, 17, 20, YETI.d, 1);
      // spine shag ridge
      for (let i = 0; i < 4; i++) K.horn(s, 32, 26 + i * 7, 0.9, -0.4, 4, 2, YETID);
      for (let i = 0; i < 6; i++) s.tri(22 + i * 4, 49, 26 + i * 4, 49, 24 + i * 4, 53, YETID.b);
      // legs
      s.limb(26, 50, 25, 56, 3, 3, YETI);
      s.limb(38, 50, 39, 56, 3, 3, YETI);
      // arms + mitts
      s.limb(20, 31, 13, 46, 4, 5, YETI);
      s.limb(44, 31, 51, 46, 4, 5, YETI);
      s.ball(13, 49, 5, 5, YETID, { lx: 0, ly: -0.5 });
      s.ball(51, 49, 5, 5, YETID, { lx: 0, ly: -0.5 });
      s.tri(10, 51, 12, 51, 11, 56, ICEK.b);
      s.tri(14, 52, 16, 52, 15, 57, ICEK.l);
      s.tri(48, 52, 50, 52, 49, 57, ICEK.l);
      s.tri(52, 51, 54, 51, 53, 56, ICEK.b);
      // back of head + crest
      s.ball(32, 21, 10, 9, YETI, { lx: 0, ly: -0.5 });
      s.ball(32, 21, 7, 6, YETID, { flat: true });
      K.horn(s, 26, 13, -0.4, -1, 5, 2, YETID);
      K.horn(s, 32, 12, 0, -1, 5, 2, YETID);
      K.horn(s, 38, 13, 0.4, -1, 5, 2, YETID);
    },
  });

  // ============ RUNELITH (standalone) ============
  const STONE = Px.ramp('#8d92a6');
  const STONED = Px.ramp('#5c6076');
  const RUNE = Px.ramp('#5ee8e0');

  Dex.add({
    id: 81, key: 'runelith', name: 'Runelith', types: ['Psychic', 'Rock'],
    base: { hp: 60, atk: 55, def: 105, spa: 95, spd: 105, spe: 50 },
    ability: 'updraft', catchRate: 55, expYield: 196, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'harden'], [1, 'confusion'], [7, 'rock_throw'], [13, 'psybeam'],
      [19, 'rock_tomb'], [25, 'mind_veil'], [31, 'mind_crush'], [37, 'rock_slide'],
      [43, 'relic_power'], [49, 'stone_spike'], [55, 'dream_pulse']],
    tms: ['tm04', 'tm05', 'tm14', 'tm15', 'tm17', 'tm21', 'hm05', 'hm06'],
    dex: { species: 'Runestone', h: '1.7m', w: '210.0kg',
      entry: 'A standing stone that wandered off its barrow one solstice night. The runes spell a name that hurts to remember.' },
    cry: { base: 320, sweep: 0.42, wave: 'triangle', dur: 0.65, vib: 6 },
    draw(s) {
      // hovering shadow gap: stone floats, bottom ~50
      // orbiting pebbles (far side first)
      s.ball(13, 22, 2, 2, STONED, { flat: true });
      s.ball(52, 18, 2, 2, STONED, { flat: true });
      // the standing stone (rounded slab)
      s.fillPoly([[25, 10], [39, 10], [43, 16], [44, 44], [40, 50], [24, 50], [20, 44], [21, 16]], STONE.b);
      // shading: left light, right dark
      s.fillPoly([[25, 10], [29, 10], [26, 48], [24, 50], [20, 44], [21, 16]], STONE.l);
      s.fillPoly([[41, 14], [44, 44], [40, 50], [37, 49]], STONE.d);
      s.dither(27, 14, 8, 32, STONE.b, 1);
      // moss at the base
      s.dither(24, 46, 16, 4, STONED.b, 0);
      s.set(23, 47, STEM.d); s.set(40, 48, STEM.d); s.set(27, 49, STEM.b);
      // the great crack
      s.line(33, 10, 30, 20, STONED.d);
      s.line(30, 20, 34, 30, STONED.d);
      s.line(34, 30, 31, 42, STONED.d);
      // glowing rune "eye" at heart
      s.fillCircle(32, 24, 2, RUNE.b);
      s.set(32, 24, RUNE.h); s.set(32, 22, RUNE.l); s.set(32, 26, RUNE.l);
      s.set(30, 24, RUNE.l); s.set(34, 24, RUNE.l);
      // carved rune glyphs
      s.line(26, 15, 26, 19, RUNE.d); s.line(26, 17, 28, 15, RUNE.d);
      s.line(38, 18, 38, 22, RUNE.d); s.set(39, 19, RUNE.d);
      s.line(27, 33, 27, 38, RUNE.b); s.line(27, 35, 29, 33, RUNE.b);
      s.line(37, 34, 37, 39, RUNE.b); s.line(37, 36, 39, 39, RUNE.b);
      s.line(31, 45, 33, 45, RUNE.d); s.set(32, 44, RUNE.d);
      // orbiting pebbles (near side, drawn over)
      s.ball(10, 36, 3, 2, STONE, { flat: true });
      s.ball(54, 34, 3, 2, STONE, { flat: true });
      s.ball(46, 8, 2, 2, STONE, { flat: true });
      s.set(9, 35, RUNE.d); s.set(54, 33, RUNE.d);
      // hover glow beneath
      s.dither(26, 54, 12, 2, RUNE.d, 0);
    },
    drawBack(s) {
      // Rear: the stone's mossy, lichen-crusted back — different glyphs, no eye rune.
      s.ball(14, 20, 2, 2, STONED, { flat: true });
      s.ball(51, 26, 2, 2, STONED, { flat: true });
      s.fillPoly([[25, 10], [39, 10], [43, 16], [44, 44], [40, 50], [24, 50], [20, 44], [21, 16]], STONE.b);
      s.fillPoly([[25, 10], [29, 10], [26, 48], [24, 50], [20, 44], [21, 16]], STONE.l);
      s.fillPoly([[41, 14], [44, 44], [40, 50], [37, 49]], STONE.d);
      s.dither(27, 13, 9, 34, STONE.d, 0);
      // heavy moss crust down the back
      s.fillPoly([[26, 10], [36, 10], [34, 22], [37, 34], [30, 46], [27, 30]], STONED.b);
      s.dither(27, 12, 9, 30, STEM.d, 1);
      s.set(29, 16, STEM.b); s.set(33, 26, STEM.b); s.set(30, 38, STEM.b);
      // crack seen from behind
      s.line(35, 12, 38, 24, STONED.d);
      s.line(38, 24, 35, 40, STONED.d);
      // faint worn glyphs
      s.line(24, 20, 24, 24, RUNE.d); s.set(25, 21, RUNE.d);
      s.line(40, 30, 40, 34, RUNE.d); s.set(41, 33, RUNE.d);
      s.line(26, 42, 28, 42, RUNE.d);
      // near-side pebbles
      s.ball(9, 32, 3, 2, STONE, { flat: true });
      s.ball(55, 38, 3, 2, STONE, { flat: true });
      s.ball(18, 6, 2, 2, STONE, { flat: true });
      s.set(55, 37, RUNE.d);
      s.dither(26, 54, 12, 2, RUNE.d, 0);
    },
  });
})();
