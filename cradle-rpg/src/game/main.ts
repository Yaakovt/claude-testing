/**
 * Boot: canvas, input, map, player, camera, loop, HUD, debug overlay,
 * and light save integration (position persists across reloads).
 */

import { GameLoop } from "../engine/loop.js";
import { Input } from "../engine/input.js";
import { Camera } from "../engine/camera.js";
import { EntityManager } from "../engine/entity.js";
import { DebugOverlay } from "../engine/debug.js";
import { overlapsSolid } from "../engine/collision.js";
import { defaultSave, load, save, type SaveData } from "../engine/save.js";
import { Player } from "./player.js";
import { createTestValley, TEST_VALLEY_SPAWN } from "./maps/testValley.js";

const PIXEL_SCALE = 3;
const MAP_ID = "testValley";

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
  return data;
}
window.addEventListener("pagehide", () => save(buildSave()));
setInterval(() => save(buildSave()), 10_000);

// -------------------------------------------------------------------- HUD

function drawHud(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Advancement stage label.
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillStyle = "rgba(10, 8, 18, 0.65)";
  ctx.fillRect(10, 10, 150, 44);
  ctx.fillStyle = "#cfc8e8";
  ctx.fillText("Foundation", 20, 28);

  // Empty madra bar frame — combat/systems agents fill this in M2/M3.
  const bx = 20, by = 36, bw = 130, bh = 10;
  ctx.strokeStyle = "#6d4f94";
  ctx.lineWidth = 2;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
  ctx.fillStyle = "rgba(109, 79, 148, 0.15)";
  ctx.fillRect(bx + 1.5, by + 1.5, bw - 2, bh - 2);
}

// ------------------------------------------------------------------- loop

const loop = new GameLoop({
  update(dt: number): void {
    if (input.pressed("debug")) debug.toggle();
    entities.update(dt);
    map.update(dt);
    camera.update(dt);
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
    debug.drawWorld(ctx, entities.all, map, camera);

    drawHud();
    debug.drawScreen(ctx, [
      `pos ${player.x.toFixed(1)}, ${player.y.toFixed(1)}`,
      `tile ${Math.floor(player.x / ts)}, ${Math.floor(player.y / ts)}`,
      `cam ${camera.x.toFixed(1)}, ${camera.y.toFixed(1)}`,
      `entities ${entities.all.length}`,
      `facing ${player.facing}`,
    ]);
  },
});

loop.start();
