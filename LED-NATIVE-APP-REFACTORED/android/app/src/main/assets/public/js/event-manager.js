/**
 * EVENT-MANAGER.JS v3.0 - ZERO TOLERANCE IMPLEMENTATION
 * App-weites Event-System für LED Native App
 */
'use strict';

class EventManager {
    constructor() {
        this.events = {};
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debugMode = false;
        this.eventStats = {};
        // console.log('✅ Event-Manager initialisiert');
    }

    on(eventName, callback, options) {
        options = options || {};
        try {
            if (!eventName || typeof callback !== 'function') {
                throw new Error('Ungültiger Event-Name oder Callback');
            }

            if (!this.events[eventName]) this.events[eventName] = [];

            const listener = {
                callback: callback,
                once: Boolean(options.once),
                priority: parseInt(options.priority) || 0,
                context: options.context || null,
                id: 'listener_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };

            this.events[eventName].push(listener);
            this.events[eventName].sort(function (a, b) { return b.priority - a.priority; });

            if (this.debugMode) // console.log('➕ Event registriert:', eventName, '(Listeners:', this.events[eventName].length + ')');

            return listener.id;
        } catch (e) {
            console.error('❌ Event registrieren:', e);
            return null;
        }
    }

    once(eventName, callback, options) {
        options = options || {};
        options.once = true;
        return this.on(eventName, callback, options);
    }

    off(eventName, listenerIdOrCallback) {
        try {
            if (!eventName || !this.events[eventName]) return false;

            if (typeof listenerIdOrCallback === 'string') {
                const idx = this.events[eventName].findIndex(function (l) { return l.id === listenerIdOrCallback; });
                if (idx !== -1) {
                    this.events[eventName].splice(idx, 1);
                    if (this.debugMode) // console.log('➖ Listener entfernt:', eventName, listenerIdOrCallback);
                    return true;
                }
            } else if (typeof listenerIdOrCallback === 'function') {
                const idx = this.events[eventName].findIndex(function (l) { return l.callback === listenerIdOrCallback; });
                if (idx !== -1) {
                    this.events[eventName].splice(idx, 1);
                    if (this.debugMode) // console.log('➖ Listener entfernt:', eventName);
                    return true;
                }
            } else {
                this.events[eventName] = [];
                if (this.debugMode) // console.log('➖ Alle Listener entfernt:', eventName);
                return true;
            }

            return false;
        } catch (e) {
            console.error('❌ Listener entfernen:', e);
            return false;
        }
    }

    emit(eventName, data, options) {
        options = options || {};
        try {
            if (!eventName) throw new Error('Kein Event-Name');

            const event = {
                name: eventName,
                data: data,
                timestamp: Date.now(),
                bubbles: Boolean(options.bubbles),
                cancelable: Boolean(options.cancelable),
                defaultPrevented: false,
                propagationStopped: false
            };

            this.addToHistory(event);
            this.updateStats(eventName);

            if (!this.events[eventName] || this.events[eventName].length === 0) {
                if (this.debugMode) // console.log('⚠️ Keine Listener für:', eventName);
                return true;
            }

            const listeners = this.events[eventName].slice();
            var callbacksExecuted = 0;

            for (var i = 0; i < listeners.length; i++) {
                if (event.propagationStopped) break;

                const listener = listeners[i];
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, event);
                    } else {
                        listener.callback(event);
                    }
                    callbacksExecuted++;

                    if (listener.once) {
                        this.off(eventName, listener.id);
                    }
                } catch (e) {
                    console.error('❌ Event-Callback Fehler:', eventName, e);
                }
            }

            if (this.debugMode) {
                // console.log('📡 Event emitted:', eventName, '(' + callbacksExecuted + ' callbacks)');
            }

