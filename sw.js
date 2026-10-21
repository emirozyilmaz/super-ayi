/*
 * Offline support. The first visit (online) stores the game in the browser; after that it opens
 * without internet, also from the home-screen icon.
 *
 * Strategy: answer from the cache at once, then refresh that file from the network in the
 * background (stale-while-revalidate). An update therefore shows up on the launch after next
 * file change, never half-way through a game. Voice clips are cached as the game preloads them.
 *
 * Bump VERSION only to drop everything and start clean.
 */
const VERSION = 'v1';
const CACHE = `superayi-${VERSION}`;

const CORE = [
  './', './index.html', './manifest.webmanifest',
  './js/main.js', './js/state.js', './js/save.js', './js/audio.js', './js/assets.js', './js/batch.js',
  './js/bear.js', './js/world.js', './js/toys.js', './js/player.js', './js/quest.js', './js/guide.js',
  './js/icons.js', './js/lines.js', './js/props.js', './js/balloons.js', './js/hide.js', './js/spots.js', './js/album.js',
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
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('superayi-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // The page itself is cached once, whatever ?query it was opened with.
  const isPage = req.mode === 'navigate';
  const key = isPage ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(key, { ignoreSearch: isPage });
    const fresh = fetch(req).then((res) => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => null);
    if (hit) {
      e.waitUntil(fresh);
      return hit;
    }
    return (await fresh) || new Response('', { status: 504, statusText: 'offline' });
  }));
});
