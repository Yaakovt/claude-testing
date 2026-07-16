'use strict';
/**
 * Learnset enrichment. The hand-authored learnsets were sparse (avg ~5 level-up
 * moves, many fully-evolved species stopped learning by Lv12). This pass fills
 * every species out to a stage-appropriate move count that keeps growing to the
 * high levels — STAB-forward, with coverage and status mixed in — drawing only
 * from moves that already exist (so every id is valid). Non-destructive: it
 * appends to each `d.learn` array and re-sorts. Loaded LAST, after every move
 * batch and after signature moves are attached.
 */
(() => {
  if (typeof Dex === 'undefined' || typeof Moves === 'undefined') return;
  const all = Dex.order.map((k) => Dex.byKey[k]);

  // One-of-a-kind / ultimate moves stay exclusive to whoever already has them.
  const EXCLUDE = new Set([
    'star_cataclysm', 'aurora_cataclysm', 'primal_rage', 'inferno_burst',
    'gaias_wrath', 'wyrmflare', 'abyss_maw', 'tidal_crash', 'storm_hymn',
    'dusk_requiem', 'glacier_age', 'thunder_throne', 'verdant_reign',
  ]);

  // ---- build a type -> {dmg:[{id,power,cat}], status:[id]} pool ----
  const POOL = {};
  for (const id in Moves) {
    if (EXCLUDE.has(id)) continue;
    const m = Moves[id];
    const t = m.type;
    (POOL[t] || (POOL[t] = { dmg: [], status: [] }));
    if (m.cat === 'status') POOL[t].status.push(id);
    else if (m.power > 0) POOL[t].dmg.push({ id, power: m.power });
  }
  for (const t in POOL) POOL[t].dmg.sort((a, b) => a.power - b.power);
  // universally-flavored status moves any species can pick up as filler
  const NEUTRAL_STATUS = ['rally_cry', 'warcry_stance', 'temper_up', 'crag_guard', 'fae_ward'].filter((id) => Moves[id]);
  const ALL_TYPES = Object.keys(POOL);

  // stable per-species hash so "random-ish" choices are deterministic
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }

  // ---- classify evolution stage ----
  const evoTargets = new Set();
  for (const d of all) {
    const ev = d.evolve;
    if (Array.isArray(ev)) ev.forEach((e) => e && e.to && evoTargets.add(e.to));
    else if (ev && ev.to) evoTargets.add(ev.to);
  }
  function stageOf(d) {
    const hasEvo = Array.isArray(d.evolve) ? d.evolve.length > 0 : !!(d.evolve && d.evolve.to);
    const isTarget = evoTargets.has(d.key);
    if (hasEvo && !isTarget) return 'basic';
    if (hasEvo && isTarget) return 'mid';
    if (!hasEvo && isTarget) return 'final';
    return 'solo';                 // single-stage species / legendaries
  }
  // total level-up move target + how high the level curve runs, per stage
  const PLAN = {
    basic: { total: 12, maxLv: 40 },
    mid: { total: 15, maxLv: 48 },
    final: { total: 18, maxLv: 60 },
    solo: { total: 17, maxLv: 58 },
  };

  for (const d of all) {
    if (!Array.isArray(d.learn)) continue;
    const plan = PLAN[stageOf(d)];
    const have = new Set(d.learn.map(([, mv]) => mv));
    const usedLv = new Set(d.learn.map(([lv]) => lv));
    const need = plan.total - d.learn.length;
    if (need <= 0) continue;

    // ---- assemble an ordered candidate list: weak -> strong, STAB-forward ----
    const stab = [];
    for (const t of d.types) if (POOL[t]) for (const e of POOL[t].dmg) stab.push(e.id);
    // coverage: two off-types chosen deterministically from this species
    const h = hash(d.key);
    const others = ALL_TYPES.filter((t) => !d.types.includes(t));
    const cov = [];
    for (let i = 0; i < 3 && others.length; i++) {
      const t = others[(h >> (i * 3)) % others.length];
      const pool = POOL[t] && POOL[t].dmg;
      if (pool && pool.length) { const mid = pool[Math.floor(pool.length * 0.5)]; if (mid) cov.push(mid.id); }
    }
    const status = [];
    for (const t of d.types) if (POOL[t]) status.push(...POOL[t].status);
    status.push(...NEUTRAL_STATUS);

    // interleave: mostly STAB (in ascending power), sprinkle coverage + status
    const ordered = [];
    let ci = 0, si = 0;
    stab.forEach((id, i) => {
      ordered.push(id);
      if (i === 1 && status[si]) ordered.push(status[si++]);        // an early status/utility
      if (i % 3 === 2 && cov[ci]) ordered.push(cov[ci++]);          // periodic coverage
      if (i === 4 && status[si]) ordered.push(status[si++]);        // a mid status
    });
    while (ci < cov.length) ordered.push(cov[ci++]);
    while (si < status.length) ordered.push(status[si++]);
    // de-dupe against what it already knows and within the list
    const seen = new Set(have);
    const queue = ordered.filter((id) => (id && !seen.has(id) && seen.add(id)));

    // ---- place onto evenly-spaced level milestones up to plan.maxLv ----
    const startLv = Math.min(plan.maxLv - 2, Math.max(8, ...d.learn.map(([lv]) => lv), 8));
    const span = plan.maxLv - startLv;
    const step = Math.max(3, Math.round(span / (need + 1)));
    let added = 0, lv = startLv + step;
    while (added < need && queue.length) {
      let L = lv;
      while (usedLv.has(L)) L++;                                    // avoid exact collisions
      const mv = queue.shift();
      d.learn.push([L, mv]);
      usedLv.add(L); added++; lv = L + step;
      if (lv > plan.maxLv) lv = plan.maxLv - (added % 3);           // cluster the last few high up
    }
    d.learn.sort((a, b) => a[0] - b[0]);
  }
})();
