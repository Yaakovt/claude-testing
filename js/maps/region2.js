'use strict';
/**
 * Late-game region: Emberfall → Lumenveil → Irondeep → Frostmoor (gym-less
 * village) → Glacierholm → Stormcrest, the Sky Spire climax (Team Ionar +
 * Auroryx), and the Aurora Plateau (Elite Four + Champion).
 *
 * Uses the shared helpers from world.js (LEG, building, blankGrid, gput, gRows,
 * gborder) and interiors.js (ILEG, back).
 */

/** Standard gym interior: leader at top, two trainees, exit at bottom. */
function gymInterior(id, name, leaderScript, helper) {
  defineMap({
    id, name, music: 'town', battleEnv: 'interior', indoor: true, legend: ILEG,
    ground: [
      'wwwwwwwwwww', 'w    r    w', 'w  r r r  w', 'w r r r r w',
      'w  r r r  w', 'w   r r   w', 'w    r    w', 'w    r    w',
      'w    d    w', 'wwwwwdwwwww',
    ],
    warps: [back(5, 8)],
    npcs: [
      { x: 5, y: 2, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: leaderScript },
      { x: 2, y: 5, sprite: 'npc_villager', dir: 'right', trainer: helper, sight: 2, script: 'trainer_after' },
      { x: 8, y: 5, sprite: 'npc_villager', dir: 'left', trainer: helper, sight: 2, script: 'trainer_after' },
    ],
    signs: [{ x: 6, y: 7, text: name }],
  });
}

