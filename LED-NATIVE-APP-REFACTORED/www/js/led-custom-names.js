/**
 * LED CUSTOM NAMES v1.0
 * Ermöglicht benutzerdefinierte Namen für LED-Bänder
 */
'use strict';

class LEDCustomNames {
    constructor() {
        this.customNames = new Map();
        this.init();
    }

    init() {
        this.loadCustomNames();
        console.log('✅ LED Custom Names initialisiert');
    }

    /**
     * Lädt gespeicherte Custom-Namen
     */
    loadCustomNames() {
        try {
            const saved = localStorage.getItem('led-custom-names');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.customNames = new Map(Object.entries(parsed));
                console.log(`📝 ${this.customNames.size} Custom-Namen geladen`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Custom-Namen:', error);
        }
    }

    /**
     * Speichert Custom-Namen
     */
    saveCustomNames() {
        try {
            const obj = Object.fromEntries(this.customNames);
            localStorage.setItem('led-custom-names', JSON.stringify(obj));
            console.log('✅ Custom-Namen gespeichert');
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
        }
    }

    /**
     * Setzt Custom-Namen für ein LED-Band
     * @param {string} deviceId - Device ID
     * @param {string} customName - Benutzerdefinierter Name
     */
    setCustomName(deviceId, customName) {
        if (!deviceId) {
            console.warn('Keine Device ID angegeben');
            return false;
        }

        if (!customName || customName.trim() === '') {
            // Entferne Custom-Namen
            this.customNames.delete(deviceId);
        } else {
            this.customNames.set(deviceId, customName.trim());
        }

        this.saveCustomNames();
        console.log(`📝 Custom-Name gesetzt: ${deviceId} → ${customName}`);

        // Update UI
        this.updateUI(deviceId);

        return true;
    }

    /**
     * Gibt Custom-Namen zurück oder Original-Namen
     * @param {string} deviceId - Device ID
     * @param {string} originalName - Original Device-Name
     * @returns {string}
     */
    getName(deviceId, originalName) {
        return this.customNames.get(deviceId) || originalName || 'Unbekanntes Band';
    }

    /**
     * Zeigt Dialog zum Umbenennen
     * @param {string} deviceId - Device ID
     * @param {string} currentName - Aktueller Name
     */
    showRenameDialog(deviceId, currentName) {
        // Entferne existierenden Dialog
        const existingDialog = document.getElementById('renameDialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        // Erstelle Dialog
        const dialog = document.createElement('div');
        dialog.id = 'renameDialog';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 100000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        dialog.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                border: 1px solid rgba(255, 215, 0, 0.3);
                max-width: 400px;
                width: 90%;
            ">
                <h3 style="
                    margin: 0 0 20px 0;
                    color: #FFD700;
                    font-size: 20px;
                    text-align: center;
                ">✏️ Band umbenennen</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #ccc;
                        font-size: 14px;
                    ">Original-Name:</label>
                    <div style="
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        color: #888;
                        font-size: 14px;
                    ">${currentName}</div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="
                        display: block;
                        margin-bottom: 8px;
                        color: #ccc;
                        font-size: 14px;
                    ">Neuer Name:</label>
                    <input 
                        type="text" 
                        id="customNameInput"
                        placeholder="z.B. Wohnzimmer, Schlafzimmer..."
                        value="${this.getName(deviceId, '')}"
                        maxlength="30"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 2px solid rgba(255, 215, 0, 0.3);
                            border-radius: 8px;
                            background: rgba(255, 255, 255, 0.05);
                            color: white;
                            font-size: 16px;
                            outline: none;
                            box-sizing: border-box;
                        "
                    />
                </div>

                <div style="
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                ">
                    <button id="cancelRenameBtn" style="
                        padding: 10px 20px;
                        border: 2px solid #888;
                        border-radius: 8px;
                        background: transparent;
                        color: #888;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                    ">Abbrechen</button>
                    <button id="saveRenameBtn" style="
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        background: linear-gradient(135deg, #FFD700, #FFA500);
                        color: #1a1a1a;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                    ">💾 Speichern</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Focus Input
        const input = document.getElementById('customNameInput');
        input.focus();
        input.select();

        // Event Listeners
        document.getElementById('saveRenameBtn').addEventListener('click', () => {
            const newName = input.value.trim();
            this.setCustomName(deviceId, newName);
            dialog.remove();

            if (window.showGlobalNotification) {
                window.showGlobalNotification(
                    `✓ "${newName}" gespeichert`,
                    'success'
                );
            }
        });

        document.getElementById('cancelRenameBtn').addEventListener('click', () => {
            dialog.remove();
        });

        // Enter zum Speichern
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('saveRenameBtn').click();
            }
        });

        // ESC zum Schließen
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
            }
        });
    }

    /**
     * Update UI nach Name-Änderung
     */
    updateUI(deviceId) {
        // Update LED-Sidebar if exists
        if (window.LEDSidebar && window.LEDSidebar.updateBandName) {
            window.LEDSidebar.updateBandName(deviceId);
        }

        // Update any band cards
        const bandCards = document.querySelectorAll(`[data-device-id="${deviceId}"]`);
        bandCards.forEach(card => {
            const nameElement = card.querySelector('.band-name, .device-name');
            if (nameElement) {
                const originalName = card.dataset.originalName || 'LED Band';
                nameElement.textContent = this.getName(deviceId, originalName);
            }
        });
    }

    /**
     * Fügt Rename-Button zu Band-Card hinzu
     * @param {HTMLElement} card - Band Card Element
     * @param {string} deviceId - Device ID
     * @param {string} deviceName - Device Name
     */
    addRenameButton(card, deviceId, deviceName) {
        if (!card || !deviceId) return;

        // Prüfe ob Button bereits existiert
        if (card.querySelector('.rename-btn')) return;

        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-btn';
        renameBtn.innerHTML = '✏️';
        renameBtn.title = 'Umbenennen';
        renameBtn.style.cssText = `
            padding: 6px 10px;
            border: none;
            border-radius: 6px;
            background: rgba(255, 215, 0, 0.2);
            color: #FFD700;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
        `;

        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRenameDialog(deviceId, deviceName);
        });

        renameBtn.addEventListener('mouseenter', () => {
            renameBtn.style.background = 'rgba(255, 215, 0, 0.4)';
        });

        renameBtn.addEventListener('mouseleave', () => {
            renameBtn.style.background = 'rgba(255, 215, 0, 0.2)';
        });

        // Füge Button zur Card hinzu
        const actionsContainer = card.querySelector('.band-actions, .device-actions');
        if (actionsContainer) {
            actionsContainer.appendChild(renameBtn);
        } else {
            card.appendChild(renameBtn);
        }
    }

    /**
     * Löscht alle Custom-Namen
     */
    clearAll() {
        this.customNames.clear();
        this.saveCustomNames();
        console.log('🗑️ Alle Custom-Namen gelöscht');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('🗑️ Alle Namen zurückgesetzt', 'info');
        }
    }

    /**
     * Gibt alle Custom-Namen zurück
     */
    getAll() {
        return Object.fromEntries(this.customNames);
    }
}

// Initialize global instance
window.ledCustomNames = new LEDCustomNames();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEDCustomNames;
}

console.log('✅ LED Custom Names geladen');
