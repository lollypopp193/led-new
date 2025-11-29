/**
 * PERFORMANCE MONITOR v1.0
 * Performance-Überwachung & Optimierung
 */
'use strict';

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            loadTimes: [],
            renderTimes: []
        };
        this.isMonitoring = false;
        this.fpsInterval = null;
        this.memoryInterval = null;
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.optimizeImages();
        this.setupMemoryManagement();
        console.log('✅ Performance Monitor initialisiert');
    }

    /**
     * START MONITORING
     */
    startMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.startFPSMonitoring();
        this.startMemoryMonitoring();
        this.trackPageLoad();

        console.log('📊 Performance Monitoring gestartet');
    }

    stopMonitoring() {
        this.isMonitoring = false;

        if (this.fpsInterval) {
            clearInterval(this.fpsInterval);
            this.fpsInterval = null;
        }

        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }

        console.log('⏹️ Performance Monitoring gestoppt');
    }

    /**
     * FPS MONITORING
     */
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;

        const calculateFPS = () => {
            frames++;
            const currentTime = performance.now();
            const delta = currentTime - lastTime;

            if (delta >= 1000) {
                const fps = Math.round((frames * 1000) / delta);
                this.metrics.fps.push(fps);

                // Behalte nur letzten 60 Werte
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }

                // Warnung bei niedrigem FPS
                if (fps < 30) {
                    console.warn(`⚠️ Niedriger FPS: ${fps}`);
                }

                frames = 0;
                lastTime = currentTime;
            }

            if (this.isMonitoring) {
                requestAnimationFrame(calculateFPS);
            }
        };

        requestAnimationFrame(calculateFPS);
    }

    /**
     * MEMORY MONITORING
     */
    startMemoryMonitoring() {
        if (!performance.memory) {
            console.warn('⚠️ Performance.memory nicht verfügbar');
            return;
        }

        this.memoryInterval = setInterval(() => {
            const memory = {
                usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
                totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
                jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
            };

            this.metrics.memory.push(memory);

            // Behalte nur letzten 60 Werte
            if (this.metrics.memory.length > 60) {
                this.metrics.memory.shift();
            }

            // Warnung bei hohem Memory-Verbrauch
            const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
            if (usagePercent > 80) {
                console.warn(`⚠️ Hoher Memory-Verbrauch: ${usagePercent.toFixed(1)}%`);
                this.triggerGarbageCollection();
            }
        }, 5000); // Alle 5 Sekunden
    }

    /**
     * PAGE LOAD TRACKING
     */
    trackPageLoad() {
        if (!performance.timing) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                const firstPaint = performance.getEntriesByType('paint')[0];

                this.metrics.loadTimes.push({
                    total: loadTime,
                    domReady: domReady,
                    firstPaint: firstPaint ? firstPaint.startTime : null,
                    timestamp: Date.now()
                });

                console.log(`📊 Page Load: ${loadTime}ms (DOM: ${domReady}ms)`);

                // Warnung bei langsamem Load
                if (loadTime > 3000) {
                    console.warn(`⚠️ Langsamer Page Load: ${loadTime}ms`);
                }
            }, 0);
        });
    }

    /**
     * LAZY LOADING
     */
    setupLazyLoading() {
        // Lazy Loading für Bilder
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        // Beobachte alle Bilder mit data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        // Lazy Loading für Komponenten
        const componentObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const component = entry.target;
                    if (component.dataset.lazyLoad) {
                        this.loadComponent(component);
                        componentObserver.unobserve(component);
                    }
                }
            });
        }, {
            rootMargin: '100px'
        });

        document.querySelectorAll('[data-lazy-load]').forEach(component => {
            componentObserver.observe(component);
        });

        console.log('✅ Lazy Loading aktiviert');
    }

    loadComponent(element) {
        const componentName = element.dataset.lazyLoad;
        console.log(`📦 Loading component: ${componentName}`);

        // Trigger component load event
        const event = new CustomEvent('component-load', {
            detail: { name: componentName, element }
        });
        document.dispatchEvent(event);
    }

    /**
     * IMAGE OPTIMIZATION
     */
    optimizeImages() {
        // Komprimiere große Bilder
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', function () {
                if (this.naturalWidth > 1920) {
                    console.warn(`⚠️ Großes Bild: ${this.src} (${this.naturalWidth}px)`);
                }
            });
        });

        // Responsive Images
        this.setupResponsiveImages();
    }

    setupResponsiveImages() {
        const updateImageSizes = () => {
            const screenWidth = window.innerWidth;

            document.querySelectorAll('img[data-responsive]').forEach(img => {
                let size = 'small';
                if (screenWidth > 1200) size = 'large';
                else if (screenWidth > 768) size = 'medium';

                const src = img.dataset[`src${size.charAt(0).toUpperCase() + size.slice(1)}`];
                if (src && img.src !== src) {
                    img.src = src;
                }
            });
        };

        updateImageSizes();
        window.addEventListener('resize', updateImageSizes);
    }

    /**
     * MEMORY MANAGEMENT
     */
    setupMemoryManagement() {
        // Auto-Cleanup bei Page Unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Periodic Cleanup
        setInterval(() => {
            this.triggerGarbageCollection();
        }, 60000); // Alle 60 Sekunden
    }

    triggerGarbageCollection() {
        // Cleanup DOM
        this.cleanupDetachedNodes();

        // Cleanup Event Listeners
        this.cleanupEventListeners();

        // Cleanup Caches
        this.cleanupCaches();

        console.log('🧹 Garbage Collection ausgeführt');
    }

    cleanupDetachedNodes() {
        // Remove hidden/detached elements
        document.querySelectorAll('[data-cleanup]').forEach(el => {
            if (!el.isConnected) {
                el.remove();
            }
        });
    }

    cleanupEventListeners() {
        // Remove old event listeners (falls vorhanden)
        // Implementierung abhängig von Event-Tracking-System
    }

    cleanupCaches() {
        // Clear old cache entries
        if (window.caches) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name.includes('old') || name.includes('temp')) {
                        caches.delete(name);
                    }
                });
            });
        }
    }

    cleanup() {
        this.stopMonitoring();
        this.metrics = {
            fps: [],
            memory: [],
            loadTimes: [],
            renderTimes: []
        };
        console.log('🧹 Performance Monitor Cleanup');
    }

    /**
     * GET METRICS
     */
    getMetrics() {
        const avgFPS = this.metrics.fps.length > 0
            ? Math.round(this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length)
            : 0;

        const currentMemory = this.metrics.memory.length > 0
            ? this.metrics.memory[this.metrics.memory.length - 1]
            : null;

        const lastLoadTime = this.metrics.loadTimes.length > 0
            ? this.metrics.loadTimes[this.metrics.loadTimes.length - 1]
            : null;

        return {
            fps: {
                current: this.metrics.fps[this.metrics.fps.length - 1] || 0,
                average: avgFPS,
                min: Math.min(...this.metrics.fps),
                max: Math.max(...this.metrics.fps)
            },
            memory: currentMemory,
            loadTime: lastLoadTime,
            isMonitoring: this.isMonitoring
        };
    }

    /**
     * SHOW PERFORMANCE OVERLAY
     */
    showPerformanceOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'performanceOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 100000;
            min-width: 200px;
        `;

        const updateOverlay = () => {
            const metrics = this.getMetrics();
            overlay.innerHTML = `
                <div style="margin-bottom: 8px; color: #FFD700; font-weight: bold;">⚡ PERFORMANCE</div>
                <div>FPS: ${metrics.fps.current} (Avg: ${metrics.fps.average})</div>
                ${metrics.memory ? `
                    <div>Memory: ${metrics.memory.usedJSHeapSize}MB / ${metrics.memory.jsHeapSizeLimit}MB</div>
                ` : ''}
                ${metrics.loadTime ? `
                    <div>Load: ${metrics.loadTime.total}ms</div>
                ` : ''}
                <button id="closeOverlay" style="
                    margin-top: 8px;
                    width: 100%;
                    padding: 4px;
                    background: #ff4757;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Close</button>
            `;

            document.getElementById('closeOverlay')?.addEventListener('click', () => {
                overlay.remove();
                clearInterval(updateInterval);
            });
        };

        updateOverlay();
        const updateInterval = setInterval(updateOverlay, 1000);

        document.body.appendChild(overlay);
    }

    /**
     * DEBOUNCE HELPER
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * THROTTLE HELPER
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize global performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.performanceMonitor.startMonitoring();
    console.log('🔧 Development Mode: Performance Monitoring aktiviert');
}

// Export helpers
window.debounce = (func, wait) => window.performanceMonitor.debounce(func, wait);
window.throttle = (func, limit) => window.performanceMonitor.throttle(func, limit);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

console.log('✅ Performance Monitor geladen');
console.log('📊 Nutze: performanceMonitor.showPerformanceOverlay()');
