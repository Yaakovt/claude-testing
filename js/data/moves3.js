'use strict';
/**
 * Third batch of moves (+45) — broadens every type's pool with extra power
 * tiers, coverage, and status/utility so learnsets can stay varied all the way
 * to the final evolutions. Only uses effect fields the battle engine already
 * implements (status, statFoe, statSelf, flinch, highCrit, recoil, drain,
 * heal, weather, screen, multi, neverMiss, protect). Loaded after moves2.js.
 */

// ---------- Normal ----------
M('swift_jab', 'Quick Jab', 'Normal', 'phys', 40, 100, 30, { pri: 1,
  anim: { fx: 'impact', col: ['#f8f8f8', '#d0d0d0'], n: 6 }, desc: 'Always strikes first.' });
M('rally_cry', 'Rally Cry', 'Normal', 'status', 0, null, 20, { fx: { statSelf: { stat: ['atk', 'spa'], stages: 1 } },
  anim: { fx: 'sparkle', col: ['#f8e070', '#fff'], n: 8 }, desc: 'Raises the user\'s Attack and Sp. Atk.' });
M('reckless_ram', 'Reckless Ram', 'Normal', 'phys', 100, 100, 10, { fx: { recoil: 0.25 },
  anim: { fx: 'impact', col: ['#f0e0c0', '#fff'], n: 10 }, desc: 'A full-body charge. The user takes recoil.' });
M('lull', 'Lull', 'Normal', 'status', 0, 75, 10, { fx: { status: { id: 'slp' } },
  anim: { fx: 'spore', col: ['#c8c0f0', '#fff'], n: 6 }, desc: 'Lulls the foe to sleep.' });

// ---------- Fire ----------
M('emberveil', 'Emberveil', 'Fire', 'spec', 75, 100, 10, { fx: { statSelf: { stat: 'spd', stages: 1 } },
  anim: { fx: 'flames', col: ['#f06a30', '#f8c840', '#fff'], n: 10 }, desc: 'Cloaks the user in flame. Raises Sp. Def.' });
M('cinder_storm', 'Cinder Storm', 'Fire', 'spec', 110, 90, 5, { fx: { status: { id: 'brn', pct: 20 } },
  anim: { fx: 'flames', col: ['#e85028', '#f8b038', '#fff'], n: 14 }, desc: 'A storm of embers. May burn.' });

// ---------- Water ----------
M('brine_spear', 'Brine Spear', 'Water', 'phys', 70, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'wave', col: ['#3a8fd0', '#8fd0f8', '#fff'], n: 8 }, desc: 'A lance of pressurized brine. High crit rate.' });
M('maelstrom', 'Maelstrom', 'Water', 'spec', 110, 85, 5, { fx: { statSelf: { stat: 'spa', stages: -1 } },
  anim: { fx: 'wave', col: ['#2a6fb0', '#6fb0e8', '#fff'], n: 14 }, desc: 'A crushing whirlpool. Lowers the user\'s Sp. Atk.' });

// ---------- Grass ----------
M('bramble_lash', 'Bramble Lash', 'Grass', 'phys', 65, 100, 15, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 30 } },
  anim: { fx: 'slash', col: ['#5da24e', '#8fd060', '#fff'], n: 8 }, desc: 'Whipping thorns. May lower Speed.' });
M('bloom_burst', 'Bloom Burst', 'Grass', 'spec', 95, 95, 10, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 20 } },
  anim: { fx: 'spore', col: ['#78c85a', '#f0f088', '#fff'], n: 12 }, desc: 'A burst of pollen. May lower Sp. Atk.' });

// ---------- Electric ----------
M('arc_bolt', 'Arc Bolt', 'Electric', 'spec', 70, 100, 15, { fx: { status: { id: 'par', pct: 20 } },
  anim: { fx: 'shock', col: ['#f8e038', '#fff'], n: 8 }, desc: 'A leaping arc. May paralyze.' });
M('overcharge', 'Overcharge', 'Electric', 'spec', 120, 85, 5, { fx: { recoil: 0.25 },
  anim: { fx: 'shock', col: ['#f8d020', '#fff8a0', '#fff'], n: 14 }, desc: 'A massive discharge. The user takes recoil.' });
