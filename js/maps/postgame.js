'use strict';
/**
 * Postgame content unlocked after becoming Champion:
 *   • Aurora Depths — a two-level cavern that opens beneath the Sky Spire altar
 *     once Auroryx falls. High-level wild fakemon, two postgame aces, strong
 *     items, a rival rematch (Vera), and a static pseudo-legendary Magnadrake.
 *
 * The Depths are reached through a fissure that only breathes open post-Champion
 * (gated by the `champion` flag on the Sky Spire altar corridor).
 */

const DLEG = {
  ' ': 'cavefloor', 'w': 'cavewall', 'W': 'water', 'R': 'rock',
  'B': 'boulder', 'c': 'crystal', 'd': 'stairs_down', 'u': 'stairs_down', 's': 'sign',
};

// ---- Postgame trainers ----
RT('depths_ace1', 'Yngve', 'Ace Trainer', 3200, [{ key: 'ursnow', level: 56 }, { key: 'wyrmskim', level: 57 }],
  'These depths forge only the strong. Show me you belong down here!', 'You belong.');
RT('depths_ace2', 'Solveig', 'Veteran', 3600, [{ key: 'nokkmare', level: 57 }, { key: 'gulomaul', level: 57 }, { key: 'terrawyrm', level: 58 }],
  'Past the League, the REAL training begins. Ready?', 'Well fought, Champion.');

// ---- The fissure gate on the Sky Spire ----
Scripts.register('aurora_depths_gate', () => {
  if (!Game.flags.champion) {
    Textbox.say('A fissure in the altar rock breathes cold aurora-light — but it is sealed tight. Something must still be holding it shut.', Scripts.done);
    return;
  }
  Textbox.ask('The fissure yawned open when Auroryx fell. A cold, star-bright draft rises from the AURORA DEPTHS below. Descend?',
    ['Descend', 'Not yet'], (pick) => {
      if (pick !== 0) { Textbox.say('The depths will wait.', Scripts.done); return; }
      Overworld.warpTo('aurora_depths', 8, 11, 'down');
      Scripts.done();
    });
});

// ---- Rival rematch (Vera) in the Depths ----
Scripts.register('depths_rival', (npc) => {
  if (Game.flags.beat_depths_rival) {
    if (npc) npc.passable = true;
    Textbox.say('VERA: Even down here you\'re a step ahead. Figures. Go on — I\'ll keep training.', Scripts.done);
    return;
  }
  Textbox.say('VERA: Ha! I should have known you\'d find this place too. No title on the line now — just you, me, and everything we\'ve got. Let\'s GO!', () => {
    const base = resolveRivalParty(Trainers.rival_vera_final, { stage: 2 });
    const tr = rematchTrainer(base, 8);   // ~Lv 60 evolved full team
    Music.play('battle_champion');
    Game.startTrainerBattle(tr, () => {
      Game.flags.beat_depths_rival = true;
      if (npc) npc.passable = true;
      Textbox.say([tr.name + ': That\'s the best battle we\'ve ever had. I mean it.',
        'VERA: Here — I found two of these and I only need one.'], () => {
        Scripts.giveItem('rare_candy', 2, Scripts.done);
      });
    });
  });
});

// ---- Static pseudo-legendary: Magnadrake ----
Scripts.register('depths_legendary', () => {
  if (Game.flags.caughtMagnadrake || Game.flags.beatMagnadrake) {
    Textbox.say('The scorched hollow where the great drake laired is silent now.', Scripts.done);
    return;
  }
  if (!Game.partyAlive()) { Textbox.say('The ground trembles with a deep, waiting growl — but your team is in no shape to face it. Heal first!', Scripts.done); return; }
  Textbox.say(['Deep in the earth, a mound of ore and slag SHIFTS — and rises.',
    'A MAGNADRAKE, ancient sovereign of the Depths, fixes you with molten eyes and roars a challenge!'], () => {
    const mon = new Mon('magnadrake', 60);
    Game.registerDex('magnadrake', 'seen');
    Game.setState('battle');
    Music.play('battle_champion');
    Battle.start({
      kind: 'wild', mon, env: 'cave',
      onEnd: (result) => {
        Game.setState('overworld');
        if (result === 'lose') { Game.whiteout(); return; }
        if (result === 'caught') Game.flags.caughtMagnadrake = true;
        if (result === 'win') Game.flags.beatMagnadrake = true;
        if (result === 'caught' || result === 'win') Game.flags.magnadrakeDone = true;
        Music.play(Overworld.currentMusic());
        Textbox.say(result === 'caught' ? 'The sovereign of the Depths is yours. Few trainers will ever stand beside one.' : 'The Magnadrake sinks back into the ore, its challenge answered.', Scripts.done);
      },
    });
  });
});

