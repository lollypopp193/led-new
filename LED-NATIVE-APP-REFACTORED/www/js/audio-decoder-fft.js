/**
 * AUDIO DECODER + FFT ANALYZER - Musikanalyse ohne Mikrofon
 * Dekodiert Audio-Dateien direkt und führt FFT-Analyse durch
 * @version 1.0
 * @requires Web Audio API
 */
'use strict';

class AudioDecoderFFT {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.audioBuffer = null;
        this.isAnalyzing = false;
        this.animationFrame = null;

        // FFT Configuration
        this.fftSize = 2048; // Höhere Auflösung
        this.frequencyData = null;
        this.timeDomainData = null;

        // Band Configuration (Hz Bereiche)
        this.bands = {
            subBass: { min: 20, max: 60, color: '#FF0000' },
            bass: { min: 60, max: 250, color: '#FF4400' },
            lowMid: { min: 250, max: 500, color: '#FF8800' },
            mid: { min: 500, max: 2000, color: '#FFFF00' },
            highMid: { min: 2000, max: 4000, color: '#00FF00' },
            presence: { min: 4000, max: 6000, color: '#0088FF' },
            brilliance: { min: 6000, max: 20000, color: '#0000FF' }
        };

        // Simplified bands für LED Mapping
        this.simplifiedBands = {
            bass: { min: 20, max: 250 },
            mid: { min: 250, max: 2000 },
            treble: { min: 2000, max: 20000 }
        };

        // Feature Extraction State
        this.features = {
            bass: 0,
            mid: 0,
            treble: 0,
            beat: false,
            bpm: 0,
            spectralCentroid: 0,
            spectralFlux: 0,
            rms: 0,
            zeroCrossing: 0,
            energy: 0
        };

        // Smoothing (Exponential Moving Average)
        this.smoothing = 0.7; // 0.0 - 1.0 (höher = mehr Glättung)
        this.previousFeatures = { ...this.features };

        // Sensitivity & Gain
        this.sensitivity = 1.0; // 0.1 - 2.0
        this.gain = 1.0; // 0.5 - 3.0

        // Beat Detection
        this.beatDetection = {
            enabled: true,
            threshold: 1.3, // Energy muss 1.3x über Average sein
            history: [],
            historySize: 43, // ~1 Sekunde bei 43 FPS
            lastBeatTime: 0,
            minBeatInterval: 300 // Mindestens 300ms zwischen Beats
        };

        // BPM Detection
        this.bpmDetection = {
            enabled: true,
            beatTimes: [],
            maxBeats: 20,
            lastCalculation: 0,
            calculationInterval: 2000 // Alle 2s neu berechnen
        };

