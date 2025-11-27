/**
 * MEDIASTORE-BRIDGE.JS - Native Android MediaStore Integration
 * Zugriff auf Android's MediaStore.Audio für Musikdateien
 * Unterstützt: Android 10-14, READ_MEDIA_AUDIO Permission
 * @version 1.0
 * @requires Capacitor Filesystem Plugin
 */
'use strict';

/**
 * MediaStore Bridge - Verbindet Web-App mit Android MediaStore
 */
class MediaStoreBridge {
    constructor() {
        this.isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
        this.tracks = [];
        this.artists = new Map();
        this.albums = new Map();
        this.genres = new Map();
        this.folders = new Map();
        this.isScanning = false;
        this.lastScanTime = null;

        // Caching
        this.CACHE_KEY = 'mediastore-cache';
        this.CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 Stunden

        // Pre-computed Features Storage
        this.FEATURES_KEY = 'track-features';
        this.trackFeatures = {};

        this.init();
    }

    /**
     * Initialisierung
     */
    async init() {
        this.loadCache();
        this.loadTrackFeatures();
        console.log('✅ MediaStore Bridge initialisiert');
        console.log(`📱 Native Platform: ${this.isNative}`);

        if (this.tracks.length > 0) {
            console.log(`📋 ${this.tracks.length} Tracks aus Cache geladen`);
        }
    }

    /**
     * Permissions prüfen und anfordern
     */
    async checkPermissions() {
        if (!this.isNative) {
            console.log('⚠️ Nicht auf nativer Plattform - verwende File System Access API');
            return true;
        }

        try {
            // Capacitor Permissions prüfen
            if (Capacitor.Plugins.Permissions) {
                const { Permissions } = Capacitor.Plugins;

                // Android 13+ braucht READ_MEDIA_AUDIO
                const result = await Permissions.query({ name: 'storage' });

                if (result.state !== 'granted') {
                    const requestResult = await Permissions.request({ name: 'storage' });
                    return requestResult.state === 'granted';
                }

                return true;
            }

            // Fallback: Filesystem Plugin
            if (Capacitor.Plugins.Filesystem) {
                const { Filesystem } = Capacitor.Plugins;
                const result = await Filesystem.checkPermissions();

                if (result.publicStorage !== 'granted') {
                    const requestResult = await Filesystem.requestPermissions();
                    return requestResult.publicStorage === 'granted';
                }

                return true;
            }

            console.warn('⚠️ Keine Permission-API verfügbar');
            return true;
        } catch (error) {
            console.error('❌ Permission-Check Fehler:', error);
            return false;
        }
    }

    /**
     * Musikbibliothek scannen
     * @param {boolean} forceRescan - Cache ignorieren
     */
    async scanLibrary(forceRescan = false) {
        if (this.isScanning) {
            console.warn('⚠️ Scan läuft bereits');
            return this.tracks;
        }

        // Cache prüfen
        if (!forceRescan && this.isCacheValid()) {
            console.log('📋 Verwende gecachte Bibliothek');
            return this.tracks;
        }

        this.isScanning = true;
        console.log('🔍 Starte Bibliothek-Scan...');

        try {
            const hasPermission = await this.checkPermissions();
            if (!hasPermission) {
                throw new Error('Keine Berechtigung für Musikzugriff');
            }

            if (this.isNative) {
                await this.scanNativeLibrary();
            } else {
                await this.scanWebLibrary();
            }

            this.lastScanTime = Date.now();
            this.saveCache();
            this.buildIndices();

            console.log(`✅ Scan abgeschlossen: ${this.tracks.length} Tracks`);

            // Event dispatchen
            window.dispatchEvent(new CustomEvent('libraryScanned', {
                detail: {
                    trackCount: this.tracks.length,
                    artistCount: this.artists.size,
                    albumCount: this.albums.size
                }
            }));

            return this.tracks;
        } catch (error) {
            console.error('❌ Scan-Fehler:', error);
            throw error;
        } finally {
            this.isScanning = false;
        }
    }

