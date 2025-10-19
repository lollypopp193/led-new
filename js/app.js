/**
 * ===================================================================
 * APP.JS - Hauptlogik für Lights Space World App
 * Version: 2.0
 * Datum: 2025-10-08
 * ===================================================================
 * 
 * Diese Datei enthält die gesamte Anwendungslogik, die aus index.html
 * ausgelagert wurde, um eine saubere Trennung von HTML und JavaScript
 * zu erreichen.
 * 
 * Funktionen:
 * - Partikel-Animation (Hintergrund)
 * - Navigation zwischen Modulen
 * - BLE-Integration und Status-Verwaltung
 * - Globale LED-Funktionen
 * - Iframe-Kommunikation
 * - Auto-Connect zu gespeicherten Geräten
 * - Fehlerbehandlung und Benachrichtigungen
 * 
 * Abhängigkeiten:
 * - ble-controller-pro.js (muss vorher geladen sein)
 * - index.html (DOM-Elemente)
 * 
 * ===================================================================
 */

'use strict';

// ✅ KRITISCHER FIX: BLE Controller beim Start initialisieren!
window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initialisiere globalen BLE Controller...');
  // ✅ VERWENDE EXISTIERENDEN CONTROLLER aus ble-controller-pro.js!
  if (window.ledController) {
    window.bleController = window.ledController;
    console.log('✅ Verwende existierenden BLE Controller');
  } else if (typeof BLEController !== 'undefined') {
    // Nur als Fallback neuen erstellen
    window.bleController = new BLEController();
    window.ledController = window.bleController;
    console.log('✅ Neuer BLE Controller erstellt');
  }
  
  if (window.bleController) {
    // Globale Funktionen für alle Module
    window.connectBluetooth = async () => {
      try {
        await window.bleController.connect();
        updateBLEStatus();
        return true;
      } catch (error) {
        console.error('❌ Bluetooth-Verbindung fehlgeschlagen:', error);
        return false;
      }
    };
    
    window.sendColorToLED = async (r, g, b) => {
      if (!window.bleController || !window.bleController.isConnected) {
        console.warn('⚠️ Keine Bluetooth-Verbindung - Farbe kann nicht gesendet werden');
        return false;
      }
      return await window.bleController.setColorRGB(r, g, b);
    };
    
    window.sendEffectToLED = async (effectId) => {
      if (!window.bleController || !window.bleController.isConnected) {
        console.warn('⚠️ Keine Bluetooth-Verbindung - Effekt kann nicht gesendet werden');
        return false;
      }
      return await window.bleController.setEffect(effectId);
    };
    
    window.setBrightnessLED = async (brightness) => {
      if (!window.bleController || !window.bleController.isConnected) {
        console.warn('⚠️ Keine Bluetooth-Verbindung - Helligkeit kann nicht gesendet werden');
        return false;
      }
      return await window.bleController.setBrightness(brightness);
    };
    
    window.toggleLEDPower = async (state) => {
      if (!window.bleController || !window.bleController.isConnected) {
        console.warn('⚠️ Keine Bluetooth-Verbindung - Power-Status kann nicht gesendet werden');
        return false;
      }
      return await window.bleController.setPower(state);
    };
    
    window.updateBLEStatus = () => {
      const status = window.bleController ? window.bleController.getConnectionStatus() : { connected: false };
      AppState.ble.connected = status.connected;
      AppState.ble.active = status.connected;
      
      // Status an alle iFrames senden
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow.postMessage({
            type: 'BLE_STATUS',
            connected: status.connected,
            device: status.device
          }, '*');
        } catch (e) {}
      });
      
      console.log('📡 BLE Status:', status.connected ? '✅ Verbunden' : '❌ Getrennt');
    };
    
  } else {
    console.error('❌ BLEController Klasse nicht gefunden! Stelle sicher dass ble-controller-pro.js geladen ist.');
  }
});

// ✅ GLOBALE VARIABLEN FÜR ALLE MODULE
window.currentColor = { r: 255, g: 0, b: 0 }; // Aktuelle LED-Farbe (global für alle Seiten)

// ===================================================================
// KONFIGURATION & KONSTANTEN
// ===================================================================

