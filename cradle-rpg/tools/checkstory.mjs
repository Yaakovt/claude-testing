// NARRATIVE SYSTEMS unit tests (M4a), runnable in plain node — story.ts,
// dialogue.ts, and cutscene.ts are pure (no DOM, no canvas):
//   - {placeholder} substitution
//   - Condition vocabulary (flag truthy/equals/gte, stageGte, origin, scales)
//   - Effect dispatch through a handler
//   - DialogueRunner: node entry effects (once), conditional choice
//     visibility, choice effects + branching, branch fallback to next, end
//   - StoryState quests: start/auto-start, flag-driven objective completion,
//     auto-complete + callbacks, serialize/restore round trip
//   - CutscenePlayer against a mock host: step ordering, walk polling, say
//     waiting on confirm, wait timing, fades, sugar kinds -> runEffect
// Usage: npm run build && node tools/checkstory.mjs

import {
  StoryState,
  checkCondition,
  checkConditions,
  runEffects,
  registerQuest,
  clearQuestRegistry,
} from "../dist/systems/story.js";
import {
  DialogueRunner,
  registerDialogue,
  getDialogue,
  clearDialogueRegistry,
  substitute,
} from "../dist/systems/dialogue.js";
import {
  CutscenePlayer,
  registerCutscene,
  getCutscene,
  clearCutsceneRegistry,
} from "../dist/systems/cutscene.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

// ------------------------------------------------------------ substitution

ok(substitute("Hello {playerName} of the {clanName}.", { playerName: "Kael", clanName: "Wei clan" })
  === "Hello Kael of the Wei clan.", "substitution replaces known keys");
ok(substitute("The {unknown} stays.", { playerName: "Kael" }) === "The {unknown} stays.",
  "unknown placeholders are left intact");

// -------------------------------------------------------------- conditions

const story = new StoryState();
story.setFlag("met.elder");
story.setFlag("kills", 3);
const query = {
  getFlag: (k) => story.getFlag(k),
  stage: 2,
  origin: "wei",
  scales: 10,
};

ok(checkCondition({ kind: "flag", key: "met.elder" }, query), "flag truthy check passes");
ok(!checkCondition({ kind: "flag", key: "never.set" }, query), "unset flag is falsy");
ok(checkCondition({ kind: "flag", key: "never.set", truthy: false }, query), "negated flag check");
ok(checkCondition({ kind: "flag", key: "kills", gte: 3 }, query), "numeric flag gte passes at 3");
ok(!checkCondition({ kind: "flag", key: "kills", gte: 4 }, query), "numeric flag gte fails at 4");
ok(checkCondition({ kind: "flag", key: "kills", equals: 3 }, query), "flag equals exact value");
ok(checkCondition({ kind: "stageGte", stage: 2 }, query), "stageGte passes at equal stage");
ok(!checkCondition({ kind: "stageGte", stage: 3 }, query), "stageGte fails above");
ok(checkCondition({ kind: "origin", origin: "wei" }, query), "origin matches");
ok(checkCondition({ kind: "origin", origin: "li", not: true }, query), "origin not-check");
ok(checkCondition({ kind: "scalesGte", amount: 10 }, query), "scalesGte at boundary");
ok(!checkCondition({ kind: "scalesGte", amount: 11 }, query), "scalesGte fails over");
ok(checkConditions(undefined, query) && checkConditions([], query), "empty condition lists pass");
ok(checkConditions([{ kind: "origin", origin: "wei" }, { kind: "stageGte", stage: 1 }], query),
  "checkConditions ANDs its list");

// ----------------------------------------------------------------- effects

{
  const log = [];
  runEffects(
    [{ kind: "setFlag", key: "a" }, { kind: "giveScales", amount: 5 }],
    (e) => log.push(e.kind),
  );
  ok(log.join(",") === "setFlag,giveScales", "runEffects dispatches in order");
  runEffects(undefined, () => log.push("x"));
  ok(log.length === 2, "runEffects tolerates undefined");
}

// ---------------------------------------------------------- dialogue runner

