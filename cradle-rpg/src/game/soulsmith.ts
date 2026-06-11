/**
 * SOULSMITHING (M5) — the permanent-upgrade data + the deterministic stat
 * rebuild. Lore §6.2: a Soulsmith dismantles Remnants into parts and works
 * them into gear; the player trades Remnant CORES (the counted item flag
 * "item.remnantCore") + scales for three once-per-save upgrades at Fisher
 * Gesha's stall in the valley wilds (dialogue: src/content/soulsmith.ts).
 *
 * Costs / effects (the upgrade math):
 *   forgedEdge       +2 attackPower            1 core + 15 scales
 *   boundSash        +10 maxHealth             1 core + 15 scales
 *   refinedChannels  +15% maxMadra (rounded)   2 cores + 20 scales
 *
 * DETERMINISM RULE: upgrades are applied to the post-stage-up statline.
 * Whenever the stage changes (and on every load), World rebuilds the
 * player's stats from scratch — base -> applyStageUp chain -> upgrades —
 * via rebuildPlayerStats(), so a save/load round trip and an in-session
 * stage-up land on EXACTLY the same numbers (the +15% madra re-derives
 * from the new stage's base instead of compounding).
 *
 * Persistence: systems.soulsmith = { purchased: string[] } (save v5) plus
 * mirrored "smith.<id>" flags so dialogue conditions can hide bought items
 * (and so pre-bucket saves can be reconstructed from flags alone).
 */

import { applyStageUp } from "../systems/advancement.js";
import { makeStats, Stage, type Stats } from "../systems/stats.js";
import { PATHS, type OriginId } from "./paths.js";
import { PLAYER_BASE, PLAYER_WALK_SPEED } from "./player.js";

export interface SoulsmithUpgrade {
  id: string;
  name: string;
  /** "+2 attack" — short HUD/toast line. */
  blurb: string;
  coreCost: number;
  scaleCost: number;
  apply(stats: Stats): void;
}

export const SOULSMITH_UPGRADES: Record<string, SoulsmithUpgrade> = {
  forgedEdge: {
    id: "forgedEdge",
    name: "Forged Edge",
    blurb: "+2 attack",
    coreCost: 1,
    scaleCost: 15,
    apply(stats) {
      stats.attackPower += 2;
    },
  },
  boundSash: {
    id: "boundSash",
    name: "Bound Sash",
    blurb: "+10 max health",
    coreCost: 1,
    scaleCost: 15,
    apply(stats) {
      stats.maxHealth += 10;
      stats.health += 10;
    },
  },
  refinedChannels: {
    id: "refinedChannels",
    name: "Refined Channels",
    blurb: "+15% max madra",
    coreCost: 2,
    scaleCost: 20,
    apply(stats) {
      const add = Math.round(stats.maxMadra * 0.15);
      stats.maxMadra += add;
      stats.madra += add;
    },
  },
};

export const SOULSMITH_UPGRADE_IDS = Object.keys(SOULSMITH_UPGRADES);

/** The flag a purchase mirrors ("smith.forgedEdge"). */
export function upgradeFlag(id: string): string {
  return `smith.${id}`;
}

/**
 * Rebuild a player statline from scratch: Foundation base for the origin,
 * the full stage-up chain, then every purchased upgrade — and refill.
 * PURE on its inputs (unit-tested in tools/checksoulsmith.mjs).
 */
export function rebuiltStats(origin: OriginId, stage: Stage, purchased: readonly string[]): Stats {
  const stats = makeStats({
    maxHealth: PLAYER_BASE.maxHealth,
    maxMadra: PATHS[origin].baseMaxMadra,
    attackPower: PLAYER_BASE.attackPower,
    defense: PLAYER_BASE.defense,
    moveSpeed: PLAYER_WALK_SPEED,
    stage: Stage.Foundation,
  });
  while (stats.stage < stage) applyStageUp(stats, stats.stage + 1);
  for (const id of purchased) SOULSMITH_UPGRADES[id]?.apply(stats);
  stats.health = stats.maxHealth;
  stats.madra = stats.maxMadra;
  return stats;
}

/** Overwrite `target` (the live player stats) with a rebuilt statline. */
export function rebuildPlayerStats(
  target: Stats,
  origin: OriginId,
  purchased: readonly string[],
): void {
  const fresh = rebuiltStats(origin, target.stage, purchased);
  target.maxHealth = fresh.maxHealth;
  target.maxMadra = fresh.maxMadra;
  target.attackPower = fresh.attackPower;
  target.defense = fresh.defense;
  target.moveSpeed = fresh.moveSpeed;
  target.health = fresh.health;
  target.madra = fresh.madra;
}
