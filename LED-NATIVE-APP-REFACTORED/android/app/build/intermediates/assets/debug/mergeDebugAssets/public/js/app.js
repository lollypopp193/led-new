/**
 * APP.JS v4.0 - ZERO TOLERANCE - HAUPTANWENDUNGSLOGIK
 * Zentrale App-Steuerung mit vollständiger Integration aller Module
 */
'use strict';

const App = {
    ble: null, deviceManager: null, nativeBridge: null, capacitorAdapter: null, scenesManager: null, performanceOptimizer: null, ledAbstraction: null, eventManager: null, audioReactiveEngine: null, musikIntegration: null, musicLibraryManager: null, elements: {}, config: { startup_delay: 500, particle_count: 120, theme: 'dark', language: 'de', autoConnect: false, saveState: true, animations: true, notifications: true, hapticFeedback: true, soundEffects: false }, state: { currentApp: null, initialized: false, isConnected: false, currentDevice: null, brightness: 100, currentColor: { r: 255, g: 255, b: 255 }, currentEffect: null, isPlaying: false },
    async initialize() {
        if (this.state.initialized) { console.log('\u26a0\ufe0f App bereits initialisiert'); return; } console.log('\ud83d\ude80 LED Native App v4.0 - Zero Tolerance - Initialisierung...'); try {
            // Sequenzielle Berechtigungen (nacheinander wie bei professionellen Apps)
            if (window.permissionsSequencer) {
                await window.permissionsSequencer.start((results) => {
                    console.log('✅ Berechtigungen abgeschlossen:', results);
                    // Nach Berechtigungen weiter initialisieren
                    this.continueInitialization();
                });
                return; // Warte auf Berechtigungen
            }
            if (window.PermissionsHandler) {
                await window.PermissionsHandler.init();
                await window.PermissionsHandler.requestAllPermissions();
            }
            if (window.BluetoothForegroundService) {
                await window.BluetoothForegroundService.init();
                await window.BluetoothForegroundService.startForegroundService();
                console.log('✅ Bluetooth Foreground Service gestartet');
            }
            if (window.AndroidMusicScanner) {
                await window.AndroidMusicScanner.init();
                console.log('✅ Android Music Scanner initialisiert');
            }
            if (window.i18n && window.i18n.init) {
                window.i18n.init();
                console.log('✅ i18n-System initialisiert');
            }
            // Auto-Scan SILENT im Hintergrund
            if (window.LEDAutoScanner) {
                setTimeout(function () {
                    console.log('🔇 LED Auto-Scan (silent)...');
                    window.LEDAutoScanner.startAutoScan();
                }, 2000);
            }
            if (window.LibraryAutoScanner) {
                setTimeout(function () {
                    console.log('🔇 Musikbibliothek Auto-Scan (silent)...');
                    window.LibraryAutoScanner.startAutoScan();
                }, 3000);
            }
            if (window.AndroidMusicScanner) {
                setTimeout(async function () {
                    console.log('🔇 Android Music Scan (silent)...');
                    try {
                        await window.AndroidMusicScanner.scanMediaStore();
                    } catch (e) { /* Silent fail */ }
                }, 4000);
            }
            await this.initializeModules();
            this.cacheDOMElements();
            this.initParticles();
            this.initNavigation();
            this.initGlobalEventListeners();
            this.loadSettings();
            this.initStartupSequence();
            this.state.initialized = true;
            console.log('\u2705 App erfolgreich initialisiert');
            if (this.eventManager) this.eventManager.emit('app-ready', { timestamp: Date.now() });
        } catch (err) { console.error('\u274c Initialisierung fehlgeschlagen:', err); this.showError('Initialisierung fehlgeschlagen'); }
    },
    async continueInitialization() {
        try {
            await this.initializeModules();
            this.cacheDOMElements();
            this.initParticles();
            this.initNavigation();
            this.initGlobalEventListeners();
            this.loadSettings();
            this.initStartupSequence();
            this.state.initialized = true;
            console.log('\u2705 App erfolgreich initialisiert (nach Permissions)');
            if (this.eventManager) this.eventManager.emit('app-ready', { timestamp: Date.now() });
        } catch (err) { console.error('\u274c Fortsetzung fehlgeschlagen:', err); }
    },
    async initializeModules() { try { console.log('\ud83d\udce6 Lade Module...'); if (window.eventManager) { this.eventManager = window.eventManager; console.log('\u2705 EventManager geladen'); } if (window.performanceOptimizer) { this.performanceOptimizer = window.performanceOptimizer; this.performanceOptimizer.init(); console.log('\u2705 PerformanceOptimizer geladen'); } if (window.ledAbstraction) { this.ledAbstraction = window.ledAbstraction; await this.ledAbstraction.detectLEDType(); console.log('\u2705 LED-Abstraction geladen'); } if (window.scenesManager) { this.scenesManager = window.scenesManager; console.log('\u2705 ScenesManager geladen'); } if (window.deviceManager) { this.deviceManager = window.deviceManager; console.log('\u2705 DeviceManager geladen'); } if (window.audioReactiveEngine) { this.audioReactiveEngine = window.audioReactiveEngine; console.log('\u2705 AudioReactiveEngine geladen'); } if (window.musikIntegration) { this.musikIntegration = window.musikIntegration; console.log('\u2705 MusikIntegration geladen'); } if (window.musicLibraryManager) { this.musicLibraryManager = window.musicLibraryManager; await this.musicLibraryManager.init(); console.log('\u2705 MusicLibraryManager geladen'); } if (typeof Capacitor !== 'undefined') { await this.initCapacitor(); } console.log('\u2705 Alle Module geladen'); } catch (err) { console.error('\u274c Modul-Initialisierung fehlgeschlagen:', err); throw err; } },
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
    cacheDOMElements() { this.elements.startScreen = document.getElementById('startscreen'); this.elements.appScreen = document.getElementById('appscreen'); this.elements.navBar = document.querySelector('.nav-bar'); this.elements.appIframe = document.getElementById('app-iframe'); this.elements.particleCanvas = document.getElementById('background-canvas'); this.elements.connectionStatus = document.getElementById('connection-status'); this.elements.notificationContainer = document.getElementById('notification-container'); console.log('\u2705 DOM-Elemente gecached'); },
    initStartupSequence() { setTimeout(function () { if (this.elements.startScreen) this.elements.startScreen.style.display = 'none'; if (this.elements.appScreen) this.elements.appScreen.style.display = 'flex'; const lastApp = localStorage.getItem('last-app') || 'farbe'; this.openApp(lastApp); console.log('\u2705 Startup-Sequenz abgeschlossen'); }.bind(this), this.config.startup_delay); },
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
    handleAppResume() { console.log('\u25b6\ufe0f App fortgesetzt'); if (this.config.autoConnect && !this.state.isConnected) { setTimeout(function () { this.connectBLE(); }.bind(this), 1000); } },
    showNotification(message, type, duration) { type = type || 'info'; duration = duration || 3000; if (window.showGlobalNotification) { window.showGlobalNotification(message, type, duration); } else { console.log('[' + type.toUpperCase() + '] ' + message); } },
    showError(message) { this.showNotification(message, 'error', 5000); console.error('\u274c Error:', message); },
    initParticles() { if (!this.elements.particleCanvas || !this.config.animations) return; try { const canvas = this.elements.particleCanvas; const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight; const particles = []; for (let i = 0; i < this.config.particle_count; i++) { particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, radius: Math.random() * 2 + 1 }); } function animate() { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'rgba(78, 205, 196, 0.5)'; particles.forEach(function (p) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > canvas.width) p.vx *= -1; if (p.y < 0 || p.y > canvas.height) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill(); }); requestAnimationFrame(animate); } animate(); console.log('\u2705 Partikel-Animation initialisiert'); } catch (err) { console.warn('\u26a0\ufe0f Partikel-Fehler:', err); } },
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

