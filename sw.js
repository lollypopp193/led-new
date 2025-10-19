// ✅ SERVICE WORKER FÜR PWA
// Macht aus der Web-App eine installierbare Android-App

const CACHE_NAME = 'lights-space-world-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/Farbe.html',
  '/Effekt.html', 
  '/Timer.html',
  '/Einstellungen.html',
  '/musik.html',
  '/css/shared-styles.css',
  '/js/app.js',
  '/js/ble-controller-pro.js',
  '/js/device-manager.js',
  '/js/audio-reactive-engine.js'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📱 PWA Cache wird erstellt');
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
      }
    )
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
