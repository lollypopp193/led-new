/**
 * ===================================================================
 * SCENES-MANAGER.JS
 * Szenen-Verwaltung für Lights Space World App
 * Version: 1.0
 * Datum: 2025-10-08
 * ===================================================================
 * 
 * Funktionen:
 * - Szenen erstellen (Kombination aus Farbe + Effekt + Helligkeit)
 * - Szenen speichern und laden
 * - Szenen aktivieren
 * - Szenen löschen
 * - Preset-Verwaltung
 * - Favoriten-System
 * - Import/Export von Szenen
 * 
 * Abhängigkeiten:
 * - window.ledController (BLE-Controller)
 * - localStorage (Persistierung)
 * 
 * ===================================================================
 */

'use strict';

// ===================================================================
// SZENEN-DATENSTRUKTUR
// ===================================================================

/**
 * Szene-Objekt Struktur:
 * {
 *   id: string,              // Eindeutige ID
 *   name: string,            // Benutzer-Name
 *   description: string,     // Beschreibung
 *   color: {
 *     r: number,             // Rot (0-255)
 *     g: number,             // Grün (0-255)
 *     b: number              // Blau (0-255)
 *   },
 *   effect: number,          // Effekt-ID (0-255)
 *   brightness: number,      // Helligkeit (0-100)
 *   speed: number,           // Geschwindigkeit (0-100)
 *   devices: string[],       // Ziel-Geräte IDs
 *   favorite: boolean,       // Favorit?
 *   category: string,        // Kategorie
 *   tags: string[],          // Tags
 *   thumbnail: string,       // Base64 Thumbnail
 *   createdAt: number,       // Timestamp
 *   updatedAt: number        // Timestamp
 * }
 */

// ===================================================================
// SZENEN-MANAGER KLASSE
// ===================================================================

class ScenesManager {
  constructor() {
    this.scenes = [];
    this.currentScene = null;
    this.storageKey = 'saved-scenes';
    this.favoritesKey = 'favorite-scenes';
    this.presetsKey = 'scene-presets';
    
    // Standard-Kategorien
    this.categories = [
      'Entspannung',
      'Party',
      'Arbeit',
      'Lesen',
      'Schlafen',
      'Romantisch',
      'Gaming',
      'Filme',
      'Custom'
    ];
    
    // Szenen laden
    this.loadScenes();
    
    console.log('✅ Szenen-Manager initialisiert');
  }

  // ===================================================================
  // SZENEN ERSTELLEN & VERWALTEN
  // ===================================================================

