/**
 * MUSIC-LIBRARY-NAVIGATION.JS
 * Interpreten → Lieder, Alben → Lieder Navigation
 * Breadcrumb-Navigation, Zurück-Button, Suche, Sortierung
 */
'use strict';

class MusicLibraryNavigation {
    constructor() {
        this.currentView = 'interpreten'; // interpreten, alben, titel, ordner, genre, etc.
        this.navigationStack = [];
        this.currentArtist = null;
        this.currentAlbum = null;
        this.currentGenre = null;
        this.currentFolder = null;
        this.allSongs = [];
        this.filteredSongs = [];
        this.init();
    }

    /**
     * Initialisiert die Navigation
     */
    init() {
        this.loadAllSongs();
        console.log('✅ Musik-Bibliothek-Navigation initialisiert');
    }

    /**
     * Lädt alle Lieder
     */
    async loadAllSongs() {
        if (window.MusicLibraryManager) {
            this.allSongs = await window.MusicLibraryManager.getAllSongs();
            console.log(`📚 ${this.allSongs.length} Lieder geladen`);
        }
    }

    /**
     * Zeigt Interpreten-Liste an
     */
    showArtists() {
        const artists = this.getUniqueArtists();
        const container = this.getContainer();

        container.innerHTML = `
            <div class="library-header">
                <h2><i class="fas fa-user"></i> Interpreten</h2>
                <div class="library-actions">
                    <button class="search-btn" onclick="window.musicNav.showSearch()">
                        <i class="fas fa-search"></i>
                    </button>
                    <button class="sort-btn" onclick="window.musicNav.showSortMenu()">
                        <i class="fas fa-sort"></i>
                    </button>
                </div>
            </div>
            <div class="artist-grid">
                ${artists.map(artist => `
                    <div class="artist-card" onclick="window.musicNav.selectArtist('${this.escapeHtml(artist)}')">
                        <div class="artist-icon">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="artist-name">${this.escapeHtml(artist)}</div>
                        <div class="artist-songs">${this.getSongsByArtist(artist).length} Lieder</div>
                    </div>
                `).join('')}
            </div>
        `;

        this.currentView = 'interpreten';
        this.navigationStack = [];
    }

    /**
     * Interpret ausgewählt → Zeige Lieder
     */
    selectArtist(artist) {
        this.currentArtist = artist;
        this.navigationStack.push({ type: 'interpreten' });

        const songs = this.getSongsByArtist(artist);
        this.showSongList(songs, `Interpret: ${artist}`);
    }

    /**
     * Album ausgewählt → Zeige Lieder
     */
    selectAlbum(album) {
        this.currentAlbum = album;
        this.navigationStack.push({ type: 'alben' });

        const songs = this.getSongsByAlbum(album);
        this.showSongList(songs, `Album: ${album}`);
    }

    /**
     * Genre ausgewählt → Zeige Lieder
     */
    selectGenre(genre) {
        this.currentGenre = genre;
        this.navigationStack.push({ type: 'genre' });

        const songs = this.getSongsByGenre(genre);
        this.showSongList(songs, `Genre: ${genre}`);
    }

    /**
     * Ordner ausgewählt → Zeige Lieder
     */
    selectFolder(folder) {
        this.currentFolder = folder;
        this.navigationStack.push({ type: 'ordner' });

        const songs = this.getSongsByFolder(folder);
        this.showSongList(songs, `Ordner: ${folder}`);
    }

    /**
     * Zeigt Lieder-Liste an
     */
    showSongList(songs, title) {
        const container = this.getContainer();

        container.innerHTML = `
            <div class="library-header">
                <button class="back-btn" onclick="window.musicNav.goBack()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2>${this.escapeHtml(title)}</h2>
            </div>
            <div class="breadcrumb">
                ${this.renderBreadcrumb()}
            </div>
            <div class="song-list">
                ${songs.map((song, index) => `
                    <div class="song-item" onclick="window.musicNav.playSong(${index})">
                        <div class="song-number">${index + 1}</div>
                        <div class="song-info">
                            <div class="song-title">${this.escapeHtml(song.title)}</div>
                            <div class="song-artist">${this.escapeHtml(song.artist)}</div>
                        </div>
                        <div class="song-duration">${this.formatDuration(song.duration)}</div>
                        <button class="favorite-btn ${song.favorite ? 'active' : ''}" 
                                onclick="window.musicNav.toggleFavorite(${song.id}, event)">
                            <i class="fas fa-star"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Breadcrumb-Navigation rendern
     */
    renderBreadcrumb() {
        const crumbs = ['Bibliothek'];

        this.navigationStack.forEach(item => {
            crumbs.push(item.type);
        });

        if (this.currentArtist) crumbs.push(this.currentArtist);
        if (this.currentAlbum) crumbs.push(this.currentAlbum);
        if (this.currentGenre) crumbs.push(this.currentGenre);

        return crumbs.map((crumb, index) => `
            <span class="crumb ${index === crumbs.length - 1 ? 'active' : ''}" 
                  onclick="window.musicNav.navigateToCrumb(${index})">
                ${this.escapeHtml(crumb)}
            </span>
            ${index < crumbs.length - 1 ? '<i class="fas fa-chevron-right"></i>' : ''}
        `).join('');
    }

    /**
     * Zurück-Navigation
     */
    goBack() {
        if (this.navigationStack.length === 0) {
            this.showArtists();
            return;
        }

        const previous = this.navigationStack.pop();

        switch (previous.type) {
            case 'interpreten':
                this.showArtists();
                break;
            case 'alben':
                this.showAlbums();
                break;
            case 'genre':
                this.showGenres();
                break;
            default:
                this.showArtists();
        }
    }

    /**
     * Suche anzeigen
     */
    showSearch() {
        const query = prompt('Song suchen:');
        if (!query) return;

        const results = this.allSongs.filter(song =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase()) ||
            song.album.toLowerCase().includes(query.toLowerCase())
        );

        this.showSongList(results, `Suchergebnisse: "${query}"`);
    }

    /**
     * Sortier-Menü anzeigen
     */
    showSortMenu() {
        // TODO: Implementiere Sortier-Optionen
        console.log('📊 Sortier-Menü');
    }

    /**
     * Lied abspielen
     */
    playSong(index) {
        console.log('▶️ Spiele Lied ab:', index);
        if (window.musikPlayer) {
            window.musikPlayer.playSongAtIndex(index);
        }
    }

    /**
     * Favorit umschalten
     */
    toggleFavorite(songId, event) {
        event.stopPropagation();
        console.log('⭐ Favorit umschalten:', songId);

        if (window.MusicLibraryManager) {
            window.MusicLibraryManager.toggleFavorite(songId);
        }
    }

    // Helper-Funktionen
    getContainer() {
        return document.getElementById('library-container') || document.querySelector('.library-content');
    }

    getUniqueArtists() {
        const artists = [...new Set(this.allSongs.map(s => s.artist))];
        return artists.sort();
    }

    getUniqueAlbums() {
        const albums = [...new Set(this.allSongs.map(s => s.album))];
        return albums.sort();
    }

    getSongsByArtist(artist) {
        return this.allSongs.filter(s => s.artist === artist);
    }

    getSongsByAlbum(album) {
        return this.allSongs.filter(s => s.album === album);
    }

    getSongsByGenre(genre) {
        return this.allSongs.filter(s => s.genre === genre);
    }

    getSongsByFolder(folder) {
        return this.allSongs.filter(s => s.folder === folder);
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global initialisieren
const musicNav = new MusicLibraryNavigation();
window.musicNav = musicNav;
window.MusicLibraryNavigation = MusicLibraryNavigation;
