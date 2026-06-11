/**
 * Keyboard + mouse input with edge detection.
 *
 * Game code queries *actions*, not raw keys, so rebinding later is trivial.
 * Call `endFrame()` exactly once per simulation tick (after all update logic)
 * to roll pressed/released edges over.
 */

export type Action =
  | "up"
  | "down"
  | "left"
  | "right"
  | "attack"   // J
  | "tech1"    // K
  | "tech2"    // L
  | "tech3"    // U
  | "tech4"    // I
  | "dodge"    // Space
  | "cycle"    // C (hold)
  | "interact" // E
  | "sheet"    // Tab
  | "debug";   // F3

/** KeyboardEvent.code values bound to each action. */
const BINDINGS: Record<Action, string[]> = {
  up: ["KeyW", "ArrowUp"],
  down: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  attack: ["KeyJ"],
  tech1: ["KeyK"],
  tech2: ["KeyL"],
  tech3: ["KeyU"],
  tech4: ["KeyI"],
  dodge: ["Space"],
  cycle: ["KeyC"],
  interact: ["KeyE"],
  sheet: ["Tab"],
  debug: ["F3"],
};

/** Codes whose browser default we suppress (scrolling, focus traversal, etc.). */
const PREVENT_DEFAULT = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Tab", "F3",
]);

export interface MouseState {
  /** Position in CSS pixels relative to the canvas top-left. */
  x: number;
  y: number;
  down: boolean;
  /** True only on the tick a click (mousedown) happened. */
  justClicked: boolean;
}

export class Input {
  readonly mouse: MouseState = { x: 0, y: 0, down: false, justClicked: false };

  private heldCodes = new Set<string>();
  private pressedCodes = new Set<string>();
  private releasedCodes = new Set<string>();
  private clickQueued = false;

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.heldCodes.add(e.code);
      this.pressedCodes.add(e.code);
    });
    window.addEventListener("keyup", (e) => {
      if (PREVENT_DEFAULT.has(e.code)) e.preventDefault();
      this.heldCodes.delete(e.code);
      this.releasedCodes.add(e.code);
    });
    window.addEventListener("blur", () => {
      // Lost focus: treat every held key as released so nothing sticks.
      for (const code of this.heldCodes) this.releasedCodes.add(code);
      this.heldCodes.clear();
    });

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mousedown", () => {
      this.mouse.down = true;
      this.clickQueued = true;
    });
    window.addEventListener("mouseup", () => {
      this.mouse.down = false;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /** True while any key bound to the action is down. */
  held(action: Action): boolean {
    return BINDINGS[action].some((c) => this.heldCodes.has(c));
  }

  /** True only on the tick the action went down. */
  pressed(action: Action): boolean {
    return BINDINGS[action].some((c) => this.pressedCodes.has(c));
  }

  /** True only on the tick the action went up. */
  released(action: Action): boolean {
    return BINDINGS[action].some((c) => this.releasedCodes.has(c));
  }

  /** Raw query for unbound keys (debug shortcuts etc.). */
  keyPressed(code: string): boolean {
    return this.pressedCodes.has(code);
  }

  /** True if ANY key went down this tick ("press any key" screens). */
  anyPressed(): boolean {
    return this.pressedCodes.size > 0;
  }

  /** Clear one-tick edges. Call once at the end of every update tick. */
  endFrame(): void {
    this.pressedCodes.clear();
    this.releasedCodes.clear();
    // A click queued during the tick that just ended becomes visible for
    // exactly one tick, then clears.
    this.mouse.justClicked = this.clickQueued;
    this.clickQueued = false;
  }
}
