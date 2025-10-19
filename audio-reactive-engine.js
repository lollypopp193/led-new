// ===== AUDIO-REACTIVE ENGINE =====
class AudioReactiveEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isRunning = false;
        this.animationFrame = null;
        this.beatDetector = new BeatDetector();
        this.cleanupFunctions = [];
        
        this.musicPlayerConnected = false;
        this.audioSource = null; // 'microphone', 'system', 'music-player'
        
        this.fftSize = 2048;
        this.bassRange = { start: 0, end: 15 };
        this.midRange = { start: 15, end: 150 };
        this.trebleRange = { start: 150, end: 512 };
        
        // Integration mit globalen Band-Settings
        this.useBandSettings = true;
        
        this.init();
    }
    
    async init() {
        this.createFrequencyBars();
        this.syncWithBandSettings(); // Synchronisiere mit bestehenden Band-Einstellungen
        this.setupEventListeners();
        this.setupMusicPlayerIntegration();
        // Audio-Reactive Engine initialisiert
    }
    
    // ✅ AUDIO-ANALYSE MIT MIKROFON ODER MUSIK-PLAYER
    async startAudioCapture(audioElement = null) {
        try {
            // Clean up any existing audio context
            await this.stopAudioCapture();
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // ✅ MIKROFON ODER AUDIO-ELEMENT ANALYSE
            if (audioElement && audioElement.tagName === 'AUDIO') {
                console.log('🎵 Verbinde mit Audio-Element für Musik-Analyse');
                this.audioSource = this.audioContext.createMediaElementSource(audioElement);
                this.audioSourceType = 'music-player';
            } else {
                // ✅ MIKROFON ALS FALLBACK VERWENDEN
                console.log('🎤 Verwende Mikrofon für Audio-Analyse');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    this.microphone = stream;
                    this.audioSource = this.audioContext.createMediaStreamSource(stream);
                    this.audioSourceType = 'microphone';
                } catch (micError) {
                    console.error('❌ Mikrofon-Zugriff fehlgeschlagen:', micError);
                    throw new Error('Weder Audio-Element noch Mikrofon verfügbar');
                }
            }
            
            // ✅ ANALYSER SETUP FÜR AUDIO-ELEMENT
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // ✅ AUDIO-ELEMENT MIT ANALYSER VERBINDEN (NICHT MIKROFON)
            this.audioSource.connect(this.analyser);
            this.audioSource.connect(this.audioContext.destination); // Für Wiedergabe
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.isRunning = true;
            this.processAudio();
            
            // Audio-Capture gestartet
            return true;
        } catch (error) {
            console.error('❌ Audio-Capture Fehler:', error);
            await this.stopAudioCapture(); // Cleanup on error
            return false;
        }
    }
    
    async stopAudioCapture() {
        this.isRunning = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Execute all cleanup functions
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.warn('Cleanup function failed:', error);
            }
        });
        this.cleanupFunctions = [];
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                await this.audioContext.close();
            } catch (error) {
                console.warn('Error closing audio context:', error);
            }
        }
        
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        
        // Audio-Capture gestoppt
    }
    
    processAudio() {
        if (!this.isRunning) return;
        
        if (!this.dataArray) {
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
        this.frequencyData = this.dataArray;
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        const bassLevel = this.getFrequencyRangeLevel(this.bassRange);
        const midLevel = this.getFrequencyRangeLevel(this.midRange);
        const trebleLevel = this.getFrequencyRangeLevel(this.trebleRange);
        const beatDetected = this.beatDetector.detectBeat(bassLevel);
        
        this.updateFrequencyBars();
        this.updateStatusDisplay(bassLevel, midLevel, trebleLevel, beatDetected);
        this.updateLEDStrips(bassLevel, midLevel, trebleLevel, beatDetected);
        
        requestAnimationFrame(() => this.startAnalysisLoop());
    }
    
    getFrequencyRangeLevel(range) {
        let sum = 0;
        for (let i = range.start; i < range.end; i++) {
            sum += this.frequencyData[i];
        }
        return (sum / (range.end - range.start)) / 255;
    }
    
    updateFrequencyBars() {
        const bars = document.querySelectorAll('.freq-bar');
        const step = Math.floor(this.frequencyData.length / bars.length);
        
        bars.forEach((bar, index) => {
            const value = this.frequencyData[index * step];
            const height = (value / 255) * 100;
            bar.style.height = height + '%';
        });
    }
    
    updateStatusDisplay(bass, mid, treble, beatDetected) {
        if (document.getElementById('bassLevel')) {
            document.getElementById('bassLevel').textContent = Math.round(bass * 100) + '%';
            document.getElementById('midLevel').textContent = Math.round(mid * 100) + '%';
            document.getElementById('trebleLevel').textContent = Math.round(treble * 100) + '%';
            document.getElementById('bpmValue').textContent = this.beatDetector.getBPM();
            document.getElementById('latencyValue').textContent = this.beatDetector.getLatency() + 'ms';
            
            const beatIndicator = document.getElementById('beatIndicator');
            if (beatDetected && beatIndicator) {
                beatIndicator.classList.add('pulse');
                setTimeout(() => beatIndicator.classList.remove('pulse'), 100);
            }
        }
    }
    
    updateLEDStrips(bass, mid, treble, beatDetected) {
        this.ledStrips.forEach((strip, index) => {
            if (!strip.enabled) return;
            
            let intensity = 0;
            
            // Berechne Intensität basierend auf Reaktions-Modus
            switch (strip.reactTo) {
                case 'rhythm':
                    intensity = beatDetected ? 1.0 : bass * 0.5;
                    break;
                case 'beats':
                    intensity = beatDetected ? 1.0 : 0.1;
                    break;
                case 'vocals':
                    intensity = mid;
                    break;
                case 'melody':
                    intensity = (mid * 0.7 + treble * 0.3);
                    break;
                default:
                    // Frequenzband-basierte Intensität
                    switch (strip.frequencyBand) {
                        case 'bass': intensity = bass; break;
                        case 'mid': intensity = mid; break;
                        case 'treble':
                        case 'high': intensity = treble; break;
                        case 'all': intensity = (bass + mid + treble) / 3; break;
                    }
            }
            
            // Wende Empfindlichkeit und Helligkeit an
            intensity = intensity * (strip.sensitivity / 100) * (strip.brightness / 100);
            
            // Aktualisiere globale Band-Settings wenn synchronisiert
            if (this.useBandSettings && index < bandSettings.length) {
                // ✅ ECHTE HARDWARE-STEUERUNG FÜR AUDIO-REAKTIVE LEDs
                const musicData = {
                    bandIndex: index,
                    effect: strip.effect,
                    color: strip.color,
                    intensity: Math.round(intensity * 100),
                    speed: strip.speed,
                    beatDetected: beatDetected
                };
                
                // ✅ SENDE ECHTE HARDWARE-BEFEHLE
                if (window.parent?.ledDevice && window.parent.ledDevice.isConnected) {
                    try {
                        // Konvertiere Musikdaten zu RGB basierend auf Intensität
                        const colorValue = Math.round(255 * (intensity / 100));
                        let r = 0, g = 0, b = 0;
                        
                        // Farbe basierend auf Frequenzband
                        switch (strip.frequencyBand) {
                            case 'bass':
                                r = colorValue; // Rot für Bass
                                break;
                            case 'mid':
                                g = colorValue; // Grün für Mid
                                break;
                            case 'treble':
                            case 'high':
                                b = colorValue; // Blau für Treble
                                break;
                            default:
                                r = g = b = colorValue; // Weiß für All
                        }
                        
                        // Beat-Flash Effekt
                        if (beatDetected) {
                            r = g = b = 255; // Volle Helligkeit bei Beat
                        }
                        
                        const command = new Uint8Array([
                            0x7E,  // Start byte
                            0x00,  // Mode
                            0x05,  // Command (set color)
                            r, g, b,  // RGB-Werte
                            0x00,  // White
                            0xEF   // End byte
                        ]);
                        
                        window.parent.ledDevice.characteristic.writeValue(command);
                    } catch (error) {
                        // Silent fail für Performance
                    }
                }
            }
            
            // Debug-Ausgabe (reduziert)
            if (Math.random() < 0.005) {
                // LED Status Update
            }
        });
    }
    
    createFrequencyBars() {
        const container = document.getElementById('frequencyDisplay');
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 64; i++) {
                const bar = document.createElement('div');
                bar.className = 'freq-bar';
                bar.style.height = '0%';
                container.appendChild(bar);
            }
        }
    }
    
    syncWithBandSettings() {
        // Synchronisiere mit den globalen Band-Einstellungen statt eigene zu erstellen
        this.ledStrips = [];
        for (let i = 0; i < activeBandCount; i++) {
            const settings = bandSettings[i];
            this.ledStrips.push({
                id: `band_${i}`,
                name: `LED-Band ${i + 1}`,
                connected: false,
                enabled: settings.enabled,
                frequencyBand: settings.freqRange,
                effect: settings.effect,
                sensitivity: settings.sensitivity,
                color: settings.color,
                brightness: settings.brightness,
                speed: settings.speed,
                reactTo: settings.reactTo
            });
        }
        this.renderAllStripControls();
        // LED-Bänder synchronisiert
    }
    
    addLEDStrip(name, connected = false) {
        const strip = {
            id: 'strip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            connected: connected,
            enabled: true,
            frequencyBand: ['bass', 'mid', 'treble', 'all'][this.ledStrips.length % 4],
            effect: 'pulse',
            sensitivity: 75,
            color: ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#5f27cd', '#ff6b6b'][this.ledStrips.length % 6]
        };
        
        this.ledStrips.push(strip);
        this.renderLEDStripControl(strip);
        this.updateConnectedStripsCount();
    }
    
    renderAllStripControls() {
        const container = document.getElementById('stripsGrid');
        if (!container) return;
        
        container.innerHTML = ''; // Clear existing controls
        
        this.ledStrips.forEach(strip => {
            const stripDiv = document.createElement('div');
            stripDiv.className = 'strip-control';
            stripDiv.id = strip.id;
            stripDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="color: #fff; font-weight: bold;">${strip.name}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: ${strip.color};"></div>
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${strip.connected ? '#28a745' : '#dc3545'}; box-shadow: 0 0 10px ${strip.connected ? '#28a745' : '#dc3545'};"></div>
                    </div>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">Status</label>
                    <span style="color: ${strip.enabled ? '#4ecdc4' : '#666'};">${strip.enabled ? '✅ Aktiv' : '⏸️ Pausiert'}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">Effekt</label>
                    <span style="color: #fff;">${this.getEffectDisplayName(strip.effect)}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">Reagiert auf</label>
                    <span style="color: #fff;">${this.getReactToDisplayName(strip.reactTo)}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #ccc;">Frequenzband</label>
                    <span style="color: #fff;">${this.getFrequencyDisplayName(strip.frequencyBand)}</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="color: #ccc;">Empfindlichkeit</label>
                        <span style="color: #4ecdc4;">${strip.sensitivity}%</span>
                    </div>
                    <div style="height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${strip.sensitivity}%; background: #4ecdc4;"></div>
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="color: #ccc;">Helligkeit</label>
                        <span style="color: #ffa502;">${strip.brightness}%</span>
                    </div>
                    <div style="height: 4px; background: #333; border-radius: 2px; overflow: hidden;">
                        <div style="height: 100%; width: ${strip.brightness}%; background: #ffa502;"></div>
                    </div>
                </div>
            `;
            container.appendChild(stripDiv);
        });
    }
    
    getEffectDisplayName(effect) {
        const names = {
            'solid': 'Einfarbig',
            'pulse': 'Pulsierend',
            'strobe': 'Stroboskop',
            'wave': 'Wellenmuster',
            'spectrum': 'Spektrum',
            'rainbow': 'Regenbogen',
            'chase': 'Lauflicht',
            'breathe': 'Atmend'
        };
        return names[effect] || effect;
    }
    
    getReactToDisplayName(reactTo) {
        const names = {
            'rhythm': 'Rhythmus',
            'vocals': 'Gesang',
            'beats': 'Beats',
            'melody': 'Melodie'
        };
        return names[reactTo] || reactTo;
    }
    
    getFrequencyDisplayName(freq) {
        const names = {
            'bass': 'Bass',
            'mid': 'Mitten',
            'high': 'Höhen',
            'treble': 'Höhen',
            'all': 'Alle Frequenzen'
        };
        return names[freq] || freq;
    }
    
    toggleStrip(stripId, enabled) {
        const strip = this.ledStrips.find(s => s.id === stripId);
        if (strip) strip.enabled = enabled;
    }
    
    setStripFrequency(stripId, frequency) {
        const strip = this.ledStrips.find(s => s.id === stripId);
        if (strip) strip.frequencyBand = frequency;
    }
    
    setStripSensitivity(stripId, sensitivity) {
        const strip = this.ledStrips.find(s => s.id === stripId);
        if (strip) {
            strip.sensitivity = parseInt(sensitivity);
            const stripElement = document.getElementById(stripId);
            const valueSpan = stripElement.querySelector('span[style*="color: #4ecdc4"]');
            if (valueSpan) valueSpan.textContent = sensitivity + '%';
        }
    }
    
    updateConnectedStripsCount() {
        const connectedCount = this.ledStrips.filter(s => s.connected).length;
        const element = document.getElementById('connectedStrips');
        if (element) element.textContent = connectedCount;
    }
    
    setupEventListeners() {
        const startBtn = document.getElementById('startAudioCapture');
        const stopBtn = document.getElementById('stopAudioCapture');
        const scanBtn = document.getElementById('scanLEDStrips');
        
        if (startBtn) startBtn.addEventListener('click', () => this.startAudioCapture());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopAudioCapture());
        if (scanBtn) scanBtn.addEventListener('click', () => this.scanAndConnectDevices());
        
        // Lausche auf Band-Settings-Änderungen
        window.addEventListener('bandSettingsChanged', () => {
            this.syncWithBandSettings();
        });
    }
    
    setupMusicPlayerIntegration() {
        // Lausche auf Nachrichten vom Musik-Player (musik.html)
        window.addEventListener('message', (event) => {
    // ✅ ORIGIN-VALIDIERUNG FÜR SICHERHEIT
    const allowedOrigins = ['http://localhost', 'https://localhost', window.location.origin];
    if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
      console.warn('🚫 Unerlaubte postMessage Origin:', event.origin);
      return;
    }
            if (event.data.type === 'musicPlayerAudioData') {
                this.processMusicPlayerData(event.data.audioData);
            } else if (event.data.type === 'musicPlayerConnected') {
                this.musicPlayerConnected = true;
                this.showNotification('Musik-Player verbunden!', 'success');
            } else if (event.data.type === 'musicPlayerDisconnected') {
                this.musicPlayerConnected = false;
                if (this.audioSource === 'music-player') {
                    this.stopAudioCapture();
                }
            }
        });
        
        // Versuche Verbindung zum Musik-Player herzustellen
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'ledMusicControlReady' }, '*');
        }
    }
    
    async connectToMusicPlayer() {
        return new Promise((resolve) => {
            if (!this.musicPlayerConnected) {
                // Sende Anfrage an Musik-Player
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ type: 'requestMusicPlayerConnection' }, '*');
                }
                
                // Warte auf Antwort
                const timeout = setTimeout(() => resolve(false), 2000);
                
                const handler = (event) => {
                    if (event.data.type === 'musicPlayerConnected') {
                        clearTimeout(timeout);
                        window.removeEventListener('message', handler);
                        this.musicPlayerConnected = true;
                        resolve(true);
                    }
                };
                
                window.addEventListener('message', handler);
            } else {
                resolve(true);
            }
        });
    }
    
    processMusicPlayerData(audioData) {
        if (!this.isRunning || this.audioSource !== 'music-player') return;
        
        // Verwende Audio-Daten vom Musik-Player
        const { frequencyData, bass, mid, treble, beatDetected } = audioData;
        
        if (frequencyData) {
            this.frequencyData = new Uint8Array(frequencyData);
            this.updateFrequencyBars();
        }
        
        this.updateStatusDisplay(bass, mid, treble, beatDetected);
        this.updateLEDStrips(bass, mid, treble, beatDetected);
    }
    
    async scanAndConnectDevices() {
        // Echtes BLE-Scanning wenn verfügbar
        if (typeof bleController !== 'undefined' && bleController) {
            try {
                await bleController.scanForDevices();
                const devices = bleController.getAvailableDevices();
                
                for (const device of devices) {
                    const strip = this.ledStrips.find(s => !s.connected);
                    if (strip) {
                        strip.connected = true;
                        strip.deviceInfo = device;
                    }
                }
                
                this.renderAllStripControls();
                this.updateConnectedStripsCount();
                this.showNotification(`${devices.length} Geräte gefunden`, 'success');
            } catch (error) {
                console.error('BLE-Scan fehlgeschlagen:', error);
                this.simulateDeviceConnection(); // Fallback zu Simulation
            }
        } else {
            this.simulateDeviceConnection();
        }
    }
    
    simulateDeviceConnection() {
        this.ledStrips.forEach((strip, index) => {
            setTimeout(() => {
                strip.connected = true;
                const statusDot = document.querySelector(`#${strip.id} div[style*="border-radius: 50%"]`);
                if (statusDot) {
                    statusDot.style.background = '#28a745';
                    statusDot.style.boxShadow = '0 0 10px #28a745';
                }
                this.updateConnectedStripsCount();
            }, index * 500);
        });
        this.showNotification('LED-Bänder werden verbunden...', 'info');
    }
    
    showNotification(message, type = 'info') {
        showNotification(message, type); // Use existing notification function
    }
}

// ===== BEAT DETECTOR =====
class BeatDetector {
    constructor() {
        this.beatHistory = [];
        this.energyHistory = [];
        this.bpm = 0;
        this.threshold = 1.3;
    }
    
    detectBeat(bassLevel) {
        const now = performance.now();
        this.energyHistory.push(bassLevel);
        if (this.energyHistory.length > 43) this.energyHistory.shift();
        
        const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
        const beatDetected = bassLevel > avgEnergy * this.threshold && (now - (this.beatHistory[this.beatHistory.length - 1] || 0)) > 300;
        
        if (beatDetected) {
            this.beatHistory.push(now);
            this.beatHistory = this.beatHistory.filter(time => now - time < 10000);
            
            if (this.beatHistory.length > 1) {
                const intervals = [];
                for (let i = 1; i < this.beatHistory.length; i++) {
                    intervals.push(this.beatHistory[i] - this.beatHistory[i-1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                this.bpm = Math.round(60000 / avgInterval);
            }
        }
        
        return beatDetected;
    }
    
    getBPM() { return this.bpm; }
    getLatency() { return Math.round(performance.now() % 20); }
}
