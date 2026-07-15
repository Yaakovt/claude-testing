'use strict';
/**
 * Overworld maps: towns and routes. Authored with a shared character legend.
 * Building roofs are drawn on the ground layer; doors are warp tiles.
 *
 * Legend chars (see LEG): grass, path, trees, water, buildings, etc.
 * Warps/signs/items/npcs are listed in each map's arrays.
 */
const LEG = {
  ' ': 'grass', ',': 'tallgrass', '.': 'path', '_': 'sand',
  'T': 'tree', 'P': 'pine', 'Q': 'snowpine', 'R': 'rock', 'B': 'boulder', 'K': 'crackrock',
  'W': 'water', '=': 'waterfall', 'f': 'fence', 'F': 'flowers', 'H': 'cutbush', 'L': 'ledge',
  'x': 'snow', 'z': 'tallsnow', 'i': 'ice', 'G': 'gym_statue',
  // building parts
  '1': 'roof_l', '2': 'roof_m', '3': 'roof_r',
  '4': 'roofb_l', '5': 'roofb_m', '6': 'roofb_r',
  '7': 'roofg_l', '8': 'roofg_m', '9': 'roofg_r',
  'a': 'roofp_l', 'b': 'roofp_m', 'c': 'roofp_r',
  'w': 'wall', 'o': 'window', 'd': 'door', 'm': 'mat',
  'C': 'center_sign', 'M': 'mart_sign', 's': 'sign',
};

// ---------------------------------------------------------------- Frosthollow
defineMap({
  id: 'frosthollow', name: 'Frosthollow Village', music: 'town', battleEnv: 'snow',
  legend: LEG,
  ground: [
    'QQQQQQQQQQQQQQQQQQQQ',
    'QxxxxxxxxxxxxxxxxxxQ',
    'Qxx777xxxxx111xxxxxQ',
    'Qxx888xxxxx222xxxxxQ',
    'Qxx8d8xxxxx2d2xxxxxQ',
    'QxxxmxxxxxxxmxxxxxxQ',
    'Qxxxxxxx...xxxxxxxxQ',
    'QxxFxxxx.s.xxxxFxxxQ',
    'Qxxxxxxx...xxxxxxxxQ',
    'Qxx444xx...xx111xxxQ',
    'Qxx555xx.C.xx222xxxQ',
    'Qxx5d5xx...xx2d2xxxQ',
    'Qxxxmxxx...xxxmxxxxQ',
    'Qxxxxxxx...xxxxxxxxQ',
    'Qxxzzxxx...xxxzzxxxQ',
    'Qxxzzxxx...xxxzzxxxQ',
    'QQQQQQQ.s.QQQQQQQQQQ',
    'QQQQQQQ...QQQQQQQQQQ',
  ],
  warps: [
    { x: 4, y: 4, to: 'aspen_lab', tx: 6, ty: 11, dir: 'up' },      // green roof = lab
    { x: 11, y: 4, to: 'player_room', tx: 3, ty: 6, dir: 'up' },     // red roof = your home
    { x: 4, y: 11, to: 'frost_house1', tx: 4, ty: 7, dir: 'up' },
    { x: 12, y: 11, to: 'player_room', tx: 3, ty: 6, dir: 'up' },
    { x: 8, y: 17, to: 'route1', tx: 10, ty: 1, dir: 'down', always: true },
    { x: 9, y: 17, to: 'route1', tx: 10, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 8, y: 7, text: 'FROSTHOLLOW VILLAGE — "Where the aurora touches the snow."' },
    { x: 8, y: 16, text: 'ROUTE 1 ahead — BIRCHWICK TOWN to the south.' },
  ],
  npcs: [
    { x: 14, y: 8, sprite: 'npc_woman', move: 'look', script: 'fh_villager1' },
    { x: 6, y: 14, sprite: 'npc_villager', move: 'wander', script: 'fh_villager2' },
    { x: 13, y: 13, sprite: 'npc_oldman', move: 'static', dir: 'down', script: 'fh_oldman' },
    { x: 3, y: 8, sprite: 'npc_villager', move: 'wander', script: 'fh_kid' },
  ],
  onEnter() { Overworld.showBanner(); },
});

