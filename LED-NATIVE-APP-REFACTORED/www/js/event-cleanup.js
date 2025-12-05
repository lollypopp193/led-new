/**
 * EVENT-CLEANUP.JS - Memory Leak Prevention
 * FIX: Verwaltet alle Event-Listener und entfernt sie beim Page-Wechsel
 */
'use strict';

class EventCleanupManager {
    constructor() {
        this.listeners = [];
        this.timers = [];
        this.intervals = [];
    }

    /**
     * Registriere Event-Listener (wird automatisch beim Cleanup entfernt)
     * @param {Element} element - DOM Element
     * @param {string} event - Event Name
     * @param {Function} handler - Event Handler
     * @param {Object} options - Event Options
     */
    addEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    }

    /**
     * Registriere setTimeout (wird automatisch beim Cleanup entfernt)
     * @param {Function} callback - Callback
     * @param {number} delay - Delay in ms
     * @returns {number} Timer ID
     */
    setTimeout(callback, delay) {
        const timerId = setTimeout(callback, delay);
        this.timers.push(timerId);
        return timerId;
    }

    /**
     * Registriere setInterval (wird automatisch beim Cleanup entfernt)
     * @param {Function} callback - Callback
     * @param {number} interval - Interval in ms
     * @returns {number} Interval ID
     */
    setInterval(callback, interval) {
        const intervalId = setInterval(callback, interval);
        this.intervals.push(intervalId);
        return intervalId;
    }

    /**
     * Manuelles Clear für spezifischen Interval
     * FIX: Ermöglicht gezieltes Cleanup
     * @param {number} intervalId - Interval ID
     */
    clearInterval(intervalId) {
        try {
            clearInterval(intervalId);
            const index = this.intervals.indexOf(intervalId);
            if (index > -1) {
                this.intervals.splice(index, 1);
            }
        } catch (e) {
            console.warn('Failed to clear interval:', e);
        }
    }

    /**
     * Manuelles Clear für spezifischen Timeout
     * @param {number} timerId - Timer ID
     */
    clearTimeout(timerId) {
        try {
            clearTimeout(timerId);
            const index = this.timers.indexOf(timerId);
            if (index > -1) {
                this.timers.splice(index, 1);
            }
        } catch (e) {
            console.warn('Failed to clear timeout:', e);
        }
    }

    /**
     * Entferne alle registrierten Event-Listener
     * FIX: Verhindert Memory Leaks
     */
    cleanup() {
        // Remove all event listeners
        this.listeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                console.warn('Failed to remove event listener:', e);
            }
        });

        // Clear all timeouts
        this.timers.forEach(timerId => {
            try {
                clearTimeout(timerId);
            } catch (e) {
                console.warn('Failed to clear timeout:', e);
            }
        });

        // Clear all intervals
        this.intervals.forEach(intervalId => {
            try {
                clearInterval(intervalId);
            } catch (e) {
                console.warn('Failed to clear interval:', e);
            }
        });

        // Reset arrays
        this.listeners = [];
        this.timers = [];
        this.intervals = [];

        console.log('✅ Event-Cleanup durchgeführt');
    }
}

// Global instance
window.eventCleanup = new EventCleanupManager();

// Auto-Cleanup bei Page-Wechsel
if (typeof window !== 'undefined') {
    // Cleanup before page unload
    window.addEventListener('beforeunload', () => {
        window.eventCleanup.cleanup();
    });

    // Cleanup bei visibilitychange (App in Hintergrund)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 App in Hintergrund - Cleanup');
            // Optionales Cleanup bei Hintergrund
        }
    });
}

console.log('✅ Event-Cleanup Manager initialisiert');
