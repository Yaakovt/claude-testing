'use strict';
/**
 * World expansion: four optional side-areas that branch off existing towns,
 * each a self-contained clearing with 7 hand-placed line-of-sight trainers,
 * a wild-encounter table, and item rewards at the far end. Adds real
 * exploration + ~28 battles between the main-line beats.
 *
 * Each area is a dead-end: enter from the host town's east edge, battle across
 * the clearing, grab the rewards, and return the way you came.
 */

// ---- new trainers (7 per area) ----
// Whispering Glade — a lush thicket east of Birchwick (~Lv 8-12)
RT('wg_bug1', 'Milo', 'Bug Catcher', 260, [{ key: 'larvel', level: 8 }, { key: 'larvel', level: 9 }], 'The thicket is crawling with bugs — my kind of place!', 'Aw, shucks.');
RT('wg_bug2', 'Petra', 'Bug Catcher', 280, [{ key: 'chrysalisk', level: 10 }], 'My cocoon-mon is almost ready to bloom!', 'So close!');
RT('wg_lass', 'Elin', 'Lass', 300, [{ key: 'pupperine', level: 9 }, { key: 'nibbit', level: 10 }], 'We picnic here every week. Care to battle first?', 'What a treat!');
RT('wg_camper', 'Ove', 'Camper', 320, [{ key: 'pineling', level: 10 }, { key: 'mossbuck', level: 11 }], 'You have to earn your way through my glade!', 'Fair enough.');
RT('wg_ranger', 'Sig', 'Ranger', 360, [{ key: 'sprigfawn', level: 10 }, { key: 'galewing', level: 11 }], 'I guard these woods. Show me your bond!', 'The woods approve.');
RT('wg_forager', 'Wilda', 'Aroma Lady', 340, [{ key: 'sporeling', level: 11 }, { key: 'mossbuck', level: 12 }], 'The glade\'s scent gives me strength!', 'A fragrant loss.');
RT('wg_twin', 'Bo & Bea', 'Twins', 380, [{ key: 'puffinch', level: 11 }, { key: 'nibbit', level: 11 }], 'Two against one — fair, right?', 'We share the loss!');

// Sunder Cliffs — a cracked rock shelf east of Emberfall (~Lv 20-25)
RT('sc_hiker1', 'Bergr', 'Hiker', 640, [{ key: 'oreling', level: 21 }, { key: 'cairnling', level: 22 }], 'These cliffs sundered in a quake long ago. Tough as they come!', 'Rock solid try.');
RT('sc_hiker2', 'Tord', 'Hiker', 660, [{ key: 'boulderam', level: 23 }], 'One boulder, one battle. Simple!', 'Crumbled.');
RT('sc_miner', 'Greta', 'Miner', 700, [{ key: 'shardling', level: 22 }, { key: 'oreling', level: 23 }], 'Struck ore AND a challenger today!', 'Back to digging.');
RT('sc_burglar', 'Rust', 'Firebreather', 720, [{ key: 'sulfimer', level: 23 }, { key: 'cindercrag', level: 24 }], 'The cliffs run hot with old magma. So do I!', 'Doused.');
RT('sc_blackbelt', 'Osk', 'Black Belt', 740, [{ key: 'ramlet', level: 24 }, { key: 'scrappup', level: 24 }], 'Train on stone, become stone!', 'A worthy strike.');
RT('sc_ace', 'Vidar', 'Ace Trainer', 880, [{ key: 'drillvole', level: 24 }, { key: 'geysmog', level: 25 }], 'Few climb this far. Prove you belong!', 'You belong.');
RT('sc_veteran', 'Old Sten', 'Veteran', 960, [{ key: 'boulderam', level: 25 }, { key: 'cindercrag', level: 26 }], 'I\'ve battled on this shelf for thirty years!', 'Youth prevails.');

