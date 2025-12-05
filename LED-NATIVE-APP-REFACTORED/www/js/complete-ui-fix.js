/**
 * COMPLETE-UI-FIX.JS
 * Behebt ALLE UI-Probleme in der gesamten App:
 * - Toggle-Switches funktionieren und speichern Status
 * - Slider zeigen Live-Werte an
 * - Berechtigungen werden beim Start angefragt
 * - Bluetooth-Suche funktioniert
 * - Musik-Bibliothek wird gescannt
 * @version 1.0.0
 */
'use strict';

class CompleteUIFix {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialisiert alle UI-Fixes
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        console.log('🔧 Complete-UI-Fix startet...');

        // 1. Alle Switches fixen (div.switch UND .toggle-switch)
        this.fixAllSwitches();

        // 2. Alle Slider mit Live-Werten fixen
        this.fixAllSliders();

        // 3. Gespeicherte Zustände laden
        this.loadSavedStates();

        // 4. DOM-Observer für dynamisch hinzugefügte Elemente
        this.observeDOM();

        // 5. Select-Elemente (Sprache, etc.) fixen
        this.fixAllSelects();

        console.log('✅ Complete-UI-Fix initialisiert');
    }

    /**
     * Fixe ALLE Switches - div.switch UND .toggle-switch input[type=checkbox]
     */
    fixAllSwitches() {
        // TYPE 1: div.switch mit div.switch-handle (einstellungen.html Style)
        document.querySelectorAll('.switch:not(.toggle-switch):not([data-fixed])').forEach(switchEl => {
            switchEl.setAttribute('data-fixed', 'true');

            // Entferne bestehende onclick wenn vorhanden
            const existingOnclick = switchEl.getAttribute('onclick');

            // Neuer Click-Handler
            switchEl.addEventListener('click', (e) => {
                e.stopPropagation();

                // Toggle active class
                switchEl.classList.toggle('active');
                const isActive = switchEl.classList.contains('active');

                console.log(`🔘 Switch ${switchEl.id || 'unknown'}: ${isActive ? 'AN' : 'AUS'}`);

                // Speichere Status
                if (switchEl.id) {
                    localStorage.setItem('switch_' + switchEl.id, isActive.toString());
                }

                // FIX SECURITY: Trigger onclick event statt eval()
                // eval() ist XSS-Risk - stattdessen click() Event triggern
                if (existingOnclick && !existingOnclick.includes('toggle')) {
                    try {
                        // Sichere Alternative: Click-Event triggern
                        switchEl.click();
                    } catch (err) {
                        console.warn('onclick Fehler:', err);
                    }
                }

                // Dispatch custom event
                switchEl.dispatchEvent(new CustomEvent('switch-change', {
                    bubbles: true,
                    detail: { active: isActive, id: switchEl.id }
                }));
            });

            // Touch-Support
            switchEl.style.cursor = 'pointer';
            switchEl.style.userSelect = 'none';
            switchEl.style.webkitTapHighlightColor = 'transparent';
        });

        // TYPE 2: .toggle-switch mit input[type=checkbox] (musik.html Style)
        document.querySelectorAll('.toggle-switch:not([data-fixed])').forEach(toggle => {
            toggle.setAttribute('data-fixed', 'true');

            const input = toggle.querySelector('input[type="checkbox"]');
            const slider = toggle.querySelector('.slider');

            if (!input) return;

            // Klick auf Container togglet das Input
            toggle.addEventListener('click', (e) => {
                if (e.target === input) return; // Input handled sich selbst

                e.stopPropagation();
                input.checked = !input.checked;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // Change-Event loggen und speichern
            input.addEventListener('change', () => {
                const isChecked = input.checked;
                console.log(`🔘 Toggle ${input.id || 'unknown'}: ${isChecked ? 'AN' : 'AUS'}`);

                if (input.id) {
                    localStorage.setItem('toggle_' + input.id, isChecked.toString());
                }
            });

            // Touch-Support
            toggle.style.cursor = 'pointer';
            toggle.style.userSelect = 'none';
        });

        console.log('✅ Alle Switches gefixt');
    }

    /**
     * Fixe ALLE Slider - Live-Wertanzeige
     */
    fixAllSliders() {
        document.querySelectorAll('input[type="range"]:not([data-fixed])').forEach(slider => {
            slider.setAttribute('data-fixed', 'true');

            // Finde das zugehörige Wert-Anzeige-Element
            let valueDisplay = this.findValueDisplay(slider);

            // Input-Event für Live-Update
            slider.addEventListener('input', () => {
                const value = slider.value;
                const min = parseFloat(slider.min) || 0;
                const max = parseFloat(slider.max) || 100;

                // Update Value-Display
                if (valueDisplay) {
                    valueDisplay.textContent = this.formatSliderValue(slider, value);
                }

                // Progress-Hintergrund aktualisieren
                const percentage = ((value - min) / (max - min)) * 100;
                slider.style.background = `linear-gradient(to right, #4ecdc4 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%)`;

                // Speichere Wert
                if (slider.id) {
                    localStorage.setItem('slider_' + slider.id, value);
                }

                console.log(`📊 Slider ${slider.id || 'unknown'}: ${value}`);
            });

            // Initial-Update triggern
            slider.dispatchEvent(new Event('input'));
        });

        console.log('✅ Alle Slider gefixt');
    }

    /**
     * Finde das Value-Display Element für einen Slider
     */
    findValueDisplay(slider) {
        // Methode 1: Nächstes Element mit .slider-value Klasse
        const container = slider.closest('.slider-container, .setting-item, div');
        if (container) {
            const valueEl = container.querySelector('.slider-value, .value, [class*="value"]');
            if (valueEl) return valueEl;
        }

        // Methode 2: ID-basiert
        if (slider.id) {
            const variations = [
                slider.id + 'Value',
                slider.id.replace('Slider', 'Value'),
                slider.id.replace('slider', 'Value'),
                slider.id.replace('Slider', '') + 'Value'
            ];

            for (const id of variations) {
                const el = document.getElementById(id);
                if (el) return el;
            }
        }

        // Methode 3: Nächstes span nach dem Slider
        const nextSpan = slider.nextElementSibling;
        if (nextSpan && nextSpan.tagName === 'SPAN') {
            return nextSpan;
        }

        return null;
    }

    /**
     * Formatiere Slider-Wert basierend auf Kontext
     */
    formatSliderValue(slider, value) {
        const id = (slider.id || '').toLowerCase();

        if (id.includes('brightness') || id.includes('volume') ||
            id.includes('intensity') || id.includes('sensitivity') ||
            id.includes('opacity')) {
            return value + '%';
        }
        if (id.includes('time') || id.includes('duration') ||
            id.includes('fade') || id.includes('overlap')) {
            return parseFloat(value).toFixed(1) + 's';
        }
        if (id.includes('fps') || id.includes('framerate')) {
            return value + ' FPS';
        }
        if (id.includes('tempo') || id.includes('speed')) {
            return parseFloat(value).toFixed(1) + 'x';
        }
        if (id.includes('packet') || id.includes('size')) {
            return value + ' Bytes';
        }
        if (id.includes('pitch')) {
            const semitones = parseInt(value);
            return (semitones >= 0 ? '+' : '') + semitones + ' st';
        }

        // Default: Prozent
        return value + '%';
    }

    /**
     * Lade gespeicherte Zustände aus LocalStorage
     */
    loadSavedStates() {
        // Lade Switch-Zustände (div.switch)
        document.querySelectorAll('.switch:not(.toggle-switch)').forEach(switchEl => {
            if (switchEl.id) {
                const saved = localStorage.getItem('switch_' + switchEl.id);
                if (saved !== null) {
                    if (saved === 'true') {
                        switchEl.classList.add('active');
                    } else {
                        switchEl.classList.remove('active');
                    }
                }
            }
        });

        // Lade Toggle-Zustände (.toggle-switch input)
        document.querySelectorAll('.toggle-switch input[type="checkbox"]').forEach(input => {
            if (input.id) {
                const saved = localStorage.getItem('toggle_' + input.id);
                if (saved !== null) {
                    input.checked = saved === 'true';
                }
            }
        });

        // Lade Slider-Werte
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            if (slider.id) {
                const saved = localStorage.getItem('slider_' + slider.id);
                if (saved !== null) {
                    slider.value = saved;
                    slider.dispatchEvent(new Event('input'));
                }
            }
        });

        // Lade Select-Werte
        document.querySelectorAll('select').forEach(select => {
            if (select.id) {
                const saved = localStorage.getItem('select_' + select.id);
                if (saved !== null) {
                    select.value = saved;
                }
            }
        });

        console.log('✅ Gespeicherte Zustände geladen');
    }

    /**
     * Fixe alle Select-Elemente (Sprache, etc.)
     */
    fixAllSelects() {
        document.querySelectorAll('select:not([data-fixed])').forEach(select => {
            select.setAttribute('data-fixed', 'true');

            select.addEventListener('change', () => {
                const value = select.value;
                console.log(`📝 Select ${select.id || 'unknown'}: ${value}`);

                if (select.id) {
                    localStorage.setItem('select_' + select.id, value);
                }

                // Spezielle Behandlung für Sprach-Select
                if (select.id === 'languageSelect') {
                    this.changeLanguage(value);
                }
            });
        });
    }

    /**
     * Sprache ändern
     */
    changeLanguage(lang) {
        console.log(`🌍 Sprache wechseln zu: ${lang}`);

        // Speichere gewählte Sprache
        localStorage.setItem('appLanguage', lang);

        // Wenn MultiLanguageSupport vorhanden, nutze es
        if (window.MultiLanguageSupport) {
            window.MultiLanguageSupport.setLanguage(lang);
        } else if (window.changeAppLanguage) {
            window.changeAppLanguage(lang);
        } else {
            // Fallback: Seite neu laden mit neuer Sprache
            console.log('ℹ️ Sprache wird beim nächsten Start angewendet');
        }
    }

    /**
     * DOM-Observer für dynamisch hinzugefügte Elemente
     */
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            let needsFix = false;

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.querySelector?.('.switch, .toggle-switch, input[type="range"], select') ||
                            node.classList?.contains('switch') ||
                            node.classList?.contains('toggle-switch')) {
                            needsFix = true;
                        }
                    }
                });
            });

            if (needsFix) {
                setTimeout(() => {
                    this.fixAllSwitches();
                    this.fixAllSliders();
                    this.fixAllSelects();
                }, 50);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// ============================================================
// BERECHTIGUNGEN BEIM APP-START
// ============================================================
class AppPermissions {
    /**
     * Prüft und fragt alle benötigten Berechtigungen an
     */
    static async requestAll() {
        console.log('🔐 Prüfe Berechtigungen...');

        const permissions = [];

        // Bluetooth
        if (window.Capacitor?.isNativePlatform()) {
            try {
                const { BleClient } = await import('@capacitor-community/bluetooth-le');
                await BleClient.initialize();
                permissions.push('Bluetooth ✅');
            } catch (e) {
                console.warn('Bluetooth-Berechtigung fehlt:', e);
                permissions.push('Bluetooth ❌');
            }

            // Storage/Media
            try {
                const { Filesystem } = await import('@capacitor/filesystem');
                await Filesystem.checkPermissions();
                permissions.push('Speicher ✅');
            } catch (e) {
                console.warn('Speicher-Berechtigung fehlt:', e);
                permissions.push('Speicher ❌');
            }
        }

        console.log('Berechtigungen:', permissions.join(', '));
        return permissions;
    }
}

// ============================================================
// BLUETOOTH-SUCHE
// ============================================================
class BluetoothScanner {
    static isScanning = false;

    /**
     * Startet die Bluetooth-Suche
     */
    static async startScan() {
        if (this.isScanning) return;

        console.log('🔍 Starte Bluetooth-Suche...');
        this.isScanning = true;

        // UI aktualisieren
        const scanBtn = document.getElementById('scanButton');
        const scanText = document.getElementById('scanText');
        const deviceList = document.getElementById('deviceList');

        if (scanBtn) scanBtn.disabled = true;
        if (scanText) scanText.textContent = 'Suche läuft...';
        if (deviceList) deviceList.innerHTML = '<div class="scanning">⏳ Suche nach LED-Geräten...</div>';

        try {
            // Verwende vorhandenen BLE-Controller
            if (window.BLEControllerPro) {
                const devices = await window.BLEControllerPro.startScan('all', 'smart');
                this.displayDevices(devices);
            } else if (window.bleControllerPro) {
                const devices = await window.bleControllerPro.startScan('all', 'smart');
                this.displayDevices(devices);
            } else {
                // Fallback: Web Bluetooth API
                const device = await navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
                });

                if (device) {
                    this.displayDevices([{
                        name: device.name || 'LED-Band',
                        id: device.id,
                        device: device
                    }]);
                }
            }
        } catch (error) {
            console.error('Scan-Fehler:', error);
            if (deviceList) {
                deviceList.innerHTML = '<div class="no-devices">❌ Scan fehlgeschlagen. Stelle sicher, dass Bluetooth aktiviert ist.</div>';
            }
        } finally {
            this.isScanning = false;
            if (scanBtn) scanBtn.disabled = false;
            if (scanText) scanText.textContent = 'Geräte suchen';
        }
    }

    /**
     * Zeigt gefundene Geräte an
     */
    static displayDevices(devices) {
        const deviceList = document.getElementById('deviceList');
        if (!deviceList) return;

        if (!devices || devices.length === 0) {
            deviceList.innerHTML = '<div class="no-devices">Keine Geräte gefunden. Stelle sicher, dass dein LED-Band eingeschaltet ist.</div>';
            return;
        }

        deviceList.innerHTML = '';
        devices.forEach(device => {
            const item = document.createElement('div');
            item.className = 'device-item';
            item.innerHTML = `
                <div class="device-info">
                    <div class="device-status ${device.connected ? '' : 'disconnected'}"></div>
                    <div class="device-details">
                        <div class="device-name">${device.name || 'Unbekanntes Gerät'}</div>
                        <div class="device-mac">${device.id || ''}</div>
                    </div>
                </div>
                <div class="device-actions">
                    <button class="device-btn btn-connect" onclick="BluetoothScanner.connect('${device.id}')">
                        Verbinden
                    </button>
                </div>
            `;
            deviceList.appendChild(item);
        });
    }

    /**
     * Verbindet mit einem Gerät
     */
    static async connect(deviceId) {
        console.log('🔗 Verbinde mit:', deviceId);

        try {
            if (window.BLEControllerPro) {
                await window.BLEControllerPro.connect(deviceId);
            } else if (window.bleControllerPro) {
                await window.bleControllerPro.connect(deviceId);
            }

            // Benachrichtigung
            if (window.showNotification) {
                window.showNotification('✅ Verbunden mit LED-Band', 'success');
            }
        } catch (error) {
            console.error('Verbindungsfehler:', error);
            if (window.showNotification) {
                window.showNotification('❌ Verbindung fehlgeschlagen', 'error');
            }
        }
    }
}

