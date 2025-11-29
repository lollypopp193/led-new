/**
 * BLE CONNECTION TESTER v1.0
 * Testet BLE-Verbindungen und Auto-Reconnect
 */
'use strict';

class BLEConnectionTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    /**
     * Führt vollständigen BLE-Test durch
     */
    async runFullTest() {
        if (this.isRunning) {
            console.warn('Test läuft bereits');
            return;
        }

        this.isRunning = true;
        this.testResults = [];

        console.group('🧪 BLE Connection Test');
        console.log('Start:', new Date().toLocaleTimeString());

        try {
            // Test 1: API Verfügbarkeit
            await this.testAPIAvailability();

            // Test 2: Scan
            await this.testScan();

            // Test 3: Connect
            await this.testConnect();

            // Test 4: Command Send
            await this.testCommandSend();

            // Test 5: Disconnect & Reconnect
            await this.testReconnect();

            // Test 6: Multi-Device (falls vorhanden)
            await this.testMultiDevice();

            console.log('✅ Alle Tests abgeschlossen');
            this.showTestReport();

        } catch (error) {
            console.error('❌ Test fehlgeschlagen:', error);
            this.addResult('FEHLER', 'Test abgebrochen', false, error.message);
        } finally {
            this.isRunning = false;
            console.groupEnd();
        }
    }

    async testAPIAvailability() {
        console.log('Test 1: API Verfügbarkeit...');

        try {
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth API nicht verfügbar');
            }

            if (!window.BLEController) {
                throw new Error('BLEController nicht geladen');
            }

            this.addResult('API', 'Web Bluetooth API & BLEController', true);
        } catch (error) {
            this.addResult('API', 'API Verfügbarkeit', false, error.message);
            throw error;
        }
    }

    async testScan() {
        console.log('Test 2: Gerätescan...');

        try {
            if (!window.BLEControllerPro) {
                throw new Error('BLEControllerPro nicht initialisiert');
            }

            // Zeige Benutzer-Dialog (muss manuell gemacht werden)
            console.log('⚠️ Bitte Gerät im Dialog auswählen...');

            const device = await window.BLEControllerPro.scan();

            if (device) {
                this.addResult('SCAN', `Gerät gefunden: ${device.name}`, true);
            } else {
                throw new Error('Kein Gerät ausgewählt');
            }

        } catch (error) {
            if (error.name === 'NotFoundError') {
                this.addResult('SCAN', 'Scan abgebrochen', false, 'Benutzer hat abgebrochen');
            } else {
                this.addResult('SCAN', 'Gerätescan', false, error.message);
            }
            throw error;
        }
    }

    async testConnect() {
        console.log('Test 3: Verbindung...');

        try {
            if (!window.loadingManager) {
                console.warn('Loading Manager nicht verfügbar');
            } else {
                window.loadingManager.showBLEConnecting();
            }

            const connected = await window.BLEControllerPro.connect();

            if (window.loadingManager) {
                window.loadingManager.hideBLEConnecting();
            }

            if (connected) {
                this.addResult('CONNECT', 'Verbindung hergestellt', true);
            } else {
                throw new Error('Verbindung fehlgeschlagen');
            }

        } catch (error) {
            if (window.loadingManager) {
                window.loadingManager.hideBLEConnecting();
            }
            this.addResult('CONNECT', 'Verbindung', false, error.message);
            throw error;
        }
    }

    async testCommandSend() {
        console.log('Test 4: Befehle senden...');

        try {
            if (!window.BLEControllerPro || !window.BLEControllerPro.isConnected) {
                throw new Error('Nicht verbunden');
            }

            // Test: Power On
            await window.BLEControllerPro.sendPowerOn();
            await this.delay(500);

            // Test: Farbe setzen (Gelb)
            await window.BLEControllerPro.sendColor(255, 215, 0);
            await this.delay(500);

            // Test: Helligkeit
            await window.BLEControllerPro.sendBrightness(100);
            await this.delay(500);

            this.addResult('COMMAND', 'Power, Farbe, Helligkeit', true);

        } catch (error) {
            this.addResult('COMMAND', 'Befehle senden', false, error.message);
            // Nicht werfen - Test soll weiterlaufen
        }
    }

    async testReconnect() {
        console.log('Test 5: Disconnect & Reconnect...');

        try {
            if (!window.BLEControllerPro || !window.BLEControllerPro.isConnected) {
                throw new Error('Nicht verbunden');
            }

            // Disconnect
            console.log('Trenne Verbindung...');
            await window.BLEControllerPro.disconnect();
            await this.delay(1000);

            if (window.BLEControllerPro.isConnected) {
                throw new Error('Disconnect fehlgeschlagen');
            }

            console.log('✅ Disconnect erfolgreich');

            // Reconnect
            console.log('Reconnect...');
            const reconnected = await window.BLEControllerPro.reconnect();

            if (reconnected) {
                this.addResult('RECONNECT', 'Disconnect & Reconnect', true);
            } else {
                throw new Error('Reconnect fehlgeschlagen');
            }

        } catch (error) {
            this.addResult('RECONNECT', 'Disconnect & Reconnect', false, error.message);
            // Nicht werfen - Test soll weiterlaufen
        }
    }

    async testMultiDevice() {
        console.log('Test 6: Multi-Device...');

        try {
            if (!window.BluetoothForegroundService) {
                console.log('⚠️ Foreground Service nicht verfügbar - überspringe');
                return;
            }

            const devices = await window.BluetoothForegroundService.getAllDevices();

            if (devices.length > 1) {
                console.log(`📱 ${devices.length} Geräte gespeichert`);
                this.addResult('MULTI', `${devices.length} Geräte verwaltet`, true);
            } else {
                console.log('ℹ️ Nur 1 Gerät - Multi-Device Test übersprungen');
            }

        } catch (error) {
            console.warn('Multi-Device Test übersprungen:', error.message);
        }
    }

    addResult(category, test, success, error = '') {
        this.testResults.push({
            category,
            test,
            success,
            error,
            timestamp: Date.now()
        });
    }

    showTestReport() {
        console.group('📊 Test-Report');

        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;

        console.log(`Gesamt: ${total} | ✅ ${passed} | ❌ ${failed}`);
        console.log('');

        this.testResults.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            console.log(`${icon} [${result.category}] ${result.test}`);
            if (result.error) {
                console.log(`   └─ Fehler: ${result.error}`);
            }
        });

        console.groupEnd();

        // UI Notification
        if (window.showGlobalNotification) {
            const successRate = Math.round((passed / total) * 100);
            window.showGlobalNotification(
                `BLE Test: ${successRate}% erfolgreich (${passed}/${total})`,
                successRate >= 80 ? 'success' : successRate >= 50 ? 'warning' : 'error'
            );
        }
    }

    /**
     * Quick Test - nur Verbindung testen
     */
    async quickTest() {
        console.log('🚀 Quick Test: BLE Verbindung...');

        try {
            if (!window.BLEControllerPro) {
                throw new Error('BLEControllerPro nicht verfügbar');
            }

            const isConnected = window.BLEControllerPro.isConnected;

            if (isConnected) {
                console.log('✅ Bereits verbunden');
                // Test mit einem Befehl
                await window.BLEControllerPro.sendBrightness(100);
                console.log('✅ Befehl erfolgreich gesendet');
                return true;
            } else {
                console.log('⚠️ Nicht verbunden - versuche Reconnect...');
                const reconnected = await window.BLEControllerPro.reconnect();

                if (reconnected) {
                    console.log('✅ Reconnect erfolgreich');
                    return true;
                } else {
                    console.error('❌ Reconnect fehlgeschlagen');
                    return false;
                }
            }

        } catch (error) {
            console.error('❌ Quick Test fehlgeschlagen:', error);
            return false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getResults() {
        return [...this.testResults];
    }

    clearResults() {
        this.testResults = [];
    }
}

// Initialize global tester
window.bleConnectionTester = new BLEConnectionTester();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BLEConnectionTester;
}

console.log('✅ BLE Connection Tester geladen');
console.log('📝 Nutze: bleConnectionTester.runFullTest() oder bleConnectionTester.quickTest()');