// Mistmarsh — a sunken bog east of Lumenveil (~Lv 24-29)
RT('mm_fisher1', 'Sild', 'Fisher', 720, [{ key: 'mudlusk', level: 25 }, { key: 'minnowisp', level: 25 }], 'The bog hides big catches — and big battles!', 'Reeled in a loss.');
RT('mm_witch', 'Yrsa', 'Hex Maniac', 760, [{ key: 'wispurr', level: 26 }, { key: 'nokkolt', level: 26 }], 'The marsh whispers to those who listen...', 'The whispers fade.');
RT('mm_poison', 'Grimr', 'Poisoner', 780, [{ key: 'pollywisp', level: 26 }, { key: 'trolltoad', level: 27 }], 'One touch of the bog and you\'re done for!', 'Antidote, please...');
RT('mm_swimmer', 'Runa', 'Swimmer', 740, [{ key: 'jelluna', level: 27 }, { key: 'marshgil', level: 27 }], 'I know every murky channel here!', 'Out-swum.');
RT('mm_druid', 'Alf', 'Druid', 820, [{ key: 'marshgil', level: 27 }, { key: 'myceloom', level: 28 }], 'The marsh and I are one. Face us both!', 'The marsh yields.');
RT('mm_ace', 'Hedda', 'Ace Trainer', 900, [{ key: 'nokkmare', level: 28 }, { key: 'wispurr', level: 28 }], 'Lost in the fog? Good. That\'s my advantage!', 'The fog lifts.');
RT('mm_veteran', 'Bran', 'Veteran', 980, [{ key: 'trolltoad', level: 28 }, { key: 'jelluna', level: 29 }], 'The bog never gave me an easy day. Neither will I!', 'Well earned.');

// Frostfang Hollow — a snowbound ravine east of Glacierholm (~Lv 32-38)
RT('ff_skier1', 'Vetle', 'Skier', 900, [{ key: 'frostkit', level: 33 }, { key: 'glacierling', level: 33 }], 'Downhill and fast — can you keep up?', 'Wiped out!');
RT('ff_boarder', 'Silje', 'Snowboarder', 920, [{ key: 'yetiling', level: 34 }], 'Fresh powder AND a fresh challenger!', 'Face-plant.');
RT('ff_hunter', 'Kjell', 'Hunter', 960, [{ key: 'shiverfin', level: 34 }, { key: 'yetiling', level: 35 }], 'I track the fangs of the frost. You\'re next!', 'The trail runs cold.');
RT('ff_mystic', 'Idun', 'Mystic', 980, [{ key: 'umbrafloe', level: 35 }, { key: 'glacierling', level: 35 }], 'The hollow\'s cold sharpens the mind!', 'Clarity lost.');
RT('ff_blackbelt', 'Ulfr', 'Black Belt', 1000, [{ key: 'walrust', level: 36 }, { key: 'shiverfin', level: 36 }], 'My fists don\'t feel the cold. Yours will!', 'A chilling defeat.');
RT('ff_ace', 'Nanna', 'Ace Trainer', 1160, [{ key: 'frystdrake', level: 37 }, { key: 'umbrafloe', level: 37 }], 'Only the fierce reach the fang\'s tip!', 'You are fierce.');
RT('ff_veteran', 'Old Frida', 'Veteran', 1240, [{ key: 'walrust', level: 37 }, { key: 'frystdrake', level: 38 }], 'This ravine has swallowed lesser trainers whole!', 'Not this one.');

// ---- generic side-area builder (dead-end clearing off a host town's east edge) ----
function sideArea(cfg) {
  const w = cfg.w, h = cfg.h, fill = cfg.fill || ' ', mid = Math.floor(w / 2);
  const g = blankGrid(w, h, fill);
  gborder(g, cfg.border || 'T');
  gput(g, mid - 1, h - 1, fill); gput(g, mid, h - 1, fill);   // south entrance gap
  for (const [x, y] of (cfg.tall || [])) gput(g, x, y, cfg.tallCh || ',');
  for (const [x, y] of (cfg.deco || [])) gput(g, x, y, cfg.decoCh || 'R');
  const npcs = (cfg.trainers || []).map((t) => ({
    x: t.x, y: t.y, sprite: t.sprite || 'npc_villager', dir: t.dir || 'down',
    trainer: t.id, sight: t.sight || 3, script: 'trainer_after',
  }));
  defineMap({
    id: cfg.id, name: cfg.name, music: cfg.music || 'route', battleEnv: cfg.env,
    legend: LEG, ground: gRows(g),
    warps: [
      { x: mid - 1, y: h - 1, to: cfg.host, tx: cfg.back.x, ty: cfg.back.y, dir: 'down', always: true },
      { x: mid, y: h - 1, to: cfg.host, tx: cfg.back.x, ty: cfg.back.y, dir: 'down', always: true },
    ],
    signs: cfg.signs || [], items: cfg.items || [], npcs,
    encounters: cfg.enc ? { rate: cfg.rate || 16, grass: cfg.enc } : null,
    onEnter() { Overworld.showBanner(); },
  });
  const hm = Maps[cfg.host];
  if (hm) {
    (hm.warps || (hm.warps = [])).push({ x: cfg.entry.x, y: cfg.entry.y, to: cfg.id, tx: mid - 1, ty: h - 2, dir: 'up', always: true });
    if (cfg.entrySign) (hm.signs || (hm.signs = [])).push(cfg.entrySign);
  }
}

