// MAP-REGISTRY INTEGRITY (M4a), runnable in plain node:
//   - START_MAP exists; every map builds into a valid Tilemap
//   - spawn, named entries, shrines, enemy spawns, and NPC spots are walkable
//   - every transition's destination map AND entry exist; both sides'
//     zones/entries are walkable
//   - every transition zone is REACHABLE from that map's spawn (flood fill)
//   - seed content wiring: NPC dialogueIds resolve, onEnter cutscenes are
//     registered, quest objective flags are non-empty
// Usage: npm run build && node tools/checkworld.mjs

import { allMaps, getMap, START_MAP } from "../dist/game/maps/registry.js";
import { Tilemap } from "../dist/engine/tilemap.js";
import { TILESET } from "../dist/game/tiles.js";
import { overlapsSolid } from "../dist/engine/collision.js";
import { registerSeedContent } from "../dist/content/seed.js";
import { getDialogue } from "../dist/systems/dialogue.js";
import { getCutscene } from "../dist/systems/cutscene.js";
import { allQuests } from "../dist/systems/story.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

registerSeedContent(); // the world ships with its seed people/cutscenes

ok(getMap(START_MAP) !== undefined, `START_MAP "${START_MAP}" is registered`);
ok(allMaps().length === 4, `4 maps registered (got ${allMaps().length})`);

/** Flood fill of walkable tiles from a start tile. */
function reachableFrom(map, sx, sy) {
  const seen = new Set([`${sx},${sy}`]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (!seen.has(key) && !map.isSolid(nx, ny)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}

const PLAYER_BOX = (p) => ({ x: p.x - 5, y: p.y - 8, w: 10, h: 8 });

for (const entry of allMaps()) {
  const id = entry.id;
  let map;
  try {
    map = new Tilemap(entry.build(), TILESET);
    ok(true, `${id}: builds into a valid Tilemap (${map.width}x${map.height})`);
  } catch (err) {
    ok(false, `${id}: build threw — ${err}`);
    continue;
  }

  // Spawn.
  ok(!overlapsSolid(PLAYER_BOX(entry.spawn), map), `${id}: spawn is walkable`);
  const seen = reachableFrom(
    map,
    Math.floor(entry.spawn.x / 16),
    Math.floor(entry.spawn.y / 16),
  );

  // Named entries.
  for (const [name, at] of Object.entries(entry.entries)) {
    ok(!overlapsSolid(PLAYER_BOX(at), map), `${id}: entry "${name}" is walkable`);
    ok(
      seen.has(`${Math.floor(at.x / 16)},${Math.floor(at.y / 16)}`),
      `${id}: entry "${name}" is reachable from spawn`,
    );
  }

  // Shrines / enemies / NPCs stand on walkable ground.
  for (const s of entry.shrines) {
    ok(!map.isSolid(s.tx, s.ty), `${id}: shrine (${s.tx},${s.ty}) is walkable`);
    ok(seen.has(`${s.tx},${s.ty}`), `${id}: shrine (${s.tx},${s.ty}) is reachable from spawn`);
  }
  ok(
    entry.enemies.every((e) => !map.isSolid(e.tx, e.ty)),
    `${id}: all ${entry.enemies.length} enemy spawns are walkable`,
  );
  for (const n of entry.npcs) {
    ok(!map.isSolid(n.tx, n.ty), `${id}: NPC "${n.id}" (${n.tx},${n.ty}) is walkable`);
    if (n.dialogueId) {
      ok(getDialogue(n.dialogueId) !== undefined, `${id}: NPC "${n.id}" dialogue "${n.dialogueId}" is registered`);
    }
  }

  // Transitions: graph integrity + walkability + reachability.
  for (const tr of entry.transitions) {
    const dest = getMap(tr.to);
    ok(dest !== undefined, `${id}: transition destination "${tr.to}" exists`);
    if (!dest) continue;
    const destEntry = dest.entries[tr.entry];
    ok(destEntry !== undefined, `${id} -> ${tr.to}: entry "${tr.entry}" exists`);
    if (destEntry) {
      const destMap = new Tilemap(dest.build(), TILESET);
      ok(!overlapsSolid(PLAYER_BOX(destEntry), destMap), `${id} -> ${tr.to}: arrival point is walkable`);
    }
    // At least one walkable tile in the zone, reachable from this map's spawn.
    let zoneWalkable = false;
    let zoneReachable = false;
    for (let dy = 0; dy < tr.zone.h; dy++) {
      for (let dx = 0; dx < tr.zone.w; dx++) {
        const tx = tr.zone.tx + dx, ty = tr.zone.ty + dy;
        if (!map.isSolid(tx, ty)) zoneWalkable = true;
        if (seen.has(`${tx},${ty}`)) zoneReachable = true;
      }
    }
    ok(zoneWalkable, `${id} -> ${tr.to}: trigger zone has walkable tiles`);
    ok(zoneReachable, `${id} -> ${tr.to}: trigger zone is reachable from spawn`);
  }

  // On-enter cutscene must exist (seed wires valleyWilds).
  if (entry.onEnter) {
    ok(
      getCutscene(entry.onEnter.cutscene) !== undefined,
      `${id}: onEnter cutscene "${entry.onEnter.cutscene}" is registered`,
    );
    ok(entry.onEnter.onceFlag.length > 0, `${id}: onEnter has a once-flag`);
  }
}

// Every transition is two-way SOMEHOW (the world graph has no dead ends):
// each destination map has at least one transition back out.
for (const entry of allMaps()) {
  for (const tr of entry.transitions) {
    const dest = getMap(tr.to);
    if (!dest) continue;
    ok(dest.transitions.length > 0, `${entry.id} -> ${tr.to}: destination is not a dead end`);
  }
}

// Quest data sanity (the seed quest at minimum).
const quests = allQuests();
ok(quests.length >= 1, `at least one quest registered (got ${quests.length})`);
for (const q of quests) {
  ok(q.objectives.length > 0, `quest "${q.id}" has objectives`);
  ok(
    q.objectives.every((o) => typeof o.flag === "string" && o.flag.length > 0),
    `quest "${q.id}" objectives all have completion flags`,
  );
}
ok(quests.some((q) => q.autoStart && q.id === "first-steps"), 'seed quest "first-steps" auto-starts');

console.log(failures === 0 ? "\nAll world-graph checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
