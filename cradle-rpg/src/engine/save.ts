/**
 * Versioned JSON save/load on localStorage, with export/import strings.
 *
 * Extension pattern for systems/content agents:
 *  1. Add your state under a new optional field of SaveData (or inside
 *     `systems` / `flags` if it's small).
 *  2. Bump SAVE_VERSION.
 *  3. Register a migration that upgrades version N-1 data to version N.
 * Old saves then load cleanly forever.
 */

const STORAGE_KEY = "path-of-ascension.save";

/**
 * v1: M1 — player position/facing only.
 * v2: M2 — systems.combat = { health, madra, scales } (migration lives in
 *     src/game/main.ts, since the defaults are game knowledge).
 * v3: M3 — systems.character = { origin, name } and systems.advancement =
 *     { stage, madraFills, basicHits, emptyPalmLearned } (migration in
 *     src/game/main.ts; an M2 save becomes a Wei-clan character).
 * v4: M4a — player.map is a map-registry id (the renamed "testValley"
 *     becomes "valleyWilds"), flags carries story flags, and systems.story =
 *     StorySave { reputation, resolve, knowledge, questsActive,
 *     questsCompleted } (migration in src/game/main.ts).
 * v5: M5 — systems.audio = { volume, muted } and systems.soulsmith =
 *     { purchased: string[] } (migration in src/game/main.ts; Remnant cores
 *     live in flags as a number — "item.remnantCore" — and need no bump).
 */
export const SAVE_VERSION = 5;

// ------------------------------------------------------------- save slots
//
// M5: three save slots, selected on the title screen. Slot 1 keeps the
// historical unsuffixed key, so every pre-M5 save automatically becomes
// slot 1; slots 2-3 append a ".slotN" suffix. All save/load/clear calls
// operate on the ACTIVE slot.

export const SLOT_COUNT = 3;

let activeSlot = 1;

/** The localStorage key backing a slot (slot 1 = the legacy key). */
export function storageKeyFor(slot: number): string {
  return slot <= 1 ? STORAGE_KEY : `${STORAGE_KEY}.slot${slot}`;
}

export function setActiveSlot(slot: number): void {
  activeSlot = Math.min(SLOT_COUNT, Math.max(1, Math.round(slot)));
}

export function getActiveSlot(): number {
  return activeSlot;
}

/** Load+migrate a slot WITHOUT changing the active slot (title picker). */
export function peekSlot(slot: number): SaveData | null {
  return loadKey(storageKeyFor(slot));
}

export interface SaveData {
  version: number;
  /** ISO timestamp of when the save was written. */
  savedAt: string;
  player: {
    x: number;
    y: number;
    map: string;
    facing: "up" | "down" | "left" | "right";
    /** Advancement stage label; M3 will formalize this. */
    stage: string;
  };
  /** Story/quest flags (content agent). */
  flags: Record<string, boolean | number | string>;
  /** Per-system state buckets (combat, advancement, inventory, …). */
  systems: Record<string, unknown>;
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    player: { x: 0, y: 0, map: "", facing: "down", stage: "Foundation" },
    flags: {},
    systems: {},
  };
}

/** version N-1 data in, version N data out. */
type Migration = (old: Record<string, unknown>) => Record<string, unknown>;
const migrations = new Map<number, Migration>();

/** Register an upgrade step producing data of `toVersion`. */
export function registerMigration(toVersion: number, fn: Migration): void {
  migrations.set(toVersion, fn);
}

function migrate(raw: Record<string, unknown>): SaveData | null {
  let version = typeof raw.version === "number" ? raw.version : 0;
  let data = raw;
  while (version < SAVE_VERSION) {
    const step = migrations.get(version + 1);
    if (!step) return null; // unbridgeable gap: treat as no save
    data = step(data);
    version++;
    data.version = version;
  }
  return data as unknown as SaveData;
}

export function save(data: SaveData): boolean {
  try {
    data.savedAt = new Date().toISOString();
    localStorage.setItem(storageKeyFor(activeSlot), JSON.stringify(data));
    return true;
  } catch {
    return false; // storage full / disabled
  }
}

function loadKey(key: string): SaveData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return migrate(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Load+migrate the ACTIVE slot. */
export function load(): SaveData | null {
  return loadKey(storageKeyFor(activeSlot));
}

/** Erase the ACTIVE slot only. */
export function clearSave(): void {
  try {
    localStorage.removeItem(storageKeyFor(activeSlot));
  } catch {
    /* ignore */
  }
}

/** Compact shareable string (base64 JSON) for manual backup. */
export function exportString(data: SaveData): string {
  const json = JSON.stringify(data);
  // btoa needs latin1; route through encodeURIComponent for full unicode.
  return btoa(unescape(encodeURIComponent(json)));
}

/** Parse a string produced by exportString. Returns null if invalid. */
export function importString(text: string): SaveData | null {
  try {
    const json = decodeURIComponent(escape(atob(text.trim())));
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return migrate(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}
