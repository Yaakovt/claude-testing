// Shared helpers for the structure generators.
import { system } from "@minecraft/server";

// command queue — drained in batches per tick so big builds can't lag a frame
const queue = [];
export function q(dim, cmd) {
  queue.push({ dim, cmd });
}
system.runInterval(() => {
  let n = 0;
  while (queue.length && n < 140) {
    const { dim, cmd } = queue.shift();
    try {
      dim.runCommand(cmd);
    } catch {
      try {
        dim.runCommandAsync(cmd);
      } catch {}
    }
    n++;
  }
}, 1);

export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// find ground height at a column (first non-foliage block scanning down)
export function groundY(dim, x, yGuess, z) {
  const skip = ["leaves", "log", "short_grass", "tallgrass", "fern", "snow_layer",
    "flower", "sapling", "deadbush", "vine", "waterlily", "double_plant", "wood",
    "pumpkin", "melon", "cactus", "bamboo"];
  for (let y = yGuess + 24; y > yGuess - 24; y--) {
    let b;
    try {
      b = dim.getBlock({ x, y, z });
    } catch {
      continue;
    }
    if (!b) continue;
    const id = b.typeId;
    if (id === "minecraft:air") continue;
    if (skip.some((s) => id.includes(s))) continue;
    return y;
  }
  return yGuess - 1;
}
