/**
 * SLIDER-LIVE-VALUES.JS v3.0 - ZERO TOLERANCE
 * Zeigt Live-Werte bei ALLEN Slidern + Spezial-Formate
 */
'use strict';

class SliderLiveValueManager {
    constructor() {
        this.sliders = new Map();
        this.debounceTimers = new Map();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupSliders());
        } else {
            this.setupSliders();
        }
        // console.log('✅ Slider Live Value Manager v3.0');
    }

    setupSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => this.attachLiveValue(slider));
        this.observeDOM();
        // console.log(`✅ ${sliders.length} Slider mit Live-Werten`);
    }

    attachLiveValue(slider) {
        if (this.sliders.has(slider)) return;

        const config = this.getSliderConfig(slider);
        let valueDisplay = this.findValueDisplay(slider);
        if (!valueDisplay) {
            valueDisplay = this.createValueDisplay(slider);
        }

        this.updateValue(slider, valueDisplay, config);

        slider.addEventListener('input', () => {
            this.updateValue(slider, valueDisplay, config);
        });

        this.sliders.set(slider, { valueDisplay, config });
    }

    getSliderConfig(slider) {
        const id = slider.id || '';
        const max = parseFloat(slider.max) || 100;

        if (id.includes('crossfade') || id.includes('fadeIn') || id.includes('fadeOut')) {
            return { unit: 's', decimals: 1 };
        } else if (id.includes('bass') || id.includes('eq')) {
            return { unit: 'dB', decimals: 0, format: 'db' };
        } else if (id.includes('brightness') || id.includes('volume') || id.includes('sensitivity')) {
            return { unit: '%', decimals: 0 };
        } else if (id.includes('speed')) {
            return { unit: 'x', decimals: 1 };
        } else if (id.includes('time') || id.includes('timer')) {
            if (max > 3600) return { unit: '', decimals: 0, format: 'hms' };
            else if (max > 60) return { unit: '', decimals: 0, format: 'ms' };
            else return { unit: 's', decimals: 0 };
        } else {
            return { unit: '', decimals: 0 };
        }
    }

    findValueDisplay(slider) {
        if (slider.id) {
            const byId = document.getElementById(slider.id + 'Value');
            if (byId) return byId;
        }

        let next = slider.nextElementSibling;
        while (next && next.nodeType === 1) {
            if (next.classList.contains('slider-value') || next.classList.contains('range-value')) {
                return next;
            }
            next = next.nextElementSibling;
        }

        return null;
    }

    createValueDisplay(slider) {
        const span = document.createElement('span');
        span.className = 'slider-value live-value';
        span.id = slider.id ? slider.id + 'Value' : '';
        span.style.cssText = `
            color: #4ecdc4;
            font-weight: 600;
            margin-left: 10px;
            min-width: 60px;
            display: inline-block;
            text-align: right;
        `;
        slider.parentNode.insertBefore(span, slider.nextSibling);
        return span;
    }

    updateValue(slider, display, config) {
        const value = parseFloat(slider.value);
        let formatted = '';

        if (config.format === 'db') {
            formatted = (value >= 0 ? '+' : '') + value.toFixed(config.decimals) + config.unit;
        } else if (config.format === 'ms') {
            const mins = Math.floor(value / 60);
            const secs = value % 60;
            formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
        } else if (config.format === 'hms') {
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            const seconds = value % 60;
            formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            formatted = config.decimals > 0
                ? value.toFixed(config.decimals) + config.unit
                : Math.round(value) + config.unit;
        }

        display.textContent = formatted;
    }

    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'INPUT' && node.type === 'range') {
                            this.attachLiveValue(node);
                        }
                        const sliders = node.querySelectorAll && node.querySelectorAll('input[type="range"]');
                        if (sliders) sliders.forEach(s => this.attachLiveValue(s));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

window.SliderLiveValueManager = SliderLiveValueManager;
window.sliderLiveValueManager = new SliderLiveValueManager();

// console.log('✅ Slider Live Values v3.0 geladen');
