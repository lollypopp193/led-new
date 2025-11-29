/**
 * LED-SIDEBAR-SWIPE.JS
 * Von links nach rechts wischen → LED-Bänder Sidebar
 * Gruppen erstellen, LED-Bänder verwalten, verknüpfen
 */
'use strict';

class LEDSidebarSwipe {
    constructor() {
        this.isOpen = false;
        this.devices = [];
        this.groups = [];
        this.startX = 0;
        this.currentX = 0;
        this.sidebarWidth = 320;
        this.init();
    }

    /**
     * Initialisiert die LED-Sidebar
     */
    init() {
        this.createSidebar();
        this.setupSwipeGestures();
        this.loadDevices();
        // console.log('✅ LED-Sidebar initialisiert');
    }

    /**
     * Erstellt die Sidebar-HTML
     */
    createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'led-sidebar';
        sidebar.className = 'led-sidebar';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <h2><i class="fas fa-lightbulb"></i> LED Bänder Area</h2>
                <div class="header-controls">
                    <!-- Master Ein/Aus für alle LED-Bänder -->
                    <label class="toggle-switch master-toggle" title="Alle LED-Bänder ein/ausschalten">
                        <input type="checkbox" id="master-led-toggle" checked 
                               onchange="window.ledSidebar.toggleAllDevices(this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="close-btn" onclick="window.ledSidebar.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="sidebar-content">
                <!-- Gruppen-Bereich -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <h3><i class="fas fa-layer-group"></i> Gruppen</h3>
                        <button class="add-group-btn" onclick="window.ledSidebar.createGroup()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div id="groups-list" class="groups-list">
                        <p class="empty-hint">Keine Gruppen erstellt</p>
                    </div>
                </div>

                <!-- LED-Bänder -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <h3><i class="fas fa-lightbulb"></i> Gefundene Bänder (<span id="device-count">0</span>)</h3>
                        <button class="scan-btn" onclick="window.ledSidebar.scanDevices()" title="Nach LED-Bändern suchen">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div id="devices-list" class="devices-list"></div>
                </div>

