/**
 * MASTER-UI-FIXER.JS
 * Behebt ALLE UI-Probleme: Toggle-Switches, Slider, Events
 * @version 1.0.0
 */
'use strict';

class MasterUIFixer {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialisiert den Master-Fixer
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;

        console.log('🔧 Master-UI-Fixer startet...');

        // 1. Toggle-Switches fixen
        this.fixAllToggleSwitches();

        // 2. Slider Live-Werte fixen
        this.fixAllSliders();

        // 3. DOM-Observer für neue Elemente
        this.observeDOM();

        console.log('✅ Master-UI-Fixer initialisiert');
    }

    /**
     * Behebt ALLE Toggle-Switches
     * Unterstützt: .toggle-switch, .switch, input[type="checkbox"]
     */
    fixAllToggleSwitches() {
        // Fix 1: .toggle-switch mit input + .slider
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            const input = toggle.querySelector('input[type="checkbox"]');
            const slider = toggle.querySelector('.slider');

            if (input && slider) {
                // Entferne alte Event-Listener
                const newToggle = toggle.cloneNode(true);
                toggle.parentNode.replaceChild(newToggle, toggle);

                const newInput = newToggle.querySelector('input[type="checkbox"]');
                const newSlider = newToggle.querySelector('.slider');

                // Klick auf Container oder Slider
                newToggle.addEventListener('click', (e) => {
                    if (e.target !== newInput) {
                        newInput.checked = !newInput.checked;
                        newInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });

                // Change-Event für Logging
                newInput.addEventListener('change', () => {
                    console.log(`🔘 Toggle ${newInput.id || 'unknown'}: ${newInput.checked ? 'AN' : 'AUS'}`);
                    this.saveToggleState(newInput.id, newInput.checked);
                });
            }
        });

        // Fix 2: .switch mit .switch-handle (einstellungen.html)
        document.querySelectorAll('.switch:not(.toggle-switch)').forEach(sw => {
            // Entferne alte Event-Listener
            const newSwitch = sw.cloneNode(true);
            sw.parentNode.replaceChild(newSwitch, sw);

            newSwitch.addEventListener('click', function () {
                this.classList.toggle('active');
                const isActive = this.classList.contains('active');
                console.log(`🔘 Switch ${this.id || 'unknown'}: ${isActive ? 'AN' : 'AUS'}`);

                // Callback aufrufen falls vorhanden
                const callbackName = this.getAttribute('data-callback');
                if (callbackName && window[callbackName]) {
                    window[callbackName](isActive);
                }
            });
        });

        console.log('✅ Toggle-Switches gefixt');
    }

    /**
     * Behebt ALLE Slider - Werte bewegen sich mit
     */
    fixAllSliders() {
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            // Finde den Wert-Anzeige-Element
            const container = slider.closest('.slider-container, .slider-control, div');
            let valueDisplay = null;

            // Suche nach verschiedenen Wert-Elementen
            if (container) {
                valueDisplay = container.querySelector('.slider-value, .value, span[class*="value"]');
            }

            // Fallback: Suche nach ID-basiertem Value
            if (!valueDisplay && slider.id) {
                valueDisplay = document.getElementById(slider.id + 'Value') ||
                    document.getElementById(slider.id.replace('Slider', 'Value')) ||
                    document.getElementById(slider.id.replace('slider', 'Value'));
            }

            // Event für Live-Update
            slider.addEventListener('input', function () {
                const value = this.value;
                const min = parseFloat(this.min) || 0;
                const max = parseFloat(this.max) || 100;

                // Update Value-Display
                if (valueDisplay) {
                    // Bestimme Format basierend auf Kontext
                    if (this.id?.includes('brightness') || this.id?.includes('sensitivity') ||
                        this.id?.includes('volume') || this.id?.includes('intensity')) {
                        valueDisplay.textContent = value + '%';
                    } else if (this.id?.includes('time') || this.id?.includes('duration')) {
                        valueDisplay.textContent = value + 's';
                    } else if (this.id?.includes('fps')) {
                        valueDisplay.textContent = value + ' FPS';
                    } else if (this.id?.includes('tempo')) {
                        valueDisplay.textContent = value + 'x';
                    } else {
                        valueDisplay.textContent = value + '%';
                    }
                }

                // Progress-Hintergrund aktualisieren
                const percentage = ((value - min) / (max - min)) * 100;
                this.style.background = `linear-gradient(to right, #ff6b35 ${percentage}%, #333 ${percentage}%)`;

                console.log(`📊 Slider ${this.id || 'unknown'}: ${value}`);
            });

            // Initial-Update triggern
            slider.dispatchEvent(new Event('input'));
        });

        console.log('✅ Slider gefixt');
    }

    /**
     * Speichert Toggle-State in LocalStorage
     */
    saveToggleState(id, checked) {
        if (!id) return;
        try {
            const states = JSON.parse(localStorage.getItem('toggleStates') || '{}');
            states[id] = checked;
            localStorage.setItem('toggleStates', JSON.stringify(states));
        } catch (e) {
            console.warn('Toggle-State speichern fehlgeschlagen:', e);
        }
    }

    /**
     * Lädt gespeicherte Toggle-States
     */
    loadToggleStates() {
        try {
            const states = JSON.parse(localStorage.getItem('toggleStates') || '{}');
            Object.keys(states).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = states[id];
                    } else if (element.classList.contains('switch')) {
                        element.classList.toggle('active', states[id]);
                    }
                }
            });
        } catch (e) {
            console.warn('Toggle-States laden fehlgeschlagen:', e);
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
                        if (node.querySelector?.('.toggle-switch, .switch, input[type="range"]')) {
                            needsFix = true;
                        }
                    }
                });
            });

            if (needsFix) {
                setTimeout(() => {
                    this.fixAllToggleSwitches();
                    this.fixAllSliders();
                }, 100);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// Global initialisieren
const masterUIFixer = new MasterUIFixer();
window.masterUIFixer = masterUIFixer;

// Bei DOM-Ready starten
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        masterUIFixer.init();
        masterUIFixer.loadToggleStates();
    });
} else {
    masterUIFixer.init();
    masterUIFixer.loadToggleStates();
}

// Auch in iframes initialisieren
window.addEventListener('load', () => {
    // Nach kurzer Verzögerung nochmal fixen (für dynamisch geladene Inhalte)
    setTimeout(() => {
        masterUIFixer.fixAllToggleSwitches();
        masterUIFixer.fixAllSliders();
    }, 1000);
});

console.log('📦 Master-UI-Fixer geladen');
