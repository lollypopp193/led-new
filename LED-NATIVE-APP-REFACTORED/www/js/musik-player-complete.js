/**
 * MUSIK-PLAYER-COMPLETE.JS
 * Vollständiger Musik-Player - ALLE Funktionen aus musik.html Inline-JS
 */
'use strict';

// Player State Management
const PLAYER_STATE_KEY = 'music-player-state';

function loadPlayerState() {
    const saved = localStorage.getItem(PLAYER_STATE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn('Fehler beim Laden des Player-States:', e);
            return null;
        }
    }
    return null;
}

function savePlayerState() {
    const state = {
        currentTrackIndex: window.currentTrackIndex,
        currentTrack: window.currentTrack,
        currentTime: window.audioPlayer?.currentTime,
        volume: window.audioPlayer?.volume,
        isShuffleMode: window.isShuffleMode,
        isRepeatMode: window.isRepeatMode,
        playlist: window.playlist,
        lastSaved: Date.now()
    };
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
}

// Media Session API
function updateMediaSession() {
    if ('mediaSession' in navigator && window.currentTrack) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: window.currentTrack.name || 'Unbekannter Titel',
            artist: window.currentTrack.artist || 'Unbekannter Künstler',
            album: window.currentTrack.album || 'Unbekanntes Album',
            artwork: window.currentTrack.cover ? [{
                src: window.currentTrack.cover,
                sizes: '512x512',
                type: 'image/jpeg'
            }] : []
        });

        navigator.mediaSession.setActionHandler('play', () => {
            window.audioPlayer.play();
            window.isPlaying = true;
            savePlayerState();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            window.audioPlayer.pause();
            window.isPlaying = false;
            savePlayerState();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            playPrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            playNext();
        });
    }
}

function updatePlaybackState(state) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = state;
    }
}

// Library Manager
class LibraryManager {
    constructor() {
        this.currentSection = 'artists';
        this.searchTerm = '';
        this.sortMethod = 'name';
        this.sortDirection = 'asc';
        this.isSearchVisible = false;
        this.isGridView = true;
    }

    async initializeLibrary() {
        try {
            // Versuch 1: IndexedDB über MusicLibraryManager (Global oder Parent)
            const libManager = window.musicLibraryManager || (window.parent && window.parent.musicLibraryManager);

            if (libManager) {
                console.log('📚 Lade Tracks via MusicLibraryManager...');
                // Sicherstellen dass DB bereit ist
                if (libManager.database && !libManager.database.isReady) {
                    await libManager.init();
                }

                const tracks = await libManager.getAllTracks();
                if (tracks && tracks.length > 0) {
                    window.musicLibrary.songs = tracks;

                    // Metadaten extrahieren und mappen
                    tracks.forEach(track => {
                        // Artists
                        if (track.artist) {
                            if (!window.musicLibrary.artists.has(track.artist)) {
                                window.musicLibrary.artists.set(track.artist, []);
                            }
                            window.musicLibrary.artists.get(track.artist).push(track);
                        }
                        // Albums
                        if (track.album) {
                            if (!window.musicLibrary.albums.has(track.album)) {
                                window.musicLibrary.albums.set(track.album, []);
                            }
                            window.musicLibrary.albums.get(track.album).push(track);
                        }
                    });

                    console.log(`✅ ${tracks.length} Tracks erfolgreich geladen`);
                    this.updateAllSections();

                    // UI Update Event
                    window.dispatchEvent(new CustomEvent('library-updated', { detail: tracks }));
                    return;
                }
            }

            // Versuch 2: LocalStorage (Legacy/Fallback)
            const savedLibrary = localStorage.getItem('musicLibrary');
            if (savedLibrary) {
                const parsed = JSON.parse(savedLibrary);
                window.musicLibrary = {
                    ...window.musicLibrary,
                    ...parsed
                };
                console.log('⚠️ Tracks aus LocalStorage geladen (Fallback)');
            }
            this.updateAllSections();
        } catch (error) {
            console.error('❌ Fehler beim Laden der Bibliothek:', error);
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.library-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(section) {
        this.currentSection = section;
        document.querySelectorAll('.library-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        document.querySelectorAll('.library-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section + 'Section');
        });
        this.updateSection(section);
    }

    updateSection(section) {
        console.log('Aktualisiere Section:', section);
    }

    updateAllSections() {
        ['artists', 'albums', 'songs', 'genres', 'folders', 'playlists'].forEach(section => {
            this.updateSection(section);
        });
    }

    toggleSearch() {
        this.isSearchVisible = !this.isSearchVisible;
        const searchBar = document.querySelector('.library-search');
        if (searchBar) {
            searchBar.style.display = this.isSearchVisible ? 'block' : 'none';
        }
    }

