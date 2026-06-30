# MedievalCraft — a medieval texture pack for Minecraft: Java Edition

Everything in the world reskinned toward an aged, hand-built medieval look:
weathered ashlar and mortar, iron-banded oak doors, leaded glass, parchment
paper, forged tools, and ore veins picked out of rough stone. Textures stay at
vanilla **16×16** resolution so the pack is light and reads as authentic pixel
art, and the palette is tuned to keep every block recognisable (grass is still
green, lava still glows) while shifting the whole game toward a medieval mood.

## What's inside

- **455 block textures** and **128 item textures** — **583 total**.
- Full coverage of the common world: every stone/brick variant, all wood
  families (oak → cherry, crimson, warped, bamboo) with logs/planks/doors/
  trapdoors/leaves/saplings, every ore (overworld + deepslate + nether), all
  16 dye colours across wool, carpet, concrete, concrete powder, terracotta,
  glazed terracotta, stained glass and candles, crops with growth stages,
  flowers, plants, nether/end blocks, liquids, and functional blocks (furnace,
  crafting table, bookshelf, lantern, torch, barrel, anvil, bell…).
- Items: the full tool set (wood→netherite × pickaxe/axe/shovel/sword/hoe),
  all armour tiers, ingots/gems/nuggets, food, and utility items
  (bow, shield, bucket, compass, clock, map, and more).

## Install

1. Grab **`MedievalCraft.zip`** from this folder (or zip the `MedievalCraft`
   folder yourself — `pack.mcmeta` must sit at the zip root).
2. In Minecraft: **Options → Resource Packs → Open Pack Folder**.
3. Drop `MedievalCraft.zip` into that folder.
4. Back in-game, move MedievalCraft to the **Selected** column and hit **Done**.

`pack.mcmeta` declares `supported_formats` 15–99, so the pack loads across a
wide range of modern versions (roughly 1.20 onward) without editing.

## How it was made — and how to extend it

The textures aren't shipped as static art; they're **generated procedurally**
so the whole set stays visually consistent and is trivial to extend. Two files:

- `tools/medieval_lib.py` — the drawing toolkit: seeded RNG plus primitives
  (`noise_fill`, `bricks`, `cobble`, `planks`, `log_rings`, `woven`,
  `metal_plate`, `ore`, weathering/moss/crack overlays, item silhouette helpers).
- `tools/generate.py` — the medieval palette and the registry mapping every
  texture name to a draw function.

Regenerate everything with:

```bash
python3 -m pip install Pillow
python3 tools/generate.py
```

To add or restyle a texture, register it in `generate.py`:

```python
@block("my_new_block")
def _(img, r):
    noise_fill(img, r, (120, 116, 110))
    moss(img, r, 0.15)
```

Re-run the generator and re-zip. Because every block keys off the shared
palette and primitives, new textures automatically match the rest of the pack.

## Scope & honesty

Vanilla ships well over a thousand textures (entity skins, GUI sprites,
particles, paintings, every block-state permutation). This pack covers the
**583 blocks and items you actually see placed in the world and held in hand** —
the set that defines the game's look. The procedural generator is built so any
texture not yet covered can be added in a few lines without breaking the
visual style. It does **not** retexture entity mobs, GUI screens, or paintings.