M('static_field', 'Static Field', 'Electric', 'status', 0, 90, 20, { fx: { status: { id: 'par' } },
  anim: { fx: 'shock', col: ['#f8e038', '#fff'], n: 6 }, desc: 'Charges the air. Paralyzes the foe.' });

// ---------- Ice ----------
M('rime_fang', 'Frost Fang', 'Ice', 'phys', 65, 95, 15, { fx: { status: { id: 'frz', pct: 10 }, flinch: 10 },
  anim: { fx: 'iceshards', col: ['#a8e0f8', '#fff'], n: 8 }, desc: 'A freezing bite. May freeze or flinch.' });
M('glacier_crash', 'Glacier Crash', 'Ice', 'phys', 100, 85, 5, { fx: { flinch: 20 },
  anim: { fx: 'iceshards', col: ['#88c8f0', '#e8f8ff', '#fff'], n: 12 }, desc: 'A calving glacier. May flinch.' });
M('rime_beam', 'Rime Beam', 'Ice', 'spec', 85, 100, 10, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 30 } },
  anim: { fx: 'iceshards', col: ['#9ad8f0', '#fff'], n: 10 }, desc: 'A beam of hoarfrost. May lower Speed.' });
M('snowveil', 'Snowveil', 'Ice', 'status', 0, null, 10, { fx: { weather: 'hail' },
  anim: { fx: 'iceshards', col: ['#d8f0ff', '#fff'], n: 6 }, desc: 'Summons a hailstorm.' });

// ---------- Fighting ----------
M('piston_kick', 'Piston Kick', 'Fighting', 'phys', 45, 100, 30, { pri: 1,
  anim: { fx: 'crush', col: ['#d05838', '#f8a068'], n: 6 }, desc: 'A blinding kick that strikes first.' });
M('rupture_palm', 'Rupture Palm', 'Fighting', 'phys', 90, 90, 10, { fx: { statFoe: { stat: 'def', stages: -1, pct: 30 } },
  anim: { fx: 'crush', col: ['#c04830', '#f89060', '#fff'], n: 12 }, desc: 'A palm that shatters guard. May lower Defense.' });
M('warcry_stance', 'Warcry Stance', 'Fighting', 'status', 0, null, 20, { fx: { statSelf: { stat: ['atk', 'def'], stages: 1 } },
  anim: { fx: 'aura', col: ['#e07040', '#fff'], n: 8 }, desc: 'A battle stance. Raises Attack and Defense.' });

// ---------- Poison ----------
M('toxic_bite', 'Venom Fang', 'Poison', 'phys', 60, 100, 15, { fx: { status: { id: 'psn', pct: 40 } },
  anim: { fx: 'venom', col: ['#a048c0', '#e090f0'], n: 8 }, desc: 'A toxic bite. Often poisons.' });
M('sludge_wave', 'Sludge Wave', 'Poison', 'spec', 95, 100, 10, { fx: { status: { id: 'psn', pct: 20 } },
  anim: { fx: 'venom', col: ['#9040b0', '#d080e8', '#fff'], n: 12 }, desc: 'A wave of sludge. May poison.' });

// ---------- Ground ----------
M('grit_blast', 'Sand Blast', 'Ground', 'spec', 80, 95, 10, { fx: { statFoe: { stat: 'acc', stages: -1, pct: 30 } },
  anim: { fx: 'quake', col: ['#d8b878', '#8a6a44'], n: 10 }, desc: 'A blast of grit. May lower accuracy.' });
M('fissure_stomp', 'Fissure Stomp', 'Ground', 'phys', 95, 100, 10, { fx: { flinch: 20 },
  anim: { fx: 'quake', col: ['#c0a068', '#8a6a44', '#fff'], n: 12 }, desc: 'A ground-splitting stomp. May flinch.' });

// ---------- Flying ----------
M('zephyr_slash', 'Gale Slash', 'Flying', 'phys', 70, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'wind', col: ['#a8d8f0', '#fff'], n: 8 }, desc: 'A slicing gale. High crit rate.' });
M('cyclone_dive', 'Cyclone Dive', 'Flying', 'phys', 110, 90, 10, { fx: { recoil: 0.2 },
  anim: { fx: 'wind', col: ['#88b8e8', '#d8f0ff', '#fff'], n: 12 }, desc: 'A spiraling dive. The user takes recoil.' });

