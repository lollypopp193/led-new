/**
 * ===================================================================
 * MUSIC-LIBRARY-MANAGER.JS
 * File System Access API Integration für Android
 * Version: 1.0
 * Datum: 2025-10-08
 * ===================================================================
 *
 * Funktionen:
 * - File System Access API (Android Chrome)
 * - IndexedDB für persistente Musikbibliothek
 * - Metadaten-Extraktion (Künstler, Album, Titel)
 * - Playlist-Verwaltung
 * - Virtual Scrolling für Performance
 * - BroadcastChannel für Kommunikation
 * - Offline-First Architektur
 *
 * Browser-Support:
 * ✅ Chrome for Android (v86+)
 * ✅ Edge (v86+)
 * ❌ Safari/iOS (nicht unterstützt)
 *
 * ===================================================================
 */

'use strict';

// ===================================================================
// KONFIGURATION
// ===================================================================

const MUSIC_CONFIG = {
  // IndexedDB
  DB_NAME: 'MusicLibraryDB',
  DB_VERSION: 1,
  STORE_NAME: 'tracks',
  METADATA_STORE: 'metadata',
  PLAYLISTS_STORE: 'playlists',

  // File System Access
  ALLOWED_EXTENSIONS: ['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac', '.opus', '.wma'],
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500 MB

  // ✅ ALBUM-COVER UNTERSTÜTZUNG
  COVER_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_COVER_SIZE: 2 * 1024 * 1024, // 2 MB
  COVER_DIMENSIONS: {
    width: 300,
    height: 300
  },

  // Virtual Scrolling
  ITEMS_PER_PAGE: 50,

  // ✅ HARDWARE LED-SYNC EINSTELLUNGEN
  LED_SYNC: {
    ENABLED: true,
    BEAT_DETECTION: true,
    COLOR_MODE: 'spectrum', // spectrum, genre, mood
    BRIGHTNESS_SYNC: true,
    EFFECTS_ON_CHANGE: true
  },
  SCROLL_BUFFER: 10,

  // Performance
  BATCH_SIZE: 100,
  SCAN_DELAY: 50,

  // Storage Keys
  STORAGE_KEYS: {
    FOLDER_HANDLE: 'music-folder-handle',
    LAST_SCAN: 'music-last-scan',
    SETTINGS: 'music-library-settings'
  }
};

// ===================================================================
// INDEXEDDB MANAGER
// ===================================================================

class MusicDatabase {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  /**
   * Initialisiert IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(MUSIC_CONFIG.DB_NAME, MUSIC_CONFIG.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB Fehler:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('✅ IndexedDB initialisiert');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Tracks Store
        if (!db.objectStoreNames.contains(MUSIC_CONFIG.STORE_NAME)) {
          const trackStore = db.createObjectStore(MUSIC_CONFIG.STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          });
          trackStore.createIndex('title', 'title', {
            unique: false
          });
          trackStore.createIndex('artist', 'artist', {
            unique: false
          });
          trackStore.createIndex('album', 'album', {
            unique: false
          });
          trackStore.createIndex('filePath', 'filePath', {
            unique: true
          });
          trackStore.createIndex('dateAdded', 'dateAdded', {
            unique: false
          });
        }

        // Metadata Store
        if (!db.objectStoreNames.contains(MUSIC_CONFIG.METADATA_STORE)) {
          const metaStore = db.createObjectStore(MUSIC_CONFIG.METADATA_STORE, {
            keyPath: 'key'
          });
        }

        // Playlists Store
        if (!db.objectStoreNames.contains(MUSIC_CONFIG.PLAYLISTS_STORE)) {
          const playlistStore = db.createObjectStore(MUSIC_CONFIG.PLAYLISTS_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          playlistStore.createIndex('name', 'name', {
            unique: false
          });
        }

        console.log(' IndexedDB Schema erstellt');
      };
    });
  }

  /**
   * ✅ Prüft auf Duplikate
   */
  async checkDuplicate(track) {
    if (!this.isReady) return false;

    const allTracks = await this.getAllTracks();

    // Prüfe auf exakte Übereinstimmung (Title + Artist + Album)
    const exactMatch = allTracks.find(t =>
      t.title === track.title &&
      t.artist === track.artist &&
      t.album === track.album
    );

    if (exactMatch) return exactMatch;

    // Prüfe auf ähnliche Übereinstimmung (Title + Artist)
    const similarMatch = allTracks.find(t =>
      t.title === track.title &&
      t.artist === track.artist
    );

    return similarMatch || false;
  }

