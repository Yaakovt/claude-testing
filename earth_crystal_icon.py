"""Generate a 128x128 pixel-art icon: brown earth crystal (Minecraft item style).

A wide, heavy quartz-like boulder gem with jagged points on top — built
from horizontal sediment strata, glowing golden veins of earth energy,
tiny dark roots, and mossy clay accents. Drawn at 32x32 for authentic
pixel density, then upscaled 4x with nearest-neighbor so every pixel
stays crisp. Transparent background.
"""

from PIL import Image

SIZE = 32
SCALE = 4  # 32 * 4 = 128

# Earth ramp, deep -> pale
RAMP = [
    (50, 32, 20),     # 0 deep umber
    (74, 48, 28),     # 1 dark brown
    (104, 68, 38),    # 2 brown
    (134, 92, 50),    # 3 clay
    (166, 120, 68),   # 4 tan
    (200, 156, 96),   # 5 sand
    (228, 194, 132),  # 6 beige
    (250, 232, 176),  # 7 pale gold
]
OUTLINE = (32, 20, 12)
GOLD = (255, 204, 84)
GOLD_BRIGHT = (255, 238, 156)
MOSS_LIGHT = (126, 148, 66)
MOSS_DARK = (88, 110, 48)

# Silhouette as y -> list of (x0, x1) interior segments. A squat boulder
# gem, widest low down, with three uneven points and crevices on top.
ROWS = {
    3: [(17, 17)],
    4: [(16, 17)],
    5: [(9, 9), (16, 18)],
    6: [(8, 9), (15, 18)],
    7: [(8, 10), (15, 19)],
    8: [(8, 10), (14, 19), (24, 24)],
    9: [(7, 11), (14, 20), (23, 24)],
    10: [(7, 11), (13, 20), (23, 25)],
    11: [(7, 12), (13, 21), (22, 25)],
    12: [(6, 11), (13, 21), (22, 25)],
    13: [(6, 12), (14, 22), (23, 26)],
    14: [(6, 26)],
    15: [(5, 26)],
    16: [(5, 27)],
    17: [(5, 27)],
    18: [(4, 27)],
    19: [(4, 27)],
    20: [(4, 27)],
    21: [(5, 27)],
    22: [(5, 27)],
    23: [(5, 26)],
    24: [(6, 26)],
    25: [(8, 25)],
    26: [(10, 24)],
    27: [(13, 22)],
    28: [(16, 19)],
}

# Sediment strata: base shade per row (wobbled by x so the layers wave)
STRATA = {
    3: 3, 4: 3, 5: 3, 6: 3, 7: 2, 8: 2, 9: 2, 10: 3, 11: 3, 12: 3,
    13: 4, 14: 4, 15: 4, 16: 5, 17: 5, 18: 5, 19: 3, 20: 3,
    21: 2, 22: 2, 23: 2, 24: 1, 25: 1, 26: 1, 27: 1, 28: 1,
}


def shade_at(x, y):
    wob = 1 if (x // 5) % 2 else 0
    s = STRATA.get(max(3, y - wob), 1)
    # Light from the upper left: lit west face, shadowed east face
    if x <= 11:
        s += 1
    elif x >= 22:
        s -= 1
    # Dark facet seams so the chunk reads as cut crystal, not a boulder
    if x == 13 and 14 <= y <= 26:
        s -= 2
    if x == 21 and 15 <= y <= 24:
        s -= 1
    return max(0, min(7, s))


# Glowing veins of earth energy rising from the deep (gold, hand-placed)
VEINS = {
    (16, 25): GOLD, (15, 24): GOLD, (16, 23): GOLD_BRIGHT, (16, 22): GOLD,
    (17, 21): GOLD, (16, 20): GOLD_BRIGHT, (15, 19): GOLD, (16, 18): GOLD,
    (16, 17): GOLD_BRIGHT, (17, 16): GOLD, (16, 15): GOLD, (17, 14): GOLD_BRIGHT,
    (17, 13): GOLD, (16, 12): GOLD, (17, 11): GOLD,
    (14, 19): GOLD, (13, 18): GOLD_BRIGHT, (12, 18): GOLD, (11, 17): GOLD,
    (10, 16): GOLD,
    (18, 17): GOLD, (19, 16): GOLD, (20, 16): GOLD_BRIGHT, (21, 15): GOLD,
    (22, 14): GOLD,
    # Subtle glowing cracks near the edges
    (6, 18): GOLD, (5, 19): GOLD, (26, 16): GOLD, (20, 23): GOLD,
    (21, 22): GOLD_BRIGHT, (9, 22): GOLD,
}
# Tiny dark roots creeping down from the top crevices
ROOTS = [
    (12, 14), (12, 15), (11, 16), (11, 18),
    (22, 13), (22, 15), (23, 16), (23, 18),
    (14, 8), (14, 10),
]
# Mossy clay accents clinging to the upper faces
MOSS = {
    (8, 8): MOSS_LIGHT, (7, 10): MOSS_DARK, (6, 13): MOSS_LIGHT,
    (5, 15): MOSS_DARK, (15, 5): MOSS_LIGHT, (15, 7): MOSS_DARK,
    (24, 10): MOSS_DARK, (25, 13): MOSS_LIGHT,
}
# Pale glints at the points and an inner highlight on the heart layer
GLINTS = [(17, 4), (9, 6), (24, 9), (14, 16), (13, 15)]

AURA = (214, 180, 112, 58)
MOTES = [(16, 1), (26, 5), (3, 12), (29, 19), (2, 22), (16, 30), (8, 2), (27, 26)]


def main():
    mask = {
        (x, y)
        for y, spans in ROWS.items()
        for x0, x1 in spans
        for x in range(x0, x1 + 1)
    }
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    # Grounded aura: a sparse drift of warm dust, quieter than fire/ocean
    def near(x, y):
        return any(
            (x + dx, y + dy) in mask
            for dx in (-1, 0, 1)
            for dy in (-1, 0, 1)
        )

    for y in range(SIZE):
        for x in range(SIZE):
            if (x, y) not in mask and near(x, y) and (x + y) % 2 == 0:
                px[x, y] = AURA
    for x, y in MOTES:
        if (x, y) not in mask:
            px[x, y] = AURA

    # Crystal body
    for (x, y) in mask:
        edge = any(
            (x + dx, y + dy) not in mask
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
        )
        if edge:
            px[x, y] = OUTLINE + (255,)
        else:
            px[x, y] = RAMP[shade_at(x, y)] + (255,)

    # Detail overlays
    for (x, y), c in VEINS.items():
        if (x, y) in mask:
            px[x, y] = c + (255,)
    for (x, y) in ROOTS:
        if (x, y) in mask:
            px[x, y] = RAMP[0] + (255,)
    for (x, y), c in MOSS.items():
        if (x, y) in mask:
            px[x, y] = c + (255,)
    for (x, y) in GLINTS:
        if (x, y) in mask:
            px[x, y] = RAMP[7] + (255,)

    img.save("earth_crystal_32.png")
    img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save("earth_crystal_128.png")
    print("wrote earth_crystal_32.png and earth_crystal_128.png")


if __name__ == "__main__":
    main()
