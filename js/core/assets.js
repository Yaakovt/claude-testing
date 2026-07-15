'use strict';
/**
 * Optional external art loader. If `assets/manifest.json` exists (delivered by
 * an external artist/model per ASSETS_FOR_CODEX.md), every listed PNG is loaded
 * and transparently overrides the built-in procedural art. With no manifest,
 * the game runs 100% on its own generated graphics — zero network noise.
 *
 * manifest.json format:  { "files": ["pokemon/front/cindrel.png", ...] }
 * Logical key = the path without the "assets/" prefix and without ".png".
 */
const Assets = {
  overrides: {},      // logicalKey -> HTMLImageElement
  loaded: 0, total: 0, ready: false,

  boot() {
    // fetch() is blocked on file:// (CORS); only attempt over http(s).
    if (typeof location !== 'undefined' && location.protocol === 'file:') { Assets.ready = true; return; }
    fetch('assets/manifest.json')
      .then((r) => r.ok ? r.json() : null)
      .then((mani) => {
        if (!mani || !Array.isArray(mani.files)) { Assets.ready = true; return; }
        Assets.total = mani.files.length;
        for (const rel of mani.files) {
          const key = rel.replace(/^assets\//, '').replace(/\.png$/i, '');
          const img = new Image();
          img.onload = () => { Assets.overrides[key] = img; Assets.loaded++; };
          img.onerror = () => { Assets.loaded++; };
          img.src = 'assets/' + rel.replace(/^assets\//, '');
        }
        Assets.ready = true;
      })
      .catch(() => { Assets.ready = true; });
  },

  /** Return a fully-loaded override image for a logical key, or null. */
  get(key) {
    const img = Assets.overrides[key];
    return img && img.complete && img.naturalWidth > 0 ? img : null;
  },
};
