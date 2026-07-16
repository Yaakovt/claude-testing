// Build a single self-contained, playable HTML (norvenna.html) by inlining the
// CSS + every JS file in index.html's exact order. Run: node tools/bundle.mjs
// The output is body-content-only, ready to publish as a Claude Artifact.
import { readFileSync, writeFileSync } from 'fs';
// repo root = parent of this tools/ dir
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(ROOT + '/index.html', 'utf8');
const css = readFileSync(ROOT + '/css/style.css', 'utf8');

// pull script srcs in order
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
console.log('scripts:', srcs.length);

const esc = (s) => s.replace(/<\/script>/g, '<\\/script>');   // guard against nested close tags
let out = '';
out += '<style>\n' + css + '\n' +
  '/* fill the artifact viewport; scale the 240x160 canvas up crisply */\n' +
  'html,body{height:100%}#frame{width:100%;height:100vh}\n' +
  '' +
  '</style>\n';
out += '<div id="frame"><canvas id="screen" width="240" height="160"></canvas></div>\n';
out += '<div id="boot-hint">Click or press any key to start</div>\n';

for (const src of srcs) {
  const code = readFileSync(ROOT + '/' + src, 'utf8');
  out += '<script>/* ' + src + ' */\n' + esc(code) + '\n</script>\n';
}

writeFileSync(join(ROOT, 'norvenna.html'), out);  // single-file playable build
console.log('bytes:', out.length);
