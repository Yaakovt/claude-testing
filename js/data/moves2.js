'use strict';
/**
 * Second batch of moves (24) — more coverage and variety, each wired to one of
 * the new type-flavored battle animations. After defining them, every new move
 * is auto-distributed into a few type-matching species' learnsets so it's
 * actually usable in game. Loaded after the dex so Dex is available.
 */
// Fire
M('flare_fang', 'Flare Fang', 'Fire', 'phys', 65, 95, 15, { fx: { status: { id: 'brn', pct: 20 } },
  anim: { fx: 'flames', col: ['#f06a30', '#f8c840', '#fff'], n: 10 }, desc: 'A blazing bite. May burn.' });
M('magma_burst', 'Magma Burst', 'Fire', 'spec', 90, 95, 10, { fx: { statSelf: { stat: 'def', stages: -1 } },
  anim: { fx: 'explosion', col: ['#e85028', '#f8b038', '#fff'], n: 12 }, desc: 'A molten eruption. Lowers the user\'s Defense.' });
// Water
M('torrent_lash', 'Torrent Lash', 'Water', 'phys', 75, 100, 15, {
  anim: { fx: 'wave', col: ['#3a8fd0', '#8fd0f8', '#fff'], n: 8 }, desc: 'A whip of high-pressure water.' });
M('brine_cannon', 'Brine Cannon', 'Water', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 20 } },
  anim: { fx: 'bubbles', col: ['#2f7fc0', '#a0e0f8'], n: 12 }, desc: 'A salt-water blast. May lower Speed.' });
// Grass
M('thorn_whip', 'Thorn Whip', 'Grass', 'phys', 70, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 20 } },
  anim: { fx: 'petals', col: ['#4a9a3a', '#8ad06a'], n: 10 }, desc: 'Barbed vines lash the foe. May lower Defense.' });
M('bloom_beam', 'Bloom Beam', 'Grass', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 20 } }, contact: false,
  anim: { fx: 'beam', col: ['#5da24e', '#c8f0a0', '#fff'], n: 1 }, desc: 'A concentrated ray of pollen-light. May lower Sp. Atk.' });
// Electric
M('volt_fang', 'Volt Fang', 'Electric', 'phys', 65, 95, 15, { fx: { status: { id: 'par', pct: 20 } },
  anim: { fx: 'shock', col: ['#f8e858', '#fff8b0'], n: 10 }, desc: 'An electrified bite. May paralyze.' });
M('arc_surge', 'Arc Surge', 'Electric', 'spec', 90, 100, 10, { fx: { status: { id: 'par', pct: 30 } }, contact: false,
  anim: { fx: 'shock', col: ['#f8e858', '#88e8f8', '#fff'], n: 14 }, desc: 'A surging arc of current. May paralyze.' });
// Ice
M('frost_fang', 'Frost Fang', 'Ice', 'phys', 65, 95, 15, { fx: { status: { id: 'frz', pct: 10 } },
  anim: { fx: 'iceshards', col: ['#88d8f0', '#e8f8ff'], n: 10 }, desc: 'A freezing bite. May freeze.' });
M('rime_spear', 'Rime Spear', 'Ice', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 20 } },
  anim: { fx: 'iceshards', col: ['#8fd8f0', '#c8f0ff', '#fff'], n: 14 }, desc: 'A lance of hoarfrost. May lower Speed.' });
// Fighting
M('iron_kick', 'Iron Kick', 'Fighting', 'phys', 80, 95, 15, { fx: { flinch: 20 },
  anim: { fx: 'crush', col: ['#c05038', '#f0d0a0'], n: 10 }, desc: 'A crushing kick. May flinch.' });
M('pressure_palm', 'Pressure Palm', 'Fighting', 'phys', 70, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 100 } },
  anim: { fx: 'crush', col: ['#b84838', '#f0c090'], n: 8 }, desc: 'A focused palm strike that always lowers Defense.' });
// Poison
M('toxic_spit', 'Toxic Spit', 'Poison', 'spec', 75, 100, 10, { fx: { status: { id: 'psn', pct: 30 } }, contact: false,
  anim: { fx: 'venom', col: ['#9a4ab0', '#d090e0'], n: 12 }, desc: 'A spray of venom. May poison.' });
M('venom_fang', 'Venom Fang', 'Poison', 'phys', 70, 100, 15, { fx: { status: { id: 'psn', pct: 30 } },
  anim: { fx: 'venom', col: ['#8a3aa0', '#c878e0'], n: 10 }, desc: 'A toxic bite. May poison.' });
