/**
 * Procedural pixel-art system — the art foundation for the whole game.
 *
 * Sprites are defined as ASCII-art string grids plus a palette mapping each
 * character to a CSS color. Any character not in the palette (conventionally
 * '.') is transparent. Sprites are baked once to offscreen canvases on first
 * draw (lazy, so sprite data modules stay importable outside the DOM, e.g.
 * in node-based map validators).
 *
 * Example:
 *   const heart = definePixelSprite([
 *     ".RR.RR.",
 *     "RRRRRRR",
 *     ".RRRRR.",
 *     "..RRR..",
 *     "...R...",
 *   ], { R: "#d03050" });
 *   heart.draw(ctx, x, y);            // top-left at (x, y), world pixels
 *   heart.draw(ctx, x, y, true);      // horizontally flipped
 */

export class PixelSprite {
  readonly width: number;
  readonly height: number;
  private rows: string[];
  private palette: Record<string, string>;
  private baked: HTMLCanvasElement | null = null;
  private bakedFlipped: HTMLCanvasElement | null = null;

  constructor(rows: string[], palette: Record<string, string>) {
    if (rows.length === 0) throw new Error("PixelSprite: empty rows");
    const w = rows[0]!.length;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i]!.length !== w) {
        throw new Error(
          `PixelSprite: row ${i} is ${rows[i]!.length} chars, expected ${w}`,
        );
      }
    }
    this.rows = rows;
    this.palette = palette;
    this.width = w;
    this.height = rows.length;
  }

  /** Bake this sprite's pixels onto a fresh offscreen canvas. */
  private bake(flip: boolean): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("PixelSprite: no 2d context");
    for (let y = 0; y < this.height; y++) {
      const row = this.rows[y]!;
      for (let x = 0; x < this.width; x++) {
        const color = this.palette[row[x]!];
        if (color === undefined) continue; // transparent
        ctx.fillStyle = color;
        ctx.fillRect(flip ? this.width - 1 - x : x, y, 1, 1);
      }
    }
    return canvas;
  }

  /** The baked canvas (bakes on first access). */
  get image(): HTMLCanvasElement {
    if (!this.baked) this.baked = this.bake(false);
    return this.baked;
  }

  /** Draw with top-left at (x, y) in the current transform space. */
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, flip = false): void {
    if (flip) {
      if (!this.bakedFlipped) this.bakedFlipped = this.bake(true);
      ctx.drawImage(this.bakedFlipped, Math.round(x), Math.round(y));
    } else {
      ctx.drawImage(this.image, Math.round(x), Math.round(y));
    }
  }
}

/** Define a sprite from ASCII rows + palette. See module docs for format. */
export function definePixelSprite(
  rows: string[],
  palette: Record<string, string>,
): PixelSprite {
  return new PixelSprite(rows, palette);
}

/** Convenience: define several frames that share one palette. */
export function definePixelFrames(
  frames: string[][],
  palette: Record<string, string>,
): PixelSprite[] {
  return frames.map((rows) => definePixelSprite(rows, palette));
}

/**
 * A simple frame-flipping animation over PixelSprites.
 * Each entity that animates should own its own Animation instance
 * (it carries playback state); frames themselves are shared.
 */
export class Animation {
  readonly frames: PixelSprite[];
  fps: number;
  loop: boolean;
  private time = 0;

  constructor(frames: PixelSprite[], fps: number, loop = true) {
    if (frames.length === 0) throw new Error("Animation: no frames");
    this.frames = frames;
    this.fps = fps;
    this.loop = loop;
  }

  update(dt: number): void {
    this.time += dt;
  }

  reset(): void {
    this.time = 0;
  }

  get frameIndex(): number {
    const i = Math.floor(this.time * this.fps);
    if (this.loop) return i % this.frames.length;
    return Math.min(i, this.frames.length - 1);
  }

  get frame(): PixelSprite {
    return this.frames[this.frameIndex]!;
  }

  /** True once a non-looping animation has shown its last frame. */
  get done(): boolean {
    return !this.loop && this.time * this.fps >= this.frames.length;
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, flip = false): void {
    this.frame.draw(ctx, x, y, flip);
  }
}
