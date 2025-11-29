/**
 * VOICE COMMANDS v1.0
 * Sprachsteuerung für Hände-frei Bedienung
 */
'use strict';

class VoiceCommands {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.commands = new Map();
        this.init();
    }

    init() {
        this.checkSupport();
        if (this.isSupported) {
            this.setupRecognition();
            this.registerDefaultCommands();
        }
        console.log('✅ Voice Commands initialisiert');
    }

    checkSupport() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            this.isSupported = true;
            this.recognition = new SpeechRecognition();
        } else {
            console.warn('⚠️ Speech Recognition API nicht verfügbar');
            this.isSupported = false;
        }
    }

    setupRecognition() {
        if (!this.recognition) return;

        this.recognition.lang = 'de-DE';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('🎤 Erkannt:', transcript);
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error('❌ Speech Recognition Fehler:', event.error);
            this.isListening = false;
        };

        this.recognition.onend = () => {
            this.isListening = false;
            console.log('🎤 Listening gestoppt');
        };
    }

    registerDefaultCommands() {
        // Play Commands
        this.registerCommand(['play', 'abspielen', 'weiter'], {
            name: 'Play',
            handler: () => {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.play();
                    this.speak('Wiedergabe gestartet');
                }
            }
        });

        // Pause Commands
        this.registerCommand(['pause', 'stopp', 'anhalten'], {
            name: 'Pause',
            handler: () => {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.pause();
                    this.speak('Pausiert');
                }
            }
        });

        // Next Track
        this.registerCommand(['nächster', 'nächstes lied', 'weiter', 'skip'], {
            name: 'Next Track',
            handler: () => {
                if (window.musikIntegration && window.musikIntegration.nextTrack) {
                    window.musikIntegration.nextTrack();
                    this.speak('Nächster Titel');
                }
            }
        });

        // Previous Track
        this.registerCommand(['vorheriger', 'vorheriges lied', 'zurück'], {
            name: 'Previous Track',
            handler: () => {
                if (window.musikIntegration && window.musikIntegration.previousTrack) {
                    window.musikIntegration.previousTrack();
                    this.speak('Vorheriger Titel');
                }
            }
        });

        // Volume Up
        this.registerCommand(['lauter', 'lautstärke hoch', 'volume up'], {
            name: 'Volume Up',
            handler: () => {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.2);
                    this.speak(`Lautstärke ${Math.round(audioPlayer.volume * 100)} Prozent`);
                }
            }
        });

        // Volume Down
        this.registerCommand(['leiser', 'lautstärke runter', 'volume down'], {
            name: 'Volume Down',
            handler: () => {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.2);
                    this.speak(`Lautstärke ${Math.round(audioPlayer.volume * 100)} Prozent`);
                }
            }
        });

        // LED On
        this.registerCommand(['led an', 'licht an', 'led einschalten'], {
            name: 'LED On',
            handler: async () => {
                if (window.BLEControllerPro && window.BLEControllerPro.isConnected) {
                    await window.BLEControllerPro.sendPowerOn();
                    this.speak('LED eingeschaltet');
                } else {
                    this.speak('LED nicht verbunden');
                }
            }
        });

        // LED Off
        this.registerCommand(['led aus', 'licht aus', 'led ausschalten'], {
            name: 'LED Off',
            handler: async () => {
                if (window.BLEControllerPro && window.BLEControllerPro.isConnected) {
                    await window.BLEControllerPro.sendPowerOff();
                    this.speak('LED ausgeschaltet');
                } else {
                    this.speak('LED nicht verbunden');
                }
            }
        });

        // BLE Connect
        this.registerCommand(['verbinden', 'bluetooth verbinden', 'ble verbinden'], {
            name: 'BLE Connect',
            handler: async () => {
                if (window.BLEControllerPro) {
                    try {
                        await window.BLEControllerPro.scan();
                        await window.BLEControllerPro.connect();
                        this.speak('Bluetooth verbunden');
                    } catch (error) {
                        this.speak('Verbindung fehlgeschlagen');
                    }
                }
            }
        });

        // Help
        this.registerCommand(['hilfe', 'hilfe kommandos', 'was kann ich sagen'], {
            name: 'Help',
            handler: () => {
                this.speak('Sie können sagen: Play, Pause, Nächster, Vorheriger, Lauter, Leiser, LED an, LED aus');
            }
        });

        console.log(`✅ ${this.commands.size} Voice Commands registriert`);
    }

    registerCommand(triggers, command) {
        triggers.forEach(trigger => {
            this.commands.set(trigger.toLowerCase(), {
                triggers,
                name: command.name,
                handler: command.handler
            });
        });
    }

    processCommand(transcript) {
        let commandFound = false;

        // Check for exact matches first
        for (const [trigger, command] of this.commands.entries()) {
            if (transcript.includes(trigger)) {
                console.log(`✅ Command gefunden: ${command.name}`);
                command.handler();
                commandFound = true;
                break;
            }
        }

        if (!commandFound) {
            console.log('❌ Kein Command gefunden für:', transcript);
            this.speak('Befehl nicht erkannt');
        }
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE';
            utterance.rate = 1.1;
            speechSynthesis.speak(utterance);
        }
    }

    startListening() {
        if (!this.isSupported) {
            console.warn('⚠️ Speech Recognition nicht verfügbar');
            if (window.showGlobalNotification) {
                window.showGlobalNotification('⚠️ Sprachsteuerung nicht verfügbar', 'warning');
            }
            return;
        }

        if (this.isListening) return;

        try {
            this.recognition.start();
            this.isListening = true;
            console.log('🎤 Listening gestartet');

            this.showListeningIndicator();

            if (window.showGlobalNotification) {
                window.showGlobalNotification('🎤 Sprechen Sie jetzt...', 'info');
            }
        } catch (error) {
            console.error('❌ Start Listening fehlgeschlagen:', error);
        }
    }

    stopListening() {
        if (!this.recognition || !this.isListening) return;

        this.recognition.stop();
        this.isListening = false;
        this.hideListeningIndicator();
        console.log('🎤 Listening gestoppt');
    }

    showListeningIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'voiceIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff0844, #ffb199);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            z-index: 100000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            animation: pulse 1.5s ease infinite;
        `;
        indicator.innerHTML = '🎤 Hört zu...';

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
            }
        `;

        if (!document.getElementById('voiceIndicatorStyles')) {
            style.id = 'voiceIndicatorStyles';
            document.head.appendChild(style);
        }

        document.body.appendChild(indicator);
    }

    hideListeningIndicator() {
        const indicator = document.getElementById('voiceIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    toggle() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    getAllCommands() {
        const uniqueCommands = new Map();

        this.commands.forEach(cmd => {
            if (!uniqueCommands.has(cmd.name)) {
                uniqueCommands.set(cmd.name, cmd);
            }
        });

        return Array.from(uniqueCommands.values());
    }

    isAvailable() {
        return this.isSupported;
    }
}

// Initialize global voice commands
window.voiceCommands = new VoiceCommands();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceCommands;
}

console.log('✅ Voice Commands geladen');
if (window.voiceCommands.isAvailable()) {
    console.log('🎤 Nutze: voiceCommands.startListening()');
} else {
    console.log('⚠️ Speech Recognition nicht verfügbar in diesem Browser');
}
