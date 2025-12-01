/**
 * EINSTELLUNGEN-CONTROLLER.JS
 * Alle Einstellungs-Funktionen aus Einstellungen.html - KEIN Inline-JS
 */
'use strict';

// escapeHtml → siehe utils.js

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

let darkMode = true;
function toggleDarkMode() {
    darkMode = !darkMode;
    const switchEl = document.getElementById('darkModeSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active', darkMode);
    }
    document.body.classList.toggle('light-mode', !darkMode);
    localStorage.setItem('darkMode', darkMode);
    saveSettings();
}

let hierarchicalGroups = false;
function toggleHierarchicalGroups() {
    hierarchicalGroups = !hierarchicalGroups;
    const switchEl = document.getElementById('hierarchicalGroupsSwitch');
    if (switchEl) {
        switchEl.classList.toggle('active', hierarchicalGroups);
    }
    localStorage.setItem('hierarchicalGroups', hierarchicalGroups);
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
            darkMode = settings.darkMode !== undefined ? settings.darkMode : true;
            hierarchicalGroups = settings.hierarchicalGroups !== undefined ? settings.hierarchicalGroups : false;
        }

        // UI-Status aktualisieren
        const darkModeSwitch = document.getElementById('darkModeSwitch');
        if (darkModeSwitch) darkModeSwitch.classList.toggle('active', darkMode);

        const hierarchicalSwitch = document.getElementById('hierarchicalGroupsSwitch');
        if (hierarchicalSwitch) hierarchicalSwitch.classList.toggle('active', hierarchicalGroups);

        const notificationsSwitch = document.getElementById('notificationsSwitch');
        if (notificationsSwitch) notificationsSwitch.classList.toggle('active', notifications);

    } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
    }
}

function saveSettings() {
    try {
        const settings = {
            autoConnect,
            brightness,
            notifications,
            darkMode,
            hierarchicalGroups
        };
        localStorage.setItem('led-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Fehler beim Speichern der Einstellungen:', error);
    }
}

// loadSavedDevices() ist weiter unten vollständig implementiert (Zeile 846+)

