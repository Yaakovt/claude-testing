"""Generate a 128x128 pixel-art icon: air crystal of mystic topaz (Minecraft style).

A slender double-pointed gem floating with small detached shards — no
base, weightless. Iridescent diagonal bands of cyan, lavender, and pink
shift across the facets like mystic topaz, with gold hints, and a wispy
white wind-stream swirls through the interior. Drawn at 32x32 for
authentic pixel density, then upscaled 4x with nearest-neighbor so every
pixel stays crisp. Transparent background.
"""

import math

from PIL import Image

SIZE = 32
SCALE = 4  # 32 * 4 = 128

# Iridescent ramps (dark -> light), chosen per diagonal hue band
CYAN = [(40, 90, 150), (80, 150, 200), (130, 200, 230), (185, 235, 242), (238, 252, 252)]
LAVENDER = [(90, 70, 150), (140, 110, 200), (180, 150, 225), (216, 192, 242), (246, 238, 252)]
PINK = [(150, 70, 130), (200, 110, 170), (230, 150, 200), (245, 196, 226), (252, 238, 246)]
BANDS = [CYAN, LAVENDER, CYAN, PINK, CYAN, LAVENDER]
OUTLINE = (48, 44, 96)
WISP = (250, 252, 255)
PALE = (190, 235, 245)

# Main gem: slender bipyramid, sharp at BOTH ends (floating, not grounded),
# with small barbs at the girdle for jagged elegance. y -> (x0, x1).
MAIN = {
    2: (16, 16), 3: (15, 16), 4: (15, 17), 5: (14, 17), 6: (14, 18),
    7: (14, 18), 8: (13, 18), 9: (13, 19), 10: (13, 19), 11: (12, 19),
    12: (12, 20), 13: (12, 21), 14: (11, 20), 15: (10, 21), 16: (11, 21),
    17: (12, 20), 18: (12, 20), 19: (12, 20), 20: (13, 19), 21: (13, 19),
    22: (13, 18), 23: (14, 18), 24: (14, 17), 25: (14, 17), 26: (15, 16),
    27: (15, 16), 28: (16, 16),
}
# Detached shards drifting around the gem (the weightless part)
LEFT_SHARD = {9: (7, 7), 10: (6, 7), 11: (6, 8), 12: (5, 7), 13: (5, 7), 14: (6, 7), 15: (6, 6)}
RIGHT_SHARD = {13: (25, 25), 14: (24, 26), 15: (24, 26), 16: (23, 25), 17: (24, 25), 18: (24, 24)}
TOP_FLECK = {4: (23, 23), 5: (22, 23), 6: (23, 23)}
LOW_FLECK = {23: (8, 8), 24: (8, 9), 25: (9, 9)}


def shade_at(x, y, x0, x1):
    """Brightness from an inner heart-glow plus facet lighting."""
    ridge = (x0 + x1) // 2
    s = 2
    d = math.hypot(x - 16, (y - 15) * 1.1)
    if d < 1.6:
        s += 2
    elif d < 3.5:
        s += 1
    if x < ridge:
        s += 1
    elif x > ridge + 1:
        s -= 1
    return max(0, min(4, s))


def color_at(x, y, x0, x1):
    """Mystic-topaz iridescence: hue shifts in diagonal bands."""
    band = BANDS[((x + 2 * y) // 6) % len(BANDS)]
    return band[shade_at(x, y, x0, x1)]


# Wind trapped inside: a serpentine wisp stream with a curl at the heart
WIND = {
    (15, 8): WISP, (16, 9): PALE, (17, 10): WISP, (17, 11): PALE,
    (16, 12): WISP, (15, 13): PALE, (14, 14): WISP, (14, 15): PALE,
    (15, 16): WISP, (16, 17): PALE, (17, 18): WISP, (17, 19): PALE,
    (16, 20): WISP, (15, 21): PALE,
    (18, 13): PALE, (19, 14): WISP, (18, 15): PALE,  # curl
    (13, 11): PALE, (12, 16): PALE, (18, 21): PALE, (13, 18): PALE,  # mist
}
# Hints of gold catching the light
GOLD_PX = {
    (16, 15): (255, 248, 210), (19, 16): (255, 232, 156),
    (15, 5): (250, 220, 140), (14, 22): (240, 202, 124),
}
# White sparkle glints on points and facets
GLINTS = [
    (16, 3), (21, 13), (10, 15), (16, 27),
    (7, 9), (25, 13), (23, 4), (8, 23),
]

AURA = (205, 238, 252, 62)
SPARKLE = (255, 255, 255, 95)
# Little wind-line dashes streaking past the gem
STREAKS = [
    [(21, 6), (22, 6), (23, 6)],
    [(3, 12), (4, 12), (5, 12)],
    [(26, 20), (27, 20), (28, 20)],
    [(5, 25), (6, 25), (7, 25)],
    [(23, 27), (24, 27)],
]
MOTES = [(16, 0), (27, 9), (2, 19), (29, 15), (16, 30), (10, 2), (22, 23), (4, 6)]


def draw_layer(px, layer, union):
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
            px[x, y] = color_at(x, y, x0, x1) + (255,)
    return union | cells


def main():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    union = set()
    for layer in (LEFT_SHARD, RIGHT_SHARD, TOP_FLECK, LOW_FLECK, MAIN):
        union = draw_layer(px, layer, union)

    # Inner wind, gold hints, and sparkle glints
    for (x, y), c in {**WIND, **GOLD_PX}.items():
        if (x, y) in union:
            px[x, y] = c + (255,)
    for (x, y) in GLINTS:
        if (x, y) in union:
            px[x, y] = (255, 255, 255, 255)

    # Airy shimmer: faint checkerboard halo, wind streaks, drifting motes
    def near(x, y):
        return any(
            (x + dx, y + dy) in union
            for dx in (-1, 0, 1)
            for dy in (-1, 0, 1)
        )

    for y in range(SIZE):
        for x in range(SIZE):
            if (x, y) not in union and px[x, y][3] == 0 and near(x, y) and (x + y) % 2 == 0:
                px[x, y] = AURA
    for streak in STREAKS:
        for (x, y) in streak:
            if (x, y) not in union:
                px[x, y] = AURA[:3] + (88,)
    for (x, y) in MOTES:
        if (x, y) not in union:
            px[x, y] = SPARKLE

    img.save("air_crystal_32.png")
    img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save("air_crystal_128.png")
    print("wrote air_crystal_32.png and air_crystal_128.png")


if __name__ == "__main__":
    main()
