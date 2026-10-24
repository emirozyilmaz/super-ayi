import { LESSON } from './lines.js';
import { PROFILES, saveKeyFor } from './profiles.js';

// Each child profile has its own save; the first one keeps the original key.
const KEY = saveKeyFor(PROFILES.current);
// 2: chapters 4 (balloons, numbers) and 5 (hide and seek) were added after step 38.
const CONTENT_VERSION = 2;
const NEW_CHAPTERS_STEP = 39;

function blankWord() {
  // streak: first-try right answers in a row; at KNOWN_STREAK the Turkish translation fades out.
  return { heard: false, found: false, chosen: false, kept: false, streak: 0 };
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
    reviewDay: '',
    albumSeen: [],
    playLog: {}, // day -> seconds played (weekly report, daily limit)
    limitMin: 0, // daily play limit in minutes, 0 = no limit
    limitExtra: null, // { day, min }: extra time a parent granted today
    hunt: null, // today's word-of-the-day hunt
    contentVersion: CONTENT_VERSION,
  };
}

export function loadSave() {
  const s = emptySave();
  try {
    let raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
    Object.assign(s, raw);
    s.words = Object.assign(emptySave().words, raw.words || {});
    LESSON.forEach((id) => { s.words[id] = Object.assign(blankWord(), s.words[id]); });
    if (!Array.isArray(s.hats)) s.hats = [];
    s.outfit = Object.assign({ hat: s.hat || null, eyes: null, back: null }, raw.outfit || {});
    if (!Array.isArray(s.albumSeen)) s.albumSeen = [];
    if (!s.playLog || typeof s.playLog !== 'object') s.playLog = {};
    if (!Number.isInteger(s.quest) || s.quest < 0) s.quest = 0;
    if (raw.quest !== undefined && !raw.contentVersion) {
      // Saved before chapters 4–5 existed: a finished game carries on with the new chapters
      // (step 39 was the old ending and is now the first balloon step).
      if (raw.finished) { s.finished = false; s.quest = NEW_CHAPTERS_STEP; }
      s.contentVersion = CONTENT_VERSION;
    }
  } catch (e) { /* keep defaults */ }
  return s;
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
}

export const KNOWN_STREAK = 2;

/** The child has picked this word right on the first try often enough to hear it in English only. */
export function isKnown(s, word) {
  return !!(word && s.words[word] && s.words[word].streak >= KNOWN_STREAK);
}

export function masteredCount(s) {
  return LESSON.filter((id) => s.words[id] && s.words[id].found && s.words[id].chosen).length;
}
