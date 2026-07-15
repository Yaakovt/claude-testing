'use strict';
/**
 * Item database.
 * kind: 'ball' | 'medicine' | 'battle' | 'stone' | 'tm' | 'key' | 'misc' | 'held'
 * Balls may define ballMod(mon, ctx) -> multiplier (ctx = {turn, env, level});
 * otherwise the flat ballMult is used.
 * Held items define held-effect fields consumed by the battle engine:
 *   leftovers:1/16        heal each turn end
 *   typeBoost:{type,mult} 1.2x power for that move type
 *   focusCharm:true       survive a KO from full HP (consumed)
 *   cureBerry:true        auto-cure any status (consumed)
 *   pinchBerry:frac       restore frac of max HP when below 1/4 (consumed)
 *   preventEvo:true       holder can't evolve
 */
const Items = {};
function I(id, name, kind, price, desc, o = {}) {
  Items[id] = Object.assign({ id, name, kind, price, desc }, o);
}

// ---- Orbs (this region's capture device) ----
I('fieldorb', 'Fieldorb', 'ball', 200, 'A standard orb for catching wild fakemon.', { ballMult: 1 });
I('greatorb', 'Greatorb', 'ball', 600, 'A high-grade orb with a better catch rate.', { ballMult: 1.5 });
I('ultraorb', 'Ultraorb', 'ball', 1200, 'A top-grade orb with a superb catch rate.', { ballMult: 2 });
I('meshorb', 'Meshorb', 'ball', 1000, 'Catches Water- and Bug-type fakemon far more easily.',
  { ballMult: 1, ballMod: (m) => (m.types.includes('Water') || m.types.includes('Bug')) ? 3.5 : 1 });
I('gloomorb', 'Gloomorb', 'ball', 1000, 'Excels in the dark of caves and deep places.',
  { ballMult: 1, ballMod: (m, c) => c.env === 'cave' ? 3.5 : 1 });
I('rushorb', 'Rushorb', 'ball', 1000, 'Works wonderfully on the very first turn of a battle.',
  { ballMult: 1, ballMod: (m, c) => c.turn === 0 ? 5 : 1 });
I('denorb', 'Denorb', 'ball', 1000, 'The lower the wild fakemon\'s level, the better it works.',
  { ballMult: 1, ballMod: (m) => Math.max(1, Math.min(4, (41 - m.level) / 10)) });
I('primeorb', 'Primeorb', 'ball', 0, 'Team Ionar\'s stolen prototype. Its aurora-charged coil subdues ANY fakemon without fail. Only one exists.',
  { ballMult: 255, unique: true });

// ---- Medicine ----
I('potion', 'Potion', 'medicine', 300, 'Restores 20 HP.', { heal: 20 });
I('super_potion', 'Super Potion', 'medicine', 700, 'Restores 50 HP.', { heal: 50 });
I('hyper_potion', 'Hyper Potion', 'medicine', 1200, 'Restores 120 HP.', { heal: 120 });
I('max_potion', 'Max Potion', 'medicine', 2500, 'Fully restores HP.', { heal: 9999 });
I('antidote', 'Antidote', 'medicine', 100, 'Cures poisoning.', { cure: ['psn', 'tox'] });
I('burn_salve', 'Burn Salve', 'medicine', 250, 'Heals a burn.', { cure: ['brn'] });
I('ice_thaw', 'Ice Thaw', 'medicine', 250, 'Defrosts a frozen fakemon.', { cure: ['frz'] });
I('awakening', 'Awakening', 'medicine', 250, 'Rouses a sleeping fakemon.', { cure: ['slp'] });
I('paralyze_heal', 'Paralyze Heal', 'medicine', 200, 'Cures paralysis.', { cure: ['par'] });
I('full_heal', 'Full Heal', 'medicine', 600, 'Cures all status problems.', { cure: ['psn', 'tox', 'brn', 'frz', 'slp', 'par', 'confuse'] });
I('revive', 'Revive', 'medicine', 1500, 'Revives a fainted fakemon with half HP.', { revive: 0.5 });
I('max_revive', 'Max Revive', 'medicine', 4000, 'Revives a fainted fakemon with full HP.', { revive: 1 });
I('ether', 'Ether', 'medicine', 1200, 'Restores 10 PP of one move.', { pp: 10 });
I('rare_candy', 'Rare Candy', 'medicine', 4800, 'Raises a fakemon\'s level by 1.', { candy: true });

// ---- Field ----
I('repel', 'Repel', 'misc', 350, 'Repels weak wild fakemon for 100 steps.', { repel: 100 });
I('super_repel', 'Super Repel', 'misc', 500, 'Repels weak wild fakemon for 200 steps.', { repel: 200 });
I('escape_rope', 'Escape Rope', 'misc', 550, 'Instantly escape from a cave.', { escape: true });

// ---- Battle boosters ----
I('x_attack', 'X Attack', 'battle', 500, 'Raises Attack in battle.', { xstat: 'atk' });
I('x_defense', 'X Defense', 'battle', 550, 'Raises Defense in battle.', { xstat: 'def' });
I('x_special', 'X Special', 'battle', 350, 'Raises Sp. Atk in battle.', { xstat: 'spa' });
I('x_speed', 'X Speed', 'battle', 350, 'Raises Speed in battle.', { xstat: 'spe' });