const APP_CONFIG = {
  // UI-Timing
  DOM_READY_DELAY: 5000, // ✅ Startscreen EXAKT 5 Sekunden anzeigen
  ANIMATION_DELAY: 300,
  STARTUP_DELAY: 0, // ✅ KEIN zusätzlicher Delay!
  NOTIFICATION_DURATION: 3000,
  
  // Partikel-System
  PARTICLE_COUNT: 120,
  PARTICLE_MAX_RADIUS: 1.2,
  PARTICLE_MIN_RADIUS: 0.5,
  PARTICLE_MAX_SPEED: 0.3,
  PARTICLE_MAX_ALPHA: 0.7,
  PARTICLE_MIN_ALPHA: 0.3,
  PARTICLE_GLOW_MULTIPLIER: 4,
  
  // BLE-Einstellungen
  
  // ✅ GLOBALE EFFEKT-IDs FÜR KONSISTENZ ZWISCHEN ALLEN MODULEN
  EFFECT_IDS: {
    'Welle': 1, 'Regenbogen': 2, 'Feuer': 3, 'Blitz': 4,
    'Pulsieren': 5, 'Atmen': 6, 'Lauflicht': 7, 'Stroboskop': 8,
    'Farbverlauf': 9, 'Zufallsfarben': 10, 'Disco': 11, 'Polizei': 12,
    'Meteorregen': 13, 'Matrix': 14, 'Kristall': 15, 'Nordlicht': 16,
    'Lava': 17, 'Unterwasser': 18, 'Glitzer': 19, 'Herzschlag': 20,
    'Spirale': 21, 'Plasma': 22, 'Konfetti': 23, 'Sinus': 24,
    'Fade': 25, 'Scanner': 26, 'Twinkle': 27, 'Kometen': 28,
    'Feuerzauber': 29, 'Neonröhre': 30, 'Lasershow': 31, 'Borealis': 32
  },
  AUTO_RECONNECT_DELAY: 3000,
  AUTO_RECONNECT_MAX_ATTEMPTS: 3,
  BLE_STATUS_UPDATE_INTERVAL: 1000,
  
  // LocalStorage-Keys
  STORAGE_KEYS: {
    DEVICES: 'led-devices',
    SETTINGS: 'app-settings',
    LAST_APP: 'last-active-app',
    FAVORITES: 'favorite-colors',
    SCENES: 'saved-scenes',
    TIMERS: 'active-timers'
  }
};

// Globale Variablen
window.APP_CONFIG = APP_CONFIG;

// UI-Konstanten (für Abwärtskompatibilität)
window.UI_CONSTANTS = {
  DOM_READY_DELAY: APP_CONFIG.DOM_READY_DELAY,
  ANIMATION_DELAY: APP_CONFIG.ANIMATION_DELAY,
  STARTUP_DELAY: APP_CONFIG.STARTUP_DELAY
};

// ===================================================================
// GLOBALE STATE-VERWALTUNG
// ===================================================================

// ✅ GLOBALER BLE CONTROLLER - FÜR ALLE MODULE VERFÜGBAR!
window.bleController = null;

const AppState = {
  // BLE-Status
  ble: {
    active: false,
    connected: false,
    controller: null,
    devices: [],
    reconnecting: false,
    reconnectAttempts: 0
  },
  
  // UI-Status
  ui: {
    currentApp: null,
    loading: false,
    notifications: []
  },
  
  // Partikel-Animation
  particles: {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    particleArray: [],
    animationId: null,
    isAnimating: false
  }
};

// Globale AppBLE-Objekt (für Abwärtskompatibilität)
window.AppBLE = {
  get active() { return AppState.ble.active; },
  set active(value) { AppState.ble.active = value; },
  get controller() { return AppState.ble.controller; },
  set controller(value) { AppState.ble.controller = value; }
};

// ===================================================================
// BENACHRICHTIGUNGS-SYSTEM
// ===================================================================

/**
 * Zeigt eine Benachrichtigung am oberen Bildschirmrand
 * @param {string} message - Die anzuzeigende Nachricht
 * @param {string} type - Typ: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Anzeigedauer in Millisekunden
 */
function showGlobalNotification(message, type = 'info', duration = APP_CONFIG.NOTIFICATION_DURATION) {
  // Prüfen ob bereits eine Benachrichtigung mit gleicher Nachricht existiert
  const existingNotification = document.querySelector(`.notification[data-message="${message}"]`);
  if (existingNotification) {
    return; // Keine Duplikate
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.setAttribute('data-message', message);
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');
  
  // Icon basierend auf Typ
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const icon = document.createElement('span');
  icon.className = 'notification-icon';
  icon.textContent = icons[type] || icons.info;
  
  const text = document.createElement('span');
  text.className = 'notification-text';
  text.textContent = message;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'notification-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Benachrichtigung schließen');
  closeBtn.onclick = () => removeNotification(notification);
  
  notification.appendChild(icon);
  notification.appendChild(text);
  notification.appendChild(closeBtn);
  
  // Notification zur State hinzufügen
  AppState.ui.notifications.push(notification);
  
  // Zum DOM hinzufügen
  document.body.appendChild(notification);
  
  // Animation starten
  requestAnimationFrame(() => {
    notification.classList.add('notification-show');
  });
  
  // Auto-Remove nach Duration
  const timeoutId = setTimeout(() => {
    removeNotification(notification);
  }, duration);
  
  // Timeout-ID speichern für manuelles Schließen
  notification.dataset.timeoutId = timeoutId;
}