  /**
   * Erstellt eine neue Szene
   * @param {Object} sceneData - Szenen-Daten
   * @returns {Object} - Erstellte Szene
   */
  createScene(sceneData) {
    const scene = {
      id: this.generateId(),
      name: sceneData.name || 'Neue Szene',
      description: sceneData.description || '',
      color: {
        r: this.validateValue(sceneData.color?.r, 0, 255, 255),
        g: this.validateValue(sceneData.color?.g, 0, 255, 255),
        b: this.validateValue(sceneData.color?.b, 0, 255, 255)
      },
      effect: this.validateValue(sceneData.effect, 0, 255, 0),
      brightness: this.validateValue(sceneData.brightness, 0, 100, 100),
      speed: this.validateValue(sceneData.speed, 0, 100, 50),
      devices: sceneData.devices || [],
      favorite: sceneData.favorite || false,
      category: sceneData.category || 'Custom',
      tags: sceneData.tags || [],
      thumbnail: sceneData.thumbnail || this.generateThumbnail(sceneData.color),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.scenes.push(scene);
    this.saveScenes();

    console.log('✅ Szene erstellt:', scene.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Szene "${scene.name}" erstellt`, 'success');
    }

    return scene;
  }

  /**
   * Aktualisiert eine bestehende Szene
   * @param {string} sceneId - Szenen-ID
   * @param {Object} updates - Zu aktualisierende Felder
   * @returns {Object|null} - Aktualisierte Szene oder null
   */
  updateScene(sceneId, updates) {
    const scene = this.getScene(sceneId);
    if (!scene) {
      console.error('Szene nicht gefunden:', sceneId);
      return null;
    }

    // Updates anwenden
    if (updates.name) scene.name = updates.name;
    if (updates.description !== undefined) scene.description = updates.description;
    if (updates.color) {
      scene.color.r = this.validateValue(updates.color.r, 0, 255, scene.color.r);
      scene.color.g = this.validateValue(updates.color.g, 0, 255, scene.color.g);
      scene.color.b = this.validateValue(updates.color.b, 0, 255, scene.color.b);
    }
    if (updates.effect !== undefined) scene.effect = this.validateValue(updates.effect, 0, 255, scene.effect);
    if (updates.brightness !== undefined) scene.brightness = this.validateValue(updates.brightness, 0, 100, scene.brightness);
    if (updates.speed !== undefined) scene.speed = this.validateValue(updates.speed, 0, 100, scene.speed);
    if (updates.devices) scene.devices = updates.devices;
    if (updates.favorite !== undefined) scene.favorite = updates.favorite;
    if (updates.category) scene.category = updates.category;
    if (updates.tags) scene.tags = updates.tags;
    if (updates.thumbnail) scene.thumbnail = updates.thumbnail;

    scene.updatedAt = Date.now();
    this.saveScenes();

    console.log('✅ Szene aktualisiert:', scene.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Szene "${scene.name}" aktualisiert`, 'success');
    }

    return scene;
  }

  /**
   * Löscht eine Szene
   * @param {string} sceneId - Szenen-ID
   * @returns {boolean} - Erfolg
   */
  deleteScene(sceneId) {
    const index = this.scenes.findIndex(s => s.id === sceneId);
    if (index === -1) {
      console.error('Szene nicht gefunden:', sceneId);
      return false;
    }

    const scene = this.scenes[index];
    this.scenes.splice(index, 1);
    this.saveScenes();

    console.log('✅ Szene gelöscht:', scene.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Szene "${scene.name}" gelöscht`, 'info');
    }

    return true;
  }

  /**
   * Dupliziert eine Szene
   * @param {string} sceneId - Szenen-ID
   * @returns {Object|null} - Duplizierte Szene oder null
   */
  duplicateScene(sceneId) {
    const original = this.getScene(sceneId);
    if (!original) {
      console.error('Szene nicht gefunden:', sceneId);
      return null;
    }

    const duplicate = {
      ...original,
      id: this.generateId(),
      name: `${original.name} (Kopie)`,
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.scenes.push(duplicate);
    this.saveScenes();

    console.log('✅ Szene dupliziert:', duplicate.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Szene "${duplicate.name}" erstellt`, 'success');
    }

