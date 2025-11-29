/**
 * NOTIFICATIONS.JS - Zentrale Notification-Verwaltung
 * @version 1.0.0
 * Eliminiert Duplikate über alle HTML-Seiten
 */
'use strict';

/**
 * Zeigt eine Notification an
 * @param {string} message - Nachricht
 * @param {string} type - Typ: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Anzeigedauer in ms (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    try {
        // Prüfe ob Container existiert
        let container = document.getElementById('notification-container');

        if (!container) {
            // Erstelle Container wenn nicht vorhanden
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
            document.body.appendChild(container);
        }

        // Erstelle Notification-Element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        // Icon basierend auf Typ
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const icon = icons[type] || icons.info;

        // Farben basierend auf Typ
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };

        const color = colors[type] || colors.info;

        notification.style.cssText = `
        background: ${color};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 250px;
        max-width: 400px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        pointer-events: auto;
        animation: slideIn 0.3s ease-out;
        opacity: 0;
        transform: translateX(100%);
    `;

        notification.innerHTML = `
        <span style="font-size: 20px; font-weight: bold;">${icon}</span>
        <span style="flex: 1;">${message}</span>
    `;

        // Animation hinzufügen
        const style = document.createElement('style');
        style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;

        if (!document.getElementById('notification-styles')) {
            style.id = 'notification-styles';
            document.head.appendChild(style);
        }

        // Notification anzeigen
        container.appendChild(notification);

        // Animation starten
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Automatisch entfernen nach Duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        // Click zum Schließen
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    } catch (error) {
        console.error('❌ Notification-Fehler:', error);
    }
}

/**
 * Zeigt eine Erfolgs-Notification
 * @param {string} message - Nachricht
 * @param {number} duration - Anzeigedauer in ms
 */
function showSuccess(message, duration = 3000) {
    showNotification(message, 'success', duration);
}

/**
 * Zeigt eine Fehler-Notification
 * @param {string} message - Nachricht
 * @param {number} duration - Anzeigedauer in ms
 */
function showError(message, duration = 5000) {
    showNotification(message, 'error', duration);
}

/**
 * Zeigt eine Warn-Notification
 * @param {string} message - Nachricht
 * @param {number} duration - Anzeigedauer in ms
 */
function showWarning(message, duration = 4000) {
    showNotification(message, 'warning', duration);
}

/**
 * Zeigt eine Info-Notification
 * @param {string} message - Nachricht
 * @param {number} duration - Anzeigedauer in ms
 */
function showInfo(message, duration = 3000) {
    showNotification(message, 'info', duration);
}

// Global verfügbar machen
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;

// Alias für Kompatibilität
window.showGlobalNotification = showNotification;

// console.log('✅ Notification-System geladen');
