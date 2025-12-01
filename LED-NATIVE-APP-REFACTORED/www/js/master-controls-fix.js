/**
 * MASTER CONTROLS FIX v1.0
 * Macht ALLE Toggle-Switches und Slider in der App funktional
 * - Initialisiert alle Switches
 * - Verbindet alle Slider mit Live-Werten
 * - Speichert alle Einstellungen
 * - Lädt gespeicherte Zustände
 */
'use strict';

(function () {
    console.log('🔧 Master Controls Fix wird geladen...');

    // Warte auf DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMasterControls);
    } else {
        initMasterControls();
    }

    function initMasterControls() {
        console.log('🔧 Master Controls Fix initialisiert');

        // 1. Alle Toggle Switches fixen
        fixAllToggleSwitches();

        // 2. Alle Slider fixen
        fixAllSliders();

        // 3. Alle Select Dropdowns fixen
        fixAllSelects();

        // 4. Gespeicherte Zustände laden
        loadSavedStates();

        // 5. Observer für dynamisch hinzugefügte Elemente
        observeNewElements();

        console.log('✅ Master Controls Fix abgeschlossen');
    }

    /**
     * Fixet alle Toggle Switches
     */
    function fixAllToggleSwitches() {
        const switches = document.querySelectorAll('.toggle-switch, .switch, [class*="toggle-switch"], [class*="switch"]');
        let count = 0;

        switches.forEach(switchEl => {
            // Überspringe Slider-Elemente
            if (switchEl.classList.contains('slider') || switchEl.tagName === 'INPUT') {
                return;
            }

            // Finde oder erstelle Checkbox
            let checkbox = switchEl.querySelector('input[type="checkbox"]');

            if (!checkbox) {
                // Erstelle versteckte Checkbox
                checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.style.cssText = 'position:absolute;opacity:0;width:100%;height:100%;top:0;left:0;margin:0;padding:0;cursor:pointer;z-index:10;';
                switchEl.appendChild(checkbox);
            }

            // Event Listener für Klick auf Switch
            switchEl.addEventListener('click', function (e) {
                // Verhindere Doppel-Events
                if (e.target === checkbox) return;

                // Toggle Checkbox
                checkbox.checked = !checkbox.checked;

                // Update Visuell
                updateSwitchVisual(this, checkbox.checked);

                // Speichere Status
                saveControlState(this, checkbox.checked);

                // Trigger change Event
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));

                console.log('🔘 Switch toggled:', this.id || 'unknown', '→', checkbox.checked ? 'AN' : 'AUS');
            });

            // Event Listener für Checkbox Change
            checkbox.addEventListener('change', function () {
                updateSwitchVisual(switchEl, this.checked);
                saveControlState(switchEl, this.checked);
            });

            count++;
        });

        console.log(`🔘 ${count} Toggle Switches initialisiert`);
    }

    /**
     * Aktualisiert die visuelle Darstellung eines Switches
     */
    function updateSwitchVisual(switchEl, isChecked) {
        if (isChecked) {
            switchEl.classList.add('active');
        } else {
            switchEl.classList.remove('active');
        }
    }

    /**
     * Fixet alle Slider mit Live-Werten
     */
    function fixAllSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        let count = 0;

        sliders.forEach(slider => {
            // Finde Value-Display Element
            const valueDisplay = findValueDisplay(slider);

            // Initial Value setzen
            updateSliderValue(slider, valueDisplay);

            // Event Listener für Input (Live Update)
            slider.addEventListener('input', function () {
                updateSliderValue(this, valueDisplay);
                updateSliderTrack(this);
                saveControlState(this, this.value);
            });

            // Event Listener für Change
            slider.addEventListener('change', function () {
                updateSliderValue(this, valueDisplay);
                saveControlState(this, this.value);
                console.log('📊 Slider changed:', this.id || 'unknown', '→', this.value);
            });

            // Initial Track Update
            updateSliderTrack(slider);

            count++;
        });

        console.log(`📊 ${count} Slider initialisiert`);
    }

    /**
     * Findet das Value-Display Element für einen Slider
     */
    function findValueDisplay(slider) {
        // Suche nach benachbarten Elementen
        const parent = slider.parentElement;

        // Suche nach .slider-value, span, oder Element mit ID
        let valueEl = parent.querySelector('.slider-value');
        if (!valueEl) valueEl = parent.querySelector('span:last-child');
        if (!valueEl && slider.id) {
            valueEl = document.getElementById(slider.id + 'Value') ||
                document.getElementById(slider.id + '-value') ||
                document.getElementById(slider.id.replace('Slider', 'Value'));
        }

        return valueEl;
    }

    /**
     * Aktualisiert den angezeigten Slider-Wert
     */
    function updateSliderValue(slider, valueDisplay) {
        if (!valueDisplay) return;

        const value = slider.value;
        const unit = getSliderUnit(slider);

        valueDisplay.textContent = value + unit;

        // Position des Werts am Slider anpassen (wenn gewünscht)
        const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
        valueDisplay.style.setProperty('--slider-percent', percent + '%');
    }

    /**
     * Ermittelt die Einheit für einen Slider
     */
    function getSliderUnit(slider) {
        const id = (slider.id || '').toLowerCase();
        const name = (slider.name || '').toLowerCase();
        const combined = id + name;

        if (combined.includes('brightness') || combined.includes('helligkeit') ||
            combined.includes('opacity') || combined.includes('volume') ||
            combined.includes('sensitivity') || combined.includes('empfindlichkeit')) {
            return '%';
        }
        if (combined.includes('time') || combined.includes('duration') ||
            combined.includes('dauer') || combined.includes('timer') ||
            combined.includes('fade') || combined.includes('crossfade')) {
            return 's';
        }
        if (combined.includes('bass') || combined.includes('treble') ||
            combined.includes('db') || combined.includes('gain')) {
            return 'dB';
        }
        if (combined.includes('bpm') || combined.includes('tempo')) {
            return ' BPM';
        }
        if (combined.includes('hz') || combined.includes('freq')) {
            return 'Hz';
        }

        return '';
    }

    /**
     * Aktualisiert den Slider Track (gefüllter Teil)
     */
    function updateSliderTrack(slider) {
        const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.setProperty('--value-percent', percent + '%');

        // Fallback für Browser ohne CSS Custom Properties
        slider.style.background = `linear-gradient(to right, #4ecdc4 0%, #4ecdc4 ${percent}%, #333 ${percent}%, #333 100%)`;
    }

    /**
     * Fixet alle Select Dropdowns
     */
    function fixAllSelects() {
        const selects = document.querySelectorAll('select');
        let count = 0;

        selects.forEach(select => {
            select.addEventListener('change', function () {
                saveControlState(this, this.value);
                console.log('📋 Select changed:', this.id || 'unknown', '→', this.value);

                // Spezielle Behandlung für Sprache
                if (this.id === 'languageSelect' || this.id === 'language') {
                    applyLanguage(this.value);
                }
            });

            count++;
        });

        console.log(`📋 ${count} Select Dropdowns initialisiert`);
    }

    /**
     * Speichert den Zustand eines Controls
     */
    function saveControlState(element, value) {
        const key = getControlKey(element);
        if (!key) return;

        try {
            localStorage.setItem('ctrl_' + key, JSON.stringify(value));
        } catch (e) {
            console.warn('Speichern fehlgeschlagen:', e);
        }
    }

    /**
     * Lädt gespeicherte Zustände
     */
    function loadSavedStates() {
        // Toggle Switches
        document.querySelectorAll('.toggle-switch, .switch').forEach(switchEl => {
            const key = getControlKey(switchEl);
            if (!key) return;

            try {
                const saved = localStorage.getItem('ctrl_' + key);
                if (saved !== null) {
                    const isChecked = JSON.parse(saved);
                    const checkbox = switchEl.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = isChecked;
                    }
                    updateSwitchVisual(switchEl, isChecked);
                }
            } catch (e) { }
        });

        // Sliders
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const key = getControlKey(slider);
            if (!key) return;

            try {
                const saved = localStorage.getItem('ctrl_' + key);
                if (saved !== null) {
                    slider.value = JSON.parse(saved);
                    updateSliderTrack(slider);
                    const valueDisplay = findValueDisplay(slider);
                    updateSliderValue(slider, valueDisplay);
                }
            } catch (e) { }
        });

        // Selects
        document.querySelectorAll('select').forEach(select => {
            const key = getControlKey(select);
            if (!key) return;

            try {
                const saved = localStorage.getItem('ctrl_' + key);
                if (saved !== null) {
                    select.value = JSON.parse(saved);
                }
            } catch (e) { }
        });

        console.log('💾 Gespeicherte Zustände geladen');
    }

    /**
     * Generiert einen eindeutigen Key für ein Control
     */
    function getControlKey(element) {
        if (element.id) return element.id;
        if (element.name) return element.name;

        // Versuche Parent-ID + Index
        const parent = element.closest('[id]');
        if (parent) {
            const siblings = parent.querySelectorAll(element.tagName);
            const index = Array.from(siblings).indexOf(element);
            return parent.id + '_' + element.tagName.toLowerCase() + '_' + index;
        }

        return null;
    }

    /**
     * Beobachtet dynamisch hinzugefügte Elemente
     */
    function observeNewElements() {
        const observer = new MutationObserver(mutations => {
            let hasNewControls = false;

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element Node
                        if (node.matches && (
                            node.matches('.toggle-switch, .switch, input[type="range"], select') ||
                            node.querySelector('.toggle-switch, .switch, input[type="range"], select')
                        )) {
                            hasNewControls = true;
                        }
                    }
                });
            });

            if (hasNewControls) {
                // Re-initialisiere neue Controls
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

    /**
     * Wendet Spracheinstellungen an
     */
    function applyLanguage(lang) {
        console.log('🌐 Sprache wird gewechselt zu:', lang);

        // Speichere Sprache
        localStorage.setItem('app_language', lang);

        // Wenn i18n System vorhanden
        if (window.i18n && window.i18n.setLanguage) {
            window.i18n.setLanguage(lang);
        }

        // Oder Multi-Language-Support
        if (window.MultiLanguageSupport && window.MultiLanguageSupport.setLanguage) {
            window.MultiLanguageSupport.setLanguage(lang);
        }

        // Benachrichtigung
        if (window.showNotification) {
            const messages = {
                'de': 'Sprache auf Deutsch gesetzt',
                'en': 'Language set to English',
                'es': 'Idioma configurado en Español',
                'fr': 'Langue définie sur Français'
            };
            window.showNotification(messages[lang] || 'Language changed', 'success');
        }
    }

    // Globale API
    window.MasterControlsFix = {
        refresh: function () {
            fixAllToggleSwitches();
            fixAllSliders();
            fixAllSelects();
        },
        saveAll: function () {
            document.querySelectorAll('.toggle-switch, .switch, input[type="range"], select').forEach(el => {
                const value = el.type === 'checkbox' ? el.checked :
                    el.tagName === 'SELECT' ? el.value :
                        el.value;
                saveControlState(el, value);
            });
        },
        loadAll: loadSavedStates
    };

})();