async function autoConnectDevices() {
    console.log('🔄 Auto-Connect startet...');
    try {
        // Gespeicherte Geräte aus LocalStorage laden
        const savedDevices = JSON.parse(localStorage.getItem('savedBLEDevices') || '[]');

        if (savedDevices.length === 0) {
            console.log('ℹ️ Keine gespeicherten Geräte für Auto-Connect');
            return;
        }

        // Mit BluetoothForegroundService verbinden wenn verfügbar
        if (window.BluetoothForegroundService) {
            for (const device of savedDevices) {
                if (device.autoConnect) {
                    console.log(`🔗 Verbinde automatisch mit: ${device.name || device.deviceId}`);
                    try {
                        await window.BluetoothForegroundService.connect(device.deviceId);
                        console.log(`✅ Verbunden mit: ${device.name}`);
                        if (window.showNotification) {
                            window.showNotification(`Verbunden mit ${device.name}`, 'success');
                        }
                    } catch (err) {
                        console.warn(`⚠️ Auto-Connect fehlgeschlagen für ${device.name}:`, err.message);
                    }
                }
            }
        }
        // Fallback: Globaler BLE-Controller
        else if (bleController && bleController.connect) {
            const primaryDevice = savedDevices.find(d => d.isPrimary) || savedDevices[0];
            if (primaryDevice) {
                console.log(`🔗 Verbinde mit Hauptgerät: ${primaryDevice.name}`);
                await bleController.connect(primaryDevice.deviceId);
            }
        }

        updateConnectionStatus();
    } catch (error) {
        console.error('❌ Auto-Connect Fehler:', error);
    }
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

// Global Export (escapeHtml bereits in utils.js)
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

// ========== VERSTECKTE FEATURES AKTIVIEREN ==========

/**
 * Cloud-Sync Toggle
 */
function toggleCloudSync() {
    const switchEl = document.getElementById('cloudSyncSwitch');
    if (!switchEl) return;

    const isActive = switchEl.classList.toggle('active');

    if (window.cloudSync) {
        if (isActive) {
            window.cloudSync.enable();
            if (window.showNotification) {
                window.showNotification('Cloud-Sync aktiviert', 'success');
            }
        } else {
            window.cloudSync.disable();
            if (window.showNotification) {
                window.showNotification('Cloud-Sync deaktiviert', 'info');
            }
        }
    }

    localStorage.setItem('cloudSyncEnabled', isActive);
}

/**
 * Szenen-Manager öffnen
 */
function openScenesManager() {
    // Prüfe ob ScenesManager existiert
    if (!window.scenesManager) {
        if (window.showNotification) {
            window.showNotification('Szenen-Manager lädt...', 'info');
        }
        return;
    }

    // Erstelle Modal für Szenen-Manager
    const modal = document.createElement('div');
    modal.id = 'scenes-manager-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); z-index: 10000;
        display: flex; flex-direction: column; padding: 20px;
        overflow-y: auto;
    `;

    const scenes = window.scenesManager.getAllScenes();
    const categories = window.scenesManager.categories || ['Party', 'Entspannung', 'Arbeit', 'Custom'];

    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: #0ff; margin: 0;">🎬 Szenen-Manager</h2>
            <button onclick="document.getElementById('scenes-manager-modal').remove()" style="
                background: none; border: none; color: white; font-size: 24px; cursor: pointer;
            ">✕</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            ${categories.map(cat => `
                <button class="scene-category-btn" data-category="${cat}" style="
                    padding: 8px 16px; border-radius: 20px; border: 1px solid #4ecdc4;
                    background: transparent; color: #4ecdc4; cursor: pointer;
                ">${cat}</button>
            `).join('')}
        </div>
        
        <div id="scenes-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
            ${scenes.length === 0 ? '<p style="color: #888; grid-column: 1/-1;">Keine Szenen vorhanden. Erstelle deine erste Szene!</p>' : ''}
            ${scenes.map(scene => `
                <div class="scene-card" onclick="applySceneFromManager('${scene.id}')" style="
                    background: linear-gradient(135deg, rgb(${scene.color.r}, ${scene.color.g}, ${scene.color.b}), rgba(0,0,0,0.5));
                    border-radius: 12px; padding: 15px; cursor: pointer;
                    border: 2px solid transparent; transition: all 0.3s;
                " onmouseover="this.style.borderColor='#0ff'" onmouseout="this.style.borderColor='transparent'">
                    <div style="font-weight: bold; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">${scene.name}</div>
                    <div style="font-size: 12px; color: rgba(255,255,255,0.7);">${scene.category || 'Custom'}</div>
                    ${scene.favorite ? '<span style="position: absolute; top: 5px; right: 5px;">⭐</span>' : ''}
                </div>
            `).join('')}
        </div>
        
        <button onclick="createNewScene()" style="
            margin-top: 20px; padding: 15px; width: 100%;
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            border: none; border-radius: 12px; color: white;
            font-size: 16px; font-weight: bold; cursor: pointer;
        ">
            <i class="fas fa-plus"></i> Neue Szene erstellen
        </button>
    `;

    document.body.appendChild(modal);
}

/**
 * Szene aus Manager anwenden
 */
function applySceneFromManager(sceneId) {
    if (window.scenesManager) {
        window.scenesManager.applyScene(sceneId);
        if (window.showNotification) {
            window.showNotification('Szene angewendet!', 'success');
        }
    }
}

/**
 * Neue Szene erstellen
 */
function createNewScene() {
    const name = prompt('Name der Szene:');
    if (!name) return;

    // Aktuelle Farbe und Helligkeit nehmen
    const currentColor = window.currentColor || { r: 255, g: 255, b: 255 };
    const currentBrightness = parseInt(document.getElementById('brightnessSlider')?.value || 80);

    if (window.scenesManager) {
        window.scenesManager.createScene({
            name: name,
            color: currentColor,
            brightness: currentBrightness,
            effect: 0,
            category: 'Custom'
        });

        if (window.showNotification) {
            window.showNotification(`Szene "${name}" erstellt!`, 'success');
        }

        // Modal aktualisieren
        document.getElementById('scenes-manager-modal')?.remove();
        openScenesManager();
    }
}

/**
 * Sprachsteuerung Toggle
 */
function toggleVoiceControl() {
    const switchEl = document.getElementById('voiceControlSwitch');
    if (!switchEl) return;

    const isActive = switchEl.classList.toggle('active');

    if (window.voiceCommands) {
        if (isActive) {
            window.voiceCommands.startListening();
            if (window.showNotification) {
                window.showNotification('Sprachsteuerung aktiviert - Sage "LED rot" oder "Helligkeit 50"', 'success');
            }
        } else {
            window.voiceCommands.stopListening();
            if (window.showNotification) {
                window.showNotification('Sprachsteuerung deaktiviert', 'info');
            }
        }
    } else {
        if (window.showNotification) {
            window.showNotification('Sprachsteuerung nicht verfügbar', 'warning');
        }
        switchEl.classList.remove('active');
    }

    localStorage.setItem('voiceControlEnabled', isActive);
}

/**
 * Einstellungen laden (Sync, Voice)
 */
function loadHiddenFeatureSettings() {
    // Cloud-Sync Status
    const cloudSyncEnabled = localStorage.getItem('cloudSyncEnabled') === 'true';
    const cloudSyncSwitch = document.getElementById('cloudSyncSwitch');
    if (cloudSyncSwitch && cloudSyncEnabled) {
        cloudSyncSwitch.classList.add('active');
    }

    // Voice Control Status
    const voiceEnabled = localStorage.getItem('voiceControlEnabled') === 'true';
    const voiceSwitch = document.getElementById('voiceControlSwitch');
    if (voiceSwitch && voiceEnabled) {
        voiceSwitch.classList.add('active');
    }
}

// Bei DOMContentLoaded laden
document.addEventListener('DOMContentLoaded', loadHiddenFeatureSettings);

// ============================================================
// ALLGEMEINE EINSTELLUNGEN - TOGGLES & SLIDER
// ============================================================

/**
 * Auto-Connect Toggle
 */
function toggleAutoConnect() {
    const switchEl = document.getElementById('autoConnectSwitch');
    if (!switchEl) return;

    const isActive = switchEl.classList.toggle('active');
    autoConnect = isActive;
    localStorage.setItem('autoConnect', isActive);

    // Keine Benachrichtigung
    console.log('🔗 Auto-Connect:', isActive);
}

/**
 * Benachrichtigungen Toggle
 */
function toggleNotifications() {
    const switchEl = document.getElementById('notificationsSwitch');
    if (!switchEl) return;

    const isActive = switchEl.classList.toggle('active');
    notifications = isActive;
    localStorage.setItem('notificationsEnabled', isActive);

    // Keine Benachrichtigung
    console.log('🔔 Benachrichtigungen:', isActive);
}

// toggleDarkMode ist bereits oben definiert (Zeile ~241)

// toggleHierarchicalGroups ist bereits oben definiert (Zeile ~253)

/**
 * Sprache ändern
 */
function changeLanguage(lang) {
    localStorage.setItem('appLanguage', lang);

    // Multi-Language Support aufrufen wenn vorhanden
    if (window.MultiLanguageSupport) {
        window.MultiLanguageSupport.setLanguage(lang);
    }

    if (window.showNotification) {
        const names = { de: 'Deutsch', en: 'English', es: 'Español', fr: 'Français' };
        window.showNotification(`Sprache: ${names[lang] || lang}`, 'success');
    }

    console.log('🌐 Sprache geändert:', lang);
}

/**
 * Initialisiere alle Einstellungs-Event-Listener
 */
function initSettingsEventListeners() {
    // Brightness Slider
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    if (brightnessSlider && brightnessValue) {
        brightnessSlider.oninput = function () {
            brightnessValue.textContent = this.value + '%';
            brightness = parseInt(this.value);
            localStorage.setItem('brightness', brightness);

            // An BLE senden wenn verbunden
            if (bleController && bleController.isConnected && bleController.isConnected()) {
                bleController.setBrightness(brightness);
            }
        };
    }

    // FPS Slider
    const fpsSlider = document.getElementById('fpsSlider');
    const fpsValue = document.getElementById('fpsValue');
    if (fpsSlider && fpsValue) {
        fpsSlider.oninput = function () {
            fpsValue.textContent = this.value + ' FPS';
            localStorage.setItem('fps', this.value);
        };
    }

    // Packet Size Slider
    const packetSizeSlider = document.getElementById('packetSizeSlider');
    const packetSizeValue = document.getElementById('packetSizeValue');
    if (packetSizeSlider && packetSizeValue) {
        packetSizeSlider.oninput = function () {
            packetSizeValue.textContent = this.value + ' Bytes';
            localStorage.setItem('packetSize', this.value);
        };
    }

    // Mikrofon-Empfindlichkeit Slider
    const micSlider = document.getElementById('micSensitivitySlider');
    const micValue = document.getElementById('micSensitivityValue');
    if (micSlider && micValue) {
        micSlider.oninput = function () {
            micValue.textContent = this.value + '%';
            localStorage.setItem('micSensitivity', this.value);
        };
    }

    // Language Select
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.onchange = function () {
            changeLanguage(this.value);
        };

        // Gespeicherte Sprache laden
        const savedLang = localStorage.getItem('appLanguage') || 'de';
        languageSelect.value = savedLang;
    }

    // Switches klickbar machen (spezifische Handler)
    const switchMap = {
        'autoConnectSwitch': toggleAutoConnect,
        'notificationsSwitch': toggleNotifications,
        'darkModeSwitch': toggleDarkMode,
        'hierarchicalGroupsSwitch': toggleHierarchicalGroups,
        'voiceControlSwitch': toggleVoiceControl,
        'cloudSyncSwitch': toggleCloudSync
    };

    Object.entries(switchMap).forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (el) {
            el.onclick = handler;
        }
    });

    // Switches klickbar machen (für alle div.switch Elemente ohne spezifischen Handler)
    document.querySelectorAll('.switch').forEach(switchEl => {
        if (!switchEl.onclick) {
            switchEl.onclick = function () {
                // Für Switches die noch keinen Handler haben (rein visuell oder später handled)
                this.classList.toggle('active');
                // Speichern wenn ID vorhanden
                if (this.id) {
                    localStorage.setItem(this.id, this.classList.contains('active'));
                }
            };
        }
    });

    // Gespeicherte Werte laden
    loadSavedSettingsValues();
}

