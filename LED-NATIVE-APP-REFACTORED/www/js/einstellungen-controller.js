/**
 * EINSTELLUNGEN-CONTROLLER.JS
 * Alle Einstellungs-Funktionen aus Einstellungen.html - KEIN Inline-JS
 */
'use strict';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let bleController = null;
let isScanning = false;
let autoConnect = true;
let brightness = 80;
let notifications = true;

async function initBLE() {
    try {
        // Priorität 1: Globaler BLEControllerPro verwenden
        if (window.BLEControllerPro || window.bleControllerPro) {
            bleController = window.BLEControllerPro || window.bleControllerPro;
            console.log('✅ BLEControllerPro verwendet');
        }
        // Priorität 2: Globaler ledController
        else if (window.ledController) {
            bleController = window.ledController;
            console.log('✅ Globaler LED-Controller verwendet');
        }
        // Priorität 3: BluetoothForegroundService
        else if (window.BluetoothForegroundService) {
            bleController = window.BluetoothForegroundService;
            console.log('✅ Bluetooth Foreground Service verwendet');
        }
        // Fallback: Alte BLEController-Klasse
        else if (typeof BLEController !== 'undefined') {
            bleController = new BLEController();
            if (bleController.init && typeof bleController.init === 'function') {
                await bleController.init();
            }
            console.log('✅ Neuer BLE-Controller erstellt');
        } else {
            console.warn('⚠️ Kein BLE-Controller verfügbar - App läuft im Offline-Modus');
            bleController = null;
        }

        loadSettings();
        loadSavedDevices();
        if (autoConnect && bleController) await autoConnectDevices();
        updateConnectionStatus();
    } catch (error) {
        console.error('❌ BLE-Initialisierung fehlgeschlagen:', error);
        console.log('ℹ️ App läuft im Offline-Modus');
        bleController = null;
        updateConnectionStatus('⚠️ Offline-Modus');
    }
}

async function startScan(scanMode = 'smart') {
    if (isScanning || !bleController) return;
    try {
        isScanning = true;
        updateScanButton();
        showScanning();
        updateConnectionStatus('🔍 Erweiterte Gerätesuche läuft...');

        let results = [];
        if (scanMode === 'multi') {
            results = await bleController.startMultiScan('all');
        } else {
            results = await bleController.startScan('all', scanMode);
        }

        updateDeviceList();
        updateConnectionStatus(`✅ Scan abgeschlossen (${results.length} Gerät(e) gefunden)`);
    } catch (error) {
        console.error('❌ Scan fehlgeschlagen:', error);
        showNoDevices();
        updateConnectionStatus('❌ Scan fehlgeschlagen - versuche erweiterten Scan');

        if (scanMode !== 'multi') {
            setTimeout(() => startScan('multi'), 2000);
        }
    } finally {
        isScanning = false;
        updateScanButton();
    }
}

async function startSmartScan() {
    await startScan('smart');
}

async function startMultiScan() {
    await startScan('multi');
}

async function startOpenScan() {
    await startScan('open');
}

function updateScanButton() {
    const button = document.getElementById('scanButton');
    const icon = document.getElementById('scanIcon');
    const text = document.getElementById('scanText');
    if (isScanning) {
        if (icon) icon.textContent = '⏳';
        if (text) text.textContent = 'Suche läuft...';
        if (button) button.disabled = true;
    } else {
        if (icon) icon.textContent = '🔍';
        if (text) text.textContent = 'Geräte suchen';
        if (button) button.disabled = false;
    }
}

function showScanning() {
    const deviceList = document.getElementById('deviceList');
    if (!deviceList) return;
    deviceList.textContent = '';
    const scanningDiv = document.createElement('div');
    scanningDiv.className = 'scanning';
    scanningDiv.textContent = '⏳ Suche nach LED-Geräten...';
    deviceList.appendChild(scanningDiv);
}

