import { S, G } from './state.js';
import { SET } from './settings.js';
import { say, sfx, hush, audioCtx, voiceBus } from './audio.js';
import { writeSave } from './save.js';
import { cardIcon } from './icons.js';

/*
 * "Your turn!" speaking practice. Lila says the word, then the child says it.
 *  - mic:  the child's voice is recorded for ~2 seconds and played straight back (a little
 *          higher, which children love). Nothing is stored or sent anywhere.
 *  - echo: no microphone; a short pause with a pulsing mic invites the child to say it.
 * A parent turns the microphone on in the family panel (that is where the browser asks for
 * permission), so the permission prompt never surprises the child mid-game.
 */
const $ = (id) => document.getElementById(id);
const REC_SEC = 2.2;
let stream = null;
let open = false;
let skip = null;

export function speakOpen() { return open; }

/** Stop the speaking moment at once (pause, break screen). */
export function cancelSpeak() {
  if (!open) return;
  if (cancelHook) cancelHook();
}
let cancelHook = null;

/** Ask for the microphone (from a parent's tap). Resolves true when it can record. */
export async function enableMic() {
  if (stream) return true;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    return true;
  } catch (e) {
    stream = null;
    return false;
  }
}

export function micReady() { return !!stream; }

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function setStage(icon, text) {
  $('speakStage').textContent = icon;
  $('speakHint').textContent = text;
}

function level(v) {
  $('speakMeter').style.transform = `scale(${1 + Math.min(1, v * 6) * 0.6})`;
}

/** Record REC_SEC seconds. Resolves { buffer, peak } (buffer null when recording failed). */
function record() {
  const ac = audioCtx();
  if (!ac || !stream) return Promise.resolve({ buffer: null, peak: 0 });
  return new Promise((resolve) => {
    const src = ac.createMediaStreamSource(stream);
    const proc = ac.createScriptProcessor(2048, 1, 1);
    const mute = ac.createGain();
    mute.gain.value = 0;
    const chunks = [];
    let peak = 0;
    let done = false;
    proc.onaudioprocess = (e) => {
      if (done) return;
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      let p = 0;
      for (let i = 0; i < d.length; i += 4) p = Math.max(p, Math.abs(d[i]));
      peak = Math.max(peak, p);
      level(p);
    };
    src.connect(proc);
    proc.connect(mute);
    mute.connect(ac.destination);
    const finish = () => {
      if (done) return;
      done = true;
      try { src.disconnect(); proc.disconnect(); mute.disconnect(); } catch (e) { /* ignore */ }
      level(0);
      const total = chunks.reduce((n, c) => n + c.length, 0);
      if (!total) { resolve({ buffer: null, peak: 0 }); return; }
      const buf = ac.createBuffer(1, total, ac.sampleRate);
      const ch = buf.getChannelData(0);
      let o = 0;
      chunks.forEach((c) => { ch.set(c, o); o += c.length; });
      resolve({ buffer: buf, peak });
    };
    setTimeout(finish, REC_SEC * 1000);
    skip = finish;
  });
}

/** Play the child's own recording back, levelled and a touch higher. */
function playBack(buffer, peak) {
  const ac = audioCtx();
  if (!ac || !buffer) return Promise.resolve();
  return new Promise((resolve) => {
    const src = ac.createBufferSource();
    const g = ac.createGain();
    src.buffer = buffer;
    src.playbackRate.value = 1.12;
    g.gain.value = Math.min(5, 0.7 / Math.max(0.02, peak));
    src.connect(g);
    g.connect(voiceBus());
    src.onended = () => resolve();
    src.start();
    skip = () => { try { src.stop(); } catch (e) { /* ignore */ } resolve(); };
  });
}

/** Pulse the mic for a moment so the child can say the word (no recording). */
function echoPause() {
  return new Promise((resolve) => {
    let t = 0;
    const id = setInterval(() => {
      t += 0.1;
      level(Math.abs(Math.sin(t * 5)) * 0.12);
      if (t >= REC_SEC) { clearInterval(id); level(0); resolve(); }
    }, 100);
    skip = () => { clearInterval(id); level(0); resolve(); };
  });
}

function show(word) {
  $('speakIcon').innerHTML = cardIcon(word);
  $('speakWord').textContent = word;
  $('speak').classList.remove('hidden');
  open = true;
}

function hide() {
  $('speak').classList.add('hidden');
  open = false;
  skip = null;
  cancelHook = null;
}

/** Should this correct answer be followed by speaking practice? */
export function wantsSpeak(word) {
  if (SET.speak === 'off' || S.muted) return false;
  const w = S.words[word];
  const spoken = (w && w.spoken) || 0;
  // New words always; words already said twice only now and then.
  return spoken < 2 || Math.random() < 0.25;
}

/** The whole "your turn" moment. Resolves when it is over (or skipped). */
export async function speakPractice(word) {
  show(word);
  let cancelled = false;
  const guard = () => cancelled || !open;
  cancelHook = () => {
    cancelled = true;
    hush();
    if (skip) skip();
  };
  $('speakSkip').onpointerdown = (e) => {
    e.preventDefault();
    cancelHook();
  };
  try {
    setStage('👂', 'Dinle');
    await say(word);
    if (guard()) return;
    await say('your-turn');
    if (guard()) return;
    const useMic = SET.speak === 'mic' && stream;
    if (useMic) {
      setStage('🎤', 'Şimdi sen söyle!');
      let rec = await record();
      if (guard()) return;
      if (rec.peak < 0.04) {
        await say('say-again');
        if (guard()) return;
        setStage('🎤', 'Biraz daha yüksek!');
        rec = await record();
        if (guard()) return;
      }
      if (rec.buffer && rec.peak >= 0.04) {
        setStage('🔁', 'Bu senin sesin!');
        await say('listen-you');
        if (guard()) return;
        await playBack(rec.buffer, rec.peak);
        if (guard()) return;
        await wait(250);
      }
    } else {
      setStage('🎤', 'Şimdi sen söyle!');
      await echoPause();
      if (guard()) return;
    }
    setStage('⭐', 'Harika!');
    sfx.star();
    const w = S.words[word];
    if (w) { w.spoken = (w.spoken || 0) + 1; writeSave(S); }
    await say('well-said');
  } finally {
    hide();
  }
}
