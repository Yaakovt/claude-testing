# Legends of Norvenna

An original, Gen-3-style 2D monster-catching RPG that runs in any web browser.
Explore the aurora-lit region of **Norvenna**, raise a team from **100 original
fakemon**, foil the schemes of **Team Ionar**, earn gym badges, and face the
legendary **Auroryx**, the Storm-Heart of the North.

Everything here is original — no copyrighted names, sprites, sounds, or team
concepts. All art and audio are generated in code (or supplied as optional PNGs;
see *Art pipeline* below).

## Play it

Open **`index.html`** in a modern browser. That's it — no build step, no
dependencies. Click or press a key to enable sound, then press **Enter** at the
title screen.

For best results serve it over a local web server (so optional PNG art can load):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls (GBA-style)

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move / navigate menus |
| **Z** or Space | **A** — confirm / talk / advance text |
| **X** / Esc / Backspace | **B** — cancel / run |
| **Enter** | Start menu (overworld) |

The screen renders at a native **240×160** (GBA resolution) and integer-scales to
fit any monitor with letterboxing — crisp pixels, never stretched.

## Features

- **Full mainline battle engine**: Gen-3 damage formula, physical/special split,
  STAB, the complete 18-type chart, stat stages, natures, status conditions,
  weather, priority, critical hits, multi-hit/recoil/drain, abilities that affect
  battle, the real catch-rate and (never-guaranteed) escape formulas, EXP curves,
  and matchup-aware trainer AI.
- **100 original fakemon**, each with a unique front **and** true back sprite, a
  synthesized cry, an ability, a level-up learnset, TM/HM compatibility, evolution
  data (level / stone / friendship, including a **split evolution**), and a Pokédex
  entry. Every one of the 18 types has at least 4 species.
- **Unique per-move animations**, seven battle backgrounds, animated tiles.
- **Overworld**: grid movement, enterable buildings, wandering & idle NPCs,
  line-of-sight trainers, wild-encounter grass, ledges, HM field moves, warps.
- **Full UI suite**: animated aurora opening + title, Professor Aspen intro,
  gender select & name entry, party/summary, bag with pockets, Pokédex, shop,
  Pokécenter healing, trainer card, evolution scene, save/load (localStorage).
- **Original chiptune soundtrack** with distinct themes for towns, routes, caves,
  surfing, evolution, and **separate battle themes** for wild / trainer / gym /
  Team Ionar / Elite Four / Champion fights.

## The region (current build)

Frosthollow Village (start, Professor's lab) → Route 1 → **Birchwick Town**
(Gym 1: Astrid, Normal) → Route 2 (+ Whisperwood Hollow cave) → **Mossmere Town**
(Gym 2: Eirik, Grass). The Elite Four (Corvin/Freyda/Mara/Liv), the secret
Champion (Sigrid), the rivals (Kai & Vera), and Team Ionar's leader Magnus Voll
are all defined in `js/data/trainers.js` and wired for the continuing storyline.

## Art pipeline (optional external assets)

The game draws all art procedurally by default. To swap in externally-authored
PNGs, hand **`ASSETS_FOR_CODEX.md`** to an artist or image model — it specifies
every asset (all fakemon front/back, characters, tiles, backgrounds, GUI) with
exact sizes, folder paths, and per-species art direction. Deliver PNGs under
`assets/` plus an `assets/manifest.json`, and the engine auto-substitutes them for
the built-in art (partial deliveries are fine). Regenerate the brief with
`node tools/gen_art_prompt.mjs`.

## Project layout

```
index.html            entry point (loads all modules)
js/core/              engine: input, font, pixel toolkit, screen, audio, music, assets
js/data/              type chart, natures, abilities, moves, items, dex, trainers, tracks
js/data/dex/          the 100 species (sprites + stats + learnsets + cries)
js/battle/            Mon instances, battle engine, move animations, battle UI
js/overworld/         maps, player, NPCs, scripts
js/maps/              world/interior/dungeon maps + storyline scripts
js/ui/                title, intro, menus, party, bag, pokedex
tools/                audit, map validator, screenshot + smoke tests, asset-brief generator
```

## Developer tools

```bash
node tools/audit.mjs                          # data integrity + type-coverage audit
CHROMIUM_PATH=... node tools/mapcheck.mjs      # validate every map's warps/scripts/items
CHROMIUM_PATH=... node tools/smoke.mjs <dir>   # headless boot-to-battle playthrough
node tools/gen_art_prompt.mjs                  # regenerate ASSETS_FOR_CODEX.md
```

## Credits

Original game design, code, pixel art, and chiptune music created for this
project. Built to run on the open web.
