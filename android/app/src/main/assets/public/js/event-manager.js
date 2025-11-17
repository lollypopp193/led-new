// ✅ ZENTRALES EVENT-MANAGEMENT SYSTEM
// Koordiniert alle User-Aktionen und Hardware-Events

class EventManager {
    constructor() {
        this.events = new Map();
        this.listeners = new Map();
        this.queue = [];
        this.processing = false;
        this.init();
    }
    
    init() {
        // ✅ SENSOR-INTEGRATION
        this.setupSensorListeners();
        
        // ✅ GESTURE-CONTROL
        this.setupGestureControl();
        
        // ✅ VOICE-CONTROL
        this.setupVoiceControl();
        
        // ✅ AUTOMATION TRIGGERS
        this.setupAutomationTriggers();
    }
    
    // ✅ TOUCH & GESTURE EVENTS
    setupGestureControl() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', async (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // Swipe Detection MIT HARDWARE-KONTROLLE
            if (Math.abs(deltaX) > 100) {
                if (deltaX > 0) {
                    this.emit('gesture:swipe-right');
                    // ✅ ECHTE HARDWARE: Nächster Effekt
                    if (window.ledController && window.ledController.isConnected) {
                        const currentEffect = parseInt(localStorage.getItem('currentEffect') || 0);
                        const nextEffect = (currentEffect + 1) % 32;
                        await window.ledController.setEffect(nextEffect);
                        localStorage.setItem('currentEffect', nextEffect);
                        console.log('✅ Gesture: Nächster Effekt', nextEffect);
                    }
                } else {
                    this.emit('gesture:swipe-left');
                    // ✅ ECHTE HARDWARE: Vorheriger Effekt
                    if (window.ledController && window.ledController.isConnected) {
                        const currentEffect = parseInt(localStorage.getItem('currentEffect') || 0);
                        const prevEffect = (currentEffect - 1 + 32) % 32;
                        await window.ledController.setEffect(prevEffect);
                        localStorage.setItem('currentEffect', prevEffect);
                        console.log('✅ Gesture: Vorheriger Effekt', prevEffect);
                    }
                }
            }
            
