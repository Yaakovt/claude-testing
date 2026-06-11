/**
 * Advancement: per-stage requirements + benefits, data-driven and PURE
 * (no DOM, no entities) so tools/checkadvance.mjs can unit-test it.
 *
 * Lore grounding (docs/lore-bible.md §2.2):
 *  - Copper = opening the spiritual senses to perceive vital aura. The game
 *    asks for a madra-capacity exercise (cycle to full N times), then a
 *    meditation at a shrine.
 *  - Iron = using vital aura to forge the body — an ordeal of intense pain
 *    undergone with clan elixirs. The game asks for a body-refining elixir
 *    (scales) and a 10-second channel of ticking damage: the Iron agony,
 *    made mechanical.
 *  - Jade / Gold exist in the data but are STORY-GATED until M4 (the valley
 *    treats Jade as the ceiling and Gold as myth).
 *
 * The runtime flow (shrines, prompts, the channel state machine) is game
 * code: src/game/advancementFlow.ts.
 */

import { Stage, type Stats } from "./stats.js";

// ------------------------------------------------------------ requirements

export const COPPER_MADRA_FILLS = 5;
export const IRON_SCALE_COST = 25;
export const IRON_CHANNEL_SECONDS = 10;
export const IRON_CHANNEL_TICKS = 20;
/** Total channel damage as a fraction of max health (~"kills below 60%"). */
export const IRON_CHANNEL_DAMAGE_FRAC = 0.57;
/** Unsouled: basic strikes to land before the Empty Palm crystallizes. */
export const EMPTY_PALM_PRACTICE_HITS = 30;

export type Requirement =
  | { kind: "madra-fills"; needed: number }
  | { kind: "refining"; scaleCost: number; channelSeconds: number }
  | { kind: "story"; milestone: string };

/** Requirement to REACH the keyed stage (from the stage below it). */
export const STAGE_REQUIREMENTS: Partial<Record<Stage, Requirement>> = {
  [Stage.Copper]: { kind: "madra-fills", needed: COPPER_MADRA_FILLS },
  [Stage.Iron]: {
    kind: "refining",
    scaleCost: IRON_SCALE_COST,
    channelSeconds: IRON_CHANNEL_SECONDS,
  },
  [Stage.Jade]: { kind: "story", milestone: "M4" },
  [Stage.Gold]: { kind: "story", milestone: "M4" },
};

/** Persistent advancement counters (saved in systems.advancement). */
export interface AdvancementProgress {
  /** Copper requirement: times madra was cycled all the way to full. */
  madraFills: number;
  /** Unsouled practice: basic strikes landed (Empty Palm requirement). */
  basicHits: number;
  emptyPalmLearned: boolean;
}

export function freshProgress(): AdvancementProgress {
  return { madraFills: 0, basicHits: 0, emptyPalmLearned: false };
}

export function copperReady(progress: AdvancementProgress): boolean {
  return progress.madraFills >= COPPER_MADRA_FILLS;
}

export function ironPurchaseAllowed(scales: number): boolean {
  return scales >= IRON_SCALE_COST;
}

/** True when the Unsouled's Empty Palm should crystallize. */
export function emptyPalmReady(stage: Stage, progress: AdvancementProgress): boolean {
  return (
    !progress.emptyPalmLearned &&
    stage >= Stage.Copper &&
    progress.basicHits >= EMPTY_PALM_PRACTICE_HITS
  );
}

/** Damage per channel tick. 20 ticks over 10 s total ~57% of max health. */
export function channelTickDamage(maxHealth: number): number {
  return (maxHealth * IRON_CHANNEL_DAMAGE_FRAC) / IRON_CHANNEL_TICKS;
}

/** Would a full channel kill from this starting health? (~below 60% HP). */
export function channelWouldKill(health: number, maxHealth: number): boolean {
  return health <= maxHealth * IRON_CHANNEL_DAMAGE_FRAC;
}

// ---------------------------------------------------------------- benefits

export interface StageGains {
  healthMult: number;
  madraMult: number;
  attackMult: number;
  defenseAdd: number;
  speedMult: number;
}

/**
 * Gains applied on REACHING the keyed stage. Tuned against the M2 damage
 * table (computeDamage in stats.ts): Copper is a modest awakening; Iron is
 * the body remade — the books' Iron body — a leap in HP/attack/speed.
 * Jade/Gold numbers are provisional placeholders for M4.
 */
export const STAGE_GAINS: Partial<Record<Stage, StageGains>> = {
  [Stage.Copper]: { healthMult: 1.25, madraMult: 1.35, attackMult: 1.15, defenseAdd: 0, speedMult: 1 },
  [Stage.Iron]: { healthMult: 1.7, madraMult: 1.2, attackMult: 1.55, defenseAdd: 2, speedMult: 1.12 },
  [Stage.Jade]: { healthMult: 1.4, madraMult: 1.6, attackMult: 1.45, defenseAdd: 2, speedMult: 1.05 },
  [Stage.Gold]: { healthMult: 2, madraMult: 2, attackMult: 2, defenseAdd: 4, speedMult: 1.1 },
};

/**
 * Advance `stats` to stage `to` (must be exactly one stage up), applying the
 * gains and refilling health/madra — advancement remakes the artist whole.
 */
export function applyStageUp(stats: Stats, to: Stage): void {
  if (to !== stats.stage + 1) {
    throw new Error(`applyStageUp: ${stats.stage} -> ${to} is not one step`);
  }
  const g = STAGE_GAINS[to];
  if (!g) throw new Error(`applyStageUp: no gains defined for stage ${to}`);
  stats.maxHealth = Math.round(stats.maxHealth * g.healthMult);
  stats.maxMadra = Math.round(stats.maxMadra * g.madraMult);
  stats.attackPower = Math.round(stats.attackPower * g.attackMult);
  stats.defense += g.defenseAdd;
  stats.moveSpeed = Math.round(stats.moveSpeed * g.speedMult);
  stats.stage = to;
  stats.health = stats.maxHealth;
  stats.madra = stats.maxMadra;
}
