"""Render alpha-only soft shadows for map annotation snapshots without runtime blur."""
import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "apps/mobile/assets/map-markers"
PAD, WIDTH, HEIGHT, SCALE = 8, 130, 34, 3


def render(name, tail):
    width, height = WIDTH + 2 * PAD, HEIGHT + 2 * PAD + tail
    rows = bytearray()
    for y in range(height * SCALE):
        rows.append(0)
        for x in range(width * SCALE):
            px = (x + 0.5) / SCALE - PAD - WIDTH / 2
            py = (y + 0.5) / SCALE - PAD - 3  # light from above
            dx = max(abs(px) - (WIDTH - HEIGHT) / 2, 0)
            edge = math.hypot(dx, py - HEIGHT / 2) - HEIGHT / 2
            if tail and HEIGHT - 1 <= py <= HEIGHT + tail:
                half = 10 * (1 - (py - HEIGHT) / tail)
                edge = min(edge, abs(px) - half)
            opacity = 0.72 * 0.5 * math.erfc(edge / (math.sqrt(2) * 3))
            rows.extend((8, 10, 16, round(255 * opacity)))
    def chunk(kind, content):
        return struct.pack(">I", len(content)) + kind + content + struct.pack(">I", zlib.crc32(kind + content))
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width*SCALE, height*SCALE, 8, 6, 0, 0, 0))
    (OUT / name).write_bytes(png + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b""))


render("bubble-shadow.png", 13)
render("countdown-shadow.png", 0)
