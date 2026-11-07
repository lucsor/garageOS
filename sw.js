// ===== GarageOS v1 — service worker di DISMISSIONE ("kill switch") =====
// La v1 si è spostata su https://lucsor.github.io/garageos-v2/.
// Il browser scarica questo file al posto del vecchio sw.js (byte diversi → aggiornamento), lo attiva subito,
// cancella le SOLE cache della v1, si de-registra e porta le pagine aperte alla v2.
// ATTENZIONE: v1 e v2 condividono l'origine lucsor.github.io: non toccare cache/registrazioni della v2.
const VERSION = '1.99.0-retired';
const NEW_URL = 'https://lucsor.github.io/garageos-v2/';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => /^garageos-v1\./.test(k)).map(k => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map(c => c.navigate(NEW_URL).catch(() => {})));
  })());
});

// Nessuna gestione offline: ogni richiesta va in rete (la pagina index.html fa il redirect)
