/**
 * DIALOGUE UI (M4a) — the presentation layer over systems/dialogue.ts.
 *
 * A bottom text box in the game's Georgia-serif style: speaker name plate,
 * letter-by-letter reveal (E skips to the full line), then E advances;
 * choices are listed and navigated with W/S (or arrows) + E. While a
 * dialogue is open, World freezes the simulation (enemies and all) — this
 * runs as a UI state, like the M3 screens.
 *
 * Also provides a "simple line" mode for cutscene `say` steps (same box,
 * no tree behind it).
 */

import type { Input } from "../engine/input.js";
import { DialogueRunner, getDialogue, substitute, type DialogueRunnerOpts } from "../systems/dialogue.js";

const INK = "#cfc8e8";
const DIM = "#5c5478";
const GOLD = "#e0c9a8";
const ACCENT = "#8a6cc0";
const REVEAL_CPS = 45; // characters per second
const BOX_H = 104;

export class DialogueUi {
  /** True while a tree OR a simple line is being shown. */
  get active(): boolean {
    return this.runner !== null || this.simple !== null;
  }

  private runner: DialogueRunner | null = null;
  /** Cutscene "say" mode: one line, no tree. */
  private simple: { speaker: string; text: string } | null = null;
  private simpleDone = false;

  private revealT = 0;
  private choiceIndex = 0;
  private blink = 0;

  constructor(private input: Input) {}

  /** Start a registered dialogue tree. Returns false if the id is unknown. */
  start(treeId: string, opts: DialogueRunnerOpts): boolean {
    const tree = getDialogue(treeId);
    if (!tree) return false;
    this.runner = new DialogueRunner(tree, opts);
    this.resetLine();
    if (!this.runner.active) this.runner = null; // zero-length tree
    return true;
  }

  /** Cutscene mode: present one line; sayConfirmed() flips when dismissed. */
  say(speaker: string, text: string): void {
    this.simple = { speaker, text };
    this.simpleDone = false;
    this.resetLine();
  }

  /** Cutscene mode: has the presented line been confirmed away? */
  sayConfirmed(): boolean {
    return this.simpleDone;
  }

  private resetLine(): void {
    this.revealT = 0;
    this.choiceIndex = 0;
  }

  private currentText(): string {
    if (this.simple) return this.simple.text;
    return this.runner ? this.runner.view().text : "";
  }

  /** Number of characters currently revealed. */
  private revealed(): number {
    return Math.min(this.currentText().length, Math.floor(this.revealT * REVEAL_CPS));
  }

  private get fullyRevealed(): boolean {
    return this.revealed() >= this.currentText().length;
  }

  update(dt: number): void {
    if (!this.active) return;
    this.revealT += dt;
    this.blink += dt;

    const confirm = this.input.pressed("interact");
    if (!this.fullyRevealed) {
      if (confirm) this.revealT = 1e9; // E skips the letter reveal
      return;
    }

    // Simple (cutscene) line: E dismisses.
    if (this.simple) {
      if (confirm) {
        this.simple = null;
        this.simpleDone = true;
      }
      return;
    }

    const runner = this.runner!;
    if (runner.hasChoices) {
      const n = runner.view().choices.length;
      if (this.input.pressed("up")) this.choiceIndex = (this.choiceIndex + n - 1) % n;
      if (this.input.pressed("down")) this.choiceIndex = (this.choiceIndex + 1) % n;
      if (confirm) {
        runner.advance(this.choiceIndex);
        this.resetLine();
      }
    } else if (confirm) {
      runner.advance();
      this.resetLine();
    }
    if (!runner.active) {
      this.runner = null;
    }
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.active) return;
    const speaker = this.simple ? this.simple.speaker : this.runner!.view().speaker;
    const text = this.currentText();
    const shown = text.slice(0, this.revealed());

    const bw = Math.min(620, w - 60);
    const bx = Math.round(w / 2 - bw / 2);
    const by = h - BOX_H - 26;

    ctx.save();
    ctx.textAlign = "left";

    // Box + double frame (the spirit-panel look).
    ctx.fillStyle = "rgba(10, 8, 18, 0.92)";
    ctx.fillRect(bx, by, bw, BOX_H);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw, BOX_H);
    ctx.strokeStyle = "rgba(109, 79, 148, 0.4)";
    ctx.strokeRect(bx + 3.5, by + 3.5, bw - 6, BOX_H - 6);

    // Speaker plate.
    if (speaker.length > 0) {
      const pw = 16 + speaker.length * 8;
      ctx.fillStyle = "rgba(10, 8, 18, 0.95)";
      ctx.fillRect(bx + 14, by - 12, pw, 22);
      ctx.strokeStyle = ACCENT;
      ctx.strokeRect(bx + 14.5, by - 11.5, pw, 22);
      ctx.fillStyle = GOLD;
      ctx.font = "bold 13px Georgia, serif";
      ctx.fillText(speaker, bx + 22, by + 4);
    }

    // Body text, char-wrapped (measureText is unavailable headless).
    ctx.fillStyle = INK;
    ctx.font = "15px Georgia, serif";
    const perLine = Math.max(20, Math.floor((bw - 40) / 7.6));
    const lines = wrapChars(shown, perLine);
    let ty = by + (speaker.length > 0 ? 30 : 24);
    for (const line of lines.slice(0, 3)) {
      ctx.fillText(line, bx + 20, ty);
      ty += 20;
    }

    if (!this.fullyRevealed) {
      ctx.restore();
      return;
    }

    // Choices, or the advance hint.
    if (this.runner?.hasChoices) {
      const choices = this.runner.view().choices;
      let cy = by + BOX_H - 14 - (choices.length - 1) * 18;
      ctx.font = "14px Georgia, serif";
      for (let i = 0; i < choices.length; i++) {
        const sel = i === this.choiceIndex;
        ctx.fillStyle = sel ? GOLD : DIM;
        ctx.fillText(`${sel ? "✦ " : "  "}${choices[i]!.label}`, bx + 28, cy);
        cy += 18;
      }
      ctx.fillStyle = DIM;
      ctx.font = "10px Georgia, serif";
      ctx.fillText("W/S — choose   E — speak", bx + bw - 150, by + BOX_H - 8);
    } else {
      const a = 0.4 + 0.3 * Math.sin(this.blink * 4);
      ctx.fillStyle = `rgba(207, 200, 232, ${a})`;
      ctx.font = "italic 12px Georgia, serif";
      ctx.fillText("E ▸", bx + bw - 36, by + BOX_H - 10);
    }
    ctx.restore();
  }
}

/** Word-wrap by character budget (no measureText in the headless shim). */
function wrapChars(text: string, perLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length > 0 && line.length + word.length + 1 > perLine) {
      lines.push(line);
      line = word;
    } else {
      line = line.length === 0 ? word : `${line} ${word}`;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

export { substitute };
