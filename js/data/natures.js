'use strict';
/** The 25 natures: +10% one stat, -10% another (5 neutral). */
const Natures = (() => {
  const stats = ['atk', 'def', 'spa', 'spd', 'spe'];
  const names = [
    ['Hardy', 'Lonely', 'Adamant', 'Naughty', 'Brave'],
    ['Bold', 'Docile', 'Impish', 'Lax', 'Relaxed'],
    ['Modest', 'Mild', 'Bashful', 'Rash', 'Quiet'],
    ['Calm', 'Gentle', 'Careful', 'Quirky', 'Sassy'],
    ['Timid', 'Hasty', 'Jolly', 'Naive', 'Serious'],
  ];
  const list = {};
  for (let up = 0; up < 5; up++) {
    for (let dn = 0; dn < 5; dn++) {
      const name = names[up][dn];
      list[name] = { name, up: up === dn ? null : stats[up], down: up === dn ? null : stats[dn] };
    }
  }
  return {
    list,
    random() { return Util.pick(Object.keys(list)); },
    mult(nature, stat) {
      const n = list[nature];
      if (!n) return 1;
      if (n.up === stat) return 1.1;
      if (n.down === stat) return 0.9;
      return 1;
    },
  };
})();
