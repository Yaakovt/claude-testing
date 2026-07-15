'use strict';
/**
 * Overworld maps: towns and routes.
 *
 * Towns are assembled with a small building-stamper so roofs, doors, mats, and
 * the warps that use them are ALWAYS aligned (no hand-counted tile columns).
 * Routes are authored as row strings (normalized to equal width on load).
 */
const LEG = {
  ' ': 'grass', ',': 'tallgrass', '.': 'path', '_': 'sand',
  'T': 'tree', 'P': 'pine', 'Q': 'snowpine', 'R': 'rock', 'B': 'boulder', 'K': 'crackrock',
  'W': 'water', '=': 'waterfall', 'f': 'fence', 'F': 'flowers', 'H': 'cutbush', 'L': 'ledge',
  'x': 'snow', 'z': 'tallsnow', 'i': 'ice', 'G': 'gym_statue',
  '1': 'roof_l', '2': 'roof_m', '3': 'roof_r',
  '4': 'roofb_l', '5': 'roofb_m', '6': 'roofb_r',
  '7': 'roofg_l', '8': 'roofg_m', '9': 'roofg_r',
  'a': 'roofp_l', 'b': 'roofp_m', 'c': 'roofp_r',
  'w': 'wall', 'o': 'window', 'd': 'door', 'm': 'mat',
  'C': 'center_sign', 'M': 'mart_sign', 's': 'sign',
};
const ROOFS = { red: '123', blue: '456', green: '789', purple: 'abc' };

/** Mutable grid helpers (arrays of char arrays). */
function blankGrid(w, h, ch) { const g = []; for (let y = 0; y < h; y++) g.push(new Array(w).fill(ch)); return g; }
function gput(g, x, y, ch) { if (g[y] && x >= 0 && x < g[y].length) g[y][x] = ch; }
function gborder(g, ch) { const h = g.length, w = g[0].length; for (let x = 0; x < w; x++) { gput(g, x, 0, ch); gput(g, x, h - 1, ch); } for (let y = 0; y < h; y++) { gput(g, 0, y, ch); gput(g, w - 1, y, ch); } }
function gRows(g) { return g.map((r) => r.join('')); }
/**
 * Stamp a 3-wide × 2-tall building with a centered door + mat below.
 * Returns { doorX, doorY, matX, matY } for wiring warps.
 */
function building(g, x, y, roofKey, signCol) {
  const r = ROOFS[roofKey];
  for (let ry = 0; ry < 2; ry++) { gput(g, x, y + ry, r[0]); gput(g, x + 1, y + ry, r[1]); gput(g, x + 2, y + ry, r[2]); }
  if (signCol) gput(g, x + (signCol === 'C' ? 0 : 2), y, signCol); // shop emblem on a roof corner
  gput(g, x + 1, y + 2, 'd');
  gput(g, x + 1, y + 3, 'm');
  return { doorX: x + 1, doorY: y + 2, matX: x + 1, matY: y + 3 };
}