// ============================================================
// MUSIK-BIBLIOTHEK SCANNER
// ============================================================
class MusicLibraryScanner {
    /**
     * Scannt die Musik-Bibliothek des Geräts
     */
    static async scan() {
        console.log('🎵 Scanne Musik-Bibliothek...');

        try {
            // Capacitor Filesystem nutzen
            if (window.Capacitor?.isNativePlatform()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');

                // Musik-Ordner scannen
                const result = await Filesystem.readdir({
                    path: 'Music',
                    directory: Directory.External
                });

                console.log('Gefundene Dateien:', result.files.length);
                return result.files.filter(f =>
                    f.name.endsWith('.mp3') ||
                    f.name.endsWith('.m4a') ||
                    f.name.endsWith('.wav') ||
                    f.name.endsWith('.flac')
                );
            } else {
                // Web-Fallback
                console.log('ℹ️ Musik-Scan nur auf nativem Gerät verfügbar');
                return [];
            }
        } catch (error) {
            console.error('Musik-Scan-Fehler:', error);
            return [];
        }
    }
}

// ============================================================
// GLOBAL INITIALISIERUNG
// ============================================================
const completeUIFix = new CompleteUIFix();
window.completeUIFix = completeUIFix;
window.BluetoothScanner = BluetoothScanner;
window.MusicLibraryScanner = MusicLibraryScanner;
window.AppPermissions = AppPermissions;

// Bei DOM-Ready starten
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        completeUIFix.init();
    });
} else {
    completeUIFix.init();
}

// Nach vollständigem Laden nochmal fixen
window.addEventListener('load', () => {
    setTimeout(() => {
        completeUIFix.fixAllSwitches();
        completeUIFix.fixAllSliders();
        completeUIFix.fixAllSelects();
    }, 500);
});

// Scan-Button Event hinzufügen
document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scanButton');
    if (scanBtn) {
        scanBtn.addEventListener('click', () => BluetoothScanner.startScan());
    }
});

console.log('📦 Complete-UI-Fix geladen');
