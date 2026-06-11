/**
 * M5 — THE SOULSMITH: Fisher Gesha, a traveling Soulsmith with a drudge
 * and a folding stall, camped on the wilds road. CANON character (lore
 * §6.2 names her as book-1's Soulsmith teacher); // INVENTED placement —
 * canon meets her outside the valley, the game borrows her early so
 * Soulsmithing has a face.
 *
 * The crafting menu is plain dialogue: choices are condition-gated on the
 * counted core flag ("item.remnantCore" gte), scalesGte, and the
 * once-per-save "smith.<id>" flags; effects are takeScales/takeItem plus
 * the M5 "upgrade" effect World executes (src/game/world.ts applies the
 * stats and mirrors the smith flag). Costs/labels derive from
 * SOULSMITH_UPGRADES so the dialogue can never drift from the math.
 */

import { registerDialogue, type DialogueChoice } from "../systems/dialogue.js";
import { addMapNpcs } from "../game/maps/registry.js";
import { SOULSMITH_UPGRADES, upgradeFlag } from "../game/soulsmith.js";

/** One crafting choice per upgrade, generated from the data. */
function craftChoice(id: string): DialogueChoice {
  const u = SOULSMITH_UPGRADES[id]!;
  const cores = `${u.coreCost} core${u.coreCost > 1 ? "s" : ""}`;
  return {
    label: `${u.name} (${u.blurb}) — ${cores} + ${u.scaleCost} scales`,
    conditions: [
      { kind: "flag", key: upgradeFlag(id), truthy: false }, // once per save
      { kind: "flag", key: "item.remnantCore", gte: u.coreCost },
      { kind: "scalesGte", amount: u.scaleCost },
    ],
    effects: [
      { kind: "takeScales", amount: u.scaleCost },
      { kind: "takeItem", item: "remnantCore", count: u.coreCost },
      { kind: "upgrade", id },
    ],
    next: "crafted",
  };
}

export function registerSoulsmith(): void {
  registerDialogue({
    id: "m5-soulsmith",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Fisher Gesha",
        text: "(A round old woman behind a folding stall of jars and bindings; a many-armed drudge construct sorts Remnant parts at her elbow.) Hm! A customer with working legs. Rarer than you'd think out here.",
        branches: [{ when: [{ kind: "flag", key: "m5.metGesha" }], next: "menu" }],
        next: "intro",
      },
      {
        id: "intro",
        speaker: "Fisher Gesha",
        text: "Soulsmith, dear — I take Remnants apart and put the useful organs into things. Bring me Remnant CORES and a fistful of scales, and my drudge and I will hammer the spirit's memory into your gear. Permanently.",
        effects: [{ kind: "setFlag", key: "m5.metGesha" }, { kind: "knowledge", amount: 1 }],
        next: "menu",
      },
      {
        id: "menu",
        speaker: "Fisher Gesha",
        text: "My forge is small but Remnant matter is Remnant matter. What'll it be, {playerName}?",
        choices: [
          craftChoice("forgedEdge"),
          craftChoice("boundSash"),
          craftChoice("refinedChannels"),
          { label: "Where do I find Remnant cores?", next: "cores" },
          { label: "Safe travels, honored Soulsmith." },
        ],
      },
      {
        id: "cores",
        speaker: "Fisher Gesha",
        text: "When a SACRED ARTIST dies, the spirit tears itself free — beasts of the wilds just rot, the spirit's fused in. Subdue a fresh Remnant gently and the core comes out whole; my drudge does it in its sleep. Smash one instead and you can still pick the core out of the pieces. Messier. Louder. Your choice.",
        next: "menu",
      },
      {
        id: "crafted",
        speaker: "Fisher Gesha",
        text: "(The drudge's needle-arms blur; binding-light sinks under the surface and sets.) There. Wear it well — madra remembers good work longer than people do.",
        next: "menu",
      },
    ],
  });

  // // INVENTED placement: Gesha's stall on the wilds road (canon character,
  // game-invented location — she suits a zone the player crosses all game).
  addMapNpcs("valleyWilds", [
    {
      id: "m5-soulsmith",
      name: "Fisher Gesha",
      tx: 22,
      ty: 21,
      sprite: { hair: "#c2cad8", robe: "#7a6648", trim: "#bfe3f2", skin: "#d9a87e" },
      facing: "down",
      dialogueId: "m5-soulsmith",
    },
  ]);
}
