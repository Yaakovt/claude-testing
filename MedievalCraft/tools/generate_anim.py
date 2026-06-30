#!/usr/bin/env python3
"""
generate_anim.py — animated block textures (water, lava, fire, portal, magma,
sea lantern, prismarine) as vertical frame strips + .mcmeta animation files.

Animations use smooth, seamlessly-looping sine fields (no per-pixel flicker)
and `interpolate` where it helps, so the motion reads as flowing liquid / fire
rather than random noise.

Run:  python3 tools/generate_anim.py
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BLOCK = os.path.join(ROOT, "assets", "minecraft", "textures", "block")
from PIL import Image  # noqa: E402


def clamp(v):
    return 0 if v < 0 else 255 if v > 255 else int(v)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(clamp(a[i] * (1 - t) + b[i] * t) for i in range(3))


def ramp(stops, v):
    """v in [0,1] mapped across a list of colour stops."""
    if v <= 0:
        return stops[0]
    if v >= 1:
        return stops[-1]
    seg = v * (len(stops) - 1)
    i = int(seg)
    return mix(stops[i], stops[i + 1], seg - i)


def write_anim(name, width, n_frames, frametime, fn, interpolate=False):
    """fn(x, y, f, n) -> (r,g,b). Stacks n_frames vertically."""
    strip = Image.new("RGBA", (width, width * n_frames), (0, 0, 0, 0))
    for f in range(n_frames):
        for y in range(width):
            for x in range(width):
                c = fn(x, y, f, n_frames)
                strip.putpixel((x, f * width + y), (c[0], c[1], c[2], 255))
    strip.save(os.path.join(BLOCK, name + ".png"))
    meta = {"animation": {"frametime": frametime}}
    if interpolate:
        meta["animation"]["interpolate"] = True
    with open(os.path.join(BLOCK, name + ".png.mcmeta"), "w") as fh:
        json.dump(meta, fh, indent=2)


# --------------------------------------------------------------------------
# palettes
# --------------------------------------------------------------------------
WATER = [(30, 56, 120), (44, 82, 168), (78, 124, 200), (132, 170, 220)]
LAVA = [(70, 18, 8), (150, 40, 12), (220, 110, 24), (255, 200, 70)]
FIRE = [(110, 26, 10), (220, 90, 20), (255, 168, 40), (255, 232, 140)]
PORTAL = [(30, 8, 50), (78, 28, 120), (140, 70, 190), (200, 150, 230)]
MAGMA = [(48, 24, 20), (110, 40, 20), (230, 120, 36), (255, 200, 90)]


# --------------------------------------------------------------------------
# fields (all loop seamlessly: temporal terms use integer cycle counts)
# --------------------------------------------------------------------------
def water_field(x, y, f, n, w=16):
    t = f / n
    v = (math.sin(2 * math.pi * (x / w * 1 + y / w * 2 + t)) +
         0.6 * math.sin(2 * math.pi * (x / w * 2 - y / w * 1 - t)) +
         0.4 * math.sin(2 * math.pi * ((x + y) / w * 1 + 2 * t)))
    v = v / 2.0 * 0.5 + 0.5
    return ramp(WATER, v)


def water_flow_field(x, y, f, n, w=16):
    t = f / n
    v = (math.sin(2 * math.pi * (y / w * 3 - 3 * t + 0.25 * math.sin(2 * math.pi * x / w * 2))) +
         0.5 * math.sin(2 * math.pi * (y / w * 6 - 6 * t)))
    v = v / 1.5 * 0.5 + 0.5
    return ramp(WATER, v)


def lava_field(x, y, f, n, w=16):
    t = f / n
    v = (math.sin(2 * math.pi * (x / w * 1 + 0.5 * t)) +
         math.sin(2 * math.pi * (y / w * 1 - 0.5 * t)) +
         0.6 * math.sin(2 * math.pi * ((x * x + y * y) / (w * w) * 1.5 + t)))
    v = v / 2.6 * 0.5 + 0.5
    # crust: clamp the dark end into a near-black solid
    if v < 0.28:
        return mix((26, 12, 8), LAVA[0], v / 0.28)
    return ramp(LAVA, v)


def lava_flow_field(x, y, f, n, w=16):
    t = f / n
    v = (math.sin(2 * math.pi * (y / w * 2 - 2 * t + 0.3 * math.sin(2 * math.pi * x / w))) +
         0.5 * math.sin(2 * math.pi * (y / w * 4 - 4 * t)))
    v = v / 1.5 * 0.5 + 0.5
    return ramp(LAVA, v)


def fire_field(x, y, f, n, w=16, layer=0):
    t = f / n
    # flame tongues rising: brightness rises toward the bottom, flickers upward
    rise = 1.0 - y / w
    flick = 0.5 * math.sin(2 * math.pi * (y / w * 2 - 2 * t + x / w * (1 + layer)))
    edge = 0.4 * math.sin(2 * math.pi * (x / w * 2 + 3 * t))
    v = rise + flick * (y / w) + edge * 0.3
    v = max(0.0, min(1.0, v))
    if v < 0.18:
        return None  # transparent
    return ramp(FIRE, v)


def portal_field(x, y, f, n, w=16):
    t = f / n
    v = (math.sin(2 * math.pi * ((x + y) / w * 2 - 2 * t)) +
         0.7 * math.sin(2 * math.pi * ((x - y) / w * 2 + 2 * t)) +
         0.5 * math.sin(2 * math.pi * (x / w * 3 + 3 * t)))
    v = v / 2.2 * 0.5 + 0.5
    return ramp(PORTAL, v)


def magma_field(x, y, f, n, w=16):
    t = f / n
    # slow pulsing glow seeping through a dark crust
    cell = math.sin(2 * math.pi * (x / w * 2)) * math.sin(2 * math.pi * (y / w * 2))
    glow = 0.5 + 0.5 * math.sin(2 * math.pi * (t + (x + y) / w))
    v = (cell * 0.5 + 0.5) * 0.5 + glow * 0.5
    if v < 0.45:
        return mix((40, 20, 16), MAGMA[1], v / 0.45)
    return ramp(MAGMA, (v - 0.45) / 0.55)


def sealantern_field(x, y, f, n, w=16):
    t = f / n
    base = (150, 178, 172)
    glow = 0.5 + 0.5 * math.sin(2 * math.pi * (t + (x // 4 + y // 4) / 4))
    cell = ((x // 4) + (y // 4)) % 2
    c = mix(base, (230, 245, 240), glow * (0.6 if cell else 0.3))
    return c


def prismarine_field(x, y, f, n, w=16):
    t = f / n
    base = (70, 120, 112)
    shimmer = 0.5 + 0.5 * math.sin(2 * math.pi * (t + (x + y) / w))
    return mix(base, (120, 170, 158), shimmer * 0.4 + 0.1 * math.sin(2 * math.pi * (x / w * 2 - t)))


# --------------------------------------------------------------------------
# nether portal needs alpha (translucent), fire needs alpha — handle specially
# --------------------------------------------------------------------------
def write_alpha_anim(name, width, n_frames, frametime, fn, alpha=255, interpolate=False):
    strip = Image.new("RGBA", (width, width * n_frames), (0, 0, 0, 0))
    for f in range(n_frames):
        for y in range(width):
            for x in range(width):
                c = fn(x, y, f, n_frames)
                if c is None:
                    continue
                strip.putpixel((x, f * width + y), (c[0], c[1], c[2], alpha))
    strip.save(os.path.join(BLOCK, name + ".png"))
    meta = {"animation": {"frametime": frametime}}
    if interpolate:
        meta["animation"]["interpolate"] = True
    with open(os.path.join(BLOCK, name + ".png.mcmeta"), "w") as fh:
        json.dump(meta, fh, indent=2)


if __name__ == "__main__":
    os.makedirs(BLOCK, exist_ok=True)
    # liquids — interpolate for buttery motion with few frames
    write_anim("water_still", 16, 16, 2, water_field, interpolate=True)
    write_anim("water_flow", 16, 16, 1, water_flow_field, interpolate=True)
    write_anim("lava_still", 16, 16, 4, lava_field, interpolate=True)
    write_anim("lava_flow", 16, 16, 2, lava_flow_field, interpolate=True)
    # fire (two layers, transparent background)
    write_alpha_anim("fire_0", 16, 24, 1, lambda x, y, f, n: fire_field(x, y, f, n, layer=0))
    write_alpha_anim("fire_1", 16, 24, 1, lambda x, y, f, n: fire_field(x, y, f, n, layer=1))
    # nether portal — translucent swirl
    write_alpha_anim("nether_portal", 16, 24, 1, portal_field, alpha=200, interpolate=True)
    # glowing blocks
    write_anim("magma", 16, 16, 6, magma_field, interpolate=True)
    write_anim("sea_lantern", 16, 8, 6, sealantern_field, interpolate=True)
    write_anim("prismarine", 16, 12, 6, prismarine_field, interpolate=True)
    print("Animated: water(still/flow), lava(still/flow), fire_0/1, nether_portal, "
          "magma, sea_lantern, prismarine")