/** A simple vertical route with tall-grass patches and an encounter table. */
function vRoute(id, name, env, northTo, northTx, southTo, southTx, enc, music, npcs) {
  const g = blankGrid(20, 12, env === 'snow' ? 'x' : env === 'cave' ? ' ' : 'x');
  gborder(g, env === 'cave' ? 'w' : env === 'volcano' ? 'R' : 'T');
  for (let y = 0; y <= 11; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  const gr = env === 'snow' ? 'z' : ',';
  for (const [x, y] of [[3, 3], [4, 3], [3, 4], [15, 7], [16, 7], [15, 8], [5, 8], [14, 3]]) gput(g, x, y, gr);
  defineMap({
    id, name, music: music || 'route', battleEnv: env, legend: LEG, ground: gRows(g),
    warps: [
      { x: 9, y: 0, to: northTo, tx: northTx, ty: northTo.startsWith('route') ? 10 : 14, dir: 'up', always: true },
      { x: 10, y: 0, to: northTo, tx: northTx + 1, ty: northTo.startsWith('route') ? 10 : 14, dir: 'up', always: true },
      { x: 9, y: 11, to: southTo, tx: southTx, ty: southTo.startsWith('route') ? 1 : 1, dir: 'down', always: true },
      { x: 10, y: 11, to: southTo, tx: southTx + 1, ty: 1, dir: 'down', always: true },
    ],
    encounters: enc ? { rate: 16, grass: enc } : null,
    npcs: npcs || [],
    onEnter() { Overworld.showBanner(); },
  });
}

/** Two route trainers flanking the path (sprite varies for flavor). */
function rtn(t1, t2, s1, s2) {
  return [
    { x: 6, y: 4, sprite: s1 || 'npc_hiker', dir: 'right', trainer: t1, sight: 3, script: 'trainer_after' },
    { x: 13, y: 8, sprite: s2 || 'npc_villager', dir: 'left', trainer: t2, sight: 3, script: 'trainer_after' },
  ];
}

// ============================================================ Route 4 (E-W, coast→springs)
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'T');
  for (let x = 0; x <= 19; x++) gput(g, x, 7, '.');
  for (let x = 0; x <= 19; x++) gput(g, x, 8, '.');
  for (const [x, y] of [[4, 4], [5, 4], [4, 5], [14, 10], [15, 10], [6, 11], [13, 4]]) gput(g, x, y, ',');
  for (let y = 9; y <= 11; y++) { gput(g, 8, y, 'x'); }
  defineMap({
    id: 'route4', name: 'Route 4', music: 'route', battleEnv: 'grass', legend: LEG, ground: gRows(g),
    warps: [
      { x: 0, y: 7, to: 'tidesend', tx: 18, ty: 7, dir: 'left', always: true },
      { x: 0, y: 8, to: 'tidesend', tx: 18, ty: 7, dir: 'left', always: true },
      { x: 19, y: 7, to: 'emberfall', tx: 1, ty: 7, dir: 'right', always: true },
      { x: 19, y: 8, to: 'emberfall', tx: 1, ty: 8, dir: 'right', always: true },
    ],
    signs: [{ x: 5, y: 6, text: 'ROUTE 4 — EMBERFALL CITY east, past the hot springs.' }],
    items: [{ x: 15, y: 4, item: 'good_rod', flag: 'r4_goodrod' }],
    npcs: [
      { x: 11, y: 10, sprite: 'npc_hiker', dir: 'up', trainer: 'r4_hiker', sight: 2, script: 'trainer_after' },
      { x: 4, y: 5, sprite: 'npc_fisher', dir: 'down', trainer: 'r4_fisher', sight: 2, script: 'trainer_after' },
      { x: 13, y: 4, sprite: 'npc_woman', move: 'wander', script: 'r4_hint' },
    ],
    encounters: { rate: 16, grass: [
      { key: 'zapkid', min: 16, max: 19, weight: 2 }, { key: 'scrappup', min: 16, max: 18, weight: 2 },
      { key: 'ramlet', min: 16, max: 18, weight: 2 }, { key: 'echomite', min: 15, max: 18, weight: 2 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// ============================================================ Emberfall City (G4 Fire)
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'T');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 14, 9, 'purple');
  for (let x = 1; x <= 18; x++) { gput(g, x, 7, '.'); gput(g, x, 8, '.'); }
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (const [x, y] of [[4, 11], [5, 11], [4, 12], [6, 5]]) gput(g, x, y, 'W'); // hot springs
  gput(g, 8, 7, 's');
  defineMap({
    id: 'emberfall', name: 'Emberfall City', music: 'town', battleEnv: 'volcano', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'emberfall_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 1, y: 7, to: 'route4', tx: 18, ty: 7, dir: 'left', always: true },
      { x: 1, y: 8, to: 'route4', tx: 18, ty: 8, dir: 'left', always: true },
      { x: 9, y: 0, to: 'route5', tx: 9, ty: 10, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route5', tx: 10, ty: 10, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'EMBERFALL CITY — "Where the earth keeps its hearth warm." Leader: BRANDT (Fire).' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_villager', move: 'wander', script: 'ef_villager1' },
      { x: 12, y: 12, sprite: 'npc_woman', move: 'wander', script: 'ef_villager2' },
      { x: 4, y: 5, sprite: 'npc_hiker', dir: 'down', move: 'static', script: 'ef_hiker' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
  gymInterior('emberfall_gym', 'EMBERFALL GYM — BRANDT (Fire)', 'gym_brandt', 'trainee_mid');
})();

// ============================================================ Route 5 + Lumenveil (G5 Psychic)
vRoute('route5', 'Route 5', 'grass', 'lumenveil', 9, 'emberfall', 9, [
  { key: 'wispurr', min: 19, max: 22, weight: 3 }, { key: 'corvusk', min: 19, max: 22, weight: 2 },
  { key: 'chimebud', min: 19, max: 21, weight: 2 }, { key: 'glimmouse', min: 18, max: 21, weight: 2 },
], 'route', rtn('r5_psychic', 'r5_aroma', 'npc_villager', 'npc_woman'));
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'T');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 3, 9, 'purple');
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  for (const [x, y] of [[6, 5], [13, 12], [15, 11], [16, 13]]) gput(g, x, y, 'F');
  gput(g, 8, 7, 's');
  defineMap({
    id: 'lumenveil', name: 'Lumenveil City', music: 'town', battleEnv: 'aurora', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'lumenveil_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 15, to: 'route5', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route5', tx: 10, ty: 1, dir: 'down', always: true },
      { x: 9, y: 0, to: 'route6', tx: 9, ty: 10, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route6', tx: 10, ty: 10, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'LUMENVEIL CITY — "Closest city to the aurora." Leader: SYLJA (Psychic). Team Ionar seized the observatory here...' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_woman', move: 'wander', script: 'lv_villager1' },
      { x: 13, y: 8, sprite: 'npc_oldman', move: 'static', dir: 'down', script: 'lv_villager2' },
      { x: 11, y: 12, sprite: 'ionar_grunt', dir: 'down', move: 'wander', script: 'lv_grunt' },
      { x: 13, y: 5, sprite: 'rival_f', dir: 'down', move: 'static', script: 'rival_mid' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
  gymInterior('lumenveil_gym', 'LUMENVEIL GYM — SYLJA (Psychic)', 'gym_sylja', 'trainee_high');
})();

// ============================================================ Route 6 + Irondeep (G6 Steel)
vRoute('route6', 'Route 6', 'cave', 'irondeep', 9, 'lumenveil', 9, [
  { key: 'oreling', min: 22, max: 25, weight: 3 }, { key: 'shardling', min: 22, max: 24, weight: 2 },
  { key: 'echomite', min: 21, max: 24, weight: 2 }, { key: 'wickwisp', min: 22, max: 24, weight: 1 },
], 'cave', rtn('r6_miner', 'r6_hiker', 'npc_hiker', 'npc_villager'));
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'R');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 14, 9, 'purple');
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  for (const [x, y] of [[4, 11], [5, 12], [6, 5]]) gput(g, x, y, 'B');
  gput(g, 8, 7, 's');
  defineMap({
    id: 'irondeep', name: 'Irondeep City', music: 'town', battleEnv: 'cave', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'irondeep_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 15, to: 'route6', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route6', tx: 10, ty: 1, dir: 'down', always: true },
      { x: 9, y: 0, to: 'route7', tx: 9, ty: 10, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route7', tx: 10, ty: 10, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'IRONDEEP CITY — "Forged in the roots of the mountains." Leader: TORVALD (Steel).' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_hiker', move: 'wander', script: 'id_villager1' },
      { x: 13, y: 12, sprite: 'npc_villager', move: 'wander', script: 'id_villager2' },
      { x: 5, y: 5, sprite: 'npc_hiker', dir: 'down', move: 'static', script: 'fossil_choice' },
      { x: 13, y: 5, sprite: 'prof', dir: 'down', move: 'static', script: 'fossil_reviver' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
  gymInterior('irondeep_gym', 'IRONDEEP GYM — TORVALD (Steel)', 'gym_torvald', 'trainee_high');
})();