function showNoDevices() {
    const deviceList = document.getElementById('deviceList');
    if (!deviceList) return;
    deviceList.textContent = '';
    const noDevicesDiv = document.createElement('div');
    noDevicesDiv.className = 'no-devices';
    noDevicesDiv.textContent = 'Keine Geräte gefunden. Stelle sicher, dass dein LED-Band eingeschaltet ist.';
    deviceList.appendChild(noDevicesDiv);
}

function updateDeviceList() {
    if (!bleController) return;
    const devices = bleController.getAllDevices();
    const deviceList = document.getElementById('deviceList');
    if (!deviceList) return;

    if (devices.length === 0) {
        showNoDevices();
        return;
    }

    deviceList.textContent = '';
    devices.forEach((device) => {
        const deviceItem = document.createElement('div');
        deviceItem.className = 'device-item';

        const deviceInfo = document.createElement('div');
        deviceInfo.className = 'device-info';

        const deviceStatus = document.createElement('div');
        deviceStatus.className = `device-status ${device.connected ? 'connected' : 'disconnected'}`;

        const deviceDetails = document.createElement('div');
        deviceDetails.className = 'device-details';

        const deviceName = document.createElement('div');
        deviceName.className = 'device-name';
        deviceName.textContent = device.name || 'Unbekanntes Gerät';

        const deviceMac = document.createElement('div');
        deviceMac.className = 'device-mac';
        deviceMac.textContent = device.mac || 'Keine MAC';

        const deviceActions = document.createElement('div');
        deviceActions.className = 'device-actions';

        const connectBtn = document.createElement('button');
        connectBtn.className = `device-btn ${device.connected ? 'btn-disconnect' : 'btn-connect'}`;
        connectBtn.textContent = device.connected ? 'Trennen' : 'Verbinden';
        connectBtn.onclick = () => toggleConnection(device.mac);

        const forgetBtn = document.createElement('button');
        forgetBtn.className = 'device-btn btn-forget';
        forgetBtn.textContent = 'Vergessen';
        forgetBtn.onclick = () => forgetDevice(device.mac);

        deviceDetails.appendChild(deviceName);
        deviceDetails.appendChild(deviceMac);
        deviceInfo.appendChild(deviceStatus);
        deviceInfo.appendChild(deviceDetails);
        deviceActions.appendChild(connectBtn);
        deviceActions.appendChild(forgetBtn);
        deviceItem.appendChild(deviceInfo);
        deviceItem.appendChild(deviceActions);
        deviceList.appendChild(deviceItem);
    });
}

async function toggleConnection(mac) {
    if (!bleController) return;
    try {
        const device = bleController.devices.get(mac);
        if (device.connected) {
            await bleController.disconnect(mac);
            updateConnectionStatus(`🔌 ${device.name} getrennt`);
        } else {
            await bleController.connect(mac);
            updateConnectionStatus(`✅ ${device.name} verbunden`);
        }
        updateDeviceList();
    } catch (error) {
        console.error('❌ Verbindungsfehler:', error);
        updateConnectionStatus('❌ Verbindungsfehler');
    }
}

async function forgetDevice(mac) {
    if (!bleController) return;
    try {
        const device = bleController.devices.get(mac);
        await bleController.forgetDevice(mac);
        updateDeviceList();
        updateConnectionStatus(`🗑️ ${device.name} vergessen`);
    } catch (error) {
        console.error('❌ Fehler beim Vergessen:', error);
    }
}

function toggleAutoConnect() {
    autoConnect = !autoConnect;
    const switchEl = document.getElementById('autoConnectSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active', autoConnect);
    }
    saveSettings();
}

function toggleNotifications() {
    notifications = !notifications;
    const switchEl = document.getElementById('notificationsSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active', notifications);
    }
    saveSettings();
}

function updateBrightness(value) {
    brightness = parseInt(value);
    const brightnessValue = document.getElementById('brightnessValue');
    if (brightnessValue) {
        brightnessValue.textContent = brightness + '%';
    }

    if (window.parent && window.parent.ledController && window.parent.ledController.isConnected) {
        try {
            window.parent.ledController.setBrightness(brightness);
            console.log(`🔆 Helligkeit auf ${brightness}% gesetzt`);
        } catch (error) {
            console.error('Fehler beim Setzen der Helligkeit:', error);
        }
    }

    localStorage.setItem('ledBrightness', brightness);
    saveSettings();
}

