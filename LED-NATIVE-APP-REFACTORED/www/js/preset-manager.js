/**
 * PRESET-MANAGER.JS - Vollständiges Preset-System
 * Speichert/Lädt komplette Konfigurationen: Farbe + Effekt + LED-Mapping + Audio-Settings
 * @version 1.0
 * @requires LocalStorage, IndexedDB
 */
'use strict';

/**
 * Preset-Manager für vollständige LED-Konfigurationen
 */
class PresetManager {
    constructor() {
        this.STORAGE_KEY = 'led-presets';
        this.ACTIVE_PRESET_KEY = 'led-active-preset';
        this.presets = {};
        this.activePreset = null;
        this.defaultPresets = this.createDefaultPresets();

        this.init();
    }

    /**
     * Initialisierung
     */
    init() {
        this.loadPresets();
        this.loadActivePreset();
        // console.log('✅ Preset Manager initialisiert');
        // console.log(`📋 ${Object.keys(this.presets).length} Presets geladen`);
    }

    /**
     * Standard-Presets erstellen
     */
    createDefaultPresets() {
        return {
            'Standard': {
                id: 'default',
                name: 'Standard',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'solid',
                    primary: '#FFFFFF',
                    secondary: '#4ECDC4',
                    gradient: ['#FF6B6B', '#4ECDC4', '#45B7D1']
                },
                effect: {
                    type: 'solid',
                    speed: 50,
                    intensity: 100,
                    direction: 'forward'
                },
                brightness: {
                    level: 100,
                    autoAdjust: false,
                    minLevel: 10,
                    maxLevel: 100
                },
                audio: {
                    enabled: false,
                    sensitivity: 50,
                    smoothing: 70,
                    gain: 100,
                    beatThreshold: 130,
                    reactTo: 'all', // all, bass, mid, treble, beats
                    mapping: {
                        bass: { enabled: true, color: '#FF0000', brightness: 100 },
                        mid: { enabled: true, color: '#00FF00', brightness: 100 },
                        treble: { enabled: true, color: '#0000FF', brightness: 100 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            },
            'Party': {
                id: 'party',
                name: 'Party',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'rainbow',
                    primary: '#FF00FF',
                    secondary: '#00FFFF',
                    gradient: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF']
                },
                effect: {
                    type: 'rainbow',
                    speed: 80,
                    intensity: 100,
                    direction: 'forward'
                },
                brightness: {
                    level: 100,
                    autoAdjust: true,
                    minLevel: 50,
                    maxLevel: 100
                },
                audio: {
                    enabled: true,
                    sensitivity: 70,
                    smoothing: 50,
                    gain: 120,
                    beatThreshold: 120,
                    reactTo: 'beats',
                    mapping: {
                        bass: { enabled: true, color: '#FF0000', brightness: 100 },
                        mid: { enabled: true, color: '#00FF00', brightness: 80 },
                        treble: { enabled: true, color: '#0000FF', brightness: 60 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            },
            'Entspannung': {
                id: 'relax',
                name: 'Entspannung',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'gradient',
                    primary: '#4A00E0',
                    secondary: '#8E2DE2',
                    gradient: ['#667eea', '#764ba2', '#f093fb']
                },
                effect: {
                    type: 'breathe',
                    speed: 20,
                    intensity: 60,
                    direction: 'forward'
                },
                brightness: {
                    level: 40,
                    autoAdjust: false,
                    minLevel: 20,
                    maxLevel: 60
                },
                audio: {
                    enabled: false,
                    sensitivity: 30,
                    smoothing: 90,
                    gain: 80,
                    beatThreshold: 150,
                    reactTo: 'all',
                    mapping: {
                        bass: { enabled: true, color: '#4A00E0', brightness: 50 },
                        mid: { enabled: true, color: '#8E2DE2', brightness: 50 },
                        treble: { enabled: true, color: '#f093fb', brightness: 50 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            },
            'Nachtlicht': {
                id: 'nightlight',
                name: 'Nachtlicht',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'solid',
                    primary: '#FF6B35',
                    secondary: '#FF8C42',
                    gradient: ['#FF6B35', '#FF8C42']
                },
                effect: {
                    type: 'solid',
                    speed: 0,
                    intensity: 100,
                    direction: 'forward'
                },
                brightness: {
                    level: 15,
                    autoAdjust: false,
                    minLevel: 5,
                    maxLevel: 25
                },
                audio: {
                    enabled: false,
                    sensitivity: 50,
                    smoothing: 70,
                    gain: 100,
                    beatThreshold: 130,
                    reactTo: 'all',
                    mapping: {
                        bass: { enabled: false, color: '#FF6B35', brightness: 20 },
                        mid: { enabled: false, color: '#FF8C42', brightness: 20 },
                        treble: { enabled: false, color: '#FFAB40', brightness: 20 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            },
            'Gaming': {
                id: 'gaming',
                name: 'Gaming',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'gradient',
                    primary: '#00FF00',
                    secondary: '#FF0000',
                    gradient: ['#00FF00', '#00FFFF', '#FF00FF', '#FF0000']
                },
                effect: {
                    type: 'chase',
                    speed: 90,
                    intensity: 100,
                    direction: 'forward'
                },
                brightness: {
                    level: 80,
                    autoAdjust: true,
                    minLevel: 60,
                    maxLevel: 100
                },
                audio: {
                    enabled: true,
                    sensitivity: 80,
                    smoothing: 40,
                    gain: 130,
                    beatThreshold: 110,
                    reactTo: 'bass',
                    mapping: {
                        bass: { enabled: true, color: '#FF0000', brightness: 100 },
                        mid: { enabled: true, color: '#00FF00', brightness: 80 },
                        treble: { enabled: true, color: '#00FFFF', brightness: 60 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            },
            'Musik-Reaktiv': {
                id: 'music-reactive',
                name: 'Musik-Reaktiv',
                isDefault: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                color: {
                    mode: 'spectrum',
                    primary: '#FF0000',
                    secondary: '#0000FF',
                    gradient: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF']
                },
                effect: {
                    type: 'spectrum',
                    speed: 60,
                    intensity: 100,
                    direction: 'center-out'
                },
                brightness: {
                    level: 100,
                    autoAdjust: true,
                    minLevel: 30,
                    maxLevel: 100
                },
                audio: {
                    enabled: true,
                    sensitivity: 60,
                    smoothing: 60,
                    gain: 100,
                    beatThreshold: 130,
                    reactTo: 'all',
                    mapping: {
                        bass: { enabled: true, color: '#FF0000', brightness: 100 },
                        mid: { enabled: true, color: '#00FF00', brightness: 100 },
                        treble: { enabled: true, color: '#0000FF', brightness: 100 }
                    }
                },
                led: {
                    stripCount: 1,
                    ledsPerStrip: 60,
                    colorOrder: 'GRB',
                    gammaCorrection: true
                }
            }
        };
    }

    /**
     * Presets aus LocalStorage laden
     */
    loadPresets() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.presets = JSON.parse(stored);
            } else {
                // Default Presets setzen
                this.presets = { ...this.defaultPresets };
                this.savePresets();
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Presets:', error);
            this.presets = { ...this.defaultPresets };
        }
    }

    /**
     * Presets in LocalStorage speichern
     */
    savePresets() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.presets));
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Presets:', error);
            return false;
        }
    }

    /**
     * Aktives Preset laden
     */
    loadActivePreset() {
        try {
            const activeId = localStorage.getItem(this.ACTIVE_PRESET_KEY);
            if (activeId && this.presets[activeId]) {
                this.activePreset = this.presets[activeId];
            } else {
                this.activePreset = this.presets['Standard'] || Object.values(this.presets)[0];
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden des aktiven Presets:', error);
        }
    }

    /**
     * Neues Preset erstellen
     * @param {string} name - Preset Name
     * @param {object} config - Preset Konfiguration (optional, sonst aktuelle Settings)
     * @returns {object|null} Erstelltes Preset oder null
     */
    createPreset(name, config = null) {
        if (!name || name.trim() === '') {
            console.error('❌ Preset-Name erforderlich');
            return null;
        }

        const sanitizedName = name.trim();

        // Prüfen ob Name bereits existiert
        if (this.presets[sanitizedName] && !this.presets[sanitizedName].isDefault) {
            console.warn('⚠️ Preset mit diesem Namen existiert bereits');
            // Name mit Nummer versehen
            let counter = 1;
            let newName = `${sanitizedName} (${counter})`;
            while (this.presets[newName]) {
                counter++;
                newName = `${sanitizedName} (${counter})`;
            }
            return this.createPreset(newName, config);
        }

        const preset = {
            id: 'preset_' + Date.now(),
            name: sanitizedName,
            isDefault: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...(config || this.getCurrentSettings())
        };

        this.presets[sanitizedName] = preset;
        this.savePresets();

        // console.log(`✅ Preset erstellt: ${sanitizedName}`);
        return preset;
    }

    /**
     * Aktuelle Einstellungen aus der App sammeln
     */
    getCurrentSettings() {
        // Farbe
        const colorSettings = {
            mode: window.currentColorMode || 'solid',
            primary: window.currentColor || '#FFFFFF',
            secondary: window.secondaryColor || '#4ECDC4',
            gradient: window.currentGradient || ['#FF6B6B', '#4ECDC4']
        };

        // Effekt
        const effectSettings = {
            type: window.currentEffect || 'solid',
            speed: this.getSliderValue('effectSpeed') || 50,
            intensity: this.getSliderValue('effectIntensity') || 100,
            direction: window.effectDirection || 'forward'
        };

        // Helligkeit
        const brightnessSettings = {
            level: this.getSliderValue('brightness') || 100,
            autoAdjust: this.getToggleValue('autoBrightness') || false,
            minLevel: this.getSliderValue('minBrightness') || 10,
            maxLevel: this.getSliderValue('maxBrightness') || 100
        };

        // Audio
        const audioSettings = {
            enabled: this.getToggleValue('audioReactive') || false,
            sensitivity: this.getSliderValue('sensitivity') || 50,
            smoothing: this.getSliderValue('smoothing') || 70,
            gain: this.getSliderValue('audioGain') || 100,
            beatThreshold: this.getSliderValue('beatThreshold') || 130,
            reactTo: window.audioReactTo || 'all',
            mapping: {
                bass: {
                    enabled: this.getToggleValue('bassEnabled') !== false,
                    color: window.bassColor || '#FF0000',
                    brightness: this.getSliderValue('bassBrightness') || 100
                },
                mid: {
                    enabled: this.getToggleValue('midEnabled') !== false,
                    color: window.midColor || '#00FF00',
                    brightness: this.getSliderValue('midBrightness') || 100
                },
                treble: {
                    enabled: this.getToggleValue('trebleEnabled') !== false,
                    color: window.trebleColor || '#0000FF',
                    brightness: this.getSliderValue('trebleBrightness') || 100
                }
            }
        };

        // LED
        const ledSettings = {
            stripCount: window.activeBandCount || 1,
            ledsPerStrip: window.ledsPerStrip || 60,
            colorOrder: window.colorOrder || 'GRB',
            gammaCorrection: this.getToggleValue('gammaCorrection') !== false
        };

        return {
            color: colorSettings,
            effect: effectSettings,
            brightness: brightnessSettings,
            audio: audioSettings,
            led: ledSettings
        };
    }

    /**
     * Helper: Slider-Wert abrufen
     */
    getSliderValue(id) {
        const slider = document.getElementById(id);
        return slider ? parseFloat(slider.value) : null;
    }

    /**
     * Helper: Toggle-Wert abrufen
     */
    getToggleValue(id) {
        const toggle = document.getElementById(id);
        return toggle ? toggle.checked : null;
    }

    /**
     * Preset anwenden
     * @param {string} name - Preset Name
     * @returns {boolean} Erfolg
     */
    applyPreset(name) {
        const preset = this.presets[name];
        if (!preset) {
            console.error(`❌ Preset nicht gefunden: ${name}`);
            return false;
        }

        // console.log(`🎨 Wende Preset an: ${name}`);

        // Farbe anwenden
        if (preset.color) {
            this.applyColorSettings(preset.color);
        }

        // Effekt anwenden
        if (preset.effect) {
            this.applyEffectSettings(preset.effect);
        }

        // Helligkeit anwenden
        if (preset.brightness) {
            this.applyBrightnessSettings(preset.brightness);
        }

        // Audio anwenden
        if (preset.audio) {
            this.applyAudioSettings(preset.audio);
        }

        // LED anwenden
        if (preset.led) {
            this.applyLEDSettings(preset.led);
        }

        // Aktives Preset setzen
        this.activePreset = preset;
        localStorage.setItem(this.ACTIVE_PRESET_KEY, name);

        // Event dispatchen
        window.dispatchEvent(new CustomEvent('presetApplied', { detail: preset }));

        // console.log(`✅ Preset angewendet: ${name}`);
        return true;
    }

    /**
     * Farb-Einstellungen anwenden
     */
    applyColorSettings(color) {
        window.currentColorMode = color.mode;
        window.currentColor = color.primary;
        window.secondaryColor = color.secondary;
        window.currentGradient = color.gradient;

        // BLE-Controller benachrichtigen
        if (window.bleController && window.bleController.isConnected) {
            const r = parseInt(color.primary.slice(1, 3), 16);
            const g = parseInt(color.primary.slice(3, 5), 16);
            const b = parseInt(color.primary.slice(5, 7), 16);
            window.bleController.setColorRGB(r, g, b);
        }

        // UI updaten
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) colorPicker.value = color.primary;
    }

    /**
     * Effekt-Einstellungen anwenden
     */
    applyEffectSettings(effect) {
        window.currentEffect = effect.type;
        window.effectDirection = effect.direction;

        this.setSliderValue('effectSpeed', effect.speed);
        this.setSliderValue('effectIntensity', effect.intensity);

        // BLE-Controller benachrichtigen
        if (window.bleController && window.bleController.isConnected) {
            // Effect ID mapping
            const effectMap = {
                'solid': 0,
                'breathe': 1,
                'rainbow': 2,
                'chase': 3,
                'strobe': 4,
                'spectrum': 5
            };
            const effectId = effectMap[effect.type] || 0;
            window.bleController.setEffect(effectId, effect.speed);
        }
    }

    /**
     * Helligkeits-Einstellungen anwenden
     */
    applyBrightnessSettings(brightness) {
        this.setSliderValue('brightness', brightness.level);
        this.setToggleValue('autoBrightness', brightness.autoAdjust);
        this.setSliderValue('minBrightness', brightness.minLevel);
        this.setSliderValue('maxBrightness', brightness.maxLevel);

        // BLE-Controller benachrichtigen
        if (window.bleController && window.bleController.isConnected) {
            window.bleController.setBrightness(brightness.level);
        }
    }

    /**
     * Audio-Einstellungen anwenden
     */
    applyAudioSettings(audio) {
        this.setToggleValue('audioReactive', audio.enabled);
        this.setSliderValue('sensitivity', audio.sensitivity);
        this.setSliderValue('smoothing', audio.smoothing);
        this.setSliderValue('audioGain', audio.gain);
        this.setSliderValue('beatThreshold', audio.beatThreshold);

        window.audioReactTo = audio.reactTo;

        // Mapping
        if (audio.mapping) {
            if (audio.mapping.bass) {
                this.setToggleValue('bassEnabled', audio.mapping.bass.enabled);
                window.bassColor = audio.mapping.bass.color;
                this.setSliderValue('bassBrightness', audio.mapping.bass.brightness);
            }
            if (audio.mapping.mid) {
                this.setToggleValue('midEnabled', audio.mapping.mid.enabled);
                window.midColor = audio.mapping.mid.color;
                this.setSliderValue('midBrightness', audio.mapping.mid.brightness);
            }
            if (audio.mapping.treble) {
                this.setToggleValue('trebleEnabled', audio.mapping.treble.enabled);
                window.trebleColor = audio.mapping.treble.color;
                this.setSliderValue('trebleBrightness', audio.mapping.treble.brightness);
            }
        }

        // Audio Engine updaten
        if (window.AudioDecoderFFT && audio.enabled) {
            const decoder = new window.AudioDecoderFFT();
            decoder.setSensitivity(audio.sensitivity / 100);
            decoder.setSmoothing(audio.smoothing / 100);
            decoder.setGain(audio.gain / 100);
            decoder.setBeatThreshold(audio.beatThreshold / 100);
        }
    }

    /**
     * LED-Einstellungen anwenden
     */
    applyLEDSettings(led) {
        window.activeBandCount = led.stripCount;
        window.ledsPerStrip = led.ledsPerStrip;
        window.colorOrder = led.colorOrder;
        this.setToggleValue('gammaCorrection', led.gammaCorrection);
    }

    /**
     * Helper: Slider-Wert setzen
     */
    setSliderValue(id, value) {
        const slider = document.getElementById(id);
        if (slider && value !== null && value !== undefined) {
            slider.value = value;
            slider.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    /**
     * Helper: Toggle-Wert setzen
     */
    setToggleValue(id, value) {
        const toggle = document.getElementById(id);
        if (toggle && value !== null && value !== undefined) {
            toggle.checked = value;
            toggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Preset aktualisieren
     */
    updatePreset(name, updates) {
        if (!this.presets[name]) {
            console.error(`❌ Preset nicht gefunden: ${name}`);
            return false;
        }

        if (this.presets[name].isDefault) {
            console.warn('⚠️ Default-Presets können nicht überschrieben werden');
            // Kopie erstellen
            return this.createPreset(`${name} (Kopie)`, {
                ...this.presets[name],
                ...updates,
                isDefault: false
            });
        }

        Object.assign(this.presets[name], updates);
        this.presets[name].updatedAt = Date.now();
        this.savePresets();

        // console.log(`✅ Preset aktualisiert: ${name}`);
        return true;
    }

    /**
     * Preset löschen
     */
    deletePreset(name) {
        if (!this.presets[name]) {
            console.error(`❌ Preset nicht gefunden: ${name}`);
            return false;
        }

        if (this.presets[name].isDefault) {
            console.warn('⚠️ Default-Presets können nicht gelöscht werden');
            return false;
        }

        delete this.presets[name];
        this.savePresets();

        // console.log(`✅ Preset gelöscht: ${name}`);
        return true;
    }

    /**
     * Preset umbenennen
     */
    renamePreset(oldName, newName) {
        if (!this.presets[oldName]) {
            console.error(`❌ Preset nicht gefunden: ${oldName}`);
            return false;
        }

        if (this.presets[oldName].isDefault) {
            console.warn('⚠️ Default-Presets können nicht umbenannt werden');
            return false;
        }

        if (this.presets[newName]) {
            console.warn(`⚠️ Preset mit Namen "${newName}" existiert bereits`);
            return false;
        }

        const preset = this.presets[oldName];
        preset.name = newName;
        preset.updatedAt = Date.now();

        this.presets[newName] = preset;
        delete this.presets[oldName];

        this.savePresets();

        // console.log(`✅ Preset umbenannt: ${oldName} → ${newName}`);
        return true;
    }

    /**
     * Preset duplizieren
     */
    duplicatePreset(name) {
        if (!this.presets[name]) {
            console.error(`❌ Preset nicht gefunden: ${name}`);
            return null;
        }

        const original = this.presets[name];
        const newName = `${name} (Kopie)`;

        return this.createPreset(newName, {
            ...original,
            id: 'preset_' + Date.now(),
            name: newName,
            isDefault: false
        });
    }

    /**
     * Preset auf anderes Gerät kopieren (JSON Export)
     */
    exportPreset(name) {
        if (!this.presets[name]) {
            console.error(`❌ Preset nicht gefunden: ${name}`);
            return null;
        }

        const preset = this.presets[name];
        const exportData = {
            version: '1.0',
            exportedAt: Date.now(),
            preset: preset
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Preset von JSON importieren
     */
    importPreset(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.preset || !data.preset.name) {
                console.error('❌ Ungültiges Preset-Format');
                return null;
            }

            const preset = data.preset;
            preset.isDefault = false;
            preset.importedAt = Date.now();

            // Name ggf. anpassen
            let name = preset.name;
            let counter = 1;
            while (this.presets[name]) {
                name = `${preset.name} (Import ${counter})`;
                counter++;
            }
            preset.name = name;

            this.presets[name] = preset;
            this.savePresets();

            // console.log(`✅ Preset importiert: ${name}`);
            return preset;
        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            return null;
        }
    }

    /**
     * Alle Presets exportieren
     */
    exportAllPresets() {
        const exportData = {
            version: '1.0',
            exportedAt: Date.now(),
            presets: Object.values(this.presets).filter(p => !p.isDefault)
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Alle Presets importieren
     */
    importAllPresets(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.presets || !Array.isArray(data.presets)) {
                console.error('❌ Ungültiges Format');
                return false;
            }

            let imported = 0;
            for (const preset of data.presets) {
                if (preset.name && !preset.isDefault) {
                    const result = this.importPreset(JSON.stringify({ preset }));
                    if (result) imported++;
                }
            }

            // console.log(`✅ ${imported} Presets importiert`);
            return imported;
        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            return 0;
        }
    }

    /**
     * Alle Presets als Array abrufen
     */
    getAllPresets() {
        return Object.values(this.presets);
    }

    /**
     * Preset per Name abrufen
     */
    getPreset(name) {
        return this.presets[name] || null;
    }

    /**
     * Aktives Preset abrufen
     */
    getActivePreset() {
        return this.activePreset;
    }

    /**
     * Presets auf Werkseinstellungen zurücksetzen
     */
    resetToDefaults() {
        this.presets = { ...this.defaultPresets };
        this.savePresets();
        this.loadActivePreset();
        // console.log('🔄 Presets auf Werkseinstellungen zurückgesetzt');
    }
}

// Global verfügbar machen
window.PresetManager = PresetManager;
window.presetManager = new PresetManager();
// console.log('✅ Preset Manager global verfügbar als window.presetManager');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresetManager;
}
