"""
medieval_lib.py — drawing primitives for the MedievalCraft resource pack.

Everything renders into a 16x16 RGBA PIL image (vanilla resolution) so the pack
stays light and reads as authentic pixel art. All randomness is seeded per
texture name so output is fully reproducible.
"""

import hashlib
from PIL import Image

S = 16  # texture size


# --------------------------------------------------------------------------
# tiny seeded RNG (deterministic, no global state)
# --------------------------------------------------------------------------
class Rng:
    def __init__(self, seed):
        if isinstance(seed, str):
            seed = int(hashlib.md5(seed.encode()).hexdigest()[:8], 16)
        self.state = seed & 0xFFFFFFFF

    def _next(self):
        # xorshift32
        x = self.state or 0x9E3779B9
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        self.state = x & 0xFFFFFFFF
        return self.state

    def rand(self):
        return self._next() / 0xFFFFFFFF

    def randint(self, a, b):
        return a + int(self.rand() * (b - a + 1))

    def chance(self, p):
        return self.rand() < p

    def pick(self, seq):
        return seq[self.randint(0, len(seq) - 1)]


# --------------------------------------------------------------------------
# colour helpers
# --------------------------------------------------------------------------
def clamp(v):
    return 0 if v < 0 else 255 if v > 255 else int(v)


def shade(rgb, amt):
    """amt in [-1,1]; negative darkens, positive lightens."""
    if amt >= 0:
        return tuple(clamp(c + (255 - c) * amt) for c in rgb[:3])
    return tuple(clamp(c * (1 + amt)) for c in rgb[:3])


def mix(a, b, t):
    return tuple(clamp(a[i] * (1 - t) + b[i] * t) for i in range(3))


def rgba(rgb, a=255):
    return (rgb[0], rgb[1], rgb[2], a)


# --------------------------------------------------------------------------
# canvas
# --------------------------------------------------------------------------
def canvas(fill=(0, 0, 0, 0)):
    return Image.new("RGBA", (S, S), fill)


def px(img, x, y, color):
    if 0 <= x < S and 0 <= y < S:
        if len(color) == 3:
            color = (color[0], color[1], color[2], 255)
        img.putpixel((x, y), color)


# --------------------------------------------------------------------------
# fill / noise primitives
# --------------------------------------------------------------------------
def noise_fill(img, rng, base, grain=0.16, speck=0.10, dark=0.45):
    """Speckled organic surface — stone, dirt, sand, etc."""
    for y in range(S):
        for x in range(S):
            v = (rng.rand() - 0.5) * 2 * grain
            c = shade(base, v)
            if rng.chance(speck):
                c = shade(c, -dark * rng.rand())
            px(img, x, y, c)


def flat(img, base):
    for y in range(S):
        for x in range(S):
            px(img, x, y, base)


# --------------------------------------------------------------------------
# weathering / overlays (the "medieval" character: age, grime, moss)
# --------------------------------------------------------------------------
def weather(img, rng, amount=0.10, color=(40, 32, 20)):
    """Dark grime streaks and aged blotches."""
    for _ in range(int(amount * S * S)):
        x, y = rng.randint(0, S - 1), rng.randint(0, S - 1)
        cur = img.getpixel((x, y))
        if cur[3] == 0:
            continue
        px(img, x, y, rgba(mix(cur[:3], color, 0.25 + rng.rand() * 0.3), cur[3]))


def moss(img, rng, amount=0.12, color=(74, 102, 50)):
    """Patches of moss creeping from the edges/corners."""
    for _ in range(int(amount * S * S)):
        x, y = rng.randint(0, S - 1), rng.randint(0, S - 1)
        cur = img.getpixel((x, y))
        if cur[3] == 0:
            continue
        edge = min(x, y, S - 1 - x, S - 1 - y)
        if rng.chance(0.6 - edge * 0.08):
            px(img, x, y, rgba(mix(cur[:3], color, 0.45 + rng.rand() * 0.35), cur[3]))


def crack(img, rng, n=2, color=(30, 26, 20)):
    """Hairline cracks for aged stone/brick."""
    for _ in range(n):
        x = rng.randint(2, S - 3)
        y = 0
        while y < S:
            px(img, x, y, color)
            if rng.chance(0.3):
                px(img, x + (1 if rng.chance(0.5) else -1), y, color)
            x += rng.randint(-1, 1)
            x = max(0, min(S - 1, x))
            y += 1


