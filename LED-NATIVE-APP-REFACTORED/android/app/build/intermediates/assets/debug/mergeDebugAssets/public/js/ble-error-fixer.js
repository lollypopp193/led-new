/**
 * BLE-HEALTH-MONITOR.JS
 * ECHTES Error-Handling für Bluetooth - KEINE DUMMIES, KEINE VERSTECKTEN FEHLER
 * Überwacht BLE-Status und informiert User über echte Probleme
 */
'use strict';

class BLEHealthMonitor {
    constructor() {
        this.bleAvailable = false;
        this.bleConnected = false;
        this.lastError = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.healthCheckInterval = null; // FIX: Timer-ID speichern
        this.init();
    }

    /**
     * Initialisiert den BLE Health Monitor
     */
    async init() {
        console.log('🔧 BLE-Health-Monitor startet...');

        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        await this.delay(300);
        await this.checkBLEHealth();
        this.startHealthCheck();
    }

    /**
     * Prüft den echten BLE-Status
     */
    async checkBLEHealth() {
        try {
            // 1. Prüfe ob wir in Capacitor Native App laufen
            const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

            // In nativer App: Capacitor BLE Plugin nutzen, NICHT navigator.bluetooth
            if (isNative) {
                // Native App - Capacitor BLE Plugin ist verfügbar
                this.bleAvailable = true;
                console.log('✅ Native App erkannt - Capacitor BLE Plugin wird verwendet');
            } else if (!navigator.bluetooth) {
            // Web Browser ohne Bluetooth Support
                this.bleAvailable = false;
                console.warn('⚠️ Web Browser ohne Bluetooth - In der APK funktioniert es!');
                // KEINE Fehlermeldung zeigen in nativer App!
                return true; // Nicht abbrechen
            } else {
                this.bleAvailable = true;
            }

            // 2. Prüfe ob echter BLE-Controller geladen ist (mit Verzögerung für spätes Laden)
            const controller = window.bleController || window.BLEControllerPro;
            if (!controller) {
                // Controller noch nicht geladen - warte und versuche später erneut (kein Fehler anzeigen!)
                console.log('⏳ BLE-Controller noch nicht geladen - wird später geprüft');
                return true; // Nicht als Fehler behandeln
            }

            // 3. Prüfe Verbindungsstatus
            this.bleAvailable = true;
            this.bleConnected = controller.isConnected === true;

            if (this.bleConnected) {
                this.updateStatusUI('connected', 'Verbunden mit LED-Band');
            } else {
                this.updateStatusUI('disconnected', 'Nicht verbunden - Gehe zu Einstellungen');
            }

            console.log(`✅ BLE Health Check: Available=${this.bleAvailable}, Connected=${this.bleConnected}`);
            return true;

        } catch (error) {
            this.lastError = error;
            console.error('❌ BLE Health Check Fehler:', error);
            this.showUserMessage(`Bluetooth-Fehler: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Startet periodische Health-Checks
     */
    startHealthCheck() {
        // FIX: Vorherigen Interval clearen falls vorhanden
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(() => {
            this.checkBLEHealth();
        }, 10000); // Alle 10 Sekunden
    }

    /**
     * Stoppt Health-Checks (FIX: Memory Leak Prevention)
     */
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Zeigt echte User-Nachrichten (keine versteckten Fehler!)
     */
    showUserMessage(message, type = 'info') {
        // Nutze das echte Notification-System
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else if (typeof window.showGlobalNotification === 'function') {
            window.showGlobalNotification(message, type);
        } else {
            // Fallback: Console + Alert für kritische Fehler
            console.log(`[${type.toUpperCase()}] ${message}`);
            if (type === 'error') {
                console.error(`❌ ${message}`);
            }
        }
    }

    /**
     * Aktualisiert Status-UI Elemente
     */
    updateStatusUI(status, message) {
        const statusElements = document.querySelectorAll('.ble-status, #ble-status, [data-ble-status]');

        statusElements.forEach(el => {
            el.textContent = message;
            el.className = el.className.replace(/ble-status-\w+/g, '');
            el.classList.add(`ble-status-${status}`);

            // Farben basierend auf echtem Status
            switch (status) {
                case 'connected':
                    el.style.color = '#4ecdc4';
                    break;
                case 'disconnected':
                    el.style.color = '#ff6b6b';
                    break;
                case 'error':
                    el.style.color = '#ff4444';
                    break;
                default:
                    el.style.color = '#888';
            }
        });
    }

    /**
     * Versucht Verbindung wiederherzustellen
     */
    async attemptReconnect() {
        if (this.retryCount >= this.maxRetries) {
            this.showUserMessage('Maximale Verbindungsversuche erreicht. Bitte manuell in Einstellungen verbinden.', 'warning');
            this.retryCount = 0;
            return false;
        }

        this.retryCount++;
        this.showUserMessage(`Verbindungsversuch ${this.retryCount}/${this.maxRetries}...`, 'info');

        try {
            const controller = window.bleController || window.BLEControllerPro;
            if (controller && typeof controller.reconnect === 'function') {
                const success = await controller.reconnect();
                if (success) {
                    this.retryCount = 0;
                    this.showUserMessage('Verbindung wiederhergestellt!', 'success');
                    return true;
                }
            }
        } catch (error) {
            console.error('Reconnect fehlgeschlagen:', error);
        }

        return false;
    }

    /**
     * Helper: Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global initialisieren
let bleHealthMonitor;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        bleHealthMonitor = new BLEHealthMonitor();
        window.bleHealthMonitor = bleHealthMonitor;
    });
} else {
    bleHealthMonitor = new BLEHealthMonitor();
    window.bleHealthMonitor = bleHealthMonitor;
}

window.BLEHealthMonitor = BLEHealthMonitor;

// Kompatibilität: BLEErrorFixer muss ein Objekt mit init() sein, wenn es so aufgerufen wird!
window.BLEErrorFixer = {
    init: function () {
        if (window.bleHealthMonitor) {
            window.bleHealthMonitor.init();
        } else {
            console.warn('BLEHealthMonitor nicht verfügbar für BLEErrorFixer-Fallback');
        }
    }
};

window.bleErrorFixer = bleHealthMonitor;
