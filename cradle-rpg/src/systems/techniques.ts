/**
 * Sacred-arts technique framework (M2 stub, M3 fills in real Paths).
 *
 * Canon taxonomy (lore bible §3): every technique is an Enforcer (cycle
 * madra through your own body/weapon), Striker (project madra outward),
 * Ruler (command ambient vital aura), or Forger (solidify madra).
 *
 * The registry is data-driven: Milestone 3 adds Path techniques purely by
 * registering more TechniqueDefs and changing slot assignments — no new
 * plumbing. Slots are bound to the existing tech1..tech4 input actions
 * (K / L / U / I).
 */

import type { Combatant } from "./combat.js";
import type { FxManager } from "./fx.js";

export type TechniqueType = "Enforcer" | "Striker" | "Ruler" | "Forger";

export interface TechniqueContext {
  /** The caster. */
  user: Combatant;
  fx: FxManager | null;
}

export interface TechniqueDef {
  id: string;
  name: string;
  type: TechniqueType;
  /** Absolute madra cost (caster checks before executing). */
  madraCost: number;
  /** Cooldown in seconds. */
  cooldown: number;
  /** Perform the technique. Return false to fizzle (no cost, no cooldown). */
  execute(ctx: TechniqueContext): boolean;
}

const registry = new Map<string, TechniqueDef>();

export function registerTechnique(def: TechniqueDef): void {
  if (registry.has(def.id)) {
    throw new Error(`technique already registered: ${def.id}`);
  }
  registry.set(def.id, def);
}

export function getTechnique(id: string): TechniqueDef | undefined {
  return registry.get(id);
}

export function allTechniques(): TechniqueDef[] {
  return [...registry.values()];
}

/** Input actions for the four technique slots, in slot order (K L U I). */
export const TECHNIQUE_SLOT_ACTIONS = ["tech1", "tech2", "tech3", "tech4"] as const;

/** Per-combatant cast state: slot assignments + cooldown tracking. */
export class TechniqueCaster {
  /** Technique ids by slot (null = empty slot). */
  slots: (string | null)[] = [null, null, null, null];

  private cooldowns = new Map<string, number>();

  update(dt: number): void {
    for (const [id, t] of this.cooldowns) {
      const next = t - dt;
      if (next <= 0) this.cooldowns.delete(id);
      else this.cooldowns.set(id, next);
    }
  }

  cooldownOf(id: string): number {
    return this.cooldowns.get(id) ?? 0;
  }

  /** Attempt to cast the technique in `slot` (0-3). True if it went off. */
  tryCast(slot: number, ctx: TechniqueContext): boolean {
    const id = this.slots[slot];
    if (!id) return false;
    const def = getTechnique(id);
    if (!def) return false;
    if (this.cooldownOf(id) > 0) return false;
    if (ctx.user.stats.madra < def.madraCost) return false;
    if (!def.execute(ctx)) return false;
    ctx.user.stats.madra -= def.madraCost;
    this.cooldowns.set(id, def.cooldown);
    return true;
  }
}
