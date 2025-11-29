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
        // console.log('🎵 Android Music Scanner initialisieren...');

        // Prüfen ob Android Environment
        if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() === 'android') {
            // console.log('✅ Android Environment erkannt');
            return true;
        } else {
            // console.log('🌐 Web Environment - SAF nicht verfügbar');
            return false;
        }
    },

    /**
     * MediaStore Scan (Android System-Musikbibliothek)
     * Verwendet Capacitor Filesystem Plugin
     */
    async scanMediaStore() {
        // console.log('📂 Scanne MediaStore...');

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

            // console.log(`✅ MediaStore Scan abgeschlossen: ${this.foundTracks.length} Tracks gefunden`);

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

            // console.log(`📄 Gefunden: ${track.title}`);
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
        // console.log('📂 Fordere SAF Ordner-Zugriff an...');

        try {
            // Web File System Access API (Chrome/Edge)
            if ('showDirectoryPicker' in window) {
                this.safDirectoryHandle = await window.showDirectoryPicker({
                    mode: 'read',
                    startIn: 'music'
                });

                // console.log('✅ SAF Ordner-Zugriff erteilt:', this.safDirectoryHandle.name);
                return true;
            }
            // Capacitor SAF (via Custom Plugin - falls implementiert)
            else if (typeof Capacitor !== 'undefined') {
                console.warn('⚠️ SAF über Capacitor nicht direkt unterstützt');
                // console.log('💡 Fallback: Nutze File System Access API (nur in Browser verfügbar)');
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

        // console.log('📂 Scanne SAF Ordner...');

        try {
            this.isScanning = true;
            this.foundTracks = [];
            this.scanProgress = 0;

            await this.scanSAFDirectory(this.safDirectoryHandle);

            // console.log(`✅ SAF Scan abgeschlossen: ${this.foundTracks.length} Tracks gefunden`);

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

            // console.log(`📄 SAF Gefunden: ${track.title}`);
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

        // console.log(`💾 Speichere ${this.foundTracks.length} Tracks...`);

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

        // console.log(`✅ ${added} Tracks hinzugefügt, ${duplicates} Duplikate übersprungen`);

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
     * Unterstützt: MediaStore-Metadaten, ID3v1 Tags
     */
    async extractMetadata(file) {
        try {
            // Basis-Metadaten aus Dateiname
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            let metadata = {
                title: baseName,
                artist: 'Unbekannter Künstler',
                album: 'Unbekanntes Album',
                duration: 0,
                genre: '',
                year: 0,
                cover: null
            };

            // Versuch 1: Parse Dateiname (Format: "Artist - Title" oder "01. Title")
            const artistTitleMatch = baseName.match(/^(.+?)\s*-\s*(.+)$/);
            if (artistTitleMatch) {
                metadata.artist = artistTitleMatch[1].trim();
                metadata.title = artistTitleMatch[2].trim();
            }

            // Versuch 2: ID3v1 Tags lesen (letzte 128 Bytes der Datei)
            if (file instanceof File || file instanceof Blob) {
                const id3v1 = await this.readID3v1Tags(file);
                if (id3v1) {
                    if (id3v1.title) metadata.title = id3v1.title;
                    if (id3v1.artist) metadata.artist = id3v1.artist;
                    if (id3v1.album) metadata.album = id3v1.album;
                    if (id3v1.year) metadata.year = parseInt(id3v1.year) || 0;
                    if (id3v1.genre !== undefined) metadata.genre = this.getGenreName(id3v1.genre);
                }
            }

            // Versuch 3: Audio-Dauer ermitteln
            if (file instanceof File || file instanceof Blob) {
                metadata.duration = await this.getAudioDuration(file);
            }

            return metadata;
        } catch (error) {
            console.warn('⚠️ Metadaten-Extraktion fehlgeschlagen:', error);
            return {
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unbekannter Künstler',
                album: 'Unbekanntes Album',
                duration: 0,
                genre: '',
                year: 0,
                cover: null
            };
        }
    },

    /**
     * ID3v1 Tags lesen (letzte 128 Bytes)
     */
    async readID3v1Tags(file) {
        try {
            const size = file.size;
            if (size < 128) return null;

            const slice = file.slice(size - 128, size);
            const buffer = await slice.arrayBuffer();
            const view = new DataView(buffer);

            // Prüfe "TAG" Header
            const tag = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2));
            if (tag !== 'TAG') return null;

            // ID3v1 Format: TAG(3) + Title(30) + Artist(30) + Album(30) + Year(4) + Comment(30) + Genre(1)
            const decoder = new TextDecoder('iso-8859-1');

            return {
                title: decoder.decode(new Uint8Array(buffer, 3, 30)).replace(/\0/g, '').trim(),
                artist: decoder.decode(new Uint8Array(buffer, 33, 30)).replace(/\0/g, '').trim(),
                album: decoder.decode(new Uint8Array(buffer, 63, 30)).replace(/\0/g, '').trim(),
                year: decoder.decode(new Uint8Array(buffer, 93, 4)).replace(/\0/g, '').trim(),
                genre: view.getUint8(127)
            };
        } catch (error) {
            return null;
        }
    },

    /**
     * Audio-Dauer ermitteln
     */
    async getAudioDuration(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.preload = 'metadata';

            audio.onloadedmetadata = () => {
                resolve(Math.round(audio.duration));
                URL.revokeObjectURL(audio.src);
            };

            audio.onerror = () => {
                resolve(0);
                URL.revokeObjectURL(audio.src);
            };

            audio.src = URL.createObjectURL(file);
        });
    },

    /**
     * Genre-ID zu Name konvertieren (ID3v1 Standard)
     */
    getGenreName(genreId) {
        const genres = [
            'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge',
            'Hip-Hop', 'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B',
            'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial', 'Alternative', 'Ska',
            'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop',
            'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical', 'Instrumental',
            'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise', 'AlternRock',
            'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop',
            'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial',
            'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy',
            'Cult', 'Gangsta', 'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle',
            'Native American', 'Cabaret', 'New Wave', 'Psychedelic', 'Rave', 'Showtunes',
            'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro',
            'Musical', 'Rock & Roll', 'Hard Rock'
        ];
        return genres[genreId] || '';
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
        // console.log('🛑 Scanning gestoppt');
    }
};

// Global verfügbar machen
window.AndroidMusicScanner = AndroidMusicScanner;
// console.log('✅ Android Music Scanner geladen');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AndroidMusicScanner;
}