    toggleView() {
        this.isGridView = !this.isGridView;
        const container = document.querySelector('.library-content');
        if (container) {
            container.classList.toggle('grid-view', this.isGridView);
            container.classList.toggle('list-view', !this.isGridView);
        }
    }

    toggleSortOptions() {
        console.log('Toggle sort options');
    }
}

// Player Controls
function playTrack(track, index) {
    // Wenn Crossfade aktiv ist, nutze CrossfadeController
    if (window.crossfadeController && window.crossfadeController.enabled) {
        const nextAudio = window.crossfadeController.nextAudio;
        if (nextAudio) {
            nextAudio.src = track.url;
            window.crossfadeController.startCrossfade().then(() => {
                window.currentTrack = track;
                window.currentTrackIndex = index;
                updateMediaSession();
                savePlayerState();
            });
            return;
        }
    }

    // Standard-Verhalten ohne Crossfade
    window.currentTrack = track;
    window.currentTrackIndex = index;

    // Event: onTrackChange
    if (window.onTrackChange && typeof window.onTrackChange === 'function') {
        window.onTrackChange(track, index);
    }
    window.dispatchEvent(new CustomEvent('trackchange', { detail: { track, index } }));

    if (window.audioPlayer) {
        window.audioPlayer.src = track.url;
        window.audioPlayer.play();
        window.isPlaying = true;

        // Starte Audio Reactive Engine für LED-Musik-Reaktion
        if (window.audioReactiveEngine && window.audioReactiveEngine.startAudioCapture) {
            try {
                window.audioReactiveEngine.startAudioCapture(window.audioPlayer);
                console.log('🎵 Audio Reactive Engine gestartet mit audioPlayer');
            } catch (e) {
                console.warn('⚠️ Audio Reactive Engine konnte nicht gestartet werden:', e);
            }
        }

        // Verbinde Equalizer Engine mit audioPlayer
        if (window.equalizerEngine && window.equalizerEngine.connect) {
            try {
                window.equalizerEngine.connect(window.audioPlayer);
                console.log('🎛️ Equalizer Engine verbunden mit audioPlayer');
            } catch (e) {
                console.warn('⚠️ Equalizer Engine konnte nicht verbunden werden:', e);
            }
        }

        // Verbinde Advanced Visualizer mit audioPlayer
        if (window.advancedVisualizer && window.advancedVisualizer.connectAudioElement) {
            try {
                window.advancedVisualizer.connectAudioElement(window.audioPlayer);
                window.advancedVisualizer.start('bars');
                console.log('🎨 Advanced Visualizer gestartet');
            } catch (e) {
                console.warn('⚠️ Advanced Visualizer konnte nicht gestartet werden:', e);
            }
        }

        // Verbinde mit Crossfade-Controller falls vorhanden
        if (window.crossfadeController && !window.crossfadeController.audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            window.crossfadeController.init(ctx);
            window.crossfadeController.connectAudio(window.audioPlayer, 'current');

            // Zweites Audio-Element für Next-Track erstellen
            const nextAudio = new Audio();
            nextAudio.crossOrigin = "anonymous";
            window.crossfadeController.connectAudio(nextAudio, 'next');

            // Verbinde auch BPM-Analyzer
            if (window.bpmAnalyzer) {
                window.bpmAnalyzer.init(ctx);
                window.bpmAnalyzer.connectSource(window.crossfadeController.gainNodes.current);
                window.bpmAnalyzer.startAnalysis();
            }
        }
    }

    updateMediaSession();
    savePlayerState();
}

function playNext() {
    if (!window.playlist || window.playlist.length === 0) return;

    let nextIndex;
    if (window.isShuffleMode) {
        nextIndex = Math.floor(Math.random() * window.playlist.length);
    } else {
        nextIndex = (window.currentTrackIndex + 1) % window.playlist.length;
    }

    playTrack(window.playlist[nextIndex], nextIndex);
}

function playPrevious() {
    if (!window.playlist || window.playlist.length === 0) return;

    if (window.audioPlayer && window.audioPlayer.currentTime > 3) {
        window.audioPlayer.currentTime = 0;
        return;
    }

    let prevIndex;
    if (window.isShuffleMode) {
        prevIndex = Math.floor(Math.random() * window.playlist.length);
    } else {
        prevIndex = (window.currentTrackIndex - 1 + window.playlist.length) % window.playlist.length;
    }

    playTrack(window.playlist[prevIndex], prevIndex);
}

