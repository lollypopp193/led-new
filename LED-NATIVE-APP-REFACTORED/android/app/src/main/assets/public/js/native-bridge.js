/**
 * Native Bridge - Provides seamless communication between Web and Native layers
 * @module NativeBridge
 * @version 3.0.0
 */

'use strict';

class NativeBridge {
    constructor() {
        this.isNative = false;
        this.platform = 'web';
        this.capabilities = {
            bluetooth: false,
            filesystem: false,
            camera: false,
            geolocation: false,
            notifications: false,
            haptics: false
        };
        this.initialized = false;
        this.eventListeners = new Map();
    }

    /**
     * Initialize native bridge and detect platform
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            // console.log('NativeBridge already initialized');
            return;
        }

        try {
            // Detect if running in Capacitor native environment
            this.isNative = window.Capacitor !== undefined;

            if (this.isNative) {
                this.platform = window.Capacitor.getPlatform();
                // console.log(`Running on native platform: ${this.platform}`);
                await this.detectCapabilities();
            } else {
                // console.log('Running on web platform');
                await this.detectWebCapabilities();
            }

            this.initialized = true;
            // console.log('NativeBridge initialized successfully');
            this.logCapabilities();
        } catch (error) {
            console.error('Failed to initialize NativeBridge:', error);
            throw error;
        }
    }

    /**
     * Detect native capabilities
     * @returns {Promise<void>}
     */
    async detectCapabilities() {
        try {
            // Check Bluetooth LE
            this.capabilities.bluetooth = window.Capacitor.Plugins.BluetoothLe !== undefined;

            // Check Filesystem
            this.capabilities.filesystem = window.Capacitor.Plugins.Filesystem !== undefined;

            // Check Haptics
            this.capabilities.haptics = window.Capacitor.Plugins.Haptics !== undefined;

            // Check Camera (if plugin is loaded)
            this.capabilities.camera = window.Capacitor.Plugins.Camera !== undefined;

            // Check Geolocation (if plugin is loaded)
            this.capabilities.geolocation = window.Capacitor.Plugins.Geolocation !== undefined;

            // Check Notifications (if plugin is loaded)
            this.capabilities.notifications = window.Capacitor.Plugins.PushNotifications !== undefined;

        } catch (error) {
            console.error('Error detecting capabilities:', error);
        }
    }

    /**
     * Detect web capabilities (fallback for browser)
     * @returns {Promise<void>}
     */
    async detectWebCapabilities() {
        try {
            // Check Web Bluetooth API
            this.capabilities.bluetooth = navigator.bluetooth !== undefined;

            // Check Filesystem API (limited in browsers)
            this.capabilities.filesystem = 'showOpenFilePicker' in window;

            // Check Vibration API
            this.capabilities.haptics = navigator.vibrate !== undefined;

            // Check Camera (MediaDevices)
            this.capabilities.camera = navigator.mediaDevices?.getUserMedia !== undefined;

            // Check Geolocation API
            this.capabilities.geolocation = navigator.geolocation !== undefined;

            // Check Notification API
            this.capabilities.notifications = 'Notification' in window;

        } catch (error) {
            console.error('Error detecting web capabilities:', error);
        }
    }

    /**
     * Log detected capabilities
     */
    logCapabilities() {
        // console.log('Platform Capabilities:', {
            platform: this.platform,
            isNative: this.isNative,
            ...this.capabilities
        });
    }

    /**
     * Check if a specific capability is available
     * @param {string} capability - Capability name
     * @returns {boolean}
     */
    hasCapability(capability) {
        return this.capabilities[capability] === true;
    }

    /**
     * Trigger haptic feedback (vibration)
     * @param {string} type - Haptic type (light, medium, heavy)
     * @returns {Promise<void>}
     */
    async hapticFeedback(type = 'medium') {
        if (!this.capabilities.haptics) {
            return;
        }

        try {
            if (this.isNative && window.Capacitor.Plugins.Haptics) {
                const { Haptics, ImpactStyle } = window.Capacitor.Plugins;

                const styleMap = {
                    light: ImpactStyle.Light,
                    medium: ImpactStyle.Medium,
                    heavy: ImpactStyle.Heavy
                };

                await Haptics.impact({ style: styleMap[type] || ImpactStyle.Medium });
            } else if (navigator.vibrate) {
                // Fallback to web vibration API
                const durationMap = {
                    light: 10,
                    medium: 20,
                    heavy: 50
                };
                navigator.vibrate(durationMap[type] || 20);
            }
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }

    /**
     * Show a native toast message
     * @param {string} message - Message to display
     * @param {string} duration - Duration (short/long)
     * @returns {Promise<void>}
     */
    async showToast(message, duration = 'short') {
        try {
            if (this.isNative && window.Capacitor.Plugins.Toast) {
                await window.Capacitor.Plugins.Toast.show({
                    text: message,
                    duration: duration === 'long' ? 'long' : 'short'
                });
            } else {
                // Fallback: Create custom toast
                this.showWebToast(message, duration === 'long' ? 3000 : 1500);
            }
        } catch (error) {
            console.error('Toast failed:', error);
            // Silent fallback
            // console.log('Toast message:', message);
        }
    }

    /**
     * Show web-based toast (fallback)
     * @param {string} message - Message to display
     * @param {number} duration - Duration in ms
     */
    showWebToast(message, duration) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    /**
     * Request permissions
     * @param {string} permission - Permission type
     * @returns {Promise<boolean>}
     */
    async requestPermission(permission) {
        try {
            if (permission === 'bluetooth' && this.capabilities.bluetooth) {
                // Bluetooth permissions are handled by the BLE plugin
                return true;
            }

            if (permission === 'notifications' && this.capabilities.notifications) {
                if (this.isNative && window.Capacitor.Plugins.PushNotifications) {
                    const result = await window.Capacitor.Plugins.PushNotifications.requestPermissions();
                    return result.receive === 'granted';
                } else if ('Notification' in window) {
                    const result = await Notification.requestPermission();
                    return result === 'granted';
                }
            }

            return true;
        } catch (error) {
            console.error(`Permission request failed for ${permission}:`, error);
            return false;
        }
    }

    /**
     * Get platform info
     * @returns {Object}
     */
    getPlatformInfo() {
        return {
            isNative: this.isNative,
            platform: this.platform,
            capabilities: { ...this.capabilities }
        };
    }

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Create singleton instance
const nativeBridge = new NativeBridge();

// Expose globally for compatibility
window.NativeBridge = nativeBridge;

// CommonJS export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = nativeBridge;
}
