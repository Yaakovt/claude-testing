'use strict';
/**
 * Second abilities & signatures, applied after the whole dex has loaded.
 *
 * - SECONDARY: species that gain a 2nd possible ability. A Mon rolls one of its
 *   listed abilities at random on creation (see js/battle/pokemon.js).
 * - SIGNATURE_ABILITY: a unique ability owned by exactly one species.
 * - SIGNATURE_MOVE: a unique move appended to that species' learnset.
 *
 * Everything is guarded so a stale key is skipped rather than crashing.
 */
(() => {
  // key -> a second ability the species can roll (primary stays its listed one)
  const SECONDARY = {
    // starters & their mid stages
    trollsprout: 'moss_mend', bryteknott: 'grit', cindrel: 'inner_ember', pyrolisk: 'inner_ember',
    selkip: 'spring_sponge', selkora: 'spring_sponge',
    // common lines
    sprigfawn: 'sun_chaser', mossbuck: 'sun_chaser', puffinch: 'updraft', galewing: 'gale_force',
    sparkit: 'keen_edge', zapkid: 'storm_drinker', thundram: 'stormrider',
    frostkit: 'permafrost', yetiling: 'snow_skater', walrust: 'permafrost', shiverfin: 'permafrost',
    oreling: 'stone_hide', boulderam: 'bedrock', ingotaur: 'ironclad', drillvole: 'sand_rush',
    nibbit: 'grit', scrappup: 'keen_edge', ramlet: 'stone_hide', pineling: 'moss_mend',
    sporeling: 'dream_dust', myceloom: 'moss_mend', conifurze: 'bedrock',
    wispurr: 'sharp_vision', mystrix: 'sharp_vision', dreamlyn: 'fae_eater', bellsylph: 'fae_eater',
    vulpaura: 'sun_chaser', sylphund: 'fae_eater', chimebud: 'clear_mind',
    grimcorvid: 'keen_edge', corvusk: 'keen_edge', stormgull: 'stormrider', skjaldhawk: 'sharp_vision',
    gulomaul: 'grit', ursnow: 'permafrost', trolltoad: 'venom_coat', nokkmare: 'spring_sponge',
    geysmog: 'venom_coat', sulfimer: 'inner_ember', cindercrag: 'heatproof', pyrelight: 'flame_eater',
    fjorddrake: 'mystic_scales', frystdrake: 'permafrost', wyrmskim: 'mystic_scales', jarnwyrm: 'ironclad',
    fimbulwyrm: 'mystic_scales', reefclad: 'spring_sponge', emperoyal: 'permafrost', mantasurge: 'storm_drinker',
    umbrafloe: 'permafrost', nocturnyx: 'clear_mind', prismarok: 'prism_body', aurorpix: 'sharp_vision',
    terrawyrm: 'sand_rush',
  };

  // one-of-a-kind abilities (replace the species' listed ability)
  const SIGNATURE_ABILITY = {
    jotunwald: 'titanroot', fafnirn: 'wyrmfire', krakelott: 'deepcurrent',
    magnadrake: 'magma_core', vesperyx: 'dusk_aegis',
  };

  // one-of-a-kind moves, appended to the species' learnset at the given level
  const SIGNATURE_MOVE = {
    jotunwald: [55, 'gaias_wrath'], fafnirn: [55, 'wyrmflare'], krakelott: [55, 'abyss_maw'],
    magnadrake: [60, 'tectonic_roar'], vesperyx: [60, 'twilight_requiem'],
  };

  for (const key in SECONDARY) {
    const d = Dex.byKey[key]; const ab = SECONDARY[key];
    if (!d || !Abilities[ab] || ab === d.ability) continue;
    d.abilities = [d.ability, ab];
  }
  for (const key in SIGNATURE_ABILITY) {
    const d = Dex.byKey[key]; const ab = SIGNATURE_ABILITY[key];
    if (!d || !Abilities[ab]) continue;
    d.ability = ab; d.abilities = [ab];   // truly unique — no random roll
  }
  for (const key in SIGNATURE_MOVE) {
    const d = Dex.byKey[key]; const [lv, mv] = SIGNATURE_MOVE[key];
    if (!d || !Moves[mv]) continue;
    if (!d.learn.some(([, id]) => id === mv)) d.learn.push([lv, mv]);
  }
})();
