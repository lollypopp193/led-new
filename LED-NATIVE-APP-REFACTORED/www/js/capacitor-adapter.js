/**
 * Capacitor Adapter - Simplified Capacitor plugin integration
 * @module CapacitorAdapter
 * @version 3.0.0
 */

'use strict';

class CapacitorAdapter {
    constructor() {
        this.isCapacitor = false;
        this.platform = 'web';
        this.plugins = {};
        this.initialized = false;
    }

    /**
     * Initialize Capacitor adapter
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            console.log('CapacitorAdapter already initialized');
            return;
        }

        try {
            // Check if Capacitor is available
            this.isCapacitor = typeof window.Capacitor !== 'undefined';

            if (this.isCapacitor) {
                this.platform = window.Capacitor.getPlatform();
                this.loadPlugins();
                await this.setupAppLifecycle();
                console.log(`CapacitorAdapter initialized on ${this.platform}`);
            } else {
                console.log('Running in web mode - Capacitor not available');
            }

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize CapacitorAdapter:', error);
            throw error;
        }
    }

    /**
     * Load Capacitor plugins
     */
    loadPlugins() {
        if (!this.isCapacitor) return;

        try {
            const { Plugins } = window.Capacitor;

            // Core plugins
            this.plugins.App = Plugins.App;
            this.plugins.Haptics = Plugins.Haptics;
            this.plugins.StatusBar = Plugins.StatusBar;
            this.plugins.SplashScreen = Plugins.SplashScreen;
            this.plugins.Keyboard = Plugins.Keyboard;
            this.plugins.Filesystem = Plugins.Filesystem;

            // Community plugins
            this.plugins.BluetoothLe = Plugins.BluetoothLe;

            console.log('Capacitor plugins loaded:', Object.keys(this.plugins));
        } catch (error) {
            console.error('Error loading plugins:', error);
        }
    }

    /**
     * Setup app lifecycle listeners
     * @returns {Promise<void>}
     */
    async setupAppLifecycle() {
        if (!this.plugins.App) return;

        try {
            // Listen to app state changes
            this.plugins.App.addListener('appStateChange', (state) => {
                console.log('App state changed:', state.isActive ? 'active' : 'background');
                this.handleAppStateChange(state.isActive);
            });

            // Listen to app URL open events
            this.plugins.App.addListener('appUrlOpen', (data) => {
                console.log('App URL opened:', data.url);
                this.handleAppUrlOpen(data.url);
            });

            // Listen to back button
            this.plugins.App.addListener('backButton', (event) => {
                console.log('Back button pressed');
                this.handleBackButton(event);
            });

            console.log('App lifecycle listeners setup complete');
        } catch (error) {
            console.error('Error setting up app lifecycle:', error);
        }
    }

    /**
     * Handle app state change
     * @param {boolean} isActive - Whether app is active
     */
    handleAppStateChange(isActive) {
        if (isActive) {
            // App came to foreground
            console.log('App resumed');
            this.emit('app:resume');
        } else {
            // App went to background
            console.log('App paused');
            this.emit('app:pause');
        }
    }

    /**
     * Handle app URL open
     * @param {string} url - Opened URL
     */
    handleAppUrlOpen(url) {
        this.emit('app:urlopen', url);
    }

    /**
     * Handle back button press
     * @param {Object} event - Back button event
     */
    handleBackButton(event) {
        // Check if we can go back in iframe
        const iframe = document.getElementById('app-iframe');
        if (iframe && iframe.contentWindow) {
            try {
                const canGoBack = iframe.contentWindow.history.length > 1;
                if (canGoBack) {
                    iframe.contentWindow.history.back();
                    return;
                }
            } catch (error) {
                console.warn('Cannot access iframe history:', error);
            }
        }

        // Default behavior: exit app
        if (event.canGoBack === false) {
            this.plugins.App.exitApp();
        }
    }

    /**
     * Hide splash screen
     * @returns {Promise<void>}
     */
    async hideSplashScreen() {
        if (!this.plugins.SplashScreen) return;

        try {
            await this.plugins.SplashScreen.hide();
            console.log('Splash screen hidden');
        } catch (error) {
            console.error('Error hiding splash screen:', error);
        }
    }

