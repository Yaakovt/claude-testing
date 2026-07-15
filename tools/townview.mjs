// Screenshot a map by warping the player into it. node tools/townview.mjs <mapId> <x> <y> <out.png>
import { chromium } from 'playwright';
import path from 'path';
const [, , mapId = 'tidesend', px = '9', py = '4', out = 'town.png'] = process.argv;
const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });
await page.goto('file://' + path.join(gameRoot, 'index.html'));
await page.waitForTimeout(400);
await page.evaluate(([m, x, y]) => {
  Game.playerName = 'Aksel';
  Game.party = [new Mon('cindrel', 20)];
  Overworld.player = new Player(+x, +y, 'down');
  Overworld.loadMap(m, false);
  Game.setState('overworld');
}, [mapId, px, py]);
await page.waitForTimeout(400);
await page.screenshot({ path: out });
await browser.close();
console.log('saved', out);
