/**
 * LED-SIDEBAR.JS v1.0
 * Swipe-Sidebar von links für LED-Bänder Verwaltung & Gruppierung
 * - Alle gefundenen Bänder anzeigen
 * - Gruppen erstellen & verwalten
 * - Bänder verknüpfen/einzeln steuern
 * - Ein/Aus Toggle pro Band
 */
'use strict';

class LEDSidebar {
    constructor() {
        this.isOpen = false;
        this.bands = [];
        this.groups = [];
        this.selectedBands = [];
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.isDragging = false;

        this.init();
    }

    init() {
        this.createSidebarHTML();
        this.attachEventListeners();
        this.loadBandsFromStorage();
        this.loadGroupsFromStorage();
        this.render();
        // console.log('✅ LED-Sidebar initialisiert');
    }

    createSidebarHTML() {
        const sidebar = document.createElement('div');
        sidebar.id = 'led-sidebar';
        sidebar.className = 'led-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-overlay"></div>
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <h2><i class="fas fa-lightbulb"></i> LED-Bänder</h2>
                    <button class="sidebar-close" onclick="window.ledSidebar.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="sidebar-actions">
                    <button class="btn-secondary btn-full" onclick="window.ledSidebar.scanBands()">
                        <i class="fas fa-search"></i> Scannen
                    </button>
                    <button class="btn-primary btn-full" onclick="window.ledSidebar.createGroup()">
                        <i class="fas fa-plus"></i> Gruppe erstellen
                    </button>
                </div>

                <div class="sidebar-tabs">
                    <button class="tab-btn active" onclick="window.ledSidebar.showTab('bands')">
                        Bänder
                    </button>
                    <button class="tab-btn" onclick="window.ledSidebar.showTab('groups')">
                        Gruppen
                    </button>
                </div>

                <div class="sidebar-body">
                    <!-- Bänder Tab -->
                    <div id="bands-tab" class="tab-content active">
                        <div class="bands-list">
                            <div class="sync-controls">
                                <label class="setting-row">
                                    <span>Alle verknüpfen</span>
                                    <div class="toggle-switch small">
                                        <input type="checkbox" id="sync-all-bands" onchange="window.ledSidebar.toggleSyncAll(this.checked)">
                                        <span class="slider"></span>
                                    </div>
                                </label>
                            </div>
                            <div id="bands-container">
                                <!-- Dynamisch gefüllt -->
                            </div>
                        </div>
                    </div>

                    <!-- Gruppen Tab -->
                    <div id="groups-tab" class="tab-content">
                        <div id="groups-container">
                            <!-- Dynamisch gefüllt -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(sidebar);
    }

