/**
 * SHARE MANAGER v1.0
 * Teilen von Playlists, Einstellungen & Screenshots
 */
'use strict';

class ShareManager {
    constructor() {
        this.isSupported = false;
        this.init();
    }

    init() {
        this.checkSupport();
        // console.log('✅ Share Manager initialisiert');
    }

    checkSupport() {
        this.isSupported = 'share' in navigator;

        if (!this.isSupported) {
            console.warn('⚠️ Web Share API nicht verfügbar');
        }
    }

    /**
     * SHARE PLAYLIST
     */
    async sharePlaylist(playlist) {
        if (!playlist) {
            console.warn('⚠️ Keine Playlist zum Teilen');
            return;
        }

        const shareData = {
            title: `Playlist: ${playlist.name}`,
            text: `Check out my playlist "${playlist.name}" with ${playlist.songs?.length || 0} songs!`,
            url: window.location.href
        };

        try {
            if (this.isSupported) {
                await navigator.share(shareData);
                // console.log('✅ Playlist geteilt');
            } else {
                this.fallbackShare(shareData);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Share fehlgeschlagen:', error);
            }
        }
    }

    /**
     * SHARE TRACK
     */
    async shareTrack(track) {
        if (!track) {
            console.warn('⚠️ Kein Track zum Teilen');
            return;
        }

        const shareData = {
            title: track.title || 'Music Track',
            text: `${track.artist || 'Unknown Artist'} - ${track.title || 'Unknown Title'}`,
            url: window.location.href
        };

        try {
            if (this.isSupported) {
                await navigator.share(shareData);
                // console.log('✅ Track geteilt');
            } else {
                this.fallbackShare(shareData);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Share fehlgeschlagen:', error);
            }
        }
    }

    /**
     * SHARE SCREENSHOT
     */
    async shareScreenshot() {
        try {
            const canvas = await this.captureScreenshot();
            const blob = await this.canvasToBlob(canvas);

            const file = new File([blob], 'led-app-screenshot.png', { type: 'image/png' });

            const shareData = {
                title: 'LED App Screenshot',
                text: 'Check out my LED setup!',
                files: [file]
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                // console.log('✅ Screenshot geteilt');
            } else {
                // Fallback: Download
                this.downloadScreenshot(blob);
            }
        } catch (error) {
            console.error('❌ Screenshot Share fehlgeschlagen:', error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, 'Screenshot Share');
            }
        }
    }

    async captureScreenshot() {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Capture current view
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LED Control App', canvas.width / 2, canvas.height / 2);

            ctx.font = '16px Arial';
            ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 40);

            resolve(canvas);
        });
    }

    canvasToBlob(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        });
    }

    downloadScreenshot(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `led-app-screenshot-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);

        // console.log('💾 Screenshot heruntergeladen');

        if (window.showGlobalNotification) {
            window.showGlobalNotification('💾 Screenshot gespeichert', 'success');
        }
    }

    /**
     * SHARE SETTINGS
     */
    async shareSettings() {
        const settings = this.collectSettings();
        const settingsText = this.formatSettings(settings);

        const shareData = {
            title: 'LED App Einstellungen',
            text: settingsText,
            url: window.location.href
        };

        try {
            if (this.isSupported) {
                await navigator.share(shareData);
                // console.log('✅ Einstellungen geteilt');
            } else {
                this.fallbackShare(shareData);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Share fehlgeschlagen:', error);
            }
        }
    }

    collectSettings() {
        return {
            playlists: JSON.parse(localStorage.getItem('playlists') || '[]').length,
            favorites: JSON.parse(localStorage.getItem('favorites') || '[]').length,
            ledNames: Object.keys(JSON.parse(localStorage.getItem('ledCustomNames') || '{}')).length,
            musicAlarms: JSON.parse(localStorage.getItem('musicAlarms') || '[]').length
        };
    }

    formatSettings(settings) {
        return `LED App Stats:\n` +
            `📝 Playlists: ${settings.playlists}\n` +
            `⭐ Favoriten: ${settings.favorites}\n` +
            `💡 LED Bänder: ${settings.ledNames}\n` +
            `⏰ Wecker: ${settings.musicAlarms}`;
    }

    /**
     * FALLBACK SHARE (Copy to Clipboard)
     */
    fallbackShare(data) {
        const text = `${data.title}\n${data.text}\n${data.url || ''}`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    // console.log('📋 In Zwischenablage kopiert');

                    if (window.showGlobalNotification) {
                        window.showGlobalNotification('📋 Link kopiert', 'success');
                    }
                })
                .catch(error => {
                    console.error('❌ Clipboard fehlgeschlagen:', error);
                    this.showShareDialog(text);
                });
        } else {
            this.showShareDialog(text);
        }
    }

    showShareDialog(text) {
        const dialog = document.createElement('div');
        dialog.className = 'share-dialog modal-enter';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            z-index: 10001;
            max-width: 400px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;

        dialog.innerHTML = `
            <h3 style="color: #FFD700; margin: 0 0 15px 0;">📤 Teilen</h3>
            <textarea readonly style="
                width: 100%;
                height: 150px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid #FFD700;
                border-radius: 8px;
                color: white;
                font-family: monospace;
                resize: none;
                margin-bottom: 15px;
            ">${text}</textarea>
            <div style="display: grid; gap: 10px;">
                <button id="copyBtn" style="
                    padding: 12px;
                    background: #2ecc71;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">📋 Kopieren</button>
                <button id="closeBtn" style="
                    padding: 10px;
                    background: transparent;
                    color: #888;
                    border: 2px solid #888;
                    border-radius: 8px;
                    cursor: pointer;
                ">✕ Schließen</button>
            </div>
        `;

        dialog.querySelector('#copyBtn').addEventListener('click', () => {
            const textarea = dialog.querySelector('textarea');
            textarea.select();
            document.execCommand('copy');

            if (window.showGlobalNotification) {
                window.showGlobalNotification('📋 Kopiert!', 'success');
            }
        });

        dialog.querySelector('#closeBtn').addEventListener('click', () => {
            dialog.remove();
            backdrop.remove();
        });

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
        `;
        backdrop.addEventListener('click', () => {
            dialog.remove();
            backdrop.remove();
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(dialog);
    }

    /**
     * QR CODE GENERATOR
     */
    generateQRCode(data) {
        // Simple QR Code generation (would use library in production)
        // console.log('📱 QR Code für:', data);

        if (window.showGlobalNotification) {
            window.showGlobalNotification('📱 QR Code Funktion in Entwicklung', 'info');
        }
    }

    /**
     * EXPORT DATA AS FILE
     */
    exportAsFile(data, filename, type = 'application/json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        // console.log('💾 Datei exportiert:', filename);

        if (window.showGlobalNotification) {
            window.showGlobalNotification('💾 Exportiert', 'success');
        }
    }

    /**
     * SOCIAL MEDIA SHARE
     */
    shareToSocial(platform, data) {
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url || window.location.href)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url || window.location.href)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(data.text + ' ' + (data.url || window.location.href))}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url || window.location.href)}&text=${encodeURIComponent(data.text)}`
        };

        const url = urls[platform];

        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
            // console.log(`📱 Geteilt auf ${platform}`);
        }
    }
}

// Initialize global share manager
window.shareManager = new ShareManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareManager;
}

// console.log('✅ Share Manager geladen');
// console.log('📤 Web Share API:', window.shareManager.isSupported ? 'Verfügbar' : 'Nicht verfügbar');
