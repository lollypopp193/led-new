/**
 * NATIVE-BLE-SCANNER.JS
 * Echter Native BLE Scanner für Android mit Capacitor BLE Plugin
 * @version 1.0.0
 */
'use strict';

class NativeBLEScanner {
    constructor() {
        this.isScanning = false;
        this.devices = new Map();
        this.connectedDevice = null;
        this.BleClient = null;
        this.onDeviceFound = null;
        this.scanTimeout = null;
    }

    /**
     * Initialisiert den BLE Client
     */
    async initialize() {
        try {
            if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
                console.log('⚠️ Nicht auf Native Platform - verwende Web Bluetooth');
                return false;
            }

            // Dynamischer Import des BLE Plugins
            const bleModule = window.Capacitor.Plugins.BluetoothLe;
            if (!bleModule) {
                console.error('❌ BluetoothLe Plugin nicht gefunden');
                return false;
            }

            this.BleClient = bleModule;
            await this.BleClient.initialize();
            console.log('✅ Native BLE Client initialisiert');
            return true;
        } catch (error) {
            console.error('❌ BLE Initialisierung fehlgeschlagen:', error);
            return false;
        }
    }

    /**
     * Startet BLE Scan
     * @param {number} duration - Scan-Dauer in Sekunden
     * @param {function} callback - Callback für gefundene Geräte
     */
    async startScan(duration = 10, callback) {
        if (this.isScanning) {
            console.warn('⚠️ Scan läuft bereits');
            return;
        }

        try {
            console.log('🔍 Starte BLE Scan...');
            this.isScanning = true;
            this.devices.clear();
            this.onDeviceFound = callback;

            if (!this.BleClient) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('BLE Client konnte nicht initialisiert werden');
                }
            }

            // Starte Scan mit Filtern
            await this.BleClient.requestLEScan(
                {
                    allowDuplicates: false,
                    scanMode: 1, // SCAN_MODE_LOW_LATENCY
                    namePrefix: '', // Alle Geräte
                },
                (result) => {
                    this.handleDeviceFound(result);
                }
            );

            console.log('✅ BLE Scan gestartet');

            // Auto-Stop nach Duration
            this.scanTimeout = setTimeout(() => {
                this.stopScan();
            }, duration * 1000);

        } catch (error) {
            console.error('❌ Scan konnte nicht gestartet werden:', error);
            this.isScanning = false;
            
            // User-freundliche Fehlermeldung
            if (window.showNotification) {
                if (error.message?.includes('permission')) {
                    window.showNotification('Bluetooth-Berechtigung fehlt', 'error');
                } else if (error.message?.includes('disabled')) {
                    window.showNotification('Bitte Bluetooth einschalten', 'warning');
                } else {
                    window.showNotification('Gerätesuche fehlgeschlagen', 'error');
                }
            }
            
            throw error;
        }
    }

    /**
     * Handler für gefundene Geräte
     */
    handleDeviceFound(device) {
        if (!device || !device.device || !device.device.deviceId) {
            return;
        }

        const deviceId = device.device.deviceId;
        const deviceName = device.device.name || device.localName || 'Unbekanntes Gerät';

        // Filter: Nur LED-Geräte
        const ledPrefixes = ['ELK-BLEDOM', 'BLE-LED', 'LED', 'Triones', 'Magic', 'LEDBLE'];
        const isLEDDevice = ledPrefixes.some(prefix => 
            deviceName.toUpperCase().includes(prefix.toUpperCase())
        );

        if (!isLEDDevice && deviceName !== 'Unbekanntes Gerät') {
            return; // Überspringe Nicht-LED-Geräte
        }

        // Speichere Gerät
        if (!this.devices.has(deviceId)) {
            const deviceInfo = {
                id: deviceId,
                name: deviceName,
                rssi: device.rssi || -100,
                timestamp: Date.now()
            };

            this.devices.set(deviceId, deviceInfo);
            console.log(`📱 Gerät gefunden: ${deviceName} (${deviceId})`);

            // Callback aufrufen
            if (this.onDeviceFound) {
                this.onDeviceFound(deviceInfo);
            }
        }
    }

    /**
     * Stoppt BLE Scan
     */
    async stopScan() {
        if (!this.isScanning) {
            return;
        }

        try {
            if (this.scanTimeout) {
                clearTimeout(this.scanTimeout);
                this.scanTimeout = null;
            }

            if (this.BleClient) {
                await this.BleClient.stopLEScan();
            }

            this.isScanning = false;
            console.log('🛑 BLE Scan gestoppt');
            console.log(`📊 ${this.devices.size} Gerät(e) gefunden`);
        } catch (error) {
            console.error('❌ Scan konnte nicht gestoppt werden:', error);
        }
    }

    /**
     * Verbindet mit Gerät
     */
    async connect(deviceId) {
        try {
            console.log(`🔗 Verbinde mit Gerät: ${deviceId}...`);

            if (!this.BleClient) {
                throw new Error('BLE Client nicht initialisiert');
            }

            // Verbindung herstellen
            await this.BleClient.connect(deviceId, (deviceId) => {
                console.log(`📡 Verbunden mit: ${deviceId}`);
            });

            this.connectedDevice = deviceId;
            console.log('✅ Verbindung hergestellt');

            return true;
        } catch (error) {
            console.error('❌ Verbindung fehlgeschlagen:', error);
            
            if (window.showNotification) {
                window.showNotification('Verbindung fehlgeschlagen', 'error');
            }
            
            return false;
        }
    }

    /**
     * Trennt Verbindung
     */
    async disconnect() {
        if (!this.connectedDevice) {
            return;
        }

        try {
            if (this.BleClient) {
                await this.BleClient.disconnect(this.connectedDevice);
            }
            
            console.log('🔌 Verbindung getrennt');
            this.connectedDevice = null;
        } catch (error) {
            console.error('❌ Trennen fehlgeschlagen:', error);
        }
    }

    /**
     * Gibt alle gefundenen Geräte zurück
     */
    getDevices() {
        return Array.from(this.devices.values());
    }

    /**
     * Cleanup
     */
    async cleanup() {
        await this.stopScan();
        await this.disconnect();
        this.devices.clear();
    }
}

// Global verfügbar machen
window.NativeBLEScanner = NativeBLEScanner;
window.nativeBLEScanner = new NativeBLEScanner();

console.log('✅ Native BLE Scanner geladen');
