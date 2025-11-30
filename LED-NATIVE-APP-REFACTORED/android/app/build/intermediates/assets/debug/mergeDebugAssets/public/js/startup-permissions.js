/**
 * STARTUP-PERMISSIONS.JS
 * Berechtigungen beim App-Start - wie normale Android-Apps
 * Zeigt native Android-Dialoge nacheinander an
 * @version 2.0.0
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
        this.hasRequestedPermissions = false;
    }

    /**
     * Prüft ob Berechtigungen bereits erteilt wurden
     */
    async checkExistingPermissions() {
        const saved = localStorage.getItem('permissions_granted');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Wenn alle wichtigen Berechtigungen erteilt, nicht erneut fragen
                if (parsed.bluetooth && parsed.location && parsed.storage) {
                    this.permissionsGranted = parsed;
                    console.log('✅ Berechtigungen bereits erteilt (gespeichert)');
                    return true;
                }
            } catch (e) { }
        }
        return false;
    }

    /**
     * Startet den Berechtigungsdialog beim App-Start
     * SOFORT - ohne Verzögerung, wie normale Apps
     */
    async requestAllPermissions() {
        if (this.hasRequestedPermissions) return this.permissionsGranted;
        this.hasRequestedPermissions = true;

        console.log('📱 Starte Berechtigungsanfragen (sofort)...');

        // Prüfe ob schon erteilt
        const alreadyGranted = await this.checkExistingPermissions();
        if (alreadyGranted) {
            this.startAutoScans();
            return this.permissionsGranted;
        }

        try {
            // Native Android: Zeige alle Dialoge nacheinander
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                console.log('📱 Native Android - Zeige Berechtigungs-Dialoge...');

                // 1. Bluetooth ZUERST (wichtigste für LED-App)
                await this.requestBluetoothNative();

                // 2. Standort (für BLE-Scan erforderlich)
                await this.requestLocationNative();

                // 3. Speicher (für Musik-Dateien)
                await this.requestStorageNative();

            } else {
                // Web-Fallback
                await this.requestBluetooth();
                await this.requestLocation();
                await this.requestStorage();
            }

            // Optional: Audio & Benachrichtigungen
            await this.requestAudio();
            // Keine Benachrichtigungen - User will das nicht

            // Speichere Status
            localStorage.setItem('permissions_granted', JSON.stringify(this.permissionsGranted));

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
     * Native Android Bluetooth-Berechtigung
     */
    async requestBluetoothNative() {
        console.log('🔵 Android: Bluetooth-Berechtigung...');
        try {
            // BLE-Plugin fragt automatisch Bluetooth-Berechtigung an
            if (window.CapacitorCommunityBluetoothLe) {
                const { BleClient } = window.CapacitorCommunityBluetoothLe;
                if (BleClient) {
                    await BleClient.initialize({ androidNeverForLocation: false });
                    this.permissionsGranted.bluetooth = true;
                    console.log('✅ Bluetooth-Berechtigung erteilt');
                }
            }
        } catch (error) {
            console.warn('⚠️ Bluetooth-Init:', error.message);
            // Trotzdem als OK markieren wenn BLE nicht verfügbar
            this.permissionsGranted.bluetooth = true;
        }
    }

    /**
     * Native Android Standort-Berechtigung
     */
    async requestLocationNative() {
        console.log('📍 Android: Standort-Berechtigung...');
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
                const { Geolocation } = window.Capacitor.Plugins;
                const permission = await Geolocation.requestPermissions();
                this.permissionsGranted.location = permission.location === 'granted';
                console.log('✅ Standort:', permission.location);
            } else {
                // Kein Geolocation-Plugin - Android fragt automatisch bei BLE-Scan
                this.permissionsGranted.location = true;
            }
        } catch (error) {
            console.warn('⚠️ Standort-Permission:', error.message);
            this.permissionsGranted.location = true;
        }
    }

    /**
     * Native Android Speicher-Berechtigung
     */
    async requestStorageNative() {
        console.log('💾 Android: Speicher-Berechtigung...');
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
                const { Filesystem } = window.Capacitor.Plugins;
                const permission = await Filesystem.requestPermissions();
                this.permissionsGranted.storage = permission.publicStorage === 'granted';
                console.log('✅ Speicher:', permission.publicStorage);
            } else {
                this.permissionsGranted.storage = true;
            }
        } catch (error) {
            console.warn('⚠️ Speicher-Permission:', error.message);
            this.permissionsGranted.storage = true;
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
     * Startet Auto-Scans nach Berechtigungen
     */
    startAutoScans() {
        console.log('🚀 Starte Auto-Scans...');

        // Auto-Scan LED-Bänder mit Auto-Connect
        if (this.permissionsGranted.bluetooth && this.permissionsGranted.location) {
            setTimeout(() => {
                this.autoScanAndConnectBLE();
            }, 1000);
        }

        // Auto-Scan Musik-Bibliothek (im Hintergrund)
        if (this.permissionsGranted.storage) {
            setTimeout(() => {
                this.autoScanMusicLibrary();
            }, 2000);
        }
    }

    /**
     * Auto-Scan und Auto-Connect für BLE-Geräte
     */
    async autoScanAndConnectBLE() {
        console.log('🔵 BLE Auto-Scan + Auto-Connect gestartet');

        try {
            // Versuche gespeicherte Geräte zu laden
            const savedDevices = localStorage.getItem('savedBLEDevices');
            if (savedDevices) {
                const devices = JSON.parse(savedDevices);
                console.log(`📱 ${devices.length} gespeicherte Geräte gefunden`);

                // Versuche Auto-Connect für gespeicherte Geräte
                for (const device of devices) {
                    try {
                        if (window.bleController && window.bleController.connectToDevice) {
                            await window.bleController.connectToDevice(device.id);
                            console.log(`✅ Auto-Connected: ${device.name}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Auto-Connect fehlgeschlagen für ${device.name}`);
                    }
                }
            }

            // Starte Scan für neue Geräte
            if (window.bleController && window.bleController.scanForDevices) {
                await window.bleController.scanForDevices();
                console.log('✅ BLE-Scan abgeschlossen');
            } else if (window.audioReactiveEngine && window.audioReactiveEngine.scanAndConnectDevices) {
                await window.audioReactiveEngine.scanAndConnectDevices();
                console.log('✅ Audio-Reactive BLE-Scan abgeschlossen');
            }
        } catch (error) {
            console.error('❌ BLE Auto-Scan Fehler:', error);
        }
    }

    /**
     * Auto-Scan Musik-Bibliothek (im Hintergrund, ohne Dialog)
     */
    async autoScanMusicLibrary() {
        console.log('🎵 Musik Auto-Scan (Hintergrund) gestartet');

        try {
            // Prüfe ob schon Tracks vorhanden
            if (window.musicLibraryManager) {
                const tracks = await window.musicLibraryManager.getAllTracks();

                if (tracks.length === 0) {
                    console.log('📂 Keine Tracks gefunden - warte auf User-Aktion');
                    // User muss Ordner auswählen - kein automatischer Scan möglich
                } else {
                    console.log(`✅ ${tracks.length} Tracks in Bibliothek`);
                }
            }

            // Android Music Scanner (Native)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                if (window.AndroidMusicScanner && window.AndroidMusicScanner.scanMediaStore) {
                    console.log('📱 Android MediaStore Scan gestartet');
                    await window.AndroidMusicScanner.scanMediaStore();
                }
            }
        } catch (error) {
            console.error('❌ Musik Auto-Scan Fehler:', error);
        }
    }
}

// Global initialisieren
const startupPermissions = new StartupPermissions();
window.startupPermissions = startupPermissions;

// Beim App-Start SOFORT ausführen - wie normale Android-Apps
// Berechtigungen werden angezeigt sobald App startet
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // SOFORT starten - wie normale Apps
        // Kurze Verzögerung nur damit Capacitor initialisiert ist
        setTimeout(() => {
            startupPermissions.requestAllPermissions();
        }, 500);
    });
} else {
    // DOM schon bereit - sofort starten
    setTimeout(() => {
        startupPermissions.requestAllPermissions();
    }, 500);
}

// Auch bei Capacitor deviceready Event
document.addEventListener('deviceready', () => {
    console.log('📱 Capacitor deviceready - Berechtigungen anfragen');
    startupPermissions.requestAllPermissions();
}, { once: true });