// GestureControls initialisieren
if (window.gestureControls) {
    window.gestureControls.init();
    console.log('✅ GestureControls initialisiert');
}

// AnimationSystem initialisieren  
if (window.animationSystem) {
    window.animationSystem.init();
    console.log(' AnimationSystem initialisiert');
}

// InputValidator initialisieren
if (window.inputValidator) {
    window.inputValidator.init();
    console.log(' InputValidator initialisiert');
}


// === MODUL-AKTIVIERUNGEN (Auto-generiert) ===

// BLE Error Fixer aktivieren
if (window.BLEErrorFixer) {
    window.BLEErrorFixer.init();
    console.log('✅ BLEErrorFixer aktiviert');
}

// Equalizer UI aktivieren
if (window.equalizerUI) {
    window.equalizerUI.init();
    console.log(' EqualizerUI aktiviert');
}

// Playlist Drag & Drop aktivieren
if (window.playlistDragDrop) {
    window.playlistDragDrop.init();
    console.log(' PlaylistDragDrop aktiviert');
}

// Quick Actions aktivieren
if (window.quickActions) {
    window.quickActions.init();
    console.log(' QuickActions aktiviert');
}

// Share Manager aktivieren
if (window.shareManager) {
    window.shareManager.init();
    console.log('✅ ShareManager aktiviert');
}

