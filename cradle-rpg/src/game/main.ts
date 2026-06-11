/**
 * Boot: canvas, input, map, player, enemies, combat, camera, loop, HUD,
 * debug overlay, and versioned save integration.
 *
 * M2 additions: combat system wiring (hit pause, shake, fx), dreadbeast
 * spawns, scales + drops, real health/madra bars + scales counter in the
 * HUD, noticed-enemy stage label, player death/respawn sequence, and the
 * v2 save schema (health/madra/scales).
 */

import { GameLoop } from "../engine/loop.js";
import { Input } from "../engine/input.js";
import { Camera } from "../engine/camera.js";
import { EntityManager } from "../engine/entity.js";
import { DebugOverlay } from "../engine/debug.js";
import { overlapsSolid } from "../engine/collision.js";
import {
  defaultSave,
  load,
  registerMigration,
  save,
  type SaveData,
} from "../engine/save.js";
import { CombatSystem } from "../systems/combat.js";
import { FxManager } from "../systems/fx.js";
import { STAGE_NAMES } from "../systems/stats.js";
import { Player } from "./player.js";
import { registerGameTechniques } from "./techniques.js";
import { Dreadbeast } from "./enemies/dreadbeast.js";
import { Slitherer } from "./enemies/slitherer.js";
import { MadBoar } from "./enemies/boar.js";
import { HollowStalker } from "./enemies/stalker.js";
import { spawnTestValleyEnemies } from "./enemies/spawns.js";
import { ScalePickup } from "./pickups.js";
import { RemnantStub } from "./remnantStub.js";
import { createTestValley, TEST_VALLEY_SPAWN } from "./maps/testValley.js";

const PIXEL_SCALE = 3;
const MAP_ID = "testValley";

// ------------------------------------------------------------------ saves

interface CombatSave {
  health: number;
  madra: number;
  scales: number;
}

// v1 → v2: add the combat bucket with fresh-start defaults.
registerMigration(2, (old) => ({
  ...old,
  systems: {
    ...((old.systems as Record<string, unknown> | undefined) ?? {}),
    combat: { health: 40, madra: 15, scales: 0 } satisfies CombatSave,
  },
}));

registerGameTechniques();

// ----------------------------------------------------------------- canvas

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("missing #game canvas");
const maybeCtx = canvas.getContext("2d");
if (!maybeCtx) throw new Error("no 2d context");
const ctx = maybeCtx;

function resizeCanvas(): void {
  canvas!.width = Math.floor(window.innerWidth);
  canvas!.height = Math.floor(window.innerHeight);
  ctx.imageSmoothingEnabled = false; // reset by resize, so set it here
  camera.setScreenSize(canvas!.width, canvas!.height);
}

// ------------------------------------------------------------------ world

const input = new Input(canvas);
const map = createTestValley();
const camera = new Camera(PIXEL_SCALE);
camera.setBounds(map.pixelWidth, map.pixelHeight);

const entities = new EntityManager();
const debug = new DebugOverlay();
const fx = new FxManager();
const combat = new CombatSystem();
const gameState = { scales: 0 };

// Restore position from a previous session when it's still valid.
const existing = load();
let spawn = { ...TEST_VALLEY_SPAWN };
if (existing && existing.player.map === MAP_ID) {
  spawn = { x: existing.player.x, y: existing.player.y };
}
const player = entities.add(new Player(input, map, spawn.x, spawn.y));
if (overlapsSolid(player.aabb, map)) {
  // Stale/corrupt save put us inside a wall — fall back to the trailhead.
  player.x = TEST_VALLEY_SPAWN.x;
  player.y = TEST_VALLEY_SPAWN.y;
  player.resetInterpolation();
}

combat.init({ player, camera, fx });
player.wireCombat(combat, entities, fx);

// Restore combat state (health/madra/scales) from the save.
{
  const cs = existing?.systems["combat"] as Partial<CombatSave> | undefined;
  if (cs) {
    if (typeof cs.health === "number") {
      player.stats.health = Math.max(1, Math.min(player.stats.maxHealth, cs.health));
    }
    if (typeof cs.madra === "number") {
      player.stats.madra = Math.max(0, Math.min(player.stats.maxMadra, cs.madra));
    }
    if (typeof cs.scales === "number") gameState.scales = Math.max(0, cs.scales);
  }
}

// ---------------------------------------------------------------- enemies

const enemyWorld = { map, combat, player, entities };
spawnTestValleyEnemies(enemyWorld);

