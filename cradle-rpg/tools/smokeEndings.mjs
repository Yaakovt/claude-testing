// Headless smoke test for ACTS 2-3 + ONE ENDING, selected by
// process.env.ENDING (1|2|3) — npm run check runs all three. Act 1 is
// fast-forwarded by story flag (smoke.mjs already drives it through the
// real UI); from Yerin onward everything is the REAL runtime path:
//   E1: trust route (the hunt, the oath), Iron -> Yerin's Jade cutscene,
//       the school, the trusted TURN + theft, the flight on the cloud,
//       the gate choice -> "The Road to the Wilds"
//   E2: rejected-warning route -> "I stay" -> the gate-defense wave (3
//       real kills via onDeathFlag) -> giveStage GOLD -> "The Valley's
//       Shield"
//   E3: antagonize + betray (Verren's bribe) -> the betrayed TURN -> the
//       lone flight -> "Alone on the Path"
// Each run ends on the EndingScreen card and dismisses back to the title.
// Usage: npm run build && ENDING=1 node tools/smokeEndings.mjs
const noop = () => {};
function makeContext2d() {
  const store = {};
  return new Proxy(store, {
    get(t, p) { return p in t ? t[p] : noop; },
    set(t, p, v) { t[p] = v; return true; },
  });
}
function makeCanvas() {
  return {
    width: 0, height: 0, style: {},
    getContext: () => makeContext2d(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
    addEventListener: noop, removeEventListener: noop, focus: noop,
  };
}
const canvas = makeCanvas();
const windowListeners = new Map();
const rafCallbacks = [];
globalThis.requestAnimationFrame = (cb) => { rafCallbacks.push(cb); return rafCallbacks.length; };
globalThis.cancelAnimationFrame = noop;
globalThis.document = {
  hidden: false,
  getElementById: (id) => (id === "game" ? canvas : null),
  createElement: (tag) => (tag === "canvas" ? makeCanvas() : {}),
  addEventListener: noop, removeEventListener: noop,
};
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720,
  addEventListener: (t, f) => windowListeners.set(t, f),
  removeEventListener: noop,
};
let t = 0;
function frames(n) {
  for (let i = 0; i < n; i++) {
    t += 16.7;
    for (const cb of rafCallbacks.splice(0, rafCallbacks.length)) cb(t);
  }
}
const keyDown = (c) => windowListeners.get("keydown")?.({ code: c, repeat: false, preventDefault: noop });
const keyUp = (c) => windowListeners.get("keyup")?.({ code: c, preventDefault: noop });
const tap = (c, s = 2) => { keyDown(c); frames(2); keyUp(c); frames(s); };

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

const ENDING = Number(process.env.ENDING ?? "2");

await import("../dist/game/main.js");
const T = globalThis.__poaTest;
const drive = (max = 6000) => {
  let spent = 0;
  while (T.cutscene && spent < max) {
    if (T.dialogueUi.active) { tap("KeyE", 1); spent += 5; } else { frames(1); spent += 1; }
  }
};
const nextLine = () => { tap("KeyE"); tap("KeyE"); };
const npcById = (id) => T.npcs.find((n) => n.def.id === id);
const teleport = (e, x, y) => { e.x = x; e.y = y; e.resetInterpolation(); };
const talkTo = (npc) => { teleport(T.player, npc.x + 2, npc.y + 8); frames(2); tap("KeyE"); };

// Creation (wei).
frames(5);
tap("KeyZ");
tap("KeyE");
tap("Enter");
frames(5);
drive(); // opening
ok(T.cutscene === null, "opening done");

const story = T.story;
// Fast-forward the Act-1 outcome (covered by smoke.mjs) by flag.
for (const f of ["a1.duelChosen", "a1.duel.honest", "a1.duelWon", "a1.duelResolved", "a1.markuthSeen", "a1.surielResolved"]) story.setFlag(f);
if (ENDING === 2) story.setFlag("a1.suriel.rejected");
else {
  story.setFlag("a1.suriel.accepted");
  story.setFlag("item.surielsMarble");
}
story.startQuest("the-swordsages-disciple");

