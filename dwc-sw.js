// Days Worth Counting: offline support.
// Caches only the app's own files (and fonts once they've loaded), never other pages on the site.
const CACHE = 'dwc-v1';
const APP_FILES = [
  'days-worth-counting-app.html',
  'dwc-manifest.json',
  'dwc-icon-192.png',
  'dwc-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dwc-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isApp = APP_FILES.some((f) => url.pathname.endsWith('/' + f));
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (event.request.method !== 'GET' || (!isApp && !isFont)) return;

  // Network first so updates show up; fall back to the cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
