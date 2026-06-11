/**
 * STORY CONTENT REGISTRY (M4b) — the full book-1 (Unsouled) arc as DATA.
 * Replaces the M4a seed. Everything here uses only the public authoring
 * surface (registerQuest / registerDialogue / registerCutscene + the map
 * content hooks addMapNpcs / addMapEnemies / addMapEntries / addMapOnEnter).
 *
 *   act1.ts     THE FESTIVAL — family, the exhibition duel (4 branches),
 *               Li Markuth's descent, Suriel's warning (3 answers)
 *   act2.ts     THE DISCIPLE — Yerin's three stances, the hunt, story-gated
 *               Jade (giveStage behind stageGte Iron)
 *   act3.ts     HEAVEN'S GLORY — hospitality, the turn, the theft, the flight
 *   endings.ts  the gate choice + the three endings (E1/E2/E3) + ending cards
 *   soulsmith.ts M5 — Fisher Gesha's crafting stall in the valley wilds
 *               (Remnant cores + scales -> three once-per-save upgrades)
 *
 * Static integrity of the whole registry is enforced by
 * tools/checknarrative.mjs (graph targets, effect refs, objective-flag
 * coverage, cutscene entity refs, and ending reachability).
 */

import { registerAct1 } from "./act1.js";
import { registerAct2 } from "./act2.js";
import { registerAct3 } from "./act3.js";
import { registerEndings } from "./endings.js";
import { registerSoulsmith } from "./soulsmith.js";

/** Call once at boot (main.ts), after the map registry has loaded. */
export function registerStoryContent(): void {
  registerAct1();
  registerAct2();
  registerAct3();
  registerEndings();
  registerSoulsmith();
}