sideArea({
  id: 'whispering_glade', name: 'Whispering Glade', env: 'grass', host: 'birchwick',
  entry: { x: 18, y: 7 }, back: { x: 17, y: 7 }, w: 16, h: 13, fill: ' ', border: 'T',
  entrySign: { x: 17, y: 6, text: 'A leafy trail winds east into the WHISPERING GLADE.' },
  tall: [[4, 3], [5, 3], [6, 3], [9, 4], [10, 4], [4, 8], [5, 8], [11, 8], [7, 6], [8, 6]],
  deco: [[2, 5], [13, 5], [3, 10], [12, 10]], decoCh: 'P',
  trainers: [
    { x: 4, y: 9, id: 'wg_bug1', dir: 'right', sprite: 'npc_villager' },
    { x: 11, y: 9, id: 'wg_bug2', dir: 'left', sprite: 'npc_villager' },
    { x: 7, y: 8, id: 'wg_lass', dir: 'down', sprite: 'npc_woman' },
    { x: 3, y: 5, id: 'wg_camper', dir: 'down', sprite: 'npc_hiker' },
    { x: 12, y: 5, id: 'wg_ranger', dir: 'down', sprite: 'npc_ranger' },
    { x: 6, y: 3, id: 'wg_forager', dir: 'down', sprite: 'npc_woman' },
    { x: 9, y: 6, id: 'wg_twin', dir: 'left', sprite: 'npc_woman' },
  ],
  items: [{ x: 8, y: 1, item: 'leafband', flag: 'wg_leafband' }, { x: 2, y: 2, item: 'super_potion', flag: 'wg_pot' }],
  enc: [
    { key: 'larvel', min: 7, max: 10, weight: 3 }, { key: 'pineling', min: 7, max: 10, weight: 2 },
    { key: 'sporeling', min: 8, max: 10, weight: 2 }, { key: 'galewing', min: 8, max: 11, weight: 2 },
    { key: 'pupperine', min: 8, max: 10, weight: 1 },
  ],
});

sideArea({
  id: 'sunder_cliffs', name: 'Sunder Cliffs', env: 'volcano', host: 'emberfall',
  entry: { x: 18, y: 7 }, back: { x: 17, y: 7 }, w: 16, h: 14, fill: ' ', border: 'R',
  entrySign: { x: 17, y: 6, text: 'A steep path climbs east to the SUNDER CLIFFS.' },
  tall: [[3, 4], [4, 4], [11, 5], [12, 5], [5, 9], [6, 9], [10, 10], [8, 7]],
  deco: [[2, 6], [13, 4], [7, 3], [12, 9], [4, 11]], decoCh: 'B',
  trainers: [
    { x: 5, y: 10, id: 'sc_hiker1', dir: 'right', sprite: 'npc_hiker' },
    { x: 10, y: 10, id: 'sc_hiker2', dir: 'left', sprite: 'npc_hiker' },
    { x: 4, y: 7, id: 'sc_miner', dir: 'down', sprite: 'npc_hiker' },
    { x: 11, y: 7, id: 'sc_burglar', dir: 'down', sprite: 'npc_villager' },
    { x: 7, y: 8, id: 'sc_blackbelt', dir: 'down', sprite: 'npc_villager' },
    { x: 6, y: 4, id: 'sc_ace', dir: 'down', sprite: 'npc_ranger' },
    { x: 10, y: 4, id: 'sc_veteran', dir: 'down', sprite: 'npc_oldman' },
  ],
  items: [{ x: 8, y: 1, item: 'emberband', flag: 'sc_emberband' }, { x: 13, y: 2, item: 'ether', flag: 'sc_ether' }, { x: 2, y: 12, item: 'hyper_potion', flag: 'sc_pot' }],
  enc: [
    { key: 'oreling', min: 20, max: 24, weight: 3 }, { key: 'cairnling', min: 20, max: 23, weight: 2 },
    { key: 'sulfimer', min: 21, max: 24, weight: 2 }, { key: 'ramlet', min: 20, max: 23, weight: 2 },
    { key: 'shardling', min: 21, max: 24, weight: 1 },
  ],
});