// ---------------------------------------------------------------- Route 1
defineMap({
  id: 'route1', name: 'Route 1', music: 'route', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTTTTTTTTTTTTTT',
    'Txxxxxxxxx..xxxxxxxT',
    'Txx,,,xxxx..xxx,,,xT',
    'Txx,,,xxxx..xxx,,,xT',
    'Txxxxxxs..s..xxxxxxT',
    'TxxxFxx..P.P.xxFxxxT',
    'Txxxxxx..xx..xxxxxxT',
    'Txx,,,,.,,,,.xx,,,xT',
    'Txx,,,,.,,,,.xx,,,xT',
    'TxxxxxL.LxxL.LxxxxxT',
    'Txxxxxx..xx..xxxxxxT',
    'Txx,,,xx..P.xx,,,xxT',
    'Txx,,,xx....xx,,,xxT',
    'Txxxxxxx....xxxxxxxT',
    'Txxxxxxx....xxxxxxxT',
    'TTTTTTTx....xTTTTTTT',
  ],
  warps: [
    { x: 10, y: 0, to: 'frosthollow', tx: 8, ty: 16, dir: 'up', always: true },
    { x: 11, y: 0, to: 'frosthollow', tx: 9, ty: 16, dir: 'up', always: true },
    { x: 8, y: 15, to: 'birchwick', tx: 10, ty: 1, dir: 'down', always: true },
    { x: 9, y: 15, to: 'birchwick', tx: 10, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 6, y: 4, text: 'ROUTE 1. Tall grass ahead — wild fakemon live there!' },
    { x: 10, y: 4, text: 'Catch a partner to explore the tall grass safely.' },
  ],
  items: [
    { x: 3, y: 2, item: 'potion', flag: 'r1_potion' },
    { x: 16, y: 12, item: 'fieldorb', count: 3, flag: 'r1_orbs' },
  ],
  npcs: [
    { x: 5, y: 7, sprite: 'npc_ranger', dir: 'right', trainer: 'youngster_finn', sight: 3, script: 'trainer_after' },
    { x: 13, y: 12, sprite: 'npc_villager', move: 'wander', script: 'r1_catcher' },
  ],
  encounters: { rate: 14, grass: [
    { key: 'sprigfawn', min: 3, max: 5, weight: 3 },
    { key: 'puffinch', min: 3, max: 5, weight: 3 },
    { key: 'nibbit', min: 2, max: 4, weight: 3 },
    { key: 'larvel', min: 2, max: 4, weight: 2 },
    { key: 'sparkit', min: 4, max: 5, weight: 1 },
  ] },
  onEnter() { Overworld.showBanner(); },
});

// ---------------------------------------------------------------- Birchwick Town
defineMap({
  id: 'birchwick', name: 'Birchwick Town', music: 'town', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTTTTTTTTTTTTTT',
    'Txxxxxxxxx..xxxxxxxT',
    'Txx111xxxx..xxxCCxxT',
    'Txx222xxxx..xx444xxT',
    'Txx2d2xxFx..xx5d5xxT',
    'Txxxmxxxxx..xxxmxxxT',
    'Txxxxxxx....xxxxxxxT',
    'Tx........s.........T',
    'Tx.xxxxxxx..xxxMMx.xT',
    'Tx.xaaaxx..xxx888x.xT',
    'Tx.xabax..s..x888x..T',
    'Tx.xadaxxGGxxxxmxxx.T',
    'Tx.xxmxxxGGxxxxxxxx.T',
    'Tx.....xx..xx......xT',
    'TxxFxxxxx..xxxxFxxxxT',
    'TTTTTTTTx..xTTTTTTTT',
  ],
  warps: [
    { x: 4, y: 4, to: 'birchwick_house', tx: 4, ty: 7, dir: 'up' },
    { x: 15, y: 4, to: 'center', tx: 5, ty: 8, dir: 'up' },       // Pokecenter (C)
    { x: 15, y: 10, to: 'mart', tx: 4, ty: 8, dir: 'up' },         // Pokemart (M)
    { x: 5, y: 11, to: 'birchwick_gym', tx: 5, ty: 12, dir: 'up' }, // purple roof = gym
    { x: 10, y: 0, to: 'route1', tx: 8, ty: 14, dir: 'up', always: true },
    { x: 11, y: 0, to: 'route1', tx: 9, ty: 14, dir: 'up', always: true },
    { x: 8, y: 15, to: 'route2', tx: 8, ty: 1, dir: 'down', always: true },
    { x: 9, y: 15, to: 'route2', tx: 8, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 10, y: 7, text: 'BIRCHWICK TOWN — "The lumber town where journeys begin."' },
    { x: 10, y: 10, text: 'BIRCHWICK GYM — Leader ASTRID. The Normal-type wall!' },
  ],
  npcs: [
    { x: 13, y: 6, sprite: 'npc_villager', move: 'wander', script: 'bw_villager1' },
    { x: 6, y: 13, sprite: 'npc_woman', move: 'wander', script: 'bw_villager2' },
    { x: 16, y: 13, sprite: 'npc_hiker', move: 'look', script: 'bw_hiker' },
    { x: 3, y: 9, sprite: 'npc_oldman', dir: 'right', move: 'static', script: 'bw_oldman' },
    { x: 11, y: 13, sprite: 'npc_villager', move: 'wander', script: 'bw_kid' },
  ],
  onEnter() { Overworld.showBanner(); if (!Game.flags.tut_center) Game.flags.tut_center = true; },
});