        // Callbacks
        this.onAnalysisCallback = null;
        this.onBeatCallback = null;
    }

    /**
     * Initialisierung
     */
    async init() {
        try {
            // Audio Context erstellen
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();

            // Analyser Node erstellen
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = this.fftSize;
            this.analyser.smoothingTimeConstant = 0.8;

            // Buffers initialisieren
            const bufferLength = this.analyser.frequencyBinCount;
            this.frequencyData = new Uint8Array(bufferLength);
            this.timeDomainData = new Uint8Array(bufferLength);

            // console.log('✅ Audio Decoder FFT initialisiert');
            // console.log(`📊 FFT Size: ${this.fftSize}, Bins: ${bufferLength}`);
            // console.log(`🎵 Sample Rate: ${this.audioContext.sampleRate} Hz`);

            return true;
        } catch (error) {
            console.error('❌ Audio Decoder Init Fehler:', error);
            return false;
        }
    }

    /**
     * Audio-Datei laden und dekodieren
     */
    async loadAudioFile(file) {
        if (!this.audioContext) {
            console.error('❌ AudioContext nicht initialisiert');
            return false;
        }

        try {
            // console.log(`🎵 Lade Audio-Datei: ${file.name}`);

            // FileReader oder direkt ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Audio dekodieren
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // console.log(`✅ Audio dekodiert: ${this.audioBuffer.duration.toFixed(2)}s, ${this.audioBuffer.numberOfChannels} Kanäle`);
            return true;
        } catch (error) {
            console.error('❌ Audio Decode Fehler:', error);
            return false;
        }
    }

    /**
     * Audio von URL laden
     */
    async loadAudioFromURL(url) {
        if (!this.audioContext) {
            console.error('❌ AudioContext nicht initialisiert');
            return false;
        }

        try {
            // console.log(`🎵 Lade Audio von URL: ${url}`);

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // console.log(`✅ Audio dekodiert: ${this.audioBuffer.duration.toFixed(2)}s`);
            return true;
        } catch (error) {
            console.error('❌ Audio Load Fehler:', error);
            return false;
        }
    }

    /**
     * Echtzeit-Analyse starten
     */
    startAnalysis(callback) {
        if (!this.audioBuffer) {
            console.error('❌ Kein Audio geladen');
            return false;
        }

        if (this.isAnalyzing) {
            console.warn('⚠️ Analyse läuft bereits');
            return false;
        }

        try {
            this.onAnalysisCallback = callback;

            // Source Node erstellen
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.audioBuffer;
            this.source.loop = false;

            // Source → Analyser → Destination
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // Playback starten
            this.source.start(0);
            this.isAnalyzing = true;

            // Analyse-Loop starten
            this.analyzeLoop();

            // Ended Event
            this.source.onended = () => {
                // console.log('🎵 Playback beendet');
                this.stopAnalysis();
            };

            // console.log('✅ Analyse gestartet');
            return true;
        } catch (error) {
            console.error('❌ Analysis Start Fehler:', error);
            return false;
        }
    }

    /**
     * Analyse-Loop (läuft kontinuierlich)
     */
    analyzeLoop() {
        if (!this.isAnalyzing) return;

        // FFT Daten abrufen
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeDomainData);

        // Features extrahieren
        this.extractFeatures();

        // Smoothing anwenden
        this.applySmoothing();

        // Callback aufrufen
        if (this.onAnalysisCallback) {
            this.onAnalysisCallback(this.features);
        }

        // Beat Callback
        if (this.features.beat && this.onBeatCallback) {
            this.onBeatCallback(this.features.bpm);
        }

        // Nächster Frame
        this.animationFrame = requestAnimationFrame(() => this.analyzeLoop());
    }

    /**
     * Feature-Extraktion
     */
    extractFeatures() {
        const sampleRate = this.audioContext.sampleRate;
        const nyquist = sampleRate / 2;
        const binCount = this.frequencyData.length;

        // Frequency → Bin Index Mapping
        const freqToBin = (freq) => Math.floor((freq / nyquist) * binCount);

        // Bass, Mid, Treble Energy
        this.features.bass = this.getBandEnergy(
            freqToBin(this.simplifiedBands.bass.min),
            freqToBin(this.simplifiedBands.bass.max)
        );

        this.features.mid = this.getBandEnergy(
            freqToBin(this.simplifiedBands.mid.min),
            freqToBin(this.simplifiedBands.mid.max)
        );

        this.features.treble = this.getBandEnergy(
            freqToBin(this.simplifiedBands.treble.min),
            freqToBin(this.simplifiedBands.treble.max)
        );

        // Gesamt-Energy (für Beat Detection)
        this.features.energy = this.getTotalEnergy();

        // RMS (Root Mean Square) - Lautstärke
        this.features.rms = this.calculateRMS();

        // Spectral Centroid - "Helligkeit" des Sounds
        this.features.spectralCentroid = this.calculateSpectralCentroid(sampleRate);

        // Spectral Flux - Tonalität-Änderung
        this.features.spectralFlux = this.calculateSpectralFlux();

        // Zero Crossing Rate - Rausch-Indikator
        this.features.zeroCrossing = this.calculateZeroCrossingRate();

        // Beat Detection
        this.features.beat = this.detectBeat();

        // BPM Calculation
        if (this.features.beat) {
            this.updateBPM();
        }

        // Sensitivity & Gain anwenden
        this.features.bass = Math.min(1.0, this.features.bass * this.sensitivity * this.gain);
        this.features.mid = Math.min(1.0, this.features.mid * this.sensitivity * this.gain);
        this.features.treble = Math.min(1.0, this.features.treble * this.sensitivity * this.gain);
    }

    /**
     * Band Energy berechnen (normalisiert 0-1)
     */
    getBandEnergy(startBin, endBin) {
        let sum = 0;
        let count = 0;

        for (let i = startBin; i <= endBin && i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
            count++;
        }

        const average = count > 0 ? sum / count : 0;
        return average / 255.0; // Normalisiert
    }

    /**
     * Gesamt-Energy
     */
    getTotalEnergy() {
        let sum = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (this.frequencyData.length * 255.0);
    }

    /**
     * RMS (Root Mean Square) - Lautstärke
     */
    calculateRMS() {
        let sumSquares = 0;
        for (let i = 0; i < this.timeDomainData.length; i++) {
            const normalized = (this.timeDomainData[i] - 128) / 128.0;
            sumSquares += normalized * normalized;
        }
        return Math.sqrt(sumSquares / this.timeDomainData.length);
    }

    /**
     * Spectral Centroid - "Helligkeit"
     */
    calculateSpectralCentroid(sampleRate) {
        let numerator = 0;
        let denominator = 0;

        for (let i = 0; i < this.frequencyData.length; i++) {
            const frequency = (i * sampleRate) / (this.frequencyData.length * 2);
            const magnitude = this.frequencyData[i];
            numerator += frequency * magnitude;
            denominator += magnitude;
        }

        return denominator > 0 ? numerator / denominator : 0;
    }

    /**
     * Spectral Flux - Tonalität-Änderung
     */
    calculateSpectralFlux() {
        if (!this.previousFrequencyData) {
            this.previousFrequencyData = new Uint8Array(this.frequencyData);
            return 0;
        }

        let flux = 0;
        for (let i = 0; i < this.frequencyData.length; i++) {
            const diff = this.frequencyData[i] - this.previousFrequencyData[i];
            flux += diff > 0 ? diff : 0;
        }

        // Previous speichern
        this.previousFrequencyData = new Uint8Array(this.frequencyData);

        return flux / (this.frequencyData.length * 255.0);
    }

    /**
     * Zero Crossing Rate - Rauschen
     */
    calculateZeroCrossingRate() {
        let crossings = 0;
        for (let i = 1; i < this.timeDomainData.length; i++) {
            const prev = this.timeDomainData[i - 1] - 128;
            const curr = this.timeDomainData[i] - 128;
            if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
                crossings++;
            }
        }
        return crossings / this.timeDomainData.length;
    }

    /**
     * Beat Detection (Energy-based)
     */
    detectBeat() {
        if (!this.beatDetection.enabled) return false;

        const currentEnergy = this.features.energy;
        const now = Date.now();

        // History updaten
        this.beatDetection.history.push(currentEnergy);
        if (this.beatDetection.history.length > this.beatDetection.historySize) {
            this.beatDetection.history.shift();
        }

        // Average Energy berechnen
        const avgEnergy = this.beatDetection.history.reduce((a, b) => a + b, 0) / this.beatDetection.history.length;

        // Beat wenn: aktuelle Energy > Threshold * Average
        const isBeat = currentEnergy > (this.beatDetection.threshold * avgEnergy);

        // Min Interval zwischen Beats
        const timeSinceLastBeat = now - this.beatDetection.lastBeatTime;
        if (isBeat && timeSinceLastBeat > this.beatDetection.minBeatInterval) {
            this.beatDetection.lastBeatTime = now;
            return true;
        }

        return false;
    }

    /**
     * BPM Update (aus Beat Times)
     */
    updateBPM() {
        const now = Date.now();

        // Beat Time speichern
        this.bpmDetection.beatTimes.push(now);
        if (this.bpmDetection.beatTimes.length > this.bpmDetection.maxBeats) {
            this.bpmDetection.beatTimes.shift();
        }

        // BPM berechnen (alle 2s)
        if (now - this.bpmDetection.lastCalculation > this.bpmDetection.calculationInterval) {
            this.bpmDetection.lastCalculation = now;

            if (this.bpmDetection.beatTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < this.bpmDetection.beatTimes.length; i++) {
                    intervals.push(this.bpmDetection.beatTimes[i] - this.bpmDetection.beatTimes[i - 1]);
                }

                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                this.features.bpm = Math.round(60000 / avgInterval);

                // console.log(`🥁 BPM: ${this.features.bpm}`);
            }
        }
    }

    /**
     * Smoothing (Exponential Moving Average)
     */
    applySmoothing() {
        const alpha = 1.0 - this.smoothing; // 0 = full smoothing, 1 = no smoothing

        this.features.bass = alpha * this.features.bass + (1 - alpha) * this.previousFeatures.bass;
        this.features.mid = alpha * this.features.mid + (1 - alpha) * this.previousFeatures.mid;
        this.features.treble = alpha * this.features.treble + (1 - alpha) * this.previousFeatures.treble;
        this.features.rms = alpha * this.features.rms + (1 - alpha) * this.previousFeatures.rms;

        this.previousFeatures = { ...this.features };
    }

    /**
     * Analyse stoppen
     */
    stopAnalysis() {
        if (!this.isAnalyzing) return;

        try {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }

            if (this.source) {
                this.source.stop();
                this.source.disconnect();
                this.source = null;
            }

            this.isAnalyzing = false;
            // console.log('🛑 Analyse gestoppt');
        } catch (error) {
            console.error('❌ Stop Analysis Fehler:', error);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopAnalysis();

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }

        // console.log('🗑️ Audio Decoder destroyed');
    }

    /**
     * Setter für Konfigurationen
     */
    setSensitivity(value) {
        this.sensitivity = Math.max(0.1, Math.min(2.0, value));
        // console.log(`🎚️ Sensitivity: ${this.sensitivity}`);
    }

    setSmoothing(value) {
        this.smoothing = Math.max(0.0, Math.min(1.0, value));
        // console.log(`🎚️ Smoothing: ${this.smoothing}`);
    }

    setGain(value) {
        this.gain = Math.max(0.5, Math.min(3.0, value));
        // console.log(`🎚️ Gain: ${this.gain}`);
    }

    setBeatThreshold(value) {
        this.beatDetection.threshold = Math.max(1.0, Math.min(2.0, value));
        // console.log(`🥁 Beat Threshold: ${this.beatDetection.threshold}`);
    }

    /**
     * Beat Callback registrieren
     */
    onBeat(callback) {
        this.onBeatCallback = callback;
    }
}

// Global verfügbar machen
window.AudioDecoderFFT = AudioDecoderFFT;
// console.log('✅ Audio Decoder FFT geladen');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioDecoderFFT;
}
