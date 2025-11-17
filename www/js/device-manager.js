/**
 * ===================================================================
 * DEVICE-MANAGER.JS
 * Geräteverwaltung für Lights Space World App
 * Version: 1.0
 * Datum: 2025-10-08
 * ===================================================================
 * 
 * Funktionen:
 * - BLE-Geräte scannen und verbinden
 * - Geräte umbenennen
 * - Protokoll pro Gerät speichern
 * - Auto-Connect-Einstellungen
 * - Gerätegruppen verwalten
 * - Signalstärke anzeigen
 * - Verbindungs-Historie
 * 
 * Abhängigkeiten:
 * - window.ledController (BLE-Controller)
 * - localStorage (Persistierung)
 * 
 * ===================================================================
 */

'use strict';

// ===================================================================
// KONFIGURATION
// ===================================================================

const DEVICE_CONFIG = {
  // Storage
  STORAGE_KEY: 'led-devices',
  HISTORY_KEY: 'device-connection-history',
  GROUPS_KEY: 'device-groups',
  
  // Protokolle mit Hardware-Commands
  PROTOCOLS: [
    { 
      id: 'ELK_BLEDOM', 
      name: 'ELK-BLEDOM (Standard)', 
      description: 'Für ELK-BLEDOM LED-Streifen',
      commands: {
        on: [0x7E, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0xEF],
        off: [0x7E, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0xEF],
        color: (r, g, b) => [0x7E, 0x00, 0x05, r, g, b, 0x00, 0xEF],
        brightness: (val) => [0x7E, 0x00, 0x0E, val, 0x00, 0x00, 0x00, 0xEF]
      }
    },
    { 
      id: 'GENERIC', 
      name: 'Generic BLE LED', 
      description: 'Für generische BLE-LED-Controller',
      commands: {
        on: [0x01, 0xFF],
        off: [0x01, 0x00],
        color: (r, g, b) => [0x02, r, g, b],
        brightness: (val) => [0x03, val]
      }
    }
  ],
  
  // Signalstärke
  RSSI_EXCELLENT: -50,
  RSSI_GOOD: -70,
  RSSI_FAIR: -80,
  RSSI_POOR: -90,
  
  // Auto-Reconnect
  RECONNECT_TIMEOUT: 5000,
  MAX_RECONNECT_ATTEMPTS: 3
};

// ===================================================================
// DEVICE-OBJEKT STRUKTUR
// ===================================================================

/**
 * Device-Objekt:
 * {
 *   id: string,              // Eindeutige ID (MAC oder UUID)
 *   name: string,            // Benutzerdefinierter Name
 *   originalName: string,    // Original-Gerätename
 *   mac: string,             // MAC-Adresse
 *   protocol: string,        // 'ELK_BLEDOM' oder 'GENERIC'
 *   autoConnect: boolean,    // Auto-Connect aktiviert?
 *   group: string,           // Gruppen-ID
 *   favorite: boolean,       // Favorit?
 *   rssi: number,            // Signalstärke
 *   lastConnected: number,   // Letzter Connect-Timestamp
 *   connectionCount: number, // Anzahl Verbindungen
 *   notes: string,           // Notizen
 *   createdAt: number,       // Erstellt am
 *   updatedAt: number        // Aktualisiert am
 * }
 */

// ===================================================================
// DEVICE-MANAGER KLASSE
// ===================================================================

class DeviceManager {
  constructor() {
    this.devices = [];
    this.groups = [];
    this.connectionHistory = [];
    this.currentDevice = null;
    this.isScanning = false;
    
    this.init();
  }

  /**
   * Initialisiert Device Manager
   */
  init() {
    // Gespeicherte Geräte laden
    this.loadDevices();
    this.loadGroups();
    this.loadHistory();
    
    console.log('✅ Device Manager initialisiert');
  }

  // ===================================================================
  // GERÄTE-VERWALTUNG
  // ===================================================================

