import { LINES } from './lines.js';
import { S } from './state.js';

let seq = 0;
let playing = false;
let ambientUntil = 0;
let custom = false;
let ac = null;
let currentAudio = null;

export async function initAudio() {
  try {
    const r = await fetch('assets/voice/custom/on.txt', { method: 'HEAD' });
    custom = r.ok;
  } catch (e) { custom = false; }
}

export function unlockAudio() {
  if (!ac) {
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; }
  }
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}

function tone(f0, f1, dur, type, vol, delay) {
  if (!S.sfx || S.muted || !ac) return;
  try {
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* ignore */ }
}

export const sfx = {
  jump: () => tone(320, 540, 0.16, 'square', 0.07),
  coin: () => { tone(880, 880, 0.07, 'square', 0.08); tone(1320, 1320, 0.12, 'square', 0.08, 0.07); },
  collect: () => { tone(660, 660, 0.08, 'sine', 0.16); tone(880, 880, 0.12, 'sine', 0.16, 0.08); },
  wrong: () => tone(220, 140, 0.18, 'triangle', 0.1),
  star: () => { tone(523, 523, 0.1, 'sine', 0.14); tone(659, 659, 0.1, 'sine', 0.14, 0.1); tone(784, 784, 0.22, 'sine', 0.14, 0.2); },
  pop: () => tone(320, 880, 0.18, 'sine', 0.14),
  click: () => tone(520, 520, 0.05, 'sine', 0.07),
  splash: () => {
    tone(180, 90, 0.22, 'triangle', 0.1);
    tone(420, 220, 0.18, 'sine', 0.08, 0.05);
    tone(140, 70, 0.28, 'sine', 0.06, 0.1);
  },
};

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

function stopPlayback() {
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.removeAttribute('src');
      currentAudio.load();
    } catch (e) { /* ignore */ }
    currentAudio = null;
  }
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
}

function playUrl(src) {
  return new Promise((resolve) => {
    const a = new Audio(src);
    currentAudio = a;
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      if (currentAudio === a) currentAudio = null;
      resolve(ok);
    };
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    const p = a.play();
    if (p && p.catch) p.catch(() => finish(false));
  });
}

function fallbackSpeak(lang, text) {
  if (!('speechSynthesis' in window) || !text) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'en' ? 'en-US' : 'tr-TR';
      u.rate = lang === 'en' ? 0.88 : 0.94;
      u.pitch = lang === 'en' ? 1.1 : 1.0;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    } catch (e) { resolve(); }
  });
}

async function playFile(base, id, token) {
  // Prefer Edge neural mp3; fall back to older wav if still present.
  for (const ext of ['mp3', 'wav']) {
    if (token !== seq) return true;
    const ok = await playUrl(`${base}/${id}.${ext}`);
    if (ok) return true;
  }
  return false;
}

async function playOne(lang, id, token) {
  if (S.muted || token !== seq) return;
  const text = (LINES[id] || ['', ''])[lang === 'en' ? 0 : 1];
  if (custom) {
    if (await playFile(`assets/voice/custom/${lang}`, id, token)) return;
    if (token !== seq) return;
  }
  if (await playFile(`assets/voice/${lang}`, id, token)) return;
  if (token !== seq) return;
  await fallbackSpeak(lang, text);
}

/** True while an English/Turkish line is playing. */
export function speaking() {
  return playing;
}

/** Soft ambient lines wait until the current line and a short quiet gap are done. */
export function canAmbient() {
  return !playing && !S.muted && performance.now() >= ambientUntil;
}

/**
 * Say the English line, then Turkish.
 * Soft lines never interrupt: they skip if something is already speaking
 * or if an ambient quiet gap is still active.
 */
export function say(id, opts) {
  const soft = !!(opts && opts.soft);
  if (soft && !canAmbient()) return Promise.resolve(false);
  const token = ++seq;
  stopPlayback();
  playing = true;
  return (async () => {
    try {
      await playOne('en', id, token);
      if (token !== seq || !S.turkish || S.muted) return token === seq;
      await delay(220);
      if (token !== seq) return false;
      await playOne('tr', id, token);
      return token === seq;
    } finally {
      if (token === seq) {
        playing = false;
        // Soft (animals, splash) leave a longer quiet gap so the garden doesn't chatter.
        ambientUntil = performance.now() + (soft ? 3200 : 900);
      }
    }
  })();
}

export function hush() {
  seq++;
  playing = false;
  ambientUntil = performance.now() + 400;
  stopPlayback();
}
