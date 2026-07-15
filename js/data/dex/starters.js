'use strict';
/**
 * Starter lines (dex #001-#009), given by Professor Aspen in Frosthollow.
 *   Grass: Trollsprout -> Bryteknott -> Jotunwald (Grass/Ground)
 *   Fire:  Cindrel -> Pyrolisk -> Fafnirn (Fire/Dragon)
 *   Water: Selkip -> Selkora -> Krakelott (Water/Dark)
 */
(() => {
  const K = SpriteKit;

  // ============ GRASS LINE ============
  const MOSS = Px.ramp('#5da24e');
  const MOSSD = Px.ramp('#3e7a38');
  const BARK = Px.ramp('#8a6a44');
  const CREAM = Px.ramp('#e8dfc0');

  Dex.add({
    id: 1, key: 'trollsprout', name: 'Trollsprout', types: ['Grass'],
    base: { hp: 45, atk: 49, def: 52, spa: 60, spd: 55, spe: 47 },
    ability: 'verdant_surge', catchRate: 45, expYield: 62, growth: 'medslow', gender: 87.5,
    evolve: { to: 'bryteknott', level: 16 },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'vine_lash'], [9, 'siphon_seed'], [13, 'razor_leaf'],
      [17, 'numb_spore'], [21, 'seed_bomb'], [25, 'photomend'], [29, 'verdant_orb']],
    tms: ['tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'tm11'],
    dex: { species: 'Seedling Troll', h: '0.5m', w: '6.8kg',
      entry: 'It naps beneath the taiga moss. The sprout on its head grows a new ring for every winter it survives.' },
    cry: { base: 420, sweep: 0.62, wave: 'square', dur: 0.42, vib: 12 },
    draw(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      const INNER = Px.ramp('#d9c39a');
      const BUD = Px.ramp('#e8b040');
      SF.draw(s, [
      // feet
      { path: SF.blob(22, 56, 5.5, 2.6), ramp: MOSSD, shade: { d: 1, hi: 1 } },
      { path: SF.blob(42, 56, 5.5, 2.6), ramp: MOSSD, shade: { d: 1, hi: 1 } },
      // big gnome body (head+body one mass)
      { path: [[32, 21], [44, 25], [50, 37], [46, 50], [32, 55], [18, 50], [14, 37], [20, 25]],
        ramp: MOSS, shade: { d: 3, hi: 1 }, gleam: [23, 27] },
      // ears (in front of the head silhouette → ink at roots)
      { path: SF.blob(11, 27, 5.5, 8), ramp: MOSS, shade: { d: 2, hi: 1 } },
      { path: SF.blob(10, 27, 2.6, 4.4), ramp: INNER, shade: null, ink: false },
      { path: SF.blob(53, 27, 5.5, 8), ramp: MOSS, shade: { d: 2, hi: 1 } },
      { path: SF.blob(54, 27, 2.6, 4.4), ramp: INNER, shade: null, ink: false },
      // belly bib
      { path: SF.blob(32, 47, 10, 7.5), ramp: CREAM, shade: { d: 2, hi: 1 } },
      // right arm resting
      { path: SF.limb(46, 42, 50, 49, 3.5, 2.5), ramp: MOSS, shade: { d: 1, hi: 0 } },
      // left arm raised in a wave + paw
      { path: SF.limb(17, 41, 9, 33, 3.5, 2.5), ramp: MOSS, shade: { d: 1, hi: 0 } },
      { path: SF.blob(8, 32, 3.2, 3), ramp: MOSS, shade: { d: 1, hi: 0 } },
      // head sprout: stem + two leaves + bud
      { path: SF.limb(32, 22, 33, 15, 1.4, 1), ramp: BARK, shade: { d: 1, hi: 0 } },
      { path: [[33, 15], [38, 12], [42, 7], [37, 8], [33, 11]], ramp: MOSS, shade: { d: 1, hi: 1 } },
      { path: [[33, 15], [28, 11], [25, 6], [30, 8], [33, 11]], ramp: MOSSD, shade: { d: 1, hi: 1 } },
      { path: SF.blob(33, 14, 1.6, 1.6), ramp: BUD, shade: null, ink: false },
      ], { light: [-1, -1] });

      // rings on the stem
      s.set(32, 19, BARK.o); s.set(33, 17, BARK.o);
      // face: big amber eyes, mossy brows, open mouth
      K.eye(s, 24, 32, 3, '#d9942a');
      K.eye(s, 40, 32, 3, '#d9942a');
      s.set(22, 27, MOSSD.d); s.set(23, 27, MOSSD.d);
      s.set(40, 27, MOSSD.d); s.set(41, 27, MOSSD.d);
      s.rect(30, 39, 5, 3, '#3a2528');
      s.set(30, 39, '#ffffff');
      s.rect(31, 41, 3, 1, '#c86858');
      K.cheek(s, 18, 36, '#96c46e'); K.cheek(s, 44, 36, '#96c46e');
      // claws on the raised paw + feet
      s.set(6, 30, CREAM.b); s.set(9, 30, CREAM.b);
      s.set(20, 54, CREAM.b); s.set(23, 54, CREAM.b);
      s.set(41, 54, CREAM.b); s.set(44, 54, CREAM.b);
      // moss tufts
      s.dither(27, 23, 5, 2, MOSSD.b, 0); s.dither(39, 25, 4, 2, MOSSD.b, 1);
      s.dither(43, 45, 4, 2, MOSSD.b, 0);
    },
    drawBack(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      const INNER = Px.ramp('#d9c39a');
      const BUD = Px.ramp('#e8b040');
      SF.draw(s, [
      // heels
      { path: SF.blob(24, 56, 4.5, 2.6), ramp: MOSSD, shade: { d: 1, hi: 0 } },
      { path: SF.blob(40, 56, 4.5, 2.6), ramp: MOSSD, shade: { d: 1, hi: 0 } },
      // body from behind
      { path: [[32, 26], [43, 29], [49, 40], [45, 51], [32, 55], [19, 51], [15, 40], [21, 29]],
        ramp: MOSS, shade: { d: 3, hi: 1 } },
      // head lump turned right
      { path: [[33, 15], [42, 18], [45, 25], [42, 31], [33, 33], [24, 31], [21, 24], [25, 17]],
        ramp: MOSS, shade: { d: 2, hi: 1 }, gleam: [27, 19] },
      // mossy back-cape
      { path: SF.blob(32, 43, 12, 9.5, 0.06), ramp: MOSSD, shade: { d: 2, hi: 1 } },
      // ears from behind (left full; right foreshortened)
      { path: SF.blob(17, 22, 5, 7.5), ramp: MOSS, shade: { d: 2, hi: 1 } },
      { path: SF.blob(18, 22, 2.6, 4.4), ramp: MOSSD, shade: { d: 1, hi: 0 } },
      { path: SF.blob(47, 24, 3.6, 6), ramp: MOSS, shade: { d: 2, hi: 1 } },
      // cheek lump of the turned head
      { path: SF.blob(45, 27, 4, 4), ramp: MOSS, shade: { d: 1, hi: 1 } },
      // sprout leaning right with the gaze
      { path: SF.limb(32, 17, 35, 10, 1.4, 1), ramp: BARK, shade: { d: 1, hi: 0 } },
      { path: [[35, 10], [40, 7], [44, 2], [39, 3], [35, 6]], ramp: MOSS, shade: { d: 1, hi: 1 } },
      { path: [[35, 10], [30, 6], [27, 1], [32, 3], [35, 6]], ramp: MOSSD, shade: { d: 1, hi: 1 } },
      { path: SF.blob(35, 9, 1.6, 1.6), ramp: BUD, shade: null, ink: false },
      ], { light: [-1, -1] });

      // cape tuft arcs
      s.line(24, 40, 30, 42, MOSSD.l); s.line(33, 41, 40, 40, MOSSD.l);
      s.line(26, 46, 33, 48, MOSSD.d); s.line(36, 46, 42, 45, MOSSD.d);
      // sproutlet on the cape
      s.set(26, 37, MOSS.l); s.set(26, 36, MOSS.b);
      // eye glancing up-right on the cheek lump
      s.set(46, 25, '#1a1418'); s.set(47, 25, '#1a1418');
      s.set(47, 24, '#ffffff');
      s.set(45, 23, MOSSD.d); s.set(46, 23, MOSSD.d);
      s.set(47, 28, '#96c46e');
      // arms hinted at sides
      s.set(15, 43, MOSS.l); s.set(49, 43, MOSS.l);
    },
  });

  Dex.add({
    id: 2, key: 'bryteknott', name: 'Bryteknott', types: ['Grass'],
    base: { hp: 60, atk: 63, def: 68, spa: 75, spd: 70, spe: 59 },
    ability: 'verdant_surge', catchRate: 45, expYield: 142, growth: 'medslow', gender: 87.5,
    evolve: { to: 'jotunwald', level: 34 },
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'vine_lash'], [9, 'siphon_seed'], [13, 'razor_leaf'],
      [18, 'numb_spore'], [23, 'seed_bomb'], [28, 'photomend'], [33, 'verdant_orb'], [38, 'timber_crash']],
    tms: ['tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'tm11', 'tm07'],
    dex: { species: 'Knotted Troll', h: '1.1m', w: '28.5kg',
      entry: 'Bark plates knit across its shoulders. It wrestles young pines to test its growing strength.' },
    cry: { base: 320, sweep: 0.58, wave: 'square', dur: 0.5, vib: 10, grit: 0.3 },
    draw(s) {
      // legs
      s.limb(25, 50, 24, 57, 4, 3, BARK);
      s.limb(39, 50, 40, 57, 4, 3, BARK);
      // torso
      s.ball(32, 38, 13, 16, MOSS);
      s.ball(32, 45, 8, 8, CREAM, { flat: true });
      // bark shoulder plates
      s.ball(21, 32, 6, 5, BARK, { flat: true });
      s.ball(43, 32, 6, 5, BARK, { flat: true });
      s.line(17, 32, 24, 30, BARK.d); s.line(40, 30, 47, 32, BARK.d);
      // burly arms
      s.limb(20, 34, 13, 46, 4, 4, MOSS);
      s.limb(44, 34, 51, 46, 4, 4, MOSS);
      K.claws(s, 11, 49, 3, CREAM.b); K.claws(s, 49, 49, 3, CREAM.b);
      // head
      s.ball(32, 22, 10, 9, MOSS);
      K.horn(s, 23, 18, -1, -0.6, 8, 3, MOSS);
      K.horn(s, 41, 18, 1, -0.6, 8, 3, MOSS);
      // knotted leaf-antlers
      s.stroke(28, 14, 26, 9, 1, BARK.d);
      s.stroke(36, 14, 38, 9, 1, BARK.d);
      K.leaf(s, 27, 8, 6, MOSSD);
      K.leaf(s, 39, 8, 6, MOSSD);
      // fiercer face
      K.eye(s, 27, 22, 2, '#d89020');
      K.eye(s, 37, 22, 2, '#d89020');
      K.brow(s, 27, 19, 2); K.brow(s, 38, 19, 2);
      K.smile(s, 32, 27, 2);
      K.fang(s, 29, 27); K.fang(s, 34, 27);
    },
    drawBack(s) {
      // Rear: bark spine, shoulder plates, leaf antlers from behind.
      s.limb(25, 50, 24, 58, 4, 3, BARK);
      s.limb(39, 50, 40, 58, 4, 3, BARK);
      s.ball(32, 38, 14, 17, MOSS, { lx: 0, ly: -0.5 });
      // bark spine plates down the back
      for (let i = 0; i < 4; i++) s.ball(32, 28 + i * 7, 5 - i, 3, BARK, { flat: true });
      s.dither(24, 30, 16, 16, MOSSD.b, 1);
      s.ball(20, 31, 6, 5, BARK, { flat: true });
      s.ball(44, 31, 6, 5, BARK, { flat: true });
      s.limb(19, 34, 13, 46, 4, 3, MOSS);
      s.limb(45, 34, 51, 46, 4, 3, MOSS);
      // back of head
      s.ball(32, 21, 10, 9, MOSS, { lx: 0, ly: -0.5 });
      s.ball(32, 22, 7, 6, MOSSD, { flat: true });
      K.horn(s, 22, 17, -1, -0.6, 8, 3, MOSSD);
      K.horn(s, 42, 17, 1, -0.6, 8, 3, MOSSD);
      s.stroke(28, 13, 26, 8, 1, BARK.d);
      s.stroke(36, 13, 38, 8, 1, BARK.d);
      K.leaf(s, 27, 7, 6, MOSSD);
      K.leaf(s, 39, 7, 6, MOSSD);
    },
  });

  Dex.add({
    id: 3, key: 'jotunwald', name: 'Jotunwald', types: ['Grass', 'Ground'],
    base: { hp: 85, atk: 92, def: 100, spa: 95, spd: 90, spe: 63 },
    ability: 'verdant_surge', catchRate: 45, expYield: 236, growth: 'medslow', gender: 87.5,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'vine_lash'], [1, 'siphon_seed'], [13, 'razor_leaf'],
      [18, 'numb_spore'], [23, 'seed_bomb'], [28, 'photomend'], [34, 'bulldoze'], [38, 'verdant_orb'],
      [44, 'timber_crash'], [50, 'earthshatter'], [56, 'sunpierce']],
    tms: ['tm17', 'tm19', 'tm21', 'tm24', 'tm25', 'tm11', 'tm07', 'tm15', 'tm08'],
    dex: { species: 'Forest Jotunn', h: '2.3m', w: '240.0kg',
      entry: 'Old maps mark lone hills that turned out to be sleeping Jotunwald. A whole grove grows from its shoulders.' },
    cry: { base: 190, sweep: 0.5, wave: 'square', dur: 0.7, vib: 8, grit: 0.45, sub: true },
    draw(s) {
      // massive legs
      s.limb(23, 48, 21, 58, 5, 5, BARK);
      s.limb(41, 48, 43, 58, 5, 5, BARK);
      K.claws(s, 18, 61, 3, CREAM.b); K.claws(s, 40, 61, 3, CREAM.b);
      // huge torso
      s.ball(32, 37, 16, 17, MOSS);
      // bark chest armor
      s.fillPoly([[24, 32], [40, 32], [43, 44], [32, 50], [21, 44]], BARK.b);
      s.line(24, 32, 21, 44, BARK.d); s.line(32, 33, 32, 49, BARK.d);
      s.ball(32, 38, 4, 4, CREAM, { flat: true }); // core knot
      // colossal arms with stone fists
      s.limb(17, 32, 9, 46, 5, 6, MOSS);
      s.limb(47, 32, 55, 46, 5, 6, MOSS);
      s.ball(9, 49, 6, 5, BARK, { lx: -0.4, ly: -0.4 });
      s.ball(55, 49, 6, 5, BARK, { lx: -0.4, ly: -0.4 });
      K.claws(s, 6, 53, 3, CREAM.b); K.claws(s, 52, 53, 3, CREAM.b);
      // head set low in shoulders
      s.ball(32, 20, 9, 8, MOSS);
      K.eye(s, 28, 20, 2, '#e8a018');
      K.eye(s, 36, 20, 2, '#e8a018');
      K.brow(s, 28, 17, 2); K.brow(s, 37, 17, 2);
      s.line(30, 25, 34, 25, '#1a1418');
      K.fang(s, 28, 25); K.fang(s, 35, 25);
      // shoulder-grove canopy
      s.ball(20, 13, 8, 6, MOSSD);
      s.ball(44, 13, 8, 6, MOSSD);
      s.ball(32, 9, 10, 6, MOSS);
      s.dither(24, 6, 16, 6, MOSS.l, 1);
      // trunk antlers
      s.stroke(24, 12, 22, 4, 1, BARK.d);
      s.stroke(40, 12, 42, 4, 1, BARK.d);
      K.leaf(s, 23, 3, 6, MOSS); K.leaf(s, 43, 3, 6, MOSS);
    },
    drawBack(s) {
      // Rear: a walking hillside — canopy, bark spine ridge, stone fists at sides.
      s.limb(23, 48, 21, 59, 5, 5, BARK);
      s.limb(41, 48, 43, 59, 5, 5, BARK);
      s.ball(32, 37, 17, 18, MOSS, { lx: 0, ly: -0.5 });
      // mossy back overgrowth
      s.ball(32, 36, 12, 13, MOSSD, { flat: true });
      s.dither(22, 26, 20, 22, MOSS.d, 1);
      // spine ridge of bark plates
      for (let i = 0; i < 5; i++) s.ball(32, 25 + i * 6, 5 - Math.floor(i / 2), 3, BARK, { flat: true });
      // arms + stone fists
      s.limb(16, 32, 9, 46, 5, 5, MOSS);
      s.limb(48, 32, 55, 46, 5, 5, MOSS);
      s.ball(9, 49, 6, 5, BARK, { lx: 0, ly: -0.5 });
      s.ball(55, 49, 6, 5, BARK, { lx: 0, ly: -0.5 });
      // back of head hidden under canopy
      s.ball(32, 19, 9, 7, MOSSD, { lx: 0, ly: -0.5 });
      // canopy from behind (fuller)
      s.ball(19, 12, 9, 7, MOSSD);
      s.ball(45, 12, 9, 7, MOSSD);
      s.ball(32, 8, 11, 7, MOSS, { lx: 0, ly: -0.4 });
      s.dither(23, 5, 18, 7, MOSSD.l, 0);
      s.stroke(24, 11, 22, 3, 1, BARK.d);
      s.stroke(40, 11, 42, 3, 1, BARK.d);
      K.leaf(s, 23, 2, 6, MOSSD); K.leaf(s, 43, 2, 6, MOSSD);
    },
  });

  // ============ FIRE LINE ============
  const FLAME = Px.ramp('#e8642c');
  const FLAMEY = Px.ramp('#f8c845');
  const BELLY = Px.ramp('#f0e0b8');
  const CHAR = Px.ramp('#7c4030');
  const MAGMA = Px.ramp('#c83820');

  function tailFlame(s, x, y, sc = 1) {
    s.ball(x, y, 4 * sc, 5 * sc, FLAME, { flat: true });
    s.ball(x, y + sc, 2.5 * sc, 3 * sc, FLAMEY, { flat: true });
    s.set(x, y - Math.round(5 * sc), FLAME.b);
    s.set(x + 1, y - Math.round(6 * sc), FLAME.d);
  }

  Dex.add({
    id: 4, key: 'cindrel', name: 'Cindrel', types: ['Fire'],
    base: { hp: 41, atk: 58, def: 44, spa: 62, spd: 50, spe: 63 },
    ability: 'kindled_heart', catchRate: 45, expYield: 62, growth: 'medslow', gender: 87.5,
    evolve: { to: 'pyrolisk', level: 16 },
    learn: [[1, 'scratch'], [1, 'leer'], [5, 'cinder_shot'], [9, 'quick_jab'], [13, 'flame_wheel'],
      [17, 'fury_swipes'], [21, 'fire_fang'], [25, 'cinder_curse'], [29, 'fire_lance']],
    tms: ['tm02', 'tm11', 'tm17', 'tm21', 'tm25'],
    dex: { species: 'Hearth Newt', h: '0.6m', w: '8.2kg',
      entry: 'It sleeps curled in cooling hearths. Villagers consider one moving in to be a blessing on the house.' },
    cry: { base: 640, sweep: 0.7, wave: 'square', dur: 0.35, vib: 18, chirps: 1 },
    draw(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      const WHT = '#fff8e0';
      SF.draw(s, [
      // tail (curling out right)
      { path: SF.limb(42, 48, 53, 37, 4.5, 2.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      // tail flame: outer lick, inner tongue, hot core
      { path: [[52, 36], [49, 29], [51, 22], [55, 15], [56, 22], [58, 27], [57, 33]], ramp: FLAME, shade: { d: 1, hi: 1 } },
      { path: [[53, 34], [52, 28], [54, 22], [56, 27], [56, 32]], ramp: FLAMEY, shade: { d: 1, hi: 0 }, ink: false },
      { path: [[54, 33], [54, 29], [56, 31]], flat: WHT, ink: false },
      // body: soft pear
      { path: [[31, 30], [40, 33], [44, 42], [41, 52], [31, 55], [21, 52], [18, 42], [22, 33]],
        ramp: FLAME, shade: { d: 3, hi: 1 }, gleam: [24, 36] },
      // belly plate
      { path: [[30, 41], [37, 44], [38, 50], [30, 54], [23, 50], [23, 44]], ramp: BELLY, shade: { d: 2, hi: 1 } },
      // haunches
      { path: SF.blob(19, 49, 6, 5.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      { path: SF.blob(44, 49, 6, 5.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      // soot feet
      { path: SF.blob(16, 56, 4.5, 2.2), ramp: CHAR, shade: { d: 1, hi: 1 } },
      { path: SF.blob(46, 56, 4.5, 2.2), ramp: CHAR, shade: { d: 1, hi: 1 } },
      // little arms + soot mitts
      { path: SF.limb(24, 43, 20, 51, 2.5, 2), ramp: FLAME, shade: { d: 1, hi: 0 } },
      { path: SF.limb(39, 43, 43, 51, 2.5, 2), ramp: FLAME, shade: { d: 1, hi: 0 } },
      { path: SF.blob(19, 52, 2.8, 2), ramp: CHAR, shade: { d: 1, hi: 0 } },
      { path: SF.blob(44, 52, 2.8, 2), ramp: CHAR, shade: { d: 1, hi: 0 } },
      // head: big with round cheeks
      { path: [[29, 13], [37, 15], [41, 21], [40, 28], [34, 33], [24, 33], [18, 28], [17, 20], [22, 14]],
        ramp: FLAME, shade: { d: 2, hi: 1 }, gleam: [23, 17] },
      // ear nubs
      { path: SF.blob(17, 16, 2, 2.6), ramp: FLAME, shade: { d: 1, hi: 0 } },
      { path: SF.blob(40, 16, 2.2, 2.8), ramp: FLAME, shade: { d: 1, hi: 0 } },
      // crest flame swept back off the crown
      { path: [[32, 16], [31, 10], [34, 5], [38, 3], [37, 8], [39, 12], [37, 16]], ramp: FLAME, shade: { d: 1, hi: 1 } },
      { path: [[34, 13], [34, 8], [36, 6], [37, 11]], ramp: FLAMEY, shade: null, ink: false },
      ], { light: [-1, -1] });

      // face
      K.eye(s, 24, 24, 2, '#3d7fd4'); s.set(23, 22, '#7db8f0');
      K.eye(s, 36, 24, 2, '#3d7fd4'); s.set(35, 22, '#7db8f0');
      s.line(22, 19, 24, 20, FLAME.o); s.line(36, 20, 38, 19, FLAME.o);   // brows
      s.set(29, 27, '#8a4530'); s.set(31, 27, '#8a4530');                  // nostrils
      K.smile(s, 30, 30, 2);
      K.cheek(s, 20, 26, FLAMEY.b); K.cheek(s, 39, 26, FLAMEY.b);
      // soot chevron on the flank
      s.line(40, 40, 43, 43, CHAR.b); s.line(40, 43, 43, 46, CHAR.b);
      // toe glints
      s.set(14, 55, CHAR.l); s.set(48, 55, CHAR.l);
    },
    drawBack(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      const WHT = '#fff8e0';
      SF.draw(s, [
      // tail curls LEFT, flame clear of the gaze
      { path: SF.limb(22, 48, 11, 37, 4.5, 2.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      { path: [[12, 36], [14, 29], [12, 22], [9, 15], [7, 22], [6, 28], [8, 34]], ramp: FLAME, shade: { d: 1, hi: 1 } },
      { path: [[11, 34], [11, 28], [9, 22], [8, 27], [8, 32]], ramp: FLAMEY, shade: { d: 1, hi: 0 }, ink: false },
      { path: [[10, 33], [10, 29], [8, 31]], flat: WHT, ink: false },
      // body pear from behind
      { path: [[32, 30], [41, 33], [45, 42], [42, 52], [32, 55], [22, 52], [19, 42], [23, 33]],
        ramp: FLAME, shade: { d: 3, hi: 1 } },
      // haunches
      { path: SF.blob(20, 49, 5.5, 5.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      { path: SF.blob(44, 49, 5.5, 5.5), ramp: FLAME, shade: { d: 2, hi: 1 } },
      // head from behind, turned to our right
      { path: [[31, 13], [39, 15], [43, 21], [42, 27], [36, 31], [26, 31], [20, 26], [20, 18], [25, 13]],
        ramp: FLAME, shade: { d: 2, hi: 1 }, gleam: [26, 17] },
      // snout bump poking out up-right + ear nubs
      { path: SF.blob(44, 22, 3, 3), ramp: FLAME, shade: { d: 1, hi: 0 } },
      { path: SF.blob(21, 14, 2.2, 2.8), ramp: FLAME, shade: { d: 1, hi: 0 } },
      // crest flame streaming right with the gaze
      { path: [[33, 15], [33, 9], [36, 4], [40, 2], [39, 8], [40, 12], [38, 15]], ramp: FLAME, shade: { d: 1, hi: 1 } },
      { path: [[35, 12], [35, 8], [38, 5], [38, 10]], ramp: FLAMEY, shade: null, ink: false },
      ], { light: [-1, -1] });

      // spine soot chevrons
      s.line(29, 37, 32, 40, CHAR.b); s.line(35, 37, 32, 40, CHAR.b);
      s.line(29, 45, 32, 48, CHAR.b); s.line(35, 45, 32, 48, CHAR.b);
      // eye glancing up-right on the snout bump
      s.set(45, 20, '#1a1418'); s.set(46, 20, '#1a1418');
      s.set(46, 19, '#ffffff');
      s.set(44, 18, CHAR.d);
      s.set(47, 23, FLAMEY.b);
    },
  });

  Dex.add({
    id: 5, key: 'pyrolisk', name: 'Pyrolisk', types: ['Fire'],
    base: { hp: 58, atk: 74, def: 56, spa: 80, spd: 63, spe: 84 },
    ability: 'kindled_heart', catchRate: 45, expYield: 142, growth: 'medslow', gender: 87.5,
    evolve: { to: 'fafnirn', level: 34 },
    learn: [[1, 'scratch'], [1, 'leer'], [1, 'cinder_shot'], [9, 'quick_jab'], [13, 'flame_wheel'],
      [18, 'fire_fang'], [23, 'cinder_curse'], [28, 'fire_lance'], [33, 'night_slash'], [38, 'blaze_charge']],
    tms: ['tm02', 'tm11', 'tm17', 'tm21', 'tm25', 'tm23'],
    dex: { species: 'Ember Drake', h: '1.2m', w: '21.0kg',
      entry: 'It sprints across snowfields on burning soles, leaving lines of steam that glow at dusk.' },
    cry: { base: 460, sweep: 0.65, wave: 'square', dur: 0.45, vib: 16, grit: 0.25 },
    draw(s) {
      // long tail sweeping left with bigger flame
      s.stroke(26, 46, 12, 42, 3, FLAME);
      tailFlame(s, 9, 34, 1.3);
      // lean body upright
      s.ball(33, 40, 9, 13, FLAME);
      s.ball(33, 45, 6, 7, BELLY, { flat: true });
      // strong legs
      s.limb(28, 50, 26, 58, 3, 2, FLAME);
      s.limb(38, 50, 40, 58, 3, 2, FLAME);
      K.claws(s, 24, 60, 2, BELLY.b); K.claws(s, 38, 60, 2, BELLY.b);
      // arms with claws
      s.limb(26, 36, 21, 42, 2, 2, FLAME);
      s.limb(40, 36, 45, 42, 2, 2, FLAME);
      K.claws(s, 19, 44, 2, BELLY.b); K.claws(s, 44, 44, 2, BELLY.b);
      // neck + head
      s.ball(34, 24, 8, 7, FLAME);
      s.tri(40, 24, 47, 22, 41, 27, FLAME.b); // snout
      s.set(46, 23, CHAR.b);
      // flame crest swept back
      s.ball(28, 17, 4, 4, FLAMEY, { flat: true });
      s.ball(24, 15, 3, 3, FLAME, { flat: true });
      s.set(21, 13, FLAME.d); s.set(26, 12, FLAMEY.b);
      // char stripes
      s.line(30, 20, 34, 18, CHAR.b);
      s.line(29, 38, 34, 36, CHAR.b);
      // fierce eye
      K.eye(s, 35, 22, 2, '#e8b820');
      K.brow(s, 35, 19, 2);
      s.line(41, 26, 43, 26, '#1a1418');
      K.fang(s, 41, 26, '#fff');
    },
    drawBack(s) {
      // Rear: swept crest, spine stripes, tail flame flaring on the right.
      s.ball(32, 40, 10, 14, FLAME, { lx: 0, ly: -0.5 });
      for (let i = 0; i < 4; i++) s.ball(32, 32 + i * 6, 4 - Math.floor(i / 2), 2, CHAR, { flat: true });
      s.limb(28, 50, 26, 59, 3, 2, FLAME);
      s.limb(38, 50, 40, 59, 3, 2, FLAME);
      s.limb(25, 36, 21, 42, 2, 2, FLAME);
      s.limb(41, 36, 45, 42, 2, 2, FLAME);
      // back of head, crest flowing toward camera-left
      s.ball(31, 23, 8, 7, FLAME, { lx: 0, ly: -0.5 });
      s.ball(31, 21, 5, 4, CHAR, { flat: true });
      s.ball(36, 15, 4, 4, FLAMEY, { flat: true });
      s.ball(40, 13, 3, 3, FLAME, { flat: true });
      s.set(43, 11, FLAME.d);
      // tail curls right, big flame
      s.stroke(38, 46, 52, 42, 3, FLAME);
      tailFlame(s, 54, 33, 1.5);
    },
  });

  Dex.add({
    id: 6, key: 'fafnirn', name: 'Fafnirn', types: ['Fire', 'Dragon'],
    base: { hp: 76, atk: 104, def: 71, spa: 110, spd: 80, spe: 89 },
    ability: 'kindled_heart', catchRate: 45, expYield: 240, growth: 'medslow', gender: 87.5,
    evolve: null,
    learn: [[1, 'scratch'], [1, 'leer'], [1, 'cinder_shot'], [1, 'dragon_breath'], [13, 'flame_wheel'],
      [18, 'fire_fang'], [23, 'cinder_curse'], [28, 'fire_lance'], [34, 'dragon_claw'], [40, 'blaze_charge'],
      [46, 'primal_rage'], [52, 'inferno_burst'], [58, 'star_cataclysm']],
    tms: ['tm02', 'tm11', 'tm17', 'tm21', 'tm25', 'tm23', 'tm22', 'tm07'],
    dex: { species: 'Lindworm', h: '2.8m', w: '110.5kg',
      entry: 'The old sagas tell of a serpent coiled on a hoard of embers. Its molten seams never cool, even in blizzards.' },
    cry: { base: 240, sweep: 0.45, wave: 'sawtooth', dur: 0.75, vib: 10, grit: 0.4, sub: true },
    draw(s) {
      // coiled serpent body: big loop
      s.stroke(20, 52, 44, 54, 6, MAGMA);
      s.stroke(44, 54, 52, 44, 5, MAGMA);
      s.stroke(20, 52, 14, 42, 5, MAGMA);
      // tail tip w/ flame
      s.stroke(52, 44, 50, 34, 3, MAGMA);
      tailFlame(s, 50, 28, 1.1);
      // molten seams on coils
      s.line(20, 50, 40, 52, FLAMEY.b);
      s.line(15, 44, 18, 50, FLAMEY.b);
      s.dither(22, 48, 18, 5, MAGMA.d, 1);
      // rising neck (S-curve)
      s.stroke(18, 44, 24, 30, 5, MAGMA);
      s.stroke(24, 30, 30, 20, 5, MAGMA);
      // belly plates on neck
      s.line(21, 40, 20, 36, BELLY.b); s.line(24, 32, 26, 27, BELLY.b);
      // forelimbs (lindworms have only two)
      s.limb(24, 44, 30, 52, 3, 2, MAGMA);
      K.claws(s, 28, 55, 3, BELLY.b);
      // head: wedge with horns and flame mane
      s.ball(33, 16, 8, 6, MAGMA);
      s.tri(39, 15, 49, 14, 40, 20, MAGMA.b); // long jaw
      s.line(40, 19, 46, 17, '#1a1418');
      K.fang(s, 41, 18, '#fff'); K.fang(s, 44, 17, '#fff');
      s.set(48, 14, CHAR.b); // nostril
      // swept horns
      K.horn(s, 29, 12, -0.8, -0.6, 9, 2, CHAR);
      K.horn(s, 34, 11, -0.5, -0.9, 8, 2, CHAR);
      // flame mane
      s.ball(26, 14, 4, 5, FLAME, { flat: true });
      s.ball(24, 18, 3, 4, FLAMEY, { flat: true });
      s.set(22, 10, FLAME.b); s.set(25, 8, FLAME.d);
      // eye
      K.eye(s, 34, 15, 2, '#f8d030');
      K.brow(s, 34, 12, 2);
    },
    drawBack(s) {
      // Rear: coils toward camera, spine ridge, head rising away at top-left.
      s.stroke(18, 50, 46, 52, 7, MAGMA);
      s.stroke(46, 52, 54, 42, 5, MAGMA);
      s.stroke(54, 42, 51, 33, 3, MAGMA);
      tailFlame(s, 50, 27, 1.2);
      // ridge spikes across the near coil
      for (let i = 0; i < 5; i++) K.horn(s, 20 + i * 7, 46, 0, -1, 4, 2, CHAR);
      s.dither(18, 50, 26, 6, MAGMA.d, 0);
      s.line(20, 48, 42, 50, FLAMEY.b);
      // neck rising, seen from behind
      s.stroke(16, 44, 24, 28, 5, MAGMA);
      s.stroke(24, 28, 31, 18, 5, MAGMA);
      for (let i = 0; i < 4; i++) K.horn(s, 19 + i * 4, 40 - i * 6, -0.4, -0.9, 3, 1, CHAR);
      // back of head
      s.ball(33, 14, 8, 6, MAGMA, { lx: 0, ly: -0.5 });
      s.ball(33, 13, 5, 3, CHAR, { flat: true });
      K.horn(s, 28, 10, -0.8, -0.6, 9, 2, CHAR);
      K.horn(s, 38, 9, 0.6, -0.8, 8, 2, CHAR);
      // mane visible around head edges
      s.ball(40, 16, 3, 4, FLAME, { flat: true });
      s.set(43, 12, FLAME.b);
    },
  });

  // ============ WATER LINE ============
  const SEAL = Px.ramp('#9db8cc');
  const SEALD = Px.ramp('#5f7f9e');
  const PALE = Px.ramp('#e6eef2');
  const STORM = Px.ramp('#3d5a80');
  const GLOW = Px.ramp('#7fe0d8');

  Dex.add({
    id: 7, key: 'selkip', name: 'Selkip', types: ['Water'],
    base: { hp: 50, atk: 48, def: 50, spa: 61, spd: 58, spe: 51 },
    ability: 'tidal_will', catchRate: 45, expYield: 62, growth: 'medslow', gender: 87.5,
    evolve: { to: 'selkora', level: 16 },
    learn: [[1, 'tackle'], [1, 'growl'], [5, 'splash_jet'], [9, 'aqua_jet'], [13, 'bubble_beam'],
      [17, 'charm'], [21, 'ice_shard'], [25, 'aqua_tail'], [29, 'wind_rest']],
    tms: ['tm03', 'tm12', 'tm17', 'tm21', 'tm25'],
    dex: { species: 'Selkie Pup', h: '0.6m', w: '12.4kg',
      entry: 'Fisherfolk swear it borrows lost mittens to sleep on. It sheds a single tear when winter\'s first snow falls.' },
    cry: { base: 700, sweep: 0.8, wave: 'sine', dur: 0.4, vib: 22, chirps: 1 },
    draw(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      SF.draw(s, [
      // tail flukes right
      { path: [[43, 46], [57, 37], [54, 48]], smooth: 0.4, ramp: SEAL, shade: { d: 1, hi: 1 } },
      { path: [[43, 48], [59, 51], [51, 58]], smooth: 0.4, ramp: SEAL, shade: { d: 2, hi: 0 } },
      // plump bean body
      { path: SF.blob(30, 44, 15.5, 11.5, 0.04), ramp: SEAL, shade: { d: 3, hi: 1 } },
      // pale belly
      { path: SF.blob(28, 48, 9.5, 6.5), ramp: PALE, shade: { d: 2, hi: 1 } },
      // mitten flippers
      { path: SF.limb(19, 50, 13, 56, 3.5, 2.8), ramp: SEAL, shade: { d: 1, hi: 0 } },
      { path: SF.limb(40, 52, 44, 57, 3.5, 2.8), ramp: SEAL, shade: { d: 1, hi: 0 } },
      // big baby head
      { path: SF.blob(27, 24, 13, 12, 0.03), ramp: SEAL, shade: { d: 2, hi: 1 } },
      // hood cap
      { path: [[15, 21], [17, 14], [27, 11], [37, 14], [39, 21], [33, 19], [27, 22], [21, 19]],
        ramp: SEALD, shade: { d: 2, hi: 1 } },
      // muzzle
      { path: SF.blob(26, 32, 6, 4.6), ramp: PALE, shade: { d: 1, hi: 1 } },
      ], { light: [-1, -1] });

      // widow's peak + cap folds
      s.set(27, 23, SEALD.b); s.set(27, 24, SEALD.b);
      s.line(17, 21, 20, 23, SEALD.d); s.line(37, 21, 34, 23, SEALD.d);
      // nose + smile + whiskers
      s.rect(25, 29, 3, 2, '#22283a'); s.set(26, 31, '#4a5570');
      K.smile(s, 26, 34, 2);
      s.set(18, 32, SEALD.d); s.set(17, 31, SEALD.d);
      s.set(34, 32, SEALD.d); s.set(35, 31, SEALD.d);
      // glossy eyes
      K.eye(s, 19, 25, 2, '#33405e'); s.set(20, 26, '#8fa8c8');
      K.eye(s, 35, 25, 2, '#33405e'); s.set(36, 26, '#8fa8c8');
      s.set(18, 28, PALE.d); s.set(34, 28, PALE.d);
      K.cheek(s, 15, 28, '#bcd8ea'); K.cheek(s, 38, 28, '#bcd8ea');
      // chest droplet gem
      s.set(30, 39, GLOW.l); s.rect(29, 40, 3, 2, GLOW.b);
      s.set(30, 42, GLOW.d); s.set(31, 39, '#ffffff');
      // mitten cuffs + fluke ribs
      s.line(13, 53, 16, 53, SEALD.d); s.line(41, 55, 44, 55, SEALD.d);
      s.line(54, 40, 48, 45, SEAL.d); s.line(55, 52, 48, 52, SEAL.d);
    },
    drawBack(s) {
      // ======== FABLE ART v4: SpriteForge (contours + auto-ink + cel) ========
      const SF = SpriteForge;
      SF.draw(s, [
      // plump rear
      { path: SF.blob(31, 43, 15.5, 12, 0.04), ramp: SEAL, shade: { d: 3, hi: 1 } },
      // flukes sweeping toward camera bottom-right
      { path: [[41, 50], [56, 45], [53, 53]], smooth: 0.4, ramp: SEAL, shade: { d: 1, hi: 1 } },
      { path: [[41, 51], [55, 57], [46, 60]], smooth: 0.4, ramp: SEAL, shade: { d: 2, hi: 0 } },
      // dark saddle
      { path: SF.blob(31, 43, 9, 6, 0.04), ramp: SEALD, shade: { d: 1, hi: 1 } },
      // left mitten peeking
      { path: SF.limb(17, 47, 12, 53, 3.5, 2.8), ramp: SEAL, shade: { d: 1, hi: 0 } },
      // head turned up-right
      { path: SF.blob(31, 25, 12, 11, 0.03), ramp: SEAL, shade: { d: 2, hi: 1 } },
      // hood cap from behind
      { path: SF.blob(31, 20, 10.5, 6.5), ramp: SEALD, shade: { d: 2, hi: 1 } },
      // muzzle bump up-right
      { path: SF.blob(43, 24, 3.6, 3.2), ramp: SEAL, shade: { d: 1, hi: 0 } },
      { path: SF.blob(45, 25, 2, 1.8), ramp: PALE, shade: null, ink: false },
      ], { light: [-1, -1] });

      // nape point of the cap
      s.set(31, 26, SEALD.b); s.set(31, 27, SEALD.b);
      // seal dapples
      s.set(25, 41, SEALD.d); s.set(34, 38, SEALD.d); s.set(30, 45, SEALD.d);
      s.set(37, 43, SEALD.d); s.set(27, 36, SEALD.d);
      // eye glancing up-right
      s.set(44, 21, '#1a1f30'); s.set(45, 21, '#1a1f30');
      s.set(45, 20, '#ffffff');
      s.set(43, 20, SEALD.d);
      s.set(46, 24, '#22283a');                       // nose peeking
      s.set(45, 27, '#bcd8ea');
      // mitten cuff + fluke ribs
      s.line(12, 51, 15, 51, SEALD.d);
      s.line(53, 47, 46, 51, SEAL.d);
    },
  });

  Dex.add({
    id: 8, key: 'selkora', name: 'Selkora', types: ['Water'],
    base: { hp: 65, atk: 60, def: 65, spa: 79, spd: 74, spe: 62 },
    ability: 'tidal_will', catchRate: 45, expYield: 142, growth: 'medslow', gender: 87.5,
    evolve: { to: 'krakelott', level: 34 },
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'splash_jet'], [9, 'aqua_jet'], [13, 'bubble_beam'],
      [18, 'charm'], [23, 'ice_shard'], [28, 'aqua_tail'], [33, 'surf'], [38, 'wind_rest']],
    tms: ['tm03', 'tm12', 'tm13', 'tm17', 'tm21', 'tm25'],
    dex: { species: 'Selkie', h: '1.3m', w: '52.0kg',
      entry: 'On moonlit nights it sheds its outer coat on the rocks. Anyone who touches the coat is led safely home through fog.' },
    cry: { base: 520, sweep: 0.72, wave: 'sine', dur: 0.5, vib: 18, chirps: 2 },
    draw(s) {
      // upright elegant seal, tail curling forward
      s.tri(38, 52, 52, 48, 48, 58, SEAL.b);
      s.line(51, 49, 44, 53, SEAL.d);
      s.ball(31, 42, 11, 14, SEAL);
      s.ball(30, 47, 7, 8, PALE, { flat: true });
      // flowing coat over shoulders
      s.ball(31, 32, 11, 6, SEALD, { flat: true });
      s.line(21, 34, 19, 44, SEALD.b);
      s.line(41, 34, 43, 44, SEALD.b);
      // wave pattern on coat
      s.set(25, 33, GLOW.b); s.set(31, 31, GLOW.b); s.set(37, 33, GLOW.b);
      // flippers folded front
      s.tri(22, 46, 15, 53, 24, 54, SEAL.b);
      s.tri(40, 46, 47, 53, 38, 54, SEAL.d);
      // graceful neck + head
      s.ball(31, 22, 8, 8, SEAL);
      s.ball(30, 26, 4, 3, PALE, { flat: true });
      s.set(30, 24, '#1a1418');
      K.eye(s, 26, 21, 2, '#28303c');
      K.eye(s, 35, 21, 2, '#28303c');
      // long whiskers
      s.line(22, 25, 18, 24, PALE.d); s.line(39, 25, 43, 24, PALE.d);
      // crest cap w/ star mark
      s.ball(31, 16, 7, 4, SEALD, { flat: true });
      s.set(31, 13, GLOW.b); s.set(30, 14, GLOW.l); s.set(32, 14, GLOW.l);
    },
    drawBack(s) {
      // Rear: the shed-coat pattern down the spine, tail sweeping right.
      s.ball(31, 41, 12, 15, SEAL, { lx: 0, ly: -0.5 });
      // coat covers back like a mantle
      s.fillPoly([[21, 30], [41, 30], [44, 48], [31, 54], [18, 48]], SEALD.b);
      s.line(21, 30, 18, 48, SEALD.d);
      s.dither(24, 34, 14, 14, SEALD.l, 1);
      // glow runes on the mantle
      s.set(27, 36, GLOW.b); s.set(35, 36, GLOW.b); s.set(31, 42, GLOW.b); s.set(31, 47, GLOW.d);
      // tail
      s.tri(38, 52, 53, 47, 49, 58, SEAL.b);
      // flippers at sides
      s.tri(19, 45, 13, 53, 22, 54, SEAL.b);
      s.tri(43, 45, 49, 53, 40, 54, SEAL.b);
      // back of head + cap + star
      s.ball(31, 21, 8, 8, SEAL, { lx: 0, ly: -0.5 });
      s.ball(31, 19, 7, 5, SEALD, { flat: true });
      s.set(31, 15, GLOW.b);
      s.set(24, 20, SEALD.d); s.set(38, 20, SEALD.d);
    },
  });

  Dex.add({
    id: 9, key: 'krakelott', name: 'Krakelott', types: ['Water', 'Dark'],
    base: { hp: 84, atk: 86, def: 82, spa: 108, spd: 92, spe: 78 },
    ability: 'tidal_will', catchRate: 45, expYield: 239, growth: 'medslow', gender: 87.5,
    evolve: null,
    learn: [[1, 'tackle'], [1, 'growl'], [1, 'splash_jet'], [1, 'cheap_shot'], [13, 'bubble_beam'],
      [18, 'snarl'], [23, 'ice_shard'], [28, 'aqua_tail'], [34, 'crunch'], [40, 'surf'],
      [46, 'dread_pulse'], [52, 'deluge_cannon'], [58, 'shadow_maw']],
    tms: ['tm03', 'tm12', 'tm13', 'tm17', 'tm18', 'tm21', 'tm23', 'tm25'],
    dex: { species: 'Storm Kraken', h: '2.1m', w: '164.0kg',
      entry: 'Sailors\' charts mark its hunting grounds with a crown of tentacles. It drags whole storms behind it like a cloak.' },
    cry: { base: 200, sweep: 0.4, wave: 'sawtooth', dur: 0.8, vib: 8, grit: 0.5, sub: true },
    draw(s) {
      // tentacle skirt
      const T = STORM;
      s.stroke(18, 46, 10, 58, 3, T); s.stroke(26, 48, 22, 60, 3, T);
      s.stroke(38, 48, 42, 60, 3, T); s.stroke(46, 46, 54, 58, 3, T);
      s.stroke(32, 49, 32, 61, 3, T);
      // sucker glints
      s.set(11, 54, GLOW.d); s.set(23, 56, GLOW.d); s.set(41, 56, GLOW.d); s.set(53, 54, GLOW.d);
      // seal torso rising from the skirt
      s.ball(32, 36, 13, 14, SEALD);
      s.ball(32, 42, 8, 7, PALE, { flat: true });
      // storm-mantle over shoulders
      s.ball(32, 27, 13, 6, STORM, { flat: true });
      s.line(20, 30, 18, 40, STORM.b);
      s.line(44, 30, 46, 40, STORM.b);
      // glowing storm runes
      s.set(26, 28, GLOW.b); s.set(32, 26, GLOW.b); s.set(38, 28, GLOW.b);
      s.set(29, 38, GLOW.d); s.set(35, 38, GLOW.d);
      // powerful flippers
      s.tri(19, 38, 8, 46, 18, 48, SEALD.b);
      s.tri(45, 38, 56, 46, 46, 48, SEALD.d);
      // head: fierce, hooded
      s.ball(32, 17, 9, 8, SEALD);
      s.ball(32, 13, 9, 5, STORM, { flat: true });
      K.horn(s, 25, 11, -0.6, -0.8, 6, 2, STORM);
      K.horn(s, 39, 11, 0.6, -0.8, 6, 2, STORM);
      // glowing eyes
      K.eye(s, 27, 17, 2, '#7fe0d8');
      K.eye(s, 37, 17, 2, '#7fe0d8');
      K.brow(s, 27, 14, 2); K.brow(s, 38, 14, 2);
      // tusks
      K.fang(s, 28, 22, '#fff'); K.fang(s, 34, 22, '#fff');
      s.set(32, 21, '#1a1418');
    },
    drawBack(s) {
      // Rear: storm-cloak mantle covers the back; tentacles fan toward camera.
      s.stroke(16, 46, 8, 59, 3, STORM); s.stroke(25, 48, 20, 61, 3, STORM);
      s.stroke(39, 48, 44, 61, 3, STORM); s.stroke(48, 46, 56, 59, 3, STORM);
      s.stroke(32, 49, 32, 62, 4, STORM);
      s.ball(32, 35, 14, 15, SEALD, { lx: 0, ly: -0.5 });
      // full mantle with rune circle
      s.fillPoly([[20, 24], [44, 24], [47, 44], [32, 52], [17, 44]], STORM.b);
      s.line(20, 24, 17, 44, STORM.d);
      s.dither(24, 28, 16, 16, STORM.l, 1);
      s.set(32, 32, GLOW.b); s.set(28, 35, GLOW.b); s.set(36, 35, GLOW.b);
      s.set(30, 39, GLOW.d); s.set(34, 39, GLOW.d); s.set(32, 36, GLOW.l);
      // flippers
      s.tri(18, 37, 8, 46, 17, 48, SEALD.b);
      s.tri(46, 37, 56, 46, 47, 48, SEALD.b);
      // back of hooded head + horns
      s.ball(32, 16, 9, 8, SEALD, { lx: 0, ly: -0.5 });
      s.ball(32, 15, 8, 6, STORM, { flat: true });
      K.horn(s, 24, 11, -0.6, -0.8, 6, 2, STORM);
      K.horn(s, 40, 11, 0.6, -0.8, 6, 2, STORM);
      s.set(32, 10, GLOW.d);
    },
  });
})();
