// ✅ SERVICE WORKER FÜR PWA
// Macht aus der Web-App eine installierbare Android-App

const CACHE_NAME = 'lights-space-world-v4';
const urlsToCache = [
    './',
    './index.html?v=2.1',
    './pages/Farbe.html?v=2.1',
    './pages/Effekt.html?v=2.1',
    './pages/Timer.html?v=2.1',
    './pages/Einstellungen.html?v=2.1',
    './pages/musik.html?v=2.1',
    './css/shared-styles.css?v=2.1',
    './js/app.js?v=2.1',
    './js/ble-controller-pro.js?v=2.1',
    './js/device-manager.js?v=2.1',
    './js/event-manager.js?v=2.1',
    './js/led-abstraction-layer.js?v=2.1',
    './js/performance-optimizer.js?v=2.1',
    './js/scenes-manager.js?v=2.1',
    './js/audio-reactive-engine.js?v=2.1',
    './js/musik-integration.js?v=2.1',
    './js/music-library-manager.js?v=2.1'
];

// Installation
self.addEventListener('install', (event) => {
    console.log(' Service Worker Installation - v4');
    // Sofort aktivieren, alte Version überspringen
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log(' PWA Cache v4 wird erstellt');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch Events
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Aktivierung
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Alter Cache wird gelöscht:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

console.log('✅ Service Worker für Lights Space World PWA geladen');