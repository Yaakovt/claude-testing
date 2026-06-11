/**
 * Core combatant statistics + the stage-gap damage formula.
 *
 * Lore grounding (docs/lore-bible.md §2.2): advancement stages run
 * Foundation → Copper → Iron → Jade → Gold, and the gaps between them are
 * brutal. A Foundation child cannot meaningfully hurt a Jade elder; a Jade
 * can nearly erase a Foundation in one blow. Sacred Valley believes Jade is
 * the practical ceiling — Gold is the stuff of legend.
 *
 * Everything here is pure data + one pure function so the balance lever is
 * unit-testable headlessly (tools/checkcombat.mjs).
 */

export enum Stage {
  Foundation = 0,
  Copper = 1,
  Iron = 2,
  Jade = 3,
  Gold = 4,
}

export const STAGE_NAMES: Readonly<Record<Stage, string>> = {
  [Stage.Foundation]: "Foundation",
  [Stage.Copper]: "Copper",
  [Stage.Iron]: "Iron",
  [Stage.Jade]: "Jade",
  [Stage.Gold]: "Gold",
};

export interface Stats {
  maxHealth: number;
  health: number;
  maxMadra: number;
  madra: number;
  attackPower: number;
  defense: number;
  /** Base walking speed, world px/s. */
  moveSpeed: number;
  stage: Stage;
}

export function makeStats(init: {
  maxHealth: number;
  maxMadra: number;
  attackPower: number;
  defense: number;
  moveSpeed: number;
  stage: Stage;
}): Stats {
  return { ...init, health: init.maxHealth, madra: init.maxMadra };
}

/**
 * THE damage formula. Keep pure; keep all balance reasoning here.
 *
 * - Each stage of attacker advantage roughly DOUBLES effective damage;
 *   each stage of disadvantage roughly HALVES it (2^gap).
 * - Asymmetry: when punching up, the defender's defense is also scaled up
 *   (×(1 + stages of disadvantage)), so the underdog does even worse than
 *   the raw halving suggests — per the books, fighting up a stage is a
 *   miracle, fighting up two is a death sentence.
 * - Defense mitigates softly (scaled / (scaled + defense)) so it never
 *   zeroes damage outright…
 * - …but a landed hit always chips at least 1 ("barely scratch").
 */
export function computeDamage(
  attackPower: number,
  attackerStage: Stage,
  defenderStage: Stage,
  defense: number,
  multiplier = 1,
): number {
  const gap = attackerStage - defenderStage;
  const stageMult = Math.pow(2, gap);
  const scaled = attackPower * multiplier * stageMult;
  if (scaled <= 0) return 1;
  const effectiveDefense = Math.max(0, defense) * (gap < 0 ? 1 - gap : 1);
  const mitigated = scaled * (scaled / (scaled + effectiveDefense));
  return Math.max(1, Math.round(mitigated));
}
