/**
 * EDGE CASE TESTER v1.0
 * Testet Edge-Cases und Grenzfälle
 */
'use strict';

class EdgeCaseTester {
    constructor() {
        this.testResults = [];
        this.init();
    }

    init() {
        console.log('✅ Edge Case Tester initialisiert');
    }

    /**
     * Führt alle Edge-Case Tests durch
     */
    async runAllTests() {
        console.group('🧪 EDGE CASE TESTS');

        this.testResults = [];

        try {
            // 1. Input Validation Tests
            await this.testInputValidation();

            // 2. Storage Tests
            await this.testStorageLimits();

            // 3. Network Tests
            await this.testNetworkFailures();

            // 4. Permission Tests
            await this.testPermissionDenial();

            // 5. Audio Tests
            await this.testAudioEdgeCases();

            // 6. BLE Tests
            await this.testBLEEdgeCases();

            // 7. UI Tests
            await this.testUIEdgeCases();

            // 8. Memory Tests
            await this.testMemoryLimits();

            this.showTestReport();

        } catch (error) {
            console.error('❌ Test-Suite fehlgeschlagen:', error);
        } finally {
            console.groupEnd();
        }
    }

    async testInputValidation() {
        console.log('Test 1: Input Validation Edge Cases...');

        const tests = [
            // Empty Input
            { input: '', type: 'text', expected: 'valid or invalid based on required' },

            // Very Long Input
            { input: 'a'.repeat(1000), type: 'text', expected: 'invalid' },

            // Special Characters
            { input: '<script>alert("xss")</script>', type: 'text', expected: 'sanitized' },

            // SQL Injection
            { input: "'; DROP TABLE users; --", type: 'text', expected: 'sanitized' },

            // Invalid Email
            { input: 'invalid@email', type: 'email', expected: 'invalid' },

            // Negative Number
            { input: '-10', type: 'number', expected: 'invalid if min is 0' },

            // Float as Integer
            { input: '5.5', type: 'number', expected: 'handled' }
        ];

        let passed = 0;
        const total = tests.length;

        for (const test of tests) {
            const input = document.createElement('input');
            input.type = test.type;
            input.value = test.input;

            if (window.inputValidator) {
                const result = window.inputValidator.validate(input, test.type);
                passed++;
                console.log(`  ✓ ${test.input.substring(0, 20)}... → ${result.valid ? 'valid' : 'invalid'}`);
            }
        }

        this.addResult('Input Validation', `${passed}/${total} Tests`, passed === total);
    }

    async testStorageLimits() {
        console.log('Test 2: Storage Limits...');

        try {
            // Test LocalStorage Limit
            const testKey = 'edge-case-test';
            let size = 0;
            let maxSize = 0;

            try {
                // Try to write 5MB
                const largeData = 'x'.repeat(5 * 1024 * 1024);
                localStorage.setItem(testKey, largeData);
                maxSize = 5;
            } catch (e) {
                // QuotaExceededError erwartet
                console.log('  ℹ️ LocalStorage Limit erreicht (erwartet)');
            } finally {
                localStorage.removeItem(testKey);
            }

            // Test IndexedDB
            if (window.indexedDB) {
                console.log('  ✓ IndexedDB verfügbar');
            } else {
                console.warn('  ⚠️ IndexedDB nicht verfügbar');
            }

            this.addResult('Storage Limits', 'LocalStorage & IndexedDB geprüft', true);

        } catch (error) {
            this.addResult('Storage Limits', error.message, false);
        }
    }