// Ground
M('sand_blast', 'Sand Blast', 'Ground', 'spec', 80, 95, 10, { fx: { statFoe: { stat: 'acc', stages: -1, pct: 30 } }, contact: false,
  anim: { fx: 'crush', col: ['#c8a860', '#e8d0a0'], n: 12 }, desc: 'A blast of grit. May lower accuracy.' });
M('tremor_stomp', 'Tremor Stomp', 'Ground', 'phys', 85, 100, 10, { fx: { flinch: 20 },
  anim: { fx: 'quake', col: ['#b06838', '#e0a860', '#fff'], n: 10 }, desc: 'A ground-splitting stomp. May flinch.' });
// Flying
M('gale_slash', 'Gale Slash', 'Flying', 'phys', 75, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'wind', col: ['#a8d8f0', '#fff'], n: 10 }, desc: 'A slicing gust. High critical-hit ratio.' });
M('sky_dive', 'Sky Dive', 'Flying', 'phys', 95, 95, 10, { fx: { recoil: 0.2 },
  anim: { fx: 'lunge', col: ['#88b8e8', '#fff'], n: 8 }, desc: 'A plunging dive. The user takes some recoil.' });
// Psychic
M('mind_spike', 'Mind Spike', 'Psychic', 'spec', 85, 100, 10, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 20 } }, contact: false,
  anim: { fx: 'psywave', col: ['#e070b0', '#f8c0e8'], n: 12 }, desc: 'A psychic lance. May lower Sp. Def.' });
M('hypno_ring', 'Hypno Ring', 'Psychic', 'status', 0, 70, 10, { fx: { status: { id: 'slp', pct: 100 } }, contact: false,
  anim: { fx: 'psywave', col: ['#c060c0', '#f0b0e8'], n: 10 }, desc: 'Spinning rings that lull the foe to sleep.' });
// Ghost
M('grave_grasp', 'Grave Grasp', 'Ghost', 'spec', 80, 100, 10, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 30 } }, contact: false,
  anim: { fx: 'phantom', col: ['#6a4a8a', '#b090d0'], n: 12 }, desc: 'Spectral hands clutch the foe. May lower Speed.' });
M('spectral_rush', 'Spectral Rush', 'Ghost', 'phys', 80, 100, 10, { pri: 1,
  anim: { fx: 'phantom', col: ['#5a3a7a', '#a080c0'], n: 10 }, desc: 'A ghostly lunge that always strikes first.' });
// Dragon
M('wyrm_slash', 'Wyrm Slash', 'Dragon', 'phys', 80, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'vortex', col: ['#5a6ec0', '#a0b0f0'], n: 10 }, desc: 'A draconic rending. High critical-hit ratio.' });
M('draco_surge', 'Draco Surge', 'Dragon', 'spec', 90, 100, 10, { fx: { statSelf: { stat: 'spa', stages: -1 } }, contact: false,
  anim: { fx: 'vortex', col: ['#6070c8', '#b0c0f8', '#fff'], n: 14 }, desc: 'A whirl of dragon energy. Lowers the user\'s Sp. Atk.' });

// ---- auto-distribute each new move into a few type-matching learnsets ----
(() => {
  if (typeof Dex === 'undefined') return;
  const NEW = ['flare_fang', 'magma_burst', 'torrent_lash', 'brine_cannon', 'thorn_whip', 'bloom_beam',
    'volt_fang', 'arc_surge', 'frost_fang', 'rime_spear', 'iron_kick', 'pressure_palm', 'toxic_spit',
    'venom_fang', 'sand_blast', 'tremor_stomp', 'gale_slash', 'sky_dive', 'mind_spike', 'hypno_ring',
    'grave_grasp', 'spectral_rush', 'wyrm_slash', 'draco_surge'];
  const byType = {};
  for (const k of Dex.order) { const d = Dex.byKey[k]; for (const t of d.types) (byType[t] || (byType[t] = [])).push(k); }
  for (const id of NEW) {
    const mv = Moves[id]; if (!mv) continue;
    const pool = byType[mv.type] || [];
    let added = 0;
    for (const k of pool) {
      if (added >= 4) break;
      const d = Dex.byKey[k];
      if (d.evolve) continue;                 // prefer fully-evolved learners
      if (d.learn.some(([, m]) => m === id)) continue;
      d.learn.push([34 + added * 3, id]);
      added++;
    }
  }
})();
