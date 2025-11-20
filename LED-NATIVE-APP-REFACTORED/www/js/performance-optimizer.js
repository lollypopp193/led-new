/**
 * PERFORMANCE-OPTIMIZER.JS v2.0 - ZERO TOLERANCE IMPLEMENTATION
 * Performance-Monitoring & Optimierung für LED Native App
 */
'use strict';

class PerformanceOptimizer {
    constructor() {
        this.metrics = { commandLatency: [], frameRate: [], memoryUsage: [], bluetoothLatency: [] };
        this.commandQueue = [];
        this.batchSize = 10;
        this.throttleTime = 16;
        this.lastCommandTime = 0;
        this.lastMusicFrameTime = 0;
        this.fpsCounter = 0;
        this.lastFpsTime = performance.now();
        this.currentFPS = 0;
        this.init();
        console.log('✅ Performance-Optimizer initialisiert');
    }

    init() {
        this.startMonitoring();
        this.setupOptimizations();
        console.log('🚀 Performance-Monitoring aktiv');
    }

    startMonitoring() {
        const self = this;
        let lastTime = performance.now();
        let frames = 0;

        const measureFPS = function () {
            frames++;
            const now = performance.now();
            if (now >= lastTime + 1000) {
                self.currentFPS = frames;
                self.metrics.frameRate.push(frames);
                if (self.metrics.frameRate.length > 60) self.metrics.frameRate.shift();
                frames = 0;
                lastTime = now;
            }
            requestAnimationFrame(measureFPS);
        };
        measureFPS();

        if (performance.memory) {
            setInterval(function () {
                const mem = { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize, limit: performance.memory.jsHeapSizeLimit };
                self.metrics.memoryUsage.push(mem);
                if (self.metrics.memoryUsage.length > 60) self.metrics.memoryUsage.shift();
                if (self.metrics.memoryUsage.length > 10) {
                    const recent = self.metrics.memoryUsage.slice(-10);
                    const trend = self.calculateTrend(recent.map(function (m) { return m.used; }));
                    if (trend > 1000000) { console.warn('⚠️ Memory Leak erkannt!'); self.performGarbageCollection(); }
                }
            }, 5000);
        }

        setInterval(function () { self.logPerformanceMetrics(); }, 30000);
    }

