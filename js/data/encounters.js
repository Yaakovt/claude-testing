'use strict';
/**
 * Encounter tables live inline on each map (map.encounters). This module holds
 * shared water/fishing tables the Old Rod and Surf pull from, keyed by map id.
 */
const FishTables = {
  route2: [{ key: 'minnowisp', min: 5, max: 10, weight: 3 }, { key: 'mudlusk', min: 6, max: 10, weight: 2 }],
  route3: [{ key: 'minnowisp', min: 10, max: 14, weight: 3 }, { key: 'herrdart', min: 12, max: 15, weight: 2 }, { key: 'krillbit', min: 12, max: 15, weight: 1 }],
  tidesend: [{ key: 'herrdart', min: 12, max: 16, weight: 3 }, { key: 'clampike', min: 12, max: 15, weight: 2 }, { key: 'jelluna', min: 13, max: 17, weight: 2 }, { key: 'shiverfin', min: 15, max: 18, weight: 1 }, { key: 'draklet', min: 15, max: 18, weight: 1 }],
  default: [{ key: 'minnowisp', min: 5, max: 10, weight: 1 }],
};

function fishTable(mapId) { return FishTables[mapId] || FishTables.default; }
