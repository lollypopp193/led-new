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
        if (!navigator.bluetooth) {
            throw new Error('Web Bluetooth API nicht verfügbar');
        }

        if (window.ledController) {
            bleController = window.ledController;
            console.log('✅ Globaler BLE-Controller verwendet');
        } else if (typeof BLEController !== 'undefined') {
            bleController = new BLEController();
            await bleController.init();
            console.log('✅ Neuer BLE-Controller erstellt');
        } else {
            throw new Error('BLE-Controller Klasse nicht verfügbar');
        }

        loadSettings();
        loadSavedDevices();
        if (autoConnect) await autoConnectDevices();
        updateConnectionStatus();
    } catch (error) {
        console.error('❌ BLE-Initialisierung fehlgeschlagen:', error);
        updateConnectionStatus('❌ BLE nicht verfügbar - ' + error.message);
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

// console.log('✅ Einstellungen-Controller geladen');