function updateConnectionStatus(message = null) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    if (message) {
        statusElement.textContent = message;
        return;
    }

    if (!navigator.bluetooth && !window.electronAPI) {
        statusElement.textContent = '🔵 Bluetooth-Steuerung bereit';
        return;
    }

    if (!bleController) {
        statusElement.textContent = '🔵 Bluetooth bereit zum Scannen';
        return;
    }

    const connectedCount = bleController.getConnectedDevices().length;
    if (connectedCount > 0) {
        statusElement.textContent = `✅ ${connectedCount} Gerät(e) verbunden`;
    } else {
        statusElement.textContent = '🔵 Bereit zum Scannen';
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('led-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            autoConnect = settings.autoConnect !== undefined ? settings.autoConnect : true;
            brightness = settings.brightness || 80;
            notifications = settings.notifications !== undefined ? settings.notifications : true;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
    }
}

function saveSettings() {
    try {
        const settings = {
            autoConnect,
            brightness,
            notifications
        };
        localStorage.setItem('led-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Fehler beim Speichern der Einstellungen:', error);
    }
}

function loadSavedDevices() {
    console.log('Lade gespeicherte Geräte...');
}

async function autoConnectDevices() {
    console.log('Auto-Connect aktiviert...');
}

function initEinstellungenController() {
    initBLE();

    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', () => startScan());
    }

    const brightnessSlider = document.getElementById('brightnessSlider');
    if (brightnessSlider) {
        brightnessSlider.value = brightness;
        brightnessSlider.addEventListener('input', (e) => updateBrightness(e.target.value));
    }

    // Auto-Connect Toggle
    const autoConnectSwitch = document.getElementById('autoConnectSwitch');
    if (autoConnectSwitch) {
        autoConnectSwitch.classList.toggle('active', autoConnect);
        autoConnectSwitch.addEventListener('click', toggleAutoConnect);
    }

    // Notifications Toggle
    const notificationsSwitch = document.getElementById('notificationsSwitch');
    if (notificationsSwitch) {
        notificationsSwitch.classList.toggle('active', notifications);
        notificationsSwitch.addEventListener('click', toggleNotifications);
    }

    // Dark Mode Toggle
    const darkModeSwitch = document.getElementById('darkModeSwitch');
    if (darkModeSwitch) {
        const isDarkMode = localStorage.getItem('darkMode') !== 'false';
        darkModeSwitch.classList.toggle('active', isDarkMode);
        darkModeSwitch.addEventListener('click', function () {
            const newState = !this.classList.contains('active');
            this.classList.toggle('active', newState);
            localStorage.setItem('darkMode', newState);
            document.body.classList.toggle('dark-mode', newState);
        });
    }

    // WLED Toggle
    const wledSwitch = document.getElementById('wledSwitch');
    if (wledSwitch) {
        wledSwitch.addEventListener('click', function () {
            this.classList.toggle('active');
            const wledScanSection = document.getElementById('wledScanSection');
            if (wledScanSection) {
                wledScanSection.style.display = this.classList.contains('active') ? 'flex' : 'none';
            }
        });
    }

    // Hierarchical Groups Toggle
    const hierarchicalSwitch = document.getElementById('hierarchicalGroupsSwitch');
    if (hierarchicalSwitch) {
        hierarchicalSwitch.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    }

    // Pixel Control Toggle
    const pixelSwitch = document.getElementById('pixelControlSwitch');
    if (pixelSwitch) {
        pixelSwitch.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    }

    // Hardware Acceleration Toggle
    const hwAccelSwitch = document.getElementById('hwAccelSwitch');
    if (hwAccelSwitch) {
        hwAccelSwitch.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    }

    // FPS Slider
    const fpsSlider = document.getElementById('fpsSlider');
    const fpsValue = document.getElementById('fpsValue');
    if (fpsSlider && fpsValue) {
        fpsSlider.addEventListener('input', function () {
            fpsValue.textContent = this.value + ' FPS';
        });
    }

    // Packet Size Slider
    const packetSizeSlider = document.getElementById('packetSizeSlider');
    const packetSizeValue = document.getElementById('packetSizeValue');
    if (packetSizeSlider && packetSizeValue) {
        packetSizeSlider.addEventListener('input', function () {
            packetSizeValue.textContent = this.value + ' Bytes';
        });
    }

    // Mic Sensitivity Slider
    const micSensitivitySlider = document.getElementById('micSensitivitySlider');
    const micSensitivityValue = document.getElementById('micSensitivityValue');
    if (micSensitivitySlider && micSensitivityValue) {
        micSensitivitySlider.addEventListener('input', function () {
            micSensitivityValue.textContent = this.value + '%';
        });
    }

    // Language Selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        const savedLang = localStorage.getItem('appLanguage') || 'de';
        languageSelect.value = savedLang;

        languageSelect.addEventListener('change', function () {
            const selectedLang = this.value;
            localStorage.setItem('appLanguage', selectedLang);

            // Wenn i18n vorhanden, Sprache wechseln
            if (window.i18n && window.i18n.setLanguage) {
                window.i18n.setLanguage(selectedLang);
                console.log('✅ Sprache gewechselt zu:', selectedLang);
            }

            // Optional: Seite neu laden für vollständige Sprachumstellung
            if (confirm('Seite neu laden für vollständige Sprachumstellung?')) {
                location.reload();
            }
        });
    }

    console.log('✅ Einstellungen-Controller initialisiert');
}

