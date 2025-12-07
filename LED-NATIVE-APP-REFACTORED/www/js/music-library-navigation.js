/**
 * MUSIC-LIBRARY-NAVIGATION.JS
 * Interpreten → Ordner → Lieder Navigation
 * Vollständige Implementierung nach User-Vorgabe
 */
'use strict';

class MusicLibraryNavigation {
    constructor() {
        this.currentView = 'interpreten';
        this.navigationStack = [];
        this.currentArtist = null;
        this.currentAlbum = null;
        this.currentGenre = null;
        this.currentFolder = null;
        this.allSongs = [];
        this.filteredSongs = []; // Für Suche/Sortierung
        this.longPressTimer = null;
        this.init();
    }

    init() {
        this.loadAllSongs();
        this.setupSearchListeners();
        this.setupSortListeners();
        this.setupNavigationListeners(); // KRITISCH: Navigation-Buttons Event-Listener
        // Global verfügbar machen für HTML-Events
        window.musicNav = this;
        console.log('✅ Musik-Bibliothek-Navigation v2 initialisiert');
    }

    /**
     * KRITISCH: Event-Listener für Library Navigation Buttons
     */
    setupNavigationListeners() {
        const navButtons = document.querySelectorAll('.library-nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Aktiven Button markieren
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Section wechseln
                const section = btn.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        console.log(`📍 ${navButtons.length} Navigation-Buttons initialisiert`);

        // KRITISCH: Scan-Button Event-Listener
        const scanBtn = document.getElementById('libraryScanBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', async () => {
                console.log('📂 Bibliothek-Scan gestartet...');
                if (window.musicLibraryManager) {
                    const success = await window.musicLibraryManager.requestFolderAccess();
                    if (success) {
                        await window.musicLibraryManager.scanFolder();
                        // Nach Scan: Songs neu laden
                        this.allSongs = await window.musicLibraryManager.getAllTracks();
                        this.filteredSongs = [...this.allSongs];
                        this.updateCounts();
                        this.showArtists();
                        if (window.showGlobalNotification) {
                            window.showGlobalNotification(`${this.allSongs.length} Tracks gefunden`, 'success');
                        }
                    }
                } else {
                    console.error('❌ musicLibraryManager nicht verfügbar');
                    if (window.showGlobalNotification) {
                        window.showGlobalNotification('Bibliothek-Manager nicht geladen', 'error');
                    }
                }
            });
            console.log('📂 Scan-Button initialisiert');
        }
    }

    async loadAllSongs() {
        // BUGFIX: musicLibraryManager (Instanz) statt MusicLibraryManager (Klasse)
        if (window.musicLibraryManager && window.musicLibraryManager.database) {
            // Warte kurz bis DB bereit ist
            setTimeout(async () => {
                try {
                    // BUGFIX: getAllTracks() statt getAllSongs()
                    this.allSongs = await window.musicLibraryManager.getAllTracks();
                    this.filteredSongs = [...this.allSongs];
                    this.updateCounts();
                    this.showArtists(); // Start-Ansicht
                    console.log(`📚 ${this.allSongs.length} Lieder geladen`);
                } catch (err) {
                    console.error('Fehler beim Laden der Songs:', err);
                    this.allSongs = [];
                    this.filteredSongs = [];
                }
            }, 500);
        } else {
            console.warn('⚠️ musicLibraryManager nicht verfügbar');
        }
    }

    updateCounts() {
        // Update Zahlen in den Headern
        const artists = this.getUniqueArtists();
        const countEl = document.getElementById('artistsCount');
        if (countEl) countEl.textContent = `${artists.length} Interpreten`;

        const albums = this.getUniqueAlbums();
        const albumEl = document.getElementById('albumsCount');
        if (albumEl) albumEl.textContent = `${albums.length} Alben`;

        const songEl = document.getElementById('songsCount');
        if (songEl) songEl.textContent = `${this.allSongs.length} Titel`;

        const folders = this.getUniqueFolders();
        const folderEl = document.getElementById('foldersCount');
        if (folderEl) folderEl.textContent = `${folders.length} Ordner`;

        const genres = this.getUniqueGenres();
        const genreEl = document.getElementById('genresCount');
        if (genreEl) genreEl.textContent = `${genres.length} Genres`;
    }

    // --- VIEW NAVIGATION ---

