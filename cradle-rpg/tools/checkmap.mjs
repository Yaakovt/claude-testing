// Build-time sanity checks for map data + collision, runnable in plain node
// (sprites bake lazily, so importing game data modules needs no DOM).
// M4a: validates through the MAP REGISTRY (valleyWilds is the renamed
// testValley — same layout, same coordinates). Cross-map graph integrity
// lives in tools/checkworld.mjs.
// Usage: npm run build && node tools/checkmap.mjs
import { getMap } from "../dist/game/maps/registry.js";
import { Tilemap } from "../dist/engine/tilemap.js";
import { TILESET } from "../dist/game/tiles.js";
import { moveAndCollide, overlapsSolid } from "../dist/engine/collision.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

const entry = getMap("valleyWilds");
ok(entry !== undefined, "valleyWilds is registered");
const data = entry.build();
ok(data.width === 40 && data.height === 30, `map is 40x30 (got ${data.width}x${data.height})`);

const map = new Tilemap(data, TILESET);
const SPAWN = entry.spawn;

// Spawn must be walkable.
const spawnBox = { x: SPAWN.x - 5, y: SPAWN.y - 8, w: 10, h: 8 };
ok(!overlapsSolid(spawnBox, map), "spawn point is walkable");

// Flood fill from spawn over walkable tiles.
const sx = Math.floor(SPAWN.x / 16);
const sy = Math.floor(SPAWN.y / 16);
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
const reach = (x, y, label) => ok(seen.has(`${x},${y}`), `reachable from spawn: ${label} (${x},${y})`);
reach(7, 8, "house A doorstep");
reach(30, 17, "house B doorstep");
reach(17, 14, "courtyard interior");
reach(2, 27, "southwest meadow");
reach(37, 2, "northeast shore");

// M3: every meditation shrine must stand on walkable, reachable ground.
ok(entry.shrines.length >= 2 && entry.shrines.length <= 3,
  `2-3 shrines placed (got ${entry.shrines.length})`);
for (const s of entry.shrines) {
  ok(!map.isSolid(s.tx, s.ty), `shrine tile is walkable (${s.tx},${s.ty})`);
  reach(s.tx, s.ty, "meditation shrine");
}

// Courtyard is enclosed: interior unreachable if the gate at (17,12) were solid.
{
  const seen2 = new Set([`${sx},${sy}`]);
  const q2 = [[sx, sy]];
  const blocked = (x, y) => (x === 17 && y === 12) || map.isSolid(x, y);
  while (q2.length) {
    const [x, y] = q2.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (!seen2.has(key) && !blocked(nx, ny)) {
        seen2.add(key);
        q2.push([nx, ny]);
      }
    }
  }
  ok(!seen2.has("17,14"), "courtyard interior is only reachable through its gate");
}

// Pond is solid water; map border is solid (except the gate openings).
ok(map.isSolid(27, 3), "pond water is solid");
ok(map.isSolid(0, 15) && map.isSolid(39, 15) && map.isSolid(25, 0) && map.isSolid(20, 29), "tree border is solid");

// M4a: the two M4a openings exist (west to the village, north to the trail).
ok(!map.isSolid(0, 23) && !map.isSolid(0, 24), "west opening to the Wei village");
ok(!map.isSolid(18, 0) && !map.isSolid(19, 0), "north opening to the Samara trail");

const walkable = seen.size;
console.log(`info  walkable tiles reachable from spawn: ${walkable} / ${data.width * data.height}`);
ok(walkable > 500, "open world is mostly walkable");

// Collision behaviour: sliding along a wall instead of sticking.
{
  // Courtyard west wall is at column 13 (rows 12-18). Stand right of it and push diagonally up-left.
  const box = { x: 14 * 16 + 2, y: 15 * 16 + 4, w: 10, h: 8 };
  const res = moveAndCollide(box, -8, -4, map);
  ok(res.hitX === true, "diagonal into wall: X is blocked");
  ok(res.x === 14 * 16, "diagonal into wall: clamped flush to wall");
  ok(res.y === box.y - 4, "diagonal into wall: still slides on Y");
}
// Moving in the open is unobstructed.
{
  const box = { x: SPAWN.x - 5, y: SPAWN.y - 8, w: 10, h: 8 };
  const res = moveAndCollide(box, 3, -3, map);
  ok(!res.hitX && !res.hitY && res.x === box.x + 3 && res.y === box.y - 3, "free movement is unobstructed");
}

console.log(failures === 0 ? "\nAll map checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
