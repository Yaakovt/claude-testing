/**
 * The four character origins and their Paths — pure DATA on top of the
 * technique registry. Canon notes (docs/lore-bible.md):
 *  - Wei: Path of the White Fox is canon (light + dream, Elder Whisper).
 *  - Li "Path of the Sunset Lake" and Kazan "Path of the Mountain's Spine"
 *    are INVENTED FOR GAME, as labeled in the lore bible (§1.3).
 *  - Unsouled is the Lindon start: no Path, pure aspect-less madra, a core
 *    everyone calls worthless. The Empty Palm (canon — his own invention)
 *    is earned through practice after Copper.
 *
 * Slot rule of thumb: K/L are the starting kit, U seals open at Iron, I is
 * reserved for a later milestone ("—").
 */

import { Stage } from "../systems/stats.js";
import { getTechnique } from "../systems/techniques.js";
import {
  EMPTY_PALM_PRACTICE_HITS,
  type AdvancementProgress,
} from "../systems/advancement.js";

export type OriginId = "wei" | "li" | "kazan" | "unsouled";

export interface PathDef {
  origin: OriginId;
  /** "Wei clan", "Unsouled (clanless Wei)", … */
  clanLabel: string;
  pathName: string;
  /** True if the Path is an invention labeled in the lore bible. */
  invented: boolean;
  aspects: string;
  playstyle: string;
  difficulty: string;
  /** One-line creation-screen flavor. */
  lore: string;
  /** Name-entry placeholder (Unsouled = "Lindon"). */
  defaultName: string;
  /** Starting madra capacity (Unsouled runs slightly deeper — pure madra). */
  baseMaxMadra: number;
  /** Technique ids: K/L from the start, U unlocked at Iron, I reserved. */
  kit: { K: string | null; L: string | null; U: string | null; I: string | null };
}

export const PATHS: Record<OriginId, PathDef> = {
  wei: {
    origin: "wei",
    clanLabel: "Wei clan",
    pathName: "Path of the White Fox",
    invented: false,
    aspects: "light + dream madra",
    playstyle: "Trickster — daze the pack, then strike from the confusion.",
    difficulty: "a comfortable start",
    lore: "Beneath Samara's white ring, the Wei polish their pride like mirrors.",
    defaultName: "Shen",
    baseMaxMadra: 30,
    kit: { K: "fox-fire", L: "fox-dream", U: "white-fox-cloak", I: null },
  },
  li: {
    origin: "li",
    clanLabel: "Li clan",
    pathName: "Path of the Sunset Lake",
    invented: true,
    aspects: "water + light madra",
    playstyle: "Flowing counters — parry, riposte, and control the field.",
    difficulty: "technical",
    lore: "The Li remember a patriarch who ascended; they have forgiven the heavens nothing.",
    defaultName: "Mei",
    baseMaxMadra: 30,
    kit: { K: "crescent-wake", L: "still-surface", U: "evening-tide", I: null },
  },
  kazan: {
    origin: "kazan",
    clanLabel: "Kazan clan",
    pathName: "Path of the Mountain's Spine",
    invented: true,
    aspects: "earth madra",
    playstyle: "Bulwark — heavy slams and stone-forged endurance.",
    difficulty: "sturdy and slow",
    lore: "Stone-handed and blunt, the Kazan mine what the mountains are willing to give.",
    defaultName: "Roka",
    baseMaxMadra: 30,
    kit: { K: "spine-breaker", L: "stone-mantle", U: "ridgeline", I: null },
  },
  unsouled: {
    origin: "unsouled",
    clanLabel: "Unsouled (clanless Wei)",
    pathName: "no Path — pure madra",
    invented: false,
    aspects: "pure, aspect-less madra",
    playstyle: "Nothing but pure madra and stubbornness. Earn everything.",
    difficulty: "the hardest road",
    lore: "No Path. No techniques. A wooden badge that reads \"empty\" — and everything to prove.",
    defaultName: "Lindon",
    baseMaxMadra: 36,
    // The Empty Palm + Burst of Effort crystallize together at Copper after
    // 30 landed strikes (slotsFor gates these on emptyPalmLearned).
    kit: { K: "empty-palm", L: "burst-of-effort", U: null, I: null },
  },
};

/** Creation-screen order; Unsouled last — the hardest road. */
export const ORIGIN_ORDER: readonly OriginId[] = ["wei", "li", "kazan", "unsouled"];

/**
 * Compute the K/L/U/I slot assignment for an origin at a given stage.
 *
 * Unsouled note: the U slot is reserved for the TWIN-CORE system — a future
 * milestone where the Unsouled's split core lets them keep techniques other
 * Paths cannot. TODO(M-future): twin-core hook lands here.
 */
export function slotsFor(
  origin: OriginId,
  stage: Stage,
  progress: AdvancementProgress,
): (string | null)[] {
  const kit = PATHS[origin].kit;
  if (origin === "unsouled") {
    if (!progress.emptyPalmLearned) return [null, null, null, null];
    return [kit.K, kit.L, null, null];
  }
  return [kit.K, kit.L, stage >= Stage.Iron ? kit.U : null, null];
}

export interface SlotInfo {
  key: "K" | "L" | "U" | "I";
  /** Technique name, or a locked-slot label. */
  label: string;
  locked: boolean;
  /** Why it's locked / when it opens. */
  note?: string;
}

/** Spirit-panel rows: techniques known, with locked slots shown. */
export function kitInfo(
  origin: OriginId,
  stage: Stage,
  progress: AdvancementProgress,
): SlotInfo[] {
  const kit = PATHS[origin].kit;
  const name = (id: string | null): string =>
    id ? (getTechnique(id)?.name ?? id) : "—";

  if (origin === "unsouled") {
    const learned = progress.emptyPalmLearned;
    const hits = Math.min(progress.basicHits, EMPTY_PALM_PRACTICE_HITS);
    const practiceNote =
      stage < Stage.Copper
        ? "reach Copper, then practice"
        : `practice: ${hits}/${EMPTY_PALM_PRACTICE_HITS} strikes landed`;
    return [
      { key: "K", label: learned ? name(kit.K) : "???", locked: !learned, note: learned ? undefined : practiceNote },
      { key: "L", label: learned ? name(kit.L) : "???", locked: !learned, note: learned ? undefined : "follows the Empty Palm" },
      { key: "U", label: "—", locked: true, note: "a second core, someday" },
      { key: "I", label: "—", locked: true, note: "a later road" },
    ];
  }

  const ironOpen = stage >= Stage.Iron;
  return [
    { key: "K", label: name(kit.K), locked: false },
    { key: "L", label: name(kit.L), locked: false },
    { key: "U", label: name(kit.U), locked: !ironOpen, note: ironOpen ? undefined : "sealed until Iron" },
    { key: "I", label: "—", locked: true, note: "a later road" },
  ];
}
