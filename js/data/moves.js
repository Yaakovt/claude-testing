'use strict';
/**
 * Move database. Every type has weak/mid/strong coverage plus status moves.
 * cat: 'phys' | 'spec' | 'status'
 * Effect vocabulary (implemented in battle.js):
 *   status:{id,pct}       inflict brn/psn/tox/par/slp/frz/confuse on foe
 *   statSelf:{stat,stages,pct} / statFoe:{stat,stages,pct}  (stat may be array)
 *   drain:0.5  recoil:0.33  multi:[2,5]  hits2:true  flinch:pct
 *   heal:0.5   weather:'rain'|...  protect:true  seed:true
 *   screen:'phys'|'spec'  levelDamage:true  neverMiss:true  highCrit:true
 *   critSelf:true (focus-energy)  rest:true  hexBoost:true
 *   rainPerfect / hailPerfect: 100% accuracy in that weather
 * anim: {fx, col[], n} — parameterized so every move looks distinct.
 */
const Moves = {};
function M(id, name, type, cat, power, acc, pp, o = {}) {
  Moves[id] = {
    id, name, type, cat, power, acc, pp,
    pri: o.pri || 0,
    effect: o.fx || null,
    contact: o.contact !== undefined ? o.contact : cat === 'phys',
    anim: o.anim || { fx: 'impact', col: ['#fff'], n: 6 },
    desc: o.desc || '',
  };
}

// ============================== NORMAL ==============================
M('tackle', 'Tackle', 'Normal', 'phys', 40, 100, 35, {
  anim: { fx: 'lunge', col: ['#e8e0d0'], n: 4 }, desc: 'A full-body charge attack.' });
M('scratch', 'Scratch', 'Normal', 'phys', 40, 100, 35, {
  anim: { fx: 'slash', col: ['#fff', '#e0d8c8'], n: 3 }, desc: 'Rakes the foe with sharp claws.' });
M('quick_jab', 'Quick Jab', 'Normal', 'phys', 40, 100, 30, { pri: 1,
  anim: { fx: 'lunge', col: ['#fff8d0'], n: 8 }, desc: 'A blinding-fast strike. Always goes first.' });
M('headbutt', 'Headbutt', 'Normal', 'phys', 70, 100, 15, { fx: { flinch: 30 },
  anim: { fx: 'impact', col: ['#f0e8d8', '#c0b8a0'], n: 8 }, desc: 'Rams headfirst. May cause flinching.' });
M('body_slam', 'Body Slam', 'Normal', 'phys', 85, 100, 15, { fx: { status: { id: 'par', pct: 30 } },
  anim: { fx: 'impact', col: ['#f8f0e0'], n: 12 }, desc: 'A crushing slam that may paralyze.' });
M('fury_swipes', 'Fury Swipes', 'Normal', 'phys', 18, 80, 15, { fx: { multi: [2, 5] },
  anim: { fx: 'slash', col: ['#fff', '#f8d8c0'], n: 5 }, desc: 'Rakes the foe 2 to 5 times.' });
M('slam', 'Slam', 'Normal', 'phys', 80, 75, 20, {
  anim: { fx: 'impact', col: ['#e8d8b8'], n: 10 }, desc: 'Slams the foe with a tail or vine.' });
M('reckless_charge', 'Reckless Charge', 'Normal', 'phys', 120, 100, 10, { fx: { recoil: 0.33 },
  anim: { fx: 'lunge', col: ['#f8e8a0', '#e05838'], n: 14 }, desc: 'A life-risking tackle that also hurts the user.' });
M('hyper_voice', 'Hyper Voice', 'Normal', 'spec', 90, 100, 10, { contact: false,
  anim: { fx: 'ring', col: ['#f0f0f0', '#a0c0f0'], n: 4 }, desc: 'A horribly loud shockwave of sound.' });
M('swift_stars', 'Swift Stars', 'Normal', 'spec', 60, null, 20, { fx: { neverMiss: true }, contact: false,
  anim: { fx: 'proj', col: ['#f8e050', '#fff'], n: 7 }, desc: 'Star-shaped rays that never miss.' });
M('growl', 'Growl', 'Normal', 'status', 0, 100, 40, { fx: { statFoe: { stat: 'atk', stages: -1 } }, contact: false,
  anim: { fx: 'ring', col: ['#e8c0c0'], n: 3 }, desc: 'Growls cutely to lower the foe\'s Attack.' });
M('leer', 'Leer', 'Normal', 'status', 0, 100, 30, { fx: { statFoe: { stat: 'def', stages: -1 } }, contact: false,
  anim: { fx: 'aura', col: ['#f0e050'], n: 5 }, desc: 'An intimidating glare that lowers Defense.' });
M('howl', 'Howl', 'Normal', 'status', 0, null, 40, { fx: { statSelf: { stat: 'atk', stages: 1 } }, contact: false,
  anim: { fx: 'aura', col: ['#f8f0e0'], n: 6 }, desc: 'Howls to rouse its fighting spirit.' });
M('harden', 'Harden', 'Normal', 'status', 0, null, 30, { fx: { statSelf: { stat: 'def', stages: 1 } }, contact: false,
  anim: { fx: 'aura', col: ['#c8c8d8'], n: 6 }, desc: 'Stiffens the body to raise Defense.' });
M('focus_energy', 'Focus Energy', 'Normal', 'status', 0, null, 30, { fx: { critSelf: true }, contact: false,
  anim: { fx: 'aura', col: ['#f8b048'], n: 8 }, desc: 'Focuses power. Critical hits land more easily.' });
M('protect', 'Protect', 'Normal', 'status', 0, null, 10, { fx: { protect: true }, pri: 4, contact: false,
  anim: { fx: 'screen', col: ['#a0e8b0'], n: 1 }, desc: 'Blocks all moves this turn. May fail if repeated.' });
M('mend', 'Mend', 'Normal', 'status', 0, null, 10, { fx: { heal: 0.5 }, contact: false,
  anim: { fx: 'heal', col: ['#a0f0a8', '#fff'], n: 10 }, desc: 'Restores up to half of max HP.' });
M('flop', 'Flop', 'Normal', 'status', 0, null, 40, { fx: {}, contact: false,
  anim: { fx: 'lunge', col: ['#c0d8f0'], n: 2 }, desc: 'Flops around. Absolutely nothing happens.' });
