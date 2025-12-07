/**
 * PERMISSIONS-SEQUENCER.JS v1.0
 * Sequenzielle Berechtigungsabfrage - nacheinander wie bei professionellen Apps
 * User sieht für jede Permission einen eigenen Dialog
 */
'use strict';

class PermissionsSequencer {
    constructor() {
        this.permissions = [
            {
                id: 'bluetooth',
                title: 'Bluetooth',
                icon: 'fa-bluetooth',
                description: 'Zum Verbinden mit LED-Bändern',
                required: true
            },
            {
                id: 'location',
                title: 'Standort',
                icon: 'fa-map-marker-alt',
                description: 'Für Bluetooth-Scan (Android Anforderung)',
                required: true
            },
            {
                id: 'storage',
                title: 'Speicher',
                icon: 'fa-folder-open',
                description: 'Zum Zugriff auf Musikdateien',
                required: true
            },
            {
                id: 'notifications',
                title: 'Benachrichtigungen',
                icon: 'fa-bell',
                description: 'Für Hintergrund-Verbindung',
                required: false
            }
        ];

        this.currentIndex = 0;
        this.results = {};
        this.onComplete = null;
    }

    async start(onComplete) {
        this.onComplete = onComplete;
        this.currentIndex = 0;
        this.results = {};

        console.log('🔐 Starte sequenzielle Berechtigungsabfrage...');

        // SICHERHEITS-TIMEOUT: Nach 10 Sekunden trotzdem starten!
        this.safetyTimeout = setTimeout(() => {
            console.warn('⚠️ Permission-Timeout - Starte App trotzdem!');
            if (this.onComplete && !this.completed) {
                this.completed = true;
                this.onComplete(this.results);
            }
        }, 10000);

        await this.showNextPermission();
    }

    async showNextPermission() {
        if (this.currentIndex >= this.permissions.length) {
            this.finish();
            return;
        }

        const permission = this.permissions[this.currentIndex];
        console.log(`📋 Frage ${permission.title} an...`);

        // DIREKT native Android Permission-Dialog anzeigen (ohne Vor-Dialog)
        // So wie bei normalen Android Apps
        const granted = await this.requestPermission(permission.id);
        this.results[permission.id] = granted;

        this.currentIndex++;
        // Kurze Pause zwischen Dialogen
        setTimeout(() => this.showNextPermission(), 500);
    }

    // Alte Methode mit Vor-Dialog (deaktiviert)
    async showPermissionDialogWithExplanation(permission) {
        // Zeigt Erklärungsdialog vor nativer Permission
        // Wurde durch direkte native Dialoge ersetzt
        await this.showPermissionDialog(permission);
    }

    async showPermissionDialog(permission) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'permission-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                animation: fadeIn 0.3s ease;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                padding: 40px 30px;
                border-radius: 25px;
                max-width: 380px;
                width: 90%;
                text-align: center;
                border: 3px solid #4ecdc4;
                box-shadow: 0 15px 50px rgba(78, 205, 196, 0.4);
                animation: slideUp 0.4s ease;
            `;

            content.innerHTML = `
                <i class="fas ${permission.icon}" style="
                    font-size: 4rem;
                    color: #4ecdc4;
                    margin-bottom: 20px;
                    display: block;
                "></i>
                
                <h2 style="
                    color: #fff;
                    font-size: 24px;
                    margin-bottom: 10px;
                    font-weight: 600;
                ">${permission.title}</h2>
                
                <p style="
                    color: #4ecdc4;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 20px;
                ">${permission.required ? 'Erforderlich' : 'Optional'}</p>
                
                <p style="
                    color: #ccc;
                    margin-bottom: 30px;
                    line-height: 1.6;
                    font-size: 15px;
                ">${permission.description}</p>
                
                <div style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                ">
                    ${!permission.required ? `
                    <button class="btn-deny" style="
                        flex: 1;
                        padding: 15px 25px;
                        border-radius: 25px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        background: transparent;
                        color: #aaa;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">Überspringen</button>
                    ` : ''}
                    
