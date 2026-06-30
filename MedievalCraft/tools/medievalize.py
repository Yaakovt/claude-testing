"""
medievalize.py — the medieval "aging" filter applied to vanilla reference
textures. Preserves shape and alpha (so animations, UV maps and 9-slice GUI
sprites stay valid) while remapping colour toward an aged, weathered,
parchment-and-iron palette.

The transform:
  * partial desaturation (hand-mixed-pigment feel)
  * luminance-keyed sepia ramp blended in (warms shadows, parchments highlights)
  * a gentle warm multiply
  * light posterize-style contrast (painted, not photographic)
  * faint deterministic grain (age / canvas texture)

`gentle=True` is used for biome-tinted textures (grass, leaves, water…) which
vanilla keeps near-greyscale and tints at runtime — we touch those lightly so
the colormap still reads.
"""
import numpy as np
from PIL import Image

_LUM = np.array([0.299, 0.587, 0.114], dtype=np.float32)
_DARK = np.array([46, 34, 24], dtype=np.float32)       # aged shadow
_LIGHT = np.array([234, 222, 192], dtype=np.float32)    # parchment highlight
_WARM = np.array([1.06, 1.00, 0.86], dtype=np.float32)  # candle-warm tint


def medievalize(im, strength=1.0, gentle=False):
    if gentle:
        strength *= 0.45
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb = arr[..., :3]
    a = arr[..., 3:4]

    lum = (rgb @ _LUM)[..., None]

    # desaturate
    sat = 1.0 - 0.50 * strength
    rgb = lum + (rgb - lum) * sat

    # sepia ramp keyed on luminance
    t = lum / 255.0
    sepia = _DARK + (_LIGHT - _DARK) * t
    blend = (0.18 if gentle else 0.35) * strength
    rgb = rgb * (1 - blend) + sepia * blend

    # warm multiply (skip most of it when gentle, to keep tint maps neutral)
    warm = _WARM if not gentle else (1 + (_WARM - 1) * 0.3)
    rgb = rgb * warm

    # painted contrast
    rgb = (rgb - 128) * (1 + 0.06 * strength) + 128

    # faint deterministic grain
    rng = np.random.default_rng(1234)
    grain = rng.normal(0.0, 5.0 * strength, size=lum.shape).astype(np.float32)
    rgb = rgb + grain

    rgb = np.clip(rgb, 0, 255)
    out = np.concatenate([rgb, a], axis=-1).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# texture-name fragments that are biome-tinted in vanilla (filter gently)
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
