// Service worker: caches the app shell (HTML/CSS/JS/fonts) as it's visited,
// so the app can still be OPENED even with zero internet connection.
// Actual data (siswa, biodata, nilai, dst) is handled separately via
// localStorage + a Firebase sync queue in the main app — this file only
// makes sure the app itself loads offline.

const CACHE_NAME = 'dwi-septiana-app-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached); // offline & not cached yet -> nothing we can do for this request

      // Stale-while-revalidate: show cached instantly if we have it, refresh in background.
      return cached || networkFetch;
    })
  );
});