// ---- Evolution stones ----
I('verdant_stone', 'Verdant Stone', 'stone', 2100, 'A stone humming with life. Evolves some fakemon.');
I('ember_stone', 'Ember Stone', 'stone', 2100, 'A stone with a molten core. Evolves some fakemon.');
I('tide_stone', 'Tide Stone', 'stone', 2100, 'A stone that weeps seawater. Evolves some fakemon.');
I('storm_stone', 'Storm Stone', 'stone', 2100, 'A stone crackling with static. Evolves some fakemon.');
I('aurora_stone', 'Aurora Stone', 'stone', 2100, 'A stone that glows with shifting light. Evolves some fakemon.');

// ---- Held items ----
I('mendmoss', 'Mendmoss', 'held', 200, 'If held, the fakemon restores a little HP every turn.', { leftovers: 1 / 16 });
I('focus_charm', 'Focus Charm', 'held', 200, 'If held and at full HP, the fakemon endures one KO hit with 1 HP.', { focusCharm: true });
I('soothe_berry', 'Soothe Berry', 'held', 100, 'If held, cures any status problem once, then is used up.', { cureBerry: true });
I('rally_berry', 'Rally Berry', 'held', 100, 'If held, restores 1/4 HP when HP drops low, then is used up.', { pinchBerry: 0.25 });
I('stillstone', 'Stillstone', 'held', 300, 'A heavy stone that stops the holder from evolving.', { preventEvo: true });
I('rift_stone', 'Rift Stone', 'held', 0, 'A stone torn from the aurora. A fakemon able to Mega Evolve can do so in battle while holding it.', { riftStone: true });
I('emberband', 'Emberband', 'held', 300, 'If held, boosts the power of the holder\'s Fire moves.', { typeBoost: { type: 'Fire', mult: 1.2 } });
I('tideband', 'Tideband', 'held', 300, 'If held, boosts the power of the holder\'s Water moves.', { typeBoost: { type: 'Water', mult: 1.2 } });
I('leafband', 'Leafband', 'held', 300, 'If held, boosts the power of the holder\'s Grass moves.', { typeBoost: { type: 'Grass', mult: 1.2 } });
I('voltband', 'Voltband', 'held', 300, 'If held, boosts the power of the holder\'s Electric moves.', { typeBoost: { type: 'Electric', mult: 1.2 } });
I('wyrmband', 'Wyrmband', 'held', 300, 'If held, boosts the power of the holder\'s Dragon moves.', { typeBoost: { type: 'Dragon', mult: 1.2 } });

// ---- Key items ----
I('town_map', 'Town Map', 'key', 0, 'A map of the Norvenna region.');
I('old_rod', 'Old Rod', 'key', 0, 'A basic fishing rod. Face water and use it to fish.', { rod: 'old' });
I('good_rod', 'Good Rod', 'key', 0, 'A decent fishing rod. Hooks better fakemon than the Old Rod.', { rod: 'good' });
I('super_rod', 'Super Rod', 'key', 0, 'A superb fishing rod. Hooks the rarest fakemon of the deep.', { rod: 'super' });
I('old_lamp', 'Old Lamp', 'key', 0, 'The lighthouse keeper\'s antique lamp.');
I('ferry_pass', 'Ferry Pass', 'key', 0, 'Grants passage on the Tidesend ferry.');
I('ionar_badge', 'Ionar Badge', 'key', 0, 'A stolen Team Ionar ID badge. Opens their depot.');
I('storm_charm', 'Storm Charm', 'key', 0, 'An ancient charm said to calm AURORYX.');
I('shrine_key', 'Shrine Key', 'key', 0, 'Opens the glacier shrine\'s inner door.');
I('fin_fossil', 'Fin Fossil', 'key', 0, 'A fossilized fin ray. A lab could revive it into CORALITH.', { fossil: 'coralith' });
I('tusk_fossil', 'Tusk Fossil', 'key', 0, 'A fossilized tusk. A lab could revive it into MAMMOROST.', { fossil: 'mammorost' });

// ---- TMs ----
const TM_MOVES = [
  'storm_bolt', 'fire_lance', 'glacier_ray', 'mind_crush', 'phantom_orb',
  'blightbrew', 'earthshatter', 'muscle_flex', 'prism_flare', 'sludge_blast',
  'sunblessing', 'stormcall', 'hailstorm', 'duststorm', 'rock_slide',
  'gale_blade', 'protect', 'wicked_scheme', 'sap_surge', 'chrome_cannon',
  'swift_stars', 'wyrm_pulse', 'dread_pulse', 'verdant_orb', 'body_slam',
];
TM_MOVES.forEach((mv, i) => {
  const n = i + 1;
  I('tm' + Util.padLeft(n, 2, '0'), 'TM' + Util.padLeft(n, 2, '0') + ' ' + Moves[mv].name, 'tm', 3000,
    'Teaches ' + Moves[mv].name + ' to a compatible fakemon.', { move: mv });
});

// ---- HMs ----
const HM_MOVES = ['cut', 'fly', 'surf', 'strength', 'flash', 'rock_smash', 'waterfall'];
HM_MOVES.forEach((mv, i) => {
  const n = i + 1;
  I('hm' + Util.padLeft(n, 2, '0'), 'HM' + Util.padLeft(n, 2, '0') + ' ' + Moves[mv].name, 'tm', 0,
    'Teaches ' + Moves[mv].name + '. Also usable in the field. Can\'t be forgotten.', { move: mv, hm: true });
});
