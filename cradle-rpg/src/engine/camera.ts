/**
 * Camera: smoothly follows a target, clamps to map bounds, converts between
 * world and screen space, and supports screen shake (for combat later).
 *
 * The camera works in *world pixels* (16px tiles). Rendering applies a global
 * integer pixel scale (3x). To avoid sprite shimmer, the final translation is
 * snapped to whole device pixels in applyTransform().
 */

export interface Vec2 {
  x: number;
  y: number;
}

export class Camera {
  /** Center of the view, world pixels. */
  x = 0;
  y = 0;
  /** Pixel scale applied at render (world px -> device px). */
  scale: number;
  /** View size in device pixels (the canvas size). */
  screenW = 0;
  screenH = 0;
  /** Higher = snappier follow. ~8 feels good for a walking pace. */
  followSpeed = 8;

  private target: Vec2 | null = null;
  private boundsW = Infinity;
  private boundsH = Infinity;
  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private shakeX = 0;
  private shakeY = 0;

  constructor(scale = 3) {
    this.scale = scale;
  }

  /** View size in world pixels. */
  get viewW(): number {
    return this.screenW / this.scale;
  }
  get viewH(): number {
    return this.screenH / this.scale;
  }
  /** Top-left of the view in world pixels (after clamping). */
  get left(): number {
    return this.x - this.viewW / 2;
  }
  get top(): number {
    return this.y - this.viewH / 2;
  }

  setScreenSize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
    this.clamp();
  }

  /** Constrain the view inside a map of the given world-pixel size. */
  setBounds(worldW: number, worldH: number): void {
    this.boundsW = worldW;
    this.boundsH = worldH;
    this.clamp();
  }

  follow(target: Vec2): void {
    this.target = target;
  }

  /** Jump straight to the target (use on spawn / map change). */
  snapToTarget(): void {
    if (!this.target) return;
    this.x = this.target.x;
    this.y = this.target.y;
    this.clamp();
  }

  /** Kick off a screen shake (world-pixel intensity, seconds). */
  shake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  update(dt: number): void {
    if (this.target) {
      // Exponential smoothing — framerate independent.
      const t = 1 - Math.exp(-this.followSpeed * dt);
      this.x += (this.target.x - this.x) * t;
      this.y += (this.target.y - this.y) * t;
    }
    this.clamp();

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const falloff = Math.max(0, this.shakeTime / this.shakeDuration);
      const amp = this.shakeIntensity * falloff;
      this.shakeX = (Math.random() * 2 - 1) * amp;
      this.shakeY = (Math.random() * 2 - 1) * amp;
      if (this.shakeTime <= 0) {
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  private clamp(): void {
    const halfW = this.viewW / 2;
    const halfH = this.viewH / 2;
    if (this.boundsW <= this.viewW) {
      this.x = this.boundsW / 2; // map narrower than view: center it
    } else {
      this.x = Math.min(Math.max(this.x, halfW), this.boundsW - halfW);
    }
    if (this.boundsH <= this.viewH) {
      this.y = this.boundsH / 2;
    } else {
      this.y = Math.min(Math.max(this.y, halfH), this.boundsH - halfH);
    }
  }

  worldToScreen(wx: number, wy: number): Vec2 {
    return {
      x: (wx - this.left + this.shakeX) * this.scale,
      y: (wy - this.top + this.shakeY) * this.scale,
    };
  }

  screenToWorld(sx: number, sy: number): Vec2 {
    return {
      x: sx / this.scale + this.left - this.shakeX,
      y: sy / this.scale + this.top - this.shakeY,
    };
  }

  /**
   * Set the canvas transform so subsequent draws happen in world pixels.
   * Translation is snapped to whole device pixels to avoid shimmer.
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    const tx = -Math.round((this.left - this.shakeX) * this.scale);
    const ty = -Math.round((this.top - this.shakeY) * this.scale);
    ctx.setTransform(this.scale, 0, 0, this.scale, tx, ty);
  }
}
