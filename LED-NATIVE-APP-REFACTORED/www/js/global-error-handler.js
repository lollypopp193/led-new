/**
 * GLOBAL ERROR HANDLER v1.0
 * Fängt alle unbehandelten Fehler und zeigt User-freundliche Meldungen
 */
'use strict';

class GlobalErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.notificationQueue = [];
        this.isShowingNotification = false;

        this.init();
    }

    init() {
        // Fange unbehandelte Promise Rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled Promise Rejection:', event.reason);
            this.handleError(event.reason, 'Promise Rejection');
            event.preventDefault();
        });

        // Fange globale JavaScript Fehler
        window.addEventListener('error', (event) => {
            console.error('❌ Global Error:', event.error);
            this.handleError(event.error, 'Script Error');
            event.preventDefault();
        });

        console.log('✅ Global Error Handler aktiv');
    }

    handleError(error, context = '') {
        const errorInfo = {
            message: error?.message || String(error),
            stack: error?.stack || '',
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        // Log error
        this.logError(errorInfo);

        // Show user-friendly notification
        const userMessage = this.getUserFriendlyMessage(error, context);
        this.showNotification(userMessage, 'error');

        // Send to analytics (if configured)
        this.sendToAnalytics(errorInfo);
    }

    getUserFriendlyMessage(error, context) {
        const message = error?.message || String(error);

        // BLE/Bluetooth Fehler
        if (message.includes('Bluetooth') || message.includes('GATT') || context.includes('BLE')) {
            if (message.includes('not found') || message.includes('NotFoundError')) {
                return 'Bluetooth-Gerät nicht gefunden. Bitte einschalten und in Reichweite bringen.';
            }
            if (message.includes('NetworkError') || message.includes('timeout')) {
                return 'Bluetooth-Verbindung unterbrochen. Bitte näher an das Gerät gehen.';
            }
            return 'Bluetooth-Fehler. Bitte Gerät neu starten.';
        }

        // File System / Storage Fehler
        if (message.includes('storage') || message.includes('quota') || message.includes('disk')) {
            return 'Speicher voll. Bitte Platz freigeben.';
        }

        // Netzwerk Fehler
        if (message.includes('network') || message.includes('fetch') || message.includes('NetworkError')) {
            return 'Netzwerkfehler. Bitte Internetverbindung prüfen.';
        }

        // Permission Fehler
        if (message.includes('permission') || message.includes('denied') || message.includes('NotAllowedError')) {
            return 'Berechtigung verweigert. Bitte in den Einstellungen erlauben.';
        }

        // Audio Fehler
        if (message.includes('audio') || message.includes('decode') || message.includes('playback')) {
            return 'Audio-Fehler. Dateiformat nicht unterstützt?';
        }

        // IndexedDB Fehler
        if (message.includes('IndexedDB') || message.includes('database')) {
            return 'Datenbank-Fehler. Bitte App neu laden.';
        }

        // Generic fallback
        return 'Ein Fehler ist aufgetreten. Bitte App neu laden.';
    }

    logError(errorInfo) {
        this.errorLog.push(errorInfo);

        // Limit log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console with nice formatting
        console.group(`🔴 ERROR [${errorInfo.context}]`);
        console.error('Message:', errorInfo.message);
        console.error('Time:', errorInfo.timestamp);
        if (errorInfo.stack) {
            console.error('Stack:', errorInfo.stack);
        }
        console.groupEnd();
    }

    showNotification(message, type = 'error') {
        // Queue notification
        this.notificationQueue.push({ message, type });

        // Process queue
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }

    async processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }

        this.isShowingNotification = true;
        const { message, type } = this.notificationQueue.shift();

        // Use existing global notification system if available
        if (window.showGlobalNotification) {
            window.showGlobalNotification(message, type);
        } else {
            // Fallback: Create simple notification
            this.createFallbackNotification(message, type);
        }

        // Wait before showing next notification
        await this.delay(4000);
        this.processNotificationQueue();
    }

    createFallbackNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = 'global-error-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100000;
            background: ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#28a745'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 350px;
            word-wrap: break-word;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    sendToAnalytics(errorInfo) {
        // Placeholder for analytics integration
        // Can be connected to Google Analytics, Sentry, etc.
        if (window.gtag) {
            try {
                window.gtag('event', 'exception', {
                    description: errorInfo.message,
                    fatal: false
                });
            } catch (e) {
                // Silent fail
            }
        }
    }

    getErrorLog() {
        return [...this.errorLog];
    }

    clearErrorLog() {
        this.errorLog = [];
        console.log('✅ Error log cleared');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CSS Animations
const errorHandlerStyle = document.createElement('style');
errorHandlerStyle.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
`;
document.head.appendChild(errorHandlerStyle);

// Initialize global error handler
window.globalErrorHandler = new GlobalErrorHandler();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalErrorHandler;
}

console.log('✅ Global Error Handler geladen');
