/**
 * ===================================================================
 * BLE-CONTROLLER-PRO.JS
 * Bluetooth Low Energy Controller für LED-Steuerung
 * Version: 1.0
 * ===================================================================
 * 
 * Unterstützte Protokolle:
 * - ELK-BLEDOM
 * - Generic BLE LED
 * - Weitere können hinzugefügt werden
 * 
 * Benötigt: Web Bluetooth API (Chrome, Edge, Opera)
 * Nicht unterstützt: Safari, iOS
 * 
 * ===================================================================
 */

'use strict';

class BLEController {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    this.protocol = null;
    this.deviceName = null;
    this.deviceId = null;

    // BLE Service und Characteristic UUIDs
    this.SERVICES = {
      ELK_BLEDOM: '0000fff0-0000-1000-8000-00805f9b34fb',
      GENERIC: '0000ffe0-0000-1000-8000-00805f9b34fb'
    };

    this.CHARACTERISTICS = {
      ELK_BLEDOM: '0000fff3-0000-1000-8000-00805f9b34fb',
      GENERIC: '0000ffe1-0000-1000-8000-00805f9b34fb'
    };

    // ✅ WLED-INTEGRATION (WiFi-LEDs)
    this.wledDevices = [];
    this.wledEnabled = false;

    // Protokoll-spezifische Befehle
    this.COMMANDS = {
      ELK_BLEDOM: {
        POWER_ON: [0x7e, 0x04, 0x04, 0x01, 0xff, 0xff, 0xff, 0x00, 0xef],
        POWER_OFF: [0x7e, 0x04, 0x04, 0x00, 0xff, 0xff, 0xff, 0x00, 0xef],
        COLOR: (r, g, b) => [0x7e, 0x07, 0x05, 0x03, r, g, b, 0x00, 0xef],
        BRIGHTNESS: (level) => [0x7e, 0x04, 0x01, level, 0xff, 0xff, 0xff, 0x00, 0xef],
        EFFECT: (id) => [0x7e, 0x05, 0x03, id, 0x03, 0xff, 0xff, 0x00, 0xef]
      },
      GENERIC: {
        POWER_ON: [0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef],
        POWER_OFF: [0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef],
        COLOR: (r, g, b) => {
          const checksum = (r + g + b) & 0xFF;
          return [0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, checksum, 0xef];
        },
        BRIGHTNESS: (level) => [0x7e, 0x00, 0x01, level, 0xff, 0xff, 0xff, 0x00, 0xef],
        EFFECT: (id) => {
          const effectId = Math.min(255, Math.max(0, id));
          return [0x7e, 0x00, 0x03, effectId, 0x03, 0xff, 0xff, 0x00, 0xef];
        }
      }
    };

    // Flood Protection
    this.lastCommandTime = 0;
    this.commandDelay = 50; // Minimum 50ms zwischen Befehlen

