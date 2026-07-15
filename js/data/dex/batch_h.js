'use strict';
/**
 * Batch H (dex #122-#131): more Team Ionar-type (Electric) fakemon, a Ghost/Ice
 * "spirit in an ice cube" with a split evolution (ice-chunk form vs water form),
 * and a few extra lines for variety.
 *   Ghost/Ice split: Frostgeist -> Glaciwraith (Lv) OR Tidewraith (Tide Stone)
 *   Electric (villain): Ionette -> Voltusk -> Teslamaw (Electric/Steel); Aurovolt
 *   Extra: Cindpup -> Pyrewolf (Fire/Dark); Mirrorclad (Steel/Fairy)
 */
(() => {
  const K = SpriteKit;

  // ===================== Ghost/Ice split line =====================
  const ICE = Px.ramp('#a8d8f0'), ICED = Px.ramp('#6aa8d0');
  const GHOST = Px.ramp('#e8f2fb'), SOUL = Px.ramp('#bfeaff');
  const WAT = Px.ramp('#3a8fd0'), WATL = Px.ramp('#9ad8f8');
  const EYEC = '#7ce0ff';

  Dex.add({
    id: 122, key: 'frostgeist', name: 'Frostgeist', types: ['Ghost', 'Ice'],
    base: { hp: 45, atk: 40, def: 58, spa: 62, spd: 58, spe: 45 }, ability: 'permafrost',
    catchRate: 120, expYield: 62, growth: 'medslow', gender: -1,
    evolve: [{ to: 'glaciwraith', level: 34 }, { to: 'tidewraith', stone: 'tide_stone' }],
    learn: [[1, 'astonish'], [1, 'frost_dust'], [7, 'lick'], [12, 'ice_shard'], [18, 'shade_sneak'], [24, 'frost_fang'], [30, 'phantom_orb']],
    tms: ['tm03', 'tm04', 'tm05'],
    dex: { species: 'Iced Spirit', h: '0.5m', w: '20.0kg', entry: 'A restless spirit sealed inside a block of never-melting ice. It drifts through frozen caverns, waiting to thaw free.' },
    cry: { base: 300, sweep: 0.5, wave: 'sine', dur: 0.5, vib: 14, grit: 0.15, sub: true },
    draw(s) {
      // floating ice cube
      s.rect(20, 22, 24, 24, ICE.b);
      s.rect(20, 22, 24, 4, ICE.l); s.rect(20, 22, 4, 24, ICE.l);
      s.rect(40, 26, 4, 20, ICED.b); s.rect(24, 42, 20, 4, ICED.b);
      s.dither(24, 26, 14, 14, ICE.h, 1);
      // ghost face frozen inside
      s.ball(32, 34, 6, 6, GHOST, { flat: true });
      K.eye(s, 29, 33, 2, EYEC); K.eye(s, 35, 33, 2, EYEC);
      s.line(30, 38, 34, 38, ICED.d);
      // frosty shine
      s.set(23, 25, '#ffffff'); s.set(25, 24, '#ffffff');
    },
    drawBack(s) {
      s.rect(20, 22, 24, 24, ICED.b);
      s.rect(20, 22, 24, 4, ICE.b); s.rect(20, 22, 4, 24, ICE.b);
      s.dither(24, 26, 16, 16, ICED.d, 0);
      s.ball(32, 33, 5, 5, GHOST, { flat: true });
      s.set(23, 25, '#ffffff');
    },
  });

  Dex.add({
    id: 123, key: 'glaciwraith', name: 'Glaciwraith', types: ['Ghost', 'Ice'],
    base: { hp: 70, atk: 60, def: 78, spa: 98, spd: 88, spe: 70 }, ability: 'permafrost',
    catchRate: 45, expYield: 158, growth: 'medslow', gender: -1, evolve: null,
    learn: [[1, 'astonish'], [1, 'ice_shard'], [1, 'shade_sneak'], [24, 'frost_fang'], [30, 'phantom_orb'], [38, 'icicle_crash'], [44, 'rime_spear'], [50, 'haunt']],
    tms: ['tm03', 'tm04', 'tm05', 'tm09'],
    dex: { species: 'Freed Wraith', h: '1.4m', w: '30.5kg', entry: 'Its prison shattered at last. Now the wraith soars free, wreathed in shards of the ice that once held it captive.' },
    cry: { base: 240, sweep: 0.9, wave: 'sawtooth', dur: 0.7, vib: 12, grit: 0.25, sub: true },
    draw(s) {
      // ghostly body
      s.ball(32, 34, 10, 12, GHOST);
      s.stroke(32, 44, 30, 52, 3, GHOST); s.stroke(32, 44, 35, 52, 3, GHOST);
      s.dither(26, 30, 12, 10, SOUL.l, 1);
      // hollow eyes
      K.eye(s, 28, 32, 2, EYEC); K.eye(s, 36, 32, 2, EYEC);
      s.line(29, 38, 35, 38, ICED.d);
      // orbiting ice chunks
      for (const [x, y] of [[16, 24], [48, 28], [18, 44], [46, 46], [32, 16]]) {
        s.tri(x, y, x + 5, y + 2, x + 2, y + 6, ICE.b); s.set(x + 1, y + 1, ICE.h);
      }
    },
    drawBack(s) {
      s.ball(32, 33, 10, 12, GHOST, { lx: 0, ly: -0.5 });
      s.stroke(32, 43, 30, 52, 3, GHOST); s.stroke(32, 43, 35, 52, 3, GHOST);
      s.dither(26, 28, 12, 10, SOUL.b, 0);
      for (const [x, y] of [[16, 24], [48, 28], [18, 44], [46, 46]]) { s.tri(x, y, x + 5, y + 2, x + 2, y + 6, ICED.b); }
    },
  });

  Dex.add({
    id: 124, key: 'tidewraith', name: 'Tidewraith', types: ['Ghost', 'Water'],
    base: { hp: 75, atk: 60, def: 72, spa: 96, spd: 86, spe: 76 }, ability: 'spring_sponge',
    catchRate: 45, expYield: 158, growth: 'medslow', gender: -1, evolve: null,
    learn: [[1, 'astonish'], [1, 'aqua_jet'], [1, 'shade_sneak'], [24, 'aqua_tail'], [30, 'phantom_orb'], [38, 'bubble_beam'], [44, 'brine_cannon'], [50, 'haunt']],
    tms: ['tm05', 'tm09', 'hm03'],
    dex: { species: 'Freed Wraith', h: '1.5m', w: '28.0kg', entry: 'When its ice thawed instead of cracking, the spirit emerged robed in living water that coils and strikes at its will.' },
    cry: { base: 250, sweep: 0.85, wave: 'sawtooth', dur: 0.7, vib: 11, grit: 0.2, sub: true },
    draw(s) {
      s.ball(32, 34, 10, 12, GHOST);
      s.stroke(32, 44, 30, 52, 3, GHOST); s.stroke(32, 44, 35, 52, 3, GHOST);
      K.eye(s, 28, 32, 2, '#9af0ff'); K.eye(s, 36, 32, 2, '#9af0ff');
      s.line(29, 38, 35, 38, WAT.d);
      // swirling water ribbons around the body
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        const x = 32 + Math.cos(a) * 16, y = 34 + Math.sin(a) * 15;
        s.set(x | 0, y | 0, (i % 2 ? WAT : WATL).b);
        s.set((x + Math.cos(a) * 2) | 0, (y + Math.sin(a) * 2) | 0, WATL.l);
      }
    },
    drawBack(s) {
      s.ball(32, 33, 10, 12, GHOST, { lx: 0, ly: -0.5 });
      s.stroke(32, 43, 30, 52, 3, GHOST); s.stroke(32, 43, 35, 52, 3, GHOST);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; s.set((32 + Math.cos(a) * 16) | 0, (34 + Math.sin(a) * 15) | 0, WAT.b); }
    },
  });

  // ===================== Electric (Team Ionar) line =====================
  const ELEC = Px.ramp('#f8e050'), ELECD = Px.ramp('#d0a020'), COIL = Px.ramp('#c4c8d4'), COILD = Px.ramp('#7c8494');

  Dex.add({
    id: 125, key: 'ionette', name: 'Ionette', types: ['Electric'],
    base: { hp: 45, atk: 50, def: 45, spa: 66, spd: 50, spe: 72 }, ability: 'static_wool',
    catchRate: 190, expYield: 60, growth: 'medfast', gender: 50, evolve: { to: 'voltusk', level: 30 },
    learn: [[1, 'tackle'], [1, 'spark_nip'], [8, 'static_snare'], [14, 'spark_tackle'], [22, 'volt_fang'], [28, 'storm_bolt']],
    tms: ['tm01', 'tm12', 'tm13'],
    dex: { species: 'Ion Mote', h: '0.4m', w: '5.5kg', entry: 'A knot of live current with a stubborn spark of will. Team Ionar breeds them by the crate to power their machines.' },
    cry: { base: 480, sweep: 0.7, wave: 'square', dur: 0.35, vib: 16 },
    draw(s) {
      s.ball(32, 40, 10, 9, ELEC); s.ball(32, 42, 6, 5, ELEC.l, { flat: true });
      s.ball(32, 28, 8, 7, ELEC);
      K.horn(s, 27, 21, -0.4, -1, 6, 2, COIL); K.horn(s, 37, 21, 0.4, -1, 6, 2, COIL);
      s.set(25, 18, ELEC.h); s.set(39, 18, ELEC.h);
      K.eye(s, 28, 28, 2, '#303030'); K.eye(s, 36, 28, 2, '#303030');
      K.cheek(s, 24, 32, ELECD.b); K.cheek(s, 40, 32, ELECD.b);
      // spark tail
      s.line(40, 46, 46, 42, ELEC.h); s.line(46, 42, 44, 48, ELEC.h);
    },
    drawBack(s) {
      s.ball(32, 40, 10, 9, ELECD, { lx: 0, ly: -0.5 });
      s.ball(32, 28, 8, 7, ELECD, { lx: 0, ly: -0.5 });
      K.horn(s, 27, 20, -0.4, -1, 6, 2, COIL); K.horn(s, 37, 20, 0.4, -1, 6, 2, COIL);
      s.line(40, 46, 47, 42, ELEC.h);
    },
  });

  Dex.add({
    id: 126, key: 'voltusk', name: 'Voltusk', types: ['Electric'],
    base: { hp: 75, atk: 88, def: 70, spa: 80, spd: 70, spe: 96 }, ability: 'static_wool',
    catchRate: 60, expYield: 145, growth: 'medfast', gender: 50, evolve: { to: 'teslamaw', level: 44 },
    learn: [[1, 'tackle'], [1, 'spark_nip'], [1, 'volt_fang'], [22, 'volt_fang'], [28, 'storm_bolt'], [36, 'volt_crash'], [44, 'arc_surge']],
    tms: ['tm01', 'tm12', 'tm13', 'tm16'],
    dex: { species: 'Charge Boar', h: '1.2m', w: '54.0kg', entry: 'Its tusks store a battery\'s worth of charge. A single goring can black out a whole city block.' },
    cry: { base: 300, sweep: 0.6, wave: 'sawtooth', dur: 0.5, vib: 10, grit: 0.3 },
    draw(s) {
      s.limb(24, 48, 22, 56, 3, 2, ELECD); s.limb(40, 48, 42, 56, 3, 2, ELECD);
      s.ball(32, 42, 13, 10, ELEC); s.dither(26, 40, 12, 6, ELECD.b, 1);
      s.ball(30, 30, 9, 8, ELEC);
      // tusks
      K.horn(s, 24, 34, -0.7, -0.2, 8, 2, COIL); K.horn(s, 38, 34, 0.7, -0.2, 8, 2, COIL);
      K.eye(s, 26, 29, 2, '#f8f0a0'); K.eye(s, 34, 29, 2, '#f8f0a0'); K.brow(s, 26, 26, 2); K.brow(s, 35, 26, 2);
      K.cheek(s, 22, 33, ELECD.b); K.cheek(s, 40, 33, ELECD.b);
      s.set(20, 40, ELEC.h); s.set(45, 38, ELEC.h);
    },
    drawBack(s) {
      s.limb(24, 48, 22, 56, 3, 2, ELECD); s.limb(40, 48, 42, 56, 3, 2, ELECD);
      s.ball(32, 42, 13, 10, ELECD, { lx: 0, ly: -0.5 });
      s.ball(30, 29, 9, 8, ELECD, { lx: 0, ly: -0.5 });
      K.horn(s, 24, 33, -0.7, -0.2, 8, 2, COIL); K.horn(s, 38, 33, 0.7, -0.2, 8, 2, COIL);
      s.set(20, 40, ELEC.h);
    },
  });

  Dex.add({
    id: 127, key: 'teslamaw', name: 'Teslamaw', types: ['Electric', 'Steel'],
    base: { hp: 90, atk: 100, def: 96, spa: 92, spd: 80, spe: 84 }, ability: 'iron_frame',
    catchRate: 45, expYield: 172, growth: 'slow', gender: 50, evolve: null,
    learn: [[1, 'metal_claw'], [1, 'spark_nip'], [1, 'volt_fang'], [36, 'volt_crash'], [44, 'arc_surge'], [52, 'chrome_cannon'], [58, 'sky_fury']],
    tms: ['tm01', 'tm12', 'tm13', 'tm16', 'tm20'],
    dex: { species: 'Dynamo Beast', h: '2.1m', w: '210.0kg', entry: 'Team Ionar\'s masterwork — a living dynamo clad in conductive steel. Its roar induces currents in every wire for miles.' },
    cry: { base: 200, sweep: 0.55, wave: 'sawtooth', dur: 0.65, vib: 9, grit: 0.4, sub: true },
    draw(s) {
      s.limb(23, 48, 20, 57, 4, 2, COILD); s.limb(41, 48, 44, 57, 4, 2, COILD);
      s.ball(32, 42, 15, 12, COIL); s.ball(32, 44, 9, 6, ELEC, { flat: true });
      s.dither(24, 38, 16, 8, COILD.b, 1);
      s.ball(31, 28, 10, 9, COIL);
      K.horn(s, 25, 19, -0.4, -1, 8, 2, ELEC); K.horn(s, 38, 19, 0.4, -1, 8, 2, ELEC);
      s.set(23, 15, ELEC.h); s.set(41, 15, ELEC.h);
      K.eye(s, 27, 28, 2, '#f8e858'); K.eye(s, 36, 28, 2, '#f8e858'); K.brow(s, 27, 25, 2); K.brow(s, 36, 25, 2);
      s.line(28, 33, 36, 33, ELECD.d); K.fang(s, 28, 33, '#fff'); K.fang(s, 34, 33, '#fff');
      // coil down the back
      for (let i = 0; i < 4; i++) s.set(32, 20 + i * 4, ELEC.h);
    },
    drawBack(s) {
      s.limb(23, 48, 20, 57, 4, 2, COILD); s.limb(41, 48, 44, 57, 4, 2, COILD);
      s.ball(32, 42, 15, 12, COILD, { lx: 0, ly: -0.5 });
      for (let i = 0; i < 5; i++) s.set(32, 30 + i * 4, ELEC.h);
      s.ball(31, 27, 10, 9, COILD, { lx: 0, ly: -0.5 });
      K.horn(s, 25, 18, -0.4, -1, 8, 2, ELEC); K.horn(s, 38, 18, 0.4, -1, 8, 2, ELEC);
    },
  });

  Dex.add({
    id: 128, key: 'aurovolt', name: 'Aurovolt', types: ['Electric', 'Flying'],
    base: { hp: 70, atk: 72, def: 64, spa: 92, spd: 70, spe: 104 }, ability: 'stormrider',
    catchRate: 60, expYield: 168, growth: 'medfast', gender: 50, evolve: null,
    learn: [[1, 'peck'], [1, 'spark_nip'], [1, 'wind_gust'], [24, 'wing_strike'], [32, 'storm_bolt'], [40, 'gale_slash'], [48, 'sky_fury']],
    tms: ['tm01', 'tm12', 'tm13', 'tm20'],
    dex: { species: 'Aurora Hawk', h: '1.5m', w: '29.0kg', entry: 'It rides the aurora\'s currents on wings of light. Team Ionar covets it as a living relay for their sky-array.' },
    cry: { base: 430, sweep: 0.9, wave: 'square', dur: 0.4, vib: 14 },
    draw(s) {
      const SKY = Px.ramp('#7cc8f0'), SKYD = Px.ramp('#4a8cc8');
      s.stroke(18, 46, 32, 40, 4, SKY); s.stroke(32, 40, 46, 46, 4, SKY);   // wings
      s.dither(20, 42, 24, 6, ELEC.l, 1);
      s.ball(32, 34, 9, 8, SKY);
      s.tri(37, 32, 44, 34, 37, 37, ELEC.b);   // beak
      K.eye(s, 33, 32, 2, '#f8f0a0'); K.brow(s, 33, 29, 2);
      K.horn(s, 28, 26, -0.3, -1, 7, 2, ELEC);   // crest spark
      s.stroke(32, 42, 30, 52, 3, SKYD); s.stroke(32, 42, 36, 52, 3, ELEC);   // tail feathers
      s.set(22, 40, ELEC.h); s.set(44, 42, ELEC.h);
    },
    drawBack(s) {
      const SKY = Px.ramp('#7cc8f0'), SKYD = Px.ramp('#4a8cc8');
      s.stroke(16, 42, 32, 36, 5, SKY); s.stroke(32, 36, 48, 42, 5, SKY);
      s.dither(20, 38, 24, 6, SKYD.b, 0);
      s.ball(32, 32, 8, 7, SKYD, { lx: 0, ly: -0.5 });
      K.horn(s, 28, 24, -0.3, -1, 7, 2, ELEC);
      s.stroke(32, 40, 33, 52, 3, ELEC);
    },
  });

  // ===================== extra lines for variety =====================
  const FUR = Px.ramp('#e08040'), FURD = Px.ramp('#a85428'), FLAME = Px.ramp('#f8c040'), DK = Px.ramp('#3a3040');

  Dex.add({
    id: 129, key: 'cindpup', name: 'Cindpup', types: ['Fire'],
    base: { hp: 50, atk: 62, def: 45, spa: 52, spd: 45, spe: 66 }, ability: 'inner_ember',
    catchRate: 150, expYield: 62, growth: 'medslow', gender: 50, evolve: { to: 'pyrewolf', level: 32 },
    learn: [[1, 'scratch'], [1, 'growl'], [7, 'cinder_shot'], [13, 'bite'], [20, 'fire_fang'], [28, 'flare_fang']],
    tms: ['tm02', 'tm06', 'tm20'],
    dex: { species: 'Ember Pup', h: '0.6m', w: '11.0kg', entry: 'Embers glow between its shaggy tufts. When excited its whole coat smoulders like a banked hearth.' },
    cry: { base: 360, sweep: 0.6, wave: 'square', dur: 0.4, vib: 12, grit: 0.25 },
    draw(s) {
      s.limb(25, 48, 24, 55, 3, 2, FURD); s.limb(39, 48, 40, 55, 3, 2, FURD);
      s.ball(32, 42, 11, 9, FUR); s.ball(32, 44, 6, 4, FLAME, { flat: true });
      s.ball(30, 30, 9, 8, FUR);
      K.horn(s, 25, 23, -0.5, -0.9, 6, 2, FUR); K.horn(s, 35, 23, 0.5, -0.9, 6, 2, FUR);   // ears
      s.set(30, 20, FLAME.h); s.set(34, 19, FLAME.h);   // ember tuft
      K.eye(s, 26, 30, 2, '#f8d038'); K.eye(s, 34, 30, 2, '#f8d038'); K.brow(s, 26, 27, 2); K.brow(s, 35, 27, 2);
      s.line(28, 34, 32, 34, FURD.d); K.fang(s, 28, 34, '#fff');
    },
    drawBack(s) {
      s.limb(25, 48, 24, 55, 3, 2, FURD); s.limb(39, 48, 40, 55, 3, 2, FURD);
      s.ball(32, 42, 11, 9, FURD, { lx: 0, ly: -0.5 });
      s.ball(30, 29, 9, 8, FURD, { lx: 0, ly: -0.5 });
      K.horn(s, 25, 22, -0.5, -0.9, 6, 2, FUR); K.horn(s, 35, 22, 0.5, -0.9, 6, 2, FUR);
      s.set(31, 20, FLAME.h);
    },
  });

  Dex.add({
    id: 130, key: 'pyrewolf', name: 'Pyrewolf', types: ['Fire', 'Dark'],
    base: { hp: 80, atk: 108, def: 68, spa: 62, spd: 66, spe: 98 }, ability: 'inner_ember',
    catchRate: 45, expYield: 168, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'scratch'], [1, 'bite'], [1, 'fire_fang'], [28, 'flare_fang'], [36, 'crunch'], [44, 'fire_lance'], [52, 'blaze_charge']],
    tms: ['tm02', 'tm06', 'tm18', 'tm20'],
    dex: { species: 'Pyre Wolf', h: '1.6m', w: '68.0kg', entry: 'It hunts moonless nights, its mane a streak of black fire. Prey never hears it coming until the heat is upon them.' },
    cry: { base: 240, sweep: 0.6, wave: 'sawtooth', dur: 0.55, vib: 9, grit: 0.4 },
    draw(s) {
      s.stroke(16, 50, 32, 48, 4, DK); s.stroke(32, 48, 46, 50, 4, FURD);
      s.limb(24, 50, 22, 57, 3, 2, DK); s.limb(42, 50, 44, 57, 3, 2, DK);
      s.ball(30, 34, 10, 9, FURD);
      // black-fire mane
      for (let i = 0; i < 5; i++) K.horn(s, 22 + i * 5, 28, 0, -1, 6, 2, i % 2 ? DK : FLAME);
      K.horn(s, 24, 24, -0.5, -0.9, 6, 2, DK); K.horn(s, 36, 24, 0.5, -0.9, 6, 2, DK);
      K.eye(s, 26, 34, 2, '#f85030'); K.eye(s, 34, 34, 2, '#f85030'); K.brow(s, 26, 31, 2); K.brow(s, 35, 31, 2);
      s.tri(20, 36, 26, 36, 23, 40, FURD.b); s.line(21, 38, 25, 38, DK.d); K.fang(s, 21, 38, '#fff');
    },
    drawBack(s) {
      s.stroke(16, 50, 32, 48, 4, DK); s.stroke(32, 48, 46, 50, 4, DK);
      s.limb(24, 50, 22, 57, 3, 2, DK); s.limb(42, 50, 44, 57, 3, 2, DK);
      for (let i = 0; i < 6; i++) K.horn(s, 20 + i * 5, 30, 0, -1, 6, 2, i % 2 ? FLAME : DK);
      s.ball(30, 33, 10, 9, DK, { lx: 0, ly: -0.5 });
    },
  });

  Dex.add({
    id: 131, key: 'mirrorclad', name: 'Mirrorclad', types: ['Steel', 'Fairy'],
    base: { hp: 80, atk: 70, def: 112, spa: 86, spd: 96, spe: 46 }, ability: 'iron_frame',
    catchRate: 45, expYield: 170, growth: 'slow', gender: -1, evolve: null,
    learn: [[1, 'metal_claw'], [1, 'fae_wind'], [16, 'plate_guard'], [24, 'glimmer_kiss'], [34, 'chrome_cannon'], [42, 'prism_flare'], [50, 'moonveil_blast']],
    tms: ['tm05', 'tm13', 'tm20'],
    dex: { species: 'Mirror Guard', h: '1.3m', w: '88.0kg', entry: 'Clad in mirror-bright plates that throw a foe\'s own attack back as dazzling light. Ancient shrines placed them as guardians.' },
    cry: { base: 320, sweep: 0.5, wave: 'triangle', dur: 0.5, vib: 8 },
    draw(s) {
      const STEEL = Px.ramp('#c4ccda'), STEELD = Px.ramp('#828ca0'), FAIRY = Px.ramp('#f0a8d8');
      s.ball(32, 40, 13, 12, STEEL); s.ball(32, 40, 8, 8, STEEL.h, { flat: true });
      s.dither(26, 34, 12, 8, STEELD.b, 1);
      s.ball(32, 26, 9, 7, STEEL);
      // mirror shards crown
      s.fillPoly([[26, 20], [22, 10], [30, 18]], FAIRY.b); s.fillPoly([[38, 20], [42, 10], [34, 18]], FAIRY.b);
      s.fillPoly([[32, 16], [30, 6], [34, 6]], STEEL.h);
      K.eye(s, 28, 26, 2, '#f070c0'); K.eye(s, 36, 26, 2, '#f070c0');
      s.line(30, 44, 34, 44, STEELD.d);
      s.set(24, 34, '#ffffff'); s.set(40, 38, '#ffffff');   // glints
    },
    drawBack(s) {
      const STEEL = Px.ramp('#c4ccda'), STEELD = Px.ramp('#828ca0'), FAIRY = Px.ramp('#f0a8d8');
      s.ball(32, 40, 13, 12, STEELD, { lx: 0, ly: -0.5 });
      s.ball(32, 25, 9, 7, STEELD, { lx: 0, ly: -0.5 });
      s.fillPoly([[26, 19], [22, 9], [30, 17]], FAIRY.d); s.fillPoly([[38, 19], [42, 9], [34, 17]], FAIRY.d);
      s.set(30, 34, '#ffffff');
    },
  });
})();
