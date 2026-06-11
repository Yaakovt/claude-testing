/**
 * Game technique data. M2 ships exactly one placeholder technique to prove
 * the pipeline; Milestone 3 adds the real Path techniques (White Fox,
 * Empty Palm, …) as pure data here — no new plumbing.
 */

import { registerTechnique, type TechniqueDef } from "../systems/techniques.js";

/**
 * "Burst of Effort" — INVENTED FOR GAME. An unnamed-Path Enforcer exercise:
 * the artist floods raw madra through their limbs for a few heartbeats.
 * +40% move speed and damage for 3 s. Costs 30% of a Foundation core (9 of
 * 30 madra).
 */
export const BURST_OF_EFFORT: TechniqueDef = {
  id: "burst-of-effort",
  name: "Burst of Effort",
  type: "Enforcer",
  madraCost: 9,
  cooldown: 6,
  execute(ctx) {
    ctx.user.applyBuff(1.4, 1.4, 3);
    ctx.fx?.spawnText(ctx.user.x, ctx.user.y - 26, "Burst of Effort!", "#8a6cc0", 0.8);
    return true;
  },
};

let registered = false;

/** Register all M2 techniques exactly once (idempotent for tests). */
export function registerGameTechniques(): void {
  if (registered) return;
  registered = true;
  registerTechnique(BURST_OF_EFFORT);
}

/** Default K/L/U/I slot assignment. M3 fills the empty slots per Path. */
export const DEFAULT_TECHNIQUE_SLOTS: (string | null)[] = [
  BURST_OF_EFFORT.id, // K
  null, // L
  null, // U
  null, // I
];
