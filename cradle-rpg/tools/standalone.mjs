// Build a single double-clickable HTML file with the whole game inlined —
// no server, no Node, no build step needed to PLAY it. Run with:
//   npm run standalone   ->   PathOfAscension.html
//
// How it works: the game is ES modules, which browsers refuse to load over
// file:// (hence the dev server). So we recompile to CommonJS (tsconfig
// .cjs.json -> dist-cjs/), wrap every module in a tiny require() registry
// resolved at bundle time, and inline that one script into index.html's
// shell. The result opens straight from the filesystem.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";

const HERE = dirname(new URL(import.meta.url).pathname);
const PROJECT = resolve(HERE, "..");
const CJS = join(PROJECT, "dist-cjs");
const ENTRY = "game/main.js";
const toId = (p) => p.split("\\").join("/");

console.log("compiling to CommonJS…");
execFileSync("npx", ["tsc", "-p", "tsconfig.cjs.json"], { cwd: PROJECT, stdio: "inherit" });

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

const modules = {};
for (const abs of walk(CJS)) {
  const id = toId(relative(CJS, abs));
  // Rewrite each relative require() to its resolved bundle id.
  const src = readFileSync(abs, "utf8").replace(
    /require\(\s*(["'])([^"']+)\1\s*\)/g,
    (m, _q, spec) =>
      spec.startsWith(".") ? `__req(${JSON.stringify(toId(relative(CJS, resolve(dirname(abs), spec))))})` : m,
  );
  modules[id] = src;
}

let bundle = `"use strict";\n(function(){\nvar __mods={},__cache={};\n`;
bundle += `function __req(id){if(__cache[id])return __cache[id].exports;`;
bundle += `var m=__cache[id]={exports:{}};__mods[id](m,m.exports,__req);return m.exports;}\n`;
for (const [id, src] of Object.entries(modules)) {
  bundle += `__mods[${JSON.stringify(id)}]=function(module,exports,__req){\n${src}\n};\n`;
}
bundle += `__req(${JSON.stringify(ENTRY)});\n})();\n`;

const html = readFileSync(join(PROJECT, "index.html"), "utf8").replace(
  /<script type="module" src="dist\/game\/main\.js"><\/script>/,
  `<script>\n${bundle}\n</script>`,
);
if (!html.includes(bundle)) throw new Error("could not find the module <script> tag in index.html");

const outPath = join(PROJECT, "PathOfAscension.html");
writeFileSync(outPath, html);
console.log(
  `wrote ${relative(PROJECT, outPath)} — ${Object.keys(modules).length} modules, ${(html.length / 1024).toFixed(0)} KB.`,
);
console.log("Open it by double-clicking; no server needed.");
