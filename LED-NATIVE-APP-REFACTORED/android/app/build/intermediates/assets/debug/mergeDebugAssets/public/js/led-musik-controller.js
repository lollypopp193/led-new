/**
 * LED-MUSIK-CONTROLLER.JS
 * LED-Musik-Steuerung mit Audio-Reaktiv-Engine Integration
 */
'use strict';

let ledMusicEnabled = false;
let automaticMode = false;
let syncAllBands = false;
let discoveredBands = [];
let autoScanInterval = null;

async function autoScanLEDBands() {
    if (!window.bleController && !window.parent?.bleController) {
        console.log('BLE-Controller nicht verfügbar - Auto-Scan übersprungen');
        return;
    }

    try {
        const controller = window.bleController || window.parent.bleController;
        const devices = await controller.scanForDevices();

        if (devices && devices.length > 0) {
            discoveredBands = devices.filter(d => d.name && (d.name.includes('LED') || d.name.includes('BLE') || d.name.includes('Strip')));

            if (discoveredBands.length > 0) {
                console.log('Auto-Scan: ' + discoveredBands.length + ' LED-Bänder gefunden');

                const bandCount = Math.min(discoveredBands.length, 10);
                const ledBandCountSlider = document.getElementById('ledBandCount');
                if (ledBandCountSlider) {
                    ledBandCountSlider.value = bandCount;
                    document.getElementById('ledBandCountValue').textContent = bandCount;
                    updateBandTabs(bandCount);
                }

                discoveredBands.forEach((device, index) => {
                    if (window.audioReactiveEngine && window.audioReactiveEngine.ledStrips[index]) {
                        window.audioReactiveEngine.ledStrips[index].connected = true;
                        window.audioReactiveEngine.ledStrips[index].deviceInfo = device;
                        window.audioReactiveEngine.ledStrips[index].name = device.name || ('LED-Band ' + (index + 1));
                    }
                });

                if (window.showGlobalNotification) {
                    window.showGlobalNotification(bandCount + ' LED-Bänder automatisch erkannt', 'success');
                }

                // RENDER gefundene LED-Bänder in der UI
                renderFoundLEDBands(discoveredBands);
            }
        }
    } catch (error) {
        console.error('Auto-Scan Fehler:', error);
    }
}

/**
 * Rendert gefundene LED-Bänder in der UI (foundLEDBandsList)
 */
