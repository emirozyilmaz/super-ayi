import { S, G, PL } from './state.js';
import { writeSave } from './save.js';
import { LESSON } from './lines.js';
import { say, sfx, canAmbient } from './audio.js';
import { freeSpot } from './spots.js';
import { setHunt, hideHunt } from './wordhunt.js';
import { dayKey } from './stats.js';
import { itemIcon } from './icons.js';

/*
 * Word of the day. Once the child has met a few words, every day one of them (a weak one when
 * possible) is hidden three times around the garden. Finding all three gives coins and counts
 * as hearing and finding the word again. It never blocks the story: it is extra, for free roam.
 */
const $ = (id) => document.getElementById(id);
let world = null;
let hooks = { mark() {}, hud() {}, burst() {} };
let announced = false;

const met = (w) => S.words[w] && (S.words[w].heard || S.words[w].found);

function pickWord() {
  const pool = LESSON.filter((w) => w !== 'jump' && met(w));
  if (pool.length < 3) return null;
  // Weak words first: not yet a sticker, or missed before.
  const score = (w) => {
    const x = S.words[w];
    return (x.found && x.chosen ? 0 : 3) + Math.min(3, x.misses || 0) + Math.random() * 2;
  };
  return pool.sort((a, b) => score(b) - score(a))[0];
}

function placeSpots() {
  const centre = { x: world.bounds.cx, z: world.bounds.cz };
  const spots = [];
  for (let i = 0; i < 3; i++) {
    const s = freeSpot(world, centre, 4, 42, 1.4, spots, 14) || freeSpot(world, PL, 6, 30, 1.2, spots, 8);
    if (s) spots.push({ x: Math.round(s.x * 10) / 10, z: Math.round(s.z * 10) / 10 });
  }
  return spots;
}

/** After the world exists. `markWord(word, field)` updates learning stats; `hud()` repaints. */
export function bindDaily(w, markWord, hud) {
  world = w;
  hooks = { mark: markWord, hud };
  world.hunt.onCollect = collect;
}

/** Start of a session: set up (or restore) today's hunt. */
export function startDaily() {
  if (!world || !world.hunt) return;
  const today = dayKey();
  // Only once the story is under way: the first steps teach how to play.
  if (S.quest < 8 && !S.finished) { hideHunt(world.hunt); paintChip(); return; }
  if (!S.hunt || S.hunt.day !== today || !LESSON.includes(S.hunt.word)) {
    const word = pickWord();
    const spots = word ? placeSpots() : [];
    if (!word || spots.length < 3) { S.hunt = null; hideHunt(world.hunt); paintChip(); return; }
    S.hunt = { day: today, word, spots, got: [false, false, false], done: false };
    writeSave(S);
  }
  announced = S.hunt.done || S.hunt.got.some(Boolean);
  if (S.hunt.done) hideHunt(world.hunt);
  else setHunt(world.hunt, S.hunt.word, S.hunt.spots, S.hunt.got);
  paintChip();
}

/** Per frame: Lila mentions the hunt once, softly, when nothing else is being said. */
export function tickDaily() {
  if (announced || !S.hunt || S.hunt.done || G.lock || G.time < 25) return;
  if (!canAmbient()) return;
  announced = true;
  const word = S.hunt.word;
  say('word-day', { soft: true }).then((ok) => { if (ok) say(word); });
  nudgeChip();
}

function collect(i, t) {
  const h = S.hunt;
  if (!h || h.done) return;
  h.got[i] = true;
  announced = true;
  sfx.coin();
  G.burst(t.x, 1.3, t.z, 0xffd54f);
  hooks.mark(h.word, 'heard');
  S.coins += 1;
  const n = h.got.filter(Boolean).length;
  if (n >= 3) {
    h.done = true;
    S.coins += 5;
    hooks.mark(h.word, 'found');
    sfx.star();
    say('hunt-done');
  } else {
    say(h.word);
  }
  writeSave(S);
  paintChip();
  nudgeChip();
  hooks.hud();
}

/** Tapping the chip says the word of the day again. */
export function replayDaily() {
  if (!S.hunt) return;
  if (S.hunt.done) say(S.hunt.word, { tr: true });
  else say('word-day').then((ok) => { if (ok) say(S.hunt.word, { tr: true }); });
}

function paintChip() {
  const chip = $('huntChip');
  if (!chip) return;
  const h = S.hunt;
  if (!h) { chip.classList.add('hidden'); return; }
  chip.classList.remove('hidden');
  chip.classList.toggle('done', !!h.done);
  $('huntIcon').innerHTML = itemIcon(h.word);
  $('huntCount').textContent = h.done ? '✓' : `${h.got.filter(Boolean).length}/3`;
}

function nudgeChip() {
  const chip = $('huntChip');
  if (!chip) return;
  chip.classList.remove('nudge');
  void chip.offsetWidth;
  chip.classList.add('nudge');
}
