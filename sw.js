/* WA Professionnels Maroc · Service Worker
   Versión de caché única; solo se consulta la caché actual para no servir
   archivos antiguos. HTML network-first, estáticos cache-first. */
const CACHE_VERSION = 'cw-v18';
const CACHE_NAME = 'wa-professionnels-maroc-' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './login.html',
  './dashboard.html',
  './catalogo.html',
  './porfolio.html',
  './assets/css/portfolio.css?v=2',
  './assets/js/portfolio.js?v=4',
  './manifest.webmanifest',
  './assets/css/styles.css?v=16',
  './assets/css/landing.css?v=9',
  './assets/css/catalog.css?v=9',
  './assets/css/assistant.css?v=6',
  './assets/js/config.js?v=10',
  './assets/js/i18n.js?v=15',
  './assets/js/store.js?v=11',
  './assets/js/panel-i18n.js?v=4',
  './assets/js/common.js?v=12',
  './assets/js/policies.js?v=7',
  './assets/js/landing.js?v=1',
  './assets/js/auth.js?v=10',
  './assets/js/dashboard.js?v=16',
  './assets/js/catalog.js?v=15',
  './assets/js/assistant.js?v=7'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => (k.startsWith('wa-professionnels-maroc-') || k.startsWith('catalogo-wha-')) && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const isHTML = req.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // network-first
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.open(CACHE_NAME).then((c) => c.match(req)).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // cache-first con actualización en segundo plano
  e.respondWith(
    caches.open(CACHE_NAME).then((c) =>
      c.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) c.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
