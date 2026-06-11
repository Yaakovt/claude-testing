// Unit tests for the combat math + technique framework, runnable in plain
// node (no DOM needed — stats.ts is pure, techniques.ts only registers data).
// Usage: npm run build && node tools/checkcombat.mjs

import { computeDamage, makeStats, Stage, STAGE_NAMES } from "../dist/systems/stats.js";
import { getTechnique, registerTechnique, TechniqueCaster } from "../dist/systems/techniques.js";
import { hasLineOfSight } from "../dist/game/enemies/dreadbeast.js";
import { createTestValley } from "../dist/game/maps/testValley.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

// ---------------------------------------------------------- damage formula

// Stage-gap table: one attacker (attack 10) vs one defender (defense 2)
// across every stage pairing. Print it for balance review.
console.log("\nStage-gap damage table (attack 10 vs defense 2):");
const stages = [Stage.Foundation, Stage.Copper, Stage.Iron, Stage.Jade, Stage.Gold];
const header = ["atk\\def", ...stages.map((s) => STAGE_NAMES[s].slice(0, 6))].map((s) => s.padStart(7)).join("");
console.log(header);
const table = {};
for (const a of stages) {
  const row = [STAGE_NAMES[a].slice(0, 6).padStart(7)];
  table[a] = {};
  for (const d of stages) {
    const dmg = computeDamage(10, a, d, 2);
    table[a][d] = dmg;
    row.push(String(dmg).padStart(7));
  }
  console.log(row.join(""));
}
console.log("");

// Determinism / purity.
ok(
  computeDamage(10, Stage.Copper, Stage.Copper, 2) === computeDamage(10, Stage.Copper, Stage.Copper, 2),
  "formula is deterministic",
);

// Equal stages: roughly attackPower after soft defense.
ok(table[Stage.Iron][Stage.Iron] === 8, `equal stages: 10 atk vs 2 def -> 8 (got ${table[Stage.Iron][Stage.Iron]})`);

// Each stage of advantage roughly doubles (x1.8..x2.4 tolerated).
for (const a of [Stage.Foundation, Stage.Copper, Stage.Iron, Stage.Jade]) {
  const base = table[a][Stage.Foundation];
  const up = table[a + 1][Stage.Foundation];
  const ratio = up / base;
  ok(ratio >= 1.8 && ratio <= 2.4, `advantage ${STAGE_NAMES[a]}->${STAGE_NAMES[a + 1]} vs Foundation roughly doubles (x${ratio.toFixed(2)})`);
}

// Each stage of disadvantage at least halves (asymmetric: usually worse).
for (const d of [Stage.Copper, Stage.Iron, Stage.Jade, Stage.Gold]) {
  const even = table[d][d];
  const below = table[d - 1][d];
  ok(below <= even / 1.9, `disadvantage ${STAGE_NAMES[d - 1]} vs ${STAGE_NAMES[d]} at least halves (${below} <= ${even}/1.9)`);
}

// Brief-mandated extremes.
{
  // Foundation player (attack 6) vs a Jade elder (defense 4, ~150 HP).
  const scratch = computeDamage(6, Stage.Foundation, Stage.Jade, 4);
  ok(scratch === 1, `Foundation hitting a Jade barely scratches (1 chip dmg, got ${scratch})`);
  // Jade elder (attack 28) vs a Foundation child (defense 1, 40 HP).
  const obliterate = computeDamage(28, Stage.Jade, Stage.Foundation, 1);
  ok(obliterate >= 38, `Jade hitting a Foundation nearly one-shots (${obliterate} vs 40 HP)`);
}

// Multiplier scales linearly-ish and min damage is always 1.
ok(
  computeDamage(10, Stage.Copper, Stage.Copper, 0, 2) === 20,
  "multiplier x2 doubles unmitigated damage",
);
ok(computeDamage(0.01, Stage.Foundation, Stage.Gold, 50) === 1, "landed hits always chip at least 1");

// In-game matchup sanity (the real M2 numbers).
{
  const pVsSlith = computeDamage(6, Stage.Foundation, Stage.Foundation, 0);
  ok(pVsSlith === 6, `player vs slitherer = 6/hit -> 3 hits to kill 14 HP (got ${pVsSlith})`);
  const stalkerVsP = computeDamage(9, Stage.Iron, Stage.Foundation, 1);
  ok(stalkerVsP >= 30, `stalker hit takes most of the player's 40 HP (got ${stalkerVsP}) — RUN`);
}

// ------------------------------------------------------------- techniques

{
  registerTechnique({
    id: "test-buff",
    name: "Test Buff",
    type: "Enforcer",
    madraCost: 10,
    cooldown: 5,
    execute(ctx) {
      ctx.user.applyBuff(1.5, 1.5, 2);
      return true;
    },
  });
  ok(getTechnique("test-buff")?.name === "Test Buff", "technique registry stores and returns defs");

  const buffs = [];
  const user = {
    x: 0,
    y: 0,
    stats: makeStats({ maxHealth: 10, maxMadra: 30, attackPower: 1, defense: 0, moveSpeed: 90, stage: Stage.Foundation }),
    applyBuff: (s, d, t) => buffs.push([s, d, t]),
  };
  const caster = new TechniqueCaster();
  caster.slots = ["test-buff", null, null, null];

  ok(caster.tryCast(0, { user, fx: null }) === true, "cast succeeds with madra available");
  ok(user.stats.madra === 20, `madra deducted (30 -> ${user.stats.madra})`);
  ok(buffs.length === 1, "execute hook ran");
  ok(caster.tryCast(0, { user, fx: null }) === false, "cast blocked while on cooldown");
  caster.update(5.1);
  user.stats.madra = 5;
  ok(caster.tryCast(0, { user, fx: null }) === false, "cast blocked without enough madra");
  ok(caster.tryCast(1, { user, fx: null }) === false, "empty slot does nothing");
}

// ---------------------------------------------------------- line of sight

{
  const map = createTestValley();
  // Open grass near spawn: clear sight.
  ok(hasLineOfSight(map, 18 * 16, 26 * 16, 22 * 16, 26 * 16), "LOS clear across open ground");
  // Across the courtyard's solid wall (column 13, rows 12-18): blocked.
  ok(
    !hasLineOfSight(map, 12 * 16 + 8, 15 * 16 + 8, 15 * 16 + 8, 15 * 16 + 8),
    "LOS blocked through a solid wall — no aggro through walls",
  );
}

console.log(failures === 0 ? "\nAll combat checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
