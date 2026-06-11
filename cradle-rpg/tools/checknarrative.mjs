// NARRATIVE REGISTRY INTEGRITY (M4b), runnable in plain node — static
// analysis of the WHOLE story content registry (src/content/*):
//   1. every dialogueId referenced by an NPC resolves to a registered tree
//   2. every dialogue node's next / branch / choice target exists; every
//      tree's start node exists; trees stay small (<= 12 nodes, per the
//      authoring craft bar) and every node is reachable from start
//   3. every Effect anywhere (dialogue nodes/choices, cutscene steps, quest
//      rewards) references registered quests/cutscenes/valid maps+entries
//   4. every quest objective flag is SET somewhere: a setFlag effect, a
//      giveItem ("item.<id>"), a completeObjective, an enemy spawn's
//      onDeathFlag — or the documented game-event ALLOWLIST below
//   5. every cutscene walk/face/despawn entity ref is "player", an NPC
//      placed on some map, or an entity spawned earlier in the same scene
//   6. the three endings are REACHABLE: a fixpoint walk over the static
//      choice graph proves at least one path sets ending.played = 1, 2, 3
// Usage: npm run build && node tools/checknarrative.mjs

import { allMaps } from "../dist/game/maps/registry.js";
import { registerStoryContent } from "../dist/content/index.js";
import { ENDINGS } from "../dist/content/endings.js";
import { allDialogues, getDialogue } from "../dist/systems/dialogue.js";
import { getCutscene, allCutsceneIds } from "../dist/systems/cutscene.js";
import { allQuests, getQuest } from "../dist/systems/story.js";

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures++;
};

registerStoryContent();

// Flags set by GAME CODE, not content data — keep documented + minimal:
const GAME_EVENT_FLAGS = [
  // World.onStageUp sets reached.<stage> on every advancement stage-up
  // (the "Temper Your Body" quest watches reached.iron).
  "reached.copper",
  "reached.iron",
  "reached.jade",
  "reached.gold",
];

const maps = allMaps();
const dialogues = allDialogues();
const quests = allQuests();
const cutsceneIds = allCutsceneIds();

// --------------------------------------------- 1. NPC dialogue wiring

for (const m of maps) {
  for (const n of m.npcs) {
    if (n.dialogueId) {
      ok(getDialogue(n.dialogueId) !== undefined, `${m.id}/${n.id}: dialogue "${n.dialogueId}" registered`);
    }
  }
}

// --------------------------------------------- 2. dialogue graph integrity

for (const tree of dialogues) {
  const ids = new Set(tree.nodes.map((n) => n.id));
  ok(ids.has(tree.start), `dialogue ${tree.id}: start node "${tree.start}" exists`);
  ok(tree.nodes.length <= 12, `dialogue ${tree.id}: stays small (${tree.nodes.length}/12 nodes)`);
  let targetsOk = true;
  for (const n of tree.nodes) {
    const targets = [
      ...(n.next ? [n.next] : []),
      ...(n.branches ?? []).map((b) => b.next),
      ...(n.choices ?? []).flatMap((c) => (c.next ? [c.next] : [])),
    ];
    for (const t of targets) {
      if (!ids.has(t)) {
        targetsOk = false;
        ok(false, `dialogue ${tree.id}: node "${n.id}" targets missing "${t}"`);
      }
    }
  }
  if (targetsOk) ok(true, `dialogue ${tree.id}: all next/branch/choice targets exist`);

  // Reachability from start (no orphaned nodes).
  const seen = new Set([tree.start]);
  const queue = [tree.start];
  while (queue.length) {
    const nodeId = queue.pop();
    const n = tree.nodes.find((x) => x.id === nodeId);
    if (!n) continue;
    for (const t of [
      ...(n.next ? [n.next] : []),
      ...(n.branches ?? []).map((b) => b.next),
      ...(n.choices ?? []).flatMap((c) => (c.next ? [c.next] : [])),
    ]) {
      if (!seen.has(t)) {
        seen.add(t);
        queue.push(t);
      }
    }
  }
  ok(seen.size === tree.nodes.length, `dialogue ${tree.id}: every node reachable from start (${seen.size}/${tree.nodes.length})`);
}

