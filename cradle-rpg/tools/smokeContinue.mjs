// Headless smoke test for CONTINUE + save migration:
//   - seeds localStorage with an M2-era v2 save (pre-character-creation)
//     whose stage label is "Iron" and whose map is the old "testValley"
//   - boots main.js: the v2 -> v3 migration must mint a Wei character and
//     carry the stage into systems.advancement; the v3 -> v4 migration must
//     land the old map id on "valleyWilds" (same layout/coordinates) and
//     mint an empty story bucket
//   - title shows the menu; New Game's confirm step is visited and backed
//     out of (nothing wiped); Continue then builds the world
//   - the world restores stage (Iron stats + U technique + position +
//     health/madra/scales clamped to the rescaled maxima); the valleyWilds
//     on-enter cutscene greets the migrated save ONCE (its flag was never
//     set) and is driven to completion
// Usage: npm run build && node tools/smokeContinue.mjs

const noop = () => {};

function makeContext2d() {
  const store = {};
  return new Proxy(store, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return noop;
    },
    set(t, prop, value) {
      t[prop] = value;
      return true;
    },
  });
}

function makeCanvas() {
  return {
    width: 0,
    height: 0,
    style: {},
    getContext: () => makeContext2d(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    addEventListener: noop,
    removeEventListener: noop,
    focus: noop,
  };
}

const canvas = makeCanvas();
const windowListeners = new Map();

const rafCallbacks = [];
globalThis.requestAnimationFrame = (cb) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
};
globalThis.cancelAnimationFrame = noop;

globalThis.document = {
  hidden: false,
  getElementById: (id) => (id === "game" ? canvas : null),
  createElement: (tag) => (tag === "canvas" ? makeCanvas() : {}),
  addEventListener: noop,
  removeEventListener: noop,
};

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: (type, fn) => windowListeners.set(type, fn),
  removeEventListener: noop,
};

// Seed an M2-era v2 save BEFORE booting the game.
const SEED = {
  version: 2,
  savedAt: new Date().toISOString(),
  player: { x: 18 * 16 + 8, y: 22 * 16 + 8, map: "testValley", facing: "down", stage: "Iron" },
  flags: {},
  systems: { combat: { health: 60, madra: 20, scales: 7 } },
};
storage.set("path-of-ascension.save", JSON.stringify(SEED));

let t = 0;
function frames(n) {
  for (let i = 0; i < n; i++) {
    t += 16.7;
    const pending = rafCallbacks.splice(0, rafCallbacks.length);
    for (const cb of pending) cb(t);
  }
}
const keyDown = (code) =>
  windowListeners.get("keydown")?.({ code, repeat: false, preventDefault: noop });
const keyUp = (code) => windowListeners.get("keyup")?.({ code, preventDefault: noop });
const tap = (code, settle = 2) => {
  keyDown(code);
  frames(2);
  keyUp(code);
  frames(settle);
};

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

try {
  await import("../dist/game/main.js");
  const T = globalThis.__poaTest;
  if (!T) throw new Error("main.js did not expose the __poaTest hook");

  frames(5);
  tap("KeyZ"); // press any key
  ok(T.screens.state === "menu", "an existing save brings up Continue / New Game");

  // Visit New Game's confirm step and back out — nothing should be wiped.
  tap("ArrowDown"); // -> New Game
  tap("Enter");
  ok(T.screens.state === "confirmWipe", "New Game over a save asks for confirmation");
  tap("Enter"); // "No — return" is preselected
  ok(T.screens.state === "menu", "declining returns to the menu");
  ok(storage.has("path-of-ascension.save"), "the old save survives a declined wipe");

  // Continue.
  tap("ArrowUp"); // -> Continue
  tap("Enter");
  frames(3);
  ok(T.world !== null, "Continue builds the world");

  const player = T.player;
  ok(T.world.mapEntry.id === "valleyWilds",
    `v3 -> v4 migration lands the old testValley save on valleyWilds (got ${T.world.mapEntry.id})`);
  ok(player.origin === "wei" && player.displayName === "Shen",
    "v2 -> v3 migration mints a Wei character named Shen");
  ok(player.stats.stage === 2, "stage restored from the migrated save (Iron)");
  ok(player.stats.maxHealth === 85 && player.stats.attackPower === 11 && player.stats.maxMadra === 49,
    `Iron stats rebuilt on load (hp ${player.stats.maxHealth}, atk ${player.stats.attackPower}, madra ${player.stats.maxMadra})`);
  ok(player.stats.health === 60 && player.stats.madra === 20,
    `health/madra restored within the rescaled maxima (${player.stats.health}/${player.stats.madra})`);
  ok(T.gameState.scales === 7, "scales restored");
  ok(Math.abs(player.x - SEED.player.x) < 1 && Math.abs(player.y - SEED.player.y) < 1,
    "position restored");
  ok(player.pc.caster.slots[2] === "white-fox-cloak", "Iron U technique available after load");

  // The wilds' on-enter cutscene greets the migrated save (flag never set).
  ok(T.cutscene !== null, "valleyWilds on-enter cutscene fires for the migrated save");
  ok(T.story.flagTruthy("seed.sawWildsIntro"), "its once-flag is set so it never refires");
  frames(90); // camera pan
  tap("KeyE"); // skip reveal, line 1
  tap("KeyE"); // dismiss
  tap("KeyE"); // skip reveal, line 2
  tap("KeyE"); // dismiss
  frames(60); // resetCamera glide
  ok(T.cutscene === null, "cutscene driven to completion");
  ok(T.story.flagTruthy("seed.leftVillage"), "cutscene effects applied");
  ok(Math.abs(player.x - SEED.player.x) < 1, "the cutscene moved the camera, not the player");

  // Re-save: must come out as v4 with everything intact.
  windowListeners.get("pagehide")?.();
  const parsed = JSON.parse(storage.get("path-of-ascension.save"));
  ok(parsed.version === 4, `re-saved as version 4 (got ${parsed.version})`);
  ok(parsed.player.map === "valleyWilds", "player.map persists the registry id");
  ok(parsed.systems?.advancement?.stage === 2, "advancement bucket persists the stage");
  ok(parsed.systems?.character?.origin === "wei", "character bucket persists");
  ok(parsed.flags["seed.sawWildsIntro"] === true, "story flags persist");
  const st = parsed.systems?.story;
  ok(st && Array.isArray(st.questsActive) && Array.isArray(st.questsCompleted),
    "systems.story bucket persists");

  console.log(failures === 0 ? "\nContinue/migration smoke test passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("FAIL  continue smoke test:", err);
  process.exit(1);
}
