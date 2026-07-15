// Generates ASSETS_FOR_CODEX.md — a complete art-asset brief for an external
// artist/model to produce every PNG the game can consume.
// Run: node tools/gen_art_prompt.mjs
import { readFileSync, writeFileSync } from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'js/core/util.js', 'js/core/pixel.js',
  'js/data/typechart.js', 'js/data/natures.js', 'js/data/abilities.js',
  'js/data/moves.js', 'js/data/items.js', 'js/data/species_core.js',
  'js/data/dex/starters.js', 'js/data/dex/batch_a.js', 'js/data/dex/batch_b.js',
  'js/data/dex/batch_c.js', 'js/data/dex/batch_d.js', 'js/data/dex/batch_e.js', 'js/data/dex/batch_f.js',
  'js/data/dex/legends.js', 'js/art/tiles.js', 'js/art/chars.js',
];
const fakeCtx2d = { createImageData: () => ({ data: [] }), putImageData: () => {}, drawImage: () => {}, fillRect: () => {} };
const ctx = { console, Math, JSON, Array, Object, window: {}, document: { createElement: () => ({ getContext: () => fakeCtx2d }) } };
vm.createContext(ctx);
let combined = '';
for (const f of files) combined += '\n' + readFileSync(path.join(root, f), 'utf8') + '\n';
combined += '\nthis.__X = { Dex, Tiles, Chars, TypeColors, Items };\n';
vm.runInContext(combined, ctx, { filename: 'combined' });
const { Dex, Tiles, Chars, Items } = ctx.__X;

let md = '';
const P = (s = '') => { md += s + '\n'; };

P('# CODEX HAND-OFF — NORVENNA ART (this file is self-contained; paste it whole)');
P();
P('## YOUR TASK (read first)');
P('You are a pixel-art asset generator for a finished 2D game. Produce original');
P('Gen-3-style (GBA Ruby/Sapphire/Emerald) pixel art per the spec below. Do NOT copy');
P('any real Pokemon designs, names, or sprites — everything is original.');
P('- Honor the EXACT pixel dimensions, transparent-PNG requirement, and file paths.');
P('  The game blits every asset 1:1, so wrong sizes render broken.');
P('- Save all files under the `assets/` folder tree described below, and also write');
P('  `assets/manifest.json` listing every PNG you created (format shown below).');
P('- Partial deliveries work: start with the 100 fakemon (front+back, 64x64), then');
P('  characters, tiles, battle backgrounds, and finally the GUI frames/icons.');
P('- Back sprites face away but with the head/gaze angled UP-AND-RIGHT toward the foe.');
P('- Keep filenames lowercase and exactly as written. Work top to bottom.');
P();
P('---');
P();
P('# COMPLETE ART ASSET BRIEF');
P();
P('You are producing the pixel-art assets for an original Gen-3-style (Ruby/Sapphire/');
P('Emerald era) 2D monster-catching game called **Legends of Norvenna**. Everything is');
P('ORIGINAL — do not copy any real Pokémon designs, names, or sprites.');
P();
P('## GLOBAL STYLE');
P('- Era look: GBA Gen-3. Bold dark outline around each sprite, 3–4 tone cel shading,');
P('  light source upper-left, a soft cast shadow where forms overlap. No anti-aliasing');
P('  fuzz, no gradients — clean indexed-looking pixels.');
P('- **Transparent background (PNG alpha).** No background fill, no ground shadow baked in');
P('  unless noted.');
P('- Readable silhouette first: the black outline alone must identify the creature.');
P('- Vary poses so no two designs read as the same blob recolored. Rotate body plans:');
P('  quadruped / biped / serpentine / floating / winged / insectoid / aquatic.');
P('- Exact canvas sizes below are HARD requirements (the engine blits them 1:1).');
P();
P('## FOLDER LAYOUT (create these folders; filenames are exact, lowercase)');
P('```');
P('assets/');
P('  pokemon/front/<key>.png     64x64  three-quarter FRONT view');
P('  pokemon/back/<key>.png      64x64  BACK view, head turned slightly UP-RIGHT');
P('                                     (as if looking at the opponent up-right)');
P('  chars/<id>_<dir>_<frame>.png 16x22 overworld walker (dir: down/up/left/right,');
P('                                     frame: 0 idle-step, 1 alt-step)');
P('  tiles/<id>.png              16x16  (animated tiles: <id>_0.png, <id>_1.png, ...)');
P('  battlebg/<kind>.png         240x112 battle backdrop (opaque OK)');
P('  ui/title_logo.png           ~180x48 transparent logo art (optional)');
P('  ui/ball.png                 16x16  the capture "orb" (red/white)');
P('```');
P('Also write **`assets/manifest.json`** listing every PNG you delivered, e.g.:');
P('```json');
P('{ "files": ["pokemon/front/cindrel.png", "pokemon/back/cindrel.png", "tiles/grass.png"] }');
P('```');
P('The engine reads that manifest and auto-substitutes each listed PNG for its built-in');
P('procedural art. Anything you DON\'T deliver keeps the built-in art, so partial');
P('deliveries work fine — start with the 100 fakemon front+back if you like.');
P();

