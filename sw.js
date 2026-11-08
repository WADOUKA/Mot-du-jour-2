/* Service worker — Mot du jour. Mode hors connexion complet.
   Pour publier une nouvelle version : changez CACHE_VERSION. */
const CACHE_VERSION = 'mot-du-jour-v10-1';
const PRECACHE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages : on sert toujours l'application mise en cache (aucun besoin d'internet).
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then(hit => hit || caches.match('./')).then(hit => hit || fetch(req))
    );
    return;
  }
  // Autres fichiers : cache d'abord, réseau en secours, puis mise en cache.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
