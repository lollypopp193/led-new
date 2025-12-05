/**
 * BLOB-CLEANUP.JS - Blob URL Memory Leak Prevention
 * FIX: Tracked und revoked alle Blob URLs automatisch
 */
'use strict';

class BlobCleanupManager {
    constructor() {
        this.blobUrls = [];
        this.init();
    }

    init() {
        // Override createObjectURL to track all created URLs
        const originalCreateObjectURL = URL.createObjectURL;

        URL.createObjectURL = (blob) => {
            const url = originalCreateObjectURL.call(URL, blob);
            this.blobUrls.push(url);
            console.log(`📎 Blob URL created: ${url.substring(0, 50)}...`);
            return url;
        };

        console.log('✅ Blob Cleanup Manager initialisiert');
    }

    /**
     * Revoke spezifische Blob URL
     * @param {string} url - Blob URL
     */
    revoke(url) {
        try {
            URL.revokeObjectURL(url);
            const index = this.blobUrls.indexOf(url);
            if (index > -1) {
                this.blobUrls.splice(index, 1);
            }
            console.log(`🗑️ Blob URL revoked: ${url.substring(0, 50)}...`);
        } catch (e) {
            console.warn('Failed to revoke blob URL:', e);
        }
    }

    /**
     * Revoke alle tracked Blob URLs
     * FIX: Verhindert Memory Leak
     */
    revokeAll() {
        console.log(`🗑️ Revoking ${this.blobUrls.length} Blob URLs...`);

        this.blobUrls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.warn('Failed to revoke blob URL:', e);
            }
        });

        this.blobUrls = [];
        console.log('✅ Alle Blob URLs revoked');
    }

    /**
     * Get aktuelle Anzahl tracked URLs
     * @returns {number}
     */
    getCount() {
        return this.blobUrls.length;
    }
}

// Global instance
window.blobCleanup = new BlobCleanupManager();

// Auto-Cleanup bei Page-Wechsel
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        window.blobCleanup.revokeAll();
    });

    // Cleanup bei App-Pause (Mobile)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('📱 App in Hintergrund - Blob Cleanup');
            window.blobCleanup.revokeAll();
        }
    });
}

console.log('✅ Blob-Cleanup Helper geladen');
