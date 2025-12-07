/**
 * APP.JS v4.0 - ZERO TOLERANCE - HAUPTANWENDUNGSLOGIK
 * Zentrale App-Steuerung mit vollständiger Integration aller Module
 */
'use strict';

const App = {
    // Core Modules
    ble: null,
    deviceManager: null,
    nativeBridge: null,
    capacitorAdapter: null,
    scenesManager: null,
    performanceOptimizer: null,
    ledAbstraction: null,
    eventManager: null,
    audioReactiveEngine: null,
    musikIntegration: null,
    musicLibraryManager: null,

    // UI Elements Cache
    elements: {},

    // App Configuration
    config: {
        startup_delay: 3000,
        particle_count: 120,
        theme: 'dark',
        language: 'de',
        autoConnect: false,
        saveState: true,
        animations: true,
        notifications: true,
        hapticFeedback: true,
        soundEffects: false
    },

    // App State
    state: {
        currentApp: null,
        initialized: false,
        isConnected: false,
        currentDevice: null,
        brightness: 100,
        currentColor: {
            r: 255,
            g: 255,
            b: 255
        },
        currentEffect: null,
        isPlaying: false
    },
    async initialize() {
        if (this.state.initialized) {
            console.log('⚠️ App bereits initialisiert');
            return;
        }

        console.log('🚀 LED Native App v4.0 - Zero Tolerance - Initialisierung...');

        try {
            // PERMISSIONS BEIM START ABFRAGEN!
            console.log('📋 Starte Permissions-Abfrage...');

            if (window.StartupPermissions) {
                const startupPerms = new window.StartupPermissions();
                await startupPerms.requestAllPermissions();
                console.log('✅ Berechtigungen abgefragt');
            } else if (window.PermissionsHandler) {
                await window.PermissionsHandler.init();
                await window.PermissionsHandler.requestAllPermissions();
                console.log('✅ Berechtigungen abgefragt (Fallback)');
            }

            await this.continueInitialization();

        } catch (err) {
            console.error('❌ Initialisierung fehlgeschlagen:', err);
            this.showError('Initialisierung fehlgeschlagen'); 
        }
    },
    async continueInitialization() {
        console.log('🔧 continueInitialization() gestartet');

        try {
            // 1. Erst DOM und UI vorbereiten (DAMIT DER USER WAS SIEHT!)
            console.log('📍 Schritt 1: DOM cachen');
            this.cacheDOMElements();

            console.log('📍 Schritt 2: Partikel initialisieren');
            this.initParticles();

            console.log('📍 Schritt 3: Navigation initialisieren');
            this.initNavigation();

            console.log('📍 Schritt 4: Event-Listener');
            this.initGlobalEventListeners();

            console.log('📍 Schritt 5: Einstellungen laden');
            this.loadSettings();

            // 2. Startup-Sequenz SOFORT starten (Splash ausblenden)
            console.log('📍 Schritt 6: Startup-Sequenz');
            this.initStartupSequence();
            this.state.initialized = true;
            console.log('✅ UI gestartet - Lade Module im Hintergrund...');

            // 3. Module im HINTERGRUND laden (blockiert nicht den Start!)
            this.initializeModules().then(() => {
                console.log('✅ Alle Module im Hintergrund geladen');
                if (this.eventManager) this.eventManager.emit('app-ready', { timestamp: Date.now() });
            }).catch(err => {
                console.warn('⚠️ Modul-Laden mit Fehlern abgeschlossen:', err);
            });

        } catch (err) {
            console.error('❌ Fortsetzung fehlgeschlagen:', err);
            console.error('❌ Error Stack:', err.stack);
            // Notfall-Start versuchen
            console.log('🚨 Versuche Notfall-Start...');
            this.initStartupSequence();
        }
    },
    async initializeModules() {
        console.log('📦 Lade Module...');

        // WICHTIG: Jedes Modul hat eigenen try-catch damit ein Fehler nicht alles stoppt!

        try {
            if (window.eventManager) {
                this.eventManager = window.eventManager;
                console.log('✅ EventManager geladen');
            }
        } catch (err) {
            console.warn('⚠️ EventManager Fehler:', err);
        }

        try {
            if (window.performanceOptimizer) {
                this.performanceOptimizer = window.performanceOptimizer;
                this.performanceOptimizer.init();
                console.log('✅ PerformanceOptimizer geladen');
            }
        } catch (err) {
            console.warn('⚠️ PerformanceOptimizer Fehler:', err);
        }

        try {
            if (window.ledAbstraction) {
                this.ledAbstraction = window.ledAbstraction;
                await this.ledAbstraction.detectLEDType();
                console.log('✅ LED-Abstraction geladen');
            }
        } catch (err) {
            console.warn('⚠️ LED-Abstraction Fehler:', err);
        }

        try {
            if (window.scenesManager) {
                this.scenesManager = window.scenesManager;
                console.log('✅ ScenesManager geladen');
            }
        } catch (err) {
            console.warn('⚠️ ScenesManager Fehler:', err);
        }

        try {
            if (window.deviceManager) {
                this.deviceManager = window.deviceManager;
                console.log('✅ DeviceManager geladen');
            }
        } catch (err) {
            console.warn('⚠️ DeviceManager Fehler:', err);
        }

        try {
            if (window.audioReactiveEngine) {
                this.audioReactiveEngine = window.audioReactiveEngine;
                console.log('✅ AudioReactiveEngine geladen');
            }
        } catch (err) {
            console.warn('⚠️ AudioReactiveEngine Fehler:', err);
        }

        try {
            if (window.musikIntegration) {
                this.musikIntegration = window.musikIntegration;
                console.log('✅ MusikIntegration geladen');
            }
        } catch (err) {
            console.warn('⚠️ MusikIntegration Fehler:', err);
        }

        // MusicLibraryManager ist OPTIONAL - App läuft auch ohne!
        try {
            if (window.musicLibraryManager) {
                this.musicLibraryManager = window.musicLibraryManager;
                await this.musicLibraryManager.init();
                console.log('✅ MusicLibraryManager geladen');
            } else {
                console.warn('⚠️ MusicLibraryManager nicht verfügbar (optional)');
            }
        } catch (err) {
            console.warn('⚠️ MusicLibraryManager Fehler (nicht kritisch):', err);
        }

    // Capacitor initialisieren
        try {
            if (typeof Capacitor !== 'undefined') {
                await this.initCapacitor();
            }
        } catch (err) {
            console.warn('⚠️ Capacitor Fehler:', err);
        }

        console.log('✅ Module-Initialisierung abgeschlossen');
    },
    async initCapacitor() {
        try {
            console.log('📦 Initialisiere Capacitor...');

            // Splash Screen
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
                try {
                    await window.Capacitor.Plugins.SplashScreen.hide();
                    console.log('✅ SplashScreen verborgen');
                } catch (e) { console.warn('SplashScreen Fehler:', e); }
            }

            // Status Bar
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
                try {
                    await window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#1a1a2e' });
                    await window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });
                    console.log('✅ StatusBar konfiguriert');
                } catch (e) { console.warn('StatusBar Fehler:', e); }
            }

            // Back Button Handling
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
                    if (canGoBack) {
                        window.history.back();
                    } else {
                        // Wenn auf Startseite ('farbe'), dann App minimieren/schließen
                        if (this.state.currentApp === 'farbe' || !this.state.currentApp) {
                            window.Capacitor.Plugins.App.exitApp();
                        } else {
                            // Sonst zur Startseite navigieren
                            this.openApp('farbe');
                        }
                    }
                });
                console.log('✅ Back-Button Handler registriert');
            }

            console.log('✅ Capacitor initialisiert');
        } catch (err) {
            console.warn('⚠️ Capacitor-Initialisierung mit Fehlern:', err);
        }
    },
    cacheDOMElements() {
        console.log('🔍 Suche DOM-Elemente...');
        this.elements.startScreen = document.getElementById('startscreen');
        this.elements.appScreen = document.getElementById('appscreen');
        this.elements.navBar = document.querySelector('.nav-bar');
        this.elements.appIframe = document.getElementById('app-iframe');
        this.elements.particleCanvas = document.getElementById('background-canvas');
        this.elements.connectionStatus = document.getElementById('connection-status');
        this.elements.notificationContainer = document.getElementById('notification-container');

        // DEBUG: Prüfe ob kritische Elemente gefunden wurden
        console.log('📍 StartScreen gefunden:', !!this.elements.startScreen);
        console.log('📍 AppScreen gefunden:', !!this.elements.appScreen);
        console.log('📍 Canvas gefunden:', !!this.elements.particleCanvas);
        console.log('✅ DOM-Elemente gecached');
    },
    initStartupSequence() {
        console.log(`⏳ Starte Sequenz in ${this.config.startup_delay}ms...`);

        setTimeout(() => {
            console.log('🎬 Startup-Sequenz ausführen...');

            // Splash ausblenden
            if (this.elements.startScreen) {
                this.elements.startScreen.style.opacity = '0';
                this.elements.startScreen.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    this.elements.startScreen.style.display = 'none';
                }, 500);
                console.log('✅ Splash ausgeblendet');
            } else {
                console.error('❌ StartScreen Element nicht gefunden!');
            }

            // PARTIKEL STOPPEN nach Splash!
            if (this.elements.particleCanvas) {
                this.elements.particleCanvas.style.display = 'none';
                this.stopParticles = true;
                console.log('✅ Partikel gestoppt');
            }

            // Hauptscreen anzeigen
            if (this.elements.appScreen) {
                this.elements.appScreen.style.display = 'flex';
                console.log('✅ AppScreen angezeigt');
            } else {
                console.error('❌ AppScreen Element nicht gefunden!');
            }

            console.log('✅ Startup-Sequenz abgeschlossen - Kategorien angezeigt');
            // KEIN openApp() hier! User soll selbst wählen.
        }, this.config.startup_delay);
    },
    initNavigation() { if (!this.elements.navBar) return; this.elements.navBar.addEventListener('click', function (e) { const navItem = e.target.closest('.nav-item'); if (navItem) { const appName = navItem.dataset.app; this.openApp(appName); } }.bind(this)); console.log('\u2705 Navigation initialisiert'); },
    initGlobalEventListeners() {
        // 1. Override Native Dialogs with UI Overlays (Monkey Patching)
        this.overrideNativeDialogs();

        // 2. Message-Listener für Iframe-Kommunikation
        window.addEventListener('message', (event) => {
            // Sicherheits-Check: Nur eigene Origin erlauben
            if (event.origin !== window.location.origin && event.origin !== 'null') return;

            const data = event.data;
            if (!data || !data.type) return;

            // console.log('📨 Message empfangen:', data.type);

            switch (data.type) {
                case 'ledMusicControlReady':
                    console.log('🎵 LED-Musik-Steuerung bereit (Iframe)');
                    // Optional: Benachrichtigung an User
                    break;

                case 'requestBLE':
                    if (this.state.isConnected && this.state.currentDevice) {
                        // Sende Status zurück an Iframe
                        const iframe = document.getElementById('app-iframe');
                        if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.postMessage({
                                type: 'bleStatus',
                                connected: true,
                                device: this.state.currentDevice
                            }, '*');
                        }
                    }
                    break;

                case 'toggleMenu':
                    if (window.LEDSidebar && window.ledSidebar) {
                        window.ledSidebar.toggle();
                    }
                    break;
            }
        });

        // 3. Standard Event Listeners
        window.addEventListener('online', function () { this.showNotification('Verbindung hergestellt', 'success'); console.log('\u2705 Online'); }.bind(this)); window.addEventListener('offline', function () { this.showNotification('Keine Verbindung', 'warning'); console.log('\u26a0\ufe0f Offline'); }.bind(this)); window.addEventListener('beforeunload', function () { this.saveSettings(); this.saveState(); }.bind(this)); document.addEventListener('visibilitychange', function () { if (document.hidden) { this.handleAppPause(); } else { this.handleAppResume(); } }.bind(this)); if (this.eventManager) { this.eventManager.on('ble-connected', function (e) { this.handleBLEConnected(e.data); }.bind(this)); this.eventManager.on('ble-disconnected', function (e) { this.handleBLEDisconnected(e.data); }.bind(this)); this.eventManager.on('scene-activated', function (e) { this.handleSceneActivated(e.data); }.bind(this)); } console.log('\u2705 Global Event Listeners initialisiert');
    },

    // Hilfsfunktion für Custom Dialoge
    overrideNativeDialogs() {
        // alert
        const originalAlert = window.alert;
        window.alert = (msg) => {
            if (window.showNotification) {
                window.showNotification(msg, 'info');
            } else {
                originalAlert(msg);
            }
        };

        // confirm - kann nicht einfach ersetzt werden da synchron,
        // aber wir können es stylen oder Wrapper nutzen wo möglich.
        // Da confirm blockierend ist, lassen wir es vorerst, aber
        // wir könnten später eine asynchrone Alternative anbieten.
    },
    openApp(appName) { if (!appName) return; if (this.elements.appIframe) { this.elements.appIframe.src = 'pages/' + appName + '.html'; this.state.currentApp = appName; localStorage.setItem('last-app', appName); document.querySelectorAll('.nav-item').forEach(function (item) { item.classList.remove('active'); }); const activeItem = document.querySelector('[data-app="' + appName + '"]'); if (activeItem) activeItem.classList.add('active'); console.log('\ud83d\udcdd App geöffnet:', appName); if (this.eventManager) this.eventManager.emit('app-changed', { app: appName, timestamp: Date.now() }); } },
    async connectBLE() { try { if (this.deviceManager) { this.showNotification('Suche nach Geräten...', 'info'); const device = await this.deviceManager.scanForDevices(); if (device) { const success = await this.deviceManager.connectToDevice(device.id); if (success) { this.state.isConnected = true; this.state.currentDevice = device; this.updateConnectionStatus(true); this.showNotification('Verbunden mit ' + device.name, 'success'); if (this.eventManager) this.eventManager.emit('ble-connected', { device: device }); return true; } } } return false; } catch (err) { console.error('\u274c BLE-Verbindung fehlgeschlagen:', err); this.showNotification('Verbindung fehlgeschlagen', 'error'); return false; } },
    disconnectBLE() { if (this.deviceManager) { this.deviceManager.disconnectDevice(); this.state.isConnected = false; this.state.currentDevice = null; this.updateConnectionStatus(false); this.showNotification('Verbindung getrennt', 'info'); if (this.eventManager) this.eventManager.emit('ble-disconnected', {}); } },
    async sendColorCommand(r, g, b) { try { if (!this.state.isConnected) { console.warn('\u26a0\ufe0f Nicht verbunden'); return false; } if (this.ledAbstraction) { await this.ledAbstraction.setColor(r, g, b, {}); } else if (window.ledDevice && window.ledDevice.characteristic) { const cmd = new Uint8Array([0x7E, 0x00, 0x05, r, g, b, 0x00, 0xEF]); await window.ledDevice.characteristic.writeValue(cmd); } this.state.currentColor = { r: r, g: g, b: b }; if (this.performanceOptimizer) { await this.performanceOptimizer.sendOptimizedCommand({ type: 'color', r: r, g: g, b: b }, 'normal'); } console.log('\u2705 Farbe gesendet: RGB(' + r + ', ' + g + ', ' + b + ')'); return true; } catch (err) { console.error('\u274c Farb-Befehl fehlgeschlagen:', err); return false; } },
    async sendBrightnessCommand(brightness) { try { if (!this.state.isConnected) return false; if (this.ledAbstraction) { await this.ledAbstraction.setBrightness(brightness); } else if (window.ledDevice && window.ledDevice.characteristic) { const cmd = new Uint8Array([0x7E, 0x00, 0x0E, brightness, 0x00, 0x00, 0x00, 0xEF]); await window.ledDevice.characteristic.writeValue(cmd); } this.state.brightness = brightness; console.log('\u2705 Helligkeit gesendet:', brightness); return true; } catch (err) { console.error('\u274c Helligkeits-Befehl fehlgeschlagen:', err); return false; } },
    async sendEffectCommand(effectId) { try { if (!this.state.isConnected) return false; if (this.ledAbstraction) { await this.ledAbstraction.setEffect(effectId); } this.state.currentEffect = effectId; console.log('\u2705 Effekt gesendet:', effectId); return true; } catch (err) { console.error('\u274c Effekt-Befehl fehlgeschlagen:', err); return false; } },
    updateConnectionStatus(connected) { if (this.elements.connectionStatus) { this.elements.connectionStatus.textContent = connected ? 'Verbunden' : 'Getrennt'; this.elements.connectionStatus.className = connected ? 'connected' : 'disconnected'; } },
    handleBLEConnected(data) { console.log('\ud83d\udce1 BLE Verbunden:', data); this.updateConnectionStatus(true); if (window.onBLEConnected && typeof window.onBLEConnected === 'function') { window.onBLEConnected(data); } window.dispatchEvent(new CustomEvent('bleconnected', { detail: data })); },
    handleBLEDisconnected(data) { console.log('\ud83d\udeab BLE Getrennt'); this.updateConnectionStatus(false); if (window.onBLEDisconnected && typeof window.onBLEDisconnected === 'function') { window.onBLEDisconnected(data); } window.dispatchEvent(new CustomEvent('bledisconnected', { detail: data })); },
    handleSceneActivated(data) { console.log('\ud83c\udfac Szene aktiviert:', data.name); },
    handleAppPause() { console.log('\u23f8\ufe0f App pausiert'); this.saveState(); if (this.audioReactiveEngine && this.audioReactiveEngine.isRunning) { this.audioReactiveEngine.stopAudioCapture(); } },
    handleAppResume() {
        console.log('▶️ App fortgesetzt');
        // WICHTIG: Auto-Connect nur wenn bereits verbunden WAR oder User explizit will
        // SecurityError vermeiden!
        if (this.config.autoConnect && this.state.isConnected) {
            setTimeout(function () {
                this.connectBLE();
            }.bind(this), 1000);
        }
    },
    showNotification(message, type, duration) { type = type || 'info'; duration = duration || 3000; if (window.showGlobalNotification) { window.showGlobalNotification(message, type, duration); } else { console.log('[' + type.toUpperCase() + '] ' + message); } },
    showError(message) { this.showNotification(message, 'error', 5000); console.error('\u274c Error:', message); },
    initParticles() {
        if (!this.elements.particleCanvas || !this.config.animations) return;
        try {
            const canvas = this.elements.particleCanvas;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const particles = [];
            const self = this;
            this.stopParticles = false;

            for (let i = 0; i < this.config.particle_count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1
                });
            }

            function animate() {
                // STOPP wenn Flag gesetzt
                if (self.stopParticles) {
                    console.log('🛑 Partikel-Animation gestoppt');
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'rgba(78, 205, 196, 0.5)';
                particles.forEach(function (p) {
                    p.x += p.vx;
                    p.y += p.vy;
                    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                requestAnimationFrame(animate);
            }
            animate();
            console.log('✅ Partikel-Animation initialisiert');
        } catch (err) {
            console.warn('⚠️ Partikel-Fehler:', err);
        }
    },
    loadSettings() { try { const stored = localStorage.getItem('app-settings'); if (stored) { const settings = JSON.parse(stored); Object.assign(this.config, settings); /* console.log('✅ Einstellungen geladen'); */ } } catch (err) { console.warn('⚠️ Fehler beim Laden der Einstellungen:', err); } },
    saveSettings() { try { localStorage.setItem('app-settings', JSON.stringify(this.config)); /* console.log('✅ Einstellungen gespeichert'); */ } catch (err) { console.warn('⚠️ Fehler beim Speichern der Einstellungen:', err); } },
    saveState() { try { const state = { currentApp: this.state.currentApp, isConnected: this.state.isConnected, currentDevice: this.state.currentDevice ? this.state.currentDevice.id : null, brightness: this.state.brightness, currentColor: this.state.currentColor, currentEffect: this.state.currentEffect, timestamp: Date.now() }; localStorage.setItem('app-state', JSON.stringify(state)); console.log('\u2705 App-State gespeichert'); } catch (err) { console.warn('\u26a0\ufe0f Fehler beim Speichern des States:', err); } },
    loadState() { try { const stored = localStorage.getItem('app-state'); if (stored) { const state = JSON.parse(stored); Object.assign(this.state, state); /* console.log('✅ App-State geladen'); */ } } catch (err) { console.warn('⚠️ Fehler beim Laden des States:', err); } },
    exportData() { try { const data = { settings: this.config, state: this.state, devices: this.deviceManager ? this.deviceManager.exportDevices() : null, scenes: this.scenesManager ? this.scenesManager.exportScenes() : null, playlists: this.musicLibraryManager ? this.musicLibraryManager.getAllPlaylists() : null, exportedAt: Date.now(), version: '4.0' }; return JSON.stringify(data, null, 2); } catch (err) { console.error('\u274c Export fehlgeschlagen:', err); return null; } },
    async importData(jsonString) { try { const data = JSON.parse(jsonString); if (data.settings) { Object.assign(this.config, data.settings); this.saveSettings(); } if (data.devices && this.deviceManager) { this.deviceManager.importDevices(data.devices); } if (data.scenes && this.scenesManager) { this.scenesManager.importScenes(data.scenes); } console.log('\u2705 Daten importiert'); this.showNotification('Import erfolgreich', 'success'); return true; } catch (err) { console.error('\u274c Import fehlgeschlagen:', err); this.showNotification('Import fehlgeschlagen', 'error'); return false; } }
};