    setupOptimizations() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(function () { console.log('💡 Idle Callback verfügbar'); });
        }
        if ('IntersectionObserver' in window) { console.log('💡 Intersection Observer verfügbar'); }
        this.optimizeDOMOperations();
        this.optimizeEventListeners();
    }

    async sendOptimizedCommand(command, priority) {
        priority = priority || 'normal';
        const now = performance.now();
        const startTime = now;

        if (priority === 'high') {
            await this.sendImmediate(command);
            this.metrics.commandLatency.push(performance.now() - startTime);
            if (this.metrics.commandLatency.length > 100) this.metrics.commandLatency.shift();
            return;
        }

        if (now - this.lastCommandTime < this.throttleTime) {
            this.commandQueue.push(command);
            if (this.commandQueue.length >= this.batchSize) await this.flushCommandQueue();
            return;
        }

        await this.sendImmediate(command);
        this.lastCommandTime = now;
        this.metrics.commandLatency.push(performance.now() - startTime);
        if (this.metrics.commandLatency.length > 100) this.metrics.commandLatency.shift();
    }

    async sendImmediate(command) {
        try {
            if (window.ledController && window.ledController.isConnected) {
                if (typeof command === 'function') await command();
                else if (command.type === 'color') await window.ledController.setColorRGB(command.r, command.g, command.b);
                else if (command.type === 'effect') await window.ledController.setEffect(command.id);
                else if (command.type === 'brightness') await window.ledController.setBrightness(command.value);
            }
        } catch (e) { console.error('❌ Command:', e); }
    }

    async flushCommandQueue() {
        if (this.commandQueue.length === 0) return;
        const cmds = this.commandQueue.splice(0, this.batchSize);
        for (var i = 0; i < cmds.length; i++) { await this.sendImmediate(cmds[i]); }
        this.lastCommandTime = performance.now();
    }

    optimizeDOMOperations() {
        const self = this;
        this.mutationBuffer = [];
        this.mutationTimer = null;

        this.batchDOMUpdates = function (callback) {
            self.mutationBuffer.push(callback);
            if (!self.mutationTimer) {
                self.mutationTimer = requestAnimationFrame(function () {
                    for (var i = 0; i < self.mutationBuffer.length; i++) { self.mutationBuffer[i](); }
                    self.mutationBuffer = [];
                    self.mutationTimer = null;
                });
            }
        };

        console.log('✅ DOM-Optimierung aktiv');
    }

    optimizeEventListeners() {
        const self = this;
        this.throttledEvents = {};

        this.throttleEvent = function (eventName, callback, delay) {
            delay = delay || 100;
            if (self.throttledEvents[eventName]) return;
            self.throttledEvents[eventName] = true;
            setTimeout(function () {
                callback();
                self.throttledEvents[eventName] = false;
            }, delay);
        };

        this.debounce = function (func, wait) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function () { func.apply(context, args); }, wait);
            };
        };

        console.log('✅ Event-Optimierung aktiv');
    }

    calculateTrend(values) {
        if (values.length < 2) return 0;
        var sum = 0;
        for (var i = 1; i < values.length; i++) { sum += (values[i] - values[i - 1]); }
        return sum / (values.length - 1);
    }

    performGarbageCollection() {
        console.log('🗑️ Garbage Collection...');
        if (window.gc) window.gc();
        else {
            var arr = [];
            for (var i = 0; i < 1000; i++) { arr.push(new Array(1000)); }
            arr = null;
        }
    }

    getAverageLatency() {
        if (this.metrics.commandLatency.length === 0) return 0;
        var sum = 0;
        for (var i = 0; i < this.metrics.commandLatency.length; i++) { sum += this.metrics.commandLatency[i]; }
        return sum / this.metrics.commandLatency.length;
    }

    getAverageFPS() {
        if (this.metrics.frameRate.length === 0) return 0;
        var sum = 0;
        for (var i = 0; i < this.metrics.frameRate.length; i++) { sum += this.metrics.frameRate[i]; }
        return sum / this.metrics.frameRate.length;
    }

    getCurrentMemoryUsage() {
        if (!performance.memory) return null;
        return { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize, percent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) };
    }

    logPerformanceMetrics() {
        console.log('📊 Performance Metrics:');
        console.log('  FPS:', this.currentFPS, '(Avg:', this.getAverageFPS().toFixed(1) + ')');
        console.log('  Latency:', this.getAverageLatency().toFixed(2) + 'ms');
        const mem = this.getCurrentMemoryUsage();
        if (mem) console.log('  Memory:', (mem.used / 1048576).toFixed(2) + 'MB (' + mem.percent + '%)');
    }

    getPerformanceReport() {
        return {
            fps: { current: this.currentFPS, average: this.getAverageFPS(), history: this.metrics.frameRate.slice(-10) },
            latency: { average: this.getAverageLatency(), history: this.metrics.commandLatency.slice(-10) },
            memory: this.getCurrentMemoryUsage(),
            queueSize: this.commandQueue.length,
            timestamp: Date.now()
        };
    }

    optimizeMusicSync(audioAnalyser, ledController) {
        const self = this;
        let lastUpdate = 0;
        const updateInterval = 50;

        return function () {
            const now = Date.now();
            if (now - lastUpdate < updateInterval) return;
            lastUpdate = now;

            try {
                const dataArray = new Uint8Array(audioAnalyser.frequencyBinCount);
                audioAnalyser.getByteFrequencyData(dataArray);

                const bass = dataArray.slice(0, 10).reduce(function (a, b) { return a + b; }, 0) / 10;
                const mid = dataArray.slice(10, 50).reduce(function (a, b) { return a + b; }, 0) / 40;
                const treble = dataArray.slice(50, 100).reduce(function (a, b) { return a + b; }, 0) / 50;

                const r = Math.min(255, bass * 2);
                const g = Math.min(255, mid * 2);
                const b = Math.min(255, treble * 2);

                self.sendOptimizedCommand({ type: 'color', r: r, g: g, b: b }, 'normal');
            } catch (e) { console.error('❌ Music Sync:', e); }
        };
    }

    enableLowPowerMode() {
        console.log('🔋 Low Power Mode aktiviert');
        this.throttleTime = 50;
        this.batchSize = 5;
        if (window.ledController) window.ledController.commandDelay = 100;
    }

    enableHighPerformanceMode() {
        console.log('⚡ High Performance Mode aktiviert');
        this.throttleTime = 8;
        this.batchSize = 20;
        if (window.ledController) window.ledController.commandDelay = 20;
    }

    reset() {
        this.metrics = { commandLatency: [], frameRate: [], memoryUsage: [], bluetoothLatency: [] };
        this.commandQueue = [];
        this.lastCommandTime = 0;
        console.log('🔄 Performance-Optimizer zurückgesetzt');
    }
}

window.PerformanceOptimizer = PerformanceOptimizer;
window.performanceOptimizer = new PerformanceOptimizer();
console.log('✅ Performance-Optimizer global verfügbar als window.performanceOptimizer');

if (typeof module !== 'undefined' && module.exports) module.exports = PerformanceOptimizer;
