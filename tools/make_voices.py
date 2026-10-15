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

# Keep in sync with js/lines.js and tools/make-voices.ps1
LINES = {
    'red': ('Red!', 'Kırmızı!'),
    'blue': ('Blue!', 'Mavi!'),
    'yellow': ('Yellow!', 'Sarı!'),
    'orange': ('Orange!', 'Turuncu!'),
    'green': ('Green!', 'Yeşil!'),
    'purple': ('Purple!', 'Mor!'),
    'apple': ('Apple!', 'Elma!'),
    'banana': ('Banana!', 'Muz!'),
    'jump': ('Jump!', 'Zıpla!'),
    'cat': ('Cat!', 'Kedi!'),
    'rabbit': ('Rabbit!', 'Tavşan!'),
    'bird': ('Bird!', 'Kuş!'),
    'duck': ('Duck!', 'Ördek!'),
    'frog': ('Frog!', 'Kurbağa!'),
    'fox': ('Fox!', 'Tilki!'),
    'chicken': ('Chicken!', 'Tavuk!'),
    'hello': ('Hello, friend!', 'Merhaba arkadaş!'),
    'great': ('Great job!', 'Aferin!'),
    'find-red': ('Find the red flowers!', 'Kırmızı çiçekleri bul!'),
    'find-blue': ('Find the blue flowers!', 'Mavi çiçekleri bul!'),
    'find-yellow': ('Find the yellow flowers!', 'Sarı çiçekleri bul!'),
    'find-apple': ('Find the apples!', 'Elmaları bul!'),
    'find-banana': ('Find the bananas!', 'Muzları bul!'),
    'do-jump': ('Jump!', 'Zıpla!'),
    'show-red': ('Show me red!', 'Bana kırmızıyı göster!'),
    'show-blue': ('Show me blue!', 'Bana maviyi göster!'),
    'show-yellow': ('Show me yellow!', 'Bana sarıyı göster!'),
    'show-apple': ('Show me the apple!', 'Bana elmayı göster!'),
    'show-banana': ('Show me the banana!', 'Bana muzu göster!'),
    'show-jump': ('Jump on the star!', 'Yıldıza zıpla!'),
    'magic-red': ('The magic word is red!', 'Sihirli kelime kırmızı!'),
    'magic-banana': ('The magic word is banana!', 'Sihirli kelime muz!'),
    'magic-yellow': ('The magic word is yellow!', 'Sihirli kelime sarı!'),
    'thats-apple': ("That's an apple.", 'Bu bir elma.'),
    'thats-banana': ("That's a banana.", 'Bu bir muz.'),
    'thats-red': ("That's red.", 'Bu kırmızı.'),
    'thats-blue': ("That's blue.", 'Bu mavi.'),
    'thats-yellow': ("That's yellow.", 'Bu sarı.'),
    'thanks': ('Thank you! You saved my friend!', 'Sağ ol! Arkadaşımı kurtardın!'),
    'shop': ('Hat shop!', 'Şapka dükkânı!'),
    'hat-red': ('Red hat!', 'Kırmızı şapka!'),
    'hat-blue': ('Blue hat!', 'Mavi şapka!'),
    'hat-yellow': ('Yellow hat!', 'Sarı şapka!'),
    'coins': ('Coin!', 'Altın!'),
    'come': ('Come back to me!', 'Yanıma geri gel!'),
    'garden': ("Let's go to the garden!", 'Hadi bahçeye!'),
    'notyet': ("Not yet. Let's learn a word.", 'Henüz değil. Bir kelime öğrenelim.'),
    'try-again': ('Try again!', 'Bir daha dene!'),
    'wow': ('Wow!', 'Vay!'),
    'secret': ('You found a secret!', 'Gizli bir yer buldun!'),
    'need-coins': ('A few more coins!', 'Biraz daha altın!'),
    'all-done': ('The garden is happy!', 'Bahçe çok mutlu!'),
    'climb-jump': ('Climb up and jump!', 'Tırman ve zıpla!'),
    'i-see-cat': ('I see a cat!', 'Bir kedi görüyorum!'),
    'i-see-rabbit': ('I see a rabbit!', 'Bir tavşan görüyorum!'),
    'i-see-bird': ('I see a bird!', 'Bir kuş görüyorum!'),
    'i-see-duck': ('I see a duck!', 'Bir ördek görüyorum!'),
    'i-see-frog': ('I see a frog!', 'Bir kurbağa görüyorum!'),
    'i-see-fox': ('I see a fox!', 'Bir tilki görüyorum!'),
    'i-see-chicken': ('I see a chicken!', 'Bir tavuk görüyorum!'),
    'splash': ('Splash! Swim!', 'Şıp! Yüz!'),
    'nice-hat': ('Nice hat!', 'Güzel şapka!'),
    'pop': ('Pop!', 'Pat!'),
    'honey': ('Yum!', 'Lezzetli!'),
    'follow': ('Follow the butterfly!', 'Kelebeği takip et!'),
    'over-here': ('Over here!', 'Buraya!'),
    'you-did-it': ('You did it! Hooray!', 'Başardın! Yaşasın!'),
    'find-green': ('Find the green flowers!', 'Yeşil çiçekleri bul!'),
    'find-orange': ('Find the orange flowers!', 'Turuncu çiçekleri bul!'),
    'find-purple': ('Find the purple flowers!', 'Mor çiçekleri bul!'),
    'show-green': ('Show me green!', 'Bana yeşili göster!'),
    'show-orange': ('Show me orange!', 'Bana turuncuyu göster!'),
    'show-purple': ('Show me purple!', 'Bana moru göster!'),
    'thats-green': ("That's green.", 'Bu yeşil.'),
    'thats-orange': ("That's orange.", 'Bu turuncu.'),
    'thats-purple': ("That's purple.", 'Bu mor.'),
    'find-cat': ('Find the cat!', 'Kediyi bul!'),
    'find-duck': ('Find the duck!', 'Ördeği bul!'),
    'find-frog': ('Find the frog!', 'Kurbağayı bul!'),
    'show-cat': ('Show me the cat!', 'Bana kediyi göster!'),
    'show-duck': ('Show me the duck!', 'Bana ördeği göster!'),
    'show-frog': ('Show me the frog!', 'Bana kurbağayı göster!'),
    'thats-cat': ("That's a cat.", 'Bu bir kedi.'),
    'thats-duck': ("That's a duck.", 'Bu bir ördek.'),
    'thats-frog': ("That's a frog.", 'Bu bir kurbağa.'),
    'hat-crown': ('Golden crown!', 'Altın taç!'),
    'hat-cape': ('Super cape!', 'Süper pelerin!'),
    'hat-glasses': ('Cool glasses!', 'Havalı gözlük!'),
    'hat-pack': ('Adventure bag!', 'Macera çantası!'),
    'boing': ('Boing! High jump!', 'Zıp! Yükseğe zıpla!'),
    'wheee': ('Wheee! Slide!', 'Vuuu! Kaydırak!'),
    'smash': ('Smash! Coins!', 'Güm! Altınlar!'),
    # Chapter 3: the Sky Park
    'slide': ('Slide!', 'Kaydırak!'),
    'swing': ('Swing!', 'Salıncak!'),
    'plane': ('Plane!', 'Uçak!'),
    'find-slide': ('Slide down the rainbow!', 'Gökkuşağından kay!'),
    'find-swing': ('Swing high!', 'Yükseğe salın!'),
    'find-plane': ('Hop in the plane!', 'Uçağa bin!'),
    'show-slide': ('Show me the slide!', 'Bana kaydırağı göster!'),
    'show-swing': ('Show me the swing!', 'Bana salıncağı göster!'),
    'show-plane': ('Show me the plane!', 'Bana uçağı göster!'),
    'thats-slide': ("That's a slide.", 'Bu bir kaydırak.'),
    'thats-swing': ("That's a swing.", 'Bu bir salıncak.'),
    'thats-plane': ("That's a plane.", 'Bu bir uçak.'),
    'fly-rings': ('Fly through the rings!', 'Halkalardan geç!'),
    'land-plane': ('Time to land!', 'İniş zamanı!'),
    'fly': ("Let's fly!", 'Hadi uçalım!'),
    'higher': ('Higher!', 'Daha yükseğe!'),
    'flip': ('Wow! A flip!', 'Vay! Takla attın!'),
    'roll': ('Roll!', 'Yuvarlan!'),
    'one': ('One!', 'Bir!'),
    'two': ('Two!', 'İki!'),
    'three': ('Three!', 'Üç!'),
    'four': ('Four!', 'Dört!'),
    'five': ('Five!', 'Beş!'),
    'up': ('Up!', 'Yukarı!'),
    'down': ('Down!', 'Aşağı!'),
    'left': ('Left!', 'Sola!'),
    'right': ('Right!', 'Sağa!'),
}


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