// ---- Pokemon ----
P('## 1) FAKEMON SPRITES — 100 species × (front 64×64 + back 64×64)');
P('For EACH species: draw a **front** (three-quarter, facing camera) and a **back**');
P('(rear view, but the head/gaze angled up-and-right toward the off-screen opponent).');
P('Match the type mood: cute basics, fierce finals, majestic legendary. Fill the frame');
P('(final stages ~52px tall; basics ~28–34px). Use the concept + dex text as direction.');
P();
P('| # | key (filename) | Name | Type(s) | Class | Visual direction (from dex) |');
P('|---|---|---|---|---|---|');
for (const key of Dex.order) {
  const d = Dex.byKey[key];
  const types = d.types.join('/');
  const entry = (d.dex.entry || '').replace(/\|/g, '/');
  P(`| ${d.id} | \`${key}\` | ${d.name} | ${types} | ${d.dex.species} | ${entry} |`);
}
P();
P('Stage/evolution context (draw evolved forms bigger & more elaborate than their pre-evos):');
for (const key of Dex.order) {
  const d = Dex.byKey[key];
  if (!d.evolve) continue;
  const opts = Array.isArray(d.evolve) ? d.evolve : [d.evolve];
  const to = opts.map((o) => `${Dex.byKey[o.to] ? Dex.byKey[o.to].name : o.to}${o.stone ? ' (stone)' : o.friendship ? ' (friendship)' : ' (Lv' + o.level + ')'}`).join('  OR  ');
  P(`- ${d.name} → ${to}`);
}
P();

// ---- Characters ----
P('## 2) OVERWORLD CHARACTERS — 16×22, 4 directions × 2 walk frames');
P('Chibi Gen-3 overworld style (2-head-tall). For each id below produce 8 files:');
P('`<id>_down_0 _down_1 _up_0 _up_1 _left_0 _left_1 _right_0 _right_1`.');
P('Left/right may be mirrors. Frame 0/1 alternate the stepping leg. Transparent bg.');
P();
P('| id (filename prefix) | who they are |');
P('|---|---|');
const charWho = {
  player_m: 'Male player hero (red cap + jacket)', player_f: 'Female player hero (pink cap, longer hair)',
  prof: 'Professor Aspen (white lab coat, grey hair)', rival_m: 'Rival Kai (friendly, blue hair, green top)',
  rival_f: 'Rival Vera (arrogant, pink hair, purple top)', ionar_grunt: 'Team Ionar grunt (storm-grey uniform, cap)',
  ionar_boss: 'Magnus Voll, Ionar leader (dark coat, silver hair)', npc_villager: 'Generic villager man',
  npc_woman: 'Generic woman (long hair)', npc_oldman: 'Old man (grey hair, cane vibe)',
  npc_fisher: 'Fisher (hat, blue coat)', npc_hiker: 'Hiker (orange coat, brown hat)',
  npc_sailor: 'Sailor (white uniform)', npc_ranger: 'Ranger (green, hat)',
  nurse: 'Pokecenter nurse (pink hair, white uniform)', clerk: 'Pokemart clerk (blue uniform)',
  gym_leader: 'Gym leader Astrid (gold hair, purple outfit)', champion: 'Champion Sigrid (ranger-turned-champion)',
};
for (const id of Object.keys(Chars.palettes)) P(`| \`${id}\` | ${charWho[id] || 'NPC'} |`);
P();

