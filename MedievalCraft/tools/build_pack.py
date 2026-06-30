#!/usr/bin/env python3
"""
build_pack.py — build the COMPLETE MedievalCraft pack from the authoritative
vanilla texture manifest.

It walks every texture in a vanilla 1.21.x asset tree and writes a medieval
counterpart for each, so the pack mirrors the game's entire texture set
(blocks, items, every entity, particles, paintings, the full GUI/HUD sprite
set, mob-effect icons, map markers, armour trims, environment…). Two paths:

  * bespoke procedural art for the most-seen blocks & items (handcrafted
    masonry, iron-banded woodwork, forged tools — from generate.py); and
  * the medievalize() aging filter for everything else, which preserves each
    vanilla texture's shape, alpha, animation frames and 9-slice GUI metadata
    while recolouring it to the aged palette.

`.mcmeta` files (animation timing + GUI nine-slice) are copied verbatim so
animated liquids/fire and stretchable GUI panels render correctly.

Reference tree (not redistributed — only read to mirror the file list and
sizes) is obtained from the `minecraft-assets` npm package:

    npm pack minecraft-assets && tar xzf minecraft-assets-*.tgz
    python3 tools/build_pack.py path/to/package/minecraft-assets/data/1.21.8

Usage:
    python3 tools/build_pack.py <vanilla_asset_dir>
"""
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "minecraft", "textures")

from PIL import Image  # noqa: E402
import generate  # noqa: E402  (decorators populate generate.BLOCKS / generate.ITEMS on import)
from medieval_lib import Rng, canvas, outline  # noqa: E402
from medievalize import medievalize, is_tinted  # noqa: E402

# vanilla top-level dirs we deliberately leave untouched (vanilla fallback):
#   colormap — biome tint maps; recolouring them would skew every grass/leaf
#   font     — UI text; keep crisp & readable
SKIP_TOP = {"colormap", "font"}
# minecraft-assets renames these two; everything else already matches vanilla
REMAP = {"blocks": "block", "items": "item"}


def find_ref():
    if len(sys.argv) > 1:
        return sys.argv[1]
    # fall back to the npm package if it was unpacked next to the repo
    for base in (os.path.join(ROOT, "..", "scratchpad"), ROOT, "."):
        for root, dirs, files in os.walk(base):
            if root.replace("\\", "/").endswith("minecraft-assets/data") and dirs:
                ver = sorted([d for d in dirs if d[0].isdigit()],
                             key=lambda s: [int(p) for p in s.split(".")])[-1]
                return os.path.join(root, ver)
    raise SystemExit("Pass the vanilla asset dir, e.g. .../minecraft-assets/data/1.21.8")


def bespoke(out_top, name, ref_size):
    """Return bespoke art if we have a generator and the size matches, else None."""
    if ref_size != (16, 16):
        return None
    if out_top == "block" and name in generate.BLOCKS:
        im = canvas()
        generate.BLOCKS[name](im, Rng("block:" + name))
        return im
    if out_top == "item" and name in generate.ITEMS:
        im = canvas()
        generate.ITEMS[name](im, Rng("item:" + name))
        return outline(im)
    return None


def main():
    ref = find_ref()
    print(f"Reference: {ref}")
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)        # rebuild clean so the pack mirrors vanilla exactly
    os.makedirs(OUT, exist_ok=True)

    n_bespoke = n_filter = n_meta = n_skip = 0
    for root, _dirs, files in os.walk(ref):
        for fn in files:
            if not fn.endswith(".png"):
                continue
            src = os.path.join(root, fn)
            rel = os.path.relpath(src, ref).replace("\\", "/")
            segs = rel.split("/")
            if segs[0] in SKIP_TOP:
                n_skip += 1
                continue
            out_top = REMAP.get(segs[0], segs[0])
            out_rel = "/".join([out_top] + segs[1:])
            dst = os.path.join(OUT, out_rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)

            with Image.open(src) as im:
                size = im.size
                im.load()
                has_meta = os.path.exists(src + ".mcmeta")
                name = fn[:-4]
                art = None
                if not has_meta:  # animated / 9-sliced sprites must keep vanilla layout
                    art = bespoke(out_top, name, size)
                if art is not None:
                    n_bespoke += 1
                else:
                    art = medievalize(im, gentle=is_tinted(rel))
                    n_filter += 1
                art.save(dst)

            if has_meta:
                shutil.copyfile(src + ".mcmeta", dst + ".mcmeta")
                n_meta += 1

    print(f"bespoke art:   {n_bespoke}")
    print(f"medievalized:  {n_filter}")
    print(f"mcmeta copied: {n_meta}")
    print(f"skipped (colormap/font): {n_skip}")
    print(f"TOTAL textures: {n_bespoke + n_filter}")


if __name__ == "__main__":
    main()
