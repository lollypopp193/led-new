/**
 * MUSIC-LIBRARY-MANAGER.JS v4.0 - ZERO TOLERANCE
 * IndexedDB + File System Access API für Musikbibliothek
 */
'use strict';

const MUSIC_CONFIG = { DB_NAME: 'MusicLibraryDB', DB_VERSION: 1, STORE_NAME: 'tracks', METADATA_STORE: 'metadata', PLAYLISTS_STORE: 'playlists', ALLOWED_EXTENSIONS: ['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac', '.opus', '.wma'], MAX_FILE_SIZE: 500 * 1024 * 1024, COVER_FORMATS: ['image/jpeg', 'image/png', 'image/webp'], MAX_COVER_SIZE: 2 * 1024 * 1024, COVER_DIMENSIONS: { width: 300, height: 300 }, ITEMS_PER_PAGE: 50, LED_SYNC: { ENABLED: true, BEAT_DETECTION: true, COLOR_MODE: 'spectrum', BRIGHTNESS_SYNC: true, EFFECTS_ON_CHANGE: true }, SCROLL_BUFFER: 10, BATCH_SIZE: 100, SCAN_DELAY: 50, STORAGE_KEYS: { FOLDER_HANDLE: 'music-folder-handle', LAST_SCAN: 'music-last-scan', SETTINGS: 'music-library-settings' } };