# --------------------------------------------------------------------------
# structured patterns
# --------------------------------------------------------------------------
def planks(img, rng, base, lines=(0, 6, 11), groove=-0.42, grain=0.12):
    """Vertical-grain horizontal planks (used for log/plank/door bodies)."""
    for y in range(S):
        plank_break = y in lines
        for x in range(S):
            v = (rng.rand() - 0.5) * 2 * grain
            # long grain streaks
            streak = -0.08 if ((x * 7 + y) % 5 == 0) else 0
            c = shade(base, v + streak)
            if plank_break:
                c = shade(base, groove)
            px(img, x, y, c)
    # nail heads at plank ends
    for ly in lines:
        for nx in (1, S - 2):
            px(img, nx, max(0, ly - 1) if ly > 0 else 1, shade(base, -0.55))


def vertical_planks(img, rng, base, lines=(0, 5, 10), groove=-0.42, grain=0.12):
    for x in range(S):
        plank_break = x in lines
        for y in range(S):
            v = (rng.rand() - 0.5) * 2 * grain
            c = shade(base, v)
            if plank_break:
                c = shade(base, groove)
            px(img, x, y, c)


def log_rings(img, rng, core, bark):
    """Top face of a log — concentric rings."""
    flat(img, core)
    cx, cy = 7.5, 7.5
    for y in range(S):
        for x in range(S):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            ring = (int(d * 1.4) % 2) == 0
            c = shade(core, -0.12 if ring else 0.05)
            c = shade(c, (rng.rand() - 0.5) * 0.12)
            if d > 6.6:
                c = shade(bark, (rng.rand() - 0.5) * 0.2)
            px(img, x, y, c)


