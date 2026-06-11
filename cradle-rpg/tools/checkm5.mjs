// M5 PURE-LOGIC checks, runnable in plain node:
//   - remnantStatsFor: degraded statline (same stage, ~60%, floors)
//   - Soulsmith rebuiltStats: determinism (base -> stage chain -> upgrades),
//     the +15% madra deriving from the post-stage base (no compounding),
//     idempotence across "save/load" (rebuild twice = same numbers)
//   - upgradeFlag mirroring
//   - audio: headless no-op — every Sfx cue + music callable without an
//     AudioContext, no throw, audio.available === false under node
//   - save slots: storageKeyFor mapping (slot 1 = legacy key) + isolation
//     (writing slot 2 never touches slot 1) + peekSlot
// Usage: npm run build && node tools/checkm5.mjs

import {
  remnantStatsFor,
  REMNANT_STAT_FRACTION,
} from "../dist/game/remnant.js";
import {
  rebuiltStats,
  rebuildPlayerStats,
  upgradeFlag,
  SOULSMITH_UPGRADES,
  SOULSMITH_UPGRADE_IDS,
} from "../dist/game/soulsmith.js";
import { makeStats, Stage } from "../dist/systems/stats.js";
import { applyStageUp } from "../dist/systems/advancement.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

// ----------------------------------------------------------- remnant stats

{
  const iron = makeStats({
    maxHealth: 80,
    maxMadra: 30,
    attackPower: 14,
    defense: 4,
    moveSpeed: 100,
    stage: Stage.Iron,
  });
  const r = remnantStatsFor(iron);
  ok(r.stage === Stage.Iron, "remnant keeps the dead artist's stage");
  ok(r.maxHealth === Math.round(80 * REMNANT_STAT_FRACTION), `remnant HP degraded to 60% (${r.maxHealth})`);
  ok(r.attackPower === Math.round(14 * REMNANT_STAT_FRACTION), `remnant attack degraded to 60% (${r.attackPower})`);
  ok(r.defense === Math.round(4 * REMNANT_STAT_FRACTION), `remnant defense degraded (${r.defense})`);
  ok(r.maxMadra === 0, "remnants ARE madra — they carry no pool");

  const feeble = makeStats({ maxHealth: 1, maxMadra: 0, attackPower: 1, defense: 0, moveSpeed: 50, stage: Stage.Foundation });
  const fr = remnantStatsFor(feeble);
  ok(fr.maxHealth >= 1 && fr.attackPower >= 1, "degradation floors at 1 HP / 1 attack");
}

// ------------------------------------------------------- soulsmith rebuild

{
  // Baseline: a Wei Iron with no upgrades must equal the plain chain.
  const chain = makeStats({ maxHealth: 40, maxMadra: 30, attackPower: 6, defense: 1, moveSpeed: 90, stage: Stage.Foundation });
  applyStageUp(chain, Stage.Copper);
  applyStageUp(chain, Stage.Iron);
  const plain = rebuiltStats("wei", Stage.Iron, []);
  ok(
    plain.maxHealth === chain.maxHealth && plain.attackPower === chain.attackPower && plain.maxMadra === chain.maxMadra,
    `no-upgrade rebuild equals the stage chain (${plain.maxHealth} hp / ${plain.attackPower} atk / ${plain.maxMadra} madra)`,
  );

  const all = rebuiltStats("wei", Stage.Iron, SOULSMITH_UPGRADE_IDS);
  ok(all.attackPower === plain.attackPower + 2, `Forged Edge lands on the post-stage statline (+2 -> ${all.attackPower})`);
  ok(all.maxHealth === plain.maxHealth + 10, `Bound Sash +10 max health (${all.maxHealth})`);
  ok(
    all.maxMadra === plain.maxMadra + Math.round(plain.maxMadra * 0.15),
    `Refined Channels +15% of the post-stage madra base (${all.maxMadra})`,
  );
  ok(all.health === all.maxHealth && all.madra === all.maxMadra, "rebuild refills health and madra");

  // Determinism: in-session stage-up + rebuild == load-time rebuild.
  const live = rebuiltStats("wei", Stage.Copper, ["refinedChannels"]);
  applyStageUp(live, Stage.Iron);
  rebuildPlayerStats(live, "wei", ["refinedChannels"]);
  const loaded = rebuiltStats("wei", Stage.Iron, ["refinedChannels"]);
  ok(
    live.maxMadra === loaded.maxMadra && live.maxHealth === loaded.maxHealth && live.attackPower === loaded.attackPower,
    `stage-up rebuild matches a fresh load (${live.maxMadra} madra both ways — no compounding)`,
  );

  ok(upgradeFlag("forgedEdge") === "smith.forgedEdge", "upgrade flag mirrors as smith.<id>");
  ok(
    SOULSMITH_UPGRADE_IDS.every((id) => SOULSMITH_UPGRADES[id].coreCost >= 1 && SOULSMITH_UPGRADES[id].scaleCost > 0),
    "every upgrade costs at least one core and some scales",
  );
}

// ------------------------------------------------------- audio headless

{
  const { audio, music, Sfx } = await import("../dist/game/sounds.js");
  ok(audio.available === false, "no AudioContext under node — audio.available is false");
  let threw = false;
  try {
    audio.unlock(); // must no-op, not crash
    for (const k of Object.keys(Sfx)) {
      const fn = Sfx[k];
      if (typeof fn === "function") {
        if (k === "cast") fn("Striker");
        else fn();
      }
    }
    music.setScene("valley");
    music.setScene("tense");
    music.update(0.5);
    audio.setVolume(0.5);
    audio.toggleMute();
    audio.setMuted(false);
  } catch (err) {
    threw = true;
    console.error(err);
  }
  ok(!threw, "every Sfx cue + music + volume/mute no-ops cleanly headless");
}

// ----------------------------------------------------------- save slots

{
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const { storageKeyFor, setActiveSlot, getActiveSlot, peekSlot, save, load, defaultSave, SLOT_COUNT } =
    await import("../dist/engine/save.js");

  ok(SLOT_COUNT === 3, "three save slots");
  ok(storageKeyFor(1) === "path-of-ascension.save", "slot 1 keeps the legacy key (old saves become slot 1)");
  ok(storageKeyFor(2) === "path-of-ascension.save.slot2", "slot 2 gets a suffixed key");

  setActiveSlot(1);
  const a = defaultSave();
  a.player.x = 111;
  save(a);
  setActiveSlot(2);
  const b = defaultSave();
  b.player.x = 222;
  save(b);
  ok(getActiveSlot() === 2, "active slot tracks the picker");
  ok(load().player.x === 222, "load() reads the active slot");
  setActiveSlot(1);
  ok(load().player.x === 111, "slot 1 untouched by a slot-2 save");
  ok(peekSlot(2).player.x === 222 && getActiveSlot() === 1, "peekSlot reads without switching slots");
  setActiveSlot(99);
  ok(getActiveSlot() === 3, "slot index clamps to the slot count");
}

console.log(failures === 0 ? "\nAll M5 checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
