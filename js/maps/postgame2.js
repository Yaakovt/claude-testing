'use strict';
/**
 * The Dusk-Heart arc (postgame, after Champion):
 *   1. Return to Aspen's Lab — Professor Aspen reveals he is a hidden master and
 *      challenges you with a FIXED Lv70 team led by the twilight legendary
 *      VESPERYX. (js/maps/story.js routes the lab prof here when you're Champion.)
 *   2. Beat him and he grants the FERRY PASS to the DUSK ISLES.
 *   3. Sail from Tidesend to the Dusk Isles (a small Sevii-style chain) and, at
 *      the Twilight Shrine, meet and catch a wild VESPERYX of your own.
 */

// ---- Professor Aspen's secret master team (fixed, not randomized) ----
T('aspen_master', {
  name: 'Aspen', cls: 'Professor', reward: 12000, music: 'battle_champion', ai: 'smart', leader: true,
  intro: 'ASPEN: You calmed Auroryx AND Umbryx — day and night both bowed to you. There is one trial left, and I have kept it for myself. Behold the dusk between them... and my true team!',
  loss: 'ASPEN: Ahaha! Wonderful — WONDERFUL! The sagas were about you all along.',
  party: [
    { key: 'stormgull', level: 68, held: 'voltband' },
    { key: 'mystrix', level: 68, held: 'focus_charm' },
    { key: 'fjorddrake', level: 69, held: 'tideband' },
    { key: 'ursnow', level: 69, held: 'mendmoss' },
    { key: 'magnadrake', level: 70, held: 'wyrmband' },
    { key: 'vesperyx', level: 71, held: 'mendmoss' },
  ],
});

/** The lab challenge (called from aspen_starter when you're Champion). */
function aspenMasterChallenge() {
  if (Game.flags.beat_aspen_master) {
    Textbox.say('ASPEN: The Dusk Isles are yours to explore any time. Give my regards to Vesperyx\'s kin down there!', Scripts.done);
    return;
  }
  Textbox.ask('ASPEN: So — will you face a Professor\'s true team? No holding back this time.', ['I\'m ready', 'Not yet'], (pick) => {
    if (pick !== 0) { Textbox.say('ASPEN: Take your time. The dusk is patient.', Scripts.done); return; }
    Textbox.say(Trainers.aspen_master.intro, () => {
      Music.play('battle_champion');
      Game.registerDex('vesperyx', 'seen');
      Game.startTrainerBattle(Trainers.aspen_master, () => {
        Game.flags.beat_aspen_master = true;
        Textbox.say([Trainers.aspen_master.name + ': ' + Trainers.aspen_master.loss,
          'ASPEN: My Vesperyx is one of a pair. Far to the south lie the DUSK ISLES, where its wild kin still keep the twilight.',
          'ASPEN: Take my FERRY PASS. The boat leaves from Tidesend Harbor. Go — meet a Dusk-Heart of your own!'], () => {
          Game.flags.gotFerryPass = true;
          Scripts.giveItem('ferry_pass', 1, Scripts.done);
        });
      });
    });
  });
}

// ---- Tidesend ferry to the Dusk Isles ----
Scripts.register('island_ferry', () => {
  if (!Game.hasItem('ferry_pass')) {
    Textbox.say('FERRYMAN: This boat runs clear to the DUSK ISLES, far to the south. Rough crossing — I only take those Professor Aspen vouches for. Got a FERRY PASS?', Scripts.done);
    return;
  }
  Textbox.ask('FERRYMAN: Ah, a Ferry Pass! Set sail for the Dusk Isles?', ['Set sail', 'Stay ashore'], (pick) => {
    if (pick !== 0) { Textbox.say('FERRYMAN: Say the word when you\'re ready.', Scripts.done); return; }
    Textbox.say('The little ferry cuts south across darkening water, until a ring of dusk-lit isles rises from the sea...', () => {
      Overworld.warpTo('dusk_isles', 8, 11, 'up');
      Scripts.done();
    });
  });
});

// ---- Twilight Shrine: the wild Vesperyx ----
Scripts.register('dusk_shrine_legend', () => {
  if (Game.flags.caughtVesperyx || Game.flags.beatVesperyx) {
    Textbox.say('The shrine rests in perfect twilight. Whatever dwelt here has made its peace with you.', Scripts.done);
    return;
  }
  if (!Game.partyAlive()) { Textbox.say('The air thrums with a vast, waiting presence — but your team cannot answer it now. Heal first.', Scripts.done); return; }
  Textbox.say(['You lay your hand on the shrine. The sky bleeds from gold to violet to star-dark, all at once —',
    'and from that hush uncoils VESPERYX, the Dusk-Heart, come to judge the one who calmed its siblings!'], () => {
    Game.give('ultraorb', 8);
    Game.registerDex('vesperyx', 'seen');
    const mon = new Mon('vesperyx', 62);
    Game.setState('battle');
    Music.play('battle_champion');
    Battle.start({
      kind: 'wild', mon, env: 'aurora',
      onEnd: (result) => {
        Game.setState('overworld');
        if (result === 'lose') { Game.whiteout(); return; }
        if (result === 'caught') Game.flags.caughtVesperyx = true;
        if (result === 'win') Game.flags.beatVesperyx = true;
        Music.play(Overworld.currentMusic());
        Textbox.say(result === 'caught'
          ? 'Day, night, and the dusk between — all three Storm-Hearts now walk beside you. The sagas will remember your name.'
          : 'Vesperyx dips its crowned head, satisfied, and melts back into the twilight.', Scripts.done);
      },
    });
  });
});

