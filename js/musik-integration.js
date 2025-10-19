/**
 * ===================================================================
 * MUSIK-INTEGRATION.JS
 * Integration des Music Library Managers in musik.html
 * Version: 1.0
 * Datum: 2025-10-08
 * ===================================================================
 * 
 * Funktionen:
 * - UI-Integration des Music Library Managers
 * - Playlist-Verwaltung
 * - Audio-Wiedergabe
 * - LED-Musik-Synchronisation
 * - Virtual Scrolling für große Bibliotheken
 * - BroadcastChannel für Cross-Tab-Kommunikation
 * 
 * Abhängigkeiten:
 * - music-library-manager.js (muss vorher geladen sein)
 * - musik.html (DOM-Elemente)
 * 
 * ===================================================================
 */

'use strict';

// ===================================================================
// KONFIGURATION
// ===================================================================

const MUSIK_CONFIG = {
  // Audio
  DEFAULT_VOLUME: 0.7,
  CROSSFADE_DURATION: 2000,
  
  // UI
  VIRTUAL_SCROLL_ITEMS: 50,
  SCROLL_BUFFER: 10,
  UPDATE_INTERVAL: 100,
  
  // LED-Synchronisation
  LED_UPDATE_FPS: 30,
  AUDIO_SMOOTHING: 0.8,
  FFT_SIZE: 2048,
  
  // BroadcastChannel
  CHANNEL_NAME: 'music-control',
  
  // Storage
  STORAGE_KEYS: {
    PLAYLIST: 'current-playlist',
    PLAYBACK_STATE: 'playback-state',
    VOLUME: 'volume-level',
    REPEAT_MODE: 'repeat-mode',
    SHUFFLE_MODE: 'shuffle-mode'
  }
};

// ===================================================================
// MUSIK-PLAYER KLASSE
// ===================================================================

