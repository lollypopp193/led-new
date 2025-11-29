/**
 * Crossfade Controller
 * Nahtlose Übergänge zwischen Tracks mit verschiedenen Fade-Kurven
 */

class CrossfadeController {
    constructor() {
        this.enabled = false;
        this.duration = 3.0; // Sekunden
        this.type = 'linear'; // linear, exponential, logarithmic, s-curve
        this.autoDetectEnd = true;
        this.beatMatching = false;
        this.preLoad = true;

        this.currentAudio = null;
        this.nextAudio = null;
        this.audioContext = null;
        this.gainNodes = { current: null, next: null };

        this.isFading = false;
        this.fadeInterval = null;

        // Lade gespeicherten Zustand
        this.loadState();
    }

    /**
     * Initialisiert das Crossfade-System
     * @param {AudioContext} audioContext
     */
    init(audioContext) {
        this.audioContext = audioContext;

        // Erstelle Gain-Nodes für Fade-Control
        this.gainNodes.current = this.audioContext.createGain();
        this.gainNodes.next = this.audioContext.createGain();

        // Initial: Current voll, Next still
        this.gainNodes.current.gain.value = 1.0;
        this.gainNodes.next.gain.value = 0.0;

        console.log('✅ Crossfade-System initialisiert');
    }

    /**
     * Verbindet ein Audio-Element mit dem Crossfade-System
     * @param {HTMLAudioElement} audio
     * @param {string} channel - 'current' oder 'next'
     */
    connectAudio(audio, channel = 'current') {
        if (!this.audioContext) {
            console.warn('⚠️ AudioContext nicht initialisiert');
            return;
        }

        try {
            const source = this.audioContext.createMediaElementSource(audio);
            const gainNode = this.gainNodes[channel];

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            if (channel === 'current') {
                this.currentAudio = audio;
            } else {
                this.nextAudio = audio;
            }

            console.log(`🔊 Audio verbunden: ${channel}`);
        } catch (err) {
            console.error(`❌ Fehler beim Verbinden von ${channel}:`, err);
        }
    }

    /**
     * Startet einen Crossfade zwischen Current und Next
     * @returns {Promise}
     */
    async startCrossfade() {
        if (!this.enabled || this.isFading) {
            return;
        }

        if (!this.currentAudio || !this.nextAudio) {
            console.warn('⚠️ Kein Audio zum Crossfaden');
            return;
        }

        this.isFading = true;
        console.log(`🎚️ Crossfade startet: ${this.duration}s (${this.type})`);

        const startTime = Date.now();
        const duration = this.duration * 1000; // ms

        // Starte Next-Track
        try {
            await this.nextAudio.play();
        } catch (err) {
            console.error('❌ Next-Track Play-Fehler:', err);
            this.isFading = false;
            return;
        }

        // Fade-Loop
        this.fadeInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1.0);

            // Fade-Kurve anwenden
            const fadeValue = this.calculateFade(progress);

            // Current faden out, Next faden in
            this.gainNodes.current.gain.value = 1.0 - fadeValue;
            this.gainNodes.next.gain.value = fadeValue;