    /**
     * Set status bar style
     * @param {string} style - Status bar style (light/dark)
     * @returns {Promise<void>}
     */
    async setStatusBarStyle(style = 'dark') {
        if (!this.plugins.StatusBar) return;

        try {
            if (style === 'light') {
                await this.plugins.StatusBar.setStyle({ style: 'LIGHT' });
            } else {
                await this.plugins.StatusBar.setStyle({ style: 'DARK' });
            }
            console.log(`Status bar style set to: ${style}`);
        } catch (error) {
            console.error('Error setting status bar style:', error);
        }
    }

    /**
     * Set status bar background color
     * @param {string} color - Hex color code
     * @returns {Promise<void>}
     */
    async setStatusBarColor(color) {
        if (!this.plugins.StatusBar) return;

        try {
            await this.plugins.StatusBar.setBackgroundColor({ color });
            console.log(`Status bar color set to: ${color}`);
        } catch (error) {
            console.error('Error setting status bar color:', error);
        }
    }

    /**
     * Trigger haptic feedback
     * @param {string} type - Haptic type (light/medium/heavy)
     * @returns {Promise<void>}
     */
    async hapticImpact(type = 'medium') {
        if (!this.plugins.Haptics) return;

        try {
            const { ImpactStyle } = await import('@capacitor/haptics');
            const styleMap = {
                light: ImpactStyle.Light,
                medium: ImpactStyle.Medium,
                heavy: ImpactStyle.Heavy
            };

            await this.plugins.Haptics.impact({
                style: styleMap[type] || ImpactStyle.Medium
            });
        } catch (error) {
            console.warn('Haptic feedback not available:', error);
        }
    }

    /**
     * Show keyboard
     * @returns {Promise<void>}
     */
    async showKeyboard() {
        if (!this.plugins.Keyboard) return;

        try {
            await this.plugins.Keyboard.show();
        } catch (error) {
            console.error('Error showing keyboard:', error);
        }
    }

    /**
     * Hide keyboard
     * @returns {Promise<void>}
     */
    async hideKeyboard() {
        if (!this.plugins.Keyboard) return;

        try {
            await this.plugins.Keyboard.hide();
        } catch (error) {
            console.error('Error hiding keyboard:', error);
        }
    }

    /**
     * Write file to filesystem
     * @param {string} path - File path
     * @param {string} data - File data
     * @param {string} encoding - File encoding
     * @returns {Promise<boolean>}
     */
    async writeFile(path, data, encoding = 'utf8') {
        if (!this.plugins.Filesystem) return false;

        try {
            const { Directory } = await import('@capacitor/filesystem');
            await this.plugins.Filesystem.writeFile({
                path,
                data,
                directory: Directory.Data,
                encoding
            });
            console.log(`File written: ${path}`);
            return true;
        } catch (error) {
            console.error('Error writing file:', error);
            return false;
        }
    }

    /**
     * Read file from filesystem
     * @param {string} path - File path
     * @param {string} encoding - File encoding
     * @returns {Promise<string|null>}
     */
    async readFile(path, encoding = 'utf8') {
        if (!this.plugins.Filesystem) return null;

        try {
            const { Directory } = await import('@capacitor/filesystem');
            const result = await this.plugins.Filesystem.readFile({
                path,
                directory: Directory.Data,
                encoding
            });
            console.log(`File read: ${path}`);
            return result.data;
        } catch (error) {
            console.error('Error reading file:', error);
            return null;
        }
    }

    /**
     * Delete file from filesystem
     * @param {string} path - File path
     * @returns {Promise<boolean>}
     */
    async deleteFile(path) {
        if (!this.plugins.Filesystem) return false;

        try {
            const { Directory } = await import('@capacitor/filesystem');
            await this.plugins.Filesystem.deleteFile({
                path,
                directory: Directory.Data
            });
            console.log(`File deleted: ${path}`);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    /**
     * Get plugin instance
     * @param {string} name - Plugin name
     * @returns {Object|null}
     */
    getPlugin(name) {
        return this.plugins[name] || null;
    }

    /**
     * Check if running on Capacitor
     * @returns {boolean}
     */
    isNative() {
        return this.isCapacitor;
    }

    /**
     * Get platform name
     * @returns {string}
     */
    getPlatform() {
        return this.platform;
    }

    /**
     * Simple event emitter
     */
    _listeners = new Map();

    addEventListener(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this._listeners.has(event)) {
            const listeners = this._listeners.get(event);
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in listener for ${event}:`, error);
                }
            });
        }
    }
}

// Create singleton instance
const capacitorAdapter = new CapacitorAdapter();

// Export as ES module
export default capacitorAdapter;

// Also expose globally for compatibility
window.CapacitorAdapter = capacitorAdapter;
