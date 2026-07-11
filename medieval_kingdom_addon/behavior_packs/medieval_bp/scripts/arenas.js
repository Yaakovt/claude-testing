// Boss arenas + bandit camp. All builders ground-snap through groundY so
// nothing generates floating in the air.
import { q, groundY } from "./gen_util.js";

// ---------------------------------------------------------------
// Haunted Graveyard — the Lich King's crypt
// ---------------------------------------------------------------
export function buildGraveyard(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${cx + x0} ${Y(y0)} ${cz + z0} ${cx + x1} ${Y(y1)} ${cz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${cx + x} ${Y(y)} ${cz + z} ${b}`);

  // clear + yard of mossy earth and scattered path
  F(-10, 0, -10, 10, 10, 10, "air");
  F(-10, -1, -10, 10, -1, 10, "grass");
  F(-8, -1, -8, 8, -1, 8, "podzol");
  F(-1, -1, -10, 1, -1, 2, "gravel");
  // iron fence perimeter with corner posts
  for (let i = -10; i <= 10; i++) {
    for (const [fx, fz] of [[i, -10], [i, 10], [-10, i], [10, i]]) {
      if (fx === 0 && fz === -10) continue; // gate gap
      if (Math.abs(fx) === 10 && Math.abs(fz) === 10) {
        F(fx, 0, fz, fx, 1, fz, "cobblestone_wall");
      } else if ((fx + fz) % 2 === 0) {
        S(fx, 0, fz, "iron_bars");
      }
    }
  }
  S(-1, 0, -10, "cobblestone_wall"); S(1, 0, -10, "cobblestone_wall");
  S(-1, 1, -10, "soul_lantern"); S(1, 1, -10, "soul_lantern");
  // rows of gravestones
  for (const gx of [-7, -4, 4, 7]) {
    for (const gz of [-6, -3, 0, 3]) {
      S(gx, 0, gz, "cobblestone");
      S(gx, 1, gz, "cobblestone_wall");
      if (Math.random() < 0.35) S(gx + 1, 0, gz, "web");
    }
  }
  // a dead tree
  F(6, 0, 6, 6, 3, 6, "stripped_oak_log");
  S(6, 4, 6, "stripped_oak_log"); S(5, 3, 6, "stripped_oak_log"); S(7, 4, 7, "stripped_oak_log");
  // the crypt: stonebrick vault at the back
  F(-4, 0, 4, 4, 5, 9, "stonebrick");
  F(-3, 0, 5, 3, 4, 8, "air");
  F(-1, 0, 4, 1, 2, 4, "air");
  F(-4, 5, 4, 4, 5, 9, "mossy_cobblestone");
  for (let i = -4; i <= 4; i += 2) S(i, 6, 4, "cobblestone_wall");
  S(-2, 2, 4, "soul_torch"); S(2, 2, 4, "soul_torch");
  // dais + loot inside
  F(-1, 0, 7, 1, 0, 8, "polished_blackstone_bricks");
  S(-2, 0, 8, "soul_torch"); S(2, 0, 8, "soul_torch");
  S(2, 0, 6, "chest");
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 6} slot.container 0 bone 12`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 6} slot.container 1 iron_ingot 6`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 6} slot.container 2 md:iron_plating 2`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 6} slot.container 3 experience_bottle 10`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 6} slot.container 4 golden_apple 2`);
  // the court of the dead
  q(dim, `summon md:lich_king ${cx} ${Y(1)} ${cz + 7}`);
  q(dim, `summon md:skeleton_mage ${cx - 5} ${Y(0)} ${cz - 2}`);
  q(dim, `summon md:skeleton_mage ${cx + 5} ${Y(0)} ${cz - 4}`);
}