/** Scatter `count` scales near a death spot (never inside solid tiles). */
function dropScales(x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    let px = x + (Math.random() * 2 - 1) * 10;
    let py = y + (Math.random() * 2 - 1) * 8;
    if (overlapsSolid({ x: px - 4, y: py - 5, w: 8, h: 6 }, map)) {
      px = x;
      py = y;
    }
    entities.add(
      new ScalePickup(px, py, player, (value) => {
        gameState.scales += value;
        fx.spawnText(player.x, player.y - 26, `+${value} scale`, "#bfe3f2", 0.7);
      }),
    );
  }
}

combat.onDeath = (victim) => {
  if (victim === player) return; // respawn sequence handles the player
  if (victim instanceof Dreadbeast) {
    // Dreadbeasts leave no Remnant (lore §6.3) — render down to scales.
    dropScales(victim.x, victim.y, 1 + Math.floor(Math.random() * 3));
  } else if (victim.leavesRemnant) {
    // TODO(M5): real Remnant system — this is the stub hook.
    entities.add(new RemnantStub(victim.x, victim.y));
  }
};

// ----------------------------------------------------- death & respawn

const DEATH_FADE_IN = 1.1; // screen fades to black
const DEATH_RESPAWN_AT = 2.4; // teleport + refill
const DEATH_DONE = 3.2; // fade back in, control returns

const deathSeq = { active: false, t: 0 };

function updateDeathSequence(dt: number): void {
  if (!deathSeq.active) {
    if (player.stats.health <= 0) {
      deathSeq.active = true;
      deathSeq.t = 0;
      player.controlEnabled = false;
    }
    return;
  }
  deathSeq.t += dt;
  if (deathSeq.t >= DEATH_RESPAWN_AT && player.stats.health <= 0) {
    // Forgiving respawn: full health, half madra, nothing lost.
    player.x = TEST_VALLEY_SPAWN.x;
    player.y = TEST_VALLEY_SPAWN.y;
    player.resetInterpolation();
    player.stats.health = player.stats.maxHealth;
    player.stats.madra = player.stats.maxMadra / 2;
    player.kbVx = 0;
    player.kbVy = 0;
    player.hitstun = 0;
    player.iframes = 1.5;
    camera.snapToTarget();
  }
  if (deathSeq.t >= DEATH_DONE) {
    deathSeq.active = false;
    player.controlEnabled = true;
  }
}

/** 0..1 darkness of the death overlay. */
function deathFadeAlpha(): number {
  if (!deathSeq.active) return 0;
  if (deathSeq.t < DEATH_RESPAWN_AT) return Math.min(1, deathSeq.t / DEATH_FADE_IN);
  return Math.max(0, (DEATH_DONE - deathSeq.t) / (DEATH_DONE - DEATH_RESPAWN_AT));
}

camera.follow(player);
resizeCanvas();
camera.snapToTarget();
window.addEventListener("resize", resizeCanvas);
canvas.focus();

// ------------------------------------------------------------------- save

function buildSave(): SaveData {
  const data = existing ?? defaultSave();
  data.player.x = Math.round(player.x);
  data.player.y = Math.round(player.y);
  data.player.map = MAP_ID;
  data.player.facing = player.facing;
  data.player.stage = STAGE_NAMES[player.stats.stage];
  data.systems["combat"] = {
    health: Math.round(player.stats.health),
    madra: Math.round(player.stats.madra),
    scales: gameState.scales,
  } satisfies CombatSave;
  return data;
}
window.addEventListener("pagehide", () => save(buildSave()));
setInterval(() => save(buildSave()), 10_000);

// -------------------------------------------------------------------- HUD

function drawBar(
  x: number,
  y: number,
  w: number,
  h: number,
  frac: number,
  fill: string,
  frame: string,
): void {
  ctx.strokeStyle = frame;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = "rgba(10, 8, 18, 0.5)";
  ctx.fillRect(x + 1.5, y + 1.5, w - 2, h - 2);
  if (frac > 0) {
    ctx.fillStyle = fill;
    ctx.fillRect(x + 1.5, y + 1.5, Math.max(1, (w - 2) * Math.min(1, frac)), h - 2);
  }
}

let hudTime = 0;

