// Screenshot the bag with items across pockets. node tools/bagshot.mjs <out>
import { chromium } from 'playwright';
import path from 'path';
const out = process.argv[2] || 'bag.png';
const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + path.join(gameRoot, 'index.html'));
await page.waitForTimeout(400);
await page.evaluate(() => {
  Game.party = [new Mon('cindrel', 20)];
  ['fieldorb','greatorb','ultraorb','meshorb','gloomorb','rushorb','denorb','primeorb',
   'potion','super_potion','revive','rare_candy','full_heal','repel',
   'mendmoss','focus_charm','soothe_berry','rally_berry','stillstone','emberband','tideband',
   'verdant_stone','ember_stone','tm01','hm03','old_rod','good_rod'].forEach((i)=>Game.give(i, 3));
  BagUI.open({ mode: 'field', onCancel(){} });
}, []);
await page.waitForTimeout(200);
await page.screenshot({ path: out });
// also screenshot the HELD pocket
await page.evaluate(() => { BagUI.pocket = 2; BagUI.idx = 0; });
await page.waitForTimeout(150);
await page.screenshot({ path: out.replace('.png', '_held.png') });
if (errs.length) console.log('ERRORS:', errs.join('; '));
await browser.close();
console.log('saved', out);