    showArtists() {
        this.currentView = 'interpreten';
        this.navigationStack = [];

        const artists = this.getUniqueArtists();
        const container = document.getElementById('artistsGrid');

        if (!container) return;

        if (artists.length === 0) {
            container.innerHTML = this.getEmptyState('Keine Interpreten', 'Füge Musik hinzu');
            return;
        }

        container.innerHTML = artists.map(artist => `
            <div class="artist-card" onclick="window.musicNav.selectArtist('${this.escapeHtml(artist)}')" 
                 oncontextmenu="window.musicNav.showContextMenu(event, 'artist', '${this.escapeHtml(artist)}'); return false;">
                <div class="artist-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="artist-name">${this.escapeHtml(artist)}</div>
                <div class="artist-songs">${this.getSongsByArtist(artist).length} Lieder</div>
            </div>
        `).join('');

        this.updateBreadcrumb();
    }

    selectArtist(artist) {
        this.currentArtist = artist;
        this.navigationStack.push({ type: 'Interpret', name: artist, view: 'interpreten' });

        // USER-REQ: Interpreten -> Ordner -> Lieder
        // Prüfe ob der Interpret Songs in verschiedenen Ordnern hat
        const songs = this.getSongsByArtist(artist);
        const folders = [...new Set(songs.map(s => s.folder || 'Unbekannt'))];

        if (folders.length > 1) {
            // Zeige Ordner-Liste für diesen Interpreten
            this.showArtistFolders(folders, artist);
        } else {
            // Nur 1 Ordner, zeige direkt Songs
            this.showSongList(songs, `Interpret: ${artist}`);
        }
    }

    showArtistFolders(folders, artist) {
        const container = document.getElementById('artistsGrid').parentElement; // Nutze Parent container
        // Wir nutzen eine generische "Content" methode
        this.renderGenericGrid(folders.map(folder => ({
            icon: 'fa-folder',
            title: folder,
            subtitle: `${this.countSongsInFolder(folder, artist)} Titel`,
            onclick: `window.musicNav.selectArtistFolder('${this.escapeHtml(folder)}')`
        })), `Ordner von ${artist}`);
    }

    selectArtistFolder(folder) {
        this.navigationStack.push({ type: 'Ordner', name: folder, view: 'artist-folder' });
        const songs = this.getSongsByArtist(this.currentArtist).filter(s => (s.folder || 'Unbekannt') === folder);
        this.showSongList(songs, `${this.currentArtist} / ${folder}`);
    }

    selectAlbum(album) {
        this.currentAlbum = album;
        this.navigationStack.push({ type: 'Album', name: album, view: 'alben' });
        const songs = this.getSongsByAlbum(album);
        this.showSongList(songs, `Album: ${album}`);
    }

    selectGenre(genre) {
        this.currentGenre = genre;
        this.navigationStack.push({ type: 'Genre', name: genre, view: 'genre' });
        const songs = this.getSongsByGenre(genre);
        this.showSongList(songs, `Genre: ${genre}`);
    }

    selectFolder(folder) {
        this.currentFolder = folder;
        this.navigationStack.push({ type: 'Ordner', name: folder, view: 'ordner' });
        const songs = this.getSongsByFolder(folder);
        this.showSongList(songs, `Ordner: ${folder}`);
    }

    // --- LIST RENDERER ---

    showSongList(songs, title) {
        // Verstecke alle Sections
        document.querySelectorAll('.library-section').forEach(s => s.style.display = 'none');

        // Erstelle oder leere Song-Container (wir nutzen songs-section dafür)
        const section = document.getElementById('songs-section');
        if (!section) return;
        section.style.display = 'block';
        section.classList.add('active');

        const header = section.querySelector('.section-header-info h3');
        if (header) header.innerHTML = title;

        const list = document.getElementById('songsGrid');
        list.innerHTML = songs.map((song, index) => `
            <div class="song-item" 
                 onclick="window.musicNav.playSong(${song.id})"
                 oncontextmenu="window.musicNav.showSongContextMenu(event, ${song.id}); return false;"
                 ontouchstart="window.musicNav.handleTouchStart(event, ${song.id})"
                 ontouchend="window.musicNav.handleTouchEnd(event)">
                <div class="song-number">${index + 1}</div>
                <div class="song-info">
                    <div class="song-title">${this.escapeHtml(song.title)}</div>
                    <div class="song-artist">${this.escapeHtml(song.artist)}</div>
                </div>
                <div class="song-duration">${this.formatDuration(song.duration)}</div>
                <button class="favorite-btn ${song.favorite ? 'active' : ''}" 
                        onclick="event.stopPropagation(); window.musicNav.toggleFavorite(${song.id})">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `).join('');

        this.updateBreadcrumb();
    }