            if (Math.abs(deltaY) > 100) {
                if (deltaY > 0) {
                    this.emit('gesture:swipe-down');
                    // ✅ ECHTE HARDWARE: Helligkeit runter
                    if (window.ledController && window.ledController.isConnected) {
                        const currentBrightness = parseInt(localStorage.getItem('ledBrightness') || 50);
                        const newBrightness = Math.max(10, currentBrightness - 20);
                        await window.ledController.setBrightness(newBrightness);
                        localStorage.setItem('ledBrightness', newBrightness);
                        console.log('✅ Gesture: Helligkeit reduziert auf', newBrightness);
                    }
                } else {
                    this.emit('gesture:swipe-up');
                    // ✅ ECHTE HARDWARE: Helligkeit hoch
                    if (window.ledController && window.ledController.isConnected) {
                        const currentBrightness = parseInt(localStorage.getItem('ledBrightness') || 50);
                        const newBrightness = Math.min(100, currentBrightness + 20);
                        await window.ledController.setBrightness(newBrightness);
                        localStorage.setItem('ledBrightness', newBrightness);
                        console.log('✅ Gesture: Helligkeit erhöht auf', newBrightness);
                    }
                }
            }
        });
        
        // Pinch-to-Zoom für Helligkeit
        let initialDistance = 0;
        
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                if (initialDistance === 0) {
                    initialDistance = distance;
                } else {
                    const scale = distance / initialDistance;
                    this.emit('gesture:pinch', { scale });
                }
            }
        });
    }
    
    // ✅ SENSOR-EVENTS (Beschleunigung, Orientierung, Umgebungslicht)
    setupSensorListeners() {
        // Bewegungssensor
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                
                // Schüttel-Erkennung
                if (Math.abs(acc.x) > 15 || Math.abs(acc.y) > 15 || Math.abs(acc.z) > 15) {
                    this.emit('sensor:shake', { intensity: Math.max(acc.x, acc.y, acc.z) });
                }
            });
        }
        
        // Orientierungssensor
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                this.emit('sensor:orientation', {
                    alpha: e.alpha,  // Z-Achse (0-360)
                    beta: e.beta,    // X-Achse (-180 to 180)
                    gamma: e.gamma   // Y-Achse (-90 to 90)
                });
            });
        }
        
        // Umgebungslichtsensor
        if ('AmbientLightSensor' in window) {
            try {
                const sensor = new AmbientLightSensor();
                sensor.addEventListener('reading', () => {
                    this.emit('sensor:ambient-light', { lux: sensor.illuminance });
                });
                sensor.start();
            } catch (error) {
                console.log('Ambient Light Sensor nicht verfügbar');
            }
        }
        
        // Näherungssensor
        if ('ProximitySensor' in window) {
            try {
                const sensor = new ProximitySensor();
                sensor.addEventListener('reading', () => {
                    this.emit('sensor:proximity', { 
                        near: sensor.near,
                        distance: sensor.distance 
                    });
                });
                sensor.start();
            } catch (error) {
                console.log('Proximity Sensor nicht verfügbar');
            }
        }
    }
    
    // ✅ SPRACHSTEUERUNG MIT ECHTER HARDWARE-KONTROLLE
    setupVoiceControl() {
        if (!('webkitSpeechRecognition' in window)) return;
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'de-DE';
        
        const commands = {
            'licht an': async () => {
                this.emit('voice:power-on');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setPower(true);
                    console.log('✅ Voice: LED eingeschaltet');
                }
            },
            'licht aus': async () => {
                this.emit('voice:power-off');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setPower(false);
                    console.log('✅ Voice: LED ausgeschaltet');
                }
            },
            'rot': async () => {
                this.emit('voice:color', { color: 'red' });
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setColorRGB(255, 0, 0);
                    console.log('✅ Voice: Farbe Rot');
                }
            },
            'blau': async () => {
                this.emit('voice:color', { color: 'blue' });
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setColorRGB(0, 0, 255);
                    console.log('✅ Voice: Farbe Blau');
                }
            },
            'grün': async () => {
                this.emit('voice:color', { color: 'green' });
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setColorRGB(0, 255, 0);
                    console.log('✅ Voice: Farbe Grün');
                }
            },
            'heller': async () => {
                this.emit('voice:brightness-up');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    const currentBrightness = parseInt(localStorage.getItem('ledBrightness') || 50);
                    const newBrightness = Math.min(100, currentBrightness + 20);
                    await window.ledController.setBrightness(newBrightness);
                    localStorage.setItem('ledBrightness', newBrightness);
                    console.log('✅ Voice: Helligkeit erhöht auf', newBrightness);
                }
            },
            'dunkler': async () => {
                this.emit('voice:brightness-down');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    const currentBrightness = parseInt(localStorage.getItem('ledBrightness') || 50);
                    const newBrightness = Math.max(10, currentBrightness - 20);
                    await window.ledController.setBrightness(newBrightness);
                    localStorage.setItem('ledBrightness', newBrightness);
                    console.log('✅ Voice: Helligkeit reduziert auf', newBrightness);
                }
            },
            'party': async () => {
                this.emit('voice:party-mode');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setEffect(11); // Disco-Effekt
                    console.log('✅ Voice: Party-Modus aktiviert');
                }
            },
            'entspannung': async () => {
                this.emit('voice:relax-mode');
                // ✅ ECHTE HARDWARE-KONTROLLE!
                if (window.ledController && window.ledController.isConnected) {
                    await window.ledController.setColorRGB(255, 200, 100); // Warmes Licht
                    await window.ledController.setBrightness(40);
                    console.log('✅ Voice: Entspannungsmodus aktiviert');
                }
            }
        };
        
        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('🎤 Sprachbefehl erkannt:', transcript);
            
            for (const [command, action] of Object.entries(commands)) {
                if (transcript.includes(command)) {
                    await action(); // ✅ AWAIT für async Hardware-Befehle
                    break;
                }
            }
        };
        
        // Voice-Button aktiviert Sprachsteuerung
        document.getElementById('voiceControlBtn')?.addEventListener('click', () => {
            recognition.start();
        });
    }
    
    // ✅ AUTOMATION & SCHEDULING
    setupAutomationTriggers() {
        // Zeitbasierte Trigger
        setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();
            
            // Sonnenuntergang-Simulation
            if (hour === 18 && minute === 0) {
                this.emit('automation:sunset');
            }
            
            // Nachtlicht
            if (hour === 22 && minute === 0) {
                this.emit('automation:night-mode');
            }
            
            // Wecker
            if (hour === 7 && minute === 0) {
                this.emit('automation:wake-up');
            }
        }, 60000); // Check jede Minute
        
        // Geofencing (wenn verfügbar)
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition((position) => {
                const home = { lat: 52.520008, lng: 13.404954 }; // Beispiel
                const distance = this.calculateDistance(
                    position.coords.latitude,
                    position.coords.longitude,
                    home.lat,
                    home.lng
                );
                
                if (distance < 100) { // 100 Meter Radius
                    this.emit('automation:arrived-home');
                } else if (distance > 500) {
                    this.emit('automation:left-home');
                }
            });
        }
    }
    
    // ✅ EVENT QUEUE MANAGEMENT
    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        
        this.processing = true;
        
        while (this.queue.length > 0) {
            const event = this.queue.shift();
            
            try {
                // Prioritäts-basierte Verarbeitung
                if (event.priority === 'high') {
                    await this.executeEvent(event);
                } else {
                    // Batch low-priority events
                    const batch = [event];
                    while (this.queue.length > 0 && this.queue[0].priority === 'low') {
                        batch.push(this.queue.shift());
                    }
                    await this.executeBatch(batch);
                }
            } catch (error) {
                console.error('Event-Verarbeitung fehlgeschlagen:', error);
            }
        }
        
        this.processing = false;
    }
    
    // ✅ EVENT EMITTER
    emit(eventName, data = {}, priority = 'normal') {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            priority: priority
        };
        
        // High-priority events überspringen Queue
        if (priority === 'high') {
            this.executeEvent(event);
        } else {
            this.queue.push(event);
            this.processQueue();
        }
        
        // Log für Debugging
        console.log(`📢 Event: ${eventName}`, data);
    }
    
    // ✅ EVENT LISTENER
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }
    
    // ✅ EVENT EXECUTION
    async executeEvent(event) {
        const handlers = this.listeners.get(event.name) || [];
        
        for (const handler of handlers) {
            try {
                await handler(event.data);
            } catch (error) {
                console.error(`Handler-Fehler für ${event.name}:`, error);
            }
        }
    }
    
    // ✅ BATCH EXECUTION
    async executeBatch(events) {
        // Gruppiere ähnliche Events
        const grouped = events.reduce((acc, event) => {
            const key = event.name;
            if (!acc[key]) acc[key] = [];
            acc[key].push(event);
            return acc;
        }, {});
        
        // Führe gruppierte Events aus
        for (const [eventName, eventGroup] of Object.entries(grouped)) {
            const handlers = this.listeners.get(eventName) || [];
            
            for (const handler of handlers) {
                try {
                    // Sende alle Daten als Array
                    await handler(eventGroup.map(e => e.data));
                } catch (error) {
                    console.error(`Batch-Handler-Fehler für ${eventName}:`, error);
                }
            }
        }
    }
    
    // ✅ HELPER: Distanzberechnung
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Erdradius in Metern
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    // ✅ KEYBOARD SHORTCUTS
    setupKeyboardShortcuts() {
        const shortcuts = {
            'Space': () => this.emit('keyboard:toggle-power'),
            'ArrowUp': () => this.emit('keyboard:brightness-up'),
            'ArrowDown': () => this.emit('keyboard:brightness-down'),
            'ArrowLeft': () => this.emit('keyboard:previous-effect'),
            'ArrowRight': () => this.emit('keyboard:next-effect'),
            '1': () => this.emit('keyboard:scene', { scene: 1 }),
            '2': () => this.emit('keyboard:scene', { scene: 2 }),
            '3': () => this.emit('keyboard:scene', { scene: 3 }),
            'r': () => this.emit('keyboard:color', { color: 'red' }),
            'g': () => this.emit('keyboard:color', { color: 'green' }),
            'b': () => this.emit('keyboard:color', { color: 'blue' }),
            'p': () => this.emit('keyboard:party-mode'),
            'm': () => this.emit('keyboard:music-sync')
        };
        
        document.addEventListener('keydown', (e) => {
            const action = shortcuts[e.key];
            if (action && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                action();
            }
        });
    }
}

// Export für globale Nutzung
window.EventManager = EventManager;

// Auto-Initialize
window.eventManager = new EventManager();