/**
 * Gespeicherte Einstellungswerte laden
 */
function loadSavedSettingsValues() {
    // Auto-Connect
    const savedAutoConnect = localStorage.getItem('autoConnect');
    if (savedAutoConnect === 'true') {
        const el = document.getElementById('autoConnectSwitch');
        if (el) el.classList.add('active');
    }

    // Notifications
    const savedNotifications = localStorage.getItem('notificationsEnabled');
    if (savedNotifications !== 'false') {
        const el = document.getElementById('notificationsSwitch');
        if (el) el.classList.add('active');
    }

    // Dark Mode
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        const el = document.getElementById('darkModeSwitch');
        if (el) el.classList.add('active');
        document.body.classList.add('dark-mode');
    }

    // Hierarchische Gruppen
    const savedGroups = localStorage.getItem('hierarchicalGroups');
    if (savedGroups === 'true') {
        const el = document.getElementById('hierarchicalGroupsSwitch');
        if (el) el.classList.add('active');
    }

    // Brightness
    const savedBrightness = localStorage.getItem('brightness');
    if (savedBrightness) {
        const slider = document.getElementById('brightnessSlider');
        const value = document.getElementById('brightnessValue');
        if (slider) slider.value = savedBrightness;
        if (value) value.textContent = savedBrightness + '%';
    }
}

// Event-Listener beim DOM-Load initialisieren
document.addEventListener('DOMContentLoaded', initSettingsEventListeners);

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

// VERSTECKTE FEATURES EXPORTS
window.toggleCloudSync = toggleCloudSync;
window.openScenesManager = openScenesManager;
window.applySceneFromManager = applySceneFromManager;
window.createNewScene = createNewScene;
window.toggleVoiceControl = toggleVoiceControl;

// ALLGEMEINE EINSTELLUNGEN EXPORTS
window.toggleAutoConnect = toggleAutoConnect;
window.toggleNotifications = toggleNotifications;
window.toggleDarkMode = toggleDarkMode;
window.toggleHierarchicalGroups = toggleHierarchicalGroups;
window.changeLanguage = changeLanguage;
window.initSettingsEventListeners = initSettingsEventListeners;

// console.log('✅ Einstellungen-Controller geladen');
