/**
 * Boot + game flow: canvas, input, save migrations, and the
 * title -> (creation | continue) -> world flow. The world itself (map,
 * combat, enemies, HUD, advancement…) lives in world.ts and is built only
 * once the player has chosen Continue or finished character creation.
 *
 * M3 additions: title/creation screens, the four origins + Path kits,
 * advancement (Foundation -> Copper -> Iron), shrines, aura sight, spirit
 * panel, and the v3 save schema (character + advancement buckets).
 *
 * M4a additions: the map registry (new games start on START_MAP) and the v4
 * save schema (player.map is a registry id, flags = story flags,
 * systems.story).
 *
 * M4b additions: the full Unsouled-arc story content (src/content/index.ts)
 * and the ENDING FLOW — a finale cutscene sets the numeric "ending.played"
 * flag; main persists, shows the EndingScreen card, and returns to the
 * title ("ending.acknowledged" keeps a continued save from re-showing it).
 */

import { GameLoop } from "../engine/loop.js";
import { Input } from "../engine/input.js";
import {
  clearSave,
  load,
  registerMigration,
  save,
  type SaveData,
} from "../engine/save.js";
import { registerGameTechniques } from "./techniques.js";
import { registerStoryContent } from "../content/index.js";
import { ENDINGS, endingSummary } from "../content/endings.js";
import { Screens, type ScreenResult } from "./screens.js";
import { EndingScreen } from "./endingScreen.js";
import { World, type CharacterInfo } from "./world.js";
import { Player } from "./player.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";
import { Slitherer } from "./enemies/slitherer.js";
import { MadBoar } from "./enemies/boar.js";
import { HollowStalker } from "./enemies/stalker.js";
import { ScalePickup } from "./pickups.js";
import { RemnantStub } from "./remnantStub.js";
import { Shrine } from "./shrine.js";
import { Npc } from "./npc.js";
import { MadraBolt, SlowPool, StoneWallSegment } from "./techniqueEntities.js";
import { getMap } from "./maps/registry.js";
import { PATHS, type OriginId } from "./paths.js";
import { STAGE_NAMES } from "../systems/stats.js";

// ------------------------------------------------------------------ saves

// v1 -> v2 (M2): add the combat bucket with fresh-start defaults.
registerMigration(2, (old) => ({
  ...old,
  systems: {
    ...((old.systems as Record<string, unknown> | undefined) ?? {}),
    combat: { health: 40, madra: 15, scales: 0 },
  },
}));

// v2 -> v3 (M3): an M2 save predates origins — it becomes a Wei-clan
// character at whatever stage label it carried (always Foundation in M2).
registerMigration(3, (old) => {
  const player = old.player as { stage?: string } | undefined;
  const stageLabel = player?.stage ?? "Foundation";
  const stage = Math.max(
    0,
    Object.values(STAGE_NAMES).findIndex((n) => n === stageLabel),
  );
  return {
    ...old,
    systems: {
      ...((old.systems as Record<string, unknown> | undefined) ?? {}),
      character: { origin: "wei", name: PATHS.wei.defaultName },
      advancement: { stage, madraFills: 0, basicHits: 0, emptyPalmLearned: false },
    },
  };
});

// v3 -> v4 (M4a): "testValley" was renamed valleyWilds (same layout, same
// coordinates), flags become story flags (kept as-is), and the story bucket
// appears with fresh-start defaults.
registerMigration(4, (old) => {
  const player = { ...((old.player as Record<string, unknown> | undefined) ?? {}) };
  if (typeof player.map !== "string" || !getMap(player.map)) player.map = "valleyWilds";
  return {
    ...old,
    player,
    flags: typeof old.flags === "object" && old.flags !== null ? old.flags : {},
    systems: {
      ...((old.systems as Record<string, unknown> | undefined) ?? {}),
      story: { reputation: {}, resolve: 0, knowledge: 0, questsActive: [], questsCompleted: [] },
    },
  };
});

registerGameTechniques();
registerStoryContent();

// ----------------------------------------------------------------- canvas

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("missing #game canvas");
const maybeCtx = canvas.getContext("2d");
if (!maybeCtx) throw new Error("no 2d context");
const ctx = maybeCtx;

const input = new Input(canvas);
let existing = load();

let world: World | null = null;
let screens = new Screens(input, existing !== null);
let endingScreen: EndingScreen | null = null;

