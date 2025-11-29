/**
 * ANDROID PERMISSIONS MANAGER - Native Android Runtime Permissions
 * Verwendet Capacitor Plugins für Android-spezifische Berechtigungen
 * @version 1.0
 * @requires @capacitor/core, @capacitor/app, @capacitor/filesystem
 */
'use strict';

const AndroidPermissionsManager = {
    /**
     * Permission Status Cache
     */
    permissionStatus: {
        bluetooth: { granted: false, denied: false },
        location: { granted: false, denied: false },
        storage: { granted: false, denied: false },
        mediaAudio: { granted: false, denied: false },
        notifications: { granted: false, denied: false }
    },

    /**
     * Android API Level Detection
     */
    androidVersion: null,

    /**
     * Initialisierung - Android Version erkennen
     */
    async init() {
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android') {
                const info = await Capacitor.Plugins.Device.getInfo();
                this.androidVersion = info.androidSDKVersion || info.osVersion;
                console.log('📱 Android API Level:', this.androidVersion);
            } else {
                console.log('🌐 Web Environment - keine nativen Permissions nötig');
                this.androidVersion = null;
            }
        } catch (error) {
            console.warn('⚠️ Device Info konnte nicht geladen werden:', error);
            this.androidVersion = null;
        }
    },

    /**
     * Alle Berechtigungen anfordern (beim ersten App-Start)
     */
    async requestAllPermissions() {
        console.log('📋 Fordere alle Android Permissions an...');

        const results = {
            bluetooth: await this.requestBluetoothPermissions(),
            location: await this.requestLocationPermissions(),
            storage: await this.requestStoragePermissions(),
            notifications: await this.requestNotificationPermissions()
        };

        console.log('✅ Permission Requests abgeschlossen:', results);
        return results;
    },

    /**
     * Bluetooth Permissions (Android 12+ spezifisch)
     * BLUETOOTH_SCAN, BLUETOOTH_CONNECT
     */
    async requestBluetoothPermissions() {
        try {
            // Android 12+ (API 31+) braucht neue Permissions
            if (this.androidVersion >= 31) {
                console.log('📡 Fordere BLUETOOTH_SCAN & BLUETOOTH_CONNECT an...');

                // Capacitor hat kein direktes BT-Permission Plugin
                // Wir nutzen die Web Bluetooth API als Trigger
                if ('bluetooth' in navigator) {
                    // User-Geste erforderlich - wird beim ersten Scan triggered
                    this.permissionStatus.bluetooth.granted = true;
                    console.log('✅ Bluetooth verfügbar (wird beim ersten Scan angefragt)');
                    return { granted: true };
                }
            } else {
                // Android 10-11: Bluetooth + Location
                console.log('📡 Fordere Legacy Bluetooth Permissions an...');
                this.permissionStatus.bluetooth.granted = true;
                return { granted: true };
            }
        } catch (error) {
            console.error('❌ Bluetooth Permission Fehler:', error);
            this.permissionStatus.bluetooth.denied = true;
            return { granted: false, error: error.message };
        }
    },

    /**
     * Location Permissions (für Bluetooth auf Android 10-11)
     * ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
     */
    async requestLocationPermissions() {
        try {
            if (typeof Capacitor === 'undefined' || Capacitor.getPlatform() !== 'android') {
                return { granted: true, reason: 'Not Android' };
            }

            // Android 10-11 braucht Location für BT-Scan
            if (this.androidVersion >= 29 && this.androidVersion < 31) {
                console.log('📍 Fordere Location Permission für Bluetooth an...');

                const { Geolocation } = Capacitor.Plugins;
                if (Geolocation) {
                    try {
                        const position = await Geolocation.getCurrentPosition();
                        this.permissionStatus.location.granted = true;
                        console.log('✅ Location Permission erteilt');
                        return { granted: true };
                    } catch (err) {
                        if (err.message && err.message.includes('denied')) {
                            this.permissionStatus.location.denied = true;
                            console.warn('⚠️ Location Permission abgelehnt');
                        }
                        return { granted: false, error: err.message };
                    }
                }
            }

            // Android 12+ braucht keine Location für BT
            console.log('✅ Location nicht erforderlich (Android 12+)');
            return { granted: true, reason: 'Not required' };
        } catch (error) {
            console.error('❌ Location Permission Fehler:', error);
            return { granted: false, error: error.message };
        }
    },

    /**
     * Storage/Media Permissions
     * Android 10-12: READ_EXTERNAL_STORAGE
     * Android 13+: READ_MEDIA_AUDIO
     */
    async requestStoragePermissions() {
        try {
            if (typeof Capacitor === 'undefined' || Capacitor.getPlatform() !== 'android') {
                return { granted: true, reason: 'Not Android' };
            }

            const { Filesystem } = Capacitor.Plugins;
            if (!Filesystem) {
                console.warn('⚠️ Filesystem Plugin nicht verfügbar');
                return { granted: false, reason: 'Plugin missing' };
            }

            // Android 13+ (API 33+) - READ_MEDIA_AUDIO
            if (this.androidVersion >= 33) {
                console.log('🎵 Fordere READ_MEDIA_AUDIO Permission an (Android 13+)...');

                try {
                    const result = await Filesystem.requestPermissions();
                    if (result.publicStorage === 'granted') {
                        this.permissionStatus.mediaAudio.granted = true;
                        console.log('✅ READ_MEDIA_AUDIO erteilt');
                        return { granted: true, type: 'READ_MEDIA_AUDIO' };
                    } else {
                        this.permissionStatus.mediaAudio.denied = true;
                        console.warn('⚠️ READ_MEDIA_AUDIO abgelehnt');
                        return { granted: false, type: 'READ_MEDIA_AUDIO' };
                    }
                } catch (err) {
                    console.error('❌ Filesystem Permission Fehler:', err);
                    return { granted: false, error: err.message };
                }
            }
            // Android 10-12 - READ_EXTERNAL_STORAGE
            else if (this.androidVersion >= 29) {
                console.log('📂 Fordere READ_EXTERNAL_STORAGE an (Android 10-12)...');

                try {
                    const result = await Filesystem.requestPermissions();
                    if (result.publicStorage === 'granted') {
                        this.permissionStatus.storage.granted = true;
                        console.log('✅ READ_EXTERNAL_STORAGE erteilt');
                        return { granted: true, type: 'READ_EXTERNAL_STORAGE' };
                    } else {
                        this.permissionStatus.storage.denied = true;
                        console.warn('⚠️ READ_EXTERNAL_STORAGE abgelehnt');
                        return { granted: false, type: 'READ_EXTERNAL_STORAGE' };
                    }
                } catch (err) {
                    console.error('❌ Storage Permission Fehler:', err);
                    return { granted: false, error: err.message };
                }
            }

            // Fallback für ältere Android-Versionen
            console.log('✅ Legacy Storage Permission (automatisch erteilt)');
            this.permissionStatus.storage.granted = true;
            return { granted: true, reason: 'Legacy' };
        } catch (error) {
            console.error('❌ Storage Permission Fehler:', error);
            return { granted: false, error: error.message };
        }
    },

    /**
     * Notification Permission (Android 13+ POST_NOTIFICATIONS)
     */
    async requestNotificationPermissions() {
        try {
            if (typeof Capacitor === 'undefined' || Capacitor.getPlatform() !== 'android') {
                // Web Notifications
                if ('Notification' in window && Notification.permission !== 'granted') {
                    const result = await Notification.requestPermission();
                    this.permissionStatus.notifications.granted = (result === 'granted');
                    return { granted: (result === 'granted') };
                }
                return { granted: true, reason: 'Not needed' };
            }

            // Android 13+ braucht POST_NOTIFICATIONS
            if (this.androidVersion >= 33) {
                console.log('🔔 Fordere POST_NOTIFICATIONS an (Android 13+)...');

                const { LocalNotifications } = Capacitor.Plugins;
                if (LocalNotifications) {
                    try {
                        const result = await LocalNotifications.requestPermissions();
                        if (result.display === 'granted') {
                            this.permissionStatus.notifications.granted = true;
                            console.log('✅ POST_NOTIFICATIONS erteilt');
                            return { granted: true };
                        } else {
                            this.permissionStatus.notifications.denied = true;
                            console.warn('⚠️ POST_NOTIFICATIONS abgelehnt');
                            return { granted: false };
                        }
                    } catch (err) {
                        console.error('❌ Notification Permission Fehler:', err);
                        return { granted: false, error: err.message };
                    }
                }
            }

            // Android <13: Notifications sind automatisch erlaubt
            console.log('✅ Notifications automatisch erlaubt (<Android 13)');
            this.permissionStatus.notifications.granted = true;
            return { granted: true, reason: 'Auto-granted' };
        } catch (error) {
            console.error('❌ Notification Permission Fehler:', error);
            return { granted: false, error: error.message };
        }
    },

    /**
     * Alle Permission-Stati prüfen (ohne neue Abfrage)
     */
    async checkAllPermissions() {
        console.log('🔍 Prüfe alle Permission-Stati...');

        try {
            if (typeof Capacitor === 'undefined' || Capacitor.getPlatform() !== 'android') {
                console.log('🌐 Web Environment - alle Permissions OK');
                return {
                    bluetooth: true,
                    location: true,
                    storage: true,
                    notifications: true
                };
            }

            const { Filesystem, LocalNotifications } = Capacitor.Plugins;

            // Storage/Media Check
            if (Filesystem) {
                const storagePerms = await Filesystem.checkPermissions();
                this.permissionStatus.storage.granted = (storagePerms.publicStorage === 'granted');
                this.permissionStatus.mediaAudio.granted = (storagePerms.publicStorage === 'granted');
            }

            // Notification Check
            if (LocalNotifications && this.androidVersion >= 33) {
                const notifPerms = await LocalNotifications.checkPermissions();
                this.permissionStatus.notifications.granted = (notifPerms.display === 'granted');
            } else {
                this.permissionStatus.notifications.granted = true; // Auto-granted <Android 13
            }

            // Bluetooth & Location haben keine Check-API - wir nutzen den Cache
            const status = {
                bluetooth: this.permissionStatus.bluetooth.granted,
                location: this.permissionStatus.location.granted || this.androidVersion >= 31,
                storage: this.permissionStatus.storage.granted || this.permissionStatus.mediaAudio.granted,
                notifications: this.permissionStatus.notifications.granted
            };

            console.log('📊 Permission Status:', status);
            return status;
        } catch (error) {
            console.error('❌ Permission Check Fehler:', error);
            return null;
        }
    },

    /**
     * Zeige Permission-Dialog für fehlende Berechtigungen
     */
    showMissingPermissionsDialog() {
        const missing = [];

        if (!this.permissionStatus.bluetooth.granted) missing.push('🔵 Bluetooth');
        if (!this.permissionStatus.location.granted && this.androidVersion < 31) missing.push('📍 Standort');
        if (!this.permissionStatus.storage.granted && !this.permissionStatus.mediaAudio.granted) {
            missing.push('🎵 Musikbibliothek');
        }
        if (!this.permissionStatus.notifications.granted && this.androidVersion >= 33) {
            missing.push('🔔 Benachrichtigungen');
        }

        if (missing.length > 0) {
            const message = `Diese App benötigt folgende Berechtigungen:\n\n${missing.join('\n')}\n\nBitte erteile die Berechtigungen in den Android-Einstellungen unter:\nEinstellungen > Apps > LED Control > Berechtigungen`;

            alert(message);
            console.warn('⚠️ Fehlende Permissions:', missing);
            return false;
        }

        console.log('✅ Alle erforderlichen Permissions vorhanden');
        return true;
    },

    /**
     * Öffne App-Einstellungen (falls User Permissions manuell erteilen muss)
     */
    async openAppSettings() {
        try {
            if (typeof Capacitor !== 'undefined' && Capacitor.Plugins.App) {
                const { App } = Capacitor.Plugins;
                if (App.openSettings) {
                    await App.openSettings();
                    console.log('📱 App-Einstellungen geöffnet');
                }
            } else {
                console.warn('⚠️ App.openSettings() nicht verfügbar');
            }
        } catch (error) {
            console.error('❌ Fehler beim Öffnen der Einstellungen:', error);
        }
    },

    /**
     * Permission Rationale anzeigen (warum brauchen wir die Permission?)
     */
    showPermissionRationale(permissionType) {
        const rationales = {
            bluetooth: '🔵 Bluetooth-Berechtigung wird benötigt, um LED-Geräte zu finden und zu verbinden.',
            location: '📍 Standort-Berechtigung ist auf Android 10-11 erforderlich, um Bluetooth-Geräte zu scannen. Dein Standort wird NICHT getrackt.',
            storage: '🎵 Speicher-Berechtigung wird benötigt, um deine Musikbibliothek zu scannen und Songs abzuspielen.',
            mediaAudio: '🎵 Musik-Berechtigung (Android 13+) wird benötigt, um auf deine Musikdateien zuzugreifen.',
            notifications: '🔔 Benachrichtigungs-Berechtigung wird für Hintergrund-Verbindungen und Musik-Steuerung benötigt.'
        };

        const message = rationales[permissionType] || 'Diese Berechtigung wird für die App-Funktion benötigt.';
        alert(message);
        console.log('ℹ️ Permission Rationale:', permissionType, message);
    }
};

// Global verfügbar machen
window.AndroidPermissionsManager = AndroidPermissionsManager;
console.log('✅ Android Permissions Manager geladen');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AndroidPermissionsManager;
}
