'use strict';
/**
 * Batch E (dex #82-#99): geothermal fields, late-game & legend-adjacent.
 *   The Cinder Vents, Emberfall hot springs, Victory Road and the foothills
 *   of the Sky Spire. Mudpot imps, ghost-ship figureheads, iron wyrms,
 *   snow bears, seer-hags, and the winter-ending glacier drake line —
 *   which SPLITS: a glacierling becomes a swift Frystdrake by level, or
 *   crystallizes into a Frostfern under an Aurora Stone.
 */
(() => {
  const K = SpriteKit;

  // ============ SULFIMER LINE (mudpot imp -> geyser fiend) ============
  const MUD = Px.ramp('#8a6a44');
  const SULF = Px.ramp('#d8c048');
  const EMBER = Px.ramp('#e06838');
  const STEAM = Px.ramp('#d0d4d8');
  const STONEV = Px.ramp('#7a6a60');

  Dex.add({
    id: 82, key: 'sulfimer', name: 'Sulfimer', types: ['Poison', 'Fire'],
    base: { hp: 50, atk: 52, def: 48, spa: 62, spd: 45, spe: 28 },
    ability: 'thorn_coat', catchRate: 150, expYield: 119, growth: 'medslow', gender: 50,
    evolve: { to: 'geysmog', level: 32 },
    learn: [[1, 'venom_barb'], [1, 'cinder_shot'], [5, 'sludge'], [9, 'flame_wheel'],
      [14, 'venom_dust'], [19, 'heat_wave'], [24, 'sludge_blast'], [30, 'blightbrew']],
    tms: ['tm06', 'tm10', 'tm11', 'tm16', 'hm05', 'hm06'],
    dex: { species: 'Mudpot Imp', h: '0.5m', w: '11.0kg',
      entry: 'It wallows in the Cinder Vents where sulfur bubbles up hot. Each pop of a bubble makes it giggle and belch a spark.' },
    cry: { base: 300, sweep: 0.7, wave: 'sawtooth', dur: 0.4, vib: 16, grit: 0.4 },
    draw(s) {
      // squat mudpot body
      s.ball(32, 44, 12, 10, MUD);
      s.ball(32, 48, 8, 6, Px.ramp('#6a4e30'), { flat: true });
      // sulfur bubbles rising
      s.ball(24, 34, 3, 3, SULF, { flat: true });
      s.ball(40, 32, 2.5, 2.5, SULF, { flat: true });
      s.set(30, 28, SULF.l); s.set(36, 26, SULF.b);
      // stubby arms
      s.limb(21, 44, 16, 48, 3, 2, MUD);
      s.limb(43, 44, 48, 48, 3, 2, MUD);
      // little legs
      s.ball(26, 53, 3, 2, MUD, { flat: true });
      s.ball(38, 53, 3, 2, MUD, { flat: true });
      // ember mouth glow
      s.ball(32, 46, 4, 3, EMBER, { flat: true });
      s.set(32, 46, '#f8e048');
      // face: mischievous
      K.eye(s, 27, 40, 2, '#e8d048');
      K.eye(s, 37, 40, 2, '#e8d048');
      K.brow(s, 27, 37, 2); K.brow(s, 37, 37, 2);
      // horn nubs
      K.horn(s, 26, 34, -0.5, -1, 4, 1, MUD);
      K.horn(s, 38, 34, 0.5, -1, 4, 1, MUD);
    },
    drawBack(s) {
      s.ball(32, 44, 13, 11, MUD, { lx: 0, ly: -0.5 });
      s.ball(32, 42, 9, 8, Px.ramp('#6a4e30'), { flat: true });
      s.dither(24, 36, 16, 12, MUD.d, 1);
      // bubbles popping over the back
      s.ball(26, 32, 3, 3, SULF, { flat: true });
      s.ball(39, 34, 2.5, 2.5, SULF, { flat: true });
      s.set(32, 28, SULF.l);
      s.limb(20, 44, 15, 48, 3, 2, MUD);
      s.limb(44, 44, 49, 48, 3, 2, MUD);
      s.ball(26, 53, 3, 2, MUD, { flat: true });
      s.ball(38, 53, 3, 2, MUD, { flat: true });
      K.horn(s, 26, 33, -0.5, -1, 4, 1, MUD);
      K.horn(s, 38, 33, 0.5, -1, 4, 1, MUD);
    },
  });

  Dex.add({
    id: 83, key: 'geysmog', name: 'Geysmog', types: ['Poison', 'Fire'],
    base: { hp: 80, atk: 71, def: 74, spa: 100, spd: 78, spe: 92 },
    ability: 'flame_eater', catchRate: 60, expYield: 195, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'venom_barb'], [1, 'cinder_shot'], [1, 'sludge'], [9, 'flame_wheel'],
      [14, 'venom_dust'], [19, 'heat_wave'], [24, 'sludge_blast'], [30, 'blightbrew'],
      [37, 'fang_of_rot'], [44, 'inferno_burst']],
    tms: ['tm04', 'tm06', 'tm08', 'tm10', 'tm11', 'tm16', 'hm05', 'hm06'],
    dex: { species: 'Geyser Fiend', h: '1.9m', w: '31.5kg',
      entry: 'A column of scalding steam given a will of its own. It erupts from a stone vent it wears like a pair of boots.' },
    cry: { base: 210, sweep: 1.3, wave: 'sawtooth', dur: 0.6, vib: 10, grit: 0.5, sub: true },
    draw(s) {
      // stone vent base
      s.ball(32, 54, 11, 6, STONEV);
      s.rect(24, 52, 16, 4, STONEV.d);
      // steam column body rising
      s.limb(32, 50, 32, 24, 8, 5, STEAM);
      s.ball(32, 26, 9, 8, STEAM);
      // swirling steam wisps
      s.stroke(24, 40, 18, 30, 2, STEAM);
      s.stroke(40, 42, 47, 32, 2, STEAM);
      s.dither(26, 30, 12, 16, '#e8ecf0', 1);
      // sulfur & ember flecks inside
      s.set(30, 40, SULF.b); s.set(35, 34, EMBER.b); s.set(28, 44, SULF.l);
      s.set(34, 46, EMBER.l);
      // menacing face in the steam
      K.eye(s, 28, 25, 2, '#e85838');
      K.eye(s, 36, 25, 2, '#e85838');
      K.brow(s, 28, 22, 2); K.brow(s, 37, 22, 2);
      // gaping vapor maw
      s.ball(32, 31, 3, 2, EMBER, { flat: true });
      // wispy arms
      s.stroke(24, 34, 16, 40, 2, STEAM);
      s.stroke(40, 34, 48, 40, 2, STEAM);
    },
    drawBack(s) {
      s.ball(32, 54, 11, 6, STONEV, { lx: 0, ly: -0.5 });
      s.rect(24, 52, 16, 4, STONEV.d);
      s.limb(32, 50, 32, 24, 9, 5, STEAM);
      s.ball(32, 25, 9, 8, STEAM, { lx: 0, ly: -0.5 });
      s.dither(25, 28, 14, 20, '#dce0e4', 0);
      s.stroke(24, 38, 17, 28, 2, STEAM);
      s.stroke(40, 40, 47, 30, 2, STEAM);
      s.set(30, 38, SULF.b); s.set(35, 44, EMBER.b); s.set(33, 32, SULF.l);
    },
  });

  // ============ HULLGHAST (ghost-ship figurehead) ============
  const OAK = Px.ramp('#9a7648');
  const SPECT = Px.ramp('#6fa8c8');
  const BARN = Px.ramp('#7a8a6a');

  Dex.add({
    id: 84, key: 'hullghast', name: 'Hullghast', types: ['Ghost', 'Water'],
    base: { hp: 92, atk: 68, def: 96, spa: 84, spd: 90, spe: 50 },
    ability: 'spring_sponge', catchRate: 55, expYield: 192, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'astonish'], [1, 'splash_jet'], [6, 'shade_sneak'], [12, 'bubble_beam'],
      [18, 'phantom_orb'], [24, 'aqua_tail'], [30, 'spectral_claw'], [36, 'surf'],
      [42, 'haunt'], [48, 'deluge_cannon']],
    tms: ['tm03', 'tm05', 'tm13', 'tm18', 'tm21', 'hm03', 'hm07'],
    dex: { species: 'Wreck Maiden', h: '2.5m', w: '96.0kg',
      entry: 'The carved figurehead of a ship lost with all hands. It drifts the harbor fog, trailing the ghost of a hull that will never make port.' },
    cry: { base: 240, sweep: 1.5, wave: 'sine', dur: 0.8, vib: 8, sub: true },
    draw(s) {
      // spectral hull planks trailing below
      for (let i = 0; i < 4; i++) {
        const y = 44 + i * 4;
        s.line(20 + i, y, 44 - i, y, SPECT.d);
        s.line(20 + i, y + 1, 44 - i, y + 1, SPECT.b);
      }
      s.dither(22, 46, 20, 10, SPECT.l, 1);
      // carved maiden torso (wooden)
      s.ball(32, 30, 10, 12, OAK);
      s.ball(32, 34, 6, 7, OAK, { flat: true, lx: 0.3 });
      // barnacle crust
      s.set(24, 32, BARN.b); s.set(26, 38, BARN.d); s.set(40, 30, BARN.b);
      s.set(38, 40, BARN.l);
      // flowing carved hair
      s.stroke(24, 20, 18, 34, 3, OAK);
      s.stroke(40, 20, 46, 34, 3, OAK);
      s.line(19, 32, 17, 40, SPECT.b);
      s.line(45, 32, 47, 40, SPECT.b);
      // head
      s.ball(32, 18, 7, 7, OAK);
      // spectral glowing eyes
      K.eye(s, 28, 17, 2, '#a8e8f8');
      K.eye(s, 36, 17, 2, '#a8e8f8');
      s.set(28, 17, '#e8fcff'); s.set(36, 17, '#e8fcff');
      // solemn carved mouth
      s.line(30, 22, 34, 22, OAK.o);
      // crown of the prow
      K.horn(s, 32, 11, 0, -1, 5, 2, OAK);
      // outstretched carved arms
      s.limb(23, 30, 15, 26, 3, 2, OAK);
      s.limb(41, 30, 49, 26, 3, 2, OAK);
    },
    drawBack(s) {
      for (let i = 0; i < 4; i++) {
        const y = 44 + i * 4;
        s.line(20 + i, y, 44 - i, y, SPECT.d);
        s.line(20 + i, y + 1, 44 - i, y + 1, SPECT.b);
      }
      s.dither(22, 46, 20, 10, SPECT.l, 0);
      // back of wooden torso, plank grain
      s.ball(32, 30, 11, 12, OAK, { lx: 0, ly: -0.5 });
      s.line(32, 20, 32, 40, OAK.d);
      s.line(27, 24, 27, 40, OAK.d); s.line(37, 24, 37, 40, OAK.d);
      s.set(25, 32, BARN.b); s.set(39, 36, BARN.d);
      // hair flowing down the back
      s.stroke(24, 18, 22, 40, 3, OAK);
      s.stroke(40, 18, 42, 40, 3, OAK);
      s.dither(28, 22, 8, 16, OAK.d, 1);
      // back of head + prow crown
      s.ball(32, 17, 7, 7, OAK, { lx: 0, ly: -0.5 });
      K.horn(s, 32, 10, 0, -1, 5, 2, OAK);
      s.limb(23, 30, 15, 26, 3, 2, OAK);
      s.limb(41, 30, 49, 26, 3, 2, OAK);
    },
  });

  // ============ UMBRAFLOE (shadow beneath the ice) ============
  const SHADE = Px.ramp('#3a3448');
  const FLOE = Px.ramp('#bfe0ec');

  Dex.add({
    id: 85, key: 'umbrafloe', name: 'Umbrafloe', types: ['Dark', 'Ice'],
    base: { hp: 78, atk: 95, def: 80, spa: 62, spd: 75, spe: 80 },
    ability: 'cold_stare', catchRate: 55, expYield: 188, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'bite'], [1, 'frost_dust'], [6, 'shade_sneak'], [12, 'ice_shard'],
      [18, 'snarl'], [24, 'ice_fang'], [30, 'night_slash'], [36, 'icicle_crash'],
      [42, 'crunch'], [48, 'whiteout']],
    tms: ['tm03', 'tm05', 'tm09', 'tm18', 'hm05'],
    dex: { species: 'Floe Shadow', h: '1.4m', w: '54.0kg',
      entry: 'The dark shape gliding under the drift ice. By the time a lone traveler sees the claw break through, it is already too late.' },
    cry: { base: 190, sweep: 0.6, wave: 'sawtooth', dur: 0.6, vib: 6, grit: 0.35 },
    draw(s) {
      // translucent ice sheet across the top
      s.rect(6, 20, 52, 8, FLOE.b);
      s.dither(6, 20, 52, 8, '#ffffff', 0);
      s.line(6, 20, 58, 20, '#e8fcff');
      s.line(6, 28, 58, 28, FLOE.d);
      // crack where the claw breaks through
      s.line(30, 20, 34, 28, '#ffffff'); s.line(34, 28, 32, 34, '#ffffff');
      // dark shadow body below the ice
      s.fillPoly([[10, 30], [32, 28], [54, 30], [50, 48], [32, 54], [14, 48]], SHADE.b);
      s.dither(14, 34, 36, 14, SHADE.d, 1);
      // pale eyes glowing under ice
      K.eye(s, 25, 36, 2, '#a8e8f8');
      K.eye(s, 39, 36, 2, '#a8e8f8');
      s.set(25, 36, '#e8fcff'); s.set(39, 36, '#e8fcff');
      // sinister grin of frost
      for (let i = 0; i < 5; i++) s.set(27 + i * 2, 43, '#c8e8f0');
      s.line(26, 42, 38, 42, SHADE.o);
      // the breaching claw
      s.tri(30, 28, 33, 14, 36, 28, SHADE.b);
      K.claws(s, 31, 15, 3, '#c8e0ec');
    },
    drawBack(s) {
      // from behind: the shadow slipping away under a full ice sheet
      s.rect(6, 18, 52, 10, FLOE.b);
      s.dither(6, 18, 52, 10, '#ffffff', 1);
      s.line(6, 18, 58, 18, '#e8fcff');
      s.line(6, 28, 58, 28, FLOE.d);
      s.line(20, 22, 24, 28, FLOE.d); s.line(42, 20, 40, 27, FLOE.d);
      s.fillPoly([[12, 30], [32, 29], [52, 30], [48, 50], [32, 55], [16, 50]], SHADE.b);
      s.dither(16, 34, 32, 16, SHADE.d, 0);
      // trailing dark fins
      s.tri(14, 44, 8, 52, 20, 50, SHADE.d);
      s.tri(50, 44, 56, 52, 44, 50, SHADE.d);
      // faint under-ice glow of the eyes seen through the back
      s.set(27, 38, SPECT.d); s.set(37, 38, SPECT.d);
    },
  });

  // ============ FORGELING LINE (forge wyrmlet -> iron wyrm) ============
  const IRON = Px.ramp('#8a94a4');
  const IROND = Px.ramp('#5a6474');
  const FORGE = Px.ramp('#e88038');
  const RIVET = Px.ramp('#c8ccd4');

  Dex.add({
    id: 86, key: 'forgeling', name: 'Forgeling', types: ['Steel', 'Dragon'],
    base: { hp: 55, atk: 68, def: 78, spa: 55, spd: 58, spe: 42 },
    ability: 'hearth_core', catchRate: 60, expYield: 120, growth: 'slow', gender: 50,
    evolve: { to: 'jarnwyrm', level: 38 },
    learn: [[1, 'metal_claw'], [1, 'twister'], [6, 'cinder_shot'], [12, 'iron_ram'],
      [18, 'dragon_breath'], [25, 'comet_fist'], [32, 'dragon_claw'], [38, 'anchor_slam']],
    tms: ['tm09', 'tm20', 'tm22', 'hm04', 'hm06'],
    dex: { species: 'Forge Wyrmlet', h: '0.7m', w: '42.0kg',
      entry: 'Hatched in the heart of an Irondeep forge, it curls around a lump of ember-iron and will not let it cool.' },
    cry: { base: 320, sweep: 0.7, wave: 'square', dur: 0.45, vib: 8, grit: 0.45 },
    draw(s) {
      // curled around an ember anvil-lump
      s.ball(34, 46, 6, 5, FORGE, { flat: true });
      s.set(34, 46, '#f8e048');
      // riveted body coiled
      s.stroke(20, 44, 30, 50, 5, IRON);
      s.stroke(30, 50, 44, 46, 5, IRON);
      s.ball(24, 34, 8, 8, IRON);
      // plate seams + rivets
      s.line(18, 44, 30, 48, IROND.d);
      s.set(22, 42, RIVET.l); s.set(28, 48, RIVET.l); s.set(38, 47, RIVET.l);
      // stubby wing-fins
      K.horn(s, 30, 30, 0.8, -0.6, 6, 2, IRON);
      // head
      s.ball(22, 30, 6, 5, IRON);
      s.tri(16, 30, 10, 31, 17, 34, IRON.b); // snout
      s.set(12, 31, IROND.o);
      // ember eye
      K.eye(s, 20, 29, 2, '#f8a038');
      K.brow(s, 20, 26, 2);
      // forge glow between plates
      s.set(27, 40, FORGE.b); s.set(35, 48, FORGE.l);
    },
    drawBack(s) {
      s.stroke(20, 44, 30, 50, 5, IRON);
      s.stroke(30, 50, 44, 46, 5, IRON);
      s.ball(26, 34, 9, 9, IRON, { lx: 0, ly: -0.5 });
      // riveted spine plates
      for (let i = 0; i < 4; i++) s.ball(24 + i * 5, 40 + Math.sin(i) * 2, 3, 2, IROND, { flat: true });
      s.set(22, 36, RIVET.l); s.set(30, 34, RIVET.l);
      K.horn(s, 30, 29, 0.8, -0.6, 6, 2, IRON);
      K.horn(s, 20, 29, -0.8, -0.6, 5, 2, IRON);
      s.set(28, 46, FORGE.b);
    },
  });

  Dex.add({
    id: 87, key: 'jarnwyrm', name: 'Jarnwyrm', types: ['Steel', 'Dragon'],
    base: { hp: 90, atk: 105, def: 115, spa: 78, spd: 82, spe: 60 },
    ability: 'iron_frame', catchRate: 40, expYield: 218, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'metal_claw'], [1, 'twister'], [1, 'iron_ram'], [12, 'dragon_breath'],
      [18, 'fire_fang'], [25, 'comet_fist'], [32, 'dragon_claw'], [40, 'anchor_slam'],
      [48, 'primal_rage'], [56, 'star_cataclysm']],
    tms: ['tm09', 'tm20', 'tm22', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Iron Wyrm', h: '3.6m', w: '310.0kg',
      entry: 'Its riveted plates ring like a smith\'s hammer when it moves. Molten light bleeds from the seams between every segment.' },
    cry: { base: 175, sweep: 0.5, wave: 'sawtooth', dur: 0.8, vib: 6, grit: 0.55, sub: true },
    draw(s) {
      // long riveted serpentine body
      s.stroke(10, 52, 26, 54, 6, IRON);
      s.stroke(26, 54, 42, 48, 6, IRON);
      s.stroke(42, 48, 50, 36, 6, IRON);
      // segment seams with molten glow
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const x = 12 + t * 36, y = 52 - Math.sin(t * 2) * 4;
        s.line(x, y - 5, x, y + 5, IROND.o);
        s.set(x, y, FORGE.b);
      }
      s.set(18, 48, RIVET.l); s.set(30, 52, RIVET.l); s.set(44, 44, RIVET.l);
      // rising armored neck
      s.stroke(48, 38, 44, 24, 5, IRON);
      // head: angular iron wedge
      s.ball(42, 20, 8, 6, IRON);
      s.tri(48, 18, 58, 20, 49, 24, IRON.b); // long jaw
      s.line(50, 21, 56, 21, IROND.o);
      K.fang(s, 50, 21, '#e8ecf4'); K.fang(s, 54, 20, '#e8ecf4');
      // iron horns
      K.horn(s, 38, 15, -0.6, -0.9, 8, 2, IROND);
      K.horn(s, 44, 14, 0.4, -1, 8, 2, IROND);
      // molten eye
      K.eye(s, 42, 19, 2, '#f8b038');
      K.brow(s, 42, 16, 2);
      // fin-blades along back
      K.horn(s, 30, 48, 0, -1, 5, 2, IROND);
      K.horn(s, 20, 50, 0, -1, 4, 2, IROND);
    },
    drawBack(s) {
      s.stroke(10, 52, 26, 54, 6, IRON);
      s.stroke(26, 54, 42, 48, 6, IRON);
      s.stroke(42, 48, 50, 36, 6, IRON);
      // spine ridge of blades toward camera
      for (let i = 0; i < 6; i++) {
        const t = i / 6;
        const x = 14 + t * 34, y = 50 - Math.sin(t * 2) * 5;
        K.horn(s, x, y, 0, -1, 5, 2, IROND);
        s.set(x, y + 2, FORGE.b);
      }
      s.stroke(48, 38, 44, 24, 5, IRON);
      s.ball(42, 19, 8, 6, IRON, { lx: 0, ly: -0.5 });
      s.ball(42, 18, 5, 3, IROND, { flat: true });
      K.horn(s, 37, 14, -0.6, -0.9, 8, 2, IROND);
      K.horn(s, 47, 14, 0.5, -0.9, 8, 2, IROND);
      s.set(20, 50, RIVET.l); s.set(34, 50, RIVET.l);
    },
  });

  // ============ SKJALDHAWK (shield-maiden hawk) ============
  const HAWK = Px.ramp('#8a6a48');
  const HAWKD = Px.ramp('#5e4632');
  const SHIELD = Px.ramp('#c85848');
  const RIM = Px.ramp('#d8c060');

  Dex.add({
    id: 88, key: 'skjaldhawk', name: 'Skjaldhawk', types: ['Flying', 'Fighting'],
    base: { hp: 82, atk: 108, def: 92, spa: 60, spd: 78, spe: 70 },
    ability: 'keen_edge', catchRate: 50, expYield: 194, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'peck'], [1, 'chop_strike'], [7, 'wing_strike'], [13, 'sweep_kick'],
      [19, 'gale_blade'], [25, 'slab_breaker'], [31, 'steel_wing'], [37, 'all_out_assault'],
      [43, 'dive_bomber']],
    tms: ['tm16', 'tm20', 'hm02', 'hm06'],
    dex: { species: 'Shield Hawk', h: '1.5m', w: '46.0kg',
      entry: 'Its wings are painted like war-shields. It clashes them together to sound a challenge that echoes off the fjords.' },
    cry: { base: 560, sweep: 0.55, wave: 'square', dur: 0.5, vib: 12, chirps: 1 },
    draw(s) {
      // taloned legs
      s.limb(28, 50, 27, 57, 2, 1.5, HAWKD); K.claws(s, 25, 57, 3, RIM.b);
      s.limb(36, 50, 37, 57, 2, 1.5, HAWKD); K.claws(s, 35, 57, 3, RIM.b);
      // upright warrior body
      s.ball(32, 40, 9, 11, HAWK);
      s.ball(32, 44, 5, 6, RIM, { flat: true }); // breastplate
      // shield wings spread
      s.fillPoly([[22, 30], [8, 34], [10, 48], [24, 46]], SHIELD.b);
      s.fillPoly([[42, 30], [56, 34], [54, 48], [40, 46]], SHIELD.b);
      // shield rims + boss
      s.line(8, 34, 10, 48, RIM.d); s.line(56, 34, 54, 48, RIM.d);
      s.ball(15, 40, 2.5, 2.5, RIM); s.ball(49, 40, 2.5, 2.5, RIM);
      s.line(15, 34, 15, 46, SHIELD.d); s.line(49, 34, 49, 46, SHIELD.d);
      // fierce hawk head
      s.ball(32, 24, 7, 6, HAWK);
      s.tri(32, 26, 30, 32, 34, 32, RIM.b); // beak
      s.set(32, 30, HAWKD.o);
      // crest feathers
      K.horn(s, 30, 18, -0.4, -1, 5, 2, HAWKD);
      K.horn(s, 34, 18, 0.4, -1, 5, 2, HAWKD);
      // sharp eyes
      K.eye(s, 29, 23, 2, '#f8c038');
      K.eye(s, 35, 23, 2, '#f8c038');
      K.brow(s, 29, 20, 2); K.brow(s, 35, 20, 2);
    },
    drawBack(s) {
      s.limb(28, 50, 27, 57, 2, 1.5, HAWKD);
      s.limb(36, 50, 37, 57, 2, 1.5, HAWKD);
      s.ball(32, 40, 10, 12, HAWK, { lx: 0, ly: -0.5 });
      // folded shield-wings from behind (backs are plain wood)
      s.fillPoly([[22, 30], [9, 34], [11, 48], [24, 46]], HAWK.b);
      s.fillPoly([[42, 30], [55, 34], [53, 48], [40, 46]], HAWK.b);
      s.line(16, 32, 16, 47, HAWKD.d); s.line(48, 32, 48, 47, HAWKD.d);
      s.dither(12, 34, 10, 12, HAWK.d, 1); s.dither(42, 34, 10, 12, HAWK.d, 0);
      // tail feathers
      s.tri(28, 50, 32, 60, 36, 50, HAWKD.b);
      // back of head + crest
      s.ball(32, 24, 7, 6, HAWK, { lx: 0, ly: -0.5 });
      K.horn(s, 30, 18, -0.4, -1, 5, 2, HAWKD);
      K.horn(s, 34, 18, 0.4, -1, 5, 2, HAWKD);
      s.ball(32, 24, 4, 3, HAWKD, { flat: true });
    },
  });

  // ============ CUBBLY LINE (snow bear) ============
  const BEAR = Px.ramp('#c8b89a');
  const BEARD = Px.ramp('#9a8868');
  const SNOWB = Px.ramp('#e8f0f8');

  Dex.add({
    id: 89, key: 'cubbly', name: 'Cubbly', types: ['Normal'],
    base: { hp: 65, atk: 60, def: 55, spa: 40, spd: 48, spe: 42 },
    ability: 'grit', catchRate: 180, expYield: 118, growth: 'medfast', gender: 50,
    evolve: { to: 'ursnow', level: 30 },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'headbutt'], [10, 'fury_swipes'],
      [15, 'howl'], [20, 'body_slam'], [26, 'slam'], [32, 'reckless_charge']],
    tms: ['tm12', 'tm25', 'hm04'],
    dex: { species: 'Cub', h: '0.7m', w: '18.0kg',
      entry: 'A roly-poly snow-bear cub. It licks its paws for warmth and tumbles down drifts for the sheer joy of it.' },
    cry: { base: 440, sweep: 0.75, wave: 'triangle', dur: 0.45, vib: 14, chirps: 1 },
    draw(s) {
      // round cub body
      s.ball(32, 42, 12, 11, BEAR);
      s.ball(32, 46, 7, 6, SNOWB, { flat: true });
      // stubby legs
      s.ball(24, 53, 4, 3, BEAR, { flat: true });
      s.ball(40, 53, 4, 3, BEAR, { flat: true });
      // paws (one raised, licking)
      s.ball(21, 42, 3, 3, BEAR, { flat: true });
      s.ball(43, 40, 3, 3, BEAR, { flat: true });
      // head
      s.ball(32, 26, 9, 8, BEAR);
      // round ears
      s.ball(25, 20, 3, 3, BEAR); s.ball(39, 20, 3, 3, BEAR);
      s.set(25, 20, BEARD.d); s.set(39, 20, BEARD.d);
      // muzzle
      s.ball(32, 29, 4, 3, SNOWB, { flat: true });
      s.set(32, 28, '#1a1418');
      // eyes
      K.eye(s, 28, 25, 2, '#5a4632');
      K.eye(s, 36, 25, 2, '#5a4632');
      K.smile(s, 32, 31, 1);
      K.cheek(s, 24, 28, '#e8c0b0'); K.cheek(s, 40, 28, '#e8c0b0');
    },
    drawBack(s) {
      s.ball(32, 42, 13, 12, BEAR, { lx: 0, ly: -0.5 });
      s.dither(24, 34, 16, 14, BEARD.b, 1);
      s.ball(24, 53, 4, 3, BEAR, { flat: true });
      s.ball(40, 53, 4, 3, BEAR, { flat: true });
      // little tail
      s.ball(32, 50, 2.5, 2.5, SNOWB, { flat: true });
      // back of head + ears (no face)
      s.ball(32, 25, 9, 8, BEAR, { lx: 0, ly: -0.5 });
      s.ball(25, 19, 3, 3, BEAR); s.ball(39, 19, 3, 3, BEAR);
      s.set(25, 19, BEARD.d); s.set(39, 19, BEARD.d);
      s.ball(32, 24, 5, 4, BEARD, { flat: true });
    },
  });

  Dex.add({
    id: 90, key: 'ursnow', name: 'Ursnow', types: ['Normal', 'Ice'],
    base: { hp: 95, atk: 100, def: 85, spa: 60, spd: 75, spe: 80 },
    ability: 'blubber', catchRate: 55, expYield: 200, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'headbutt'], [10, 'fury_swipes'],
      [15, 'ice_fang'], [20, 'body_slam'], [26, 'icicle_crash'], [32, 'frost_armor'],
      [38, 'reckless_charge'], [45, 'whiteout']],
    tms: ['tm03', 'tm09', 'tm12', 'tm25', 'hm04'],
    dex: { species: 'Snow Bear', h: '2.2m', w: '260.0kg',
      entry: 'It plows through blizzards without slowing. Its breath plumes so thick that hunters mistake it for a moving snow-squall.' },
    cry: { base: 210, sweep: 0.55, wave: 'triangle', dur: 0.75, vib: 8, grit: 0.4, sub: true },
    draw(s) {
      // powerful legs
      s.limb(24, 48, 22, 58, 4, 3, BEAR); K.claws(s, 18, 60, 3, SNOWB.b);
      s.limb(40, 48, 42, 58, 4, 3, BEAR); K.claws(s, 40, 60, 3, SNOWB.b);
      // hulking body
      s.ball(32, 38, 15, 15, BEAR);
      s.ball(32, 44, 9, 8, SNOWB, { flat: true });
      // frost saddle marking
      s.ball(32, 30, 12, 5, SNOWB, { flat: true });
      s.dither(22, 28, 20, 4, '#ffffff', 0);
      // massive arms
      s.limb(19, 34, 12, 46, 4, 4, BEAR); K.claws(s, 9, 49, 3, SNOWB.b);
      s.limb(45, 34, 52, 46, 4, 4, BEAR); K.claws(s, 49, 49, 3, SNOWB.b);
      // head
      s.ball(32, 20, 9, 8, BEAR);
      s.ball(26, 15, 3, 3, BEAR); s.ball(38, 15, 3, 3, BEAR);
      s.ball(32, 23, 4, 3, SNOWB, { flat: true });
      s.set(32, 22, '#1a1418');
      // fierce eyes + breath plume
      K.eye(s, 28, 19, 2, '#8ac0e0');
      K.eye(s, 36, 19, 2, '#8ac0e0');
      K.brow(s, 28, 16, 2); K.brow(s, 37, 16, 2);
      K.fang(s, 30, 24, '#fff'); K.fang(s, 33, 24, '#fff');
      s.set(38, 25, '#e8f4ff'); s.set(40, 24, '#d8ecfc'); // breath
    },
    drawBack(s) {
      s.limb(24, 48, 22, 58, 4, 3, BEAR);
      s.limb(40, 48, 42, 58, 4, 3, BEAR);
      s.ball(32, 38, 16, 16, BEAR, { lx: 0, ly: -0.5 });
      // frosted back
      s.ball(32, 32, 13, 8, SNOWB, { flat: true });
      s.dither(20, 28, 24, 10, '#ffffff', 1);
      s.limb(18, 34, 11, 46, 4, 4, BEAR);
      s.limb(46, 34, 53, 46, 4, 4, BEAR);
      // back of head + ears
      s.ball(32, 19, 9, 8, BEAR, { lx: 0, ly: -0.5 });
      s.ball(26, 14, 3, 3, BEAR); s.ball(38, 14, 3, 3, BEAR);
      s.ball(32, 18, 5, 4, BEARD, { flat: true });
    },
  });

  // ============ SEIDKONA (veiled seer hag) ============
  const ROBE = Px.ramp('#4a4068');
  const ROBEL = Px.ramp('#6a5e90');
  const VEIL = Px.ramp('#b8a8d8');
  const GHOSTG = Px.ramp('#7a6ea8');

  Dex.add({
    id: 91, key: 'seidkona', name: 'Seidkona', types: ['Psychic', 'Ghost'],
    base: { hp: 78, atk: 55, def: 78, spa: 112, spd: 100, spe: 62 },
    ability: 'looming_dread', catchRate: 45, expYield: 196, growth: 'slow', gender: 0,
    evolve: null,
    learn: [[1, 'confusion'], [1, 'astonish'], [7, 'psybeam'], [13, 'shade_sneak'],
      [19, 'mind_temper'], [25, 'phantom_orb'], [31, 'mind_crush'], [37, 'mesmerize'],
      [43, 'haunt'], [49, 'dream_pulse']],
    tms: ['tm04', 'tm05', 'tm17', 'tm18', 'hm05'],
    dex: { species: 'Veiled Seer', h: '1.6m', w: '???kg',
      entry: 'A hooded seeress who drifts a hand-span above the snow. Those who glimpse the single eye behind her veil dream only of it for a year.' },
    cry: { base: 280, sweep: 1.4, wave: 'sine', dur: 0.7, vib: 20, vibRate: 5 },
    draw(s) {
      // hovering robed figure (no legs)
      s.fillPoly([[32, 16], [46, 34], [48, 52], [32, 56], [16, 52], [18, 34]], ROBE.b);
      s.dither(20, 38, 24, 14, ROBEL.b, 1);
      // hem tatters
      for (let i = 0; i < 5; i++) s.tri(18 + i * 6, 52, 21 + i * 6, 58, 24 + i * 6, 52, ROBE.d);
      // trailing spectral wisp below
      s.set(32, 58, GHOSTG.l); s.set(30, 59, GHOSTG.b); s.set(34, 59, GHOSTG.b);
      // draped sleeves + distaff staff
      s.limb(20, 34, 12, 44, 3, 2, ROBE);
      s.limb(44, 34, 52, 30, 3, 2, ROBE);
      s.line(52, 24, 52, 40, OAK.b); // staff
      s.ball(52, 22, 2.5, 2.5, RIM); // staff head
      // hood
      s.fillPoly([[32, 8], [42, 22], [22, 22]], ROBE.b);
      s.line(22, 22, 32, 8, ROBEL.l);
      // veil shadow
      s.ball(32, 20, 6, 4, '#2a2440', { flat: true });
      // single glowing eye behind veil
      s.fillCircle(32, 20, 2, '#d8b0f0');
      s.set(32, 20, '#f8e0ff');
      // faint veil shimmer
      s.set(28, 19, VEIL.b); s.set(36, 19, VEIL.b); s.set(32, 23, VEIL.d);
    },
    drawBack(s) {
      // from behind: the hood and robe back, staff jutting at side
      s.fillPoly([[32, 16], [46, 34], [48, 52], [32, 56], [16, 52], [18, 34]], ROBE.b);
      s.line(32, 18, 32, 54, ROBEL.d);
      s.dither(20, 36, 24, 16, ROBE.d, 0);
      for (let i = 0; i < 5; i++) s.tri(18 + i * 6, 52, 21 + i * 6, 58, 24 + i * 6, 52, ROBE.d);
      // hood from behind (pointed)
      s.fillPoly([[32, 8], [42, 24], [22, 24]], ROBE.b);
      s.ball(32, 18, 5, 5, ROBEL, { flat: true });
      // staff
      s.limb(44, 34, 52, 30, 3, 2, ROBE);
      s.line(52, 24, 52, 40, OAK.b);
      s.ball(52, 22, 2.5, 2.5, RIM);
      // spectral trail
      s.set(32, 58, GHOSTG.l);
    },
  });

  // ============ RATTENKIN (plague rat trickster) ============
  const RATF = Px.ramp('#6a5e50');
  const RATD = Px.ramp('#463c34');
  const HOOD = Px.ramp('#6a7048');
  const COIN = Px.ramp('#d8c060');

  Dex.add({
    id: 92, key: 'rattenkin', name: 'Rattenkin', types: ['Dark', 'Poison'],
    base: { hp: 70, atk: 88, def: 66, spa: 74, spd: 66, spe: 96 },
    ability: 'slippery', catchRate: 90, expYield: 178, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'venom_barb'], [6, 'bite'], [12, 'fury_swipes'],
      [18, 'sludge'], [24, 'cheap_shot'], [30, 'crunch'], [36, 'fang_of_rot'],
      [42, 'snarl'], [48, 'sludge_blast']],
    tms: ['tm05', 'tm06', 'tm10', 'tm25', 'hm04'],
    dex: { species: 'Plague Trickster', h: '1.0m', w: '22.0kg',
      entry: 'A cunning rat that stitches itself a hood from stolen scraps. It always carries one coin it will never, ever spend.' },
    cry: { base: 480, sweep: 0.6, wave: 'sawtooth', dur: 0.4, vib: 14, grit: 0.3 },
    draw(s) {
      // long tail
      s.stroke(42, 48, 54, 40, 2, RATD);
      s.stroke(54, 40, 56, 32, 1.5, RATD);
      // hunched body
      s.ball(32, 42, 10, 10, RATF);
      s.ball(30, 46, 6, 5, RATD, { flat: true });
      // stitched hood over shoulders
      s.fillPoly([[24, 30], [40, 30], [42, 40], [22, 40]], HOOD.b);
      s.line(24, 30, 22, 40, HOOD.d);
      for (let i = 0; i < 4; i++) s.set(26 + i * 4, 35, HOOD.l); // stitches
      // feet + clawed hands
      s.ball(26, 52, 3, 2, RATD, { flat: true });
      s.ball(38, 52, 3, 2, RATD, { flat: true });
      s.ball(42, 44, 2.5, 2.5, RATF, { flat: true });
      s.ball(42, 42, 2, 2, COIN, { flat: true }); // the coin
      s.set(42, 42, '#f8e890');
      // ratty head under hood
      s.ball(31, 30, 6, 5, RATF);
      s.tri(26, 30, 20, 32, 27, 34, RATF.b); // snout
      s.set(21, 32, '#1a1418'); // nose
      // big ears
      s.ball(28, 24, 3, 3, RATF); s.ball(36, 24, 3, 3, RATF);
      s.set(28, 24, RATD.d); s.set(36, 24, RATD.d);
      // sly eyes
      K.eye(s, 29, 30, 2, '#d84838');
      K.brow(s, 29, 27, 2);
      s.set(24, 32, RATD.d); s.set(24, 31, RATD.d); // whisker
    },
    drawBack(s) {
      s.stroke(42, 48, 54, 40, 2, RATD);
      s.stroke(54, 40, 56, 32, 1.5, RATD);
      s.ball(32, 42, 11, 11, RATF, { lx: 0, ly: -0.5 });
      // hood from behind covers most of the back
      s.fillPoly([[22, 28], [42, 28], [44, 44], [20, 44]], HOOD.b);
      s.line(32, 28, 32, 44, HOOD.d);
      s.dither(24, 32, 16, 10, HOOD.d, 1);
      for (let i = 0; i < 5; i++) s.set(24 + i * 4, 30, HOOD.l);
      // ears poking from hood
      s.ball(28, 25, 3, 3, RATF); s.ball(36, 25, 3, 3, RATF);
      s.ball(26, 52, 3, 2, RATD, { flat: true });
      s.ball(38, 52, 3, 2, RATD, { flat: true });
    },
  });

  // ============ DRILLVOLE (drill-nosed vole) ============
  const VOLE = Px.ramp('#a07850');
  const VOLED = Px.ramp('#6e5236');
  const DRILL = Px.ramp('#a8aebc');

  Dex.add({
    id: 93, key: 'drillvole', name: 'Drillvole', types: ['Ground', 'Steel'],
    base: { hp: 72, atk: 100, def: 88, spa: 50, spd: 60, spe: 85 },
    ability: 'dust_devil', catchRate: 80, expYield: 180, growth: 'medfast', gender: 50,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'mud_shot'], [6, 'metal_claw'], [12, 'burrow_strike'],
      [18, 'bulldoze'], [24, 'iron_ram'], [30, 'comet_fist'], [36, 'earthshatter'],
      [42, 'anchor_slam']],
    tms: ['tm07', 'tm09', 'tm14', 'hm04', 'hm06'],
    dex: { species: 'Drill Vole', h: '0.9m', w: '34.0kg',
      entry: 'Its steel snout spins fast enough to bore through Irondeep\'s hardest ore. It surfaces only to sneeze out the tailings.' },
    cry: { base: 380, sweep: 0.75, wave: 'sawtooth', dur: 0.45, vib: 10, grit: 0.5 },
    draw(s) {
      // burly digging body
      s.ball(34, 42, 12, 10, VOLE);
      s.ball(34, 46, 7, 5, Px.ramp('#c8a878'), { flat: true });
      // powerful clawed forelimbs
      s.limb(26, 42, 20, 50, 3, 3, VOLE);
      K.claws(s, 16, 52, 3, DRILL.b);
      s.ball(44, 46, 3, 3, VOLE, { flat: true });
      // hind feet
      s.ball(30, 52, 3, 2, VOLED, { flat: true });
      s.ball(40, 52, 3, 2, VOLED, { flat: true });
      // head
      s.ball(28, 34, 6, 6, VOLE);
      // spinning drill snout
      for (let i = 0; i < 4; i++) {
        const x = 22 - i * 3;
        s.ball(x, 34, 4 - i * 0.7, 4 - i * 0.7, DRILL, { flat: true });
      }
      s.line(24, 31, 12, 34, DRILL.l); s.line(24, 37, 12, 34, DRILL.d); // drill tip
      s.set(10, 34, DRILL.h);
      // spiral grooves
      s.set(19, 32, DRILL.d); s.set(16, 35, DRILL.d);
      // eye
      K.eye(s, 29, 33, 2, '#4a3826');
      K.brow(s, 29, 30, 2);
      // ear
      s.ball(32, 28, 2.5, 2.5, VOLE);
    },
    drawBack(s) {
      s.ball(34, 42, 13, 11, VOLE, { lx: 0, ly: -0.5 });
      // steely dorsal plates
      for (let i = 0; i < 3; i++) s.ball(30 + i * 5, 38 + i, 3, 2, DRILL, { flat: true });
      s.dither(26, 42, 16, 10, VOLED.b, 1);
      s.ball(30, 52, 3, 2, VOLED, { flat: true });
      s.ball(40, 52, 3, 2, VOLED, { flat: true });
      // tail
      s.stroke(46, 44, 52, 48, 1.5, VOLED);
      // back of head, drill jutting past the side
      s.ball(28, 34, 6, 6, VOLE, { lx: 0, ly: -0.5 });
      s.ball(21, 34, 3, 3, DRILL, { flat: true });
      s.line(20, 32, 14, 34, DRILL.d);
      s.ball(32, 28, 2.5, 2.5, VOLE);
    },
  });

  // ============ CINDERCRAG (smoldering crag hound) ============
  const BASALT = Px.ramp('#5a5058');
  const BASALTL = Px.ramp('#7a7078');
  const LAVA = Px.ramp('#f07838');

  Dex.add({
    id: 94, key: 'cindercrag', name: 'Cindercrag', types: ['Fire', 'Rock'],
    base: { hp: 84, atk: 100, def: 96, spa: 70, spd: 65, spe: 60 },
    ability: 'kindled_heart', catchRate: 60, expYield: 190, growth: 'medslow', gender: 50,
    evolve: null,
    learn: [[1, 'bite'], [1, 'cinder_shot'], [6, 'rock_throw'], [12, 'fire_fang'],
      [18, 'rock_slide'], [24, 'flame_wheel'], [30, 'crunch'], [36, 'stone_spike'],
      [42, 'blaze_charge'], [48, 'inferno_burst']],
    tms: ['tm08', 'tm11', 'tm14', 'tm15', 'hm06'],
    dex: { species: 'Crag Hound', h: '1.3m', w: '148.0kg',
      entry: 'A hound of cooled basalt with a furnace still roaring inside. It sleeps in the Cinder Vents and wakes hungry, cracks glowing.' },
    cry: { base: 220, sweep: 0.6, wave: 'sawtooth', dur: 0.6, vib: 8, grit: 0.55, sub: true },
    draw(s) {
      // sturdy legs
      s.limb(24, 48, 22, 57, 3.5, 3, BASALT);
      s.limb(40, 48, 42, 57, 3.5, 3, BASALT);
      s.limb(29, 49, 28, 57, 3, 2.5, BASALT);
      s.limb(37, 49, 38, 57, 3, 2.5, BASALT);
      // basalt-plate body
      s.ball(32, 40, 13, 10, BASALT);
      // glowing lava cracks
      s.line(24, 38, 30, 42, LAVA.b); s.line(34, 36, 40, 41, LAVA.b);
      s.line(28, 44, 33, 46, LAVA.l);
      s.set(30, 40, '#f8e048'); s.set(37, 39, '#f8c038');
      // plated back ridge
      K.horn(s, 28, 32, -0.2, -1, 5, 2, BASALTL);
      K.horn(s, 36, 32, 0.2, -1, 5, 2, BASALTL);
      // head
      s.ball(26, 34, 8, 7, BASALT);
      s.tri(18, 34, 12, 36, 19, 39, BASALT.b); // muzzle
      s.line(14, 36, 19, 36, LAVA.b); // molten maw
      K.fang(s, 15, 35, '#f8e0c0');
      // glowing eye
      K.eye(s, 24, 33, 2, '#f8a038');
      K.brow(s, 24, 30, 2);
      // ember mane
      s.set(30, 27, LAVA.b); s.set(33, 26, LAVA.l); s.set(28, 28, LAVA.d);
    },
    drawBack(s) {
      s.limb(24, 48, 22, 57, 3.5, 3, BASALT);
      s.limb(40, 48, 42, 57, 3.5, 3, BASALT);
      s.limb(29, 49, 28, 57, 3, 2.5, BASALT);
      s.limb(37, 49, 38, 57, 3, 2.5, BASALT);
      s.ball(32, 40, 14, 11, BASALT, { lx: 0, ly: -0.5 });
      // ridge of basalt spines with glowing seams
      for (let i = 0; i < 4; i++) {
        K.horn(s, 25 + i * 5, 34, 0, -1, 5, 2, BASALTL);
        s.set(25 + i * 5, 38, LAVA.b);
      }
      s.dither(24, 38, 16, 10, BASALT.d, 1);
      s.line(26, 44, 38, 46, LAVA.d);
      // back of head
      s.ball(26, 34, 8, 7, BASALT, { lx: 0, ly: -0.5 });
      s.ball(26, 33, 5, 4, BASALTL, { flat: true });
      s.set(30, 28, LAVA.b);
    },
  });

  // ============ FROSTFERN (frozen fern spirit; Aurora-Stone branch of glacierling) ============
  const FERN = Px.ramp('#4e8a5a');
  const FERNL = Px.ramp('#78b884');
  const FROST = Px.ramp('#cfe8f0');

  Dex.add({
    id: 95, key: 'frostfern', name: 'Frostfern', types: ['Grass', 'Ice'],
    base: { hp: 80, atk: 70, def: 95, spa: 100, spd: 90, spe: 40 },
    ability: 'snow_skater', catchRate: 45, expYield: 205, growth: 'slow', gender: -1,
    evolve: null,
    learn: [[1, 'vine_lash'], [1, 'frost_dust'], [8, 'razor_leaf'], [14, 'ice_shard'],
      [20, 'photomend'], [26, 'glacier_ray'], [32, 'seed_bomb'], [38, 'frost_armor'],
      [44, 'icicle_crash'], [50, 'sunpierce']],
    tms: ['tm03', 'tm09', 'tm19', 'tm24', 'hm05'],
    dex: { species: 'Rime Fern', h: '1.4m', w: '43.0kg',
      entry: 'When a glacierling crystallizes under the aurora, its heart sprouts an eternal fern of frost that never wilts and never thaws.' },
    cry: { base: 330, sweep: 1.2, wave: 'triangle', dur: 0.6, vib: 16, chirps: 1 },
    draw(s) {
      // icy root-base
      s.ball(32, 52, 9, 5, FROST);
      s.stroke(28, 54, 24, 58, 1.5, FROST);
      s.stroke(36, 54, 40, 58, 1.5, FROST);
      // frosted fern fronds fanning up
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i - 2) * 0.42;
        const ex = 32 + Math.cos(ang) * 22, ey = 44 + Math.sin(ang) * 24;
        s.stroke(32, 44, ex, ey, 1.5, FERN);
        // frond leaflets
        for (let j = 1; j <= 5; j++) {
          const t = j / 6;
          const lx = Util.lerp(32, ex, t), ly = Util.lerp(44, ey, t);
          const perp = ang + Math.PI / 2;
          s.set(lx + Math.cos(perp) * 2, ly + Math.sin(perp) * 2, j % 2 ? FERNL.b : FERN.l);
          s.set(lx - Math.cos(perp) * 2, ly - Math.sin(perp) * 2, j % 2 ? FERNL.b : FERN.l);
        }
        s.set(ex, ey, FROST.h); // frosted tip
      }
      // central bulb with a serene face
      s.ball(32, 44, 7, 6, FERN);
      s.ball(32, 46, 4, 3, FROST, { flat: true });
      K.eye(s, 29, 43, 2, '#3a6a8a');
      K.eye(s, 35, 43, 2, '#3a6a8a');
      s.set(29, 43, '#a8e8f8'); s.set(35, 43, '#a8e8f8');
      K.smile(s, 32, 47, 1);
      // frost crystals on the bulb
      s.set(26, 41, FROST.h); s.set(38, 42, FROST.h);
    },
    drawBack(s) {
      s.ball(32, 52, 9, 5, FROST, { lx: 0, ly: -0.5 });
      // fronds from behind (darker, frost-tipped)
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i - 2) * 0.42;
        const ex = 32 + Math.cos(ang) * 22, ey = 44 + Math.sin(ang) * 24;
        s.stroke(32, 44, ex, ey, 1.5, FERN);
        for (let j = 1; j <= 5; j++) {
          const t = j / 6;
          const lx = Util.lerp(32, ex, t), ly = Util.lerp(44, ey, t);
          const perp = ang + Math.PI / 2;
          s.set(lx + Math.cos(perp) * 2, ly + Math.sin(perp) * 2, FERN.d);
          s.set(lx - Math.cos(perp) * 2, ly - Math.sin(perp) * 2, FERN.d);
        }
        s.set(ex, ey, FROST.h);
      }
      s.ball(32, 44, 7, 6, FERN, { lx: 0, ly: -0.5 });
      s.ball(32, 43, 5, 4, Px.shift(FERN.d, 0, 0, -0.05), { flat: true });
      s.set(28, 40, FROST.h); s.set(36, 41, FROST.h);
    },
  });

  // ============ DREAMLYN (dream-weaver sheep) ============
  const WOOL = Px.ramp('#dcd0ec');
  const WOOLD = Px.ramp('#b0a0d0');
  const FACE = Px.ramp('#c8a888');

  Dex.add({
    id: 96, key: 'dreamlyn', name: 'Dreamlyn', types: ['Fairy', 'Psychic'],
    base: { hp: 90, atk: 55, def: 78, spa: 105, spd: 100, spe: 42 },
    ability: 'clear_mind', catchRate: 45, expYield: 200, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'fae_wind'], [1, 'confusion'], [8, 'charm'], [14, 'psybeam'],
      [20, 'glimmer_kiss'], [26, 'mind_temper'], [32, 'moonveil_blast'], [38, 'mesmerize'],
      [44, 'dream_pulse'], [50, 'starlight_heal']],
    tms: ['tm04', 'tm09', 'tm17', 'tm19', 'hm05'],
    dex: { species: 'Dream Ewe', h: '1.1m', w: '38.0kg',
      entry: 'Its cloud-soft wool drinks in dreams as it drifts off. Shepherds who nap against it wake with the answer to a question they forgot they had.' },
    cry: { base: 400, sweep: 1.3, wave: 'sine', dur: 0.7, vib: 22, vibRate: 5, chirps: 1 },
    draw(s) {
      // little hooved legs
      s.limb(26, 50, 25, 56, 1.5, 1.5, FACE); s.set(25, 57, ROBE.o);
      s.limb(32, 50, 32, 56, 1.5, 1.5, FACE); s.set(32, 57, ROBE.o);
      s.limb(38, 50, 39, 56, 1.5, 1.5, FACE); s.set(39, 57, ROBE.o);
      // big cloud-wool body
      s.ball(32, 40, 14, 12, WOOL);
      // wool puff texture
      s.ball(22, 36, 4, 4, WOOL); s.ball(42, 36, 4, 4, WOOL);
      s.ball(24, 46, 4, 3, WOOL); s.ball(40, 46, 4, 3, WOOL);
      s.dither(22, 34, 20, 12, WOOLD.l, 0);
      // sleepy face nestled in wool
      s.ball(32, 30, 6, 5, FACE);
      // closed sleepy eyes
      s.line(28, 30, 31, 30, '#5a4632'); s.line(33, 30, 36, 30, '#5a4632');
      s.set(29, 31, '#5a4632'); s.set(35, 31, '#5a4632');
      K.smile(s, 32, 33, 1);
      K.cheek(s, 27, 32, '#e8b8b0'); K.cheek(s, 37, 32, '#e8b8b0');
      // single crescent horn
      s.stroke(34, 25, 38, 22, 1.5, WOOLD);
      s.stroke(38, 22, 40, 25, 1.5, WOOLD);
      // curly wool forelock
      s.ball(29, 25, 3, 2, WOOL); s.ball(33, 25, 3, 2, WOOL);
      // drifting dream z-motes
      s.set(46, 24, WOOLD.b); s.set(48, 22, WOOLD.l); s.set(50, 20, '#f0e8fc');
    },
    drawBack(s) {
      s.limb(26, 50, 25, 56, 1.5, 1.5, FACE);
      s.limb(38, 50, 39, 56, 1.5, 1.5, FACE);
      // full cloud of wool from behind
      s.ball(32, 40, 15, 13, WOOL, { lx: 0, ly: -0.5 });
      s.ball(21, 36, 4, 4, WOOL); s.ball(43, 36, 4, 4, WOOL);
      s.ball(23, 47, 4, 3, WOOL); s.ball(41, 47, 4, 3, WOOL);
      s.ball(32, 30, 5, 4, WOOL);
      s.dither(22, 34, 20, 14, WOOLD.b, 1);
      // little tail puff + crescent horn tip peeking
      s.ball(32, 50, 3, 3, WOOL);
      s.stroke(35, 26, 39, 23, 1.5, WOOLD);
      // z-motes
      s.set(47, 24, WOOLD.l); s.set(49, 22, '#f0e8fc');
    },
  });

  // ============ GLACIER DRAKE LINE (pseudo-legend; SPLIT evolution) ============
  const GLACE = Px.ramp('#7fbfe0');
  const GLACED = Px.ramp('#4e8ab0');
  const ICEW = Px.ramp('#d8f0fc');
  const AUR = Px.ramp('#78e8c8');

  Dex.add({
    id: 97, key: 'glacierling', name: 'Glacierling', types: ['Dragon', 'Ice'],
    base: { hp: 62, atk: 58, def: 70, spa: 58, spd: 60, spe: 42 },
    ability: 'blubber', catchRate: 45, expYield: 60, growth: 'slow', gender: 50,
    // SPLIT: levels into Frystdrake, or an Aurora Stone crystallizes it into Frostfern.
    evolve: [{ to: 'frystdrake', level: 35 }, { to: 'frostfern', stone: 'aurora_stone' }],
    learn: [[1, 'tackle'], [1, 'frost_dust'], [7, 'twister'], [13, 'ice_shard'],
      [20, 'dragon_breath'], [27, 'ice_fang'], [34, 'glacier_ray']],
    tms: ['tm03', 'tm09', 'tm22', 'hm05'],
    dex: { species: 'Glacier Cub', h: '0.8m', w: '61.0kg',
      entry: 'A chunk of living glacier just learning to walk. Its deep-blue eyes hold the slow memory of a thousand frozen winters.' },
    cry: { base: 300, sweep: 0.8, wave: 'triangle', dur: 0.5, vib: 10, grit: 0.2 },
    draw(s) {
      // chunky ice body
      s.ball(32, 44, 12, 10, GLACE);
      s.dither(24, 40, 16, 8, ICEW.l, 0);
      // icy facets
      s.line(24, 42, 30, 38, ICEW.b); s.line(38, 40, 42, 46, GLACED.b);
      // stubby legs
      s.ball(25, 52, 4, 3, GLACE, { flat: true });
      s.ball(39, 52, 4, 3, GLACE, { flat: true });
      // little arms
      s.ball(22, 44, 3, 3, GLACE, { flat: true });
      s.ball(42, 44, 3, 3, GLACE, { flat: true });
      // head
      s.ball(32, 30, 8, 7, GLACE);
      s.dither(26, 27, 12, 5, ICEW.l, 1);
      // ice-shard crest
      K.horn(s, 28, 24, -0.3, -1, 5, 2, ICEW);
      K.horn(s, 36, 24, 0.3, -1, 5, 2, ICEW);
      // deep blue eyes
      K.eye(s, 28, 30, 2, '#2a5a8a');
      K.eye(s, 36, 30, 2, '#2a5a8a');
      s.set(28, 30, '#a8e8f8'); s.set(36, 30, '#a8e8f8');
      K.smile(s, 32, 34, 1);
      // frost breath
      s.set(38, 34, ICEW.h);
    },
    drawBack(s) {
      s.ball(32, 44, 13, 11, GLACE, { lx: 0, ly: -0.5 });
      // glacial back facets
      s.dither(24, 38, 16, 12, ICEW.b, 1);
      s.line(26, 40, 32, 36, ICEW.h); s.line(34, 38, 40, 44, GLACED.d);
      s.ball(25, 52, 4, 3, GLACE, { flat: true });
      s.ball(39, 52, 4, 3, GLACE, { flat: true });
      // back of head + ice crest
      s.ball(32, 29, 8, 7, GLACE, { lx: 0, ly: -0.5 });
      K.horn(s, 28, 23, -0.3, -1, 5, 2, ICEW);
      K.horn(s, 36, 23, 0.3, -1, 5, 2, ICEW);
      s.ball(32, 28, 5, 4, GLACED, { flat: true });
    },
  });

  Dex.add({
    id: 98, key: 'frystdrake', name: 'Frystdrake', types: ['Dragon', 'Ice'],
    base: { hp: 80, atk: 82, def: 88, spa: 80, spd: 80, spe: 60 },
    ability: 'snow_skater', catchRate: 45, expYield: 147, growth: 'slow', gender: 50,
    evolve: { to: 'fimbulwyrm', level: 45 },
    learn: [[1, 'tackle'], [1, 'frost_dust'], [1, 'twister'], [13, 'ice_shard'],
      [20, 'dragon_breath'], [27, 'ice_fang'], [34, 'glacier_ray'], [41, 'dragon_claw'],
      [48, 'icicle_crash']],
    tms: ['tm03', 'tm09', 'tm22', 'tm25', 'hm05'],
    dex: { species: 'Rime Drake', h: '1.7m', w: '138.0kg',
      entry: 'Ice wings still budding, it races down glacier slopes faster than an avalanche and just as impossible to stop.' },
    cry: { base: 230, sweep: 0.7, wave: 'sawtooth', dur: 0.65, vib: 10, grit: 0.35, sub: true },
    draw(s) {
      // serpentine icy body
      s.limb(26, 50, 24, 58, 4, 3, GLACE);
      s.limb(40, 50, 42, 58, 4, 3, GLACE);
      s.ball(33, 42, 11, 12, GLACE);
      s.ball(33, 47, 6, 6, ICEW, { flat: true });
      s.dither(26, 36, 14, 10, ICEW.l, 0);
      // budding ice wings
      s.fillPoly([[24, 34], [12, 28], [14, 42], [26, 40]], GLACED.b);
      s.fillPoly([[42, 34], [54, 28], [52, 42], [40, 40]], GLACED.b);
      s.line(12, 28, 14, 42, ICEW.b); s.line(54, 28, 52, 42, ICEW.b);
      s.dither(14, 30, 10, 10, GLACE.l, 1); s.dither(42, 30, 10, 10, GLACE.l, 0);
      // neck + head
      s.limb(33, 34, 34, 26, 4, 3, GLACE);
      s.ball(35, 22, 7, 6, GLACE);
      s.tri(41, 21, 48, 22, 42, 26, GLACE.b); // snout
      s.set(46, 22, GLACED.o);
      // ice-crown horns
      K.horn(s, 30, 17, -0.5, -1, 7, 2, ICEW);
      K.horn(s, 38, 16, 0.5, -1, 7, 2, ICEW);
      // eye
      K.eye(s, 34, 21, 2, '#2a5a8a');
      s.set(34, 21, '#a8e8f8');
      K.brow(s, 34, 18, 2);
      // spine fins
      K.horn(s, 30, 34, 0, -1, 4, 1, ICEW);
      K.horn(s, 26, 40, 0, -1, 4, 1, ICEW);
    },
    drawBack(s) {
      s.limb(26, 50, 24, 58, 4, 3, GLACE);
      s.limb(40, 50, 42, 58, 4, 3, GLACE);
      s.ball(33, 42, 12, 13, GLACE, { lx: 0, ly: -0.5 });
      // wings spread from behind
      s.fillPoly([[24, 32], [10, 26], [12, 44], [26, 40]], GLACE.b);
      s.fillPoly([[42, 32], [56, 26], [54, 44], [40, 40]], GLACE.b);
      s.line(10, 26, 24, 32, GLACED.d); s.line(56, 26, 42, 32, GLACED.d);
      s.dither(14, 30, 10, 12, GLACED.b, 1); s.dither(42, 30, 10, 12, GLACED.b, 0);
      // spine fins toward camera
      for (let i = 0; i < 4; i++) K.horn(s, 28 + i * 3, 40 - i * 4, 0, -1, 4, 1, ICEW);
      s.dither(28, 38, 12, 10, ICEW.b, 0);
      // back of head + crown
      s.ball(35, 21, 7, 6, GLACE, { lx: 0, ly: -0.5 });
      K.horn(s, 30, 16, -0.5, -1, 7, 2, ICEW);
      K.horn(s, 40, 15, 0.5, -1, 7, 2, ICEW);
    },
  });

  Dex.add({
    id: 99, key: 'fimbulwyrm', name: 'Fimbulwyrm', types: ['Dragon', 'Ice'],
    base: { hp: 100, atk: 110, def: 100, spa: 105, spd: 95, spe: 70 },
    ability: 'snow_skater', catchRate: 45, expYield: 270, growth: 'slow', gender: 50,
    evolve: null,
    learn: [[1, 'frost_dust'], [1, 'twister'], [1, 'dragon_breath'], [1, 'ice_fang'],
      [20, 'glacier_ray'], [27, 'dragon_claw'], [34, 'icicle_crash'], [41, 'wyrm_dance'],
      [48, 'primal_rage'], [55, 'whiteout'], [62, 'star_cataclysm']],
    tms: ['tm03', 'tm09', 'tm13', 'tm22', 'tm25', 'hm05'],
    dex: { species: 'Winter Wyrm', h: '4.4m', w: '388.0kg',
      entry: 'The saga-beast said to bring the fimbulwinter that ends the world. Its crown of icicles glints with a captive scrap of aurora.' },
    cry: { base: 165, sweep: 0.55, wave: 'sawtooth', dur: 0.9, vib: 12, vibRate: 6, grit: 0.5, sub: true },
    draw(s) {
      // great coiled serpent
      s.stroke(10, 54, 28, 56, 6, GLACE);
      s.stroke(28, 56, 46, 50, 6, GLACE);
      s.stroke(46, 50, 52, 40, 5, GLACE);
      s.dither(12, 50, 34, 8, ICEW.l, 0);
      // icicle spikes along the coil
      for (let i = 0; i < 5; i++) K.horn(s, 16 + i * 8, 52, 0, -1, 5, 2, ICEW);
      // rising neck
      s.stroke(50, 42, 40, 26, 6, GLACE);
      s.stroke(40, 26, 34, 18, 5, GLACE);
      // belly plates
      s.line(20, 52, 40, 54, ICEW.b);
      // grand head
      s.ball(32, 16, 8, 7, GLACE);
      s.tri(38, 15, 48, 16, 39, 21, GLACE.b); // jaw
      s.line(40, 18, 46, 18, GLACED.o);
      K.fang(s, 40, 18, ICEW.h); K.fang(s, 44, 17, ICEW.h);
      // crown of icicles with aurora glint
      K.horn(s, 26, 10, -0.6, -0.9, 9, 2, ICEW);
      K.horn(s, 31, 8, -0.1, -1, 10, 2, ICEW);
      K.horn(s, 36, 9, 0.5, -0.9, 9, 2, ICEW);
      s.set(31, 6, AUR.b); s.set(30, 7, AUR.l); s.set(33, 7, '#f088d8'); // aurora scrap
      // fierce eye
      K.eye(s, 31, 15, 2, '#2a5a8a');
      s.set(31, 15, '#a8f0f8');
      K.brow(s, 31, 12, 2);
      // aurora sheen along spine
      s.set(44, 46, AUR.b); s.set(36, 50, AUR.l); s.set(28, 52, '#f088d8');
      // forelimb
      s.limb(48, 44, 52, 52, 3, 2, GLACE);
      K.claws(s, 50, 54, 3, ICEW.b);
    },
    drawBack(s) {
      s.stroke(10, 54, 28, 56, 6, GLACE);
      s.stroke(28, 56, 46, 50, 6, GLACE);
      s.stroke(46, 50, 52, 40, 5, GLACE);
      // full icicle spine ridge toward camera with aurora sheen
      for (let i = 0; i < 6; i++) {
        K.horn(s, 14 + i * 7, 52, 0, -1, 5, 2, ICEW);
        s.set(14 + i * 7, 54, [AUR.b, '#f088d8', AUR.l][i % 3]);
      }
      s.dither(12, 50, 36, 8, GLACED.b, 1);
      s.stroke(50, 42, 40, 26, 6, GLACE);
      s.stroke(40, 26, 34, 18, 5, GLACE);
      for (let i = 0; i < 3; i++) K.horn(s, 44 - i * 4, 38 - i * 6, 0.3, -1, 4, 1, ICEW);
      // back of head + crown
      s.ball(32, 15, 8, 7, GLACE, { lx: 0, ly: -0.5 });
      K.horn(s, 26, 9, -0.6, -0.9, 9, 2, ICEW);
      K.horn(s, 32, 7, 0, -1, 10, 2, ICEW);
      K.horn(s, 38, 9, 0.6, -0.9, 9, 2, ICEW);
      s.set(32, 5, AUR.b); s.set(34, 6, '#f088d8');
      s.limb(48, 44, 52, 52, 3, 2, GLACE);
    },
  });
})();