/**
 * Entfernt eine Benachrichtigung
 */
function removeNotification(notification) {
  if (!notification || !notification.parentNode) return;
  
  // Timeout abbrechen falls vorhanden
  if (notification.dataset.timeoutId) {
    clearTimeout(parseInt(notification.dataset.timeoutId));
  }
  
  notification.classList.remove('notification-show');
  notification.classList.add('notification-hide');
  
  // Aus State entfernen
  const index = AppState.ui.notifications.indexOf(notification);
  if (index > -1) {
    AppState.ui.notifications.splice(index, 1);
  }
}

// Globale Funktion verfügbar machen
window.showGlobalNotification = showGlobalNotification;

// ... Rest of the code remains the same ...
// ===================================================================
// PARTIKEL-ANIMATIONS-SYSTEM
// ===================================================================

/**
 * Initialisiert das Partikel-System
 */
function initParticles() {
  const canvas = document.getElementById('backgroundCanvas');
  const ctx = canvas?.getContext('2d');
  
  if (!canvas || !ctx) {
    console.warn('Partikel-Canvas nicht gefunden oder Context nicht verfügbar');
    return;
  }
  
  AppState.particles.canvas = canvas;
  AppState.particles.ctx = ctx;
  
  try {
    AppState.particles.width = window.innerWidth;
    AppState.particles.height = window.innerHeight;
    canvas.width = AppState.particles.width;
    canvas.height = AppState.particles.height;
    
    // Bestehende Partikel löschen
    AppState.particles.particleArray = [];
    
    // Neue Partikel erstellen
    for (let i = 0; i < APP_CONFIG.PARTICLE_COUNT; i++) {
      AppState.particles.particleArray.push({
        x: Math.random() * AppState.particles.width,
        y: Math.random() * AppState.particles.height,
        radius: Math.random() * APP_CONFIG.PARTICLE_MAX_RADIUS + APP_CONFIG.PARTICLE_MIN_RADIUS,
        speedX: (Math.random() - 0.5) * APP_CONFIG.PARTICLE_MAX_SPEED,
        speedY: (Math.random() - 0.5) * APP_CONFIG.PARTICLE_MAX_SPEED,
        alpha: Math.random() * APP_CONFIG.PARTICLE_MAX_ALPHA + APP_CONFIG.PARTICLE_MIN_ALPHA
      });
    }
    
    console.log('✓ Partikel-System initialisiert:', APP_CONFIG.PARTICLE_COUNT, 'Partikel');
  } catch (error) {
    console.error('Fehler beim Initialisieren der Partikel:', error);
  }
}

/**
 * Zeichnet und animiert Partikel
 */
function drawParticles() {
  const { ctx, width, height, particleArray, isAnimating } = AppState.particles;
  
  if (!ctx || !isAnimating) return;
  
  try {
    ctx.clearRect(0, 0, width, height);
    
    for (let p of particleArray) {
      // Position aktualisieren
      p.x += p.speedX;
      p.y += p.speedY;
      
      // An Rändern abprallen
      if (p.x < 0 || p.x > width) {
        p.speedX *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
      }
      if (p.y < 0 || p.y > height) {
        p.speedY *= -1;
        p.y = Math.max(0, Math.min(height, p.y));
      }
      
      // Partikel mit Glow zeichnen
      const glowRadius = p.radius * APP_CONFIG.PARTICLE_GLOW_MULTIPLIER;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    AppState.particles.animationId = requestAnimationFrame(drawParticles);
  } catch (error) {
    console.error('Fehler beim Zeichnen der Partikel:', error);
    stopParticleAnimation();
  }
}

/**
 * Startet die Partikel-Animation
 */
function startParticleAnimation() {
  if (!AppState.particles.isAnimating) {
    AppState.particles.isAnimating = true;
    drawParticles();
    console.log('✓ Partikel-Animation gestartet');
  }
}

/**
 * Stoppt die Partikel-Animation
 */
function stopParticleAnimation() {
  AppState.particles.isAnimating = false;
  if (AppState.particles.animationId) {
    cancelAnimationFrame(AppState.particles.animationId);
    AppState.particles.animationId = null;
  }
  console.log('✓ Partikel-Animation gestoppt');
}

// Resize-Handler mit Debouncing
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initParticles();
  }, 250);
});