function togglePlayPause() {
    if (!window.audioPlayer) return;

    if (window.isPlaying) {
        window.audioPlayer.pause();
        window.isPlaying = false;

        // Stoppe Audio Reactive Engine
        if (window.audioReactiveEngine && window.audioReactiveEngine.stopAudioCapture) {
            window.audioReactiveEngine.stopAudioCapture();
            console.log('⏸️ Audio Reactive Engine pausiert');
        }
    } else {
        window.audioPlayer.play();
        window.isPlaying = true;

        // Starte Audio Reactive Engine
        if (window.audioReactiveEngine && window.audioReactiveEngine.startAudioCapture) {
            window.audioReactiveEngine.startAudioCapture(window.audioPlayer);
            console.log('▶️ Audio Reactive Engine fortgesetzt');
        }
    }

    updatePlaybackState(window.isPlaying ? 'playing' : 'paused');
    savePlayerState();
}

function toggleShuffle() {
    window.isShuffleMode = !window.isShuffleMode;
    const btn = document.getElementById('shuffleBtn');
    if (btn) {
        btn.classList.toggle('active', window.isShuffleMode);
    }
    savePlayerState();
}

function toggleRepeat() {
    window.isRepeatMode = (window.isRepeatMode + 1) % 4;
    const btn = document.getElementById('repeatBtn');
    if (btn) {
        const modes = ['off', 'all', 'one', 'playlist'];
        btn.setAttribute('title', 'Wiederholen: ' + modes[window.isRepeatMode]);
    }
    savePlayerState();
}

// Initialize
function initMusicPlayer() {
    const savedState = loadPlayerState();

    window.isPlaying = false;
    window.isShuffleMode = savedState?.isShuffleMode || false;
    window.isRepeatMode = savedState?.isRepeatMode || 0;
    window.playlist = savedState?.playlist || [];
    window.currentTrackIndex = savedState?.currentTrackIndex || 0;
    window.currentTrack = savedState?.currentTrack || null;
    window.audioPlayer = document.getElementById('audioPlayer');

    window.musicLibrary = {
        songs: [],
        artists: new Map(),
        albums: new Map(),
        genres: new Map(),
        folders: new Map(),
        playlists: [],
        favorites: [],
        recentlyPlayed: [],
        mostPlayed: []
    };

    window.libraryManager = new LibraryManager();
    window.libraryManager.initializeLibrary();
    window.libraryManager.setupEventListeners();

    if (window.audioPlayer) {
        window.audioPlayer.addEventListener('ended', () => {
            // Event: onPlaybackEnd
            if (window.onPlaybackEnd && typeof window.onPlaybackEnd === 'function') {
                window.onPlaybackEnd(window.currentTrack);
            }
            window.dispatchEvent(new CustomEvent('playbackend', { detail: { track: window.currentTrack } }));

            if (window.isRepeatMode === 2) {
                window.audioPlayer.currentTime = 0;
                window.audioPlayer.play();
            } else {
                playNext();
            }
        });

        window.audioPlayer.addEventListener('volumechange', () => {
            // Event: onVolumeChange
            if (window.onVolumeChange && typeof window.onVolumeChange === 'function') {
                window.onVolumeChange(window.audioPlayer.volume);
            }
            window.dispatchEvent(new CustomEvent('volumechange', { detail: { volume: window.audioPlayer.volume } }));
        });

        window.audioPlayer.addEventListener('timeupdate', () => {
            const progress = (window.audioPlayer.currentTime / window.audioPlayer.duration) * 100;
            const progressBar = document.getElementById('progressBar');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        });
    }

    console.log('✅ Musik-Player initialisiert');
}

// === FEHLENDE FUNKTIONEN ===

// Panel-Navigation - Nutze musik-panel-controller.js wenn verfügbar
if (!window.showPanel) {
    window.showPanel = function (panelId, clickedBtn) {
        // Alle Buttons deaktivieren
        document.querySelectorAll('.taskbar-btn').forEach(btn => btn.classList.remove('active'));
        // Geklickten Button aktivieren
        if (clickedBtn) clickedBtn.classList.add('active');

        // Alle Panels verstecken
        document.querySelectorAll('.panel, .content-panel').forEach(p => p.classList.remove('active'));

        // Gewähltes Panel zeigen
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            console.log('📱 Panel gewechselt:', panelId);
        }
    };
}

// Bibliothek anzeigen
function viewLibrary(section) {
    console.log('📚 Bibliothek:', section);
    if (window.libraryManager) {
        window.libraryManager.currentSection = section;
        window.libraryManager.renderCurrentSection();
    }
    showPanel('library-panel');
}

// Scan-Modal schließen
function closeScanModal() {
    const modal = document.getElementById('scanModal');
    if (modal) modal.style.display = 'none';
}