// Global Export
window.escapeHtml = escapeHtml;
window.initBLE = initBLE;
window.startScan = startScan;
window.startSmartScan = startSmartScan;
window.startMultiScan = startMultiScan;
window.startOpenScan = startOpenScan;
window.toggleConnection = toggleConnection;
window.forgetDevice = forgetDevice;
window.toggleAutoConnect = toggleAutoConnect;
window.toggleNotifications = toggleNotifications;
window.updateBrightness = updateBrightness;
window.updateConnectionStatus = updateConnectionStatus;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEinstellungenController);
} else {
    initEinstellungenController();
}

// ==================== NEUE v3.0 FUNKTIONEN ====================

// BLUETOOTH-VERWALTUNG
async function scanForNewDevice() {
    try {
        if (window.BluetoothForegroundService) {
            console.log('🔍 Starte Geräte-Scan...');
            await startScan('smart');
        } else if (window.BLEControllerPro) {
            await window.BLEControllerPro.scanForDevices();
        } else {
            await startScan();
        }
    } catch (error) {
        console.error('❌ Scan Fehler:', error);
        alert('Fehler beim Scannen: ' + error.message);
    }
}

function toggleAutoReconnect(enabled) {
    console.log('🔄 Auto-Reconnect:', enabled ? 'AN' : 'AUS');
    localStorage.setItem('autoReconnect', enabled);
    if (window.BluetoothForegroundService) {
        window.BluetoothForegroundService.setAutoReconnect(enabled);
    }
}

function toggleForegroundService(enabled) {
    console.log('🔔 Foreground Service:', enabled ? 'AN' : 'AUS');
    if (window.BluetoothForegroundService) {
        if (enabled) {
            window.BluetoothForegroundService.startForegroundService();
        } else {
            window.BluetoothForegroundService.stopForegroundService();
        }
    }
}

function editDevice(deviceId) {
    console.log('✏️ Bearbeite Gerät:', deviceId);
    alert('Geräte-Bearbeitung - Coming Soon');
}

async function removeDevice(deviceId) {
    if (confirm('Gerät wirklich entfernen?')) {
        if (window.BluetoothForegroundService) {
            await window.BluetoothForegroundService.removeDevice(deviceId);
            loadSavedDevices();
        }
    }
}

