// Procedural medieval village generator (jigsaw-style).
//
// Roads grow outward from a central plaza in random directions with random
// lengths and branches; building lots snap onto the roads and each lot picks
// a random template (house, blacksmith, tavern, farm, chapel, market stall)
// rotated to face its road. Buildings sample terrain height at their lot so
// the village follows the landscape. Every village is different.

import { q, ri, pick, groundY } from "./gen_util.js";

// ---------------------------------------------------------------
// rotated-template plotter
// r=0: door faces +z   r=1: faces +x   r=2: faces -z   r=3: faces -x
// origin (ox,oz) is always the min-corner of the rotated footprint
// ---------------------------------------------------------------
function plotter(dim, ox, oy, oz, r, w, d) {
  const map = (lx, lz) => {
    switch (r) {
      case 0: return [ox + lx, oz + lz];
      case 1: return [ox + lz, oz + (w - 1 - lx)];
      case 2: return [ox + (w - 1 - lx), oz + (d - 1 - lz)];
      default: return [ox + (d - 1 - lz), oz + lx];
    }
  };
  return {
    fill(x0, y0, z0, x1, y1, z1, block) {
      const [ax0, az0] = map(x0, z0);
      const [ax1, az1] = map(x1, z1);
      q(dim, `fill ${Math.min(ax0, ax1)} ${oy + y0} ${Math.min(az0, az1)} ${Math.max(ax0, ax1)} ${oy + y1} ${Math.max(az0, az1)} ${block}`);
    },
    set(lx, ly, lz, block) {
      const [ax, az] = map(lx, lz);
      q(dim, `setblock ${ax} ${oy + ly} ${az} ${block}`);
    },
    summon(ent, lx, ly, lz) {
      const [ax, az] = map(lx, lz);
      q(dim, `summon ${ent} ${ax} ${oy + ly} ${az}`);
    },
    chest(lx, ly, lz, items) {
      const [ax, az] = map(lx, lz);
      q(dim, `setblock ${ax} ${oy + ly} ${az} chest`);
      items.forEach((it, i) =>
        q(dim, `replaceitem block ${ax} ${oy + ly} ${az} slot.container ${i} ${it}`));
    },
  };
}

// ---------------------------------------------------------------
// building templates — door on local z = d-1 edge (faces +z at r=0)
// ---------------------------------------------------------------
function tSmallHouse(p, w, d) {
  p.fill(0, -1, 0, w - 1, -1, d - 1, "cobblestone");
  p.fill(0, 0, 0, w - 1, 3, d - 1, "planks");
  p.fill(1, 0, 1, w - 2, 3, d - 2, "air");
  for (const cx of [0, w - 1]) for (const cz of [0, d - 1])
    p.fill(cx, 0, cz, cx, 3, cz, "oak_log");
  const dx = Math.floor(w / 2);
  p.fill(dx, 0, d - 1, dx, 1, d - 1, "air");
  p.set(1, 1, 0, "glass_pane"); p.set(w - 2, 1, 0, "glass_pane");
  p.set(0, 1, Math.floor(d / 2), "glass_pane");
  p.set(w - 1, 1, Math.floor(d / 2), "glass_pane");
  for (let i = 0; i <= Math.ceil(w / 2); i++) {
    p.fill(i, 3 + i, -1, i, 3 + i, d, "oak_stairs");
    p.fill(w - 1 - i, 3 + i, -1, w - 1 - i, 3 + i, d, "oak_stairs");
  }
  p.fill(dx, 3 + Math.floor(w / 2), -1, Math.ceil(w / 2), 3 + Math.floor(w / 2), d, "planks");
  p.set(1, 0, 1, "barrel");
  p.set(w - 2, 0, 1, "crafting_table");
  p.set(dx, 2, 1, "lantern");
}

