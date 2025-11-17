/**
 * ===================================================================
 * CAPACITOR-BRIDGE.JS
 * Browser/Native Kompatibilitätsschicht
 * Version: 1.0
 * Datum: 2025-11-17
 * ===================================================================
 *
 * Funktionen:
 * - Automatische Erkennung von Browser vs. Native App
 * - Einheitliche API für Dateizugriff
 * - Fallback-Mechanismen
 * - Capacitor Plugin Integration
 *
 * ===================================================================
 */

'use strict';

// ===================================================================
// CAPACITOR DETECTION
// ===================================================================

class CapacitorBridge {
  constructor() {
    this.isNative = false;
    this.platform = 'web';
    this.plugins = {};

    this.init();
  }

  /**
   * Initialisiert die Bridge
   */
  async init() {
    // Prüfe ob Capacitor verfügbar ist
    if (window.Capacitor) {
      this.isNative = window.Capacitor.isNativePlatform();
      this.platform = window.Capacitor.getPlatform();

      // Lade Plugins
      if (this.isNative) {
        await this.loadPlugins();
      }

      console.log(`✅ Capacitor Bridge initialisiert: ${this.platform} (Native: ${this.isNative})`);
    } else {
      console.log('🌐 Browser-Modus (kein Capacitor)');
    }
  }

  /**
   * Lädt Capacitor Plugins
   */
  async loadPlugins() {
    try {
      const {
        Filesystem
      } = await import('@capacitor/filesystem');
      const {
        App
      } = await import('@capacitor/app');
      const {
        SplashScreen
      } = await import('@capacitor/splash-screen');
      const {
        StatusBar
      } = await import('@capacitor/status-bar');

      this.plugins = {
        Filesystem,
        App,
        SplashScreen,
        StatusBar
      };

      console.log('✅ Capacitor Plugins geladen');
    } catch (error) {
      console.warn('⚠️ Capacitor Plugins konnten nicht geladen werden:', error);
    }
  }

  /**
   * Gibt Plattform-Info zurück
   */
  getPlatformInfo() {
    return {
      isNative: this.isNative,
      platform: this.platform,
      isBrowser: !this.isNative,
      isAndroid: this.platform === 'android',
      isIOS: this.platform === 'ios'
    };
  }
}

// ===================================================================
// FILE SYSTEM BRIDGE
// ===================================================================

class FileSystemBridge {
  constructor(capacitorBridge) {
    this.bridge = capacitorBridge;
  }

  /**
   * Fordert Ordner-Zugriff an (Browser oder Native)
   */
  async requestDirectoryAccess() {
    if (this.bridge.isNative) {
      return await this.requestNativeDirectoryAccess();
    } else {
      return await this.requestBrowserDirectoryAccess();
    }
  }

  /**
   * Native Android Ordner-Zugriff
   */
  async requestNativeDirectoryAccess() {
    try {
      const {
        Filesystem
      } = this.bridge.plugins;

      // Fordere Berechtigung an
      const permission = await Filesystem.requestPermissions();

      if (permission.publicStorage === 'granted') {
        console.log('✅ Native Dateisystem-Berechtigung erteilt');
        return {
          granted: true,
          type: 'native',
          api: 'capacitor'
        };
      } else {
        throw new Error('Berechtigung verweigert');
      }
    } catch (error) {
      console.error('❌ Native Dateizugriff fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Browser File System Access API
   */
  async requestBrowserDirectoryAccess() {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('File System Access API nicht unterstützt');
    }

    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'music'
      });

      console.log('✅ Browser Ordner-Zugriff gewährt');
      return {
        granted: true,
        type: 'browser',
        api: 'file-system-access',
        handle: dirHandle
      };
    } catch (error) {
      console.error('❌ Browser Ordner-Zugriff fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Liest Verzeichnis-Inhalt
   */
  async readDirectory(path) {
    if (this.bridge.isNative) {
      return await this.readNativeDirectory(path);
    } else {
      return await this.readBrowserDirectory(path);
    }
  }

  /**
   * Native Verzeichnis lesen
   */
  async readNativeDirectory(path) {
    try {
      const {
        Filesystem,
        Directory
      } = this.bridge.plugins.Filesystem;

      const result = await Filesystem.readdir({
        path: path || 'Music',
        directory: Directory.ExternalStorage
      });

      return result.files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        path: `${path}/${file.name}`
      }));
    } catch (error) {
      console.error('❌ Native Verzeichnis lesen fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Browser Verzeichnis lesen
   */
  async readBrowserDirectory(dirHandle) {
    const files = [];

    try {
      for await (const entry of dirHandle.values()) {
        files.push({
          name: entry.name,
          kind: entry.kind,
          handle: entry
        });
      }

      return files;
    } catch (error) {
      console.error('❌ Browser Verzeichnis lesen fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Liest Datei-Inhalt
   */
  async readFile(filePath) {
    if (this.bridge.isNative) {
      return await this.readNativeFile(filePath);
    } else {
      return await this.readBrowserFile(filePath);
    }
  }

  /**
   * Native Datei lesen
   */
  async readNativeFile(filePath) {
    try {
      const {
        Filesystem,
        Directory
      } = this.bridge.plugins.Filesystem;

      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.ExternalStorage
      });

      return result.data;
    } catch (error) {
      console.error('❌ Native Datei lesen fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Browser Datei lesen
   */
  async readBrowserFile(fileHandle) {
    try {
      const file = await fileHandle.getFile();
      return file;
    } catch (error) {
      console.error('❌ Browser Datei lesen fehlgeschlagen:', error);
      throw error;
    }
  }
}

// ===================================================================
// GLOBAL EXPORT
// ===================================================================

// Initialisiere Bridge beim Laden
const capacitorBridge = new CapacitorBridge();
const fileSystemBridge = new FileSystemBridge(capacitorBridge);

// Exportiere global
window.CapacitorBridge = capacitorBridge;
window.FileSystemBridge = fileSystemBridge;

// Warte auf Capacitor-Initialisierung
document.addEventListener('DOMContentLoaded', async () => {
  await capacitorBridge.init();

  // Zeige Plattform-Info
  const info = capacitorBridge.getPlatformInfo();
  console.log('📱 Plattform:', info);

  // Verstecke SplashScreen (nur Native)
  if (info.isNative && capacitorBridge.plugins.SplashScreen) {
    setTimeout(() => {
      capacitorBridge.plugins.SplashScreen.hide();
    }, 1000);
  }
});

console.log('✅ Capacitor Bridge geladen');
