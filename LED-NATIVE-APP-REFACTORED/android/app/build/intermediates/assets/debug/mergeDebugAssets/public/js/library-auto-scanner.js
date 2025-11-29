/**
 * LIBRARY AUTO SCANNER - Automatisches Scannen der Musikbibliothek beim App-Start
 */
'use strict';

const LibraryAutoScanner = {
    isScanning: false,
    foundSongs: [],
    categories: {
        artists: new Set(),
        albums: new Set(),
        genres: new Set(),
        folders: new Set()
    },

    /**
     * Auto-Scan beim App-Start
     */
    async startAutoScan() {
        console.log('🔍 Starte automatischen Bibliotheks-Scan...');

        if (this.isScanning) {
            console.log('⚠️ Scan bereits aktiv');
            return;
        }

        this.isScanning = true;

        try {
            // Prüfe ob bereits gescannt
            const lastScan = localStorage.getItem('library-last-scan');
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;

            if (lastScan && (now - parseInt(lastScan)) < oneDayMs) {
                console.log('ℹ️ Bibliothek wurde kürzlich gescannt, lade gespeicherte Daten');
                this.loadStoredLibrary();
                return;
            }

            // Scanne Musikordner
            await this.scanMusicDirectories();

            // Speichere Scan-Zeitstempel
            localStorage.setItem('library-last-scan', now.toString());

            console.log(`✅ Auto-Scan abgeschlossen: ${this.foundSongs.length} Songs gefunden`);
        } catch (error) {
            console.error('❌ Auto-Scan Fehler:', error);
        } finally {
            this.isScanning = false;
        }
    },

    /**
     * Musikordner scannen
     */
    async scanMusicDirectories() {
        // Standard Musikordner
        const musicPaths = [
            '/storage/emulated/0/Music',
            '/storage/emulated/0/Download',
            '/sdcard/Music',
            '/sdcard/Download'
        ];

        for (const path of musicPaths) {
            try {
                await this.scanDirectory(path);
            } catch (error) {
                console.warn(`⚠️ Konnte ${path} nicht scannen:`, error);
            }
        }

        // Speichere gefundene Songs
        this.saveLibrary();
    },

    /**
     * Verzeichnis scannen
     */
    async scanDirectory(path) {
        // Capacitor Filesystem API
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
            try {
                const result = await window.Capacitor.Plugins.Filesystem.readdir({
                    path: path,
                    directory: 'EXTERNAL_STORAGE'
                });

                for (const file of result.files) {
                    if (this.isMusicFile(file.name)) {
                        await this.processAudioFile(path + '/' + file.name);
                    }
                }
            } catch (error) {
                console.warn('Filesystem API Fehler:', error);
            }
        }
    },

    /**
     * Prüfe ob Musikdatei
     */
    isMusicFile(filename) {
        const audioExtensions = ['.mp3', '.m4a', '.flac', '.wav', '.ogg', '.aac', '.opus'];
        return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },

    /**
     * Audio-Datei verarbeiten
     */
    async processAudioFile(filePath) {
        const song = {
            id: Date.now() + Math.random(),
            path: filePath,
            name: this.getFileName(filePath),
            artist: 'Unbekannter Kuenstler',
            album: 'Unbekanntes Album',
            genre: 'Unbekannt',
            duration: 0,
            addedAt: Date.now()
        };

        // Versuche Metadaten zu extrahieren (falls jsmediatags verfügbar)
        try {
            if (window.jsmediatags) {
                await this.extractMetadata(filePath, song);
            }
        } catch (error) {
            console.warn('Metadata Extraktion fehlgeschlagen:', error);
        }

        this.foundSongs.push(song);

        // Kategorien aktualisieren
        this.categories.artists.add(song.artist);
        this.categories.albums.add(song.album);
        this.categories.genres.add(song.genre);
        this.categories.folders.add(this.getFolder(filePath));
    },

    /**
     * Dateiname extrahieren
     */
    getFileName(path) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.[^/.]+$/, ''); // Ohne Extension
    },

    /**
     * Ordner extrahieren
     */
    getFolder(path) {
        const parts = path.split('/');
        return parts[parts.length - 2] || 'Root';
    },

    /**
     * Metadaten extrahieren
     */
    async extractMetadata(filePath, song) {
        // Placeholder - würde jsmediatags verwenden
        // Wird in Zukunft implementiert wenn Bibliothek eingebunden
    },

    /**
     * Bibliothek speichern
     */
    saveLibrary() {
        const library = {
            songs: this.foundSongs,
            categories: {
                artists: Array.from(this.categories.artists),
                albums: Array.from(this.categories.albums),
                genres: Array.from(this.categories.genres),
                folders: Array.from(this.categories.folders)
            },
            scanDate: Date.now()
        };

        localStorage.setItem('music-library', JSON.stringify(library));
        console.log(`💾 Bibliothek gespeichert: ${this.foundSongs.length} Songs`);

        // UI aktualisieren
        this.updateUI();
    },

    /**
     * Gespeicherte Bibliothek laden
     */
    loadStoredLibrary() {
        try {
            const stored = localStorage.getItem('music-library');
            if (stored) {
                const library = JSON.parse(stored);
                this.foundSongs = library.songs || [];

                if (library.categories) {
                    this.categories.artists = new Set(library.categories.artists);
                    this.categories.albums = new Set(library.categories.albums);
                    this.categories.genres = new Set(library.categories.genres);
                    this.categories.folders = new Set(library.categories.folders);
                }

                console.log(`📚 Bibliothek geladen: ${this.foundSongs.length} Songs`);
                this.updateUI();
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Bibliothek:', error);
        }
    },

    /**
     * UI aktualisieren
     */
    updateUI() {
        // Event auslösen für UI-Update
        if (window.musicLibrary) {
            window.musicLibrary.songs = this.foundSongs;
        }

        // LibraryManager benachrichtigen
        if (window.libraryManager) {
            window.libraryManager.refreshAllSections();
        }

        // Statistik anzeigen
        console.log(`📊 Bibliothek-Statistik:
            Songs: ${this.foundSongs.length}
            Künstler: ${this.categories.artists.size}
            Alben: ${this.categories.albums.size}
            Genres: ${this.categories.genres.size}`);
    },

    /**
     * Manueller Re-Scan
     */
    async manualRescan() {
        // Lösche alte Daten
        localStorage.removeItem('library-last-scan');
        this.foundSongs = [];
        this.categories = {
            artists: new Set(),
            albums: new Set(),
            genres: new Set(),
            folders: new Set()
        };

        // Starte Scan
        await this.startAutoScan();
    }
};

window.LibraryAutoScanner = LibraryAutoScanner;