// Animation pausieren wenn Tab nicht sichtbar
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopParticleAnimation();
  } else {
    startParticleAnimation();
  }
});

// ===================================================================
// BLE-INTEGRATION UND VERWALTUNG
// ===================================================================

/**
 * Initialisiert den BLE-Status
 */
async function initBLEStatus() {
  try {
    // Prüfen ob bereits initialisiert
    if (AppState.ble.active) {
      console.log('🔗 BLE-Controller bereits aktiv');
      return;
    }
    
    if (window.ledController) {
      console.log('🔗 BLE-Controller gefunden');
      AppState.ble.controller = window.ledController;
      AppState.ble.active = true;
      
      // Automatisch mit gespeicherten Geräten verbinden
      await autoConnectDevices();
      
      // Status aktualisieren
      updateGlobalBLEStatus();
      
      // Periodisches Status-Update
      startBLEStatusMonitoring();
    } else {
      console.warn('⚠️ BLE-Controller nicht gefunden');
      showGlobalNotification('Bluetooth-Controller nicht verfügbar', 'warning');
    }
  } catch (error) {
    console.error('❌ BLE-Initialisierung fehlgeschlagen:', error);
    showGlobalNotification('Bluetooth-Initialisierung fehlgeschlagen', 'error');
  }
}

/**
 * Automatische Verbindung zu gespeicherten Geräten
 */
async function autoConnectDevices() {
  try {
    const savedDevices = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.DEVICES);
    if (!savedDevices) return;
    
    const devices = JSON.parse(savedDevices);
    console.log('📱 Gespeicherte Geräte gefunden:', devices.length);
    
    for (const device of devices) {
      if (device.autoConnect) {
        console.log('🔄 Verbinde mit:', device.name);
        await connectToDevice(device);
      }
    }
  } catch (error) {
    console.warn('⚠️ Fehler beim Auto-Connect:', error);
  }
}

/**
 * Verbindet mit einem BLE-Gerät
 * @param {Object} device - Geräteinformationen
 */
async function connectToDevice(device) {
  try {
    if (!window.ledController || !window.ledController.connect) {
      throw new Error('BLE-Controller nicht verfügbar');
    }
    
    showGlobalNotification(`Verbinde mit ${device.name}...`, 'info', 2000);
    
    const connected = await window.ledController.connect(device.mac, device.protocol);
    
    if (connected) {
      console.log(`✅ Verbunden mit ${device.name}`);
      showGlobalNotification(`Verbunden mit ${device.name}`, 'success');
      
      AppState.ble.connected = true;
      AppState.ble.devices.push(device);
      
      updateGlobalBLEStatus();
      broadcastBLEStatus();
      
      return true;
    } else {
      throw new Error('Verbindung fehlgeschlagen');
    }
  } catch (error) {
    console.error(`❌ Verbindung zu ${device.name} fehlgeschlagen:`, error);
    showGlobalNotification(
      `Verbindung zu ${device.name} fehlgeschlagen. Bitte sicherstellen, dass das Gerät eingeschaltet und in Reichweite ist.`,
      'error'
    );
    return false;
  }
}

/**
 * Trennt die Verbindung zu einem BLE-Gerät
 */
function disconnectBLEDevice() {
  try {
    if (window.ledController && window.ledController.disconnect) {
      window.ledController.disconnect();
      console.log('🔌 BLE-Gerät getrennt');
      showGlobalNotification('Gerät getrennt', 'info');
    }
    
    AppState.ble.connected = false;
    AppState.ble.devices = [];
    
    updateGlobalBLEStatus();
    broadcastBLEStatus();
  } catch (error) {
    console.error('Fehler beim Trennen:', error);
    showGlobalNotification('Fehler beim Trennen des Geräts', 'error');
  }
}

/**
 * Automatische Wiederverbindung bei Verbindungsabbruch
 */
