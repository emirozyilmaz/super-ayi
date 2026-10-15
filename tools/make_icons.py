"""Draws the app icons (a bear face on sky blue) as PNG files. Standard library only.

    py -3 tools/make_icons.py

Writes assets/icons/icon-192.png, icon-512.png, maskable-512.png and apple-touch-icon.png (180).
"""
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'icons')

SKY = (142, 200, 234)
BROWN = (160, 97, 47)
EAR_IN = (232, 168, 124)
MUZZLE = (243, 210, 168)
INK = (62, 42, 34)
WHITE = (255, 255, 255)


def shapes(scale):
    """Bear face in unit coordinates; `scale` < 1 shrinks it toward the centre (maskable safe zone)."""
    def s(cx, cy, rx, ry=None):
        ry = rx if ry is None else ry
        return (0.5 + (cx - 0.5) * scale, 0.5 + (cy - 0.5) * scale, rx * scale, ry * scale)
    return [
        (s(0.27, 0.30, 0.11), BROWN), (s(0.73, 0.30, 0.11), BROWN),
        (s(0.27, 0.30, 0.06), EAR_IN), (s(0.73, 0.30, 0.06), EAR_IN),
        (s(0.50, 0.55, 0.31, 0.29), BROWN),
        (s(0.50, 0.66, 0.14, 0.11), MUZZLE),
        (s(0.50, 0.605, 0.05, 0.035), INK),
        (s(0.39, 0.50, 0.035), INK), (s(0.61, 0.50, 0.035), INK),
        (s(0.40, 0.488, 0.012), WHITE), (s(0.62, 0.488, 0.012), WHITE),
    ]


def colour_at(x, y, items):
    c = SKY
    for (cx, cy, rx, ry), col in items:
        dx = (x - cx) / rx
        dy = (y - cy) / ry
        if dx * dx + dy * dy <= 1:
            c = col
    return c


def draw(size, scale):
    items = shapes(scale)
    sub = 2  # 2x2 supersampling for smooth edges
    rows = []
    for py in range(size):
        row = bytearray([0])  # PNG filter: none
        for px in range(size):
            r = g = b = 0
            for sy in range(sub):
                for sx in range(sub):
                    c = colour_at((px + (sx + 0.5) / sub) / size, (py + (sy + 0.5) / sub) / size, items)
                    r += c[0]; g += c[1]; b += c[2]
            n = sub * sub
            row += bytes((r // n, g // n, b // n))
        rows.append(bytes(row))
    return b''.join(rows)


def write_png(path, size, raw):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, size, scale in [
        ('icon-192.png', 192, 1.0),
        ('icon-512.png', 512, 1.0),
        ('maskable-512.png', 512, 0.72),  # Android crops maskable icons to a circle
        ('apple-touch-icon.png', 180, 0.9),
    ]:
        write_png(os.path.join(OUT, name), size, draw(size, scale))
        print('OK', name)


if __name__ == '__main__':
    main()
