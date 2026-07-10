# PORTAL — Browser Clone

An unofficial, from-scratch homage to Valve's *Portal*, built as a single-page
browser game with [Three.js](https://threejs.org). No game assets are used —
all geometry, textures, sounds and dialogue are procedurally generated or
originally written for this project.

## Play

Serve the folder and open it in a browser (pointer lock needs http(s), not `file://`):

```bash
cd portal
python3 -m http.server 8000
# open http://localhost:8000
```

Or open `dist/portal.html` — a self-contained single-file build.

## Features

- **Real portals** — shoot linked blue/orange portals onto white panels; walk,
  fall or throw objects through them. The view through each portal is rendered
  live (render-to-texture with oblique near-plane clipping), and portals show
  each other for an infinite-corridor effect.
- **Momentum is conserved** — what goes in fast comes out fast. Chamber 03 is
  a classic drop-fling across a hazard pit.
- **Weighted storage cubes** — pick up (`E`), carry, throw (`click`), stack on
  buttons; cubes ride through portals, block turret line-of-sight, and get
  dissolved by emancipation grills.
- **Floor buttons & doors** — momentary buttons wired to sliding doors.
- **Toxic goo** — touch it and the facility restores you from backup.
- **Sentry turrets** — they spot you, lock on, and open fire; tip them over or
  hide behind a cube. They cannot see through portals. They can be flanked
  through them.
- **Emancipation grills** — shimmering fields at chamber exits that clear your
  portals and fizzle any equipment you try to smuggle out.
- **Repulsion gel** — blue-coated floors bounce you higher with every landing.
- **Propulsion gel** — orange strips let you sprint fast enough to clear gaps.
- **Aerial faith plates** — step on one and it donates its enthusiasm to your
  trajectory.
- **Hard light bridges** — glowing walkable planes, wired to buttons.
- **Thermal beams** — lasers that pass through your portals; redirect them
  into receivers to power doors (and, eventually, to ruin an AI's day).
- **A story campaign in 18 chambers** — eleven official test chambers, a
  betrayal involving dessert, and an escape through the facility's disposal
  pit, service catwalks, storage, and transit spine to a final confrontation
  with the Overseer's core.
- **Facility announcer** — original passive-aggressive lab-AI narration with
  subtitles and browser text-to-speech.
- **Synthesized audio** — every sound effect is generated with WebAudio.

## Controls

| Input | Action |
|---|---|
| `WASD` + mouse | move / look |
| Left click | blue portal (or throw carried object) |
| Right click | orange portal |
| `E` | pick up / drop |
| `Space` | jump |
| `Esc` | pause |

## Code layout

```
index.html      shell + HUD + menus
lib/three.min.js  Three.js r147 (MIT), vendored
js/util.js      procedural textures, materials, helpers
js/audio.js     WebAudio-synthesized SFX
js/voice.js     announcer subtitle queue + TTS (original writing)
js/physics.js   AABB collision world with portal holes
js/objects.js   cubes, buttons, doors, goo, grills, turrets, elevators
js/portals.js   portal placement, rendering, teleportation
js/player.js    first-person controller, carrying, health
js/levels.js    the six test chambers
js/game.js      bootstrap, game loop, input, HUD, level flow
tools/build_standalone.py  produces dist/portal.html
```

*This is a fan homage for educational purposes; it uses no assets, code, or
text from the original game. Portal is a trademark of Valve Corporation.*