class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.isPlaying = false;
    this.isPaused = false;
    this.volume = MUSIK_CONFIG.DEFAULT_VOLUME;
    this.repeatMode = 'off'; // 'off', 'one', 'all'
    this.shuffleMode = false;
    this.shuffleOrder = [];
    
    // Audio Context für Visualisierung
    this.audioContext = null;
    this.analyser = null;
    this.audioSource = null;
    
    // BroadcastChannel
    this.channel = null;
    
    this.init();
  }

  /**
   * Initialisiert Player
   */
  init() {
    // Audio-Element konfigurieren
    this.audio.volume = this.volume;
    this.audio.preload = 'metadata';

    // Event-Listener
    this.audio.addEventListener('ended', () => this.handleTrackEnded());
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('loadedmetadata', () => this.handleMetadataLoaded());
    this.audio.addEventListener('error', (e) => this.handleError(e));
    this.audio.addEventListener('play', () => this.handlePlayStateChange(true));
    this.audio.addEventListener('pause', () => this.handlePlayStateChange(false));

    // Gespeicherte Einstellungen laden
    this.loadSettings();

    // BroadcastChannel initialisieren
    this.initBroadcastChannel();

    console.log('✅ Music Player initialisiert');
  }

  /**
   * Initialisiert BroadcastChannel
   */
  initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel(MUSIK_CONFIG.CHANNEL_NAME);
      
      window.addEventListener('message', (event) => {
        // ✅ ORIGIN-VALIDIERUNG FÜR SICHERHEIT
        const allowedOrigins = ['http://localhost', 'https://localhost', window.location.origin];
        if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
          console.warn('🚫 Unerlaubte postMessage Origin:', event.origin);
          return;
        }
        this.handleRemoteCommand(event.data);
      });

      console.log('✅ BroadcastChannel initialisiert');
    } catch (error) {
      console.warn('BroadcastChannel nicht verfügbar:', error);
    }
  }

  /**
   * Initialisiert Audio Context
   */
  initAudioContext() {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = MUSIK_CONFIG.FFT_SIZE;
      this.analyser.smoothingTimeConstant = MUSIK_CONFIG.AUDIO_SMOOTHING;

      this.audioSource = this.audioContext.createMediaElementSource(this.audio);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      console.log('✅ Audio Context initialisiert');
    } catch (error) {
      console.error('Audio Context Fehler:', error);
    }
  }

  /**
   * Lädt Track
   */
  async loadTrack(track) {
    try {
      // FileHandle zu Blob konvertieren
      if (track.fileHandle) {
        const file = await track.fileHandle.getFile();
        const url = URL.createObjectURL(file);
        
        // Altes URL freigeben
        if (this.audio.src && this.audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(this.audio.src);
        }
        
        this.audio.src = url;
      } else if (track.url) {
        this.audio.src = track.url;
      } else {
        throw new Error('Kein Audio-Source verfügbar');
      }

      // Audio Context initialisieren (falls noch nicht geschehen)
      if (!this.audioContext) {
        this.initAudioContext();
      }

      console.log('📀 Track geladen:', track.title);
      return true;

    } catch (error) {
      console.error('Fehler beim Laden des Tracks:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Track konnte nicht geladen werden', 'error');
      }
      
      return false;
    }
  }

  /**
   * Spielt Track ab
   */
  async play() {
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.isPaused = false;
      
      // Broadcast
      this.broadcast({ command: 'play', trackIndex: this.currentTrackIndex });
      
      console.log('▶️ Wiedergabe gestartet');
    } catch (error) {
      console.error('Wiedergabe-Fehler:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Wiedergabe fehlgeschlagen', 'error');
      }
    }
  }

  /**
   * Pausiert Wiedergabe
   */
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.isPaused = true;
    
    // Broadcast
    this.broadcast({ command: 'pause' });
    
    console.log('⏸️ Wiedergabe pausiert');
  }

  /**
   * Toggle Play/Pause
   */
  async togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Spielt Track bei Index
   */
  async playTrack(index) {
    if (index < 0 || index >= this.playlist.length) {
      console.error('Ungültiger Track-Index:', index);
      return;
    }

    this.currentTrackIndex = index;
    const track = this.playlist[index];

    const loaded = await this.loadTrack(track);
    if (loaded) {
      await this.play();
      this.updateNowPlaying(track);
      this.savePlaybackState();
    }
  }

  /**
   * Nächster Track
   */
  async playNext() {
    if (this.playlist.length === 0) return;

    let nextIndex;

    if (this.shuffleMode) {
      const currentShufflePos = this.shuffleOrder.indexOf(this.currentTrackIndex);
      const nextShufflePos = (currentShufflePos + 1) % this.shuffleOrder.length;
      nextIndex = this.shuffleOrder[nextShufflePos];
    } else {
      nextIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    }

    await this.playTrack(nextIndex);
  }

  /**
   * Vorheriger Track
   */
  async playPrevious() {
    if (this.playlist.length === 0) return;

    // Wenn mehr als 3 Sekunden gespielt, Track neu starten
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    let prevIndex;

    if (this.shuffleMode) {
      const currentShufflePos = this.shuffleOrder.indexOf(this.currentTrackIndex);
      const prevShufflePos = (currentShufflePos - 1 + this.shuffleOrder.length) % this.shuffleOrder.length;
      prevIndex = this.shuffleOrder[prevShufflePos];
    } else {
      prevIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    }

    await this.playTrack(prevIndex);
  }

  /**
   * Setzt Lautstärke
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.audio.volume = this.volume;
    
    // Speichern
    localStorage.setItem(MUSIK_CONFIG.STORAGE_KEYS.VOLUME, this.volume);
    
    // Broadcast
    this.broadcast({ command: 'volume', value: this.volume });
  }

  /**
   * Seek Position
   */
  seek(time) {
    if (!isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, time));
    }
  }

  /**
   * Toggle Repeat-Modus
   */
  toggleRepeat() {
    const modes = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIndex + 1) % modes.length];
    
    // Speichern
    localStorage.setItem(MUSIK_CONFIG.STORAGE_KEYS.REPEAT_MODE, this.repeatMode);
    
    // Broadcast
    this.broadcast({ command: 'repeat', mode: this.repeatMode });
    
    console.log('🔁 Repeat-Modus:', this.repeatMode);
    
    return this.repeatMode;
  }

  /**
   * Toggle Shuffle-Modus
   */
  toggleShuffle() {
    this.shuffleMode = !this.shuffleMode;
    
    if (this.shuffleMode) {
      this.generateShuffleOrder();
    }
    
    // Speichern
    localStorage.setItem(MUSIK_CONFIG.STORAGE_KEYS.SHUFFLE_MODE, this.shuffleMode);
    
    // Broadcast
    this.broadcast({ command: 'shuffle', enabled: this.shuffleMode });
    
    console.log('🔀 Shuffle-Modus:', this.shuffleMode);
    
    return this.shuffleMode;
  }

  /**
   * Generiert Shuffle-Reihenfolge
   */
  generateShuffleOrder() {
    this.shuffleOrder = Array.from({ length: this.playlist.length }, (_, i) => i);
    
    // Fisher-Yates Shuffle
    for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
    }
    
    // Aktuellen Track an erste Position setzen
    if (this.currentTrackIndex >= 0) {
      const currentPos = this.shuffleOrder.indexOf(this.currentTrackIndex);
      if (currentPos > 0) {
        [this.shuffleOrder[0], this.shuffleOrder[currentPos]] = 
        [this.shuffleOrder[currentPos], this.shuffleOrder[0]];
      }
    }
  }

  /**
   * Setzt Playlist
   */
  setPlaylist(tracks) {
    this.playlist = tracks;
    
    if (this.shuffleMode) {
      this.generateShuffleOrder();
    }
    
    // Speichern
    this.savePlaylist();
    
    console.log('📋 Playlist gesetzt:', tracks.length, 'Tracks');
  }

  /**
   * Fügt Track zur Playlist hinzu
   */
  addToPlaylist(track) {
    this.playlist.push(track);
    
    if (this.shuffleMode) {
      this.shuffleOrder.push(this.playlist.length - 1);
    }
    
    this.savePlaylist();
  }

  /**
   * Entfernt Track aus Playlist
   */
  removeFromPlaylist(index) {
    if (index < 0 || index >= this.playlist.length) return;
    
    this.playlist.splice(index, 1);
    
    // Aktuellen Index anpassen
    if (this.currentTrackIndex >= index) {
      this.currentTrackIndex = Math.max(-1, this.currentTrackIndex - 1);
    }
    
    if (this.shuffleMode) {
      this.generateShuffleOrder();
    }
    
    this.savePlaylist();
  }

  /**
   * Leert Playlist
   */
  clearPlaylist() {
    this.playlist = [];
    this.currentTrackIndex = -1;
    this.shuffleOrder = [];
    this.pause();
    this.savePlaylist();
  }

  /**
   * Track beendet Handler
   */
  handleTrackEnded() {
    console.log('⏭️ Track beendet');

    if (this.repeatMode === 'one') {
      // Track wiederholen
      this.audio.currentTime = 0;
      this.play();
    } else if (this.repeatMode === 'all' || this.currentTrackIndex < this.playlist.length - 1) {
      // Nächster Track
      this.playNext();
    } else {
      // Playlist beendet
      this.isPlaying = false;
      this.isPaused = false;
      this.broadcast({ command: 'stopped' });
    }
  }

  /**
   * Time-Update Handler
   */
  handleTimeUpdate() {
    if (this.isPlaying) {
      const progress = {
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
        percentage: (this.audio.currentTime / this.audio.duration) * 100
      };
      
      // UI aktualisieren
      this.updateProgress(progress);
      
      // LED-Synchronisation (falls aktiviert)
      if (window.ledSyncEnabled) {
        this.syncLEDWithAudio();
      }
    }
  }

  /**
   * Metadata geladen Handler
   */
  handleMetadataLoaded() {
    console.log('📊 Metadata geladen - Dauer:', this.audio.duration);
  }

  /**
   * Play-State Change Handler
   */
  handlePlayStateChange(isPlaying) {
    this.isPlaying = isPlaying;
    this.updatePlayPauseButton();
  }

  /**
   * Error Handler
   */
  handleError(event) {
    console.error('Audio-Fehler:', event);
    
    if (window.showGlobalNotification) {
      window.showGlobalNotification('Wiedergabe-Fehler', 'error');
    }
    
    // Versuche nächsten Track
    if (this.currentTrackIndex < this.playlist.length - 1) {
      setTimeout(() => this.playNext(), 1000);
    }
  }

  /**
   * Remote Command Handler
   */
  handleRemoteCommand(data) {
    switch (data.command) {
      case 'play':
        if (data.trackIndex !== undefined && data.trackIndex !== this.currentTrackIndex) {
          this.playTrack(data.trackIndex);
        } else {
          this.play();
        }
        break;
      case 'pause':
        this.pause();
        break;
      case 'next':
        this.playNext();
        break;
      case 'previous':
        this.playPrevious();
        break;
      case 'volume':
        this.setVolume(data.value);
        break;
      case 'seek':
        this.seek(data.time);
        break;
      case 'repeat':
        this.repeatMode = data.mode;
        break;
      case 'shuffle':
        this.shuffleMode = data.enabled;
        if (this.shuffleMode) {
          this.generateShuffleOrder();
        }
        break;
    }
  }

  /**
   * Broadcast Message
   */
  broadcast(data) {
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (error) {
        console.warn('Broadcast-Fehler:', error);
      }
    }
  }

  /**
   * LED-Synchronisation mit Audio
   */
  /**
   * ✅ ECHTE HARDWARE LED-SYNCHRONISATION MIT AUDIO
   */
  async syncLEDWithAudio() {
    if (!this.analyser) return;

    try {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);

      // Frequenzbänder extrahieren
      const bass = this.getAverageFrequency(dataArray, 0, 50);
      const mid = this.getAverageFrequency(dataArray, 50, 150);
      const treble = this.getAverageFrequency(dataArray, 150, 255);

      // In RGB-Werte konvertieren
      const r = Math.min(255, Math.floor(bass * 2));
      const g = Math.min(255, Math.floor(mid * 2));
      const b = Math.min(255, Math.floor(treble * 2));

      // ✅ SENDE AN ALLE VERFÜGBAREN HARDWARE-GERÄTE
      
      // 1. BLE-Hardware
      if (window.ledDevice && window.ledDevice.isConnected) {
        const cmd = new Uint8Array([0x7E, 0x00, 0x05, r, g, b, 0x00, 0xEF]);
        await window.ledDevice.characteristic.writeValue(cmd);
      }
      
      // 2. WLED über WiFi
      if (window.wledDevice && window.wledDevice.connected) {
        await fetch(`http://${window.wledDevice.ip}/json/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            on: true,
            seg: [{ col: [[r, g, b]] }]
          })
        });
      }
      
      // 3. Universelle Funktion
      if (window.sendUniversalColor) {
        await window.sendUniversalColor(r, g, b);
      }
      
      // 4. Legacy Controller
      if (window.ledController && window.ledController.isConnected) {
        await window.ledController.setColorRGB(r, g, b);
      }

    } catch (error) {
      // Silent fail für Performance
    }
  }

  /**
   * Durchschnittliche Frequenz berechnen
   */
  getAverageFrequency(dataArray, start, end) {
    let sum = 0;
    const count = end - start;
    
    for (let i = start; i < end; i++) {
      sum += dataArray[i];
    }
    
    return sum / count;
  }

  /**
   * Aktualisiert Now-Playing Display
   */
  updateNowPlaying(track) {
    // UI-Elemente finden
    const titleElement = document.getElementById('now-playing-title');
    const artistElement = document.getElementById('now-playing-artist');
    const albumElement = document.getElementById('now-playing-album');
    const coverElement = document.getElementById('now-playing-cover');

    if (titleElement) titleElement.textContent = track.title || 'Unbekannter Titel';
    if (artistElement) artistElement.textContent = track.artist || 'Unbekannter Künstler';
    if (albumElement) albumElement.textContent = track.album || 'Unbekanntes Album';
    
    if (coverElement && track.cover) {
      coverElement.src = track.cover;
    } else if (coverElement) {
      coverElement.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23333"/><text x="50%" y="50%" fill="white" font-size="48" text-anchor="middle" dy=".3em">♪</text></svg>';
    }

    // Broadcast
    this.broadcast({ 
      command: 'nowPlaying', 
      track: {
        title: track.title,
        artist: track.artist,
        album: track.album
      }
    });
  }

  /**
   * Aktualisiert Progress Bar
   */
  updateProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const currentTimeElement = document.getElementById('current-time');
    const durationElement = document.getElementById('duration');

    if (progressBar) {
      progressBar.value = progress.percentage || 0;
    }

    if (currentTimeElement) {
      currentTimeElement.textContent = this.formatTime(progress.currentTime);
    }

    if (durationElement) {
      durationElement.textContent = this.formatTime(progress.duration);
    }
  }

  /**
   * Aktualisiert Play/Pause Button
   */
  updatePlayPauseButton() {
    const button = document.getElementById('play-pause-btn');
    if (!button) return;

    const icon = button.querySelector('i');
    if (icon) {
      if (this.isPlaying) {
        icon.className = 'fas fa-pause';
      } else {
        icon.className = 'fas fa-play';
      }
    }
  }

  /**
   * Formatiert Zeit
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Speichert Playlist
   */
  savePlaylist() {
    try {
      // Nur IDs speichern, nicht FileHandles
      const playlistData = this.playlist.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        filePath: track.filePath
      }));
      
      localStorage.setItem(MUSIK_CONFIG.STORAGE_KEYS.PLAYLIST, JSON.stringify(playlistData));
    } catch (error) {
      console.error('Fehler beim Speichern der Playlist:', error);
    }
  }

  /**
   * Speichert Playback-State
   */
  savePlaybackState() {
    try {
      const state = {
        currentTrackIndex: this.currentTrackIndex,
        currentTime: this.audio.currentTime,
        isPlaying: this.isPlaying
      };
      
      localStorage.setItem(MUSIK_CONFIG.STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Fehler beim Speichern des Playback-States:', error);
    }
  }

  /**
   * Lädt Einstellungen
   */
  loadSettings() {
    try {
      // Lautstärke
      const savedVolume = localStorage.getItem(MUSIK_CONFIG.STORAGE_KEYS.VOLUME);
      if (savedVolume) {
        this.volume = parseFloat(savedVolume);
        this.audio.volume = this.volume;
      }

      // Repeat-Modus
      const savedRepeat = localStorage.getItem(MUSIK_CONFIG.STORAGE_KEYS.REPEAT_MODE);
      if (savedRepeat) {
        this.repeatMode = savedRepeat;
      }

      // Shuffle-Modus
      const savedShuffle = localStorage.getItem(MUSIK_CONFIG.STORAGE_KEYS.SHUFFLE_MODE);
      if (savedShuffle) {
        this.shuffleMode = savedShuffle === 'true';
      }

      console.log('✅ Einstellungen geladen');
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    // Audio stoppen
    this.pause();
    
    // Blob-URLs freigeben
    if (this.audio.src && this.audio.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.audio.src);
    }
    
    // Audio Context schließen
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    // BroadcastChannel schließen
    if (this.channel) {
      this.channel.close();
    }

    console.log('🧹 Music Player cleanup abgeschlossen');
  }
}

// ===================================================================
// UI-CONTROLLER
// ===================================================================

class MusicUIController {
  constructor() {
    this.player = new MusicPlayer();
    this.currentView = 'library';
    this.virtualScrollOffset = 0;
    this.isInitialized = false;
  }

  /**
   * Initialisiert UI
   */
  async init() {
    try {
      console.log('🎵 Initialisiere Music UI...');

      // Button-Event-Listener
      this.initEventListeners();

      // Virtual Scrolling initialisieren
      this.initVirtualScrolling();

      // Music Library Manager prüfen
      if (window.musicLibrary) {
        await window.musicLibrary.init();
        await this.loadLibrary();
      } else {
        console.warn('Music Library Manager nicht verfügbar');
      }

      this.isInitialized = true;
      console.log('✅ Music UI initialisiert');

    } catch (error) {
      console.error('❌ UI-Initialisierung fehlgeschlagen:', error);
    }
  }

  /**
   * Initialisiert Event-Listener
   */
  initEventListeners() {
    // Play/Pause
    const playPauseBtn = document.getElementById('play-pause-btn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => this.player.togglePlayPause());
    }

    // Next
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.player.playNext());
    }

    // Previous
    const prevBtn = document.getElementById('previous-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.player.playPrevious());
    }

    // Volume
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.player.setVolume(e.target.value / 100);
      });
    }

    // Progress Bar
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * this.player.audio.duration;
        this.player.seek(time);
      });
    }

    // Repeat
    const repeatBtn = document.getElementById('repeat-btn');
    if (repeatBtn) {
      repeatBtn.addEventListener('click', () => {
        const mode = this.player.toggleRepeat();
        this.updateRepeatButton(mode);
      });
    }

    // Shuffle
    const shuffleBtn = document.getElementById('shuffle-btn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        const enabled = this.player.toggleShuffle();
        this.updateShuffleButton(enabled);
      });
    }

    // Import Library
    const importBtn = document.getElementById('import-library-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.handleLibraryImport());
    }

    // Search
    const searchInput = document.getElementById('music-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    console.log('✅ Event-Listener initialisiert');
  }

  /**
   * Lädt Bibliothek
   */
  async loadLibrary() {
    try {
      const tracks = await window.musicLibrary.getAllTracks();
      
      if (tracks.length > 0) {
        console.log(`📚 ${tracks.length} Tracks in Bibliothek`);
        this.displayTracks(tracks);
        this.player.setPlaylist(tracks);
      } else {
        console.log('📚 Bibliothek ist leer');
        this.showEmptyLibraryMessage();
      }

    } catch (error) {
      console.error('Fehler beim Laden der Bibliothek:', error);
    }
  }

  /**
   * Bibliothek-Import Handler
   */
  async handleLibraryImport() {
    if (!window.musicLibrary) {
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Music Library Manager nicht verfügbar', 'error');
      }
      return;
    }

    try {
      // Progress-UI anzeigen
      this.showImportProgress();

      // Import starten
      const count = await window.musicLibrary.importLibrary((progress) => {
        this.updateImportProgress(progress);
      });

      // Success
      if (window.showGlobalNotification) {
        window.showGlobalNotification(`${count} Tracks importiert!`, 'success');
      }

      // Bibliothek neu laden
      await this.loadLibrary();

    } catch (error) {
      console.error('Import fehlgeschlagen:', error);
      
      if (window.showGlobalNotification) {
        window.showGlobalNotification('Import fehlgeschlagen', 'error');
      }
    } finally {
      this.hideImportProgress();
    }
  }

  /**
   * Zeigt Tracks an
   */
  displayTracks(tracks) {
    const container = document.getElementById('track-list');
    if (!container) return;

    container.innerHTML = '';

    tracks.forEach((track, index) => {
      const trackElement = this.createTrackElement(track, index);
      container.appendChild(trackElement);
    });
  }

  /**
   * Erstellt Track-Element
   */
  createTrackElement(track, index) {
    const div = document.createElement('div');
    div.className = 'track-item';
    div.dataset.index = index;

    const title = document.createElement('div');
    title.className = 'track-title';
    title.textContent = track.title || 'Unbekannter Titel';

    const artist = document.createElement('div');
    artist.className = 'track-artist';
    artist.textContent = track.artist || 'Unbekannter Künstler';

    const duration = document.createElement('div');
    duration.className = 'track-duration';
    duration.textContent = this.player.formatTime(track.duration);

    div.appendChild(title);
    div.appendChild(artist);
    div.appendChild(duration);

    // Click-Handler
    div.addEventListener('click', () => {
      this.player.playTrack(index);
    });

    return div;
  }

  /**
   * Virtual Scrolling initialisieren für große Bibliotheken (>500 Tracks)
   */
  initVirtualScrolling() {
    const trackList = document.getElementById('track-list');
    if (!trackList) return;

    const ITEM_HEIGHT = 60; // Höhe eines Track-Items in px
    const BUFFER_SIZE = 20; // Anzahl der zusätzlich zu rendernden Items

    let scrollTimeout;
    
    trackList.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = trackList.scrollTop;
        const visibleStart = Math.floor(scrollTop / ITEM_HEIGHT);
        const visibleEnd = Math.ceil((scrollTop + trackList.clientHeight) / ITEM_HEIGHT);
        
        // Render nur sichtbare Items + Buffer
        this.renderVisibleTracks(
          Math.max(0, visibleStart - BUFFER_SIZE),
          visibleEnd + BUFFER_SIZE
        );
      }, 100);
    });

    console.log('✅ Virtual Scrolling aktiviert');
  }

  /**
   * Rendert nur sichtbare Tracks (Virtual Scrolling)
   */
  renderVisibleTracks(start, end) {
    if (!this.currentPlaylist || this.currentPlaylist.length === 0) return;
    
    const trackList = document.getElementById('track-list');
    if (!trackList) return;

    // Nur die sichtbaren Tracks rendern
    const visibleTracks = this.currentPlaylist.slice(start, end);
    
    // Container-Höhe setzen für korrektes Scrolling
    trackList.style.height = `${this.currentPlaylist.length * 60}px`;
    
    // Tracks rendern mit Offset
    trackList.innerHTML = '';
    visibleTracks.forEach((track, index) => {
      const actualIndex = start + index;
      const trackEl = this.createTrackElement(track, actualIndex);
      trackEl.style.position = 'absolute';
      trackEl.style.top = `${actualIndex * 60}px`;
      trackEl.style.width = '100%';
      trackList.appendChild(trackEl);
    });
  }

  /**
   * Suche Handler
   */
  async handleSearch(query) {
    if (!window.musicLibrary) return;

    try {
      const results = await window.musicLibrary.searchTracks(query);
      this.displayTracks(results);
    } catch (error) {
      console.error('Suche fehlgeschlagen:', error);
    }
  }

  /**
   * Zeigt Import-Progress mit visueller UI
   */
  showImportProgress() {
    // Progress-Container erstellen falls noch nicht vorhanden
    let progressContainer = document.getElementById('import-progress-container');
    
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.id = 'import-progress-container';
      progressContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        padding: 30px;
        border-radius: 15px;
        border: 2px solid #4ecdc4;
        z-index: 10000;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(78, 205, 196, 0.3);
      `;
      
      progressContainer.innerHTML = `
        <div style="color: #4ecdc4; font-size: 1.5rem; margin-bottom: 15px;">
          <i class="fas fa-music"></i> Musikbibliothek wird importiert
        </div>
        <div style="background: #333; height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
          <div id="import-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #4ecdc4, #44a08d); transition: width 0.3s ease;"></div>
        </div>
        <div id="import-progress-text" style="color: #fff; font-size: 0.9rem;">Wird vorbereitet...</div>
        <div id="import-progress-stats" style="color: #aaa; font-size: 0.8rem; margin-top: 10px;">0 / 0 Tracks</div>
      `;
      
      document.body.appendChild(progressContainer);
    }
    
    progressContainer.style.display = 'block';
    console.log('📥 Import gestartet - Progress-UI angezeigt');
  }

  /**
   * Aktualisiert Import-Progress mit visueller UI
   */
  updateImportProgress(progress) {
    const progressBar = document.getElementById('import-progress-bar');
    const progressText = document.getElementById('import-progress-text');
    const progressStats = document.getElementById('import-progress-stats');
    
    if (progressBar) {
      progressBar.style.width = `${progress.progress || 0}%`;
    }
    
    if (progressText) {
      progressText.textContent = progress.message || 'Wird verarbeitet...';
    }
    
    if (progressStats && progress.current !== undefined && progress.total !== undefined) {
      progressStats.textContent = `${progress.current} / ${progress.total} Tracks`;
    }
    
    console.log(`📥 ${progress.phase}: ${progress.progress}% - ${progress.message}`);
  }

  /**
   * Versteckt Import-Progress UI
   */
  hideImportProgress() {
    const progressContainer = document.getElementById('import-progress-container');
    if (progressContainer) {
      // Fade-Out Animation
      progressContainer.style.opacity = '0';
      progressContainer.style.transition = 'opacity 0.3s ease';
      
      setTimeout(() => {
        progressContainer.style.display = 'none';
        progressContainer.style.opacity = '1';
      }, 300);
    }
    
    console.log('✅ Import abgeschlossen - UI versteckt');
  }

  /**
   * Zeigt leere Bibliothek-Nachricht
   */
  showEmptyLibraryMessage() {
    const container = document.getElementById('track-list');
    if (!container) return;

    container.innerHTML = `
      <div class="empty-library">
        <i class="fas fa-music" style="font-size: 4rem; opacity: 0.3;"></i>
        <h3>Bibliothek ist leer</h3>
        <p>Importiere deine Musiksammlung um loszulegen</p>
        <button id="import-btn-inline" class="btn-primary">Musik importieren</button>
      </div>
    `;

    const btn = document.getElementById('import-btn-inline');
    if (btn) {
      btn.addEventListener('click', () => this.handleLibraryImport());
    }
  }

  /**
   * Aktualisiert Repeat-Button
   */
  updateRepeatButton(mode) {
    const btn = document.getElementById('repeat-btn');
    if (!btn) return;

    btn.dataset.mode = mode;
    
    const icon = btn.querySelector('i');
    if (icon) {
      if (mode === 'one') {
        icon.className = 'fas fa-repeat-1';
      } else {
        icon.className = 'fas fa-repeat';
      }
    }

    if (mode === 'off') {
      btn.classList.remove('active');
    } else {
      btn.classList.add('active');
    }
  }

  /**
   * Aktualisiert Shuffle-Button
   */
  updateShuffleButton(enabled) {
    const btn = document.getElementById('shuffle-btn');
    if (!btn) return;

    if (enabled) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.player) {
      this.player.destroy();
    }
  }
}

// ===================================================================
// GLOBALE INSTANZ
// ===================================================================

// UI Controller global verfügbar machen
window.MusicPlayer = MusicPlayer;
window.MusicUIController = MusicUIController;
window.musicUI = new MusicUIController();

// Auto-Init wenn DOM bereit
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.musicUI.init();
  });
} else {
  window.musicUI.init();
}

console.log('✅ Musik-Integration geladen');

// ===================================================================
// EXPORT
// ===================================================================

// Browser-kompatible Exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MusicPlayer,
    MusicUIController
  };
} else if (typeof window !== 'undefined') {
  window.MusicPlayer = MusicPlayer;
  window.MusicUIController = MusicUIController;
}