// --------------------------------------------- collect every effect source

/** [sourceLabel, effect][] across the whole registry. */
const allEffects = [];
for (const tree of dialogues) {
  for (const n of tree.nodes) {
    for (const e of n.effects ?? []) allEffects.push([`dialogue ${tree.id}/${n.id}`, e]);
    for (const c of n.choices ?? []) {
      for (const e of c.effects ?? []) allEffects.push([`dialogue ${tree.id}/${n.id} choice "${c.label}"`, e]);
    }
  }
}
for (const id of cutsceneIds) {
  for (const s of getCutscene(id)) {
    if (s.kind === "effect") allEffects.push([`cutscene ${id}`, s.effect]);
    if (s.kind === "setFlag") allEffects.push([`cutscene ${id}`, { kind: "setFlag", key: s.key, value: s.value }]);
    if (s.kind === "giveStage") allEffects.push([`cutscene ${id}`, { kind: "giveStage", stage: s.stage }]);
    if (s.kind === "moveMap") allEffects.push([`cutscene ${id}`, { kind: "moveMap", map: s.map, entry: s.entry }]);
  }
}
for (const q of quests) {
  for (const e of q.reward ?? []) allEffects.push([`quest ${q.id} reward`, e]);
}

// --------------------------------------------- 3. effect reference checks

let effectRefsOk = 0;
for (const [src, e] of allEffects) {
  switch (e.kind) {
    case "startQuest":
      if (getQuest(e.quest)) effectRefsOk++;
      else ok(false, `${src}: startQuest -> unknown quest "${e.quest}"`);
      break;
    case "completeObjective": {
      const q = getQuest(e.quest);
      const obj = q?.objectives.find((o) => o.id === e.objective);
      if (obj) effectRefsOk++;
      else ok(false, `${src}: completeObjective -> unknown "${e.quest}/${e.objective}"`);
      break;
    }
    case "cutscene":
      if (getCutscene(e.id)) effectRefsOk++;
      else ok(false, `${src}: cutscene -> unknown "${e.id}"`);
      break;
    case "moveMap": {
      const m = maps.find((x) => x.id === e.map);
      const entryOk = m && (e.entry === undefined || e.entry === "" || m.entries[e.entry]);
      if (entryOk) effectRefsOk++;
      else ok(false, `${src}: moveMap -> unknown "${e.map}"/"${e.entry}"`);
      break;
    }
    case "giveStage":
      if (e.stage >= 0 && e.stage <= 4) effectRefsOk++;
      else ok(false, `${src}: giveStage -> invalid stage ${e.stage}`);
      break;
    default:
      break;
  }
}
ok(true, `every quest/cutscene/map/stage effect reference resolves (${effectRefsOk} checked)`);

// onEnter wiring counts as effect references too.
for (const m of maps) {
  for (const oe of m.onEnter ?? []) {
    ok(getCutscene(oe.cutscene) !== undefined, `${m.id}: onEnter cutscene "${oe.cutscene}" registered`);
  }
}

// --------------------------------------------- 4. objective flag coverage

const settableFlags = new Set(GAME_EVENT_FLAGS);
for (const [, e] of allEffects) {
  if (e.kind === "setFlag") settableFlags.add(e.key);
  if (e.kind === "giveItem") settableFlags.add(`item.${e.item}`);
  if (e.kind === "completeObjective") {
    const obj = getQuest(e.quest)?.objectives.find((o) => o.id === e.objective);
    if (obj) settableFlags.add(obj.flag);
  }
}
for (const m of maps) {
  for (const s of m.enemies) {
    if (s.onDeathFlag) settableFlags.add(s.onDeathFlag); // World.combat.onDeath
  }
}
for (const q of quests) {
  for (const o of q.objectives) {
    ok(settableFlags.has(o.flag), `quest ${q.id}: objective flag "${o.flag}" is set somewhere`);
  }
}