async function handleBLEDisconnect() {
  if (AppState.ble.reconnecting) return;
  
  console.log('🔄 Verbindung unterbrochen - versuche Wiederverbindung...');
  showGlobalNotification('Verbindung unterbrochen. Versuche Wiederverbindung...', 'warning', 5000);
  
  AppState.ble.reconnecting = true;
  AppState.ble.reconnectAttempts = 0;
  
  while (AppState.ble.reconnectAttempts < APP_CONFIG.AUTO_RECONNECT_MAX_ATTEMPTS) {
    AppState.ble.reconnectAttempts++;
    
    console.log(`🔄 Wiederverbindungsversuch ${AppState.ble.reconnectAttempts}/${APP_CONFIG.AUTO_RECONNECT_MAX_ATTEMPTS}`);
    
    await new Promise(resolve => setTimeout(resolve, APP_CONFIG.AUTO_RECONNECT_DELAY));
    
    const success = await autoConnectDevices();
    
    if (success) {
      console.log('✅ Wiederverbindung erfolgreich');
      showGlobalNotification('Wiederverbindung erfolgreich', 'success');
      AppState.ble.reconnecting = false;
      return;
    }
  }
  
  console.log('❌ Wiederverbindung fehlgeschlagen');
  showGlobalNotification('Wiederverbindung fehlgeschlagen. Bitte manuell verbinden.', 'error');
  AppState.ble.reconnecting = false;
}

/**
 * Event-Listener für BLE-Disconnect
 */
if (window.ledController && window.ledController.device) {
  window.ledController.device.addEventListener('gattserverdisconnected', handleBLEDisconnect);
}

/**
 * Aktualisiert den globalen BLE-Status in der UI
 */
function updateGlobalBLEStatus() {
  const connectedCount = AppState.ble.connected && window.ledController?.isConnected ? 1 : 0;
  
  // Status-Element aktualisieren
  const statusElement = document.getElementById('ble-status');
  if (statusElement) {
    statusElement.textContent = `${connectedCount} Gerät(e) verbunden`;
    statusElement.className = connectedCount > 0 ? 'connected' : 'disconnected';
  }
  
  // Navigation-Status aktualisieren
  const navStatus = document.querySelector('.nav-status');
  if (navStatus) {
    navStatus.innerHTML = '';
    
    const bluetoothIcon = document.createElement('i');
    bluetoothIcon.className = 'fas fa-bluetooth';
    bluetoothIcon.style.color = connectedCount > 0 ? '#4ecdc4' : '#666';
    
    const countText = document.createTextNode(` ${connectedCount}`);
    
    navStatus.appendChild(bluetoothIcon);
    navStatus.appendChild(countText);
  }
}

/**
 * Sendet BLE-Status an alle Iframes
 */
function broadcastBLEStatus() {
  const iframes = document.querySelectorAll('.app-iframe');
  
  iframes.forEach(iframe => {
    try {
      if (iframe.contentWindow) {
        // ✅ SICHERER POSTMESSAGE MIT ORIGIN-BESCHRÄNKUNG
        iframe.contentWindow.postMessage({
          type: 'BLE_STATUS_UPDATE',
          connected: AppState.ble.connected,
          controller: window.ledController,
          devices: AppState.ble.devices
        }, window.location.origin);
      }
    } catch (error) {
      // Cross-Origin Error - normal
    }
  });
}

/**
 * Startet periodisches BLE-Status-Monitoring
 */
function startBLEStatusMonitoring() {
  setInterval(() => {
    if (AppState.ble.active) {
      updateGlobalBLEStatus();
    }
  }, APP_CONFIG.BLE_STATUS_UPDATE_INTERVAL);
}

// ===================================================================
// GLOBALE LED-FUNKTIONEN
// ===================================================================

/**
 * Sendet Farbwert an alle verbundenen Geräte
 * @param {number} r - Rot (0-255)
 * @param {number} g - Grün (0-255)
 * @param {number} b - Blau (0-255)
 */
window.sendColorToAllDevices = async function(r, g, b) {
  try {
    if (!window.ledController || !window.ledController.isConnected) {
      console.log('⚠️ Keine BLE-Geräte verbunden');
      showGlobalNotification('Kein Gerät verbunden', 'warning');
      return false;
    }
    
    // RGB-Werte validieren
    const validR = Math.max(0, Math.min(255, parseInt(r) || 0));
    const validG = Math.max(0, Math.min(255, parseInt(g) || 0));
    const validB = Math.max(0, Math.min(255, parseInt(b) || 0));
    
    const hexColor = '#' + [validR, validG, validB]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
    
    return await window.ledController.setColor(hexColor);
  } catch (error) {
    console.error('Fehler bei sendColorToAllDevices:', error);
    showGlobalNotification('Fehler beim Senden der Farbe', 'error');
    return false;
  }
};

/**
 * Sendet Effekt an alle verbundenen Geräte
 * @param {number} effectId - Effekt-ID
 */