// ---------------------------------------------------------------
// Siege Camp — the Siege Golem's war-machine yard
// ---------------------------------------------------------------
export function buildSiegeCamp(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${cx + x0} ${Y(y0)} ${cz + z0} ${cx + x1} ${Y(y1)} ${cz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${cx + x} ${Y(y)} ${cz + z} ${b}`);

  F(-11, 0, -11, 11, 8, 11, "air");
  F(-11, -1, -11, 11, -1, 11, "dirt");
  F(-9, -1, -9, 9, -1, 9, "coarse_dirt");
  // log palisade with sharpened tips, gate to the north
  for (let i = -11; i <= 11; i += 1) {
    for (const [fx, fz] of [[i, -11], [i, 11], [-11, i], [11, i]]) {
      if (Math.abs(fx) <= 1 && fz === -11) continue; // gate gap
      if ((fx + fz) % 2 === 0) {
        q(dim, `fill ${cx + fx} ${Y(0)} ${cz + fz} ${cx + fx} ${Y(2)} ${cz + fz} oak_log`);
        S(fx, 3, fz, "oak_fence");
      }
    }
  }
  S(-2, 0, -11, "oak_log"); S(2, 0, -11, "oak_log");
  S(-2, 1, -11, "torch"); S(2, 1, -11, "torch");
  // trebuchet prop: frame, arm, counterweight
  F(4, 0, 2, 8, 0, 6, "planks");
  F(4, 0, 3, 4, 3, 3, "oak_log"); F(8, 0, 3, 8, 3, 3, "oak_log");
  F(4, 4, 3, 8, 4, 3, "oak_log");
  F(6, 4, 0, 6, 4, 8, "oak_fence");
  F(5, 3, 7, 7, 3, 8, "cobblestone");
  S(6, 0, 1, "cobblestone");
  // two wool tents
  for (const tx of [-7, -3]) {
    F(tx, 0, 4, tx + 2, 0, 7, "white_wool");
    F(tx, 1, 5, tx + 2, 1, 6, "white_wool");
    F(tx + 1, 0, 5, tx + 1, 0, 6, "air");
    F(tx + 1, 0, 7, tx + 1, 0, 7, "air");
  }
  // campfire circle + supplies
  S(0, 0, 0, "campfire");
  S(-1, 0, -1, "oak_log"); S(1, 0, 1, "oak_log");
  S(-6, 0, -6, "hay_block"); S(-6, 1, -6, "hay_block"); S(-5, 0, -6, "hay_block");
  S(6, 0, -6, "chest");
  q(dim, `replaceitem block ${cx + 6} ${Y(0)} ${cz - 6} slot.container 0 iron_ingot 8`);
  q(dim, `replaceitem block ${cx + 6} ${Y(0)} ${cz - 6} slot.container 1 gunpowder 6`);
  q(dim, `replaceitem block ${cx + 6} ${Y(0)} ${cz - 6} slot.container 2 bread 8`);
  q(dim, `replaceitem block ${cx + 6} ${Y(0)} ${cz - 6} slot.container 3 md:iron_plating 3`);
  q(dim, `replaceitem block ${cx + 6} ${Y(0)} ${cz - 6} slot.container 4 emerald 5`);
  // the garrison and its engine of war
  q(dim, `summon md:siege_golem ${cx} ${Y(1)} ${cz + 2}`);
  q(dim, `summon md:bandit ${cx - 4} ${Y(0)} ${cz - 3}`);
  q(dim, `summon md:bandit ${cx + 4} ${Y(0)} ${cz - 2}`);
  q(dim, `summon md:bandit ${cx - 2} ${Y(0)} ${cz + 6}`);
}

// ---------------------------------------------------------------
// Jousting Arena — the Black Knight's tilt yard
// ---------------------------------------------------------------
export function buildArena(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${cx + x0} ${Y(y0)} ${cz + z0} ${cx + x1} ${Y(y1)} ${cz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${cx + x} ${Y(y)} ${cz + z} ${b}`);

  F(-8, 0, -14, 8, 8, 14, "air");
  F(-8, -1, -14, 8, -1, 14, "grass");
  F(-5, -1, -13, 5, -1, 13, "coarse_dirt"); // the lists
  // central tilt barrier
  F(0, 0, -11, 0, 0, 11, "oak_fence");
  // perimeter fence
  for (let z = -14; z <= 14; z += 1) {
    if ((z % 2) === 0) { S(-8, 0, z, "oak_fence"); S(8, 0, z, "oak_fence"); }
  }
  for (let x = -8; x <= 8; x += 2) {
    if (x !== 0) { S(x, 0, -14, "oak_fence"); S(x, 0, 14, "oak_fence"); }
  }
  // raised viewing stands along both sides
  for (const sx of [-7, 7]) {
    F(sx, 0, -10, sx, 0, 10, "cobblestone");
    F(sx, 1, -10, sx, 1, 10, "oak_stairs");
  }
  // banner posts: red and blue wool pennants at each end
  for (const [bx, bz, wool] of [[-6, -13, "red_wool"], [6, -13, "red_wool"], [-6, 13, "blue_wool"], [6, 13, "blue_wool"]]) {
    F(bx, 0, bz, bx, 3, bz, "oak_fence");
    S(bx, 4, bz, wool);
    S(bx, 3, bz, wool);
  }
  S(0, 1, -12, "lantern"); S(0, 1, 12, "lantern");
  // the champion's pavilion
  F(-3, 0, 12, 3, 2, 14, "red_wool");
  F(-2, 0, 12, 2, 1, 13, "air");
  S(2, 0, 13, "chest");
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 13} slot.container 0 md:horse_barding 1`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 13} slot.container 1 bread 6`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 13} slot.container 2 iron_ingot 5`);
  q(dim, `replaceitem block ${cx + 2} ${Y(0)} ${cz + 13} slot.container 3 golden_carrot 4`);
  // the champion awaits — with his steeds stabled nearby
  q(dim, `summon md:black_knight ${cx} ${Y(0)} ${cz + 10}`);
  q(dim, `summon md:war_horse ${cx - 4} ${Y(0)} ${cz + 12}`);
  q(dim, `summon md:war_horse ${cx + 4} ${Y(0)} ${cz - 12}`);
}

// ---------------------------------------------------------------
// Burnt Battlefield — the Dread Rider's haunt
// ---------------------------------------------------------------
export function buildBattlefield(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${cx + x0} ${Y(y0)} ${cz + z0} ${cx + x1} ${Y(y1)} ${cz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${cx + x} ${Y(y)} ${cz + z} ${b}`);

  // clear the air, scorch the ground
  F(-12, 0, -12, 12, 8, 12, "air");
  F(-12, -1, -12, 12, -1, 12, "grass");
  F(-9, -1, -9, 9, -1, 9, "coarse_dirt");
  // blast scars of netherrack + magma, still smouldering
  for (const [bx, bz] of [[-5, -4], [4, -6], [-6, 5], [6, 4], [0, 0], [-2, 7], [7, -2]]) {
    F(bx - 1, -1, bz - 1, bx + 1, -1, bz + 1, "netherrack");
    S(bx, -1, bz, "magma");
  }
  // ring of broken pikes and torn banners
  const banners = ["red_wool", "black_wool", "gray_wool"];
  let bi = 0;
  for (const [px, pz] of [[-8, -8], [8, -8], [-8, 8], [8, 8], [-9, 0], [9, 0], [0, -9], [0, 9]]) {
    const h = 2 + ((px + pz) & 1);
    F(px, 0, pz, px, h, pz, "oak_fence");
    if (bi % 2 === 0) S(px, h + 1, pz, banners[bi % banners.length]);
    else S(px, h, pz + 1, "air");
    bi++;
  }
  // fallen soldiers' arms jammed in the dirt
  for (const [wx, wz] of [[-3, -2], [2, 3], [-4, 4], [5, -3], [1, -5]]) {
    S(wx, 0, wz, "iron_bars");
  }
  // a cold war-camp: dead campfire, supply cart, war banner
  S(-6, 0, -6, "campfire");
  q(dim, `setblock ${cx - 6} ${Y(0)} ${cz - 6} campfire ["extinguished"=true]`);
  S(-6, 0, -5, "oak_log"); S(-5, 0, -6, "oak_log");
  F(6, 0, 6, 7, 0, 7, "stripped_oak_log");
  S(6, 1, 6, "chest");
  q(dim, `replaceitem block ${cx + 6} ${Y(1)} ${cz + 6} slot.container 0 iron_ingot 6`);
  q(dim, `replaceitem block ${cx + 6} ${Y(1)} ${cz + 6} slot.container 1 md:iron_plating 2`);
  q(dim, `replaceitem block ${cx + 6} ${Y(1)} ${cz + 6} slot.container 2 md:horse_barding 1`);
  q(dim, `replaceitem block ${cx + 6} ${Y(1)} ${cz + 6} slot.container 3 bone 8`);
  q(dim, `replaceitem block ${cx + 6} ${Y(1)} ${cz + 6} slot.container 4 emerald 4`);
  // his standard, planted at the centre
  F(0, 0, 0, 0, 3, 0, "oak_fence");
  S(0, 4, 0, "black_wool");
  S(0, 3, 1, "red_wool");
  // the Dread Rider himself — the script gives him his charger
  q(dim, `summon md:dread_rider ${cx} ${Y(0)} ${cz + 2}`);
  q(dim, `summon md:bandit ${cx - 5} ${Y(0)} ${cz - 3}`);
  q(dim, `summon md:bandit ${cx + 5} ${Y(0)} ${cz + 3}`);
}

