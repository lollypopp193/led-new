/**
 * QUICK ACTIONS v1.0
 * Schnellzugriff & Shortcuts für häufige Aktionen
 */
'use strict';

class QuickActions {
    constructor() {
        this.actions = new Map();
        this.init();
    }

    init() {
        this.registerDefaultActions();
        this.setupKeyboardShortcuts();
        // Quick Access Menu deaktiviert für native App
        // this.createQuickAccessMenu();
        // console.log('✅ Quick Actions initialisiert (Keyboard Shortcuts only)');
    }

    registerDefaultActions() {
        // BLE Actions
        this.registerAction('ble-connect', {
            name: 'BLE Verbinden',
            icon: '🔗',
            shortcut: 'Ctrl+B',
            handler: async () => {
                if (window.BLEControllerPro) {
                    if (window.loadingManager) {
                        window.loadingManager.showBLEConnecting();
                    }
                    try {
                        await window.BLEControllerPro.scan();
                        await window.BLEControllerPro.connect();
                        if (window.showGlobalNotification) {
                            window.showGlobalNotification('✅ BLE verbunden', 'success');
                        }
                    } catch (error) {
                        console.error('BLE Connect fehlgeschlagen:', error);
                    } finally {
                        if (window.loadingManager) {
                            window.loadingManager.hideBLEConnecting();
                        }
                    }
                }
            }
        });

        this.registerAction('ble-disconnect', {
            name: 'BLE Trennen',
            icon: '🔌',
            shortcut: 'Ctrl+Shift+B',
            handler: async () => {
                if (window.BLEControllerPro) {
                    await window.BLEControllerPro.disconnect();
                    if (window.showGlobalNotification) {
                        window.showGlobalNotification('✓ BLE getrennt', 'info');
                    }
                }
            }
        });

        // LED Actions
        this.registerAction('led-power-on', {
            name: 'LED An',
            icon: '💡',
            shortcut: 'Ctrl+L',
            handler: async () => {
                if (window.BLEControllerPro && window.BLEControllerPro.isConnected) {
                    await window.BLEControllerPro.sendPowerOn();
                }
            }
        });

        this.registerAction('led-power-off', {
            name: 'LED Aus',
            icon: '🌑',
            shortcut: 'Ctrl+Shift+L',
            handler: async () => {
                if (window.BLEControllerPro && window.BLEControllerPro.isConnected) {
                    await window.BLEControllerPro.sendPowerOff();
                }
            }
        });

        // Music Actions
        this.registerAction('music-play-pause', {
            name: 'Play/Pause',
            icon: '⏯️',
            shortcut: 'Space',
            handler: () => {
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                    } else {
                        audioPlayer.pause();
                    }
                }
            }
        });

        this.registerAction('music-next', {
            name: 'Nächster Track',
            icon: '⏭️',
            shortcut: 'Ctrl+Right',
            handler: () => {
                if (window.musikIntegration && window.musikIntegration.nextTrack) {
                    window.musikIntegration.nextTrack();
                }
            }
        });

        this.registerAction('music-previous', {
            name: 'Vorheriger Track',
            icon: '⏮️',
            shortcut: 'Ctrl+Left',
            handler: () => {
                if (window.musikIntegration && window.musikIntegration.previousTrack) {
                    window.musikIntegration.previousTrack();
                }
            }
        });

        // Library Actions
        this.registerAction('scan-library', {
            name: 'Bibliothek scannen',
            icon: '🔍',
            shortcut: 'Ctrl+S',
            handler: async () => {
                if (window.musicLibraryManager) {
                    if (window.loadingManager) {
                        window.loadingManager.showLibraryScan();
                    }
                    try {
                        await window.musicLibraryManager.scanFolder();
                    } finally {
                        if (window.loadingManager) {
                            window.loadingManager.hideLibraryScan();
                        }
                    }
                }
            }
        });

        // console.log(`✅ ${this.actions.size} Quick Actions registriert`);
    }

    registerAction(id, action) {
        if (!action.name || !action.handler) {
            console.warn('Ungültige Action:', id);
            return;
        }

        this.actions.set(id, {
            id,
            name: action.name,
            icon: action.icon || '⚡',
            shortcut: action.shortcut || null,
            handler: action.handler,
            enabled: action.enabled !== false
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (e.target.matches('input, textarea')) {
                return;
            }

            this.actions.forEach(action => {
                if (action.shortcut) {
                    if (this.matchShortcut(e, action.shortcut)) {
                        e.preventDefault();
                        this.executeAction(action.id);
                    }
                }
            });
        });

        // console.log('⌨️ Keyboard Shortcuts aktiviert');
    }

    matchShortcut(event, shortcut) {
        const parts = shortcut.toLowerCase().split('+');
        const key = parts.pop();

        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        const matchKey = event.key.toLowerCase() === key.toLowerCase() ||
            (key === 'space' && event.code === 'Space');

        return matchKey &&
            event.ctrlKey === needsCtrl &&
            event.shiftKey === needsShift &&
            event.altKey === needsAlt;
    }

    async executeAction(actionId) {
        const action = this.actions.get(actionId);

        if (!action) {
            console.warn('Action nicht gefunden:', actionId);
            return;
        }

        if (!action.enabled) {
            console.warn('Action deaktiviert:', actionId);
            return;
        }

        // console.log(`⚡ Execute: ${action.name}`);

        try {
            await action.handler();
        } catch (error) {
            console.error(`❌ Action fehlgeschlagen: ${action.name}`, error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, `Quick Action: ${action.name}`);
            }
        }
    }

    createQuickAccessMenu() {
        // Erstelle Floating Action Button
        const fab = document.createElement('button');
        fab.id = 'quickActionsFAB';
        fab.className = 'quick-actions-fab';
        fab.innerHTML = '⚡';
        fab.title = 'Quick Actions';
        fab.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #1a1a1a;
            font-size: 24px;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            z-index: 9999;
            transition: all 0.3s ease;
        `;

        fab.addEventListener('click', () => {
            this.showQuickActionsMenu();
        });

        fab.addEventListener('mouseenter', () => {
            fab.style.transform = 'scale(1.1) rotate(15deg)';
        });

        fab.addEventListener('mouseleave', () => {
            fab.style.transform = 'scale(1) rotate(0deg)';
        });

        document.body.appendChild(fab);
        // console.log('✅ Quick Actions FAB erstellt');
    }

    showQuickActionsMenu() {
        // Entferne existierendes Menu
        const existing = document.getElementById('quickActionsMenu');
        if (existing) {
            existing.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.id = 'quickActionsMenu';
        menu.className = 'quick-actions-menu modal-enter';
        menu.style.cssText = `
            position: fixed;
            bottom: 150px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 15px;
            padding: 15px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            min-width: 250px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;

        const title = document.createElement('h3');
        title.textContent = 'Quick Actions';
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #FFD700;
            font-size: 16px;
            text-align: center;
        `;
        menu.appendChild(title);

        // Erstelle Action Buttons
        this.actions.forEach(action => {
            if (!action.enabled) return;

            const btn = document.createElement('button');
            btn.className = 'quick-action-btn';
            btn.style.cssText = `
                width: 100%;
                padding: 12px;
                margin-bottom: 8px;
                border: none;
                border-radius: 8px;
                background: rgba(255, 215, 0, 0.1);
                color: white;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
            `;

            btn.innerHTML = `
                <span style="font-size: 18px;">${action.icon}</span>
                <span style="flex: 1; text-align: left;">${action.name}</span>
                ${action.shortcut ? `<span style="font-size: 11px; opacity: 0.6;">${action.shortcut}</span>` : ''}
            `;

            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 215, 0, 0.2)';
                btn.style.transform = 'translateX(-3px)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 215, 0, 0.1)';
                btn.style.transform = 'translateX(0)';
            });

            btn.addEventListener('click', async () => {
                await this.executeAction(action.id);
                menu.remove();
            });

            menu.appendChild(btn);
        });

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ Schließen';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            margin-top: 5px;
            border: 2px solid #888;
            border-radius: 8px;
            background: transparent;
            color: #888;
            font-size: 12px;
            cursor: pointer;
        `;

        closeBtn.addEventListener('click', () => {
            menu.remove();
        });

        menu.appendChild(closeBtn);

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !e.target.closest('#quickActionsFAB')) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);

        document.body.appendChild(menu);
    }

    /**
     * Enable/Disable Action
     */
    setActionEnabled(actionId, enabled) {
        const action = this.actions.get(actionId);
        if (action) {
            action.enabled = enabled;
        }
    }

    /**
     * Get all actions
     */
    getAllActions() {
        return Array.from(this.actions.values());
    }

    /**
     * Remove action
     */
    removeAction(actionId) {
        this.actions.delete(actionId);
    }
}

// Initialize global quick actions
window.quickActions = new QuickActions();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickActions;
}

// console.log('✅ Quick Actions geladen');
// console.log('💡 Klicke ⚡ Button unten rechts für Quick Actions');
// console.log('⌨️ Keyboard Shortcuts: Ctrl+B (Connect), Ctrl+L (LED On), Space (Play/Pause)');
