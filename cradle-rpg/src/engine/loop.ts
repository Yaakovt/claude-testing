/**
 * Fixed-timestep game loop.
 *
 * Simulation runs at a fixed rate (default 60 Hz) regardless of display
 * refresh; rendering happens on requestAnimationFrame with an interpolation
 * alpha (0..1) so movement looks smooth on any monitor.
 * The loop pauses automatically while the tab is hidden.
 */

export interface LoopHooks {
  /** Called at a fixed rate. dt is the fixed step in seconds. */
  update(dt: number): void;
  /** Called once per animation frame. alpha = fraction of a step elapsed since the last update (use to interpolate positions). */
  render(alpha: number): void;
}

export class GameLoop {
  /** Fixed simulation step, seconds. */
  readonly step: number;
  /** Never simulate more than this much real time in one frame (avoids the spiral of death after a hiccup). */
  maxFrameTime = 0.25;

  private hooks: LoopHooks;
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private onVisibility: () => void;

  constructor(hooks: LoopHooks, updateHz = 60) {
    this.hooks = hooks;
    this.step = 1 / updateHz;
    this.onVisibility = () => {
      if (document.hidden) {
        // Drop pending time so we don't fast-forward when the tab returns.
        this.accumulator = 0;
        this.lastTime = 0;
      }
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    document.addEventListener("visibilitychange", this.onVisibility);
    this.rafId = requestAnimationFrame((t) => this.frame(t));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  private frame(timeMs: number): void {
    if (!this.running) return;
    this.rafId = requestAnimationFrame((t) => this.frame(t));

    if (document.hidden) return; // paused

    const time = timeMs / 1000;
    if (this.lastTime === 0) {
      this.lastTime = time;
      return;
    }

    let frameTime = time - this.lastTime;
    this.lastTime = time;
    if (frameTime > this.maxFrameTime) frameTime = this.maxFrameTime;

    this.accumulator += frameTime;
    while (this.accumulator >= this.step) {
      this.hooks.update(this.step);
      this.accumulator -= this.step;
    }

    this.hooks.render(this.accumulator / this.step);
  }
}
