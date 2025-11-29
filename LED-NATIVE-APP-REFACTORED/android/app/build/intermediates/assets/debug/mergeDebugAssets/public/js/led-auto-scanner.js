/**
 * LED AUTO SCANNER - Automatisches Scannen und Verbinden von LED-Bändern beim App-Start
 */
'use strict';

const LEDAutoScanner = {
    foundDevices: [],
    connectedDevices: [],
    isScanning: false,

    async startAutoScan() {
        console.log('🔍 Starte automatischen LED-Bänder Scan...');

        if (this.isScanning) {
            console.log('⚠️ Scan bereits aktiv');
            return;
        }

        this.isScanning = true;

        try {
            // Prüfe gespeicherte Geräte
            const savedDevices = this.loadSavedDevices();

            if (savedDevices && savedDevices.length > 0) {
                console.log(`📱 ${savedDevices.length} gespeicherte Geräte gefunden`);
                await this.connectSavedDevices(savedDevices);
            }

            // Scanne nach neuen Geräten
            await this.scanForNewDevices();

            // Aktualisiere UI
            this.updateLEDCount();

            console.log(`✅ Scan abgeschlossen: ${this.connectedDevices.length} Geräte verbunden`);
        } catch (error) {
            console.error('❌ Auto-Scan Fehler:', error);
        } finally {
            this.isScanning = false;
        }
    },

    async connectSavedDevices(savedDevices) {
        console.log('🔗 Verbinde gespeicherte Geräte...');

        for (const device of savedDevices) {
            try {
                if (window.BLEController) {
                    const ble = new window.BLEController();
                    const connected = await ble.connect(device.id);

                    if (connected) {
                        this.connectedDevices.push({
                            id: device.id,
                            name: device.name,
                            controller: ble
                        });
                        console.log(`✅ Verbunden: ${device.name}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Konnte nicht verbinden: ${device.name}`, error);
            }
        }
    },

    async scanForNewDevices() {
        console.log('🔍 Scanne nach neuen Geräten...');

        try {
            if (!navigator.bluetooth) {
                console.warn('⚠️ Web Bluetooth API nicht verfügbar');
                return;
            }

            // Hinweis: Bluetooth-Scan erfordert User-Interaktion
            // Automatischer Scan im Hintergrund ist nicht möglich
            // Verwende gespeicherte Geräte für Auto-Connect

            console.log('ℹ️ Automatischer Scan erfordert Benutzer-Interaktion');
        } catch (error) {
            console.error('❌ Scan-Fehler:', error);
        }
    },

    loadSavedDevices() {
        try {
            const saved = localStorage.getItem('led-devices');
            if (saved) {
                const devices = JSON.parse(saved);
                console.log(`💾 ${devices.length} gespeicherte Geräte geladen`);
                return devices;
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden gespeicherter Geräte:', error);
        }
        return [];
    },

    saveDevice(device) {
        try {
            const saved = this.loadSavedDevices();

            // Prüfe ob Gerät bereits gespeichert
            const exists = saved.find(d => d.id === device.id);
            if (!exists) {
                saved.push({
                    id: device.id,
                    name: device.name,
                    savedAt: Date.now()
                });
                localStorage.setItem('led-devices', JSON.stringify(saved));
                console.log(`💾 Gerät gespeichert: ${device.name}`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
        }
    },

    updateLEDCount() {
        // Aktualisiere Anzeige der gefundenen LED-Bänder
        const countElement = document.getElementById('ledBandCountDisplay');
        if (countElement) {
            countElement.textContent = this.connectedDevices.length;
        }

        const connectedElement = document.getElementById('ledConnectedStrips');
        if (connectedElement) {
            connectedElement.textContent = this.connectedDevices.length;
        }

        // Aktualisiere LED-Bänder-Konfiguration Text
        const ledConfigLabel = document.getElementById('ledConfigLabel');
        if (ledConfigLabel) {
            ledConfigLabel.innerHTML = `<i class="fas fa-wifi"></i> Gefundene LED-Bänder: <strong>${this.connectedDevices.length}</strong>`;
        }

        // Verstecke/Zeige Slider basierend auf Anzahl
        const ledBandSlider = document.getElementById('ledBandCount');
        if (ledBandSlider && this.connectedDevices.length > 0) {
            ledBandSlider.max = this.connectedDevices.length;
            ledBandSlider.value = this.connectedDevices.length;
            ledBandSlider.disabled = true; // Automatisch gesetzt, nicht manuell änderbar
        }

        // Zeige Geräte-Liste an
        this.displayConnectedDevices();

        console.log(`📊 LED-Count aktualisiert: ${this.connectedDevices.length}`);
    },

    displayConnectedDevices() {
        const deviceListContainer = document.getElementById('ledDeviceList');
        if (!deviceListContainer) return;

        if (this.connectedDevices.length === 0) {
            deviceListContainer.innerHTML = '<div style="color:#888; padding:10px;">Keine Geräte verbunden</div>';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
        this.connectedDevices.forEach((device, index) => {
            html += `
                <div style="background:#1a1a1a; padding:12px; border-radius:8px; border:1px solid #2a2a2a;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:8px; height:8px; border-radius:50%; background:#28a745;"></div>
                        <div style="flex:1;">
                            <div style="font-weight:500; color:#fff;">${device.name || 'LED Band ' + (index + 1)}</div>
                            <div style="font-size:0.8em; color:#888;">${device.id || 'ID unbekannt'}</div>
                        </div>
                        <div style="color:#4ecdc4; font-size:0.9em;">Band ${index + 1}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        deviceListContainer.innerHTML = html;
    },

    getConnectedCount() {
        return this.connectedDevices.length;
    },

    getConnectedDevices() {
        return this.connectedDevices;
    }
};

window.LEDAutoScanner = LEDAutoScanner;