            return !event.defaultPrevented;
        } catch (e) {
            console.error('❌ Event emit:', e);
            return false;
        }
    }

    emitAsync(eventName, data, options) {
        const self = this;
        return new Promise(function (resolve) {
            setTimeout(function () {
                const result = self.emit(eventName, data, options);
                resolve(result);
            }, 0);
        });
    }

    addToHistory(event) {
        this.eventHistory.push({
            name: event.name,
            timestamp: event.timestamp,
            dataSize: JSON.stringify(event.data || {}).length
        });

        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    updateStats(eventName) {
        if (!this.eventStats[eventName]) {
            this.eventStats[eventName] = { count: 0, lastEmitted: 0 };
        }
        this.eventStats[eventName].count++;
        this.eventStats[eventName].lastEmitted = Date.now();
    }

    getListenerCount(eventName) {
        if (!eventName) {
            var total = 0;
            for (var key in this.events) {
                if (this.events.hasOwnProperty(key)) {
                    total += this.events[key].length;
                }
            }
            return total;
        }
        return this.events[eventName] ? this.events[eventName].length : 0;
    }

    getEventNames() {
        return Object.keys(this.events);
    }

    getEventHistory(eventName) {
        if (!eventName) return this.eventHistory;
        return this.eventHistory.filter(function (e) { return e.name === eventName; });
    }

    getEventStats(eventName) {
        if (!eventName) return this.eventStats;
        return this.eventStats[eventName] || null;
    }

    clearEventHistory() {
        this.eventHistory = [];
        // console.log('🗑️ Event-Historie gelöscht');
    }

    clearAllListeners() {
        this.events = {};
        // console.log('🗑️ Alle Listener entfernt');
    }

    enableDebugMode() {
        this.debugMode = true;
        // console.log('🐛 Debug-Mode aktiviert');
    }

    disableDebugMode() {
        this.debugMode = false;
        // console.log('🐛 Debug-Mode deaktiviert');
    }

    delegate(selector, eventType, callback) {
        const self = this;
        document.addEventListener(eventType, function (e) {
            var target = e.target;
            while (target && target !== document) {
                if (target.matches && target.matches(selector)) {
                    callback.call(target, e);
                    break;
                }
                target = target.parentElement;
            }
        }, true);
    }

    throttle(eventName, callback, delay) {
        delay = delay || 100;
        var lastCall = 0;
        const self = this;

        return this.on(eventName, function (event) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                callback(event);
            }
        });
    }

    debounce(eventName, callback, delay) {
        delay = delay || 100;
        var timeout = null;
        const self = this;

        return this.on(eventName, function (event) {
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                callback(event);
            }, delay);
        });
    }

    waitFor(eventName, timeout) {
        timeout = timeout || 5000;
        const self = this;

        return new Promise(function (resolve, reject) {
            var listenerId = null;
            var timer = null;

            listenerId = self.once(eventName, function (event) {
                clearTimeout(timer);
                resolve(event);
            });

            timer = setTimeout(function () {
                self.off(eventName, listenerId);
                reject(new Error('Timeout: Event "' + eventName + '" nicht empfangen'));
            }, timeout);
        });
    }

    createEventChain(events) {
        const self = this;
        var chainData = {};

        return new Promise(function (resolve, reject) {
            var currentIndex = 0;

            function processNext() {
                if (currentIndex >= events.length) {
                    resolve(chainData);
                    return;
                }

                const eventConfig = events[currentIndex];
                const eventName = eventConfig.name;
                const timeout = eventConfig.timeout || 5000;

                self.waitFor(eventName, timeout)
                    .then(function (event) {
                        chainData[eventName] = event.data;
                        currentIndex++;
                        processNext();
                    })
                    .catch(function (error) {
                        reject(error);
                    });
            }

            processNext();
        });
    }

    getReport() {
        return {
            totalEvents: Object.keys(this.events).length,
            totalListeners: this.getListenerCount(),
            eventNames: this.getEventNames(),
            historySize: this.eventHistory.length,
            stats: this.eventStats,
            debugMode: this.debugMode
        };
    }

    reset() {
        this.events = {};
        this.eventHistory = [];
        this.eventStats = {};
        // console.log('🔄 Event-Manager zurückgesetzt');
    }
}

window.EventManager = EventManager;
window.eventManager = new EventManager();
// console.log('✅ Event-Manager global verfügbar als window.eventManager');

window.eventManager.on('app-ready', function (event) {
    // console.log('🚀 App Ready Event empfangen');
});

window.eventManager.on('ble-connected', function (event) {
    // console.log('📡 BLE Connected Event empfangen');
});

window.eventManager.on('ble-disconnected', function (event) {
    // console.log('📡 BLE Disconnected Event empfangen');
});

if (typeof module !== 'undefined' && module.exports) module.exports = EventManager;