// Simple island flavor chats.
Scripts.register('di_villager', () => Textbox.say('ISLANDER: Few outsiders ever reach the Dusk Isles. The twilight here never fully lifts — nor fully falls.', Scripts.done));
Scripts.register('di_ranger', () => Textbox.say('RANGER: The shrine to the north is old beyond telling. On the stillest evenings, something vast stirs there...', Scripts.done));

// ---- Dusk Isles port (arrival island) ----
(() => {
  const g = blankGrid(18, 14, 'W');
  for (let y = 3; y <= 10; y++) for (let x = 3; x <= 14; x++) gput(g, x, y, '_');
  for (let y = 5; y <= 9; y++) for (let x = 6; x <= 11; x++) gput(g, x, y, ',');
  const center = building(g, 4, 3, 'blue', 'C');
  gput(g, 8, 2, '_'); gput(g, 9, 2, '_'); gput(g, 8, 1, '_'); gput(g, 9, 1, '_');   // north nub -> shrine
  gput(g, 8, 11, '_'); gput(g, 8, 12, '_'); gput(g, 8, 13, 'W');                      // south dock -> ferry
  for (const [x, y] of [[3, 3], [14, 3], [3, 10], [14, 10]]) gput(g, x, y, 'P');
  gput(g, 12, 4, 's');
  defineMap({
    id: 'dusk_isles', name: 'Dusk Isles', music: 'surf', battleEnv: 'aurora', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: 8, y: 12, to: 'tidesend', tx: 11, ty: 10, dir: 'down', always: true },
      { x: 8, y: 1, to: 'dusk_shrine', tx: 7, ty: 11, dir: 'up', always: true },
      { x: 9, y: 1, to: 'dusk_shrine', tx: 8, ty: 11, dir: 'up', always: true },
    ],
    signs: [{ x: 12, y: 4, text: 'DUSK ISLES — "Where the twilight never ends." The Twilight Shrine lies north; the ferry home waits south.' }],
    items: [{ x: 13, y: 9, item: 'rare_candy', flag: 'di_candy' }, { x: 4, y: 9, item: 'aurora_stone', flag: 'di_stone' }],
    npcs: [
      { x: 11, y: 6, sprite: 'npc_villager', move: 'wander', script: 'di_villager' },
      { x: 6, y: 4, sprite: 'npc_ranger', dir: 'down', move: 'static', script: 'di_ranger' },
    ],
    encounters: { rate: 16, grass: [
      { key: 'dreamlyn', min: 55, max: 59, weight: 2 }, { key: 'bellsylph', min: 55, max: 58, weight: 2 },
      { key: 'sylphund', min: 55, max: 58, weight: 2 }, { key: 'aurorpix', min: 56, max: 59, weight: 1 },
      { key: 'mantasurge', min: 55, max: 58, weight: 2 }, { key: 'wispurr', min: 54, max: 57, weight: 2 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// ---- Twilight Shrine (the Vesperyx islet) ----
(() => {
  const g = blankGrid(16, 14, 'W');
  for (let y = 3; y <= 11; y++) for (let x = 4; x <= 11; x++) gput(g, x, y, '_');
  for (let y = 4; y <= 10; y++) gput(g, 7, y, '.'); for (let y = 4; y <= 10; y++) gput(g, 8, y, '.');
  gput(g, 7, 2, '_'); gput(g, 8, 2, '_');
  gput(g, 6, 3, 'F'); gput(g, 9, 3, 'F'); gput(g, 7, 3, 'F'); gput(g, 8, 3, 'F');   // altar aura
  gput(g, 7, 12, '_'); gput(g, 8, 12, '_'); gput(g, 7, 13, 'W');                    // south dock -> port
  for (const [x, y] of [[4, 3], [11, 3], [4, 11], [11, 11]]) gput(g, x, y, 'P');
  defineMap({
    id: 'dusk_shrine', name: 'Twilight Shrine', music: 'cave', battleEnv: 'aurora', legend: LEG, ground: gRows(g),
    warps: [
      { x: 7, y: 12, to: 'dusk_isles', tx: 8, ty: 2, dir: 'down', always: true },
      { x: 8, y: 12, to: 'dusk_isles', tx: 9, ty: 2, dir: 'down', always: true },
    ],
    signs: [{ x: 7, y: 2, script: 'dusk_shrine_legend', text: 'An ancient shrine, caught forever in the moment between day and night.' }],
    onEnter() { Overworld.showBanner(); },
  });
})();

// Place the ferryman on the Tidesend dock.
(() => {
  const ts = Maps['tidesend'];
  if (ts) (ts.npcs || (ts.npcs = [])).push({ x: 11, y: 11, sprite: 'npc_sailor', dir: 'down', move: 'static', passable: false, script: 'island_ferry' });
})();
