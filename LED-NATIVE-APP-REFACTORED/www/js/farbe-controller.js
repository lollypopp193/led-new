/**
 * FARBE-CONTROLLER.JS
 * Alle Farb-Steuerungs-Funktionen aus Farbe.html - KEIN Inline-JS
 */
'use strict';

// escapeHtml → siehe utils.js

let currentMode = 'rainbow';
let currentColor = { r: 255, g: 0, b: 0 };

// Nutze globale getLEDController falls verfügbar (aus effekt-controller.js)
// Falls nicht, definiere lokale Version
if (!window.getLEDController) {
    window.getLEDController = function () {
        const contexts = [window, window.parent, window.top];
        const names = ['bleController', 'BLEControllerPro', 'ledController'];

        for (const ctx of contexts) {
            if (!ctx) continue;
            for (const name of names) {
                try {
                    if (ctx[name]) return ctx[name];
                } catch (e) { /* Cross-origin */ }
            }
        }
        return null;
    };
}

function getLEDController() {
    return window.getLEDController();
}

function isConnected() {
    const controller = getLEDController();
    if (controller) {
        return controller.isConnected;
    }
    return false;
}

// Nutze globale initBLE aus einstellungen-controller.js falls vorhanden
// Diese lokale Funktion prüft nur die Verfügbarkeit
async function checkBLEAvailability() {
    const controller = getLEDController();
    if (controller) {
        console.log('✅ BLE-Controller verfügbar');
        return true;
    } else {
        console.warn('⚠️ BLE-Controller nicht verfügbar - bitte in Einstellungen verbinden');
        return false;
    }
}

async function sendColorToBLE(r, g, b) {
    try {
        // Suche BLE-Controller in allen Kontexten
        const controller = window.bleController ||
            (window.parent && window.parent.bleController) ||
            (window.top && window.top.bleController);

        if (controller && controller.isConnected) {
            const success = await controller.setColorRGB(r, g, b);
            if (success) {
                console.log(`🎨 Hardware-Farbe gesendet: RGB(${r}, ${g}, ${b})`);
                if (window.showNotification) {
                    window.showNotification(`LED-Farbe gesetzt: RGB(${r}, ${g}, ${b})`, 'success');
                }
                return true;
            }
        }

        // Kein Controller oder nicht verbunden
        console.warn('⚠️ Bluetooth nicht verbunden');
        if (window.showNotification) {
            window.showNotification('Bitte erst Bluetooth in Einstellungen verbinden!', 'warning');
        }
        return false;
    } catch (error) {
        console.error('❌ Hardware-Fehler:', error);
        if (window.showNotification) {
            window.showNotification(`Fehler beim Senden: ${error.message}`, 'error');
        }
        return false;
    }
}

function applyColor(r, g, b) {
    currentColor = { r, g, b };

    const colorPreview = document.getElementById('colorPreview');
    if (colorPreview) {
        colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightness = brightnessSlider ? brightnessSlider.value / 100 : 1;
    const adjustedR = Math.round(r * brightness);
    const adjustedG = Math.round(g * brightness);
    const adjustedB = Math.round(b * brightness);

    sendColorToBLE(adjustedR, adjustedG, adjustedB);
}

function initColorWheel() {
    const colorWheel = document.getElementById('colorWheel');
    const colorPointer = document.getElementById('colorPointer');

    if (!colorWheel) return;

    let isDragging = false;

    colorWheel.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;

        const distance = Math.sqrt(x * x + y * y);
        const angle = (Math.atan2(y, x) * 180) / Math.PI;

        if (distance <= 175) {
            updateColorFromClick(x, y, Math.min(distance, 175), angle, currentMode);
        }
    });

    colorWheel.addEventListener('mousedown', function (e) {
        isDragging = true;
        selectColorAtPosition(e);
    });

    colorWheel.addEventListener('mouseup', function () {
        isDragging = false;
    });

    colorWheel.addEventListener('mouseleave', function () {
        isDragging = false;
    });

    colorWheel.addEventListener('touchstart', function (e) {
        e.preventDefault();
        isDragging = true;
        const touch = e.touches[0];
        const touchPosition = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        selectColorAtPosition(touchPosition);
    });

    colorWheel.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (isDragging) {
            const touch = e.touches[0];
            const touchPosition = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            selectColorAtPosition(touchPosition);
        }
    });

    colorWheel.addEventListener('touchend', function (e) {
        e.preventDefault();
        isDragging = false;
    });
}