M('cut', 'Cut', 'Normal', 'phys', 50, 95, 30, {
  anim: { fx: 'slash', col: ['#d0e8d0', '#fff'], n: 4 }, desc: 'A basic cut. Can fell small trees outside battle.' });
M('strength', 'Strength', 'Normal', 'phys', 80, 100, 15, {
  anim: { fx: 'impact', col: ['#e8c890', '#b09060'], n: 12 }, desc: 'Raw muscle. Can shove boulders outside battle.' });
M('flash', 'Flash', 'Normal', 'status', 0, 100, 20, { fx: { statFoe: { stat: 'acc', stages: -1 } }, contact: false,
  anim: { fx: 'burst', col: ['#ffffff', '#f8f8a0'], n: 12 }, desc: 'A blinding light. Lights up caves outside battle.' });

// ============================== FIRE ==============================
M('cinder_shot', 'Cinder Shot', 'Fire', 'spec', 40, 100, 25, { fx: { status: { id: 'brn', pct: 10 } }, contact: false,
  anim: { fx: 'proj', col: ['#f8a030', '#e05020'], n: 5 }, desc: 'Spits hot cinders. May burn.' });
M('flame_wheel', 'Flame Wheel', 'Fire', 'phys', 60, 100, 25, { fx: { status: { id: 'brn', pct: 10 } },
  anim: { fx: 'lunge', col: ['#f89038', '#f8d048'], n: 10 }, desc: 'A cartwheeling fiery charge. May burn.' });
M('fire_fang', 'Fire Fang', 'Fire', 'phys', 65, 95, 15, { fx: { status: { id: 'brn', pct: 10 }, flinch: 10 },
  anim: { fx: 'bite', col: ['#f87828', '#f8c838'], n: 6 }, desc: 'Bites with flame-cloaked fangs.' });
M('fire_lance', 'Fire Lance', 'Fire', 'spec', 90, 100, 15, { fx: { status: { id: 'brn', pct: 10 } }, contact: false,
  anim: { fx: 'beam', col: ['#f86018', '#f8b030', '#fff0a0'], n: 1 }, desc: 'A searing stream of fire. May burn.' });
M('inferno_burst', 'Inferno Burst', 'Fire', 'spec', 110, 85, 5, { fx: { status: { id: 'brn', pct: 30 } }, contact: false,
  anim: { fx: 'burst', col: ['#f84818', '#f8a020', '#fff'], n: 16 }, desc: 'An all-consuming blast of flame.' });
M('blaze_charge', 'Blaze Charge', 'Fire', 'phys', 120, 100, 10, { fx: { recoil: 0.33, status: { id: 'brn', pct: 10 } },
  anim: { fx: 'lunge', col: ['#f85818', '#f8e048'], n: 16 }, desc: 'Cloaks itself in fire and crashes in. Hurts the user.' });
M('cinder_curse', 'Cinder Curse', 'Fire', 'status', 0, 85, 15, { fx: { status: { id: 'brn', pct: 100 } }, contact: false,
  anim: { fx: 'aura', col: ['#b04ad0', '#f86830'], n: 8 }, desc: 'Sinister flames that always burn the foe.' });
M('sunblessing', 'Sunblessing', 'Fire', 'status', 0, null, 5, { fx: { weather: 'sun' }, contact: false,
  anim: { fx: 'weather', col: ['#f8d868'], n: 10 }, desc: 'Intensifies the sun for 5 turns.' });
M('heat_wave', 'Heat Wave', 'Fire', 'spec', 95, 90, 10, { fx: { status: { id: 'brn', pct: 10 } }, contact: false,
  anim: { fx: 'wind', col: ['#f89048', '#f8c060'], n: 10 }, desc: 'Exhales a scorching wind. May burn.' });

// ============================== WATER ==============================
M('splash_jet', 'Splash Jet', 'Water', 'spec', 40, 100, 25, { contact: false,
  anim: { fx: 'proj', col: ['#48a0f0', '#a0d8f8'], n: 5 }, desc: 'Squirts a jet of water.' });
M('bubble_beam', 'Bubble Beam', 'Water', 'spec', 65, 100, 20, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'bubbles', col: ['#78c0f8', '#d0ecfc'], n: 10 }, desc: 'A spray of bubbles. May lower Speed.' });
M('aqua_tail', 'Aqua Tail', 'Water', 'phys', 90, 90, 10, {
  anim: { fx: 'wave', col: ['#3888e0', '#88c8f8'], n: 8 }, desc: 'Swings its tail like a raging wave.' });
M('deluge_cannon', 'Deluge Cannon', 'Water', 'spec', 110, 80, 5, { contact: false,
  anim: { fx: 'beam', col: ['#2870d8', '#70b8f8', '#e0f4ff'], n: 1 }, desc: 'Blasts water at tremendous pressure.' });
M('aqua_jet', 'Aqua Jet', 'Water', 'phys', 40, 100, 20, { pri: 1,
  anim: { fx: 'lunge', col: ['#58b0f8', '#c8e8ff'], n: 8 }, desc: 'Charges wrapped in water. Always first.' });
M('stormcall', 'Stormcall', 'Water', 'status', 0, null, 5, { fx: { weather: 'rain' }, contact: false,
  anim: { fx: 'weather', col: ['#4880d0'], n: 10 }, desc: 'Summons rain for 5 turns.' });
M('tide_hammer', 'Tide Hammer', 'Water', 'phys', 100, 90, 10, { fx: { highCrit: true },
  anim: { fx: 'impact', col: ['#3078d0', '#a8d8f8'], n: 12 }, desc: 'A crushing pincer blow. High critical-hit ratio.' });
M('surf', 'Surf', 'Water', 'spec', 90, 100, 15, { contact: false,
  anim: { fx: 'wave', col: ['#3888e8', '#a8d8f8', '#e8f8ff'], n: 12 }, desc: 'A huge wave. Can cross water outside battle.' });
M('waterfall', 'Waterfall', 'Water', 'phys', 80, 100, 15, { fx: { flinch: 20 },
  anim: { fx: 'wave', col: ['#58a8f0', '#d8f0ff'], n: 10 }, desc: 'Charges up a torrent. Can climb falls outside battle.' });

// ============================== ELECTRIC ==============================
M('spark_nip', 'Spark Nip', 'Electric', 'spec', 40, 100, 30, { fx: { status: { id: 'par', pct: 10 } }, contact: false,
  anim: { fx: 'bolt', col: ['#f8d838', '#fff'], n: 3 }, desc: 'A jolt of electricity. May paralyze.' });
