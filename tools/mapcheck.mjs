// Validate maps: row widths, warp targets in-bounds & walkable, door/warp
// pairing, and that named scripts/trainers referenced by NPCs exist.
import { chromium } from 'playwright';
import path from 'path';

const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const url = 'file://' + path.join(gameRoot, 'index.html');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
const perr = [];
page.on('pageerror', (e) => perr.push(e.message));
await page.goto(url);
await page.waitForTimeout(500);

const report = await page.evaluate(() => {
  const problems = [];
  for (const id in Maps) {
    const def = Maps[id];
    const tm = new Tilemap(def);
    // row widths
    const w = tm.ground[0].length;
    tm.ground.forEach((r, y) => { if (r.length !== w) problems.push(`${id}: row ${y} width ${r.length} != ${w}`); });
    // warps
    for (const wp of tm.warps) {
      if (wp.to === '@back') continue;   // dynamic return warp, resolved at runtime
      if (!Maps[wp.to]) { problems.push(`${id}: warp -> unknown map '${wp.to}'`); continue; }
      const dest = new Tilemap(Maps[wp.to]);
      if (wp.tx < 0 || wp.ty < 0 || wp.tx >= dest.w || wp.ty >= dest.h)
        problems.push(`${id}: warp to ${wp.to} lands out of bounds (${wp.tx},${wp.ty}) [${dest.w}x${dest.h}]`);
      else {
        const d = dest.tileDef(wp.tx, wp.ty);
        if (d && d.solid && !d.water) problems.push(`${id}: warp to ${wp.to} lands ON SOLID tile (${wp.tx},${wp.ty})`);
      }
      if (wp.x < 0 || wp.y < 0 || wp.x >= tm.w || wp.y >= tm.h)
        problems.push(`${id}: warp source out of bounds (${wp.x},${wp.y})`);
    }
    // npc scripts/trainers exist
    for (const n of def.npcs || []) {
      if (n.script && !Scripts.lib[n.script]) problems.push(`${id}: npc script '${n.script}' not registered`);
      if (n.trainer && !Trainers[n.trainer]) problems.push(`${id}: npc trainer '${n.trainer}' missing`);
    }
    // items reference real item ids
    for (const it of def.items || []) if (!Items[it.item]) problems.push(`${id}: item ball has unknown item '${it.item}'`);
  }
  return { problems, mapCount: Object.keys(Maps).length };
});

console.log(`Checked ${report.mapCount} maps.`);
if (perr.length) { console.log('PAGE ERRORS:'); perr.forEach((e) => console.log('  ' + e)); }
if (report.problems.length) {
  console.log(`\n${report.problems.length} PROBLEMS:`);
  report.problems.forEach((p) => console.log('  ' + p));
} else console.log('MAPS OK — all warps, scripts, trainers, items valid.');
await browser.close();
process.exit(report.problems.length || perr.length ? 1 : 0);
