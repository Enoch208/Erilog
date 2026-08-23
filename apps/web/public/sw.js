/// <reference lib="webworker" />

const CACHE_NAME = 'erilog-v1';
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/manifest.json',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API routes: network-only (never cache mutable data)
// - App shell/static assets: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for API calls and sync
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      }).catch(() => cached);

      return cached || fetched;
    })
  );
});
