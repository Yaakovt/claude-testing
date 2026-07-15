'use strict';
/**
 * GBA-style input mapping.
 *   D-pad: arrow keys / WASD
 *   A: Z or Enter    B: X or Escape/Backspace    START: Enter
 * Provides both held state and just-pressed edges, consumed per frame.
 */
const Input = {
  held: {},
  pressed: {},
  _edge: {},

  KEYMAP: {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a',
    KeyX: 'b', Backspace: 'b', Escape: 'b',
    Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select',
  },

  init() {
    window.addEventListener('keydown', (e) => {
      const k = Input.KEYMAP[e.code];
      if (!k) return;
      e.preventDefault();
      if (!Input.held[k]) Input._edge[k] = true;
      Input.held[k] = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = Input.KEYMAP[e.code];
      if (!k) return;
      e.preventDefault();
      Input.held[k] = false;
    });
    window.addEventListener('blur', () => { Input.held = {}; });
  },

  /** Called once per frame: promotes edges into this frame's pressed set. */
  update() {
    Input.pressed = Input._edge;
    Input._edge = {};
  },

  /** Direction currently held, with priority order (for grid movement). */
  dirHeld() {
    if (Input.held.up) return 'up';
    if (Input.held.down) return 'down';
    if (Input.held.left) return 'left';
    if (Input.held.right) return 'right';
    return null;
  },
};
