'use strict';
/** Shared UI chrome (Gen-3 style panels) + the overworld dialogue box. */
const UIKit = {
  /** Rounded-corner rect (1px corner clip) — the base of every panel. */
  rr(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x + 1, y, w - 2, h);
    ctx.fillRect(x, y + 1, w, h - 2);
  },
  /** Main message panel: Emerald-style blue frame, cream body. */
  panel(ctx, x, y, w, h) {
    UIKit.rr(ctx, x, y, w, h, '#203048');                    // outline
    UIKit.rr(ctx, x + 1, y + 1, w - 2, h - 2, '#7890b8');    // frame base
    ctx.fillStyle = '#a8c0dc';                               // frame light (top+left)
    ctx.fillRect(x + 2, y + 1, w - 4, 1); ctx.fillRect(x + 1, y + 2, 1, h - 4);
    ctx.fillStyle = '#54688c';                               // frame dark (bottom+right)
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1); ctx.fillRect(x + w - 2, y + 2, 1, h - 4);
    UIKit.rr(ctx, x + 3, y + 3, w - 6, h - 6, '#ffffff');    // inner highlight ring
    ctx.fillStyle = '#f8f8f0';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    ctx.fillStyle = '#e8e4d4';                               // body floor shade
    ctx.fillRect(x + 4, y + h - 6, w - 8, 2);
  },
  /** Small floating panel (HP/info boxes): tan Gen-3 plaque. */
  miniPanel(ctx, x, y, w, h) {
    UIKit.rr(ctx, x, y, w, h, '#4a4238');                    // outline
    UIKit.rr(ctx, x + 1, y + 1, w - 2, h - 2, '#d8cfae');    // bevel base
    ctx.fillStyle = '#f4eed8';                               // top bevel light
    ctx.fillRect(x + 2, y + 1, w - 4, 1);
    ctx.fillStyle = '#b8ae8c';                               // bottom bevel dark
    ctx.fillRect(x + 2, y + h - 2, w - 4, 1);
    ctx.fillStyle = '#f0ead0';                               // body
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = '#faf6e8';
    ctx.fillRect(x + 2, y + 2, w - 4, 1);
  },
  /** Inset panel used inside the main panel (menus). */
  subPanel(ctx, x, y, w, h) {
    UIKit.rr(ctx, x, y, w, h, '#203048');
    UIKit.rr(ctx, x + 1, y + 1, w - 2, h - 2, '#a8b8c8');
    UIKit.rr(ctx, x + 2, y + 2, w - 4, h - 4, '#ffffff');
    ctx.fillStyle = '#e8ecf0';
    ctx.fillRect(x + 3, y + h - 5, w - 6, 2);
  },
  /** Word-wrapped text. Returns lines drawn. */
  wrapText(ctx, text, x, y, maxW, opts = {}) {
    const words = text.split(' ');
    let line = '', ln = 0;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (Font.width(test) > maxW && line) {
        Font.draw(ctx, line, x, y + ln * 12, opts);
        line = word;
        ln++;
      } else line = test;
    }
    if (line) Font.draw(ctx, line, x, y + ln * 12, opts);
    return ln + 1;
  },
};

/**
 * Overworld dialogue: queue of pages, typewriter reveal, A to advance,
 * optional yes/no choice and callback.
 */
const Textbox = {
  active: false,
  pages: [],
  page: 0,
  progress: 0,
  onDone: null,
  choice: null,       // {options:[..], idx, onPick}

  say(text, onDone) {
    // Split long text into pages of ~2 lines automatically at sentence-ish breaks.
    const pages = Array.isArray(text) ? text.slice() : Textbox.paginate(text);
    Textbox.pages = pages;
    Textbox.page = 0;
    Textbox.progress = 0;
    Textbox.active = true;
    Textbox.onDone = onDone || null;
    Textbox.choice = null;
  },

  ask(text, options, onPick) {
    Textbox.say(text, null);
    Textbox.pendingChoice = { options, onPick };
  },

  paginate(text) {
    const words = text.split(' ');
    const pages = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (Font.width(t) > 420) { pages.push(cur); cur = w; }
      else cur = t;
    }
    if (cur) pages.push(cur);
    return pages;
  },

  update() {
    if (!Textbox.active) return;
    if (Textbox.choice) {
      const c = Textbox.choice;
      if (Input.pressed.up) { c.idx = (c.idx + c.options.length - 1) % c.options.length; AudioSys.sfx('select'); }
      if (Input.pressed.down) { c.idx = (c.idx + 1) % c.options.length; AudioSys.sfx('select'); }
      if (Input.pressed.b) { c.idx = c.options.length - 1; }
      if (Input.pressed.a || Input.pressed.b) {
        AudioSys.sfx('confirm');
        const pick = c.idx;
        Textbox.close();
        if (c.onPick) c.onPick(pick);
      }
      return;
    }
    const full = Textbox.pages[Textbox.page] || '';
    if (Textbox.progress < full.length) {
      Textbox.progress += Input.held.a || Input.held.b ? 3 : 1.5;
      return;
    }
    if (Input.pressed.a || Input.pressed.b) {
      AudioSys.sfx('select');
      if (Textbox.page + 1 < Textbox.pages.length) {
        Textbox.page++;
        Textbox.progress = 0;
      } else if (Textbox.pendingChoice) {
        Textbox.choice = { options: Textbox.pendingChoice.options, idx: 0, onPick: Textbox.pendingChoice.onPick };
        Textbox.pendingChoice = null;
      } else {
        Textbox.close();
      }
    }
  },

  close() {
    Textbox.active = false;
    Textbox.pendingChoice = null;
    Textbox.choice = null;
    const cb = Textbox.onDone;
    Textbox.onDone = null;
    if (cb) cb();
  },

  draw(ctx) {
    if (!Textbox.active) return;
    UIKit.panel(ctx, 2, 118, 236, 40);
    const full = Textbox.pages[Textbox.page] || '';
    const shown = full.slice(0, Math.floor(Textbox.progress));
    UIKit.wrapText(ctx, shown, 10, 126, 218);
    if (Textbox.progress >= full.length && !Textbox.choice) {
      if ((Game.frame >> 4) & 1) Font.draw(ctx, '▼', 224, 148, { color: '#e84848', shadow: null });
    }
    if (Textbox.choice) {
      const c = Textbox.choice;
      const h = c.options.length * 14 + 10;
      UIKit.panel(ctx, 168, 112 - h, 70, h);
      c.options.forEach((opt, i) => {
        Font.draw(ctx, opt, 184, 118 - h + i * 14, { color: '#383838', shadow: '#d8d8c8' });
        if (c.idx === i) Font.draw(ctx, '▶', 174, 118 - h + i * 14, { color: '#e84848', shadow: null });
      });
    }
  },
};
