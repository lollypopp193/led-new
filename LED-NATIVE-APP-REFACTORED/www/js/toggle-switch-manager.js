/**
 * TOGGLE-SWITCH-MANAGER.JS
 * Verwaltet alle Ein/Aus-Schalter in der App
 * Gelb = Eingeschaltet, Schwarz = Ausgeschaltet
 * Automatisches Styling für alle Toggle-Switches
 */
'use strict';

class ToggleSwitchManager {
    constructor() {
        this.switches = new Map();
        this.init();
    }

    /**
     * Initialisiert den Toggle-Switch-Manager
     */
    init() {
        console.log('🔘 Toggle-Switch-Manager initialisiert');
        this.setupStyles();
        this.setupClickHandlers();
        this.observeDOM();
        this.convertAllSwitches();
    }

    /**
     * Fügt globale Styles für Toggle-Switches hinzu
     */
    setupStyles() {
        const style = document.createElement('style');
        style.id = 'toggle-switch-styles';
        style.textContent = `
            /* Toggle Switch Container */
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
                margin: 0;
                vertical-align: middle;
            }

            /* Verstecke Original-Checkbox */
            .toggle-switch input[type="checkbox"] {
                opacity: 0;
                width: 0;
                height: 0;
                position: absolute;
            }

            /* Slider */
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #000000; /* Schwarz = Aus */
                transition: all 0.3s ease;
                border-radius: 26px;
                border: 2px solid #444;
            }

            /* Slider Kreis */
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: #ffffff;
                transition: all 0.3s ease;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            /* Eingeschaltet = Gelb */
            .toggle-switch input:checked + .toggle-slider {
                background-color: #ffcc00; /* Gelb = An */
                border-color: #ffcc00;
            }

            .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(24px);
            }

            /* Hover-Effekt */
            .toggle-slider:hover {
                filter: brightness(1.1);
            }

            /* Disabled State */
            .toggle-switch input:disabled + .toggle-slider {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Focus State für Accessibility */
            .toggle-switch input:focus + .toggle-slider {
                box-shadow: 0 0 0 3px rgba(255, 204, 0, 0.3);
            }
        `;

        // Entferne alten Style falls vorhanden
        const oldStyle = document.getElementById('toggle-switch-styles');
        if (oldStyle) {
            oldStyle.remove();
        }

        document.head.appendChild(style);
    }

    /**
     * Konvertiert eine normale Checkbox in einen Toggle-Switch
     * @param {HTMLInputElement} checkbox - Die Checkbox zum Konvertieren
     * @returns {HTMLElement} Toggle-Switch Container
     */
    convertToToggle(checkbox) {
        if (!checkbox || checkbox.type !== 'checkbox') return null;
        if (checkbox.closest('.toggle-switch')) return null; // Bereits konvertiert

        // Erstelle Toggle-Container
        const container = document.createElement('label');
        container.className = 'toggle-switch';

        // Erstelle Slider
        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        // Wrapper um Checkbox herum
        const parent = checkbox.parentNode;
        parent.insertBefore(container, checkbox);
        container.appendChild(checkbox);
        container.appendChild(slider);

        // Event-Listener für State-Changes
        checkbox.addEventListener('change', (e) => {
            this.onToggleChange(checkbox, e.target.checked);
        });

        // Speichere Switch-Referenz
        const switchId = checkbox.id || `toggle-${Date.now()}-${Math.random()}`;
        if (!checkbox.id) checkbox.id = switchId;
        this.switches.set(switchId, { checkbox, container, slider });

        console.log(`✅ Toggle-Switch erstellt: ${switchId}`, checkbox.checked ? 'EIN (Gelb)' : 'AUS (Schwarz)');

        return container;
    }

    /**
     * Toggle-State-Change Handler
     * @param {HTMLInputElement} checkbox - Die Checkbox
     * @param {boolean} checked - Neuer State
     */
    onToggleChange(checkbox, checked) {
        console.log(`🔘 Toggle ${checkbox.id} geändert:`, checked ? '✅ EIN (Gelb)' : '❌ AUS (Schwarz)');

        // Event für andere Module
        const event = new CustomEvent('toggleChange', {
            detail: {
                id: checkbox.id,
                checked: checked,
                checkbox: checkbox
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Konvertiert alle Checkboxen auf der Seite zu Toggle-Switches
     */
    convertAllSwitches() {
        // Finde alle Checkboxen die noch nicht konvertiert sind
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.toggle-switch input)');

        let converted = 0;
        checkboxes.forEach(checkbox => {
            // Skip Checkboxen in Listen (Favoriten, etc.)
            if (checkbox.closest('.list-item, .song-item, .checkbox-group')) {
                return; // Diese bleiben normale Checkboxen
            }

            if (this.convertToToggle(checkbox)) {
                converted++;
            }
        });

        if (converted > 0) {
            console.log(`✅ ${converted} Checkboxen zu Toggle-Switches konvertiert`);
        }
    }

    /**
     * Macht alle Toggle-Switches klickbar (auch div-basierte)
     */
    setupClickHandlers() {
        document.addEventListener('click', (e) => {
            const toggleContainer = e.target.closest('.toggle-switch');
            if (!toggleContainer) return;

            // Wenn auf den Slider geklickt wurde
            const slider = e.target.closest('.slider, .toggle-slider');
            if (slider || e.target === toggleContainer) {
                const checkbox = toggleContainer.querySelector('input[type="checkbox"]');
                if (checkbox && e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`🔘 Toggle ${checkbox.id || 'unknown'} geklickt:`, checkbox.checked ? 'AN' : 'AUS');
                }
            }
        });
        console.log('✅ Toggle-Click-Handler installiert');
    }

    /**
     * Überwacht DOM für neue Checkboxen
     */
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Konvertiere neue Checkboxen
                        const newCheckboxes = node.querySelectorAll?.('input[type="checkbox"]:not(.toggle-switch input)') || [];
                        newCheckboxes.forEach(checkbox => {
                            // Skip Listen-Checkboxen
                            if (!checkbox.closest('.list-item, .song-item, .checkbox-group')) {
                                this.convertToToggle(checkbox);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Setzt den State eines Toggle-Switches
     * @param {string} switchId - ID des Switches
     * @param {boolean} checked - Neuer State
     */
    setState(switchId, checked) {
        const switchData = this.switches.get(switchId);
        if (switchData) {
            switchData.checkbox.checked = checked;
            this.onToggleChange(switchData.checkbox, checked);
        }
    }

    /**
     * Holt den State eines Toggle-Switches
     * @param {string} switchId - ID des Switches
     * @returns {boolean} Aktueller State
     */
    getState(switchId) {
        const switchData = this.switches.get(switchId);
        return switchData ? switchData.checkbox.checked : null;
    }
}

// Global initialisieren
let toggleManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        toggleManager = new ToggleSwitchManager();
        window.toggleManager = toggleManager;
    });
} else {
    toggleManager = new ToggleSwitchManager();
    window.toggleManager = toggleManager;
}

window.ToggleSwitchManager = ToggleSwitchManager;
