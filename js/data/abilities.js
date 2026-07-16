'use strict';
/**
 * Abilities. Every species has exactly one. The battle engine reads the
 * effect fields below — every field is actually implemented in battle.js.
 *
 * Effect fields:
 *  pinch:{type}          1.5x power of moves of `type` at <=1/3 HP
 *  entryLower:{stat}     on switch-in, lower foe's stat 1 stage
 *  entryWeather:name     on switch-in, set weather
 *  statusImmune:[..]     cannot receive these statuses ('psn','par','brn','slp','frz','confuse')
 *  absorb:{type,heal}    immune to `type` moves; heals fraction of max HP
 *  halve:[types]         take 0.5x damage from these attack types
 *  levitate:true         immune to Ground
 *  contact:{status,pct}  attacker making contact may be statused
 *  critBoost:1           +1 crit stage on all moves
 *  accBoost:1.3          accuracy multiplier
 *  guts:true             1.5x Atk while statused; burn Atk-drop ignored
 *  technician:true       1.5x power for moves <=60 base power
 *  sturdy:true           survives a KO hit from full HP with 1 HP
 *  weatherSpeed:name     2x Speed in that weather
 *  adaptability:true     STAB is 2x instead of 1.5x
 *  regen:1/16            heals each turn end
 *  moxie:{stat}          +1 stat stage after KOing a foe
 *  hardBody:true         no recoil damage
 *  escapeArtist:true     always flees wild battles / ignores trapping
 *  frisk? (unused)
 */