clearDialogueRegistry();
registerDialogue({
  id: "t-tree",
  start: "a",
  nodes: [
    {
      id: "a",
      speaker: "Elder",
      text: "Welcome, {playerName}.",
      effects: [{ kind: "setFlag", key: "t.greeted" }],
      next: "b",
    },
    {
      id: "b",
      speaker: "Elder",
      text: "Choose.",
      choices: [
        { label: "Polite", effects: [{ kind: "resolve", amount: 1 }], next: "c" },
        { label: "Secret door", conditions: [{ kind: "flag", key: "t.secret" }], next: "d" },
        { label: "Leave" },
      ],
    },
    {
      id: "c",
      speaker: "Elder",
      text: "Hmm.",
      branches: [{ when: [{ kind: "flag", key: "t.branch" }], next: "d" }],
      next: "e",
    },
    { id: "d", speaker: "Elder", text: "The secret room." },
    { id: "e", speaker: "Elder", text: "The plain road." },
  ],
});
ok(getDialogue("t-tree") !== undefined, "dialogue registers and resolves by id");

function makeRunner(s) {
  const effects = [];
  const q = { getFlag: (k) => s.getFlag(k), stage: 0, origin: "wei", scales: 0 };
  const runner = new DialogueRunner(getDialogue("t-tree"), {
    vars: { playerName: "Kael" },
    query: q,
    effects: (e) => {
      effects.push(e);
      if (e.kind === "setFlag") s.setFlag(e.key, e.value ?? true);
    },
  });
  return { runner, effects };
}

{
  const s = new StoryState();
  const { runner, effects } = makeRunner(s);
  ok(runner.view().text === "Welcome, Kael.", "node text is substituted");
  ok(runner.view().speaker === "Elder", "speaker carried through");
  ok(effects.length === 1 && s.flagTruthy("t.greeted"), "node-entry effects ran once");
  ok(!runner.hasChoices, "linear node has no choices");
  runner.advance();
  ok(runner.hasChoices, "choice node exposes choices");
  ok(runner.view().choices.length === 2, "condition-failing choice is hidden");
  runner.advance(0); // Polite -> c
  ok(effects.some((e) => e.kind === "resolve"), "choice effects run on pick");
  runner.advance(); // c: branch flag unset -> e
  ok(runner.view().text === "The plain road.", "branch falls back to next when unset");
  runner.advance();
  ok(runner.active === false, "tree ends after the last node");
}
{
  const s = new StoryState();
  s.setFlag("t.secret");
  s.setFlag("t.branch");
  const { runner } = makeRunner(s);
  runner.advance(); // -> b
  ok(runner.view().choices.length === 3, "condition-passing choice is visible");
  runner.advance(0); // Polite -> c
  runner.advance(); // branch flag set -> d
  ok(runner.view().text === "The secret room.", "conditional branch takes priority over next");
}
{
  const s = new StoryState();
  const { runner } = makeRunner(s);
  runner.advance(); // -> b
  runner.advance(1); // "Leave" (no next)
  ok(runner.active === false, "a choice without next ends the dialogue");
}

// ------------------------------------------------------------------ quests

clearQuestRegistry();
registerQuest({
  id: "t-quest",
  title: "Test Quest",
  description: "d",
  objectives: [
    { id: "one", text: "Do one", flag: "t.one" },
    { id: "two", text: "Do two", flag: "t.two" },
  ],
  reward: [{ kind: "giveScales", amount: 2 }],
});

{
  const s = new StoryState();
  let started = null;
  let completed = null;
  s.onQuestStart = (def) => (started = def.id);
  s.onQuestComplete = (def) => (completed = def.id);

  ok(s.startQuest("t-quest") === true, "startQuest accepts a registered quest");
  ok(started === "t-quest", "onQuestStart fires");
  ok(s.startQuest("t-quest") === false, "starting twice is rejected");
  ok(s.startQuest("nope") === false, "unknown quest is rejected");

  let st = s.questStatus("t-quest");
  ok(st.current === 0 && !st.objectives[0].done, "first objective is current");
  s.setFlag("t.one");
  st = s.questStatus("t-quest");
  ok(st.objectives[0].done && st.current === 1, "flag completes objective; journal advances");
  ok(completed === null, "quest not complete with objectives left");
  s.setFlag("t.two");
  ok(completed === "t-quest", "setting the last flag completes the quest");
  ok(s.questsActive.length === 0 && s.questsCompleted.includes("t-quest"),
    "completed quest moves to the completed list");

  // Round trip.
  const saved = s.serialize();
  const s2 = new StoryState();
  s2.restore({ "t.one": true, "t.two": true, count: 4 }, saved);
  ok(s2.flagTruthy("t.one") && s2.getFlag("count") === 4, "restore brings flags back");
  ok(s2.questsCompleted.includes("t-quest"), "restore brings quest lists back");
  ok(s2.serialize().questsCompleted.length === 1, "serialize/restore round trips");
}

