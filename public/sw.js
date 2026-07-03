/*
 * Service worker: instant repeat visits + offline shell, without stale-content
 * bugs. Strategy:
 *   - Navigations (HTML): network-first, fall back to cache, then offline page.
 *     Keeps content fresh; still works offline.
 *   - Hashed build assets (/_astro/*) and static files: cache-first. They are
 *     content-addressed and immutable, so this is always safe.
 *
 * Bump CACHE_VERSION to invalidate everything on a breaking change.
 */

const CACHE_VERSION = 'v1';
const CACHE = `portfolio-${CACHE_VERSION}`;
const PRECACHE = ['/', '/projects', '/about', '/404'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(PRECACHE);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first for freshness.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || (await caches.match('/404')) || Response.error();
        }
      })(),
    );
    return;
  }

  // Immutable/static assets: cache-first with background fill.
  if (
    url.pathname.startsWith('/_astro/') ||
    /\.(css|js|woff2?|avif|webp|png|jpg|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      })(),
    );
  }
});