// ---------- Psychic ----------
M('psy_spike', 'Mind Spike', 'Psychic', 'spec', 70, 100, 15, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 20 } },
  anim: { fx: 'psywave', col: ['#e070c0', '#f8b0e8'], n: 8 }, desc: 'A stab of psychic force. May lower Sp. Def.' });
M('astral_surge', 'Astral Surge', 'Psychic', 'spec', 110, 90, 5, { fx: { statSelf: { stat: 'spa', stages: -1 } },
  anim: { fx: 'psywave', col: ['#d060b0', '#f8a0e0', '#fff'], n: 14 }, desc: 'An overwhelming surge. Lowers the user\'s Sp. Atk.' });

// ---------- Bug ----------
M('pincer_grip', 'Pincer Grip', 'Bug', 'phys', 60, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 30 } },
  anim: { fx: 'slash', col: ['#8ab838', '#c8e060'], n: 8 }, desc: 'Crushing pincers. May lower Defense.' });
M('swarm_call', 'Swarm Call', 'Bug', 'spec', 90, 90, 10, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 20 } },
  anim: { fx: 'proj', col: ['#7aa830', '#c0e070', '#fff'], n: 14 }, desc: 'A blotting swarm. May lower Sp. Atk.' });
M('silk_trap', 'Silk Trap', 'Bug', 'status', 0, 95, 20, { fx: { statFoe: { stat: 'spe', stages: -2 } },
  anim: { fx: 'slash', col: ['#c8e060', '#fff'], n: 6 }, desc: 'Binds the foe in silk. Sharply lowers Speed.' });

// ---------- Rock ----------
M('boulder_toss', 'Boulder Toss', 'Rock', 'phys', 85, 90, 10, { fx: { flinch: 20 }, contact: false,
  anim: { fx: 'crush', col: ['#b8a078', '#8a6a44'], n: 10 }, desc: 'Hurls a boulder. May flinch.' });
M('magma_shard', 'Magma Shard', 'Rock', 'spec', 80, 100, 10, { fx: { status: { id: 'brn', pct: 20 } }, contact: false,
  anim: { fx: 'crush', col: ['#c86848', '#f0a060', '#fff'], n: 10 }, desc: 'A red-hot shard. May burn.' });
M('crag_guard', 'Crag Guard', 'Rock', 'status', 0, null, 15, { fx: { statSelf: { stat: ['def', 'spd'], stages: 1 } },
  anim: { fx: 'aura', col: ['#b8a078', '#fff'], n: 8 }, desc: 'Raises Defense and Sp. Def behind a crag.' });

// ---------- Steel ----------
M('iron_lash', 'Iron Lash', 'Steel', 'phys', 70, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 20 } },
  anim: { fx: 'slash', col: ['#b8c0cc', '#fff'], n: 8 }, desc: 'A steel whip. May lower Defense.' });
M('alloy_cannon', 'Alloy Cannon', 'Steel', 'spec', 100, 95, 5, { fx: { statSelf: { stat: 'spa', stages: -1 } }, contact: false,
  anim: { fx: 'beam', col: ['#a8b0bc', '#e0e8f0', '#fff'], n: 12 }, desc: 'A molten-alloy blast. Lowers the user\'s Sp. Atk.' });
M('temper_up', 'Temper Up', 'Steel', 'status', 0, null, 15, { fx: { statSelf: { stat: ['atk', 'def'], stages: 1 } },
  anim: { fx: 'aura', col: ['#c0c8d4', '#fff'], n: 8 }, desc: 'Tempers the body. Raises Attack and Defense.' });

// ---------- Ghost ----------
M('tomb_grasp', 'Grave Grasp', 'Ghost', 'phys', 80, 100, 10, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 30 } },
  anim: { fx: 'phantom', col: ['#7060a0', '#b0a0e0'], n: 10 }, desc: 'Cold hands seize the foe. May lower Speed.' });