    return duplicate;
  }

  // ===================================================================
  // SZENEN AKTIVIEREN
  // ===================================================================

  /**
   * Aktiviert eine Szene
   * @param {string} sceneId - Szenen-ID
   * @returns {Promise<boolean>} - Erfolg
   */
  async activateScene(sceneId) {
    const scene = this.getScene(sceneId);
    if (!scene) {
      console.error('Szene nicht gefunden:', sceneId);
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Szene nicht gefunden', 'error');
      }
      return false;
    }

    console.log('🎬 Aktiviere Szene:', scene.name);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification(`Aktiviere Szene "${scene.name}"...`, 'info', 2000);
    }

    try {
      // ✅ UNIVERSELLE HARDWARE-STEUERUNG FÜR SZENEN
      
      // Prüfe verfügbare Hardware-Verbindungen
      let hasConnection = false;
      
      // 1. Direkte BLE-Hardware
      if (window.ledDevice && window.ledDevice.isConnected) {
        hasConnection = true;
        
        // Helligkeit
        const brightnessCmd = new Uint8Array([0x7E, 0x00, 0x0E, scene.brightness, 0x00, 0x00, 0x00, 0xEF]);
        await window.ledDevice.characteristic.writeValue(brightnessCmd);
        await this.delay(100);
        
        // Effekt
        if (scene.effect > 0) {
          const effectCmd = new Uint8Array([0x7E, 0x00, 0x06 + scene.effect, 0x05, 0x00, 0x00, 0x00, 0xEF]);
          await window.ledDevice.characteristic.writeValue(effectCmd);
          await this.delay(100);
        }
        
        // Farbe
        const colorCmd = new Uint8Array([0x7E, 0x00, 0x05, scene.color.r, scene.color.g, scene.color.b, 0x00, 0xEF]);
        await window.ledDevice.characteristic.writeValue(colorCmd);
      }
      
      // 2. WLED über WiFi
      if (window.wledDevice && window.wledDevice.connected) {
        hasConnection = true;
        
        await fetch(`http://${window.wledDevice.ip}/json/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            on: true,
            bri: Math.round((scene.brightness / 100) * 255),
            seg: [{
              col: [[scene.color.r, scene.color.g, scene.color.b]],
              fx: scene.effect > 0 ? scene.effect : 0
            }]
          })
        });
      }
      
      // 3. Universelle Funktion
      if (window.sendUniversalColor) {
        hasConnection = true;
        await window.sendUniversalColor(scene.color.r, scene.color.g, scene.color.b);
        
        if (scene.effect > 0 && window.sendUniversalEffect) {
          const effectNames = ['rainbow', 'strobe', 'fade', 'pulse', 'wave'];
          await window.sendUniversalEffect(effectNames[scene.effect - 1] || 'rainbow', 5);
        }
      }
      
      // 4. Legacy Controller Fallback
      if (!hasConnection && window.ledController && window.ledController.isConnected) {
        hasConnection = true;
        
        await window.ledController.setBrightness(scene.brightness);
        await this.delay(100);
        
        if (scene.effect > 0) {
          await window.ledController.setEffect(scene.effect);
          await this.delay(100);
        }
        
        await window.ledController.setColorRGB(
          scene.color.r,
          scene.color.g,
          scene.color.b
        );
      }
      
      if (!hasConnection) {
        throw new Error('Keine Hardware-Verbindung verfügbar');
      }

      this.currentScene = scene;

      console.log('✅ Szene aktiviert:', scene.name);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`Szene "${scene.name}" aktiviert`, 'success');
      }

      // Event dispatchen
      this.dispatchSceneEvent('scene-activated', scene);

      return true;
    } catch (error) {
      console.error('❌ Szene aktivieren fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Szene konnte nicht aktiviert werden', 'error');
      }
      
      return false;
    }
  }

  /**
   * Aktiviert aktuelle Szene neu
   */
  async reloadCurrentScene() {
    if (!this.currentScene) {
      console.warn('Keine aktuelle Szene');
      return false;
    }

    return await this.activateScene(this.currentScene.id);
  }

  // ===================================================================
  // FAVORITEN-VERWALTUNG
  // ===================================================================

  /**
   * Markiert/Entmarkiert Szene als Favorit
   * @param {string} sceneId - Szenen-ID
   * @returns {boolean} - Neuer Favoriten-Status
   */
  toggleFavorite(sceneId) {
    const scene = this.getScene(sceneId);
    if (!scene) {
      console.error('Szene nicht gefunden:', sceneId);
      return false;
    }

    scene.favorite = !scene.favorite;
    scene.updatedAt = Date.now();
    this.saveScenes();

    console.log(`${scene.favorite ? '⭐' : '☆'} Favorit ${scene.favorite ? 'hinzugefügt' : 'entfernt'}:`, scene.name);

    return scene.favorite;
  }

  /**
   * Gibt alle Favoriten-Szenen zurück
   * @returns {Array} - Favoriten-Szenen
   */
  getFavorites() {
    return this.scenes.filter(s => s.favorite);
  }

  // ===================================================================
  // KATEGORIEN & TAGS
  // ===================================================================

  /**
   * Gibt Szenen nach Kategorie zurück
   * @param {string} category - Kategorie
   * @returns {Array} - Szenen
   */
  getScenesByCategory(category) {
    return this.scenes.filter(s => s.category === category);
  }

  /**
   * Gibt Szenen nach Tag zurück
   * @param {string} tag - Tag
   * @returns {Array} - Szenen
   */
  getScenesByTag(tag) {
    return this.scenes.filter(s => s.tags.includes(tag));
  }

  /**
   * Gibt alle verwendeten Tags zurück
   * @returns {Array} - Unique Tags
   */
  getAllTags() {
    const tags = new Set();
    this.scenes.forEach(scene => {
      scene.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  // ===================================================================
  // PRESETS
  // ===================================================================

  /**
   * Erstellt Standard-Presets
   */
  createDefaultPresets() {
    const presets = [
      {
        name: 'Warmes Licht',
        description: 'Entspannende warme Beleuchtung',
        color: { r: 255, g: 200, b: 100 },
        effect: 0,
        brightness: 80,
        speed: 50,
        category: 'Entspannung',
        tags: ['warm', 'gemütlich']
      },
      {
        name: 'Kaltes Weiß',
        description: 'Helles kühles Arbeitslicht',
        color: { r: 255, g: 255, b: 255 },
        effect: 0,
        brightness: 100,
        speed: 50,
        category: 'Arbeit',
        tags: ['hell', 'konzentration']
      },
      {
        name: 'Romantisch',
        description: 'Sanftes rotes Licht',
        color: { r: 255, g: 50, b: 80 },
        effect: 0,
        brightness: 40,
        speed: 50,
        category: 'Romantisch',
        tags: ['rot', 'dunkel']
      },
      {
        name: 'Party',
        description: 'Bunter Party-Modus',
        color: { r: 255, g: 0, b: 255 },
        effect: 10,
        brightness: 100,
        speed: 80,
        category: 'Party',
        tags: ['bunt', 'dynamisch']
      },
      {
        name: 'Nachtlicht',
        description: 'Dezentes blaues Nachtlicht',
        color: { r: 50, b: 150, g: 100 },
        effect: 0,
        brightness: 20,
        speed: 50,
        category: 'Schlafen',
        tags: ['dunkel', 'blau']
      },
      {
        name: 'Gaming',
        description: 'Intensive Gaming-Atmosphäre',
        color: { r: 0, g: 255, b: 255 },
        effect: 15,
        brightness: 90,
        speed: 70,
        category: 'Gaming',
        tags: ['cyan', 'energetisch']
      },
      {
        name: 'Sonnenuntergang',
        description: 'Warmer Sonnenuntergang',
        color: { r: 255, g: 100, b: 50 },
        effect: 0,
        brightness: 60,
        speed: 30,
        category: 'Entspannung',
        tags: ['orange', 'warm']
      },
      {
        name: 'Ozean',
        description: 'Beruhigendes Meeresblau',
        color: { r: 0, g: 150, b: 255 },
        effect: 5,
        brightness: 70,
        speed: 40,
        category: 'Entspannung',
        tags: ['blau', 'entspannend']
      },
      {
        name: 'Wald',
        description: 'Natürliches Grün',
        color: { r: 50, g: 200, b: 80 },
        effect: 0,
        brightness: 75,
        speed: 50,
        category: 'Entspannung',
        tags: ['grün', 'natur']
      },
      {
        name: 'Disco',
        description: 'Stroboskop-Effekt',
        color: { r: 255, g: 255, b: 255 },
        effect: 20,
        brightness: 100,
        speed: 100,
        category: 'Party',
        tags: ['schnell', 'bunt']
      }
    ];

    console.log('🎨 Erstelle Standard-Presets...');
    
    presets.forEach(preset => {
      this.createScene(preset);
    });

    console.log(`✅ ${presets.length} Presets erstellt`);
  }

  // ===================================================================
  // SUCHE & FILTER
  // ===================================================================

  /**
   * Sucht nach Szenen
   * @param {string} query - Suchbegriff
   * @returns {Array} - Gefundene Szenen
   */
  searchScenes(query) {
    if (!query || query.trim() === '') {
      return this.scenes;
    }

    const searchTerm = query.toLowerCase();
    
    return this.scenes.filter(scene => {
      return scene.name.toLowerCase().includes(searchTerm) ||
             scene.description.toLowerCase().includes(searchTerm) ||
             scene.category.toLowerCase().includes(searchTerm) ||
             scene.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    });
  }

  /**
   * Filtert Szenen nach Kriterien
   * @param {Object} filters - Filter-Objekt
   * @returns {Array} - Gefilterte Szenen
   */
  filterScenes(filters) {
    let filtered = [...this.scenes];

    if (filters.category) {
      filtered = filtered.filter(s => s.category === filters.category);
    }

    if (filters.favorite !== undefined) {
      filtered = filtered.filter(s => s.favorite === filters.favorite);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(s => {
        return filters.tags.some(tag => s.tags.includes(tag));
      });
    }

    if (filters.minBrightness !== undefined) {
      filtered = filtered.filter(s => s.brightness >= filters.minBrightness);
    }

    if (filters.maxBrightness !== undefined) {
      filtered = filtered.filter(s => s.brightness <= filters.maxBrightness);
    }

    return filtered;
  }

  /**
   * Sortiert Szenen
   * @param {string} sortBy - Sortier-Kriterium
   * @param {string} order - 'asc' oder 'desc'
   * @returns {Array} - Sortierte Szenen
   */
  sortScenes(sortBy = 'name', order = 'asc') {
    const sorted = [...this.scenes];
    const multiplier = order === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return multiplier * a.name.localeCompare(b.name);
        case 'created':
          return multiplier * (a.createdAt - b.createdAt);
        case 'updated':
          return multiplier * (a.updatedAt - b.updatedAt);
        case 'brightness':
          return multiplier * (a.brightness - b.brightness);
        case 'category':
          return multiplier * a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return sorted;
  }

  // ===================================================================
  // IMPORT / EXPORT
  // ===================================================================

  /**
   * Exportiert Szenen als JSON
   * @param {Array} sceneIds - Zu exportierende Szenen-IDs (optional)
   * @returns {string} - JSON-String
   */
  exportScenes(sceneIds = null) {
    let scenesToExport = this.scenes;

    if (sceneIds && sceneIds.length > 0) {
      scenesToExport = this.scenes.filter(s => sceneIds.includes(s.id));
    }

    const exportData = {
      version: '1.0',
      exportDate: Date.now(),
      scenes: scenesToExport
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importiert Szenen aus JSON
   * @param {string} jsonString - JSON-Daten
   * @param {boolean} overwrite - Vorhandene löschen?
   * @returns {number} - Anzahl importierter Szenen
   */
  importScenes(jsonString, overwrite = false) {
    try {
      const importData = JSON.parse(jsonString);

      // Validierung
      if (!importData.scenes || !Array.isArray(importData.scenes)) {
        throw new Error('Ungültiges Format');
      }

      if (overwrite) {
        this.scenes = [];
      }

      let importedCount = 0;

      importData.scenes.forEach(scene => {
        // Neue ID generieren
        const newScene = {
          ...scene,
          id: this.generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        this.scenes.push(newScene);
        importedCount++;
      });

      this.saveScenes();

      console.log(`✅ ${importedCount} Szenen importiert`);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`${importedCount} Szenen importiert`, 'success');
      }

      return importedCount;
    } catch (error) {
      console.error('❌ Import fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Import fehlgeschlagen - ungültiges Format', 'error');
      }
      
      return 0;
    }
  }

  /**
   * Exportiert Szenen als Datei-Download
   * @param {Array} sceneIds - Zu exportierende Szenen-IDs (optional)
   */
  downloadScenes(sceneIds = null) {
    const json = this.exportScenes(sceneIds);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `led-scenes-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);

    console.log('✅ Szenen exportiert');
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification('Szenen exportiert', 'success');
    }
  }

  // ===================================================================
  // SPEICHERN & LADEN
  // ===================================================================

  /**
   * Speichert Szenen in localStorage
   */
  saveScenes() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scenes));
      console.log('💾 Szenen gespeichert:', this.scenes.length);
    } catch (error) {
      console.error('❌ Speichern fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Fehler beim Speichern', 'error');
      }
    }
  }

  /**
   * Lädt Szenen aus localStorage
   */
  loadScenes() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.scenes = JSON.parse(saved);
        console.log('📂 Szenen geladen:', this.scenes.length);
      } else {
        console.log('📂 Keine gespeicherten Szenen gefunden');
        // Standard-Presets erstellen
        this.createDefaultPresets();
      }
    } catch (error) {
      console.error('❌ Laden fehlgeschlagen:', error);
      this.scenes = [];
    }
  }

  /**
   * Löscht alle Szenen
   * @returns {boolean} - Erfolg
   */
  clearAllScenes() {
    if (!confirm('Wirklich ALLE Szenen löschen? Dies kann nicht rückgängig gemacht werden!')) {
      return false;
    }

    this.scenes = [];
    this.currentScene = null;
    this.saveScenes();

    console.log('🗑️ Alle Szenen gelöscht');
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification('Alle Szenen gelöscht', 'info');
    }

    return true;
  }

  // ===================================================================
  // GETTER & HELPER
  // ===================================================================

  /**
   * Gibt eine Szene zurück
   * @param {string} sceneId - Szenen-ID
   * @returns {Object|null} - Szene oder null
   */
  getScene(sceneId) {
    return this.scenes.find(s => s.id === sceneId) || null;
  }

  /**
   * Gibt alle Szenen zurück
   * @returns {Array} - Alle Szenen
   */
  getAllScenes() {
    return [...this.scenes];
  }

  /**
   * Gibt Anzahl der Szenen zurück
   * @returns {number} - Anzahl
   */
  getSceneCount() {
    return this.scenes.length;
  }

  /**
   * Gibt aktuelle Szene zurück
   * @returns {Object|null} - Aktuelle Szene oder null
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Generiert eindeutige ID
   * @returns {string} - UUID
   */
  generateId() {
    return 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validiert Wert
   * @param {*} value - Wert
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @param {number} defaultValue - Standard-Wert
   * @returns {number} - Validierter Wert
   */
  validateValue(value, min, max, defaultValue) {
    const num = parseInt(value);
    if (isNaN(num)) return defaultValue;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Generiert Thumbnail aus Farbe
   * @param {Object} color - RGB-Farbe
   * @returns {string} - Data-URL
   */
  generateThumbnail(color) {
    if (!color) return '';

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      // Farbe zeichnen
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(0, 0, 100, 100);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Thumbnail-Generierung fehlgeschlagen:', error);
      return '';
    }
  }

  /**
   * Delay Helper
   * @param {number} ms - Millisekunden
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispatched Custom Event
   * @param {string} eventName - Event-Name
   * @param {*} detail - Event-Detail
   */
  dispatchSceneEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail: detail,
      bubbles: true,
      cancelable: true
    });
    window.dispatchEvent(event);
  }
}

// ===================================================================
// GLOBALE INSTANZ
// ===================================================================

// Szenen-Manager global verfügbar machen
window.ScenesManager = ScenesManager;
window.scenesManager = new ScenesManager();

console.log('✅ Szenen-Manager global verfügbar als window.scenesManager');

// ===================================================================
// EVENT-LISTENER
// ===================================================================

// Szenen-Events abfangen
window.addEventListener('scene-activated', (e) => {
  console.log('🎬 Szene aktiviert:', e.detail.name);
});

// ===================================================================
// EXPORT (für Module)
// ===================================================================

// Browser-kompatible Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScenesManager;
} else if (typeof window !== 'undefined') {
  window.ScenesManager = ScenesManager;
}
