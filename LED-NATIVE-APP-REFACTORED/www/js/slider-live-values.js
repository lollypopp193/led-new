/**
 * SLIDER-LIVE-VALUES.JS
 * Zeigt Live-Werte neben allen Slidern (Crossfade, Fade-In/Out, Sleep-Timer, etc.)
 * Werte bewegen sich mit dem Slider
 */
'use strict';

class SliderLiveValues {
    constructor() {
        this.sliders = new Map();
        this.init();
    }

    /**
     * Initialisiert den Slider-Live-Value-Manager
     */
    init() {
        console.log('📊 Slider-Live-Values initialisiert');
        this.setupStyles();
        this.convertAllSliders();
        this.observeDOM();
    }

    /**
     * Fügt Styles für Live-Values hinzu
     */
    setupStyles() {
        const style = document.createElement('style');
        style.id = 'slider-live-values-styles';
        style.textContent = `
            .slider-container {
                position: relative;
                display: flex;
                align-items: center;
                gap: 15px;
                margin: 10px 0;
            }

            .slider-with-value {
                flex: 1;
                position: relative;
            }

            .slider-live-value {
                min-width: 60px;
                padding: 5px 10px;
                background: rgba(255,204,0,0.2);
                border: 1px solid #ffcc00;
                border-radius: 5px;
                color: #ffcc00;
                font-weight: 600;
                text-align: center;
                font-size: 0.9rem;
                white-space: nowrap;
            }

            /* Slider Styles */
            input[type="range"] {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: linear-gradient(to right, #444 0%, #444 50%, #222 50%, #222 100%);
                outline: none;
                transition: background 0.3s;
            }

            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ffcc00;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                transition: all 0.2s;
            }

            input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.1);
                box-shadow: 0 0 10px rgba(255,204,0,0.5);
            }

            input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ffcc00;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }

            /* Aktive Slider-Färbung */
            input[type="range"]:active::-webkit-slider-thumb {
                background: #ffd700;
            }
        `;

        const oldStyle = document.getElementById('slider-live-values-styles');
        if (oldStyle) oldStyle.remove();

        document.head.appendChild(style);
    }

    /**
     * Konvertiert einen Slider zu Live-Value-Slider
     * @param {HTMLInputElement} slider - Range-Input
     */
    convertSlider(slider) {
        if (!slider || slider.type !== 'range') return null;
        if (slider.closest('.slider-container')) return null; // Bereits konvertiert

        // Erstelle Container
        const container = document.createElement('div');
        container.className = 'slider-container';

        // Wrapper für Slider
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'slider-with-value';

        // Live-Value Display
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'slider-live-value';

        // Initiale Unit bestimmen
        const unit = this.getSliderUnit(slider);
        const currentValue = this.formatValue(slider.value, unit);
        valueDisplay.textContent = currentValue;

        // Wrapper um Slider
        const parent = slider.parentNode;
        parent.insertBefore(container, slider);
        sliderWrapper.appendChild(slider);
        container.appendChild(sliderWrapper);
        container.appendChild(valueDisplay);

        // Event-Listener
        slider.addEventListener('input', (e) => {
            const value = this.formatValue(e.target.value, unit);
            valueDisplay.textContent = value;
            this.updateSliderBackground(slider);
            this.onSliderChange(slider, e.target.value);
        });

        // Initiale Hintergrund-Färbung
        this.updateSliderBackground(slider);

        // Speichere Referenz
        const sliderId = slider.id || `slider-${Date.now()}-${Math.random()}`;
        if (!slider.id) slider.id = sliderId;
        this.sliders.set(sliderId, { slider, valueDisplay, unit });

        console.log(`✅ Live-Value-Slider erstellt: ${sliderId} (${unit})`);
        return container;
    }