// Auto-Start Manager aktivieren
if (window.autoStartManager) {
    window.autoStartManager.init();
    console.log('✅ AutoStartManager aktiviert');
}

// MediaStore Bridge aktivieren
if (window.mediaStoreBridge) {
    window.mediaStoreBridge.init();
    console.log('✅ MediaStoreBridge aktiviert');
}

// Preset Manager aktivieren
if (window.presetManager) {
    window.presetManager.init();
    console.log('✅ PresetManager aktiviert');
}

// Slider Live Value Manager aktivieren
if (window.sliderLiveValueManager) {
    window.sliderLiveValueManager.init();
    console.log('✅ SliderLiveValueManager aktiviert');
}

// i18n aktivieren
if (window.multiLang) {
    window.multiLang.init();
    console.log('✅ i18n aktiviert');
}

// Advanced Visualizer aktivieren
if (window.advancedVisualizer) {
    window.advancedVisualizer.init();
    console.log('✅ AdvancedVisualizer aktiviert');
}

// Audio Decoder FFT aktivieren
if (window.audioDecoderFFT) {
    window.audioDecoderFFT.init();
    console.log('✅ AudioDecoderFFT aktiviert');
}

// Audio Reactive Engine aktivieren (KRITISCH für LED-Musik)
if (window.audioReactiveEngine) {
    window.audioReactiveEngine.init();
    console.log('✅ AudioReactiveEngine aktiviert');
}

// Cloud Sync aktivieren
if (window.cloudSync) {
    window.cloudSync.init();
    console.log('✅ CloudSync aktiviert');
}

// Device Manager aktivieren (KRITISCH)
if (window.deviceManager) {
    window.deviceManager.init();
    console.log('✅ DeviceManager aktiviert');
}

// Equalizer Engine aktivieren (KRITISCH)
if (window.equalizerEngine) {
    window.equalizerEngine.init();
    console.log('✅ EqualizerEngine aktiviert');
}

// Global Error Handler aktivieren
if (window.globalErrorHandler) {
    window.globalErrorHandler.init();
    console.log('✅ GlobalErrorHandler aktiviert');
}

// LED Custom Names aktivieren
if (window.ledCustomNames) {
    window.ledCustomNames.init();
    console.log('✅ LEDCustomNames aktiviert');
}

// LED Sidebar aktivieren
if (window.ledSidebar) {
    window.ledSidebar.init();
    console.log('✅ LEDSidebar aktiviert');
}

// LED Sidebar Swipe aktivieren
if (window.ledSidebarSwipe) {
    window.ledSidebarSwipe.init();
    console.log('✅ LEDSidebarSwipe aktiviert');
}

window.App = App;

document.addEventListener('DOMContentLoaded', function () { App.initialize(); });

if (typeof module !== 'undefined' && module.exports) module.exports = App;