// ---- Tiles ----
P('## 3) TILES — 16×16 each, seamless/tileable, transparent where noted');
P('Overworld & interior tiles. Animated tiles need one PNG per frame (`<id>_0.png` ...).');
P();
P('| id (filename) | frames | what it is |');
P('|---|---|---|');
const tileWho = {
  grass: 'Base grass', tallgrass: 'Tall grass (encounters)', flowers: 'Flower grass (anim sway)',
  path: 'Dirt path', sand: 'Sand', snow: 'Snow ground', tallsnow: 'Tall snow grass', ice: 'Slippery ice',
  water: 'Water (anim)', waterfall: 'Waterfall (anim)', tree: 'Leafy tree (solid)', pine: 'Snow-capped pine',
  snowpine: 'Snowy pine', rock: 'Rock wall/cliff', boulder: 'Pushable boulder (Strength)',
  crackrock: 'Cracked rock (Rock Smash)', cutbush: 'Cuttable bush (Cut)', ledge: 'Jump-down ledge',
  fence: 'Wooden fence', sign: 'Signpost', 'roof_l': 'Red roof left', 'roof_m': 'Red roof mid', 'roof_r': 'Red roof right',
  'roofb_l': 'Blue roof left', 'roofb_m': 'Blue roof mid', 'roofb_r': 'Blue roof right',
  'roofg_l': 'Green roof left (lab)', 'roofg_m': 'Green roof mid', 'roofg_r': 'Green roof right',
  'roofp_l': 'Purple roof left (gym)', 'roofp_m': 'Purple roof mid', 'roofp_r': 'Purple roof right',
  wall: 'Building wall', window: 'Lit window (anim)', door: 'Door', mat: 'Welcome mat',
  center_sign: 'Pokecenter sign (anim)', mart_sign: 'Pokemart sign', gym_statue: 'Gym statue',
  cavefloor: 'Cave floor', cavewall: 'Cave wall', crystal: 'Glowing crystal (anim)', stairs_down: 'Cave stairs',
  floor_wood: 'Wood floor', floor_tile: 'Tile floor', rug: 'Rug', wall_in: 'Interior wall',
  table: 'Table', chair: 'Chair', bed: 'Bed', bookshelf: 'Bookshelf', counter: 'Shop/center counter',
  pc: 'Storage PC (anim)', plant: 'Potted plant', lab_machine: 'Lab machine (anim)', healer: 'Healing machine (anim)',
};
for (const t of Tiles.list()) P(`| \`${t.id}\` | ${t.anim} | ${tileWho[t.id] || 'tile'} |`);
P();

// ---- Battle backgrounds ----
P('## 4) BATTLE BACKGROUNDS — 240×112, opaque');
P('Each has distant scenery + two ground platforms (enemy upper-right, player lower-left).');
P('| kind (filename) | scene |');
P('|---|---|');
const bg = { grass: 'Grassy meadow, treeline', snow: 'Snowfield with mountains', cave: 'Dark cavern, stalactites',
  water: 'Open sea / shore', volcano: 'Geothermal crags, lava glow', aurora: 'Night highlands under the aurora',
  interior: 'Indoor gym/room floor' };