function selectColorAtPosition(e) {
    const colorWheel = document.getElementById('colorWheel');
    if (!colorWheel) return;

    const rect = colorWheel.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    const distance = Math.sqrt(x * x + y * y);
    const angle = (Math.atan2(y, x) * 180) / Math.PI;

    if (distance <= 175) {
        const color = getColorFromPosition(x, y, distance, angle, currentMode);
        if (color) {
            currentColor = { r: color.r, g: color.g, b: color.b };
            console.log(' Farbkreis-Klick - currentColor gesetzt:', currentColor);

            if (window.parent && window.parent.setGlobalCurrentColor) {
                window.parent.setGlobalCurrentColor(currentColor);
            }

            applyColor(color.r, color.g, color.b);

            const pointer = document.getElementById('colorPointer');
            if (pointer) {
                const clampedDistance = Math.min(distance, 175);
                const angleRad = (angle * Math.PI) / 180;
                const pointerX = Math.cos(angleRad) * clampedDistance + centerX;
                const pointerY = Math.sin(angleRad) * clampedDistance + centerY;

                pointer.style.left = pointerX - 8 + 'px';
                pointer.style.top = pointerY - 8 + 'px';
            }
        }
    }
}

function updateColorFromClick(x, y, distance, angle, mode) {
    const color = getColorFromPosition(x, y, distance, angle, mode);
    if (color) {
        applyColor(color.r, color.g, color.b);
    }
}

function getColorFromPosition(x, y, distance, angle, mode) {
    const hue = ((angle + 360) % 360) / 360;
    const saturation = Math.min(distance / 175, 1);

    const rgb = hsvToRgb(hue, saturation, 1);
    return { r: rgb.r, g: rgb.g, b: rgb.b };
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Color Slots Funktionen
function loadColorSlots() {
    try {
        const saved = localStorage.getItem('color-slots');
        return saved ? JSON.parse(saved) : {};
    } catch (err) {
        console.error('Fehler beim Laden der Farb-Slots:', err);
        return {};
    }
}

function saveColorToSlot(slotIndex, r, g, b) {
    try {
        const slots = loadColorSlots();
        slots[slotIndex] = { r, g, b };
        localStorage.setItem('color-slots', JSON.stringify(slots));
        renderColorSlots();
    } catch (err) {
        console.error('Fehler beim Speichern:', err);
    }
}

function applyColorFromSlot(slotIndex) {
    const slots = loadColorSlots();
    const color = slots[slotIndex];
    if (color) {
        currentColor = { r: color.r, g: color.g, b: color.b };
        sendColorToBLE(color.r, color.g, color.b);

        // Update Farbkreis-Vorschau
        const colorPreview = document.getElementById('colorPreview');
        if (colorPreview) {
            colorPreview.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        }
    }
}

function deleteColorFromSlot(slotIndex) {
    try {
        const slots = loadColorSlots();
        delete slots[slotIndex];
        localStorage.setItem('color-slots', JSON.stringify(slots));
        renderColorSlots();

        if (window.showNotification) {
            window.showNotification('Farbe gelöscht', 'success');
        }
    } catch (err) {
        console.error('Fehler beim Löschen:', err);
    }
}

function renderColorSlots() {
    const slots = loadColorSlots();
    document.querySelectorAll('.color-slot').forEach((slot) => {
        const index = parseInt(slot.dataset.slot);
        const color = slots[index];

        // Entferne alte Delete-Buttons
        const oldBtn = slot.querySelector('.delete-btn');
        if (oldBtn) oldBtn.remove();

        if (color) {
            slot.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
            slot.classList.add('filled');

            // Füge X-Button hinzu
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.title = 'Farbe löschen';
            deleteBtn.style.cssText = `
                position: absolute;
                top: 2px;
                right: 2px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                opacity: 0;
                transition: opacity 0.2s;
                z-index: 10;
            `;

            // X-Button nur bei Hover zeigen (Desktop) oder Touch-Start (Mobile)
            slot.addEventListener('mouseenter', () => {
                deleteBtn.style.opacity = '1';
            });
            slot.addEventListener('mouseleave', () => {
                deleteBtn.style.opacity = '0';
            });
            slot.addEventListener('touchstart', () => {
                deleteBtn.style.opacity = '1';
            }, { passive: true });

            // Click-Handler für X-Button
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Verhindere Farb-Anwendung
                if (confirm(window.i18n ? window.i18n.t('color.deleteConfirm') : 'Farbe wirklich löschen?')) {
                    deleteColorFromSlot(index);
                }
            });

            slot.appendChild(deleteBtn);
        } else {
            slot.style.background = 'rgba(255, 255, 255, 0.1)';
            slot.classList.remove('filled');
        }
    });
}