// Berechtigungs-Dialog anzeigen
function showPermissionsRequiredDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    dialog.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 30px;
            border-radius: 20px;
            max-width: 400px;
            text-align: center;
            border: 2px solid #4ecdc4;
            box-shadow: 0 10px 40px rgba(78,205,196,0.3);
        ">
            <i class="fas fa-shield-alt" style="font-size: 3rem; color: #4ecdc4; margin-bottom: 20px;"></i>
            <h2 style="color: #fff; margin-bottom: 15px;">Berechtigungen erforderlich</h2>
            <p style="color: #ccc; margin-bottom: 25px; line-height: 1.6;">
                Diese App benötigt Bluetooth-, Standort- und Speicher-Berechtigungen, 
                um LED-Geräte zu steuern und Musik abzuspielen.
            </p>
            <button onclick="this.closest('div').parentElement.remove(); window.permissionsHandler.requestAllPermissions();" 
                style="
                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1rem;
                    box-shadow: 0 4px 15px rgba(78,205,196,0.4);
                ">
                Berechtigungen erteilen
            </button>
            <button onclick="this.closest('div').parentElement.remove();" 
                style="
                    background: transparent;
                    color: #888;
                    border: 1px solid #555;
                    padding: 12px 30px;
                    border-radius: 25px;
                    margin-left: 10px;
                    cursor: pointer;
                    font-size: 1rem;
                ">
                Später
            </button>
        </div>
    `;

    document.body.appendChild(dialog);
}

window.showPermissionsRequiredDialog = showPermissionsRequiredDialog;

// === MODUL-AKTIVIERUNGEN (ALLE in try-catch um App-Start nicht zu blockieren!) ===
// KRITISCH: Wenn ein Modul fehlschlägt, muss App trotzdem starten!

function safeInit(name, fn) {
    try {
        if (fn) {
            fn.init();
        }
    } catch (e) {
        console.error(`❌ ${name} Init-Fehler:`, e);
    }
}

safeInit('GestureControls', window.gestureControls);
safeInit('AnimationSystem', window.animationSystem);
safeInit('InputValidator', window.inputValidator);
safeInit('BLEHealthMonitor', window.bleHealthMonitor);
safeInit('EqualizerUI', window.equalizerUI);
safeInit('PlaylistDragDrop', window.playlistDragDrop);
safeInit('QuickActions', window.quickActions);
safeInit('ShareManager', window.shareManager);
safeInit('AutoStartManager', window.autoStartManager);
safeInit('MediaStoreBridge', window.mediaStoreBridge);
safeInit('PresetManager', window.presetManager);
safeInit('SliderLiveValueManager', window.sliderLiveValueManager);
safeInit('MultiLang', window.multiLang);
safeInit('AdvancedVisualizer', window.advancedVisualizer);
safeInit('AudioDecoderFFT', window.audioDecoderFFT);
safeInit('AudioReactiveEngine', window.audioReactiveEngine);
safeInit('CloudSync', window.cloudSync);
safeInit('DeviceManager', window.deviceManager);
safeInit('EqualizerEngine', window.equalizerEngine);
safeInit('GlobalErrorHandler', window.globalErrorHandler);
safeInit('LEDCustomNames', window.ledCustomNames);
safeInit('LEDSidebar', window.ledSidebar);
safeInit('LEDSidebarSwipe', window.ledSidebarSwipe);

console.log('✅ Alle Module initialisiert (Fehler wurden abgefangen)');

window.App = App;

// FIX: Prüfe ob DOM bereits geladen ist
if (document.readyState === 'loading') {
    // DOM noch nicht geladen → Event-Listener setzen
    document.addEventListener('DOMContentLoaded', function () {
        console.log('🚀 DOMContentLoaded Event → App.initialize()');
        App.initialize();
    });
} else {
    // DOM IST BEREITS GELADEN → direkt starten!
    console.log('🚀 DOM bereits geladen → App.initialize() sofort');
    App.initialize();
}

if (typeof module !== 'undefined' && module.exports) module.exports = App;