// ---------------------------------------------------------------
// Bandit Camp — small roadside trouble
// ---------------------------------------------------------------
export function buildBanditCamp(dim, cx, cyG, cz) {
  const g = groundY(dim, cx, cyG, cz);
  const Y = (n) => g + 1 + n;
  const F = (x0, y0, z0, x1, y1, z1, b) =>
    q(dim, `fill ${cx + x0} ${Y(y0)} ${cz + z0} ${cx + x1} ${Y(y1)} ${cz + z1} ${b}`);
  const S = (x, y, z, b) => q(dim, `setblock ${cx + x} ${Y(y)} ${cz + z} ${b}`);

  F(-6, 0, -6, 6, 6, 6, "air");
  F(-6, -1, -6, 6, -1, 6, "grass");
  F(-4, -1, -4, 4, -1, 4, "coarse_dirt");
  // campfire + log seats
  S(0, 0, 0, "campfire");
  S(-2, 0, 0, "oak_log"); S(2, 0, 0, "oak_log"); S(0, 0, -2, "oak_log");
  // two lean-to tents in dark wool
  for (const [tx, tz] of [[-5, 2], [2, -5]]) {
    F(tx, 0, tz, tx + 2, 0, tz + 2, "gray_wool");
    F(tx, 1, tz + 1, tx + 2, 1, tz + 1, "gray_wool");
    S(tx + 1, 0, tz + 1, "air");
  }
  // stolen goods
  S(4, 0, 3, "chest");
  q(dim, `replaceitem block ${cx + 4} ${Y(0)} ${cz + 3} slot.container 0 emerald 4`);
  q(dim, `replaceitem block ${cx + 4} ${Y(0)} ${cz + 3} slot.container 1 bread 5`);
  q(dim, `replaceitem block ${cx + 4} ${Y(0)} ${cz + 3} slot.container 2 arrow 16`);
  q(dim, `replaceitem block ${cx + 4} ${Y(0)} ${cz + 3} slot.container 3 iron_ingot 3`);
  S(4, 1, 3, "torch");
  // the crew — and a stolen war horse
  q(dim, `summon md:bandit ${cx - 2} ${Y(0)} ${cz + 2}`);
  q(dim, `summon md:bandit ${cx + 2} ${Y(0)} ${cz - 2}`);
  q(dim, `summon md:bandit ${cx + 1} ${Y(0)} ${cz + 3}`);
  q(dim, `summon md:war_horse ${cx - 4} ${Y(0)} ${cz - 4}`);
}