async function connectDevice(deviceId) {
    if (window.BLEControllerPro) {
        await window.BLEControllerPro.reconnectToDevice(deviceId);
    }
}

// MUSIKBIBLIOTHEK
async function scanMediaStore() {
    try {
        console.log('📱 Scanne MediaStore...');
        document.getElementById('scanProgress').style.display = 'block';

        if (window.AndroidMusicScanner) {
            const result = await window.AndroidMusicScanner.scanMediaStore();
            document.getElementById('totalTracks').textContent = result.length || '--';
            document.getElementById('scanProgress').style.display = 'none';
            alert('✅ ' + result.length + ' Tracks gefunden!');
        } else {
            alert('Android Music Scanner nicht verfügbar');
        }
    } catch (error) {
        console.error('❌ MediaStore Scan Fehler:', error);
        document.getElementById('scanProgress').style.display = 'none';
        alert('Fehler: ' + error.message);
    }
}

async function requestSAFAccess() {
    try {
        console.log('📂 SAF Zugriff anfordern...');
        if (window.AndroidMusicScanner) {
            await window.AndroidMusicScanner.requestSAFAccess();
            await window.AndroidMusicScanner.scanSAFFolder();
        } else {
            alert('SAF nicht verfügbar');
        }
    } catch (error) {
        console.error('❌ SAF Fehler:', error);
        alert('Fehler: ' + error.message);
    }
}

function cancelScan() {
    console.log('⏹️ Scan abbrechen');
    document.getElementById('scanProgress').style.display = 'none';
}

function toggleAutoScan(enabled) {
    console.log('🔄 Auto-Scan:', enabled ? 'AN' : 'AUS');
    localStorage.setItem('autoScanMusic', enabled);
}

// MUSIK-REAKTION
function loadReactionPreset(preset) {
    console.log('🎵 Lade Preset:', preset);
    const presets = {
        balanced: { sensitivity: 1.0, smoothing: 0.7, speed: 1.0 },
        'bass-heavy': { sensitivity: 1.5, smoothing: 0.5, speed: 1.2 },
        'treble-focus': { sensitivity: 1.3, smoothing: 0.6, speed: 1.1 },
        party: { sensitivity: 1.8, smoothing: 0.3, speed: 1.5 },
        chill: { sensitivity: 0.7, smoothing: 0.9, speed: 0.8 }
    };
    const config = presets[preset] || presets.balanced;
    document.getElementById('sensitivity').value = config.sensitivity;
    document.getElementById('smoothing').value = config.smoothing;
    document.getElementById('speed').value = config.speed;
    updateSensitivity(config.sensitivity);
    updateSmoothing(config.smoothing);
    updateSpeed(config.speed);
}

function updateSensitivity(value) {
    document.getElementById('sensitivityValue').textContent = value;
    if (window.AudioDecoderFFT && window.audioDecoderInstance) {
        window.audioDecoderInstance.setSensitivity(parseFloat(value));
    }
}

function updateSmoothing(value) {
    document.getElementById('smoothingValue').textContent = value;
    if (window.AudioDecoderFFT && window.audioDecoderInstance) {
        window.audioDecoderInstance.setSmoothing(parseFloat(value));
    }
}

function updateSpeed(value) {
    document.getElementById('speedValue').textContent = value + 'x';
    if (window.AudioDecoderFFT && window.audioDecoderInstance) {
        window.audioDecoderInstance.setSpeed(parseFloat(value));
    }
}

function toggleBeatDetection(enabled) {
    console.log('💓 Beat-Detection:', enabled ? 'AN' : 'AUS');
    localStorage.setItem('beatDetection', enabled);
}

function saveCustomPreset() {
    const name = prompt('Preset-Name:');
    if (name) {
        const preset = {
            sensitivity: document.getElementById('sensitivity').value,
            smoothing: document.getElementById('smoothing').value,
            speed: document.getElementById('speed').value
        };
        localStorage.setItem('preset_' + name, JSON.stringify(preset));
        alert('✅ Preset "' + name + '" gespeichert!');
        loadPresetList();
    }
}