function renderFoundLEDBands(bands) {
    const container = document.getElementById('foundLEDBandsList');
    if (!container) return;

    if (!bands || bands.length === 0) {
        container.innerHTML = '<p style="color: #888; font-style: italic;"><i class="fas fa-search"></i> Keine LED-Bänder gefunden. Bitte in Einstellungen scannen.</p>';
        return;
    }

    container.innerHTML = '';
    bands.forEach((device, index) => {
        const bandElement = document.createElement('div');
        bandElement.className = 'found-led-band';
        bandElement.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(78, 205, 196, 0.15); border-radius: 10px; margin-bottom: 10px; cursor: pointer;';
        bandElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fas fa-lightbulb" style="color: #4ecdc4; font-size: 1.3rem;"></i>
                <div>
                    <div style="font-weight: bold; color: #fff;">${device.name || 'LED-Band ' + (index + 1)}</div>
                    <div style="font-size: 0.8rem; color: #888;">${device.id ? device.id.substring(0, 17) : 'Unbekannte ID'}</div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="color: #4ecdc4; font-size: 0.85rem;"><i class="fas fa-signal"></i> Verbunden</span>
                <button type="button" onclick="configureLEDBandForMusic(${index})" style="padding: 6px 12px; background: #4ecdc4; color: #1a1a2e; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85em;">
                    <i class="fas fa-cog"></i> Einstellen
                </button>
            </div>
        `;
        container.appendChild(bandElement);
    });
}

/**
 * Öffnet Konfiguration für ein LED-Band
 */
function configureLEDBandForMusic(bandIndex) {
    // Scrolle zum Band-Tab und aktiviere ihn
    const tabsContainer = document.getElementById('ledBandTabs');
    if (tabsContainer) {
        const tabs = tabsContainer.querySelectorAll('.band-tab');
        if (tabs[bandIndex]) {
            tabs[bandIndex].click();
        }
    }
    if (window.showGlobalNotification) {
        window.showGlobalNotification('Konfiguriere LED-Band ' + (bandIndex + 1), 'info');
    }
}

function initLEDMusicControls() {
    // Lade bereits bekannte LED-Geräte vom DeviceManager
    if (window.deviceManager && window.deviceManager.devices && window.deviceManager.devices.length > 0) {
        discoveredBands = window.deviceManager.devices;
        renderFoundLEDBands(discoveredBands);
        console.log('📱 ' + discoveredBands.length + ' bekannte LED-Geräte geladen');
    }

    // Toggle-Switches Event-Listener
    const autoModeToggle = document.getElementById('ledMusicAutomaticMode');
    const syncAllToggle = document.getElementById('ledMusicSyncAll');
    const startBtn = document.getElementById('startAudioCapture');
    const stopBtn = document.getElementById('stopAudioCapture');

    if (autoModeToggle) {
        autoModeToggle.addEventListener('change', function () {
            automaticMode = this.checked;
            console.log('🤖 Automatik-Modus:', automaticMode ? 'AN' : 'AUS');

            if (automaticMode && window.audioReactiveEngine) {
                // Automatisch Audio-Element finden und starten
                const audioElement = document.querySelector('audio');
                if (audioElement) {
                    window.audioReactiveEngine.startAudioCapture(audioElement);
                }
            }
        });
    }

    if (syncAllToggle) {
        syncAllToggle.addEventListener('change', function () {
            syncAllBands = this.checked;
            console.log('🔗 Sync alle Bänder:', syncAllBands ? 'AN' : 'AUS');

            if (syncAllBands && window.audioReactiveEngine) {
                // Alle LED-Bänder synchronisieren
                window.audioReactiveEngine.ledStrips.forEach(strip => {
                    strip.enabled = true;
                    strip.reactTo = 'all';
                });
            }
        });
    }

    // Start Button - Audio-Element übergeben (KEIN Mikrofon)
    if (startBtn) {
        startBtn.addEventListener('click', async function () {
            const audioElement = document.querySelector('audio');

            if (!audioElement) {
                if (window.showGlobalNotification) {
                    window.showGlobalNotification('Kein Audio-Element gefunden', 'warning');
                }
                console.warn('⚠️ Kein Audio-Element gefunden');
                return;
            }

            if (!window.audioReactiveEngine) {
                if (window.showGlobalNotification) {
                    window.showGlobalNotification('Audio-Reactive-Engine nicht verfügbar', 'error');
                }
                console.error('❌ Audio-Reactive-Engine nicht verfügbar');
                return;
            }

            try {
                console.log('🎵 Starte Musik-Analyse (Audio-Element, KEIN Mikrofon)...');
                const success = await window.audioReactiveEngine.startAudioCapture(audioElement);

                if (success) {
                    startBtn.style.display = 'none';
                    if (stopBtn) stopBtn.style.display = 'inline-block';

                    if (window.showGlobalNotification) {
                        window.showGlobalNotification('Musik-Analyse gestartet', 'success');
                    }
                    console.log('✅ Musik-Analyse läuft');
                } else {
                    if (window.showGlobalNotification) {
                        window.showGlobalNotification('Musik-Analyse konnte nicht gestartet werden', 'error');
                    }
                }
            } catch (err) {
                console.error('❌ Fehler beim Starten:', err);
                if (window.showGlobalNotification) {
                    window.showGlobalNotification('Fehler: ' + err.message, 'error');
                }
            }
        });
    }

    // Stop Button
    if (stopBtn) {
        stopBtn.addEventListener('click', async function () {
            if (window.audioReactiveEngine) {
                await window.audioReactiveEngine.stopAudioCapture();
                stopBtn.style.display = 'none';
                if (startBtn) startBtn.style.display = 'inline-block';

                if (window.showGlobalNotification) {
                    window.showGlobalNotification('Musik-Analyse gestoppt', 'info');
                }
                console.log('⏹️ Musik-Analyse gestoppt');
            }
        });
    }

    // LED-Band Count Slider
    const ledBandCount = document.getElementById('ledBandCount');
    if (ledBandCount) {
        ledBandCount.addEventListener('input', function () {
            const count = parseInt(this.value);
            document.getElementById('ledBandCountValue').textContent = count;
            updateBandTabs(count);
        });
    }

    autoScanLEDBands();

    console.log('✅ LED-Musik-Controller initialisiert');
}

function updateBandTabs(count) {
    const tabsContainer = document.getElementById('ledBandTabs');
    if (!tabsContainer) return;

    // Behalte den Audio-Reactive Tab
    const audioReactiveTab = tabsContainer.querySelector('[data-band="audio-reactive"]');

    // Lösche alle anderen Tabs
    tabsContainer.innerHTML = '';

    // Audio-Reactive Tab wieder hinzufügen
    if (audioReactiveTab) {
        tabsContainer.appendChild(audioReactiveTab);
    }

    // Füge die LED-Band Tabs hinzu
    for (let i = 0; i < count; i++) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'led-band-tab';
        tab.dataset.band = i;
        tab.style.cssText = 'padding: 12px 20px; background: rgba(255, 190, 11, 0.2); border: 1px solid #FFBE0B; color: white; border-radius: 8px; cursor: pointer;';

        const indicator = document.createElement('span');
        indicator.style.cssText = 'display: inline-block; width: 12px; height: 12px; background: #FFBE0B; border-radius: 50%; margin-right: 8px;';

        tab.appendChild(indicator);
        tab.appendChild(document.createTextNode(' LED-Band ' + (i + 1)));

        tab.addEventListener('click', function () {
            // Alle Tabs deaktivieren
            document.querySelectorAll('.led-band-tab').forEach(t => t.classList.remove('active'));
            // Diesen Tab aktivieren
            this.classList.add('active');
            // Content anzeigen
            showBandContent(i);
        });

        tabsContainer.appendChild(tab);
    }

    console.log(`📊 ${count} LED-Band Tabs erstellt`);
}

function showBandContent(bandIndex) {
    // Alle Band-Contents verstecken
    document.querySelectorAll('.led-band-content').forEach(content => {
        content.style.display = 'none';
    });

    // Spezifischen Band-Content anzeigen
    const content = document.getElementById(`ledBandContent-${bandIndex}`);
    if (content) {
        content.style.display = 'block';
    } else {
        // Content erstellen wenn nicht vorhanden
        createBandContent(bandIndex);
    }

    console.log(`📺 Zeige LED-Band ${bandIndex + 1} Content`);
}

function createBandContent(bandIndex) {
    // Erstelle Content für dieses spezifische LED-Band
    const container = document.querySelector('.led-music-control-content');
    if (!container) return;

    const content = document.createElement('div');
    content.id = `ledBandContent-${bandIndex}`;
    content.className = 'led-band-content';
    content.style.cssText = 'display: block; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 15px; margin-top: 20px;';

    content.innerHTML = `
        <h3 style="color: #FFBE0B; margin-bottom: 20px;">LED-Band ${bandIndex + 1} Einstellungen</h3>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Effekt:</label>
            <select id="band${bandIndex}_effect" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 8px;">
                <option value="none">Kein Effekt</option>
                <option value="pulse">Pulsieren</option>
                <option value="wave">Welle</option>
                <option value="strobe">Stroboskop</option>
                <option value="fade">Fade</option>
            </select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Frequenzband:</label>
            <select id="band${bandIndex}_freq" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 8px;">
                <option value="bass">Tiefe (Bass)</option>
                <option value="mid">Mitte</option>
                <option value="high">Höhen</option>
                <option value="all">Alle</option>
            </select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Reagiert auf:</label>
            <select id="band${bandIndex}_reactTo" style="width: 100%; padding: 10px; background: #333; color: white; border: 1px solid #555; border-radius: 8px;">
                <option value="rhythm">Rhythmus</option>
                <option value="beats">Beats/Takt</option>
                <option value="vocals">Gesang</option>
                <option value="melody">Melodie</option>
            </select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Farbe:</label>
            <input type="color" id="band${bandIndex}_color" value="#4ecdc4" style="width: 100%; height: 50px; border: none; border-radius: 8px; cursor: pointer;">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Helligkeit: <span id="band${bandIndex}_brightness_value">100</span>%</label>
            <input type="range" id="band${bandIndex}_brightness" min="0" max="100" value="100" style="width: 100%;">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px; color: #4ecdc4;">Empfindlichkeit: <span id="band${bandIndex}_sensitivity_value">50</span>%</label>
            <input type="range" id="band${bandIndex}_sensitivity" min="0" max="100" value="50" style="width: 100%;">
        </div>
    `;

    container.appendChild(content);

    // Event-Listener für die Controls hinzufügen
    const brightnessSlider = document.getElementById(`band${bandIndex}_brightness`);
    const sensitivitySlider = document.getElementById(`band${bandIndex}_sensitivity`);

    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', function () {
            document.getElementById(`band${bandIndex}_brightness_value`).textContent = this.value;
        });
    }

    if (sensitivitySlider) {
        sensitivitySlider.addEventListener('input', function () {
            document.getElementById(`band${bandIndex}_sensitivity_value`).textContent = this.value;
        });
    }
}

// Global Export
window.initLEDMusicControls = initLEDMusicControls;
window.updateBandTabs = updateBandTabs;
window.showBandContent = showBandContent;
window.autoScanLEDBands = autoScanLEDBands;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLEDMusicControls);
} else {
    initLEDMusicControls();
}

// console.log('✅ LED-Musik-Controller geladen');

// ========== HARDWARE-INTEGRATION (aus Inline-JS übernommen) ==========
let ledMusicAudioContext = null;
let ledMusicAnalyser = null;
let ledMusicDataArray = null;
let ledMusicAnimationFrame = null;
let ledMusicMode = "spectrum";
let ledMusicActive = false;

/**
 * Startet die LED-Musik-Analyse mit AudioContext
 */
async function startLEDMusicAnalysis() {
    try {
        // Audio Context erstellen falls noch nicht vorhanden
        if (!ledMusicAudioContext) {
            ledMusicAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Analyser erstellen
        if (!ledMusicAnalyser) {
            ledMusicAnalyser = ledMusicAudioContext.createAnalyser();
            ledMusicAnalyser.fftSize = 128;
            const bufferLength = ledMusicAnalyser.frequencyBinCount;
            ledMusicDataArray = new Uint8Array(bufferLength);
        }

        // Mit Audio-Element verbinden falls vorhanden
        const audioElement = document.querySelector("audio");
        if (audioElement && ledMusicAudioContext.state !== "running") {
            const source = ledMusicAudioContext.createMediaElementSource(audioElement);
            source.connect(ledMusicAnalyser);
            ledMusicAnalyser.connect(ledMusicAudioContext.destination);
        }

        ledMusicActive = true;
        ledMusicVisualize();
        console.log("LED-Musik-Analyse gestartet");
    } catch (error) {
        console.error("LED-Musik-Analyse Fehler:", error);
    }
}

/**
 * Visualisierungs-Loop
 */
async function ledMusicVisualize() {
    if (!ledMusicActive || !ledMusicAnalyser) return;

    ledMusicAnimationFrame = requestAnimationFrame(ledMusicVisualize);
    ledMusicAnalyser.getByteFrequencyData(ledMusicDataArray);

    // Frequenzbänder berechnen (Bass, Mid, Treble)
    const bass = ledMusicDataArray.slice(0, 80).reduce((a, b) => a + b, 0) / 80;
    const mid = ledMusicDataArray.slice(80, 160).reduce((a, b) => a + b, 0) / 80;
    const treble = ledMusicDataArray.slice(160, 256).reduce((a, b) => a + b, 0) / 96;

    // Echte Hardware LED-Steuern basierend auf Audio
    // Nutzt window.ledDevice oder window.bleController
    const device = window.ledDevice || (window.parent && window.parent.ledDevice);

    if (device && device.isConnected) {
        try {
            // Konvertiere Audio-Frequenzen zu RGB
            const r = Math.floor((bass / 255) * 255);
            const g = Math.floor((mid / 255) * 255);
            const b = Math.floor((treble / 255) * 255);

            // Sende echte Hardware-Befehle (Hex: 7E 00 05 R G B 00 EF)
            const cmd = new Uint8Array([0x7E, 0x00, 0x05, r, g, b, 0x00, 0xEF]);

            if (device.characteristic) {
                await device.characteristic.writeValue(cmd);
            }
        } catch (err) {
            // Silent fail bei schnellen Updates
        }
    }
}

/**
 * Setzt den LED-Musik-Modus
 */
function setLEDMusicMode(mode) {
    ledMusicMode = mode;
    console.log("LED-Musik-Modus:", mode);

    // Visuelles Feedback
    const buttons = document.querySelectorAll(".led-music-control-content .preset-btn");
    buttons.forEach((btn) => {
        if (btn.textContent.toLowerCase().includes(mode)) {
            btn.style.transform = "scale(1.05)";
            setTimeout(() => (btn.style.transform = "scale(1)"), 200);
        }
    });
}

// LED-Music-Controller Objekt für HTML-Zugriff
const LEDMusicController = {
    enabled: false,
    toggle: function (enabled) {
        this.enabled = enabled;
        ledMusicEnabled = enabled;
        console.log('🎵 LED-Musik-Steuerung:', enabled ? 'AN' : 'AUS');

        if (enabled && window.audioReactiveEngine) {
            const audio = document.querySelector('audio');
            if (audio) {
                window.audioReactiveEngine.startAudioCapture(audio);
            }
        } else if (!enabled && window.audioReactiveEngine) {
            window.audioReactiveEngine.stopAudioCapture();
        }

        if (window.showGlobalNotification) {
            window.showGlobalNotification('LED-Musik ' + (enabled ? 'aktiviert' : 'deaktiviert'), enabled ? 'success' : 'info');
        }
    }
};

// Exportiere Funktionen
window.LEDMusicController = LEDMusicController;
window.startLEDMusicAnalysis = startLEDMusicAnalysis;
window.setLEDMusicMode = setLEDMusicMode;
window.renderFoundLEDBands = renderFoundLEDBands;
window.configureLEDBandForMusic = configureLEDBandForMusic;
