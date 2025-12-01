/**
 * AUTO-START-MANAGER.JS - ZERO TOLERANCE
 * Startet automatisch beim App-Start:
 * - Berechtigungen nacheinander
 * - BLE Auto-Scan + Auto-Connect
 * - Musik-Bibliothek Scan
 */
'use strict';

class AutoStartManager {
    constructor() {
        this.initialized = false;
        this.introSkipped = false;
        this.init();
    }

    async init() {
        console.log('🚀 Auto-Start Manager initialisiert');

        // Warte bis App bereit ist
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        console.log('▶️ Auto-Start Sequenz gestartet');

        try {
            // 1. Prüfe ob Intro übersprungen werden soll
            await this.handleIntro();

            // 2. Starte Berechtigungsanfragen
            await this.requestPermissions();

            // 3. Starte Auto-Scans
            await this.startAutoScans();

            // 4. Initialisiere UI
            await this.initializeUI();

            this.initialized = true;
            console.log('✅ Auto-Start Sequenz abgeschlossen');
        } catch (error) {
            console.error('❌ Auto-Start Fehler:', error);
        }
    }

    async handleIntro() {
        // Überspringe Intro wenn schon einmal gestartet
        const hasSeenIntro = localStorage.getItem('hasSeenIntro');
        if (hasSeenIntro === 'true') {
            this.introSkipped = true;
            console.log('⏭️ Intro übersprungen');
        } else {
            localStorage.setItem('hasSeenIntro', 'true');
        }
    }

    async requestPermissions() {
        if (window.startupPermissions && window.startupPermissions.requestAllPermissions) {
            console.log('🔐 Starte Berechtigungsanfragen...');
            const permissions = await window.startupPermissions.requestAllPermissions();
            console.log('✅ Berechtigungen erhalten:', permissions);
            return permissions;
        } else {
            console.warn('⚠️ StartupPermissions nicht verfügbar');
            return null;
        }
    }

    async startAutoScans() {
        console.log('🔍 Starte Auto-Scans...');

        // BLE Auto-Scan + Auto-Connect
        setTimeout(() => {
            this.autoConnectBLE();
        }, 500);

        // Musik-Bibliothek Auto-Scan
        setTimeout(() => {
            this.autoScanMusic();
        }, 1500);
    }

    async autoConnectBLE() {
        console.log('🔵 BLE Auto-Connect...');

        try {
            // Lade gespeicherte Geräte
            const savedDevices = localStorage.getItem('savedBLEDevices');
            if (savedDevices) {
                const devices = JSON.parse(savedDevices);
                console.log(`📱 ${devices.length} gespeicherte BLE-Geräte`);

                // Auto-Connect zu jedem gespeicherten Gerät
                const bleCtrl = window.bleController || (window.parent && window.parent.bleController) || (window.top && window.top.bleController);
                for (const device of devices) {
                    try {
                        if (bleCtrl) {
                            await bleCtrl.connect(device.id);
                            console.log(`✅ Verbunden: ${device.name || device.id}`);
                        }
                    } catch (error) {
                        console.log(`⚠️ Verbindung fehlgeschlagen: ${device.name || device.id}`);
                    }
                }
            }

            // Starte Scan für neue Geräte (im Hintergrund)
            const bleCtrl = window.bleController || (window.parent && window.parent.bleController) || (window.top && window.top.bleController);
            if (bleCtrl && bleCtrl.scan) {
                console.log('🔍 BLE-Scan im Hintergrund...');
                await bleCtrl.scan({ timeout: 5000 });
            }
        } catch (error) {
            console.error('❌ BLE Auto-Connect Fehler:', error);
        }
    }

    async autoScanMusic() {
        console.log('🎵 Musik Auto-Scan...');

        try {
            if (window.musicLibraryManager) {
                const tracks = await window.musicLibraryManager.getAllTracks();

                if (tracks && tracks.length > 0) {
                    console.log(`✅ ${tracks.length} Tracks in Bibliothek`);
                } else {
                    console.log('📂 Keine Tracks - warte auf User-Aktion');
                }
            }

            // Android MediaStore Scan (Native)
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                if (window.AndroidMusicScanner) {
                    console.log('📱 Android MediaStore Scan...');
                    const result = await window.AndroidMusicScanner.scanMediaStore();
                    console.log(`✅ ${result.count || 0} Tracks gefunden`);
                }
            }
        } catch (error) {
            console.error('❌ Musik Auto-Scan Fehler:', error);
        }
    }

    async initializeUI() {
        console.log('🎨 Initialisiere UI...');

        // Verstecke "Szene erstellt/geladen" Benachrichtigungen beim Start
        const hideStartupNotifications = () => {
            const notifications = document.querySelectorAll('.notification, .toast');
            notifications.forEach(notif => {
                if (notif.textContent.includes('Szene') ||
                    notif.textContent.includes('erstellt') ||
                    notif.textContent.includes('geladen')) {
                    notif.style.display = 'none';
                }
            });
        };

        setTimeout(hideStartupNotifications, 100);
        setTimeout(hideStartupNotifications, 500);
        setTimeout(hideStartupNotifications, 1000);

        console.log('✅ UI initialisiert');
    }
}

// Global verfügbar machen
window.AutoStartManager = AutoStartManager;
window.autoStartManager = new AutoStartManager();

console.log('✅ Auto-Start Manager geladen');