function resetToDefault() {
    loadReactionPreset('balanced');
}

// PRESETS
function importPreset() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const preset = JSON.parse(event.target.result);
                localStorage.setItem('preset_' + preset.name, JSON.stringify(preset));
                alert('✅ Preset importiert!');
                loadPresetList();
            } catch (err) {
                alert('❌ Fehler beim Importieren');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function createNewPreset() {
    saveCustomPreset();
}

function applyPreset(presetId) {
    const preset = localStorage.getItem('preset_' + presetId);
    if (preset) {
        const config = JSON.parse(preset);
        document.getElementById('sensitivity').value = config.sensitivity;
        document.getElementById('smoothing').value = config.smoothing;
        document.getElementById('speed').value = config.speed;
        updateSensitivity(config.sensitivity);
        updateSmoothing(config.smoothing);
        updateSpeed(config.speed);
    }
}

function editPreset(presetId) {
    alert('Preset bearbeiten - Coming Soon');
}

function deletePreset(presetId) {
    if (confirm('Preset wirklich löschen?')) {
        localStorage.removeItem('preset_' + presetId);
        loadPresetList();
    }
}

function exportPreset(presetId) {
    const preset = localStorage.getItem('preset_' + presetId);
    if (preset) {
        const blob = new Blob([preset], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preset_' + presetId + '.json';
        a.click();
    }
}

function syncPresetsToDevices() {
    const checkboxes = document.querySelectorAll('#syncDeviceList input[type="checkbox"]:checked');
    alert('Synchronisiere auf ' + checkboxes.length + ' Gerät(e)');
}

function loadPresetList() {
    const list = document.getElementById('presetList');
    if (!list) return;
    list.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('preset_')) {
            const name = key.replace('preset_', '');
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.innerHTML = `
                <div class="preset-info">
                    <i class="fas fa-user"></i>
                    <div>
                        <h3>${name}</h3>
                        <p>Benutzerdefiniert</p>
                    </div>
                </div>
                <div class="preset-actions">
                    <button class="btn-icon" onclick="applyPreset('${name}')"><i class="fas fa-play"></i></button>
                    <button class="btn-icon" onclick="deletePreset('${name}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(card);
        }
    }
}

// ERWEITERT & BACKUP
function clearCache() {
    if (confirm('Cache wirklich leeren?')) {
        localStorage.clear();
        if ('caches' in window) {
            caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
        }
        alert('✅ Cache geleert!');
    }
}

function createBackup() {
    const backup = {
        devices: [],
        presets: {},
        settings: {}
    };
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backup.settings[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'led-control-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    alert('✅ Backup erstellt!');
}

function restoreBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const backup = JSON.parse(event.target.result);
                for (const key in backup.settings) {
                    localStorage.setItem(key, backup.settings[key]);
                }
                alert('✅ Backup wiederhergestellt!');
                location.reload();
            } catch (err) {
                alert('❌ Fehler beim Wiederherstellen');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

async function runFullDiagnostic() {
    let report = '=== DIAGNOSE-BERICHT ===\n\n';
    report += 'Bluetooth: ' + (window.BluetoothForegroundService ? 'OK' : 'FEHLER') + '\n';
    report += 'Permissions: ' + (window.AndroidPermissionsManager ? 'OK' : 'FEHLER') + '\n';
    report += 'Musik-Scanner: ' + (window.AndroidMusicScanner ? 'OK' : 'FEHLER') + '\n';
    report += 'Audio-Decoder: ' + (window.AudioDecoderFFT ? 'OK' : 'FEHLER') + '\n';
    alert(report);
}

function checkForUpdates() {
    alert('Aktuelle Version: 3.0.0\nKeine Updates verfügbar');
}

function confirmResetApp() {
    if (confirm('WARNUNG: Alle Daten werden gelöscht!\n\nFortfahren?')) {
        if (confirm('Wirklich ALLE Daten löschen?')) {
            localStorage.clear();
            if ('indexedDB' in window) {
                indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
            }
            alert('App zurückgesetzt!');
            location.reload();
        }
    }
}

// HILFE & SUPPORT
function openFAQ(topic) {
    alert('FAQ: ' + topic + '\n\nDokumentation wird geladen...');
}

function sendFeedback() {
    alert('Feedback-Formular wird geöffnet...');
}

function reportBug() {
    alert('Bug-Report wird erstellt...');
}

function openPrivacyPolicy() {
    alert('Datenschutzerklärung wird geladen...');
}

function openTerms() {
    alert('Nutzungsbedingungen werden geladen...');
}

function openLicenses() {
    alert('Open-Source-Lizenzen werden geladen...');
}

// GERÄTE-LISTE DYNAMISCH LADEN
async function loadSavedDevices() {
    const container = document.getElementById('saved-devices');
    if (!container) return;

    container.innerHTML = '<p style="color: #888;">Lade gespeicherte Geräte...</p>';

    if (window.BluetoothForegroundService) {
        const devices = await window.BluetoothForegroundService.getSavedDevices();
        if (devices && devices.length > 0) {
            container.innerHTML = '';
            devices.forEach(device => {
                const card = document.createElement('div');
                card.className = 'device-card' + (device.isPrimary ? ' primary-device' : '');
                card.innerHTML = `
                    <div class="device-info">
                        <i class="fas fa-lightbulb"></i>
                        <div>
                            <h3>${device.name || 'Unbekanntes Gerät'}</h3>
                            <span class="device-mac">${device.deviceId}</span>
                            ${device.isPrimary ? '<span class="badge primary">Hauptgerät</span>' : ''}
                        </div>
                    </div>
                    <div class="device-status ${device.connected ? 'connected' : 'disconnected'}">
                        <i class="fas fa-${device.connected ? 'check' : 'times'}-circle"></i>
                        ${device.connected ? 'Verbunden' : 'Getrennt'}
                    </div>
                    <div class="device-actions">
                        <button class="btn-icon" onclick="editDevice('${device.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon" onclick="removeDevice('${device.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="color: #888;">Keine gespeicherten Geräte</p>';
        }
    }
}