  /**
   * Scannt nach BLE-Geräten
   */
  async scanForDevices() {
    if (!window.ledController) {
      throw new Error('BLE-Controller nicht verfügbar');
    }

    if (this.isScanning) {
      throw new Error('Scan läuft bereits');
    }

    try {
      this.isScanning = true;
      
      console.log('🔍 Scanne nach BLE-Geräten...');
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Suche nach Geräten...', 'info', 3000);
      }

      // BLE-Scan durchführen
      const device = await window.ledController.scan();
      
      if (device) {
        // Prüfen ob Gerät bereits bekannt
        const existingDevice = this.getDeviceById(device.id);
        
        if (existingDevice) {
          console.log('✅ Bekanntes Gerät gefunden:', existingDevice.name);
          
          if (window.showGlobalNotification) {
            window.showGlobalNotification(`Gerät gefunden: ${existingDevice.name}`, 'success');
          }
          
          return existingDevice;
        } else {
          // Neues Gerät
          const newDevice = {
            id: device.id,
            name: device.name,
            originalName: device.name,
            mac: device.id,
            protocol: 'ELK_BLEDOM', // Standard
            autoConnect: false,
            group: null,
            favorite: false,
            rssi: null,
            lastConnected: null,
            connectionCount: 0,
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          this.addDevice(newDevice);
          
          console.log('✅ Neues Gerät hinzugefügt:', newDevice.name);
          
          if (window.showGlobalNotification) {
            window.showGlobalNotification(`Neues Gerät: ${newDevice.name}`, 'success');
          }
          
          return newDevice;
        }
      }

    } catch (error) {
      console.error('❌ Scan fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        if (error.name === 'NotFoundError') {
          window.showGlobalNotification('Keine Geräte gefunden oder Auswahl abgebrochen', 'warning');
        } else {
          window.showGlobalNotification('Scan fehlgeschlagen', 'error');
        }
      }
      
      throw error;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Verbindet mit Gerät
   */
  async connectToDevice(deviceId, protocol = null) {
    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Gerät nicht gefunden');
    }

    if (!window.ledController) {
      throw new Error('BLE-Controller nicht verfügbar');
    }

    try {
      console.log('🔗 Verbinde mit', device.name);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`Verbinde mit ${device.name}...`, 'info', 2000);
      }

      // Protokoll verwenden (falls angegeben, sonst gespeichertes)
      const useProtocol = protocol || device.protocol || 'ELK_BLEDOM';

      // ✅ ECHTE HARDWARE-VERBINDUNG MIT BLUETOOTH
      let success = false;
      
