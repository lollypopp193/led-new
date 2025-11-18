// Native Bridge - Vollständige Integration aller LED-Funktionen für Native App
// Dieses Modul ermöglicht die Kommunikation zwischen Web-Code und nativen Funktionen

import {
    Capacitor
} from "@capacitor/core";
import {
    App
} from "@capacitor/app";
import {
    Filesystem,
    Directory,
    Encoding
} from "@capacitor/filesystem";
import {
    Haptics,
    ImpactStyle
} from "@capacitor/haptics";
import {
    Keyboard
} from "@capacitor/keyboard";
import {
    SplashScreen
} from "@capacitor/splash-screen";
import {
    StatusBar,
    Style
} from "@capacitor/status-bar";
import {
    BleClient
} from "@capacitor-community/bluetooth-le";

class NativeBridge {
    constructor() {
        this.isNative = Capacitor.isNativePlatform();
        this.platform = Capacitor.getPlatform();
        this.bleDevices = new Map();
        this.audioContext = null;
        this.musicLibrary = [];
        this.scenes = new Map();
        this.currentEffect = null;
        this.bleConnected = false;
        this.initializeNative();
    }

    async initializeNative() {
        if (!this.isNative) {
            console.log("Running in web mode - native features disabled");
            return;
        }

        try {
            // Status Bar konfigurieren
            await StatusBar.setStyle({
                style: Style.Dark
            });
            await StatusBar.setBackgroundColor({
                color: "#000000"
            });

            // Splash Screen ausblenden
            await SplashScreen.hide();

            // App-Events registrieren
            this.registerAppEvents();

            // Bluetooth initialisieren
            await this.initializeBluetooth();

            // Audio-System initialisieren
            this.initializeAudio();

            // Dateisystem vorbereiten
            await this.setupFileSystem();

            console.log("Native Bridge erfolgreich initialisiert");
        } catch (error) {
            console.error("Native Bridge Initialisierung fehlgeschlagen:", error);
        }
    }

    registerAppEvents() {
        App.addListener("appStateChange", ({
            isActive
        }) => {
            if (isActive) {
                this.onAppResume();
            } else {
                this.onAppPause();
            }
        });

        App.addListener("backButton", () => {
            this.handleBackButton();
        });
    }

    async initializeBluetooth() {
        try {
            await BleClient.initialize();
            console.log("Bluetooth LE initialisiert");
        } catch (error) {
            console.error("Bluetooth-Initialisierung fehlgeschlagen:", error);
        }
    }

    initializeAudio() {
        try {
            this.audioContext = new(window.AudioContext ||
                window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            console.log("Audio-System initialisiert");
        } catch (error) {
            console.error("Audio-Initialisierung fehlgeschlagen:", error);
        }
    }

    async setupFileSystem() {
        try {
            // Erstelle notwendige Verzeichnisse
            const dirs = ["music", "scenes", "effects", "backups"];
            for (const dir of dirs) {
                try {
                    await Filesystem.mkdir({
                        path: dir,
                        directory: Directory.Data,
                        recursive: true,
                    });
                } catch (e) {
                    // Ordner existiert bereits
                }
            }
            console.log("Dateisystem vorbereitet");
        } catch (error) {
            console.error("Dateisystem-Setup fehlgeschlagen:", error);
        }
    }

    // BLE-Funktionen
    async scanForDevices() {
        if (!this.isNative) {
            console.warn("BLE nur in nativer App verfügbar");
            return [];
        }

        try {
            const devices = [];
            await BleClient.requestLEScan({
                services: []
            }, (result) => {
                if (result.device && result.device.name) {
                    devices.push({
                        id: result.device.deviceId,
                        name: result.device.name,
                        rssi: result.rssi,
                    });
                }
            });

            // Scan für 5 Sekunden
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await BleClient.stopLEScan();

            return devices;
        } catch (error) {
            console.error("BLE-Scan fehlgeschlagen:", error);
            return [];
        }
    }

    async connectToDevice(deviceId) {
        if (!this.isNative) return false;

        try {
            await BleClient.connect(deviceId, (deviceId) => {
                console.log("Verbindung zu", deviceId, "verloren");
                this.bleConnected = false;
            });

            this.bleConnected = true;
            this.currentDeviceId = deviceId;

            // Haptic Feedback
            await Haptics.impact({
                style: ImpactStyle.Medium
            });

            return true;
        } catch (error) {
            console.error("Verbindung fehlgeschlagen:", error);
            return false;
        }
    }

    async sendBLECommand(command) {
        if (!this.isNative || !this.bleConnected) return;

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(command);

            // Service und Characteristic IDs müssen an dein LED-System angepasst werden
            await BleClient.write(
                this.currentDeviceId,
                "FFE0", // Service UUID
                "FFE1", // Characteristic UUID
                data
            );

            return true;
        } catch (error) {
            console.error("BLE-Befehl fehlgeschlagen:", error);
            return false;
        }
    }

