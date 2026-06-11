/**
 * ENDINGS — the finale of the Unsouled arc. The "Leave the Valley" quest
 * funnels every route to the Wei village gate, where Kelsa demands the
 * choice out loud. Each ending = a finale cutscene + an ending screen
 * (title, epilogue, axes/choice summary) drawn by src/game/endingScreen.ts;
 * main.ts watches the numeric "ending.played" flag (1..3).
 *
 *  E1 "THE ROAD TO THE WILDS" (canon): leave with Yerin — requires her
 *     trust (a3.fleeingWithYerin) AND the accepted marble.
 *  E2 "THE VALLEY'S SHIELD": stay and defend — requires having rejected the
 *     heavens' warning OR the family-first route (toldFamily); a final wave
 *     at the gate, then Gold by giveStage ("the valley remembers").
 *  E3 "ALONE ON THE PATH": leave alone — the road when Yerin is rival or
 *     betrayed; bleaker epilogue.
 */

import { registerQuest, type StoryState } from "../systems/story.js";
import { registerDialogue } from "../systems/dialogue.js";
import { registerCutscene } from "../systems/cutscene.js";
import { Stage } from "../systems/stats.js";
import { addMapEnemies, addMapNpcs } from "../game/maps/registry.js";

export function registerEndings(): void {
  // ------------------------------------------------------------- quests

  registerQuest({
    id: "leave-the-valley",
    title: "Leave the Valley",
    description:
      "Exile, oath-bearer, or shield — the mountain is behind you and the valley can't hold all of what you've become. Your family is at the gate. Choose your road out loud.",
    objectives: [
      { id: "gate", text: "Return to the Wei village gate", flag: "a3.reachedGate" },
      { id: "choose", text: "Choose your road", flag: "ending.chosen" },
    ],
  });

  registerQuest({
    id: "the-valleys-shield",
    title: "The Valley's Shield",
    description:
      "You chose the gate. Now hold it: the wilds are emptying themselves at the village wall, driven mad and west by something vast turning over in its sleep.",
    objectives: [
      { id: "w1", text: "Break the dreadbeast wave (first)", flag: "e2.kill1" },
      { id: "w2", text: "Break the dreadbeast wave (second)", flag: "e2.kill2" },
      { id: "w3", text: "Break the dreadbeast wave (third)", flag: "e2.kill3" },
    ],
    reward: [{ kind: "setFlag", key: "e2.cleared" }, { kind: "cutscene", id: "ending-e2-finale" }],
  });

  // ------------------------------------------------------ the gate choice

  registerDialogue({
    id: "e-kelsa-gate",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Kelsa",
        text: "(She is at the gate before you reach it, eyes going from your face to the mountain and back.) You're alive. You look like the mountain disagreed about it.",
        effects: [{ kind: "setFlag", key: "a3.reachedGate" }],
        branches: [
          { when: [{ kind: "flag", key: "ending.chosen" }], next: "chosen" },
          { when: [{ kind: "flag", key: "a1.suriel.toldFamily" }], next: "toldEcho" },
          { when: [{ kind: "flag", key: "a1.duel.sabotage" }], next: "sabEcho" },
        ],
        next: "roads",
      },
      {
        id: "toldEcho",
        speaker: "Kelsa",
        text: "Half the village still tells your sky story as a joke. (quietly) I stopped laughing around the time the mountain turned hostile. So. Tell me what happens now.",
        next: "roads",
      },
      {
        id: "sabEcho",
        speaker: "Kelsa",
        text: "Amon never did find out what was in his cup at the festival. I did. (She holds your eyes, not unkindly.) Choose better now than you chose then. Tell me what happens.",
        next: "roads",
      },
      {
        id: "roads",
        speaker: "Kelsa",
        text: "Whatever you choose — choose it out loud. I'm not guessing for the family.",
        choices: [
          {
            label: "I'm leaving with Yerin. The heavens asked; I'm answering.",
            conditions: [
              { kind: "flag", key: "a3.fleeingWithYerin" },
              { kind: "flag", key: "item.surielsMarble" },
            ],
            effects: [{ kind: "setFlag", key: "ending.chosen" }, { kind: "cutscene", id: "ending-e1" }],
          },
          {
            label: "I stay. When the storm comes, it finds me at this gate.",
            conditions: [{ kind: "flag", key: "a1.suriel.rejected" }],
            effects: [{ kind: "setFlag", key: "ending.chosen" }, { kind: "cutscene", id: "ending-e2-wave" }],
          },
          {
            label: "I stay. When the storm comes, it finds me at this gate.",
            conditions: [{ kind: "flag", key: "a1.suriel.toldFamily" }],
            effects: [{ kind: "setFlag", key: "ending.chosen" }, { kind: "cutscene", id: "ending-e2-wave" }],
          },
          {
            label: "I'm leaving. Alone. The road wants one set of feet.",
            conditions: [{ kind: "flag", key: "a3.fleeingWithYerin", truthy: false }],
            effects: [{ kind: "setFlag", key: "ending.chosen" }, { kind: "cutscene", id: "ending-e3" }],
          },
          { label: "...Give me a breath first." },
        ],
      },
      {
        id: "chosen",
        speaker: "Kelsa",
        text: "It's chosen. Walk your road — and come back stronger than the thing that's coming.",
      },
    ],
  });

  registerDialogue({
    id: "e-yerin-gate",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Yerin",
        text: "Valley air's thicker down here. Like soup made of rules. — Whenever you're ready, we walk. Or you stay, and I take up farming, and that kills us both inside a season.",
      },
    ],
  });

  // ------------------------------------------------------------ cutscenes

  registerCutscene("ending-e1", [
    {
      kind: "say",
      speaker: "Yerin",
      text: "Contrary till the end. Good. The world out there eats polite people first.",
    },
    {
      kind: "say",
      speaker: "Kelsa",
      text: "(She grips your wrist, hard — a drill instructor's blessing.) Eat. Train. Come back stronger than the thing that's coming.",
    },
    { kind: "fadeOut", seconds: 1.0 },
    {
      kind: "say",
      speaker: "",
      text: "You walk out of Sacred Valley with a stolen fortune, a sworn friend, and a deadline only you believe in.",
    },
    { kind: "setFlag", key: "ending.played", value: 1 },
  ]);

  registerCutscene("ending-e2-wave", [
    { kind: "say", speaker: "Kelsa", text: "Then we hold it together. I'll get father's spear." },
    { kind: "setFlag", key: "e2.defense" },
    { kind: "fadeOut", seconds: 0.5 },
    { kind: "moveMap", map: "weiVillage", entry: "fromWilds" },
    { kind: "wait", seconds: 0.9 },
    { kind: "fadeIn", seconds: 0.4 },
    { kind: "shake", intensity: 3, seconds: 1.0 },
    {
      kind: "say",
      speaker: "",
      text: "Dusk. The wilds empty themselves at the village gate — dreadbeasts driven mad and west by something vast turning over in its sleep. The gate is yours to hold.",
    },
    { kind: "effect", effect: { kind: "startQuest", quest: "the-valleys-shield" } },
  ]);

  registerCutscene("ending-e2-finale", [
    { kind: "shake", intensity: 2, seconds: 0.8 },
    {
      kind: "say",
      speaker: "",
      text: "Silence, finally — torn banners, scale-light, your own blood loud in your ears. The villagers come out from behind the walls and look at you the way the valley looks at mountains.",
    },
    { kind: "giveStage", stage: Stage.Gold, title: "GOLD", sub: "The valley remembers." },
    {
      kind: "say",
      speaker: "",
      text: "No school sanctions it. No clan dares argue it. Whatever the heavens wanted of you, you chose the gate — and the gate held.",
    },
    { kind: "setFlag", key: "ending.played", value: 2 },
  ]);

  registerCutscene("ending-e3", [
    {
      kind: "say",
      speaker: "Kelsa",
      text: "(She doesn't argue. That's the worst part.) Then eat something first. The road doesn't care. I do.",
    },
    { kind: "fadeOut", seconds: 1.0 },
    {
      kind: "say",
      speaker: "",
      text: "You leave before the lanterns are lit — alone, the valley's doubt at your back and the wide world's indifference ahead. The road does not look back either.",
    },
    { kind: "setFlag", key: "ending.played", value: 3 },
  ]);

  // ------------------------------------------------------------- the maps

  addMapNpcs("weiVillage", [
    {
      id: "e-kelsa-gate",
      name: "Kelsa",
      tx: 20,
      ty: 30,
      sprite: { hair: "#4a3119", robe: "#7a9e6a", trim: "#e0c9a8", skin: "#d9a87e" },
      facing: "right",
      dialogueId: "e-kelsa-gate",
      ifFlag: "a3.escapedPeak",
    },
    {
      id: "e-yerin-gate",
      name: "Yerin",
      tx: 24,
      ty: 30,
      sprite: { hair: "#15131c", robe: "#d8d4cc", trim: "#a83a3a", skin: "#e0b490" },
      facing: "left",
      dialogueId: "e-yerin-gate",
      ifFlag: "a3.fleeingWithYerin",
    },
  ]);

  // The E2 wave at the gate (reused enemy spawns; e2.cleared retires them).
  addMapEnemies("weiVillage", [
    {
      kind: "boar",
      tx: 20,
      ty: 29,
      ifFlag: "e2.defense",
      unlessFlag: "e2.cleared",
      onDeathFlag: "e2.kill1",
      name: "Maddened boar",
    },
    {
      kind: "stalker",
      tx: 22,
      ty: 28,
      ifFlag: "e2.defense",
      unlessFlag: "e2.cleared",
      onDeathFlag: "e2.kill2",
      name: "Hollow stalker",
    },
    {
      kind: "slitherer",
      tx: 24,
      ty: 29,
      ifFlag: "e2.defense",
      unlessFlag: "e2.cleared",
      onDeathFlag: "e2.kill3",
      name: "Mad slitherer",
    },
  ]);
}

