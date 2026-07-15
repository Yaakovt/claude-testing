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
  aurora_heart:   { name: 'Aurora Heart', desc: 'The storm\'s heart: immune to paralysis, powers up in rain and hail.', statusImmune: ['par'], auroraHeart: true },
};

function abilityName(id) { return Abilities[id] ? Abilities[id].name : '???'; }
