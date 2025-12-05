/**
 * JSON-SAFE.JS - Safe JSON Operations
 * FIX: Verhindert Crashes durch circular references und große Objekte
 */
'use strict';

/**
 * Safe JSON.stringify mit Error-Handling
 * @param {*} obj - Objekt zum Serialisieren
 * @param {*} replacer - Optional replacer function
 * @param {*} space - Optional space for formatting
 * @returns {string|null} JSON string oder null bei Fehler
 */
window.safeJSONStringify = function (obj, replacer, space) {
    try {
        // Handle circular references
        const seen = new WeakSet();

        const circularReplacer = (key, value) => {
            // Apply custom replacer first
            if (replacer && typeof replacer === 'function') {
                value = replacer(key, value);
            }

            // Check for circular reference
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }

            return value;
        };

        return JSON.stringify(obj, circularReplacer, space);
    } catch (error) {
        console.error('❌ JSON.stringify failed:', error);

        // Fallback: Try simple stringify
        try {
            return JSON.stringify({
                error: 'Serialization failed',
                message: error.message
            });
        } catch (e) {
            return null;
        }
    }
};

/**
 * Safe JSON.parse mit Error-Handling
 * @param {string} str - JSON string
 * @param {*} reviver - Optional reviver function
 * @returns {*} Parsed object oder null bei Fehler
 */
window.safeJSONParse = function (str, reviver) {
    try {
        return JSON.parse(str, reviver);
    } catch (error) {
        console.error('❌ JSON.parse failed:', error);
        return null;
    }
};

/**
 * Safe localStorage.setItem mit JSON
 * FIX: Verhindert Crashes beim Speichern
 */
window.safeLocalStorageSet = function (key, value) {
    try {
        const jsonString = window.safeJSONStringify(value);
        if (jsonString !== null) {
            localStorage.setItem(key, jsonString);
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ localStorage.setItem failed:', error);
        return false;
    }
};

/**
 * Safe localStorage.getItem mit JSON
 * FIX: Verhindert Crashes beim Laden + null-check für .property Zugriffe
 */
window.safeLocalStorageGet = function (key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(key);
        if (stored === null || stored === undefined) {
            return defaultValue;
        }

        const parsed = window.safeJSONParse(stored);
        return parsed !== null && parsed !== undefined ? parsed : defaultValue;
    } catch (error) {
        console.error('❌ localStorage.getItem failed:', error);
        return defaultValue;
    }
};

/**
 * Safe property access mit Optional Chaining Fallback
 * FIX: localStorage.getItem().property ohne Crash
 * @param {string} key - localStorage key
 * @param {string} property - Property to access
 * @param {*} defaultValue - Default value
 */
window.safeLocalStorageGetProperty = function (key, property, defaultValue = null) {
    try {
        const obj = window.safeLocalStorageGet(key, null);

        // Null-check vor Property-Zugriff
        if (!obj || typeof obj !== 'object') {
            return defaultValue;
        }

        // Optional Chaining simulieren
        return obj[property] !== undefined ? obj[property] : defaultValue;
    } catch (error) {
        console.error('❌ localStorage property access failed:', error);
        return defaultValue;
    }
};

console.log('✅ JSON-Safe Helper geladen');
