// SEED — placeholder M4a narrative content proving the machinery works.
// The M4b content agent REPLACES this file with the real Sacred Valley
// story (and may add more files under src/content/). Everything here uses
// only the public authoring surface:
//   registerQuest / registerDialogue / registerCutscene
//   addMapNpcs / setMapOnEnter        (maps/registry.ts content hooks)
// See docs/ARCHITECTURE.md ("Authoring narrative content") for the how-to.

import { registerQuest } from "../systems/story.js";
import { registerDialogue } from "../systems/dialogue.js";
import { registerCutscene } from "../systems/cutscene.js";
import { addMapNpcs, setMapOnEnter } from "../game/maps/registry.js";
import { NPC_PALETTES } from "../game/npc.js";

/** Call once at boot (main.ts), after the map registry has loaded. */
export function registerSeedContent(): void {
  // SEED quest: auto-starts for fresh characters; objective flags are set by
  // the dialogue choice and the valleyWilds on-enter cutscene below.
  registerQuest({
    id: "first-steps",
    title: "First Steps",
    description: "The valley is wider than the courtyard. Show them you are ready to walk it.",
    objectives: [
      { id: "talk", text: "Speak with Auntie Mara by the family home", flag: "seed.spokeToNeighbor" },
      { id: "leave", text: "Leave the village through the south gate", flag: "seed.leftVillage" },
    ],
    reward: [
      { kind: "giveScales", amount: 3 },
      { kind: "resolve", amount: 1 },
    ],
    autoStart: true,
  });

  // SEED dialogue: 3 nodes; the choice sets seed.spokeToNeighbor (which
  // also clears Guard Han off the south gate — see his NpcDef below).
  registerDialogue({
    id: "seed-neighbor",
    start: "greet",
    nodes: [
      {
        id: "greet",
        speaker: "Auntie Mara",
        text: "{playerName}! Up with the sun, and already wearing that look. The gate guard turns back any child who hasn't been vouched for, you know.",
        next: "ask",
      },
      {
        id: "ask",
        speaker: "Auntie Mara",
        text: "So. Are you truly ready for the wilds, little artist?",
        choices: [
          {
            label: "I'm ready. The wilds don't scare me.",
            effects: [
              { kind: "setFlag", key: "seed.spokeToNeighbor" },
              { kind: "resolve", amount: 1 },
            ],
            next: "bless",
          },
          {
            label: "Honestly? No. But I'm going anyway.",
            effects: [
              { kind: "setFlag", key: "seed.spokeToNeighbor" },
              { kind: "knowledge", amount: 1 },
            ],
            next: "bless",
          },
        ],
      },
      {
        id: "bless",
        speaker: "Auntie Mara",
        text: "Hah. Either answer would do — it's the asking that matters. I'll tell old Han at the gate to stand aside. Keep your madra cycled, and stay clear of anything with too many teeth.",
      },
    ],
  });

  // SEED guard line (one node; he steps off the gate once Mara vouches).
  registerDialogue({
    id: "seed-guard",
    start: "halt",
    nodes: [
      {
        id: "halt",
        speaker: "Guard Han",
        text: "The wilds chew up untested children, {playerName}. Get a word from a sensible adult first — Mara, perhaps.",
      },
    ],
  });

  // SEED on-enter cutscene: first arrival in the Valley Wilds. Pans north
  // toward the pond/treeline, two narration lines, then marks the quest's
  // second objective done.
  registerCutscene("seed-wilds-intro", [
    { kind: "panCamera", to: { x: 27 * 16, y: 5 * 16 }, seconds: 1.4 },
    {
      kind: "say",
      speaker: "",
      text: "The Valley Wilds. Beyond the village wall the aura runs thicker — and wilder.",
    },
    {
      kind: "say",
      speaker: "",
      text: "Somewhere past the treeline, Mount Samara climbs toward its ring of white fire.",
    },
    { kind: "resetCamera", seconds: 0.8 },
    { kind: "setFlag", key: "seed.leftVillage" },
  ]);
  setMapOnEnter("valleyWilds", { cutscene: "seed-wilds-intro", onceFlag: "seed.sawWildsIntro" });

  // SEED people: the neighbor in the family courtyard + the gate guard.
  addMapNpcs("weiVillage", [
    {
      id: "seed-mara",
      name: "Auntie Mara",
      tx: 6,
      ty: 9,
      sprite: NPC_PALETTES["villagerB"]!,
      facing: "down",
      behavior: { wanderRadius: 10 },
      dialogueId: "seed-neighbor",
    },
    {
      id: "seed-han",
      name: "Guard Han",
      tx: 22,
      ty: 31,
      sprite: NPC_PALETTES["weiGuard"]!,
      facing: "up",
      dialogueId: "seed-guard",
      guard: { untilFlag: "seed.spokeToNeighbor", stepAside: { dx: -14, dy: -16 } },
    },
  ]);
}
