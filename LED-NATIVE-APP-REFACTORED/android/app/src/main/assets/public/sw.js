/**
 * Service Worker - Offline support and caching strategy
 * @version 3.0.1
 */

'use strict';

const CACHE_NAME = 'led-control-pro-v3.3.0';
const RUNTIME_CACHE = 'led-control-runtime-v3.3.0';

// Files to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/ble-controller-pro.js',
    '/js/device-manager.js',
    '/js/native-bridge.js',
    '/js/capacitor-adapter.js',
    '/pages/farbe.html',
    '/pages/effekt.html',
    '/pages/musik.html',
    '/pages/timer.html',
    '/pages/einstellungen.html',
    '/manifest.json'
];

/**
 * Install event - precache essential files
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching app shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                console.log('[SW] Service worker installed successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('[SW] Precaching failed:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Delete old caches
                            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Skip Capacitor internal requests
    if (url.pathname.startsWith('/_capacitor_')) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Cache hit - return cached response
                    return cachedResponse;
                }

                // Cache miss - fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                            return networkResponse;
                        }

                        // Cache successful responses (runtime cache)
                        if (shouldCache(url)) {
                            const responseToCache = networkResponse.clone();
                            caches.open(RUNTIME_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseToCache);
                                })
                                .catch((error) => {
                                    console.warn('[SW] Runtime caching failed:', error);
                                });
                        }

                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);

                        // Return offline fallback if available
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }

                        throw error;
                    });
            })
    );
});

/**
 * Check if URL should be cached
 * @param {URL} url - URL object
 * @returns {boolean}
 */
function shouldCache(url) {
    // Cache same-origin requests
    if (url.origin !== self.location.origin) {
        return false;
    }

    // Don't cache API requests or external resources
    const pathname = url.pathname;

    // Cache HTML, CSS, JS, and font files
    return (
        pathname.endsWith('.html') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.woff') ||
        pathname.endsWith('.woff2') ||
        pathname.endsWith('.ttf') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.jpeg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico')
    );
}

/**
 * Message event - handle commands from clients
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            }).then(() => {
                console.log('[SW] All caches cleared');
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});

console.log('[SW] Service worker script loaded');