M('spark_tackle', 'Spark Tackle', 'Electric', 'phys', 65, 100, 20, { fx: { status: { id: 'par', pct: 30 } },
  anim: { fx: 'lunge', col: ['#f8e048', '#f8f8c0'], n: 10 }, desc: 'An electrified charge. May paralyze.' });
M('storm_bolt', 'Storm Bolt', 'Electric', 'spec', 90, 100, 15, { fx: { status: { id: 'par', pct: 10 } }, contact: false,
  anim: { fx: 'bolt', col: ['#f8d020', '#fff', '#80c0f8'], n: 5 }, desc: 'A strong lightning strike. May paralyze.' });
M('sky_fury', 'Sky Fury', 'Electric', 'spec', 110, 70, 10, { fx: { status: { id: 'par', pct: 30 }, rainPerfect: true }, contact: false,
  anim: { fx: 'bolt', col: ['#f8e858', '#fff', '#4870d0'], n: 8 }, desc: 'A wild thunderbolt. Never misses in rain.' });
M('volt_crash', 'Volt Crash', 'Electric', 'phys', 120, 100, 10, { fx: { recoil: 0.33, status: { id: 'par', pct: 10 } },
  anim: { fx: 'lunge', col: ['#f8e030', '#fff', '#f89030'], n: 16 }, desc: 'A devastating electric tackle. Hurts the user.' });
M('static_snare', 'Static Snare', 'Electric', 'status', 0, 90, 20, { fx: { status: { id: 'par', pct: 100 } }, contact: false,
  anim: { fx: 'ring', col: ['#f8e048'], n: 4 }, desc: 'A weak charge that always paralyzes.' });
M('static_touch', 'Static Touch', 'Electric', 'phys', 20, 100, 20, { fx: { status: { id: 'par', pct: 100 } },
  anim: { fx: 'sparkle', col: ['#f8e868'], n: 6 }, desc: 'A cuddly zap that always paralyzes.' });

// ============================== GRASS ==============================
M('vine_lash', 'Vine Lash', 'Grass', 'phys', 45, 100, 25, {
  anim: { fx: 'slash', col: ['#58b048', '#88d878'], n: 3 }, desc: 'Whips the foe with slender vines.' });
M('razor_leaf', 'Razor Leaf', 'Grass', 'phys', 55, 95, 25, { fx: { highCrit: true }, contact: false,
  anim: { fx: 'petals', col: ['#48a838', '#a0e090'], n: 8 }, desc: 'Launches razor-sharp leaves. High crit ratio.' });
M('seed_bomb', 'Seed Bomb', 'Grass', 'phys', 80, 100, 15, { contact: false,
  anim: { fx: 'proj', col: ['#68a030', '#c8e8a0'], n: 6 }, desc: 'Hurls a barrage of hard-shelled seeds.' });
M('verdant_orb', 'Verdant Orb', 'Grass', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'proj', col: ['#38c058', '#c0f0a0'], n: 4 }, desc: 'Fires a sphere of life energy.' });
M('sunpierce', 'Sunpierce', 'Grass', 'spec', 120, 100, 10, { contact: false,
  anim: { fx: 'beam', col: ['#c8f060', '#f8f8b0', '#fff'], n: 1 }, desc: 'A lance of concentrated sunlight.' });
M('sap_surge', 'Sap Surge', 'Grass', 'spec', 75, 100, 10, { fx: { drain: 0.5 }, contact: false,
  anim: { fx: 'sparkle', col: ['#68d068', '#f0f8c0'], n: 10 }, desc: 'Drains nutrients. Heals half the damage dealt.' });
M('siphon_seed', 'Siphon Seed', 'Grass', 'status', 0, 90, 10, { fx: { seed: true }, contact: false,
  anim: { fx: 'proj', col: ['#88c048'], n: 3 }, desc: 'Plants a seed that saps HP every turn.' });
M('drowse_spore', 'Drowse Spore', 'Grass', 'status', 0, 75, 15, { fx: { status: { id: 'slp', pct: 100 } }, contact: false,
  anim: { fx: 'spore', col: ['#b0d868', '#e8f0a8'], n: 10 }, desc: 'Scatters sleep-inducing spores.' });
M('numb_spore', 'Numb Spore', 'Grass', 'status', 0, 75, 30, { fx: { status: { id: 'par', pct: 100 } }, contact: false,
  anim: { fx: 'spore', col: ['#e8d858', '#f0f0b0'], n: 10 }, desc: 'Scatters numbing spores that paralyze.' });
M('photomend', 'Photomend', 'Grass', 'status', 0, null, 5, { fx: { heal: 0.5 }, contact: false,
  anim: { fx: 'heal', col: ['#c8f088', '#fff'], n: 12 }, desc: 'Absorbs light to restore half of max HP.' });
M('timber_crash', 'Timber Crash', 'Grass', 'phys', 120, 100, 10, { fx: { recoil: 0.33 },
  anim: { fx: 'impact', col: ['#7a5838', '#a8d868'], n: 14 }, desc: 'Slams its whole trunk-like body in. Hurts the user.' });

// ============================== ICE ==============================
M('frost_dust', 'Frost Dust', 'Ice', 'spec', 40, 100, 25, { fx: { status: { id: 'frz', pct: 10 } }, contact: false,
  anim: { fx: 'spray', col: ['#b8ecf8', '#fff'], n: 8 }, desc: 'A puff of powdery snow. May freeze.' });
M('ice_shard', 'Ice Shard', 'Ice', 'phys', 40, 100, 30, { pri: 1, contact: false,
  anim: { fx: 'proj', col: ['#a8e0f8', '#e8fcff'], n: 5 }, desc: 'Hurls a shard of ice. Always goes first.' });
M('ice_fang', 'Ice Fang', 'Ice', 'phys', 65, 95, 15, { fx: { status: { id: 'frz', pct: 10 }, flinch: 10 },
  anim: { fx: 'bite', col: ['#88d0f0', '#e8fcff'], n: 6 }, desc: 'Bites with frost-rimed fangs.' });
M('glacier_ray', 'Glacier Ray', 'Ice', 'spec', 90, 100, 10, { fx: { status: { id: 'frz', pct: 10 } }, contact: false,
  anim: { fx: 'beam', col: ['#68c8f0', '#c8f0ff', '#fff'], n: 1 }, desc: 'A freezing beam of energy. May freeze.' });