  /**
   * Fügt einen Track hinzu (mit Duplikat-Prüfung)
   */
  async addTrack(track) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    // ✅ Prüfe auf Duplikat
    const duplicate = await this.checkDuplicate(track);
    if (duplicate) {
      console.warn(`⚠️ Duplikat gefunden: ${track.title} - ${track.artist}`);
      return {
        isDuplicate: true,
        existingTrack: duplicate
      };
    }

    const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.add(track);
      request.onsuccess = () => resolve({
        isDuplicate: false,
        id: request.result
      });
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Fügt mehrere Tracks hinzu (Batch)
   */
  async addTracks(tracks) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);

      let added = 0;
      let errors = 0;

      for (const track of tracks) {
        const request = store.add(track);
        request.onsuccess = () => added++;
        request.onerror = () => errors++;
      }

      transaction.oncomplete = () => {
        console.log(`✅ ${added} Tracks hinzugefügt, ${errors} Fehler`);
        resolve({
          added,
          errors
        });
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Gibt alle Tracks zurück
   */
  async getAllTracks() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gibt Tracks nach Artist zurück
   */
  async getTracksByArtist(artist) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const index = store.index('artist');
      const request = index.getAll(artist);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gibt Tracks nach Album zurück
   */
  async getTracksByAlbum(album) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const index = store.index('album');
      const request = index.getAll(album);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sucht nach Tracks
   */
  async searchTracks(query) {
    const allTracks = await this.getAllTracks();
    const searchTerm = query.toLowerCase();

    return allTracks.filter(track => {
      return (track.title && track.title.toLowerCase().includes(searchTerm)) ||
        (track.artist && track.artist.toLowerCase().includes(searchTerm)) ||
        (track.album && track.album.toLowerCase().includes(searchTerm));
    });
  }

  /**
   * Löscht einen Track
   */
  async deleteTrack(id) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Löscht alle Tracks
   */
  async clearAllTracks() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ Alle Tracks gelöscht');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gibt Anzahl der Tracks zurück
   */
  async getTrackCount() {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly');
      const store = transaction.objectStore(MUSIC_CONFIG.STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Speichert Metadata
   */
  async setMetadata(key, value) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(MUSIC_CONFIG.METADATA_STORE);
      const request = store.put({
        key,
        value
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Lädt Metadata
   */
  async getMetadata(key) {
    if (!this.isReady) {
      throw new Error('Database not ready');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MUSIC_CONFIG.METADATA_STORE], 'readonly');
      const store = transaction.objectStore(MUSIC_CONFIG.METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? .value);
      request.onerror = () => reject(request.error);
    });
  }
}

// ===================================================================
// FILE SYSTEM ACCESS MANAGER
// ===================================================================

class FileSystemManager {
  constructor() {
    this.directoryHandle = null;
    this.hasPermission = false;
  }

  /**
   * Prüft Browser-Support
   */
  isSupported() {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Fordert Ordner-Zugriff an
   */
  async requestDirectory() {
    if (!this.isSupported()) {
      throw new Error('File System Access API wird nicht unterstützt. Bitte Chrome für Android verwenden.');
    }

    try {
      console.log('📁 Fordere Ordner-Zugriff an...');

      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'read',
        startIn: 'music' // Hint für Android
      });

      this.hasPermission = true;

      // Handle in IndexedDB speichern (für Persistenz)
      await this.saveDirectoryHandle();

      console.log('✅ Ordner-Zugriff gewährt:', this.directoryHandle.name);

      return this.directoryHandle;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('❌ Ordner-Auswahl abgebrochen');
      } else {
        console.error('❌ Fehler beim Ordner-Zugriff:', error);
      }
      throw error;
    }
  }

  /**
   * Lädt gespeicherten Directory Handle
   */
  async loadDirectoryHandle() {
    try {
      const db = new MusicDatabase();
      await db.init();

      const handle = await db.getMetadata(MUSIC_CONFIG.STORAGE_KEYS.FOLDER_HANDLE);

      if (handle) {
        this.directoryHandle = handle;

        // Berechtigung prüfen
        const permission = await this.directoryHandle.queryPermission({
          mode: 'read'
        });

        if (permission === 'granted') {
          this.hasPermission = true;
          console.log('✅ Gespeicherter Ordner-Zugriff wiederhergestellt');
          return true;
        } else if (permission === 'prompt') {
          // Berechtigung erneut anfordern
          const newPermission = await this.directoryHandle.requestPermission({
            mode: 'read'
          });
          this.hasPermission = (newPermission === 'granted');
          return this.hasPermission;
        }
      }

      return false;
    } catch (error) {
      console.warn('Gespeicherter Ordner-Zugriff konnte nicht geladen werden:', error);
      return false;
    }
  }

  /**
   * Speichert Directory Handle
   */
  async saveDirectoryHandle() {
    if (!this.directoryHandle) return;

    try {
      const db = new MusicDatabase();
      await db.init();
      await db.setMetadata(MUSIC_CONFIG.STORAGE_KEYS.FOLDER_HANDLE, this.directoryHandle);
      console.log('💾 Ordner-Zugriff gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern des Ordner-Zugriffs:', error);
    }
  }

  /**
   * Scannt Ordner nach Audiodateien
   */
  async scanDirectory(progressCallback) {
    if (!this.directoryHandle || !this.hasPermission) {
      throw new Error('Kein Ordner-Zugriff verfügbar');
    }

    console.log('🔍 Scanne Musikordner...');

    const files = [];
    let scannedCount = 0;

    try {
      await this.scanDirectoryRecursive(this.directoryHandle, files, (count) => {
        scannedCount = count;
        if (progressCallback) {
          progressCallback({
            scanned: count,
            phase: 'scanning'
          });
        }
      });

      console.log(`✅ Scan abgeschlossen: ${files.length} Audiodateien gefunden`);

      return files;
    } catch (error) {
      console.error('❌ Scan fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Rekursive Ordner-Scan-Funktion
   */
  async scanDirectoryRecursive(dirHandle, files, progressCallback, scannedCount = 0) {
    try {
      for await (const entry of dirHandle.values()) {
        scannedCount++;

        if (progressCallback && scannedCount % 10 === 0) {
          progressCallback(scannedCount);
        }

        if (entry.kind === 'file') {
          const fileName = entry.name.toLowerCase();
          const isAudio = MUSIC_CONFIG.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

          if (isAudio) {
            files.push({
              fileHandle: entry,
              name: entry.name,
              path: dirHandle.name + '/' + entry.name
            });
          }
        } else if (entry.kind === 'directory') {
          // Rekursiv in Unterordner scannen
          await this.scanDirectoryRecursive(entry, files, progressCallback, scannedCount);
        }
      }
    } catch (error) {
      console.error('Fehler beim Scannen von', dirHandle.name, ':', error);
    }

    return scannedCount;
  }

  /**
   * Liest Datei-Inhalt
   */
  async readFile(fileHandle) {
    try {
      const file = await fileHandle.getFile();

      // Größen-Check
      if (file.size > MUSIC_CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Datei zu groß: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      }

      return file;
    } catch (error) {
      console.error('Fehler beim Lesen der Datei:', error);
      throw error;
    }
  }
}

// ===================================================================
// METADATEN-EXTRAKTOR
// ===================================================================

class MetadataExtractor {
  /**
   * Extrahiert Metadaten aus Audiodatei
   */
  async extractMetadata(file) {
    try {
      // Versuche ID3-Tags zu lesen (falls jsmediatags verfügbar)
      if (window.jsmediatags) {
        return await this.extractID3Tags(file);
      }

      // Fallback: Parse Dateinamen
      return this.parseFileName(file.name);
    } catch (error) {
      console.warn('Metadaten-Extraktion fehlgeschlagen, nutze Dateinamen:', error);
      return this.parseFileName(file.name);
    }
  }

  /**
   * Extrahiert ID3-Tags
   */
  async extractID3Tags(file) {
    return new Promise((resolve, reject) => {
      window.jsmediatags.read(file, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          resolve({
            title: tags.title || this.parseFileName(file.name).title,
            artist: tags.artist || 'Unbekannter Künstler',
            album: tags.album || 'Unbekanntes Album',
            year: tags.year || null,
            genre: tags.genre || null,
            duration: null, // Wird später durch Audio-Element ermittelt
            cover: tags.picture ? this.convertPictureToDataURL(tags.picture) : null
          });
        },
        onError: (error) => {
          console.warn('ID3-Tag-Fehler:', error);
          resolve(this.parseFileName(file.name));
        }
      });
    });
  }

  /**
   * Konvertiert Cover-Bild zu Data-URL
   */
  convertPictureToDataURL(picture) {
    try {
      const {
        data,
        format
      } = picture;
      let base64String = '';

      for (let i = 0; i < data.length; i++) {
        base64String += String.fromCharCode(data[i]);
      }

      return `data:${format};base64,${window.btoa(base64String)}`;
    } catch (error) {
      console.error('Cover-Konvertierung fehlgeschlagen:', error);
      return null;
    }
  }

  /**
   * Extrahiert Dauer aus Audiodatei
   */
  async extractDuration(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve(duration);
      });

      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve(null);
      });

      audio.src = url;
    });
  }

  /**
   * Parsed Dateinamen für Metadaten
   */
  parseFileName(fileName) {
    // Entferne Dateiendung
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

    // Versuche Pattern zu matchen: "Artist - Title" oder "Artist - Album - Title"
    const patterns = [
      /^(.+?)\s*-\s*(.+?)\s*-\s*(.+)$/, // Artist - Album - Title
      /^(.+?)\s*-\s*(.+)$/, // Artist - Title
      /^(\d+)\s*-\s*(.+)$/, // Track Number - Title
      /^(\d+)\.\s*(.+)$/ // Track Number. Title
    ];

    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Artist - Album - Title
          return {
            artist: match[1].trim(),
            album: match[2].trim(),
            title: match[3].trim()
          };
        } else if (match.length === 3) {
          // Artist - Title ODER Track - Title
          if (/^\d+$/.test(match[1])) {
            // Track Number - Title
            return {
              title: match[2].trim(),
              artist: 'Unbekannter Künstler',
              album: 'Unbekanntes Album',
              trackNumber: parseInt(match[1])
            };
          } else {
            // Artist - Title
            return {
              artist: match[1].trim(),
              title: match[2].trim(),
              album: 'Unbekanntes Album'
            };
          }
        }
      }
    }

    // Kein Pattern gefunden - nutze Dateinamen als Titel
    return {
      title: nameWithoutExt,
      artist: 'Unbekannter Künstler',
      album: 'Unbekanntes Album'
    };
  }
}