function initColorSlots() {
    renderColorSlots();

    document.querySelectorAll('.color-slot').forEach((slot) => {
        let pressTimer;

        // Touch Start / Mouse Down - Long Press Timer starten
        const startPress = (e) => {
            const index = parseInt(slot.dataset.slot);
            const slots = loadColorSlots();

            if (slots[index]) {
                // Nur bei gefüllten Slots: Long Press zum Löschen
                pressTimer = setTimeout(() => {
                    // Nach 800ms: Farbe löschen
                    deleteColorFromSlot(index);
                    if (window.navigator.vibrate) {
                        window.navigator.vibrate(50); // Kurzes Vibrationsfeedback
                    }
                }, 800);
            }
        };

        // Touch End / Mouse Up - Timer abbrechen
        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        };

        // Click - Farbe anwenden oder speichern (nur bei kurzem Tap)
        slot.addEventListener('click', () => {
            const index = parseInt(slot.dataset.slot);
            const slots = loadColorSlots();

            if (slots[index]) {
                // Slot ist gefüllt - Farbe anwenden
                applyColorFromSlot(index);
            } else {
                // Slot ist leer - aktuelle Farbe speichern
                saveColorToSlot(index, currentColor.r, currentColor.g, currentColor.b);
            }
        });

        // Touch Events für Mobile
        slot.addEventListener('touchstart', startPress);
        slot.addEventListener('touchend', cancelPress);
        slot.addEventListener('touchmove', cancelPress);

        // Mouse Events für Desktop (Rechtsklick bleibt als Alternative)
        slot.addEventListener('mousedown', startPress);
        slot.addEventListener('mouseup', cancelPress);
        slot.addEventListener('mouseleave', cancelPress);

        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const index = parseInt(slot.dataset.slot);
            const slots = loadColorSlots();
            if (slots[index]) {
                deleteColorFromSlot(index);
            }
        });
    });
}

// RGB-Popup Funktionen
function openRGBPopup() {
    const popup = document.getElementById('rgbPopup');
    if (popup) {
        popup.classList.add('active');

        // Setze aktuelle Farbe in RGB-Slider
        const redSlider = document.getElementById('redSlider');
        const greenSlider = document.getElementById('greenSlider');
        const blueSlider = document.getElementById('blueSlider');

        if (redSlider) {
            redSlider.value = currentColor.r;
            document.getElementById('redValue').textContent = currentColor.r;
        }
        if (greenSlider) {
            greenSlider.value = currentColor.g;
            document.getElementById('greenValue').textContent = currentColor.g;
        }
        if (blueSlider) {
            blueSlider.value = currentColor.b;
            document.getElementById('blueValue').textContent = currentColor.b;
        }

        updateRGBPreview();
    }
}

function closeRGBPopup() {
    const popup = document.getElementById('rgbPopup');
    if (popup) {
        popup.classList.remove('active');
    }
}

function updateRGBPreview() {
    // RGB-VALIDIERUNG: Clamp Werte auf 0-255 (ZERO TOLERANCE - FIX #5)
    let r = parseInt(document.getElementById('redSlider')?.value || 0);
    let g = parseInt(document.getElementById('greenSlider')?.value || 0);
    let b = parseInt(document.getElementById('blueSlider')?.value || 0);

    // Validierung & Clamping
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // Prüfe ob Werte valid sind
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.error('❌ Ungültige RGB-Werte:', { r, g, b });
        return; // Abbruch bei ungültigen Werten
    }

    const preview = document.getElementById('rgbPreview');
    if (preview) {
        preview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    // Live-Update im Farbkreis
    const colorPreview = document.getElementById('colorPreview');
    if (colorPreview) {
        colorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }

    // Aktuelle Farbe aktualisieren
    currentColor = { r, g, b };

    // An Hardware senden (mit validierten Werten)
    sendColorToBLE(r, g, b);
}

function initRGBSliders() {
    const sliders = ['redSlider', 'greenSlider', 'blueSlider'];
    const values = ['redValue', 'greenValue', 'blueValue'];

    sliders.forEach((sliderId, index) => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(values[index]);

        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                valueDisplay.textContent = e.target.value;
                updateRGBPreview();
            });
        }
    });

    // RGB-Button Event
    const rgbBtn = document.getElementById('rgbButton');
    if (rgbBtn) {
        rgbBtn.addEventListener('click', openRGBPopup);
    }

    // Close-Button im Popup
    const popup = document.getElementById('rgbPopup');
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeRGBPopup();
            }
        });
    }
}

