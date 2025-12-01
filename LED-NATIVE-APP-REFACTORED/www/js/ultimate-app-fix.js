/**
 * ULTIMATE APP FIX v1.0
 * =====================
 * Dieses Script behebt ALLE bekannten Probleme in der App:
 * - Toggle Switches (Kreise innerhalb, alle klickbar)
 * - Slider (Live-Werte, alle bedienbar)
 * - Bluetooth (Scan funktioniert, Berechtigungen beim Start)
 * - Musik-Scanner (durchsucht Handy beim Start)
 * - Responsive Design (nichts außerhalb Bildschirm)
 * - Sprachen (DE, EN, ES, FR funktionieren)
 * - Alle UI-Elemente funktional
 */
'use strict';

(function () {
    console.log('🔧 ULTIMATE APP FIX wird geladen...');

    // ========================================
    // 1. TOGGLE SWITCHES - GLOBALER FIX
    // ========================================
    function fixAllToggleSwitches() {
        // Finde ALLE möglichen Toggle-Elemente
        const switches = document.querySelectorAll(
            '.toggle-switch, .switch, .toggle, ' +
            '[class*="toggle"], [class*="switch"], ' +
            'div[onclick*="toggle"], div[id*="Switch"], div[id*="toggle"]'
        );

        switches.forEach((switchEl, index) => {
            // Überspringe Slider und Input-Elemente
            if (switchEl.tagName === 'INPUT' ||
                switchEl.classList.contains('slider') ||
                switchEl.type === 'range') {
                return;
            }

            // Style-Fix: Größe und Form
            switchEl.style.cssText = `
                position: relative !important;
                display: inline-block !important;
                width: 52px !important;
                min-width: 52px !important;
                max-width: 52px !important;
                height: 28px !important;
                min-height: 28px !important;
                max-height: 28px !important;
                background: ${switchEl.classList.contains('active') ? '#ff6b35' : '#333'} !important;
                border-radius: 28px !important;
                border: 2px solid ${switchEl.classList.contains('active') ? '#ff6b35' : '#555'} !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                flex-shrink: 0 !important;
                overflow: visible !important;
            `;

            // Entferne alte Pseudo-Elemente und erstelle neuen Kreis
            let circle = switchEl.querySelector('.switch-circle');
            if (!circle) {
                circle = document.createElement('div');
                circle.className = 'switch-circle';
                switchEl.appendChild(circle);
            }

            // Kreis INNERHALB des Schalters
            const isActive = switchEl.classList.contains('active');
            circle.style.cssText = `
                position: absolute !important;
                top: 3px !important;
                left: ${isActive ? '27px' : '3px'} !important;
                width: 18px !important;
                height: 18px !important;
                background: ${isActive ? '#fff' : '#888'} !important;
                border-radius: 50% !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
                pointer-events: none !important;
            `;

            // Event-Listener für Klick
            switchEl.onclick = null; // Entferne alte Handler
            switchEl.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Toggle Status
                const wasActive = this.classList.contains('active');

                if (wasActive) {
                    this.classList.remove('active');
                    this.style.background = '#333';
                    this.style.borderColor = '#555';
                    circle.style.left = '3px';
                    circle.style.background = '#888';
                } else {
                    this.classList.add('active');
                    this.style.background = '#ff6b35';
                    this.style.borderColor = '#ff6b35';
                    circle.style.left = '27px';
                    circle.style.background = '#fff';
                }

                // Speichere Status
                const switchId = this.id || this.dataset.id || `switch_${index}`;
                localStorage.setItem('switch_' + switchId, !wasActive);

                console.log('🔘 Switch toggled:', switchId, '→', !wasActive ? 'AN' : 'AUS');

                // Dispatch custom event
                this.dispatchEvent(new CustomEvent('switchChanged', {
                    detail: { active: !wasActive, id: switchId }
                }));
            });

            // Lade gespeicherten Status
            const switchId = switchEl.id || switchEl.dataset.id || `switch_${index}`;
            const savedState = localStorage.getItem('switch_' + switchId);
            if (savedState === 'true' && !switchEl.classList.contains('active')) {
                switchEl.click();
            }
        });

        console.log(`✅ ${switches.length} Toggle Switches gefixt`);
    }

    // ========================================
    // 2. SLIDER - GLOBALER FIX
    // ========================================
    function fixAllSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');

        sliders.forEach((slider, index) => {
            // Style-Fix
            slider.style.cssText = `
                -webkit-appearance: none !important;
                appearance: none !important;
                width: 100% !important;
                height: 8px !important;
                background: #333 !important;
                border-radius: 4px !important;
                outline: none !important;
                cursor: pointer !important;
                margin: 10px 0 !important;
            `;

            // Finde oder erstelle Value-Display
            let valueDisplay = slider.parentElement.querySelector('.slider-value, .value, span:last-child');
            if (!valueDisplay) {
                valueDisplay = document.createElement('span');
                valueDisplay.className = 'slider-value';
                valueDisplay.style.cssText = 'min-width: 45px; text-align: right; color: #4ecdc4;';
                slider.parentElement.appendChild(valueDisplay);
            }

            // Update-Funktion
            const updateSlider = () => {
                const value = slider.value;
                const min = slider.min || 0;
                const max = slider.max || 100;
                const percent = ((value - min) / (max - min)) * 100;

                // Track-Farbe
                slider.style.background = `linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${percent}%, #333 ${percent}%, #333 100%)`;

                // Wert anzeigen mit Einheit
                const unit = getSliderUnit(slider);
                valueDisplay.textContent = value + unit;

                // Speichern
                const sliderId = slider.id || slider.name || `slider_${index}`;
                localStorage.setItem('slider_' + sliderId, value);
            };

            // Events
            slider.addEventListener('input', updateSlider);
            slider.addEventListener('change', updateSlider);

            // Initial Update
            updateSlider();

            // Lade gespeicherten Wert
            const sliderId = slider.id || slider.name || `slider_${index}`;
            const savedValue = localStorage.getItem('slider_' + sliderId);
            if (savedValue !== null) {
                slider.value = savedValue;
                updateSlider();
            }
        });

        console.log(`✅ ${sliders.length} Slider gefixt`);
    }

    function getSliderUnit(slider) {
        const id = (slider.id || slider.name || '').toLowerCase();
        if (id.includes('brightness') || id.includes('helligkeit') || id.includes('volume') || id.includes('opacity')) return '%';
        if (id.includes('time') || id.includes('duration') || id.includes('dauer') || id.includes('fade') || id.includes('crossfade') || id.includes('timer')) return 's';
        if (id.includes('bass') || id.includes('treble') || id.includes('db') || id.includes('gain')) return 'dB';
        if (id.includes('bpm') || id.includes('tempo')) return ' BPM';
        return '';
    }

    // ========================================
    // 3. BLUETOOTH - BERECHTIGUNGEN & SCAN
    // ========================================
    async function initBluetooth() {
        console.log('🔵 Initialisiere Bluetooth...');

        // Prüfe ob Berechtigungen vorhanden
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
                // BLE Plugin initialisieren
                if (window.CapacitorCommunityBluetoothLe) {
                    const { BleClient } = window.CapacitorCommunityBluetoothLe;
                    if (BleClient) {
                        await BleClient.initialize({ androidNeverForLocation: false });
                        console.log('✅ BLE Client initialisiert');
                    }
                }
            } catch (error) {
                console.warn('⚠️ BLE Init:', error.message);
            }
        }

        // Globale Scan-Funktion bereitstellen
        window.startBluetoothScan = async function () {
            console.log('🔍 Bluetooth Scan gestartet...');

            try {
                // Versuche verschiedene BLE Controller
                const bleCtrl = window.bleController || window.BLEControllerPro;

                if (bleCtrl && typeof bleCtrl.scan === 'function') {
                    const device = await bleCtrl.scan();
                    if (device) {
                        console.log('✅ Gerät gefunden:', device.name);
                        showNotification('Gerät gefunden: ' + (device.name || 'LED-Band'), 'success');
                        return device;
                    }
                } else if (navigator.bluetooth) {
                    // Web Bluetooth API Fallback
                    const device = await navigator.bluetooth.requestDevice({
                        filters: [
                            { namePrefix: 'ELK' },
                            { namePrefix: 'LED' },
                            { namePrefix: 'BLE' }
                        ],
                        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb']
                    });

                    if (device) {
                        console.log('✅ Gerät gefunden:', device.name);
                        showNotification('Gerät gefunden: ' + device.name, 'success');
                        return device;
                    }
                }
            } catch (error) {
                if (!error.message.includes('cancelled')) {
                    console.error('❌ Scan Fehler:', error);
                    showNotification('Bluetooth Scan fehlgeschlagen', 'error');
                }
            }

            return null;
        };
    }

    // ========================================
    // 4. MUSIK-SCANNER - HANDY DURCHSUCHEN
    // ========================================
    async function initMusicScanner() {
        console.log('🎵 Initialisiere Musik-Scanner...');

        // Warte kurz bis andere Module geladen sind
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Android MediaStore Scanner
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                if (window.AndroidMusicScanner) {
                    await window.AndroidMusicScanner.init();
                    const tracks = await window.AndroidMusicScanner.scanMediaStore();
                    console.log(`✅ ${tracks ? tracks.length : 0} Tracks gefunden`);

                    if (tracks && tracks.length > 0) {
                        updateMusicLibraryUI(tracks);
                    }
                }
            }

            // Library Auto Scanner
            if (window.LibraryAutoScanner) {
                await window.LibraryAutoScanner.startAutoScan();
            }

        } catch (error) {
            console.warn('⚠️ Musik-Scanner:', error.message);
        }
    }

    function updateMusicLibraryUI(tracks) {
        // Finde Library-Container
        const libraryContainer = document.querySelector('.library-content, .song-list, #songList, #libraryContent');
        if (!libraryContainer) return;

        // Erstelle Song-Liste
        let html = '';
        tracks.forEach((track, index) => {
            html += `
                <div class="song-item" data-index="${index}" onclick="playSong(${index})">
                    <div class="song-cover">🎵</div>
                    <div class="song-info">
                        <div class="song-title">${track.title || 'Unbekannt'}</div>
                        <div class="song-artist">${track.artist || 'Unbekannter Künstler'}</div>
                    </div>
                    <div class="song-duration">${formatDuration(track.duration)}</div>
                </div>
            `;
        });

        libraryContainer.innerHTML = html || '<p>Keine Lieder gefunden</p>';
    }

    function formatDuration(ms) {
        if (!ms) return '0:00';
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ========================================
    // 5. RESPONSIVE DESIGN - NICHTS AUSSERHALB
    // ========================================
    function fixResponsiveDesign() {
        // Alle Container auf Bildschirm halten
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);

            // Prüfe ob Element außerhalb ist
            if (rect.right > window.innerWidth || rect.left < 0) {
                el.style.maxWidth = '100%';
                el.style.overflowX = 'hidden';
                el.style.boxSizing = 'border-box';
            }
        });

        // CSS-Fixes für häufige Probleme
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            * {
                box-sizing: border-box !important;
            }
            body {
                overflow-x: hidden !important;
                max-width: 100vw !important;
            }
            .content, .container, .section, .panel, .card {
                max-width: 100% !important;
                padding-left: 15px !important;
                padding-right: 15px !important;
                overflow-x: hidden !important;
            }
            .setting-item, .control-row, .option-row {
                flex-wrap: wrap !important;
                max-width: 100% !important;
            }
            input[type="range"] {
                max-width: calc(100% - 60px) !important;
            }
            select {
                max-width: 100% !important;
            }
        `;
        document.head.appendChild(styleEl);

        console.log('✅ Responsive Design gefixt');
    }

    // ========================================
    // 6. SPRACHEN - WIRKLICH UMSCHALTEN
    // ========================================
    function initLanguageSupport() {
        window.changeLanguage = function (lang) {
            console.log('🌐 Sprache wechseln zu:', lang);
            localStorage.setItem('app-language', lang);

            // Verwende Multi-Language-Support
            if (window.multiLang && window.multiLang.applyLanguage) {
                window.multiLang.applyLanguage(lang);
            } else if (window.MultiLanguageSupport) {
                const mls = new window.MultiLanguageSupport();
                mls.applyLanguage(lang);
            }

            // Seite neu laden für vollständige Übersetzung
            setTimeout(() => {
                window.location.reload();
            }, 500);
        };

        // Lade gespeicherte Sprache
        const savedLang = localStorage.getItem('app-language') || 'de';
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.value = savedLang;
        }
    }

    // ========================================
    // 7. SELECT DROPDOWNS - ALLE FUNKTIONAL
    // ========================================
    function fixAllSelects() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            select.style.cssText = `
                max-width: 100% !important;
                padding: 10px 15px !important;
                background: #222 !important;
                color: #fff !important;
                border: 1px solid #444 !important;
                border-radius: 8px !important;
                cursor: pointer !important;
                font-size: 14px !important;
            `;

            select.addEventListener('change', function () {
                console.log('📋 Select changed:', this.id, '→', this.value);
                localStorage.setItem('select_' + this.id, this.value);

                // Spezielle Handler
                if (this.id === 'languageSelect') {
                    window.changeLanguage(this.value);
                }
            });
        });

        console.log(`✅ ${selects.length} Select Dropdowns gefixt`);
    }

    // ========================================
    // 8. ENTFERNE ÜBERFLÜSSIGE ELEMENTE
    // ========================================
    function removeUnnecessaryElements() {
        const toRemove = [
            // "LED-Geräte in Gruppen organisieren" entfernen
            '[id*="gruppe"]',
            '[class*="gruppe"]',
            '.group-organizer',
            '#ledGroupOrganizer'
        ];

        toRemove.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                // Nur entfernen wenn es wirklich das Gruppen-Feature ist
                if (el.textContent && el.textContent.includes('Gruppen organisieren')) {
                    el.remove();
                    console.log('🗑️ Entfernt:', selector);
                }
            });
        });
    }

    // ========================================
    // HILFSFUNKTIONEN
    // ========================================
    function showNotification(message, type = 'info') {
        if (window.showGlobalNotification) {
            window.showGlobalNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // ========================================
    // INITIALISIERUNG
    // ========================================
    async function init() {
        console.log('🚀 ULTIMATE APP FIX startet...');

        // Warte auf DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runFixes);
        } else {
            await runFixes();
        }
    }

    async function runFixes() {
        try {
            // 1. Toggle Switches fixen
            fixAllToggleSwitches();

            // 2. Slider fixen
            fixAllSliders();

            // 3. Bluetooth initialisieren
            await initBluetooth();

            // 4. Musik-Scanner initialisieren
            await initMusicScanner();

            // 5. Responsive Design fixen
            fixResponsiveDesign();

            // 6. Sprachen initialisieren
            initLanguageSupport();

            // 7. Select Dropdowns fixen
            fixAllSelects();

            // 8. Überflüssige Elemente entfernen
            removeUnnecessaryElements();

            // Observer für dynamisch hinzugefügte Elemente
            observeDOM();

            console.log('✅ ULTIMATE APP FIX abgeschlossen!');
        } catch (error) {
            console.error('❌ ULTIMATE APP FIX Fehler:', error);
        }
    }

    function observeDOM() {
        const observer = new MutationObserver(mutations => {
            let hasNewElements = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    hasNewElements = true;
                }
            });

            if (hasNewElements) {
                // Re-run fixes für neue Elemente
                setTimeout(() => {
                    fixAllToggleSwitches();
                    fixAllSliders();
                    fixAllSelects();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Starte
    init();

    // Globale API
    window.UltimateAppFix = {
        fixSwitches: fixAllToggleSwitches,
        fixSliders: fixAllSliders,
        fixSelects: fixAllSelects,
        fixResponsive: fixResponsiveDesign,
        refresh: runFixes
    };

})();
