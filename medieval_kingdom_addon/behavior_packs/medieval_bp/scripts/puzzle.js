// Primeval Shrine + the Rune Seal puzzle.
//
// A walled mossy-stone sanctum houses the Runestone Tyrant and a sealed vault.
// Four md:rune_block seals sit on corner pedestals, each a fixed colour
// (red / yellow / lime / blue). A clue row of wool on the north wall shows the
// order they must be lit in — a per-shrine permutation derived from the shrine
// coordinates, so no two shrines share a solution. Light them in order and the
// vault opens; light one out of order and all four go dark again.
//
// The check is STATELESS: it reads the live md:lit block states each time, so it
// survives world reloads (the lit blocks persist; there is no in-memory progress
// to desync). The only thing stored is each shrine's [cx, gy, cz], in a world
// dynamic property, which also feeds /locate and !locate.

import { world, system, BlockPermutation } from "@minecraft/server";
import { q, groundY } from "./gen_util.js";

// ---------------------------------------------------------------
// deterministic layout — shared by the builder and the validator
// ---------------------------------------------------------------
function hash(x, z, salt) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + (salt | 0)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

const CORNERS = [
  { dx: -7, dz: -7, color: "red" },
  { dx: 7, dz: -7, color: "yellow" },
  { dx: 7, dz: 7, color: "lime" },
  { dx: -7, dz: 7, color: "blue" },
];

// solution order: a deterministic shuffle of the four colours from the coords
export function solutionOrder(cx, cz) {
  const cols = CORNERS.map((c) => c.color);
  let h = hash(cx, cz, 0x51ed2701);
  for (let i = cols.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    const t = cols[i];
    cols[i] = cols[j];
    cols[j] = t;
  }
  return cols;
}

// everything the puzzle needs, derived from (cx, gy, cz)
export function shrineLayout(cx, gy, cz) {
  const floorY = gy + 1;
  const runeY = floorY + 2;
  const runes = CORNERS.map((c) => ({ x: cx + c.dx, y: runeY, z: cz + c.dz, color: c.color }));
  const order = solutionOrder(cx, cz);
  const vault = { x: cx, y: floorY, z: cz + 5 };
  const seal = [
    { x: vault.x, y: vault.y, z: vault.z - 1 },
    { x: vault.x, y: vault.y, z: vault.z + 1 },
    { x: vault.x - 1, y: vault.y, z: vault.z },
    { x: vault.x + 1, y: vault.y, z: vault.z },
    { x: vault.x, y: vault.y + 1, z: vault.z },
  ];
  return { floorY, runeY, runes, order, vault, seal };
}

// ---------------------------------------------------------------
// shrine registry (dynamic property) — capped, JSON, shard-safe
// ---------------------------------------------------------------
// Bedrock caps a single string dynamic property at ~32 KB (32767 bytes). Each
// record is ~"[x,y,z]," (<24 bytes), so 200 shrines is well under the limit; we
// cap at 200 and drop the oldest to stay safe. (If it ever needed more, shard
// across md:shrine_reg:0, :1, ... — same pattern the structure registry uses.)
const REG = "md:shrine_reg";

function loadShrines() {
  try {
    return JSON.parse(world.getDynamicProperty(REG) || "[]");
  } catch {
    return [];
  }
}

function saveShrines(list) {
  try {
    world.setDynamicProperty(REG, JSON.stringify(list));
  } catch {}
}

export function registerShrine(cx, gy, cz) {
  const list = loadShrines();
  if (list.some((s) => s[0] === cx && s[2] === cz)) return;
  list.push([cx, gy, cz]);
  while (list.length > 200) list.shift();
  saveShrines(list);
}

// ---------------------------------------------------------------
// the builder
// ---------------------------------------------------------------
const WOOL = { red: "red_wool", yellow: "yellow_wool", lime: "lime_wool", blue: "blue_wool" };