    console.log('✅ BLE-Controller initialisiert');
  }

  /**
   * Prüft ob Web Bluetooth API verfügbar ist
   */
  isBluetoothAvailable() {
    if (!navigator.bluetooth) {
      console.error('❌ Web Bluetooth API nicht verfügbar');
      console.error('Browser unterstützt kein Bluetooth oder nicht über HTTPS');
      return false;
    }
    return true;
  }

  /**
   * Scannt nach verfügbaren BLE-Geräten
   */
  async scan(protocol = 'ELK_BLEDOM') {
    if (!this.isBluetoothAvailable()) {
      throw new Error('Web Bluetooth API nicht verfügbar');
    }

    try {
      console.log('🔍 Scanne nach BLE-Geräten...');

      const options = {
        // acceptAllDevices: true,  // Alle Geräte anzeigen
        filters: [
          { namePrefix: 'ELK-BLEDOM' },
          { namePrefix: 'BLE-LED' },
          { namePrefix: 'LED' }
        ],
        optionalServices: [
          this.SERVICES.ELK_BLEDOM,
          this.SERVICES.GENERIC
        ]
      };

      this.device = await navigator.bluetooth.requestDevice(options);
      
      console.log('✅ Gerät gefunden:', this.device.name);
      return this.device;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        console.warn('⚠️ Keine Geräte gefunden oder Auswahl abgebrochen');
      } else {
        console.error('❌ Scan fehlgeschlagen:', error);
      }
      throw error;
    }
  }

  /**
   * Verbindet mit einem BLE-Gerät
   */
  async connect(deviceId = null, protocol = 'ELK_BLEDOM') {
    try {
      // Wenn kein Gerät vorhanden, scannen
      if (!this.device) {
        await this.scan(protocol);
      }

      if (!this.device) {
        throw new Error('Kein Gerät zum Verbinden vorhanden');
      }

      console.log('🔗 Verbinde mit', this.device.name);

      // GATT Server verbinden
      this.server = await this.device.gatt.connect();
      console.log('✅ GATT Server verbunden');

      // Service auswählen
      const serviceUUID = this.SERVICES[protocol] || this.SERVICES.ELK_BLEDOM;
      this.service = await this.server.getPrimaryService(serviceUUID);
      console.log('✅ Service gefunden');

      // Characteristic auswählen
      const charUUID = this.CHARACTERISTICS[protocol] || this.CHARACTERISTICS.ELK_BLEDOM;
      this.characteristic = await this.service.getCharacteristic(charUUID);
      console.log('✅ Characteristic gefunden');

      // Status setzen
      this.isConnected = true;
      this.protocol = protocol;
      this.deviceName = this.device.name;
      this.deviceId = this.device.id;

      // Disconnect Event
      this.device.addEventListener('gattserverdisconnected', () => {
        console.warn('⚠️ Gerät getrennt');
        this.isConnected = false;
        this.handleDisconnect();
      });

      console.log(`✅ Erfolgreich verbunden mit ${this.deviceName} (${protocol})`);
      return true;
    } catch (error) {
      console.error('❌ Verbindung fehlgeschlagen:', error);
      this.isConnected = false;
      
      // Benutzerfreundliche Fehlermeldung
      let errorMessage = 'Verbindung fehlgeschlagen. ';
      if (error.name === 'NotFoundError') {
        errorMessage += 'Gerät nicht gefunden.';
      } else if (error.name === 'NetworkError') {
        errorMessage += 'Netzwerkfehler - bitte näher an das Gerät gehen.';
      } else if (error.message && error.message.includes('GATT')) {
        errorMessage += 'GATT-Verbindung fehlgeschlagen - bitte Gerät neu starten.';
      } else {
        errorMessage += 'Bitte sicherstellen, dass das LED-Band eingeschaltet und in Reichweite ist.';
      }
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(errorMessage, 'error');
      }
      
      throw error;
    }
  }

  /**
   * Sendet einen Befehl an das Gerät
   */
  // ✅ ZUVERLÄSSIGE BEFEHLSÜBERTRAGUNG MIT RETRY-LOGIK
  async sendCommand(command, retries = 3) {
    if (!this.isConnected || !this.characteristic) {
      console.warn('⚠️ Nicht verbunden - Befehl wird ignoriert');
      return false;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Flood Protection
        const now = Date.now();
        const timeSinceLastCommand = now - this.lastCommandTime;
        if (timeSinceLastCommand < this.commandDelay) {
          await new Promise(resolve => setTimeout(resolve, this.commandDelay - timeSinceLastCommand));
        }

        // ✅ VERBINDUNG VOR JEDEM BEFEHL PRÜFEN
        if (!this.device.gatt.connected) {
          console.warn('⚠️ Verbindung verloren - versuche Wiederverbindung...');
          await this.reconnect();
        }

        // Befehl als Uint8Array
        const data = new Uint8Array(command);
        
        // ✅ BEFEHL MIT TIMEOUT SENDEN
        await Promise.race([
          this.characteristic.writeValue(data),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        this.lastCommandTime = Date.now();

        console.log(`📤 Befehl erfolgreich gesendet (Versuch ${attempt}):`, 
                   Array.from(data).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
        
        // ✅ BESTÄTIGUNG WARTEN (kurz)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return true;
        
      } catch (error) {
        console.error(`❌ Befehl senden fehlgeschlagen (Versuch ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          // Letzter Versuch fehlgeschlagen
          if (window.showGlobalNotification) {
            window.showGlobalNotification(`Befehl konnte nach ${retries} Versuchen nicht gesendet werden!`, 'error');
          }
          return false;
        } else {
          // Kurz warten vor nächstem Versuch
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        }
      }
    }
    
    return false;
  }

  // ✅ WIEDERVERBINDUNGS-FUNKTION
  async reconnect() {
    try {
      if (this.device && this.device.gatt) {
        this.server = await this.device.gatt.connect();
        this.service = await this.server.getPrimaryService(this.SERVICES[this.protocol]);
        this.characteristic = await this.service.getCharacteristic(this.CHARACTERISTICS[this.protocol]);
        console.log('✅ Wiederverbindung erfolgreich');
        return true;
      }
    } catch (error) {
      console.error('❌ Wiederverbindung fehlgeschlagen:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Setzt die LED-Farbe
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
   * Setzt die LED-Farbe (RGB)
   */
  async setColorRGB(r, g, b) {
    // Validate
    r = Math.max(0, Math.min(255, parseInt(r) || 0));
    g = Math.max(0, Math.min(255, parseInt(g) || 0));
    b = Math.max(0, Math.min(255, parseInt(b) || 0));

    const command = this.COMMANDS[this.protocol].COLOR(r, g, b);
    const result = await this.sendCommand(command);

    if (result) {
      console.log(`🎨 Farbe gesetzt: RGB(${r}, ${g}, ${b})`);
    }

    return result;
  }

  /**
   * Setzt die Helligkeit
   */
  async setBrightness(level) {
    // Validate (0-100)
    level = Math.max(0, Math.min(100, parseInt(level) || 0));
    
    // Convert to 0-255
    const brightnessValue = Math.round((level / 100) * 255);

    const command = this.COMMANDS[this.protocol].BRIGHTNESS(brightnessValue);
    const result = await this.sendCommand(command);

    if (result) {
      console.log(`💡 Helligkeit gesetzt: ${level}%`);
    }

    return result;
  }

  /**
   * Setzt einen LED-Effekt
   */
  async setEffect(effectId) {
    // Validate (0-255)
    effectId = Math.max(0, Math.min(255, parseInt(effectId) || 0));

    const command = this.COMMANDS[this.protocol].EFFECT(effectId);
    const result = await this.sendCommand(command);

    if (result) {
      console.log(`✨ Effekt ${effectId} aktiviert`);
    }

    return result;
  }

  /**
   * Schaltet LED ein/aus
   */
  async setPower(state) {
    const command = state
      ? this.COMMANDS[this.protocol].POWER_ON
      : this.COMMANDS[this.protocol].POWER_OFF;

    const result = await this.sendCommand(command);

    if (result) {
      console.log(`🔌 LED ${state ? 'EIN' : 'AUS'}geschaltet`);
    }

    return result;
  }

  /**
   * Musik-reaktive LED-Steuerung
   */
  async sendMusicFrame(deviceId, audioData) {
    if (!this.isConnected) {
      return false;
    }

    try {
      // ✅ ELK-BLEDOM FLOOD PROTECTION (aus LedMusicControl.html)
      if (this.deviceProtocol === 'ELK_BLEDOM') {
        // Begrenze Update-Rate für ELK-BLEDOM Geräte
        const now = Date.now();
        if (this.lastMusicFrameTime && (now - this.lastMusicFrameTime) < 50) {
          return true; // Skip Frame - zu schnell
        }
        this.lastMusicFrameTime = now;
      }

      // Audio-Daten zu Farbe konvertieren
      const bass = audioData.bass || 0;
      const mid = audioData.mid || 0;
      const treble = audioData.treble || 0;

      // Farbe basierend auf Frequenzen
      const r = Math.min(255, Math.floor(bass * 2));
      const g = Math.min(255, Math.floor(mid * 2));
      const b = Math.min(255, Math.floor(treble * 2));

      return await this.setColorRGB(r, g, b);
    } catch (error) {
      console.error('❌ Musik-Frame senden fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Setzt Audio-Sensitivität
   */
  async setAudioSensitivity(deviceId, sensitivity, protocol) {
    // Implementierung hängt vom Protokoll ab
    console.log(`🎚️ Audio-Sensitivität: ${sensitivity}`);
    return true;
  }

  /**
   * Stoppt Audio-Modus
   */
  async stopAudioMode(deviceId, protocol) {
    console.log('⏹️ Audio-Modus gestoppt');
    return true;
  }

  /**
   * Test-Sequenz
   */
  async runTestSequence() {
    if (!this.isConnected) {
      console.warn('⚠️ Nicht verbunden - Test abgebrochen');
      return false;
    }

    console.log('🧪 Starte Test-Sequenz...');

    try {
      // Rot
      await this.setColorRGB(255, 0, 0);
      await this.delay(500);

      // Grün
      await this.setColorRGB(0, 255, 0);
      await this.delay(500);

      // Blau
      await this.setColorRGB(0, 0, 255);
      await this.delay(500);

      // Weiß
      await this.setColorRGB(255, 255, 255);
      await this.delay(500);

      console.log('✅ Test-Sequenz abgeschlossen');
      return true;
    } catch (error) {
      console.error('❌ Test-Sequenz fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Trennt die Verbindung
   */
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
      console.log('🔌 Verbindung getrennt');
    }

    this.isConnected = false;
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
  }

  /**
   * Verbindungsstatus abrufen
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
   * Liste verbundener Geräte (für Kompatibilität)
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
   * Disconnect Handler
   */
  handleDisconnect() {
    console.log('🔌 Gerät wurde getrennt');
    this.isConnected = false;

    // Event an App senden
    if (window.updateGlobalBLEStatus) {
      window.updateGlobalBLEStatus();
    }
  }

  /**
   * Helper: Delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Hex zu RGB
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
   * Helper: RGB zu Hex
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, parseInt(x) || 0)).toString(16);
      return hex.padStart(2, '0');
    }).join('');
  }

  /**
   * Disconnect Handler mit Auto-Reconnect
   */
  handleDisconnect() {
    console.log('🔌 Gerät wurde getrennt');
    this.isConnected = false;

    // Benachrichtigung anzeigen
    if (window.showGlobalNotification) {
      window.showGlobalNotification('Verbindung unterbrochen', 'warning');
    }

    // Event an App senden
    if (window.updateGlobalBLEStatus) {
      window.updateGlobalBLEStatus();
    }
    
    // Auto-Reconnect starten
    if (window.handleBLEDisconnect && typeof window.handleBLEDisconnect === 'function') {
      window.handleBLEDisconnect();
    } else {
      this.attemptReconnect();
    }
  }

  /**
   * Versucht automatisch die Wiederverbindung
   */
  async attemptReconnect() {
    const maxAttempts = 3;
    const delay = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔄 Wiederverbindungsversuch ${attempt}/${maxAttempts}`);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`Wiederverbindung... (${attempt}/${maxAttempts})`, 'info');
      }

      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        if (this.device && this.device.gatt) {
          await this.connect(null, this.protocol);
          
          if (window.showGlobalNotification) {
            window.showGlobalNotification('Wiederverbindung erfolgreich!', 'success');
          }
          return true;
        }
      } catch (error) {
        console.warn(`❌ Versuch ${attempt} fehlgeschlagen:`, error);
      }
    }

    console.error('❌ Wiederverbindung fehlgeschlagen nach', maxAttempts, 'Versuchen');
    if (window.showGlobalNotification) {
      window.showGlobalNotification('Wiederverbindung fehlgeschlagen', 'error');
    }
    return false;
  }

  // ✅ WLED-FUNKTIONEN (WiFi-LEDs)
  
  /**
   * Scannt nach WLED-Geräten im lokalen Netzwerk
   */
  async scanWLEDDevices() {
    if (!this.wledEnabled) return [];
    
    console.log('🔍 Scanne nach WLED-Geräten...');
    const devices = [];
    
    // Typische WLED-IPs scannen (192.168.1.x)
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
      console.error('❌ WLED-Scan Fehler:', error);
    }
    
    this.wledDevices = devices;
    console.log(`✅ ${devices.length} WLED-Geräte gefunden`);
    return devices;
  }

  /**
   * Prüft ob IP ein WLED-Gerät ist
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
      // Timeout oder Netzwerk-Fehler - normal beim Scannen
    }
    
    return null;
  }

  /**
   * Sendet Farbe an WLED-Gerät
   */
  async sendColorToWLED(ip, r, g, b) {
    try {
      const response = await fetch(`http://${ip}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          bri: 255,
          seg: [{
            col: [[r, g, b]]
          }]
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error(`❌ WLED-Farbe senden fehlgeschlagen (${ip}):`, error);
      return false;
    }
  }

  /**
   * Aktiviert/Deaktiviert WLED-Integration
   */
  setWLEDEnabled(enabled) {
    this.wledEnabled = enabled;
    console.log(`🌐 WLED-Integration ${enabled ? 'aktiviert' : 'deaktiviert'}`);
  }
}

// ===================================================================
// GLOBALE INSTANZ ERSTELLEN
// ===================================================================

// Controller global verfügbar machen
window.ledController = new BLEController();
// ✅ BEIDE Namen für Kompatibilität
window.bleController = window.ledController;

// AppBLE-Objekt für Kompatibilität
window.AppBLE = {
  active: true,
  controller: window.ledController
};

console.log('✅ BLE-Controller global verfügbar als window.ledController UND window.bleController');

// ===================================================================
// AUTO-RECONNECT (OPTIONAL)
// ===================================================================

// Automatisch mit gespeicherten Geräten verbinden
window.addEventListener('load', async function() {
  try {
    const savedDevices = localStorage.getItem('led-devices');
    if (savedDevices) {
      const devices = JSON.parse(savedDevices);
      for (const device of devices) {
        if (device.autoConnect) {
          console.log('🔄 Auto-Connect:', device.name);
          try {
            await window.ledController.connect(device.id, device.protocol);
          } catch (error) {
            console.warn('Auto-Connect fehlgeschlagen:', error);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Auto-Connect Fehler:', error);
  }
});

// ===================================================================
// DEBUG-FUNKTIONEN (Konsole)
// ===================================================================

window.bleDebug = {
  scan: () => window.ledController.scan(),
  connect: () => window.ledController.connect(),
  disconnect: () => window.ledController.disconnect(),
  red: () => window.ledController.setColorRGB(255, 0, 0),
  green: () => window.ledController.setColorRGB(0, 255, 0),
  blue: () => window.ledController.setColorRGB(0, 0, 255),
  white: () => window.ledController.setColorRGB(255, 255, 255),
  off: () => window.ledController.setPower(false),
  on: () => window.ledController.setPower(true),
  test: () => window.ledController.runTestSequence(),
  status: () => console.table(window.ledController.getConnectionStatus())
};

console.log('🐛 Debug-Funktionen verfügbar: window.bleDebug');
console.log('   Beispiel: bleDebug.scan() | bleDebug.red() | bleDebug.test()');

// ===================================================================
// EXPORT (für Module)
// ===================================================================

// Browser-kompatible Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BLEController;
} else if (typeof window !== 'undefined') {
  window.BLEController = BLEController;
}