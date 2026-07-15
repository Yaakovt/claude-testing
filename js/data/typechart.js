'use strict';
/**
 * The 18-type effectiveness chart (canon matchups).
 * TypeChart.effect(attackType, [defType1, defType2]) -> multiplier.
 */
const Types = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison', 'Ground',
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

const TypeChart = (() => {
  // se = super effective (x2), nve = not very (x0.5), imm = immune (x0)
  const T = {
    Normal:   { se: [], nve: ['Rock', 'Steel'], imm: ['Ghost'] },
    Fire:     { se: ['Grass', 'Ice', 'Bug', 'Steel'], nve: ['Fire', 'Water', 'Rock', 'Dragon'], imm: [] },
    Water:    { se: ['Fire', 'Ground', 'Rock'], nve: ['Water', 'Grass', 'Dragon'], imm: [] },
    Electric: { se: ['Water', 'Flying'], nve: ['Electric', 'Grass', 'Dragon'], imm: ['Ground'] },
    Grass:    { se: ['Water', 'Ground', 'Rock'], nve: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'], imm: [] },
    Ice:      { se: ['Grass', 'Ground', 'Flying', 'Dragon'], nve: ['Fire', 'Water', 'Ice', 'Steel'], imm: [] },
    Fighting: { se: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'], nve: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'], imm: ['Ghost'] },
    Poison:   { se: ['Grass', 'Fairy'], nve: ['Poison', 'Ground', 'Rock', 'Ghost'], imm: ['Steel'] },
    Ground:   { se: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], nve: ['Grass', 'Bug'], imm: ['Flying'] },
    Flying:   { se: ['Grass', 'Fighting', 'Bug'], nve: ['Electric', 'Rock', 'Steel'], imm: [] },
    Psychic:  { se: ['Fighting', 'Poison'], nve: ['Psychic', 'Steel'], imm: ['Dark'] },
    Bug:      { se: ['Grass', 'Psychic', 'Dark'], nve: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Fairy', 'Steel'], imm: [] },
    Rock:     { se: ['Fire', 'Ice', 'Flying', 'Bug'], nve: ['Fighting', 'Ground', 'Steel'], imm: [] },
    Ghost:    { se: ['Psychic', 'Ghost'], nve: ['Dark'], imm: ['Normal'] },
    Dragon:   { se: ['Dragon'], nve: ['Steel'], imm: ['Fairy'] },
    Dark:     { se: ['Psychic', 'Ghost'], nve: ['Fighting', 'Dark', 'Fairy'], imm: [] },
    Steel:    { se: ['Ice', 'Rock', 'Fairy'], nve: ['Fire', 'Water', 'Electric', 'Steel'], imm: [] },
    Fairy:    { se: ['Fighting', 'Dragon', 'Dark'], nve: ['Fire', 'Poison', 'Steel'], imm: [] },
  };

  function single(atk, def) {
    const row = T[atk];
    if (!row) return 1;
    if (row.imm.includes(def)) return 0;
    if (row.se.includes(def)) return 2;
    if (row.nve.includes(def)) return 0.5;
    return 1;
  }

  return {
    table: T,
    effect(atk, defTypes) {
      let m = 1;
      for (const d of defTypes) m *= single(atk, d);
      return m;
    },
    single,
  };
})();

/** UI colors per type (badge chips, move menus). */
const TypeColors = {
  Normal: '#a8a090', Fire: '#e8613a', Water: '#3f7fe0', Electric: '#f0c020',
  Grass: '#58b04a', Ice: '#6fd0d8', Fighting: '#b3382d', Poison: '#9046a0',
  Ground: '#d0a850', Flying: '#8fa0e8', Psychic: '#e85888', Bug: '#98ac20',
  Rock: '#a89058', Ghost: '#635090', Dragon: '#6048d8', Dark: '#5c4a42',
  Steel: '#a0a0b8', Fairy: '#e89ae0',
};