function drawHud(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Panel: stage label, health bar, madra bar, scales counter.
  ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
  ctx.fillRect(10, 10, 170, 84);
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillStyle = "#cfc8e8";
  ctx.fillText(STAGE_NAMES[player.stats.stage], 20, 28);

  // Health.
  drawBar(20, 36, 130, 10, player.stats.health / player.stats.maxHealth, "#b8434e", "#8a4a52");

  // Madra — pulses while cycling.
  const cycling = player.cyclingActive;
  const pulse = cycling ? 0.65 + 0.35 * Math.sin(hudTime * 8) : 1;
  const madraFill = cycling
    ? `rgba(138, 108, 192, ${pulse})`
    : "rgba(138, 108, 192, 0.9)";
  drawBar(20, 50, 130, 10, player.stats.madra / player.stats.maxMadra, madraFill, "#6d4f94");

  // Scales: a small diamond glyph + count.
  ctx.save();
  ctx.translate(26, 74);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#bfe3f2";
  ctx.fillRect(-4, -4, 8, 8);
  ctx.restore();
  ctx.font = "bold 13px Georgia, serif";
  ctx.fillStyle = "#bfe3f2";
  ctx.fillText(`${gameState.scales}`, 38, 79);
  ctx.fillStyle = "#8d97a8";
  ctx.font = "11px Georgia, serif";
  ctx.fillText("scales", 60, 79);

  // Noticed enemy: stage label of whatever the player last traded blows with.
  if (combat.noticedLabel) {
    ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
    ctx.fillRect(10, 100, 170, 22);
    ctx.font = "italic 12px Georgia, serif";
    ctx.fillStyle = "#e0c9a8";
    ctx.fillText(combat.noticedLabel, 20, 115);
  }

  // Death overlay: fade + message.
  const fade = deathFadeAlpha();
  if (fade > 0) {
    ctx.fillStyle = `rgba(5, 4, 10, ${fade * 0.92})`;
    ctx.fillRect(0, 0, canvas!.width, canvas!.height);
    if (deathSeq.t > 0.7 && deathSeq.t < DEATH_RESPAWN_AT + 0.4) {
      ctx.font = "italic 22px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(207, 200, 232, ${Math.min(1, fade * 1.2)})`;
      ctx.fillText("Your spirit fades...", canvas!.width / 2, canvas!.height / 2);
      ctx.textAlign = "left";
    }
  }
}

// ------------------------------------------------------------------- loop

const loop = new GameLoop({
  update(dt: number): void {
    if (input.pressed("debug")) debug.toggle();

    // Hit pause: freeze the world for a few frames on player hits.
    if (combat.hitPauseFrames > 0) {
      combat.hitPauseFrames--;
      camera.update(dt);
      input.endFrame();
      return;
    }

    combat.update(dt);
    entities.update(dt);
    fx.update(dt);
    updateDeathSequence(dt);
    map.update(dt);
    camera.update(dt);
    hudTime += dt;
    input.endFrame();
  },

  render(alpha: number): void {
    debug.tickFrame();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(0, 0, canvas!.width, canvas!.height);

    camera.applyTransform(ctx);
    // Pad the view rect by a tile so edge tiles/sprites never pop.
    const ts = map.tileSize;
    const vx = camera.left - ts;
    const vy = camera.top - ts;
    const vw = camera.viewW + ts * 2;
    const vh = camera.viewH + ts * 2;

    map.drawGround(ctx, vx, vy, vw, vh);
    entities.drawSorted(ctx, alpha, map.getSortedDecor(vx, vy, vw, vh));
    fx.drawWorld(ctx);
    debug.drawWorld(ctx, entities.all, map, camera);

    drawHud();
    debug.drawScreen(ctx, [
      `pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
      `tile ${Math.floor(player.x / ts)}, ${Math.floor(player.y / ts)}`,
      `cam ${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}`,
      `entities ${entities.all.length}`,
      `facing ${player.facing}`,
      `hp ${player.stats.health.toFixed(0)}/${player.stats.maxHealth} madra ${player.stats.madra.toFixed(1)}/${player.stats.maxMadra}`,
      `scales ${gameState.scales}  cycling ${player.cyclingActive}`,
    ]);
  },
});

loop.start();

// ------------------------------------------------------------- test hook
// Exposed for the headless harness (tools/smoke.mjs); not a game API.
(globalThis as unknown as Record<string, unknown>)["__poaTest"] = {
  player,
  entities,
  combat,
  fx,
  map,
  gameState,
  spawn: TEST_VALLEY_SPAWN,
  classes: { ScalePickup, Dreadbeast, Slitherer, MadBoar, HollowStalker, RemnantStub },
};
