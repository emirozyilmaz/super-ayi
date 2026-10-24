/*
 * Device settings, shared by every child profile on this device: sound levels and the
 * speaking-practice mode. (Learning progress lives in each profile's save, see save.js.)
 */
const KEY = 'superayi_settings';

const DEFAULTS = {
  music: 0.5, // 0..1
  sfx: 0.8,
  voice: 1,
  speak: 'echo', // 'mic' = record and play back the child, 'echo' = pause to repeat, 'off'
};

function load() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || '{}'));
  } catch (e) {
    return Object.assign({}, DEFAULTS);
  }
}

export const SET = load();

const listeners = [];
export function onSettings(fn) { listeners.push(fn); }

export function saveSettings(patch) {
  Object.assign(SET, patch);
  try { localStorage.setItem(KEY, JSON.stringify(SET)); } catch (e) { /* private mode */ }
  listeners.forEach((fn) => fn(SET));
}
