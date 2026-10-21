#!/usr/bin/env python3
"""Generate kid-friendly EN/TR voice clips with Microsoft Edge neural TTS.

Why Edge (not Windows Tolga):
  Tolga often misreads Turkish words (e.g. "kırmızı" → "keremeze").
  EmelNeural / AriaNeural pronounce Turkish and English clearly.

Needs internet once while generating. The game itself plays the saved
files offline. Install:  pip install edge-tts

Usage:
  python tools/make_voices.py           # only missing files
  python tools/make_voices.py --force   # regenerate everything
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print('Install edge-tts first:  pip install edge-tts', file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
EN_DIR = ROOT / 'assets' / 'voice' / 'en'
TR_DIR = ROOT / 'assets' / 'voice' / 'tr'

# Slightly slow for a 5-year-old; pitch up a little for a friendly tone.
EN_VOICE = 'en-US-AriaNeural'
TR_VOICE = 'tr-TR-EmelNeural'
EN_RATE = '-8%'
TR_RATE = '-6%'
EN_PITCH = '+4Hz'
TR_PITCH = '+0Hz'

LINE_RE = re.compile(r"""^\s+'?([a-z0-9-]+)'?:\s*\[(['"])(.*?)\2,\s*(['"])(.*?)\4\],?\s*$""")


def read_lines() -> dict[str, tuple[str, str]]:
    """The spoken lines, read straight from js/lines.js (the one list the game uses)."""
    text = (ROOT / 'js' / 'lines.js').read_text(encoding='utf-8')
    start = text.index('export const LINES = {')
    body = text[start:text.index('\n};', start)]
    lines = {}
    for row in body.splitlines():
        m = LINE_RE.match(row)
        if m:
            lines[m.group(1)] = (m.group(3), m.group(5))
    return lines


LINES = read_lines()


async def save(text: str, voice: str, rate: str, pitch: str, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(path))


async def run(force: bool) -> int:
    EN_DIR.mkdir(parents=True, exist_ok=True)
    TR_DIR.mkdir(parents=True, exist_ok=True)
    (ROOT / 'assets' / 'voice' / 'custom' / 'en').mkdir(parents=True, exist_ok=True)
    (ROOT / 'assets' / 'voice' / 'custom' / 'tr').mkdir(parents=True, exist_ok=True)

    print(f'EN {EN_VOICE}   TR {TR_VOICE}')
    n = 0
    for i, (line_id, (en, tr)) in enumerate(sorted(LINES.items()), 1):
        en_path = EN_DIR / f'{line_id}.mp3'
        tr_path = TR_DIR / f'{line_id}.mp3'
        if not force and en_path.exists() and tr_path.exists():
            continue
        await save(en, EN_VOICE, EN_RATE, EN_PITCH, en_path)
        await save(tr, TR_VOICE, TR_RATE, TR_PITCH, tr_path)
        # Drop old WinRT wav so the game never picks Tolga again.
        for old in (EN_DIR / f'{line_id}.wav', TR_DIR / f'{line_id}.wav'):
            if old.exists():
                old.unlink()
        n += 1
        print(f'{n} {line_id}')
    print(f'OK {n}')
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true', help='Regenerate every line')
    args = ap.parse_args()
    return asyncio.run(run(args.force))


if __name__ == '__main__':
    raise SystemExit(main())
