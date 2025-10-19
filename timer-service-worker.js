/**
 * ===================================================================
 * TIMER-SERVICE-WORKER.JS
 * Service Worker für zuverlässige Timer und Background-Tasks
 * Version: 1.0
 * Datum: 2025-10-08
 * ===================================================================
 * 
 * Funktionen:
 * - Zuverlässige Timer im Hintergrund
 * - Web Notifications bei Timer-Ablauf
 * - Offline-Funktionalität
 * - Background Sync
 * - Push Notifications (optional)
 * 
 * Installation:
 * - In Timer.html: navigator.serviceWorker.register('timer-service-worker.js')
 * 
 * ===================================================================
 */

'use strict';

// Service Worker Version
const SW_VERSION = '1.0.0';
const CACHE_NAME = `timer-sw-${SW_VERSION}`;

// Timer-Datenbank
let activeTimers = new Map();

console.log('🔧 Timer Service Worker geladen - Version', SW_VERSION);

// ===================================================================
// INSTALLATION
// ===================================================================

self.addEventListener('install', (event) => {
  console.log('⚙️ Service Worker installiert');
  
  // Sofort aktivieren
  event.waitUntil(self.skipWaiting());
});

// ===================================================================
// AKTIVIERUNG
// ===================================================================

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker aktiviert');
  
  event.waitUntil(
    // Alte Caches löschen
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
    .then(() => self.clients.claim())
  );
});

// ===================================================================
// MESSAGE-HANDLER
// ===================================================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  console.log('📨 Message empfangen:', type);
  
  switch (type) {
    case 'ADD_TIMER':
      addTimer(data);
      break;
      
    case 'REMOVE_TIMER':
      removeTimer(data.timerId);
      break;
      
    case 'GET_TIMERS':
      event.ports[0].postMessage({
        type: 'TIMERS_LIST',
        timers: Array.from(activeTimers.values())
      });
      break;
      
    case 'CLEAR_ALL_TIMERS':
      clearAllTimers();
      break;
      
    default:
      console.warn('Unbekannter Message-Type:', type);
  }
});

// ===================================================================
// TIMER-VERWALTUNG
// ===================================================================

/**
 * Fügt Timer hinzu
 */
function addTimer(timerData) {
  const {
    id,
    name,
    triggerTime,
    action,
    actionData,
    repeat,
    repeatInterval
  } = timerData;

  console.log('⏰ Timer hinzugefügt:', name, 'Trigger:', new Date(triggerTime));

  // Timer erstellen
  const timer = {
    id: id || generateTimerId(),
    name: name || 'Timer',
    triggerTime: triggerTime,
    action: action || 'notification',
    actionData: actionData || {},
    repeat: repeat || false,
    repeatInterval: repeatInterval || null,
    createdAt: Date.now(),
    status: 'active'
  };

  activeTimers.set(timer.id, timer);

  // Timer-Check starten
  scheduleTimerCheck(timer);

  return timer;
}

/**
 * Entfernt Timer
 */
function removeTimer(timerId) {
  if (activeTimers.has(timerId)) {
    const timer = activeTimers.get(timerId);
    console.log('🗑️ Timer entfernt:', timer.name);
    
    activeTimers.delete(timerId);
    return true;
  }
  return false;
}

/**
 * Löscht alle Timer
 */
function clearAllTimers() {
  console.log('🗑️ Alle Timer gelöscht');
  activeTimers.clear();
}

/**
 * Plant Timer-Check
 */
function scheduleTimerCheck(timer) {
  const now = Date.now();
  const timeUntilTrigger = timer.triggerTime - now;

  if (timeUntilTrigger <= 0) {
    // Sofort auslösen
    triggerTimer(timer);
  } else {
    // Warten bis Trigger-Zeit
    setTimeout(() => {
      triggerTimer(timer);
    }, Math.min(timeUntilTrigger, 2147483647)); // Max setTimeout-Wert
  }
}

/**
 * Löst Timer aus
 */
async function triggerTimer(timer) {
  console.log('🔔 Timer ausgelöst:', timer.name);

  try {
    // Aktion ausführen
    await executeTimerAction(timer);

    // Repeat-Logic
    if (timer.repeat && timer.repeatInterval) {
      // Nächster Trigger-Zeitpunkt
      timer.triggerTime = Date.now() + timer.repeatInterval;
      console.log('🔁 Timer wiederholt:', timer.name, 'Nächster Trigger:', new Date(timer.triggerTime));
      
      // Neu schedulen
      scheduleTimerCheck(timer);
    } else {
      // Timer beendet
      timer.status = 'completed';
      removeTimer(timer.id);
    }

  } catch (error) {
    console.error('❌ Timer-Ausführung fehlgeschlagen:', error);
    timer.status = 'failed';
  }
}

/**
 * Führt Timer-Aktion aus
 */
async function executeTimerAction(timer) {
  switch (timer.action) {
    case 'notification':
      await showNotification(timer);
      break;
      
    case 'led-on':
      await sendLEDCommand('on', timer.actionData);
      break;
      
    case 'led-off':
      await sendLEDCommand('off', timer.actionData);
      break;
      
    case 'led-color':
      await sendLEDCommand('color', timer.actionData);
      break;
      
    case 'led-effect':
      await sendLEDCommand('effect', timer.actionData);
      break;
      
    case 'led-scene':
      await sendLEDCommand('scene', timer.actionData);
      break;
      
    default:
      console.warn('Unbekannte Timer-Aktion:', timer.action);
  }
}