// ===================================================================
// MUSIC LIBRARY MANAGER (HAUPTKLASSE)
// ===================================================================

class MusicLibraryManager {
  constructor() {
    this.db = new MusicDatabase();
    this.fsManager = new FileSystemManager();
    this.metadataExtractor = new MetadataExtractor();
    this.isInitialized = false;
    this.isScanning = false;
  }

  /**
   * Initialisiert Library Manager
   */
  async init() {
    try {
      console.log('🎵 Initialisiere Music Library Manager...');

      // IndexedDB initialisieren
      await this.db.init();

      // Versuche gespeicherten Ordner-Zugriff zu laden
      const hasStoredAccess = await this.fsManager.loadDirectoryHandle();

      if (hasStoredAccess) {
        console.log('✅ Gespeicherter Musikordner gefunden');
      }

      this.isInitialized = true;
      console.log('✅ Music Library Manager initialisiert');

      return true;
    } catch (error) {
      console.error('❌ Initialisierung fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Importiert Musikbibliothek
   */
  async importLibrary(progressCallback) {
    if (!this.isInitialized) {
      throw new Error('Manager nicht initialisiert');
    }

    if (this.isScanning) {
      throw new Error('Scan läuft bereits');
    }

    try {
      this.isScanning = true;

      // Schritt 1: Ordner-Zugriff anfordern
      if (progressCallback) {
        progressCallback({
          phase: 'requesting',
          progress: 0,
          message: 'Fordere Ordner-Zugriff an...'
        });
      }

      if (!this.fsManager.directoryHandle) {
        await this.fsManager.requestDirectory();
      }

      // Schritt 2: Ordner scannen
      if (progressCallback) {
        progressCallback({
          phase: 'scanning',
          progress: 10,
          message: 'Scanne Musikordner...'
        });
      }

      const files = await this.fsManager.scanDirectory((scanProgress) => {
        if (progressCallback) {
          progressCallback({
            phase: 'scanning',
            progress: 10 + (scanProgress.scanned / 10),
            message: `${scanProgress.scanned} Dateien gescannt...`
          });
        }
      });

      console.log(`📁 ${files.length} Audiodateien gefunden`);

      // Schritt 3: Metadaten extrahieren
      if (progressCallback) {
        progressCallback({
          phase: 'metadata',
          progress: 40,
          message: 'Extrahiere Metadaten...'
        });
      }

      const tracks = [];
      const batchSize = MUSIC_CONFIG.BATCH_SIZE;

      for (let i = 0; i < files.length; i++) {
        const fileInfo = files[i];

        try {
          // Datei lesen
          const file = await this.fsManager.readFile(fileInfo.fileHandle);

          // Metadaten extrahieren
          const metadata = await this.metadataExtractor.extractMetadata(file);

          // Dauer extrahieren
          const duration = await this.metadataExtractor.extractDuration(file);

          // Track-Objekt erstellen
          const track = {
            ...metadata,
            fileName: fileInfo.name,
            filePath: fileInfo.path,
            fileSize: file.size,
            duration: duration,
            dateAdded: Date.now(),
            fileHandle: fileInfo.fileHandle
          };

          tracks.push(track);

          // Progress-Update
          if (progressCallback && i % 10 === 0) {
            const progress = 40 + ((i / files.length) * 40);
            progressCallback({
              phase: 'metadata',
              progress,
              message: `${i}/${files.length} Tracks verarbeitet...`
            });
          }

          // Batch in DB speichern
          if (tracks.length >= batchSize) {
            await this.db.addTracks(tracks);
            tracks.length = 0; // Array leeren
          }

          // Delay für Performance
          if (i % 50 === 0) {
            await this.delay(MUSIC_CONFIG.SCAN_DELAY);
          }

        } catch (error) {
          console.error(`Fehler bei ${fileInfo.name}:`, error);
        }
      }

      // Restliche Tracks speichern
      if (tracks.length > 0) {
        await this.db.addTracks(tracks);
      }

      // Schritt 4: Abschluss
      if (progressCallback) {
        progressCallback({
          phase: 'complete',
          progress: 100,
          message: 'Import abgeschlossen!'
        });
      }

      // Letzten Scan-Zeitstempel speichern
      await this.db.setMetadata(MUSIC_CONFIG.STORAGE_KEYS.LAST_SCAN, Date.now());

      const totalTracks = await this.db.getTrackCount();
      console.log(`✅ Import abgeschlossen: ${totalTracks} Tracks in Bibliothek`);

      this.isScanning = false;
      return totalTracks;

    } catch (error) {
      this.isScanning = false;
      console.error('❌ Import fehlgeschlagen:', error);
      throw error;
    }
  }

  /**
   * Gibt alle Tracks zurück
   */
  async getAllTracks() {
    return await this.db.getAllTracks();
  }

  /**
   * Sucht nach Tracks
   */
  async searchTracks(query) {
    return await this.db.searchTracks(query);
  }

  /**
   * Gibt Track-Anzahl zurück
   */
  async getTrackCount() {
    return await this.db.getTrackCount();
  }

  /**
   * Löscht alle Tracks
   */
  async clearLibrary() {
    return await this.db.clearAllTracks();
  }

  /**
   * Gibt Library-Statistiken zurück
   */
  async getStatistics() {
    const tracks = await this.db.getAllTracks();

    const artists = new Set();
    const albums = new Set();
    let totalDuration = 0;

    tracks.forEach(track => {
      if (track.artist) artists.add(track.artist);
      if (track.album) albums.add(track.album);
      if (track.duration) totalDuration += track.duration;
    });

    return {
      totalTracks: tracks.length,
      totalArtists: artists.size,
      totalAlbums: albums.size,
      totalDuration: totalDuration,
      totalDurationFormatted: this.formatDuration(totalDuration)
    };
  }

  /**
   * Formatiert Dauer
   */
  formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Delay Helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ HARDWARE LED-SYNC BEI TRACK-WECHSEL
   */
  async syncLEDsWithTrack(track) {
    if (!MUSIC_CONFIG.LED_SYNC.ENABLED) return;

    // Genre-basierte Farben
    const genreColors = {
      'rock': [255, 0, 0], // Rot
      'pop': [255, 0, 255], // Magenta
      'electronic': [0, 255, 255], // Cyan
      'jazz': [255, 165, 0], // Orange
      'classical': [255, 255, 0], // Gelb
      'hip-hop': [128, 0, 255], // Lila
      'default': [0, 255, 0] // Grün
    };

    const genre = (track.genre || '').toLowerCase();
    const color = genreColors[genre] || genreColors['default'];

    // ✅ SENDE FARBE AN HARDWARE
    if (window.sendUniversalColor) {
      await window.sendUniversalColor(color[0], color[1], color[2]);
      console.log(`🎨 LED-Sync: ${track.title} → RGB(${color.join(', ')})`);
    }

    // ✅ EFFEKT BEI TRACK-WECHSEL
    if (MUSIC_CONFIG.LED_SYNC.EFFECTS_ON_CHANGE) {
      if (window.sendUniversalEffect) {
        await window.sendUniversalEffect('pulse', 5);
        await this.delay(500);
        await window.sendUniversalEffect('fade', 3);
      }
    }
  }

  /**
   * ✅ SPIELE TRACK MIT LED-SYNC
   */
  async playTrackWithLEDSync(track) {
    // LED-Sync beim Start
    await this.syncLEDsWithTrack(track);

    // Sende Track-Info an Audio-Player
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'playTrack',
        track: track,
        ledSync: true
      }, '*');
    }

    // Beat-Detection aktivieren
    if (MUSIC_CONFIG.LED_SYNC.BEAT_DETECTION) {
      this.startBeatDetection(track);
    }

    return true;
  }

