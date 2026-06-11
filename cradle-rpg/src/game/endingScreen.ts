/**
 * ENDING SCREEN (M4b) — the full-screen finale card: ending title, epilogue
 * paragraphs, and the playthrough's axes/choice summary, then "press any
 * key" back to the title. Same in-canvas, headless-safe drawing rules as
 * screens.ts (no gradients, no measureText).
 *
 * main.ts owns the flow: when the story sets the numeric "ending.played"
 * flag (1..3) and the finale cutscene has finished, main tears the world
 * down, shows this screen, and rebuilds the title screens on dismissal.
 */

import type { Input } from "../engine/input.js";

const ACCENT = "#8a6cc0";

export interface EndingScreenData {
  title: string;
  /** Epilogue paragraphs (each is word-wrapped). */
  epilogue: string[];
  /** "How you walked" summary lines (axes + major choices). */
  summary: string[];
}

export class EndingScreen {
  /** True once the player has dismissed the screen. */
  done = false;

  private t = 0;

  constructor(
    private input: Input,
    private data: EndingScreenData,
  ) {}

  update(dt: number): void {
    this.t += dt;
    // A short grace period so a held E from the finale doesn't skip it.
    if (this.t > 1.2 && this.input.anyPressed()) this.done = true;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0b0a10";
    ctx.fillRect(0, 0, w, h);
    const fade = Math.min(1, this.t / 1.2);
    ctx.textAlign = "center";

    ctx.fillStyle = `rgba(92, 84, 120, ${fade})`;
    ctx.font = "13px Georgia, serif";
    ctx.fillText("—  the Sacred Valley arc  —", w / 2, h * 0.14);

    ctx.fillStyle = `rgba(224, 201, 168, ${fade})`;
    ctx.font = "bold 38px Georgia, serif";
    ctx.fillText(this.data.title, w / 2, h * 0.22);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 170, h * 0.22 + 20);
    ctx.lineTo(w / 2 + 170, h * 0.22 + 20);
    ctx.stroke();

    ctx.fillStyle = `rgba(207, 200, 232, ${fade})`;
    ctx.font = "italic 15px Georgia, serif";
    let y = h * 0.32;
    for (const para of this.data.epilogue) {
      y = this.wrap(ctx, para, w / 2, y, 560, 20) + 12;
    }

    ctx.fillStyle = `rgba(138, 108, 192, ${fade * 0.9})`;
    ctx.font = "12px Georgia, serif";
    ctx.fillText("— how you walked —", w / 2, y + 14);
    ctx.fillStyle = `rgba(141, 151, 168, ${fade})`;
    ctx.font = "13px Georgia, serif";
    let sy = y + 34;
    for (const line of this.data.summary) {
      ctx.fillText(line, w / 2, sy);
      sy += 18;
    }

    const pulse = 0.35 + 0.3 * Math.sin(this.t * 2.2);
    ctx.fillStyle = `rgba(207, 200, 232, ${Math.min(fade, pulse)})`;
    ctx.font = "italic 14px Georgia, serif";
    ctx.fillText("press any key", w / 2, h * 0.92);
    ctx.textAlign = "left";
  }

  /** Character-budget wrap (headless shim has no measureText). */
  private wrap(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ): number {
    const perLine = Math.max(20, Math.floor(maxWidth / 6.8));
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
    return yy + lineHeight;
  }
}
