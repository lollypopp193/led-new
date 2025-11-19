// Capacitor Adapter - Verbindet alle Module mit nativen Funktionen
// Dieser Adapter stellt sicher, dass die App sowohl im Web als auch nativ funktioniert

// Prüfe ob Capacitor verfügbar ist
const isCapacitorAvailable = () => {
    return typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
};

// Initialisierung wird von app.js übernommen (Race-Condition vermieden)

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