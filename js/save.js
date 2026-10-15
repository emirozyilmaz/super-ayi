import { LESSON } from './lines.js';

const KEY = 'superayi_en_v2';

function blankWord() {
  return { heard: false, found: false, chosen: false, kept: false };
}

export function emptySave() {
  const words = {};
  LESSON.forEach((id) => { words[id] = blankWord(); });
  return {
    turkish: true,
    sfx: true,
    muted: false,
    coins: 0,
    hats: [],
    hat: null,
    outfit: { hat: null, eyes: null, back: null },
    quest: 0,
    words,
    rescues: 0,
    finished: false,
  };
}

export function loadSave() {
  const s = emptySave();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    Object.assign(s, raw);
    s.words = Object.assign(emptySave().words, raw.words || {});
    LESSON.forEach((id) => { s.words[id] = Object.assign(blankWord(), s.words[id]); });
    if (!Array.isArray(s.hats)) s.hats = [];
    s.outfit = Object.assign({ hat: s.hat || null, eyes: null, back: null }, raw.outfit || {});
  } catch (e) { /* keep defaults */ }
  return s;
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
}

export function masteredCount(s) {
  return LESSON.filter((id) => s.words[id] && s.words[id].found && s.words[id].chosen).length;
}