// ---- ACT 2: Yerin on the trail --------------------------------------------
T.warp("samaraTrail");
frames(3);
const yerin = npcById("a2-yerin");
ok(yerin !== undefined, "Yerin camps near the top of the trail");
talkTo(yerin);
nextLine(); // start
ok(story.flagTruthy("a2.metYerin"), "meeting Yerin sets the quest flag");
if (ENDING === 3) {
  // The dark path: antagonize, then sell her camp to Verren.
  tap("KeyE"); // skip reveal of meet (accepted route shows the heavens choice first)
  tap("ArrowDown");
  tap("ArrowDown"); // -> antagonize (3rd choice with heavens visible)
  tap("KeyE");
  nextLine(); // rivalMade
  ok(story.flagTruthy("a2.yerin.rival") && story.flagTruthy("a2.yerinResolved"), "rival stance set");
  const verren = npcById("a2-verren");
  talkTo(verren);
  nextLine(); // start -> offer
  tap("KeyE"); // skip reveal of offer
  tap("KeyE"); // agree: report Yerin
  nextLine(); // paid
  ok(story.flagTruthy("a2.betrayedYerin"), "betrayal flag set");
  ok(T.gameState.scales >= 15, `bribe paid (${T.gameState.scales} scales)`);
} else {
  // Trust route: take the hunt.
  tap("KeyE"); // skip reveal of meet/heavens node
  if (ENDING !== 2) {
    // accepted route: "The heavens sent me" is visible -> pick help below it
    tap("ArrowDown");
  }
  tap("KeyE"); // pick "I'm help — point me at something"
  nextLine(); // task
  ok(story.flagTruthy("a2.yerin.helping"), "hunt accepted");
  ok(story.questsActive.includes("blood-on-the-snow"), "hunt quest started");
  T.warp("valleyWilds");
  frames(3);
  drive(); // wilds intro (first entry)
  const den = T.entities.all.find((e) => e.displayName === "Hollow-eyed dreadbeast");
  ok(den !== undefined, "the den stalker spawned once the hunt is on");
  T.combat.applyDamage(den, 9999);
  frames(5);
  ok(story.flagTruthy("a2.denStalkerSlain"), "hunt target's death set its flag");
  T.warp("samaraTrail");
  frames(3);
  talkTo(npcById("a2-yerin"));
  nextLine(); // start -> oath
  nextLine(); // oath -> temper (not Iron yet)
  nextLine(); // temper -> end
  ok(story.flagTruthy("a2.yerin.trusted"), "Yerin oath-sworn");
  ok(story.questsActive.includes("temper-the-body"), "below Iron: shrine quest started");
  ok(T.dialogueUi.active === false, "dialogue closed");
}

// Reach Iron through the advancement flow (story-gated Jade needs it).
T.advancement.giveStage(2);
frames(5);
ok(story.flagTruthy("reached.iron"), "reached.iron game-event flag set");

// Jade from Yerin (every stance offers it once resolved + Iron).
talkTo(npcById("a2-yerin"));
nextLine(); // start -> stance idle node
nextLine(); // idle -> jadeOffer
tap("KeyE"); // skip reveal of jadeOffer
tap("KeyE"); // "Open it."
drive();
ok(T.player.stats.stage === 3, `JADE granted by cutscene (stage ${T.player.stats.stage})`);
ok(story.flagTruthy("a2.jade"), "a2.jade set");
ok(story.questsActive.includes("the-mountains-hospitality"), "Act-3 quest started");
if (ENDING !== 3) ok(story.questsCompleted.includes("temper-the-body"), "temper quest completed");
frames(5);
ok(npcById("a2-gatekeeper-a").blocking === false, "peak gatekeepers stand down at Jade");