                <!-- Schnellaktionen -->
                <div class="sidebar-section">
                    <h3><i class="fas fa-bolt"></i> Schnellaktionen</h3>
                    <div class="control-options">
                        <button class="control-btn" onclick="window.ledSidebar.linkAll()">
                            <i class="fas fa-link"></i> Alle verknüpfen
                        </button>
                        <button class="control-btn" onclick="window.ledSidebar.unlinkAll()">
                            <i class="fas fa-unlink"></i> Alle trennen
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Gruppen-Bearbeiten Dialog -->
            <div id="group-edit-dialog" class="group-dialog" style="display:none;">
                <div class="dialog-content">
                    <h3 id="group-dialog-title">Gruppe bearbeiten</h3>
                    <input type="text" id="group-name-input" placeholder="Gruppenname...">
                    <div id="group-devices-select" class="device-select-list"></div>
                    <div class="dialog-buttons">
                        <button onclick="window.ledSidebar.saveGroup()">Speichern</button>
                        <button onclick="window.ledSidebar.deleteCurrentGroup()" class="delete-btn">Löschen</button>
                        <button onclick="window.ledSidebar.closeGroupDialog()">Abbrechen</button>
                    </div>
                </div>
            </div>
        `;

        // Styles
        const style = document.createElement('style');
        style.textContent = `
            .led-sidebar {
                position: fixed;
                top: 0;
                left: -320px;
                width: 320px;
                height: 100vh;
                background: linear-gradient(135deg, #1a1a2e, #0f0f0f);
                box-shadow: 2px 0 10px rgba(0,0,0,0.5);
                z-index: 9999;
                transition: left 0.3s ease;
                overflow-y: auto;
            }

            .led-sidebar.open {
                left: 0;
            }

            .sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                background: rgba(255,255,255,0.05);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .sidebar-header h2 {
                margin: 0;
                font-size: 1.2rem;
                color: #ffcc00;
            }

            .close-btn {
                background: none;
                border: none;
                color: #fff;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px 10px;
            }

            .sidebar-content {
                padding: 15px;
            }

            .sidebar-section {
                margin-bottom: 25px;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .section-header h3 {
                font-size: 1rem;
                color: #fff;
                margin: 0;
            }

            .add-group-btn, .scan-btn {
                background: rgba(255,204,0,0.2);
                border: 1px solid #ffcc00;
                color: #ffcc00;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
            }

            .groups-list, .devices-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .device-item, .group-item {
                background: rgba(255,255,255,0.05);
                padding: 12px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.1);
            }

            .device-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .device-name {
                color: #fff;
                font-weight: 500;
            }

            .control-options {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .control-btn {
                background: rgba(78,205,196,0.2);
                border: 1px solid #4ecdc4;
                color: #4ecdc4;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
            }

            .control-btn:hover {
                background: rgba(78,205,196,0.3);
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(sidebar);
        this.sidebar = sidebar;
    }

    /**
     * Swipe-Gesten einrichten
     */
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            if (!touchStartX) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Nur wenn horizontal mehr als vertikal
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Von links nach rechts wischen
                if (diffX > 50 && touchStartX < 50 && !this.isOpen) {
                    this.open();
                }
                // Von rechts nach links wischen
                else if (diffX < -50 && this.isOpen) {
                    this.close();
                }
            }
        });

        document.addEventListener('touchend', () => {
            touchStartX = 0;
            touchStartY = 0;
        });
    }

    /**
     * Öffnet die Sidebar
     */
    open() {
        this.sidebar.classList.add('open');
        this.isOpen = true;
        this.loadDevices();
        // console.log('📂 LED-Sidebar geöffnet');
    }

    /**
     * Schließt die Sidebar
     */
    close() {
        this.sidebar.classList.remove('open');
        this.isOpen = false;
        // console.log('📁 LED-Sidebar geschlossen');
    }

    /**
     * Lädt gefundene LED-Bänder
     */
    loadDevices() {
        // Hole Geräte vom Device-Manager
        if (window.deviceManager && window.deviceManager.devices) {
            this.devices = window.deviceManager.devices;
        }

        this.renderDevices();
    }

    /**
     * Rendert LED-Bänder-Liste
     */
    renderDevices() {
        const devicesList = document.getElementById('devices-list');
        const deviceCount = document.getElementById('device-count');

        if (!devicesList) return;

        deviceCount.textContent = this.devices.length;

        if (this.devices.length === 0) {
            devicesList.innerHTML = '<p style="color: #888; text-align: center;">Keine LED-Bänder gefunden</p>';
            return;
        }

        devicesList.innerHTML = this.devices.map((device, index) => `
            <div class="device-item" data-device-id="${device.id}">
                <div class="device-info">
                    <div class="device-name">${device.name || `LED-Band ${index + 1}`}</div>
                    <div style="font-size: 0.8rem; color: #888;">${device.id}</div>
                </div>
                <div class="toggle-switch">
                    <input type="checkbox" id="device-${device.id}" ${device.enabled ? 'checked' : ''} 
                           onchange="window.ledSidebar.toggleDevice('${device.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Device ein/ausschalten
     */
    toggleDevice(deviceId, enabled) {
        // console.log(`🔘 LED-Band ${deviceId}:`, enabled ? 'EIN' : 'AUS');

        if (window.deviceManager) {
            window.deviceManager.setDeviceEnabled(deviceId, enabled);
        }
    }

    /**
     * Gruppe erstellen
     */
    createGroup() {
        const groupName = prompt('Gruppen-Name:');
        if (!groupName) return;

        const group = {
            id: Date.now(),
            name: groupName,
            devices: []
        };

        this.groups.push(group);
        this.renderGroups();
        // console.log(`✅ Gruppe erstellt: ${groupName}`);
    }

    /**
     * Gruppen rendern
     */
    renderGroups() {
        const groupsList = document.getElementById('groups-list');
        if (!groupsList) return;

        groupsList.innerHTML = this.groups.map(group => `
            <div class="group-item">
                <strong>${group.name}</strong>
                <div style="font-size: 0.8rem; color: #888;">${group.devices.length} Geräte</div>
            </div>
        `).join('');
    }

    /**
     * Alle LED-Bänder verknüpfen
     */
    linkAll() {
        // console.log('🔗 Alle LED-Bänder verknüpfen');
        this.devices.forEach(device => {
            device.linked = true;
        });
        this.saveDevicesToStorage();
        this.renderDevices();

        if (window.deviceManager) {
            window.deviceManager.linkAllDevices();
        }

        this.showNotification('Alle LED-Bänder verknüpft', 'success');
    }

    /**
     * Alle LED-Bänder trennen
     */
    unlinkAll() {
        // console.log('🔓 Alle LED-Bänder trennen');
        this.devices.forEach(device => {
            device.linked = false;
        });
        this.saveDevicesToStorage();
        this.renderDevices();

        if (window.deviceManager) {
            window.deviceManager.unlinkAllDevices();
        }

        this.showNotification('Alle LED-Bänder getrennt', 'info');
    }

    /**
     * Alle LED-Bänder ein/ausschalten (Master-Toggle)
     */
    toggleAllDevices(enabled) {
        // console.log(`🔘 Alle LED-Bänder: ${enabled ? 'EIN' : 'AUS'}`);

        this.devices.forEach(device => {
            device.enabled = enabled;
        });

        this.saveDevicesToStorage();
        this.renderDevices();

        // BLE-Controller benachrichtigen
        if (window.BLEControllerPro || window.ledController) {
            const controller = window.BLEControllerPro || window.ledController;
            if (enabled) {
                controller.turnOn && controller.turnOn();
            } else {
                controller.turnOff && controller.turnOff();
            }
        }

        this.showNotification(
            enabled ? 'Alle LED-Bänder eingeschaltet' : 'Alle LED-Bänder ausgeschaltet',
            enabled ? 'success' : 'info'
        );
    }

    /**
     * Einzelnes Gerät verknüpfen/trennen
     */
    toggleDeviceLink(deviceId) {
        const device = this.devices.find(d => d.id === deviceId);
        if (device) {
            device.linked = !device.linked;
            this.saveDevicesToStorage();
            this.renderDevices();
            // console.log(`🔗 LED-Band ${deviceId}: ${device.linked ? 'verknüpft' : 'getrennt'}`);
        }
    }

    /**
     * LED-Bänder scannen
     */
    async scanDevices() {
        // console.log('🔍 Scanne nach LED-Bändern...');

        const scanBtn = document.querySelector('.scan-btn');
        if (scanBtn) {
            scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            scanBtn.disabled = true;
        }

        try {
            if (window.ledAutoScanner) {
                await window.ledAutoScanner.startScan();
            } else if (window.BLEControllerPro) {
                await window.BLEControllerPro.scan();
            }

            this.loadDevices();
            this.showNotification(`${this.devices.length} LED-Bänder gefunden`, 'success');
        } catch (error) {
            console.error('Scan-Fehler:', error);
            this.showNotification('Scan fehlgeschlagen', 'error');
        } finally {
            if (scanBtn) {
                scanBtn.innerHTML = '<i class="fas fa-search"></i>';
                scanBtn.disabled = false;
            }
        }
    }

    /**
     * Gruppe erstellen/bearbeiten Dialog öffnen
     */
    createGroup() {
        this.currentEditingGroup = null;
        document.getElementById('group-dialog-title').textContent = 'Neue Gruppe erstellen';
        document.getElementById('group-name-input').value = '';
        this.renderDeviceSelectList();
        document.getElementById('group-edit-dialog').style.display = 'flex';
    }

    /**
     * Gruppe bearbeiten
     */
    editGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        this.currentEditingGroup = group;
        document.getElementById('group-dialog-title').textContent = 'Gruppe bearbeiten';
        document.getElementById('group-name-input').value = group.name;
        this.renderDeviceSelectList(group.devices);
        document.getElementById('group-edit-dialog').style.display = 'flex';
    }

    /**
     * Geräte-Auswahlliste rendern
     */
    renderDeviceSelectList(selectedDevices = []) {
        const container = document.getElementById('group-devices-select');
        if (!container) return;

        container.innerHTML = this.devices.map(device => `
            <label class="device-select-item">
                <input type="checkbox" value="${device.id}" 
                       ${selectedDevices.includes(device.id) ? 'checked' : ''}>
                <span>${device.name || device.id}</span>
            </label>
        `).join('');
    }

    /**
     * Gruppe speichern
     */
    saveGroup() {
        const name = document.getElementById('group-name-input').value.trim();
        if (!name) {
            this.showNotification('Bitte Gruppenname eingeben', 'error');
            return;
        }

        const selectedDevices = Array.from(
            document.querySelectorAll('#group-devices-select input:checked')
        ).map(input => input.value);

        if (this.currentEditingGroup) {
            // Bestehende Gruppe aktualisieren
            this.currentEditingGroup.name = name;
            this.currentEditingGroup.devices = selectedDevices;
        } else {
            // Neue Gruppe erstellen
            const group = {
                id: Date.now(),
                name: name,
                devices: selectedDevices
            };
            this.groups.push(group);
        }

        this.saveGroupsToStorage();
        this.renderGroups();
        this.closeGroupDialog();
        this.showNotification(`Gruppe "${name}" gespeichert`, 'success');
    }

    /**
     * Aktuelle Gruppe löschen
     */
    deleteCurrentGroup() {
        if (!this.currentEditingGroup) return;

        if (confirm(`Gruppe "${this.currentEditingGroup.name}" wirklich löschen?`)) {
            this.groups = this.groups.filter(g => g.id !== this.currentEditingGroup.id);
            this.saveGroupsToStorage();
            this.renderGroups();
            this.closeGroupDialog();
            this.showNotification('Gruppe gelöscht', 'info');
        }
    }

    /**
     * Gruppen-Dialog schließen
     */
    closeGroupDialog() {
        document.getElementById('group-edit-dialog').style.display = 'none';
        this.currentEditingGroup = null;
    }

    /**
     * Gruppen rendern (erweitert)
     */
    renderGroups() {
        const groupsList = document.getElementById('groups-list');
        if (!groupsList) return;

        if (this.groups.length === 0) {
            groupsList.innerHTML = '<p class="empty-hint">Keine Gruppen erstellt</p>';
            return;
        }

        groupsList.innerHTML = this.groups.map(group => `
            <div class="group-item" onclick="window.ledSidebar.selectGroup(${group.id})">
                <div class="group-info">
                    <strong>${group.name}</strong>
                    <span class="device-count">${group.devices.length} Geräte</span>
                </div>
                <div class="group-actions">
                    <button onclick="event.stopPropagation(); window.ledSidebar.editGroup(${group.id})" 
                            class="edit-btn" title="Bearbeiten">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Gruppe auswählen (nur diese Geräte steuern)
     */
    selectGroup(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        // Alle Geräte deaktivieren, nur Gruppen-Geräte aktivieren
        this.devices.forEach(device => {
            device.selected = group.devices.includes(device.id);
        });

        this.renderDevices();
        this.showNotification(`Gruppe "${group.name}" ausgewählt`, 'info');
    }

    /**
     * Geräte in Storage speichern
     */
    saveDevicesToStorage() {
        try {
            localStorage.setItem('led-sidebar-devices', JSON.stringify(this.devices));
        } catch (e) {
            console.error('Speichern fehlgeschlagen:', e);
        }
    }

    /**
     * Gruppen in Storage speichern
     */
    saveGroupsToStorage() {
        try {
            localStorage.setItem('led-sidebar-groups', JSON.stringify(this.groups));
        } catch (e) {
            console.error('Speichern fehlgeschlagen:', e);
        }
    }

    /**
     * Gruppen aus Storage laden
     */
    loadGroupsFromStorage() {
        try {
            const stored = localStorage.getItem('led-sidebar-groups');
            if (stored) {
                this.groups = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Laden fehlgeschlagen:', e);
            this.groups = [];
        }
    }

    /**
     * Notification anzeigen
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            // console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Global initialisieren
const ledSidebar = new LEDSidebarSwipe();
window.ledSidebar = ledSidebar;
window.LEDSidebarSwipe = LEDSidebarSwipe;
