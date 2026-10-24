/*
 * Child profiles: up to four children on one device, each with an avatar, a name and their own
 * progress (a separate save). The first profile keeps the original save key, so progress from
 * before profiles existed simply becomes the first child's.
 *
 * Switching profile reloads the page: every module then starts cleanly with that child's save.
 */
const PKEY = 'superayi_profiles';
export const MAX_PROFILES = 4;
export const AVATARS = ['🐻', '🐰', '🐱', '🦊', '🐸', '🐥', '🐼', '🦁'];

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY) || 'null');
    if (p && Array.isArray(p.list) && p.list.length) {
      if (!p.list.some((q) => q.id === p.current)) p.current = p.list[0].id;
      return p;
    }
  } catch (e) { /* fall through */ }
  return { list: [{ id: 'p1', name: '', avatar: '🐻' }], current: 'p1' };
}

export const PROFILES = load();

function store() {
  try { localStorage.setItem(PKEY, JSON.stringify(PROFILES)); } catch (e) { /* private mode */ }
}

export function currentProfile() {
  return PROFILES.list.find((p) => p.id === PROFILES.current) || PROFILES.list[0];
}

/** localStorage key of a profile's save. */
export function saveKeyFor(id) {
  return id === 'p1' ? 'superayi_en_v2' : `superayi_en_v2_${id}`;
}

export function displayName(p, i) {
  return (p.name || '').trim() || `Kaşif ${i + 1}`;
}

export function addProfile(name, avatar) {
  if (PROFILES.list.length >= MAX_PROFILES) return null;
  const p = { id: `p${Date.now().toString(36)}`, name: (name || '').trim().slice(0, 16), avatar: avatar || AVATARS[PROFILES.list.length % AVATARS.length] };
  PROFILES.list.push(p);
  store();
  return p;
}

export function updateProfile(id, patch) {
  const p = PROFILES.list.find((q) => q.id === id);
  if (!p) return;
  if (patch.name !== undefined) p.name = String(patch.name).trim().slice(0, 16);
  if (patch.avatar) p.avatar = patch.avatar;
  store();
}

/** Remove a child and their progress. The last profile can't be removed. */
export function removeProfile(id) {
  if (PROFILES.list.length <= 1) return false;
  PROFILES.list = PROFILES.list.filter((p) => p.id !== id);
  try { localStorage.removeItem(saveKeyFor(id)); } catch (e) { /* ignore */ }
  if (PROFILES.current === id) PROFILES.current = PROFILES.list[0].id;
  store();
  return true;
}

/** Make `id` the active child. The caller reloads the page. */
export function selectProfile(id) {
  if (!PROFILES.list.some((p) => p.id === id)) return;
  PROFILES.current = id;
  store();
}

/** Quick look at another profile's progress without loading it (for the picker). */
export function peekProgress(id) {
  try {
    const s = JSON.parse(localStorage.getItem(saveKeyFor(id)) || '{}');
    const words = s.words || {};
    const learned = Object.values(words).filter((w) => w && w.found && w.chosen).length;
    return { learned, coins: s.coins || 0 };
  } catch (e) {
    return { learned: 0, coins: 0 };
  }
}
