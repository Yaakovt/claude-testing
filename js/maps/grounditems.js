'use strict';
/**
 * Scatters many more findable pick-up items across the world. Rather than
 * hand-placing every ball (and risking a solid tile), we declare WHICH items a
 * map should carry and let this pass find free, walkable, unoccupied tiles for
 * them automatically — spaced out, each with a unique collected-flag.
 */
(() => {
  // mapId -> list of [itemId] or [itemId, count]
  const SPEC = {
    // --- early routes / towns ---
    route1: [['antidote'], ['potion']],
    frosthollow: [['potion']],
    birchwick: [['super_potion'], ['paralyze_heal']],
    route2: [['super_potion'], ['greatorb', 2], ['repel']],
    mossmere: [['awakening'], ['soothe_berry']],
    route3: [['greatorb', 2], ['super_potion'], ['escape_rope']],
    tidesend: [['hyper_potion'], ['revive']],
    whisperwood_cave: [['x_attack'], ['greatorb', 3], ['rally_berry']],
    // --- mid routes / cities ---
    route4: [['hyper_potion'], ['ether']],
    emberfall: [['burn_salve'], ['ember_stone']],
    route5: [['ultraorb'], ['x_special']],
    lumenveil: [['hyper_potion'], ['mendmoss']],
    route6: [['ultraorb'], ['revive'], ['x_defense']],
    irondeep: [['hyper_potion'], ['rally_berry']],
    route7: [['ice_thaw'], ['ultraorb', 2]],
    frostmoor: [['full_heal']],
    route8: [['max_potion'], ['ether']],
    glacierholm: [['full_heal'], ['focus_charm']],
    route9: [['ultraorb', 2], ['x_speed'], ['storm_stone']],
    stormcrest: [['max_potion'], ['rare_candy']],
    // --- late / postgame ---
    victory_road: [['full_heal'], ['ultraorb', 3]],
    victory_road2: [['max_potion'], ['rare_candy'], ['ether', 2]],
    tempest_isle: [['max_revive'], ['aurora_stone']],
    dusk_isles: [['max_potion'], ['ether', 2]],
  };

  function isWalk(def, x, y) {
    const row = def.ground[y];
    if (!row) return false;
    const ch = row[x];
    const id = def.legend[ch];
    if (!id) return false;
    const t = Tiles.def(id);
    if (!t) return false;
    if (t.water) return false;                 // no items in water
    if (t.solid) return false;                 // no items on walls/trees/rocks
    if (t.door || t.stairs || t.warp) return false;
    return true;
  }

  for (const id in SPEC) {
    const def = Maps[id];
    if (!def || !def.ground) continue;
    // tiles already claimed by warps / existing items / npcs / signs
    const occ = new Set();
    const mark = (arr) => { for (const o of arr || []) occ.add(o.x + ',' + o.y); };
    mark(def.warps); mark(def.items); mark(def.npcs); mark(def.signs);

    const free = [];
    for (let y = 1; y < def.ground.length - 1; y++) {
      const w = def.ground[y].length;
      for (let x = 1; x < w - 1; x++) {
        if (occ.has(x + ',' + y)) continue;
        if (isWalk(def, x, y)) free.push([x, y]);
      }
    }
    if (!free.length) continue;

    def.items = def.items || [];
    const want = SPEC[id].filter(([item]) => Items[item]);   // drop any bad ids
    const step = Math.max(1, Math.floor(free.length / (want.length + 1)));
    const used = new Set();
    want.forEach(([item, count], i) => {
      let idx = Math.min(free.length - 1, (i + 1) * step);
      while (idx < free.length && used.has(idx)) idx++;
      if (idx >= free.length) { idx = 0; while (idx < free.length && used.has(idx)) idx++; }
      if (idx >= free.length) return;
      used.add(idx);
      const [x, y] = free[idx];
      def.items.push({ x, y, item, count, flag: 'gi_' + id + '_' + i });
    });
  }
})();
