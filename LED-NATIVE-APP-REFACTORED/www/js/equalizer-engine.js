/**
 * EQUALIZER-ENGINE.JS v4.0 - ZERO TOLERANCE
 * Web Audio API Equalizer mit Presets, Custom-Save & Bass-Boost
 */
'use strict';

class EqualizerEngine {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.filters = [];
        this.bassBoostFilter = null;
        this.gainNode = null;
        this.isEnabled = true;
        this.isBassBoostEnabled = false;
        this.currentPreset = 'flat';
        this.customPresets = {};

        // Frequenzbänder (Hz)
        this.frequencies = [60, 170, 310, 600, 1000];

        // Preset-Konfigurationen (in dB)
        this.presets = {
            flat: [0, 0, 0, 0, 0],
            pop: [2, 4, 2, -1, -2],
            rock: [4, 2, -2, 2, 4],
            'bass boost': [8, 6, 0, -2, -2],
            klassik: [-2, -2, 0, 2, 3],
            jazz: [3, 1, -1, 1, 3]
        };

        this.init();
    }

    init() {
        this.loadCustomPresets();
        console.log('✅ Equalizer Engine initialisiert');
    }

    async connect(audioElement) {
        try {
            if (!audioElement) throw new Error('Kein Audio-Element vorhanden');

            // AudioContext erstellen falls nicht vorhanden
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Source Node erstellen
            if (!this.sourceNode) {
                this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
            }

            // Gain Node für Master-Volume
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 1.0;

            // EQ-Filter erstellen (BiquadFilterNode)
            this.filters = this.frequencies.map((freq, index) => {
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1.0;
                filter.gain.value = 0;
                return filter;
            });

            // Bass-Boost-Filter (Lowshelf)
            this.bassBoostFilter = this.audioContext.createBiquadFilter();
            this.bassBoostFilter.type = 'lowshelf';
            this.bassBoostFilter.frequency.value = 250;
            this.bassBoostFilter.gain.value = 0;

            // Chain verbinden: Source → Bass Boost → Filters → Gain → Destination
            this.sourceNode.connect(this.bassBoostFilter);

            let lastNode = this.bassBoostFilter;
            this.filters.forEach(filter => {
                lastNode.connect(filter);
                lastNode = filter;
            });

            lastNode.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            console.log('✅ Equalizer verbunden');
            return true;
        } catch (err) {
            console.error('❌ Equalizer-Verbindung fehlgeschlagen:', err);
            return false;
        }
    }

    setFrequency(index, gainDB) {
        if (index >= 0 && index < this.filters.length) {
            this.filters[index].gain.value = gainDB;
            console.log(`🎛️ ${this.frequencies[index]}Hz → ${gainDB}dB`);
        }
    }

    applyPreset(presetName) {
        const preset = this.presets[presetName.toLowerCase()];
        if (!preset) {
            console.warn('Preset nicht gefunden:', presetName);
            return false;
        }

        preset.forEach((gain, index) => {
            this.setFrequency(index, gain);
        });

        this.currentPreset = presetName.toLowerCase();
        console.log('✅ Preset angewendet:', presetName);
        return preset;
    }

    getCurrentValues() {
        return this.filters.map(f => f.gain.value);
    }

    setBassBoost(enabled, intensity = 0) {
        this.isBassBoostEnabled = enabled;
        if (this.bassBoostFilter) {
            this.bassBoostFilter.gain.value = enabled ? intensity : 0;
            console.log('🔊 Bass-Boost:', enabled ? `${intensity}dB` : 'AUS');
        }
    }

    toggleEnabled(enabled) {
        this.isEnabled = enabled;
        if (!this.gainNode) return;

        if (enabled) {
            this.gainNode.gain.value = 1.0;
        } else {
            // EQ deaktivieren aber Audio durchlassen
            this.filters.forEach(f => f.gain.value = 0);
            this.bassBoostFilter.gain.value = 0;
        }

        console.log('🎚️ Equalizer:', enabled ? 'EIN' : 'AUS');
    }

    saveCustomPreset(name) {
        if (!name || name.trim() === '') {
            console.error('Kein Name angegeben');
            return false;
        }

        const values = this.getCurrentValues();
        this.customPresets[name] = values;

        // In LocalStorage speichern
        try {
            localStorage.setItem('eq-custom-presets', JSON.stringify(this.customPresets));
            console.log('✅ Preset gespeichert:', name, values);
            return true;
        } catch (err) {
            console.error('❌ Speichern fehlgeschlagen:', err);
            return false;
        }
    }

    deleteCustomPreset(name) {
        if (this.customPresets[name]) {
            delete this.customPresets[name];
            try {
                localStorage.setItem('eq-custom-presets', JSON.stringify(this.customPresets));
                console.log('✅ Preset gelöscht:', name);
                return true;
            } catch (err) {
                console.error('❌ Löschen fehlgeschlagen:', err);
                return false;
            }
        }
        return false;
    }

    loadCustomPresets() {
        try {
            const stored = localStorage.getItem('eq-custom-presets');
            if (stored) {
                this.customPresets = JSON.parse(stored);
                // console.log('✅ Custom-Presets geladen:', Object.keys(this.customPresets).length);
            }
        } catch (err) {
            console.warn('⚠️ Fehler beim Laden der Custom-Presets:', err);
            this.customPresets = {};
        }
    }

    getAllPresets() {
        return {
            ...this.presets,
            ...Object.keys(this.customPresets).reduce((acc, key) => {
                acc[key] = this.customPresets[key];
                return acc;
            }, {})
        };
    }

    reset() {
        this.filters.forEach(f => f.gain.value = 0);
        this.bassBoostFilter.gain.value = 0;
        this.currentPreset = 'flat';
        console.log('🔄 Equalizer zurückgesetzt');
    }

    // Alias für toggle (wird von HTML verwendet)
    toggle(enabled) {
        this.toggleEnabled(enabled);
    }
}

// Global verfügbar machen
window.EqualizerEngine = EqualizerEngine;
window.equalizerEngine = new EqualizerEngine();
console.log('✅ Equalizer Engine global verfügbar als window.equalizerEngine');

if (typeof module !== 'undefined' && module.exports) module.exports = EqualizerEngine;
