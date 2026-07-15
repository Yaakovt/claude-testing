// Anatomy linter: flood-fills every sprite and reports disconnected islands
// (floating parts) + frame coverage. usage: node spritelint.mjs [key ...]
import { chromium } from 'playwright';
import path from 'path';
const keys = process.argv.slice(2);
const url = 'file://' + path.resolve(process.env.GAME_ROOT || '/home/user/claude-testing', 'index.html');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
await page.goto(url); await page.waitForTimeout(400);
const rep = await page.evaluate((keys) => {
  const list = keys.length ? keys : Dex.order;
  const out = [];
  for (const key of list) {
    const def = Dex.byKey[key];
    for (const side of ['front', 'back']) {
      const s = new PixelSurface(64, 64);
      try { (side === 'front' ? def.draw : def.drawBack).call(def, s); }
      catch (e) { out.push({ key, side, error: e.message }); continue; }
      if (s.weld) s.weld(3);
      // flood fill islands (4-connected)
      const seen = new Uint8Array(64 * 64);
      const islands = [];
      let minX = 64, minY = 64, maxX = 0, maxY = 0, total = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const i = y * 64 + x;
        if (!s.data[i]) continue;
        total++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (seen[i]) continue;
        // BFS
        let size = 0; const q = [i]; seen[i] = 1;
        let ix1 = x, iy1 = y, ix2 = x, iy2 = y;
        while (q.length) {
          const j = q.pop(); size++;
          const jx = j % 64, jy = (j / 64) | 0;
          if (jx < ix1) ix1 = jx; if (jx > ix2) ix2 = jx;
          if (jy < iy1) iy1 = jy; if (jy > iy2) iy2 = jy;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = jx + dx, ny = jy + dy;
            if (nx < 0 || ny < 0 || nx >= 64 || ny >= 64) continue;
            const k = ny * 64 + nx;
            if (s.data[k] && !seen[k]) { seen[k] = 1; q.push(k); }
          }
        }
        islands.push({ size, at: ix1 + ',' + iy1 + '..' + ix2 + ',' + iy2 });
      }
      islands.sort((a, b) => b.size - a.size);
      const floaters = islands.slice(1);
      const w = maxX - minX + 1, h = maxY - minY + 1;
      out.push({ key, side, islands: islands.length, floaters: floaters.map(f => f.size + '@' + f.at).slice(0, 6),
        frame: w + 'x' + h, fill: Math.round(100 * total / (64 * 64)) });
    }
  }
  return out;
}, keys);
// summarize
let bad = 0;
for (const r of rep) {
  if (r.error) { console.log('ERROR', r.key, r.side, r.error); bad++; continue; }
  if (r.islands > 1) { bad++; console.log(`${r.key} ${r.side}: ${r.islands} islands  floaters: ${r.floaters.join(' | ')}  frame ${r.frame}`); }
}
console.log(`---\n${bad} sprite sides with disconnected parts, of ${rep.length} checked`);
await browser.close();
