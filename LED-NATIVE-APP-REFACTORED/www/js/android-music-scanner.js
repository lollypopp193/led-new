/**
 * ANDROID MUSIC SCANNER - MediaStore + Storage Access Framework Integration
 * Native Android Musikzugriff über Capacitor Filesystem Plugin
 * @version 1.0
 * @requires @capacitor/filesystem, MusicLibraryManager
 */
'use strict';

const AndroidMusicScanner = {
    /**
     * Configuration
     */
    config: {
        SUPPORTED_FORMATS: ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac', 'opus', 'wma'],
        MIME_TYPES: [
            'audio/mpeg',
            'audio/mp4',
            'audio/aac',
            'audio/ogg',
            'audio/wav',
            'audio/flac',
            'audio/opus',
            'audio/x-ms-wma'
        ],
        BATCH_SIZE: 50,
        SCAN_DELAY: 100
    },

    /**
     * State
     */
    isScanning: false,
    scanProgress: 0,
    foundTracks: [],
    safDirectoryHandle: null,

    /**
     * Initialisierung
     */
    async init() {
        console.log('🎵 Android Music Scanner initialisieren...');

        // Prüfen ob Android Environment
        if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android') {
            console.log('✅ Android Environment erkannt');
            return true;
        } else {
            console.log('🌐 Web Environment - SAF nicht verfügbar');
            return false;
        }
    },

    /**
     * MediaStore Scan (Android System-Musikbibliothek)
     * Verwendet Capacitor Filesystem Plugin
     */
    async scanMediaStore() {
        console.log('📂 Scanne MediaStore...');

        if (typeof Capacitor === 'undefined' || Capacitor.getPlatform() !== 'android') {
            console.warn('⚠️ MediaStore nur auf Android verfügbar');
            return false;
        }

        try {
            this.isScanning = true;
            this.foundTracks = [];
            this.scanProgress = 0;

            const { Filesystem } = Capacitor.Plugins;
            if (!Filesystem) {
                throw new Error('Filesystem Plugin nicht verfügbar');
            }

            // Android MediaStore Zugriff
            // HINWEIS: Capacitor Filesystem hat keinen direkten MediaStore Query
            // Wir müssen über bekannte Musik-Ordner scannen
            const musicDirectories = [
                'Music',
                'Download',
                'Documents/Music',
                'Podcasts',
                'Ringtones',
                'Notifications',
                'Alarms'
            ];

            for (const dir of musicDirectories) {
                await this.scanDirectory(dir);
            }

            console.log(`✅ MediaStore Scan abgeschlossen: ${this.foundTracks.length} Tracks gefunden`);

            // In MusicLibraryManager speichern
            await this.saveTracks();

            this.isScanning = false;
            return true;
        } catch (error) {
            console.error('❌ MediaStore Scan Fehler:', error);
            this.isScanning = false;
            return false;
        }
    },

    /**
     * Verzeichnis scannen (rekursiv)
     */
    async scanDirectory(dirPath) {
        try {
            const { Filesystem } = Capacitor.Plugins;

            // Verzeichnis-Inhalt lesen
            const result = await Filesystem.readdir({
                path: dirPath,
                directory: 'ExternalStorage'
            });

            for (const file of result.files) {
                const fullPath = `${dirPath}/${file.name}`;

                // Ist es ein Verzeichnis?
                if (file.type === 'directory') {
                    // Rekursiv scannen
                    await this.scanDirectory(fullPath);
                } else {
                    // Ist es eine Audio-Datei?
                    if (this.isAudioFile(file.name)) {
                        await this.processFile(fullPath, file.name);
                    }
                }
            }
        } catch (error) {
            // Verzeichnis existiert nicht oder kein Zugriff - ignorieren
            if (!error.message.includes('does not exist')) {
                console.warn(`⚠️ Fehler beim Scannen von ${dirPath}:`, error);
            }
        }
    },

    /**
     * Ist Datei eine Audio-Datei?
     */
    isAudioFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return this.config.SUPPORTED_FORMATS.includes(ext);
    },

    /**
     * Datei verarbeiten & Metadaten extrahieren
     */
    async processFile(filePath, filename) {
        try {
            const { Filesystem } = Capacitor.Plugins;

            // Datei-Informationen abrufen
            const stat = await Filesystem.stat({
                path: filePath,
                directory: 'ExternalStorage'
            });

            // Track-Objekt erstellen
            const track = {
                title: filename.replace(/\.[^/.]+$/, ''), // Extension entfernen
                artist: 'Unbekannter Künstler',
                album: 'Unbekanntes Album',
                duration: 0,
                filePath: filePath,
                fileSize: stat.size,
                mimeType: this.getMimeType(filename),
                dateAdded: Date.now(),
                source: 'MediaStore'
            };

            this.foundTracks.push(track);
            this.scanProgress++;

            // UI Update
            this.updateScanProgress();

            console.log(`📄 Gefunden: ${track.title}`);
        } catch (error) {
            console.warn(`⚠️ Fehler bei ${filename}:`, error);
        }
    },

    /**
     * MIME Type ermitteln
     */
    getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeMap = {
            'mp3': 'audio/mpeg',
            'm4a': 'audio/mp4',
            'aac': 'audio/aac',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'flac': 'audio/flac',
            'opus': 'audio/opus',
            'wma': 'audio/x-ms-wma'
        };
        return mimeMap[ext] || 'audio/mpeg';
    },

    /**
     * Storage Access Framework (SAF) - User wählt Ordner
     */
    async requestSAFAccess() {
        console.log('📂 Fordere SAF Ordner-Zugriff an...');

        try {
            // Web File System Access API (Chrome/Edge)
            if ('showDirectoryPicker' in window) {
                this.safDirectoryHandle = await window.showDirectoryPicker({
                    mode: 'read',
                    startIn: 'music'
                });

                console.log('✅ SAF Ordner-Zugriff erteilt:', this.safDirectoryHandle.name);
                return true;
            }
            // Capacitor SAF (via Custom Plugin - falls implementiert)
            else if (typeof Capacitor !== 'undefined') {
                console.warn('⚠️ SAF über Capacitor nicht direkt unterstützt');
                console.log('💡 Fallback: Nutze File System Access API (nur in Browser verfügbar)');
                return false;
            }

            console.error('❌ SAF nicht unterstützt');
            return false;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ SAF Zugriff Fehler:', error);
            }
            return false;
        }
    },

    /**
     * SAF Ordner scannen (rekursiv)
     */
    async scanSAFFolder() {
        if (!this.safDirectoryHandle) {
            console.error('❌ Kein SAF Ordner ausgewählt');
            return false;
        }

        console.log('📂 Scanne SAF Ordner...');

        try {
            this.isScanning = true;
            this.foundTracks = [];
            this.scanProgress = 0;

            await this.scanSAFDirectory(this.safDirectoryHandle);

            console.log(`✅ SAF Scan abgeschlossen: ${this.foundTracks.length} Tracks gefunden`);

            // In MusicLibraryManager speichern
            await this.saveTracks();

            this.isScanning = false;
            return true;
        } catch (error) {
            console.error('❌ SAF Scan Fehler:', error);
            this.isScanning = false;
            return false;
        }
    },

    /**
     * SAF Verzeichnis scannen (rekursiv)
     */
    async scanSAFDirectory(directoryHandle) {
        try {
            for await (const entry of directoryHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    if (this.isAudioFile(file.name)) {
                        await this.processSAFFile(file, entry);
                    }
                } else if (entry.kind === 'directory') {
                    // Rekursiv
                    await this.scanSAFDirectory(entry);
                }
            }
        } catch (error) {
            console.error('❌ SAF Directory Scan Fehler:', error);
        }
    },

    /**
     * SAF Datei verarbeiten
     */
    async processSAFFile(file, fileHandle) {
        try {
            // Track-Objekt erstellen
            const track = {
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unbekannter Künstler',
                album: 'Unbekanntes Album',
                duration: 0,
                filePath: fileHandle.name, // Relative Path
                fileHandle: fileHandle, // FileSystemFileHandle speichern
                fileSize: file.size,
                mimeType: file.type || this.getMimeType(file.name),
                dateAdded: Date.now(),
                source: 'SAF'
            };

            this.foundTracks.push(track);
            this.scanProgress++;

            // UI Update
            this.updateScanProgress();

            console.log(`📄 SAF Gefunden: ${track.title}`);
        } catch (error) {
            console.warn(`⚠️ SAF Datei Fehler:`, error);
        }
    },

    /**
     * Tracks in MusicLibraryManager speichern
     */
    async saveTracks() {
        if (!window.musicLibraryManager) {
            console.error('❌ MusicLibraryManager nicht verfügbar');
            return false;
        }

        console.log(`💾 Speichere ${this.foundTracks.length} Tracks...`);

        let added = 0;
        let duplicates = 0;

        for (const track of this.foundTracks) {
            try {
                const result = await window.musicLibraryManager.database.addTrack(track);
                if (result.isDuplicate) {
                    duplicates++;
                } else {
                    added++;
                }
            } catch (error) {
                console.warn('⚠️ Track speichern fehlgeschlagen:', error);
            }
        }

        console.log(`✅ ${added} Tracks hinzugefügt, ${duplicates} Duplikate übersprungen`);

        // UI Notification
        if (window.showGlobalNotification) {
            window.showGlobalNotification(`${added} neue Tracks hinzugefügt`, 'success');
        }

        return true;
    },

    /**
     * Scan Progress UI Update
     */
    updateScanProgress() {
        const progressBar = document.getElementById('androidScanProgress');
        const progressText = document.getElementById('androidScanText');

        if (progressBar) {
            progressBar.value = this.scanProgress;
            progressBar.max = this.foundTracks.length;
        }

        if (progressText) {
            progressText.textContent = `${this.scanProgress} Dateien gescannt`;
        }
    },

    /**
     * Metadaten aus Datei extrahieren (ID3 Tags)
     * HINWEIS: Benötigt zusätzliche Library (z.B. jsmediatags)
     */
    async extractMetadata(file) {
        // TODO: Implement ID3 Tag Reading
        // Placeholder - gibt Basis-Infos zurück
        return {
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Unbekannter Künstler',
            album: 'Unbekanntes Album',
            duration: 0,
            genre: '',
            year: 0,
            cover: null
        };
    },

    /**
     * Audio-Datei als Blob/File abrufen (für Playback)
     */
    async getAudioFile(track) {
        try {
            if (track.source === 'SAF' && track.fileHandle) {
                // File System Access API
                return await track.fileHandle.getFile();
            } else if (track.source === 'MediaStore' && track.filePath) {
                // Capacitor Filesystem
                const { Filesystem } = Capacitor.Plugins;
                const result = await Filesystem.readFile({
                    path: track.filePath,
                    directory: 'ExternalStorage'
                });

                // Base64 zu Blob konvertieren
                const blob = this.base64ToBlob(result.data, track.mimeType);
                return new File([blob], track.title + '.mp3', { type: track.mimeType });
            }

            throw new Error('Unbekannte Track-Quelle');
        } catch (error) {
            console.error('❌ Audio-Datei laden Fehler:', error);
            return null;
        }
    },

    /**
     * Base64 zu Blob konvertieren
     */
    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    },

    /**
     * Alle Scans stoppen
     */
    stopScanning() {
        this.isScanning = false;
        console.log('🛑 Scanning gestoppt');
    }
};

// Global verfügbar machen
window.AndroidMusicScanner = AndroidMusicScanner;
console.log('✅ Android Music Scanner geladen');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AndroidMusicScanner;
}