// autoStart.
{
  const s = new StoryState();
  registerQuest({
    id: "t-auto", title: "Auto", description: "d", autoStart: true,
    objectives: [{ id: "x", text: "x", flag: "t.auto.x" }],
  });
  s.startAutoQuests();
  ok(s.questsActive.includes("t-auto") && !s.questsActive.includes("t-quest"),
    "startAutoQuests starts only autoStart quests");
}

// -------------------------------------------------------------- cutscenes

clearCutsceneRegistry();
registerCutscene("t-scene", [
  { kind: "face", entity: "npc", facing: "left" },
  { kind: "walk", entity: "npc", to: { x: 10, y: 0 }, speed: 5 },
  { kind: "say", speaker: "Elder", text: "Stop." },
  { kind: "fadeOut", seconds: 0.2 },
  { kind: "wait", seconds: 0.1 },
  { kind: "effect", effect: { kind: "giveScales", amount: 1 } },
  { kind: "setFlag", key: "t.scene.done" },
  { kind: "giveStage", stage: 3 },
  { kind: "moveMap", map: "elsewhere", entry: "gate" },
  { kind: "fadeIn", seconds: 0.2 },
]);
ok(getCutscene("t-scene")?.length === 10, "cutscene registers by id");

{
  const log = [];
  let npcX = 0;
  let sayConfirmed = false;
  const host = {
    walkEntity: (id, to, speed, dt) => {
      npcX = Math.min(to.x, npcX + speed * dt);
      if (npcX >= to.x) {
        log.push(`walked:${id}`);
        return true;
      }
      return false;
    },
    faceEntity: (id, f) => log.push(`face:${id}:${f}`),
    say: (sp, tx) => log.push(`say:${sp}:${tx}`),
    sayDone: () => sayConfirmed,
    fade: (dir, s) => log.push(`fade:${dir}:${s}`),
    shake: () => log.push("shake"),
    spawn: () => log.push("spawn"),
    despawn: () => log.push("despawn"),
    panCamera: () => log.push("pan"),
    resetCamera: () => log.push("resetCam"),
    runEffect: (e) => log.push(`effect:${e.kind}${e.kind === "moveMap" ? ":" + e.map + ":" + e.entry : ""}${e.kind === "giveStage" ? ":" + e.stage : ""}`),
  };

  let done = false;
  const player = new CutscenePlayer(getCutscene("t-scene"), host, () => (done = true));
  ok(log[0] === "face:npc:left", "instant face step runs immediately");
  ok(player.active && !log.includes("walked:npc"), "walk step waits for arrival");

  // Walk: 10px at 5px/s = 2s. Tick at 0.5s.
  for (let i = 0; i < 5 && !log.includes("walked:npc"); i++) player.update(0.5);
  ok(log.includes("walked:npc"), "walk polls the host until it arrives");
  ok(log.some((l) => l.startsWith("say:Elder:Stop")), "say presented after the walk");
  player.update(0.5);
  ok(!log.some((l) => l.startsWith("fade")), "say holds the scene until confirmed");
  sayConfirmed = true;
  player.update(0.016); // confirm noticed -> fadeOut begins
  ok(log.some((l) => l === "fade:out:0.2"), "fadeOut starts after the say confirm");
  player.update(0.25); // fadeOut elapses
  player.update(0.12); // wait elapses -> the four instant steps chain + fadeIn
  const tail = log.slice(log.indexOf("fade:out:0.2") + 1);
  ok(
    tail.join("|") === "effect:giveScales|effect:setFlag|effect:giveStage:3|effect:moveMap:elsewhere:gate|fade:in:0.2",
    `instant effects + sugar kinds chain in order (got ${tail.join("|")})`,
  );
  ok(player.active && !done, "fadeIn still timing");
  player.update(0.25);
  ok(!player.active && done, "cutscene finishes and onDone fires once");
}

console.log(failures === 0 ? "\nAll story checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