    renderGenericGrid(items, title) {
        // Generischer Grid-Renderer für Zwischenebenen
        document.querySelectorAll('.library-section').forEach(s => s.style.display = 'none');

        // Wir nutzen Artists-Section als Template Container
        const section = document.getElementById('artists-section');
        if (!section) return;
        section.style.display = 'block';

        const header = section.querySelector('.section-header-info h3');
        if (header) header.innerHTML = title;

        const grid = document.getElementById('artistsGrid');
        grid.innerHTML = items.map(item => `
            <div class="artist-card" onclick="${item.onclick}">
                <div class="artist-icon">
                    <i class="fas ${item.icon}"></i>
                </div>
                <div class="artist-name">${item.title}</div>
                <div class="artist-songs">${item.subtitle}</div>
            </div>
        `).join('');

        this.updateBreadcrumb();
    }

    // --- NAVIGATION HELPER ---

    goBack() {
        if (this.navigationStack.length === 0) {
            // Top Level, tue nichts oder zeige Interpreten
            return;
        }

        this.navigationStack.pop();

        if (this.navigationStack.length === 0) {
            // Zurück zum Start (basierend auf currentView Tab)
            this.restoreCurrentTab();
        } else {
            const lastState = this.navigationStack[this.navigationStack.length - 1];
            // Hier müssten wir den State wiederherstellen. 
            // Einfacher: Wir gehen immer ganz zurück zur Hauptansicht für jetzt
            this.restoreCurrentTab();
        }
    }

    restoreCurrentTab() {
        // Zeige die aktive Section basierend auf den Tabs
        const activeTab = document.querySelector('.library-nav-btn.active');
        if (activeTab) {
            const sectionId = activeTab.getAttribute('data-section');
            this.switchSection(sectionId);
        } else {
            this.showArtists();
        }
    }

    updateBreadcrumb() {
        // Implementierung optional
    }

