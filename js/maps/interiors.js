'use strict';
/** Building interiors: player's room, Professor Aspen's lab, Pokecenter,
 *  Pokemart, the Birchwick gym, and a couple of houses. */

const ILEG = {
  ' ': 'floor_wood', '.': 'floor_tile', 'r': 'rug', 'w': 'wall_in',
  't': 'table', 'c': 'chair', 'b': 'bed', 'k': 'bookshelf', 'n': 'counter',
  'p': 'pc', 'l': 'plant', 'm': 'lab_machine', 'h': 'healer', 'd': 'door', 's': 'sign',
};

// ---- Player's room ----
defineMap({
  id: 'player_room', name: "'s Room", music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwww',
    'wb   p w',
    'wb     w',
    'w    k w',
    'w   t  w',
    'w   c  w',
    'w   d  w',
    'wwwwwwww',
  ],
  warps: [{ x: 4, y: 6, to: 'frosthollow', tx: 11, ty: 5, dir: 'down', always: true }],
  npcs: [],
  signs: [],
  items: [{ x: 6, y: 1, item: 'potion', flag: 'room_potion' }],
  onEnter() {
    Overworld.map && (Overworld.map.name = Game.playerName + "'s Room");
    if (!Game.flags.woke_up) {
      Game.flags.woke_up = true;
      Textbox.say(['(Your room in Frosthollow. A brand-new adventure waits outside.)',
        'MOM (from downstairs): ' + '"' + (Game.gender === 'F' ? 'Sweetie' : 'Dear') + ', Professor Aspen was looking for you!"']);
    }
  },
});

// ---- Aspen's Lab (starter selection) ----
defineMap({
  id: 'aspen_lab', name: "Aspen's Lab", music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwwwwwww',
    'wkkkkwwwkkkkw',
    'w    m   m  w',
    'w          lw',
    'w   n n n   w',
    'w   nnnnn   w',
    'wl   t     lw',
    'w    d      w',
    'wwwwwdwwwwwww',
  ],
  warps: [{ x: 5, y: 8, to: 'frosthollow', tx: 4, ty: 5, dir: 'down', always: true }],
  npcs: [
    { x: 6, y: 3, sprite: 'prof', dir: 'down', move: 'static', script: 'aspen_starter', passable: false },
  ],
  signs: [],
  onEnter() {
    if (!Game.flags.metAspen) { Game.flags.metAspen = true; }
  },
});

// ---- Pokecenter ----
defineMap({
  id: 'center', name: 'Pokecenter', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwwwww',
    'w hhh   p w',
    'w nnn     w',
    'w         w',
    'w  l   l  w',
    'w         w',
    'w    d    w',
    'wwwwwdwwwww',
  ],
  warps: [{ x: 5, y: 7, to: 'birchwick', tx: 15, ty: 5, dir: 'down', always: true }],
  npcs: [
    { x: 3, y: 2, sprite: 'nurse', dir: 'down', move: 'static', script: 'nurse', passable: false },
    { x: 8, y: 4, sprite: 'npc_villager', move: 'wander', script: 'center_chat' },
  ],
  signs: [{ x: 8, y: 1, text: 'STORAGE PC. Boxed fakemon are managed automatically.' }],
  onEnter() {},
});

// ---- Pokemart ----
defineMap({
  id: 'mart', name: 'Pokemart', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwww',
    'w nnn   w',
    'w       w',
    'w  k k  w',
    'w       w',
    'w   d   w',
    'wwwwdwwww',
  ],
  warps: [{ x: 4, y: 5, to: 'birchwick', tx: 15, ty: 11, dir: 'down', always: true }],
  npcs: [
    { x: 2, y: 1, sprite: 'clerk', dir: 'down', move: 'static', passable: false, script: 'mart',
      stock: ['fieldorb', 'greatorb', 'potion', 'super_potion', 'antidote', 'paralyze_heal', 'awakening', 'repel'] },
    { x: 6, y: 3, sprite: 'npc_woman', move: 'wander', script: 'mart_chat' },
  ],
  onEnter() {},
});

// ---- Birchwick Gym (Normal, Leader Astrid) ----
defineMap({
  id: 'birchwick_gym', name: 'Birchwick Gym', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwwwwwww',
    'w    r    w',
    'w    r    w',
    'w  r r r  w',
    'w  r   r  w',
    'w    r    w',
    'w    r    w',
    'w    r    w',
    'w    d    w',
    'wwwwwdwwwww',
  ],
  warps: [{ x: 5, y: 9, to: 'birchwick', tx: 5, ty: 11, dir: 'down', always: true }],
  npcs: [
    { x: 5, y: 2, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: 'gym_astrid' },
    { x: 3, y: 4, sprite: 'npc_villager', dir: 'right', trainer: 'gym_helper1', sight: 2, script: 'trainer_after' },
    { x: 7, y: 4, sprite: 'npc_villager', dir: 'left', trainer: 'gym_helper2', sight: 2, script: 'trainer_after' },
  ],
  signs: [{ x: 6, y: 8, text: 'BIRCHWICK GYM — Leader: ASTRID. "The Steadfast Heart."' }],
  onEnter() {},
});

// ---- A Frosthollow house ----
defineMap({
  id: 'frost_house1', name: 'House', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwww',
    'w k  lw',
    'w t c w',
    'w     w',
    'w  d  w',
    'wwwdwww',
  ],
  warps: [{ x: 3, y: 4, to: 'frosthollow', tx: 4, ty: 12, dir: 'down', always: true }],
  npcs: [{ x: 4, y: 2, sprite: 'npc_woman', dir: 'left', move: 'static', script: 'house_mom' }],
  onEnter() {},
});

// ---- A Birchwick house ----
defineMap({
  id: 'birchwick_house', name: 'House', music: 'town', battleEnv: 'interior', indoor: true,
  legend: ILEG,
  ground: [
    'wwwwwww',
    'w l  kw',
    'w   t w',
    'w c   w',
    'w  d  w',
    'wwwdwww',
  ],
  warps: [{ x: 3, y: 4, to: 'birchwick', tx: 4, ty: 4, dir: 'down', always: true }],
  npcs: [{ x: 2, y: 3, sprite: 'npc_oldman', dir: 'right', move: 'static', script: 'house_oldman' }],
  onEnter() {},
});