// --------------------------------------------- 5. cutscene entity refs

const npcIds = new Set(maps.flatMap((m) => m.npcs.map((n) => n.id)));
for (const id of cutsceneIds) {
  const spawned = new Set();
  let refsOk = true;
  for (const s of getCutscene(id)) {
    if (s.kind === "spawn") spawned.add(s.entity);
    if (s.kind === "walk" || s.kind === "face" || s.kind === "despawn") {
      const known = s.entity === "player" || npcIds.has(s.entity) || spawned.has(s.entity);
      if (!known) {
        refsOk = false;
        ok(false, `cutscene ${id}: unknown entity ref "${s.entity}"`);
      }
    }
  }
  if (refsOk) ok(true, `cutscene ${id}: entity refs are player/NPCs/scene-spawns`);
}

// --------------------------------------------- 6. ending reachability walk
//
// A fixpoint walk over DECLARED flag effects. A condition list is treated as
// satisfiable when every positive flag requirement names a flag we have
// already proven settable (negated flag checks, origin, stageGte and
// scalesGte are treated as satisfiable — origin is a creation choice, stage
// and scales are open-ended play). Sources of effects become "available"
// when their own gates are satisfiable:
//   - autoStart quests; quests started by an available startQuest effect
//     complete when all their objective flags are settable -> rewards run
//   - NPC dialogues (gated by the NPC's ifFlag), node-by-node from start,
//     branch/choice conditions checked against proven flags
//   - cutscenes referenced by available effects or satisfiable onEnter defs
//   - enemy onDeathFlags whose spawn ifFlag is settable
// Iterates until stable, recording flag VALUES (setFlag value, default true).

const proven = new Map(); // key -> Set of values (true or numbers)
const prove = (key, value = true) => {
  if (!proven.has(key)) proven.set(key, new Set());
  const before = proven.get(key).size;
  proven.get(key).add(value === undefined ? true : value);
  return proven.get(key).size !== before;
};
for (const f of GAME_EVENT_FLAGS) prove(f);

const condOk = (conds) =>
  (conds ?? []).every((c) => {
    if (c.kind !== "flag") return true; // origin/stageGte/scalesGte: satisfiable
    if (c.truthy === false) return true; // negations: order-of-play, assume ok
    const vals = proven.get(c.key);
    if (!vals || vals.size === 0) return false;
    if (c.gte !== undefined) return [...vals].some((v) => typeof v === "number" && v >= c.gte);
    if (c.equals !== undefined) return vals.has(c.equals);
    return true;
  });

const availableCutscenes = new Set();
const startedQuests = new Set(quests.filter((q) => q.autoStart).map((q) => q.id));

function applyEffect(e) {
  let changed = false;
  if (e.kind === "setFlag") changed = prove(e.key, e.value ?? true) || changed;
  if (e.kind === "giveItem") changed = prove(`item.${e.item}`) || changed;
  if (e.kind === "completeObjective") {
    const obj = getQuest(e.quest)?.objectives.find((o) => o.id === e.objective);
    if (obj) changed = prove(obj.flag) || changed;
  }
  if (e.kind === "knowledge" && e.amount > 0) changed = prove("axis.knowledge", 99) || changed;
  if (e.kind === "resolve" && e.amount > 0) changed = prove("axis.resolve", 99) || changed;
  if (e.kind === "reputation" && e.amount > 0) changed = prove(`axis.rep.${e.faction}`, 99) || changed;
  if (e.kind === "startQuest" && !startedQuests.has(e.quest)) {
    startedQuests.add(e.quest);
    changed = true;
  }
  if (e.kind === "cutscene" && !availableCutscenes.has(e.id)) {
    availableCutscenes.add(e.id);
    changed = true;
  }
  return changed;
}

