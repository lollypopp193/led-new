/**
 * ANDROID SHORTCUTS HANDLER v1.0
 * Verarbeitet Deep-Links von Android App-Shortcuts
 */
'use strict';

class ShortcutHandler {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        // App-Plugin Event Listener
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.addListener('appUrlOpen', (data) => {
                this.handleDeepLink(data.url);
            });
            console.log('✅ Shortcut Handler initialisiert');
            this.initialized = true;
        } else {
            // Fallback für Web
            console.log('⚠️ Capacitor App Plugin nicht verfügbar');
        }

        // Beim App-Start URL prüfen
        this.checkInitialUrl();
    }

    async checkInitialUrl() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                const result = await window.Capacitor.Plugins.App.getLaunchUrl();
                if (result && result.url) {
                    this.handleDeepLink(result.url);
                }
            }
        } catch (e) {
            console.error('❌ Fehler beim Abrufen der Launch-URL:', e);
        }
    }

    handleDeepLink(url) {
        console.log('📱 Deep-Link empfangen:', url);

        if (!url || !url.startsWith('ledcontrol://')) {
            return;
        }

        // URL parsen: ledcontrol://action/led_on
        const action = url.replace('ledcontrol://action/', '');

        console.log('🚀 Führe Shortcut aus:', action);

        switch (action) {
            case 'led_on':
                this.ledOn();
                break;
            case 'led_off':
                this.ledOff();
                break;
            case 'last_scene':
                this.activateLastScene();
                break;
            case 'party_mode':
                this.activatePartyMode();
                break;
            case 'color_red':
                this.setColor(255, 0, 0, 'Rot');
                break;
            case 'color_green':
                this.setColor(0, 255, 0, 'Grün');
                break;
            case 'color_blue':
                this.setColor(0, 0, 255, 'Blau');
                break;
            default:
                console.warn('⚠️ Unbekannter Shortcut:', action);
        }
    }

    async ledOn() {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller) {
                this.showError('LED Controller nicht verfügbar');
                return;
            }

            if (!controller.isConnected) {
                this.showError('LED nicht verbunden');
                return;
            }

            await controller.setPower(true);

            if (window.showNotification) {
                window.showNotification('💡 LED eingeschaltet', 'success');
            }
        } catch (e) {
            console.error('❌ LED An Fehler:', e);
            this.showError('Fehler beim Einschalten');
        }
    }

    async ledOff() {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller) {
                this.showError('LED Controller nicht verfügbar');
                return;
            }

            if (!controller.isConnected) {
                this.showError('LED nicht verbunden');
                return;
            }

            await controller.setPower(false);

            if (window.showNotification) {
                window.showNotification('🌙 LED ausgeschaltet', 'success');
            }
        } catch (e) {
            console.error('❌ LED Aus Fehler:', e);
            this.showError('Fehler beim Ausschalten');
        }
    }

    async activateLastScene() {
        try {
            if (!window.scenesManager) {
                this.showError('Szenen-Manager nicht verfügbar');
                return;
            }

            const scenes = window.scenesManager.getAllScenes();
            if (!scenes || scenes.length === 0) {
                this.showError('Keine Szenen gefunden');
                return;
            }

            // Letzte Szene = zuletzt erstellt/aktualisiert
            const lastScene = scenes.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))[0];

            await window.scenesManager.activateScene(lastScene.id);

            if (window.showNotification) {
                window.showNotification('🎬 Szene "' + lastScene.name + '" aktiviert', 'success');
            }
        } catch (e) {
            console.error('❌ Szene aktivieren Fehler:', e);
            this.showError('Fehler beim Aktivieren der Szene');
        }
    }

    async activatePartyMode() {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller || !controller.isConnected) {
                this.showError('LED nicht verbunden');
                return;
            }

            // Party-Effekt (z.B. Effekt 7 = RGB Cycle)
            await controller.setEffect(7);
            await controller.setBrightness(100);

            if (window.showNotification) {
                window.showNotification('🎉 Party-Modus aktiviert!', 'success');
            }
        } catch (e) {
            console.error('❌ Party-Modus Fehler:', e);
            this.showError('Fehler beim Starten des Party-Modus');
        }
    }

    async setColor(r, g, b, name) {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller || !controller.isConnected) {
                this.showError('LED nicht verbunden');
                return;
            }

            await controller.setColorRGB(r, g, b);

            if (window.showNotification) {
                window.showNotification('🎨 Farbe: ' + name, 'success');
            }
        } catch (e) {
            console.error('❌ Farbe setzen Fehler:', e);
            this.showError('Fehler beim Setzen der Farbe');
        }
    }

    showError(message) {
        if (window.showNotification) {
            window.showNotification('❌ ' + message, 'error');
        } else {
            console.error(message);
        }
    }
}

// Global verfügbar
window.ShortcutHandler = ShortcutHandler;
window.shortcutHandler = new ShortcutHandler();

console.log('✅ Shortcut Handler geladen');