    /**
     * Bestimmt die Einheit eines Sliders anhand des Kontexts
     * @param {HTMLInputElement} slider - Range-Input
     * @returns {string} Einheit (s, %, dB, BPM, Hz, etc.)
     */
    getSliderUnit(slider) {
        const id = slider.id?.toLowerCase() || '';
        const label = slider.getAttribute('aria-label')?.toLowerCase() || '';
        const parent = slider.closest('[data-unit]');

        // Explizite Unit aus data-attribute
        if (parent?.dataset.unit) {
            return parent.dataset.unit;
        }

        // Auto-Erkennung
        if (id.includes('crossfade') || id.includes('fade') || id.includes('timer') || id.includes('time')) {
            return 's'; // Sekunden
        }
        if (id.includes('brightness') || id.includes('volume') || id.includes('progress')) {
            return '%'; // Prozent
        }
        if (id.includes('bass') || id.includes('treble') || id.includes('gain')) {
            return 'dB'; // Dezibel
        }
        if (id.includes('bpm') || id.includes('tempo')) {
            return 'BPM';
        }
        if (id.includes('frequency') || id.includes('freq')) {
            return 'Hz';
        }

        return ''; // Keine Einheit
    }

    /**
     * Formatiert Wert mit Einheit
     * @param {number} value - Wert
     * @param {string} unit - Einheit
     * @returns {string} Formatierter Wert
     */
    formatValue(value, unit) {
        const num = parseFloat(value);

        if (unit === 's') {
            // Sekunden
            return `${num.toFixed(1)}s`;
        } else if (unit === '%') {
            // Prozent
            return `${Math.round(num)}%`;
        } else if (unit === 'dB') {
            // Dezibel
            return `${num >= 0 ? '+' : ''}${num.toFixed(1)}dB`;
        } else if (unit === 'BPM') {
            // Beats per Minute
            return `${Math.round(num)} BPM`;
        } else if (unit === 'Hz') {
            // Hertz
            return `${Math.round(num)} Hz`;
        } else if (unit) {
            // Custom Unit
            return `${num} ${unit}`;
        } else {
            // Keine Einheit
            return `${num}`;
        }
    }

    /**
     * Aktualisiert Slider-Hintergrund (Fortschritts-Anzeige)
     * @param {HTMLInputElement} slider - Range-Input
     */
    updateSliderBackground(slider) {
        const value = slider.value;
        const min = slider.min || 0;
        const max = slider.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;

        slider.style.background = `linear-gradient(to right, 
            #ffcc00 0%, 
            #ffcc00 ${percentage}%, 
            #444 ${percentage}%, 
            #444 100%)`;
    }

    /**
     * Slider-Change Handler
     * @param {HTMLInputElement} slider - Slider
     * @param {number} value - Neuer Wert
     */
    onSliderChange(slider, value) {
        console.log(`📊 Slider ${slider.id}:`, value);

        // Event für andere Module
        const event = new CustomEvent('sliderChange', {
            detail: {
                id: slider.id,
                value: parseFloat(value),
                slider: slider
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Konvertiert alle Slider auf der Seite
     */
    convertAllSliders() {
        const sliders = document.querySelectorAll('input[type="range"]:not(.slider-container input)');

        let converted = 0;
        sliders.forEach(slider => {
            if (this.convertSlider(slider)) {
                converted++;
            }
        });

        if (converted > 0) {
            console.log(`✅ ${converted} Slider mit Live-Values konvertiert`);
        }
    }

    /**
     * Überwacht DOM für neue Slider
     */
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newSliders = node.querySelectorAll?.('input[type="range"]:not(.slider-container input)') || [];
                        newSliders.forEach(slider => this.convertSlider(slider));
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
     * Setzt Slider-Wert
     * @param {string} sliderId - Slider-ID
     * @param {number} value - Neuer Wert
     */
    setValue(sliderId, value) {
        const sliderData = this.sliders.get(sliderId);
        if (sliderData) {
            sliderData.slider.value = value;
            sliderData.valueDisplay.textContent = this.formatValue(value, sliderData.unit);
            this.updateSliderBackground(sliderData.slider);
        }
    }
}

// Global initialisieren
let sliderLiveValues;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sliderLiveValues = new SliderLiveValues();
        window.sliderLiveValues = sliderLiveValues;
    });
} else {
    sliderLiveValues = new SliderLiveValues();
    window.sliderLiveValues = sliderLiveValues;
}

window.SliderLiveValues = SliderLiveValues;
