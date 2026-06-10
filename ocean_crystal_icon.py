"""Generate a 128x128 pixel-art icon: deep blue ocean crystal (Minecraft item style).

An amethyst-inspired CLUSTER: three sharp shards growing from a rocky
crystal base. Each shard holds trapped seawater — a foam waterline with
dark glassy crystal above and glowing, swirling turquoise water below.
Drawn at 32x32 for authentic pixel density, then upscaled 4x with
nearest-neighbor so every pixel stays crisp. Transparent background.
"""

import math

from PIL import Image

SIZE = 32
SCALE = 4  # 32 * 4 = 128

# Depth ramp, deep -> bright
RAMP = [
    (14, 16, 58),     # 0 deepest indigo
    (24, 36, 102),    # 1 indigo
    (32, 62, 150),    # 2 deep sapphire
    (38, 96, 198),    # 3 sapphire
    (46, 140, 222),   # 4 ocean blue
    (66, 188, 228),   # 5 cyan
    (122, 228, 224),  # 6 turquoise foam
    (216, 252, 248),  # 7 sea-foam white
]
OUTLINE = (8, 10, 40)

# Shards as y -> (x0, x1) interior spans, drawn back-to-front so each
# keeps its own outline where they overlap (reads as a crystal cluster).
LEFT_SHARD = {
    8: (7, 7), 9: (7, 8), 10: (6, 8), 11: (6, 9), 12: (6, 9),
    13: (6, 10), 14: (7, 10), 15: (7, 10), 16: (7, 11), 17: (7, 11),
    18: (8, 11), 19: (8, 12), 20: (8, 12), 21: (8, 12), 22: (9, 12),
    23: (9, 13), 24: (9, 13),
}
RIGHT_SHARD = {
    5: (24, 24), 6: (23, 24), 7: (23, 25), 8: (23, 25), 9: (22, 25),
    10: (22, 25), 11: (22, 26), 12: (21, 26), 13: (21, 26), 14: (21, 26),
    15: (21, 25), 16: (20, 25), 17: (20, 25), 18: (20, 25), 19: (19, 25),
    20: (19, 24), 21: (19, 24), 22: (19, 24), 23: (18, 24), 24: (18, 23),
}
CENTER_SHARD = {
    2: (15, 15), 3: (15, 16), 4: (14, 16), 5: (14, 17), 6: (14, 17),
    7: (13, 17), 8: (13, 18), 9: (13, 18), 10: (12, 18), 11: (12, 18),
    12: (12, 19), 13: (12, 19), 14: (11, 19), 15: (11, 19), 16: (11, 19),
    17: (11, 20), 18: (11, 20), 19: (10, 20), 20: (10, 20), 21: (10, 20),
    22: (10, 20), 23: (10, 20), 24: (10, 20),
}
# Rocky crystal base the shards grow from (drawn in front, like a geode chunk)
BASE = {
    24: (7, 24), 25: (6, 25), 26: (7, 24), 27: (10, 21),
}

SHARD_RIDGES = {  # shard -> ridge x per row is center-ish; lit face is left
    "left": lambda y, x0, x1: (x0 + x1) // 2,
    "right": lambda y, x0, x1: (x0 + x1) // 2,
    "center": lambda y, x0, x1: (x0 + x1) // 2,
}


