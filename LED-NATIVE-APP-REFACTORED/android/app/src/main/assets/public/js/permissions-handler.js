/**
 * PERMISSIONS HANDLER - Berechtigungen beim App-Start abfragen
 * Integriert mit AndroidPermissionsManager für native Android Permissions
 * @version 3.0
 */
'use strict';

const PermissionsHandler = {
    permissions: {
        bluetooth: false,
        location: false,
        storage: false,
        notifications: false,
        mediaAudio: false // Android 13+
    },

    isAndroid: false,

    async init() {
        // Android-Detection
        if (typeof Capacitor !== 'undefined') {
            this.isAndroid = Capacitor.getPlatform() === 'android';
        }

        // AndroidPermissionsManager initialisieren (falls vorhanden)
        if (this.isAndroid && window.AndroidPermissionsManager) {
            await window.AndroidPermissionsManager.init();
        }

        // console.log('✅ PermissionsHandler initialisiert (Android:', this.isAndroid, ')');
    },

    async requestAllPermissions() {
        // console.log('📋 Fordere Berechtigungen an...');

        try {
            // Android Native Permissions über AndroidPermissionsManager
            if (this.isAndroid && window.AndroidPermissionsManager) {
                // console.log('🤖 Nutze Android Permissions Manager');
                const results = await window.AndroidPermissionsManager.requestAllPermissions();

                this.permissions.bluetooth = results.bluetooth?.granted || false;
                this.permissions.location = results.location?.granted || false;
                this.permissions.storage = results.storage?.granted || false;
                this.permissions.notifications = results.notifications?.granted || false;

                // console.log('✅ Android Permissions abgefragt:', this.permissions);
                return this.permissions;
            }

            // Web Fallback
            // console.log('🌐 Nutze Web Permissions');

            // Bluetooth Berechtigungen
            await this.requestBluetoothPermissions();

            // Standort Berechtigungen (für Bluetooth auf Android 10-11)
            await this.requestLocationPermissions();

            // Speicher Berechtigungen (für Musikdateien)
            await this.requestStoragePermissions();

            // Benachrichtigungen
            await this.requestNotificationPermissions();

            // console.log('✅ Alle Berechtigungen abgefragt');
            return this.permissions;
        } catch (error) {
            console.error('❌ Fehler bei Berechtigungen:', error);
            return this.permissions;
        }
    },

    async requestBluetoothPermissions() {
        try {
            if (typeof BluetoothLE !== 'undefined') {
                // Capacitor Bluetooth LE Plugin
                const result = await BluetoothLE.initialize({ request: true });
                this.permissions.bluetooth = result.enabled;
                // console.log('✅ Bluetooth Berechtigung:', result.enabled);
            } else if ('bluetooth' in navigator) {
                // Web Bluetooth API
                this.permissions.bluetooth = true;
                // console.log('✅ Web Bluetooth verfügbar');
            }
        } catch (error) {
            console.warn('⚠️ Bluetooth Berechtigung fehlgeschlagen:', error);
        }
    },

    async requestLocationPermissions() {
        try {
            if (typeof Geolocation !== 'undefined') {
                const position = await Geolocation.getCurrentPosition();
                this.permissions.location = true;
                // console.log('✅ Standort Berechtigung erteilt');
            } else if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        this.permissions.location = true;
                        // console.log('✅ Web Standort verfügbar');
                    },
                    (error) => {
                        console.warn('⚠️ Standort abgelehnt:', error);
                    }
                );
            }
        } catch (error) {
            console.warn('⚠️ Standort Berechtigung fehlgeschlagen:', error);
        }
    },

    async requestStoragePermissions() {
        try {
            if (typeof Filesystem !== 'undefined') {
                // Capacitor Filesystem Plugin
                const result = await Filesystem.requestPermissions();
                this.permissions.storage = result.publicStorage === 'granted';
                // console.log('✅ Speicher Berechtigung:', result.publicStorage);
            } else {
                // Web Storage API ist immer verfügbar
                this.permissions.storage = true;
                // console.log('✅ Web Storage verfügbar');
            }
        } catch (error) {
            console.warn('⚠️ Speicher Berechtigung fehlgeschlagen:', error);
        }
    },

    async requestNotificationPermissions() {
        try {
            if ('Notification' in window) {
                if (Notification.permission === 'default') {
                    const result = await Notification.requestPermission();
                    this.permissions.notifications = result === 'granted';
                    // console.log('✅ Benachrichtigungen:', result);
                } else {
                    this.permissions.notifications = Notification.permission === 'granted';
                }
            }
        } catch (error) {
            console.warn('⚠️ Benachrichtigungen fehlgeschlagen:', error);
        }
    },

    getPermissionsStatus() {
        return this.permissions;
    },

    showPermissionsDialog() {
        const missingPerms = [];
        if (!this.permissions.bluetooth) missingPerms.push('Bluetooth');
        if (!this.permissions.location) missingPerms.push('Standort');
        if (!this.permissions.storage) missingPerms.push('Speicher');

        if (missingPerms.length > 0) {
            const message = `Diese App benötigt folgende Berechtigungen:\n\n${missingPerms.join('\n')}\n\nBitte erteile die Berechtigungen in den Einstellungen.`;
            alert(message);
        }
    }
};

window.PermissionsHandler = PermissionsHandler;