function tBlacksmith(p, w, d) {
  p.fill(0, -1, 0, w - 1, -1, d - 1, "stonebrick");
  p.fill(0, 0, 0, w - 1, 3, d - 1, "cobblestone");
  p.fill(1, 0, 1, w - 2, 3, d - 2, "air");
  p.fill(1, 0, d - 1, w - 2, 2, d - 1, "air");
  p.fill(0, 4, 0, w - 1, 4, d - 1, "stonebrick");
  p.set(1, 0, 1, "blast_furnace");
  p.set(3, 0, 1, "anvil");
  p.set(w - 2, 0, 1, "campfire");
  p.set(0, 1, Math.floor(d / 2), "iron_bars");
  p.set(w - 1, 1, Math.floor(d / 2), "iron_bars");
  p.set(2, 3, d - 2, "lantern");
  p.chest(w - 2, 0, 2, ["iron_ingot 6", "md:iron_plating 2", "iron_sword 1"]);
}

function tTavern(p, w, d) {
  p.fill(0, -1, 0, w - 1, -1, d - 1, "cobblestone");
  p.fill(0, 0, 0, w - 1, 4, d - 1, "planks");
  p.fill(1, 0, 1, w - 2, 4, d - 2, "air");
  for (const cx of [0, w - 1]) for (const cz of [0, d - 1])
    p.fill(cx, 0, cz, cx, 4, cz, "oak_log");
  const dx = Math.floor(w / 2);
  p.fill(dx - 1, 0, d - 1, dx + 1, 1, d - 1, "air");
  p.fill(0, 5, 0, w - 1, 5, d - 1, "planks");
  for (let x = 2; x < w - 2; x += 3) {
    p.set(x, 0, 2, "oak_fence");
    p.set(x, 1, 2, "planks");
  }
  p.set(1, 0, d - 3, "barrel"); p.set(1, 1, d - 3, "barrel");
  p.set(w - 2, 0, 1, "barrel"); p.set(w - 2, 1, 1, "barrel");
  p.set(dx, 3, 2, "lantern");
  p.set(1, 1, 0, "glass_pane"); p.set(w - 2, 1, 0, "glass_pane");
  p.set(0, 1, 2, "glass_pane"); p.set(w - 1, 1, 2, "glass_pane");
  p.summon("minecraft:villager_v2", 3, 1, 3);
}

function tFarm(p, w, d) {
  p.fill(0, 0, 0, w - 1, 0, d - 1, "oak_fence");
  p.fill(1, 0, 1, w - 2, 0, d - 2, "air");
  p.fill(1, -1, 1, w - 2, -1, d - 2, "farmland");
  const mid = Math.floor(w / 2);
  p.fill(mid, -1, 1, mid, -1, d - 2, "water");
  p.fill(1, 0, 1, w - 2, 0, d - 2, "wheat");
  p.fill(mid, 0, 1, mid, 0, d - 2, "air");
  p.set(mid, 0, d - 1, "air");
  p.set(0, 0, 0, "hay_block"); p.set(w - 1, 0, 0, "hay_block");
  p.set(0, 1, 0, "hay_block");
  p.summon("minecraft:villager_v2", 2, 1, d - 2);
}

function tChapel(p, w, d) {
  p.fill(0, -1, 0, w - 1, -1, d - 1, "stonebrick");
  p.fill(0, 0, 0, w - 1, 5, d - 1, "stonebrick");
  p.fill(1, 0, 1, w - 2, 5, d - 2, "air");
  const dx = Math.floor(w / 2);
  p.fill(dx, 0, d - 1, dx, 1, d - 1, "air");
  for (let z = 2; z < d - 2; z += 3) {
    p.fill(0, 2, z, 0, 3, z, "glass_pane");
    p.fill(w - 1, 2, z, w - 1, 3, z, "glass_pane");
  }
  p.fill(0, 6, 0, w - 1, 6, d - 1, "planks");
  p.fill(dx - 1, 6, d - 3, dx + 1, 9, d - 1, "stonebrick");
  p.fill(dx, 7, d - 2, dx, 8, d - 2, "air");
  p.set(dx, 8, d - 2, "bell");
  p.set(dx, 0, 1, "gold_block");
  p.set(dx - 1, 0, 1, "torch");
  p.set(dx + 1, 0, 1, "torch");
  p.summon("minecraft:villager_v2", dx, 1, 3);
}

