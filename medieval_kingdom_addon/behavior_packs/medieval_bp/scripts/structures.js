// Natural structure generation + locate system.
//
// The world is divided into 320x320 cells. Each cell deterministically rolls
// (from its coordinates + a per-world salt) whether it holds a structure and
// which kind: watchtower, armor shrine, village, or castle. When a player
// wanders near an ungenerated structure point, it is built into the world.
// Every generated structure is recorded so /function locate_* can report the
// nearest one with distance and direction — Bedrock's vanilla /locate cannot
// learn custom structures, so this registry stands in for it.

import { world, system } from "@minecraft/server";
import { q, ri, groundY } from "./gen_util.js";
import { buildVillage } from "./village.js";

const CELL = 320;
const TRIGGER = 40; // build when a player is this close to the structure point

// ---------------------------------------------------------------
// builders (tower / castle / shrine) — absolute coordinates
// ---------------------------------------------------------------
export function buildTower(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  q(dim, `fill ${cx - 4} ${Y(-1)} ${cz - 4} ${cx + 4} ${Y(0)} ${cz + 4} stonebrick`);
  q(dim, `fill ${cx - 4} ${Y(1)} ${cz - 4} ${cx + 4} ${Y(19)} ${cz + 4} stonebrick`);
  q(dim, `fill ${cx - 3} ${Y(1)} ${cz - 3} ${cx + 3} ${Y(19)} ${cz + 3} air`);
  q(dim, `fill ${cx - 3} ${Y(6)} ${cz - 3} ${cx + 3} ${Y(6)} ${cz + 3} stonebrick`);
  q(dim, `fill ${cx - 3} ${Y(12)} ${cz - 3} ${cx + 3} ${Y(12)} ${cz + 3} stonebrick`);
  q(dim, `setblock ${cx + 3} ${Y(6)} ${cz + 3} air`);
  q(dim, `setblock ${cx + 3} ${Y(12)} ${cz + 3} air`);
  q(dim, `fill ${cx + 3} ${Y(1)} ${cz + 3} ${cx + 3} ${Y(18)} ${cz + 3} ladder ["facing_direction"=2]`);
  q(dim, `fill ${cx} ${Y(1)} ${cz - 4} ${cx} ${Y(2)} ${cz - 4} air`);
  for (const [wx, wy, wz] of [[0, 3, 4], [0, 9, 4], [0, 15, 4], [-4, 4, 0], [-4, 10, 0], [4, 4, 0], [4, 10, 0], [0, 4, -4], [0, 10, -4]]) {
    q(dim, `setblock ${cx + wx} ${Y(wy)} ${cz + wz} air`);
  }
  for (const [tx, ty, tz] of [[-2, 2, -2], [2, 2, 2], [-2, 8, -2], [-2, 14, -2]]) {
    q(dim, `setblock ${cx + tx} ${Y(ty)} ${cz + tz} torch`);
  }
  q(dim, `fill ${cx - 4} ${Y(20)} ${cz - 4} ${cx + 4} ${Y(20)} ${cz + 4} stonebrick`);
  q(dim, `fill ${cx - 3} ${Y(20)} ${cz - 3} ${cx + 3} ${Y(20)} ${cz + 3} air`);
  for (let i = -4; i <= 4; i += 2) {
    q(dim, `setblock ${cx + i} ${Y(21)} ${cz - 4} stonebrick`);
    q(dim, `setblock ${cx + i} ${Y(21)} ${cz + 4} stonebrick`);
    q(dim, `setblock ${cx - 4} ${Y(21)} ${cz + i} stonebrick`);
    q(dim, `setblock ${cx + 4} ${Y(21)} ${cz + i} stonebrick`);
  }
  q(dim, `setblock ${cx - 2} ${Y(1)} ${cz + 2} chest`);
  q(dim, `replaceitem block ${cx - 2} ${Y(1)} ${cz + 2} slot.container 0 iron_ingot 8`);
  q(dim, `replaceitem block ${cx - 2} ${Y(1)} ${cz + 2} slot.container 1 arrow 32`);
  q(dim, `replaceitem block ${cx - 2} ${Y(1)} ${cz + 2} slot.container 2 bread 6`);
  q(dim, `replaceitem block ${cx - 2} ${Y(1)} ${cz + 2} slot.container 3 emerald 4`);
  q(dim, `summon md:knight ${cx - 2} ${Y(1)} ${cz - 2}`);
  q(dim, `summon md:archer ${cx} ${Y(21)} ${cz}`);
}

