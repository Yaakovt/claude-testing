/* Builds TheReliquary.html — a single self-contained file that runs from
   file:// with a plain double-click. Requires: npm i esbuild (any recent).
   Usage: node build.mjs                                                  */
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const result = await build({
  entryPoints: [join(here, 'game.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  alias: {
    'three': join(here, 'vendor/three.module.js'),
    'three/addons': join(here, 'vendor/addons'),
  },
  logLevel: 'warning',
});
const js = result.outputFiles[0].text;

let html = readFileSync(join(here, 'index.html'), 'utf8');
/* swap the importmap + module script for the inlined bundle */
html = html
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/m, '')
  .replace(
    /<script type="module" src="\.\/game\.js"><\/script>/,
    () => '<script>\n' + js + '\n</script>',
  );

const out = join(here, 'TheReliquary.html');
writeFileSync(out, html);
console.log('wrote', out, (html.length / 1024 / 1024).toFixed(2) + ' MB');