function tMarket(p, w, d) {
  for (const cx of [0, w - 1]) for (const cz of [0, d - 1])
    p.fill(cx, 0, cz, cx, 2, cz, "oak_fence");
  const wool = pick(["red_wool", "white_wool", "yellow_wool", "lime_wool"]);
  p.fill(0, 3, 0, w - 1, 3, d - 1, wool);
  p.set(1, 0, 1, "barrel");
  p.set(w - 2, 0, 1, "hay_block");
  p.chest(Math.floor(w / 2), 0, Math.floor(d / 2), ["bread 6", "emerald 3", "apple 5"]);
  p.summon("minecraft:villager_v2", 1, 1, d - 2);
}

const TEMPLATES = [
  { build: tSmallHouse, w: 7, d: 7, weight: 4 },
  { build: tSmallHouse, w: 8, d: 6, weight: 2 },
  { build: tBlacksmith, w: 8, d: 7, weight: 2 },
  { build: tTavern, w: 9, d: 9, weight: 2 },
  { build: tFarm, w: 9, d: 7, weight: 3 },
  { build: tChapel, w: 7, d: 11, weight: 1 },
  { build: tMarket, w: 5, d: 5, weight: 2 },
];
function pickTemplate() {
  const total = TEMPLATES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TEMPLATES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return TEMPLATES[0];
}

// terrain-following road, 3 wide, sampled every 4 blocks, lantern posts every 8
function layRoad(dim, cx, cyG, cz, dx, dz, from, len) {
  for (let t = from; t <= from + len; t += 4) {
    const x = cx + dx * t, z = cz + dz * t;
    const gy = groundY(dim, x, cyG, z);
    const ax0 = dx !== 0 ? x : x - 1;
    const ax1 = dx !== 0 ? x + dx * 3 : x + 1;
    const az0 = dz !== 0 ? z : z - 1;
    const az1 = dz !== 0 ? z + dz * 3 : z + 1;
    q(dim, `fill ${Math.min(ax0, ax1)} ${gy} ${Math.min(az0, az1)} ${Math.max(ax0, ax1)} ${gy} ${Math.max(az0, az1)} cobblestone`);
    q(dim, `fill ${Math.min(ax0, ax1)} ${gy + 1} ${Math.min(az0, az1)} ${Math.max(ax0, ax1)} ${gy + 3} ${Math.max(az0, az1)} air`);
    if ((t - from) % 8 === 0) {
      const lx = dx !== 0 ? x : x + 2;
      const lz = dz !== 0 ? z : z + 2;
      q(dim, `fill ${lx} ${gy + 1} ${lz} ${lx} ${gy + 2} ${lz} oak_fence`);
      q(dim, `setblock ${lx} ${gy + 3} ${lz} lantern`);
    }
  }
}

// place one building lot beside the road at distance t, on the given side
function placeLot(dim, cx, cyG, cz, dx, dz, t, side, tpl) {
  const rx = cx + dx * t, rz = cz + dz * t;
  const gap = 3;
  // rotated world footprint: fw along x, fd along z
  const fw = dx !== 0 ? tpl.w : tpl.d;
  const fd = dx !== 0 ? tpl.d : tpl.w;
  let px, pz, r;
  if (dx !== 0) {
    px = rx - Math.floor(fw / 2);
    if (side > 0) { pz = rz + gap; r = 2; }
    else { pz = rz - gap - fd + 1; r = 0; }
  } else {
    pz = rz - Math.floor(fd / 2);
    if (side > 0) { px = rx + gap; r = 3; }
    else { px = rx - gap - fw + 1; r = 1; }
  }
  const gy = groundY(dim, px + Math.floor(fw / 2), cyG, pz + Math.floor(fd / 2));
  // level the pad and clear headroom
  q(dim, `fill ${px - 1} ${gy} ${pz - 1} ${px + fw} ${gy} ${pz + fd} grass`);
  q(dim, `fill ${px - 1} ${gy + 1} ${pz - 1} ${px + fw} ${gy + 14} ${pz + fd} air`);
  const p = plotter(dim, px, gy + 1, pz, r, tpl.w, tpl.d);
  tpl.build(p, tpl.w, tpl.d);
  // gravel path stub from the road to the lot
  const sx = dx !== 0 ? rx : (side > 0 ? rx + 2 : rx - 2);
  const sz = dx !== 0 ? (side > 0 ? rz + 2 : rz - 2) : rz;
  const ex = px + Math.floor(fw / 2), ez = pz + Math.floor(fd / 2);
  q(dim, `fill ${Math.min(sx, ex)} ${gy} ${Math.min(sz, ez)} ${Math.max(sx, ex)} ${gy} ${Math.max(sz, ez)} gravel`);
}