for (let pass = 0; pass < 50; pass++) {
  let changed = false;

  // Map data: onEnter cutscenes + enemy death flags.
  for (const m of maps) {
    for (const oe of m.onEnter ?? []) {
      if (condOk(oe.when) && !availableCutscenes.has(oe.cutscene)) {
        availableCutscenes.add(oe.cutscene);
        changed = true;
      }
    }
    for (const s of m.enemies) {
      if (s.onDeathFlag && (!s.ifFlag || condOk([{ kind: "flag", key: s.ifFlag }]))) {
        changed = applyEffect({ kind: "setFlag", key: s.onDeathFlag }) || changed;
      }
    }
  }

  // NPC dialogues, node-by-node.
  for (const m of maps) {
    for (const npc of m.npcs) {
      if (!npc.dialogueId) continue;
      if (npc.ifFlag && !condOk([{ kind: "flag", key: npc.ifFlag }])) continue;
      const tree = getDialogue(npc.dialogueId);
      if (!tree) continue;
      const reach = new Set([tree.start]);
      const queue = [tree.start];
      while (queue.length) {
        const nodeId = queue.pop();
        const n = tree.nodes.find((x) => x.id === nodeId);
        if (!n) continue;
        for (const e of n.effects ?? []) changed = applyEffect(e) || changed;
        const push = (t) => {
          if (t && !reach.has(t)) {
            reach.add(t);
            queue.push(t);
          }
        };
        push(n.next);
        for (const b of n.branches ?? []) if (condOk(b.when)) push(b.next);
        for (const c of n.choices ?? []) {
          if (!condOk(c.conditions)) continue;
          for (const e of c.effects ?? []) changed = applyEffect(e) || changed;
          push(c.next);
        }
      }
    }
  }

  // Available cutscenes run their steps.
  for (const id of [...availableCutscenes]) {
    for (const s of getCutscene(id) ?? []) {
      if (s.kind === "effect") changed = applyEffect(s.effect) || changed;
      if (s.kind === "setFlag") changed = applyEffect({ kind: "setFlag", key: s.key, value: s.value }) || changed;
    }
  }

  // Started quests whose objectives are all settable pay their rewards.
  for (const qid of [...startedQuests]) {
    const q = getQuest(qid);
    if (!q) continue;
    if (q.objectives.every((o) => proven.has(o.flag))) {
      for (const e of q.reward ?? []) changed = applyEffect(e) || changed;
    }
  }

  if (!changed) break;
}

const endingVals = proven.get("ending.played") ?? new Set();
ok(endingVals.has(1), 'ending E1 "The Road to the Wilds" is reachable (ending.played = 1)');
ok(endingVals.has(2), 'ending E2 "The Valley\'s Shield" is reachable (ending.played = 2)');
ok(endingVals.has(3), 'ending E3 "Alone on the Path" is reachable (ending.played = 3)');

// The ending cards cover exactly the three reachable values.
ok(
  [1, 2, 3].every((n) => ENDINGS.some((e) => e.n === n && e.title.length > 0 && e.epilogue.length > 0)),
  "ENDINGS data carries a titled, epilogued card for endings 1..3",
);

// Every act's anchor quests exist.
for (const id of [
  "the-seven-year-festival",
  "the-exhibition-match",
  "the-swordsages-disciple",
  "blood-on-the-snow",
  "temper-the-body",
  "the-mountains-hospitality",
  "flight-from-the-peak",
  "leave-the-valley",
  "the-valleys-shield",
]) {
  ok(getQuest(id) !== undefined && startedQuests.has(id), `quest "${id}" registered AND startable on some path`);
}

console.log(
  failures === 0 ? "\nAll narrative-registry checks passed." : `\n${failures} check(s) FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