            // Fertig?
            if (progress >= 1.0) {
                clearInterval(this.fadeInterval);
                this.completeFade();
            }
        }, 10); // Update alle 10ms
    }

    /**
     * Berechnet Fade-Wert basierend auf Kurven-Typ
     * @param {number} progress - 0.0 bis 1.0
     * @returns {number} Fade-Wert 0.0 bis 1.0
     */
    calculateFade(progress) {
        switch (this.type) {
            case 'linear':
                return progress;

            case 'exponential':
                // Exponentieller Fade (schneller Start)
                return Math.pow(progress, 2);

            case 'logarithmic':
                // Logarithmischer Fade (langsamer Start)
                return Math.sqrt(progress);

            case 's-curve':
                // S-Kurve (smooth in/out)
                return progress < 0.5
                    ? 2 * Math.pow(progress, 2)
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            default:
                return progress;
        }
    }

    /**
     * Beendet den Fade und wechselt die Audio-Referenzen
     */
    completeFade() {
        // Stoppe Current-Track
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }

        // Next wird zu Current
        const temp = this.currentAudio;
        this.currentAudio = this.nextAudio;
        this.nextAudio = temp;

        // Gain-Nodes tauschen
        this.gainNodes.current.gain.value = 1.0;
        this.gainNodes.next.gain.value = 0.0;

        this.isFading = false;
        console.log('✅ Crossfade beendet');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('Track-Wechsel abgeschlossen', 'success');
        }
    }

    /**
     * Pre-Load nächsten Track
     * @param {string} url - Audio-URL
     */
    preLoadNextTrack(url) {
        if (!this.preLoad) return;

        if (this.nextAudio) {
            this.nextAudio.src = url;
            this.nextAudio.load();
            console.log('📥 Next-Track vorgeladen:', url);
        }
    }

    /**
     * Auto-Detect Song-End Handler
     * @param {HTMLAudioElement} audio
     * @param {Function} onNearEnd - Callback wenn Track fast zu Ende
     */
    setupAutoDetect(audio, onNearEnd) {
        if (!this.autoDetectEnd) return;

        audio.addEventListener('timeupdate', () => {
            if (audio.duration > 0) {
                const remaining = audio.duration - audio.currentTime;

                // Trigger Crossfade X Sekunden vor Ende
                if (remaining <= this.duration && remaining > this.duration - 0.5) {
                    if (typeof onNearEnd === 'function') {
                        onNearEnd();
                    }
                }
            }
        });
    }

    /**
     * Getter/Setter
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveState();
        this.updateUI();

        if (window.showGlobalNotification) {
            window.showGlobalNotification(
                enabled ? 'Crossfade aktiviert' : 'Crossfade deaktiviert',
                'success'
            );
        }
    }

    setDuration(duration) {
        this.duration = Math.max(0, Math.min(10, duration)); // 0-10s
        this.saveState();
        this.updateUI();
    }

    setType(type) {
        if (['linear', 'exponential', 'logarithmic', 's-curve'].includes(type)) {
            this.type = type;
            this.saveState();
            this.updateUI();

            if (window.showGlobalNotification) {
                window.showGlobalNotification(`Fade-Typ: ${type}`, 'info');
            }
        }
    }

    setAutoDetect(enabled) {
        this.autoDetectEnd = enabled;
        this.saveState();
    }

    setBeatMatching(enabled) {
        this.beatMatching = enabled;
        this.saveState();
    }

    setPreLoad(enabled) {
        this.preLoad = enabled;
        this.saveState();
    }

    /**
     * State Management
     */
    getState() {
        return {
            enabled: this.enabled,
            duration: this.duration,
            type: this.type,
            autoDetectEnd: this.autoDetectEnd,
            beatMatching: this.beatMatching,
            preLoad: this.preLoad
        };
    }

    saveState() {
        try {
            localStorage.setItem('crossfade-state', JSON.stringify(this.getState()));
        } catch (err) {
            console.error('❌ Fehler beim Speichern von Crossfade:', err);
        }
    }

    loadState() {
        try {
            const saved = localStorage.getItem('crossfade-state');
            if (saved) {
                const state = JSON.parse(saved);
                Object.assign(this, state);
                console.log('📥 Crossfade-State geladen:', state);
            }
        } catch (err) {
            console.error('❌ Fehler beim Laden von Crossfade:', err);
        }
    }

    /**
     * UI Binding
     */
    updateUI() {
        const toggleEl = document.getElementById('crossfadeToggle');
        const durationEl = document.getElementById('crossfadeDuration');
        const durationValueEl = document.getElementById('crossfadeDurationValue');
        const typeEl = document.getElementById('crossfadeType');
        const autoEl = document.getElementById('crossfadeAutoDetect');
        const beatEl = document.getElementById('crossfadeBeatMatch');
        const preEl = document.getElementById('crossfadePreLoad');

        if (toggleEl) toggleEl.checked = this.enabled;
        if (durationEl) {
            durationEl.value = this.duration;
            durationEl.disabled = !this.enabled;
        }
        if (durationValueEl) durationValueEl.textContent = `${this.duration.toFixed(1)}s`;
        if (typeEl) {
            typeEl.value = this.type;
            typeEl.disabled = !this.enabled;
        }
        if (autoEl) autoEl.checked = this.autoDetectEnd;
        if (beatEl) beatEl.checked = this.beatMatching;
        if (preEl) preEl.checked = this.preLoad;
    }

    bindUI() {
        const toggleEl = document.getElementById('crossfadeToggle');
        const durationEl = document.getElementById('crossfadeDuration');
        const typeEl = document.getElementById('crossfadeType');
        const autoEl = document.getElementById('crossfadeAutoDetect');
        const beatEl = document.getElementById('crossfadeBeatMatch');
        const preEl = document.getElementById('crossfadePreLoad');

        if (toggleEl) {
            toggleEl.addEventListener('change', (e) => this.setEnabled(e.target.checked));
        }
        if (durationEl) {
            durationEl.addEventListener('input', (e) => this.setDuration(parseFloat(e.target.value)));
        }
        if (typeEl) {
            typeEl.addEventListener('change', (e) => this.setType(e.target.value));
        }
        if (autoEl) {
            autoEl.addEventListener('change', (e) => this.setAutoDetect(e.target.checked));
        }
        if (beatEl) {
            beatEl.addEventListener('change', (e) => this.setBeatMatching(e.target.checked));
        }
        if (preEl) {
            preEl.addEventListener('change', (e) => this.setPreLoad(e.target.checked));
        }

        this.updateUI();
        console.log('🎛️ Crossfade UI gebunden');
    }
}

// Globale Instanz
const crossfadeController = new CrossfadeController();

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => crossfadeController.bindUI());
} else {
    crossfadeController.bindUI();
}

// Export
window.crossfadeController = crossfadeController;

console.log('✅ Crossfade-Controller geladen');
