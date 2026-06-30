# MedievalCraft — a medieval texture pack for Minecraft: Java Edition

Everything in the world reskinned toward an aged, hand-built medieval look:
weathered ashlar and mortar, iron-banded oak doors, leaded glass, parchment
paper, forged tools, and ore veins picked out of rough stone. Textures stay at
vanilla **16×16** resolution so the pack is light and reads as authentic pixel
art, and the palette is tuned to keep every block recognisable (grass is still
green, lava still glows) while shifting the whole game toward a medieval mood.

## What's inside

**688 textures** across every category the player sees:

- **459 block textures** — every stone/brick variant, all wood families
  (oak → cherry, crimson, warped, bamboo) with logs/planks/doors/trapdoors/
  leaves/saplings, every ore (overworld + deepslate + nether), all 16 dye
  colours across wool, carpet, concrete, concrete powder, terracotta, glazed
  terracotta, stained glass and candles, crops with growth stages, flowers,
  plants, nether/end blocks, and functional blocks (furnace, crafting table,
  bookshelf, lantern, torch, barrel, anvil, bell…).
- **128 item textures** — the full tool set (wood→netherite ×
  pickaxe/axe/shovel/sword/hoe), all armour tiers, ingots/gems/nuggets, food,
  and utility items (bow, shield, bucket, compass, clock, map, and more).
- **10 animated textures** with proper `.mcmeta` frame-strips: **water**
  (still + flow), **lava** (still + flow), **fire** (both layers), the
  **nether portal**, **magma**, **sea lantern** and **prismarine**. These use
  smooth, seamlessly-looping sine fields (with `interpolate` on the liquids)
  so they flow rather than flicker.
- **39 particles** — flame, lava, smoke (12-frame big_smoke), bubbles,
  splashes, drips, hearts, notes, crit/enchant sparks, damage, flash and the
  `generic_0..7` dust puffs.
- **31 paintings** — every classic painting at its correct canvas size,
  restyled as medieval tapestries: heraldic shields, crenellated castle towers,
  trees of life, and sun-over-hills, all in wood-and-gold frames (plus the
  canvas `back`).
- **24 entity skins** — creeper, skeletons (incl. wither/stray), zombie/husk/
  drowned, villager + zombie villager, enderman, pig, cow, mooshroom, sheep
  (+ fur), chicken, wolf, squid, slime, magma cube, iron golem, bat, and the
  Steve/Alex player skins. Correctly sized and UV-region-aware (tunic /
  trousers / boots on humanoids; iconic faces on creeper and skeletons).
- **7 GUI textures** — parchment-and-carved-wood container panels (inventory,
  crafting table, furnace, chest) and stone menu backdrops.

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
so the whole set stays visually consistent and is trivial to extend:

- `tools/medieval_lib.py` — the drawing toolkit: seeded RNG plus primitives
  (`noise_fill`, `bricks`, `cobble`, `planks`, `log_rings`, `woven`,
  `metal_plate`, `ore`, weathering/moss/crack overlays, item silhouette helpers).
- `tools/generate.py` — the medieval palette and the registry mapping every
  block/item name to a draw function.
- `tools/generate_anim.py` — the animated liquids/fire/portal/glow blocks
  (seamless sine fields + `.mcmeta` writers).
- `tools/generate_extra.py` — particles, paintings, entities and GUI.
- `tools/build_all.py` — runs the three generators **in the correct order**
  (animations must overwrite the static liquid placeholders).

Regenerate everything with:

```bash
python3 -m pip install Pillow
python3 tools/build_all.py     # don't run generate.py alone afterwards —
                               # it would clobber the animated liquids
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

This pack now spans **all the texture families the player sees** — blocks,
items, animated liquids/fire, particles, paintings, entities and GUI (688
textures total). A few honest notes on depth:

- **Entities** are themed recolours tinted to the medieval palette with
  region-aware clothing and iconic faces — recognisable and correctly sized,
  but not bespoke hand-painted mob art. The helpers in `generate_extra.py`
  make detailing any single mob straightforward.
- **GUI** covers the high-impact container panels and menu backdrops. It does
  not retexture every individual HUD sprite (hearts, XP bar, etc.) — those are
  version-specific sprite atlases and are left vanilla so nothing breaks.
- Not every newly-added 1.21+ painting variant or niche particle is included,
  and block-entity models (chests, beds, banners, signs), the enchanting-table
  glyph runes, and the title-screen panorama are left vanilla.

Everything is procedural, so any missing texture can be added in a few lines
against the shared palette without breaking the visual style.
