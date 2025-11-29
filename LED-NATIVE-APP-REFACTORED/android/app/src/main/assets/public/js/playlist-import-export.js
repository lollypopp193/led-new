/**
 * PLAYLIST IMPORT/EXPORT - Vollständige Playlist-Verwaltung
 */
'use strict';

const PlaylistImportExport = {
    /**
     * Playlist exportieren
     */
    async exportPlaylist() {
        // console.log('📤 Exportiere Playlist...');

        try {
            const playlist = this.getCurrentPlaylist();

            if (!playlist || playlist.length === 0) {
                alert('Keine Playlist zum Exportieren vorhanden!');
                return;
            }

            // Erstelle Export-Objekt
            const exportData = {
                name: 'My Playlist',
                createdAt: Date.now(),
                version: '1.0',
                songs: playlist.map(song => ({
                    id: song.id,
                    name: song.name,
                    artist: song.artist,
                    album: song.album,
                    duration: song.duration,
                    path: song.path || song.url,
                    favorite: song.favorite || false
                }))
            };

            // Konvertiere zu JSON
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Download als Datei
            if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
                // Capacitor Filesystem
                await this.saveFileCapacitor(blob, 'playlist.json');
            } else {
                // Web Download
                this.downloadFile(blob, 'playlist.json');
            }

            alert(`Playlist erfolgreich exportiert! ${playlist.length} Songs`);
            // console.log('✅ Playlist exportiert');

        } catch (error) {
            console.error('❌ Export-Fehler:', error);
            alert('Fehler beim Exportieren der Playlist!');
        }
    },

    /**
     * Playlist importieren
     */
    async importPlaylist() {
        // console.log('📥 Importiere Playlist...');

        try {
            // Datei-Input erstellen
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonString = event.target.result;
                        const importData = JSON.parse(jsonString);

                        // Validiere Import
                        if (!importData.songs || !Array.isArray(importData.songs)) {
                            throw new Error('Ungültiges Playlist-Format!');
                        }

                        // Importiere Songs
                        await this.importSongs(importData.songs);

                        alert(`Playlist erfolgreich importiert! ${importData.songs.length} Songs`);
                        // console.log('✅ Playlist importiert');

                    } catch (error) {
                        console.error('❌ Import-Fehler:', error);
                        alert('Fehler beim Importieren: ' + error.message);
                    }
                };

                reader.readAsText(file);
            };

            input.click();

        } catch (error) {
            console.error('❌ Import-Fehler:', error);
            alert('Fehler beim Importieren der Playlist!');
        }
    },

    /**
     * Songs importieren
     */
    async importSongs(songs) {
        // Hole aktuelle Playlist
        let currentPlaylist = this.getCurrentPlaylist();

        // Füge importierte Songs hinzu (verhindere Duplikate)
        songs.forEach(song => {
            const exists = currentPlaylist.some(s => s.id === song.id || s.path === song.path);
            if (!exists) {
                currentPlaylist.push(song);
            }
        });

        // Speichere Playlist
        this.savePlaylist(currentPlaylist);

        // UI aktualisieren
        if (window.updatePlaylistUI) {
            window.updatePlaylistUI();
        }

        // LibraryManager aktualisieren
        if (window.libraryManager) {
            window.libraryManager.refreshAllSections();
        }
    },

    /**
     * Aktuelle Playlist abrufen
     */
    getCurrentPlaylist() {
        // Von window.playlist
        if (window.playlist && Array.isArray(window.playlist)) {
            return window.playlist;
        }

        // Von LocalStorage
        try {
            const stored = localStorage.getItem('current-playlist');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Playlist:', error);
        }

        return [];
    },

    /**
     * Playlist speichern
     */
    savePlaylist(playlist) {
        try {
            // In window.playlist
            if (window.playlist) {
                window.playlist = playlist;
            }

            // In LocalStorage
            localStorage.setItem('current-playlist', JSON.stringify(playlist));
            // console.log(`💾 Playlist gespeichert: ${playlist.length} Songs`);

        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
        }
    },

    /**
     * Datei herunterladen (Web)
     */
    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Datei speichern (Capacitor)
     */
    async saveFileCapacitor(blob, filename) {
        try {
            const { Filesystem, Directory } = window.Capacitor.Plugins;

            // Blob zu Base64
            const reader = new FileReader();
            reader.readAsDataURL(blob);

            reader.onloadend = async () => {
                const base64 = reader.result.split(',')[1];

                await Filesystem.writeFile({
                    path: `Music/${filename}`,
                    data: base64,
                    directory: Directory.Documents
                });

                // console.log(`✅ Datei gespeichert: Music/${filename}`);
            };

        } catch (error) {
            console.error('Capacitor Filesystem Fehler:', error);
            // Fallback auf Web-Download
            this.downloadFile(blob, filename);
        }
    },

    /**
     * Playlist als M3U exportieren
     */
    async exportAsM3U() {
        // console.log('📤 Exportiere als M3U...');

        try {
            const playlist = this.getCurrentPlaylist();

            if (!playlist || playlist.length === 0) {
                alert('Keine Playlist zum Exportieren vorhanden!');
                return;
            }

            // M3U Format erstellen
            let m3uContent = '#EXTM3U\n\n';

            playlist.forEach(song => {
                // #EXTINF:duration,artist - title
                const duration = Math.floor(song.duration || 0);
                m3uContent += `#EXTINF:${duration},${song.artist} - ${song.name}\n`;
                m3uContent += `${song.path || song.url}\n\n`;
            });

            const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
            this.downloadFile(blob, 'playlist.m3u');

            alert(`M3U Playlist exportiert! ${playlist.length} Songs`);
            // console.log('✅ M3U exportiert');

        } catch (error) {
            console.error('❌ M3U Export-Fehler:', error);
            alert('Fehler beim M3U Export!');
        }
    },

    /**
     * Alle Playlists exportieren
     */
    async exportAllPlaylists() {
        // console.log('📤 Exportiere alle Playlists...');

        try {
            const allPlaylists = this.getAllPlaylists();

            if (!allPlaylists || allPlaylists.length === 0) {
                alert('Keine Playlists vorhanden!');
                return;
            }

            const exportData = {
                exportedAt: Date.now(),
                version: '1.0',
                playlists: allPlaylists
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            this.downloadFile(blob, 'all-playlists.json');

            alert(`Alle Playlists exportiert! ${allPlaylists.length} Playlists`);
            // console.log('✅ Alle Playlists exportiert');

        } catch (error) {
            console.error('❌ Export-Fehler:', error);
            alert('Fehler beim Exportieren!');
        }
    },

    /**
     * Alle Playlists abrufen
     */
    getAllPlaylists() {
        try {
            const stored = localStorage.getItem('all-playlists');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    },

    /**
     * Favoriten exportieren
     */
    async exportFavorites() {
        // console.log('📤 Exportiere Favoriten...');

        try {
            const library = this.getCurrentPlaylist();
            const favorites = library.filter(song => song.favorite === true);

            if (favorites.length === 0) {
                alert('Keine Favoriten vorhanden!');
                return;
            }

            const exportData = {
                name: 'Favorites',
                createdAt: Date.now(),
                version: '1.0',
                songs: favorites
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            this.downloadFile(blob, 'favorites.json');

            alert(`Favoriten exportiert! ${favorites.length} Songs`);
            // console.log('✅ Favoriten exportiert');

        } catch (error) {
            console.error('❌ Export-Fehler:', error);
            alert('Fehler beim Exportieren der Favoriten!');
        }
    }
};

// Global verfügbar machen
window.PlaylistImportExport = PlaylistImportExport;

// Globale Funktionen für onclick-Handler
window.exportPlaylist = () => PlaylistImportExport.exportPlaylist();
window.importPlaylist = () => PlaylistImportExport.importPlaylist();
window.exportAsM3U = () => PlaylistImportExport.exportAsM3U();
window.exportFavorites = () => PlaylistImportExport.exportFavorites();