// Helligkeit-Slider Init
function initBrightnessSlider() {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');

    if (brightnessSlider && brightnessValue) {
        brightnessSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            brightnessValue.textContent = value + '%';

            // Farbe mit neuer Helligkeit senden
            const brightness = value / 100;
            const adjustedR = Math.round(currentColor.r * brightness);
            const adjustedG = Math.round(currentColor.g * brightness);
            const adjustedB = Math.round(currentColor.b * brightness);

            sendColorToBLE(adjustedR, adjustedG, adjustedB);
        });
    }
}

// Power-Toggle Init
function initPowerToggle() {
    const powerToggle = document.getElementById('powerToggle');
    const powerLabel = document.getElementById('powerLabel');

    if (powerToggle) {
        // Initial Label setzen
        if (powerLabel) {
            powerLabel.textContent = powerToggle.checked ? 'EIN' : 'AUS';
            powerLabel.style.color = powerToggle.checked ? '#4ecdc4' : '#888';
        }

        powerToggle.addEventListener('change', async (e) => {
            const isOn = e.target.checked;

            // Update Label
            if (powerLabel) {
                powerLabel.textContent = isOn ? 'EIN' : 'AUS';
                powerLabel.style.color = isOn ? '#4ecdc4' : '#888';
            }

            if (isOn) {
                // LED einschalten - letzte Farbe senden
                const brightness = document.getElementById('brightnessSlider')?.value || 100;
                const adjustedR = Math.round(currentColor.r * (brightness / 100));
                const adjustedG = Math.round(currentColor.g * (brightness / 100));
                const adjustedB = Math.round(currentColor.b * (brightness / 100));

                await sendColorToBLE(adjustedR, adjustedG, adjustedB);

                if (window.showNotification) {
                    window.showNotification('LED eingeschaltet', 'success');
                }
            } else {
                // LED ausschalten - RGB(0,0,0) senden
                await sendColorToBLE(0, 0, 0);

                if (window.showNotification) {
                    window.showNotification('LED ausgeschaltet', 'info');
                }
            }
        });
    }
}

// Basic-Farben-Buttons Init
function initBasicColors() {
    const basicColors = [
        { name: 'Rot', r: 255, g: 0, b: 0 },
        { name: 'Grün', r: 0, g: 255, b: 0 },
        { name: 'Blau', r: 0, g: 0, b: 255 },
        { name: 'Gelb', r: 255, g: 255, b: 0 },
        { name: 'Cyan', r: 0, g: 255, b: 255 },
        { name: 'Magenta', r: 255, g: 0, b: 255 },
        { name: 'Weiß', r: 255, g: 255, b: 255 },
        { name: 'Orange', r: 255, g: 165, b: 0 }
    ];

    const colorPresets = document.querySelectorAll('.preset-color');
    colorPresets.forEach((btn, index) => {
        if (basicColors[index]) {
            btn.addEventListener('click', () => {
                const color = basicColors[index];
                currentColor = { r: color.r, g: color.g, b: color.b };

                // Update Vorschau
                const colorPreview = document.getElementById('colorPreview');
                if (colorPreview) {
                    colorPreview.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
                }

                // Farbe senden
                const brightness = document.getElementById('brightnessSlider')?.value || 100;
                const adjustedR = Math.round(color.r * (brightness / 100));
                const adjustedG = Math.round(color.g * (brightness / 100));
                const adjustedB = Math.round(color.b * (brightness / 100));

                sendColorToBLE(adjustedR, adjustedG, adjustedB);
            });
        }
    });
}

/**
 * Side-Panel öffnen (Erweiterte Einstellungen)
 */
function openSidePanel() {
    const panel = document.getElementById('sidePanel');
    if (panel) {
        panel.classList.add('active');
    }
}

/**
 * Side-Panel schließen
 */
function closeSidePanel() {
    const panel = document.getElementById('sidePanel');
    if (panel) {
        panel.classList.remove('active');
    }
}

/**
 * Side-Panel toggle
 */
