// ===== GarageOS Service Worker =====
// Aggiorna questo numero ogni volta che carichi una nuova versione su GitHub!
const VERSION = '1.5.0';
const CACHE_NAME = 'garageos-v' + VERSION;

// File da cachare per uso offline
const PRECACHE = [
  '/garageOS/',
  '/garageOS/index.html',
];

// ── Install: precache i file principali
self.addEventListener('install', event => {
  console.log('[SW] Install v' + VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  // NON fare skipWaiting automatico — aspetta che l'utente clicchi "Aggiorna"
});

// ── Activate: cancella le vecchie cache
self.addEventListener('activate', event => {
  console.log('[SW] Activate v' + VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first per Firebase, cache-first per assets locali
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Lascia passare direttamente Firebase, Google Fonts e CDN esterni
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('cloudflare') ||
    url.protocol === 'chrome-extension:'
  ) {
    return; // lascia al browser
  }

  // Per i file locali: network-first con fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache con la risposta fresca
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: servi dalla cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback alla pagina principale se non trovato
          return caches.match('/garageOS/index.html');
        });
      })
  );
});

// ── Messaggio dall'app: attiva subito la nuova versione
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting — activating new version');
    self.skipWaiting();
  }
});
