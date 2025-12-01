/**
 * BLE Controller Pro - Professional Bluetooth Low Energy Controller
 * @module BLEControllerPro
 * @version 3.0.0
 * 
 * Supports:
 * - ELK-BLEDOM Protocol
 * - Generic BLE LED Protocol
 * - WLED (WiFi LEDs)
 * - Auto-reconnect
 * - Flood protection
 * - Retry logic
 */

'use strict';

class BLEController {
    constructor() {
        // Connection state
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
        this.isConnected = false;
        this.protocol = 'ELK_BLEDOM';
        this.deviceName = null;
        this.deviceId = null;

        // BLE Service UUIDs
        this.SERVICES = {
            ELK_BLEDOM: '0000fff0-0000-1000-8000-00805f9b34fb',
            GENERIC: '0000ffe0-0000-1000-8000-00805f9b34fb'
        };

        // BLE Characteristic UUIDs
        this.CHARACTERISTICS = {
            ELK_BLEDOM: '0000fff3-0000-1000-8000-00805f9b34fb',
            GENERIC: '0000ffe1-0000-1000-8000-00805f9b34fb'
        };

        // Protocol commands
        this.COMMANDS = {
            ELK_BLEDOM: {
                POWER_ON: [0x7e, 0x04, 0x04, 0x01, 0xff, 0xff, 0xff, 0x00, 0xef],
                POWER_OFF: [0x7e, 0x04, 0x04, 0x00, 0xff, 0xff, 0xff, 0x00, 0xef],
                COLOR: (r, g, b) => [0x7e, 0x07, 0x05, 0x03, r, g, b, 0x00, 0xef],
                BRIGHTNESS: (level) => [0x7e, 0x04, 0x01, level, 0xff, 0xff, 0xff, 0x00, 0xef],
                EFFECT: (id) => [0x7e, 0x05, 0x03, id, 0x03, 0xff, 0xff, 0x00, 0xef],
                // Weißton: 0=Warmweiß, 100=Kaltweiß (für RGBW/RGBWW Strips)
                WHITE_TEMP: (temp) => [0x7e, 0x04, 0x0f, Math.round(temp * 2.55), 0xff, 0xff, 0xff, 0x00, 0xef],
                WHITE_BRIGHTNESS: (level) => [0x7e, 0x04, 0x0e, level, 0xff, 0xff, 0xff, 0x00, 0xef]
            },
            GENERIC: {
                POWER_ON: [0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef],
                POWER_OFF: [0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef],
                COLOR: (r, g, b) => {
                    const checksum = (r + g + b) & 0xFF;
                    return [0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, checksum, 0xef];
                },
                BRIGHTNESS: (level) => [0x7e, 0x00, 0x01, level, 0xff, 0xff, 0xff, 0x00, 0xef],
                EFFECT: (id) => [0x7e, 0x00, 0x03, id, 0x03, 0xff, 0xff, 0x00, 0xef],
                WHITE_TEMP: (temp) => [0x7e, 0x00, 0x0f, Math.round(temp * 2.55), 0xff, 0xff, 0xff, 0x00, 0xef],
                WHITE_BRIGHTNESS: (level) => [0x7e, 0x00, 0x0e, level, 0xff, 0xff, 0xff, 0x00, 0xef]
            }
        };

        // Flood protection
        this.lastCommandTime = 0;
        this.commandDelay = 50; // ms
        this.lastMusicFrameTime = 0;

        // WLED support
        this.wledEnabled = false;
        this.wledDevices = [];

        // Reconnect settings
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 3000; // ms

        console.log('BLEController initialized v3.0.0');
    }

    /**
     * Check if Web Bluetooth API is available
     * @returns {boolean}
     */
    isBluetoothAvailable() {
        if (!navigator.bluetooth) {
            console.error('Web Bluetooth API not available');
            return false;
        }
        return true;
    }