M('whiteout', 'Whiteout', 'Ice', 'spec', 110, 70, 5, { fx: { status: { id: 'frz', pct: 10 }, hailPerfect: true }, contact: false,
  anim: { fx: 'wind', col: ['#d8f4ff', '#fff', '#90d0e8'], n: 16 }, desc: 'A howling blizzard. Never misses in hail.' });
M('icicle_crash', 'Icicle Crash', 'Ice', 'phys', 85, 90, 10, { fx: { flinch: 30 }, contact: false,
  anim: { fx: 'proj', col: ['#a0dcf8', '#fff'], n: 7 }, desc: 'Drops giant icicles. May cause flinching.' });
M('hailstorm', 'Hailstorm', 'Ice', 'status', 0, null, 10, { fx: { weather: 'hail' }, contact: false,
  anim: { fx: 'weather', col: ['#b8e8f8'], n: 10 }, desc: 'Summons a hailstorm for 5 turns.' });
M('frost_armor', 'Frost Armor', 'Ice', 'status', 0, null, 20, { fx: { statSelf: { stat: 'def', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#b8e8f8', '#fff'], n: 8 }, desc: 'Sheathes itself in ice, sharply raising Defense.' });

// ============================== FIGHTING ==============================
M('chop_strike', 'Chop Strike', 'Fighting', 'phys', 50, 100, 25, { fx: { highCrit: true },
  anim: { fx: 'slash', col: ['#e8b088'], n: 2 }, desc: 'A precise chop. High critical-hit ratio.' });
M('sweep_kick', 'Sweep Kick', 'Fighting', 'phys', 60, 100, 20, {
  anim: { fx: 'lunge', col: ['#e0a878'], n: 6 }, desc: 'A low, sweeping kick.' });
M('slab_breaker', 'Slab Breaker', 'Fighting', 'phys', 75, 100, 15, {
  anim: { fx: 'impact', col: ['#f0c898', '#fff'], n: 10 }, desc: 'A karate chop that shatters barriers.' });
M('all_out_assault', 'All-Out Assault', 'Fighting', 'phys', 120, 100, 5, { fx: { statSelf: { stat: ['def', 'spd'], stages: -1 } },
  anim: { fx: 'impact', col: ['#f09048', '#fff', '#e05838'], n: 16 }, desc: 'Attacks with everything, dropping its guard.' });
M('blur_punch', 'Blur Punch', 'Fighting', 'phys', 40, 100, 30, { pri: 1,
  anim: { fx: 'lunge', col: ['#f8e8c8'], n: 8 }, desc: 'A punch faster than the eye. Always first.' });
M('muscle_flex', 'Muscle Flex', 'Fighting', 'status', 0, null, 20, { fx: { statSelf: { stat: ['atk', 'def'], stages: 1 } }, contact: false,
  anim: { fx: 'aura', col: ['#f08858'], n: 8 }, desc: 'Bulks up, raising Attack and Defense.' });
M('chi_cannon', 'Chi Cannon', 'Fighting', 'spec', 110, 70, 5, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'proj', col: ['#e8d888', '#f8f8e0'], n: 3 }, desc: 'Hurls a sphere of fighting spirit.' });
M('rock_smash', 'Rock Smash', 'Fighting', 'phys', 40, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 50 } },
  anim: { fx: 'rocks', col: ['#b09878', '#e8d8c0'], n: 8 }, desc: 'A boulder-cracking punch. Breaks rocks outside battle.' });

// ============================== POISON ==============================
M('venom_barb', 'Venom Barb', 'Poison', 'phys', 15, 100, 35, { fx: { status: { id: 'psn', pct: 30 } }, contact: false,
  anim: { fx: 'proj', col: ['#a058c0', '#d0a0e8'], n: 4 }, desc: 'A toxic stinger. May poison.' });
M('sludge', 'Sludge', 'Poison', 'spec', 65, 100, 20, { fx: { status: { id: 'psn', pct: 30 } }, contact: false,
  anim: { fx: 'proj', col: ['#8848a8', '#b880d0'], n: 6 }, desc: 'Hurls filthy sludge. May poison.' });
M('sludge_blast', 'Sludge Blast', 'Poison', 'spec', 90, 100, 10, { fx: { status: { id: 'psn', pct: 30 } }, contact: false,
  anim: { fx: 'burst', col: ['#7838a0', '#c088e0'], n: 12 }, desc: 'A filthy blast of sludge. May poison.' });
M('refuse_fling', 'Refuse Fling', 'Poison', 'phys', 120, 80, 5, { fx: { status: { id: 'psn', pct: 30 } }, contact: false,
  anim: { fx: 'proj', col: ['#684888', '#a878c8'], n: 9 }, desc: 'Flings a mass of toxic refuse.' });
M('blightbrew', 'Blightbrew', 'Poison', 'status', 0, 90, 10, { fx: { status: { id: 'tox', pct: 100 } }, contact: false,
  anim: { fx: 'aura', col: ['#8838a8', '#502870'], n: 8 }, desc: 'Badly poisons with worsening venom.' });
M('venom_dust', 'Venom Dust', 'Poison', 'status', 0, 75, 35, { fx: { status: { id: 'psn', pct: 100 } }, contact: false,
  anim: { fx: 'spore', col: ['#b068d0', '#e0b0f0'], n: 10 }, desc: 'Scatters poisonous dust.' });
