'use strict';
/**
 * Attack-animation variety pass. Moves authored with the generic 'impact' or
 * 'lunge' fx are re-skinned to a type-flavored effect (fire licks flame, ice
 * shatters shards, psychic pulses rings, etc.), keeping each move's own colors.
 * A few signature/ultimate moves get a full explosion. Runs after moves load.
 */
(() => {
  const TYPE_FX = {
    Fire: 'flames', Ice: 'iceshards', Electric: 'shock', Psychic: 'psywave',
    Fairy: 'fairydust', Poison: 'venom', Dragon: 'vortex', Ghost: 'phantom',
    Rock: 'crush', Ground: 'crush', Fighting: 'crush', Steel: 'crush',
  };
  const GENERIC = { impact: 1, lunge: 1 };
  for (const id in Moves) {
    const m = Moves[id];
    if (!m.anim || !GENERIC[m.anim.fx]) continue;
    const fx = TYPE_FX[m.type];
    if (fx) m.anim = Object.assign({}, m.anim, { fx, n: Math.max(m.anim.n || 6, 8) });
  }
  // Ultimate specials: a proper explosion.
  for (const id of ['aurora_cataclysm', 'star_cataclysm']) {
    if (Moves[id]) Moves[id].anim = Object.assign({}, Moves[id].anim, { fx: 'explosion', n: 14 });
  }
  if (Moves.wyrmflare) Moves.wyrmflare.anim = Object.assign({}, Moves.wyrmflare.anim, { fx: 'flames', n: 14 });
  if (Moves.twilight_requiem) Moves.twilight_requiem.anim = Object.assign({}, Moves.twilight_requiem.anim, { fx: 'psywave', n: 12 });
})();