    /**
     * Native Android MediaStore scannen
     */
    async scanNativeLibrary() {
        if (!Capacitor.Plugins.Filesystem) {
            throw new Error('Filesystem Plugin nicht verfügbar');
        }

        const { Filesystem } = Capacitor.Plugins;

        // Musik-Verzeichnisse durchsuchen
        const musicDirs = [
            'Music',
            'Download',
            'Podcasts',
            'Ringtones',
            'Notifications'
        ];

        this.tracks = [];

        for (const dir of musicDirs) {
            try {
                const result = await Filesystem.readdir({
                    path: dir,
                    directory: 'EXTERNAL'
                });

                for (const file of result.files) {
                    if (this.isAudioFile(file.name)) {
                        const track = await this.processNativeFile(file, dir);
                        if (track) {
                            this.tracks.push(track);
                        }
                    }
                }
            } catch (error) {
                // Verzeichnis existiert möglicherweise nicht
                console.warn(`⚠️ Konnte ${dir} nicht lesen:`, error.message);
            }
        }

        // Rekursiv durch Unterordner (falls vorhanden)
        await this.scanNativeSubfolders('Music');
    }

    /**
     * Unterordner rekursiv scannen
     */
    async scanNativeSubfolders(basePath, depth = 0) {
        if (depth > 5) return; // Max Tiefe

        const { Filesystem } = Capacitor.Plugins;

        try {
            const result = await Filesystem.readdir({
                path: basePath,
                directory: 'EXTERNAL'
            });

            for (const entry of result.files) {
                if (entry.type === 'directory') {
                    // Rekursiv in Unterordner
                    await this.scanNativeSubfolders(`${basePath}/${entry.name}`, depth + 1);
                } else if (this.isAudioFile(entry.name)) {
                    const track = await this.processNativeFile(entry, basePath);
                    if (track && !this.tracks.find(t => t.path === track.path)) {
                        this.tracks.push(track);
                    }
                }
            }
        } catch (error) {
            // Ignorieren - Ordner nicht lesbar
        }
    }

    /**
     * Native Datei verarbeiten
     */
    async processNativeFile(file, directory) {
        try {
            const path = `${directory}/${file.name}`;

            // Basis-Metadaten aus Dateiname extrahieren
            const { artist, title, album } = this.parseFilename(file.name);

            const track = {
                id: this.generateId(path),
                path: path,
                filename: file.name,
                title: title,
                artist: artist,
                album: album,
                duration: 0, // Wird beim Abspielen ermittelt
                size: file.size || 0,
                dateAdded: Date.now(),
                dateModified: file.mtime || Date.now(),
                genre: '',
                year: 0,
                trackNumber: 0,
                cover: null,
                isFavorite: false,
                playCount: 0,
                lastPlayed: null,
                // Pre-computed Features (falls vorhanden)
                features: this.trackFeatures[path] || null
            };

            return track;
        } catch (error) {
            console.warn(`⚠️ Fehler bei ${file.name}:`, error);
            return null;
        }
    }