sideArea({
  id: 'mistmarsh', name: 'Mistmarsh', env: 'water', host: 'lumenveil',
  entry: { x: 18, y: 7 }, back: { x: 17, y: 7 }, w: 16, h: 14, fill: ' ', border: 'T',
  entrySign: { x: 17, y: 6, text: 'A boardwalk sinks east into the fog of the MISTMARSH.' },
  tall: [[3, 4], [4, 4], [10, 4], [11, 5], [5, 9], [6, 9], [11, 10], [8, 7], [7, 7]],
  deco: [[2, 8], [13, 6], [12, 11], [3, 11]], decoCh: 'W',
  trainers: [
    { x: 5, y: 10, id: 'mm_fisher1', dir: 'right', sprite: 'npc_fisher' },
    { x: 10, y: 10, id: 'mm_witch', dir: 'left', sprite: 'npc_woman' },
    { x: 4, y: 6, id: 'mm_poison', dir: 'down', sprite: 'npc_villager' },
    { x: 11, y: 7, id: 'mm_swimmer', dir: 'down', sprite: 'npc_sailor' },
    { x: 8, y: 8, id: 'mm_druid', dir: 'down', sprite: 'npc_oldman' },
    { x: 6, y: 4, id: 'mm_ace', dir: 'down', sprite: 'npc_ranger' },
    { x: 10, y: 3, id: 'mm_veteran', dir: 'down', sprite: 'npc_oldman' },
  ],
  items: [{ x: 8, y: 1, item: 'tideband', flag: 'mm_tideband' }, { x: 13, y: 3, item: 'full_heal', flag: 'mm_heal' }, { x: 2, y: 5, item: 'ultraorb', count: 2, flag: 'mm_orbs' }],
  enc: [
    { key: 'mudlusk', min: 24, max: 28, weight: 3 }, { key: 'pollywisp', min: 24, max: 27, weight: 2 },
    { key: 'jelluna', min: 25, max: 28, weight: 2 }, { key: 'wispurr', min: 24, max: 27, weight: 2 },
    { key: 'nokkolt', min: 25, max: 28, weight: 1 },
  ],
});

sideArea({
  id: 'frostfang_hollow', name: 'Frostfang Hollow', env: 'snow', host: 'glacierholm',
  entry: { x: 18, y: 7 }, back: { x: 17, y: 7 }, w: 16, h: 14, fill: 'x', border: 'Q',
  entrySign: { x: 17, y: 6, text: 'An icy cleft opens east into FROSTFANG HOLLOW.' },
  tallCh: 'z', tall: [[3, 4], [4, 4], [11, 5], [12, 5], [5, 9], [6, 9], [10, 10], [8, 7]],
  deco: [[2, 6], [13, 4], [7, 3], [12, 9]], decoCh: 'i',
  trainers: [
    { x: 5, y: 10, id: 'ff_skier1', dir: 'right', sprite: 'npc_woman' },
    { x: 10, y: 10, id: 'ff_boarder', dir: 'left', sprite: 'npc_villager' },
    { x: 4, y: 7, id: 'ff_hunter', dir: 'down', sprite: 'npc_hiker' },
    { x: 11, y: 7, id: 'ff_mystic', dir: 'down', sprite: 'npc_woman' },
    { x: 7, y: 8, id: 'ff_blackbelt', dir: 'down', sprite: 'npc_villager' },
    { x: 6, y: 4, id: 'ff_ace', dir: 'down', sprite: 'npc_ranger' },
    { x: 10, y: 4, id: 'ff_veteran', dir: 'down', sprite: 'npc_oldman' },
  ],
  items: [{ x: 8, y: 1, item: 'tide_stone', flag: 'ff_stone' }, { x: 2, y: 2, item: 'max_potion', flag: 'ff_pot' }, { x: 13, y: 11, item: 'rare_candy', flag: 'ff_candy' }],
  enc: [
    { key: 'frostkit', min: 32, max: 36, weight: 3 }, { key: 'yetiling', min: 32, max: 35, weight: 2 },
    { key: 'shiverfin', min: 33, max: 36, weight: 2 }, { key: 'glacierling', min: 33, max: 36, weight: 2 },
    { key: 'umbrafloe', min: 34, max: 37, weight: 1 },
  ],
});
