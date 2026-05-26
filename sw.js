/* BajteBrothers – Rescue Mission · Service Worker */
const CACHE_NAME = 'bajtebrothers-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './slika1.jpg',
  './slika2.jpeg'
];

/* Install: cache all core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Activate: remove old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first for local assets, network-first for fonts/external */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    /* Cache-first strategy for local files */
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          if (cached) return cached;
          return new Response('Offline – please reconnect', { status: 503, statusText: 'Offline' });
        });
      })
    );
  } else {
    /* Network-first for external resources (Google Fonts, etc.) */
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
