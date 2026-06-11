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

export const SAVE_VERSION = 1;

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
    player: { x: 0, y: 0, map: "testValley", facing: "down", stage: "Foundation" },
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false; // storage full / disabled
  }
}

export function load(): SaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return migrate(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
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
