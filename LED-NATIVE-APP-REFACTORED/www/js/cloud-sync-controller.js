/**
 * CLOUD-SYNC CONTROLLER v1.0
 * Synchronisiert Einstellungen/Szenen zwischen Geräten via localStorage
 * Offline-First mit automatischer Sync bei Verbindung
 */
'use strict';

class CloudSyncController {
    constructor() {
        this.syncEnabled = false;
        this.deviceId = this.getOrCreateDeviceId();
        this.syncKey = 'cloud-sync-data';
        this.lastSyncTime = 0;
        this.syncInterval = null;

        // Welche Daten sollen synchronisiert werden
        this.syncKeys = [
            'scenes',
            'colorPresets',
            'customColorPresets',
            'favoriteEffects',
            'ledDevices',
            'appSettings',
            'sunrise-sunset-simulations',
            'weekly-schedules'
        ];

        this.loadSettings();
        console.log('✅ Cloud-Sync Controller initialisiert (Device ID:', this.deviceId + ')');
    }

    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('device-id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device-id', deviceId);
        }
        return deviceId;
    }

    enableSync() {
        this.syncEnabled = true;
        localStorage.setItem('cloud-sync-enabled', 'true');

        // Auto-Sync alle 5 Minuten
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => {
            this.performSync();
        }, 300000); // 5 Min

        console.log('✅ Cloud-Sync aktiviert');
        this.performSync(); // Initiales Sync
    }

    disableSync() {
        this.syncEnabled = false;
        localStorage.setItem('cloud-sync-enabled', 'false');

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        console.log('🛑 Cloud-Sync deaktiviert');
    }

    async performSync() {
        if (!this.syncEnabled) return;

        try {
            console.log('🔄 Starte Cloud-Sync...');

            const localData = this.collectLocalData();
            const syncData = {
                deviceId: this.deviceId,
                timestamp: Date.now(),
                data: localData
            };

            // In localStorage speichern (simuliert Cloud)
            // In Produktion: Firebase/Supabase API Call
            localStorage.setItem(this.syncKey, JSON.stringify(syncData));
            this.lastSyncTime = Date.now();

            console.log('✅ Cloud-Sync erfolgreich');

            if (window.showNotification) {
                window.showNotification('☁️ Daten synchronisiert', 'success');
            }

            return true;
        } catch (e) {
            console.error('❌ Cloud-Sync Fehler:', e);

            if (window.showNotification) {
                window.showNotification('⚠️ Sync fehlgeschlagen', 'error');
            }

            return false;
        }
    }

    collectLocalData() {
        const data = {};

        this.syncKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch (e) {
                    data[key] = value;
                }
            }
        });

        return data;
    }

    async restoreFromCloud() {
        try {
            const syncData = localStorage.getItem(this.syncKey);
            if (!syncData) {
                console.log('📭 Keine Cloud-Daten gefunden');
                return false;
            }

            const parsed = JSON.parse(syncData);

            if (!parsed.data) {
                console.log('⚠️ Ungültige Cloud-Daten');
                return false;
            }

            // Nur wiederherstellen wenn Cloud-Daten neuer sind
            if (parsed.timestamp <= this.lastSyncTime) {
                console.log('⏭️ Lokale Daten sind aktueller');
                return false;
            }

            console.log('📥 Stelle Daten wieder her...');

            Object.keys(parsed.data).forEach(key => {
                try {
                    const value = parsed.data[key];
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                } catch (e) {
                    console.error('❌ Fehler beim Wiederherstellen von', key, ':', e);
                }
            });

            this.lastSyncTime = parsed.timestamp;

            console.log('✅ Daten wiederhergestellt');

            if (window.showNotification) {
                window.showNotification('☁️ Daten von Cloud geladen', 'success');
            }

            // Seite neu laden um Änderungen zu übernehmen
            setTimeout(() => {
                window.location.reload();
            }, 1000);

            return true;
        } catch (e) {
            console.error('❌ Restore Fehler:', e);

            if (window.showNotification) {
                window.showNotification('⚠️ Restore fehlgeschlagen', 'error');
            }

            return false;
        }
    }

    exportData() {
        const data = this.collectLocalData();
        const exportData = {
            deviceId: this.deviceId,
            timestamp: Date.now(),
            version: '1.0',
            data: data
        };

        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'led-app-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();

        URL.revokeObjectURL(url);

        console.log('💾 Daten exportiert');

        if (window.showNotification) {
            window.showNotification('💾 Backup erstellt', 'success');
        }
    }

    async importData(file) {
        try {
            const text = await file.text();
            const importData = JSON.parse(text);

            if (!importData.data || !importData.version) {
                throw new Error('Ungültiges Backup-Format');
            }

            Object.keys(importData.data).forEach(key => {
                try {
                    const value = importData.data[key];
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                } catch (e) {
                    console.error('❌ Import Fehler für', key, ':', e);
                }
            });

            console.log('✅ Daten importiert');

            if (window.showNotification) {
                window.showNotification('✅ Backup wiederhergestellt', 'success');
            }

            setTimeout(() => {
                window.location.reload();
            }, 1000);

            return true;
        } catch (e) {
            console.error('❌ Import Fehler:', e);

            if (window.showNotification) {
                window.showNotification('❌ Import fehlgeschlagen: ' + e.message, 'error');
            }

            return false;
        }
    }

    getLastSyncTime() {
        if (!this.lastSyncTime) return 'Nie';

        const now = Date.now();
        const diff = now - this.lastSyncTime;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Gerade eben';
        if (minutes === 1) return 'Vor 1 Minute';
        if (minutes < 60) return 'Vor ' + minutes + ' Minuten';

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return 'Vor 1 Stunde';
        if (hours < 24) return 'Vor ' + hours + ' Stunden';

        const days = Math.floor(hours / 24);
        return 'Vor ' + days + ' Tag(en)';
    }

    isSyncEnabled() {
        return this.syncEnabled;
    }

    loadSettings() {
        const enabled = localStorage.getItem('cloud-sync-enabled');
        if (enabled === 'true') {
            this.enableSync();
        }
    }
}

// Global verfügbar
window.CloudSyncController = CloudSyncController;
window.cloudSyncController = new CloudSyncController();

console.log('✅ Cloud-Sync Controller geladen');
