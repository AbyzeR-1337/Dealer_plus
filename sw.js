// Service worker: network-first for the app shell (so updates arrive on the next launch),
// cache fallback when offline. The version string is stamped by the GitHub Actions build.
const VERSION = '__BUILD__';
const CACHE = 'gr-' + VERSION;
const ART = ['./assets/sheets/sheet1.webp', './assets/sheets/sheet2.webp', './assets/sheets/sheet3.webp']
  .concat(['char', 'warm', 'cold', 'green', 'red', 'asphalt'].map((t) => `./assets/tex/bg_${t}.webp`));

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await c.addAll(['./', './index.html', './css/app.css', './js/main.js', './manifest.webmanifest']).catch(() => {});
    await c.addAll(ART).catch(() => {}); // painted sprite sheets + textures so item photos work offline
  }));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('gr-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // online API calls go straight to the network
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (url.pathname.includes('/assets/')) { // big static art: cache-first (a new build gets a fresh cache anyway)
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
    }
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
