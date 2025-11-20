/**
 * BPM Analyzer & Beat-Matching
 * Erkennt BPM (Beats Per Minute) und synchronisiert Tracks
 */

class BPMAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyzer = null;
        this.bufferLength = 2048;
        this.dataArray = null;

        this.bpm = 0;
        this.lastBeatTime = 0;
        this.beatThreshold = 0.8;
        this.beatHistory = [];
        this.maxBeatHistory = 20;

        this.isAnalyzing = false;
        this.analysisInterval = null;
    }

    /**
     * Initialisiert den BPM-Analyzer
     * @param {AudioContext} audioContext
     */
    init(audioContext) {
        this.audioContext = audioContext;

        this.analyzer = this.audioContext.createAnalyser();
        this.analyzer.fftSize = this.bufferLength;
        this.bufferLength = this.analyzer.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        console.log('✅ BPM-Analyzer initialisiert');
    }

    /**
     * Verbindet eine Audio-Quelle mit dem Analyzer
     * @param {AudioNode} sourceNode
     */
    connectSource(sourceNode) {
        if (!this.analyzer) {
            console.warn('⚠️ Analyzer nicht initialisiert');
            return;
        }

        sourceNode.connect(this.analyzer);
        console.log('🔊 Audio-Quelle mit BPM-Analyzer verbunden');
    }

    /**
     * Startet die BPM-Analyse
     */
    startAnalysis() {
        if (this.isAnalyzing || !this.analyzer) {
            return;
        }

        this.isAnalyzing = true;
        this.beatHistory = [];

        console.log('🎵 BPM-Analyse gestartet');

        this.analysisInterval = setInterval(() => {
            this.detectBeat();
        }, 50); // Prüfe alle 50ms
    }

    /**
     * Stoppt die BPM-Analyse
     */
    stopAnalysis() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }

        this.isAnalyzing = false;
        console.log('🛑 BPM-Analyse gestoppt');
    }

    /**
     * Erkennt einen Beat im Audio-Signal
     */
    detectBeat() {
        if (!this.analyzer || !this.dataArray) return;

        this.analyzer.getByteFrequencyData(this.dataArray);

        // Berechne Energie im Bass-Bereich (20-200Hz)
        const bassStart = Math.floor((20 / (this.audioContext.sampleRate / 2)) * this.bufferLength);
        const bassEnd = Math.floor((200 / (this.audioContext.sampleRate / 2)) * this.bufferLength);

        let bassEnergy = 0;
        for (let i = bassStart; i < bassEnd; i++) {
            bassEnergy += this.dataArray[i];
        }
        bassEnergy /= (bassEnd - bassStart);
        bassEnergy /= 255; // Normalisiere 0-1

        // Beat erkannt?
        if (bassEnergy > this.beatThreshold) {
            const now = Date.now();
            const timeSinceLastBeat = now - this.lastBeatTime;

            // Verhindere zu schnelle Beats (<200ms)
            if (timeSinceLastBeat > 200) {
                this.lastBeatTime = now;
                this.beatHistory.push(timeSinceLastBeat);

                // Begrenze History
                if (this.beatHistory.length > this.maxBeatHistory) {
                    this.beatHistory.shift();
                }

                // Berechne BPM
                this.calculateBPM();

                // Trigger Beat-Event
                window.dispatchEvent(new CustomEvent('beatDetected', {
                    detail: { bpm: this.bpm, energy: bassEnergy }
                }));
            }
        }
    }

    /**
     * Berechnet BPM aus Beat-History
     */
    calculateBPM() {
        if (this.beatHistory.length < 4) return;

        // Durchschnittliche Zeit zwischen Beats
        const avgInterval = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;

        // BPM = (60000ms / avgInterval)
        this.bpm = Math.round(60000 / avgInterval);

        // BPM Range: 60-200
        this.bpm = Math.max(60, Math.min(200, this.bpm));

        // Update UI
        this.updateUI();
    }

    /**
     * Tempo-Sync für Beat-Matching
     * @param {number} targetBPM - Ziel-BPM
     * @returns {number} Playback-Rate
     */
    calculateTempoSync(targetBPM) {
        if (this.bpm === 0 || targetBPM === 0) {
            return 1.0; // Keine Anpassung
        }

        // Playback-Rate = targetBPM / currentBPM
        const rate = targetBPM / this.bpm;

        // Begrenze auf sinnvolle Werte (0.9-1.1)
        return Math.max(0.9, Math.min(1.1, rate));
    }

    /**
     * Findet den optimalen Crossfade-Punkt basierend auf Beats
     * @param {HTMLAudioElement} audio
     * @returns {number} Zeit in Sekunden
     */
    findBeatAlignedCrossfadePoint(audio) {
        if (this.bpm === 0 || !audio.duration) {
            return audio.duration - 3; // Default: 3s vor Ende
        }

        // Sekunden pro Beat
        const secondsPerBeat = 60 / this.bpm;

        // Finde letzten Beat vor Ende
        const tracklength = audio.duration;
        const beats = Math.floor(tracklength / secondsPerBeat);

        // Crossfade auf letztem Beat - 4 Beats
        const crossfadePoint = (beats - 4) * secondsPerBeat;

        return Math.max(0, crossfadePoint);
    }

    /**
     * Getter
     */
    getCurrentBPM() {
        return this.bpm;
    }

    isActive() {
        return this.isAnalyzing;
    }

    /**
     * UI Update
     */
    updateUI() {
        const bpmDisplay = document.getElementById('bpmDisplay');
        if (bpmDisplay) {
            bpmDisplay.textContent = `${this.bpm} BPM`;
        }

        // Event für andere Module
        window.dispatchEvent(new CustomEvent('bpmUpdated', {
            detail: { bpm: this.bpm }
        }));
    }

    /**
     * Cleanup
     */
    dispose() {
        this.stopAnalysis();

        if (this.analyzer) {
            this.analyzer.disconnect();
            this.analyzer = null;
        }

        console.log('🧹 BPM-Analyzer disposed');
    }
}

// Globale Instanz
const bpmAnalyzer = new BPMAnalyzer();

// Export
window.bpmAnalyzer = bpmAnalyzer;

console.log('✅ BPM-Analyzer geladen');