// ---- ACT 3: the school ------------------------------------------------------
T.warp("heavensGlory");
frames(3);
drive(); // arrival
ok(story.flagTruthy("a3.enteredSchool"), "arrival scene set a3.enteredSchool");
if (ENDING !== 3) ok(npcById("a3-yerin-school") !== undefined, "Yerin is inside the school (trusted)");
talkTo(npcById("a3-rahm"));
nextLine();
nextLine(); // task
ok(story.flagTruthy("a3.rahmTask"), "Rahm's orchard task given");
talkTo(npcById("a3-ona"));
nextLine();
nextLine(); // work
ok(story.flagTruthy("a3.orchardTended"), "orchard tended");
talkTo(npcById("a3-whitehall"));
nextLine(); // start -> summons
nextLine(); // summons -> reveal
tap("KeyE"); // skip reveal of reveal node
tap("KeyE"); // top visible choice (betrayed / trusted / generic per flags)
ok(story.flagTruthy("a3.facedWhitehall"), "faced Whitehall");
drive(); // THE TURN + theft + dumped at the gate
ok(story.flagTruthy("heavensGlory.hostile"), "the school turned hostile");
ok(story.flagTruthy("item.parasiteRing") && story.flagTruthy("item.thousandMileCloud"), "the theft happened");
ok(T.npcs.length === 0, "the friendly school despawned on the hostile rebuild");
ok(
  T.entities.all.filter((e) => e.displayName === "Heaven's Glory enforcer").length === 3,
  "3 enforcers spawned via the hostile flag",
);
ok(story.questsActive.includes("flight-from-the-peak"), "flight quest started");
if (ENDING !== 3) ok(story.flagTruthy("a3.fleeingWithYerin"), "Yerin flees with you (trusted)");

// Down to the trail: the flight scene.
T.warp("samaraTrail", "fromPeak");
frames(3);
ok(T.cutscene !== null, "flight cutscene fires on the hostile trail");
drive();
ok(story.flagTruthy("a3.escapedPeak"), "escaped the peak");
ok(story.questsActive.includes("leave-the-valley"), '"Leave the Valley" started');

// ---- the gate choice --------------------------------------------------------
T.warp("weiVillage", "fromWilds");
frames(3);
const kelsa = npcById("e-kelsa-gate");
ok(kelsa !== undefined, "Kelsa waits at the gate after the escape");
if (ENDING !== 3) ok(npcById("e-yerin-gate") !== undefined, "Yerin waits at the gate too");
talkTo(kelsa);
nextLine(); // start (sets a3.reachedGate)
ok(story.flagTruthy("a3.reachedGate"), "gate objective set");
tap("KeyE"); // skip reveal of roads
tap("KeyE"); // top visible choice = the ending this run qualifies for
ok(story.flagTruthy("ending.chosen"), "road chosen");

const playerRef = T.player; // survives the world teardown for asserts
if (ENDING === 2) {
  drive(); // wave cutscene -> rebuilt gate with the wave
  ok(story.questsActive.includes("the-valleys-shield"), "wave quest started");
  const wave = T.entities.all.filter((e) => e.storyDeathFlag?.startsWith("e2.kill"));
  ok(wave.length === 3, `3 wave beasts at the gate (got ${wave.length})`);
  for (const b of wave) {
    T.combat.applyDamage(b, 9999);
    frames(5);
  }
  drive(); // the finale fires as the quest reward
  ok(playerRef.stats.stage === 4, `GOLD granted ("the valley remembers") — stage ${playerRef.stats.stage}`);
} else {
  drive();
}
frames(5);
ok(story.getFlag("ending.played") === ENDING, `ending.played === ${ENDING}`);
frames(5);
ok(T.endingScreen !== null, "the ending screen is up");
ok(T.world === null, "the world stood down for the card");
frames(80); // grace period
tap("KeyZ");
frames(5);
ok(T.endingScreen === null, "any key dismisses the card");
ok(T.screens.state === "title", "back on the title screen");
ok(storage.has("path-of-ascension.save"), "the post-ending save persists for Continue");

console.log(failures === 0 ? `\nEndings smoke (ENDING=${ENDING}) passed.` : `\n${failures} FAILED.`);
process.exit(failures === 0 ? 0 : 1);