class MusicDatabase {
    constructor() { this.db = null; this.isReady = false; }
    async init() { return new Promise(function (resolve, reject) { const req = indexedDB.open(MUSIC_CONFIG.DB_NAME, MUSIC_CONFIG.DB_VERSION); req.onerror = function () { console.error('IndexedDB Fehler:', req.error); reject(req.error); }; req.onsuccess = function () { this.db = req.result; this.isReady = true; console.log('\u2705 IndexedDB initialisiert'); resolve(this.db); }.bind(this); req.onupgradeneeded = function (e) { const db = e.target.result; if (!db.objectStoreNames.contains(MUSIC_CONFIG.STORE_NAME)) { const trackStore = db.createObjectStore(MUSIC_CONFIG.STORE_NAME, { keyPath: 'id', autoIncrement: true }); trackStore.createIndex('title', 'title', { unique: false }); trackStore.createIndex('artist', 'artist', { unique: false }); trackStore.createIndex('album', 'album', { unique: false }); trackStore.createIndex('filePath', 'filePath', { unique: true }); trackStore.createIndex('dateAdded', 'dateAdded', { unique: false }); } if (!db.objectStoreNames.contains(MUSIC_CONFIG.METADATA_STORE)) { db.createObjectStore(MUSIC_CONFIG.METADATA_STORE, { keyPath: 'key' }); } if (!db.objectStoreNames.contains(MUSIC_CONFIG.PLAYLISTS_STORE)) { const playlistStore = db.createObjectStore(MUSIC_CONFIG.PLAYLISTS_STORE, { keyPath: 'id', autoIncrement: true }); playlistStore.createIndex('name', 'name', { unique: false }); } console.log('\u2705 IndexedDB Schema erstellt'); }; }.bind(this)); }
    async checkDuplicate(track) { if (!this.isReady) return false; const allTracks = await this.getAllTracks(); const exactMatch = allTracks.find(function (t) { return t.title === track.title && t.artist === track.artist && t.album === track.album; }); if (exactMatch) return exactMatch; const similarMatch = allTracks.find(function (t) { return t.title === track.title && t.artist === track.artist; }); return similarMatch || false; }
    async addTrack(track) { if (!this.isReady) throw new Error('Database not ready'); const duplicate = await this.checkDuplicate(track); if (duplicate) { console.warn('\u26a0\ufe0f Duplikat gefunden: ' + track.title + ' - ' + track.artist); return { isDuplicate: true, existingTrack: duplicate }; } const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); return new Promise(function (resolve, reject) { const req = store.add(track); req.onsuccess = function () { resolve({ id: req.result, isDuplicate: false }); }; req.onerror = function () { reject(req.error); }; }); }
    async getAllTracks() { if (!this.isReady) return []; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); const req = store.getAll(); req.onsuccess = function () { resolve(req.result || []); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async getTrackById(id) { if (!this.isReady) return null; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readonly'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); const req = store.get(id); req.onsuccess = function () { resolve(req.result); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async updateTrack(id, updates) { if (!this.isReady) return false; const track = await this.getTrackById(id); if (!track) return false; Object.assign(track, updates); return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); const req = store.put(track); req.onsuccess = function () { resolve(true); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async deleteTrack(id) { if (!this.isReady) return false; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); const req = store.delete(id); req.onsuccess = function () { resolve(true); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async searchTracks(query) { const allTracks = await this.getAllTracks(); const lowerQuery = query.toLowerCase(); return allTracks.filter(function (t) { return (t.title && t.title.toLowerCase().includes(lowerQuery)) || (t.artist && t.artist.toLowerCase().includes(lowerQuery)) || (t.album && t.album.toLowerCase().includes(lowerQuery)); }); }
    async getTracksByArtist(artist) { const allTracks = await this.getAllTracks(); return allTracks.filter(function (t) { return t.artist === artist; }); }
    async getTracksByAlbum(album) { const allTracks = await this.getAllTracks(); return allTracks.filter(function (t) { return t.album === album; }); }
    async clearLibrary() { if (!this.isReady) return false; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.STORE_NAME], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.STORE_NAME); const req = store.clear(); req.onsuccess = function () { console.log('\u2705 Bibliothek geleert'); resolve(true); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async addPlaylist(name, tracks) { if (!this.isReady) return null; const playlist = { name: name, tracks: tracks, dateCreated: Date.now(), dateModified: Date.now() }; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.PLAYLISTS_STORE], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.PLAYLISTS_STORE); const req = store.add(playlist); req.onsuccess = function () { resolve(req.result); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async getAllPlaylists() { if (!this.isReady) return []; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.PLAYLISTS_STORE], 'readonly'); const store = tx.objectStore(MUSIC_CONFIG.PLAYLISTS_STORE); const req = store.getAll(); req.onsuccess = function () { resolve(req.result || []); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
    async deletePlaylist(id) { if (!this.isReady) return false; return new Promise(function (resolve, reject) { const tx = this.db.transaction([MUSIC_CONFIG.PLAYLISTS_STORE], 'readwrite'); const store = tx.objectStore(MUSIC_CONFIG.PLAYLISTS_STORE); const req = store.delete(id); req.onsuccess = function () { resolve(true); }; req.onerror = function () { reject(req.error); }; }.bind(this)); }
}

class MusicLibraryManager {
    constructor() { this.database = new MusicDatabase(); this.folderHandle = null; this.isScanning = false; this.scanProgress = 0; this.totalFiles = 0; this.scannedFiles = 0; this.addedTracks = 0; this.duplicates = 0; }
    async init() { await this.database.init(); console.log('\u2705 Music Library Manager initialisiert'); }
    async requestFolderAccess() { try { if ('showDirectoryPicker' in window) { this.folderHandle = await window.showDirectoryPicker({ mode: 'read', startIn: 'music' }); console.log('\u2705 Ordner-Zugriff erteilt:', this.folderHandle.name); return true; } else { console.warn('\u26a0\ufe0f File System Access API nicht unterstützt'); if (window.showGlobalNotification) window.showGlobalNotification('Funktion nicht unterstützt in diesem Browser', 'warning'); return false; } } catch (err) { if (err.name !== 'AbortError') { console.error('Ordner-Zugriff Fehler:', err); } return false; } }
    async scanFolder() { if (!this.folderHandle) { console.error('Kein Ordner-Handle verfügbar'); return; } try { this.isScanning = true; this.scannedFiles = 0; this.addedTracks = 0; this.duplicates = 0; this.updateScanProgress(0); const files = []; await this.collectFiles(this.folderHandle, files); this.totalFiles = files.length; console.log('\ud83d\udcc2 ' + this.totalFiles + ' Dateien gefunden'); for (let i = 0; i < files.length; i++) { const file = files[i]; await this.processFile(file); this.scannedFiles++; this.updateScanProgress((this.scannedFiles / this.totalFiles) * 100); await this.delay(MUSIC_CONFIG.SCAN_DELAY); } this.isScanning = false; console.log('\u2705 Scan abgeschlossen: ' + this.addedTracks + ' hinzugefügt, ' + this.duplicates + ' Duplikate'); if (window.showGlobalNotification) window.showGlobalNotification('Scan abgeschlossen: ' + this.addedTracks + ' Tracks hinzugefügt', 'success'); } catch (err) { console.error('Scan-Fehler:', err); this.isScanning = false; if (window.showGlobalNotification) window.showGlobalNotification('Scan fehlgeschlagen', 'error'); } }
    async collectFiles(dirHandle, files) { for await (const entry of dirHandle.values()) { if (entry.kind === 'file') { const file = await entry.getFile(); if (this.isAudioFile(file)) { files.push({ file: file, fileHandle: entry, path: dirHandle.name + '/' + file.name }); } } else if (entry.kind === 'directory') { await this.collectFiles(entry, files); } } }
    isAudioFile(file) { const ext = '.' + file.name.split('.').pop().toLowerCase(); return MUSIC_CONFIG.ALLOWED_EXTENSIONS.includes(ext); }
    async processFile(fileData) { try { const metadata = await this.extractMetadata(fileData.file); const track = { title: metadata.title || fileData.file.name, artist: metadata.artist || 'Unbekannter Künstler', album: metadata.album || 'Unbekanntes Album', duration: metadata.duration || 0, filePath: fileData.path, fileHandle: fileData.fileHandle, dateAdded: Date.now(), genre: metadata.genre || '', year: metadata.year || 0, cover: metadata.cover || null }; const result = await this.database.addTrack(track); if (result.isDuplicate) { this.duplicates++; } else { this.addedTracks++; } } catch (err) { console.warn('Fehler beim Verarbeiten von ' + fileData.file.name + ':', err); } }
    async extractMetadata(file) { return new Promise(function (resolve) { const audio = new Audio(); const url = URL.createObjectURL(file); audio.src = url; audio.addEventListener('loadedmetadata', function () { const metadata = { title: file.name.replace(/\.[^/.]+$/, ''), artist: '', album: '', duration: audio.duration || 0, genre: '', year: 0, cover: null }; URL.revokeObjectURL(url); resolve(metadata); }); audio.addEventListener('error', function () { URL.revokeObjectURL(url); resolve({ title: file.name, artist: '', album: '', duration: 0 }); }); setTimeout(function () { URL.revokeObjectURL(url); resolve({ title: file.name, artist: '', album: '', duration: 0 }); }, 5000); }.bind(this)); }
    updateScanProgress(percent) { this.scanProgress = Math.round(percent); const progressBar = document.getElementById('scanProgressBar'); const progressText = document.getElementById('scanProgressText'); if (progressBar) progressBar.style.width = this.scanProgress + '%'; if (progressText) progressText.textContent = this.scannedFiles + ' / ' + this.totalFiles + ' (' + this.scanProgress + '%)'; }
    async getAllTracks() { return await this.database.getAllTracks(); }
    async searchTracks(query) { return await this.database.searchTracks(query); }
    async getTracksByArtist(artist) { return await this.database.getTracksByArtist(artist); }
    async getTracksByAlbum(album) { return await this.database.getTracksByAlbum(album); }
    async clearLibrary() { return await this.database.clearLibrary(); }
    async createPlaylist(name, tracks) { return await this.database.addPlaylist(name, tracks); }
    async getAllPlaylists() { return await this.database.getAllPlaylists(); }
    async deletePlaylist(id) { return await this.database.deletePlaylist(id); }
    delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
}

window.MusicDatabase = MusicDatabase;
window.MusicLibraryManager = MusicLibraryManager;
window.musicLibraryManager = new MusicLibraryManager();
console.log('\u2705 Music Library Manager global verfügbar als window.musicLibraryManager');

// Globale UI-Update Funktion für Musikbibliothek
window.updateMusicLibraryUI = async function () {
    try {
        if (window.musicLibraryManager && window.musicLibraryManager.database && window.musicLibraryManager.database.isReady) {
            const tracks = await window.musicLibraryManager.getAllTracks();
            console.log(`🎵 Musikbibliothek UI aktualisiert: ${tracks.length} Tracks`);

            // Event für andere Module
            window.dispatchEvent(new CustomEvent('music-library-updated', {
                detail: { trackCount: tracks.length, tracks: tracks }
            }));
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Musikbibliothek-UI:', error);
    }
};

if (typeof module !== 'undefined' && module.exports) module.exports = { MusicDatabase, MusicLibraryManager, MUSIC_CONFIG };
