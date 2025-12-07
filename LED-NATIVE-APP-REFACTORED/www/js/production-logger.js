/**
 * PRODUCTION-LOGGER.JS
 * Unterdrückt console.log in Production, behält console.error
 * In Development: Alles sichtbar
 * In Production: Nur Fehler sichtbar
 */
'use strict';

(function () {
    // Prüfe ob Production (APK) oder Development (Browser)
    const isProduction = window.Capacitor &&
        window.Capacitor.isNativePlatform &&
        window.Capacitor.isNativePlatform();

    // Originale Console-Methoden speichern
    const originalConsole = {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
        info: console.info.bind(console),
        debug: console.debug.bind(console)
    };

    // In Production: Log/Info/Debug unterdrücken
    if (isProduction) {
        console.log = function () { }; // Stumm
        console.info = function () { }; // Stumm
        console.debug = function () { }; // Stumm

        // Warn und Error bleiben aktiv
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;

        // Eine einzige Info-Meldung beim Start
        originalConsole.log('🚀 Light Space World - Production Mode (Logs deaktiviert)');
    } else {
        // In Development: Alles sichtbar mit Prefix
        console.log('🔧 Light Space World - Development Mode (Logs aktiv)');
    }

    // Debug-Funktion für wichtige Logs die IMMER sichtbar sein sollen
    window.debugLog = function (...args) {
        originalConsole.log('[DEBUG]', ...args);
    };

    // Error-Log der immer sichtbar ist
    window.errorLog = function (...args) {
        originalConsole.error('[ERROR]', ...args);
    };

    // Export für manuelles Aktivieren/Deaktivieren
    window.enableLogs = function () {
        console.log = originalConsole.log;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
        originalConsole.log('✅ Logs aktiviert');
    };

    window.disableLogs = function () {
        console.log = function () { };
        console.info = function () { };
        console.debug = function () { };
        originalConsole.log('🔇 Logs deaktiviert');
    };
})();