export function buildCastle(dim, ccx, cyG, ccz) {
  const g = groundY(dim, ccx, cyG, ccz);
  const Y = (n) => g + 1 + n;
  const R = 20, WALL = 6, TOWER = 12;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${ccx + x0} ${Y(y0)} ${ccz + z0} ${ccx + x1} ${Y(y1)} ${ccz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${ccx + x} ${Y(y)} ${ccz + z} ${b}`);

  F(-R, -1, -R, R, -1, R, "stonebrick");
  F(-R, 0, -R, R, 17, R, "air");
  F(-R, 0, -R, R, WALL, -R + 1, "stonebrick");
  F(-R, 0, R - 1, R, WALL, R, "stonebrick");
  F(-R, 0, -R + 2, -R + 1, WALL, R - 2, "stonebrick");
  F(R - 1, 0, -R + 2, R, WALL, R - 2, "stonebrick");
  for (const e of [-R, R]) {
    F(-R, WALL + 1, e, R, WALL + 1, e, "stonebrick");
    F(e, WALL + 1, -R, e, WALL + 1, R, "stonebrick");
  }
  for (let i = -R; i <= R; i += 2) {
    S(i, WALL + 2, -R, "stonebrick"); S(i, WALL + 2, R, "stonebrick");
    S(-R, WALL + 2, i, "stonebrick"); S(R, WALL + 2, i, "stonebrick");
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = Math.min(sx * (R - 6), sx * R), x1 = Math.max(sx * (R - 6), sx * R);
    const z0 = Math.min(sz * (R - 6), sz * R), z1 = Math.max(sz * (R - 6), sz * R);
    F(x0, 0, z0, x1, TOWER, z1, "stonebrick");
    F(x0 + 1, 1, z0 + 1, x1 - 1, TOWER - 1, z1 - 1, "air");
    F(x0, TOWER, z0, x1, TOWER, z1, "stonebrick");
    for (let i = x0; i <= x1; i += 2) { S(i, TOWER + 1, z0, "stonebrick"); S(i, TOWER + 1, z1, "stonebrick"); }
    for (let i = z0; i <= z1; i += 2) { S(x0, TOWER + 1, i, "stonebrick"); S(x1, TOWER + 1, i, "stonebrick"); }
    S((x0 + x1) >> 1, 3, z0, "air"); S((x0 + x1) >> 1, 3, z1, "air");
    S(x0, 3, (z0 + z1) >> 1, "air"); S(x1, 3, (z0 + z1) >> 1, "air");
    S((x0 + x1) >> 1, TOWER + 1, (z0 + z1) >> 1, "torch");
  }
  for (const sx of [-1, 1]) {
    const x0 = Math.min(sx * 3, sx * 5), x1 = Math.max(sx * 3, sx * 5);
    F(x0, 0, -R, x1, 10, -R + 2, "stonebrick");
    for (let i = x0; i <= x1; i += 2) { S(i, 11, -R, "stonebrick"); S(i, 11, -R + 1, "stonebrick"); }
  }
  F(-2, 0, -R, 2, 4, -R + 1, "air");
  F(-2, 4, -R, 2, 4, -R + 1, "iron_bars");
  S(-3, 4, -R + 2, "torch"); S(3, 4, -R + 2, "torch");
  // keep
  F(-6, 0, 12, 6, 13, R - 1, "stonebrick");
  F(-5, 1, 13, 5, 12, R - 2, "air");
  F(-1, 1, 12, 1, 3, 12, "air");
  F(-5, 6, 13, 5, 6, R - 2, "stonebrick");
  S(4, 7, 13, "air");
  F(-6, 14, 12, 6, 14, R - 1, "stonebrick");
  for (let i = -6; i <= 6; i += 2) { S(i, 15, 12, "stonebrick"); S(i, 15, R - 1, "stonebrick"); }
  for (const x of [-4, 0, 4]) { S(x, 4, R - 1, "air"); S(x, 9, R - 1, "air"); }
  S(-3, 2, 14, "torch"); S(3, 2, 14, "torch"); S(-3, 8, 14, "torch");
  // hoard
  F(-2, 0, -2, 2, 0, 2, "gold_block");
  F(-1, 1, -1, 1, 1, 1, "gold_block");
  S(0, 2, 0, "diamond_block");
  for (const sx of [-3, 3]) for (const sz of [-3, 3]) S(sx, 0, sz, "emerald_block");
  for (const [hx, hz] of [[4, 0], [-4, 0], [0, 4]]) {
    S(hx, 0, hz, "chest");
    const ax = ccx + hx, az = ccz + hz;
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 0 diamond 5`);
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 1 emerald 10`);
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 2 gold_ingot 20`);
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 3 golden_apple 3`);
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 4 experience_bottle 16`);
    q(dim, `replaceitem block ${ax} ${Y(0)} ${az} slot.container 5 md:dragon_scale 4`);
  }
  q(dim, `replaceitem block ${ccx} ${Y(0)} ${ccz + 4} slot.container 6 totem_of_undying 1`);
  for (let i = -16; i <= 16; i += 4) {
    S(i, WALL + 1, -R + 1, "torch"); S(i, WALL + 1, R - 1, "torch");
    S(-R + 1, WALL + 1, i, "torch"); S(R - 1, WALL + 1, i, "torch");
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    q(dim, `summon md:archer ${ccx + sx * (R - 3)} ${Y(TOWER + 1)} ${ccz + sz * (R - 3)}`);
  q(dim, `summon md:archer ${ccx} ${Y(WALL + 1)} ${ccz + R - 1}`);
  q(dim, `summon md:archer ${ccx + R - 1} ${Y(WALL + 1)} ${ccz}`);
  q(dim, `summon md:archer ${ccx - R + 1} ${Y(WALL + 1)} ${ccz}`);
  q(dim, `summon md:archer ${ccx} ${Y(WALL + 1)} ${ccz - R + 1}`);
  q(dim, `summon md:knight ${ccx - 2} ${Y(0)} ${ccz - 15}`);
  q(dim, `summon md:knight ${ccx + 2} ${Y(0)} ${ccz - 15}`);
  q(dim, `summon md:knight ${ccx - 7} ${Y(0)} ${ccz + 7}`);
  q(dim, `summon md:knight ${ccx + 7} ${Y(0)} ${ccz + 7}`);
  q(dim, `summon md:fire_dragon ${ccx} ${Y(8)} ${ccz}`);
}