    // Audio-Funktionen
    async loadMusicFile(file) {
        if (!this.audioContext) return null;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const musicItem = {
                id: Date.now().toString(),
                name: file.name,
                buffer: audioBuffer,
                duration: audioBuffer.duration,
            };

            this.musicLibrary.push(musicItem);
            await this.saveMusicLibrary();

            return musicItem;
        } catch (error) {
            console.error("Musik laden fehlgeschlagen:", error);
            return null;
        }
    }

    async playMusic(musicId) {
        const music = this.musicLibrary.find((m) => m.id === musicId);
        if (!music || !this.audioContext) return;

        try {
            // Stoppe aktuelle Wiedergabe
            if (this.currentSource) {
                this.currentSource.stop();
            }

            // Neue Source erstellen
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = music.buffer;

            // Mit Analyser verbinden für Visualisierung
            this.currentSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.currentSource.start(0);

            // Haptic Feedback
            if (this.isNative) {
                await Haptics.impact({
                    style: ImpactStyle.Light
                });
            }
        } catch (error) {
            console.error("Musik-Wiedergabe fehlgeschlagen:", error);
        }
    }

    getAudioData() {
        if (!this.analyser) return null;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Berechne verschiedene Frequenzbereiche
        const bass = this.calculateFrequencyRange(0, 10);
        const mid = this.calculateFrequencyRange(10, 50);
        const treble = this.calculateFrequencyRange(50, 100);

        return {
            bass,
            mid,
            treble,
            spectrum: Array.from(this.dataArray),
        };
    }

    calculateFrequencyRange(start, end) {
        let sum = 0;
        for (let i = start; i < end && i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / (end - start) / 255;
    }

    // Szenen-Verwaltung
    async saveScene(scene) {
        try {
            this.scenes.set(scene.id, scene);

            if (this.isNative) {
                await Filesystem.writeFile({
                    path: `scenes/${scene.id}.json`,
                    data: JSON.stringify(scene),
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                });
            } else {
                localStorage.setItem(`scene_${scene.id}`, JSON.stringify(scene));
            }

            return true;
        } catch (error) {
            console.error("Szene speichern fehlgeschlagen:", error);
            return false;
        }
    }

    async loadScenes() {
        try {
            if (this.isNative) {
                const result = await Filesystem.readdir({
                    path: "scenes",
                    directory: Directory.Data,
                });

                for (const file of result.files) {
                    if (file.name.endsWith(".json")) {
                        const content = await Filesystem.readFile({
                            path: `scenes/${file.name}`,
                            directory: Directory.Data,
                            encoding: Encoding.UTF8,
                        });

                        const scene = JSON.parse(content.data);
                        this.scenes.set(scene.id, scene);
                    }
                }
            } else {
                // Web-Modus: aus localStorage laden
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith("scene_")) {
                        const scene = JSON.parse(localStorage.getItem(key));
                        this.scenes.set(scene.id, scene);
                    }
                }
            }

            return Array.from(this.scenes.values());
        } catch (error) {
            console.error("Szenen laden fehlgeschlagen:", error);
            return [];
        }
    }

    async activateScene(sceneId) {
        const scene = this.scenes.get(sceneId);
        if (!scene) return false;

        try {
            // Sende alle Befehle der Szene
            for (const command of scene.commands) {
                await this.sendBLECommand(command);
                await new Promise((resolve) => setTimeout(resolve, 50)); // Kleine Verzögerung
            }

            // Haptic Feedback
            if (this.isNative) {
                await Haptics.impact({
                    style: ImpactStyle.Heavy
                });
            }

            return true;
        } catch (error) {
            console.error("Szenen-Aktivierung fehlgeschlagen:", error);
            return false;
        }
    }

    // Effekt-Funktionen
    async applyEffect(effect) {
        this.currentEffect = effect;

        const commands = this.generateEffectCommands(effect);
        for (const cmd of commands) {
            await this.sendBLECommand(cmd);
        }

        // Haptic Feedback
        if (this.isNative) {
            await Haptics.impact({
                style: ImpactStyle.Light
            });
        }
    }

    generateEffectCommands(effect) {
        const commands = [];

        switch (effect.type) {
            case "rainbow":
                commands.push("EFFECT:RAINBOW");
                commands.push(`SPEED:${effect.speed || 50}`);
                break;
            case "strobe":
                commands.push("EFFECT:STROBE");
                commands.push(`FREQUENCY:${effect.frequency || 10}`);
                break;
            case "fade":
                commands.push("EFFECT:FADE");
                commands.push(`DURATION:${effect.duration || 1000}`);
                break;
            case "music-reactive":
                commands.push("EFFECT:MUSIC");
                commands.push(`SENSITIVITY:${effect.sensitivity || 50}`);
                break;
            default:
                commands.push("EFFECT:STATIC");
        }

        return commands;
    }

    // Farb-Funktionen
    async setColor(color) {
        const command = `COLOR:${color.r},${color.g},${color.b}`;
        return await this.sendBLECommand(command);
    }

    async setBrightness(brightness) {
        const command = `BRIGHTNESS:${brightness}`;
        return await this.sendBLECommand(command);
    }

    // Timer-Funktionen
    async setTimer(duration, action) {
        setTimeout(async () => {
            if (action === "off") {
                await this.sendBLECommand("POWER:OFF");
            } else if (action === "on") {
                await this.sendBLECommand("POWER:ON");
            } else if (action.startsWith("scene:")) {
                const sceneId = action.replace("scene:", "");
                await this.activateScene(sceneId);
            }
        }, duration);
    }

    // Backup-Funktionen
    async createBackup() {
        try {
            const backup = {
                version: "2.0.0",
                timestamp: new Date().toISOString(),
                scenes: Array.from(this.scenes.values()),
                musicLibrary: this.musicLibrary.map((m) => ({
                    id: m.id,
                    name: m.name,
                })),
                settings: this.getSettings(),
            };

            if (this.isNative) {
                const filename = `backup_${Date.now()}.json`;
                await Filesystem.writeFile({
                    path: `backups/${filename}`,
                    data: JSON.stringify(backup),
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                });
                return filename;
            } else {
                const blob = new Blob([JSON.stringify(backup)], {
                    type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `led_backup_${Date.now()}.json`;
                a.click();
                return true;
            }
        } catch (error) {
            console.error("Backup fehlgeschlagen:", error);
            return false;
        }
    }

    async restoreBackup(file) {
        try {
            let backup;

            if (this.isNative) {
                const content = await Filesystem.readFile({
                    path: file,
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                });
                backup = JSON.parse(content.data);
            } else {
                const text = await file.text();
                backup = JSON.parse(text);
            }

            // Szenen wiederherstellen
            for (const scene of backup.scenes) {
                await this.saveScene(scene);
            }

            // Einstellungen wiederherstellen
            this.applySettings(backup.settings);

            return true;
        } catch (error) {
            console.error("Backup-Wiederherstellung fehlgeschlagen:", error);
            return false;
        }
    }

    // Settings
    getSettings() {
        return {
            autoConnect: this.autoConnect || false,
            defaultBrightness: this.defaultBrightness || 100,
            musicSensitivity: this.musicSensitivity || 50,
            theme: this.theme || "dark",
        };
    }

    applySettings(settings) {
        this.autoConnect = settings.autoConnect;
        this.defaultBrightness = settings.defaultBrightness;
        this.musicSensitivity = settings.musicSensitivity;
        this.theme = settings.theme;
    }

    // App-Lifecycle
    onAppResume() {
        console.log("App wurde fortgesetzt");
        if (this.autoConnect && this.currentDeviceId) {
            this.connectToDevice(this.currentDeviceId);
        }
    }

    onAppPause() {
        console.log("App wurde pausiert");
        // Optional: Verbindung trennen oder Energie sparen
    }

    handleBackButton() {
        // Zurück-Navigation implementieren
        window.history.back();
    }

    // Musik-Library Management
    async saveMusicLibrary() {
        try {
            const libraryData = this.musicLibrary.map((m) => ({
                id: m.id,
                name: m.name,
                duration: m.duration,
            }));

            if (this.isNative) {
                await Filesystem.writeFile({
                    path: "music/library.json",
                    data: JSON.stringify(libraryData),
                    directory: Directory.Data,
                    encoding: Encoding.UTF8,
                });
            } else {
                localStorage.setItem("musicLibrary", JSON.stringify(libraryData));
            }
        } catch (error) {
            console.error("Musik-Bibliothek speichern fehlgeschlagen:", error);
        }
    }

    // Performance Optimierungen
    optimizePerformance() {
        if (this.isNative) {
            // Reduziere Analyser-Auflösung bei schwacher Leistung
            if (this.analyser) {
                this.analyser.fftSize = 1024;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
        }
    }

    // Export für globale Verwendung
    static getInstance() {
        if (!window.nativeBridge) {
            window.nativeBridge = new NativeBridge();
        }
        return window.nativeBridge;
    }
}

// Initialisiere automatisch beim Laden
if (typeof window !== "undefined") {
    window.NativeBridge = NativeBridge;
    window.nativeBridge = NativeBridge.getInstance();
}

export default NativeBridge;