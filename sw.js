/*
 * Offline support. The first visit (online) stores the game in the browser; after that it opens
 * without internet, also from the home-screen icon.
 *
 * Strategy:
 *  - The page and the code (html, js, manifest): network first with a short timeout, the stored
 *    copy when offline. So an update arrives all at once and old and new files never mix.
 *  - Sounds, models and pictures (large, rarely change): the stored copy at once, refreshed in
 *    the background (stale-while-revalidate). Voice clips are stored as the game preloads them.
 *  - Only complete (200) answers are stored.
 *
 * Bump VERSION to drop everything and start clean.
 */
const VERSION = 'v2';
const CACHE = `superayi-${VERSION}`;
const NET_TIMEOUT = 3500;

const JS = ['main', 'state', 'save', 'audio', 'assets', 'batch', 'bear', 'world', 'toys', 'player', 'quest',
  'guide', 'icons', 'lines', 'props', 'balloons', 'hide', 'spots', 'album', 'settings', 'music', 'profiles',
  'stats', 'speak', 'wordhunt', 'daily', 'family'];

const CORE = [
  './', './index.html', './manifest.webmanifest',
  ...JS.map((n) => `./js/${n}.js`),
  './vendor/three/three.module.js',
  './vendor/three/addons/loaders/GLTFLoader.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
  './vendor/three/addons/utils/SkeletonUtils.js',
  ...['flowers', 'flower', 'bush_berries', 'bush_flowers', 'grass', 'mushroom', 'fox', 'rabbit',
    'cat2', 'birb', 'frog', 'chicken', 'lilypad'].map((n) => `./assets/models/${n}.glb`),
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png', './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('superayi-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function store(cache, key, res) {
  if (res && res.status === 200 && res.type === 'basic') cache.put(key, res.clone()).catch(() => {});
}

function withTimeout(p, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.startsWith(scope.pathname) ? url.pathname.slice(scope.pathname.length) : null;
  if (rel === null) return;

  if (req.mode === 'navigate') {
    // Only the game page itself; any other page in this folder is left to the network.
    if (rel !== '' && rel !== 'index.html') return;
    e.respondWith(networkFirst(req, './index.html'));
    return;
  }
  if (/\.(js|html|webmanifest)$/.test(rel)) {
    e.respondWith(networkFirst(req, req));
    return;
  }
  e.respondWith(staleWhileRevalidate(e, req));
});

async function networkFirst(req, key) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(req), NET_TIMEOUT);
    if (res.ok) {
      store(cache, key, res);
      return res;
    }
    const hit = await cache.match(key, { ignoreSearch: true });
    return hit || res;
  } catch (err) {
    const hit = await cache.match(key, { ignoreSearch: true });
    return hit || new Response('', { status: 504, statusText: 'offline' });
  }
}

async function staleWhileRevalidate(e, req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => { store(cache, req, res); return res; }).catch(() => null);
  if (hit) {
    e.waitUntil(fresh);
    return hit;
  }
  return (await fresh) || new Response('', { status: 504, statusText: 'offline' });
}
