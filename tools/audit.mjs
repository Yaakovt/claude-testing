// Data integrity audit: node tools/audit.mjs
// Checks the dex + moves + items for referential integrity, type coverage,
// stat sanity, and uniqueness rules from DESIGN.md.
import { readFileSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'js/core/util.js', 'js/core/pixel.js',
  'js/data/typechart.js', 'js/data/natures.js', 'js/data/abilities.js',
  'js/data/moves.js', 'js/data/items.js', 'js/data/species_core.js',
  'js/data/dex/starters.js', 'js/data/dex/batch_a.js', 'js/data/dex/batch_b.js',
  'js/data/dex/batch_c.js', 'js/data/dex/batch_d.js', 'js/data/dex/batch_e.js', 'js/data/dex/batch_f.js', 'js/data/dex/batch_g.js',
  'js/data/dex/legends.js',
];

const fakeCtx2d = {
  createImageData: () => ({ data: [] }),
  putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
};
const ctx = {
  console, Math, JSON, Array, Object, window: {},
  document: { createElement: () => ({ getContext: () => fakeCtx2d }) },
};
vm.createContext(ctx);
// Concatenate all sources into ONE script so top-level `const` bindings are
// shared (separate runInContext calls each get their own lexical scope).
let combined = '';
let loaded = 0;
for (const f of files) {
  let src;
  try { src = readFileSync(path.join(root, f), 'utf8'); }
  catch { console.log('  (missing: ' + f + ')'); continue; }
  combined += '\n' + src + '\n';
  loaded++;
}
// Epilogue: expose the lexical globals we need onto the context object.
combined += '\nthis.__X = { Dex, Moves, Items, Types, Abilities, Growth };\n';
try { vm.runInContext(combined, ctx, { filename: 'combined' }); }
catch (e) { console.error('LOAD FAIL: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')); process.exit(1); }

const { Dex, Moves, Items, Types, Abilities } = ctx.__X;
ctx.Growth = ctx.__X.Growth;
const errs = [];
const warn = [];

// -- per-species checks --
const seenIds = new Set(), seenNames = new Set(), seenCries = new Set();
for (const key of Dex.order) {
  const d = Dex.byKey[key];
  const tag = `#${d.id} ${key}`;
  if (seenIds.has(d.id)) errs.push(tag + ': duplicate id');
  seenIds.add(d.id);
  if (seenNames.has(d.name)) errs.push(tag + ': duplicate name');
  seenNames.add(d.name);
  for (const t of d.types) if (!Types.includes(t)) errs.push(tag + `: bad type ${t}`);
  if (!Abilities[d.ability]) errs.push(tag + `: bad ability ${d.ability}`);
  if (!d.base || ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].some((s) => !(d.base[s] > 0))) errs.push(tag + ': bad base stats');
  for (const [lv, mv] of d.learn) {
    if (!Moves[mv]) errs.push(tag + `: unknown move ${mv}`);
    if (!(lv >= 1 && lv <= 70)) errs.push(tag + `: bad learn level ${lv}`);
  }
  if (!d.learn.some(([lv]) => lv === 1)) errs.push(tag + ': no level-1 move');
  for (const tm of d.tms || []) if (!Items[tm]) errs.push(tag + `: unknown tm ${tm}`);
  if (d.evolve) {
    const opts = Array.isArray(d.evolve) ? d.evolve : [d.evolve];
    for (const opt of opts) {
      if (!Dex.byKey[opt.to]) errs.push(tag + `: evolves to unknown ${opt.to}`);
      if (!opt.level && !opt.stone && !opt.friendship) errs.push(tag + ': evolve has no trigger');
      if (opt.stone && !Items[opt.stone]) errs.push(tag + `: unknown stone ${opt.stone}`);
    }
  }
  if (!d.dex || !d.dex.entry || !d.dex.species) errs.push(tag + ': missing dex entry');
  if (!d.cry || !d.cry.base) errs.push(tag + ': missing cry');
  else {
    const sig = [d.cry.base, d.cry.wave, d.cry.dur, d.cry.sweep].join('|');
    if (seenCries.has(sig)) warn.push(tag + ': cry identical to another species');
    seenCries.add(sig);
  }
  if (typeof d.draw !== 'function' || typeof d.drawBack !== 'function') errs.push(tag + ': missing draw/drawBack');
  if (!(d.catchRate >= 3 && d.catchRate <= 255)) errs.push(tag + ': bad catchRate');
  if (!ctx.Growth[d.growth]) errs.push(tag + `: bad growth ${d.growth}`);
}

// -- contiguous ids --
const n = Dex.order.length;
for (let i = 1; i <= n; i++) if (!Dex.byId[i]) errs.push('missing dex id #' + i);

// -- type coverage: >=4 species per type (dual counts for both) --
const tally = {};
for (const t of Types) tally[t] = 0;
for (const key of Dex.order) for (const t of Dex.byKey[key].types) tally[t]++;
for (const t of Types) if (tally[t] < 4) errs.push(`type ${t} has only ${tally[t]} species (<4)`);

// -- moves sanity --
for (const id in Moves) {
  const m = Moves[id];
  if (!Types.includes(m.type)) errs.push(`move ${id}: bad type`);
  if (!['phys', 'spec', 'status'].includes(m.cat)) errs.push(`move ${id}: bad cat`);
  if (m.cat !== 'status' && !(m.power > 0) && !(m.effect && (m.effect.levelDamage || m.effect.fixed))) {
    errs.push(`move ${id}: damaging move with no power`);
  }
}

// -- report --
console.log(`Loaded ${loaded}/${files.length} files. ${n} species. ${Object.keys(Moves).length} moves. ${Object.keys(Items).length} items.`);
console.log('Type tally:', Types.map((t) => `${t}:${tally[t]}`).join(' '));
if (warn.length) { console.log('\nWARNINGS:'); warn.forEach((w) => console.log('  ' + w)); }
if (errs.length) { console.log('\nERRORS:'); errs.forEach((e) => console.log('  ' + e)); process.exit(1); }
console.log('\nAUDIT PASSED');
