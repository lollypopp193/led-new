// ✅ UNIVERSELLE LED-ABSTRAKTIONSSCHICHT
// Unterstützt verschiedene LED-Typen und Protokolle

class LEDAbstractionLayer {
    constructor() {
        this.ledType = null; // 'WS2812B', 'APA102', 'SK6812', etc.
        // ✅ VERWENDE GLOBALEN CONTROLLER!
        this.controller = window.ledController || window.bleController || null;
        this.pixelCount = 60; // Standard 60 LEDs
        this.colorOrder = 'RGB'; // oder 'GRB', 'BGR', etc.
        this.maxBrightness = 255;
        this.whiteBalance = { r: 1.0, g: 1.0, b: 0.85 };
        
        // ✅ AUTO-INIT BEI CONTROLLER-VERFÜGBARKEIT
        if (!this.controller && (window.ledController || window.bleController)) {
            this.controller = window.ledController || window.bleController;
            console.log('✅ LED Abstraction Layer nutzt globalen Controller');
        }
    }
    
    // ✅ AUTOMATISCHE LED-TYP ERKENNUNG
    async detectLEDType() {
        try {
            // Sende Test-Pattern und analysiere Response
            const testPattern = [0x7E, 0xFF, 0xFF, 0xFF, 0xEF];
            const response = await this.controller.sendCommand(testPattern);
            
            // Analysiere Response für LED-Typ
            if (response && response[0] === 0x7E) {
                if (response[1] === 0x01) this.ledType = 'WS2812B';
                else if (response[1] === 0x02) this.ledType = 'APA102';
                else if (response[1] === 0x03) this.ledType = 'SK6812';
            }
            
            return this.ledType;
        } catch (error) {
            console.error('LED-Typ Erkennung fehlgeschlagen:', error);
            return 'WS2812B'; // Fallback
        }
    }
    
    // ✅ FARB-KONVERTIERUNG FÜR VERSCHIEDENE LED-TYPEN
    convertColorForLEDType(r, g, b) {
        switch(this.colorOrder) {
            case 'GRB': return { r: g, g: r, b: b };
            case 'BGR': return { r: b, g: g, b: r };
            case 'BRG': return { r: b, g: r, b: g };
            case 'GBR': return { r: g, g: b, b: r };
            case 'RBG': return { r: r, g: b, b: g };
            default: return { r, g, b }; // RGB
        }
    }
    
    // ✅ GAMMA-KORREKTUR FÜR LINEARITÄT
    gammaCorrection(value) {
        // 2.8 Gamma für bessere Farbdarstellung
        return Math.pow(value / 255, 2.8) * 255;
    }
    
    // ✅ UNIVERSELLE SET-COLOR METHODE
    async setColor(r, g, b, applyGamma = true) {
        // Gamma-Korrektur anwenden
        if (applyGamma) {
            r = this.gammaCorrection(r);
            g = this.gammaCorrection(g);
            b = this.gammaCorrection(b);
        }
        
        // Konvertiere für LED-Typ
        const converted = this.convertColorForLEDType(r, g, b);
        
        // Sende an Hardware
        switch(this.ledType) {
            case 'WS2812B':
                return this.sendWS2812Command(converted.r, converted.g, converted.b);
            case 'APA102':
                return this.sendAPA102Command(converted.r, converted.g, converted.b);
            case 'SK6812':
                return this.sendSK6812Command(converted.r, converted.g, converted.b);
            default:
                return this.sendGenericCommand(converted.r, converted.g, converted.b);
        }
    }
    
    // ✅ WS2812B SPEZIFISCHES PROTOKOLL
    async sendWS2812Command(r, g, b) {
        const cmd = new Uint8Array([
            0x7E, 0x00, 0x05,
            Math.round(r), Math.round(g), Math.round(b),
            0x00, 0xEF
        ]);
        return this.controller.characteristic.writeValue(cmd);
    }
    
    // ✅ GENERISCHES PROTOKOLL
    async sendGenericCommand(r, g, b) {
        // ✅ NUTZE GLOBALEN CONTROLLER!
        if (this.controller && this.controller.characteristic) {
            const cmd = new Uint8Array([
                0x7E, 0x00, 0x05,
                Math.round(r), Math.round(g), Math.round(b),
                0x00, 0xEF
            ]);
            return this.controller.characteristic.writeValue(cmd);
        } else if (window.ledController && window.ledController.isConnected) {
            // ✅ FALLBACK AUF GLOBALEN CONTROLLER
            return window.ledController.setColorRGB(Math.round(r), Math.round(g), Math.round(b));
        } else {
            console.error('❌ Kein Controller verfügbar!');
            return false;
        }
    }
    
    // ✅ APA102 SPEZIFISCHES PROTOKOLL (MIT GLOBAL BRIGHTNESS)
    async sendAPA102Command(r, g, b, brightness = 31) {
        const cmd = new Uint8Array([
            0x00, 0x00, 0x00, 0x00, // Start frame
            0xE0 | brightness,       // Global brightness (5 bits)
            Math.round(b),           // APA102 ist BGR!
            Math.round(g),
            Math.round(r),
            0xFF, 0xFF, 0xFF, 0xFF  // End frame
        ]);
        return this.controller.characteristic.writeValue(cmd);
    }
    
