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
      // ============ FABLE ART v3: Trollsprout front (frame-filling) ============
      const INNER = Px.ramp('#d9c39a');
      const BUD = Px.ramp('#e8b040');
      // -- feet: wide three-toe paws --
      s.fillEllipse(21, 56, 6, 3, MOSSD.b); s.fillEllipse(43, 56, 6, 3, MOSSD.b);
      s.set(18, 57, MOSSD.d2); s.set(23, 58, MOSSD.d2); s.set(41, 58, MOSSD.d2); s.set(46, 57, MOSSD.d2);
      s.set(18, 55, CREAM.b); s.set(21, 55, CREAM.b); s.set(43, 55, CREAM.b); s.set(46, 55, CREAM.b);
      // -- big tubby gnome body --
      s.ball(32, 38, 19, 17, MOSS);
      s.fillEllipse(39, 50, 10, 4, MOSS.d);
      s.fillEllipse(40, 52, 7, 2, MOSS.d2);          // core shadow at the seat
      s.fillEllipse(25, 28, 8, 6, MOSS.l);
      s.set(22, 26, MOSS.h); s.set(23, 25, MOSS.h); s.set(24, 25, MOSS.h);
      // -- huge soft troll ears with suede insides (symmetric, perky) --
      s.fillEllipse(12, 24, 6, 8, MOSS.b);
      s.fillEllipse(11, 24, 3, 5, INNER.b); s.set(11, 27, INNER.d);
      s.line(7, 18, 6, 26, MOSSD.d); s.line(6, 26, 9, 31, MOSSD.d);
      s.set(12, 17, MOSS.l); s.set(13, 17, MOSS.l); s.set(14, 18, MOSS.h);
      s.fillEllipse(52, 24, 6, 8, MOSS.b);
      s.fillEllipse(53, 24, 3, 5, INNER.b); s.set(53, 27, INNER.d);
      s.line(57, 18, 58, 26, MOSSD.d); s.line(58, 26, 55, 31, MOSSD.d);
      s.set(51, 17, MOSS.l); s.set(52, 17, MOSS.l);
      // -- cream belly bib --
      s.fillEllipse(32, 47, 10, 8, CREAM.b);
      s.fillEllipse(30, 45, 8, 6, CREAM.l);
      s.dither(25, 51, 14, 3, CREAM.d, 0);
      s.set(23, 43, MOSS.d2); s.set(41, 43, MOSS.d2);   // bib tucks
      // -- right arm resting on the bib --
      s.limb(47, 41, 51, 48, 4, 3, MOSS);
      s.fillEllipse(52, 49, 3, 2, MOSS.b); s.set(51, 51, MOSS.d2);
      // -- left arm raised in a wave (kept clear below the ear) --
      s.limb(17, 42, 9, 35, 4, 3, MOSS);
      s.fillEllipse(8, 34, 4, 3, MOSS.b); s.set(6, 33, MOSS.l); s.set(7, 32, MOSS.l);
      s.set(6, 30, CREAM.b); s.set(9, 30, CREAM.b);     // claw tips on the raised paw
      s.line(14, 41, 16, 43, MOSS.o);                    // armpit seam
      // -- head sprout with growth rings --
      s.line(32, 22, 32, 16, BARK.d); s.line(33, 22, 33, 16, BARK.b);
      s.set(32, 20, BARK.o); s.set(33, 18, BARK.o);
      K.leaf(s, 34, 14, 10, MOSS);
      for (let i = 0; i < 8; i++) {
        const w = Math.max(0, Math.round(Math.sin((i / 8) * Math.PI) * 3.2));
        for (let j = -w; j <= w; j++) s.set(31 - i, 14 - i + j, j < 0 ? MOSSD.l : MOSSD.b);
      }
      s.fillEllipse(33, 15, 2, 2, BUD.b); s.set(33, 14, BUD.h); s.set(32, 15, BUD.l);
      s.line(29, 23, 36, 23, MOSS.d);
      // -- face: big warm amber eyes --
      K.eye(s, 23, 31, 3, '#d9942a');
      K.eye(s, 41, 31, 3, '#d9942a');
      s.set(21, 27, MOSSD.d); s.set(22, 27, MOSSD.d); s.set(23, 27, MOSSD.d);
      s.set(41, 27, MOSSD.d); s.set(42, 27, MOSSD.d); s.set(43, 27, MOSSD.d);
      // open happy mouth with tooth + tongue
      s.rect(29, 38, 6, 3, '#3a2528');
      s.set(29, 38, '#ffffff'); s.set(30, 38, '#ffffff');
      s.rect(31, 40, 3, 1, '#c86858');
      K.cheek(s, 17, 35, '#96c46e'); K.cheek(s, 45, 35, '#96c46e');
      // -- hand-placed moss tufts --
      s.dither(27, 20, 5, 2, MOSSD.b, 0); s.dither(39, 22, 4, 2, MOSSD.b, 1);
      s.dither(44, 44, 4, 3, MOSSD.b, 0); s.dither(20, 46, 3, 2, MOSSD.b, 1);
      s.set(28, 19, MOSS.h); s.set(42, 21, MOSS.l);
    },
    drawBack(s) {
      // ======== FABLE ART v3: Trollsprout back (big, gazing up-right) ========
      const BUD = Px.ramp('#e8b040');
      // heels
      s.fillEllipse(23, 56, 5, 3, MOSSD.b); s.fillEllipse(41, 56, 5, 3, MOSSD.b);
      s.set(21, 57, MOSSD.d2); s.set(43, 57, MOSSD.d2);
      // big body from behind
      s.ball(32, 41, 18, 15, MOSS, { lx: 0, ly: -0.62 });
      s.fillEllipse(32, 52, 14, 4, MOSS.d);
      s.fillEllipse(32, 54, 10, 2, MOSS.d2);
      // distinct head lump, turned to our right toward the foe
      s.ball(34, 24, 11, 9, MOSS, { lx: 0.12, ly: -0.7 });
      s.fillEllipse(30, 20, 6, 4, MOSS.l); s.set(27, 19, MOSS.h); s.set(28, 18, MOSS.h);
      s.line(26, 32, 41, 32, MOSS.d); s.set(25, 31, MOSS.d); s.set(42, 31, MOSS.d);
      // mossy back-cape with staggered tuft arcs
      s.fillEllipse(32, 42, 12, 10, MOSSD.b);
      s.line(23, 38, 30, 40, MOSSD.l); s.line(33, 39, 41, 38, MOSSD.l);
      s.line(25, 44, 33, 46, MOSSD.d); s.line(36, 44, 42, 43, MOSSD.d);
      s.line(28, 49, 36, 50, MOSSD.d2);
      s.dither(26, 41, 12, 5, MOSSD.d, 1);
      // two sproutlets on the cape
      s.set(25, 36, MOSS.l); s.set(25, 35, MOSS.b); s.set(24, 34, MOSSD.b);
      s.set(39, 42, MOSS.l); s.set(39, 41, MOSS.b); s.set(40, 40, MOSSD.b);
      // ears from behind (left full, right foreshortened by the head turn)
      s.fillEllipse(18, 22, 5, 8, MOSS.b);
      s.fillEllipse(19, 22, 3, 5, MOSSD.b);
      s.set(16, 16, MOSS.l); s.set(17, 16, MOSS.l);
      // (right ear hidden by the head turn)
      // turned profile: broad cheek lump + eye glancing up-right
      s.fillEllipse(44, 23, 5, 5, MOSS.b);
      s.fillEllipse(46, 21, 3, 3, MOSS.l); s.set(47, 19, MOSS.l);
      s.set(46, 22, '#1a1418'); s.set(47, 22, '#1a1418'); s.set(48, 22, '#1a1418');
      s.set(48, 21, '#ffffff');
      s.set(45, 19, MOSSD.d); s.set(46, 19, MOSSD.d); s.set(47, 19, MOSSD.d);
      s.set(47, 25, '#96c46e'); s.set(48, 25, '#96c46e');
      // arms hinted at the sides
      s.fillEllipse(15, 43, 4, 5, MOSS.b); s.set(13, 40, MOSS.l);
      s.fillEllipse(49, 43, 4, 5, MOSS.b); s.set(48, 40, MOSS.l);
      // sprout on the crown, leaning right with the gaze
      s.line(32, 17, 35, 11, BARK.d); s.line(33, 17, 36, 11, BARK.b);
      s.set(33, 15, BARK.o);
      K.leaf(s, 37, 9, 9, MOSS);
      for (let i = 0; i < 6; i++) {
        const w = Math.max(0, Math.round(Math.sin((i / 6) * Math.PI) * 2.6));
        for (let j = -w; j <= w; j++) s.set(33 - i, 9 - i + j, j < 0 ? MOSSD.l : MOSSD.b);
      }
      s.fillEllipse(36, 10, 2, 2, BUD.b); s.set(36, 9, BUD.h);
      s.line(30, 18, 36, 18, MOSS.d);
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
      // ===== FABLE ART v3: Cindrel front — LINE-FIRST CEL STYLE =====
      // Flat fills, hard-edged single shadow per part, interior contour lines.
      const LINE = FLAME.o;
      // ---------- fills (back to front) ----------
      // tail
      s.stroke(44, 48, 52, 42, 4, { b: FLAME.b, flat: true });
      s.stroke(52, 42, 56, 36, 3, { b: FLAME.b, flat: true });
      // haunches
      s.fillEllipse(19, 50, 6, 6, FLAME.b);
      s.fillEllipse(43, 50, 6, 6, FLAME.b);
      // body
      s.fillEllipse(31, 42, 14, 13, FLAME.b);
      // head
      s.fillEllipse(29, 24, 12, 11, FLAME.b);
      // ear nubs
      s.fillEllipse(17, 18, 2, 3, FLAME.b);
      s.fillEllipse(41, 16, 2, 3, FLAME.b);
      // arms
      s.fillPoly([[21, 43], [25, 44], [23, 52], [19, 51]], FLAME.b);
      s.fillPoly([[37, 44], [41, 43], [43, 51], [39, 52]], FLAME.b);
      // ---------- hard cel shadows (one crisp shape per part) ----------
      // body right-side crescent
      s.fillPoly([[38, 33], [45, 40], [44, 50], [38, 54], [40, 44]], FLAME.d);
      // under-head shadow band across the chest
      s.fillPoly([[20, 34], [39, 34], [36, 38], [23, 38]], FLAME.d);
      // head right-side shadow
      s.fillPoly([[36, 15], [41, 22], [39, 32], [34, 34], [38, 24]], FLAME.d);
      // haunch inner shadows
      s.fillPoly([[20, 46], [24, 49], [23, 55], [19, 53]], FLAME.d);
      s.fillPoly([[42, 46], [44, 50], [43, 55], [40, 52]], FLAME.d);
      // tail underside
      s.line(47, 49, 52, 45, FLAME.d);
      // ---------- belly (covers chest shadow bottom) ----------
      s.fillEllipse(30, 47, 9, 6, BELLY.b);
      s.fillPoly([[24, 50], [37, 50], [35, 53], [26, 53]], BELLY.d);
      // ---------- soot socks + mitts ----------
      s.fillEllipse(18, 57, 5, 2, CHAR.b); s.fillEllipse(44, 57, 5, 2, CHAR.b);
      s.set(15, 56, CHAR.l); s.set(47, 56, CHAR.l);
      s.rect(19, 52, 4, 2, CHAR.b); s.rect(40, 52, 4, 2, CHAR.b);
      // ---------- crisp highlights ----------
      s.line(23, 15, 27, 14, FLAME.l); s.line(22, 16, 24, 15, FLAME.l);
      s.set(25, 13, FLAME.h); s.set(26, 13, FLAME.h);
      s.line(21, 36, 24, 35, FLAME.l);                     // shoulder ping
      s.set(16, 48, FLAME.l); s.set(17, 47, FLAME.l);      // haunch ping
      // ---------- flames (tail + crest), clean teardrops ----------
      s.fillEllipse(56, 30, 5, 8, FLAME.b);
      s.set(56, 21, FLAME.b); s.set(56, 20, FLAME.b); s.set(55, 22, FLAME.b);
      s.fillEllipse(56, 32, 3, 5, FLAMEY.b);
      s.fillEllipse(56, 34, 1, 2, '#fff8e0');
      s.fillEllipse(36, 10, 4, 5, FLAME.b);
      s.set(38, 6, FLAME.b); s.set(37, 7, FLAME.b); s.set(39, 5, FLAME.b);
      s.fillEllipse(36, 11, 2, 3, FLAMEY.b); s.set(36, 12, '#fff8e0');
      // ---------- INTERIOR CONTOUR LINES (the ink pass) ----------
      // head/body seam
      s.line(20, 33, 26, 35, LINE); s.line(26, 35, 34, 35, LINE); s.line(34, 35, 39, 33, LINE);
      // arms outlined
      s.line(21, 43, 19, 51, LINE); s.line(25, 44, 23, 52, LINE);
      s.line(41, 43, 43, 51, LINE); s.line(37, 44, 39, 52, LINE);
      // haunches against body
      s.line(23, 45, 25, 51, LINE); s.line(41, 45, 39, 51, LINE);
      // belly rim
      for (let a = 0; a < 20; a++) {
        const th = Math.PI * (0.08 + 0.84 * a / 19);
        s.set(Math.round(30 + Math.cos(th) * 9), Math.round(47 - Math.sin(th) * 6), BELLY.d);
      }
      // tail contour
      s.line(45, 51, 53, 45, LINE); s.line(53, 45, 56, 38, LINE);
      // crest root + ear lines
      s.line(33, 13, 35, 15, LINE); s.set(17, 20, LINE); s.set(41, 18, LINE);
      // mitt + sock separations
      s.line(19, 52, 23, 52, LINE); s.line(40, 52, 44, 52, LINE);
      s.line(15, 55, 21, 55, LINE); s.line(41, 55, 47, 55, LINE);
      // ---------- face ----------
      K.eye(s, 24, 25, 2, '#3d7fd4');
      s.set(23, 23, '#7db8f0');
      K.eye(s, 36, 25, 2, '#3d7fd4');
      s.set(35, 23, '#7db8f0');
      s.line(22, 20, 24, 21, LINE); s.line(36, 21, 38, 20, LINE);   // brows
      s.set(29, 29, '#8a4530'); s.set(31, 29, '#8a4530');
      K.smile(s, 30, 32, 2);
      K.cheek(s, 17, 27, FLAMEY.b); K.cheek(s, 42, 27, FLAMEY.b);
      // soot chevron on flank
      s.line(41, 40, 45, 43, CHAR.b); s.line(41, 43, 45, 46, CHAR.b);
    },
    drawBack(s) {
      // ========= FABLE ART v2: Cindrel back (big, gazing up-right) =========
      // -- tail curls around the LEFT, flame tall --
      s.stroke(20, 48, 12, 43, 4, FLAME);
      s.stroke(12, 43, 9, 37, 3, FLAME);
      s.fillEllipse(8, 31, 5, 8, FLAME.b);
      s.set(8, 22, FLAME.b); s.set(8, 21, FLAME.b); s.set(9, 23, FLAME.b);
      s.fillEllipse(8, 33, 3, 5, FLAMEY.b);
      s.fillEllipse(8, 35, 1, 2, '#fff8e0');
      // -- body from behind --
      s.ball(32, 42, 14, 13, FLAME, { lx: 0, ly: -0.62 });
      s.fillEllipse(32, 52, 11, 3, FLAME.d);
      s.fillEllipse(32, 54, 7, 2, FLAME.d2);
      // haunches
      s.fillEllipse(20, 48, 5, 6, FLAME.b); s.set(17, 45, FLAME.l);
      s.fillEllipse(44, 48, 5, 6, FLAME.b); s.set(47, 45, FLAME.l);
      // -- soot chevrons down the spine --
      s.line(28, 36, 32, 40, CHAR.b); s.line(36, 36, 32, 40, CHAR.b);
      s.line(28, 44, 32, 48, CHAR.b); s.line(36, 44, 32, 48, CHAR.b);
      // -- head turned up-right --
      s.ball(33, 24, 11, 10, FLAME, { lx: 0.12, ly: -0.7 });
      s.fillEllipse(28, 19, 6, 4, FLAME.l); s.set(26, 17, FLAME.h);
      s.line(26, 32, 40, 32, FLAME.d);
      // right-profile: snout + eye glancing up-right
      s.fillEllipse(43, 22, 4, 4, FLAME.b);
      s.fillEllipse(44, 20, 3, 3, FLAME.b); s.set(45, 18, FLAME.l);
      s.set(45, 20, '#1a1418'); s.set(46, 20, '#1a1418');
      s.set(46, 19, '#ffffff');
      s.set(44, 17, CHAR.d); s.set(45, 17, CHAR.d);
      s.set(47, 23, FLAMEY.b);
      // ear nubs
      s.fillEllipse(24, 17, 2, 3, FLAME.b); s.set(23, 15, FLAME.d);
      s.fillEllipse(41, 14, 2, 2, FLAME.b);
      // -- crest flame streaming right with the gaze --
      s.fillEllipse(36, 9, 4, 5, FLAME.b);
      s.set(39, 5, FLAME.b); s.set(38, 6, FLAME.b);
      s.fillEllipse(36, 10, 2, 3, FLAMEY.b); s.set(36, 11, '#fff8e0');
      s.set(33, 13, FLAME.d); s.set(34, 13, FLAME.d);
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
      // ============ FABLE ART v2: Selkip front (frame-filling) ============
      // -- tail flukes fanned out right --
      s.fillPoly([[44, 47], [58, 38], [55, 48]], SEAL.b);
      s.fillPoly([[44, 47], [59, 52], [52, 58]], SEAL.b);
      s.line(56, 40, 48, 46, SEAL.d); s.line(56, 53, 49, 52, SEAL.d);
      s.set(57, 39, SEAL.l); s.set(58, 51, SEAL.l); s.set(53, 56, SEAL.d2);
      // -- plump bean body --
      s.ball(31, 44, 16, 12, SEAL);
      s.fillEllipse(38, 51, 9, 4, SEAL.d);
      s.fillEllipse(39, 53, 6, 2, SEAL.d2);
      s.fillEllipse(24, 38, 7, 5, SEAL.l);
      // pale belly
      s.fillEllipse(29, 48, 10, 7, PALE.b);
      s.fillEllipse(27, 46, 7, 5, PALE.l);
      s.dither(23, 52, 12, 3, PALE.d, 0);
      // -- mitten front flippers --
      s.limb(19, 50, 13, 56, 4, 3, SEAL);
      s.fillEllipse(12, 57, 4, 2, SEAL.b); s.set(9, 57, SEAL.d);
      s.limb(41, 52, 44, 57, 4, 3, SEAL);
      s.fillEllipse(45, 58, 4, 2, SEAL.b);
      s.line(12, 55, 15, 55, SEALD.d); s.line(43, 56, 46, 56, SEALD.d);   // cuffs
      // -- big baby-seal head --
      s.ball(27, 24, 13, 12, SEAL);
      s.fillEllipse(21, 18, 7, 5, SEAL.l); s.set(19, 16, SEAL.h); s.set(20, 15, SEAL.h);
      s.line(20, 33, 24, 35, SEAL.d);
      // hood-cap with widow's peak
      s.fillEllipse(27, 17, 12, 6, SEALD.b);
      s.set(27, 24, SEALD.b); s.set(27, 23, SEALD.b); s.set(27, 22, SEALD.b);   // peak
      s.line(16, 20, 20, 23, SEALD.d); s.line(38, 20, 34, 23, SEALD.d);          // folds
      s.line(20, 13, 26, 12, SEALD.l); s.set(28, 12, SEALD.l);                    // sheen
      // -- pale muzzle, button nose, whiskers --
      s.fillEllipse(26, 31, 6, 5, PALE.b);
      s.fillEllipse(24, 30, 4, 3, PALE.l);
      s.rect(25, 27, 3, 2, '#22283a'); s.set(26, 29, '#4a5570');
      K.smile(s, 26, 34, 2);
      s.set(17, 31, SEALD.d); s.set(16, 30, SEALD.d);
      s.set(35, 31, SEALD.d); s.set(36, 30, SEALD.d);
      // -- glossy puppy eyes --
      K.eye(s, 19, 26, 2, '#33405e');
      s.set(20, 27, '#8fa8c8');
      K.eye(s, 35, 26, 2, '#33405e');
      s.set(36, 27, '#8fa8c8');
      s.set(18, 29, PALE.d); s.set(34, 29, PALE.d);
      K.cheek(s, 15, 29, '#bcd8ea'); K.cheek(s, 38, 29, '#bcd8ea');
      // -- chest droplet gem --
      s.set(31, 39, GLOW.l); s.rect(30, 40, 3, 2, GLOW.b);
      s.set(31, 42, GLOW.d); s.set(32, 39, '#ffffff');
      // fur ticks

    },
    drawBack(s) {
      // ========= FABLE ART v2: Selkip back (big, gazing up-right) =========
      // -- plump rear; flukes sweep toward camera bottom-right --
      s.ball(31, 43, 16, 13, SEAL, { lx: 0, ly: -0.62 });
      s.fillEllipse(31, 53, 12, 3, SEAL.d);
      s.fillEllipse(31, 55, 8, 2, SEAL.d2);
      s.fillPoly([[42, 51], [57, 46], [54, 53]], SEAL.b);
      s.fillPoly([[42, 51], [56, 57], [47, 60]], SEAL.d);
      s.line(54, 48, 47, 52, SEAL.d); s.set(55, 47, SEAL.l);
      // -- dark saddle with seal dapples --
      s.fillEllipse(31, 40, 11, 9, SEALD.b);
      s.fillEllipse(28, 36, 7, 5, SEALD.l);
      s.set(24, 42, SEALD.d); s.set(34, 39, SEALD.d); s.set(30, 45, SEALD.d);
      s.set(37, 43, SEALD.d); s.set(26, 37, SEALD.d); s.set(33, 47, SEALD.d2);
      // -- left mitten peeking --
      s.limb(17, 47, 12, 53, 4, 3, SEAL);
      s.fillEllipse(11, 54, 4, 2, SEAL.b);
      s.line(11, 52, 14, 52, SEALD.d);
      // -- head turned up-right, hood cap from behind --
      s.ball(32, 25, 12, 11, SEAL, { lx: 0.12, ly: -0.7 });
      s.fillEllipse(32, 20, 11, 7, SEALD.b);
      s.fillEllipse(28, 17, 6, 4, SEALD.l);
      s.set(32, 28, SEALD.b); s.set(32, 27, SEALD.b);        // nape point
      s.line(24, 33, 40, 33, SEAL.d);
      // right-profile: pale muzzle + glossy eye glancing up-right
      s.fillEllipse(43, 24, 4, 4, SEAL.b);
      s.fillEllipse(45, 25, 3, 2, PALE.b);
      s.set(47, 24, '#22283a');
      s.set(44, 21, '#1a1f30'); s.set(45, 21, '#1a1f30');
      s.set(45, 20, '#ffffff');
      s.set(43, 19, SEALD.d); s.set(44, 19, SEALD.d);
      s.set(46, 27, '#bcd8ea');
      s.set(46, 23, SEALD.d);                                 // whisker speck
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
