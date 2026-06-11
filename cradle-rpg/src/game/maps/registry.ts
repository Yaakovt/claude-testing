/**
 * MAP REGISTRY (M4a) — the multi-map world as data.
 *
 * Every map is a MapEntry: how to build its Tilemap, where the player
 * spawns/respawns, named entry points, transition trigger zones (tile
 * rects that fade out, swap maps, and place the player at the linked
 * entry), and the map's content (enemy spawns, shrine spots, NPCs).
 *
 * Per-map vs persistent state:
 *  - enemies/NPCs/shrines are PER-MAP and rebuilt on every entry (enemies
 *    respawn on re-entry — by design);
 *  - story flags/quests NEVER reset (src/systems/story.ts) and the save
 *    records current map + position.
 *
 * Content agents (M4b): author people and entry hooks with addMapNpcs() and
 * setMapOnEnter() from src/content/* — don't edit the map modules for that.
 */

import type { TilemapData } from "../../engine/tilemap.js";
import type { Facing } from "../../engine/entity.js";
import type { EnemySpawn } from "../enemies/spawns.js";
import type { NpcDef } from "../npc.js";

export interface TransitionDef {
  /** Trigger zone in tile coordinates (player center entering it fires). */
  zone: { tx: number; ty: number; w: number; h: number };
  /** Destination map id. */
  to: string;
  /** Named entry on the destination map. */
  entry: string;
}

export interface MapEntry {
  id: string;
  /** Display name ("the Valley Wilds") for arrival captions / journal. */
  name: string;
  build(): TilemapData;
  /** Default spawn AND respawn point (world px). */
  spawn: { x: number; y: number };
  /** Named arrival points for transitions/effects (world px). */
  entries: Record<string, { x: number; y: number; facing?: Facing }>;
  transitions: TransitionDef[];
  enemies: EnemySpawn[];
  shrines: { tx: number; ty: number }[];
  npcs: NpcDef[];
  /** Story flag marking this zone hostile (story-controlled; HUD shows it). */
  hostileFlag?: string;
  /** Cutscene to play on entry, once (guarded by the flag). */
  onEnter?: { cutscene: string; onceFlag: string };
  /** Samara's Ring on the horizon: draw the white glow band (the peak). */
  ringGlow?: boolean;
}

/** New characters start here. */
export const START_MAP = "weiVillage";

const maps = new Map<string, MapEntry>();

export function registerMap(entry: MapEntry): void {
  maps.set(entry.id, entry);
}

export function getMap(id: string): MapEntry | undefined {
  return maps.get(id);
}

export function allMaps(): MapEntry[] {
  return [...maps.values()];
}

/** Content hook: add NPCs to a map without editing the map module. */
export function addMapNpcs(mapId: string, defs: NpcDef[]): void {
  const entry = maps.get(mapId);
  if (!entry) throw new Error(`addMapNpcs: unknown map "${mapId}"`);
  entry.npcs.push(...defs);
}

/** Content hook: attach/replace a map's on-enter cutscene. */
export function setMapOnEnter(
  mapId: string,
  onEnter: { cutscene: string; onceFlag: string } | undefined,
): void {
  const entry = maps.get(mapId);
  if (!entry) throw new Error(`setMapOnEnter: unknown map "${mapId}"`);
  entry.onEnter = onEnter;
}

// ----------------------------------------------------- the world's maps
// (registered at module load; map modules import only the MapEntry type,
// so there is no import cycle)

import { WEI_VILLAGE } from "./weiVillage.js";
import { VALLEY_WILDS } from "./valleyWilds.js";
import { SAMARA_TRAIL } from "./samaraTrail.js";
import { HEAVENS_GLORY } from "./heavensGlory.js";

registerMap(WEI_VILLAGE);
registerMap(VALLEY_WILDS);
registerMap(SAMARA_TRAIL);
registerMap(HEAVENS_GLORY);