    switchSection(sectionName) {
        // Reset Navigation Stack
        this.navigationStack = [];

        // Hide all sections
        document.querySelectorAll('.library-section').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });

        // Show target section
        const target = document.getElementById(`${sectionName}-section`);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active');

            // Load content
            switch (sectionName) {
                case 'artists': this.showArtists(); break;
                case 'albums': this.showAlbums(); break;
                case 'songs': this.showAllSongs(); break;
                case 'folders': this.showFolders(); break;
                case 'genres': this.showGenres(); break;
                case 'recent': this.showRecent(); break;
                case 'favorites': this.showFavorites(); break;
                case 'most-played': this.showMostPlayed(); break;
                case 'playlists': this.showPlaylists(); break;
            }
        }
    }

    // --- DATA HELPERS ---

    getUniqueArtists() {
        return [...new Set(this.allSongs.map(s => s.artist || 'Unbekannt'))].sort();
    }

    getUniqueAlbums() {
        return [...new Set(this.allSongs.map(s => s.album || 'Unbekannt'))].sort();
    }

    getUniqueFolders() {
        return [...new Set(this.allSongs.map(s => s.folder || 'Unbekannt'))].sort();
    }

    getUniqueGenres() {
        return [...new Set(this.allSongs.map(s => s.genre || 'Unbekannt'))].sort();
    }

    getSongsByArtist(artist) {
        return this.allSongs.filter(s => (s.artist || 'Unbekannt') === artist);
    }

    getSongsByAlbum(album) {
        return this.allSongs.filter(s => (s.album || 'Unbekannt') === album);
    }

    getSongsByGenre(genre) {
        return this.allSongs.filter(s => (s.genre || 'Unbekannt') === genre);
    }

    getSongsByFolder(folder) {
        return this.allSongs.filter(s => (s.folder || 'Unbekannt') === folder);
    }

    countSongsInFolder(folder, artist) {
        return this.allSongs.filter(s =>
            (s.folder || 'Unbekannt') === folder &&
            (s.artist || 'Unbekannt') === artist
        ).length;
    }

    showAllSongs() {
        this.showSongList(this.allSongs, 'Alle Titel');
    }

    showRecent() {
        // Zeige alle Songs, sortiert nach Hinzufüge-Datum
        this.showSongList(this.allSongs, 'Kürzlich hinzugefügt');
    }

    showFavorites() {
        const favs = this.allSongs.filter(s => s.favorite);
        if (favs.length > 0)
            this.showSongList(favs, 'Favoriten');
        else
            document.getElementById('favorites-section').innerHTML = this.getEmptyState('Keine Favoriten', 'Markiere Songs mit dem Stern');
    }

    showMostPlayed() {
        // Top 10 meistgespielte Songs (basierend auf playCount)
        const sorted = [...this.allSongs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        this.showSongList(sorted.slice(0, 10), 'Meist gespielt');
    }

    showPlaylists() {
        const playlists = window.PlaylistManager ? window.PlaylistManager.playlists : [];
        const container = document.getElementById('playlistsGrid');

        if (playlists.length === 0) {
            container.innerHTML = this.getEmptyState('Keine Playlists', 'Erstelle eine neue Playlist');
            return;
        }

        container.innerHTML = playlists.map(pl => `
            <div class="playlist-card" onclick="window.musicNav.selectPlaylist(${pl.id})">
                <div class="playlist-icon">
                    <i class="fas fa-list-music"></i>
                </div>
                <div class="playlist-name">${this.escapeHtml(pl.name)}</div>
                <div class="playlist-songs">${pl.songs.length} Titel</div>
                <button class="delete-btn" onclick="event.stopPropagation(); window.PlaylistManager.deletePlaylist(${pl.id}); window.musicNav.showPlaylists();">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // --- INTERACTION ---

    playSong(songId) {
        // Integration mit PlayerController
        if (window.PlayerController) {
            window.PlayerController.playSongById(songId);
        } else {
            console.warn('PlayerController nicht gefunden');
        }
    }

    toggleFavorite(songId) {
        const song = this.allSongs.find(s => s.id === songId);
        if (song) {
            song.favorite = !song.favorite;
            // BUGFIX: Persist changes via musicLibraryManager Instanz
            if (window.musicLibraryManager && window.musicLibraryManager.database) {
                window.musicLibraryManager.database.updateTrack(song.id, { favorite: song.favorite });
            }
            // Refresh UI if in fav view
            if (this.currentView === 'favorites') this.showFavorites();
        }
    }

    // --- SEARCH & SORT ---

    setupSearchListeners() {
        const btn = document.getElementById('librarySearchBtn');
        const bar = document.getElementById('librarySearchBar');
        const input = document.getElementById('librarySearchInput');
        const clear = document.getElementById('searchClearBtn');

        if (btn) {
            btn.onclick = () => {
                bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
                if (bar.style.display === 'block') input.focus();
            };
        }

        if (input) {
            input.oninput = (e) => this.performSearch(e.target.value);
        }

        if (clear) {
            clear.onclick = () => {
                input.value = '';
                this.performSearch('');
                bar.style.display = 'none';
            };
        }
    }

    performSearch(query) {
        if (!query) {
            this.filteredSongs = [...this.allSongs];
            const clearBtn = document.getElementById('searchClearBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            // Reset view
            this.restoreCurrentTab();
            return;
        }

        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) clearBtn.style.display = 'block';

        const lower = query.toLowerCase();

        const results = this.allSongs.filter(s =>
            s.title.toLowerCase().includes(lower) ||
            s.artist.toLowerCase().includes(lower) ||
            (s.album && s.album.toLowerCase().includes(lower))
        );

        this.showSongList(results, `Suche: "${query}"`);
    }

    setupSortListeners() {
        const btn = document.getElementById('librarySortBtn');
        const options = document.getElementById('librarySortOptions');

        if (btn) {
            btn.onclick = () => {
                options.style.display = options.style.display === 'none' ? 'block' : 'none';
            };
        }

        document.querySelectorAll('.sort-btn').forEach(sortBtn => {
            sortBtn.onclick = () => {
                const sortType = sortBtn.dataset.sort;
                this.sortSongs(sortType);
                options.style.display = 'none';
                // Update active state
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                sortBtn.classList.add('active');
            };
        });
    }

    sortSongs(type) {
        console.log(`Sortiere nach ${type}`);
        // Einfache Sortierung
        if (type === 'name') {
            this.allSongs.sort((a, b) => a.title.localeCompare(b.title));
        } else if (type === 'artist') {
            this.allSongs.sort((a, b) => a.artist.localeCompare(b.artist));
        }
        // Re-Render current view
        this.restoreCurrentTab();
    }

    // --- CONTEXT MENU (Long Press) ---

    handleTouchStart(e, songId) {
        this.longPressTimer = setTimeout(() => {
            this.showSongContextMenu(e, songId);
        }, 800); // 800ms Long Press
    }

    handleTouchEnd(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    showSongContextMenu(e, songId) {
        e.preventDefault();
        const menu = document.getElementById('contextMenu');
        if (!menu) return;

        // Positionieren
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.display = 'block';

        const song = this.allSongs.find(s => s.id === songId);
        if (!song) return;

        // Wir müssen sicherstellen, dass wir nicht alte Listener haben
        // Einfachster Weg: Menu Items neu erzeugen oder Listener auf Menu Container setzen

        menu.onclick = (evt) => {
            const item = evt.target.closest('.context-menu-item');
            if (!item) return;

            const action = item.dataset.action;
            this.handleContextAction(action, song);
            menu.style.display = 'none';
        };

        // Click outside to close
        setTimeout(() => {
            const closeMenu = () => {
                menu.style.display = 'none';
                document.removeEventListener('click', closeMenu);
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    handleContextAction(action, song) {
        console.log(`Aktion ${action} für Song ${song.title}`);
        switch (action) {
            case 'play': this.playSong(song.id); break;
            case 'favorite': this.toggleFavorite(song.id); break;
            case 'add-to-playlist': this.showAddToPlaylistDialog(song); break;
        }
    }

    showAddToPlaylistDialog(song) {
        const playlists = window.PlaylistManager?.playlists || [];
        if (playlists.length === 0) {
            if (confirm('Keine Playlists vorhanden. Neue erstellen?')) {
                this.createNewPlaylist(song);
            }
            return;
        }

        let msg = "Wähle Playlist (Nummer eingeben):\n";
        playlists.forEach((p, i) => msg += `${i + 1}. ${p.name}\n`);

        const selection = prompt(msg);
        const index = parseInt(selection) - 1;

        if (!isNaN(index) && playlists[index]) {
            window.PlaylistManager.addSongToPlaylist(playlists[index].id, song);
            alert(`Song zu "${playlists[index].name}" hinzugefügt`);
        }
    }

    createNewPlaylist(initialSong = null) {
        const name = prompt('Playlist Name:');
        if (name && window.PlaylistManager) {
            const playlist = window.PlaylistManager.createPlaylist(name);
            if (initialSong) {
                window.PlaylistManager.addSongToPlaylist(playlist.id, initialSong);
            }
            this.switchSection('playlists');
        }
    }

    // --- UTILS ---

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    formatDuration(seconds) {
        if (!seconds) return '0:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    getEmptyState(title, msg) {
        return `<div class="empty-state"><h4>${title}</h4><p>${msg}</p></div>`;
    }

    // Placeholder methods for tabs
    showAlbums() { this.renderGenericGrid(this.getUniqueAlbums().map(a => ({ title: a, subtitle: 'Album', icon: 'fa-compact-disc', onclick: `window.musicNav.selectAlbum('${this.escapeHtml(a)}')` })), 'Alben'); }
    showFolders() { this.renderGenericGrid(this.getUniqueFolders().map(f => ({ title: f, subtitle: 'Ordner', icon: 'fa-folder', onclick: `window.musicNav.selectFolder('${this.escapeHtml(f)}')` })), 'Ordner'); }
    showGenres() { this.renderGenericGrid(this.getUniqueGenres().map(g => ({ title: g, subtitle: 'Genre', icon: 'fa-guitar', onclick: `window.musicNav.selectGenre('${this.escapeHtml(g)}')` })), 'Genres'); }

    // Listen to Tab Switches (sollte in init aufgerufen werden, wenn Buttons existieren)
}

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MusicLibraryNavigation());
} else {
    new MusicLibraryNavigation();
}