    attachEventListeners() {
        // Swipe-Geste von links
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            if (this.touchStartX < 30 && !this.isOpen) {
                this.isDragging = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            this.touchCurrentX = e.touches[0].clientX;
            const diff = this.touchCurrentX - this.touchStartX;
            if (diff > 50) {
                this.open();
                this.isDragging = false;
            }
        });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Overlay-Click zum Schließen
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
    }

    open() {
        this.isOpen = true;
        const sidebar = document.getElementById('led-sidebar');
        if (sidebar) {
            sidebar.classList.add('open');
        }
    }

    close() {
        this.isOpen = false;
        const sidebar = document.getElementById('led-sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    showTab(tabName) {
        // Tab-Buttons
        document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        // Tab-Content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const tab = document.getElementById(`${tabName}-tab`);
        if (tab) {
            tab.classList.add('active');
        }
    }

    async scanBands() {
        // console.log('🔍 Scanne LED-Bänder...');

        try {
            // Verwende verschiedene Scanner-Quellen
            let foundBands = [];

            // 1. LEDAutoScanner
            if (window.LEDAutoScanner && window.LEDAutoScanner.discoveredDevices) {
                foundBands = window.LEDAutoScanner.discoveredDevices;
            }

            // 2. BluetoothForegroundService
            if (window.BluetoothForegroundService && window.BluetoothForegroundService.getSavedDevices) {
                const saved = await window.BluetoothForegroundService.getSavedDevices();
                foundBands = foundBands.concat(saved);
            }

            // 3. BLEControllerPro
            if (window.BLEControllerPro && window.BLEControllerPro.getDiscoveredDevices) {
                const discovered = window.BLEControllerPro.getDiscoveredDevices();
                foundBands = foundBands.concat(discovered);
            }

            // 4. Device Manager
            if (window.deviceManager && window.deviceManager.getAllDevices) {
                const devices = window.deviceManager.getAllDevices();
                foundBands = foundBands.concat(devices);
            }

            // Duplikate entfernen
            const uniqueBands = [];
            const seenIds = new Set();
            foundBands.forEach(band => {
                const id = band.id || band.deviceId || band.address;
                if (id && !seenIds.has(id)) {
                    seenIds.add(id);
                    uniqueBands.push({
                        id: id,
                        name: band.name || 'Unbekannt',
                        connected: band.connected || false,
                        type: band.type || 'LED',
                        enabled: true
                    });
                }
            });

            this.bands = uniqueBands;
            this.saveBandsToStorage();
            this.renderBands();

            if (window.showGlobalNotification) {
                window.showGlobalNotification(`${this.bands.length} LED-Bänder gefunden`, 'success');
            }
        } catch (error) {
            console.error('❌ Scan-Fehler:', error);
            if (window.showGlobalNotification) {
                window.showGlobalNotification('Scan fehlgeschlagen', 'error');
            }
        }
    }

    renderBands() {
        const container = document.getElementById('bands-container');
        if (!container) return;

        if (this.bands.length === 0) {
            container.innerHTML = '<p class="empty-state">Keine LED-Bänder gefunden<br><small>Tippe auf "Scannen"</small></p>';
            return;
        }

        container.innerHTML = this.bands.map((band, index) => `
            <div class="band-card ${band.connected ? 'connected' : ''}" data-band-id="${band.id}">
                <div class="band-info">
                    <i class="fas fa-lightbulb" style="color: ${band.connected ? '#2ecc71' : '#95a5a6'}"></i>
                    <div>
                        <h4>${band.name}</h4>
                        <span class="band-status">${band.connected ? 'Verbunden' : 'Getrennt'}</span>
                    </div>
                </div>
                <div class="band-controls">
                    <div class="toggle-switch small">
                        <input type="checkbox" id="band-${index}" ${band.enabled ? 'checked' : ''} 
                               onchange="window.ledSidebar.toggleBand('${band.id}', this.checked)">
                        <span class="slider"></span>
                    </div>
                    <button class="btn-icon" onclick="window.ledSidebar.editBand('${band.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="window.ledSidebar.removeBand('${band.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderGroups() {
        const container = document.getElementById('groups-container');
        if (!container) return;

        if (this.groups.length === 0) {
            container.innerHTML = '<p class="empty-state">Keine Gruppen vorhanden<br><small>Tippe auf "Gruppe erstellen"</small></p>';
            return;
        }

        container.innerHTML = this.groups.map(group => `
            <div class="group-card">
                <div class="group-header">
                    <h3><i class="fas fa-layer-group"></i> ${group.name}</h3>
                    <div class="toggle-switch small">
                        <input type="checkbox" id="group-${group.id}" ${group.enabled ? 'checked' : ''}
                               onchange="window.ledSidebar.toggleGroup('${group.id}', this.checked)">
                        <span class="slider"></span>
                    </div>
                </div>
                <div class="group-bands">
                    ${group.bandIds.map(bandId => {
            const band = this.bands.find(b => b.id === bandId);
            return band ? `<span class="band-tag">${band.name}</span>` : '';
        }).join('')}
                </div>
                <div class="group-actions">
                    <button class="btn-text" onclick="window.ledSidebar.editGroup('${group.id}')">
                        <i class="fas fa-edit"></i> Bearbeiten
                    </button>
                    <button class="btn-text" onclick="window.ledSidebar.deleteGroup('${group.id}')">
                        <i class="fas fa-trash"></i> Löschen
                    </button>
                </div>
            </div>
        `).join('');
    }

    render() {
        this.renderBands();
        this.renderGroups();
    }

    toggleBand(bandId, enabled) {
        const band = this.bands.find(b => b.id === bandId);
        if (band) {
            band.enabled = enabled;
            this.saveBandsToStorage();

            // Sende Befehl an Band
            if (window.ledController && band.connected) {
                if (enabled) {
                    window.ledController.turnOn();
                } else {
                    window.ledController.turnOff();
                }
            }
        }
    }

    toggleSyncAll(enabled) {
        this.bands.forEach(band => {
            band.enabled = enabled;
            const checkbox = document.getElementById(`band-${this.bands.indexOf(band)}`);
            if (checkbox) {
                checkbox.checked = enabled;
            }
        });
        this.saveBandsToStorage();
    }

    toggleGroup(groupId, enabled) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.enabled = enabled;
            this.saveGroupsToStorage();

            // Alle Bänder in Gruppe aktivieren/deaktivieren
            group.bandIds.forEach(bandId => {
                this.toggleBand(bandId, enabled);
            });
        }
    }

    createGroup() {
        const name = prompt('Gruppenname:');
        if (!name) return;

        const group = {
            id: 'group_' + Date.now(),
            name: name,
            bandIds: [],
            enabled: true,
            createdAt: Date.now()
        };

        this.groups.push(group);
        this.saveGroupsToStorage();
        this.renderGroups();
        this.showTab('groups');
    }

    editBand(bandId) {
        const band = this.bands.find(b => b.id === bandId);
        if (!band) return;

        const newName = prompt('Neuer Name:', band.name);
        if (newName) {
            band.name = newName;
            this.saveBandsToStorage();
            this.renderBands();
        }
    }

    removeBand(bandId) {
        if (!confirm('Band wirklich entfernen?')) return;

        this.bands = this.bands.filter(b => b.id !== bandId);
        this.saveBandsToStorage();
        this.renderBands();
    }

    editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Modal erstellen
        const modal = document.createElement('div');
        modal.className = 'edit-group-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #1a1a2e; border-radius: 16px; padding: 20px;
            max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto;
        `;

        // Verfügbare Bänder für Auswahl
        const availableBands = this.bands.map(band => `
            <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; margin: 5px 0; cursor: pointer;">
                <input type="checkbox" value="${band.id}" ${group.bandIds?.includes(band.id) ? 'checked' : ''} style="width: 20px; height: 20px;">
                <span style="color: white;">${band.name}</span>
            </label>
        `).join('');

        content.innerHTML = `
            <h3 style="color: #0ff; margin: 0 0 15px;">Gruppe bearbeiten</h3>
            <div style="margin-bottom: 15px;">
                <label style="color: #888; font-size: 12px;">Gruppenname</label>
                <input type="text" id="editGroupName" value="${group.name}" style="
                    width: 100%; padding: 12px; background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
                    color: white; font-size: 16px; margin-top: 5px;
                ">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="color: #888; font-size: 12px;">Bänder auswählen</label>
                <div style="margin-top: 10px; max-height: 200px; overflow-y: auto;">
                    ${availableBands || '<p style="color: #666;">Keine Bänder verfügbar</p>'}
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="cancelEditGroup" style="
                    flex: 1; padding: 12px; background: rgba(255,255,255,0.1);
                    border: none; border-radius: 8px; color: white; cursor: pointer;
                ">Abbrechen</button>
                <button id="saveEditGroup" style="
                    flex: 1; padding: 12px; background: linear-gradient(135deg, #0ff, #00a);
                    border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold;
                ">Speichern</button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Event-Listener
        document.getElementById('cancelEditGroup').addEventListener('click', () => modal.remove());

        document.getElementById('saveEditGroup').addEventListener('click', () => {
            const newName = document.getElementById('editGroupName').value.trim();
            const selectedBands = Array.from(content.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);

            if (newName) {
                group.name = newName;
                group.bandIds = selectedBands;
                this.saveGroupsToStorage();
                this.renderGroups();

                if (window.showNotification) {
                    window.showNotification('Gruppe aktualisiert', 'success');
                }
            }
            modal.remove();
        });

        // Schließen bei Klick außerhalb
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    deleteGroup(groupId) {
        if (!confirm('Gruppe wirklich löschen?')) return;

        this.groups = this.groups.filter(g => g.id !== groupId);
        this.saveGroupsToStorage();
        this.renderGroups();
    }

    loadBandsFromStorage() {
        try {
            const stored = localStorage.getItem('led-sidebar-bands');
            if (stored) {
                this.bands = JSON.parse(stored);
            }
        } catch (error) {
            console.error('❌ Bands laden fehlgeschlagen:', error);
        }
    }

    saveBandsToStorage() {
        try {
            localStorage.setItem('led-sidebar-bands', JSON.stringify(this.bands));
        } catch (error) {
            console.error('❌ Bands speichern fehlgeschlagen:', error);
        }
    }

    loadGroupsFromStorage() {
        try {
            const stored = localStorage.getItem('led-sidebar-groups');
            if (stored) {
                this.groups = JSON.parse(stored);
            }
        } catch (error) {
            console.error('❌ Gruppen laden fehlgeschlagen:', error);
        }
    }

    saveGroupsToStorage() {
        try {
            localStorage.setItem('led-sidebar-groups', JSON.stringify(this.groups));
        } catch (error) {
            console.error('❌ Gruppen speichern fehlgeschlagen:', error);
        }
    }

    // API für andere Module
    getAllBands() {
        return this.bands;
    }

    getEnabledBands() {
        return this.bands.filter(b => b.enabled);
    }

    getAllGroups() {
        return this.groups;
    }
}

// Global initialisieren
window.LEDSidebar = LEDSidebar;

// Auto-Init beim Laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ledSidebar = new LEDSidebar();
    });
} else {
    window.ledSidebar = new LEDSidebar();
}
