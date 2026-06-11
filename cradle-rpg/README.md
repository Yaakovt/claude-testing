# Path of Ascension

A fan-made, Cradle-inspired 2D action RPG (top-down, Link-to-the-Past style).
TypeScript + HTML5 Canvas, zero runtime dependencies. All art is procedural
pixel art defined as ASCII grids in code; all audio is a zero-dep WebAudio
synth.

Choose your origin — the Wei, Li, or Kazan clans, or the clanless Unsouled
road — and walk the sacred arts from Foundation toward Gold through the
events of book one: the Seven-Year Festival, the heavens' warning, the Sword
Sage's disciple, and Heaven's Glory's hospitality. Your choices branch the
story toward one of three endings.

## Build & run

```sh
npm run build    # compiles src/ -> dist/ with npx tsc
npm run serve    # zero-dep static server at http://localhost:8080
```

(Or `npm start` to do both.)

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move |
| J / left-click | Basic strike (press rhythmically to chain the finisher) |
| K, L, U, I | Techniques (your Path's kit; shown bottom-right with costs/cooldowns) |
| Space | Dodge burst (i-frames, costs a little madra) |
| C (hold) | **Cycle** — refill madra; you're slow and vulnerable while you do |
| E | Talk / meditate at shrines / **hold near a fresh Remnant to harvest it** |
| Tab | Spirit panel (Q flips to the quest journal) |
| M | Mute / unmute |
| F3 | Debug overlay |

## The shape of the game

- **Advancement:** Copper (aura sight) and Iron (a refining you must survive)
  are earned at meditation shrines; Jade and Gold come from the story. Stage
  gaps are books-accurate — some fights mean *run*.
- **Remnants:** dreadbeasts die into scales, but a sacred artist's spirit
  tears free and fights on. Subdue a fresh Remnant intact (channel E) or
  break it for parts — either way the **cores** feed Soulsmithing.
- **Soulsmithing:** Fisher Gesha keeps a stall on the wilds road; cores +
  scales buy three permanent upgrades per save.
- **Three save slots** on the title screen; progress auto-saves.

`npm run check` runs the full headless harness suite (831 assertions:
unit checks for the damage/advancement/story/Soulsmith math, static
narrative-registry integrity incl. ending reachability, and smoke tests
that drive the real game — creation, Act 1, advancement, Remnant harvest,
and all three endings — through simulated input).

See `docs/ARCHITECTURE.md` for the module map and how to extend the game,
and `docs/lore-bible.md` for the canon reference the content is built on.

*Non-commercial fan work based on Will Wight's Cradle series; all original
setting elements belong to Will Wight / Hidden Gnome Publishing.*