M('ooze_shell', 'Ooze Shell', 'Poison', 'status', 0, null, 20, { fx: { statSelf: { stat: 'def', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#a068c8'], n: 8 }, desc: 'Liquefies its body, sharply raising Defense.' });
M('fang_of_rot', 'Fang of Rot', 'Poison', 'phys', 70, 100, 15, { fx: { status: { id: 'psn', pct: 30 } },
  anim: { fx: 'bite', col: ['#9850b8', '#d8a8e8'], n: 6 }, desc: 'Bites with festering fangs. May poison.' });

// ============================== GROUND ==============================
M('mud_fling', 'Mud Fling', 'Ground', 'spec', 20, 100, 10, { fx: { statFoe: { stat: 'acc', stages: -1, pct: 100 } }, contact: false,
  anim: { fx: 'proj', col: ['#a07848', '#c8a878'], n: 5 }, desc: 'Flings mud in the face, cutting accuracy.' });
M('mud_shot', 'Mud Shot', 'Ground', 'spec', 55, 95, 15, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 100 } }, contact: false,
  anim: { fx: 'proj', col: ['#987048', '#c0a070'], n: 6 }, desc: 'A blast of mud that lowers Speed.' });
M('burrow_strike', 'Burrow Strike', 'Ground', 'phys', 80, 100, 10, {
  anim: { fx: 'quake', col: ['#b08850', '#d8c098'], n: 8 }, desc: 'Bursts up at the foe from below.' });
M('earthshatter', 'Earthshatter', 'Ground', 'phys', 100, 100, 10, { contact: false,
  anim: { fx: 'quake', col: ['#a88048', '#e0c890'], n: 14 }, desc: 'A colossal quake that splits the ground.' });
M('ground_surge', 'Ground Surge', 'Ground', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'quake', col: ['#c89050', '#f8d878'], n: 10 }, desc: 'Vents seismic power up under the foe.' });
M('bulldoze', 'Bulldoze', 'Ground', 'phys', 60, 100, 20, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 100 } }, contact: false,
  anim: { fx: 'quake', col: ['#a88858'], n: 8 }, desc: 'Stomps the ground, lowering the foe\'s Speed.' });
M('sand_veil', 'Sand Veil', 'Ground', 'status', 0, 100, 15, { fx: { statFoe: { stat: 'acc', stages: -1 } }, contact: false,
  anim: { fx: 'spray', col: ['#d8c088'], n: 8 }, desc: 'Kicks sand into the foe\'s eyes.' });

// ============================== FLYING ==============================
M('wind_gust', 'Wind Gust', 'Flying', 'spec', 40, 100, 35, { contact: false,
  anim: { fx: 'wind', col: ['#c8d8e8', '#fff'], n: 6 }, desc: 'Strikes with a whipped-up gust.' });
M('peck', 'Peck', 'Flying', 'phys', 35, 100, 35, {
  anim: { fx: 'lunge', col: ['#e8e8f0'], n: 3 }, desc: 'Jabs with a sharp beak.' });
M('wing_strike', 'Wing Strike', 'Flying', 'phys', 60, 100, 35, {
  anim: { fx: 'slash', col: ['#d8e0f0', '#fff'], n: 3 }, desc: 'Strikes with spread wings.' });
M('sky_cutter', 'Sky Cutter', 'Flying', 'phys', 60, null, 20, { fx: { neverMiss: true },
  anim: { fx: 'slash', col: ['#a8c0e8', '#fff'], n: 4 }, desc: 'An unavoidable aerial slice.' });
M('gale_blade', 'Gale Blade', 'Flying', 'spec', 75, 95, 15, { fx: { flinch: 30 }, contact: false,
  anim: { fx: 'wind', col: ['#98b8e8', '#e8f0ff'], n: 8 }, desc: 'A blade of compressed air. May cause flinching.' });
M('dive_bomber', 'Dive Bomber', 'Flying', 'phys', 120, 100, 15, { fx: { recoil: 0.33 },
  anim: { fx: 'lunge', col: ['#88a8e0', '#fff'], n: 14 }, desc: 'A reckless full-speed dive. Hurts the user.' });
M('cyclone', 'Cyclone', 'Flying', 'spec', 110, 70, 10, { fx: { status: { id: 'confuse', pct: 30 }, rainPerfect: true }, contact: false,
  anim: { fx: 'wind', col: ['#78a0d8', '#c8e0f8', '#fff'], n: 14 }, desc: 'A raging windstorm. Never misses in rain.' });
M('fly', 'Fly', 'Flying', 'phys', 90, 95, 15, {
  anim: { fx: 'lunge', col: ['#b8d0f0', '#fff'], n: 10 }, desc: 'A swooping strike. Travels between towns outside battle.' });
M('wind_rest', 'Wind Rest', 'Flying', 'status', 0, null, 10, { fx: { heal: 0.5 }, contact: false,
  anim: { fx: 'heal', col: ['#c8e0f8', '#fff'], n: 10 }, desc: 'Lands and rests, restoring half of max HP.' });

// ============================== PSYCHIC ==============================
M('confusion', 'Confusion', 'Psychic', 'spec', 50, 100, 25, { fx: { status: { id: 'confuse', pct: 10 } }, contact: false,
  anim: { fx: 'ring', col: ['#e888b8', '#f8d0e8'], n: 3 }, desc: 'A weak telekinetic strike. May confuse.' });
M('psybeam', 'Psybeam', 'Psychic', 'spec', 65, 100, 20, { fx: { status: { id: 'confuse', pct: 10 } }, contact: false,
  anim: { fx: 'beam', col: ['#e878b0', '#a878e0', '#fff'], n: 1 }, desc: 'A rainbow ray. May confuse.' });
M('mind_crush', 'Mind Crush', 'Psychic', 'spec', 90, 100, 10, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'ring', col: ['#e858a0', '#8858d0'], n: 6 }, desc: 'Crushes the foe with psychic force.' });
M('psi_blade', 'Psi Blade', 'Psychic', 'phys', 70, 100, 20, { fx: { highCrit: true },
  anim: { fx: 'slash', col: ['#e880c0', '#fff'], n: 4 }, desc: 'A blade of will. High critical-hit ratio.' });
M('zen_ram', 'Zen Ram', 'Psychic', 'phys', 80, 90, 15, { fx: { flinch: 20 },
  anim: { fx: 'lunge', col: ['#e890c8', '#a8e8f0'], n: 8 }, desc: 'A focused headbutt. May cause flinching.' });
M('mind_temper', 'Mind Temper', 'Psychic', 'status', 0, null, 20, { fx: { statSelf: { stat: ['spa', 'spd'], stages: 1 } }, contact: false,
  anim: { fx: 'aura', col: ['#e8a0d0', '#c0c8f8'], n: 8 }, desc: 'Calms the mind, raising Sp. Atk and Sp. Def.' });
