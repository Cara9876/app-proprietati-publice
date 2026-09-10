#!/usr/bin/env python3
"""Responsive image pipeline: assets/img/src-*.{webp,png,jpg} -> AVIF + WebP + JPEG at several widths.
Usage: python3 tools/images.py            (needs cwebp and avifenc on PATH, Pillow for resizing/JPEG)"""
import os, subprocess, sys
from PIL import Image
IMG = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
SOURCES = {           # name: (source file, widths)
    'entrance': ('src-entrance.webp', [2400, 1600, 1000, 640]),
    'tower':    ('src-tower.webp',    [2000, 1400, 900, 640]),
    'canopy':   ('src-canopy.png',    [1024, 640]),
    'winter':   ('src-winter.png',    [500]),
    'room':     ('src-room.webp',     [576, 400]),
    'concept-day':      ('src-concept-day.png',      [1536, 1000, 640]),
    'concept-entrance': ('src-concept-entrance.png', [1672, 1000, 640]),
    'concept-dusk':     ('src-concept-dusk.png',     [1672, 1000, 640]),
    'concept-aerial':   ('src-concept-aerial.png',   [1672, 1000, 640]),
}
def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(' '.join(cmd), r.stderr[:300]); sys.exit(1)
for name, (src, widths) in SOURCES.items():
    im = Image.open(os.path.join(IMG, src)).convert('RGB')
    for w in widths:
        h = round(im.height * w / im.width)
        out = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        base = os.path.join(IMG, f'{name}-{w}')
        out.save(base + '.jpg', quality=82, optimize=True, progressive=True)
        run(['cwebp', '-quiet', '-q', '80', base + '.jpg', '-o', base + '.webp'])
        run(['avifenc', '--min', '0', '--max', '63', '-a', 'end-usage=q', '-a', 'cq-level=28', '-a', 'tune=ssim', '-s', '6', base + '.jpg', base + '.avif'])
        print(name, w, h, [f'{os.path.getsize(base + e)//1024} KB' for e in ('.avif', '.webp', '.jpg')])
