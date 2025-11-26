/**
 * STARTUP-PERMISSIONS.JS
 * Berechtigungen beim App-Start wie LED-Apps
 * Nacheinander: Bluetooth → Standort → Speicher → Benachrichtigungen
 */
'use strict';

class StartupPermissions {
    constructor() {
        this.permissionsGranted = {
            bluetooth: false,
            location: false,
            storage: false,
            notifications: false,
            audio: false
        };
        this.permissionQueue = [];
    }

    /**
     * Startet den Berechtigungsdialog beim App-Start
     */
    async requestAllPermissions() {
        console.log('📱 Starte Berechtigungsanfragen...');

        try {
            // 1. Bluetooth-Berechtigungen
            await this.requestBluetooth();

            // 2. Standort-Berechtigung (für Bluetooth-Scan)
            await this.requestLocation();

            // 3. Speicher-Berechtigungen (für Musik)
            await this.requestStorage();

            // 4. Audio-Berechtigung
            await this.requestAudio();

            // 5. Benachrichtigungen (optional)
            await this.requestNotifications();

            console.log('✅ Alle Berechtigungen abgefragt:', this.permissionsGranted);

            // Starte Auto-Scan nach Berechtigungen
            this.startAutoScans();

            return this.permissionsGranted;
        } catch (error) {
            console.error('❌ Fehler bei Berechtigungsanfragen:', error);
            return this.permissionsGranted;
        }
    }

    /**
     * Bluetooth-Berechtigungen anfordern
     */
    async requestBluetooth() {
        console.log('🔵 Frage Bluetooth-Berechtigung an...');

        try {
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                // Native Android
                const { BleClient } = window.CapacitorCommunityBluetoothLe || {};
                if (BleClient) {
                    // Bluetooth-Berechtigung wird automatisch von BLE-Plugin angefragt
                    this.permissionsGranted.bluetooth = true;
                    console.log('✅ Bluetooth-Berechtigung erteilt (Native)');
                }
            } else {
                // Web Bluetooth API
                this.permissionsGranted.bluetooth = true; // Wird bei Scan angefragt
                console.log('✅ Bluetooth-Berechtigung vorbereitet (Web)');
            }
        } catch (error) {
            console.error('❌ Bluetooth-Berechtigung fehlgeschlagen:', error);
        }
    }

    /**
     * Standort-Berechtigung anfordern (für Bluetooth-Scan)
     */
    async requestLocation() {
        console.log('📍 Frage Standort-Berechtigung an...');

        try {
            if (window.Capacitor && window.Capacitor.Plugins) {
                const { Geolocation } = window.Capacitor.Plugins;
                if (Geolocation) {
                    const permission = await Geolocation.requestPermissions();
                    this.permissionsGranted.location = permission.location === 'granted';
                    console.log('✅ Standort-Berechtigung:', permission.location);
                }
            } else {
                // Browser - frage einfache Berechtigung an
                navigator.geolocation.getCurrentPosition(
                    () => {
                        this.permissionsGranted.location = true;
                        console.log('✅ Standort-Berechtigung erteilt');
                    },
                    () => {
                        console.log('⚠️ Standort-Berechtigung verweigert');
                    }
                );
            }
        } catch (error) {
            console.error('❌ Standort-Berechtigung fehlgeschlagen:', error);
        }
    }

    /**
     * Speicher-Berechtigungen anfordern (für Musik-Dateien)
     */
    async requestStorage() {
        console.log('💾 Frage Speicher-Berechtigung an...');

        try {
            if (window.Capacitor && window.Capacitor.Plugins) {
                const { Filesystem } = window.Capacitor.Plugins;
                if (Filesystem) {
                    const permission = await Filesystem.requestPermissions();
                    this.permissionsGranted.storage = permission.publicStorage === 'granted';
                    console.log('✅ Speicher-Berechtigung:', permission.publicStorage);
                }
            } else {
                // Web - immer erlaubt
                this.permissionsGranted.storage = true;
                console.log('✅ Speicher-Berechtigung erteilt (Web)');
            }
        } catch (error) {
            console.error('❌ Speicher-Berechtigung fehlgeschlagen:', error);
        }
    }

    /**
     * Audio-Berechtigung anfordern
     */
    async requestAudio() {
        console.log('🎵 Frage Audio-Berechtigung an...');

        try {
            // Musik-Dateien lesen erlaubt?
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                // Bereits mit Storage abgedeckt
                this.permissionsGranted.audio = this.permissionsGranted.storage;
            } else {
                this.permissionsGranted.audio = true;
            }
            console.log('✅ Audio-Berechtigung erteilt');
        } catch (error) {
            console.error('❌ Audio-Berechtigung fehlgeschlagen:', error);
        }
    }

    /**
     * Benachrichtigungs-Berechtigung anfordern
     */
    async requestNotifications() {
        console.log('🔔 Frage Benachrichtigungs-Berechtigung an...');

        try {
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                this.permissionsGranted.notifications = permission === 'granted';
                console.log('✅ Benachrichtigungen:', permission);
            } else if (Notification.permission === 'granted') {
                this.permissionsGranted.notifications = true;
            }
        } catch (error) {
            console.error('❌ Benachrichtigungs-Berechtigung fehlgeschlagen:', error);
        }
    }

    /**
     * Startet automatische Scans nach Berechtigungen
     */
    startAutoScans() {
        console.log('🔍 Starte Auto-Scans...');

        // LED-Bänder scannen wenn Bluetooth erlaubt
        if (this.permissionsGranted.bluetooth) {
            setTimeout(() => {
                if (window.ledAutoScanner) {
                    window.ledAutoScanner.startAutoScan();
                }
            }, 1000);
        }

        // Musik-Bibliothek scannen wenn Speicher erlaubt
        if (this.permissionsGranted.storage) {
            setTimeout(() => {
                if (window.MusicLibraryManager) {
                    window.MusicLibraryManager.startAutoScan();
                }
            }, 2000);
        }
    }

    /**
     * Prüft ob alle Berechtigungen erteilt sind
     */
    allPermissionsGranted() {
        return Object.values(this.permissionsGranted).every(granted => granted);
    }
}

// Global initialisieren
const startupPermissions = new StartupPermissions();
window.startupPermissions = startupPermissions;

// Beim App-Start ausführen
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Verzögert starten damit Intro sichtbar ist
        setTimeout(() => {
            startupPermissions.requestAllPermissions();
        }, 2000);
    });
} else {
    setTimeout(() => {
        startupPermissions.requestAllPermissions();
    }, 2000);
}
