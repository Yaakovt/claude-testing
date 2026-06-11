# Plume Knight

A Hollow-Knight-style 2D sidescroller platformer that runs entirely in the browser.
You play a medieval knight in steel armor with a sword, a flowing cape, and a
helmet topped with a red plume (and mouth holes for breathing, naturally).

## How to play

Just open `index.html` in any modern browser — no build step, no dependencies.

```
cd knight-game
python3 -m http.server 8000   # or just double-click index.html
# then open http://localhost:8000
```

## Controls

| Key | Action |
| --- | --- |
| A / D or ← / → | Run |
| W or ↑ | Jump (press again in the air to double jump — costs stamina, 4/5 height, smoke trail) |
| Space | Dash |
| Z or J | Basic slash (short cooldown, small stamina cost) |
| X or K | Spin attack — hits everything around you, hovers in mid-air (more stamina, longer cooldown) |
| C or L | Weapon special move (big stamina, big cooldown) |
| Shift | Hold to block with the Tower Shield (must be purchased) |
| H | Throw dynamite (must be purchased) |
| Esc | Pause / leave showcase |

## Features

- **Sword-shaped health bar** — turns green when poisoned, blue when frozen.
- **Round-jar stamina meter** filled with sloshing blue liquid; refills passively.
- **12 monster types** that get stronger as you go: slimes, big slimes that split,
  four-armed archers with two bows, poisonous giant wasps, vanishing ghosts,
  falling stalactites, stone-hurling ogres, flame mages with growing AOE auras,
  hammer knights, witches (slowness / backfire / blindness hexes), and the Frost
  Core — an orbiting-ice monster that can freeze you solid for 1.87s, leaving an
  ice block you can stand on or shatter to slow nearby enemies.
- **Randomly generated levels** (always traversable). Dying sends you back to the
  start of the *same* level and you lose the gold earned in it.
- **Upgrades** after each level (pick 1 of 2 from a pool of 12) plus a **shop**:
  potions, six charms, dynamite, a shield, and three purchasable weapons
  (Warhammer, Greataxe, Longbow) each with its own special move and mastery upgrade.
- **Normal mode**: 25 levels, then a three-phase dragon (fire → poison + summons →
  frost + more summons). **Infinite mode**: keep going forever, fight the dragon
  whenever you feel ready.
- **Monster showcase**: inspect any monster (including the dragon) in an arena.
- **Two art styles** — pixel art or smooth — switchable in Settings.
- Procedural dungeon music & sound effects, stone-brick background with torches.

## Development

`smoke_test.js` is a headless test harness that stubs the DOM/canvas and drives
the game loop through every major system (combat, freeze, specials, death,
dragon, showcase, both renderers):

```
node smoke_test.js
```
