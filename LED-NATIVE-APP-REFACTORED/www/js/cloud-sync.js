/**
 * CLOUD SYNC SYSTEM v1.0
 * Synchronisierung von Einstellungen, Playlists & Custom-Namen
 */
'use strict';

class CloudSync {
    constructor() {
        this.syncEnabled = false;
        this.lastSync = null;
        this.syncInterval = null;
        this.pendingChanges = new Set();
        this.init();
    }

    init() {
        this.loadSyncSettings();
        this.setupAutoSync();
        this.setupChangeTracking();
        console.log('✅ Cloud Sync System initialisiert');
    }

    loadSyncSettings() {
        const settings = localStorage.getItem('cloudSyncSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.syncEnabled = parsed.enabled || false;
            this.lastSync = parsed.lastSync || null;
        }
    }

    saveSyncSettings() {
        localStorage.setItem('cloudSyncSettings', JSON.stringify({
            enabled: this.syncEnabled,
            lastSync: this.lastSync
        }));
    }

    /**
     * ENABLE/DISABLE SYNC
     */
    enableSync() {
        this.syncEnabled = true;
        this.saveSyncSettings();
        this.startAutoSync();
        console.log('☁️ Cloud Sync aktiviert');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('☁️ Cloud Sync aktiviert', 'success');
        }
    }

    disableSync() {
        this.syncEnabled = false;
        this.saveSyncSettings();
        this.stopAutoSync();
        console.log('⛔ Cloud Sync deaktiviert');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('⛔ Cloud Sync deaktiviert', 'info');
        }
    }

    /**
     * AUTO SYNC
     */
    setupAutoSync() {
        if (this.syncEnabled) {
            this.startAutoSync();
        }
    }

    startAutoSync() {
        if (this.syncInterval) return;

        // Sync alle 5 Minuten
        this.syncInterval = setInterval(() => {
            if (this.pendingChanges.size > 0) {
                this.syncNow();
            }
        }, 300000); // 5 Min

        console.log('⏱️ Auto-Sync gestartet (5 Min Intervall)');
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏱️ Auto-Sync gestoppt');
        }
    }

    /**
     * CHANGE TRACKING
     */
    setupChangeTracking() {
        // Track LocalStorage Changes
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);

            // Track syncable items
            if (this.isSyncableKey(key)) {
                this.pendingChanges.add(key);
            }
        };

        // Track on window unload
        window.addEventListener('beforeunload', () => {
            if (this.pendingChanges.size > 0 && this.syncEnabled) {
                this.syncNow();
            }
        });
    }

    isSyncableKey(key) {
        const syncableKeys = [
            'playlists',
            'favorites',
            'ledCustomNames',
            'deviceSettings',
            'effectSettings',
            'colorPresets',
            'musicAlarms',
            'userPreferences'
        ];

        return syncableKeys.some(k => key.includes(k));
    }

    /**
     * SYNC NOW
     */
    async syncNow() {
        if (!this.syncEnabled) {
            console.warn('⚠️ Sync deaktiviert');
            return;
        }

        console.log('🔄 Starte Cloud Sync...');

        try {
            const data = this.collectSyncData();

            // Simulate cloud upload (replace with actual cloud API)
            await this.uploadToCloud(data);

            this.lastSync = Date.now();
            this.saveSyncSettings();
            this.pendingChanges.clear();

            console.log('✅ Cloud Sync erfolgreich');

            if (window.showGlobalNotification) {
                window.showGlobalNotification('✅ Daten synchronisiert', 'success');
            }

        } catch (error) {
            console.error('❌ Cloud Sync fehlgeschlagen:', error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, 'Cloud Sync');
            }
        }
    }

    collectSyncData() {
        const data = {
            timestamp: Date.now(),
            version: '1.0',
            data: {}
        };

        // Playlists
        const playlists = localStorage.getItem('playlists');
        if (playlists) {
            data.data.playlists = JSON.parse(playlists);
        }

        // Favorites
        const favorites = localStorage.getItem('favorites');
        if (favorites) {
            data.data.favorites = JSON.parse(favorites);
        }

        // LED Custom Names
        const ledNames = localStorage.getItem('ledCustomNames');
        if (ledNames) {
            data.data.ledCustomNames = JSON.parse(ledNames);
        }

        // Device Settings
        const deviceSettings = localStorage.getItem('deviceSettings');
        if (deviceSettings) {
            data.data.deviceSettings = JSON.parse(deviceSettings);
        }

        // Effect Settings
        const effectSettings = localStorage.getItem('effectSettings');
        if (effectSettings) {
            data.data.effectSettings = JSON.parse(effectSettings);
        }

        // Color Presets
        const colorPresets = localStorage.getItem('colorPresets');
        if (colorPresets) {
            data.data.colorPresets = JSON.parse(colorPresets);
        }

        // Music Alarms
        const musicAlarms = localStorage.getItem('musicAlarms');
        if (musicAlarms) {
            data.data.musicAlarms = JSON.parse(musicAlarms);
        }

        // User Preferences
        const userPrefs = localStorage.getItem('userPreferences');
        if (userPrefs) {
            data.data.userPreferences = JSON.parse(userPrefs);
        }

        return data;
    }

    async uploadToCloud(data) {
        // Simulate cloud API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Store in localStorage as backup
                localStorage.setItem('cloudBackup', JSON.stringify(data));

                // In real implementation, this would be:
                // fetch('https://api.yourcloud.com/sync', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(data)
                // })

                resolve({ success: true });
            }, 500);
        });
    }

    /**
     * RESTORE FROM CLOUD
     */
    async restoreFromCloud() {
        if (!this.syncEnabled) {
            console.warn('⚠️ Sync deaktiviert');
            return;
        }

        console.log('📥 Stelle Daten von Cloud wieder her...');

        try {
            const data = await this.downloadFromCloud();

            if (!data || !data.data) {
                throw new Error('Keine Cloud-Daten gefunden');
            }

            this.applyCloudData(data.data);

            console.log('✅ Wiederherstellung erfolgreich');

            if (window.showGlobalNotification) {
                window.showGlobalNotification('✅ Daten wiederhergestellt', 'success');
            }

            // Reload page to apply changes
            setTimeout(() => {
                location.reload();
            }, 1000);

        } catch (error) {
            console.error('❌ Wiederherstellung fehlgeschlagen:', error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, 'Cloud Restore');
            }
        }
    }

    async downloadFromCloud() {
        // Simulate cloud API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const backup = localStorage.getItem('cloudBackup');

                if (backup) {
                    resolve(JSON.parse(backup));
                } else {
                    reject(new Error('Kein Cloud-Backup gefunden'));
                }

                // In real implementation:
                // fetch('https://api.yourcloud.com/sync/latest')
                //     .then(res => res.json())
                //     .then(resolve)
                //     .catch(reject);
            }, 500);
        });
    }

    applyCloudData(data) {
        // Restore all data
        Object.keys(data).forEach(key => {
            if (data[key]) {
                localStorage.setItem(key, JSON.stringify(data[key]));
            }
        });

        console.log('✅ Cloud-Daten angewendet');
    }

    /**
     * MANUAL BACKUP/RESTORE
     */
    exportBackup() {
        const data = this.collectSyncData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `led-app-backup-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('💾 Backup exportiert');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('💾 Backup exportiert', 'success');
        }
    }

    async importBackup(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data.data) {
                throw new Error('Ungültiges Backup-Format');
            }

            this.applyCloudData(data.data);

            console.log('✅ Backup importiert');

            if (window.showGlobalNotification) {
                window.showGlobalNotification('✅ Backup importiert', 'success');
            }

            setTimeout(() => {
                location.reload();
            }, 1000);

        } catch (error) {
            console.error('❌ Import fehlgeschlagen:', error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, 'Backup Import');
            }
        }
    }

    /**
     * GET SYNC STATUS
     */
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            lastSync: this.lastSync,
            lastSyncFormatted: this.lastSync ? new Date(this.lastSync).toLocaleString() : 'Nie',
            pendingChanges: this.pendingChanges.size,
            autoSyncActive: !!this.syncInterval
        };
    }

    /**
     * SHOW SYNC UI
     */
    showSyncDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'sync-dialog modal-enter';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 10001;
            min-width: 350px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;

        const status = this.getSyncStatus();

        dialog.innerHTML = `
            <h2 style="color: #FFD700; margin: 0 0 20px 0; font-size: 20px;">☁️ Cloud Sync</h2>
            
            <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <div style="margin-bottom: 10px;">
                    <strong style="color: #FFD700;">Status:</strong>
                    <span style="color: ${status.enabled ? '#0f0' : '#f00'};">
                        ${status.enabled ? '✅ Aktiviert' : '❌ Deaktiviert'}
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong style="color: #FFD700;">Letzter Sync:</strong>
                    <span style="color: white;">${status.lastSyncFormatted}</span>
                </div>
                <div>
                    <strong style="color: #FFD700;">Ausstehend:</strong>
                    <span style="color: white;">${status.pendingChanges} Änderungen</span>
                </div>
            </div>

            <div style="display: grid; gap: 10px;">
                <button id="toggleSync" style="
                    padding: 12px;
                    background: ${status.enabled ? '#ff4757' : '#2ecc71'};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ${status.enabled ? '⛔ Sync Deaktivieren' : '☁️ Sync Aktivieren'}
                </button>

                <button id="syncNow" style="
                    padding: 12px;
                    background: #3498db;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                " ${!status.enabled ? 'disabled' : ''}>
                    🔄 Jetzt Synchronisieren
                </button>

                <button id="restoreCloud" style="
                    padding: 12px;
                    background: #9b59b6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                " ${!status.enabled ? 'disabled' : ''}>
                    📥 Von Cloud Wiederherstellen
                </button>

                <div style="border-top: 1px solid rgba(255, 215, 0, 0.2); margin: 10px 0;"></div>

                <button id="exportBackup" style="
                    padding: 12px;
                    background: #f39c12;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    💾 Backup Exportieren
                </button>

                <button id="importBackup" style="
                    padding: 12px;
                    background: #e67e22;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                ">
                    📂 Backup Importieren
                </button>

                <button id="closeDialog" style="
                    padding: 10px;
                    margin-top: 10px;
                    background: transparent;
                    color: #888;
                    border: 2px solid #888;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    ✕ Schließen
                </button>
            </div>
        `;

        // Event Listeners
        dialog.querySelector('#toggleSync').addEventListener('click', () => {
            if (this.syncEnabled) {
                this.disableSync();
            } else {
                this.enableSync();
            }
            dialog.remove();
            this.showSyncDialog(); // Refresh
        });

        dialog.querySelector('#syncNow').addEventListener('click', async () => {
            await this.syncNow();
        });

        dialog.querySelector('#restoreCloud').addEventListener('click', async () => {
            if (confirm('Alle lokalen Daten werden überschrieben. Fortfahren?')) {
                await this.restoreFromCloud();
            }
        });

        dialog.querySelector('#exportBackup').addEventListener('click', () => {
            this.exportBackup();
        });

        dialog.querySelector('#importBackup').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importBackup(file);
                }
            };
            input.click();
        });

        dialog.querySelector('#closeDialog').addEventListener('click', () => {
            dialog.remove();
        });

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
        `;
        backdrop.addEventListener('click', () => {
            dialog.remove();
            backdrop.remove();
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
    }
}

// Initialize global cloud sync
window.cloudSync = new CloudSync();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CloudSync;
}

console.log('✅ Cloud Sync geladen');
console.log('☁️ Nutze: cloudSync.showSyncDialog()');