for (const k of Object.keys(bg)) P(`| \`${k}\` | ${bg[k]} |`);
P();
P('## 5) GUI / INTERFACE ART — the on-screen frames, bars, and icons');
P('These skin the menus, dialogue, and battle HUD. All transparent PNG unless noted.');
P('Frames are drawn as 9-slice (corners fixed, edges/centre stretch), so make a clean');
P('bordered box with a 3px corner. Keep a cohesive icy/parchment Gen-3 UI theme.');
P('```');
P('assets/ui/frame_msg.png     32x32  9-slice dialogue/message box (cream fill, blue border)');
P('assets/ui/frame_menu.png    32x32  9-slice menu/panel box (lighter, thinner border)');
P('assets/ui/frame_battle.png  32x32  9-slice battle HUD info box (rounded, opaque-ish)');
P('assets/ui/cursor.png         8x8   the "▶" selection arrow (red)');
P('assets/ui/hpbar.png         64x8   HP bar frame + fill guide (green>yellow>red zones)');
P('assets/ui/expbar.png        64x4   EXP bar (blue fill on dark track)');
P('assets/ui/ball.png          16x16  capture orb: top red, bottom white, dark band, shine');
P('assets/ui/title_logo.png   180x48  "LEGENDS OF NORVENNA" logo, icy blue, transparent');
P('assets/ui/badge_<0-7>.png   16x16  the 8 gym badges (see list below), transparent');
P('assets/ui/status_<id>.png   20x9   status tags: id = psn,brn,par,slp,frz,tox');
P('assets/ui/type_<type>.png   40x11  the 18 type chips (colored pill + short label)');
P('```');
P('The 18 TYPES (for type_<type>.png, lowercase): normal, fire, water, electric, grass,');
P('ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark,');
P('steel, fairy. Use these theme colors as the pill fill:');
P('```');
const tcol = ctx.__X.TypeColors;
for (const t of Object.keys(tcol)) P('  ' + t.toLowerCase().padEnd(9) + tcol[t]);
P('```');
P('The 8 GYM BADGES (badge_0..badge_7) — small emblem, ~14px, distinct color/shape each:');
const badges = ['Steadfast (Normal, Astrid) — a shield/heart, grey-gold',
  'Verdant (Grass, Eirik) — a leaf, green', 'Tidal (Water, Runa) — a wave drop, blue',
  'Ember (Fire, Brandt) — a flame, orange-red', 'Lumen (Psychic, Sylja) — an eye/star, pink',
  'Iron (Steel, Torvald) — a gear, steel-grey', 'Glacier (Ice, Yrsa) — a snowflake, cyan',
  'Storm (Dragon, Signe) — a lightning wing, violet'];
badges.forEach((b, i) => P('  badge_' + i + ': ' + b));
P();
// ---- Item icons ----
P('## 6) ITEM ICONS — 16×16, transparent');
P('One small icon per item, shown in the bag, shop, and party screens. Keep them');
P('crisp and readable at 16px. Group by kind (balls look like capture orbs, potions');
P('like bottles, berries/charms for held items, gems for stones, discs for TMs, etc.).');
P('`items/<id>.png` for each id below:');
P();
P('| id (filename) | name | kind | look |');
P('|---|---|---|---|');
const kindLook = { ball: 'capture orb (red top / white bottom, tinted)', medicine: 'bottle/potion',
  battle: 'stat vial', misc: 'spray can / charm', stone: 'faceted gem', tm: 'data disc (type-colored)',
  key: 'key/quest item', held: 'berry or charm' };
for (const id of Object.keys(ctx.__X.Items)) {
  const it = ctx.__X.Items[id];
  P(`| \`${id}\` | ${it.name} | ${it.kind} | ${kindLook[it.kind] || 'item'} |`);
}
P();
P('## 7) MANIFEST');
P('Write `assets/manifest.json` listing every PNG you delivered, e.g.:');
P('```json');
P('{ "files": ["pokemon/front/cindrel.png", "pokemon/back/cindrel.png",');
P('            "chars/player_m_down_0.png", "tiles/grass.png", "ui/type_fire.png"] }');
P('```');
P();
P('## DELIVERY');
P('Drop the PNGs into the folder tree above (relative to the game root). Keep exact');
P('names and sizes. The game will pick them up automatically. Thank you!');

writeFileSync(path.join(root, 'ASSETS_FOR_CODEX.md'), md);
console.log('Wrote ASSETS_FOR_CODEX.md (' + md.length + ' bytes, ' + Dex.order.length + ' species).');
