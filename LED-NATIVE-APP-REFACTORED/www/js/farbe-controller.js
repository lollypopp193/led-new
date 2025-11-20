/**
 * FARBE-CONTROLLER.JS
 * Alle Farb-Steuerungs-Funktionen aus Farbe.html - KEIN Inline-JS
 */
'use strict';

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let currentMode = 'rainbow';
let currentColor = { r: 255, g: 0, b: 0 };

function getLEDController() {
    if (window.parent && window.parent !== window && window.parent.bleController) {
        console.log('🔗 Verwende Parent bleController');
        return window.parent.bleController;
    }
    if (window.bleController) {
        console.log('🔗 Verwende lokalen bleController');
        return window.bleController;
    }
    console.error('❌ KRITISCH: Kein bleController gefunden!');
    return null;
}

function isConnected() {
    const controller = getLEDController();
    if (controller) {
        return controller.isConnected;
    }
    return false;
}

async function initBLE() {
    const controller = getLEDController();
    if (controller) {
        console.log('✅ Zentrale BLE-Controller gefunden');
    } else {
        console.warn('⚠️ BLE-Controller nicht verfügbar - bitte in Hauptseite verbinden');
    }
}

async function sendColorToBLE(r, g, b) {
    try {
        if (window.parent && window.parent.sendColorToLED) {
            const success = await window.parent.sendColorToLED(r, g, b);
            if (success) {
                console.log(`🎨 ✅ ECHTE Hardware-Farbe gesendet: RGB(${r}, ${g}, ${b})`);
                if (window.showNotification) {
                    window.showNotification(`LED-Farbe gesetzt: RGB(${r}, ${g}, ${b})`, 'success');
                }
                return true;
            } else {
                console.warn('⚠️ Bluetooth nicht verbunden');
                if (window.showNotification) {
                    window.showNotification('Bitte erst Bluetooth in Einstellungen verbinden!', 'warning');
                }
                return false;
            }
        }

        if (window.bleController && window.bleController.isConnected) {
            const success = await window.bleController.setColorRGB(r, g, b);
            if (success) {
                console.log(`🎨 ✅ Direkt: Hardware-Farbe gesendet: RGB(${r}, ${g}, ${b})`);
                if (window.showNotification) {
                    window.showNotification(`LED-Farbe gesetzt: RGB(${r}, ${g}, ${b})`, 'success');
                }
                return true;
            }
        }

        console.error('❌ KRITISCH: Keine Bluetooth-Verbindung!');
        if (window.showNotification) {
            window.showNotification('FEHLER: Bluetooth nicht verbunden! Bitte in Einstellungen verbinden.', 'error');
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
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
        selectColorAtPosition(mockEvent);
    });

    colorWheel.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (isDragging) {
            const touch = e.touches[0];
            const mockEvent = {
                clientX: touch.clientX,
                clientY: touch.clientY
            };
            selectColorAtPosition(mockEvent);
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
            console.log('🎨 Farbkreis-Klick - currentColor gesetzt:', currentColor);

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
    }
}

function renderColorSlots() {
    const slots = loadColorSlots();
    document.querySelectorAll('.color-slot').forEach((slot) => {
        const index = parseInt(slot.dataset.slot);
        const color = slots[index];
        if (color) {
            slot.style.background = `rgb(${color.r}, ${color.g}, ${color.b})`;
            slot.classList.add('filled');
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

function initFarbeController() {
    initBLE();
    initColorWheel();
    initColorSlots();
    console.log('✅ Farbe-Controller initialisiert');
}

// Global Export
window.escapeHtml = escapeHtml;
window.getLEDController = getLEDController;
window.isConnected = isConnected;
window.initBLE = initBLE;
window.sendColorToBLE = sendColorToBLE;
window.applyColor = applyColor;
window.getColorFromPosition = getColorFromPosition;
window.hsvToRgb = hsvToRgb;
window.currentColor = currentColor;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFarbeController);
} else {
    initFarbeController();
}

// console.log('✅ Farbe-Controller geladen');