M('quickening', 'Quickening', 'Psychic', 'status', 0, null, 30, { fx: { statSelf: { stat: 'spe', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#f0c0e0', '#fff'], n: 10 }, desc: 'Lightens the body, sharply raising Speed.' });
M('mesmerize', 'Mesmerize', 'Psychic', 'status', 0, 60, 20, { fx: { status: { id: 'slp', pct: 100 } }, contact: false,
  anim: { fx: 'ring', col: ['#c068d8', '#8048a8'], n: 5 }, desc: 'Hypnotic waves that induce sleep.' });
M('rest', 'Rest', 'Psychic', 'status', 0, null, 10, { fx: { rest: true }, contact: false,
  anim: { fx: 'heal', col: ['#a8c8f0', '#fff'], n: 8 }, desc: 'Sleeps for 2 turns to fully restore HP.' });
M('mind_veil', 'Mind Veil', 'Psychic', 'status', 0, null, 30, { fx: { screen: 'spec' }, contact: false,
  anim: { fx: 'screen', col: ['#e8b0e0'], n: 1 }, desc: 'A barrier that halves special damage for 5 turns.' });
M('guard_wall', 'Guard Wall', 'Psychic', 'status', 0, null, 20, { fx: { screen: 'phys' }, contact: false,
  anim: { fx: 'screen', col: ['#a0b8f0'], n: 1 }, desc: 'A barrier that halves physical damage for 5 turns.' });
M('dream_pulse', 'Dream Pulse', 'Psychic', 'spec', 100, 100, 10, { fx: { hexBoost: true }, contact: false,
  anim: { fx: 'ring', col: ['#c878e8', '#f0c0f8', '#fff'], n: 7 }, desc: 'Doubles in power on a sleeping foe.' });

// ============================== BUG ==============================
M('nibble', 'Nibble', 'Bug', 'phys', 40, 100, 35, {
  anim: { fx: 'bite', col: ['#a8c040'], n: 4 }, desc: 'Bites with tiny mandibles.' });
M('silk_bind', 'Silk Bind', 'Bug', 'status', 0, 95, 40, { fx: { statFoe: { stat: 'spe', stages: -2 } }, contact: false,
  anim: { fx: 'spray', col: ['#f0f0e0', '#d8d8c0'], n: 8 }, desc: 'Binds the foe in silk, sharply lowering Speed.' });
M('twin_sting', 'Twin Sting', 'Bug', 'phys', 25, 100, 20, { fx: { hits2: true, status: { id: 'psn', pct: 20 } }, contact: false,
  anim: { fx: 'proj', col: ['#c8d048', '#fff'], n: 2 }, desc: 'Stings twice with paired needles. May poison.' });
M('prism_wing', 'Prism Wing', 'Bug', 'spec', 75, 100, 15, { fx: { status: { id: 'confuse', pct: 10 } }, contact: false,
  anim: { fx: 'beam', col: ['#b8d048', '#e8f088', '#88c8e8'], n: 1 }, desc: 'A strange shimmering beam. May confuse.' });
M('cross_scythe', 'Cross Scythe', 'Bug', 'phys', 80, 100, 15, {
  anim: { fx: 'slash', col: ['#a8c848', '#e8f8c0'], n: 4 }, desc: 'Slashes in a deadly X pattern.' });
M('great_horn', 'Great Horn', 'Bug', 'phys', 120, 85, 10, {
  anim: { fx: 'lunge', col: ['#98b838', '#e8f0c0'], n: 12 }, desc: 'A ferocious full-power horn thrust.' });
M('scale_gale', 'Scale Gale', 'Bug', 'spec', 60, 100, 25, { fx: { statSelf: { stat: ['atk', 'def', 'spa', 'spd', 'spe'], stages: 1, pct: 10 } }, contact: false,
  anim: { fx: 'wind', col: ['#c8d868', '#f0f8d0'], n: 10 }, desc: 'Silver scales on the wind. May raise all stats.' });
M('sap_bite', 'Sap Bite', 'Bug', 'phys', 80, 100, 10, { fx: { drain: 0.5 },
  anim: { fx: 'bite', col: ['#b0c848', '#f08080'], n: 6 }, desc: 'Drains life. Heals half the damage dealt.' });

// ============================== ROCK ==============================
M('rock_throw', 'Rock Throw', 'Rock', 'phys', 50, 90, 15, { contact: false,
  anim: { fx: 'rocks', col: ['#b09878', '#786048'], n: 4 }, desc: 'Hurls a small boulder.' });
M('rock_slide', 'Rock Slide', 'Rock', 'phys', 75, 90, 10, { fx: { flinch: 30 }, contact: false,
  anim: { fx: 'rocks', col: ['#a89070', '#685844'], n: 8 }, desc: 'An avalanche of boulders. May cause flinching.' });
M('stone_spike', 'Stone Spike', 'Rock', 'phys', 100, 80, 5, { fx: { highCrit: true }, contact: false,
  anim: { fx: 'rocks', col: ['#98805c', '#e8e0d0'], n: 6 }, desc: 'Impales with stone pillars. High crit ratio.' });
M('pebble_volley', 'Pebble Volley', 'Rock', 'phys', 25, 90, 10, { fx: { multi: [2, 5] }, contact: false,
  anim: { fx: 'rocks', col: ['#b0a080'], n: 3 }, desc: 'Fires pebbles 2 to 5 times.' });
M('relic_power', 'Relic Power', 'Rock', 'spec', 60, 100, 5, { fx: { statSelf: { stat: ['atk', 'def', 'spa', 'spd', 'spe'], stages: 1, pct: 10 } }, contact: false,
  anim: { fx: 'sparkle', col: ['#c8b088', '#f8f0d8'], n: 8 }, desc: 'Ancient energy. May raise all of the user\'s stats.' });
M('stone_polish', 'Stone Polish', 'Rock', 'status', 0, null, 20, { fx: { statSelf: { stat: 'spe', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#d8c8a8', '#fff'], n: 8 }, desc: 'Polishes its body, sharply raising Speed.' });
M('rock_tomb', 'Rock Tomb', 'Rock', 'phys', 60, 95, 15, { fx: { statFoe: { stat: 'spe', stages: -1, pct: 100 } }, contact: false,
  anim: { fx: 'rocks', col: ['#907c5c', '#c8b898'], n: 6 }, desc: 'Traps the foe under rocks, lowering Speed.' });
M('duststorm', 'Duststorm', 'Rock', 'status', 0, null, 10, { fx: { weather: 'sandstorm' }, contact: false,
  anim: { fx: 'weather', col: ['#c8a868'], n: 10 }, desc: 'Whips up a sandstorm for 5 turns.' });

// ============================== GHOST ==============================
M('lick', 'Lick', 'Ghost', 'phys', 30, 100, 30, { fx: { status: { id: 'par', pct: 30 } },
  anim: { fx: 'slash', col: ['#c0a0e0'], n: 2 }, desc: 'A ghostly lick. May paralyze.' });
M('astonish', 'Astonish', 'Ghost', 'phys', 30, 100, 15, { fx: { flinch: 30 },
  anim: { fx: 'burst', col: ['#9070c8', '#fff'], n: 6 }, desc: 'A startling shout. May cause flinching.' });
M('shade_sneak', 'Shade Sneak', 'Ghost', 'phys', 40, 100, 30, { pri: 1,
  anim: { fx: 'lunge', col: ['#605080', '#a890d0'], n: 6 }, desc: 'Strikes from the shadows. Always first.' });
M('phantom_orb', 'Phantom Orb', 'Ghost', 'spec', 90, 100, 15, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 20 } }, contact: false,
  anim: { fx: 'proj', col: ['#7858b0', '#c0a8e8'], n: 4 }, desc: 'Hurls a shadowy blob. May lower Sp. Def.' });
M('spectral_claw', 'Spectral Claw', 'Ghost', 'phys', 70, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'slash', col: ['#8868c0', '#e0d0f8'], n: 4 }, desc: 'Slashes with a shadowy claw. High crit ratio.' });
M('gloom_veil', 'Gloom Veil', 'Ghost', 'spec', 0, 100, 15, { fx: { levelDamage: true }, contact: false,
  anim: { fx: 'aura', col: ['#504070', '#8878b0'], n: 8 }, desc: 'Deals damage equal to the user\'s level.' });
M('wisp_lure', 'Wisp Lure', 'Ghost', 'status', 0, 100, 10, { fx: { status: { id: 'confuse', pct: 100 } }, contact: false,
  anim: { fx: 'sparkle', col: ['#a888e0', '#e8e0f8'], n: 6 }, desc: 'Eerie lights that confuse the foe.' });
M('haunt', 'Haunt', 'Ghost', 'spec', 65, 100, 10, { fx: { hexBoost: true }, contact: false,
  anim: { fx: 'burst', col: ['#684898', '#b898e0'], n: 10 }, desc: 'Doubles in power on a status-afflicted foe.' });

// ============================== DRAGON ==============================
M('dragon_breath', 'Dragon Breath', 'Dragon', 'spec', 60, 100, 20, { fx: { status: { id: 'par', pct: 30 } }, contact: false,
  anim: { fx: 'beam', col: ['#6858d8', '#a8e0f0', '#fff'], n: 1 }, desc: 'A gust of dragon breath. May paralyze.' });
M('dragon_claw', 'Dragon Claw', 'Dragon', 'phys', 80, 100, 15, {
  anim: { fx: 'slash', col: ['#7860d8', '#c8c0f8'], n: 4 }, desc: 'Slashes with enormous claws.' });
M('wyrm_pulse', 'Wyrm Pulse', 'Dragon', 'spec', 85, 100, 10, { contact: false,
  anim: { fx: 'ring', col: ['#6850d0', '#b0a0f0', '#fff'], n: 5 }, desc: 'A shockwave of draconic power.' });
M('primal_rage', 'Primal Rage', 'Dragon', 'phys', 110, 100, 10, {
  anim: { fx: 'lunge', col: ['#6048c8', '#e05858'], n: 14 }, desc: 'Rampages with primordial fury.' });
M('wyrm_dance', 'Wyrm Dance', 'Dragon', 'status', 0, null, 20, { fx: { statSelf: { stat: ['atk', 'spe'], stages: 1 } }, contact: false,
  anim: { fx: 'aura', col: ['#8068e0', '#e8c0f0'], n: 10 }, desc: 'A mystic dance raising Attack and Speed.' });
M('star_cataclysm', 'Star Cataclysm', 'Dragon', 'spec', 130, 90, 5, { fx: { statSelf: { stat: 'spa', stages: -2 } }, contact: false,
  anim: { fx: 'proj', col: ['#7858e0', '#f8d048', '#fff'], n: 9 }, desc: 'Calls down falling stars, draining Sp. Atk.' });
M('twister', 'Twister', 'Dragon', 'spec', 40, 100, 20, { fx: { flinch: 20 }, contact: false,
  anim: { fx: 'wind', col: ['#8878d8', '#c8c0f0'], n: 8 }, desc: 'A small draconic tornado. May cause flinching.' });
M('aurora_cataclysm', 'Aurora Cataclysm', 'Dragon', 'spec', 120, 90, 5, { fx: { status: { id: 'par', pct: 20 } }, contact: false,
  anim: { fx: 'beam', col: ['#58e8b8', '#8888f8', '#f888d8'], n: 1 }, desc: 'AURORYX\'s signature: the aurora itself as a weapon.' });

// ============================== DARK ==============================
M('bite', 'Bite', 'Dark', 'phys', 60, 100, 25, { fx: { flinch: 30 },
  anim: { fx: 'bite', col: ['#584838', '#e8e0d0'], n: 6 }, desc: 'Bites hard. May cause flinching.' });
M('crunch', 'Crunch', 'Dark', 'phys', 80, 100, 15, { fx: { statFoe: { stat: 'def', stages: -1, pct: 20 } },
  anim: { fx: 'bite', col: ['#483828', '#fff'], n: 8 }, desc: 'Crunches with crushing fangs. May lower Defense.' });
M('night_slash', 'Night Slash', 'Dark', 'phys', 70, 100, 15, { fx: { highCrit: true },
  anim: { fx: 'slash', col: ['#403048', '#a890c0'], n: 4 }, desc: 'A shadowy slash. High critical-hit ratio.' });
M('dread_pulse', 'Dread Pulse', 'Dark', 'spec', 80, 100, 15, { fx: { flinch: 20 }, contact: false,
  anim: { fx: 'ring', col: ['#483858', '#906090'], n: 5 }, desc: 'A wave of pure malice. May cause flinching.' });
M('cheap_shot', 'Cheap Shot', 'Dark', 'phys', 45, 100, 20, { pri: 1,
  anim: { fx: 'lunge', col: ['#504058'], n: 6 }, desc: 'A dirty surprise strike. Always goes first.' });
M('wicked_scheme', 'Wicked Scheme', 'Dark', 'status', 0, null, 20, { fx: { statSelf: { stat: 'spa', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#584868', '#c05868'], n: 8 }, desc: 'Plots something nasty, sharply raising Sp. Atk.' });
M('snarl', 'Snarl', 'Dark', 'spec', 55, 95, 15, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 100 } }, contact: false,
  anim: { fx: 'ring', col: ['#605068'], n: 4 }, desc: 'A vicious snarl that lowers Sp. Atk.' });
M('shadow_maw', 'Shadow Maw', 'Dark', 'phys', 100, 90, 10, {
  anim: { fx: 'bite', col: ['#302838', '#8060a0'], n: 10 }, desc: 'Devours the foe in living shadow.' });

// ============================== STEEL ==============================
M('metal_claw', 'Metal Claw', 'Steel', 'phys', 50, 95, 35, { fx: { statSelf: { stat: 'atk', stages: 1, pct: 10 } },
  anim: { fx: 'slash', col: ['#b8c0d0', '#fff'], n: 3 }, desc: 'Steel claws. May raise the user\'s Attack.' });
M('iron_ram', 'Iron Ram', 'Steel', 'phys', 80, 100, 15, { fx: { flinch: 30 },
  anim: { fx: 'lunge', col: ['#a8b0c0', '#e8ecf0'], n: 10 }, desc: 'An iron-hard headbutt. May cause flinching.' });
M('steel_wing', 'Steel Wing', 'Steel', 'phys', 70, 90, 25, { fx: { statSelf: { stat: 'def', stages: 1, pct: 10 } },
  anim: { fx: 'slash', col: ['#c0c8d8', '#fff'], n: 4 }, desc: 'Hardened wings. May raise the user\'s Defense.' });
M('chrome_cannon', 'Chrome Cannon', 'Steel', 'spec', 80, 100, 10, { fx: { statFoe: { stat: 'spd', stages: -1, pct: 10 } }, contact: false,
  anim: { fx: 'beam', col: ['#a8b8c8', '#e8f0f8', '#fff'], n: 1 }, desc: 'A beam of focused light metal. May lower Sp. Def.' });
M('plate_guard', 'Plate Guard', 'Steel', 'status', 0, null, 15, { fx: { statSelf: { stat: 'def', stages: 2 } }, contact: false,
  anim: { fx: 'aura', col: ['#b8c0d0', '#fff'], n: 8 }, desc: 'Locks armor plates, sharply raising Defense.' });
M('comet_fist', 'Comet Fist', 'Steel', 'phys', 90, 90, 10, { fx: { statSelf: { stat: 'atk', stages: 1, pct: 20 } },
  anim: { fx: 'impact', col: ['#98a8c0', '#f8f8ff'], n: 12 }, desc: 'A meteoric punch. May raise the user\'s Attack.' });
M('shriek_of_tin', 'Shriek of Tin', 'Steel', 'status', 0, 85, 40, { fx: { statFoe: { stat: 'spd', stages: -2 } }, contact: false,
  anim: { fx: 'ring', col: ['#c8d0d8'], n: 4 }, desc: 'A grating metallic screech, sharply lowering Sp. Def.' });
M('anchor_slam', 'Anchor Slam', 'Steel', 'phys', 100, 90, 10, { contact: false,
  anim: { fx: 'impact', col: ['#8894a8', '#404c60'], n: 14 }, desc: 'Slams down a massive anchor of steel.' });

// ============================== FAIRY ==============================
M('fae_wind', 'Fae Wind', 'Fairy', 'spec', 40, 100, 30, { contact: false,
  anim: { fx: 'wind', col: ['#f8c0e8', '#fff'], n: 6 }, desc: 'A twinkling little whirlwind.' });
M('glimmer_kiss', 'Glimmer Kiss', 'Fairy', 'spec', 50, 100, 10, { fx: { drain: 0.75 }, contact: false,
  anim: { fx: 'sparkle', col: ['#f8a8d8', '#fff'], n: 8 }, desc: 'A draining kiss. Heals 75% of damage dealt.' });
M('prism_flare', 'Prism Flare', 'Fairy', 'spec', 80, 100, 10, { contact: false,
  anim: { fx: 'burst', col: ['#f8b0e0', '#b0d8f8', '#fff'], n: 12 }, desc: 'A dazzling flash of prismatic light.' });
M('moonveil_blast', 'Moonveil Blast', 'Fairy', 'spec', 95, 100, 15, { fx: { statFoe: { stat: 'spa', stages: -1, pct: 30 } }, contact: false,
  anim: { fx: 'proj', col: ['#e8a0e8', '#f8e8ff'], n: 5 }, desc: 'Moonlight condensed into force. May lower Sp. Atk.' });
M('rough_tumble', 'Rough Tumble', 'Fairy', 'phys', 90, 90, 10, { fx: { statFoe: { stat: 'atk', stages: -1, pct: 10 } },
  anim: { fx: 'impact', col: ['#f8b8e0', '#f8f0c0'], n: 10 }, desc: 'Plays impossibly rough. May lower Attack.' });
M('sugar_kiss', 'Sugar Kiss', 'Fairy', 'status', 0, 75, 10, { fx: { status: { id: 'confuse', pct: 100 } }, contact: false,
  anim: { fx: 'sparkle', col: ['#f8c8e8'], n: 5 }, desc: 'A sweet kiss that leaves the foe reeling.' });
M('charm', 'Charm', 'Fairy', 'status', 0, 100, 20, { fx: { statFoe: { stat: 'atk', stages: -2 } }, contact: false,
  anim: { fx: 'sparkle', col: ['#f8a0c8', '#fff'], n: 6 }, desc: 'Charms the foe, sharply lowering Attack.' });
M('starlight_heal', 'Starlight Heal', 'Fairy', 'status', 0, null, 10, { fx: { heal: 0.5 }, contact: false,
  anim: { fx: 'heal', col: ['#f8d8f0', '#fff'], n: 12 }, desc: 'Bathes in starlight, restoring half of max HP.' });

// ============================== ELECTRIC (signature) ==============================
M('stormheart_ray', 'Stormheart Ray', 'Electric', 'spec', 100, 100, 10, { fx: { status: { id: 'par', pct: 20 } }, contact: false,
  anim: { fx: 'beam', col: ['#f8e858', '#58e8b8', '#fff'], n: 1 }, desc: 'A ray from the storm\'s own heart. May paralyze.' });
