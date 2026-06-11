// Headless smoke test for the UNSOULED start (the Lindon road):
//   - creation through the real UI (origin list -> Unsouled, placeholder name)
//   - starts with NOTHING: empty K/L/U/I, higher max madra, K does nothing
//   - Copper via the real shrine path (fills fast-forwarded via the hook)
//   - Empty Palm learn TRIGGER is the real code path: practice counter is
//     fast-forwarded to 29, then one real landed J strike tips it over
//   - Empty Palm cast: madra cost, damage, daze + madra-lock on the victim
//   - Burst of Effort arrives on L alongside the palm
//   - v3 save carries emptyPalmLearned
// Usage: npm run build && node tools/smokeUnsouled.mjs

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
  const { classes } = T;

  // ---- creation: pick the Unsouled, accept the "Lindon" placeholder ----------
  frames(5);
  tap("KeyZ"); // press any key
  tap("KeyE"); // slot 1 (empty) — M5 slot picker
  tap("ArrowDown"); // wei -> li
  tap("ArrowDown"); // li -> kazan
  tap("ArrowDown"); // kazan -> unsouled
  tap("KeyE"); // the hardest road
  ok(T.screens.state === "name", "Unsouled chosen -> name entry");
  tap("Enter"); // empty input -> placeholder
  frames(3);
  ok(T.world !== null, "world built");

  // M4b: creation lands in the Wei village and the festival-morning opening
  // cutscene plays. This test is about the spirit, not the story — drive the
  // opening to its end, suppress the wilds on-enter scene via its once-flag,
  // and warp to the wilds through the test hook.
  frames(5);
  ok(T.cutscene !== null, "the opening cutscene plays for the Unsouled too");
  {
    let spent = 0;
    while (T.cutscene && spent < 4000) {
      if (T.dialogueUi.active) {
        tap("KeyE", 1);
        spent += 5;
      } else {
        frames(1);
        spent += 1;
      }
    }
  }
  ok(T.cutscene === null, "opening cutscene driven to completion");
  T.story.setFlag("a2.sawWildsIntro");
  T.warp("valleyWilds");
  frames(3);
  ok(T.world.mapEntry.id === "valleyWilds", "warped to the Valley Wilds (test hook)");
  ok(T.cutscene === null, "once-flag suppressed the on-enter cutscene");

  const player = T.player;
  const entities = T.entities;
  const advancement = T.advancement;
  const gameState = T.gameState;

  ok(player.displayName === "Lindon", `placeholder name is Lindon (got "${player.displayName}")`);
  ok(player.origin === "unsouled", "origin is unsouled");
  ok(player.stats.maxMadra === 36, `Unsouled core runs deeper: 36 max madra (got ${player.stats.maxMadra})`);
  ok(
    player.pc.caster.slots.every((s) => s === null),
    "Unsouled starts with NOTHING on K/L/U/I",
  );

  // K does nothing before the Empty Palm exists.
  const madra0 = player.stats.madra;
  tap("KeyK");
  ok(player.stats.madra === madra0, "pressing K with an empty core does nothing");

  const teleport = (e, x, y) => {
    e.x = x;
    e.y = y;
    e.resetInterpolation();
  };

  // Clear the wilds; this test is about the spirit, not the beasts.
  const boar = entities.all.find((e) => e instanceof classes.MadBoar);
  for (const b of entities.all.filter((e) => e instanceof classes.Dreadbeast)) {
    if (b !== boar) b.dead = true;
  }
  frames(2);

  // ---- Copper (fills fast-forwarded; the shrine interact is real) ------------
  advancement.progress.madraFills = 5;
  const shrine = T.shrines[0];
  teleport(player, shrine.x, shrine.y + 2);
  frames(2);
  tap("KeyE");
  ok(player.stats.stage === 1, "Unsouled reaches Copper at the shrine");
  ok(player.stats.maxMadra === 49, `Copper madra: 36 -> 49 (got ${player.stats.maxMadra})`);
  ok(
    player.pc.caster.slots.every((s) => s === null),
    "Copper alone teaches the Unsouled nothing — practice remains",
  );

  // ---- Empty Palm learn: 29 banked strikes + ONE real landed hit --------------
  advancement.progress.basicHits = 29;
  teleport(player, 18 * 16 + 8, 22 * 16 + 8);
  teleport(boar, player.x + 12, player.y);
  boar.hitstun = 1; // staged sparring partner holds still
  keyDown("KeyD");
  frames(2);
  keyUp("KeyD");
  frames(2);
  ok(!advancement.progress.emptyPalmLearned, "palm not yet learned at 29 strikes");
  tap("KeyJ");
  frames(10);
  ok(advancement.progress.basicHits >= 30, `the 30th strike lands (${advancement.progress.basicHits})`);
  ok(advancement.progress.emptyPalmLearned === true, "EMPTY PALM crystallizes via the real hit path");
  ok(
    JSON.stringify(player.pc.caster.slots) ===
      JSON.stringify(["empty-palm", "burst-of-effort", null, null]),
    "K = Empty Palm, L = Burst of Effort after learning",
  );
  ok(advancement.ceremony !== null, "the learn moment gets its ceremony");

  // ---- Empty Palm cast: damage + daze + madra lock ----------------------------
  frames(30); // recover from the swing
  teleport(boar, player.x + 12, player.y);
  boar.hitstun = 1;
  boar.iframes = 0;
  const boarHp0 = boar.stats.health;
  player.stats.madra = player.stats.maxMadra;
  tap("KeyK");
  frames(2);
  ok(
    Math.abs(player.stats.madra - (player.stats.maxMadra - 8)) < 0.001,
    `Empty Palm costs 8 madra (${player.stats.maxMadra} -> ${player.stats.madra.toFixed(1)})`,
  );
  ok(boar.stats.health < boarHp0, `Empty Palm hurts (boar ${boarHp0} -> ${boar.stats.health})`);
  ok(boar.dazeTimer > 0, "victim is dazed — aggro forgotten");
  ok(boar.madraLockTimer > 0, "victim's madra is locked — specials sealed");

  // While locked, the boar can never enter windup/attack.
  let sawSpecial = false;
  teleport(boar, player.x + 30, player.y);
  for (let i = 0; i < 120; i++) {
    frames(1);
    if (boar.state === "windup" || boar.state === "attack") sawSpecial = true;
  }
  ok(!sawSpecial, "madra-locked boar never charges (2s observed)");

  // ---- Burst of Effort on L ----------------------------------------------------
  frames(60);
  player.stats.madra = player.stats.maxMadra;
  tap("KeyL");
  ok(player.speedMult === 1.4 && player.damageMult === 1.4, "Burst of Effort buffs from the L slot");
  ok(
    Math.abs(player.stats.madra - (player.stats.maxMadra - 9)) < 0.001,
    "Burst of Effort costs 9 madra",
  );

  // ---- save carries the learned palm -------------------------------------------
  windowListeners.get("pagehide")?.();
  const parsed = JSON.parse(storage.get("path-of-ascension.save"));
  ok(parsed.version === 5, "save is version 5");
  ok(parsed.player.map === "valleyWilds", "save carries the warped map id");
  ok(parsed.flags["a2.sawWildsIntro"] === true, "save carries story flags");
  ok(
    parsed.systems?.character?.origin === "unsouled" &&
      parsed.systems?.character?.name === "Lindon",
    "save: character { unsouled, Lindon }",
  );
  ok(
    parsed.systems?.advancement?.emptyPalmLearned === true &&
      parsed.systems?.advancement?.stage === 1,
    "save: advancement carries emptyPalmLearned + Copper stage",
  );

  console.log(failures === 0 ? "\nUnsouled smoke test passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("FAIL  unsouled smoke test:", err);
  process.exit(1);
}
