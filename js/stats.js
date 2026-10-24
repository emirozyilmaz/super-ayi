import { S } from './state.js';
import { writeSave } from './save.js';

/*
 * Play time and the weekly report. Minutes are counted only while the game is really being
 * played (started, not paused, page visible). A parent can set a daily limit; near the end the
 * game warns, at the end it shows a calm break screen that only a parent can lift.
 */
const KEEP_DAYS = 35;
const DAY_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

let unsaved = 0;

export function addPlayTime(dt) {
  if (!S.playLog || typeof S.playLog !== 'object') S.playLog = {};
  const k = dayKey();
  S.playLog[k] = (S.playLog[k] || 0) + dt;
  unsaved += dt;
  if (unsaved > 10) {
    unsaved = 0;
    prune();
    writeSave(S);
  }
}

function prune() {
  const keys = Object.keys(S.playLog);
  if (keys.length <= KEEP_DAYS) return;
  const cutoff = Date.now() - KEEP_DAYS * 864e5;
  keys.forEach((k) => {
    const [y, m, d] = k.split('-').map(Number);
    if (new Date(y, m - 1, d).getTime() < cutoff) delete S.playLog[k];
  });
}

export function playedToday() {
  return (S.playLog && S.playLog[dayKey()]) || 0;
}

/** Seconds allowed today (limit + any extra a parent granted today), or Infinity. */
export function allowedToday() {
  if (!S.limitMin) return Infinity;
  const extra = S.limitExtra && S.limitExtra.day === dayKey() ? S.limitExtra.min : 0;
  return (S.limitMin + extra) * 60;
}

/** 'ok', 'warn' (two minutes or less left) or 'over'. */
export function limitState() {
  const left = allowedToday() - playedToday();
  if (left <= 0) return 'over';
  if (left <= 120) return 'warn';
  return 'ok';
}

export function grantExtra(min) {
  const k = dayKey();
  const cur = S.limitExtra && S.limitExtra.day === k ? S.limitExtra.min : 0;
  S.limitExtra = { day: k, min: cur + min };
  writeSave(S);
}

/** The last `n` days, oldest first: { label, min, today }. */
export function lastDays(n = 7) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const sec = (S.playLog && S.playLog[dayKey(d)]) || 0;
    out.push({ label: DAY_TR[d.getDay()], min: Math.round(sec / 60), today: i === 0 });
  }
  return out;
}

/** Words that became stickers in the last 7 days. */
export function learnedThisWeek() {
  const cutoff = Date.now() - 7 * 864e5;
  return Object.entries(S.words || {})
    .filter(([, w]) => w && w.learnedAt && w.learnedAt >= cutoff)
    .map(([id]) => id);
}

/** Words the child found hardest: most wrong answers first. */
export function hardestWords(n = 5) {
  return Object.entries(S.words || {})
    .filter(([, w]) => w && (w.misses || 0) > 0)
    .sort((a, b) => (b[1].misses || 0) - (a[1].misses || 0))
    .slice(0, n)
    .map(([id, w]) => ({ id, misses: w.misses }));
}
