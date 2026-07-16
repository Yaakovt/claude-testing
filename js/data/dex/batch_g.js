'use strict';
/**
 * Batch G (dex #111-#120): a pseudo-legendary line and more of the rarer
 * evolution types (friendship, level-split, and stone), which were scarce.
 *   Pseudo:      Clodling -> Terrawyrm -> Magnadrake (Ground/Dragon)
 *   Friendship:  Pupperine -> Lealkin
 *   Split:       Pollywisp -> Marshgil (Lv) OR Mirephantom (Tide Stone)
 *   Stone:       Gemkit -> Prismyx (Aurora Stone)
 */
(() => {
  const K = SpriteKit;

  // ---- PSEUDO-LEGENDARY: Clodling -> Terrawyrm -> Magnadrake (Ground/Dragon) ----
  const EARTHY = Px.ramp('#b08048'); const EARTHD = Px.ramp('#7a5630'); const SCUTE = Px.ramp('#c8a860'); const MAW = Px.ramp('#e07040');
  Dex.add({
    id: 111, key: 'clodling', name: 'Clodling', types: ['Ground'],
    base: { hp: 55, atk: 68, def: 62, spa: 42, spd: 50, spe: 43 }, ability: 'bedrock',
    catchRate: 45, expYield: 60, growth: 'slow', gender: 50, evolve: { to: 'terrawyrm', level: 32 },
    learn: [[1, 'tackle'], [1, 'leer'], [7, 'mud_shot'], [13, 'bite'], [20, 'burrow_strike'], [28, 'bulldoze']],
    tms: ['tm07', 'tm14', 'hm04', 'hm06'],
    dex: { species: 'Clod Pup', h: '0.6m', w: '19.0kg', entry: 'A pup of packed earth and stubborn will. It headbutts boulders for fun and never seems to tire.' },
    cry: { base: 340, sweep: 0.6, wave: 'square', dur: 0.4, vib: 10, grit: 0.3 },
    draw(s) {
      s.limb(24, 48, 22, 55, 3, 2, EARTHY); s.limb(40, 48, 42, 55, 3, 2, EARTHY);
      s.ball(32, 42, 11, 8, EARTHY); s.ball(32, 45, 6, 4, SCUTE, { flat: true });
      s.set(26, 38, EARTHD.d); s.set(38, 40, EARTHD.d);
      s.ball(30, 30, 8, 7, EARTHY);
      K.horn(s, 26, 24, -0.4, -1, 5, 2, SCUTE); K.horn(s, 34, 24, 0.4, -1, 5, 2, SCUTE);
      K.eye(s, 26, 30, 2, '#e8b038'); K.eye(s, 34, 30, 2, '#e8b038');
      K.brow(s, 26, 27, 2); K.brow(s, 35, 27, 2);
      s.line(28, 34, 32, 34, MAW.o); K.fang(s, 28, 34, '#fff');
    },
    drawBack(s) {
      s.limb(24, 48, 22, 55, 3, 2, EARTHY); s.limb(40, 48, 42, 55, 3, 2, EARTHY);
      s.ball(32, 42, 12, 9, EARTHY, { lx: 0, ly: -0.5 });
      for (let i = 0; i < 3; i++) K.horn(s, 27 + i * 5, 36, 0, -1, 4, 2, SCUTE);
      s.dither(26, 40, 12, 6, EARTHD.b, 1);
      s.ball(30, 29, 8, 7, EARTHY, { lx: 0, ly: -0.5 });
      K.horn(s, 26, 23, -0.4, -1, 5, 2, SCUTE); K.horn(s, 34, 23, 0.4, -1, 5, 2, SCUTE);
    },
  });
  Dex.add({
    id: 112, key: 'terrawyrm', name: 'Terrawyrm', types: ['Ground', 'Dragon'],
    base: { hp: 75, atk: 95, def: 85, spa: 60, spd: 70, spe: 60 }, ability: 'bedrock',
    catchRate: 45, expYield: 147, growth: 'slow', gender: 50, evolve: { to: 'magnadrake', level: 52 },
    learn: [[1, 'tackle'], [1, 'mud_shot'], [1, 'bite'], [20, 'burrow_strike'], [28, 'bulldoze'], [36, 'dragon_claw'], [44, 'crunch']],
    tms: ['tm07', 'tm14', 'tm22', 'hm04', 'hm06'],
    dex: { species: 'Burrow Wyrm', h: '1.9m', w: '96.0kg', entry: 'It tunnels the foothills for miles, following veins of ore it can taste through the stone.' },
    cry: { base: 250, sweep: 0.55, wave: 'sawtooth', dur: 0.55, vib: 8, grit: 0.4, sub: true },
    draw(s) {
      s.stroke(12, 50, 30, 52, 5, EARTHY); s.stroke(30, 52, 46, 46, 5, EARTHY); s.stroke(46, 46, 50, 34, 4, EARTHY);
      s.limb(24, 48, 20, 56, 3, 2, EARTHY); K.claws(s, 16, 58, 3, SCUTE.b);
      for (let i = 0; i < 4; i++) K.horn(s, 18 + i * 8, 48, 0, -1, 5, 2, SCUTE);
      s.stroke(50, 36, 46, 24, 4, EARTHY);
      s.ball(44, 20, 7, 6, EARTHY); s.tri(50, 18, 56, 20, 50, 24, EARTHY.b);
      s.line(51, 21, 55, 21, MAW.o); K.fang(s, 51, 21, '#fff');
      K.horn(s, 40, 14, -0.5, -0.9, 7, 2, SCUTE); K.horn(s, 46, 13, 0.4, -1, 7, 2, SCUTE);
      K.eye(s, 43, 19, 2, '#f0b830'); K.brow(s, 43, 16, 2);
    },
    drawBack(s) {
      s.stroke(12, 50, 30, 52, 5, EARTHY); s.stroke(30, 52, 46, 46, 5, EARTHY); s.stroke(46, 46, 50, 34, 4, EARTHY);
      for (let i = 0; i < 6; i++) K.horn(s, 14 + i * 7, 48, 0, -1, 5, 2, SCUTE);
      s.dither(14, 50, 32, 5, EARTHD.b, 0);
      s.stroke(50, 36, 46, 24, 4, EARTHY);
      s.ball(44, 19, 7, 6, EARTHY, { lx: 0, ly: -0.5 });
      K.horn(s, 40, 13, -0.5, -0.9, 7, 2, SCUTE); K.horn(s, 47, 12, 0.4, -1, 7, 2, SCUTE);
    },
  });
  Dex.add({
    id: 113, key: 'magnadrake', name: 'Magnadrake', types: ['Ground', 'Dragon'],
    base: { hp: 100, atk: 135, def: 110, spa: 85, spd: 95, spe: 75 }, ability: 'bedrock',
    catchRate: 45, expYield: 270, growth: 'slow', gender: 50, evolve: null,
    learn: [[1, 'tackle'], [1, 'mud_shot'], [1, 'bite'], [1, 'burrow_strike'], [28, 'bulldoze'], [36, 'dragon_claw'],
      [44, 'crunch'], [52, 'earthshatter'], [60, 'primal_rage'], [66, 'star_cataclysm']],
    tms: ['tm07', 'tm14', 'tm15', 'tm22', 'tm25', 'hm04', 'hm06'],
    dex: { species: 'Titan Wyrm', h: '3.9m', w: '388.0kg', entry: 'The mountains themselves are said to be old Magnadrake, curled up and gone to sleep for good. Waking one is a very bad idea.' },
    cry: { base: 165, sweep: 0.5, wave: 'sawtooth', dur: 0.9, vib: 10, grit: 0.5, sub: true },
    draw(s) {
      // ==== FABLE ART v7: SpriteForge MENACE pass ====
      const SF = SpriteForge;
      const EARTHY = Px.ramp('#b08048');
      const EARTHD = Px.ramp('#7a5630');
      const SCUTE = Px.ramp('#c8a860');
      const MAGMA = Px.ramp('#e06030');
      SF.draw(s, [
      // massive tail sweeping right
      { path: SF.limb(40, 44, 56, 50, 6, 3.5), ramp: EARTHY, shade: { d: 2, hi: 1 } },
      ...SF.spikes([[44, 42], [52, 46], [58, 49]], 5, 0.2, -1, 3).map((p) => (
        { path: p, smooth: 0.2, ramp: SCUTE, shade: { d: 1, hi: 0 } })),
      // far leg
      { path: SF.limb(38, 44, 41, 56, 4.5, 3.8), smooth: 0.5, ramp: EARTHD, shade: { d: 1, hi: 0 } },
      // hulking body leaning FORWARD (aggression line)
      { path: [[22, 20], [34, 22], [42, 30], [44, 41], [37, 50], [24, 52], [15, 44], [15, 30]],
        ramp: EARTHY, shade: { d: 3, hi: 1 }, edge: 'scale' },
      // ore plates armoring the back
      { path: [[30, 21], [40, 27], [43, 36], [38, 33], [31, 26]], smooth: 0.5, ramp: SCUTE, shade: { d: 1, hi: 1 } },
      // near leg planted wide
      { path: SF.limb(24, 46, 21, 57, 5, 4.2), smooth: 0.5, ramp: EARTHY, shade: { d: 1, hi: 0 } },
      // near arm raised mid-swipe with claws
      { path: SF.limb(20, 32, 10, 40, 4, 3.2), ramp: EARTHY, shade: { d: 1, hi: 0 } },
      // dorsal ridge spikes
      ...SF.spikes([[24, 20], [34, 23], [41, 30]], 7, -0.3, -1, 4).map((p) => (
        { path: p, smooth: 0.2, ramp: SCUTE, shade: { d: 1, hi: 0 } })),
      // big head thrown back mid-roar, jaw wide
      { path: [[24, 8], [32, 10], [35, 16], [33, 23], [25, 26], [17, 23], [15, 15], [18, 9]],
        smooth: 0.8, ramp: EARTHY, shade: { d: 2, hi: 1 } },
      // upper snout + open lower jaw
      { path: [[17, 12], [9, 12], [6, 14], [12, 17], [18, 16]], smooth: 0.5, ramp: EARTHY, shade: { d: 1, hi: 0 } },
      { path: [[17, 22], [8, 26], [5, 30], [13, 28], [19, 25]], smooth: 0.5, ramp: EARTHY, shade: { d: 1, hi: 0 } },
      // back-swept blade horns
      { path: [[26, 9], [33, 3], [39, 0], [32, 7], [28, 12]], smooth: 0.3, ramp: SCUTE, shade: { d: 1, hi: 0 } },
      { path: [[21, 10], [25, 3], [28, 2], [26, 5], [22, 13]], smooth: 0.3, ramp: SCUTE, shade: { d: 1, hi: 0 } },
      ], { light: [-1, -1] });

      // molten maw glowing between the jaws
      s.fillPoly([[16, 15], [8, 15], [8, 25], [16, 22]], '#3a1410');
      s.fillPoly([[14, 17], [10, 18], [10, 23], [14, 21]], MAGMA.b);
      s.set(12, 19, '#ffb050'); s.set(11, 21, '#ffd080');
      s.tri(9, 15, 12, 15, 10, 19, '#ffffff');      // upper fang
      s.tri(10, 25, 13, 24, 11, 21, '#ffffff');     // lower fang
      // tiny furious eye under a heavy brow
      s.rect(24, 15, 4, 2, '#1a1418');
      s.rect(25, 16, 2, 1, '#ff9838');
      s.line(23, 13, 29, 14, '#1a1418');
      // claws on the raised arm + feet
      s.tri(8, 41, 11, 42, 8, 45, '#e8e4da'); s.tri(11, 43, 14, 43, 12, 46, '#e8e4da');
      s.set(18, 57, '#e8e4da'); s.set(21, 58, '#e8e4da'); s.set(39, 57, '#e8e4da');
      // magma glow seams on the body
      s.line(28, 40, 33, 44, MAGMA.b); s.set(30, 42, '#ffb050');
      s.line(36, 34, 39, 38, MAGMA.d);
    },
    drawBack(s) {
      s.stroke(10, 54, 30, 56, 6, EARTHY); s.stroke(30, 56, 48, 48, 6, EARTHY); s.stroke(48, 48, 52, 34, 5, EARTHY);
      for (let i = 0; i < 7; i++) { K.horn(s, 14 + i * 7, 50, 0, -1, 6, 3, SCUTE); s.set(14 + i * 7, 53, MAW.b); }
      s.dither(12, 52, 36, 6, EARTHD.b, 1);
      s.limb(22, 50, 18, 60, 4, 3, EARTHY); s.limb(40, 50, 44, 60, 4, 3, EARTHY);
      s.stroke(52, 36, 48, 22, 5, EARTHY);
      s.ball(46, 15, 9, 7, EARTHY, { lx: 0, ly: -0.5 });
      K.horn(s, 40, 8, -0.6, -0.8, 9, 2, SCUTE); K.horn(s, 48, 6, 0.3, -1, 10, 2, SCUTE);
    },
  });

  // ---- FRIENDSHIP: Pupperine -> Lealkin ----
  const PUP = Px.ramp('#d8b878'); const PUPD = Px.ramp('#a88848'); const FAE = Px.ramp('#f0c8e8'); const CREAMP = Px.ramp('#f4ead0');
  Dex.add({
    id: 114, key: 'pupperine', name: 'Pupperine', types: ['Normal'],
    base: { hp: 55, atk: 55, def: 50, spa: 45, spd: 55, spe: 60 }, ability: 'moss_mend',
    catchRate: 180, expYield: 62, growth: 'medfast', gender: 50, evolve: { to: 'lealkin', friendship: 160 },
    learn: [[1, 'tackle'], [1, 'growl'], [6, 'quick_jab'], [12, 'headbutt'], [18, 'howl'], [24, 'body_slam']],
    tms: ['tm25', 'hm04'],
    dex: { species: 'Loyal Pup', h: '0.5m', w: '9.0kg', entry: 'It bonds for life with the first trainer to share a meal. It sleeps pressed to their boots so it will wake if they stir.' },
    cry: { base: 560, sweep: 0.8, wave: 'square', dur: 0.4, vib: 14, chirps: 1 },
    draw(s) {
      s.limb(25, 48, 24, 55, 2, 1.5, PUP); s.limb(39, 48, 40, 55, 2, 1.5, PUP);
      s.ball(32, 42, 10, 8, PUP); s.ball(31, 46, 6, 4, CREAMP, { flat: true });
      s.stroke(41, 44, 48, 40, 2, PUP); s.ball(49, 39, 2, 2, CREAMP, { flat: true });
      s.ball(30, 30, 8, 7, PUP);
      s.tri(24, 26, 20, 32, 27, 30, PUP.b); s.tri(36, 26, 40, 32, 33, 30, PUP.b); // floppy ears
      s.ball(29, 33, 4, 3, CREAMP, { flat: true }); s.set(29, 32, '#1a1418');
      K.eye(s, 26, 30, 2, '#5a4028'); K.eye(s, 34, 30, 2, '#5a4028');
      K.cheek(s, 22, 32, '#f0c0a8'); K.cheek(s, 38, 32, '#f0c0a8');
    },
    drawBack(s) {
      s.limb(25, 48, 24, 55, 2, 1.5, PUP); s.limb(39, 48, 40, 55, 2, 1.5, PUP);
      s.ball(32, 42, 11, 9, PUP, { lx: 0, ly: -0.5 }); s.dither(26, 38, 12, 8, PUPD.b, 1);
      s.stroke(41, 44, 49, 38, 2, PUP);
      s.ball(30, 29, 8, 7, PUP, { lx: 0, ly: -0.5 });
      s.tri(24, 25, 20, 31, 27, 29, PUPD.b); s.tri(36, 25, 40, 31, 33, 29, PUPD.b);
    },
  });
  Dex.add({
    id: 115, key: 'lealkin', name: 'Lealkin', types: ['Normal', 'Fairy'],
    base: { hp: 80, atk: 85, def: 78, spa: 82, spd: 90, spe: 95 }, ability: 'moss_mend',
    catchRate: 60, expYield: 198, growth: 'medfast', gender: 50, evolve: null,
    learn: [[1, 'tackle'], [1, 'quick_jab'], [1, 'headbutt'], [18, 'howl'], [24, 'body_slam'], [32, 'glimmer_kiss'], [40, 'rough_tumble'], [48, 'moonveil_blast']],
    tms: ['tm09', 'tm25', 'hm04'],
    dex: { species: 'Noble Hound', h: '1.3m', w: '42.0kg', entry: 'Its coat gained a starlit sheen the day its bond with its trainer was sealed. It will not leave their side, in this life or beyond.' },
    cry: { base: 440, sweep: 0.75, wave: 'square', dur: 0.5, vib: 12, chirps: 1 },
    draw(s) {
      s.limb(24, 48, 22, 57, 3, 2, PUP); s.limb(40, 48, 42, 57, 3, 2, PUP);
      s.ball(32, 40, 12, 9, PUP); s.ball(31, 44, 7, 5, CREAMP, { flat: true });
      s.stroke(43, 42, 54, 34, 3, PUP); s.ball(55, 32, 3, 3, FAE, { flat: true });
      s.ball(30, 26, 9, 8, PUP);
      s.fillPoly([[23, 24], [18, 14], [27, 22]], PUP.b); s.fillPoly([[37, 24], [42, 14], [33, 22]], PUP.b); // noble ears
      s.set(20, 17, FAE.b); s.set(40, 17, FAE.b);
      s.ball(29, 30, 4, 3, CREAMP, { flat: true }); s.set(29, 29, '#1a1418');
      K.eye(s, 26, 26, 2, '#6a4830'); K.eye(s, 34, 26, 2, '#6a4830');
      // fairy star on brow
      s.set(30, 21, FAE.h); s.set(29, 22, FAE.b); s.set(31, 22, FAE.b);
    },
    drawBack(s) {
      s.limb(24, 48, 22, 57, 3, 2, PUP); s.limb(40, 48, 42, 57, 3, 2, PUP);
      s.ball(32, 40, 13, 10, PUP, { lx: 0, ly: -0.5 }); s.dither(24, 36, 16, 8, PUPD.b, 1);
      s.stroke(43, 42, 55, 32, 3, PUP); s.ball(56, 30, 3, 3, FAE, { flat: true });
      s.ball(30, 25, 9, 8, PUP, { lx: 0, ly: -0.5 });
      s.fillPoly([[23, 23], [18, 13], [27, 21]], PUPD.b); s.fillPoly([[37, 23], [42, 13], [33, 21]], PUPD.b);
      s.set(30, 20, FAE.h);
    },
  });

  // ---- SPLIT: Pollywisp -> Marshgil (Lv 30) OR Mirephantom (Tide Stone) ----
  const POLL = Px.ramp('#5ca0c0'); const POLLD = Px.ramp('#3a7290'); const MIRE = Px.ramp('#7a8a5a'); const GHOSTM = Px.ramp('#8fb0c0');
  Dex.add({
    id: 116, key: 'pollywisp', name: 'Pollywisp', types: ['Water'],
    base: { hp: 50, atk: 48, def: 50, spa: 62, spd: 55, spe: 55 }, ability: 'spring_sponge',
    catchRate: 150, expYield: 62, growth: 'medslow', gender: 50,
    evolve: [{ to: 'marshgil', level: 30 }, { to: 'mirephantom', stone: 'tide_stone' }],
    learn: [[1, 'splash_jet'], [1, 'growl'], [8, 'bubble_beam'], [14, 'mud_shot'], [20, 'aqua_jet'], [26, 'confusion']],
    tms: ['tm03', 'hm03'],
    dex: { species: 'Wisp Tadpole', h: '0.4m', w: '4.5kg', entry: 'A tadpole with a will-o-the-wisp for a tail. Where it grows up decides what it becomes: firm marsh, or haunted bog.' },
    cry: { base: 620, sweep: 0.8, wave: 'sine', dur: 0.4, vib: 18 },
    draw(s) {
      s.stroke(38, 42, 50, 36, 2, POLL); s.ball(51, 34, 3, 3, GHOSTM, { flat: true }); s.set(51, 33, '#e8f8ff');
      s.ball(30, 40, 9, 8, POLL); s.ball(29, 43, 5, 4, Px.ramp('#c0e0f0'), { flat: true });
      K.eye(s, 26, 38, 2, '#28303c'); K.eye(s, 34, 38, 2, '#28303c');
      K.smile(s, 30, 43, 2);
      s.set(24, 40, POLLD.d); s.set(36, 40, POLLD.d);
    },
    drawBack(s) {
      s.stroke(38, 42, 51, 34, 2, POLL); s.ball(52, 32, 3, 3, GHOSTM, { flat: true });
      s.ball(30, 40, 10, 9, POLL, { lx: 0, ly: -0.5 }); s.dither(25, 37, 10, 6, POLLD.b, 1);
      s.set(30, 34, Px.ramp('#c0e0f0').l);
    },
  });
  Dex.add({
    id: 117, key: 'marshgil', name: 'Marshgil', types: ['Water', 'Ground'],
    base: { hp: 84, atk: 88, def: 82, spa: 74, spd: 76, spe: 66 }, ability: 'spring_sponge',
    catchRate: 55, expYield: 196, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'splash_jet'], [1, 'mud_shot'], [1, 'aqua_jet'], [20, 'burrow_strike'], [28, 'aqua_tail'], [36, 'bulldoze'], [44, 'earthshatter']],
    tms: ['tm03', 'tm07', 'tm14', 'hm03', 'hm06'],
    dex: { species: 'Marsh Newt', h: '1.4m', w: '58.0kg', entry: 'It plants its broad feet in the mud and refuses to budge. Floods break around it like a stone in a stream.' },
    cry: { base: 300, sweep: 0.6, wave: 'square', dur: 0.55, vib: 8, grit: 0.3, sub: true },
    draw(s) {
      s.limb(24, 50, 22, 57, 4, 3, MIRE); K.claws(s, 18, 58, 3, POLL.l);
      s.limb(40, 50, 42, 57, 4, 3, MIRE); K.claws(s, 42, 58, 3, POLL.l);
      s.ball(32, 42, 13, 9, MIRE); s.ball(32, 45, 8, 5, Px.ramp('#c8c890'), { flat: true });
      s.stroke(44, 44, 54, 40, 3, MIRE);
      s.ball(30, 30, 9, 8, MIRE);
      K.horn(s, 25, 25, -0.4, -1, 4, 2, POLL); K.horn(s, 35, 25, 0.4, -1, 4, 2, POLL); // fin frills
      K.eye(s, 26, 30, 2, '#e8d848'); K.eye(s, 34, 30, 2, '#e8d848');
      s.line(28, 34, 33, 34, MIRE.o);
      s.set(24, 40, POLL.b); s.set(40, 40, POLL.b);
    },
    drawBack(s) {
      s.limb(24, 50, 22, 57, 4, 3, MIRE); s.limb(40, 50, 42, 57, 4, 3, MIRE);
      s.ball(32, 42, 14, 10, MIRE, { lx: 0, ly: -0.5 }); s.dither(24, 38, 16, 8, POLLD.b, 1);
      for (let i = 0; i < 3; i++) K.horn(s, 27 + i * 5, 36, 0, -1, 4, 2, POLL);
      s.ball(30, 29, 9, 8, MIRE, { lx: 0, ly: -0.5 });
      K.horn(s, 25, 24, -0.4, -1, 4, 2, POLL); K.horn(s, 35, 24, 0.4, -1, 4, 2, POLL);
    },
  });
  Dex.add({
    id: 118, key: 'mirephantom', name: 'Mirephantom', types: ['Water', 'Ghost'],
    base: { hp: 78, atk: 66, def: 78, spa: 108, spd: 92, spe: 78 }, ability: 'spring_sponge',
    catchRate: 55, expYield: 196, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'splash_jet'], [1, 'astonish'], [1, 'aqua_jet'], [20, 'phantom_orb'], [28, 'bubble_beam'], [36, 'shade_sneak'], [44, 'deluge_cannon'], [50, 'haunt']],
    tms: ['tm03', 'tm05', 'tm18', 'hm03'],
    dex: { species: 'Bog Wraith', h: '1.3m', w: '20.0kg', entry: 'A tadpole that drowned in a haunted fen and rose again as mist. The lights it dances are the last thoughts of the lost.' },
    cry: { base: 420, sweep: 1.3, wave: 'sine', dur: 0.6, vib: 20, vibRate: 6 },
    draw(s) {
      // floating misty spirit
      s.fillPoly([[24, 32], [40, 32], [42, 48], [32, 54], [22, 48]], GHOSTM.b);
      s.dither(24, 40, 16, 10, POLL.l, 1);
      for (let i = 0; i < 4; i++) s.tri(24 + i * 5, 48, 26 + i * 5, 54, 28 + i * 5, 48, GHOSTM.d);
      s.set(28, 58, '#c0e0f0'); s.set(36, 57, '#c0e0f0'); // wisp trail
      s.ball(32, 26, 8, 6, GHOSTM);
      K.horn(s, 26, 22, -0.5, -1, 6, 1, POLL); K.horn(s, 38, 22, 0.5, -1, 6, 1, POLL);
      K.eye(s, 28, 26, 2, '#5878b0'); K.eye(s, 36, 26, 2, '#5878b0');
      s.set(28, 26, '#e8f8ff'); s.set(36, 26, '#e8f8ff');
      s.set(24, 30, '#e8f8ff'); s.set(40, 34, '#e8f8ff'); // floating wisps
    },
    drawBack(s) {
      s.fillPoly([[24, 32], [40, 32], [42, 48], [32, 54], [22, 48]], GHOSTM.d);
      s.dither(24, 38, 16, 12, GHOSTM.b, 0);
      for (let i = 0; i < 4; i++) s.tri(24 + i * 5, 48, 26 + i * 5, 54, 28 + i * 5, 48, GHOSTM.o);
      s.ball(32, 25, 8, 6, GHOSTM, { lx: 0, ly: -0.5 });
      K.horn(s, 26, 21, -0.5, -1, 6, 1, POLL); K.horn(s, 38, 21, 0.5, -1, 6, 1, POLL);
      s.set(26, 30, '#e8f8ff'); s.set(38, 32, '#e8f8ff');
    },
  });

  // ---- STONE: Gemkit -> Prismyx (Aurora Stone) ----
  const GEMF = Px.ramp('#d8d0e8'); const GEMV = Px.ramp('#a888e0'); const GEMG = Px.ramp('#78e8c8'); const GEMP = Px.ramp('#f0a8e0');
  Dex.add({
    id: 119, key: 'gemkit', name: 'Gemkit', types: ['Rock'],
    base: { hp: 50, atk: 50, def: 68, spa: 60, spd: 62, spe: 50 }, ability: 'keen_edge',
    catchRate: 120, expYield: 66, growth: 'medslow', gender: 50, evolve: { to: 'prismyx', stone: 'aurora_stone' },
    learn: [[1, 'rock_throw'], [1, 'leer'], [8, 'relic_power'], [14, 'rock_tomb'], [20, 'stone_polish'], [26, 'rock_slide']],
    tms: ['tm15', 'hm06'],
    dex: { species: 'Gem Kit', h: '0.5m', w: '11.0kg', entry: 'A small beast studded with raw crystal. Under the right light it hums a note only its own kind can hear.' },
    cry: { base: 560, sweep: 0.7, wave: 'triangle', dur: 0.4, vib: 14, chirps: 1 },
    draw(s) {
      s.limb(26, 48, 25, 54, 2, 1.5, GEMF); s.limb(38, 48, 39, 54, 2, 1.5, GEMF);
      s.ball(32, 42, 10, 8, GEMF); s.ball(31, 45, 6, 4, Px.ramp('#f0ecf8'), { flat: true });
      // crystal shards on back
      K.horn(s, 28, 36, -0.2, -1, 5, 2, GEMV); K.horn(s, 34, 35, 0.2, -1, 6, 2, GEMG);
      s.ball(30, 30, 8, 7, GEMF);
      K.horn(s, 26, 25, -0.4, -1, 4, 1, GEMP); K.horn(s, 34, 25, 0.4, -1, 4, 1, GEMP);
      K.eye(s, 27, 30, 2, '#8858c0'); K.eye(s, 35, 30, 2, '#8858c0');
      K.smile(s, 31, 34, 2);
    },
    drawBack(s) {
      s.limb(26, 48, 25, 54, 2, 1.5, GEMF); s.limb(38, 48, 39, 54, 2, 1.5, GEMF);
      s.ball(32, 42, 11, 9, GEMF, { lx: 0, ly: -0.5 });
      K.horn(s, 27, 36, -0.2, -1, 6, 2, GEMV); K.horn(s, 33, 34, 0.1, -1, 7, 2, GEMG); K.horn(s, 37, 37, 0.4, -1, 5, 2, GEMP);
      s.ball(30, 29, 8, 7, GEMF, { lx: 0, ly: -0.5 });
      K.horn(s, 26, 24, -0.4, -1, 4, 1, GEMP); K.horn(s, 34, 24, 0.4, -1, 4, 1, GEMP);
    },
  });
  Dex.add({
    id: 120, key: 'prismyx', name: 'Prismyx', types: ['Rock', 'Fairy'],
    base: { hp: 78, atk: 72, def: 100, spa: 110, spd: 108, spe: 82 }, ability: 'hunter_eye',
    catchRate: 45, expYield: 200, growth: 'medslow', gender: 50, evolve: null,
    learn: [[1, 'rock_throw'], [1, 'fae_wind'], [1, 'relic_power'], [20, 'stone_polish'], [26, 'rock_slide'], [34, 'prism_flare'], [42, 'stone_spike'], [50, 'moonveil_blast']],
    tms: ['tm09', 'tm15', 'hm06'],
    dex: { species: 'Prism Fox', h: '1.1m', w: '38.0kg', entry: 'When an Aurora Stone touched its crystals, they bloomed into a living prism. It scatters the aurora into a thousand colors as it runs.' },
    cry: { base: 480, sweep: 1.0, wave: 'triangle', dur: 0.5, vib: 16, chirps: 1 },
    draw(s) {
      s.limb(24, 48, 22, 56, 3, 2, GEMF); s.limb(40, 48, 42, 56, 3, 2, GEMF);
      s.ball(32, 40, 12, 9, GEMF); s.ball(31, 44, 7, 5, Px.ramp('#f0ecf8'), { flat: true });
      // prism crystal crown down the back
      K.horn(s, 26, 34, -0.3, -1, 7, 2, GEMV); K.horn(s, 32, 32, 0, -1, 9, 3, GEMG); K.horn(s, 38, 34, 0.3, -1, 7, 2, GEMP);
      s.stroke(43, 42, 54, 36, 3, GEMF); s.ball(55, 34, 3, 3, GEMG, { flat: true });
      s.ball(30, 26, 9, 8, GEMF);
      s.fillPoly([[23, 24], [19, 13], [27, 22]], GEMV.b); s.fillPoly([[37, 24], [41, 13], [33, 22]], GEMP.b); // crystal ears
      K.eye(s, 27, 26, 2, '#7848b8'); K.eye(s, 35, 26, 2, '#7848b8');
      s.set(31, 20, GEMG.h); s.set(30, 21, GEMV.b); s.set(32, 21, GEMP.b); // brow gem
    },
    drawBack(s) {
      s.limb(24, 48, 22, 56, 3, 2, GEMF); s.limb(40, 48, 42, 56, 3, 2, GEMF);
      s.ball(32, 40, 13, 10, GEMF, { lx: 0, ly: -0.5 });
      K.horn(s, 25, 34, -0.3, -1, 7, 2, GEMV); K.horn(s, 32, 31, 0, -1, 10, 3, GEMG); K.horn(s, 39, 34, 0.3, -1, 7, 2, GEMP);
      s.dither(26, 40, 12, 6, GEMV.l, 1);
      s.stroke(43, 42, 55, 34, 3, GEMF);
      s.ball(30, 25, 9, 8, GEMF, { lx: 0, ly: -0.5 });
      s.fillPoly([[23, 23], [19, 12], [27, 21]], GEMV.d); s.fillPoly([[37, 23], [41, 12], [33, 21]], GEMP.d);
    },
  });
})();