// ---------------------------------------------------------------- Route 2 (stub -> gym2 area)
defineMap({
  id: 'route2', name: 'Route 2', music: 'route', battleEnv: 'grass',
  legend: LEG,
  ground: [
    'TTTTTTTx..xTTTTTTTTT',
    'Txxxxxxx..xxxxxxxxxT',
    'Txx,,,xx..xx,,,,,xxT',
    'Txx,,,xx..xx,,,,,xxT',
    'TxxxxHxx..xxxxxxxxxT',
    'Txx....s..s.....xxxT',
    'Txx.xx....xx.xx.xxxT',
    'Txx.xx,,,,xx.xx.xxxT',
    'Txx.xx,,,,xx.xx.xxxT',
    'Txx.......s.....xxxT',
    'Txxxxxxxx..xxxWWWWxT',
    'Txx,,,xxx..xxxWWWWxT',
    'Txx,,,xxx..xxxWWWWxT',
    'TxxxxxxLx..xLxxxxxxT',
    'Txxxxxxxx..xxxxxxxxT',
    'TTTTTTTTx..xTTTTTTTT',
  ],
  warps: [
    { x: 8, y: 0, to: 'birchwick', tx: 8, ty: 14, dir: 'up', always: true },
    { x: 9, y: 0, to: 'birchwick', tx: 9, ty: 14, dir: 'up', always: true },
    { x: 8, y: 15, to: 'mossmere', tx: 9, ty: 1, dir: 'down', always: true },
    { x: 9, y: 15, to: 'mossmere', tx: 10, ty: 1, dir: 'down', always: true },
  ],
  signs: [
    { x: 6, y: 5, text: 'ROUTE 2 — MOSSMERE TOWN to the south.' },
    { x: 9, y: 5, text: 'A cuttable bush blocks a shortcut. You\'ll need CUT.' },
    { x: 9, y: 9, text: 'Deep water to the east. SURF would cross it.' },
  ],
  items: [
    { x: 3, y: 6, item: 'super_potion', flag: 'r2_spotion' },
    { x: 15, y: 4, item: 'ember_stone', flag: 'r2_stone' },
  ],
  npcs: [
    { x: 12, y: 7, sprite: 'npc_hiker', dir: 'left', trainer: 'hiker_greta', sight: 3, script: 'trainer_after' },
    { x: 5, y: 12, sprite: 'npc_fisher', dir: 'down', trainer: 'fisher_odd', sight: 2, script: 'trainer_after' },
    { x: 14, y: 8, sprite: 'npc_villager', move: 'wander', script: 'r2_hint' },
  ],
  encounters: { rate: 16, grass: [
    { key: 'mossbuck', min: 8, max: 11, weight: 2 },
    { key: 'pineling', min: 7, max: 10, weight: 3 },
    { key: 'galewing', min: 8, max: 10, weight: 2 },
    { key: 'sporeling', min: 7, max: 9, weight: 2 },
    { key: 'scrappup', min: 8, max: 10, weight: 2 },
    { key: 'cairnling', min: 7, max: 9, weight: 1 },
  ] },
  onEnter() { Overworld.showBanner(); },
});