    /**
     * Scan for BLE devices
     * @param {string} protocol - Protocol to use (ELK_BLEDOM, GENERIC)
     * @returns {Promise<BluetoothDevice>}
     */
    async scan(protocol = 'ELK_BLEDOM') {
        if (!this.isBluetoothAvailable()) {
            throw new Error('Web Bluetooth API nicht verfügbar');
        }

        try {
            console.log('Scanning for BLE devices...');

            const options = {
                filters: [
                    { namePrefix: 'ELK-BLEDOM' },
                    { namePrefix: 'BLE-LED' },
                    { namePrefix: 'LED' },
                    { namePrefix: 'Triones' }
                ],
                optionalServices: Object.values(this.SERVICES)
            };

            this.device = await navigator.bluetooth.requestDevice(options);
            console.log(`Device found: ${this.device.name}`);

            return this.device;
        } catch (error) {
            if (error.name === 'NotFoundError') {
                console.warn('No devices found or selection cancelled');
            } else {
                console.error('Scan failed:', error);
            }
            throw error;
        }
    }

    /**
     * Connect to BLE device
     * @param {string} deviceId - Device ID (optional)
     * @param {string} protocol - Protocol to use
     * @returns {Promise<boolean>}
     */
    async connect(deviceId = null, protocol = 'ELK_BLEDOM') {
        try {
            // Scan if no device available
            if (!this.device) {
                await this.scan(protocol);
            }

            if (!this.device) {
                throw new Error('No device to connect');
            }

            console.log(`Connecting to ${this.device.name}...`);

            // Connect GATT server
            this.server = await this.device.gatt.connect();
            console.log('GATT server connected');

            // Get service
            const serviceUUID = this.SERVICES[protocol] || this.SERVICES.ELK_BLEDOM;
            this.service = await this.server.getPrimaryService(serviceUUID);
            console.log('Service found');

            // Get characteristic
            const charUUID = this.CHARACTERISTICS[protocol] || this.CHARACTERISTICS.ELK_BLEDOM;
            this.characteristic = await this.service.getCharacteristic(charUUID);
            console.log('Characteristic found');

            // Set state
            this.isConnected = true;
            this.protocol = protocol;
            this.deviceName = this.device.name;
            this.deviceId = this.device.id;

            // Setup disconnect handler
            this.device.addEventListener('gattserverdisconnected', () => {
                this.handleDisconnect();
            });

            console.log(`Successfully connected to ${this.deviceName}`);

            // Notify app
            if (window.updateGlobalBLEStatus) {
                window.updateGlobalBLEStatus();
            }

            // Save device to Foreground Service
            if (window.BluetoothForegroundService) {
                await window.BluetoothForegroundService.saveDevice(this.device, true, {
                    serviceUUID: serviceUUID,
                    characteristicUUID: charUUID
                });
                window.BluetoothForegroundService.onDeviceConnected(this.deviceId, this.deviceName);
                console.log('✅ Device saved to Foreground Service');
            }

            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            this.isConnected = false;

            // User-friendly error message
            let message = 'Verbindung fehlgeschlagen. ';
            if (error.name === 'NotFoundError') {
                message += 'Gerät nicht gefunden.';
            } else if (error.name === 'NetworkError') {
                message += 'Netzwerkfehler - bitte näher an das Gerät gehen.';
            } else if (error.message?.includes('GATT')) {
                message += 'GATT-Fehler - bitte Gerät neu starten.';
            } else {
                message += 'Bitte Gerät einschalten und in Reichweite bringen.';
            }

            this.showNotification(message, 'error');
            throw error;
        }
    }

    /**
     * Send command to device with retry logic
     * @param {Array} command - Command bytes
     * @param {number} retries - Number of retries
     * @returns {Promise<boolean>}
     */
    async sendCommand(command, retries = 3) {
        if (!this.isConnected || !this.characteristic) {
            console.warn('Not connected - command ignored');
            return false;
        }

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Flood protection
                const now = Date.now();
                const timeSinceLastCommand = now - this.lastCommandTime;
                if (timeSinceLastCommand < this.commandDelay) {
                    await this.delay(this.commandDelay - timeSinceLastCommand);
                }

                // Check connection before sending
                if (!this.device.gatt.connected) {
                    console.warn('Connection lost - attempting reconnect...');
                    await this.reconnect();
                }

                // Convert to Uint8Array
                const data = new Uint8Array(command);

                // Send with timeout
                await Promise.race([
                    this.characteristic.writeValue(data),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Command timeout')), 5000)
                    )
                ]);

                this.lastCommandTime = Date.now();