export function buildShrine(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const L = shrineLayout(cx, g, cz);
  const Y = L.floorY;
  const S = (x, y, z, b) => q(dim, `setblock ${x} ${y} ${z} ${b}`);
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${Math.min(x0, x1)} ${y0} ${Math.min(z0, z1)} ${Math.max(x0, x1)} ${y1} ${Math.max(z0, z1)} ${b}`);

  // clear + sunken mossy floor
  F(cx - 11, Y, cz - 11, cx + 11, Y + 9, cz + 11, "air");
  F(cx - 11, Y - 1, cz - 11, cx + 11, Y - 1, cz + 11, "stonebrick");
  F(cx - 10, Y - 1, cz - 10, cx + 10, Y - 1, cz + 10, "mossy_cobblestone");
  F(cx - 8, Y - 1, cz - 8, cx + 8, Y - 1, cz + 8, "stonebrick");
  // outer walls, 6 high, with an entrance gap on the south
  for (let h = 0; h <= 5; h++) {
    F(cx - 10, Y + h, cz - 10, cx + 10, Y + h, cz - 10, "stonebrick");
    F(cx - 10, Y + h, cz + 10, cx + 10, Y + h, cz + 10, "stonebrick");
    F(cx - 10, Y + h, cz - 10, cx - 10, Y + h, cz + 10, "stonebrick");
    F(cx + 10, Y + h, cz - 10, cx + 10, Y + h, cz + 10, "stonebrick");
  }
  F(cx - 1, Y, cz + 10, cx + 1, Y + 3, cz + 10, "air"); // doorway
  // crenellations + moss veining
  for (let i = -10; i <= 10; i += 2) {
    S(cx + i, Y + 6, cz - 10, "mossy_stone_brick");
    S(cx + i, Y + 6, cz + 10, "mossy_stone_brick");
    S(cx - 10, Y + 6, cz + i, "mossy_stone_brick");
    S(cx + 10, Y + 6, cz + i, "mossy_stone_brick");
  }
  for (const [vx, vz] of [[-10, -6], [10, 4], [-6, 10], [4, -10], [-10, 7], [8, 10]]) {
    F(cx + vx, Y + 1, cz + vz, cx + vx, Y + 4, cz + vz, "vine");
  }
  // corner pillars
  for (const sx of [-9, 9]) for (const sz of [-9, 9]) {
    F(cx + sx, Y, cz + sz, cx + sx, Y + 5, cz + sz, "chiseled_stone_bricks");
    S(cx + sx, Y + 6, cz + sz, "stonebrick");
  }
  // braziers for light
  for (const [bx, bz] of [[0, -9], [-9, 0], [9, 0]]) {
    F(cx + bx, Y, cz + bz, cx + bx, Y + 1, cz + bz, "cobblestone_wall");
    S(cx + bx, Y + 2, cz + bz, "netherrack");
    S(cx + bx, Y + 3, cz + bz, "fire");
  }

  // four rune pedestals (colour-banded) with the seals on top
  for (const r of L.runes) {
    F(r.x, Y, r.z, r.x, Y, r.z, "chiseled_stone_bricks");
    S(r.x, Y + 1, r.z, WOOL[r.color]);         // colour band identifies the rune
    q(dim, `setblock ${r.x} ${r.y} ${r.z} md:rune_block ["md:lit"=false]`);
    S(r.x, Y + 3, r.z, "sea_lantern");         // downlight so colours read
  }

  // the clue: a wool row on the north wall, left->right in solution order
  const clueX = [cx - 3, cx - 1, cx + 1, cx + 3];
  L.order.forEach((color, i) => {
    S(clueX[i], Y + 4, cz - 9, WOOL[color]);
    S(clueX[i], Y + 5, cz - 9, "sea_lantern");
  });
  S(cx - 4, Y + 4, cz - 9, "chiseled_stone_bricks");
  S(cx + 4, Y + 4, cz - 9, "chiseled_stone_bricks");

  // sealed vault: a chest encased in a stonebrick shell (the puzzle opens it)
  F(cx - 1, Y, cz + 5, cx + 1, Y + 1, cz + 5, "stonebrick");
  S(L.vault.x, L.vault.y, L.vault.z, "chest");
  const vx = L.vault.x, vy = L.vault.y, vz = L.vault.z;
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 0 md:runeheart 1`);
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 1 md:runestone 12`);
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 2 md:runeplate_chestplate 1`);
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 3 diamond 4`);
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 4 golden_apple 2`);
  q(dim, `replaceitem block ${vx} ${vy} ${vz} slot.container 5 experience_bottle 12`);
  for (const s of L.seal) S(s.x, s.y, s.z, "stonebrick"); // re-seal in case fill missed

  // a warding plaque hint
  S(cx, Y + 2, cz - 9, "chiseled_stone_bricks");

  // the guardian
  q(dim, `summon md:runestone_tyrant ${cx} ${Y} ${cz - 2}`);

  registerShrine(cx, g, cz);
  q(dim, `tellraw @a[r=40] {"rawtext":[{"text":"§2A primeval shrine wakes. Read the northern seal-order; light the runes to open the vault."}]}`);
}

