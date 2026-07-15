// Boot smoke test: load the game, drive it through intro to overworld + a
// battle, report JS errors, screenshot key moments.
// Usage: node tools/smoke.mjs [outdir]
import { chromium } from 'playwright';
import path from 'path';

const out = process.argv[2] || '.';
const url = 'file://' + path.resolve('index.html');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 720, height: 480 } });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('[console.error] ' + m.text()); });
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

await page.goto(url);
await page.waitForTimeout(500);

const st = () => page.evaluate(() => ({ s: Game.state, map: Overworld.map && Overworld.map.id, party: Game.party.length, tb: Textbox.active }));
const shot = (n) => page.screenshot({ path: path.join(out, n) });
const press = async (k, n = 1, d = 90) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(d); } };

// Advance dialogue/menus by pressing a key until we reach a target state (or timeout).
async function driveTo(target, key = 'KeyZ', maxPresses = 80) {
  for (let i = 0; i < maxPresses; i++) {
    const s = (await st()).s;
    if (Array.isArray(target) ? target.includes(s) : s === target) return true;
    await page.keyboard.press(key);
    await page.waitForTimeout(90);
  }
  return false;
}

await shot('01_title.png');
console.log('load:', JSON.stringify(await st()));

// Title -> menu -> New Game
await press('Enter', 1, 300);
await shot('02_menu.png');
await press('Enter', 1, 400);   // New Game -> intro begins
console.log('intro:', JSON.stringify(await st()));

// Intro dialogue -> naming(gender)
await driveTo('naming', 'KeyZ', 40);
await shot('03_gender.png');
console.log('naming:', JSON.stringify(await st()));
// gender confirm, preset name confirm
await press('KeyZ', 1, 250);   // confirm gender -> preset list
await press('KeyZ', 1, 250);   // choose first preset -> finish dialogue
// finish dialogue -> overworld (text reveal is slow, so press patiently)
await driveTo('overworld', 'KeyZ', 60);
// clear any lingering dialogue
await driveTo('overworld', 'KeyZ', 8);
await shot('04_overworld.png');
console.log('overworld:', JSON.stringify(await st()));

// Walk out of the room / around
await press('ArrowDown', 4, 130);
await press('KeyZ', 3, 150);   // dismiss room intro dialogue
await shot('05_walk.png');

// Give a starter if none, then force a wild battle from overworld (no textbox)
await page.evaluate(() => {
  if (Game.party.length === 0) { Game.party.push(new Mon('cindrel', 8)); Game.flags.starter = 'cindrel'; }
});
// make sure no textbox is blocking
await driveTo('overworld', 'KeyZ', 6);
await page.evaluate(() => Game.startWildBattle('sprigfawn', 4, 'grass'));
await page.waitForTimeout(500);
// let the send-in / intro events play
await press('KeyZ', 8, 260);
await shot('06_battle.png');
console.log('battle:', JSON.stringify(await st()));
// open FIGHT menu
await press('KeyZ', 2, 220);
await shot('07_battle_menu.png');
// pick a move to see an attack animation
await press('KeyZ', 1, 220);
await press('KeyZ', 1, 700);
await shot('08_attack.png');

console.log('\n=== ERRORS (' + errors.length + ') ===');
for (const e of errors.slice(0, 40)) console.log(e);
await browser.close();
process.exit(errors.length ? 1 : 0);
