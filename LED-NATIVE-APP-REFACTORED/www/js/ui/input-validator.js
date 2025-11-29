/**
 * INPUT VALIDATOR v1.0
 * Umfassende Input-Validierung für alle Formulare
 */
'use strict';

class InputValidator {
    constructor() {
        this.rules = new Map();
        this.init();
    }

    init() {
        this.setupDefaultRules();
        this.attachGlobalValidation();
        // console.log('✅ Input Validator initialisiert');
    }

    setupDefaultRules() {
        // Textfeld-Regeln
        this.rules.set('text', {
            minLength: 1,
            maxLength: 100,
            pattern: null,
            required: false
        });

        // Zahlen-Regeln
        this.rules.set('number', {
            min: 0,
            max: 100,
            step: 1,
            required: false
        });

        // Email-Regeln
        this.rules.set('email', {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            required: false
        });

        // Zeit-Regeln
        this.rules.set('time', {
            format: 'HH:mm',
            required: false
        });

        // URL-Regeln
        this.rules.set('url', {
            pattern: /^https?:\/\/.+/,
            required: false
        });

        // Playlist-Namen
        this.rules.set('playlistName', {
            minLength: 1,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_]+$/,
            required: true,
            message: 'Nur Buchstaben, Zahlen, Leerzeichen und Bindestriche erlaubt'
        });

        // Device-Namen
        this.rules.set('deviceName', {
            minLength: 1,
            maxLength: 30,
            pattern: /^[a-zA-Z0-9äöüÄÖÜß\s\-_]+$/,
            required: false,
            message: 'Nur Buchstaben, Zahlen, Leerzeichen und Bindestriche erlaubt'
        });

        // RGB-Werte
        this.rules.set('rgb', {
            min: 0,
            max: 255,
            step: 1,
            required: true
        });

