// Screenshot the Pokedex detail page for a species. node tools/dexshot.mjs <key> <out>
import { chromium } from 'playwright';
import path from 'path';
const [, , key = 'glacierling', out = 'dex.png'] = process.argv;
const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + path.join(gameRoot, 'index.html'));
await page.waitForTimeout(400);
await page.evaluate((k) => {
  for (const key of Dex.order) Game.dexSeen[key] = true;   // mark all seen so detail shows
  PokedexUI.open();
  PokedexUI.idx = Dex.byKey[k].id - 1;
  PokedexUI.detail = true;
}, key);
await page.waitForTimeout(200);
await page.screenshot({ path: out });
if (errs.length) console.log('ERRORS:', errs.join('; '));
await browser.close();
console.log('saved', out);
