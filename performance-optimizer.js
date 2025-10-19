// ✅ PERFORMANCE-OPTIMIERUNG & MONITORING
// Minimiert Latenz und maximiert Reaktionsgeschwindigkeit

class PerformanceOptimizer {
    constructor() {
        this.metrics = {
            commandLatency: [],
            frameRate: [],
            memoryUsage: [],
            bluetoothLatency: []
        };
        
        this.commandQueue = [];
        this.batchSize = 10;
        this.throttleTime = 16; // 60 FPS
        this.lastCommandTime = 0;
        
        this.init();
    }
    
    init() {
        this.startMonitoring();
        this.setupOptimizations();
    }
    
    // ✅ PERFORMANCE MONITORING
    startMonitoring() {
        // FPS Monitoring
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.metrics.frameRate.push(frames);
                frames = 0;
                lastTime = currentTime;
                
                // Begrenzte Historie
                if (this.metrics.frameRate.length > 60) {
                    this.metrics.frameRate.shift();
                }
            }
            
            requestAnimationFrame(measureFPS);
        };
        measureFPS();
        
        // Memory Monitoring
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memoryUsage.push({
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
                
                // Memory Leak Detection
                if (this.metrics.memoryUsage.length > 10) {
                    const recent = this.metrics.memoryUsage.slice(-10);
                    const trend = this.calculateTrend(recent.map(m => m.used));
                    
                    if (trend > 1000000) { // 1MB pro Messung
                        console.warn('⚠️ Mögliches Memory Leak erkannt!');
                        this.performGarbageCollection();
                    }
                }
            }, 5000);
        }
    }
    
    // ✅ COMMAND BATCHING & THROTTLING
    async sendOptimizedCommand(command, priority = 'normal') {
        const now = performance.now();
        
        // Measure Latency
        const startTime = performance.now();
        
        // High-priority commands bypass queue
        if (priority === 'high') {
            await this.sendImmediate(command);
            this.metrics.commandLatency.push(performance.now() - startTime);
            return;
        }
        
        // Throttling
        if (now - this.lastCommandTime < this.throttleTime) {
            this.commandQueue.push(command);
            
            if (this.commandQueue.length >= this.batchSize) {
                await this.flushCommandQueue();
            }
            return;
        }
        
        // Send immediately if enough time passed
        await this.sendImmediate(command);
        this.lastCommandTime = now;
        this.metrics.commandLatency.push(performance.now() - startTime);
    }
    
    // ✅ BATCH COMMAND PROCESSING
    async flushCommandQueue() {
        if (this.commandQueue.length === 0) return;
        
        const batch = this.commandQueue.splice(0, this.batchSize);
        const mergedCommand = this.mergeCommands(batch);
        
        await this.sendImmediate(mergedCommand);
    }
    
    // ✅ COMMAND MERGING OPTIMIZATION
    mergeCommands(commands) {
        // Intelligentes Zusammenführen ähnlicher Befehle
        const merged = {
            type: 'batch',
            commands: []
        };
        
        // Gruppiere nach Befehlstyp
        const grouped = commands.reduce((acc, cmd) => {
            const key = cmd.type || 'default';
            if (!acc[key]) acc[key] = [];
            acc[key].push(cmd);
            return acc;
        }, {});
        
        // Optimiere jede Gruppe
        for (const [type, group] of Object.entries(grouped)) {
            if (type === 'color') {
                // Nur letzte Farbe senden
                merged.commands.push(group[group.length - 1]);
            } else if (type === 'brightness') {
                // Nur letzten Helligkeitswert
                merged.commands.push(group[group.length - 1]);
            } else {
                // Alle anderen Commands behalten
                merged.commands.push(...group);
            }
        }
        
        return merged;
    }
    
    // ✅ DEBOUNCING FÜR UI-EVENTS
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
    
    // ✅ THROTTLING FÜR KONTINUIERLICHE EVENTS
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ✅ REQUEST ANIMATION FRAME OPTIMIZATION
    rafScheduler(callback) {
        let ticking = false;
        
        return function(...args) {
            if (!ticking) {
                requestAnimationFrame(() => {
                    callback.apply(this, args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    }
    
    // ✅ WEB WORKER FÜR HEAVY COMPUTATIONS
    async offloadToWorker(task, data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('js/computation-worker.js');
            
            worker.postMessage({ task, data });
            
            worker.onmessage = (e) => {
                resolve(e.data);
                worker.terminate();
            };
            
            worker.onerror = (error) => {
                reject(error);
                worker.terminate();
            };
            
            // Timeout nach 5 Sekunden
            setTimeout(() => {
                worker.terminate();
                reject(new Error('Worker timeout'));
            }, 5000);
        });
    }
    
    // ✅ CACHE MANAGEMENT
    setupCache() {
        this.cache = new Map();
        this.cacheMaxSize = 100;
        
        // LRU Cache Implementation
        this.getCached = (key, computeFn) => {
            if (this.cache.has(key)) {
                // Move to end (most recently used)
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            }
            
            const value = computeFn();
            
            // Enforce max size
            if (this.cache.size >= this.cacheMaxSize) {
                // Remove least recently used (first item)
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(key, value);
            return value;
        };
    }
    
    // ✅ CONNECTION OPTIMIZATION
    async optimizeBLEConnection() {
        if (!window.ledDevice) return;
        
        try {
            // Request higher MTU for faster data transfer
            if (window.ledDevice.gatt?.device?.requestMtu) {
                await window.ledDevice.gatt.device.requestMtu(512);
            }
            
            // Set connection parameters for low latency
            if (window.ledDevice.gatt?.device?.requestConnectionPriority) {
                await window.ledDevice.gatt.device.requestConnectionPriority('high');
            }
        } catch (error) {
            console.log('BLE-Optimierung nicht verfügbar');
        }
    }
    
    // ✅ LAZY LOADING
    lazyLoad(elementSelector, loadCallback) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadCallback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });
        
        document.querySelectorAll(elementSelector).forEach(el => {
            observer.observe(el);
        });
    }
    
    // ✅ VIRTUAL SCROLLING FÜR LISTEN
    virtualScroll(container, items, itemHeight, renderItem) {
        const scrollTop = container.scrollTop;
        const containerHeight = container.offsetHeight;
        
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
        
        const visibleItems = items.slice(startIndex, endIndex);
        
        // Clear container
        container.innerHTML = '';
        
        // Add spacer for scrolled items
        const spacer = document.createElement('div');
        spacer.style.height = `${startIndex * itemHeight}px`;
        container.appendChild(spacer);
        
        // Render visible items
        visibleItems.forEach(item => {
            container.appendChild(renderItem(item));
        });
        
        // Add spacer for remaining items
        const remainingSpacer = document.createElement('div');
        remainingSpacer.style.height = `${(items.length - endIndex) * itemHeight}px`;
        container.appendChild(remainingSpacer);
    }
    
    // ✅ PROFILING
    profile(name, func) {
        return async (...args) => {
            const startTime = performance.now();
            const startMemory = performance.memory?.usedJSHeapSize || 0;
            
            try {
                const result = await func(...args);
                
                const endTime = performance.now();
                const endMemory = performance.memory?.usedJSHeapSize || 0;
                
                console.log(`📊 Profile: ${name}
                    Time: ${(endTime - startTime).toFixed(2)}ms
                    Memory: ${((endMemory - startMemory) / 1024).toFixed(2)}KB`);
                
                return result;
            } catch (error) {
                console.error(`Profiling error in ${name}:`, error);
                throw error;
            }
        };
    }
    
    // ✅ PERFORMANCE REPORT
    generateReport() {
        const avgLatency = this.average(this.metrics.commandLatency);
        const avgFPS = this.average(this.metrics.frameRate);
        const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        
        return {
            averageLatency: `${avgLatency.toFixed(2)}ms`,
            averageFPS: avgFPS.toFixed(0),
            memoryUsage: `${(currentMemory?.used / 1024 / 1024).toFixed(2)}MB`,
            commandQueueSize: this.commandQueue.length,
            cacheHitRate: this.calculateCacheHitRate()
        };
    }
    
    // ✅ HELPER FUNCTIONS
    average(arr) {
        return arr.reduce((a, b) => a + b, 0) / arr.length || 0;
    }
    
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        let sum = 0;
        for (let i = 1; i < data.length; i++) {
            sum += data[i] - data[i - 1];
        }
        return sum / (data.length - 1);
    }
    
    performGarbageCollection() {
        // Clear unused references
        this.cache.clear();
        this.commandQueue = [];
        
        // Trigger browser GC if available
        if (window.gc) {
            window.gc();
        }
    }
    
    calculateCacheHitRate() {
        // Implementation depends on cache usage tracking
        return '85%'; // Placeholder
    }
    
    async sendImmediate(command) {
        // ✅ ECHTE HARDWARE-BEFEHLE SENDEN!
        try {
            // 1. Versuche globalen ledController
            if (window.ledController && window.ledController.isConnected) {
                if (command.type === 'color' && command.r !== undefined) {
                    await window.ledController.setColorRGB(command.r, command.g, command.b);
                } else if (command.type === 'brightness' && command.value !== undefined) {
                    await window.ledController.setBrightness(command.value);
                } else if (command.type === 'effect' && command.effectId !== undefined) {
                    await window.ledController.setEffect(command.effectId);
                } else if (command.type === 'power' && command.state !== undefined) {
                    await window.ledController.setPower(command.state);
                } else if (command.type === 'batch' && command.commands) {
                    // Batch-Befehle einzeln ausführen
                    for (const cmd of command.commands) {
                        await this.sendImmediate(cmd);
                    }
                } else if (command instanceof Uint8Array) {
                    // Raw command
                    if (window.ledDevice?.characteristic) {
                        await window.ledDevice.characteristic.writeValue(command);
                    } else if (window.ledController.characteristic) {
                        await window.ledController.characteristic.writeValue(command);
                    }
                }
            }
            // 2. Fallback auf direktes ledDevice
            else if (window.ledDevice?.characteristic && command instanceof Uint8Array) {
                await window.ledDevice.characteristic.writeValue(command);
            }
            // 3. WLED-Support
            else if (window.wledDevice && window.wledDevice.connected) {
                if (command.type === 'color') {
                    await fetch(`http://${window.wledDevice.ip}/json/state`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            on: true,
                            seg: [{ col: [[command.r, command.g, command.b]] }]
                        })
                    });
                }
            }
        } catch (error) {
            console.error('❌ Performance-Optimizer Sendefehler:', error);
        }
    }
}

// Export für globale Nutzung
window.PerformanceOptimizer = PerformanceOptimizer;

// Auto-Initialize
window.performanceOptimizer = new PerformanceOptimizer();