// ============================================================ Route 7 + Frostmoor (gym-less village)
vRoute('route7', 'Route 7', 'snow', 'frostmoor', 9, 'irondeep', 9, [
  { key: 'frostkit', min: 25, max: 28, weight: 3 }, { key: 'zapkid', min: 25, max: 27, weight: 2 },
  { key: 'corvusk', min: 24, max: 27, weight: 2 }, { key: 'yetiling', min: 26, max: 28, weight: 1 },
], 'route', rtn('r7_skier', 'r7_veteran', 'npc_woman', 'npc_oldman'));
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'Q');
  const center = building(g, 3, 2, 'blue', 'C');
  const h1 = building(g, 13, 2, 'red');
  const h2 = building(g, 13, 9, 'red');
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  for (const [x, y] of [[4, 11], [5, 12], [6, 5]]) gput(g, x, y, 'z');
  gput(g, 8, 7, 's');
  defineMap({
    id: 'frostmoor', name: 'Frostmoor Village', music: 'town', battleEnv: 'snow', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: h1.doorX, y: h1.doorY, to: 'frost_house1', tx: 3, ty: 3, dir: 'up' },
      { x: h2.doorX, y: h2.doorY, to: 'birchwick_house', tx: 3, ty: 3, dir: 'up' },
      { x: 9, y: 15, to: 'route7', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route7', tx: 10, ty: 1, dir: 'down', always: true },
      { x: 9, y: 0, to: 'route8', tx: 9, ty: 10, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route8', tx: 10, ty: 10, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'FROSTMOOR VILLAGE — "A warm hearth on a cold road." (No gym — just rest and supplies.)' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_oldman', move: 'static', dir: 'down', script: 'fm_villager1' },
      { x: 13, y: 13, sprite: 'npc_woman', move: 'wander', script: 'fm_villager2' },
      { x: 11, y: 6, sprite: 'npc_villager', move: 'wander', script: 'fm_villager3' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
})();

// ============================================================ Route 8 + Glacierholm (G7 Ice)
vRoute('route8', 'Route 8', 'snow', 'glacierholm', 9, 'frostmoor', 9, [
  { key: 'frostkit', min: 28, max: 31, weight: 2 }, { key: 'yetiling', min: 28, max: 30, weight: 2 },
  { key: 'shiverfin', min: 28, max: 30, weight: 1 }, { key: 'glacierling', min: 29, max: 31, weight: 1 },
], 'route', rtn('r8_snowboarder', 'r8_blackbelt', 'npc_villager', 'npc_hiker'));
(() => {
  const g = blankGrid(20, 16, 'x'); gborder(g, 'Q');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 3, 9, 'purple');
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 17; x++) gput(g, x, 7, '.');
  for (const [x, y] of [[13, 11], [14, 12], [15, 11]]) gput(g, x, y, 'i');
  gput(g, 8, 7, 's');
  defineMap({
    id: 'glacierholm', name: 'Glacierholm', music: 'town', battleEnv: 'snow', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'glacierholm_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 15, to: 'route8', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route8', tx: 10, ty: 1, dir: 'down', always: true },
      { x: 9, y: 0, to: 'route9', tx: 9, ty: 10, dir: 'up', always: true },
      { x: 10, y: 0, to: 'route9', tx: 10, ty: 10, dir: 'up', always: true },
    ],
    signs: [{ x: 8, y: 7, text: 'GLACIERHOLM — "Built on ice that never melts." Leader: YRSA (Ice).' }],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_villager', move: 'wander', script: 'gh_villager1' },
      { x: 13, y: 8, sprite: 'npc_woman', move: 'wander', script: 'gh_villager2' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
  gymInterior('glacierholm_gym', 'GLACIERHOLM GYM — YRSA (Ice)', 'gym_yrsa', 'trainee_high');
})();

