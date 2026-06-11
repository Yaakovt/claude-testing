// Unit tests for the advancement system (requirements + stage-up math) and
// the Path data, runnable in plain node — systems/advancement.ts is pure.
// Usage: npm run build && node tools/checkadvance.mjs

import { makeStats, Stage } from "../dist/systems/stats.js";
import {
  applyStageUp,
  channelTickDamage,
  channelWouldKill,
  copperReady,
  emptyPalmReady,
  freshProgress,
  ironPurchaseAllowed,
  COPPER_MADRA_FILLS,
  EMPTY_PALM_PRACTICE_HITS,
  IRON_CHANNEL_SECONDS,
  IRON_CHANNEL_TICKS,
  IRON_SCALE_COST,
  STAGE_REQUIREMENTS,
  STAGE_GAINS,
} from "../dist/systems/advancement.js";
import { PATHS, ORIGIN_ORDER } from "../dist/game/paths.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

// ------------------------------------------------------- stage-up benefits

{
  // The player's actual Foundation statline (Wei start).
  const s = makeStats({ maxHealth: 40, maxMadra: 30, attackPower: 6, defense: 1, moveSpeed: 90, stage: Stage.Foundation });
  s.health = 12;
  s.madra = 3;

  applyStageUp(s, Stage.Copper);
  ok(s.stage === Stage.Copper, "stage-up sets the new stage");
  ok(s.maxHealth === 50, `Copper: maxHealth 40 -> 50 (got ${s.maxHealth})`);
  ok(s.maxMadra === 41, `Copper: maxMadra 30 -> 41 (got ${s.maxMadra})`);
  ok(s.attackPower === 7, `Copper: attack 6 -> 7 (got ${s.attackPower})`);
  ok(s.defense === 1 && s.moveSpeed === 90, "Copper: defense/speed unchanged");
  ok(s.health === s.maxHealth && s.madra === s.maxMadra, "stage-up refills health + madra");

  applyStageUp(s, Stage.Iron);
  ok(s.maxHealth === 85, `Iron body: maxHealth 50 -> 85 (got ${s.maxHealth})`);
  ok(s.attackPower === 11, `Iron body: attack 7 -> 11 (got ${s.attackPower})`);
  ok(s.defense === 3, `Iron body: defense 1 -> 3 (got ${s.defense})`);
  ok(s.moveSpeed === 101, `Iron body: speed 90 -> 101 (got ${s.moveSpeed})`);

  // Guard rails.
  let threw = false;
  try {
    applyStageUp(s, Stage.Gold); // skipping Jade
  } catch {
    threw = true;
  }
  ok(threw, "applyStageUp rejects skipping a stage");
  ok(STAGE_GAINS[Stage.Jade] && STAGE_GAINS[Stage.Gold], "Jade/Gold gains exist (structure for M4)");
}

// ----------------------------------------------------------- requirements

{
  const p = freshProgress();
  ok(!copperReady(p), "fresh character is not Copper-ready");
  p.madraFills = COPPER_MADRA_FILLS - 1;
  ok(!copperReady(p), `${COPPER_MADRA_FILLS - 1} fills is not enough`);
  p.madraFills = COPPER_MADRA_FILLS;
  ok(copperReady(p), `${COPPER_MADRA_FILLS} madra fills satisfies Copper`);

  ok(!ironPurchaseAllowed(IRON_SCALE_COST - 1), "elixir refused below 25 scales");
  ok(ironPurchaseAllowed(IRON_SCALE_COST), "elixir affordable at 25 scales");

  ok(STAGE_REQUIREMENTS[Stage.Jade]?.kind === "story", "Jade is story-gated (M4)");
  ok(STAGE_REQUIREMENTS[Stage.Gold]?.kind === "story", "Gold is story-gated (M4)");
  ok(STAGE_REQUIREMENTS[Stage.Copper]?.kind === "madra-fills", "Copper requirement is the capacity exercise");
  ok(STAGE_REQUIREMENTS[Stage.Iron]?.kind === "refining", "Iron requirement is the elixir refining");
}

// ------------------------------------------------------- the Iron channel

{
  const maxHealth = 50; // Copper-stage player
  const tick = channelTickDamage(maxHealth);
  const total = tick * IRON_CHANNEL_TICKS;
  ok(
    Math.abs(total - maxHealth * 0.57) < 0.001,
    `full channel deals ~57% of max HP (${total.toFixed(1)}/${maxHealth})`,
  );
  ok(IRON_CHANNEL_SECONDS === 10, "channel is 10 seconds");

  // Survive from full health; die from below ~60%.
  const survives = (hp) => hp - total > 0;
  ok(survives(maxHealth), "full-health artist survives the refining");
  ok(survives(maxHealth * 0.6), "an artist at exactly 60% barely survives");
  ok(!survives(maxHealth * 0.5), "an artist at 50% would die in the refining");
  ok(channelWouldKill(maxHealth * 0.5, maxHealth), "channelWouldKill flags sub-60% health");
  ok(!channelWouldKill(maxHealth, maxHealth), "channelWouldKill passes full health");
}

// -------------------------------------------------- Empty Palm requirements

{
  const p = freshProgress();
  p.basicHits = EMPTY_PALM_PRACTICE_HITS;
  ok(!emptyPalmReady(Stage.Foundation, p), "Empty Palm needs Copper, not just practice");
  ok(emptyPalmReady(Stage.Copper, p), "Copper + 30 landed strikes = Empty Palm ready");
  p.basicHits = EMPTY_PALM_PRACTICE_HITS - 1;
  ok(!emptyPalmReady(Stage.Copper, p), "29 strikes is not 30");
  p.basicHits = EMPTY_PALM_PRACTICE_HITS;
  p.emptyPalmLearned = true;
  ok(!emptyPalmReady(Stage.Copper, p), "already-learned palm does not re-trigger");
}

// -------------------------------------------------------------- path data

{
  ok(ORIGIN_ORDER.length === 4, "four origins");
  ok(PATHS.wei.pathName === "Path of the White Fox" && !PATHS.wei.invented, "Wei = canon White Fox");
  ok(PATHS.li.invented && PATHS.kazan.invented, "Li/Kazan Paths are labeled inventions");
  ok(PATHS.unsouled.difficulty.includes("hardest"), "Unsouled is marked the hardest road");
  ok(PATHS.unsouled.defaultName === "Lindon", "Unsouled placeholder name is Lindon");
  ok(PATHS.unsouled.baseMaxMadra > PATHS.wei.baseMaxMadra, "Unsouled has slightly higher max madra");
}

console.log(failures === 0 ? "\nAll advancement checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
