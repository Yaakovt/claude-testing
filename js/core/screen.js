'use strict';
/**
 * The virtual GBA screen: 240x160, integer-scaled to the window with
 * letterboxing so pixels are always square and never stretched.
 */
const Screen = {
  W: 240,
  H: 160,
  cv: null,
  ctx: null,
  shake: 0,
  flash: 0,
  flashColor: '#fff',
  fadeLevel: 0,        // 0 = clear, 1 = fully black
  fadeTarget: 0,
  fadeSpeed: 0.08,

  init() {
    Screen.cv = document.getElementById('screen');
    Screen.ctx = Screen.cv.getContext('2d');
    Screen.ctx.imageSmoothingEnabled = false;
    window.addEventListener('resize', Screen.fit);
    Screen.fit();
  },

  fit() {
    const scale = Math.max(1, Math.min(
      Math.floor(window.innerWidth / Screen.W),
      Math.floor(window.innerHeight / Screen.H)
    ));
    Screen.cv.style.width = Screen.W * scale + 'px';
    Screen.cv.style.height = Screen.H * scale + 'px';
  },

  clear(color = '#000') {
    Screen.ctx.fillStyle = color;
    Screen.ctx.fillRect(0, 0, Screen.W, Screen.H);
  },

  /** Apply post effects (fade/flash) — call at end of each frame. */
  post() {
    if (Screen.fadeLevel !== Screen.fadeTarget) {
      const d = Screen.fadeTarget - Screen.fadeLevel;
      Screen.fadeLevel += Util.clamp(d, -Screen.fadeSpeed, Screen.fadeSpeed);
      if (Math.abs(Screen.fadeLevel - Screen.fadeTarget) < 0.01) Screen.fadeLevel = Screen.fadeTarget;
    }
    if (Screen.fadeLevel > 0) {
      Screen.ctx.globalAlpha = Screen.fadeLevel;
      Screen.ctx.fillStyle = '#000';
      Screen.ctx.fillRect(0, 0, Screen.W, Screen.H);
      Screen.ctx.globalAlpha = 1;
    }
    if (Screen.flash > 0) {
      Screen.ctx.globalAlpha = Math.min(1, Screen.flash);
      Screen.ctx.fillStyle = Screen.flashColor;
      Screen.ctx.fillRect(0, 0, Screen.W, Screen.H);
      Screen.ctx.globalAlpha = 1;
      Screen.flash -= 0.12;
    }
  },

  fadeOut(speed = 0.08) { Screen.fadeTarget = 1; Screen.fadeSpeed = speed; },
  fadeIn(speed = 0.08) { Screen.fadeTarget = 0; Screen.fadeSpeed = speed; },
  get fading() { return Screen.fadeLevel !== Screen.fadeTarget; },
  doFlash(color = '#fff', strength = 1) { Screen.flashColor = color; Screen.flash = strength; },
};
