// Headless smoke test: boots dist/game/main.js under a minimal DOM shim and
// drives simulated frames + key input to catch runtime errors AND verify the
// game end to end:
//   M3 - title -> character creation (Wei) through the REAL UI key path
//   M3 - Fox Fire (K) drains madra and damages a slitherer
//   M2 - player kills a slitherer with J strikes; scales drop + collect
//   M2 - cycling refills madra / slows movement; death + respawn sequence
//   M3 - Copper advancement end-to-end (cycle-to-full fills + shrine E)
//   M3 - Iron advancement: elixir offer cancel (refund), channel fail (no
//        refund), channel success (stat bump + U technique unlock)
//   M3 - spirit panel toggle; v3 save schema (character + advancement)
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

  // ---- title -> creation (the REAL key-driven UI path) ---------------------
  frames(5);
  ok(T.world === null, "boot lands on the title screen, not the world");
  ok(T.screens.state === "title", "title state active");
  tap("KeyZ"); // press any key
  ok(T.screens.state === "origin", "no save -> straight to origin choice");
  tap("ArrowDown"); // wei -> li
  tap("ArrowDown"); // li -> kazan
  tap("ArrowUp"); // back to li
  tap("ArrowUp"); // back to wei
  tap("KeyE"); // choose the Wei clan
  ok(T.screens.state === "name", "origin confirmed -> name entry");
  for (const c of ["KeyK", "KeyA", "KeyE", "KeyL"]) tap(c, 0);
  tap("Backspace", 0); // "Kael" -> "Kae"
  tap("KeyL", 0); // back to "Kael"
  tap("Enter");
  frames(3);
  ok(T.world !== null, "creation complete -> world built");

  const player = T.player;
  const entities = T.entities;
  const combat = T.combat;
  const gameState = T.gameState;
  const advancement = T.advancement;
  const spawn = T.spawn;

  ok(player.displayName === "Kael", `typed name carried in (got "${player.displayName}")`);
  ok(player.origin === "wei", "origin carried in");
  ok(
    JSON.stringify(player.pc.caster.slots) ===
      JSON.stringify(["fox-fire", "fox-dream", null, null]),
    "Wei starts with Fox Fire (K) + Fox Dream (L), U/I locked",
  );

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
  const shrines = entities.all.filter((e) => e instanceof classes.Shrine);
  ok(shrines.length === 3, `3 meditation shrines placed (got ${shrines.length})`);

  // ---- Fox Fire (K): madra drain + slitherer damage -------------------------
  const arena = { x: 18 * 16 + 8, y: 22 * 16 + 8 }; // open path, mid-south
  teleport(player, arena.x, arena.y);
  const [slithA, slithB] = beasts.filter((e) => e instanceof classes.Slitherer);
  teleport(slithA, player.x + 14, player.y);
  keyDown("KeyD");
  frames(2);
  keyUp("KeyD");
  frames(2);
  const madraPreFox = player.stats.madra;
  const slithHp0 = slithA.stats.health;
  keyDown("KeyK");
  frames(2);
  keyUp("KeyK");
  frames(10); // bolts fly
  ok(
    Math.abs(player.stats.madra - (madraPreFox - 8)) < 0.001,
    `Fox Fire costs 8 madra (${madraPreFox} -> ${player.stats.madra.toFixed(1)})`,
  );
  ok(
    slithA.stats.health < slithHp0,
    `Fox Fire bolts hurt the slitherer (${slithHp0} -> ${slithA.stats.health})`,
  );
  slithA.dead = true; // clear the singed test subject
  frames(30); // let any drops from a point-blank fox-fire kill settle...
  for (const s of entities.all.filter((e) => e instanceof classes.ScalePickup)) s.dead = true;
  frames(2); // ...and sweep them so the J-kill drop count below is clean

  // ---- kill a slitherer with J strikes -------------------------------------
  teleport(player, arena.x, arena.y);
  player.stats.madra = player.stats.maxMadra;
  const hp0 = slithB.stats.health;
  const scales0 = gameState.scales;
  let presses = 0;
  while (slithB.stats.health > 0 && presses < 12) {
    teleport(slithB, player.x + 12, player.y); // keep it in arc despite knockback
    player.hitstun = 0; // its bites would otherwise eat scripted presses
    keyDown("KeyJ");
    frames(2);
    keyUp("KeyJ");
    frames(30); // swing (13) + recovery (11) + hit-pause (3) + slack
    presses++;
  }
  ok(slithB.stats.health === 0, `J strikes killed the slitherer (hp ${hp0} -> 0 in ${presses} presses)`);
  ok(presses <= 4, `slitherer died in <= 4 strikes (took ${presses})`);
  frames(30); // dissolve
  ok(!entities.all.includes(slithB), "dead slitherer despawned after dissolve");
  ok(advancement.progress.basicHits >= presses, "basic strikes are counted (practice hook)");

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

  // ---- dodge ----------------------------------------------------------------
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

  // ---- Copper advancement: cycle-to-full x5, then meditate (E) ---------------
  const fills0 = advancement.progress.madraFills;
  while (advancement.progress.madraFills < 5) {
    player.stats.madra = player.stats.maxMadra * 0.3; // re-arm the fill latch
    frames(2);
    player.stats.madra = player.stats.maxMadra - 1;
    keyDown("KeyC");
    frames(15); // ~0.25 s cycling tops it off
    keyUp("KeyC");
    frames(2);
  }
  ok(
    advancement.progress.madraFills >= 5,
    `cycling to full is tracked (${fills0} -> ${advancement.progress.madraFills} fills)`,
  );

  const shrine = T.shrines[0];
  teleport(player, shrine.x, shrine.y + 2);
  frames(2);
  ok(advancement.prompt !== null, "standing at a shrine shows a prompt");
  ok(player.stats.stage === 0, "still Foundation before meditating");
  tap("KeyE");
  ok(player.stats.stage === 1, "shrine meditation advances to COPPER");
  ok(player.stats.maxHealth === 50, `Copper stat bump: maxHealth 50 (got ${player.stats.maxHealth})`);
  ok(player.stats.maxMadra === 41, `Copper stat bump: maxMadra 41 (got ${player.stats.maxMadra})`);
  ok(player.stats.health === player.stats.maxHealth, "stage-up refills health");
  ok(T.world.auraSight.enabled === true, "AURA SIGHT blooms on at Copper");
  ok(advancement.ceremony !== null, "Copper ceremony banner plays");

  // ---- Iron advancement -------------------------------------------------------
  // (a) cancel BEFORE the channel: full refund.
  gameState.scales = 30;
  tap("KeyE"); // buy the elixir
  ok(advancement.state === "offer" && gameState.scales === 5, "elixir purchase takes 25 scales");
  keyDown("KeyA");
  frames(4);
  keyUp("KeyA");
  frames(2);
  ok(
    advancement.state === "idle" && gameState.scales === 30,
    "stepping away before drinking refunds the 25 scales",
  );
  teleport(player, shrine.x, shrine.y + 2);
  frames(2);

  // (b) fail DURING the channel: no refund, damage stays.
  tap("KeyE"); // buy again (30 -> 5)
  tap("KeyE"); // drink: the channel begins
  ok(advancement.state === "channel", "drinking the elixir starts the refining channel");
  frames(90); // ~1.5 s of agony
  const hpMidChannel = player.stats.health;
  ok(hpMidChannel < player.stats.maxHealth, "the refining deals ticking damage");
  keyDown("KeyD");
  frames(4);
  keyUp("KeyD");
  frames(2);
  ok(advancement.state === "idle" && player.stats.stage === 1, "moving breaks the channel — still Copper");
  ok(gameState.scales === 5, "NO refund once the elixir is drunk");

  // (c) endure the full 10 seconds: IRON.
  player.stats.health = player.stats.maxHealth;
  gameState.scales = 25;
  teleport(player, shrine.x, shrine.y + 2);
  frames(2);
  tap("KeyE"); // buy (25 -> 0)
  tap("KeyE"); // drink
  ok(advancement.state === "channel", "second refining attempt begins");
  frames(660); // 11 s — outlast the 10 s channel
  ok(player.stats.stage === 2, "surviving the refining advances to IRON");
  ok(player.stats.maxHealth === 85, `Iron body: maxHealth 85 (got ${player.stats.maxHealth})`);
  ok(player.stats.attackPower === 11, `Iron body: attack 11 (got ${player.stats.attackPower})`);
  ok(player.stats.moveSpeed === 101, `Iron body: speed 101 (got ${player.stats.moveSpeed})`);
  ok(gameState.scales === 0, "the 25 scales are spent");
  ok(
    player.pc.caster.slots[2] === "white-fox-cloak",
    "Iron unlocks the Path's U technique (White Fox Cloak)",
  );

  // ---- White Fox Cloak (U) at Iron -------------------------------------------
  const madraPreCloak = player.stats.madra;
  tap("KeyU");
  ok(
    Math.abs(player.stats.madra - (madraPreCloak - 14)) < 0.001,
    `White Fox Cloak costs 14 madra (${madraPreCloak} -> ${player.stats.madra.toFixed(1)})`,
  );
  ok(player.evasionTimer > 0 && player.evasion === 0.35, "cloak grants 35% evasion");
  ok(player.speedMult === 1.3, "cloak grants +30% move speed");

  // ---- spirit panel (Tab) ------------------------------------------------------
  ok(T.world.panelOpen === false, "spirit panel starts closed");
  tap("Tab");
  ok(T.world.panelOpen === true, "Tab opens the spirit panel");
  tap("Tab");
  ok(T.world.panelOpen === false, "Tab again closes it");

  // ---- v3 save schema ----------------------------------------------------------
  windowListeners.get("pagehide")?.();
  const saved = storage.get("path-of-ascension.save");
  if (!saved) throw new Error("pagehide did not write a save");
  const parsed = JSON.parse(saved);
  ok(parsed.version === 3, `save is version 3 (got ${parsed.version})`);
  ok(typeof parsed.player.x === "number", "save has player position");
  ok(parsed.player.stage === "Iron", `save carries the stage label (got ${parsed.player.stage})`);
  const cs = parsed.systems?.combat;
  ok(
    cs && typeof cs.health === "number" && typeof cs.madra === "number" && typeof cs.scales === "number",
    "save has systems.combat { health, madra, scales }",
  );
  ok(cs.scales === gameState.scales, `saved scales match the counter (${cs.scales})`);
  const ch = parsed.systems?.character;
  ok(
    ch && ch.origin === "wei" && ch.name === "Kael",
    "save has systems.character { origin, name }",
  );
  const adv = parsed.systems?.advancement;
  ok(
    adv && adv.stage === 2 && typeof adv.madraFills === "number" &&
      typeof adv.basicHits === "number" && adv.emptyPalmLearned === false,
    "save has systems.advancement { stage, madraFills, basicHits, emptyPalmLearned }",
  );

  console.log(failures === 0 ? "\nSmoke test passed." : `\n${failures} check(s) FAILED.`);
  process.exit(failures === 0 ? 0 : 1);
} catch (err) {
  console.error("FAIL  smoke test:", err);
  process.exit(1);
}
