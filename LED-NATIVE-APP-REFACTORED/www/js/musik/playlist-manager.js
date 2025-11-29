/**
 * PLAYLIST-MANAGER.JS
 * Playlisten erstellen, benennen, löschen, Lieder hinzufügen/entfernen
 */
'use strict';

class PlaylistManager {
    constructor() {
        this.playlists = [];
        this.currentPlaylist = null;
        this.loadPlaylists();
    }

    /**
     * Lädt Playlists aus LocalStorage
     */
    loadPlaylists() {
        try {
            const saved = localStorage.getItem('userPlaylists');
            if (saved) {
                this.playlists = JSON.parse(saved);
                // console.log(`✅ ${this.playlists.length} Playlists geladen`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Playlists:', error);
            this.playlists = [];
        }
    }

    /**
     * Speichert Playlists in LocalStorage
     */
    savePlaylists() {
        try {
            localStorage.setItem('userPlaylists', JSON.stringify(this.playlists));
            // console.log('💾 Playlists gespeichert');
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Playlists:', error);
        }
    }

    /**
     * Erstellt neue Playlist
     * @param {string} name - Playlist-Name
     * @returns {Object} Neue Playlist
     */
    createPlaylist(name) {
        if (!name || name.trim() === '') {
            name = `Playlist ${this.playlists.length + 1}`;
        }

        const playlist = {
            id: Date.now(),
            name: name.trim(),
            songs: [],
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        this.playlists.push(playlist);
        this.savePlaylists();

        // console.log(`✅ Playlist erstellt: "${name}"`);
        return playlist;
    }

    /**
     * Benennt Playlist um
     * @param {number} playlistId - Playlist-ID
     * @param {string} newName - Neuer Name
     */
    renamePlaylist(playlistId, newName) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) {
            console.error('❌ Playlist nicht gefunden');
            return false;
        }

        playlist.name = newName.trim();
        playlist.modified = new Date().toISOString();
        this.savePlaylists();

        // console.log(`✏️ Playlist umbenannt: "${newName}"`);
        return true;
    }

    /**
     * Löscht Playlist
     * @param {number} playlistId - Playlist-ID
     */
    deletePlaylist(playlistId) {
        const index = this.playlists.findIndex(p => p.id === playlistId);
        if (index === -1) {
            console.error('❌ Playlist nicht gefunden');
            return false;
        }

        const deleted = this.playlists.splice(index, 1)[0];
        this.savePlaylists();

        // console.log(`🗑️ Playlist gelöscht: "${deleted.name}"`);
        return true;
    }

    /**
     * Fügt Song zu Playlist hinzu
     * @param {number} playlistId - Playlist-ID
     * @param {Object} song - Song-Objekt
     */
    addSongToPlaylist(playlistId, song) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) {
            console.error('❌ Playlist nicht gefunden');
            return false;
        }

        // Prüfe ob Song bereits in Playlist
        if (playlist.songs.some(s => s.id === song.id)) {
            console.warn('⚠️ Song bereits in Playlist');
            return false;
        }

        playlist.songs.push(song);
        playlist.modified = new Date().toISOString();
        this.savePlaylists();

        // console.log(`➕ Song zu Playlist hinzugefügt: "${song.title}" → "${playlist.name}"`);
        return true;
    }

    /**
     * Entfernt Song aus Playlist
     * @param {number} playlistId - Playlist-ID
     * @param {number} songId - Song-ID
     */
    removeSongFromPlaylist(playlistId, songId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) {
            console.error('❌ Playlist nicht gefunden');
            return false;
        }

        const index = playlist.songs.findIndex(s => s.id === songId);
        if (index === -1) {
            console.error('❌ Song nicht in Playlist');
            return false;
        }

        const removed = playlist.songs.splice(index, 1)[0];
        playlist.modified = new Date().toISOString();
        this.savePlaylists();

        // console.log(`➖ Song aus Playlist entfernt: "${removed.title}"`);
        return true;
    }

    /**
     * Holt alle Playlists
     * @returns {Array} Alle Playlists
     */
    getAllPlaylists() {
        return this.playlists;
    }

    /**
     * Holt Playlist nach ID
     * @param {number} playlistId - Playlist-ID
     * @returns {Object} Playlist
     */
    getPlaylist(playlistId) {
        return this.playlists.find(p => p.id === playlistId);
    }

    /**
     * Exportiert Playlist als JSON
     * @param {number} playlistId - Playlist-ID
     * @returns {string} JSON-String
     */
    exportPlaylist(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return null;

        const exportData = {
            name: playlist.name,
            songs: playlist.songs,
            exported: new Date().toISOString(),
            app: 'LED-Control-Pro'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Importiert Playlist aus JSON
     * @param {string} jsonData - JSON-String
     * @returns {Object} Importierte Playlist
     */
    importPlaylist(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            const playlist = {
                id: Date.now(),
                name: data.name || 'Importierte Playlist',
                songs: data.songs || [],
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                imported: true
            };

            this.playlists.push(playlist);
            this.savePlaylists();

            // console.log(`📥 Playlist importiert: "${playlist.name}" (${playlist.songs.length} Songs)`);
            return playlist;
        } catch (error) {
            console.error('❌ Fehler beim Importieren:', error);
            return null;
        }
    }

    /**
     * Zeigt Playlist-Dialog
     */
    showPlaylistDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'playlist-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Playlists</h3>
                    <button onclick="this.closest('.playlist-dialog').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dialog-body">
                    <button class="create-playlist-btn" onclick="window.playlistManager.promptCreatePlaylist()">
                        <i class="fas fa-plus"></i> Neue Playlist
                    </button>
                    <div class="playlist-list">
                        ${this.renderPlaylistList()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    /**
     * Rendert Playlist-Liste
     */
    renderPlaylistList() {
        if (this.playlists.length === 0) {
            return '<p style="text-align: center; color: #888;">Keine Playlists vorhanden</p>';
        }

        return this.playlists.map(playlist => `
            <div class="playlist-item">
                <div class="playlist-info">
                    <strong>${playlist.name}</strong>
                    <small>${playlist.songs.length} Songs</small>
                </div>
                <div class="playlist-actions">
                    <button onclick="window.playlistManager.promptRename(${playlist.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="window.playlistManager.confirmDelete(${playlist.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Fragt nach neuem Playlist-Namen
     */
    promptCreatePlaylist() {
        const name = prompt('Playlist-Name:');
        if (name) {
            this.createPlaylist(name);
            this.showPlaylistDialog(); // Refresh
        }
    }

    /**
     * Fragt nach neuem Namen
     */
    promptRename(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return;

        const newName = prompt('Neuer Name:', playlist.name);
        if (newName && newName !== playlist.name) {
            this.renamePlaylist(playlistId, newName);
            this.showPlaylistDialog(); // Refresh
        }
    }

    /**
     * Bestätigt Löschen
     */
    confirmDelete(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return;

        if (confirm(`Playlist "${playlist.name}" wirklich löschen?`)) {
            this.deletePlaylist(playlistId);
            this.showPlaylistDialog(); // Refresh
        }
    }
}

// Global initialisieren
const playlistManager = new PlaylistManager();
window.playlistManager = playlistManager;
window.PlaylistManager = PlaylistManager;