// ============================================================ Aurora Depths — Level 1
(() => {
  const g = blankGrid(16, 14, ' '); gborder(g, 'w');
  for (const [x, y] of [[4, 3], [4, 4], [10, 4], [10, 5], [6, 8], [7, 8], [12, 9], [3, 10], [11, 3]]) gput(g, x, y, 'R');
  gput(g, 13, 2, 'c'); gput(g, 3, 6, 'c');
  gput(g, 13, 1, 'd');   // stairs down to Level 2
  defineMap({
    id: 'aurora_depths', name: 'Aurora Depths', music: 'cave', battleEnv: 'cave', indoor: true, legend: DLEG, ground: gRows(g),
    warps: [
      { x: 8, y: 13, to: 'sky_spire', tx: 8, ty: 4, dir: 'down', always: true },
      { x: 13, y: 1, to: 'aurora_depths2', tx: 2, ty: 12, dir: 'up', always: true },
    ],
    signs: [{ x: 7, y: 12, text: 'AURORA DEPTHS — where the aurora sinks into the roots of the world. The way up leads back to the Spire.' }],
    items: [{ x: 3, y: 2, item: 'ultraorb', count: 5, flag: 'depths_orbs' }, { x: 12, y: 10, item: 'max_revive', flag: 'depths_revive' }],
    npcs: [
      { x: 6, y: 5, sprite: 'npc_hiker', dir: 'down', trainer: 'depths_ace1', sight: 3, script: 'trainer_after' },
    ],
    encounters: { rate: 14, grass: [
      { key: 'terrawyrm', min: 54, max: 57, weight: 2 }, { key: 'grimcorvid', min: 54, max: 56, weight: 2 },
      { key: 'ursnow', min: 54, max: 57, weight: 2 }, { key: 'nokkmare', min: 54, max: 56, weight: 2 },
      { key: 'wyrmskim', min: 55, max: 58, weight: 1 }, { key: 'gulomaul', min: 54, max: 56, weight: 2 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// ============================================================ Aurora Depths — Level 2 (drake lair)
(() => {
  const g = blankGrid(16, 14, ' '); gborder(g, 'w');
  for (const [x, y] of [[5, 4], [5, 5], [10, 5], [10, 6], [4, 9], [11, 9], [7, 10], [8, 10]]) gput(g, x, y, 'R');
  gput(g, 13, 3, 'c'); gput(g, 3, 11, 'c'); gput(g, 8, 3, 'B');
  gput(g, 2, 13, 'u');   // stairs back up to Level 1
  gput(g, 8, 2, 's');    // the drake's lair marker
  defineMap({
    id: 'aurora_depths2', name: 'Aurora Depths', music: 'cave', battleEnv: 'cave', indoor: true, legend: DLEG, ground: gRows(g),
    warps: [{ x: 2, y: 13, to: 'aurora_depths', tx: 12, ty: 2, dir: 'down', always: true }],
    signs: [{ x: 8, y: 2, script: 'depths_legendary', text: 'A scorched hollow, thick with the smell of hot metal.' }],
    items: [
      { x: 13, y: 11, item: 'rift_stone', flag: 'depths_rift' },
      { x: 3, y: 3, item: 'rare_candy', flag: 'depths_candy' },
      { x: 12, y: 6, item: 'ether', count: 3, flag: 'depths_ether' },
    ],
    npcs: [
      { x: 6, y: 7, sprite: 'npc_villager', dir: 'down', trainer: 'depths_ace2', sight: 3, script: 'trainer_after' },
      { x: 8, y: 6, sprite: 'rival_f', dir: 'up', move: 'static', passable: false, script: 'depths_rival' },
    ],
    encounters: { rate: 14, grass: [
      { key: 'terrawyrm', min: 56, max: 59, weight: 2 }, { key: 'ingotaur', min: 56, max: 58, weight: 2 },
      { key: 'boulderam', min: 56, max: 58, weight: 2 }, { key: 'jarnwyrm', min: 57, max: 59, weight: 1 },
      { key: 'ursnow', min: 56, max: 58, weight: 2 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// Append the fissure gate to the Sky Spire altar corridor (post-Champion only).
(() => {
  const spire = Maps['sky_spire'];
  if (spire) (spire.signs || (spire.signs = [])).push({ x: 11, y: 3, script: 'aurora_depths_gate', text: 'A hairline fissure in the altar rock, breathing cold light.' });
})();