def waterline(x):
    """The trapped-ocean surface line, gently uneven like small waves."""
    return 14 + ((x // 3) % 2)


def shard_shade(x, y, x0, x1):
    """Dark glass above the waterline, glowing swirling seawater below."""
    ridge = (x0 + x1) // 2
    wl = waterline(x)
    if y < wl:
        # Glassy crystal: deep, calm, with a faint shimmer
        s = 1
        if math.sin(x * 1.3 + y * 0.7) > 0.82:
            s += 1
        floor = 1  # keep glass visible on dark inventory backgrounds
    elif y == wl:
        return 6  # foam crest along the waterline
    else:
        # Seawater: bright, with flowing current bands and an inner glow
        s = 3
        if math.sin(x * 0.8 - y * 0.6) > 0.35:
            s += 1
        if math.hypot(x - 15, (y - 20) * 1.2) < 3.2:
            s += 1
        floor = 2
    # Facets: left face catches light, right face falls dark
    if x < ridge:
        s += 1
    elif x > ridge + 1:
        s -= 1
    return max(floor, min(6, s))


# Sparkle glints near tips and bright facet streaks in the dark glass
GLINTS = {
    (15, 3): 7, (14, 6): 4, (14, 7): 4, (15, 10): 3,
    (24, 6): 7, (23, 9): 4, (22, 12): 3,
    (7, 9): 7, (7, 12): 4,
}
# Rising bubbles and bright swirl flecks in the water
BUBBLES = {
    (13, 17): 6, (18, 21): 6, (12, 21): 5, (16, 16): 6,
    (15, 23): 5, (23, 18): 6, (10, 19): 5, (21, 21): 5,
}
# A couple of fine fracture lines in the glass
CRACKS = [(16, 8), (13, 12), (24, 11)]
# Foam sparkles riding the waterline
FOAM = [(12, 14), (17, 14), (23, 15), (8, 15)]

AURA_NEAR = (70, 180, 225, 70)
AURA_FAR = (45, 110, 200, 32)
DRIPS = [(15, 0), (25, 2), (6, 5), (28, 13), (3, 16), (16, 30), (26, 27), (5, 26)]


def draw_layer(px, layer, prev_union):
    """Paint one shard/base with its own outline over what's behind it."""
    cells = {
        (x, y)
        for y, (x0, x1) in layer.items()
        for x in range(x0, x1 + 1)
    }
    for (x, y) in cells:
        edge = any(
            (x + dx, y + dy) not in cells
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        )
        if edge:
            px[x, y] = OUTLINE + (255,)
        else:
            x0, x1 = layer[y]
            px[x, y] = RAMP[shard_shade(x, y, x0, x1)] + (255,)
    prev_union |= cells
    return prev_union


def main():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    union = set()
    for layer in (LEFT_SHARD, RIGHT_SHARD, CENTER_SHARD):
        union = draw_layer(px, layer, union)

    # Rocky base: dark indigo crystal chunk with faint sapphire flecks
    base_cells = {
        (x, y)
        for y, (x0, x1) in BASE.items()
        for x in range(x0, x1 + 1)
    }
    for (x, y) in base_cells:
        edge = any(
            (x + dx, y + dy) not in base_cells
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        )
        if edge:
            px[x, y] = OUTLINE + (255,)
        else:
            s = 2 if (x + 2 * y) % 5 == 0 else 1
            px[x, y] = RAMP[s] + (255,)
    union |= base_cells

    # Detail overlays
    for (x, y), s in {**GLINTS, **BUBBLES}.items():
        if (x, y) in union:
            px[x, y] = RAMP[s] + (255,)
    for (x, y) in CRACKS:
        if (x, y) in union:
            px[x, y] = OUTLINE + (255,)
    for (x, y) in FOAM:
        if (x, y) in union:
            px[x, y] = RAMP[7] + (255,)

    # Subtle watery shimmer around the silhouette + drifting droplets
    def near(x, y, dist):
        return any(
            (x + dx, y + dy) in union
            for dx in range(-dist, dist + 1)
            for dy in range(-dist, dist + 1)
        )

    for y in range(SIZE):
        for x in range(SIZE):
            if (x, y) in union or px[x, y][3] != 0:
                continue
            if near(x, y, 1):
                px[x, y] = AURA_NEAR
            elif near(x, y, 2) and (x + y) % 2 == 0:
                px[x, y] = AURA_FAR
    for x, y in DRIPS:
        if (x, y) not in union:
            px[x, y] = AURA_NEAR

    img.save("ocean_crystal_32.png")
    img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save("ocean_crystal_128.png")
    print("wrote ocean_crystal_32.png and ocean_crystal_128.png")


if __name__ == "__main__":
    main()