function resizeCanvas(): void {
  canvas!.width = Math.floor(window.innerWidth);
  canvas!.height = Math.floor(window.innerHeight);
  ctx.imageSmoothingEnabled = false; // reset by resize, so set it here
  world?.camera.setScreenSize(canvas!.width, canvas!.height);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
canvas.focus();

// -------------------------------------------------------------- game flow

function characterFromSave(data: SaveData): CharacterInfo {
  const c = data.systems["character"] as Partial<CharacterInfo> | undefined;
  const origin: OriginId =
    c?.origin === "li" || c?.origin === "kazan" || c?.origin === "unsouled" ? c.origin : "wei";
  const name = typeof c?.name === "string" && c.name.length > 0 ? c.name : PATHS[origin].defaultName;
  return { origin, name };
}

/** Base save data carried into buildSave (null after a New Game wipe). */
let saveBase: SaveData | null = null;

function beginWorld(result: ScreenResult): void {
  if (result.kind === "continue" && existing) {
    saveBase = existing;
    world = new World({ canvas: canvas!, ctx, input, character: characterFromSave(existing), saveData: existing });
  } else if (result.kind === "new") {
    clearSave(); // New Game wipes the old journey (confirmed in the screens)
    saveBase = null;
    world = new World({
      canvas: canvas!,
      ctx,
      input,
      character: { origin: result.origin, name: result.name },
      saveData: null,
    });
  }
  resizeCanvas();
  world?.camera.snapToTarget();
}

// ------------------------------------------------------------------- save

function persist(): void {
  if (!world) return; // never overwrite a save from the title/creation flow
  const data = world.buildSave(saveBase);
  saveBase = data; // subsequent saves extend what we just wrote
  save(data);
}
window.addEventListener("pagehide", persist);
setInterval(persist, 10_000);

// ---------------------------------------------------------------- endings

/**
 * M4b: a finale cutscene sets the numeric "ending.played" flag (1..3).
 * Once it (and any dialogue) has fully played out, tear the world down,
 * show the ending card, and return to the title. "ending.acknowledged"
 * keeps a continued post-ending save from re-triggering the card.
 */
function maybeBeginEnding(): void {
  if (!world || endingScreen) return;
  const n = world.story.getFlag("ending.played");
  if (typeof n !== "number" || n <= 0) return;
  if (world.cutscene || world.dialogueUi.active) return; // let the finale finish
  if (world.story.flagTruthy("ending.acknowledged")) return;
  world.story.setFlag("ending.acknowledged");
  persist();
  const def = ENDINGS.find((e) => e.n === n) ?? ENDINGS[0]!;
  endingScreen = new EndingScreen(input, {
    title: def.title,
    epilogue: def.epilogue,
    summary: endingSummary(world.story),
  });
  world = null;
}

// ------------------------------------------------------------------- loop

const loop = new GameLoop({
  update(dt: number): void {
    if (endingScreen) {
      endingScreen.update(dt);
      if (endingScreen.done) {
        endingScreen = null;
        existing = load(); // the post-ending save backs Continue
        saveBase = existing;
        screens = new Screens(input, existing !== null);
      }
    } else if (world) {
      world.update(dt);
      maybeBeginEnding();
    } else {
      screens.update(dt);
      if (screens.result) beginWorld(screens.result);
    }
    input.endFrame();
  },

  render(alpha: number): void {
    if (endingScreen) endingScreen.draw(ctx, canvas!.width, canvas!.height);
    else if (world) world.render(alpha);
    else screens.draw(ctx, canvas!.width, canvas!.height);
  },
});

loop.start();

// ------------------------------------------------------------- test hook
// Exposed for the headless harnesses (tools/smoke*.mjs); not a game API.
// World-dependent fields are getters because the world only exists after
// the title/creation flow completes.
(globalThis as unknown as Record<string, unknown>)["__poaTest"] = {
  get screens() {
    return screens;
  },
  get endingScreen() {
    return endingScreen;
  },
  input,
  get world() {
    return world;
  },
  get player() {
    return world?.player;
  },
  get entities() {
    return world?.entities;
  },
  get combat() {
    return world?.combat;
  },
  get fx() {
    return world?.fx;
  },
  get map() {
    return world?.map;
  },
  get gameState() {
    return world?.gameState;
  },
  get advancement() {
    return world?.advancement;
  },
  get shrines() {
    return world?.shrines;
  },
  get npcs() {
    return world?.npcs;
  },
  get story() {
    return world?.story;
  },
  get dialogueUi() {
    return world?.dialogueUi;
  },
  get cutscene() {
    return world?.cutscene;
  },
  /** Current map's spawn point (the active respawn spot). */
  get spawn() {
    return world?.spawn;
  },
  /** Instant map swap for the harnesses (no fade). */
  warp(mapId: string, entry?: string) {
    world?.debugWarp(mapId, entry);
  },
  classes: {
    ScalePickup,
    Dreadbeast,
    Slitherer,
    MadBoar,
    HollowStalker,
    RemnantStub,
    Shrine,
    Npc,
    Player,
    MadraBolt,
    SlowPool,
    StoneWallSegment,
  },
};