// ---------------------------------------------------------------
// the puzzle validator (stateless, reads live block states)
// ---------------------------------------------------------------
function litState(dim, pos) {
  try {
    const b = dim.getBlock(pos);
    if (!b || b.typeId !== "md:rune_block") return null;
    return b.getState ? b.getState("md:lit") : b.permutation.getState("md:lit");
  } catch {
    return null;
  }
}

function setLit(dim, pos, on) {
  try {
    const b = dim.getBlock(pos);
    if (b) b.setPermutation(BlockPermutation.resolve("md:rune_block", { "md:lit": on }));
  } catch {
    try {
      dim.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} md:rune_block ["md:lit"=${on}]`);
    } catch {}
  }
}

function shrineFor(block) {
  const p = block.location;
  for (const [cx, gy, cz] of loadShrines()) {
    const L = shrineLayout(cx, gy, cz);
    for (const r of L.runes) {
      if (r.x === p.x && r.y === p.y && r.z === p.z) {
        return { cx, gy, cz, L, color: r.color };
      }
    }
  }
  return null;
}

try {
  world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
    const block = ev.block;
    if (!block || block.typeId !== "md:rune_block") return;
    const found = shrineFor(block);
    if (!found) return;
    const { cx, cz, L, color } = found;
    const dim = block.dimension;
    const player = ev.player;

    // already lit? no-op
    if (litState(dim, block.location) === true) return;

    // how many are already lit in the correct leading order
    const litByColor = {};
    for (const r of L.runes) litByColor[r.color] = litState(dim, r) === true;
    let progress = 0;
    while (progress < L.order.length && litByColor[L.order[progress]]) progress++;

    const expected = L.order[progress];
    if (color === expected) {
      setLit(dim, block.location, true);
      try {
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2;
          dim.spawnParticle("minecraft:rising_border_dust_particle",
            { x: block.location.x + 0.5 + Math.cos(a), y: block.location.y + 1, z: block.location.z + 0.5 + Math.sin(a) });
        }
        // Simon-says feedback: each correct rune rings a higher note
        const pitch = 0.8 + progress * 0.2;
        dim.playSound("note.harp", block.location, { pitch });
        if (player) player.playSound("note.harp", { pitch });
      } catch {}
      if (progress + 1 >= L.order.length) openVault(dim, cx, cz, L);
    } else {
      // wrong order — reset every rune to dormant
      for (const r of L.runes) setLit(dim, r, false);
      try {
        dim.playSound("note.bass", block.location);
        dim.spawnParticle("minecraft:basic_smoke_particle",
          { x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });
        if (player) player.playSound("note.bass", { pitch: 0.6 });
      } catch {}
    }
  });
} catch {}

function openVault(dim, cx, cz, L) {
  for (const s of L.seal) {
    try {
      dim.runCommand(`setblock ${s.x} ${s.y} ${s.z} air`);
    } catch {}
  }
  try {
    const v = L.vault;
    for (let r = 1; r <= 5; r++) {
      const rr = r;
      system.runTimeout(() => {
        for (let i = 0; i < 10 + rr * 4; i++) {
          const a = (i / (10 + rr * 4)) * Math.PI * 2;
          try {
            dim.spawnParticle("minecraft:rising_border_dust_particle",
              { x: cx + 0.5 + Math.cos(a) * rr, y: v.y + 0.5, z: cz + 0.5 + Math.sin(a) * rr });
          } catch {}
        }
      }, rr * 3);
    }
    dim.playSound("beacon.activate", { x: cx, y: L.floorY, z: cz });
    dim.playSound("mob.ravager.roar", { x: cx, y: L.floorY, z: cz });
    dim.runCommand(`tellraw @a[x=${cx},y=${L.floorY},z=${cz},r=40] {"rawtext":[{"text":"§aThe seals align — the vault grinds open."}]}`);
  } catch {}
}