window.sendEffectToAllDevices = async function(effectId) {
  try {
    if (!window.ledController || !window.ledController.isConnected) {
      console.log('⚠️ Keine BLE-Geräte verbunden');
      return false;
    }
    
    // ✅ HELLIGKEITS-SYNCHRONISATION: Wende gespeicherte Helligkeit auf Effekt an
    const savedBrightness = localStorage.getItem('ledBrightness') || 100;
    
    // Erst Effekt setzen
    const effectResult = await window.ledController.setEffect(effectId);
    
    // Dann Helligkeit anwenden
    if (effectResult) {
      await window.ledController.setBrightness(parseInt(savedBrightness));
      console.log(`✨ Effekt ${effectId} mit Helligkeit ${savedBrightness}% aktiviert`);
    }
    
    return effectResult;
  } catch (error) {
    console.error('Fehler bei sendEffectToAllDevices:', error);
    return false;
  }
};

// ✅ GLOBALE CURRENTCOLOR FÜR ALLE MODULE VERFÜGBAR MACHEN
window.globalCurrentColor = { r: 255, g: 0, b: 0 }; // Standard-Rot

/**
 * Setzt die globale aktuelle Farbe
 * @param {Object} color - RGB-Farbobjekt {r, g, b}
 */
window.setGlobalCurrentColor = function(color) {
  if (color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
    window.globalCurrentColor = { r: color.r, g: color.g, b: color.b };
    console.log('🎨 Globale currentColor gesetzt:', window.globalCurrentColor);
  }
};

/**
 * Holt die globale aktuelle Farbe
 * @returns {Object} RGB-Farbobjekt {r, g, b}
 */
window.getGlobalCurrentColor = function() {
  return window.globalCurrentColor;
};

// ✅ GLOBALE CURRENTCOLOR FÜR ALLE MODULE VERFÜGBAR MACHEN
window.globalCurrentColor = { r: 255, g: 0, b: 0 }; // Standard-Rot

/**
 * Setzt die globale aktuelle Farbe
 * @param {Object} color - RGB-Farbobjekt {r, g, b}
 */
window.setGlobalCurrentColor = function(color) {
  if (color && typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
    window.globalCurrentColor = { r: color.r, g: color.g, b: color.b };
    console.log('🎨 Globale currentColor gesetzt:', window.globalCurrentColor);
  }
};

/**
 * Holt die globale aktuelle Farbe
 * @returns {Object} RGB-Farbobjekt {r, g, b}
 */
window.getGlobalCurrentColor = function() {
  return window.globalCurrentColor;
};

/**
 * Setzt Helligkeit für alle verbundenen Geräte
 * @param {number} brightness - Helligkeit (0-100)
 */
window.setBrightnessForAllDevices = async function(brightness) {
  try {
    if (!window.ledController || !window.ledController.isConnected) {
      console.log('⚠️ Keine BLE-Geräte verbunden');
      return false;
    }
    
    const validBrightness = Math.max(0, Math.min(100, parseInt(brightness) || 0));
    return await window.ledController.setBrightness(validBrightness);
  } catch (error) {
    console.error('Fehler bei setBrightnessForAllDevices:', error);
    return false;
  }
};

/**
 * Schaltet LED ein/aus
 * @param {boolean} state - true = ein, false = aus
 */
window.setPowerForAllDevices = async function(state) {
  try {
    if (!window.ledController || !window.ledController.isConnected) {
      console.log('⚠️ Keine BLE-Geräte verbunden');
      return false;
    }
    
    return await window.ledController.setPower(state);
  } catch (error) {
    console.error('Fehler bei setPowerForAllDevices:', error);
    return false;
  }
};

/**
 * LED-Test-Funktion
 */
window.testLED = async function() {
  try {
    if (window.ledController && window.ledController.runTestSequence) {
      return await window.ledController.runTestSequence();
    }
    console.log('⚠️ Test-Sequenz nicht verfügbar');
    return false;
  } catch (error) {
    console.error('Fehler bei LED-Test:', error);
    return false;
  }
};

/**
 * Gibt BLE-Controller-Status zurück
 */
window.getBLEStatus = function() {
  try {
    if (window.ledController && window.ledController.getConnectionStatus) {
      return window.ledController.getConnectionStatus();
    }
  } catch (error) {
    console.error('Fehler beim Abrufen des Status:', error);
  }
  return { connected: false, device: null };
};

// Weitere globale BLE-Funktionen
window.getBLEController = function() {
  return window.ledController;
};