  /**
   * ✅ BEAT-DETECTION FÜR LED-SYNC
   */
  async startBeatDetection(track) {
    if (!window.AudioContext) return;

    try {
      const audioContext = new AudioContext();
      const response = await fetch(track.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Analysiere Audio für Beat-Detection
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Beat-Detection Loop
      const detectBeats = () => {
        if (!MUSIC_CONFIG.LED_SYNC.ENABLED) return;

        analyser.getByteFrequencyData(dataArray);

        // Bass-Frequenzen für Beat-Detection
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10;

        if (bass > 200) { // Beat erkannt
          // ✅ SENDE BEAT-FLASH AN HARDWARE
          if (window.ledDevice && window.ledDevice.isConnected) {
            const flashCmd = new Uint8Array([0x7E, 0x00, 0x07, 0x01, 0xFF, 0xFF, 0xFF, 0xEF]);
            window.ledDevice.characteristic.writeValue(flashCmd).catch(() => { });
          }
        }

        requestAnimationFrame(detectBeats);
      };

      detectBeats();

    } catch (error) {
      console.error('Beat-Detection Fehler:', error);
    }
  }

  /**
   * ✅ PLAYLIST MIT LED-SHOW
   */
  async startPlaylistWithLEDShow(playlist) {
    console.log('🎵 Starte Playlist mit LED-Show:', playlist.name);

    // Aktiviere Party-Mode für Playlists
    if (window.sendUniversalEffect) {
      await window.sendUniversalEffect('party', 8);
    }

    // Rotiere durch Farben basierend auf Tracks
    for (const track of playlist.tracks) {
      await this.syncLEDsWithTrack(track);
      await this.delay(100);
    }

    return true;
  }
}

// ===================================================================
// GLOBALE INSTANZ
// ===================================================================

// Music Library Manager global verfügbar machen
window.MusicLibraryManager = MusicLibraryManager;

// Initialisiere nur wenn noch nicht vorhanden (Kompatibilität mit musik.html Scanner)
if (!window.musicLibrary) {
  window.musicLibrary = new MusicLibraryManager();
  console.log('✅ Music Library Manager global verfügbar als window.musicLibrary');
} else {
  console.log('ℹ️ window.musicLibrary bereits vorhanden, behalte existierende Instanz');
}

// Exportiere auch die Klassen für externe Verwendung
window.MusicDatabase = MusicDatabase;
window.FileSystemManager = FileSystemManager;
window.MetadataExtractor = MetadataExtractor;

// ===================================================================
// EXPORT
// ===================================================================

// Browser-kompatible Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MusicLibraryManager,
    MusicDatabase,
    FileSystemManager,
    MetadataExtractor
  };
} else if (typeof window !== 'undefined') {
  window.MusicLibraryManager = MusicLibraryManager;
  window.MusicDatabase = MusicDatabase;
  window.FileSystemManager = FileSystemManager;
  window.MetadataExtractor = MetadataExtractor;
}
