// Capacitor Adapter - Verbindet alle Module mit nativen Funktionen
// Dieser Adapter stellt sicher, dass die App sowohl im Web als auch nativ funktioniert

import {
    Capacitor
} from '@capacitor/core';

// Prüfe ob Capacitor verfügbar ist
const isCapacitorAvailable = () => {
    return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
};

// Initialisierung beim Laden
document.addEventListener('DOMContentLoaded', async () => {
    console.log('LED Control Native App wird initialisiert...');

    // Lade Native Bridge wenn verfügbar
    if (isCapacitorAvailable()) {
        console.log('Native Plattform erkannt:', Capacitor.getPlatform());

        // Native Bridge dynamisch laden
        try {
            const {
                default: NativeBridge
            } = await import('./native-bridge.js');
            window.nativeBridge = new NativeBridge();
            console.log('Native Bridge erfolgreich geladen');
        } catch (error) {
            console.error('Native Bridge konnte nicht geladen werden:', error);
        }
    } else {
        console.log('Web-Modus aktiv - Native Funktionen deaktiviert');
    }

    // Service Worker für PWA
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registriert');
        } catch (error) {
            console.log('Service Worker Registrierung fehlgeschlagen:', error);
        }
    }

    // Initialisiere alle Module
    initializeModules();
});

// Module initialisieren
function initializeModules() {
    // Event Manager initialisieren
    if (window.EventManager) {
        window.eventManager = new window.EventManager();
    }

    // Device Manager initialisieren
    if (window.DeviceManager) {
        window.deviceManager = new window.DeviceManager();
    }

    // Audio Reaktiv Engine initialisieren
    if (window.AudioReaktivEngine) {
        window.audioEngine = new window.AudioReaktivEngine();
    }

    // BLE Control initialisieren
    if (window.BLEControl) {
        window.bleControl = new window.BLEControl();
    }

    // Scene Manager initialisieren
    if (window.SceneManager) {
        window.sceneManager = new window.SceneManager();
    }

    // Performance Optimizer initialisieren
    if (window.PerformanceOptimizer) {
        window.performanceOptimizer = new window.PerformanceOptimizer();
    }

    console.log('Alle Module initialisiert');
}

// Globale Fehlerbehandlung
window.addEventListener('error', event => {
    console.error('Globaler Fehler:', event.error);

    // Bei kritischen Fehlern Fallback aktivieren
    if (event.error && event.error.message && event.error.message.includes('Capacitor')) {
        console.log('Capacitor-Fehler erkannt, aktiviere Web-Fallback');
        // Fallback zu Web-Funktionalität
    }
});

// Export für andere Module
export {
    isCapacitorAvailable
};