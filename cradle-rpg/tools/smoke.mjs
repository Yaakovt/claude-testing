// Headless smoke test: boots dist/game/main.js under a minimal DOM shim and
// drives simulated frames + key input to catch runtime errors AND verify the
// M2 combat loop end to end:
//   - player kills a slitherer with J strikes
//   - scales drop (1-3) and are collectable by walking over them
//   - cycling (hold C) refills madra and slows movement to ~35%
//   - player death fades + respawns at the spawn point (full HP, half madra)
//   - v2 save schema persists health/madra/scales
// Usage: npm run build && node tools/smoke.mjs

const noop = () => {};

function makeContext2d() {
  // Any method becomes a no-op; any property is settable/gettable.
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
const docListeners = new Map();

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
  addEventListener: (type, fn) => docListeners.set(type, fn),
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

// ------------------------------------------------------------ frame driver

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

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

try {
  await import("../dist/game/main.js");
  const T = globalThis.__poaTest;
  if (!T) throw new Error("main.js did not expose the __poaTest hook");
  const { player, entities, combat, gameState, spawn, classes } = T;

  const teleport = (e, x, y) => {
    e.x = x;
    e.y = y;
    e.resetInterpolation();
  };

  // ---- boot ---------------------------------------------------------------
  frames(5);
  ok(player.stats.health === 40 && player.stats.madra === 30, "player boots with full stats");
  const beasts = entities.all.filter((e) => e instanceof classes.Dreadbeast);
  ok(beasts.length === 7, `7 dreadbeasts spawned (got ${beasts.length})`);
  ok(
    beasts.filter((e) => e instanceof classes.Slitherer).length === 3 &&
      beasts.filter((e) => e instanceof classes.MadBoar).length === 3 &&
      beasts.filter((e) => e instanceof classes.HollowStalker).length === 1,
    "roster: 3 slitherers, 3 boars, 1 stalker",
  );
  // No beast spawned inside a wall.
  ok(
    beasts.every((b) => !T.map.isSolidAtWorld(b.x, b.y)),
    "all enemy spawn points are walkable",
  );

  // ---- kill a slitherer with J strikes -------------------------------------
  // Stage it away from other beasts so the duel is deterministic.
  const arena = { x: 18 * 16 + 8, y: 22 * 16 + 8 }; // open path, mid-south
  teleport(player, arena.x, arena.y);
  const slith = beasts.find((e) => e instanceof classes.Slitherer);
  const hp0 = slith.stats.health;
  const scales0 = gameState.scales;
  // Face right (tap D briefly).
  keyDown("KeyD");
  frames(2);
  keyUp("KeyD");
  frames(2);

  let presses = 0;
  while (slith.stats.health > 0 && presses < 12) {
    teleport(slith, player.x + 12, player.y); // keep it in arc despite knockback
    player.hitstun = 0; // its bites would otherwise eat scripted presses
    keyDown("KeyJ");
    frames(2);
    keyUp("KeyJ");
    frames(30); // swing (13) + recovery (11) + hit-pause (3) + slack
    presses++;
  }
  ok(slith.stats.health === 0, `J strikes killed the slitherer (hp ${hp0} -> 0 in ${presses} presses)`);
  ok(presses <= 4, `slitherer died in <= 4 strikes (took ${presses})`);
  frames(30); // dissolve
  ok(!entities.all.includes(slith), "dead slitherer despawned after dissolve");

  // ---- scales drop + collection --------------------------------------------
  // Some scales may land under the player and auto-collect instantly; the
  // drop count = auto-collected + pickups still on the ground.
  const pickups = entities.all.filter((e) => e instanceof classes.ScalePickup);
  const autoCollected = gameState.scales - scales0;
  const dropped = autoCollected + pickups.length;
  ok(
    dropped >= 1 && dropped <= 3,
    `slitherer dropped 1-3 scales (got ${dropped}) — dreadbeasts leave no Remnant`,
  );
  ok(
    !entities.all.some((e) => e instanceof classes.RemnantStub),
    "no Remnant stub spawned for a dreadbeast",
  );
  for (const s of pickups) {
    teleport(player, s.x, s.y);
    frames(3);
  }
  ok(
    gameState.scales === scales0 + dropped,
    `walking over scales collects them (counter ${scales0} -> ${gameState.scales})`,
  );
  ok(
    !entities.all.some((e) => e instanceof classes.ScalePickup),
    "collected scales despawned",
  );

  // ---- cycling: refills madra, slows movement, interruptible ---------------
  // Clear remaining beasts so nothing interrupts the measurement.
  for (const b of entities.all.filter((e) => e instanceof classes.Dreadbeast)) b.dead = true;
  frames(2);

  teleport(player, 19 * 16 + 8, 24 * 16 + 8); // open grass row, room to the east
  player.stats.madra = 0;
  keyDown("KeyC");
  keyDown("KeyD");
  const x0 = player.x;
  frames(30); // 0.5 s cycling while walking
  const dxCycling = player.x - x0;
  ok(player.cyclingActive === true, "holding C enters cycling");
  ok(
    player.stats.madra > 2.4 && player.stats.madra < 3.6,
    `cycling refills madra at ~20%/s (0 -> ${player.stats.madra.toFixed(2)} in 0.5s)`,
  );
  keyUp("KeyC");
  const x1 = player.x;
  frames(30); // 0.5 s walking normally
  const dxNormal = player.x - x1;
  keyUp("KeyD");
  ok(
    dxCycling > 0 && dxCycling < dxNormal * 0.5,
    `cycling slows movement to ~35% (${dxCycling.toFixed(1)}px vs ${dxNormal.toFixed(1)}px per 0.5s)`,
  );
  ok(player.cyclingActive === false, "releasing C stops cycling");
  const madraAfterCycle = player.stats.madra;
  frames(30);
  ok(
    Math.abs(player.stats.madra - madraAfterCycle) < 0.001,
    "madra does NOT regenerate without cycling",
  );

  // ---- player death + respawn ----------------------------------------------
  teleport(player, 10 * 16, 20 * 16); // die far from the spawn point
  combat.applyDamage(player, 999);
  frames(3);
  ok(player.stats.health === 0 && player.controlEnabled === false, "lethal damage starts the death sequence");
  frames(220); // fade out, respawn, fade in (~3.2s + slack)
  ok(
    Math.abs(player.x - spawn.x) < 1 && Math.abs(player.y - spawn.y) < 1,
    "player respawned at the spawn point",
  );
  ok(player.stats.health === player.stats.maxHealth, "respawn restores full health");
  ok(player.stats.madra === player.stats.maxMadra / 2, "respawn grants half madra");
  ok(player.controlEnabled === true, "control returns after respawn");

  // ---- techniques (K = Burst of Effort) + dodge -----------------------------
  const madraPreCast = player.stats.madra; // 15 after respawn
  keyDown("KeyK");
  frames(2);
  keyUp("KeyK");
  ok(
    Math.abs(player.stats.madra - (madraPreCast - 9)) < 0.001,
    `Burst of Effort costs 9 madra (${madraPreCast} -> ${player.stats.madra.toFixed(1)})`,
  );
  ok(player.speedMult === 1.4 && player.damageMult === 1.4, "Burst of Effort buffs speed+damage by 40%");
  frames(200); // > 3s buff duration
  ok(player.speedMult === 1 && player.damageMult === 1, "Burst of Effort expires after 3s");

  const madraPreDodge = player.stats.madra;
  keyDown("KeyD");
  keyDown("Space");
  frames(2);
  ok(player.iframes > 0, "dodge grants i-frames");
  keyUp("Space");
  keyUp("KeyD");
  frames(20);
  ok(
    Math.abs(player.stats.madra - (madraPreDodge - 5)) < 0.001,
    `dodge costs 5 madra (${madraPreDodge.toFixed(1)} -> ${player.stats.madra.toFixed(1)})`,
  );

  // ---- v2 save schema -------------------------------------------------------
  windowListeners.get("pagehide")?.();
  const saved = storage.get("path-of-ascension.save");
  if (!saved) throw new Error("pagehide did not write a save");
  const parsed = JSON.parse(saved);
  ok(parsed.version === 2, `save is version 2 (got ${parsed.version})`);
  ok(typeof parsed.player.x === "number", "save has player position");
  const cs = parsed.systems?.combat;
  ok(
    cs && typeof cs.health === "number" && typeof cs.madra === "number" && typeof cs.scales === "number",
    "save has systems.combat { health, madra, scales }",
  );
  ok(cs.scales === gameState.scales, `saved scales match the counter (${cs.scales})`);

  console.log(failures === 0 ? "\nSmoke test passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("FAIL  smoke test:", err);
  process.exit(1);
}
