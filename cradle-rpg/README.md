# Path of Ascension

A fan-made, Cradle-inspired 2D action RPG (top-down, Link-to-the-Past style).
TypeScript + HTML5 Canvas, zero runtime dependencies. All art is procedural
pixel art defined as ASCII grids in code.

## Build & run

```sh
npm run build    # compiles src/ -> dist/ with npx tsc
npm run serve    # zero-dep static server at http://localhost:8080
```

(Or `npm start` to do both.)

## Controls (M1)

WASD / arrows to move. F3 toggles the debug overlay (fps, position,
collision boxes). Your position auto-saves to localStorage.

`npm run check` runs the headless map/collision/boot sanity checks.
See `docs/ARCHITECTURE.md` for how the engine fits together and how to
extend it (new sprites, entities, maps, systems).

*Non-commercial fan work based on Will Wight's Cradle series; all original
setting elements belong to Will Wight / Hidden Gnome Publishing.*