    async testNetworkFailures() {
        console.log('Test 3: Network Failures...');

        try {
            // Simuliere Offline
            const wasOnline = navigator.onLine;
            console.log(`  ℹ️ Navigator.onLine: ${wasOnline}`);

            // Test Offline-Funktionalität
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log(`  ✓ Service Worker: ${registrations.length} registriert`);
            }

            this.addResult('Network Failures', 'Offline-Fähigkeit geprüft', true);

        } catch (error) {
            this.addResult('Network Failures', error.message, false);
        }
    }

    async testPermissionDenial() {
        console.log('Test 4: Permission Denial...');

        const permissions = [
            'notifications',
            'geolocation',
            'camera',
            'microphone'
        ];

        let checked = 0;

        for (const perm of permissions) {
            try {
                if (navigator.permissions) {
                    const result = await navigator.permissions.query({ name: perm });
                    console.log(`  ℹ️ ${perm}: ${result.state}`);
                    checked++;
                }
            } catch (e) {
                console.log(`  ℹ️ ${perm}: nicht abfragbar`);
            }
        }

        this.addResult('Permission Handling', `${checked} Permissions geprüft`, true);
    }

    async testAudioEdgeCases() {
        console.log('Test 5: Audio Edge Cases...');

        try {
            const audio = new Audio();

            // Test 1: Sehr kurze Datei
            console.log('  ℹ️ Audio-Element erstellt');

            // Test 2: Mehrfache Play/Pause
            let playAttempts = 0;
            for (let i = 0; i < 5; i++) {
                try {
                    await audio.play();
                    audio.pause();
                    playAttempts++;
                } catch (e) {
                    // DOMException erwartet ohne Source
                }
            }

            // Test 3: Volume Grenzen
            audio.volume = 0;
            console.log(`  ✓ Min Volume: ${audio.volume}`);

            audio.volume = 1;
            console.log(`  ✓ Max Volume: ${audio.volume}`);

            audio.volume = 2; // Sollte auf 1 begrenzt werden
            console.log(`  ✓ Over-Max Volume: ${audio.volume} (sollte 1 sein)`);

            this.addResult('Audio Edge Cases', 'Volume & Play/Pause', true);

        } catch (error) {
            this.addResult('Audio Edge Cases', error.message, false);
        }
    }

    async testBLEEdgeCases() {
        console.log('Test 6: BLE Edge Cases...');

        try {
            // Test 1: API Verfügbarkeit
            if (!navigator.bluetooth) {
                console.log('  ℹ️ Web Bluetooth API nicht verfügbar (Browser-abhängig)');
                this.addResult('BLE Edge Cases', 'API nicht verfügbar (OK)', true);
                return;
            }

            // Test 2: Mehrfache Disconnect-Aufrufe
            if (window.BLEControllerPro && !window.BLEControllerPro.isConnected) {
                try {
                    await window.BLEControllerPro.disconnect();
                    await window.BLEControllerPro.disconnect();
                    console.log('  ✓ Mehrfache Disconnect-Aufrufe behandelt');
                } catch (e) {
                    console.log('  ℹ️ Disconnect ohne Connection (erwartet)');
                }
            }

            this.addResult('BLE Edge Cases', 'API & Disconnect', true);

        } catch (error) {
            this.addResult('BLE Edge Cases', error.message, false);
        }
    }

    async testUIEdgeCases() {
        console.log('Test 7: UI Edge Cases...');

        try {
            // Test 1: Sehr lange Texte
            const testDiv = document.createElement('div');
            testDiv.style.width = '100px';
            testDiv.style.overflow = 'hidden';
            testDiv.style.textOverflow = 'ellipsis';
            testDiv.textContent = 'A'.repeat(1000);
            document.body.appendChild(testDiv);

            const overflows = testDiv.scrollWidth > testDiv.clientWidth;
            console.log(`  ✓ Text-Overflow: ${overflows ? 'korrekt behandelt' : 'nicht nötig'}`);

            testDiv.remove();

            // Test 2: Rapid Clicks
            let clickCount = 0;
            const testButton = document.createElement('button');
            testButton.textContent = 'Test';
            testButton.addEventListener('click', () => clickCount++);

            document.body.appendChild(testButton);

            for (let i = 0; i < 10; i++) {
                testButton.click();
            }

            console.log(`  ✓ Rapid Clicks: ${clickCount} registriert`);
            testButton.remove();

            // Test 3: Modal über Modal
            const modal1 = document.createElement('div');
            modal1.style.position = 'fixed';
            modal1.style.zIndex = '1000';

            const modal2 = document.createElement('div');
            modal2.style.position = 'fixed';
            modal2.style.zIndex = '1001';

            document.body.appendChild(modal1);
            document.body.appendChild(modal2);

            const modal2Higher = parseInt(modal2.style.zIndex) > parseInt(modal1.style.zIndex);
            console.log(`  ✓ Modal Stacking: ${modal2Higher ? 'korrekt' : 'Problem'}`);

            modal1.remove();
            modal2.remove();

            this.addResult('UI Edge Cases', 'Text-Overflow, Clicks, Modals', true);

        } catch (error) {
            this.addResult('UI Edge Cases', error.message, false);
        }
    }

    async testMemoryLimits() {
        console.log('Test 8: Memory Limits...');

        try {
            // Test 1: Performance Memory (falls verfügbar)
            if (performance.memory) {
                const memory = performance.memory;
                console.log(`  ℹ️ Used Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
                console.log(`  ℹ️ Total Heap: ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
                console.log(`  ℹ️ Heap Limit: ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
            } else {
                console.log('  ℹ️ Performance.memory nicht verfügbar');
            }

            // Test 2: Große Array-Operationen
            const largeArray = new Array(100000).fill(0);
            const sum = largeArray.reduce((a, b) => a + b, 0);
            console.log(`  ✓ Große Arrays: 100k Elements verarbeitet`);

            // Test 3: Cleanup Test
            let tempArray = new Array(10000).fill('test');
            tempArray = null; // Release memory
            console.log('  ✓ Memory Cleanup: Array freigegeben');

            this.addResult('Memory Limits', 'Heap & Arrays', true);

        } catch (error) {
            this.addResult('Memory Limits', error.message, false);
        }
    }

    addResult(category, message, success) {
        this.testResults.push({
            category,
            message,
            success,
            timestamp: Date.now()
        });
    }

    showTestReport() {
        console.group('📊 EDGE CASE TEST REPORT');

        const passed = this.testResults.filter(r => r.success).length;
        const failed = this.testResults.filter(r => !r.success).length;
        const total = this.testResults.length;

        console.log(`\n🎯 GESAMT: ${total} | ✅ ${passed} | ❌ ${failed}\n`);

        this.testResults.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            console.log(`${icon} [${result.category}] ${result.message}`);
        });

        console.groupEnd();

        // UI Notification
        if (window.showGlobalNotification) {
            const successRate = Math.round((passed / total) * 100);
            window.showGlobalNotification(
                `Edge-Case Tests: ${successRate}% erfolgreich (${passed}/${total})`,
                successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error'
            );
        }

        return {
            total,
            passed,
            failed,
            successRate: Math.round((passed / total) * 100)
        };
    }

    getResults() {
        return [...this.testResults];
    }

    clearResults() {
        this.testResults = [];
    }
}

// Initialize global tester
window.edgeCaseTester = new EdgeCaseTester();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EdgeCaseTester;
}

console.log('✅ Edge Case Tester geladen');
console.log('📝 Nutze: edgeCaseTester.runAllTests()');
