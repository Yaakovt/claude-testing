/**
 * The spirit panel (Tab): name, origin/Path, stage, the K/L/U/I technique
 * slots (locked slots shown with why), and progress toward the next stage.
 * Pure drawing — world.ts owns the toggle and feeds it data.
 */

import { STAGE_NAMES, type Stage } from "../systems/stats.js";
import type { SlotInfo } from "./paths.js";

export interface SpiritPanelData {
  name: string;
  pathLabel: string;
  stage: Stage;
  slots: SlotInfo[];
  progressLines: string[];
}

const PANEL_W = 360;
const PANEL_H = 300;

export function drawSpiritPanel(
  ctx: CanvasRenderingContext2D,
  screenW: number,
  screenH: number,
  data: SpiritPanelData,
): void {
  const x = Math.round(screenW / 2 - PANEL_W / 2);
  const y = Math.round(screenH / 2 - PANEL_H / 2);

  ctx.save();
  ctx.fillStyle = "rgba(10, 8, 18, 0.88)";
  ctx.fillRect(x, y, PANEL_W, PANEL_H);
  ctx.strokeStyle = "#6d4f94";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, PANEL_W, PANEL_H);
  ctx.strokeStyle = "rgba(109, 79, 148, 0.4)";
  ctx.strokeRect(x + 3.5, y + 3.5, PANEL_W - 6, PANEL_H - 6);

  // Header: name + stage.
  ctx.textAlign = "left";
  ctx.fillStyle = "#cfc8e8";
  ctx.font = "bold 18px Georgia, serif";
  ctx.fillText(data.name, x + 18, y + 30);
  ctx.textAlign = "right";
  ctx.fillStyle = "#e0c9a8";
  ctx.font = "bold 14px Georgia, serif";
  ctx.fillText(STAGE_NAMES[data.stage], x + PANEL_W - 18, y + 30);

  ctx.textAlign = "left";
  ctx.fillStyle = "#8a6cc0";
  ctx.font = "italic 12px Georgia, serif";
  ctx.fillText(data.pathLabel, x + 18, y + 48);

  // Divider.
  ctx.strokeStyle = "rgba(109, 79, 148, 0.5)";
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 60);
  ctx.lineTo(x + PANEL_W - 14, y + 60);
  ctx.stroke();

  // Technique slots.
  ctx.fillStyle = "#8d97a8";
  ctx.font = "11px Georgia, serif";
  ctx.fillText("SACRED ARTS", x + 18, y + 78);
  let yy = y + 98;
  for (const slot of data.slots) {
    ctx.fillStyle = slot.locked ? "#4a4458" : "#6d4f94";
    ctx.fillRect(x + 18, yy - 10, 14, 14);
    ctx.fillStyle = slot.locked ? "#8d8798" : "#efece4";
    ctx.font = "bold 10px Georgia, serif";
    ctx.fillText(slot.key, x + 22, yy + 1);
    ctx.font = slot.locked ? "italic 13px Georgia, serif" : "13px Georgia, serif";
    ctx.fillStyle = slot.locked ? "#5c5478" : "#cfc8e8";
    ctx.fillText(slot.label, x + 42, yy + 1);
    if (slot.note) {
      ctx.fillStyle = "#4f4964";
      ctx.font = "italic 11px Georgia, serif";
      ctx.fillText(slot.note, x + 160, yy + 1);
    }
    yy += 24;
  }

  // Divider.
  ctx.strokeStyle = "rgba(109, 79, 148, 0.5)";
  ctx.beginPath();
  ctx.moveTo(x + 14, yy - 6);
  ctx.lineTo(x + PANEL_W - 14, yy - 6);
  ctx.stroke();

  // Advancement progress.
  ctx.fillStyle = "#8d97a8";
  ctx.font = "11px Georgia, serif";
  ctx.fillText("ADVANCEMENT", x + 18, yy + 12);
  yy += 30;
  for (const line of data.progressLines) {
    ctx.fillStyle = line.startsWith("  ") ? "#9a93b4" : "#cfc8e8";
    ctx.font = line.startsWith("  ") ? "12px Georgia, serif" : "13px Georgia, serif";
    ctx.fillText(line.trim(), x + (line.startsWith("  ") ? 30 : 18), yy);
    yy += 18;
  }

  ctx.fillStyle = "#4f4964";
  ctx.font = "italic 11px Georgia, serif";
  ctx.fillText("Tab — close", x + 18, y + PANEL_H - 12);
  ctx.restore();
}
