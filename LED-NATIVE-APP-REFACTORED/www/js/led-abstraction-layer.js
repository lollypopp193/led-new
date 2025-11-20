/**
 * LED-ABSTRACTION-LAYER.JS v2.0 - ZERO TOLERANCE IMPLEMENTATION
 * Universelle LED-Steuerung für verschiedene LED-Typen & Protokolle
 */
'use strict';

class LEDAbstractionLayer {
    constructor() {
        this.ledType = null;
        this.controller = window.ledController || window.bleController || null;
        this.pixelCount = 60;
        this.colorOrder = 'RGB';
        this.maxBrightness = 255;
        this.whiteBalance = { r: 1.0, g: 1.0, b: 0.85 };
        this.gammaCorrection = true;
        this.gammaValue = 2.8;
        this.supportedTypes = ['WS2812B', 'APA102', 'SK6812', 'WS2811', 'SK9822', 'Generic'];

        if (!this.controller && (window.ledController || window.bleController)) {
            this.controller = window.ledController || window.bleController;
        }

        console.log('✅ LED-Abstraction-Layer initialisiert');
    }

    async detectLEDType() {
        try {
            console.log('🔍 Erkenne LED-Typ...');
            const testPattern = new Uint8Array([0x7E, 0xFF, 0xFF, 0xFF, 0xEF]);

            if (!this.controller || !this.controller.isConnected) {
                console.warn('⚠️ Kein Controller verbunden, verwende Generic');
                this.ledType = 'Generic';
                return this.ledType;
            }

            if (this.controller.characteristic) {
                const response = await this.controller.characteristic.writeValue(testPattern);
                if (response && response.byteLength > 0) {
                    const data = new Uint8Array(response.buffer || response);
                    if (data[0] === 0x7E) {
                        if (data[1] === 0x01) this.ledType = 'WS2812B';
                        else if (data[1] === 0x02) this.ledType = 'APA102';
                        else if (data[1] === 0x03) this.ledType = 'SK6812';
                        else if (data[1] === 0x04) this.ledType = 'WS2811';
                        else this.ledType = 'Generic';
                    }
                }
            }

            if (!this.ledType) this.ledType = 'WS2812B';

            console.log('✅ LED-Typ erkannt:', this.ledType);
            this.optimizeForLEDType();
            return this.ledType;
        } catch (e) {
            console.error('❌ LED-Typ Erkennung:', e);
            this.ledType = 'Generic';
            return this.ledType;
        }
    }

    optimizeForLEDType() {
        switch (this.ledType) {
            case 'WS2812B':
                this.colorOrder = 'GRB';
                this.pixelCount = 60;
                this.maxBrightness = 255;
                console.log('🔧 Optimiert für WS2812B (GRB)');
                break;
            case 'APA102':
                this.colorOrder = 'BGR';
                this.pixelCount = 60;
                this.maxBrightness = 31;
                console.log('🔧 Optimiert für APA102 (BGR)');
                break;
            case 'SK6812':
                this.colorOrder = 'GRB';
                this.pixelCount = 60;
                this.maxBrightness = 255;
                console.log('🔧 Optimiert für SK6812 (GRB)');
                break;
            case 'WS2811':
                this.colorOrder = 'RGB';
                this.pixelCount = 50;
                this.maxBrightness = 255;
                console.log('🔧 Optimiert für WS2811 (RGB)');
                break;
            default:
                this.colorOrder = 'RGB';
                console.log('🔧 Generic-Modus (RGB)');
        }
    }

    convertColorForLEDType(r, g, b) {
        var converted = { r: r, g: g, b: b };
        switch (this.colorOrder) {
            case 'GRB': converted = { r: g, g: r, b: b }; break;
            case 'BGR': converted = { r: b, g: g, b: r }; break;
            case 'BRG': converted = { r: b, g: r, b: g }; break;
            case 'GBR': converted = { r: g, g: b, b: r }; break;
            case 'RBG': converted = { r: r, g: b, b: g }; break;
            default: converted = { r: r, g: g, b: b };
        }
        return converted;
    }

    applyGammaCorrection(value) {
        if (!this.gammaCorrection) return value;
        return Math.pow(value / 255, this.gammaValue) * 255;
    }

    applyWhiteBalance(r, g, b) {
        return {
            r: Math.min(255, r * this.whiteBalance.r),
            g: Math.min(255, g * this.whiteBalance.g),
            b: Math.min(255, b * this.whiteBalance.b)
        };
    }

    async setColor(r, g, b, options) {
        options = options || {};
        try {
            r = Math.max(0, Math.min(255, parseInt(r) || 0));
            g = Math.max(0, Math.min(255, parseInt(g) || 0));
            b = Math.max(0, Math.min(255, parseInt(b) || 0));

            if (options.applyGamma !== false && this.gammaCorrection) {
                r = this.applyGammaCorrection(r);
                g = this.applyGammaCorrection(g);
                b = this.applyGammaCorrection(b);
            }

            if (options.applyWhiteBalance !== false) {
                var wb = this.applyWhiteBalance(r, g, b);
                r = wb.r;
                g = wb.g;
                b = wb.b;
            }

            var converted = this.convertColorForLEDType(r, g, b);

            if (!this.controller) {
                console.warn('⚠️ Kein Controller');
                return false;
            }

            switch (this.ledType) {
                case 'WS2812B':
                case 'SK6812':
                case 'WS2811':
                    return await this.sendWS2812Command(converted.r, converted.g, converted.b);
                case 'APA102':
                case 'SK9822':
                    return await this.sendAPA102Command(converted.r, converted.g, converted.b);
                default:
                    return await this.sendGenericCommand(converted.r, converted.g, converted.b);
            }
        } catch (e) {
            console.error('❌ setColor:', e);
            return false;
        }
    }