        // Helligkeit
        this.rules.set('brightness', {
            min: 0,
            max: 100,
            step: 1,
            required: true
        });
    }

    /**
     * Validiert ein Input-Element
     * @param {HTMLElement} input - Input Element
     * @param {string} ruleType - Regel-Typ
     * @returns {Object} { valid: boolean, message: string }
     */
    validate(input, ruleType = null) {
        if (!input) {
            return { valid: false, message: 'Input Element nicht gefunden' };
        }

        const value = input.value;
        const type = ruleType || input.type || 'text';
        const rules = this.rules.get(type) || this.rules.get('text');

        // Required Check
        if (rules.required && (!value || value.trim() === '')) {
            return { valid: false, message: 'Dieses Feld ist erforderlich' };
        }

        // Wenn nicht required und leer, ist OK
        if (!rules.required && (!value || value.trim() === '')) {
            return { valid: true, message: '' };
        }

        // Type-spezifische Validierung
        switch (type) {
            case 'text':
            case 'playlistName':
            case 'deviceName':
                return this.validateText(value, rules);

            case 'number':
            case 'rgb':
            case 'brightness':
                return this.validateNumber(value, rules);

            case 'email':
                return this.validateEmail(value, rules);

            case 'time':
                return this.validateTime(value, rules);

            case 'url':
                return this.validateURL(value, rules);

            default:
                return { valid: true, message: '' };
        }
    }

    validateText(value, rules) {
        // Länge prüfen
        if (rules.minLength && value.length < rules.minLength) {
            return {
                valid: false,
                message: `Mindestens ${rules.minLength} Zeichen erforderlich`
            };
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return {
                valid: false,
                message: `Maximal ${rules.maxLength} Zeichen erlaubt`
            };
        }

        // Pattern prüfen
        if (rules.pattern && !rules.pattern.test(value)) {
            return {
                valid: false,
                message: rules.message || 'Ungültiges Format'
            };
        }

        return { valid: true, message: '' };
    }

    validateNumber(value, rules) {
        const num = parseFloat(value);

        // Ist Zahl?
        if (isNaN(num)) {
            return { valid: false, message: 'Bitte gültige Zahl eingeben' };
        }

        // Min/Max prüfen
        if (rules.min !== undefined && num < rules.min) {
            return {
                valid: false,
                message: `Mindestens ${rules.min} erforderlich`
            };
        }

        if (rules.max !== undefined && num > rules.max) {
            return {
                valid: false,
                message: `Maximal ${rules.max} erlaubt`
            };
        }

        return { valid: true, message: '' };
    }

    validateEmail(value, rules) {
        if (!rules.pattern.test(value)) {
            return { valid: false, message: 'Ungültige E-Mail-Adresse' };
        }

        return { valid: true, message: '' };
    }

    validateTime(value, rules) {
        // Format HH:mm
        const timePattern = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

        if (!timePattern.test(value)) {
            return { valid: false, message: 'Ungültiges Zeitformat (HH:mm)' };
        }

        return { valid: true, message: '' };
    }

    validateURL(value, rules) {
        if (!rules.pattern.test(value)) {
            return { valid: false, message: 'Ungültige URL (muss mit http:// oder https:// beginnen)' };
        }

        return { valid: true, message: '' };
    }

    /**
     * Zeigt Validation-Feedback
     * @param {HTMLElement} input - Input Element
     * @param {Object} result - Validation Result
     */
    showFeedback(input, result) {
        // Entferne altes Feedback
        this.removeFeedback(input);

        if (result.valid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');

            // Erstelle Error-Message
            const error = document.createElement('div');
            error.className = 'validation-error';
            error.textContent = result.message;
            error.style.cssText = `
                color: #ff4757;
                font-size: 12px;
                margin-top: 4px;
                animation: fadeIn 0.2s;
            `;

            input.parentElement.appendChild(error);
        }
    }

    /**
     * Entfernt Validation-Feedback
     * @param {HTMLElement} input - Input Element
     */
    removeFeedback(input) {
        const error = input.parentElement.querySelector('.validation-error');
        if (error) {
            error.remove();
        }

        input.classList.remove('valid', 'invalid');
    }

    /**
     * Validiert ganzes Formular
     * @param {HTMLFormElement} form - Formular
     * @returns {boolean}
     */
    validateForm(form) {
        if (!form) return false;

        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            const ruleType = input.dataset.validationType || input.type;
            const result = this.validate(input, ruleType);

            this.showFeedback(input, result);

            if (!result.valid) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Sanitizes Input (entfernt gefährliche Zeichen)
     * @param {string} input - Input String
     * @returns {string}
     */
    sanitize(input) {
        if (typeof input !== 'string') return input;

        // HTML Tags entfernen
        let sanitized = input.replace(/<[^>]*>/g, '');

        // Script Tags entfernen
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // SQL Injection verhindern
        sanitized = sanitized.replace(/('|"|;|--|\/\*|\*\/)/g, '');

        return sanitized.trim();
    }

    /**
     * Escape HTML
     * @param {string} text - Text
     * @returns {string}
     */
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Fügt globale Validation hinzu
     */
    attachGlobalValidation() {
        // Add CSS Styles
        this.addValidationStyles();

        // Auto-Validation on blur
        document.addEventListener('blur', (e) => {
            const input = e.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                const ruleType = input.dataset.validationType || input.type;
                const result = this.validate(input, ruleType);
                this.showFeedback(input, result);
            }
        }, true);

        // Remove error on focus
        document.addEventListener('focus', (e) => {
            const input = e.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                this.removeFeedback(input);
            }
        }, true);
    }

    addValidationStyles() {
        if (document.getElementById('validation-styles')) return;

        const style = document.createElement('style');
        style.id = 'validation-styles';
        style.textContent = `
            /* Validation Styles */
            input.valid,
            textarea.valid {
                border-color: #28a745 !important;
            }

            input.invalid,
            textarea.invalid {
                border-color: #ff4757 !important;
            }

            .validation-error {
                display: block;
                color: #ff4757;
                font-size: 12px;
                margin-top: 4px;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Input Focus States */
            input:focus.valid,
            textarea:focus.valid {
                box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.25);
            }

            input:focus.invalid,
            textarea:focus.invalid {
                box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.25);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Fügt Custom Rule hinzu
     * @param {string} name - Rule Name
     * @param {Object} rule - Rule Object
     */
    addRule(name, rule) {
        this.rules.set(name, rule);
        // console.log(`✅ Custom Rule hinzugefügt: ${name}`);
    }
}

// Initialize global validator
window.inputValidator = new InputValidator();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InputValidator;
}

// console.log('✅ Input Validator geladen');
