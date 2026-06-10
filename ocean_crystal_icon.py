"""Generate a 128x128 pixel-art icon: deep blue ocean crystal (Minecraft item style).

An amethyst-inspired jagged gem in sapphire/indigo/cyan/turquoise, with
swirling seawater currents trapped inside. Drawn at 32x32 for authentic
pixel density, then upscaled 4x with nearest-neighbor so every pixel
stays crisp. Transparent background.
"""

import math

from PIL import Image

SIZE = 32
SCALE = 4  # 32 * 4 = 128

# Depth ramp, deep -> bright
RAMP = [
    (16, 18, 64),     # 0 deepest indigo (cold outer facets, tips)
    (24, 34, 104),    # 1 indigo
    (30, 58, 152),    # 2 deep sapphire
    (36, 92, 198),    # 3 sapphire
    (44, 134, 224),   # 4 ocean blue
    (62, 180, 230),   # 5 cyan
    (110, 222, 226),  # 6 turquoise
    (210, 250, 248),  # 7 pale sea-foam highlight
]
OUTLINE = (10, 10, 44)

# Inclusive (left, right) interior spans per row for each spike of the crystal.
MAIN = {
    1: (16, 16), 2: (15, 17), 3: (15, 17), 4: (15, 18), 5: (14, 18),
    6: (14, 19), 7: (13, 19), 8: (13, 19), 9: (13, 20), 10: (12, 20),
    11: (12, 21), 12: (12, 21), 13: (11, 21), 14: (11, 22), 15: (11, 22),
    16: (10, 22), 17: (10, 22), 18: (10, 23), 19: (10, 23), 20: (10, 23),
    21: (10, 23), 22: (10, 22), 23: (11, 22),
}
RIGHT_SPIKE = {
    4: (26, 26), 5: (26, 27), 6: (25, 27), 7: (25, 26), 8: (24, 26),
    9: (23, 25), 10: (23, 25), 11: (22, 24), 12: (22, 23),
}
LEFT_SPIKE = {
    8: (5, 5), 9: (5, 6), 10: (5, 7), 11: (6, 7), 12: (6, 8),
    13: (7, 9), 14: (7, 9), 15: (8, 10), 16: (9, 10),
}
# Jagged bottom points (three uneven elegant shards)
BOTTOM = {
    24: [(11, 13), (15, 18), (20, 22)],
    25: [(11, 12), (15, 17), (21, 22)],
    26: [(12, 12), (16, 17), (21, 21)],
    27: [(16, 16), (22, 22)],
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
    """Watery glow from an inner heart, flowing currents, facet lighting."""
    heart_d = math.hypot(x - 16, (y - 17) * 1.05)
    if heart_d < 1.6:
        s = 6
    elif heart_d < 3.4:
        s = 5
    elif heart_d < 5.6:
        s = 4
    elif heart_d < 8.0:
        s = 3
    elif heart_d < 10.5:
        s = 2
    elif heart_d < 13.5:
        s = 1
    else:
        s = 0

    # Swirling current: diagonal sine bands brighten the water inside
    if math.sin(x * 0.85 + y * 0.5) > 0.45:
        s += 1

    # Facets: main spike ridge at x=15 (left face catches light, right face dark)
    if y in MAIN and MAIN[y][0] <= x <= MAIN[y][1]:
        if x == 15 and 3 <= y <= 12:
            s -= 2  # dark facet ridge line up the spike
        elif x < 15:
            s += 1
        elif x > 17:
            s -= 1
    # Side spikes: lifted out of the deep range, top faces lit, undersides dark
    if y in RIGHT_SPIKE and RIGHT_SPIKE[y][0] <= x <= RIGHT_SPIKE[y][1]:
        s += 2 if (x + y) <= 31 else 1
    if y in LEFT_SPIKE and LEFT_SPIKE[y][0] <= x <= LEFT_SPIKE[y][1]:
        s += 2 if y <= 11 else 1
    return max(0, min(7, s))


# Wave squiggles: tiny bright crests flowing through the gem
WAVES = {
    (13, 14): 5, (14, 13): 6, (15, 14): 5, (16, 13): 5,
    (17, 14): 6, (18, 15): 5,
    (12, 19): 5, (13, 18): 6, (14, 19): 5, (18, 19): 5,
    (19, 18): 6, (20, 19): 5, (21, 20): 4,
    (14, 22): 5, (15, 21): 6, (17, 22): 5,
    (16, 9): 5, (15, 8): 4, (17, 8): 4,
    (24, 9): 5, (23, 11): 5, (6, 11): 5, (8, 14): 5,
}
# Glowing inner reflections and sparkle glints
GLINTS = {
    (16, 2): 6, (26, 5): 6, (5, 9): 6, (16, 26): 6,
    (13, 5): 7, (12, 11): 7, (20, 12): 7, (11, 17): 7,
    (16, 17): 7, (22, 17): 6, (16, 24): 6,
}
# Dark fracture lines inside the facets
CRACKS = [
    (14, 7), (13, 10), (19, 10), (20, 14),
    (11, 20), (22, 21), (18, 6),
    (25, 8), (7, 13),
]

AURA_NEAR = (80, 190, 230, 80)
AURA_FAR = (50, 120, 210, 38)
SPARKS = [(16, 0), (27, 3), (4, 7), (9, 4), (24, 1), (16, 30), (7, 20), (26, 20)]


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

    # Subtle watery shimmer: soft glow ring, fainter checkerboard beyond
    for y in range(SIZE):
        for x in range(SIZE):
            if (x, y) in mask:
                continue
            if near_mask(x, y, 1):
                px[x, y] = AURA_NEAR
            elif near_mask(x, y, 2) and (x + y) % 2 == 0:
                px[x, y] = AURA_FAR
    for x, y in SPARKS:
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

    # Overlays: wave crests and glints shine over anything, cracks darken
    for (x, y), s in WAVES.items():
        if (x, y) in mask:
            px[x, y] = RAMP[s] + (255,)
    for (x, y) in CRACKS:
        if (x, y) in mask:
            px[x, y] = OUTLINE + (255,)
    for (x, y), s in GLINTS.items():
        if (x, y) in mask:
            px[x, y] = RAMP[s] + (255,)

    img.save("ocean_crystal_32.png")
    img.resize((SIZE * SCALE, SIZE * SCALE), Image.NEAREST).save("ocean_crystal_128.png")
    print("wrote ocean_crystal_32.png and ocean_crystal_128.png")


if __name__ == "__main__":
    main()