// ============================================================ Frosthollow
(() => {
  const g = blankGrid(20, 18, 'x');            // snowy ground
  gborder(g, 'Q');                              // snow-pines around the edge
  const lab = building(g, 3, 2, 'green');        // Professor Aspen's lab
  const home = building(g, 12, 2, 'red');        // player's home
  const h1 = building(g, 3, 9, 'blue');          // neighbor house
  // central path
  for (let y = 6; y <= 17; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  gput(g, 8, 7, 's'); gput(g, 7, 12, 'F'); gput(g, 13, 12, 'F');
  gput(g, 9, 16, '.'); gput(g, 10, 16, '.'); gput(g, 9, 17, '.'); gput(g, 10, 17, '.');

  defineMap({
    id: 'frosthollow', name: 'Frosthollow Village', music: 'town', battleEnv: 'snow',
    legend: LEG, ground: gRows(g),
    warps: [
      { x: lab.doorX, y: lab.doorY, to: 'aspen_lab', tx: 5, ty: 7, dir: 'up' },
      { x: home.doorX, y: home.doorY, to: 'player_room', tx: 3, ty: 4, dir: 'up' },
      { x: h1.doorX, y: h1.doorY, to: 'frost_house1', tx: 3, ty: 3, dir: 'up' },
      { x: 9, y: 17, to: 'route1', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 17, to: 'route1', tx: 10, ty: 1, dir: 'down', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'FROSTHOLLOW VILLAGE — "Where the aurora touches the snow."' }],
    npcs: [
      { x: 14, y: 8, sprite: 'npc_woman', move: 'look', script: 'fh_villager1' },
      { x: 7, y: 14, sprite: 'npc_villager', move: 'wander', script: 'fh_villager2' },
      { x: 13, y: 14, sprite: 'npc_oldman', move: 'static', dir: 'down', script: 'fh_oldman' },
      { x: 6, y: 6, sprite: 'npc_villager', move: 'wander', script: 'fh_kid' },
    ],
    onEnter() { Overworld.showBanner(); },
    _doors: { lab, home, h1 },
  });
})();

// ============================================================ Route 1
defineMap({
  id: 'route1', name: 'Route 1', music: 'route', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTTT..TTTTTTTTT',
    'Txxxxxxxx..xxxxxxxxT',
    'Txx,,,xxx..xxx,,,xxT',
    'Txx,,,xxx..xxx,,,xxT',
    'Txxxxxxs..s.xxxxxxxT',
    'TxxxFxxx..P.xxFxxxxT',
    'Txxxxxxx..xx.xxxxxxT',
    'Txx,,,,.,,,,.xx,,,xT',
    'Txx,,,,.,,,,.xx,,,xT',
    'TxxxxxL.LxxL.LxxxxxT',
    'Txxxxxx..xx..xxxxxxT',
    'Txx,,,xx..P.xx,,,xxT',
    'Txx,,,xx....xx,,,xxT',
    'Txxxxxxx....xxxxxxxT',
    'Txxxxxxxx..xxxxxxxxT',
    'TTTTTTTTT..TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 0, to: 'frosthollow', tx: 9, ty: 16, dir: 'up', always: true },
    { x: 10, y: 0, to: 'frosthollow', tx: 10, ty: 16, dir: 'up', always: true },
    { x: 9, y: 15, to: 'birchwick', tx: 9, ty: 1, dir: 'down', always: true },
    { x: 10, y: 15, to: 'birchwick', tx: 10, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 6, y: 4, text: 'ROUTE 1. Tall grass ahead — wild fakemon live there!' },
    { x: 9, y: 4, text: 'Catch a partner to explore the tall grass safely.' },
  ],
  items: [
    { x: 3, y: 2, item: 'potion', flag: 'r1_potion' },
    { x: 16, y: 12, item: 'fieldorb', count: 3, flag: 'r1_orbs' },
  ],
  npcs: [
    { x: 5, y: 7, sprite: 'npc_ranger', dir: 'right', trainer: 'youngster_finn', sight: 3, script: 'trainer_after' },
    { x: 14, y: 12, sprite: 'npc_villager', move: 'wander', script: 'r1_catcher' },
  ],
  encounters: { rate: 14, grass: [
    { key: 'sprigfawn', min: 3, max: 5, weight: 3 }, { key: 'puffinch', min: 3, max: 5, weight: 3 },
    { key: 'nibbit', min: 2, max: 4, weight: 3 }, { key: 'larvel', min: 2, max: 4, weight: 2 },
    { key: 'sparkit', min: 4, max: 5, weight: 1 },
  ] },
  onEnter() { Overworld.showBanner(); },
});