// ----------------------------------------------------------- ending cards

export interface EndingDef {
  /** Matches the numeric value of the "ending.played" flag. */
  n: number;
  title: string;
  epilogue: string[];
}

export const ENDINGS: EndingDef[] = [
  {
    n: 1,
    title: "THE ROAD TO THE WILDS",
    epilogue: [
      "Exiles, oath-bound, carrying a stolen fortune and a doomsday only two people believe in — you and Yerin cross out of Sacred Valley as the suppression of the old land falls away behind you like a held breath released.",
      "Far above, two Judges watch a corrupted world devour another. The heavens have larger problems than one valley. For now, so do you: get strong enough, fast enough — and come back before the Titan does.",
    ],
  },
  {
    n: 2,
    title: "THE VALLEY'S SHIELD",
    epilogue: [
      "You stay. Gold, in a valley that calls Gold a heresy — the clans whisper, the schools fume, and every child in Wei territory walks a little taller past the gate you held.",
      "The heavens wanted you on the road. You chose the wall instead. When the Wandering Titan comes, decades from now, Sacred Valley will not be unwarned — it will be defended.",
    ],
  },
  {
    n: 3,
    title: "ALONE ON THE PATH",
    epilogue: [
      "No partner, no oath, no one to argue with the silence. You cross the valley rim with stolen treasures and a warning nobody shared, and the wide world does not notice one more set of footprints.",
      "Somewhere behind you, a sword-disciple buries her master alone. Somewhere ahead, the Titan turns over in its sleep. The Path is long, and you have chosen to walk every step of it yourself.",
    ],
  },
];

