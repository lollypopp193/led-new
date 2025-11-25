/**
 * BLUETOOTH FOREGROUND SERVICE - Dauerhafte BT-Verbindung mit Auto-Reconnect
 * Implementiert Foreground Service für persistente Bluetooth-Verbindungen
 * @version 1.0
 * @requires IndexedDB, Web Bluetooth API, Capacitor LocalNotifications
 */
'use strict';

const BluetoothForegroundService = {
    /**
     * Configuration
     */
    config: {
        DB_NAME: 'BluetoothDevicesDB',
        DB_VERSION: 1,
        STORE_NAME: 'devices',
        NOTIFICATION_ID: 1001,
        RECONNECT_INTERVAL: 5000, // 5 Sekunden
        HEALTH_CHECK_INTERVAL: 10000, // 10 Sekunden
        MAX_RECONNECT_ATTEMPTS: 5
    },

    /**
     * State
     */
    db: null,
    isServiceRunning: false,
    connectedDevices: new Map(),
    reconnectTimers: new Map(),
    healthCheckTimer: null,

    /**
     * Initialisierung - IndexedDB & Service Setup
     */
    async init() {
        console.log('🔵 Bluetooth Foreground Service initialisieren...');

        try {
            await this.initDatabase();
            console.log('✅ Bluetooth Service initialisiert');
            return true;
        } catch (error) {
            console.error('❌ Bluetooth Service Init Fehler:', error);
            return false;
        }
    },

    /**
     * IndexedDB für Device Persistence
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.DB_NAME, this.config.DB_VERSION);

            request.onerror = () => {
                console.error('❌ IndexedDB Fehler:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ Bluetooth Device DB initialisiert');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.config.STORE_NAME)) {
                    const store = db.createObjectStore(this.config.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    store.createIndex('deviceId', 'deviceId', { unique: true });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('isPrimary', 'isPrimary', { unique: false });
                    store.createIndex('lastConnected', 'lastConnected', { unique: false });

                    console.log('✅ Device ObjectStore erstellt');
                }
            };
        });
    },

    /**
     * Gerät speichern (persistent)
     */
    async saveDevice(device, isPrimary = false, customSettings = {}) {
        if (!this.db) {
            console.error('❌ Database nicht initialisiert');
            return false;
        }

        try {
            const deviceData = {
                deviceId: device.id,
                name: device.name || 'Unbekanntes Gerät',
                isPrimary: isPrimary,
                lastConnected: Date.now(),
                dateAdded: Date.now(),
                reconnectAttempts: 0,
                settings: {
                    brightness: customSettings.brightness || 255,
                    color: customSettings.color || '#FFFFFF',
                    effect: customSettings.effect || 'solid',
                    ...customSettings
                },
                // GATT Service/Characteristic (falls bekannt)
                serviceUUID: customSettings.serviceUUID || null,
                characteristicUUID: customSettings.characteristicUUID || null
            };

            // Prüfen ob Gerät bereits existiert
            const existing = await this.getDeviceByDeviceId(device.id);
            if (existing) {
                // Update
                deviceData.id = existing.id;
                deviceData.dateAdded = existing.dateAdded;
                await this.updateDevice(existing.id, deviceData);
                console.log('✅ Gerät aktualisiert:', device.name);
            } else {
                // Insert
                await this.insertDevice(deviceData);
                console.log('✅ Gerät gespeichert:', device.name);
            }

            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            return false;
        }
    },

    /**
     * Device in DB einfügen
     */
    insertDevice(deviceData) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.config.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.config.STORE_NAME);
            const request = store.add(deviceData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Device in DB updaten
     */
    updateDevice(id, deviceData) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.config.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.config.STORE_NAME);
            const request = store.put(deviceData);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Alle gespeicherten Geräte abrufen
     */
    async getSavedDevices() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.config.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.config.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Gerät per Device ID suchen
     */
    async getDeviceByDeviceId(deviceId) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.config.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.config.STORE_NAME);
            const index = store.index('deviceId');
            const request = index.get(deviceId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Gerät löschen
     */
    async deleteDevice(id) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.config.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.config.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('✅ Gerät gelöscht:', id);
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    },

    /**
     * Foreground Service starten (mit Notification)
     */
    async startForegroundService() {
        if (this.isServiceRunning) {
            console.log('⚠️ Service läuft bereits');
            return true;
        }

        try {
            console.log('🚀 Starte Foreground Service...');

            // Notification anzeigen
            await this.showForegroundNotification();

            // Health Check Timer starten
            this.startHealthCheck();

            this.isServiceRunning = true;
            console.log('✅ Foreground Service aktiv');
            return true;
        } catch (error) {
            console.error('❌ Foreground Service Start Fehler:', error);
            return false;
        }
    },

    /**
     * Foreground Service stoppen
     */
    async stopForegroundService() {
        if (!this.isServiceRunning) {
            console.log('⚠️ Service läuft nicht');
            return;
        }

        try {
            console.log('🛑 Stoppe Foreground Service...');

            // Notification entfernen
            await this.hideForegroundNotification();

            // Health Check Timer stoppen
            this.stopHealthCheck();

            // Alle Reconnect Timer stoppen
            this.reconnectTimers.forEach((timer) => clearTimeout(timer));
            this.reconnectTimers.clear();

            this.isServiceRunning = false;
            console.log('✅ Foreground Service gestoppt');
        } catch (error) {
            console.error('❌ Foreground Service Stop Fehler:', error);
        }
    },

    /**
     * Foreground Notification anzeigen
     */
    async showForegroundNotification() {
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.LocalNotifications) {
                const { LocalNotifications } = Capacitor.Plugins;

                await LocalNotifications.schedule({
                    notifications: [
                        {
                            id: this.config.NOTIFICATION_ID,
                            title: 'LED Control aktiv',
                            body: `${this.connectedDevices.size} Geräte verbunden`,
                            ongoing: true,
                            autoCancel: false,
                            smallIcon: 'ic_notification',
                            channelId: 'led_service'
                        }
                    ]
                });

                console.log('🔔 Foreground Notification angezeigt');
            } else {
                console.warn('⚠️ LocalNotifications nicht verfügbar (Web Environment)');
            }
        } catch (error) {
            console.error('❌ Notification Fehler:', error);
        }
    },

    /**
     * Foreground Notification entfernen
     */
    async hideForegroundNotification() {
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.LocalNotifications) {
                const { LocalNotifications } = Capacitor.Plugins;
                await LocalNotifications.cancel({ notifications: [{ id: this.config.NOTIFICATION_ID }] });
                console.log('🔕 Foreground Notification entfernt');
            }
        } catch (error) {
            console.error('❌ Notification Remove Fehler:', error);
        }
    },

    /**
     * Notification updaten
     */
    async updateNotification(title, body) {
        try {
            if (this.isServiceRunning) {
                await this.showForegroundNotification();
            }
        } catch (error) {
            console.error('❌ Notification Update Fehler:', error);
        }
    },

    /**
     * Auto-Reconnect: Alle gespeicherten Geräte verbinden
     */
    async autoReconnectAll() {
        console.log('🔄 Auto-Reconnect für alle gespeicherten Geräte...');

        try {
            const devices = await this.getSavedDevices();
            console.log(`📋 ${devices.length} Gerät(e) gefunden`);

            if (devices.length === 0) {
                console.log('ℹ️ Keine gespeicherten Geräte');
                return;
            }

            // Primary Device zuerst
            const primary = devices.find(d => d.isPrimary);
            if (primary) {
                await this.reconnectDevice(primary);
            }

            // Dann andere Geräte
            const others = devices.filter(d => !d.isPrimary);
            for (const device of others) {
                await this.reconnectDevice(device);
                await this.delay(1000); // 1s Pause zwischen Verbindungen
            }

            console.log('✅ Auto-Reconnect abgeschlossen');
        } catch (error) {
            console.error('❌ Auto-Reconnect Fehler:', error);
        }
    },

    /**
     * Einzelnes Gerät wieder verbinden
     */
    async reconnectDevice(deviceData) {
        console.log(`🔄 Versuche Verbindung zu: ${deviceData.name}`);

        try {
            // Web Bluetooth API verwenden
            if (!('bluetooth' in navigator)) {
                console.error('❌ Web Bluetooth nicht verfügbar');
                return false;
            }

            // WICHTIG: requestDevice() braucht User-Geste!
            // Für Auto-Reconnect müssen wir die Geräte bereits gekoppelt haben
            // Web Bluetooth API hat keine direkte Auto-Connect Methode

            // Alternative: BLE Controller Pro verwenden
            if (window.BLEControllerPro) {
                const success = await window.BLEControllerPro.reconnectToDevice(deviceData.deviceId);

                if (success) {
                    this.connectedDevices.set(deviceData.deviceId, deviceData);
                    await this.updateDevice(deviceData.id, {
                        ...deviceData,
                        lastConnected: Date.now(),
                        reconnectAttempts: 0
                    });
                    console.log(`✅ Verbunden: ${deviceData.name}`);
                    return true;
                } else {
                    throw new Error('Reconnect fehlgeschlagen');
                }
            }

            console.warn('⚠️ BLEControllerPro nicht verfügbar');
            return false;
        } catch (error) {
            console.error(`❌ Reconnect zu ${deviceData.name} fehlgeschlagen:`, error);

            // Retry Logic
            if (deviceData.reconnectAttempts < this.config.MAX_RECONNECT_ATTEMPTS) {
                deviceData.reconnectAttempts++;
                await this.updateDevice(deviceData.id, deviceData);

                console.log(`🔁 Retry ${deviceData.reconnectAttempts}/${this.config.MAX_RECONNECT_ATTEMPTS} in ${this.config.RECONNECT_INTERVAL}ms`);

                const timer = setTimeout(() => {
                    this.reconnectDevice(deviceData);
                }, this.config.RECONNECT_INTERVAL);

                this.reconnectTimers.set(deviceData.deviceId, timer);
            } else {
                console.error(`❌ Max Reconnect Versuche erreicht für ${deviceData.name}`);
            }

            return false;
        }
    },

    /**
     * Health Check: Verbindungen überwachen
     */
    startHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(async () => {
            console.log('💓 Health Check...');

            const devices = await this.getSavedDevices();

            for (const device of devices) {
                const isConnected = this.connectedDevices.has(device.deviceId);

                if (!isConnected && device.isPrimary) {
                    console.warn(`⚠️ Primary Device ${device.name} disconnected - reconnecting...`);
                    await this.reconnectDevice(device);
                }
            }

            // Notification updaten
            const connectedCount = this.connectedDevices.size;
            if (this.isServiceRunning) {
                await this.updateNotification('LED Control aktiv', `${connectedCount} Gerät(e) verbunden`);
            }
        }, this.config.HEALTH_CHECK_INTERVAL);

        console.log('💓 Health Check gestartet');
    },

    /**
     * Health Check stoppen
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
            console.log('💓 Health Check gestoppt');
        }
    },

    /**
     * Device Connection Event (von BLE Controller aufgerufen)
     */
    onDeviceConnected(deviceId, deviceName) {
        console.log(`✅ Device Connected Event: ${deviceName}`);

        // Device zu connectedDevices Map hinzufügen
        this.connectedDevices.set(deviceId, {
            deviceId: deviceId,
            name: deviceName,
            connectedAt: Date.now()
        });

        // Reconnect Timer stoppen (falls aktiv)
        if (this.reconnectTimers.has(deviceId)) {
            clearTimeout(this.reconnectTimers.get(deviceId));
            this.reconnectTimers.delete(deviceId);
        }

        // Notification updaten
        if (this.isServiceRunning) {
            this.updateNotification('LED Control aktiv', `${this.connectedDevices.size} Gerät(e) verbunden`);
        }
    },

    /**
     * Device Disconnection Event
     */
    onDeviceDisconnected(deviceId) {
        console.warn(`⚠️ Device Disconnected Event: ${deviceId}`);

        // Device aus connectedDevices Map entfernen
        this.connectedDevices.delete(deviceId);

        // Auto-Reconnect starten
        this.getSavedDevices().then(devices => {
            const device = devices.find(d => d.deviceId === deviceId);
            if (device) {
                console.log(`🔄 Auto-Reconnect für ${device.name}...`);
                this.reconnectDevice(device);
            }
        });

        // Notification updaten
        if (this.isServiceRunning) {
            this.updateNotification('LED Control aktiv', `${this.connectedDevices.size} Gerät(e) verbunden`);
        }
    },

    /**
     * Utils
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Global verfügbar machen
window.BluetoothForegroundService = BluetoothForegroundService;
console.log('✅ Bluetooth Foreground Service geladen');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BluetoothForegroundService;
}
