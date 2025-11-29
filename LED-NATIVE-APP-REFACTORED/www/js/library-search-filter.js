/**
 * LIBRARY SEARCH & FILTER - Vollständige Such- und Filterfunktionalität
 */
'use strict';

const LibrarySearchFilter = {
    searchResults: [],
    activeFilters: {
        artist: null,
        album: null,
        genre: null,
        folder: null,
        favorites: false,
        recentlyPlayed: false
    },

    /**
     * Initialisierung
     */
    init() {
        console.log('🔍 Library Search & Filter initialisiert');

        // Such-Input Event-Listener
        const searchInput = document.getElementById('librarySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });

            // Enter-Taste für Suche
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        // Such-Button
        const searchBtn = document.getElementById('librarySearchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput ? searchInput.value : '';
                this.performSearch(query);
            });
        }

        // Filter-Buttons
        this.initFilterButtons();
    },

    /**
     * Filter-Buttons initialisieren
     */
    initFilterButtons() {
        // Künstler-Filter
        const artistFilters = document.querySelectorAll('[data-filter-artist]');
        artistFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const artist = e.target.dataset.filterArtist;
                this.applyFilter('artist', artist);
            });
        });

        // Album-Filter
        const albumFilters = document.querySelectorAll('[data-filter-album]');
        albumFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const album = e.target.dataset.filterAlbum;
                this.applyFilter('album', album);
            });
        });

        // Genre-Filter
        const genreFilters = document.querySelectorAll('[data-filter-genre]');
        genreFilters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genre = e.target.dataset.filterGenre;
                this.applyFilter('genre', genre);
            });
        });

        // Favoriten-Toggle
        const favoritesBtn = document.getElementById('filterFavorites');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                this.activeFilters.favorites = !this.activeFilters.favorites;
                this.applyAllFilters();
                favoritesBtn.classList.toggle('active');
            });
        }

        // Kürzlich gehört
        const recentBtn = document.getElementById('filterRecent');
        if (recentBtn) {
            recentBtn.addEventListener('click', () => {
                this.activeFilters.recentlyPlayed = !this.activeFilters.recentlyPlayed;
                this.applyAllFilters();
                recentBtn.classList.toggle('active');
            });
        }

        // Filter zurücksetzen
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    },

    /**
     * Suche durchführen
     */
    performSearch(query) {
        if (!query || query.length < 2) {
            this.searchResults = [];
            this.displayResults([]);
            return;
        }

        console.log(`🔍 Suche: "${query}"`);

        // Bibliothek abrufen
        const library = this.getLibrary();
        const lowerQuery = query.toLowerCase();

        // Durchsuche Titel, Künstler, Album, Genre
        this.searchResults = library.filter(song => {
            return (
                song.name.toLowerCase().includes(lowerQuery) ||
                song.artist.toLowerCase().includes(lowerQuery) ||
                song.album.toLowerCase().includes(lowerQuery) ||
                (song.genre && song.genre.toLowerCase().includes(lowerQuery))
            );
        });

        console.log(`✅ ${this.searchResults.length} Ergebnisse gefunden`);
        this.displayResults(this.searchResults);
    },

    /**
     * Filter anwenden
     */
    applyFilter(type, value) {
        this.activeFilters[type] = value;
        console.log(`🎛️ Filter angewendet: ${type} = ${value}`);
        this.applyAllFilters();
    },

    /**
     * Alle Filter anwenden
     */
    applyAllFilters() {
        let library = this.getLibrary();
        let filtered = [...library];

        // Künstler-Filter
        if (this.activeFilters.artist) {
            filtered = filtered.filter(song =>
                song.artist === this.activeFilters.artist
            );
        }

        // Album-Filter
        if (this.activeFilters.album) {
            filtered = filtered.filter(song =>
                song.album === this.activeFilters.album
            );
        }

        // Genre-Filter
        if (this.activeFilters.genre) {
            filtered = filtered.filter(song =>
                song.genre === this.activeFilters.genre
            );
        }

        // Ordner-Filter
        if (this.activeFilters.folder) {
            filtered = filtered.filter(song =>
                song.folder === this.activeFilters.folder
            );
        }

        // Favoriten-Filter
        if (this.activeFilters.favorites) {
            filtered = filtered.filter(song => song.favorite === true);
        }

        // Kürzlich gehört
        if (this.activeFilters.recentlyPlayed) {
            const recentSongs = this.getRecentlyPlayed();
            filtered = filtered.filter(song =>
                recentSongs.some(recent => recent.id === song.id)
            );
        }

        console.log(`📊 Gefilterte Ergebnisse: ${filtered.length}/${library.length}`);
        this.displayResults(filtered);
    },

    /**
     * Filter zurücksetzen
     */
    resetFilters() {
        this.activeFilters = {
            artist: null,
            album: null,
            genre: null,
            folder: null,
            favorites: false,
            recentlyPlayed: false
        };

        // UI zurücksetzen
        document.querySelectorAll('.filter-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });

        // Alle Songs anzeigen
        this.displayResults(this.getLibrary());
        console.log('🔄 Filter zurückgesetzt');
    },

    /**
     * Ergebnisse anzeigen
     */
    displayResults(songs) {
        const resultsContainer = document.getElementById('searchResults') ||
            document.getElementById('libraryContent');

        if (!resultsContainer) return;

        // Leere Container
        resultsContainer.innerHTML = '';

        if (songs.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <i class="fas fa-search" style="font-size: 3em; margin-bottom: 15px;"></i>
                    <p>Keine Ergebnisse gefunden</p>
                </div>
            `;
            return;
        }

        // Songs anzeigen
        songs.forEach(song => {
            const songElement = this.createSongElement(song);
            resultsContainer.appendChild(songElement);
        });

        // Statistik aktualisieren
        this.updateStatistics(songs);
    },

    /**
     * Song-Element erstellen
     */
    createSongElement(song) {
        const div = document.createElement('div');
        div.className = 'song-item';
        div.dataset.songId = song.id;

        div.innerHTML = `
            <div class="song-icon">
                ${song.albumArt ?
                `<img src="${song.albumArt}" alt="Album Art" style="width: 100%; height: 100%; object-fit: cover; border-radius: 5px;">` :
                '<i class="fas fa-music"></i>'
            }
            </div>
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-actions">
                <button class="btn-icon" onclick="playSong('${song.id}')" title="Abspielen">
                    <i class="fas fa-play"></i>
                </button>
                <button class="btn-icon" onclick="toggleFavorite('${song.id}')" title="Favorit">
                    <i class="fas fa-heart ${song.favorite ? 'favorited' : ''}"></i>
                </button>
                <button class="btn-icon" onclick="addToQueue('${song.id}')" title="Zur Warteschlange">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;

        // Click zum Abspielen
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-icon')) {
                this.playSong(song);
            }
        });

        return div;
    },

    /**
     * Song abspielen
     */
    playSong(song) {
        console.log(`▶️ Spiele ab: ${song.name}`);

        // Track zu Recently Played hinzufügen
        this.addToRecentlyPlayed(song);

        // Event auslösen
        if (window.loadTrack) {
            window.loadTrack(song);
        }
    },

    /**
     * Bibliothek abrufen
     */
    getLibrary() {
        // Von LibraryAutoScanner
        if (window.LibraryAutoScanner && window.LibraryAutoScanner.foundSongs) {
            return window.LibraryAutoScanner.foundSongs;
        }

        // Von window.musicLibrary
        if (window.musicLibrary && window.musicLibrary.songs) {
            return window.musicLibrary.songs;
        }

        // Von LocalStorage
        try {
            const stored = localStorage.getItem('music-library');
            if (stored) {
                const library = JSON.parse(stored);
                return library.songs || [];
            }
        } catch (error) {
            console.error('Fehler beim Laden der Bibliothek:', error);
        }

        return [];
    },

    /**
     * Kürzlich gehört abrufen
     */
    getRecentlyPlayed() {
        try {
            const stored = localStorage.getItem('recently-played');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    },

    /**
     * Zu Recently Played hinzufügen
     */
    addToRecentlyPlayed(song) {
        try {
            let recent = this.getRecentlyPlayed();

            // Entferne Song falls schon vorhanden
            recent = recent.filter(s => s.id !== song.id);

            // Füge an erster Stelle hinzu
            recent.unshift({
                id: song.id,
                name: song.name,
                artist: song.artist,
                playedAt: Date.now()
            });

            // Limitiere auf 50 Songs
            recent = recent.slice(0, 50);

            localStorage.setItem('recently-played', JSON.stringify(recent));
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
        }
    },

    /**
     * Statistik aktualisieren
     */
    updateStatistics(songs) {
        const statsElement = document.getElementById('libraryStats');
        if (!statsElement) return;

        const artists = new Set(songs.map(s => s.artist)).size;
        const albums = new Set(songs.map(s => s.album)).size;

        statsElement.innerHTML = `
            ${songs.length} Songs | ${artists} Künstler | ${albums} Alben
        `;
    }
};

window.LibrarySearchFilter = LibrarySearchFilter;