// Playlist erstellen
function createNewPlaylist() {
    const name = prompt('Playlist-Name:');
    if (name && name.trim()) {
        const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
        playlists.push({ id: Date.now(), name: name.trim(), tracks: [] });
        localStorage.setItem('playlists', JSON.stringify(playlists));
        if (window.showNotification) window.showNotification('Playlist erstellt: ' + name, 'success');
    }
}

// EQ-Preset auswählen
function selectEQPreset(presetName) {
    console.log('🎛️ EQ-Preset:', presetName);
    if (window.equalizerEngine) {
        window.equalizerEngine.applyPreset(presetName);
    }
}

// Custom EQ-Preset löschen (mit Name-Parameter für programmatische Nutzung)
// Nutze window.deleteCustomEQPreset() für onclick ohne Parameter
function deleteEQPresetByName(name) {
    if (confirm('Preset "' + name + '" löschen?')) {
        if (window.equalizerEngine) {
            window.equalizerEngine.deleteCustomPreset(name);
        }
    }
}

// Visualizer-Effekt auswählen
function selectVisualEffect(effectName) {
    console.log('🎨 Visual-Effekt:', effectName);
    if (window.visualizationManager) {
        window.visualizationManager.setEffect(effectName);
    }
}

// Sleep-Timer Einstellungen
function toggleSleepTimerSettings() {
    const panel = document.getElementById('sleepTimerSettings');
    if (panel) panel.classList.toggle('expanded');
}

// Musik-Alarm Einstellungen
function toggleMusicAlarmSettings() {
    const panel = document.getElementById('musicAlarmSettings');
    if (panel) panel.classList.toggle('expanded');
}

// Global Export
window.loadPlayerState = loadPlayerState;
window.savePlayerState = savePlayerState;
window.updateMediaSession = updateMediaSession;
window.updatePlaybackState = updatePlaybackState;
window.LibraryManager = LibraryManager;
window.playTrack = playTrack;
window.loadTrack = playTrack; // Alias für Kompatibilität
window.playNext = playNext;
window.playNextTrack = playNext; // Alias für Kompatibilität
window.playPrevious = playPrevious;
window.playPreviousTrack = playPrevious; // Alias für Kompatibilität
window.togglePlayPause = togglePlayPause;
/**
 * Cleanup Audio-Player
 * FIX: Verhindert Memory Leak beim Audio-Element
 */
function cleanupAudioPlayer() {
    if (window.audioPlayer) {
        try {
            // Stop playback
            window.audioPlayer.pause();

            // Clear source (FIX: Memory Leak Prevention)
            window.audioPlayer.src = '';
            window.audioPlayer.load();

            // Stop Audio Reactive Engine
            if (window.audioReactiveEngine && window.audioReactiveEngine.stopAudioCapture) {
                window.audioReactiveEngine.stopAudioCapture();
            }

            // Stop Advanced Visualizer
            if (window.advancedVisualizer && window.advancedVisualizer.stop) {
                window.advancedVisualizer.stop();
            }

            console.log('✅ Audio-Player cleanup durchgeführt');
        } catch (e) {
            console.warn('⚠️ Audio-Player cleanup error:', e);
        }
    }
}

// Export LibraryManager class
window.LibraryManager = LibraryManager;
window.libraryManager = new LibraryManager();

// Export Player State Management
window.loadPlayerState = loadPlayerState;
window.savePlayerState = savePlayerState;
window.updateMediaSession = updateMediaSession;
window.updatePlaybackState = updatePlaybackState;

// Export Player Controls
window.playTrack = playTrack;
window.playNext = playNext;
window.playPrevious = playPrevious;
window.togglePlayPause = togglePlayPause;
window.toggleShuffle = toggleShuffle;
window.toggleRepeat = toggleRepeat;

// Export UI Functions
window.initMusicPlayer = initMusicPlayer;
window.showPanel = showPanel;
window.viewLibrary = viewLibrary;
window.closeScanModal = closeScanModal;
window.createNewPlaylist = createNewPlaylist;

// Export EQ & Visualizer Functions
window.selectEQPreset = selectEQPreset;
window.deleteCustomEQPreset = deleteCustomEQPreset;
window.deleteEQPresetByName = deleteEQPresetByName;
window.selectVisualEffect = selectVisualEffect;

// Export Timer Functions
window.toggleSleepTimerSettings = toggleSleepTimerSettings;
window.toggleMusicAlarmSettings = toggleMusicAlarmSettings;

// Export Cleanup
window.cleanupAudioPlayer = cleanupAudioPlayer;

console.log('✅ Musik-Player-Complete: Alle Funktionen global exportiert');

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPlayer);
} else {
    initMusicPlayer();
}

// console.log('✅ Musik-Player-Complete geladen');
