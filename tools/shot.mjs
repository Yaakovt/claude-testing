// Screenshot helper: node tools/shot.mjs <file-or-url> <out.png> [w] [h] [waitMs]
import { chromium } from 'playwright';
import path from 'path';

const [, , target, out, w = '1200', h = '900', waitMs = '600'] = process.argv;
const url = target.startsWith('http') ? target : 'file://' + path.resolve(target);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url);
await page.waitForTimeout(+waitMs);
await page.screenshot({ path: out });
await browser.close();
console.log('saved', out);