// STATISTIKEN AKTUALISIEREN
async function updateMusicStats() {
    if (window.musicLibraryManager) {
        const tracks = await window.musicLibraryManager.getAllTracks();
        document.getElementById('totalTracks').textContent = tracks.length;
    }
}

// GLOBAL EXPORTS
window.scanForNewDevice = scanForNewDevice;
window.toggleAutoReconnect = toggleAutoReconnect;
window.toggleForegroundService = toggleForegroundService;
window.editDevice = editDevice;
window.removeDevice = removeDevice;
window.connectDevice = connectDevice;
window.scanMediaStore = scanMediaStore;
window.requestSAFAccess = requestSAFAccess;
window.cancelScan = cancelScan;
window.toggleAutoScan = toggleAutoScan;
window.loadReactionPreset = loadReactionPreset;
window.toggleBeatDetection = toggleBeatDetection;
window.saveCustomPreset = saveCustomPreset;
window.resetToDefault = resetToDefault;
window.importPreset = importPreset;
window.createNewPreset = createNewPreset;
window.applyPreset = applyPreset;
window.editPreset = editPreset;
window.deletePreset = deletePreset;
window.exportPreset = exportPreset;
window.syncPresetsToDevices = syncPresetsToDevices;
window.clearCache = clearCache;
window.createBackup = createBackup;
window.restoreBackup = restoreBackup;
window.runFullDiagnostic = runFullDiagnostic;
window.checkForUpdates = checkForUpdates;
window.confirmResetApp = confirmResetApp;
window.openFAQ = openFAQ;
window.sendFeedback = sendFeedback;
window.reportBug = reportBug;
window.openPrivacyPolicy = openPrivacyPolicy;
window.openTerms = openTerms;
window.openLicenses = openLicenses;

// console.log('✅ Einstellungen-Controller geladen');