function toggleSidePanel() {
    const panel = document.getElementById('sidePanel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

/**
 * Side-Panel initialisieren
 */
function initSidePanel() {
    // Close-Button
    const closeBtn = document.getElementById('closePanelBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidePanel);
    }

    // Einstellungen-Button (falls vorhanden)
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSidePanel);
    }

    // Preset-Farben im Side-Panel aktivieren
    const panelPresets = document.querySelectorAll('.side-panel .preset-color');
    panelPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            const bgColor = getComputedStyle(preset).backgroundColor;
            const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const r = parseInt(match[1]);
                const g = parseInt(match[2]);
                const b = parseInt(match[3]);
                applyColor(r, g, b);
            }
        });
    });

    // Temperatur-Slider
    const tempSlider = document.getElementById('temperatureSlider');
    if (tempSlider) {
        tempSlider.addEventListener('input', (e) => {
            const kelvin = parseInt(e.target.value);
            const rgb = kelvinToRgb(kelvin);
            applyColor(rgb.r, rgb.g, rgb.b);

            const tempValue = document.getElementById('temperatureValue');
            if (tempValue) tempValue.textContent = kelvin + 'K';
        });
    }
}

/**
 * Kelvin zu RGB konvertieren
 */
function kelvinToRgb(kelvin) {
    const temp = kelvin / 100;
    let r, g, b;

    if (temp <= 66) {
        r = 255;
        g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
    } else {
        r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
        g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
    }

    if (temp >= 66) {
        b = 255;
    } else if (temp <= 19) {
        b = 0;
    } else {
        b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
    }

    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

function initFarbeController() {
    initBLE();
    // Beim Öffnen der Farbe-Seite: Stoppe alle laufenden Effekte
    stopAllEffects();

    initColorWheel();
    initColorSlots();
    initRGBSliders();
    initBrightnessSlider();
    initPowerToggle();
    initBasicColors();
    initSidePanel();

    // Szenen laden
    if (window.scenesManager) {
        renderScenes();
    }

    // Event Listener für Buttons (ersetzt inline onclick)
    const createSceneBtn = document.getElementById('createSceneBtn');
    if (createSceneBtn) {
        createSceneBtn.addEventListener('click', createSceneFromCurrent);
    }

    const moreSettingsBtn = document.getElementById('moreSettingsBtn');
    if (moreSettingsBtn) {
        moreSettingsBtn.addEventListener('click', () => {
            document.getElementById('sidePanel').classList.add('active');
        });
    }

    const closePanelBtn = document.getElementById('closePanelBtn');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            document.getElementById('sidePanel').classList.remove('active');
        });
    }

    console.log('✅ Farbe-Controller vollständig initialisiert');
}

/**
 * Stoppt alle laufenden Effekte wenn man zur Farbe-Seite wechselt
 */
function stopAllEffects() {
    try {
        // Stoppe Effekte im Parent (Hauptfenster)
        if (window.parent && window.parent !== window) {
            if (window.parent.App && window.parent.App.state) {
                window.parent.App.state.currentEffect = null;
            }
            if (window.parent.stopCurrentEffect) {
                window.parent.stopCurrentEffect();
            }
        }

        // Stoppe lokale Effekte
        if (window.stopCurrentEffect) {
            window.stopCurrentEffect();
        }

        // Informiere BLE Controller
        const controller = getLEDController();
        if (controller && controller.stopEffect) {
            controller.stopEffect();
        }

        console.log('🛑 Alle Effekte gestoppt (Wechsel zu Farbe)');
    } catch (e) {
        console.error('Fehler beim Stoppen:', e);
    }
}

// === SZENEN-VERWALTUNG ===
function createSceneFromCurrent() {
    const name = prompt('Szenen-Name:');
    if (!name) return;

    const scenesManager = window.scenesManager;
    if (!scenesManager) {
        showNotification('Szenen-Manager nicht verfügbar', 'error');
        return;
    }

    const data = {
        name: name,
        description: '',
        color: currentColor || { r: 255, g: 255, b: 255 },
        brightness: parseInt(document.getElementById('brightnessSlider')?.value || 100),
        effect: 0,
        speed: 50,
        devices: [],
        favorite: false,
        category: 'Custom'
    };

    try {
        scenesManager.createScene(data, false);
        renderScenes();
        showNotification('✅ Szene "' + name + '" gespeichert!', 'success');
    } catch (e) {
        console.error('Szene erstellen:', e);
        showNotification('Fehler beim Erstellen', 'error');
    }
}

