"""
medievalize.py — the medieval colour grade applied to vanilla reference
textures. Preserves shape and alpha (so animations, UV maps and 9-slice GUI
sprites stay valid) while pushing colour toward a warm, torch-lit, heraldic
medieval look.

This is a RICH grade, not a desaturating sepia wash: colours stay vivid, the
white balance goes warm/amber, contrast deepens for moody depth, and shadows
pick up a torch-glow warmth. No grain.

`gentle=True` is used for biome-tinted textures (grass, leaves, water…) which
vanilla keeps near-greyscale and tints at runtime — we touch those at half
strength so the colormap still reads.
"""
import numpy as np
from PIL import Image

_LUM = np.array([0.299, 0.587, 0.114], dtype=np.float32)
_WARM_SHADOW = np.array([42, 24, 8], dtype=np.float32)   # amber torch-glow in darks


def medievalize(im, strength=1.0, gentle=False):
    s = strength * (0.5 if gentle else 1.0)
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3:4]

    lum = (rgb @ _LUM)[..., None]

    # keep colour vivid (slight boost, NOT a desaturation)
    rgb = lum + (rgb - lum) * (1.0 + 0.10 * s)

    # deepen contrast for moody, candle-lit depth
    rgb = (rgb - 120.0) * (1.0 + 0.16 * s) + 120.0

    # warm white balance (lift reds, drop blues -> torchlight / parchment)
    rgb = rgb * np.array([1.0 + 0.10 * s, 1.0, 1.0 - 0.14 * s], dtype=np.float32)

    # torch-glow warmth pooling in the shadows
    t = np.clip(lum / 255.0, 0.0, 1.0)
    rgb = rgb + _WARM_SHADOW * (1.0 - t) * (0.16 * s)

    rgb = np.clip(rgb, 0, 255)
    out = np.concatenate([rgb, a], axis=-1).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# texture-name fragments that are biome-tinted in vanilla (grade gently)
TINTED = (
    "grass_block_top", "grass_block_side_overlay", "short_grass", "tall_grass",
    "fern", "large_fern", "_leaves", "vine", "lily_pad", "water_",
    "sugar_cane", "attached_melon_stem", "attached_pumpkin_stem", "melon_stem",
    "pumpkin_stem", "redstone_dust", "spruce_leaves", "birch_leaves",
    "grass", "pink_petals", "pitcher_crop", "glow_lichen", "waterlily",
)


def is_tinted(rel_path):
    p = rel_path.replace("\\", "/")
    name = p.rsplit("/", 1)[-1]
    return any(frag in name for frag in TINTED)
