'use strict';
/** Dungeons/caves. Whisperwood Hollow — an optional early cave off Route 2. */

const CLEG = {
  ' ': 'cavefloor', 'w': 'cavewall', 'W': 'water', 'R': 'rock',
  'B': 'boulder', 'K': 'crackrock', 'c': 'crystal', 'd': 'stairs_down', 's': 'sign',
};

defineMap({
  id: 'whisperwood_cave', name: 'Whisperwood Hollow', music: 'cave', battleEnv: 'cave', indoor: true,
  legend: CLEG,
  ground: [
    'wwwwwwwwwwwwwwww',
    'wd    w    c   w',
    'ww ww w wwww w w',
    'w  w    w    w w',
    'w ww www w ww  w',
    'w  B  w  w  w  w',
    'ww ww w ww ww  w',
    'w     w     K  w',
    'w www ww www w w',
    'wc  w     w    w',
    'wwwwwwwwwd wwwwww',
  ],
  warps: [
    { x: 1, y: 1, to: 'route2', tx: 3, ty: 6, dir: 'down', always: true },
    { x: 9, y: 10, to: 'route2', tx: 3, ty: 8, dir: 'up', always: true },
  ],
  signs: [{ x: 5, y: 5, text: 'A heavy boulder. STRENGTH could move it.' }],
  items: [{ x: 13, y: 1, item: 'tm05', flag: 'ww_tm' }, { x: 1, y: 9, item: 'ether', flag: 'ww_ether' }],
  encounters: { rate: 18, grass: [
    { key: 'echomite', min: 8, max: 11, weight: 3 },
    { key: 'shardling', min: 8, max: 10, weight: 2 },
    { key: 'oreling', min: 9, max: 11, weight: 2 },
    { key: 'wickwisp', min: 9, max: 11, weight: 1 },
  ], smash: [{ key: 'cairnling', min: 8, max: 10, weight: 1 }] },
  onEnter() { Overworld.showBanner(); },
});