                console.log(`Command sent (attempt ${attempt}):`,
                    Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));

                // Wait for confirmation
                await this.delay(50);

                return true;

            } catch (error) {
                console.error(`Command failed (attempt ${attempt}/${retries}):`, error);

                if (attempt === retries) {
                    this.showNotification('Befehl konnte nicht gesendet werden', 'error');
                    return false;
                }

                // Wait before retry
                await this.delay(100 * attempt);
            }
        }

        return false;
    }

    /**
     * Reconnect to device
     * @returns {Promise<boolean>}
     */
    async reconnect() {
        try {
            if (this.device?.gatt) {
                this.server = await this.device.gatt.connect();
                this.service = await this.server.getPrimaryService(this.SERVICES[this.protocol]);
                this.characteristic = await this.service.getCharacteristic(
                    this.CHARACTERISTICS[this.protocol]
                );
                this.isConnected = true;
                console.log('Reconnected successfully');
                return true;
            }
        } catch (error) {
            console.error('Reconnect failed:', error);
            this.isConnected = false;
            return false;
        }
        return false;
    }

    /**
     * Set LED color (hex)
     * @param {string} hexColor - Hex color (#RRGGBB)
     * @returns {Promise<boolean>}
     */
    async setColor(hexColor) {
        if (typeof hexColor === 'string' && hexColor.startsWith('#')) {
            hexColor = hexColor.substring(1);
        }

        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);

        return await this.setColorRGB(r, g, b);
    }

    /**
     * Set LED color (RGB)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Promise<boolean>}
     */
    async setColorRGB(r, g, b) {
        // Validate
        r = Math.max(0, Math.min(255, parseInt(r) || 0));
        g = Math.max(0, Math.min(255, parseInt(g) || 0));
        b = Math.max(0, Math.min(255, parseInt(b) || 0));

        const command = this.COMMANDS[this.protocol].COLOR(r, g, b);
        const result = await this.sendCommand(command);

        if (result) {
            console.log(`Color set: RGB(${r}, ${g}, ${b})`);
        }

        return result;
    }

    /**
     * Set brightness
     * @param {number} level - Brightness level (0-100)
     * @returns {Promise<boolean>}
     */
    async setBrightness(level) {
        level = Math.max(0, Math.min(100, parseInt(level) || 0));
        const brightnessValue = Math.round((level / 100) * 255);

        const command = this.COMMANDS[this.protocol].BRIGHTNESS(brightnessValue);
        const result = await this.sendCommand(command);

        if (result) {
            console.log(`Brightness set: ${level}%`);
        }

        return result;
    }

    /**
     * Set LED effect
     * @param {number} effectId - Effect ID (0-255)
     * @returns {Promise<boolean>}
     */
    async setEffect(effectId) {
        effectId = Math.max(0, Math.min(255, parseInt(effectId) || 0));

        const command = this.COMMANDS[this.protocol].EFFECT(effectId);
        const result = await this.sendCommand(command);

        if (result) {
            console.log(`Effect ${effectId} activated`);
        }

        return result;
    }

    /**
     * Power on/off
     * @param {boolean} state - Power state
     * @returns {Promise<boolean>}
     */
    async setPower(state) {
        const command = state
            ? this.COMMANDS[this.protocol].POWER_ON
            : this.COMMANDS[this.protocol].POWER_OFF;

        const result = await this.sendCommand(command);

        if (result) {
            console.log(`Power ${state ? 'ON' : 'OFF'}`);
        }

        return result;
    }

    /**
     * Set white temperature (for RGBW/RGBWW strips)
     * @param {number} temp - Temperature (0=Warmweiß, 100=Kaltweiß)
     * @returns {Promise<boolean>}
     */
    async setWhiteTemperature(temp) {
        temp = Math.max(0, Math.min(100, parseInt(temp) || 50));

        const command = this.COMMANDS[this.protocol].WHITE_TEMP(temp);
        const result = await this.sendCommand(command);

        if (result) {
            console.log(`White temperature: ${temp}% (${temp < 50 ? 'warm' : 'cold'})`);
        }

        return result;
    }

    /**
     * Set white brightness (for RGBW/RGBWW strips)
     * @param {number} level - Brightness level (0-100)
     * @returns {Promise<boolean>}
     */
    async setWhiteBrightness(level) {
        level = Math.max(0, Math.min(100, parseInt(level) || 0));
        const brightnessValue = Math.round((level / 100) * 255);

        const command = this.COMMANDS[this.protocol].WHITE_BRIGHTNESS(brightnessValue);
        const result = await this.sendCommand(command);

        if (result) {
            console.log(`White brightness: ${level}%`);
        }

        return result;
    }

    /**
     * Send music frame (for music reactive mode)
     * @param {string} deviceId - Device ID
     * @param {Object} audioData - Audio data {bass, mid, treble}
     * @returns {Promise<boolean>}
     */
    async sendMusicFrame(deviceId, audioData) {
        if (!this.isConnected) return false;

        try {
            // Flood protection for music mode
            if (this.protocol === 'ELK_BLEDOM') {
                const now = Date.now();
                if (this.lastMusicFrameTime && (now - this.lastMusicFrameTime) < 50) {
                    return true; // Skip frame
                }
                this.lastMusicFrameTime = now;
            }

            // Convert audio to color
            const bass = audioData.bass || 0;
            const mid = audioData.mid || 0;
            const treble = audioData.treble || 0;

            const r = Math.min(255, Math.floor(bass * 2));
            const g = Math.min(255, Math.floor(mid * 2));
            const b = Math.min(255, Math.floor(treble * 2));

            return await this.setColorRGB(r, g, b);
        } catch (error) {
            console.error('Music frame send failed:', error);
            return false;
        }
    }

    /**
     * Run test sequence
     * @returns {Promise<boolean>}
     */
    async runTestSequence() {
        if (!this.isConnected) {
            console.warn('Not connected - test aborted');
            return false;
        }

        console.log('Starting test sequence...');

        try {
            await this.setColorRGB(255, 0, 0); // Red
            await this.delay(500);
            await this.setColorRGB(0, 255, 0); // Green
            await this.delay(500);
            await this.setColorRGB(0, 0, 255); // Blue
            await this.delay(500);
            await this.setColorRGB(255, 255, 255); // White
            await this.delay(500);

            console.log('Test sequence completed');
            return true;
        } catch (error) {
            console.error('Test sequence failed:', error);
            return false;
        }
    }

    /**
     * Disconnect from device
     */
    disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
            console.log('Disconnected');
        }

        this.isConnected = false;
        this.device = null;
        this.server = null;
        this.service = null;
        this.characteristic = null;
    }

    /**
     * Get connection status
     * @returns {Object}
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            device: this.device ? {
                name: this.deviceName,
                id: this.deviceId,
                protocol: this.protocol
            } : null
        };
    }

    /**
     * Get connected devices list
     * @returns {Array}
     */
    getConnectedDevices() {
        if (this.isConnected && this.device) {
            return [{
                name: this.deviceName,
                mac: this.deviceId,
                id: this.deviceId,
                protocol: this.protocol
            }];
        }
        return [];
    }

    /**
     * Handle disconnection
     */
    handleDisconnect() {
        console.log('Device disconnected');
        this.isConnected = false;

        this.showNotification('Verbindung unterbrochen', 'warning');

        // Update app status
        if (window.updateGlobalBLEStatus) {
            window.updateGlobalBLEStatus();
        }

        // Notify Foreground Service
        if (window.BluetoothForegroundService && this.deviceId) {
            window.BluetoothForegroundService.onDeviceDisconnected(this.deviceId);
            console.log('⚠️ Device disconnection reported to Foreground Service');
        }

        // Attempt auto-reconnect
        this.attemptAutoReconnect();
    }

    /**
     * Attempt automatic reconnection
     * @returns {Promise<boolean>}
     */
    async attemptAutoReconnect() {
        for (let attempt = 1; attempt <= this.maxReconnectAttempts; attempt++) {
            console.log(`Auto-reconnect attempt ${attempt}/${this.maxReconnectAttempts}`);

            this.showNotification(`Wiederverbindung... (${attempt}/${this.maxReconnectAttempts})`, 'info');

            await this.delay(this.reconnectDelay);

            try {
                if (await this.reconnect()) {
                    this.showNotification('Wiederverbindung erfolgreich!', 'success');
                    return true;
                }
            } catch (error) {
                console.warn(`Reconnect attempt ${attempt} failed:`, error);
            }
        }

        console.error('Auto-reconnect failed after all attempts');
        this.showNotification('Wiederverbindung fehlgeschlagen', 'error');
        return false;
    }

    /**
     * Show notification
     * @param {string} message - Message to show
     * @param {string} type - Type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        if (window.showGlobalNotification) {
            window.showGlobalNotification(message, type);
        } else if (window.NativeBridge?.showToast) {
            window.NativeBridge.showToast(message, type === 'error' ? 'long' : 'short');
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Delay helper
     * @param {number} ms - Milliseconds
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Convert hex to RGB
     * @param {string} hex - Hex color
     * @returns {Object|null}
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Convert RGB to hex
     * @param {number} r - Red
     * @param {number} g - Green
     * @param {number} b - Blue
     * @returns {string}
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = Math.max(0, Math.min(255, parseInt(x) || 0)).toString(16);
            return hex.padStart(2, '0');
        }).join('');
    }

    // WLED Functions (WiFi LEDs)

    /**
     * Scan for WLED devices on network
     * @returns {Promise<Array>}
     */
    async scanWLEDDevices() {
        if (!this.wledEnabled) return [];

        console.log('Scanning for WLED devices...');
        const devices = [];
        const baseIP = '192.168.1.';
        const promises = [];

        for (let i = 1; i <= 254; i++) {
            const ip = baseIP + i;
            promises.push(this.checkWLEDDevice(ip));
        }

        try {
            const results = await Promise.allSettled(promises);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    devices.push({
                        ip: baseIP + (index + 1),
                        name: result.value.name || 'WLED Device',
                        version: result.value.version,
                        type: 'WLED'
                    });
                }
            });
        } catch (error) {
            console.error('WLED scan error:', error);
        }

        this.wledDevices = devices;
        console.log(`Found ${devices.length} WLED devices`);
        return devices;
    }

    /**
     * Check if IP is a WLED device
     * @param {string} ip - IP address
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<Object|null>}
     */
    async checkWLEDDevice(ip, timeout = 1000) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`http://${ip}/json/info`, {
                signal: controller.signal,
                method: 'GET'
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.name && data.ver) {
                    return { name: data.name, version: data.ver };
                }
            }
        } catch (error) {
            // Timeout or network error (normal during scan)
        }

        return null;
    }

    /**
     * Send color to WLED device
     * @param {string} ip - WLED IP address
     * @param {number} r - Red
     * @param {number} g - Green
     * @param {number} b - Blue
     * @returns {Promise<boolean>}
     */
    async sendColorToWLED(ip, r, g, b) {
        try {
            const response = await fetch(`http://${ip}/json/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    on: true,
                    bri: 255,
                    seg: [{ col: [[r, g, b]] }]
                })
            });

            return response.ok;
        } catch (error) {
            console.error(`WLED color send failed (${ip}):`, error);
            return false;
        }
    }

    /**
     * Enable/disable WLED integration
     * @param {boolean} enabled - Enable state
     */
    setWLEDEnabled(enabled) {
        this.wledEnabled = enabled;
        console.log(`WLED integration ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Reconnect to device by ID (for Foreground Service)
     * @param {string} deviceId - Device ID to reconnect
     * @returns {Promise<boolean>}
     */
    async reconnectToDevice(deviceId) {
        try {
            console.log(`🔄 Reconnecting to device: ${deviceId}`);

            // If already connected to this device
            if (this.isConnected && this.deviceId === deviceId) {
                console.log('✅ Already connected to this device');
                return true;
            }

            // Try to reconnect using stored device
            if (this.device && this.device.id === deviceId) {
                console.log('🔄 Reconnecting to stored device...');
                return await this.connect(deviceId, this.protocol);
            }

            // Device not available - need user interaction
            console.warn('⚠️ Device not available - user interaction required');
            return false;
        } catch (error) {
            console.error('❌ Reconnect failed:', error);
            return false;
        }
    }
}

// Global exposure for compatibility
window.BLEController = BLEController;

// Auto-initialize global instance
if (typeof window !== 'undefined') {
    window.bleController = new BLEController();
    window.BLEControllerPro = window.bleController; // Alias für Kompatibilität
    console.log('✅ BLE-Controller initialisiert (window.bleController)');
}

// CommonJS export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BLEController;
}