/** "How you walked" — the axes/choice summary the ending screen prints. */
export function endingSummary(story: StoryState): string[] {
  const f = (k: string): boolean => story.flagTruthy(k);
  const duel = f("a1.duel.trick")
    ? "rigged with halfsilver"
    : f("a1.duel.honest")
      ? "fought honestly"
      : f("a1.duel.sabotage")
        ? "settled with a poisoned cup"
        : f("a1.duel.refused")
          ? "refused outright"
          : "left unsettled";
  const warning = f("a1.suriel.accepted")
    ? "accepted, marble in hand"
    : f("a1.suriel.rejected")
      ? "rejected to the messenger's face"
      : f("a1.suriel.toldFamily")
        ? "carried home to a family that didn't believe"
        : "unanswered";
  const yerin = f("a2.betrayedYerin")
    ? "sold to Heaven's Glory"
    : f("a2.yerin.trusted")
      ? "oath-sworn ally"
      : f("a2.yerin.rival")
        ? "kept at sword's length"
        : "never truly met";
  return [
    `The exhibition match — ${duel}`,
    `The heavens' warning — ${warning}`,
    `The Sword Sage's disciple — ${yerin}`,
    `Resolve ${story.resolve} · Knowledge ${story.knowledge}`,
    `Reputation — Wei ${story.reputation["wei"] ?? 0} · Heaven's Glory ${story.reputation["heavensGlory"] ?? 0}`,
  ];
}
