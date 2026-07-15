// Verify the gym battle -> badge -> HM flow by auto-playing a trainer battle.
import { chromium } from 'playwright';
import path from 'path';

const gameRoot = process.env.GAME_ROOT || '/home/user/claude-testing';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + path.join(gameRoot, 'index.html'));
await page.waitForTimeout(400);

// Jump straight into a ready state: strong team, in Birchwick gym, badge not earned.
await page.evaluate(() => {
  Game.playerName = 'Tester'; Game.gender = 'M';
  Game.party = [new Mon('fimbulwyrm', 60), new Mon('cindrel', 55)];
  Game.flags.starter = 'cindrel';
  Overworld.player = new Player(5, 7, 'up');
  Overworld.loadMap('birchwick_gym', false);
  Game.setState('overworld');
});
await page.waitForTimeout(200);
// Run the leader script (starts the battle)
await page.evaluate(() => Scripts.run('gym_astrid'));

// Auto-play: advance text, choose FIGHT, choose the first move, repeat.
let badge = false;
for (let i = 0; i < 500; i++) {
  const s = await page.evaluate(() => ({
    state: Game.state, mode: (typeof BattleUI !== 'undefined' ? BattleUI.mode : ''),
    badge: Game.badges[0], hm: !!Game.flags.hm_cut, tb: Textbox.active,
  }));
  if (s.badge) badge = true;
  // stop once the full reward chain (badge + HM + back to free overworld) is done
  if (s.badge && s.hm && s.state === 'overworld' && !s.tb) break;
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(70);
}

const final = await page.evaluate(() => ({
  badge0: Game.badges[0], hmCut: !!Game.flags.hm_cut, beat: !!Game.flags.beat_astrid,
  hasTM: !!Game.bag['tm25'], state: Game.state,
}));
console.log('gym result:', JSON.stringify(final));
console.log('badge earned:', badge || final.badge0);
if (errors.length) { console.log('ERRORS:'); errors.forEach((e) => console.log('  ' + e)); }
await browser.close();
process.exit((final.badge0 && final.hmCut && errors.length === 0) ? 0 : 1);
