/* The Key service worker — offline app shell. Your data lives in localStorage, never in this cache. */
const CACHE = 'thekey-v1.3.0';
const SHELL = ['./', './index.html', './css/styles.css', './js/gazette.js', './js/data.js', './js/core.js', './js/discover.js', './js/app.js', './manifest.webmanifest', './personal.enc.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './fonts/unifrakturmaguntia-latin-400-normal.woff2', './fonts/playfair-display-latin-700-normal.woff2', './fonts/playfair-display-latin-900-normal.woff2', './fonts/playfair-display-latin-400-italic.woff2', './fonts/old-standard-tt-latin-400-normal.woff2', './fonts/old-standard-tt-latin-400-italic.woff2', './fonts/old-standard-tt-latin-700-normal.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network-first for same-origin files (so updates arrive), falling back to cache offline.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((cs) => (cs[0] ? cs[0].focus() : self.clients.openWindow('./'))));
});