// ✅ UNIVERSELLE LED-STEUERUNG (BLE + WLED)
window.sendUniversalColor = async function(r, g, b) {
  let success = false;
  
  // Versuche BLE
  if (window.ledDevice && window.ledDevice.isConnected) {
    try {
      const cmd = new Uint8Array([0x7E, 0x00, 0x05, r, g, b, 0x00, 0xEF]);
      await window.ledDevice.characteristic.writeValue(cmd);
      success = true;
    } catch (error) {
      console.error('BLE-Fehler:', error);
    }
  }
  
  // Versuche WLED
  if (window.wledDevice && window.wledDevice.connected) {
    try {
      await fetch(`http://${window.wledDevice.ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          seg: [{ col: [[r, g, b]] }]
        })
      });
      success = true;
    } catch (error) {
      console.error('WLED-Fehler:', error);
    }
  }
  
  // Fallback auf alten Controller
  if (!success && window.ledController && window.ledController.isConnected) {
    try {
      await window.ledController.setColorRGB(r, g, b);
      success = true;
    } catch (error) {
      console.error('Controller-Fehler:', error);
    }
  }
  
  return success;
};

// ✅ UNIVERSELLER EFFEKT-SENDER
window.sendUniversalEffect = async function(effectName, speed = 5) {
  let success = false;
  
  // BLE-Effekt
  if (window.ledDevice && window.ledDevice.isConnected) {
    const effectMap = {
      'rainbow': 0x06,
      'strobe': 0x07,
      'fade': 0x08,
      'pulse': 0x09,
      'wave': 0x0A,
      'party': 0x11
    };
    
    try {
      const cmd = new Uint8Array([0x7E, 0x00, effectMap[effectName] || 0x06, speed, 0x00, 0x00, 0x00, 0xEF]);
      await window.ledDevice.characteristic.writeValue(cmd);
      success = true;
    } catch (error) {
      console.error('BLE-Effekt Fehler:', error);
    }
  }
  
  // WLED-Effekt
  if (window.wledDevice && window.wledDevice.connected) {
    const wledEffects = {
      'rainbow': 9,
      'strobe': 16,
      'fade': 24,
      'pulse': 29,
      'wave': 14,
      'party': 110
    };
    
    try {
      await fetch(`http://${window.wledDevice.ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          fx: wledEffects[effectName] || 0,
          sx: Math.floor((speed / 10) * 255)
        })
      });
      success = true;
    } catch (error) {
      console.error('WLED-Effekt Fehler:', error);
    }
  }
  
  return success;
};

window.connectBLEDevice = async function(device) {
  return await connectToDevice(device);
};

window.disconnectBLEDevice = disconnectBLEDevice;

// ===================================================================
// NAVIGATION UND APP-VERWALTUNG
// ===================================================================

/**
 * Lädt ein App-Modul
 * @param {string} app - Name des zu ladenden Moduls
 */