M('soul_drain', 'Soul Drain', 'Ghost', 'spec', 75, 100, 10, { fx: { drain: 0.5 },
  anim: { fx: 'phantom', col: ['#8060b0', '#c0a0f0', '#fff'], n: 10 }, desc: 'Drains spirit to heal the user.' });

// ---------- Dragon ----------
M('drake_pulse', 'Wyrm Pulse', 'Dragon', 'spec', 85, 100, 10, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 20 } },
  anim: { fx: 'vortex', col: ['#6a78d0', '#a0b0f0'], n: 10 }, desc: 'A pulse of draconic force. May lower Sp. Atk.' });
M('sky_render', 'Sky Render', 'Dragon', 'phys', 110, 90, 10, { fx: { recoil: 0.2 },
  anim: { fx: 'vortex', col: ['#5a68c0', '#98a8f0', '#fff'], n: 14 }, desc: 'Rends the sky. The user takes recoil.' });

// ---------- Dark ----------
M('shadow_feint', 'Shadow Feint', 'Dark', 'phys', 45, 100, 20, { pri: 1,
  anim: { fx: 'phantom', col: ['#4a4458', '#8a80a0'], n: 6 }, desc: 'A sudden strike from the shade. Hits first.' });
M('dread_howl', 'Dread Howl', 'Dark', 'status', 0, 100, 20, { fx: { statFoe: { stat: ['atk', 'spa'], stages: -1 } },
  anim: { fx: 'phantom', col: ['#3a3448', '#7a7090'], n: 6 }, desc: 'A chilling howl. Lowers the foe\'s Attack and Sp. Atk.' });

// ---------- Fairy ----------
M('dazzle_kiss', 'Glimmer Kiss', 'Fairy', 'spec', 60, 100, 15, { fx: { status: { id: 'confuse', pct: 20 } },
  anim: { fx: 'fairydust', col: ['#f0a0d8', '#fff'], n: 8 }, desc: 'A dazzling kiss. May confuse.' });
M('starfall', 'Starfall', 'Fairy', 'spec', 95, 95, 10, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 20 } },
  anim: { fx: 'fairydust', col: ['#e888c8', '#f8d0f0', '#fff'], n: 14 }, desc: 'A rain of stars. May lower Sp. Atk.' });
M('fae_ward', 'Fae Ward', 'Fairy', 'status', 0, null, 15, { fx: { statSelf: { stat: ['def', 'spd'], stages: 1 } },
  anim: { fx: 'fairydust', col: ['#f0b8e0', '#fff'], n: 8 }, desc: 'A shimmering ward. Raises Defense and Sp. Def.' });
M('moonblade', 'Moonblade', 'Fairy', 'phys', 90, 95, 10, { fx: { highCrit: true },
  anim: { fx: 'fairydust', col: ['#e0a0e0', '#fff8ff', '#fff'], n: 12 }, desc: 'A crescent of moonlight. High crit rate.' });

/**
 * Distribute the fresh coverage moves as TUTOR-style options too: nothing is
 * force-added here (learnsets_extra.js handles level-up placement), but this
 * guard confirms every id above is registered so a typo fails loudly in tests.
 */
(() => {
  const added = ['swift_jab', 'rally_cry', 'reckless_ram', 'lull', 'emberveil', 'cinder_storm',
    'brine_spear', 'maelstrom', 'bramble_lash', 'bloom_burst', 'arc_bolt', 'overcharge', 'static_field',
    'rime_fang', 'glacier_crash', 'rime_beam', 'snowveil', 'piston_kick', 'rupture_palm', 'warcry_stance',
    'toxic_bite', 'sludge_wave', 'grit_blast', 'fissure_stomp', 'zephyr_slash', 'cyclone_dive', 'psy_spike',
    'astral_surge', 'pincer_grip', 'swarm_call', 'silk_trap', 'boulder_toss', 'magma_shard', 'crag_guard',
    'iron_lash', 'alloy_cannon', 'temper_up', 'tomb_grasp', 'soul_drain', 'drake_pulse', 'sky_render',
    'shadow_feint', 'dread_howl', 'dazzle_kiss', 'starfall', 'fae_ward', 'moonblade'];
  const missing = added.filter((id) => !Moves[id]);
  if (missing.length) console.error('moves3: unregistered ids', missing);
})();