function renderScenes() {
    const scenesManager = window.scenesManager;
    if (!scenesManager) return;

    const grid = document.getElementById('scenesGrid');
    const empty = document.getElementById('scenesEmpty');
    if (!grid) return;

    const scenes = scenesManager.getAllScenes() || [];

    if (scenes.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    grid.innerHTML = scenes.map(function (scene) {
        const bgColor = 'rgb(' + scene.color.r + ',' + scene.color.g + ',' + scene.color.b + ')';
        return '<div class="scene-card" style="background: linear-gradient(135deg, ' + bgColor + ', rgba(0,0,0,0.3)); padding: 15px; border-radius: 12px; cursor: pointer; position: relative; border: 2px solid rgba(78, 205, 196, 0.2); transition: all 0.3s;" onclick="activateScene(\'' + scene.id + '\')" onmouseenter="this.style.transform=\'scale(1.05)\'; this.style.boxShadow=\'0 5px 20px rgba(78, 205, 196, 0.4)\';" onmouseleave="this.style.transform=\'scale(1)\'; this.style.boxShadow=\'none\';">' +
            '<div style="font-weight: 700; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 8px;">' + scene.name + '</div>' +
            '<div style="display: flex; gap: 5px; align-items: center; font-size: 0.75rem; color: rgba(255,255,255,0.8);"><i class="fas fa-adjust"></i>' + scene.brightness + '%</div>' +
            '<button onclick="event.stopPropagation(); deleteScene(\'' + scene.id + '\');" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); border: none; color: #ff6b6b; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;"><i class="fas fa-trash"></i></button>' +
            '</div>';
    }).join('');
}

function activateScene(sceneId) {
    const scenesManager = window.scenesManager;
    if (!scenesManager) return;

    scenesManager.activateScene(sceneId).then(function (success) {
        if (success) {
            const scene = scenesManager.getScene(sceneId);
            if (scene) {
                showNotification(' Szene "' + scene.name + '" aktiviert', 'success');
            }
        }
    });
}

function deleteScene(sceneId) {
    if (!confirm('Szene wirklich löschen?')) return;

    const scenesManager = window.scenesManager;
    if (!scenesManager) return;

    try {
        scenesManager.deleteScene(sceneId);
        renderScenes();
        showNotification(' Szene gelöscht', 'success');
    } catch (e) {
        console.error('Szene löschen:', e);
        showNotification('Fehler beim Löschen', 'error');
    }
}

// Export ALL kritischen Funktionen
window.getLEDController = getLEDController;
window.isConnected = isConnected;
window.initBLE = initBLE;
window.sendColorToBLE = sendColorToBLE;
window.applyColor = applyColor;
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.toggleSidePanel = toggleSidePanel;
window.kelvinToRgb = kelvinToRgb;
window.getColorFromPosition = getColorFromPosition;
window.hsvToRgb = hsvToRgb;
window.currentColor = currentColor;
window.openRGBPopup = openRGBPopup;
window.closeRGBPopup = closeRGBPopup;
window.deleteColorFromSlot = deleteColorFromSlot;
window.stopAllEffects = stopAllEffects;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFarbeController);
} else {
    initFarbeController();
}

// console.log(' Farbe-Controller geladen');

// Color Presets speichern
function saveColorPresets() {
    try {
        const presets = [
            { name: 'Rot', r: 255, g: 0, b: 0 },
            { name: 'Grün', r: 0, g: 255, b: 0 },
            { name: 'Blau', r: 0, g: 0, b: 255 },
            { name: 'Gelb', r: 255, g: 255, b: 0 },
            { name: 'Cyan', r: 0, g: 255, b: 255 },
            { name: 'Magenta', r: 255, g: 0, b: 255 },
            { name: 'Weiß', r: 255, g: 255, b: 255 },
            { name: 'Orange', r: 255, g: 165, b: 0 }
        ];

        // Lese custom presets falls vorhanden
        const customPresets = JSON.parse(localStorage.getItem('customColorPresets') || '[]');
        const allPresets = [...presets, ...customPresets];

        localStorage.setItem('colorPresets', JSON.stringify(allPresets));
        console.log(' Color Presets gespeichert');
    } catch (e) {
        console.warn(' Konnte colorPresets nicht speichern:', e);
    }
}
window.saveColorPresets = saveColorPresets;
window.createSceneFromCurrent = createSceneFromCurrent;
window.renderScenes = renderScenes;
window.activateScene = activateScene;
window.deleteScene = deleteScene;

// Initiale Presets speichern
if (!localStorage.getItem('colorPresets')) {
    saveColorPresets();
}