    /**
     * Web-basiertes Scannen (File System Access API)
     */
    async scanWebLibrary() {
        if (!('showDirectoryPicker' in window)) {
            console.warn('⚠️ File System Access API nicht verfügbar');
            return;
        }

        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read',
                startIn: 'music'
            });

            await this.scanWebDirectory(dirHandle, '');
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    }

    /**
     * Web-Verzeichnis rekursiv scannen
     */
    async scanWebDirectory(dirHandle, basePath) {
        for await (const entry of dirHandle.values()) {
            const path = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (entry.kind === 'file') {
                if (this.isAudioFile(entry.name)) {
                    const file = await entry.getFile();
                    const track = await this.processWebFile(file, path, entry);
                    if (track) {
                        this.tracks.push(track);
                    }
                }
            } else if (entry.kind === 'directory') {
                await this.scanWebDirectory(entry, path);
            }
        }
    }

    /**
     * Web-Datei verarbeiten
     */
    async processWebFile(file, path, fileHandle) {
        const { artist, title, album } = this.parseFilename(file.name);

        const track = {
            id: this.generateId(path),
            path: path,
            filename: file.name,
            title: title,
            artist: artist,
            album: album,
            duration: 0,
            size: file.size,
            dateAdded: Date.now(),
            dateModified: file.lastModified,
            genre: '',
            year: 0,
            trackNumber: 0,
            cover: null,
            isFavorite: false,
            playCount: 0,
            lastPlayed: null,
            fileHandle: fileHandle,
            features: this.trackFeatures[path] || null
        };

        // Versuche Dauer zu ermitteln
        try {
            track.duration = await this.getAudioDuration(file);
        } catch (error) {
            // Ignorieren
        }

        return track;
    }

    /**
     * Audio-Dauer ermitteln
     */
    getAudioDuration(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);

            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(url);
                resolve(audio.duration);
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                reject(new Error('Could not load audio'));
            });

            // Timeout
            setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve(0);
            }, 3000);

            audio.src = url;
        });
    }

    /**
     * Dateiname parsen (Artist - Title.mp3)
     */
    parseFilename(filename) {
        // Erweiterung entfernen
        const name = filename.replace(/\.[^/.]+$/, '');

        // Typische Muster: "Artist - Title", "01 - Title", "Artist_Title"
        const patterns = [
            /^(.+?)\s*-\s*(.+)$/,           // Artist - Title
            /^\d+\s*[-._]\s*(.+)$/,          // 01 - Title
            /^(.+?)_(.+)$/                   // Artist_Title
        ];

        for (const pattern of patterns) {
            const match = name.match(pattern);
            if (match) {
                if (match.length === 3) {
                    return {
                        artist: match[1].trim(),
                        title: match[2].trim(),
                        album: 'Unbekanntes Album'
                    };
                } else if (match.length === 2) {
                    return {
                        artist: 'Unbekannter Künstler',
                        title: match[1].trim(),
                        album: 'Unbekanntes Album'
                    };
                }
            }
        }

        return {
            artist: 'Unbekannter Künstler',
            title: name,
            album: 'Unbekanntes Album'
        };
    }

    /**
     * Prüfen ob Audio-Datei
     */
    isAudioFile(filename) {
        const audioExtensions = ['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac', '.opus', '.wma', '.webm'];
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return audioExtensions.includes(ext);
    }

    /**
     * ID generieren
     */
    generateId(path) {
        let hash = 0;
        for (let i = 0; i < path.length; i++) {
            const char = path.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'track_' + Math.abs(hash).toString(36);
    }

    /**
     * Indizes aufbauen (Artist, Album, Genre, Folder)
     */
    buildIndices() {
        this.artists.clear();
        this.albums.clear();
        this.genres.clear();
        this.folders.clear();

        for (const track of this.tracks) {
            // Artists
            if (track.artist) {
                if (!this.artists.has(track.artist)) {
                    this.artists.set(track.artist, []);
                }
                this.artists.get(track.artist).push(track);
            }

            // Albums
            if (track.album) {
                if (!this.albums.has(track.album)) {
                    this.albums.set(track.album, []);
                }
                this.albums.get(track.album).push(track);
            }

            // Genres
            if (track.genre) {
                if (!this.genres.has(track.genre)) {
                    this.genres.set(track.genre, []);
                }
                this.genres.get(track.genre).push(track);
            }

            // Folders
            const folder = track.path.split('/').slice(0, -1).join('/') || '/';
            if (!this.folders.has(folder)) {
                this.folders.set(folder, []);
            }
            this.folders.get(folder).push(track);
        }

        console.log(`📊 Indizes: ${this.artists.size} Künstler, ${this.albums.size} Alben, ${this.folders.size} Ordner`);
    }

    /**
     * Pre-computed Features speichern
     */
    async saveTrackFeatures(trackId, features) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return false;

        this.trackFeatures[track.path] = {
            bpm: features.bpm || 0,
            energy: features.energy || 0,
            spectralCentroid: features.spectralCentroid || 0,
            bassAverage: features.bassAverage || 0,
            midAverage: features.midAverage || 0,
            trebleAverage: features.trebleAverage || 0,
            genre: features.genre || 'unknown',
            analyzedAt: Date.now()
        };

        track.features = this.trackFeatures[track.path];

        try {
            localStorage.setItem(this.FEATURES_KEY, JSON.stringify(this.trackFeatures));
            console.log(`✅ Features gespeichert für: ${track.title}`);
            return true;
        } catch (error) {
            console.error('❌ Features-Speichern Fehler:', error);
            return false;
        }
    }

    /**
     * Pre-computed Features laden
     */
    loadTrackFeatures() {
        try {
            const stored = localStorage.getItem(this.FEATURES_KEY);
            if (stored) {
                this.trackFeatures = JSON.parse(stored);
                console.log(`✅ ${Object.keys(this.trackFeatures).length} Track-Features geladen`);
            }
        } catch (error) {
            console.error('❌ Features-Laden Fehler:', error);
            this.trackFeatures = {};
        }
    }

    /**
     * Cache speichern
     */
    saveCache() {
        try {
            const cacheData = {
                tracks: this.tracks,
                lastScanTime: this.lastScanTime,
                version: '1.0'
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
            console.log('💾 Bibliothek-Cache gespeichert');
        } catch (error) {
            console.error('❌ Cache-Speichern Fehler:', error);
        }
    }

    /**
     * Cache laden
     */
    loadCache() {
        try {
            const stored = localStorage.getItem(this.CACHE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.tracks = data.tracks || [];
                this.lastScanTime = data.lastScanTime || null;

                if (this.tracks.length > 0) {
                    this.buildIndices();
                }
            }
        } catch (error) {
            console.error('❌ Cache-Laden Fehler:', error);
            this.tracks = [];
        }
    }

    /**
     * Cache-Gültigkeit prüfen
     */
    isCacheValid() {
        if (!this.lastScanTime) return false;
        return (Date.now() - this.lastScanTime) < this.CACHE_EXPIRY;
    }

    /**
     * Cache leeren
     */
    clearCache() {
        this.tracks = [];
        this.artists.clear();
        this.albums.clear();
        this.genres.clear();
        this.folders.clear();
        this.lastScanTime = null;
        localStorage.removeItem(this.CACHE_KEY);
        console.log('🗑️ Cache geleert');
    }

    // === Abfrage-Methoden ===

    getAllTracks() {
        return this.tracks;
    }

    getTrackById(id) {
        return this.tracks.find(t => t.id === id);
    }

    getTracksByArtist(artist) {
        return this.artists.get(artist) || [];
    }

    getTracksByAlbum(album) {
        return this.albums.get(album) || [];
    }

    getTracksByGenre(genre) {
        return this.genres.get(genre) || [];
    }

    getTracksByFolder(folder) {
        return this.folders.get(folder) || [];
    }

    getAllArtists() {
        return Array.from(this.artists.keys()).sort();
    }

    getAllAlbums() {
        return Array.from(this.albums.keys()).sort();
    }

    getAllGenres() {
        return Array.from(this.genres.keys()).sort();
    }

    getAllFolders() {
        return Array.from(this.folders.keys()).sort();
    }

    getFavorites() {
        return this.tracks.filter(t => t.isFavorite);
    }

    getRecentlyPlayed(limit = 50) {
        return this.tracks
            .filter(t => t.lastPlayed)
            .sort((a, b) => b.lastPlayed - a.lastPlayed)
            .slice(0, limit);
    }

    getMostPlayed(limit = 50) {
        return this.tracks
            .filter(t => t.playCount > 0)
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
    }

    search(query) {
        if (!query || query.trim() === '') return [];

        const lowerQuery = query.toLowerCase();
        return this.tracks.filter(track =>
            (track.title && track.title.toLowerCase().includes(lowerQuery)) ||
            (track.artist && track.artist.toLowerCase().includes(lowerQuery)) ||
            (track.album && track.album.toLowerCase().includes(lowerQuery))
        );
    }

    // === Update-Methoden ===

    toggleFavorite(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.isFavorite = !track.isFavorite;
            this.saveCache();
            return track.isFavorite;
        }
        return false;
    }

    updatePlayCount(trackId) {
        const track = this.getTrackById(trackId);
        if (track) {
            track.playCount = (track.playCount || 0) + 1;
            track.lastPlayed = Date.now();
            this.saveCache();
        }
    }

    updateTrack(trackId, updates) {
        const track = this.getTrackById(trackId);
        if (track) {
            Object.assign(track, updates);
            this.saveCache();
            this.buildIndices();
            return true;
        }
        return false;
    }
}

// Global verfügbar machen
window.MediaStoreBridge = MediaStoreBridge;
window.mediaStoreBridge = new MediaStoreBridge();
console.log('✅ MediaStore Bridge global verfügbar als window.mediaStoreBridge');

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaStoreBridge;
}
