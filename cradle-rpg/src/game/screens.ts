/**
 * Title + character creation — in-canvas, keyboard-driven, and written to
 * feel like a quiet prologue rather than a menu. Flow:
 *
 *   title ("press any key", drifting aura)
 *     -> menu (Continue / New Game; only if a save exists)
 *     -> confirm-wipe (New Game over an old save)
 *     -> origin (the four starts, with Path summary + lore line)
 *     -> name (A-Z entry; per-origin placeholder, Unsouled = "Lindon")
 *     -> result
 *
 * main.ts polls `result` each tick and builds the world when it appears.
 * All drawing is plain Canvas text/shapes (Georgia serif, the game's dark
 * violet palette) — no DOM, no gradients (headless harness friendly).
 */

import type { Input } from "../engine/input.js";
import { ORIGIN_ORDER, PATHS, type OriginId } from "./paths.js";

export type ScreenResult =
  | { kind: "continue" }
  | { kind: "new"; origin: OriginId; name: string };

type ScreenState = "title" | "menu" | "confirmWipe" | "origin" | "name";

const INK = "#cfc8e8";
const DIM = "#5c5478";
const ACCENT = "#8a6cc0";
const GOLD = "#e0c9a8";
const DANGER = "#c66a5e";
const MAX_NAME = 12;

const LETTER_CODES: string[] = [];
for (let i = 0; i < 26; i++) LETTER_CODES.push(`Key${String.fromCharCode(65 + i)}`);

export class Screens {
  state: ScreenState = "title";
  result: ScreenResult | null = null;

  private t = 0;
  private menuIndex = 0;
  private confirmIndex = 0;
  private originIndex = 0;
  private nameBuf = "";

  constructor(
    private input: Input,
    private hasSave: boolean,
  ) {}

  private confirmPressed(): boolean {
    return (
      this.input.pressed("interact") ||
      this.input.pressed("attack") ||
      this.input.keyPressed("Enter") ||
      this.input.keyPressed("NumpadEnter")
    );
  }

  // --------------------------------------------------------------- update

  update(dt: number): void {
    this.t += dt;
    if (this.result) return;
    switch (this.state) {
      case "title":
        if (this.input.anyPressed()) {
          this.state = this.hasSave ? "menu" : "origin";
        }
        return;
      case "menu": {
        if (this.input.pressed("up") || this.input.pressed("down")) {
          this.menuIndex = 1 - this.menuIndex;
        }
        if (this.confirmPressed()) {
          if (this.menuIndex === 0) this.result = { kind: "continue" };
          else {
            this.confirmIndex = 0;
            this.state = "confirmWipe";
          }
        }
        return;
      }
      case "confirmWipe": {
        if (this.input.pressed("up") || this.input.pressed("down")) {
          this.confirmIndex = 1 - this.confirmIndex;
        }
        if (this.confirmPressed()) {
          this.state = this.confirmIndex === 1 ? "origin" : "menu";
        }
        return;
      }
      case "origin": {
        if (this.input.pressed("up")) {
          this.originIndex = (this.originIndex + ORIGIN_ORDER.length - 1) % ORIGIN_ORDER.length;
        }
        if (this.input.pressed("down")) {
          this.originIndex = (this.originIndex + 1) % ORIGIN_ORDER.length;
        }
        if (this.confirmPressed()) {
          this.nameBuf = "";
          this.state = "name";
        }
        return;
      }
      case "name": {
        // Letters first; Enter confirms; Backspace deletes (or backs out).
        for (let i = 0; i < LETTER_CODES.length; i++) {
          if (this.input.keyPressed(LETTER_CODES[i]!) && this.nameBuf.length < MAX_NAME) {
            const ch = String.fromCharCode(65 + i);
            this.nameBuf += this.nameBuf.length === 0 ? ch : ch.toLowerCase();
          }
        }
        if (this.input.keyPressed("Backspace")) {
          if (this.nameBuf.length === 0) this.state = "origin";
          else this.nameBuf = this.nameBuf.slice(0, -1);
        }
        if (this.input.keyPressed("Enter") || this.input.keyPressed("NumpadEnter")) {
          const origin = ORIGIN_ORDER[this.originIndex]!;
          const name = this.nameBuf.length > 0 ? this.nameBuf : PATHS[origin].defaultName;
          this.result = { kind: "new", origin, name };
        }
        return;
      }
    }
  }