                    <button class="btn-allow" style="
                        flex: 1;
                        padding: 15px 25px;
                        border-radius: 25px;
                        border: none;
                        background: linear-gradient(135deg, #4ecdc4, #44a08d);
                        color: #fff;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(78, 205, 196, 0.4);
                        transition: all 0.3s ease;
                    ">Erlauben</button>
                </div>
                
                <p style="
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                ">${this.currentIndex + 1} von ${this.permissions.length}</p>
            `;

            dialog.appendChild(content);
            document.body.appendChild(dialog);

            // Event Listeners
            const allowBtn = content.querySelector('.btn-allow');
            const denyBtn = content.querySelector('.btn-deny');

            allowBtn.addEventListener('click', async () => {
                dialog.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => dialog.remove(), 300);

                // Permission tatsächlich anfragen
                const granted = await this.requestPermission(permission.id);
                this.results[permission.id] = granted;

                this.currentIndex++;
                setTimeout(() => this.showNextPermission(), 400);
                resolve();
            });

            if (denyBtn) {
                denyBtn.addEventListener('click', () => {
                    dialog.style.animation = 'fadeOut 0.3s ease';
                    setTimeout(() => dialog.remove(), 300);

                    this.results[permission.id] = false;

                    this.currentIndex++;
                    setTimeout(() => this.showNextPermission(), 400);
                    resolve();
                });
            }
        });
    }

    async requestPermission(permissionId) {
        console.log(`🔐 Fordere ${permissionId} an...`);

        try {
            switch (permissionId) {
                case 'bluetooth':
                    if (window.AndroidPermissionsManager) {
                        const result = await window.AndroidPermissionsManager.requestBluetoothPermissions();
                        return result.granted;
                    }
                    return true;

                case 'location':
                    if (window.AndroidPermissionsManager) {
                        const result = await window.AndroidPermissionsManager.requestLocationPermissions();
                        return result.granted;
                    }
                    return true;

                case 'storage':
                    if (window.AndroidPermissionsManager) {
                        const result = await window.AndroidPermissionsManager.requestStoragePermissions();
                        return result.granted;
                    }
                    return true;

                case 'notifications':
                    if (window.AndroidPermissionsManager) {
                        const result = await window.AndroidPermissionsManager.requestNotificationPermissions();
                        return result.granted;
                    }
                    return true;

                default:
                    return false;
            }
        } catch (error) {
            console.error(`❌ ${permissionId} Fehler:`, error);
            return false;
        }
    }

    finish() {
        console.log('✅ Berechtigungen abgeschlossen:', this.results);

        // Alle erforderlichen Permissions prüfen
        const allRequired = this.permissions
            .filter(p => p.required)
            .every(p => this.results[p.id]);

        if (allRequired) {
            this.showSuccessMessage();
        } else {
            this.showWarningMessage();
        }

        // Safety-Timeout clearen
        if (this.safetyTimeout) {
            clearTimeout(this.safetyTimeout);
        }

        if (this.onComplete && !this.completed) {
            this.completed = true;
            // Sofort weitermachen, nicht 2 Sekunden warten!
            setTimeout(() => {
                this.onComplete(this.results);
            }, 500);
        }
    }

    showSuccessMessage() {
        // ENTFERNT: Grünes Kärtchen "Bereit zum Starten" (User Request: nicht mehr anzeigen)
        // App startet direkt ohne Bestätigungsmeldung
        console.log('✅ Alle Berechtigungen erteilt - App startet...');
    }

    showWarningMessage() {
        // Dezente Warnung statt großes Popup
        console.log('⚠️ Einige Berechtigungen fehlen');

        if (window.showNotification) {
            window.showNotification('Einige Funktionen eingeschränkt', 'warning');
        }
    }
}

// CSS Animations hinzufügen
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
from { opacity: 0; }
to { opacity: 1; }
}
@keyframes fadeOut {
from { opacity: 1; }
to { opacity: 0; }
}
@keyframes slideUp {
from { transform: translateY(50px); opacity: 0; }
to { transform: translateY(0); opacity: 1; }
}
@keyframes bounceIn {
0% { transform: translate(-50%, -50%) scale(0.3); }
50% { transform: translate(-50%, -50%) scale(1.05); }
70% { transform: translate(-50%, -50%) scale(0.9); }
100% { transform: translate(-50%, -50%) scale(1); }
}
@keyframes shake {
0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
10%, 30%, 50%, 70%, 90% { transform: translate(-50%, -50%) rotate(-5deg); }
20%, 40%, 60%, 80% { transform: translate(-50%, -50%) rotate(5deg); }
}
`;
document.head.appendChild(style);

// Global Export
window.PermissionsSequencer = PermissionsSequencer;
window.permissionsSequencer = new PermissionsSequencer();
