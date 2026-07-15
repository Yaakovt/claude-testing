// Verify core mechanics headlessly: catching a wild mon, level-up evolution,
// split-evolution branch, TM teaching, and the damage formula sanity.
import { chromium } from 'playwright';
import path from 'path';

const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + path.join(gameRoot, 'index.html'));
await page.waitForTimeout(400);

const results = await page.evaluate(() => {
  const out = {};

  // ---- evolution target logic (level, stone, friendship, split) ----
  const trolls = new Mon('trollsprout', 16);
  out.evo_level = trolls.evolveTarget({ level: true }) === 'bryteknott';
  const glac = new Mon('glacierling', 35);
  out.evo_split_level = glac.evolveTarget({ level: true }) === 'frystdrake';
  const glac2 = new Mon('glacierling', 20);
  out.evo_split_stone = glac2.evolveTarget({ stone: 'aurora_stone' }) === 'frostfern';
  const glim = new Mon('glimmouse', 20); glim.friendship = 200;
  out.evo_friendship = glim.evolveTarget({ friendship: true }) === 'sylphund';
  // apply an evolution
  glac.evolveInto('frystdrake');
  out.evo_apply = glac.key === 'frystdrake' && glac.curHp > 0;

  // ---- TM teaching respects compatibility ----
  const cin = new Mon('cindrel', 20);
  out.tm_compatible = cin.canTeachTm('tm11');       // Cindrel lists tm11
  out.tm_incompatible = !cin.canTeachTm('tm03');     // Water TM, not in list

  // ---- catch: full-HP high-catch species should sometimes fail, sleeping easier ----
  // deterministic-ish: run the formula many times, expect a spread
  Game.party = [new Mon('cindrel', 30)];
  Battle.kind = 'wild';
  Battle.pl = Battle.makeSide(Game.party[0], true);
  let caught = 0;
  for (let i = 0; i < 200; i++) {
    Battle.pl.mon.curHp = Battle.pl.mon.maxHp;                  // keep player alive across loop
    Battle.en = Battle.makeSide(new Mon('nibbit', 5), false);   // high catch rate
    Battle.en.mon.curHp = 1;                                    // weakened
    Battle.queue = [];
    Battle.result = null; Battle.caughtMon = null;
    Battle.tryCatch(Items.fieldorb);
    if (Battle.result === 'caught') caught++;
  }
  out.catch_rate_weak_nibbit = caught; // expect most to catch at 1 HP

  // a full-HP tough legendary should rarely catch with a Fieldorb
  let legCaught = 0;
  for (let i = 0; i < 200; i++) {
    Battle.pl.mon.curHp = Battle.pl.mon.maxHp;
    Battle.en = Battle.makeSide(new Mon('auroryx', 50), false);
    Battle.queue = []; Battle.result = null;
    Battle.tryCatch(Items.fieldorb);
    if (Battle.result === 'caught') legCaught++;
  }
  out.catch_legendary_fullhp = legCaught; // expect ~0

  // ---- damage formula: super-effective > neutral > not-very ----
  Game.party = [new Mon('cindrel', 50)];
  const attacker = Battle.makeSide(Game.party[0], true);
  const grassDef = Battle.makeSide(new Mon('trollsprout', 50), false);  // Fire vs Grass = 2x
  const waterDef = Battle.makeSide(new Mon('selkip', 50), false);       // Fire vs Water = 0.5x
  const se = Battle.calcDamage(attacker, grassDef, Moves.fire_lance, {}).dmg;
  const nve = Battle.calcDamage(attacker, waterDef, Moves.fire_lance, {}).dmg;
  out.dmg_super_gt_nve = se > nve;

  return out;
});

console.log(JSON.stringify(results, null, 2));
const pass = results.evo_level && results.evo_split_level && results.evo_split_stone &&
  results.evo_friendship && results.evo_apply && results.tm_compatible && results.tm_incompatible &&
  results.catch_rate_weak_nibbit > 120 && results.catch_legendary_fullhp < 20 && results.dmg_super_gt_nve;
console.log('\nMECHANICS ' + (pass ? 'PASS' : 'FAIL'));
if (errors.length) { console.log('ERRORS:'); errors.forEach((e) => console.log('  ' + e)); }
await browser.close();
process.exit(pass && !errors.length ? 0 : 1);
