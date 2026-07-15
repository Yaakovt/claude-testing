'use strict';
/** Seed the batch-H fakemon into wild encounter tables across the region. */
(() => {
  const add = (mapId, entry) => {
    const m = Maps[mapId];
    if (m && m.encounters && m.encounters.grass && Dex.byKey[entry.key]) m.encounters.grass.push(entry);
  };
  // Electric (Team Ionar's type) spread across the mid-game
  add('route4', { key: 'ionette', min: 16, max: 19, weight: 2 });
  add('route5', { key: 'ionette', min: 19, max: 22, weight: 2 });
  add('route6', { key: 'ionette', min: 22, max: 25, weight: 1 });
  add('route9', { key: 'aurovolt', min: 31, max: 34, weight: 1 });
  add('victory_road', { key: 'voltusk', min: 40, max: 43, weight: 1 });
  add('aurora_depths2', { key: 'teslamaw', min: 56, max: 58, weight: 1 });
  // Ghost/Ice spirit in the frozen north
  add('route8', { key: 'frostgeist', min: 28, max: 31, weight: 2 });
  add('frostfang_hollow', { key: 'frostgeist', min: 32, max: 36, weight: 2 });
  // Fire pup on the cliffs
  add('sunder_cliffs', { key: 'cindpup', min: 20, max: 24, weight: 2 });
  // Mirror guardian deep in Victory Road
  add('victory_road2', { key: 'mirrorclad', min: 43, max: 45, weight: 1 });
})();