      // Versuche direkte BLE-Verbindung
      if (navigator.bluetooth) {
        try {
          const bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: device.name }],
            optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
          });
          
          const server = await bleDevice.gatt.connect();
          const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
          const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
          
          // Speichere Hardware-Verbindung
          device.hardwareConnection = {
            device: bleDevice,
            server: server,
            service: service,
            characteristic: characteristic,
            protocol: useProtocol
          };
          
          // ✅ SENDE TEST-BEFEHL AN HARDWARE
          const protocol = DEVICE_CONFIG.PROTOCOLS.find(p => p.id === useProtocol);
          if (protocol && protocol.commands.on) {
            const cmd = new Uint8Array(protocol.commands.on);
            await characteristic.writeValue(cmd);
          }
          
          success = true;
        } catch (error) {
          console.error('Direkte BLE-Verbindung fehlgeschlagen:', error);
        }
      }
      
      // Fallback auf alten Controller
      if (!success && window.ledController) {
        success = await window.ledController.connect(device.id, useProtocol);
      }

      if (success) {
        // Device-Info aktualisieren
        device.lastConnected = Date.now();
        device.connectionCount++;
        device.updatedAt = Date.now();
        
        this.currentDevice = device;
        this.saveDevices();
        
        // Historie hinzufügen
        this.addToHistory(device, 'connected');

        console.log('✅ Verbunden mit', device.name);
        
        if (window.showGlobalNotification) {
          window.showGlobalNotification(`Verbunden mit ${device.name}`, 'success');
        }
        
        // Event dispatchen
        this.dispatchEvent('device-connected', device);
        
        return true;
      } else {
        throw new Error('Verbindung fehlgeschlagen');
      }

    } catch (error) {
      console.error('❌ Verbindung fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`Verbindung zu ${device.name} fehlgeschlagen`, 'error');
      }
      
      this.addToHistory(device, 'failed');
      
      throw error;
    }
  }

  /**
   * ✅ HARDWARE-BEFEHLE SENDEN
   */
  async sendHardwareCommand(command, data = null) {
    if (!this.currentDevice || !this.currentDevice.hardwareConnection) {
      throw new Error('Keine Hardware-Verbindung');
    }
    
    const { characteristic, protocol } = this.currentDevice.hardwareConnection;
    const protocolConfig = DEVICE_CONFIG.PROTOCOLS.find(p => p.id === protocol);
    
    if (!protocolConfig) {
      throw new Error('Protokoll nicht gefunden');
    }
    
    let cmd;
    switch (command) {
      case 'color':
        if (data && data.r !== undefined && data.g !== undefined && data.b !== undefined) {
          cmd = new Uint8Array(protocolConfig.commands.color(data.r, data.g, data.b));
        }
        break;
      case 'brightness':
        if (data && data.value !== undefined) {
          cmd = new Uint8Array(protocolConfig.commands.brightness(data.value));
        }
        break;
      case 'on':
        cmd = new Uint8Array(protocolConfig.commands.on);
        break;
      case 'off':
        cmd = new Uint8Array(protocolConfig.commands.off);
        break;
      default:
        throw new Error('Unbekannter Befehl: ' + command);
    }
    
    if (cmd) {
      await characteristic.writeValue(cmd);
      console.log(`✅ Hardware-Befehl gesendet: ${command}`, data);
      return true;
    }
    
    return false;
  }
  
  /**
   * ✅ FARBE AN HARDWARE SENDEN
   */
  async setDeviceColor(r, g, b) {
    return this.sendHardwareCommand('color', { r, g, b });
  }
  
  /**
   * ✅ HELLIGKEIT AN HARDWARE SENDEN
   */
  async setDeviceBrightness(value) {
    return this.sendHardwareCommand('brightness', { value });
  }
  
  /**
   * ✅ GERÄT EIN/AUSSCHALTEN
   */
  async setDevicePower(on) {
    return this.sendHardwareCommand(on ? 'on' : 'off');
  }
  
  /**
   * Trennt Verbindung
   */
  async disconnectDevice() {
    if (!window.ledController) return;

    try {
      window.ledController.disconnect();
      
      if (this.currentDevice) {
        this.addToHistory(this.currentDevice, 'disconnected');
      }
      
      this.currentDevice = null;

      console.log('🔌 Gerät getrennt');
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Gerät getrennt', 'info');
      }
      
      // Event dispatchen
      this.dispatchEvent('device-disconnected');

    } catch (error) {
      console.error('Fehler beim Trennen:', error);
    }
  }

  /**
   * Fügt Gerät hinzu
   */
  addDevice(device) {
    // Prüfen ob bereits vorhanden
    const exists = this.devices.some(d => d.id === device.id);
    
    if (exists) {
      console.warn('Gerät existiert bereits:', device.id);
      return false;
    }

    this.devices.push(device);
    this.saveDevices();
    
    console.log('✅ Gerät hinzugefügt:', device.name);
    
    // Event dispatchen
    this.dispatchEvent('device-added', device);
    
    return true;
  }

  /**
   * Aktualisiert Gerät
   */
  updateDevice(deviceId, updates) {
    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      console.error('Gerät nicht gefunden:', deviceId);
      return false;
    }

    // Updates anwenden
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && updates[key] !== undefined) {
        device[key] = updates[key];
      }
    });

    device.updatedAt = Date.now();
    this.saveDevices();

    console.log('✅ Gerät aktualisiert:', device.name);
    
    // Event dispatchen
    this.dispatchEvent('device-updated', device);
    
    return true;
  }

  /**
   * Benennt Gerät um
   */
  renameDevice(deviceId, newName) {
    if (!newName || newName.trim() === '') {
      throw new Error('Name darf nicht leer sein');
    }

    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Gerät nicht gefunden');
    }

    const oldName = device.name;
    device.name = newName.trim();
    device.updatedAt = Date.now();
    
    this.saveDevices();

    console.log(`✅ Gerät umbenannt: ${oldName} → ${device.name}`);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Gerät umbenannt: ${device.name}`, 'success');
    }
    
    // Event dispatchen
    this.dispatchEvent('device-renamed', { device, oldName, newName });
    
    return true;
  }

  /**
   * Setzt Protokoll für Gerät
   */
  setDeviceProtocol(deviceId, protocol) {
    const validProtocols = DEVICE_CONFIG.PROTOCOLS.map(p => p.id);
    
    if (!validProtocols.includes(protocol)) {
      throw new Error('Ungültiges Protokoll');
    }

    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Gerät nicht gefunden');
    }

    device.protocol = protocol;
    device.updatedAt = Date.now();
    
    this.saveDevices();

    console.log(`✅ Protokoll gesetzt: ${device.name} → ${protocol}`);
    
    if (window.showGlobalNotification) {
      const protocolName = DEVICE_CONFIG.PROTOCOLS.find(p => p.id === protocol)?.name;
      window.showGlobalNotification(`Protokoll gesetzt: ${protocolName}`, 'success');
    }
    
    return true;
  }

  /**
   * Toggle Auto-Connect
   */
  toggleAutoConnect(deviceId) {
    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Gerät nicht gefunden');
    }

    device.autoConnect = !device.autoConnect;
    device.updatedAt = Date.now();
    
    this.saveDevices();

    console.log(`✅ Auto-Connect ${device.autoConnect ? 'aktiviert' : 'deaktiviert'}: ${device.name}`);
    
    return device.autoConnect;
  }

  /**
   * Toggle Favorit
   */
  toggleFavorite(deviceId) {
    const device = this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Gerät nicht gefunden');
    }

    device.favorite = !device.favorite;
    device.updatedAt = Date.now();
    
    this.saveDevices();

    console.log(`${device.favorite ? '⭐' : '☆'} Favorit ${device.favorite ? 'hinzugefügt' : 'entfernt'}: ${device.name}`);
    
    return device.favorite;
  }

  /**
   * Löscht Gerät
   */
  deleteDevice(deviceId) {
    const index = this.devices.findIndex(d => d.id === deviceId);
    
    if (index === -1) {
      throw new Error('Gerät nicht gefunden');
    }

    const device = this.devices[index];
    
    // Bestätigung
    const confirmed = confirm(`Wirklich "${device.name}" löschen?\nDies kann nicht rückgängig gemacht werden.`);
    
    if (!confirmed) return false;

    this.devices.splice(index, 1);
    this.saveDevices();

    console.log('🗑️ Gerät gelöscht:', device.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Gerät "${device.name}" gelöscht`, 'info');
    }
    
    // Event dispatchen
    this.dispatchEvent('device-deleted', device);
    
    return true;
  }

  /**
   * Gibt Gerät zurück
   */
  getDeviceById(deviceId) {
    return this.devices.find(d => d.id === deviceId) || null;
  }

  /**
   * Gibt alle Geräte zurück
   */
  getAllDevices() {
    return [...this.devices];
  }

  /**
   * Gibt Favoriten zurück
   */
  getFavoriteDevices() {
    return this.devices.filter(d => d.favorite);
  }

  /**
   * Gibt Auto-Connect Geräte zurück
   */
  getAutoConnectDevices() {
    return this.devices.filter(d => d.autoConnect);
  }

  // ===================================================================
  // GRUPPEN-VERWALTUNG
  // ===================================================================

  /**
   * Erstellt neue Gruppe (mit hierarchischer Unterstützung)
   */
  createGroup(name, description = '', parentGroupId = null) {
    if (!name || name.trim().length === 0) {
      throw new Error('Gruppenname darf nicht leer sein');
    }

    // ✅ HIERARCHISCHE GRUPPEN-UNTERSTÜTZUNG
    const group = {
      id: this.generateId(),
      name: name.trim(),
      description: description,
      devices: [],
      parentGroup: parentGroupId, // ✅ Übergeordnete Gruppe
      subGroups: [], // ✅ Untergruppen
      level: parentGroupId ? this.getGroupLevel(parentGroupId) + 1 : 0, // ✅ Hierarchie-Level
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Zu Übergruppe hinzufügen falls vorhanden
    if (parentGroupId) {
      const parentGroup = this.groups.find(g => g.id === parentGroupId);
      if (parentGroup) {
        parentGroup.subGroups.push(group.id);
        parentGroup.updatedAt = Date.now();
      }
    }

    this.groups.push(group);
    this.saveGroups();

    console.log('✅ Gruppe erstellt:', group.name, parentGroupId ? `(Untergruppe von ${parentGroupId})` : '(Hauptgruppe)');
    
    return group;
  }

  /**
   * Gibt Hierarchie-Level einer Gruppe zurück
   */
  getGroupLevel(groupId) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group || !group.parentGroup) return 0;
    return this.getGroupLevel(group.parentGroup) + 1;
  }

  /**
   * Gibt alle Untergruppen einer Gruppe zurück
   */
  getSubGroups(groupId) {
    return this.groups.filter(g => g.parentGroup === groupId);
  }

  /**
   * Gibt Hauptgruppen zurück (ohne Übergruppe)
   */
  getMainGroups() {
    return this.groups.filter(g => !g.parentGroup);
  }

  /**
   * Fügt Gerät zu Gruppe hinzu
   */
  addDeviceToGroup(deviceId, groupId) {
    const device = this.getDeviceById(deviceId);
    const group = this.groups.find(g => g.id === groupId);
    

    if (!device) throw new Error('Gerät nicht gefunden');
    if (!group) throw new Error('Gruppe nicht gefunden');

    // Aus alter Gruppe entfernen
    if (device.group) {
      const oldGroup = this.groups.find(g => g.id === device.group);
      if (oldGroup) {
        oldGroup.devices = oldGroup.devices.filter(id => id !== deviceId);
      }
    }

    // Zu neuer Gruppe hinzufügen
    device.group = groupId;
    
    if (!group.devices.includes(deviceId)) {
      group.devices.push(deviceId);
    }

    group.updatedAt = Date.now();
    device.updatedAt = Date.now();

    this.saveDevices();
    this.saveGroups();

    console.log(`✅ Gerät "${device.name}" zu Gruppe "${group.name}" hinzugefügt`);
    
    return true;
  }

  /**
   * Entfernt Gerät aus Gruppe
   */
  removeDeviceFromGroup(deviceId) {
    const device = this.getDeviceById(deviceId);
    
    if (!device || !device.group) return false;

    const group = this.groups.find(g => g.id === device.group);
    
    if (group) {
      group.devices = group.devices.filter(id => id !== deviceId);
      group.updatedAt = Date.now();
    }

    device.group = null;
    device.updatedAt = Date.now();

    this.saveDevices();
    this.saveGroups();

    console.log(`✅ Gerät "${device.name}" aus Gruppe entfernt`);
    
    return true;
  }

  /**
   * Gibt Geräte einer Gruppe zurück
   */
  getDevicesByGroup(groupId) {
    return this.devices.filter(d => d.group === groupId);
  }

  /**
   * Löscht Gruppe
   */
  deleteGroup(groupId) {
    const index = this.groups.findIndex(g => g.id === groupId);
    
    if (index === -1) throw new Error('Gruppe nicht gefunden');

    const group = this.groups[index];
    
    // Geräte aus Gruppe entfernen
    this.devices.forEach(device => {
      if (device.group === groupId) {
        device.group = null;
      }
    });

    this.groups.splice(index, 1);
    
    this.saveDevices();
    this.saveGroups();

    console.log('🗑️ Gruppe gelöscht:', group.name);
    
    return true;
  }

  // ===================================================================
  // HISTORIE
  // ===================================================================

  /**
   * Fügt Eintrag zur Historie hinzu
   */
  addToHistory(device, action) {
    const entry = {
      deviceId: device.id,
      deviceName: device.name,
      action: action, // 'connected', 'disconnected', 'failed'
      timestamp: Date.now()
    };

    this.connectionHistory.unshift(entry);

    // Maximal 100 Einträge behalten
    if (this.connectionHistory.length > 100) {
      this.connectionHistory = this.connectionHistory.slice(0, 100);
    }

    this.saveHistory();
  }

  /**
   * Gibt Historie zurück
   */
  getHistory(limit = 20) {
    return this.connectionHistory.slice(0, limit);
  }

  /**
   * Gibt Historie für Gerät zurück
   */
  getDeviceHistory(deviceId, limit = 10) {
    return this.connectionHistory
      .filter(entry => entry.deviceId === deviceId)
      .slice(0, limit);
  }

  /**
   * Löscht Historie
   */
  clearHistory() {
    this.connectionHistory = [];
    this.saveHistory();
    
    console.log('🗑️ Historie gelöscht');
    
    return true;
  }

  // ===================================================================
  // SIGNALSTÄRKE
  // ===================================================================

  /**
   * Gibt Signalstärke-Level zurück
   */
  getRSSILevel(rssi) {
    if (!rssi) return 'unknown';
    
    if (rssi >= DEVICE_CONFIG.RSSI_EXCELLENT) return 'excellent';
    if (rssi >= DEVICE_CONFIG.RSSI_GOOD) return 'good';
    if (rssi >= DEVICE_CONFIG.RSSI_FAIR) return 'fair';
    if (rssi >= DEVICE_CONFIG.RSSI_POOR) return 'poor';
    
    return 'weak';
  }

  /**
   * Gibt Signalstärke-Icon zurück
   */
  getRSSIIcon(rssi) {
    const level = this.getRSSILevel(rssi);
    
    const icons = {
      excellent: '📶',
      good: '📶',
      fair: '📶',
      poor: '📶',
      weak: '📶',
      unknown: '❓'
    };
    
    return icons[level] || icons.unknown;
  }

  // ===================================================================
  // SPEICHERN & LADEN
  // ===================================================================

  /**
   * Speichert Geräte
   */
  saveDevices() {
    try {
      localStorage.setItem(DEVICE_CONFIG.STORAGE_KEY, JSON.stringify(this.devices));
      console.log('💾 Geräte gespeichert:', this.devices.length);
    } catch (error) {
      console.error('Fehler beim Speichern der Geräte:', error);
    }
  }

  /**
   * Lädt Geräte
   */
  loadDevices() {
    try {
      const saved = localStorage.getItem(DEVICE_CONFIG.STORAGE_KEY);
      
      if (saved) {
        this.devices = JSON.parse(saved);
        console.log('📂 Geräte geladen:', this.devices.length);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Geräte:', error);
      this.devices = [];
    }
  }

  /**
   * Speichert Gruppen
   */
  saveGroups() {
    try {
      localStorage.setItem(DEVICE_CONFIG.GROUPS_KEY, JSON.stringify(this.groups));
    } catch (error) {
      console.error('Fehler beim Speichern der Gruppen:', error);
    }
  }

  /**
   * Lädt Gruppen
   */
  loadGroups() {
    try {
      const saved = localStorage.getItem(DEVICE_CONFIG.GROUPS_KEY);
      
      if (saved) {
        this.groups = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen:', error);
      this.groups = [];
    }
  }

  /**
   * Speichert Historie
   */
  saveHistory() {
    try {
      localStorage.setItem(DEVICE_CONFIG.HISTORY_KEY, JSON.stringify(this.connectionHistory));
    } catch (error) {
      console.error('Fehler beim Speichern der Historie:', error);
    }
  }

  /**
   * Lädt Historie
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(DEVICE_CONFIG.HISTORY_KEY);
      
      if (saved) {
        this.connectionHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Historie:', error);
      this.connectionHistory = [];
    }
  }

  // ===================================================================
  // HELPER
  // ===================================================================

  /**
   * Generiert ID
   */
  generateId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Dispatched Event
   */
  dispatchEvent(eventName, detail = null) {
    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }

  /**
   * Gibt Statistiken zurück
   */
  getStatistics() {
    return {
      totalDevices: this.devices.length,
      favoriteDevices: this.devices.filter(d => d.favorite).length,
      autoConnectDevices: this.devices.filter(d => d.autoConnect).length,
      totalGroups: this.groups.length,
      totalConnections: this.devices.reduce((sum, d) => sum + d.connectionCount, 0),
      lastConnection: this.connectionHistory[0]?.timestamp || null
    };
  }
}

// ===================================================================
// GLOBALE INSTANZ
// ===================================================================

// Device Manager global verfügbar machen
window.DeviceManager = DeviceManager;
window.deviceManager = new DeviceManager();

console.log('✅ Device Manager global verfügbar als window.deviceManager');

// ===================================================================
// EVENT-LISTENER
// ===================================================================

// Device-Events abfangen
window.addEventListener('device-connected', (e) => {
  console.log('🔗 Gerät verbunden:', e.detail.name);
});

window.addEventListener('device-disconnected', () => {
  console.log('🔌 Gerät getrennt');
});

// ===================================================================
// EXPORT
// ===================================================================

// Browser-kompatible Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeviceManager;
} else if (typeof window !== 'undefined') {
  window.DeviceManager = DeviceManager;
}
