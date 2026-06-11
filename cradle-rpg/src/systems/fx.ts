/**
 * Lightweight combat feedback effects: floating damage numbers and short
 * text pops. World-space; drawn after the y-sorted entity pass so numbers
 * float above everything.
 */

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  life: number;
}

export class FxManager {
  private texts: FloatingText[] = [];

  spawnText(x: number, y: number, text: string, color: string, life = 0.6): void {
    this.texts.push({ x, y, text, color, age: 0, life });
  }

  update(dt: number): void {
    for (const t of this.texts) {
      t.age += dt;
      t.y -= 22 * dt; // drift upward
    }
    this.texts = this.texts.filter((t) => t.age < t.life);
  }

  /** Call with the camera transform active (world pixels). */
  drawWorld(ctx: CanvasRenderingContext2D): void {
    if (this.texts.length === 0) return;
    ctx.save();
    ctx.font = "6px monospace";
    ctx.textAlign = "center";
    for (const t of this.texts) {
      const fade = 1 - t.age / t.life;
      const a = Math.max(0, Math.min(1, fade * 1.6));
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = "#0b0a10";
      ctx.fillText(t.text, Math.round(t.x) + 1, Math.round(t.y) + 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, Math.round(t.x), Math.round(t.y));
    }
    ctx.restore();
  }
}
