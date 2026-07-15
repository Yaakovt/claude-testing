'use strict';
/**
 * Encounter tables live inline on each map (map.encounters). This module holds
 * shared water/fishing tables the Old Rod and Surf pull from, keyed by map id.
 */
const FishTables = {
  route2: [{ key: 'minnowisp', min: 5, max: 10, weight: 3 }, { key: 'mudlusk', min: 6, max: 10, weight: 2 }],
  tidesend: [{ key: 'herrdart', min: 10, max: 15, weight: 2 }, { key: 'clampike', min: 10, max: 14, weight: 2 }, { key: 'jelluna', min: 12, max: 16, weight: 1 }],
  default: [{ key: 'minnowisp', min: 5, max: 10, weight: 1 }],
};

function fishTable(mapId) { return FishTables[mapId] || FishTables.default; }