// ============================================================ Route 9 + Stormcrest (G8 Dragon)
vRoute('route9', 'Route 9', 'aurora', 'stormcrest', 9, 'glacierholm', 9, [
  { key: 'skimmerling', min: 31, max: 34, weight: 2 }, { key: 'grimcorvid', min: 31, max: 33, weight: 2 },
  { key: 'nokkolt', min: 31, max: 33, weight: 2 }, { key: 'frystdrake', min: 32, max: 34, weight: 1 },
], 'route', rtn('r9_dragontamer', 'r9_ace', 'npc_hiker', 'npc_woman'));
(() => {
  const g = blankGrid(20, 16, ' '); gborder(g, 'R');
  const center = building(g, 2, 2, 'blue', 'C');
  const mart = building(g, 14, 2, 'red', 'M');
  const gym = building(g, 14, 9, 'purple');
  for (let y = 1; y <= 14; y++) { gput(g, 9, y, '.'); gput(g, 10, y, '.'); }
  for (let x = 2; x <= 19; x++) gput(g, x, 7, '.');   // horizontal path to the east gate
  gput(g, 8, 7, 's');
  defineMap({
    id: 'stormcrest', name: 'Stormcrest City', music: 'town', battleEnv: 'aurora', legend: LEG, ground: gRows(g),
    warps: [
      { x: center.doorX, y: center.doorY, to: 'center', tx: 5, ty: 5, dir: 'up' },
      { x: mart.doorX, y: mart.doorY, to: 'mart', tx: 4, ty: 4, dir: 'up' },
      { x: gym.doorX, y: gym.doorY, to: 'stormcrest_gym', tx: 5, ty: 8, dir: 'up' },
      { x: 9, y: 0, to: 'sky_spire', tx: 8, ty: 14, dir: 'up', always: true },
      { x: 10, y: 0, to: 'sky_spire', tx: 8, ty: 14, dir: 'up', always: true },
      { x: 9, y: 15, to: 'route9', tx: 9, ty: 1, dir: 'down', always: true },
      { x: 10, y: 15, to: 'route9', tx: 10, ty: 1, dir: 'down', always: true },
      { x: 19, y: 7, to: 'victory_road', tx: 2, ty: 14, dir: 'right', always: true },
    ],
    signs: [
      { x: 8, y: 7, text: 'STORMCREST CITY — "At the foot of the Sky Spire." Leader: SIGNE (Dragon). Spire north, VICTORY ROAD east to the League.' },
    ],
    npcs: [
      { x: 6, y: 6, sprite: 'npc_woman', move: 'wander', script: 'sc_villager1' },
      { x: 12, y: 12, sprite: 'npc_hiker', move: 'wander', script: 'sc_villager2' },
      { x: 5, y: 3, sprite: 'ionar_grunt', dir: 'down', move: 'static', script: 'sc_grunt' },
      { x: 13, y: 5, sprite: 'prof', dir: 'down', move: 'static', script: 'rift_gift' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
  gymInterior('stormcrest_gym', 'STORMCREST GYM — SIGNE (Dragon)', 'gym_signe', 'trainee_high');
})();

// ============================================================ Sky Spire (Team Ionar climax + Auroryx)
(() => {
  const g = blankGrid(17, 16, ' '); gborder(g, 'R');
  for (let y = 1; y <= 14; y++) { gput(g, 8, y, '.'); }
  for (let x = 3; x <= 13; x++) { gput(g, x, 3, '.'); gput(g, x, 8, '.'); }
  gput(g, 8, 1, 'F'); // the summit altar (aurora)
  defineMap({
    id: 'sky_spire', name: 'Sky Spire', music: 'cave', battleEnv: 'aurora', indoor: true, legend: LEG, ground: gRows(g),
    warps: [{ x: 8, y: 15, to: 'stormcrest', tx: 9, ty: 1, dir: 'down', always: true }],
    signs: [{ x: 8, y: 1, script: 'summit_umbryx', text: 'The Sky Spire summit altar.' }],
    npcs: [
      { x: 8, y: 8, sprite: 'ionar_grunt', dir: 'down', trainer: 'ionar_grunt1', sight: 3, script: 'trainer_after' },
      { x: 6, y: 3, sprite: 'ionar_grunt', dir: 'right', trainer: 'ionar_grunt2', sight: 2, script: 'trainer_after' },
      { x: 8, y: 2, sprite: 'ionar_boss', dir: 'down', move: 'static', passable: false, script: 'spire_boss' },
    ],
    onEnter() { Overworld.showBanner(); if (!Game.flags.spireIntro) { Game.flags.spireIntro = true; Textbox.say('A storm-grey figure stands at the summit altar, the aurora writhing above him...'); } },
  });
})();

// ============================================================ Tempest Isle (optional, Surf)
(() => {
  const g = blankGrid(18, 14, 'W'); // ringed by sea
  // sandy shore + grassy interior
  for (let y = 3; y <= 10; y++) for (let x = 4; x <= 13; x++) gput(g, x, y, '_');
  for (let y = 4; y <= 9; y++) for (let x = 6; x <= 11; x++) gput(g, x, y, ',');
  for (const [x, y] of [[5, 3], [12, 3], [5, 10], [12, 10]]) gput(g, x, y, 'P');
  gput(g, 8, 11, '_'); gput(g, 8, 12, '_'); gput(g, 8, 13, 'W');   // beach landing at the south
  gput(g, 9, 3, 's');
  defineMap({
    id: 'tempest_isle', name: 'Tempest Isle', music: 'surf', battleEnv: 'water', legend: LEG, ground: gRows(g),
    warps: [{ x: 8, y: 13, to: 'tidesend', tx: 14, ty: 12, dir: 'down', always: true }],
    signs: [{ x: 9, y: 3, text: 'TEMPEST ISLE — a windswept rock far off the harbor. Rare fakemon shelter here.' }],
    items: [{ x: 10, y: 5, item: 'rift_stone', flag: 'isle_rift' }, { x: 6, y: 8, item: 'ultraorb', count: 5, flag: 'isle_orbs' }],
    npcs: [
      { x: 9, y: 6, sprite: 'npc_sailor', dir: 'down', trainer: 'sailor_bram', sight: 2, script: 'trainer_after' },
    ],
    encounters: { rate: 20, grass: [
      { key: 'mantasurge', min: 25, max: 30, weight: 2 }, { key: 'volteel', min: 25, max: 30, weight: 2 },
      { key: 'aurorpix', min: 26, max: 30, weight: 1 }, { key: 'skimmerling', min: 24, max: 28, weight: 2 },
      { key: 'corvusk', min: 24, max: 28, weight: 2 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// ============================================================ Victory Road (2 areas)
const VLEG = { ' ': 'cavefloor', 'w': 'cavewall', 'R': 'rock', 'B': 'boulder', 'K': 'crackrock', 'c': 'crystal', 'd': 'stairs_down' };
(() => {
  const g = blankGrid(20, 16, ' '); gborder(g, 'w');
  for (const [x, y] of [[5, 3], [5, 4], [5, 5], [10, 6], [10, 7], [10, 8], [14, 3], [14, 4],
    [7, 10], [8, 10], [9, 10], [13, 11], [13, 12], [3, 8], [3, 9]]) gput(g, x, y, 'R');
  gput(g, 16, 6, 'c'); gput(g, 6, 12, 'c'); gput(g, 12, 4, 'B');
  gput(g, 17, 2, 'd');
  defineMap({
    id: 'victory_road', name: 'Victory Road', music: 'cave', battleEnv: 'cave', indoor: true, legend: VLEG, ground: gRows(g),
    warps: [
      { x: 2, y: 15, to: 'stormcrest', tx: 18, ty: 7, dir: 'down', always: true },
      { x: 17, y: 2, to: 'victory_road2', tx: 2, ty: 13, dir: 'up', always: true },
    ],
    signs: [{ x: 3, y: 13, text: 'VICTORY ROAD. Only the strongest reach the League beyond.' }],
    items: [{ x: 16, y: 12, item: 'max_revive', flag: 'vr_maxrevive' }, { x: 3, y: 3, item: 'ultraorb', count: 3, flag: 'vr_orbs' }],
    npcs: [
      { x: 8, y: 6, sprite: 'npc_hiker', dir: 'down', trainer: 'vr_ace1', sight: 3, script: 'trainer_after' },
      { x: 12, y: 9, sprite: 'npc_villager', dir: 'up', trainer: 'vr_ace2', sight: 3, script: 'trainer_after' },
    ],
    encounters: { rate: 14, grass: [
      { key: 'gulomaul', min: 40, max: 43, weight: 2 }, { key: 'prismarok', min: 40, max: 42, weight: 2 },
      { key: 'grimcorvid', min: 40, max: 43, weight: 2 }, { key: 'ingotaur', min: 41, max: 43, weight: 1 },
      { key: 'wyrmskim', min: 41, max: 44, weight: 1 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();
(() => {
  const g = blankGrid(20, 16, ' '); gborder(g, 'w');
  for (const [x, y] of [[6, 4], [6, 5], [11, 5], [11, 6], [11, 7], [4, 9], [5, 9], [14, 9], [14, 10], [8, 11], [9, 11]]) gput(g, x, y, 'R');
  gput(g, 15, 4, 'c'); gput(g, 4, 12, 'c');
  gput(g, 17, 2, 'd');
  defineMap({
    id: 'victory_road2', name: 'Victory Road', music: 'cave', battleEnv: 'cave', indoor: true, legend: VLEG, ground: gRows(g),
    warps: [
      { x: 2, y: 13, to: 'victory_road', tx: 17, ty: 3, dir: 'down', always: true },
      { x: 17, y: 2, to: 'aurora_plateau', tx: 8, ty: 15, dir: 'up', always: true },
    ],
    signs: [{ x: 16, y: 3, text: 'The exit to the AURORA PLATEAU. The League awaits.' }],
    items: [{ x: 4, y: 4, item: 'full_heal', flag: 'vr2_fullheal' }],
    npcs: [
      { x: 9, y: 7, sprite: 'npc_hiker', dir: 'down', trainer: 'vr_veteran', sight: 3, script: 'trainer_after' },
    ],
    encounters: { rate: 14, grass: [
      { key: 'ursnow', min: 42, max: 44, weight: 2 }, { key: 'boulderam', min: 42, max: 44, weight: 2 },
      { key: 'nokkmare', min: 42, max: 44, weight: 2 }, { key: 'jarnwyrm', min: 43, max: 45, weight: 1 },
    ] },
    onEnter() { Overworld.showBanner(); },
  });
})();

// ============================================================ Aurora Plateau (Elite Four + Champion)
(() => {
  const g = blankGrid(17, 18, '.'); gborder(g, 'w');
  // a long hall climbing north through the five challenges
  for (let x = 1; x <= 15; x++) for (let y = 1; y <= 16; y++) gput(g, x, y, y % 3 === 0 ? 'r' : '.');
  for (let x = 6; x <= 10; x++) for (let y = 1; y <= 16; y++) gput(g, x, y, '.');
  defineMap({
    id: 'aurora_plateau', name: 'Aurora Plateau', music: 'route', battleEnv: 'aurora', indoor: true, legend: ILEG,
    ground: gRows(g),
    warps: [{ x: 8, y: 16, to: 'victory_road2', tx: 17, ty: 3, dir: 'down', always: true }],
    signs: [{ x: 7, y: 16, text: 'AURORA PLATEAU. Beyond wait the Elite Four and the Champion. Only eight-badge trainers may pass.' }],
    npcs: [
      { x: 8, y: 14, sprite: 'rival_f', dir: 'down', move: 'static', passable: false, script: 'rival_final' },
      { x: 8, y: 12, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: 'e4_1' },
      { x: 8, y: 10, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: 'e4_2' },
      { x: 8, y: 7, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: 'e4_3' },
      { x: 8, y: 4, sprite: 'gym_leader', dir: 'down', move: 'static', passable: false, script: 'e4_4' },
      { x: 8, y: 2, sprite: 'champion', dir: 'down', move: 'static', passable: false, script: 'champion' },
    ],
    onEnter() { Overworld.showBanner(); },
  });
})();
