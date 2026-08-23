/// <reference lib="webworker" />

const CACHE_NAME = 'erilog-v2';
const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/logo.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('erilog-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isNextDataRequest(request, url) {
  return request.headers.get('RSC') === '1'
    || request.headers.has('Next-Router-State-Tree')
    || request.headers.has('Next-Router-Prefetch')
    || url.searchParams.has('_rsc');
}

async function networkFirstLanding(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) await cache.put('/', response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match('/');
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone());
    }
    return response;
  });

  if (cached) {
    void network.catch(() => undefined);
    return cached;
  }

  return network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Session, API, and React Server Component responses must always come from
  // the network. Caching them can replay stale auth or hydration payloads.
  if (
    url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/judge')
    || isNextDataRequest(request, url)
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    if (url.pathname === '/') event.respondWith(networkFirstLanding(request));
    return;
  }

  const cacheableStaticAsset = url.pathname.startsWith('/_next/static/')
    || ['font', 'image', 'script', 'style'].includes(request.destination)
    || PRECACHE_URLS.includes(url.pathname);

  if (cacheableStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
