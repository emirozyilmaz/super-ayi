/*
 * Background music, written in code (no files): a slow, cheerful marimba tune in C major with a
 * soft bass and ukulele-like offbeat chords, 92 bpm, 8 bars. It is quiet on purpose, drops
 * further while a line is being spoken, and sounds muffled underwater.
 *
 * Notes are scheduled a little ahead on the AudioContext clock, so timing stays steady even when
 * frames are slow.
 */
const BPM = 92;
const STEP = 60 / BPM / 2; // eighth note
const AHEAD = 0.25;

// Melody (MIDI numbers, null = rest), one array of 8 eighths per bar.
const MELODY = [
  [76, null, 79, 81, 79, null, 76, 74], // C
  [72, null, 76, 74, 72, null, 69, null], // Am
  [72, null, 74, 76, 77, null, 76, 74], // F
  [74, null, 79, null, 77, 76, 74, null], // G
  [79, 81, 79, 76, 72, null, 74, 76], // C
  [76, null, 72, null, 69, 72, 74, null], // Am
  [77, 76, 74, 72, 74, null, 76, null], // F
  [74, 76, 77, 79, null, 74, 72, null], // G
];
const BASS = [36, 45, 41, 43, 36, 45, 41, 43];
const CHORDS = [
  [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62],
  [60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62],
];

const hz = (m) => 440 * 2 ** ((m - 69) / 12);

let ac = null;
let out = null; // music bus (a GainNode from audio.js)
let filter = null;
let duck = null;
let timer = 0;
let step = 0;
let nextAt = 0;
let running = false;

function note(freq, at, dur, type, vol, overtone) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(duck);
  o.start(at);
  o.stop(at + dur + 0.05);
  if (overtone) {
    // A quiet, fast-fading 4th harmonic gives the marimba "tok".
    const o2 = ac.createOscillator();
    const g2 = ac.createGain();
    o2.frequency.value = freq * 4;
    g2.gain.setValueAtTime(0.0001, at);
    g2.gain.exponentialRampToValueAtTime(vol * 0.25, at + 0.004);
    g2.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    o2.connect(g2);
    g2.connect(duck);
    o2.start(at);
    o2.stop(at + 0.2);
  }
}

function schedule() {
  if (!running || !ac) return;
  while (nextAt < ac.currentTime + AHEAD) {
    const bar = Math.floor(step / 8) % MELODY.length;
    const s = step % 8;
    const m = MELODY[bar][s];
    if (m) note(hz(m), nextAt, 0.55, 'sine', 0.16, true);
    if (s === 0 || s === 4) note(hz(BASS[bar]), nextAt, 0.6, 'sine', 0.2, false);
    if (s === 2 || s === 6) CHORDS[bar].forEach((c, i) => note(hz(c), nextAt + i * 0.012, 0.25, 'triangle', 0.035, false));
    nextAt += STEP;
    step++;
  }
}

/** Connect to the shared AudioContext and the music bus (from audio.js). */
export function initMusic(context, bus) {
  if (ac) return;
  ac = context;
  out = bus;
  filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 18000;
  duck = ac.createGain();
  duck.gain.value = 1;
  duck.connect(filter);
  filter.connect(out);
}

export function startMusic() {
  if (!ac || running) return;
  running = true;
  nextAt = ac.currentTime + 0.1;
  timer = setInterval(schedule, 60);
  schedule();
}

export function stopMusic() {
  running = false;
  clearInterval(timer);
}

/** Per frame: quieter while someone speaks, nearly silent while the child is recorded, muffled under water. */
export function tickMusic(speaking, underwater, recording) {
  if (!ac || !duck) return;
  const t = ac.currentTime;
  const level = recording ? 0.05 : speaking ? 0.3 : 1;
  duck.gain.setTargetAtTime(level, t, level < 1 ? 0.08 : 0.6);
  filter.frequency.setTargetAtTime(underwater ? 700 : 18000, t, 0.25);
}