const Abilities = {
  verdant_surge:  { name: 'Verdant Surge', desc: 'Powers up Grass moves in a pinch.', pinch: { type: 'Grass' } },
  kindled_heart:  { name: 'Kindled Heart', desc: 'Powers up Fire moves in a pinch.', pinch: { type: 'Fire' } },
  tidal_will:     { name: 'Tidal Will', desc: 'Powers up Water moves in a pinch.', pinch: { type: 'Water' } },
  looming_dread:  { name: 'Looming Dread', desc: 'Lowers the foe\'s Attack on entry.', entryLower: { stat: 'atk' } },
  cold_stare:     { name: 'Cold Stare', desc: 'Lowers the foe\'s Speed on entry.', entryLower: { stat: 'spe' } },
  drizzlecall:    { name: 'Drizzlecall', desc: 'Summons rain on entry.', entryWeather: 'rain' },
  sunwaker:       { name: 'Sunwaker', desc: 'Summons harsh sunlight on entry.', entryWeather: 'sun' },
  hailherald:     { name: 'Hailherald', desc: 'Summons hail on entry.', entryWeather: 'hail' },
  dust_devil:     { name: 'Dust Devil', desc: 'Whips up a sandstorm on entry.', entryWeather: 'sandstorm' },
  inner_ember:    { name: 'Inner Ember', desc: 'Cannot be burned.', statusImmune: ['brn'] },
  limber_form:    { name: 'Limber Form', desc: 'Cannot be paralyzed.', statusImmune: ['par'] },
  wakeful:        { name: 'Wakeful', desc: 'Cannot fall asleep.', statusImmune: ['slp'] },
  pure_blood:     { name: 'Pure Blood', desc: 'Cannot be poisoned.', statusImmune: ['psn'] },
  clear_mind:     { name: 'Clear Mind', desc: 'Cannot be confused.', statusImmune: ['confuse'] },
  hearth_core:    { name: 'Hearth Core', desc: 'Cannot be frozen.', statusImmune: ['frz'] },
  storm_drinker:  { name: 'Storm Drinker', desc: 'Absorbs Electric moves to heal.', absorb: { type: 'Electric', heal: 0.25 } },
  spring_sponge:  { name: 'Spring Sponge', desc: 'Absorbs Water moves to heal.', absorb: { type: 'Water', heal: 0.25 } },
  flame_eater:    { name: 'Flame Eater', desc: 'Absorbs Fire moves to heal.', absorb: { type: 'Fire', heal: 0.25 } },
  blubber:        { name: 'Blubber', desc: 'Halves Fire and Ice damage.', halve: ['Fire', 'Ice'] },
  stone_hide:     { name: 'Stone Hide', desc: 'Halves Normal and Flying damage.', halve: ['Normal', 'Flying'] },
  updraft:        { name: 'Updraft', desc: 'Floats: immune to Ground moves.', levitate: true },
  static_wool:    { name: 'Static Wool', desc: 'Contact may paralyze the attacker.', contact: { status: 'par', pct: 30 } },
  thorn_coat:     { name: 'Thorn Coat', desc: 'Contact may poison the attacker.', contact: { status: 'psn', pct: 30 } },
  scald_skin:     { name: 'Scald Skin', desc: 'Contact may burn the attacker.', contact: { status: 'brn', pct: 30 } },
  dream_dust:     { name: 'Dream Dust', desc: 'Contact may put the attacker to sleep.', contact: { status: 'slp', pct: 30 } },
  keen_edge:      { name: 'Keen Edge', desc: 'Critical hits land more easily.', critBoost: 1 },
  hunter_eye:     { name: 'Hunter Eye', desc: 'Boosts move accuracy.', accBoost: 1.3 },
  grit:           { name: 'Grit', desc: 'Boosts Attack when suffering a status.', guts: true },
  fine_craft:     { name: 'Fine Craft', desc: 'Boosts weaker moves\' power.', technician: true },
  bedrock:        { name: 'Bedrock', desc: 'Survives a KO blow at full HP.', sturdy: true },
  rain_racer:     { name: 'Rain Racer', desc: 'Doubles Speed in rain.', weatherSpeed: 'rain' },
  sun_chaser:     { name: 'Sun Chaser', desc: 'Doubles Speed in sunlight.', weatherSpeed: 'sun' },
  snow_skater:    { name: 'Snow Skater', desc: 'Doubles Speed in hail.', weatherSpeed: 'hail' },
  perfect_fit:    { name: 'Perfect Fit', desc: 'Same-type moves grow even stronger.', adaptability: true },
  moss_mend:      { name: 'Moss Mend', desc: 'Gradually restores HP each turn.', regen: 1 / 16 },
  bloodlust:      { name: 'Bloodlust', desc: 'Attack rises after downing a foe.', moxie: { stat: 'atk' } },
  surging_soul:   { name: 'Surging Soul', desc: 'Sp. Atk rises after downing a foe.', moxie: { stat: 'spa' } },
  iron_frame:     { name: 'Iron Frame', desc: 'Takes no recoil damage.', hardBody: true },
  slippery:       { name: 'Slippery', desc: 'Can always flee wild battles.', escapeArtist: true },
  aurora_heart:   { name: 'Aurora Heart', desc: 'The storm\'s heart: summons the aurora, immune to paralysis, powers up in rain, hail and auroras.', statusImmune: ['par'], auroraHeart: true, entryWeather: 'aurora' },

  // ---- Second wave of abilities (combinations of the wired effects above) ----
  prism_body:     { name: 'Prism Body', desc: 'Halves Psychic and Fairy damage.', halve: ['Psychic', 'Fairy'] },
  heatproof:      { name: 'Heatproof', desc: 'Halves Fire damage and cannot be burned.', halve: ['Fire'], statusImmune: ['brn'] },
  mystic_scales:  { name: 'Mystic Scales', desc: 'Halves Dragon and Fairy damage.', halve: ['Dragon', 'Fairy'] },
  stormrider:     { name: 'Stormrider', desc: 'Floats above Ground moves and doubles Speed in rain.', levitate: true, weatherSpeed: 'rain' },
  venom_coat:     { name: 'Venom Coat', desc: 'Contact may poison; cannot be poisoned.', contact: { status: 'psn', pct: 30 }, statusImmune: ['psn'] },
  frost_touch:    { name: 'Frost Touch', desc: 'Contact may freeze the attacker.', contact: { status: 'frz', pct: 20 } },
  sharp_vision:   { name: 'Sharp Vision', desc: 'Boosts accuracy and lands crits more easily.', accBoost: 1.3, critBoost: 1 },
  ironclad:       { name: 'Ironclad', desc: 'Survives a KO at full HP and takes no recoil.', sturdy: true, hardBody: true },
  fae_eater:      { name: 'Fae Eater', desc: 'Absorbs Fairy moves to heal.', absorb: { type: 'Fairy', heal: 0.25 } },
  permafrost:     { name: 'Permafrost', desc: 'Halves Fire damage and cannot be frozen.', halve: ['Fire'], statusImmune: ['frz'] },
  sand_rush:      { name: 'Sand Rush', desc: 'Doubles Speed in a sandstorm.', weatherSpeed: 'sandstorm' },
  gale_force:     { name: 'Gale Force', desc: 'Powers up Flying moves in a pinch.', pinch: { type: 'Flying' } },

  // ---- Signature abilities (one species each) ----
  titanroot:      { name: 'Titanroot', desc: 'Jotunwald\'s roots: powers up Grass moves in a pinch and mend HP each turn.', pinch: { type: 'Grass' }, regen: 1 / 16 },
  wyrmfire:       { name: 'Wyrmfire', desc: 'Fafnirn\'s blaze: powers up Fire moves in a pinch; Attack rises after a KO.', pinch: { type: 'Fire' }, moxie: { stat: 'atk' } },
  deepcurrent:    { name: 'Deepcurrent', desc: 'Krakelott\'s depths: absorbs Water to heal; Sp. Atk rises after a KO.', absorb: { type: 'Water', heal: 0.25 }, moxie: { stat: 'spa' } },
  magma_core:     { name: 'Magma Core', desc: 'Magnadrake\'s molten heart: halves Fire, cannot be burned, and rages in a pinch.', halve: ['Fire'], statusImmune: ['brn'], pinch: { type: 'Dragon' } },
  dusk_aegis:     { name: 'Dusk Aegis', desc: 'Vesperyx\'s twilight ward: halves Dark and Ghost, immune to confusion, mends HP each turn.', halve: ['Dark', 'Ghost'], statusImmune: ['confuse'], regen: 1 / 16 },
};

function abilityName(id) { return Abilities[id] ? Abilities[id].name : '???'; }