// ===================================================================
// NOTIFICATIONS
// ===================================================================

/**
 * Zeigt Notification
 */
async function showNotification(timer) {
  // Notification-Permission prüfen
  const permission = await self.registration.permissions?.query?.({ name: 'notifications' });
  
  if (permission && permission.state !== 'granted') {
    console.warn('⚠️ Keine Notification-Berechtigung');
    return;
  }

  const title = timer.name || 'Timer abgelaufen';
  const options = {
    body: timer.actionData.message || 'Dein Timer ist abgelaufen',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `timer-${timer.id}`,
    requireInteraction: true,
    actions: [
      {
        action: 'dismiss',
        title: 'OK'
      },
      {
        action: 'snooze',
        title: 'Erneut erinnern (5 Min)'
      }
    ],
    data: {
      timerId: timer.id,
      timerName: timer.name
    }
  };

  try {
    await self.registration.showNotification(title, options);
    console.log('📬 Notification angezeigt:', title);
    
    // Vibration (falls unterstützt)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
  } catch (error) {
    console.error('❌ Notification-Fehler:', error);
  }
}

/**
 * Notification-Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification geklickt:', event.action);
  
  event.notification.close();

  const { timerId } = event.notification.data;

  if (event.action === 'snooze') {
    // Timer um 5 Minuten verschieben
    const timer = activeTimers.get(timerId);
    if (timer) {
      timer.triggerTime = Date.now() + (5 * 60 * 1000);
      scheduleTimerCheck(timer);
      console.log('⏰ Timer snoozed:', timer.name);
    }
  } else {
    // App öffnen
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Fokus auf existierenden Tab
          for (const client of clientList) {
            if (client.url.includes('Timer.html') && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Neuen Tab öffnen
          if (clients.openWindow) {
            return clients.openWindow('/Timer.html');
          }
        })
    );
  }
});

// ===================================================================
// LED-KOMMANDOS
// ===================================================================

/**
 * Sendet LED-Befehl an Client
 */
async function sendLEDCommand(command, data = {}) {
  console.log('💡 LED-Befehl:', command, data);

  try {
    // Alle Clients benachrichtigen
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    
    if (clients.length === 0) {
      console.warn('⚠️ Keine aktiven Clients - LED-Befehl kann nicht ausgeführt werden');
      return;
    }

    // Nachricht an alle Clients senden
    clients.forEach(client => {
      client.postMessage({
        type: 'EXECUTE_LED_COMMAND',
        command: command,
        data: data
      });
    });

    console.log(`✅ LED-Befehl an ${clients.length} Client(s) gesendet`);

  } catch (error) {
    console.error('❌ LED-Befehl fehlgeschlagen:', error);
    throw error;
  }
}

// ===================================================================
// BACKGROUND SYNC (OPTIONAL)
// ===================================================================

self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);

  if (event.tag === 'sync-timers') {
    event.waitUntil(syncTimers());
  }
});

/**
 * Synchronisiert Timer
 */
async function syncTimers() {
  console.log('🔄 Synchronisiere Timer...');
  
  try {
    // Hier könnte man Timer mit einem Server synchronisieren
    // Für diese App nicht notwendig, da alles lokal ist
    
    console.log('✅ Timer synchronisiert');
    
  } catch (error) {
    console.error('❌ Sync fehlgeschlagen:', error);
    throw error;
  }
}

// ===================================================================
// PUSH NOTIFICATIONS (OPTIONAL)
// ===================================================================

self.addEventListener('push', (event) => {
  console.log('📥 Push empfangen');

  if (!event.data) {
    console.warn('⚠️ Push ohne Daten');
    return;
  }

  try {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192.png',
        badge: '/badge-72.png',
        data: data.data || {}
      })
    );
    
  } catch (error) {
    console.error('❌ Push-Handler Fehler:', error);
  }
});

// ===================================================================
// FETCH HANDLER (OFFLINE-SUPPORT)
// ===================================================================

self.addEventListener('fetch', (event) => {
  // Nur für GET-Requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache-Hit
        if (response) {
          return response;
        }

        // Netzwerk-Request
        return fetch(event.request)
          .then((response) => {
            // Nicht cachen wenn keine gültige Antwort
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Response cachen
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Fallback für offline
        return caches.match('/offline.html');
      })
  );
});

// ===================================================================
// HELPER-FUNKTIONEN
// ===================================================================

/**
 * Generiert Timer-ID
 */
function generateTimerId() {
  return 'timer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formatiert Datum
 */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Prüft ob Timer abgelaufen
 */
function isTimerExpired(timer) {
  return Date.now() >= timer.triggerTime;
}

// ===================================================================
// PERIODISCHER TIMER-CHECK
// ===================================================================

/**
 * Prüft alle Timer regelmäßig
 */
function startPeriodicTimerCheck() {
  setInterval(() => {
    const now = Date.now();
    
    activeTimers.forEach((timer) => {
      if (timer.status === 'active' && now >= timer.triggerTime) {
        triggerTimer(timer);
      }
    });
  }, 60000); // Alle 60 Sekunden prüfen
}

// Periodischen Check starten
startPeriodicTimerCheck();

console.log('✅ Timer Service Worker bereit');
