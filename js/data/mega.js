'use strict';
/**
 * Mega Evolution: a once-per-battle transformation for eligible finals that
 * hold a Rift Stone. Boosts base stats, may shift typing, and swaps to an
 * enhanced ("charged") sprite. Reverts when the battle ends.
 *
 * Real hand-drawn mega sprites are left for the art pass; for now the mega
 * sprite is the base silhouette rendered with a brighter, energized palette and
 * an aura, so it reads as clearly powered-up.
 */
const Megas = {
  jotunwald: { name: 'Mega Jotunwald', base: { hp: 85, atk: 112, def: 130, spa: 115, spd: 108, spe: 65 }, types: ['Grass', 'Ground'], color: '#8ff0a8' },
  fafnirn:   { name: 'Mega Fafnirn', base: { hp: 76, atk: 130, def: 95, spa: 145, spd: 95, spe: 109 }, types: ['Fire', 'Dragon'], color: '#f8a038' },
  krakelott: { name: 'Mega Krakelott', base: { hp: 84, atk: 106, def: 105, spa: 140, spd: 118, spe: 87 }, types: ['Water', 'Dark'], color: '#78e0f0' },
  auroryx:   { name: 'Mega Auroryx', base: { hp: 90, atk: 115, def: 112, spa: 158, spd: 122, spe: 118 }, types: ['Dragon', 'Electric'], color: '#a8f0d8' },
  // Non-starter megas (found across the region / postgame)
  elderhorn:  { name: 'Mega Elderhorn', base: { hp: 85, atk: 100, def: 120, spa: 130, spd: 115, spe: 70 }, types: ['Grass', 'Psychic'], color: '#a0e888' },
  fimbulwyrm: { name: 'Mega Fimbulwyrm', base: { hp: 100, atk: 140, def: 120, spa: 130, spd: 105, spe: 85 }, types: ['Dragon', 'Ice'], color: '#a8e8ff' },
  jarnwyrm:   { name: 'Mega Jarnwyrm', base: { hp: 90, atk: 135, def: 150, spa: 90, spd: 100, spe: 65 }, types: ['Steel', 'Dragon'], color: '#c0c8d8' },
  gulomaul:   { name: 'Mega Gulomaul', base: { hp: 90, atk: 150, def: 95, spa: 60, spd: 85, spe: 110 }, types: ['Fighting', 'Dark'], color: '#c88858' },
  ingotaur:   { name: 'Mega Ingotaur', base: { hp: 90, atk: 130, def: 150, spa: 70, spd: 100, spe: 60 }, types: ['Steel', 'Rock'], color: '#b8b0a0' },
  mystrix:    { name: 'Mega Mystrix', base: { hp: 80, atk: 70, def: 90, spa: 150, spd: 120, spe: 115 }, types: ['Psychic', 'Fairy'], color: '#f0b0e8' },
  grimcorvid: { name: 'Mega Grimcorvid', base: { hp: 85, atk: 135, def: 90, spa: 100, spd: 90, spe: 120 }, types: ['Dark', 'Flying'], color: '#8878b0' },
  ursnow:     { name: 'Mega Ursnow', base: { hp: 95, atk: 145, def: 105, spa: 70, spd: 95, spe: 95 }, types: ['Normal', 'Ice'], color: '#e8f0f8' },
  geysmog:    { name: 'Mega Geysmog', base: { hp: 80, atk: 90, def: 90, spa: 140, spd: 100, spe: 120 }, types: ['Poison', 'Fire'], color: '#e88848' },
  vulpaura:   { name: 'Mega Vulpaura', base: { hp: 80, atk: 80, def: 100, spa: 140, spd: 130, spe: 95 }, types: ['Ice', 'Fairy'], color: '#b8e8f0' },
  seidkona:   { name: 'Mega Seidkona', base: { hp: 78, atk: 60, def: 95, spa: 150, spd: 130, spe: 82 }, types: ['Psychic', 'Ghost'], color: '#b8a8e8' },
  reefclad:   { name: 'Mega Reefclad', base: { hp: 80, atk: 90, def: 150, spa: 90, spd: 130, spe: 50 }, types: ['Water', 'Steel'], color: '#88c8d8' },
};
function megaOf(key) { return Megas[key] || null; }