function loadApp(app) {
  console.log('📱 Lade App:', app);
  
  AppState.ui.currentApp = app;
  
  // Letztes App speichern
  try {
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.LAST_APP, app);
  } catch (error) {
    console.warn('Konnte letztes App nicht speichern:', error);
  }
  
  // Navigation aktualisieren
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(nav => nav.classList.remove('active'));
  
  const activeNav = document.querySelector(`[data-app="${app}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }
  
  // Welcome-Content verstecken
  const welcomeContent = document.getElementById('welcome-content');
  if (welcomeContent) {
    welcomeContent.style.display = 'none';
  }
  
  // Alle Iframes verstecken
  const iframes = document.querySelectorAll('.app-iframe');
  iframes.forEach(iframe => iframe.style.display = 'none');
  
  // Ziel-Iframe anzeigen
  const targetIframe = document.getElementById(app + '-iframe');
  
  if (targetIframe) {
    targetIframe.style.display = 'block';
    console.log('✓ Iframe angezeigt:', app);
    
    // BLE-Status an Iframe senden
    setTimeout(() => {
      try {
        if (targetIframe.contentWindow) {
          targetIframe.contentWindow.postMessage({
            type: 'BLE_STATUS_UPDATE',
            connected: AppState.ble.connected,
            controller: window.ledController
          }, '*');
        }
      } catch (error) {
        // Cross-Origin - normal
      }
    }, 100);
  } else {
    console.error('❌ Iframe nicht gefunden für App:', app);
    showGlobalNotification(`Modul ${app} konnte nicht geladen werden`, 'error');
  }
}

// Globale loadApp-Funktion
window.loadApp = loadApp;

/**
 * Initialisiert Navigation und Event-Listener
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const featureCards = document.querySelectorAll('.feature-card');
  
  // Navigation-Items
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const app = this.getAttribute('data-app');
      loadApp(app);
    });
    
    // Keyboard-Support
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const app = this.getAttribute('data-app');
        loadApp(app);
      }
    });
  });
  
  // Feature-Cards
  featureCards.forEach(card => {
    card.addEventListener('click', function() {
      const app = this.getAttribute('data-app');
      if (app) loadApp(app);
    });
    
    // Keyboard-Support
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const app = this.getAttribute('data-app');
        if (app) loadApp(app);
      }
    });
  });
  
  // Iframe-Load-Events
  const iframes = document.querySelectorAll('.app-iframe');
  iframes.forEach(iframe => {
    iframe.addEventListener('load', function() {
      console.log(`✓ ${iframe.id} geladen`);
    });
  });
  
  console.log('✓ Navigation initialisiert');
}

/**
 * Lädt letztes aktives App beim Start
 */
function loadLastApp() {
  try {
    const lastApp = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LAST_APP);
    if (lastApp) {
      console.log('📱 Lade letztes App:', lastApp);
      setTimeout(() => loadApp(lastApp), 500);
    }
  } catch (error) {
    console.warn('Konnte letztes App nicht laden:', error);
  }
}

// ===================================================================
// MESSAGE-HANDLER FÜR IFRAME-KOMMUNIKATION
// ===================================================================

window.addEventListener('message', function(event) {
  // Sicherheitscheck für Origin
  // In Produktion: origin prüfen!
  
  switch (event.data.type) {
    case 'REQUEST_BLE_STATUS':
      broadcastBLEStatus();
      break;
      
    case 'CONNECT_DEVICE':
      if (event.data.device) {
        connectToDevice(event.data.device);
      }
      break;
      
    case 'DISCONNECT_DEVICE':
      disconnectBLEDevice();
      break;
      
    case 'SET_COLOR':
      if (event.data.color) {
        const { r, g, b } = event.data.color;
        window.sendColorToAllDevices(r, g, b);
      }
      break;
      
    case 'SET_EFFECT':
      if (event.data.effectId !== undefined) {
        window.sendEffectToAllDevices(event.data.effectId);
      }
      break;
      
    case 'SET_BRIGHTNESS':
      if (event.data.brightness !== undefined) {
        window.setBrightnessForAllDevices(event.data.brightness);
      }
      break;
      
    case 'SHOW_NOTIFICATION':
      if (event.data.message) {
        showGlobalNotification(
          event.data.message,
          event.data.notificationType || 'info',
          event.data.duration || APP_CONFIG.NOTIFICATION_DURATION
        );
      }
      break;
      
    default:
      // Unbekannter Message-Type
      break;
  }
});

// ===================================================================
// STARTUP-SEQUENZ
// ===================================================================

/**
 * Startet die App-Sequenz
 */
function startAppSequence() {
  setTimeout(() => {
    const startscreen = document.getElementById('startscreen');
    const appscreen = document.getElementById('appscreen');
    
    if (startscreen) startscreen.style.display = 'none';
    if (appscreen) appscreen.style.display = 'flex';
    
    console.log('✓ App-Screen angezeigt');
  }, APP_CONFIG.DOM_READY_DELAY);
}

/**
 * Initialisiert die gesamte App
 */
async function initApp() {
  console.log('🚀 Initialisiere Lights Space World App...');
  
  try {
    // Partikel-System starten
    initParticles();
    startParticleAnimation();
    
    // Navigation initialisieren
    initNavigation();
    
    // BLE-System initialisieren
    await initBLEStatus();
    
    // Startup-Sequenz starten
    startAppSequence();
    
    // Letztes App laden (optional)
    // loadLastApp();
    
    console.log('✅ App erfolgreich initialisiert');
  } catch (error) {
    console.error('❌ Fehler bei App-Initialisierung:', error);
    showGlobalNotification('Fehler beim Starten der App', 'error');
  }
}

// ===================================================================
// APP-START
// ===================================================================

// App initialisieren wenn DOM bereit ist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Cleanup bei Page-Unload
window.addEventListener('beforeunload', () => {
  stopParticleAnimation();
  console.log('👋 App wird beendet');
});

// ===================================================================
// EXPORT FÜR DEBUGGING
// ===================================================================

window.AppDebug = {
  state: AppState,
  config: APP_CONFIG,
  functions: {
    initParticles,
    startParticleAnimation,
    stopParticleAnimation,
    loadApp,
    showGlobalNotification,
    connectToDevice,
    disconnectBLEDevice,
    updateGlobalBLEStatus,
    broadcastBLEStatus
  }
};

console.log('✅ app.js vollständig geladen');