  // ----------------------------------------------------------------- draw

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(0, 0, w, h);
    this.drawAura(ctx, w, h);
    switch (this.state) {
      case "title":
        this.drawTitle(ctx, w, h);
        break;
      case "menu":
        this.drawMenu(ctx, w, h);
        break;
      case "confirmWipe":
        this.drawConfirm(ctx, w, h);
        break;
      case "origin":
        this.drawOrigin(ctx, w, h);
        break;
      case "name":
        this.drawName(ctx, w, h);
        break;
    }
    ctx.textAlign = "left";
  }

  /** Drifting madra motes + slow rings — the subtle aura animation. */
  private drawAura(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const t = this.t;
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const px = w / 2 + Math.sin(t * 0.11 + i * 2.39) * (w * 0.07 + i * 26);
      const py = h * 0.42 + Math.cos(t * 0.09 + i * 1.71) * (h * 0.18 + i * 6);
      const a = 0.1 + 0.08 * Math.sin(t * 0.8 + i * 1.3);
      ctx.fillStyle = i % 3 === 0 ? `rgba(191, 227, 242, ${a})` : `rgba(138, 108, 192, ${a})`;
      const s = 1 + (i % 3);
      ctx.fillRect(Math.round(px), Math.round(py), s, s);
    }
    for (let r = 0; r < 2; r++) {
      ctx.strokeStyle = `rgba(138, 108, 192, ${0.05 + 0.03 * Math.sin(t * 0.5 + r * 2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.3, 90 + r * 34 + Math.sin(t * 0.4 + r) * 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTitle(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.textAlign = "center";
    ctx.fillStyle = DIM;
    ctx.font = "13px Georgia, serif";
    ctx.fillText("a   C r a d l e   f a n   w o r k", w / 2, h * 0.3 - 52);
    ctx.fillStyle = INK;
    ctx.font = "bold 46px Georgia, serif";
    ctx.fillText("Path of Ascension", w / 2, h * 0.3);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 150, h * 0.3 + 22);
    ctx.lineTo(w / 2 + 150, h * 0.3 + 22);
    ctx.stroke();
    const pulse = 0.4 + 0.35 * Math.sin(this.t * 2.2);
    ctx.fillStyle = `rgba(207, 200, 232, ${pulse})`;
    ctx.font = "italic 16px Georgia, serif";
    ctx.fillText("press any key", w / 2, h * 0.62);
  }

  private drawMenuList(
    ctx: CanvasRenderingContext2D,
    w: number,
    y: number,
    items: string[],
    selected: number,
    danger = -1,
  ): void {
    ctx.font = "18px Georgia, serif";
    for (let i = 0; i < items.length; i++) {
      const sel = i === selected;
      ctx.fillStyle = sel ? (i === danger ? DANGER : GOLD) : DIM;
      ctx.fillText(`${sel ? "✦  " : ""}${items[i]}${sel ? "  ✦" : ""}`, w / 2, y + i * 32);
    }
  }

  private drawMenu(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "bold 34px Georgia, serif";
    ctx.fillText("Path of Ascension", w / 2, h * 0.26);
    this.drawMenuList(ctx, w, h * 0.46, ["Continue", "New Game"], this.menuIndex);
    ctx.fillStyle = DIM;
    ctx.font = "12px Georgia, serif";
    ctx.fillText("W/S to choose — E or Enter to confirm", w / 2, h * 0.46 + 96);
  }

  private drawConfirm(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("Begin anew?", w / 2, h * 0.34);
    ctx.fillStyle = DIM;
    ctx.font = "14px Georgia, serif";
    ctx.fillText("The journey already walked will be erased.", w / 2, h * 0.34 + 26);
    this.drawMenuList(ctx, w, h * 0.52, ["No — return", "Yes — erase it"], this.confirmIndex, 1);
  }

  private drawOrigin(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText("Where does your story begin?", w / 2, h * 0.16);

    // Left column: the four origins.
    const listX = w * 0.28;
    const listY = h * 0.3;
    ctx.font = "17px Georgia, serif";
    for (let i = 0; i < ORIGIN_ORDER.length; i++) {
      const def = PATHS[ORIGIN_ORDER[i]!];
      const sel = i === this.originIndex;
      ctx.fillStyle = sel ? GOLD : DIM;
      ctx.fillText(`${sel ? "✦ " : ""}${def.clanLabel}`, listX, listY + i * 34);
    }

    // Right column: the selected Path's summary.
    const def = PATHS[ORIGIN_ORDER[this.originIndex]!];
    const px = w * 0.66;
    let py = h * 0.28;
    ctx.fillStyle = INK;
    ctx.font = "bold 19px Georgia, serif";
    ctx.fillText(def.pathName, px, py);
    py += 22;
    ctx.fillStyle = ACCENT;
    ctx.font = "13px Georgia, serif";
    ctx.fillText(def.aspects, px, py);
    py += 30;
    ctx.fillStyle = INK;
    ctx.font = "14px Georgia, serif";
    ctx.fillText(def.playstyle, px, py);
    py += 24;
    const hardest = def.origin === "unsouled";
    ctx.fillStyle = hardest ? DANGER : DIM;
    ctx.font = hardest ? "italic bold 14px Georgia, serif" : "italic 14px Georgia, serif";
    ctx.fillText(`— ${def.difficulty} —`, px, py);
    py += 34;
    ctx.fillStyle = GOLD;
    ctx.font = "italic 13px Georgia, serif";
    this.wrapText(ctx, def.lore, px, py, 340, 18);
    if (def.invented) {
      ctx.fillStyle = DIM;
      ctx.font = "10px Georgia, serif";
      ctx.fillText("(a Path invented for this game — canon is silent)", px, h * 0.78);
    }

    ctx.fillStyle = DIM;
    ctx.font = "12px Georgia, serif";
    ctx.fillText("W/S to choose — E or Enter to walk this road", w / 2, h * 0.88);
  }

  private drawName(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const def = PATHS[ORIGIN_ORDER[this.originIndex]!];
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "italic 20px Georgia, serif";
    ctx.fillText(
      def.origin === "unsouled"
        ? "They took your Path. They never asked your name."
        : "And what name do you carry?",
      w / 2,
      h * 0.3,
    );

    // Entry box with placeholder + blinking cursor.
    const bw = 280;
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1;
    ctx.strokeRect(w / 2 - bw / 2, h * 0.44 - 26, bw, 38);
    ctx.font = "22px Georgia, serif";
    const showCursor = Math.sin(this.t * 4) > 0;
    if (this.nameBuf.length > 0) {
      ctx.fillStyle = INK;
      ctx.fillText(this.nameBuf + (showCursor ? "_" : ""), w / 2, h * 0.44);
    } else {
      ctx.fillStyle = DIM;
      ctx.fillText(def.defaultName + (showCursor ? "_" : ""), w / 2, h * 0.44);
    }

    ctx.fillStyle = DIM;
    ctx.font = "12px Georgia, serif";
    ctx.fillText("type a name (A–Z) — Enter to accept", w / 2, h * 0.44 + 44);
    ctx.fillText(
      this.nameBuf.length === 0
        ? `Enter accepts "${def.defaultName}" — Backspace returns`
        : "Backspace to erase",
      w / 2,
      h * 0.44 + 64,
    );
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): void {
    // measureText is unavailable in the headless shim — wrap by characters.
    const perLine = Math.max(20, Math.floor(maxWidth / 6.4));
    const words = text.split(" ");
    let line = "";
    let yy = y;
    for (const word of words) {
      if (line.length > 0 && line.length + word.length + 1 > perLine) {
        ctx.fillText(line, x, yy);
        yy += lineHeight;
        line = word;
      } else {
        line = line.length === 0 ? word : `${line} ${word}`;
      }
    }
    if (line.length > 0) ctx.fillText(line, x, yy);
  }
}
