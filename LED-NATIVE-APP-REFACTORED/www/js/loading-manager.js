/**
 * LOADING MANAGER v1.0
 * Zentrale Verwaltung aller Loading-States
 */
'use strict';

class LoadingManager {
    constructor() {
        this.activeLoaders = new Map();
        this.init();
    }

    init() {
        this.createGlobalLoader();
        console.log('✅ Loading Manager initialisiert');
    }

    createGlobalLoader() {
        // Global Fullscreen Loader
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 99999;
            display: none;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        `;

        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.cssText = `
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 215, 0, 0.2);
            border-top-color: #FFD700;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        const text = document.createElement('div');
        text.id = 'globalLoaderText';
        text.style.cssText = `
            color: #FFD700;
            font-size: 16px;
            margin-top: 20px;
            font-family: 'Orbitron', sans-serif;
        `;
        text.textContent = 'Lädt...';

        loader.appendChild(spinner);
        loader.appendChild(text);
        document.body.appendChild(loader);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Zeigt globalen Loader
     * @param {string} message - Optionale Nachricht
     * @param {string} id - Eindeutige ID für diesen Loader
     */
    show(message = 'Lädt...', id = 'default') {
        const loader = document.getElementById('globalLoader');
        const text = document.getElementById('globalLoaderText');

        if (loader && text) {
            text.textContent = message;
            loader.style.display = 'flex';
            this.activeLoaders.set(id, { message, timestamp: Date.now() });
        }
    }

    /**
     * Versteckt globalen Loader
     * @param {string} id - ID des zu versteckenden Loaders
     */
    hide(id = 'default') {
        this.activeLoaders.delete(id);

        // Nur verstecken wenn keine anderen Loader mehr aktiv
        if (this.activeLoaders.size === 0) {
            const loader = document.getElementById('globalLoader');
            if (loader) {
                loader.style.display = 'none';
            }
        }
    }

    /**
     * Zeigt Inline-Loader in einem Element
     * @param {string} elementId - ID des Container-Elements
     * @param {string} message - Nachricht
     */
    showInline(elementId, message = 'Lädt...') {
        const container = document.getElementById(elementId);
        if (!container) return;

        // Entferne existierenden Inline-Loader
        this.hideInline(elementId);

        const loader = document.createElement('div');
        loader.className = 'inline-loader';
        loader.setAttribute('data-loader-id', elementId);
        loader.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            gap: 15px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 215, 0, 0.2);
            border-top-color: #FFD700;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        `;

        const text = document.createElement('div');
        text.style.cssText = `
            color: #FFD700;
            font-size: 14px;
        `;
        text.textContent = message;

        loader.appendChild(spinner);
        loader.appendChild(text);
        container.appendChild(loader);
    }

    /**
     * Versteckt Inline-Loader
     * @param {string} elementId - ID des Container-Elements
     */
    hideInline(elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const loader = container.querySelector(`[data-loader-id="${elementId}"]`);
        if (loader) {
            loader.remove();
        }
    }

    /**
     * Zeigt Progress-Bar
     * @param {string} elementId - Container Element ID
     * @param {number} percent - Fortschritt 0-100
     * @param {string} message - Nachricht
     */
    showProgress(elementId, percent, message = '') {
        const container = document.getElementById(elementId);
        if (!container) return;

        let progressBar = container.querySelector('.progress-bar-container');

        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar-container';
            progressBar.style.cssText = `
                width: 100%;
                padding: 20px;
            `;

            const barWrapper = document.createElement('div');
            barWrapper.style.cssText = `
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 10px;
            `;

            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.style.cssText = `
                height: 100%;
                background: linear-gradient(90deg, #FFD700, #FFA500);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            `;

            const text = document.createElement('div');
            text.className = 'progress-text';
            text.style.cssText = `
                color: #FFD700;
                font-size: 14px;
                text-align: center;
            `;

            barWrapper.appendChild(bar);
            progressBar.appendChild(barWrapper);
            progressBar.appendChild(text);
            container.appendChild(progressBar);
        }

        const bar = progressBar.querySelector('.progress-bar');
        const text = progressBar.querySelector('.progress-text');

        if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (text) text.textContent = message || `${Math.round(percent)}%`;
    }

    /**
     * Versteckt Progress-Bar
     * @param {string} elementId - Container Element ID
     */
    hideProgress(elementId) {
        const container = document.getElementById(elementId);
        if (!container) return;

        const progressBar = container.querySelector('.progress-bar-container');
        if (progressBar) {
            progressBar.remove();
        }
    }

    /**
     * Zeigt Skeleton-Screen
     * @param {string} elementId - Container Element ID
     * @param {number} count - Anzahl der Skeleton-Items
     */
    showSkeleton(elementId, count = 3) {
        const container = document.getElementById(elementId);
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-item';
            skeleton.style.cssText = `
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.05) 0%,
                    rgba(255, 255, 255, 0.1) 50%,
                    rgba(255, 255, 255, 0.05) 100%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
                border-radius: 8px;
                height: 80px;
                margin-bottom: 10px;
            `;
            container.appendChild(skeleton);
        }

        // Add shimmer animation if not exists
        if (!document.getElementById('shimmer-style')) {
            const style = document.createElement('style');
            style.id = 'shimmer-style';
            style.textContent = `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * BLE Connection Loading
     */
    showBLEConnecting(deviceName = 'Gerät') {
        this.show(`Verbinde mit ${deviceName}...`, 'ble-connect');
    }

    hideBLEConnecting() {
        this.hide('ble-connect');
    }

    /**
     * Library Scan Loading
     */
    showLibraryScan() {
        this.show('Scanne Musikbibliothek...', 'library-scan');
    }

    hideLibraryScan() {
        this.hide('library-scan');
    }

    /**
     * Track Loading
     */
    showTrackLoading(trackName = 'Track') {
        this.show(`Lade ${trackName}...`, 'track-load');
    }

    hideTrackLoading() {
        this.hide('track-load');
    }

    /**
     * Cleanup - entfernt alle Loader
     */
    cleanup() {
        this.activeLoaders.clear();
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
        }

        // Entferne alle Inline-Loader
        document.querySelectorAll('.inline-loader, .progress-bar-container, .skeleton-item').forEach(el => {
            el.remove();
        });
    }
}

// Initialize global loading manager
window.loadingManager = new LoadingManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoadingManager;
}

console.log('✅ Loading Manager geladen');
