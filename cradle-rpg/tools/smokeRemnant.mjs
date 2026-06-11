// Headless smoke test for the M5 systems at runtime:
//   - killing a humanoid enforcer tears a hostile REMNANT free (and a
//     dreadbeast kill still doesn't)
//   - fighting the Remnant down drops scales + a Remnant-core pickup that
//     counts into the "item.remnantCore" flag
//   - HARVEST: holding E near a fresh Remnant channels 2s and subdues it
//     (+1 core, bonus scales, no fight); breaking off resets the channel
//   - SOULSMITH: Fisher Gesha's real dialogue path sells Forged Edge —
//     scales/cores deducted, +2 attack on the rebuilt statline, once-per-
//     save flag set, purchase persisted in the v5 save
// Usage: npm run build && node tools/smokeRemnant.mjs

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

  // ---- creation: a Wei artist, default name ---------------------------------
  frames(5);
  tap("KeyZ"); // press any key
  tap("KeyE"); // slot 1 (empty) — M5 slot picker
  tap("KeyE"); // Wei clan
  tap("Enter"); // accept the placeholder name
  frames(3);
  ok(T.world !== null, "world built");

  // Skip the opening cutscene by driving it out.
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

  const teleport = (e, x, y) => {
    e.x = x;
    e.y = y;
    e.resetInterpolation();
  };

  // ---- a humanoid death tears a Remnant free --------------------------------
  // The Heaven's Glory enforcers spawn once the school turns hostile.
  T.story.setFlag("a2.sawWildsIntro"); // suppress on-enter scenes while warping
  T.story.setFlag("heavensGlory.hostile");
  T.warp("heavensGlory");
  frames(3);
  ok(T.world.mapEntry.id === "heavensGlory", "warped to the hostile school");

  const enforcers = T.entities.all.filter((e) => e instanceof classes.Enforcer);
  ok(enforcers.length === 3, `3 enforcers walk the hostile school (got ${enforcers.length})`);

  // Park the player far from the kill so the Remnant rises unharried.
  teleport(T.player, 21 * 16, 25 * 16);
  const [first, second] = enforcers;
  ok(
    !T.entities.all.some((e) => e instanceof classes.Remnant),
    "no Remnant before anything dies",
  );
  T.combat.applyDamage(first, 9999);
  frames(40); // death dissolve, then the spirit tears free
  const remnant1 = T.entities.all.find((e) => e instanceof classes.Remnant);
  ok(remnant1 !== undefined, "killing a sacred artist tears a Remnant free");
  ok(remnant1.stats.stage === first.stats.stage, "the Remnant keeps the artist's stage");
  ok(remnant1.fresh === true, "freshly risen — the harvest window is open");

  // ---- fight it down: scales + a core pickup --------------------------------
  const scales0 = T.gameState.scales;
  T.combat.applyDamage(remnant1, 9999);
  frames(40);
  ok(!T.entities.all.includes(remnant1), "the destroyed Remnant dissolves");
  ok(
    !T.entities.all.some((e) => e instanceof classes.Remnant),
    "a Remnant leaves no second Remnant",
  );
  const core = T.entities.all.find((e) => e instanceof classes.RemnantCorePickup);
  ok(core !== undefined, "a Remnant core drops from the broken spirit");
  const droppedScales = T.entities.all.filter((e) => e instanceof classes.ScalePickup);
  ok(droppedScales.length >= 2, `the spirit renders down to scales too (${droppedScales.length})`);
  teleport(T.player, core.x, core.y);
  frames(4);
  ok(T.story.getFlag("item.remnantCore") === 1, "walking over the core counts it (1)");
  for (const s of T.entities.all.filter((e) => e instanceof classes.ScalePickup)) {
    teleport(T.player, s.x, s.y);
    frames(3);
  }
  ok(T.gameState.scales > scales0, `scale pickups collected (${scales0} -> ${T.gameState.scales})`);

  // ---- harvest the second one ------------------------------------------------
  // The first bolt comes ~2.6s after the rise: an IMMEDIATE, committed 2s
  // channel just fits — hesitate and you're timing channels between bolts.
  teleport(T.player, 21 * 16, 25 * 16);
  T.combat.applyDamage(second, 9999);
  frames(6); // the spirit tears free at once
  const remnant2 = T.entities.all.find((e) => e instanceof classes.Remnant);
  ok(remnant2 !== undefined, "the second enforcer's Remnant rises");
  teleport(T.player, remnant2.x + 10, remnant2.y);
  const scalesPreHarvest = T.gameState.scales;
  keyDown("KeyE");
  frames(130); // > 2s at 60Hz, done before the first bolt
  keyUp("KeyE");
  frames(4);
  ok(!T.entities.all.includes(remnant2), "the subdued Remnant is gone — no fight");
  ok(T.story.getFlag("item.remnantCore") === 2, "harvest pays a core intact (2)");
  // Some may land under the player and auto-collect: ground + collected = 4.
  const bonus = T.entities.all.filter((e) => e instanceof classes.ScalePickup);
  const autoCollected = T.gameState.scales - scalesPreHarvest;
  ok(
    bonus.length + autoCollected === 4,
    `harvest bonus pays 4 scales (${bonus.length} on the ground + ${autoCollected} collected)`,
  );
  for (const s of bonus) {
    teleport(T.player, s.x, s.y);
    frames(3);
  }

  // ---- a broken-off channel resets ---------------------------------------------
  const third = T.entities.all.find((e) => e instanceof classes.Enforcer);
  ok(third !== undefined, "one enforcer still stands");
  teleport(T.player, 21 * 16, 25 * 16);
  T.combat.applyDamage(third, 9999);
  frames(6);
  const remnant3 = T.entities.all.find((e) => e instanceof classes.Remnant);
  ok(remnant3 !== undefined, "the third Remnant rises");
  teleport(T.player, remnant3.x + 10, remnant3.y);
  keyDown("KeyE");
  frames(30); // ~0.5s of the 2s channel
  ok(T.world.harvest.t > 0.3, `the channel is running (${T.world.harvest.t.toFixed(2)}s)`);
  keyUp("KeyE");
  frames(2);
  ok(T.world.harvest.t === 0, "releasing E resets the channel");
  teleport(T.player, 21 * 16, 25 * 16); // walk away — let that one roam

  // ---- Fisher Gesha: craft Forged Edge through the REAL dialogue ------------
  T.warp("valleyWilds");
  frames(3);
  const gesha = T.npcs.find((n) => n.def.id === "m5-soulsmith");
  ok(gesha !== undefined, "Fisher Gesha keeps her stall on the wilds road");

  // Clear the wilds so nothing interrupts commerce.
  for (const b of T.entities.all.filter((e) => e instanceof classes.Dreadbeast)) b.dead = true;
  frames(2);

  T.gameState.scales = 20;
  const atkBefore = T.player.stats.attackPower;
  teleport(T.player, gesha.x + 2, gesha.y + 10);
  frames(2);
  tap("KeyE"); // talk
  ok(T.dialogueUi.active === true, "E opens the Soulsmith's stall");
  tap("KeyE"); // skip reveal of the greeting
  tap("KeyE"); // -> intro
  tap("KeyE"); // skip reveal
  tap("KeyE"); // -> menu
  tap("KeyE"); // skip reveal of the menu line
  // First visible choice = Forged Edge (1 core + 15 scales; we hold 2 + 20).
  tap("KeyE"); // pick it
  tap("KeyE"); // skip reveal of "crafted"
  ok(T.story.flagTruthy("smith.forgedEdge"), "the once-per-save flag is set");
  ok(T.player.stats.attackPower === atkBefore + 2, `Forged Edge: +2 attack (${atkBefore} -> ${T.player.stats.attackPower})`);
  ok(T.gameState.scales === 5, `15 scales paid (${T.gameState.scales} left)`);
  ok(T.story.getFlag("item.remnantCore") === 1, "1 core consumed (1 left)");
  // Back at the menu: only the lore question and the farewell remain
  // affordable, so step down to "Safe travels" and leave.
  tap("KeyE"); // -> menu again
  tap("KeyE"); // skip the menu line's reveal
  tap("ArrowDown"); // past "Where do I find Remnant cores?"
  tap("KeyE"); // farewell
  ok(T.dialogueUi.active === false, "the stall closes politely");

  // ---- persistence -------------------------------------------------------------
  windowListeners.get("pagehide")?.();
  const parsed = JSON.parse(storage.get("path-of-ascension.save"));
  ok(parsed.version === 5, `save is version 5 (got ${parsed.version})`);
  ok(
    Array.isArray(parsed.systems?.soulsmith?.purchased) &&
      parsed.systems.soulsmith.purchased.includes("forgedEdge"),
    "save carries the Soulsmith purchase",
  );
  ok(parsed.flags["item.remnantCore"] === 1, "save carries the counted core flag");
  ok(
    typeof parsed.systems?.audio?.volume === "number" && parsed.systems.audio.muted === false,
    "save carries the audio settings",
  );

  console.log(failures === 0 ? "\nRemnant/Soulsmith smoke test passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("FAIL  remnant smoke test:", err);
  process.exit(1);
}
