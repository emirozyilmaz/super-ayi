import { LINES, lineWord } from './lines.js';
import { S } from './state.js';
import { isKnown } from './save.js';
import { SET, onSettings } from './settings.js';

let seq = 0;
let playing = false;
let ambientUntil = 0;
let custom = false;
let ac = null;
let currentAudio = null;
let currentSrc = null;
let stopCurrent = null; // resolves the line that is playing when it gets cut off

/*
 * Voice clips play through Web Audio: once the first tap unlocks the context, iPad/iPhone
 * let every later line play (an <audio> started by a timer can be blocked there), and there
 * is no per-line loading delay. Compressed bytes are cached for all clips; decoded audio is
 * kept only for the most recent lines so a tablet's memory stays small.
 *
 * Mixer: voice, effects and music each have their own volume (family panel), all through one
 * master gain that the mute button closes.
 */
const bytes = new Map(); // url -> Promise<ArrayBuffer|null>
const decoded = new Map(); // url -> AudioBuffer, oldest first
const DECODED_MAX = 40;
const bus = { master: null, voice: null, sfx: null, music: null };

function makeContext() {
  if (ac) return;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
  bus.master = ac.createGain();
  bus.master.connect(ac.destination);
  ['voice', 'sfx', 'music'].forEach((k) => {
    bus[k] = ac.createGain();
    bus[k].connect(bus.master);
  });
  applyVolumes();
}

/** Mixer levels from the settings and the mute button. */
export function applyVolumes() {
  if (!ac) return;
  const t = ac.currentTime;
  bus.master.gain.setTargetAtTime(S.muted ? 0 : 1, t, 0.03);
  bus.voice.gain.setTargetAtTime(SET.voice, t, 0.03);
  bus.sfx.gain.setTargetAtTime(SET.sfx, t, 0.03);
  bus.music.gain.setTargetAtTime(SET.music * 0.5, t, 0.03);
  if (currentAudio) currentAudio.volume = S.muted ? 0 : SET.voice;
}
onSettings(applyVolumes);

export function audioCtx() { return ac; }
export function voiceBus() { return bus.voice; }
export function musicBus() { return bus.music; }

export async function initAudio() {
  makeContext();
  try {
    const r = await fetch('assets/voice/custom/on.txt', { method: 'HEAD' });
    custom = r.ok;
  } catch (e) { custom = false; }
}

export function unlockAudio() {
  makeContext();
  if (ac && ac.state !== 'running') ac.resume().catch(() => {});
}

/*
 * Safari only lets audio start inside certain gestures (touchend / click, not touchstart or a
 * touch pointerdown). Listen to all of them until the context is really running, and again
 * whenever the system suspends it (app in the background, a phone call).
 */
function keepUnlocked() {
  const kick = () => { if (!ac || ac.state !== 'running') unlockAudio(); };
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, kick, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
}
keepUnlocked();

function fetchBytes(url) {
  if (!bytes.has(url)) {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), 9000) : 0;
    const p = fetch(url, ctl ? { signal: ctl.signal } : undefined)
      .then((r) => (r.ok ? r.arrayBuffer() : null)) // a real 404 stays null (try the next format)
      .catch(() => {
        bytes.delete(url); // a network hiccup is not final: try again next time
        return null;
      })
      .finally(() => clearTimeout(timer));
    bytes.set(url, p);
  }
  return bytes.get(url);
}

/** Every bundled voice clip. */
export function voiceUrls() {
  const urls = [];
  Object.keys(LINES).forEach((id) => ['en', 'tr'].forEach((l) => urls.push(`assets/voice/${l}/${id}.mp3`)));
  return urls;
}

/** Download every bundled clip in the background, a few at a time. */
export async function preloadVoices() {
  const urls = voiceUrls();
  const worker = async () => {
    while (urls.length) await fetchBytes(urls.shift());
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}

async function getBuffer(url) {
  if (decoded.has(url)) {
    const b = decoded.get(url);
    decoded.delete(url);
    decoded.set(url, b);
    return b;
  }
  const raw = await fetchBytes(url);
  if (!raw || !ac) return null;
  try {
    // decodeAudioData detaches its input, so decode a copy and keep the cached bytes.
    const buf = await ac.decodeAudioData(raw.slice(0));
    decoded.set(url, buf);
    if (decoded.size > DECODED_MAX) decoded.delete(decoded.keys().next().value);
    return buf;
  } catch (e) { return null; }
}

function playBuffer(buf) {
  return new Promise((resolve) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(bus.voice);
    currentSrc = src;
    let done = false;
    // If the system suspends audio mid-line (phone call, Siri), onended never comes: give up
    // a little after the clip should have finished, so speech never stays "busy" forever.
    const safety = setTimeout(() => finish(false), buf.duration * 1000 + 1500);
    function finish(ok) {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (currentSrc === src) { currentSrc = null; stopCurrent = null; }
      resolve(ok);
    }
    stopCurrent = () => finish(false);
    src.onended = () => finish(true);
    src.start();
  });
}

function tone(f0, f1, dur, type, vol, delay) {
  if (S.muted || !ac || SET.sfx <= 0) return;
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
    o.connect(g); g.connect(bus.sfx);
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
  if (currentSrc) {
    try { currentSrc.onended = null; currentSrc.stop(); } catch (e) { /* ignore */ }
    currentSrc = null;
  }
  if (stopCurrent) { const s = stopCurrent; stopCurrent = null; s(); }
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
    a.volume = S.muted ? 0 : SET.voice;
    currentAudio = a;
    let done = false;
    const safety = setTimeout(() => finish(false), 12000);
    function finish(ok) {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (currentAudio === a) { currentAudio = null; stopCurrent = null; }
      resolve(ok);
    }
    stopCurrent = () => finish(false);
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    const p = a.play();
    if (p && p.catch) p.catch(() => finish(false));
  });
}

function fallbackSpeak(lang, text) {
  if (!('speechSynthesis' in window) || !text) return Promise.resolve();
  return new Promise((resolve) => {
    // Some browsers drop onend after cancel(); never wait longer than the text could take.
    const safety = setTimeout(resolve, 1500 + text.length * 120);
    const done = () => { clearTimeout(safety); resolve(); };
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'en' ? 'en-US' : 'tr-TR';
      u.rate = lang === 'en' ? 0.88 : 0.94;
      u.pitch = lang === 'en' ? 1.1 : 1.0;
      u.volume = SET.voice;
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    } catch (e) { done(); }
  });
}

async function playFile(base, id, token) {
  // Prefer Edge neural mp3; fall back to older wav if still present.
  for (const ext of ['mp3', 'wav']) {
    if (token !== seq) return true;
    const url = `${base}/${id}.${ext}`;
    if (ac && ac.state === 'running') {
      const buf = await getBuffer(url);
      if (token !== seq) return true;
      if (!buf) continue; // no such file: try the next format
      await playBuffer(buf);
      return true;
    }
    const ok = await playUrl(url);
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
 * Resolves true when the line played to the end, false when it was cut off.
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
      // A known word is English-only; tapping "listen again" (opts.tr) still brings the Turkish back.
      // opts.noTr: English only (the album quiz, where Turkish would give the answer away).
      const wantTr = S.turkish && !(opts && opts.noTr) && (!!(opts && opts.tr) || !isKnown(S, lineWord(id)));
      if (token !== seq || !wantTr || S.muted) return token === seq;
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