    // ✅ SK6812 RGBW PROTOKOLL
    async sendSK6812Command(r, g, b, w = 0) {
        const cmd = new Uint8Array([
            0x7E, 0x00, 0x06,
            Math.round(r), Math.round(g), Math.round(b), Math.round(w),
            0xEF
        ]);
        return this.controller.characteristic.writeValue(cmd);
    }
    
    // ✅ EINZELPIXEL-STEUERUNG
    async setPixel(index, r, g, b) {
        if (index >= this.pixelCount) {
            throw new Error(`Pixel ${index} außerhalb des Bereichs (max: ${this.pixelCount - 1})`);
        }
        
        const cmd = new Uint8Array([
            0x7E, 0x01, // Pixel-Mode
            (index >> 8) & 0xFF, index & 0xFF, // 16-bit Index
            Math.round(r), Math.round(g), Math.round(b),
            0xEF
        ]);
        return this.controller.characteristic.writeValue(cmd);
    }
    
    // ✅ BUFFER-BASIERTE UPDATES (FÜR ANIMATIONEN)
    async updateBuffer(pixelData) {
        // pixelData = [[r,g,b], [r,g,b], ...]
        const bufferSize = pixelData.length * 3;
        const cmd = new Uint8Array(bufferSize + 5);
        
        cmd[0] = 0x7E;
        cmd[1] = 0x02; // Buffer-Mode
        cmd[2] = (bufferSize >> 8) & 0xFF;
        cmd[3] = bufferSize & 0xFF;
        
        let offset = 4;
        for (const pixel of pixelData) {
            const converted = this.convertColorForLEDType(pixel[0], pixel[1], pixel[2]);
            cmd[offset++] = Math.round(converted.r);
            cmd[offset++] = Math.round(converted.g);
            cmd[offset++] = Math.round(converted.b);
        }
        
        cmd[cmd.length - 1] = 0xEF;
        
        // Chunk große Buffer (BLE hat 512 byte limit)
        if (cmd.length > 512) {
            for (let i = 0; i < cmd.length; i += 512) {
                const chunk = cmd.slice(i, Math.min(i + 512, cmd.length));
                await this.controller.characteristic.writeValue(chunk);
                await this.delay(10); // Kleine Pause zwischen Chunks
            }
        } else {
            return this.controller.characteristic.writeValue(cmd);
        }
    }
    
    // ✅ VORDEFINIERTE EFFEKTE
    async playEffect(effectName, speed = 5, colors = null) {
        const effects = {
            'rainbow': 0x06,
            'breathing': 0x07,
            'strobe': 0x08,
            'fade': 0x09,
            'smooth': 0x0A,
            'flash': 0x0B,
            'wave': 0x0C,
            'comet': 0x0D,
            'fireworks': 0x0E,
            'christmas': 0x0F
        };
        
        const effectCode = effects[effectName] || 0x06;
        const cmd = new Uint8Array([
            0x7E, 0x03, effectCode, speed,
            colors ? colors[0] : 0xFF,
            colors ? colors[1] : 0x00,
            colors ? colors[2] : 0x00,
            0xEF
        ]);
        
        return this.controller.characteristic.writeValue(cmd);
    }
    
    // ✅ FRAME-RATE KONTROLLE
    async startAnimation(animationFunc, targetFPS = 30) {
        const frameTime = 1000 / targetFPS;
        let lastTime = performance.now();
        let animationId;
        
        const animate = async (currentTime) => {
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= frameTime) {
                await animationFunc(deltaTime);
                lastTime = currentTime - (deltaTime % frameTime);
            }
            
            animationId = requestAnimationFrame(animate);
        };
        
        animationId = requestAnimationFrame(animate);
        
        return () => cancelAnimationFrame(animationId);
    }
    
    // ✅ HELPER FUNKTIONEN
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ✅ KALIBRIERUNG
    async calibrateWhiteBalance(rOffset = 1.0, gOffset = 1.0, bOffset = 0.85) {
        // Typisch: Blau ist zu stark bei LEDs
        this.whiteBalance = { r: rOffset, g: gOffset, b: bOffset };
        
        // Speichere Kalibrierung
        localStorage.setItem('ledWhiteBalance', JSON.stringify(this.whiteBalance));
    }
    
    // ✅ POWER-MANAGEMENT
    calculatePowerConsumption(r, g, b, pixelCount) {
        // WS2812B: ~20mA pro Farbe bei voller Helligkeit
        const mAPerColor = 20;
        const power = ((r/255 + g/255 + b/255) * mAPerColor * pixelCount);
        return {
            current: power,
            watts: (power * 5) / 1000 // 5V assumption
        };
    }
}

// Export für globale Nutzung
window.LEDAbstractionLayer = LEDAbstractionLayer;
