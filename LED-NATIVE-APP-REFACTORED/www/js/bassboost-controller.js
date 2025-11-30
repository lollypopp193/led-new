/**
 * Bassboost Controller
 * Verstärkt tiefe Frequenzen (20-250Hz) für kraftvollere Bässe
 */

class BassBoostController {
    constructor() {
        this.enabled = false;
        this.intensity = 0; // 0-12 dB
        this.audioContext = null;
        this.bassFilter = null;
        this.sourceNode = null;
        this.initialized = false;

        // Lade gespeicherten Zustand
        this.loadState();
    }

    /**
     * Initialisiert das Bassboost-System
     * @param {AudioContext} audioContext - Web Audio API Context
     * @param {AudioNode} sourceNode - Audio-Source-Node
     */
    async init(audioContext, sourceNode) {
        if (this.initialized && this.audioContext === audioContext) {
            return; // Bereits initialisiert
        }

        try {
            this.audioContext = audioContext;
            this.sourceNode = sourceNode;

            // Erstelle Biquad-Filter für Bass-Verstärkung
            this.bassFilter = this.audioContext.createBiquadFilter();
            this.bassFilter.type = 'lowshelf'; // Low-shelf filter für Bässe
            this.bassFilter.frequency.value = 200; // Frequenz: 200 Hz
            this.bassFilter.gain.value = this.intensity; // Gain in dB

            // Verbinde Filter
            if (this.sourceNode && this.bassFilter) {
                this.sourceNode.connect(this.bassFilter);
                this.bassFilter.connect(this.audioContext.destination);
            }

            this.initialized = true;
            console.log('✅ Bassboost initialisiert');

            // Wende gespeicherten Zustand an
            this.applyState();

        } catch (err) {
            console.error('❌ Bassboost Init-Fehler:', err);
            this.initialized = false;
        }
    }

    /**
     * Aktiviert/Deaktiviert Bassboost
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;

        if (!this.initialized) {
            console.warn('⚠️ Bassboost nicht initialisiert');
            return;
        }

        if (enabled) {
            this.bassFilter.gain.value = this.intensity;
            console.log(`🔊 Bassboost aktiviert: ${this.intensity}dB`);

            if (window.showGlobalNotification) {
                window.showGlobalNotification(`Bass Boost aktiviert: ${this.intensity}dB`, 'success');
            }
        } else {
            this.bassFilter.gain.value = 0;
            console.log('🔇 Bassboost deaktiviert');

            if (window.showGlobalNotification) {
                window.showGlobalNotification('Bass Boost deaktiviert', 'info');
            }
        }

        this.saveState();
        this.updateUI();
    }

    /**
     * Setzt die Intensität (0-12 dB)
     * @param {number} intensity - Wert von 0-12
     */
    setIntensity(intensity) {
        intensity = Math.max(0, Math.min(12, intensity)); // Clamp 0-12
        this.intensity = intensity;

        if (!this.initialized) {
            console.warn('⚠️ Bassboost nicht initialisiert');
            return;
        }

        if (this.enabled && this.bassFilter) {
            this.bassFilter.gain.value = intensity;
            console.log(`🎚️ Bassboost Intensität: ${intensity}dB`);
        }

        this.saveState();
        this.updateUI();
    }

    /**
     * Gibt den aktuellen Zustand zurück
     * @returns {object}
     */
    getState() {
        return {
            enabled: this.enabled,
            intensity: this.intensity,
            initialized: this.initialized
        };
    }

    /**
     * Speichert den Zustand im LocalStorage
     */
    saveState() {
        try {
            const state = {
                enabled: this.enabled,
                intensity: this.intensity
            };
            localStorage.setItem('bassboost-state', JSON.stringify(state));
        } catch (err) {
            console.error('❌ Fehler beim Speichern von Bassboost:', err);
        }
    }

    /**
     * Lädt den Zustand aus LocalStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('bassboost-state');
            if (saved) {
                const state = JSON.parse(saved);
                this.enabled = state.enabled || false;
                this.intensity = state.intensity || 0;
                console.log('📥 Bassboost-State geladen:', state);
            }
        } catch (err) {
            console.error('❌ Fehler beim Laden von Bassboost:', err);
        }
    }

    /**
     * Wendet den gespeicherten Zustand an
     */
    applyState() {
        if (this.initialized && this.enabled) {
            this.setEnabled(true);
        }
        this.updateUI();
    }

    /**
     * Aktualisiert die UI-Elemente
     */
    updateUI() {
        const toggle = document.getElementById('bassBoostToggle');
        const slider = document.getElementById('bassBoostIntensity');
        const value = document.getElementById('bassBoostValue');

        if (toggle) {
            toggle.checked = this.enabled;
        }

        if (slider) {
            slider.value = this.intensity;
            slider.disabled = !this.enabled;
        }

        if (value) {
            value.textContent = `${this.intensity}dB`;
        }
    }

    /**
     * Bindet Event-Listener an UI-Elemente
     */
    bindUI() {
        const toggle = document.getElementById('bassBoostToggle');
        const slider = document.getElementById('bassBoostIntensity');

        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.setEnabled(e.target.checked);
            });
        }

        if (slider) {
            slider.addEventListener('input', (e) => {
                this.setIntensity(parseInt(e.target.value));
            });
        }

        // Initial UI-Update
        this.updateUI();

        console.log('🎛️ Bassboost UI gebunden');
    }

    /**
     * Cleanup / Disconnect
     */
    dispose() {
        if (this.bassFilter && this.sourceNode) {
            try {
                this.sourceNode.disconnect(this.bassFilter);
                this.bassFilter.disconnect();
            } catch (err) {
                console.warn('⚠️ Bassboost Disconnect-Warnung:', err);
            }
        }

        this.initialized = false;
        this.bassFilter = null;
        console.log('🧹 Bassboost disposed');
    }
}

// Globale Instanz
const bassBoostController = new BassBoostController();

// Auto-Init UI
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bassBoostController.bindUI());
} else {
    bassBoostController.bindUI();
}

// Globaler Export
window.bassBoostController = bassBoostController;
window.BassBoostController = bassBoostController; // Alias für HTML-Zugriff

console.log('✅ Bassboost-Controller geladen');
