"""Generate a 128x128 pixel-art icon: red fiery spiked crystal (Minecraft item style).

Draws at 32x32 for authentic pixel density, then upscales 4x with
nearest-neighbor so every pixel stays crisp. Transparent background.
"""

import math

from PIL import Image

SIZE = 32
SCALE = 4  # 32 * 4 = 128

# Heat ramp, cool -> hot
RAMP = [
    (74, 10, 16),     # 0 deepest crimson (cold edges, tips)
    (118, 16, 22),    # 1 deep crimson
    (164, 24, 26),    # 2 crimson
    (212, 42, 30),    # 3 red
    (240, 74, 34),    # 4 bright red
    (250, 122, 40),   # 5 orange
    (255, 176, 56),   # 6 bright orange / yellow
    (255, 240, 150),  # 7 white-hot core
]
OUTLINE = (52, 6, 12)

# Inclusive (left, right) interior spans per row for each spike of the crystal.
MAIN = {
    1: (16, 16), 2: (15, 17), 3: (15, 17), 4: (14, 18), 5: (14, 18),
    6: (13, 19), 7: (13, 19), 8: (13, 20), 9: (12, 20), 10: (12, 21),
    11: (12, 21), 12: (11, 21), 13: (11, 22), 14: (11, 22), 15: (10, 22),
    16: (10, 22), 17: (10, 23), 18: (10, 23), 19: (9, 23), 20: (9, 23),
    21: (9, 23), 22: (9, 23), 23: (10, 22),
}
RIGHT_SPIKE = {
    5: (26, 26), 6: (25, 27), 7: (25, 27), 8: (24, 27), 9: (24, 26),
    10: (23, 25), 11: (22, 25), 12: (22, 24), 13: (21, 23),
}
LEFT_SPIKE = {
    10: (5, 5), 11: (5, 6), 12: (5, 7), 13: (5, 7), 14: (6, 8),
    15: (7, 9), 16: (7, 9), 17: (8, 10), 18: (9, 10),
}
# Jagged bottom points (three uneven shards)
BOTTOM = {
    24: [(10, 13), (15, 18), (20, 22)],
    25: [(10, 12), (15, 17), (20, 22)],
    26: [(11, 12), (16, 17), (21, 21)],
    27: [(11, 11), (16, 17)],
    28: [(16, 16)],
}


def build_mask():
    mask = set()
    for table in (MAIN, RIGHT_SPIKE, LEFT_SPIKE):
        for y, (x0, x1) in table.items():
            for x in range(x0, x1 + 1):
                mask.add((x, y))
    for y, spans in BOTTOM.items():
        for x0, x1 in spans:
            for x in range(x0, x1 + 1):
                mask.add((x, y))
    return mask


def shade_at(x, y):
    """Heat shade from the molten core, plus facet lighting."""
    core_d = math.hypot(x - 16, (y - 18) * 1.1)
    if core_d < 1.7:
        s = 7
    elif core_d < 3.2:
        s = 6
    elif core_d < 4.8:
        s = 5
    elif core_d < 6.8:
        s = 4
    elif core_d < 9.0:
        s = 3
    elif core_d < 11.5:
        s = 2
    elif core_d < 14.5:
        s = 1
    else:
        s = 0

    # Facets: main spike ridge at x=15 (left face catches light, right face dark)
    if y in MAIN and MAIN[y][0] <= x <= MAIN[y][1]:
        if x == 15 and 3 <= y <= 13:
            s -= 2  # dark facet ridge line up the spike
        elif x < 15:
            s += 1
        elif x > 16:
            s -= 1
    # Side spikes: top faces lit, undersides dark
    if y in RIGHT_SPIKE and RIGHT_SPIKE[y][0] <= x <= RIGHT_SPIKE[y][1]:
        s += 1 if (x + y) <= 32 else -1
    if y in LEFT_SPIKE and LEFT_SPIKE[y][0] <= x <= LEFT_SPIKE[y][1]:
        s += 1 if y <= 13 else -1
    return max(0, min(7, s))


# Molten lava veins (bright, hand-placed zigzags rising from the core)
VEINS = {
    (16, 17): 7, (15, 16): 6, (16, 15): 6, (15, 14): 5, (16, 13): 6,
    (16, 12): 5, (17, 11): 5, (16, 10): 5, (16, 8): 4, (16, 5): 4,
    (18, 18): 6, (19, 16): 5, (20, 14): 5, (21, 13): 4,
    (13, 18): 6, (12, 17): 5, (11, 16): 4,
    (14, 20): 7, (17, 20): 7, (16, 22): 6, (12, 21): 5, (20, 20): 5,
    (16, 25): 5, (11, 24): 4, (21, 24): 4,
}
# Flame-like cracks (dark fractures on the faces)
CRACKS = [
    (13, 9), (13, 11), (19, 9), (20, 11), (18, 14),
    (10, 19), (22, 19), (12, 13),
    (24, 8), (23, 11), (6, 12), (8, 16),
]
# Glints near the spike tips
GLINTS = {(16, 2): 5, (26, 6): 5, (5, 11): 5, (16, 26): 6}

AURA_NEAR = (255, 96, 24, 96)
AURA_FAR = (255, 60, 16, 44)
EMBERS = [(16, 0), (27, 4), (4, 9), (9, 6), (24, 2), (16, 29), (7, 22), (25, 22)]


def main():
    mask = build_mask()
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    px = img.load()

    def near_mask(x, y, dist):
        return any(
            (x + dx, y + dy) in mask
            for dx in range(-dist, dist + 1)
            for dy in range(-dist, dist + 1)
        )

    # Fiery aura: glow ring hugging the silhouette, fainter checkerboard beyond
    for y in range(SIZE):
        for x in range(SIZE):
            if (x, y) in mask:
                continue
            if near_mask(x, y, 1):
                px[x, y] = AURA_NEAR
            elif near_mask(x, y, 2) and (x + y) % 2 == 0:
                px[x, y] = AURA_FAR
    for x, y in EMBERS:
        if (x, y) not in mask:
            px[x, y] = AURA_NEAR

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

    # Overlays: veins glow over anything, cracks darken interior only
    for (x, y), s in VEINS.items():
        if (x, y) in mask:
            px[x, y] = RAMP[s] + (255,)
    for (x, y) in CRACKS:
        if (x, y) in mask:
            px[x, y] = OUTLINE + (255,)
    for (x, y), s in GLINTS.items():
        if (x, y) in mask:
            px[x, y] = RAMP[s] + (255,)

    img.save("fire_crystal_32.png")
    img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save("fire_crystal_128.png")
    print("wrote fire_crystal_32.png and fire_crystal_128.png")


if __name__ == "__main__":
    main()