// ---------------------------------------------------------------
// the generator — centered at (cx, ~cyG, cz)
// ---------------------------------------------------------------
export function buildVillage(dim, cx, cyG, cz, announceTo) {
  const pg = groundY(dim, cx, cyG, cz);

  // plaza with a well and a bell post
  q(dim, `fill ${cx - 5} ${pg} ${cz - 5} ${cx + 5} ${pg} ${cz + 5} cobblestone`);
  q(dim, `fill ${cx - 5} ${pg + 1} ${cz - 5} ${cx + 5} ${pg + 8} ${cz + 5} air`);
  q(dim, `fill ${cx - 4} ${pg} ${cz - 4} ${cx + 4} ${pg} ${cz + 4} gravel`);
  q(dim, `fill ${cx - 1} ${pg + 1} ${cz - 1} ${cx + 1} ${pg + 1} ${cz + 1} cobblestone`);
  q(dim, `setblock ${cx} ${pg + 1} ${cz} water`);
  q(dim, `setblock ${cx - 1} ${pg + 2} ${cz - 1} oak_fence`);
  q(dim, `setblock ${cx + 1} ${pg + 2} ${cz + 1} oak_fence`);
  q(dim, `setblock ${cx - 1} ${pg + 3} ${cz - 1} torch`);
  q(dim, `setblock ${cx + 1} ${pg + 3} ${cz + 1} torch`);
  q(dim, `fill ${cx + 3} ${pg + 1} ${cz + 3} ${cx + 3} ${pg + 3} ${cz + 3} oak_fence`);
  q(dim, `setblock ${cx + 3} ${pg + 4} ${cz + 3} bell`);

  // roads outward in random cardinal directions
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(() => Math.random() < 0.92);
  if (!dirs.length) dirs.push([1, 0]);
  let lots = 0;

  for (const [dx, dz] of dirs) {
    const len = ri(14, 26);
    layRoad(dim, cx, cyG, cz, dx, dz, 6, len);
    for (let t = 11; t < 6 + len - 5; t += ri(9, 12)) {
      for (const side of [-1, 1]) {
        if (Math.random() < 0.35) continue; // gaps — villages breathe
        placeLot(dim, cx, cyG, cz, dx, dz, t, side, pickTemplate());
        lots++;
      }
    }
    // 50%: a branch road partway along, with its own lot at the end
    if (Math.random() < 0.5) {
      const bt = ri(9, 6 + len - 8);
      const bdx = dz !== 0 ? pick([-1, 1]) : 0;
      const bdz = dx !== 0 ? pick([-1, 1]) : 0;
      const bx = cx + dx * bt, bz = cz + dz * bt;
      const blen = ri(10, 16);
      layRoad(dim, bx, cyG, bz, bdx, bdz, 1, blen);
      placeLot(dim, bx, cyG, bz, bdx, bdz, Math.max(7, blen - 4), pick([-1, 1]), pickTemplate());
      lots++;
    }
  }

  // population + a guard detail
  for (let i = 0; i < ri(3, 6); i++) {
    q(dim, `summon minecraft:villager_v2 ${cx + ri(-4, 4)} ${pg + 1} ${cz + ri(-4, 4)}`);
  }
  q(dim, `summon md:knight ${cx + 2} ${pg + 1} ${cz - 3}`);
  q(dim, `summon md:knight ${cx - 2} ${pg + 1} ${cz + 3}`);
  q(dim, `summon md:archer ${cx - 3} ${pg + 1} ${cz - 3}`);
  q(dim, `summon md:archer ${cx + 3} ${pg + 1} ${cz + 3}`);

  const msg = `{"rawtext":[{"text":"§6A medieval village rises — ${lots} buildings along ${dirs.length} road${dirs.length > 1 ? "s" : ""}. No two are alike."}]}`;
  q(dim, announceTo ? `tellraw "${announceTo}" ${msg}` : `tellraw @a ${msg}`);
}