// ============================================================ Birchwick Town
(() => {
  const g = blankGrid(20, 16, ' ');
  gborder(g, 'T');
  const house = building(g, 3, 2, 'red');
  const center = building(g, 13, 2, 'blue', 'C');
  const gym = building(g, 3, 10, 'purple');
  const mart = building(g, 13, 9, 'red', 'M');
  // paths
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  gput(g, 8, 7, 's'); gput(g, 6, 12, 'G'); gput(g, 7, 12, 'G');
  gput(g, 5, 5, 'F'); gput(g, 15, 13, 'F');

  defineMap({
    id: 'birchwick', name: 'Birchwick Town', music: 'town', battleEnv: 'grass',
    legend: LEG, ground: gRows(g),
    warps: [
      { x: house.doorX, y: house.doorY, to: 'birchwick_house', tx: 3, ty: 3, dir: 'up' },
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'birchwick_gym', tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 0, to: 'route1', tx: 9, ty: 14, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route1', tx: 10, ty: 14, dir: 'up', always: true },
      { x: 9, y: 15, to: 'route2', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route2', tx: 10, ty: 1, dir: 'down', always: true },
    ],
    signs: [
      { x: 8, y: 7, text: 'BIRCHWICK TOWN — "The lumber town where journeys begin."' },
    ],
    npcs: [
      { x: 13, y: 6, sprite: 'npc_villager', move: 'wander', script: 'bw_villager1' },
      { x: 6, y: 13, sprite: 'npc_woman', move: 'wander', script: 'bw_villager2' },
      { x: 16, y: 6, sprite: 'npc_hiker', move: 'look', script: 'bw_hiker' },
      { x: 2, y: 5, sprite: 'npc_oldman', dir: 'right', move: 'static', script: 'bw_oldman' },
      { x: 11, y: 12, sprite: 'npc_villager', move: 'wander', script: 'bw_kid' },
    ],
    onEnter() { Overworld.showBanner(); },
    _doors: { house, center, gym, mart },
  });
})();

// ============================================================ Route 2
defineMap({
  id: 'route2', name: 'Route 2', music: 'route', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTTT..TTTTTTTTT',
    'Txxxxxxxx..xxxxxxxxT',
    'Txx,,,xxx..xx,,,,,xT',
    'Txx,,,xxx..xx,,,,,xT',
    'TxxxxHxxx..xxxxxxxxT',
    'Txx....s..s.....xxxT',
    'Txx.xxx...xx.xx.xxxT',
    'Txx.xx,,,,xx.xx.xxxT',
    'Txx.xx,,,,xx.xx.xxxT',
    'Txx.......s.....xxxT',
    'Txxxxxxxx..xxxWWWWxT',
    'Txx,,,xxx..xxxWWWWxT',
    'Txx,,,xxx..xxxWWWWxT',
    'TxxxxxxLx..xLxxxxxxT',
    'Txxxxxxxx..xxxxxxxxT',
    'TTTTTTTTT..TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 0, to: 'birchwick', tx: 9, ty: 14, dir: 'up', always: true },
    { x: 10, y: 0, to: 'birchwick', tx: 10, ty: 14, dir: 'up', always: true },
    { x: 9, y: 15, to: 'mossmere', tx: 9, ty: 1, dir: 'down', always: true },
    { x: 10, y: 15, to: 'mossmere', tx: 10, ty: 1, dir: 'down', always: true },
    { x: 3, y: 6, to: 'whisperwood_cave', tx: 1, ty: 1, dir: 'up' },
  ],
  signs: [
    { x: 6, y: 5, text: 'ROUTE 2 — MOSSMERE TOWN to the south.' },
    { x: 9, y: 5, text: 'A cuttable bush blocks a shortcut. You need CUT.' },
    { x: 9, y: 9, text: 'Deep water to the east. SURF would cross it.' },
  ],
  items: [
    { x: 15, y: 4, item: 'super_potion', flag: 'r2_spotion' },
    { x: 3, y: 8, item: 'ember_stone', flag: 'r2_stone' },
  ],
  npcs: [
    { x: 12, y: 7, sprite: 'npc_hiker', dir: 'left', trainer: 'hiker_greta', sight: 3, script: 'trainer_after' },
    { x: 5, y: 12, sprite: 'npc_fisher', dir: 'down', trainer: 'fisher_odd', sight: 2, script: 'trainer_after' },
    { x: 14, y: 8, sprite: 'npc_villager', move: 'wander', script: 'r2_hint' },
  ],
  encounters: { rate: 16, grass: [
    { key: 'mossbuck', min: 8, max: 11, weight: 2 }, { key: 'pineling', min: 7, max: 10, weight: 3 },
    { key: 'galewing', min: 8, max: 10, weight: 2 }, { key: 'sporeling', min: 7, max: 9, weight: 2 },
    { key: 'scrappup', min: 8, max: 10, weight: 2 }, { key: 'cairnling', min: 7, max: 9, weight: 1 },
  ] },
  onEnter() { Overworld.showBanner(); },
});

// ============================================================ Mossmere Town (Gym 2)
(() => {
  const g = blankGrid(20, 16, ' ');
  gborder(g, 'T');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 14, 9, 'purple');       // right side, clear of the N-S path
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }   // full N-S corridor
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  // mossy wetland flavor
  for (const [x, y] of [[3, 12], [4, 13], [6, 5], [13, 13], [16, 13], [5, 11]]) gput(g, x, y, 'F');
  gput(g, 3, 11, 'W'); gput(g, 4, 11, 'W');
  gput(g, 8, 7, 's');

  defineMap({
    id: 'mossmere', name: 'Mossmere Town', music: 'town', battleEnv: 'grass',
    legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'mossmere_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 0, to: 'route2', tx: 9, ty: 14, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route2', tx: 10, ty: 14, dir: 'up', always: true },
      { x: 9, y: 15, to: 'route3', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route3', tx: 10, ty: 1, dir: 'down', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'MOSSMERE TOWN — "The forest remembers every footstep." (Harbor to the south)' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_woman', move: 'wander', script: 'mm_villager1' },
      { x: 12, y: 8, sprite: 'npc_villager', move: 'wander', script: 'mm_villager2' },
      { x: 11, y: 13, sprite: 'npc_ranger', move: 'look', script: 'mm_ranger' },
      { x: 4, y: 6, sprite: 'npc_oldman', move: 'static', dir: 'down', script: 'mm_oldman' },
    ],
    onEnter() { Overworld.showBanner(); },
    _doors: { center, mart, gym },
  });
})();

