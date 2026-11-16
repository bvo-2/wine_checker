/*
 * Decant service worker. vite.config.ts fills in the two placeholders at build
 * time and writes the result to dist/sw.js. Plain JavaScript: it is not bundled.
 *
 * Strategy: store every file of the app on install, then answer from that store.
 * A new build has a new CACHE name; it takes over the next time the app is
 * opened after all its tabs were closed, so a running page never mixes versions.
 */
const CACHE = 'decant-__CACHE_VERSION__';
const URLS = '__PRECACHE_URLS__';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('decant-') && name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      // Start serving the page that installed us, so it works offline right away.
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // The app is one page; every navigation gets index.html (stored as "./").
      const cached =
        request.mode === 'navigate'
          ? await cache.match('./')
          : // ignoreVary: servers often send "Vary: Origin", and the page loads its script
            // with different request headers than the ones used to store it.
            await cache.match(request, { ignoreSearch: true, ignoreVary: true });
      return cached ?? fetch(request);
    }),
  );
});