    async sendWS2812Command(r, g, b) {
        try {
            const cmd = new Uint8Array([0x7E, 0x00, 0x05, Math.round(r), Math.round(g), Math.round(b), 0x00, 0xEF]);
            if (this.controller.characteristic) {
                await this.controller.characteristic.writeValue(cmd);
            } else if (this.controller.setColorRGB) {
                await this.controller.setColorRGB(Math.round(r), Math.round(g), Math.round(b));
            }
            return true;
        } catch (e) {
            console.error('❌ WS2812 Command:', e);
            return false;
        }
    }

    async sendAPA102Command(r, g, b) {
        try {
            const brightness = 31;
            const cmd = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xFF | (brightness & 0x1F), Math.round(b), Math.round(g), Math.round(r), 0xFF, 0xFF, 0xFF, 0xFF]);
            if (this.controller.characteristic) {
                await this.controller.characteristic.writeValue(cmd);
            } else if (this.controller.setColorRGB) {
                await this.controller.setColorRGB(Math.round(r), Math.round(g), Math.round(b));
            }
            return true;
        } catch (e) {
            console.error('❌ APA102 Command:', e);
            return false;
        }
    }

    async sendGenericCommand(r, g, b) {
        try {
            if (this.controller.setColorRGB) {
                await this.controller.setColorRGB(Math.round(r), Math.round(g), Math.round(b));
            } else if (this.controller.characteristic) {
                const cmd = new Uint8Array([0x7E, 0x00, 0x05, Math.round(r), Math.round(g), Math.round(b), 0x00, 0xEF]);
                await this.controller.characteristic.writeValue(cmd);
            } else {
                console.warn('⚠️ Keine Methode verfügbar');
                return false;
            }
            return true;
        } catch (e) {
            console.error('❌ Generic Command:', e);
            return false;
        }
    }

    async setBrightness(brightness) {
        try {
            brightness = Math.max(0, Math.min(100, parseInt(brightness) || 100));
            if (this.controller.setBrightness) {
                await this.controller.setBrightness(brightness);
            } else if (this.controller.characteristic) {
                const cmd = new Uint8Array([0x7E, 0x00, 0x0E, brightness, 0x00, 0x00, 0x00, 0xEF]);
                await this.controller.characteristic.writeValue(cmd);
            }
            return true;
        } catch (e) {
            console.error('❌ setBrightness:', e);
            return false;
        }
    }

    async setEffect(effectId) {
        try {
            effectId = Math.max(0, Math.min(255, parseInt(effectId) || 0));
            if (this.controller.setEffect) {
                await this.controller.setEffect(effectId);
            } else if (this.controller.characteristic) {
                const cmd = new Uint8Array([0x7E, 0x00, 0x06 + effectId, 0x05, 0x00, 0x00, 0x00, 0xEF]);
                await this.controller.characteristic.writeValue(cmd);
            }
            return true;
        } catch (e) {
            console.error('❌ setEffect:', e);
            return false;
        }
    }

    setColorOrder(order) {
        const validOrders = ['RGB', 'RBG', 'GRB', 'GBR', 'BRG', 'BGR'];
        if (validOrders.indexOf(order) !== -1) {
            this.colorOrder = order;
            console.log('✅ Color Order:', order);
            return true;
        }
        console.error('❌ Ungültige Color Order:', order);
        return false;
    }

    setWhiteBalance(r, g, b) {
        this.whiteBalance = {
            r: Math.max(0, Math.min(1, parseFloat(r) || 1.0)),
            g: Math.max(0, Math.min(1, parseFloat(g) || 1.0)),
            b: Math.max(0, Math.min(1, parseFloat(b) || 1.0))
        };
        console.log('✅ White Balance:', this.whiteBalance);
    }

    setGammaCorrection(enabled, gammaValue) {
        this.gammaCorrection = Boolean(enabled);
        if (gammaValue !== undefined) {
            this.gammaValue = Math.max(1.0, Math.min(4.0, parseFloat(gammaValue) || 2.8));
        }
        console.log('✅ Gamma:', this.gammaCorrection, this.gammaValue);
    }

    getInfo() {
        return {
            ledType: this.ledType,
            colorOrder: this.colorOrder,
            pixelCount: this.pixelCount,
            maxBrightness: this.maxBrightness,
            gammaCorrection: this.gammaCorrection,
            gammaValue: this.gammaValue,
            whiteBalance: this.whiteBalance,
            supportedTypes: this.supportedTypes,
            controllerConnected: this.controller ? this.controller.isConnected : false
        };
    }

    reset() {
        this.ledType = null;
        this.colorOrder = 'RGB';
        this.gammaCorrection = true;
        this.gammaValue = 2.8;
        this.whiteBalance = { r: 1.0, g: 1.0, b: 0.85 };
        console.log('🔄 LED-Abstraction-Layer zurückgesetzt');
    }
}

window.LEDAbstractionLayer = LEDAbstractionLayer;
window.ledAbstraction = new LEDAbstractionLayer();
console.log('✅ LED-Abstraction-Layer global verfügbar als window.ledAbstraction');

if (typeof module !== 'undefined' && module.exports) module.exports = LEDAbstractionLayer;
