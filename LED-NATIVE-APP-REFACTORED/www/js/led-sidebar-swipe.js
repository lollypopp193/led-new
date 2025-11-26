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
        console.log('✅ LED-Sidebar initialisiert');
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
                <h2><i class="fas fa-lightbulb"></i> LED-Bänder</h2>
                <button class="close-btn" onclick="window.ledSidebar.close()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="sidebar-content">
                <!-- Gruppen-Bereich -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <h3>Gruppen</h3>
                        <button class="add-group-btn" onclick="window.ledSidebar.createGroup()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div id="groups-list" class="groups-list"></div>
                </div>

                <!-- LED-Bänder -->
                <div class="sidebar-section">
                    <div class="section-header">
                        <h3>LED-Bänder (<span id="device-count">0</span>)</h3>
                        <button class="scan-btn" onclick="window.ledSidebar.scanDevices()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div id="devices-list" class="devices-list"></div>
                </div>

                <!-- Verknüpfungsoptionen -->
                <div class="sidebar-section">
                    <h3>Steuerung</h3>
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
        console.log('📂 LED-Sidebar geöffnet');
    }

    /**
     * Schließt die Sidebar
     */
    close() {
        this.sidebar.classList.remove('open');
        this.isOpen = false;
        console.log('📁 LED-Sidebar geschlossen');
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
        console.log(`🔘 LED-Band ${deviceId}:`, enabled ? 'EIN' : 'AUS');

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
        console.log(`✅ Gruppe erstellt: ${groupName}`);
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
        console.log('🔗 Alle LED-Bänder verknüpfen');
        if (window.deviceManager) {
            window.deviceManager.linkAllDevices();
        }
    }

    /**
     * Alle LED-Bänder trennen
     */
    unlinkAll() {
        console.log('🔓 Alle LED-Bänder trennen');
        if (window.deviceManager) {
            window.deviceManager.unlinkAllDevices();
        }
    }

    /**
     * LED-Bänder scannen
     */
    async scanDevices() {
        console.log('🔍 Scanne nach LED-Bändern...');

        if (window.ledAutoScanner) {
            await window.ledAutoScanner.startScan();
            this.loadDevices();
        }
    }
}

// Global initialisieren
const ledSidebar = new LEDSidebarSwipe();
window.ledSidebar = ledSidebar;
window.LEDSidebarSwipe = LEDSidebarSwipe;