export function buildShrine(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  q(dim, `fill ${cx - 4} ${Y(0)} ${cz - 4} ${cx + 4} ${Y(8)} ${cz + 4} air`);
  q(dim, `fill ${cx - 4} ${Y(-1)} ${cz - 4} ${cx + 4} ${Y(-1)} ${cz + 4} mossy_cobblestone`);
  q(dim, `fill ${cx - 3} ${Y(-1)} ${cz - 3} ${cx + 3} ${Y(-1)} ${cz + 3} stonebrick`);
  // broken ring wall + columns of uneven height
  const hts = [3, 1, 4, 2];
  let i = 0;
  for (const [px, pz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    q(dim, `fill ${cx + px} ${Y(0)} ${cz + pz} ${cx + px} ${Y(hts[i % 4])} ${cz + pz} stonebrick`);
    i++;
  }
  q(dim, `fill ${cx - 3} ${Y(0)} ${cz - 3} ${cx + 3} ${Y(0)} ${cz - 3} cobblestone`);
  q(dim, `fill ${cx - 3} ${Y(0)} ${cz + 3} ${cx + 3} ${Y(0)} ${cz + 3} cobblestone`);
  q(dim, `setblock ${cx} ${Y(0)} ${cz - 3} air`);
  q(dim, `setblock ${cx - 3} ${Y(0)} ${cz} mossy_cobblestone`);
  // altar plinth + candles
  q(dim, `setblock ${cx} ${Y(0)} ${cz} stonebrick`);
  q(dim, `setblock ${cx - 2} ${Y(0)} ${cz - 2} torch`);
  q(dim, `setblock ${cx + 2} ${Y(0)} ${cz + 2} torch`);
  q(dim, `setblock ${cx + 2} ${Y(0)} ${cz - 2} chest`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz - 2} slot.container 0 iron_ingot 5`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz - 2} slot.container 1 md:iron_plating 2`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz - 2} slot.container 2 experience_bottle 8`);
  // the guardian awakens
  q(dim, `summon md:animated_armor ${cx} ${Y(1)} ${cz}`);
}

// ---------------------------------------------------------------
// deterministic cell → structure mapping
// ---------------------------------------------------------------
function hash(x, z, salt) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + salt) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function getSalt() {
  let s = world.getDynamicProperty("md:salt");
  if (typeof s !== "number") {
    s = Math.floor(Math.random() * 2147483647);
    world.setDynamicProperty("md:salt", s);
  }
  return s;
}

function cellStructure(cellX, cellZ, salt) {
  const h = hash(cellX, cellZ, salt);
  if (h % 100 < 55) return null; // 45% of cells hold a structure
  const h2 = hash(cellX + 31, cellZ - 17, salt ^ 0x9e3779b9);
  const roll = h % 20;
  const type = roll < 7 ? "tower" : roll < 12 ? "shrine" : roll < 17 ? "village" : "castle";
  return {
    type,
    x: cellX * CELL + 40 + (h2 % (CELL - 80)),
    z: cellZ * CELL + 40 + ((h2 >>> 9) % (CELL - 80)),
  };
}

const BUILDERS = {
  tower: buildTower,
  shrine: buildShrine,
  village: (dim, x, y, z) => buildVillage(dim, x, y, z),
  castle: buildCastle,
};
const NICE = { tower: "watchtower", shrine: "armor shrine", village: "village", castle: "castle" };

function record(type, x, z) {
  const key = `md:reg:${type}`;
  let list = [];
  try {
    list = JSON.parse(world.getDynamicProperty(key) || "[]");
  } catch {}
  list.push([x, z]);
  if (list.length > 120) list.shift();
  try {
    world.setDynamicProperty(key, JSON.stringify(list));
  } catch {}
}

// ---------------------------------------------------------------
// worldgen tick
// ---------------------------------------------------------------
export function initWorldgen() {
  system.runInterval(() => {
    if (world.getDynamicProperty("md:worldgen") === false) return;
    const salt = getSalt();
    let players = [];
    try {
      players = world.getAllPlayers();
    } catch {
      return;
    }
    for (const p of players) {
      const px = Math.floor(p.location.x), pz = Math.floor(p.location.z);
      const pcx = Math.floor(px / CELL), pcz = Math.floor(pz / CELL);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const info = cellStructure(pcx + dx, pcz + dz, salt);
          if (!info) continue;
          const dist = Math.hypot(info.x - px, info.z - pz);
          if (dist > TRIGGER) continue;
          const key = `md:gen:${pcx + dx}:${pcz + dz}`;
          if (world.getDynamicProperty(key)) continue;
          world.setDynamicProperty(key, true);
          try {
            BUILDERS[info.type](p.dimension, info.x, Math.floor(p.location.y), info.z);
            record(info.type, info.x, info.z);
            q(p.dimension, `tellraw "${p.name}" {"rawtext":[{"text":"§7You stumble upon a §6${NICE[info.type]}§7..."}]}`);
          } catch {}
        }
      }
    }
  }, 40);
}

// ---------------------------------------------------------------
// locate + toggle (via /function locate_* and worldgen_on/off)
// ---------------------------------------------------------------
const DIRS = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"];

export function locateStructure(player, type) {
  if (!(type in NICE)) return;
  let list = [];
  try {
    list = JSON.parse(world.getDynamicProperty(`md:reg:${type}`) || "[]");
  } catch {}
  const px = player.location.x, pz = player.location.z;
  let best = null, bd = Infinity;
  for (const [x, z] of list) {
    const d = Math.hypot(x - px, z - pz);
    if (d < bd) { bd = d; best = [x, z]; }
  }
  const dim = player.dimension;
  if (!best) {
    q(dim, `tellraw "${player.name}" {"rawtext":[{"text":"§7No ${NICE[type]} discovered yet — structures generate as you explore. Keep wandering!"}]}`);
    return;
  }
  const ang = Math.atan2(best[1] - pz, best[0] - px); // 0 = east
  const dir = DIRS[((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8];
  q(dim, `tellraw "${player.name}" {"rawtext":[{"text":"§6Nearest ${NICE[type]}: §e${Math.round(bd)} blocks ${dir}§6 at §e${best[0]}, ${best[1]}§6."}]}`);
}

export function setWorldgen(player, on) {
  world.setDynamicProperty("md:worldgen", on);
  q(player.dimension, `tellraw "${player.name}" {"rawtext":[{"text":"§7Natural structure generation is now §${on ? "aON" : "cOFF"}§7."}]}`);
}