// ============================================================ Route 3 (coast)
defineMap({
  id: 'route3', name: 'Route 3', music: 'route', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTTT..TTTTTTTTT',
    'Txxxxxxxx..xxxxxxxxT',
    'Txx,,,xxx..xxx,,,xxT',
    'Txx,,,xxx..xxx,,,xxT',
    'Txxxxxxx....xxxxxxxT',
    'Txx....s..s....xxxxT',
    'TxxxxWWWWWWWWxxxxxxT',
    'TxxxxWWWWWWWWxx,,,xT',
    'Txx..xWWWWWWxx.,,,xT',
    'Txx.......s....xxxxT',
    'Txx,,,xxx..xxxxxxxxT',
    'Txx,,,xxx..xxx,,,xxT',
    'TxxxxHxxx..xxx,,,xxT',
    'TxxxxxxLx..xLxxxxxxT',
    'Txxxxxxxx..xxxxxxxxT',
    'TTTTTTTTT..TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 0, to: 'mossmere', tx: 9, ty: 14, dir: 'up', always: true },
    { x: 10, y: 0, to: 'mossmere', tx: 10, ty: 14, dir: 'up', always: true },
    { x: 9, y: 15, to: 'tidesend', tx: 9, ty: 1, dir: 'down', always: true },
    { x: 10, y: 15, to: 'tidesend', tx: 10, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 6, y: 5, text: 'ROUTE 3 — TIDESEND HARBOR to the south.' },
    { x: 9, y: 5, text: 'A wide inlet. With SURF you could cross and fish the deeps.' },
  ],
  items: [{ x: 16, y: 8, item: 'greatorb', count: 2, flag: 'r3_orbs' }],
  npcs: [
    { x: 13, y: 11, sprite: 'npc_sailor', dir: 'left', trainer: 'sailor_bram', sight: 3, script: 'trainer_after' },
    { x: 4, y: 12, sprite: 'npc_villager', move: 'wander', script: 'r3_hint' },
  ],
  encounters: { rate: 16, grass: [
    { key: 'puffle', min: 12, max: 15, weight: 2 }, { key: 'nokkolt', min: 12, max: 14, weight: 2 },
    { key: 'corvusk', min: 12, max: 15, weight: 2 }, { key: 'glimmouse', min: 11, max: 14, weight: 2 },
    { key: 'zapkid', min: 12, max: 14, weight: 2 },
  ] },
  onEnter() { Overworld.showBanner(); },
});

// ============================================================ Tidesend Harbor (Gym 3)
(() => {
  const g = blankGrid(20, 16, '_');               // sandy harbor ground
  gborder(g, 'T');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 3, 9, 'purple');
  for (let y = 1; y <= 8; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  // the harbor water + docks (south half)
  for (let y = 10; y <= 14; y++) for (let x = 8; x <= 17; x++) gput(g, x, y, 'W');
  for (let y = 9; y <= 12; y++) gput(g, 11, y, '.');   // a wooden dock jutting out
  gput(g, 8, 7, 's');

  defineMap({
    id: 'tidesend', name: 'Tidesend Harbor', music: 'town', battleEnv: 'water',
    legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'tidesend_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 0, to: 'route3', tx: 9, ty: 14, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route3', tx: 10, ty: 14, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'TIDESEND HARBOR — "Every tide brings a new story in." Gym Leader: RUNA (Water).' }],
    npcs: [
      { x: 6, y: 5, sprite: 'npc_sailor', move: 'wander', script: 'ts_sailor' },
      { x: 13, y: 5, sprite: 'npc_fisher', dir: 'down', move: 'static', script: 'ts_fisher' },
      { x: 5, y: 6, sprite: 'npc_woman', move: 'wander', script: 'ts_villager' },
    ],
    onEnter() { Overworld.showBanner(); },
    _doors: { center, mart, gym },
  });
})();