def bricks(img, rng, base, mortar, rows=4, offset=True):
    """Classic running-bond brick."""
    flat(img, mortar)
    rh = S // rows
    bw = S // 2
    for r in range(rows):
        y0 = r * rh
        shift = (bw // 2) if (offset and r % 2) else 0
        x = -shift
        while x < S:
            for yy in range(y0 + 1, y0 + rh):
                for xx in range(x + 1, x + bw):
                    if 0 <= xx < S and yy < S:
                        v = (rng.rand() - 0.5) * 0.22
                        px(img, xx, yy, shade(base, v))
            x += bw


def stone_blocks(img, rng, base, mortar):
    """Irregular fitted ashlar / stone-brick masonry."""
    flat(img, mortar)
    # 2x2 grid of large stones with jitter
    seams_v = {0, 8}
    seams_h = {0, 8}
    for y in range(S):
        for x in range(S):
            if x in seams_v or y in seams_h or (x == 7 and y < 8) or (x == 7 and y >= 8):
                continue
            v = (rng.rand() - 0.5) * 0.2
            px(img, x, y, shade(base, v))
    # jitter the mortar lines a touch
    for y in range(S):
        if rng.chance(0.3):
            px(img, 7 + rng.randint(-1, 1), y, shade(mortar, -0.1))


def cobble(img, rng, base, mortar):
    """Rounded cobblestones packed in mortar."""
    flat(img, mortar)
    stones = []
    attempts = 0
    while len(stones) < 7 and attempts < 60:
        attempts += 1
        r = rng.randint(2, 4)
        cx = rng.randint(r, S - r - 1)
        cy = rng.randint(r, S - r - 1)
        if all((cx - sx) ** 2 + (cy - sy) ** 2 > (r + sr - 1) ** 2 for sx, sy, sr in stones):
            stones.append((cx, cy, r))
    for cx, cy, r in stones:
        tone = shade(base, (rng.rand() - 0.5) * 0.25)
        for y in range(S):
            for x in range(S):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if d <= r:
                    lit = -0.18 * (d / r) + 0.12 * (1 - (y - cy + r) / (2 * r))
                    px(img, x, y, shade(tone, lit))


def woven(img, rng, base, weave=0.10):
    """Cloth / wool weave — wov-over-under texture."""
    for y in range(S):
        for x in range(S):
            over = ((x // 1 + y // 1) % 2) == 0
            knot = ((x % 4 < 2) ^ (y % 4 < 2))
            v = (0.10 if knot else -0.06) + (rng.rand() - 0.5) * weave
            px(img, x, y, shade(base, v))


def metal_plate(img, rng, base, rivets=True):
    """Brushed iron plate with rivets and a worn sheen."""
    for y in range(S):
        for x in range(S):
            sheen = 0.16 * (1 - abs(x - 7.5) / 8) * (1 - y / 16)
            v = sheen + (rng.rand() - 0.5) * 0.06
            px(img, x, y, shade(base, v))
    if rivets:
        for ry in (2, S - 3):
            for rx in (2, S - 3):
                px(img, rx, ry, shade(base, -0.4))
                px(img, rx, ry - 1, shade(base, 0.3))


def ore(img, rng, stone, mineral, count=8):
    """Stone matrix with embedded mineral blobs."""
    noise_fill(img, rng, stone, grain=0.14, speck=0.08)
    for _ in range(count):
        cx, cy = rng.randint(2, S - 3), rng.randint(2, S - 3)
        for dx, dy in ((0, 0), (1, 0), (0, 1), (1, 1), (-1, 0), (0, -1)):
            if rng.chance(0.7):
                shimmer = (rng.rand() - 0.5) * 0.3
                c = shade(mineral, shimmer)
                px(img, cx + dx, cy + dy, c)
                if rng.chance(0.4):
                    px(img, cx + dx, cy + dy, shade(c, 0.3))  # glint


def leaves(img, rng, base):
    """Dense foliage with depth and a few gaps."""
    for y in range(S):
        for x in range(S):
            v = (rng.rand() - 0.5) * 0.4
            c = shade(base, v)
            px(img, x, y, c)
    # darker clumps
    for _ in range(10):
        cx, cy = rng.randint(0, S - 1), rng.randint(0, S - 1)
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                if rng.chance(0.6):
                    px(img, cx + dx, cy + dy, shade(base, -0.3))
    # transparent gaps
    for _ in range(6):
        px(img, rng.randint(0, S - 1), rng.randint(0, S - 1), (0, 0, 0, 0))


def grass_top(img, rng, base):
    noise_fill(img, rng, base, grain=0.22, speck=0.14, dark=0.3)
    for _ in range(14):  # blades
        x = rng.randint(0, S - 1)
        px(img, x, rng.randint(0, S - 1), shade(base, 0.2 + rng.rand() * 0.2))


def liquid(img, rng, base, hi):
    """Water/lava style — banded ripples."""
    for y in range(S):
        for x in range(S):
            wave = 0.18 * ((x + y) % 4 < 2)
            v = wave + (rng.rand() - 0.5) * 0.08
            px(img, x, y, mix(base, hi, max(0, v)))


def pane_border(img, rng, glass, lead):
    """Leaded glass — translucent with dark cames."""
    for y in range(S):
        for x in range(S):
            px(img, x, y, rgba(glass, 90))
    for i in range(S):
        px(img, i, 0, rgba(lead)); px(img, i, S - 1, rgba(lead))
        px(img, 0, i, rgba(lead)); px(img, S - 1, i, rgba(lead))
    for i in range(S):  # diagonal cames
        px(img, i, i, rgba(lead, 200))
        px(img, S - 1 - i, i, rgba(lead, 200))


# --------------------------------------------------------------------------
# item silhouette helpers (16x16, transparent background)
# --------------------------------------------------------------------------
def outline(img, color=(28, 22, 14)):
    """Add a dark outline around any opaque silhouette."""
    out = img.copy()
    for y in range(S):
        for x in range(S):
            if img.getpixel((x, y))[3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < S and 0 <= ny < S and img.getpixel((nx, ny))[3] > 0:
                        out.putpixel((x, y), rgba(color))
                        break
    return out


def line(img, x0, y0, x1, y1, color):
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        px(img, x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy; x0 += sx
        if e2 < dx:
            err += dx; y0 += sy


def fill_rect(img, x0, y0, x1, y1, color):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px(img, x, y, color)


def tool_handle(img, rng, wood, from_xy, to_xy):
    """Draw a tapered wooden haft."""
    x0, y0 = from_xy
    x1, y1 = to_xy
    line(img, x0, y0, x1, y1, wood)
    line(img, x0 + 1, y0, x1 + 1, y1, shade(wood, -0.2))
    # binding wraps
    for t in (0.25, 0.5):
        mx = int(x0 + (x1 - x0) * t)
        my = int(y0 + (y1 - y0) * t)
        px(img, mx, my, (60, 45, 28))
