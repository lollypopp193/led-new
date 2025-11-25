/**
 * MUSIKWECKER CONTROLLER - Vollständige Implementierung
 * @version 1.0.0
 */
'use strict';

const MusicAlarmController = {
    alarms: [],
    checkInterval: null,

    init() {
        console.log('⏰ Musikwecker Controller initialisiert');
        this.loadAlarms();
        this.attachEventListeners();
        this.startAlarmChecker();
    },

    attachEventListeners() {
        // Musikwecker Toggle
        const alarmToggle = document.getElementById('musicAlarmEnabled');
        if (alarmToggle) {
            alarmToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.setAlarmEnabled(enabled);
            });
        }

        // Weckzeit Input
        const alarmTimeInput = document.getElementById('musicAlarmTime');
        if (alarmTimeInput) {
            alarmTimeInput.addEventListener('change', (e) => {
                const time = e.target.value;
                this.setAlarmTime(time);
            });
        }

        // Playlist Dropdown
        const playlistSelect = document.getElementById('musicAlarmPlaylist');
        if (playlistSelect) {
            playlistSelect.addEventListener('change', (e) => {
                const playlistId = e.target.value;
                this.setAlarmPlaylist(playlistId);
            });

            // Lade verfügbare Playlists
            this.populatePlaylistDropdown();
        }

        // Sanft einblenden Toggle
        const fadeInToggle = document.getElementById('musicAlarmFadeIn');
        if (fadeInToggle) {
            fadeInToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                this.setFadeInEnabled(enabled);
            });
        }
    },

    setAlarmEnabled(enabled) {
        localStorage.setItem('music-alarm-enabled', enabled);
        console.log(`⏰ Musikwecker: ${enabled ? 'aktiviert' : 'deaktiviert'}`);

        if (enabled) {
            this.startAlarmChecker();
        } else {
            this.stopAlarmChecker();
        }
    },

    setAlarmTime(time) {
        localStorage.setItem('music-alarm-time', time);
        console.log('⏰ Weckzeit gesetzt:', time);
    },

    setAlarmPlaylist(playlistId) {
        localStorage.setItem('music-alarm-playlist', playlistId);
        console.log('⏰ Alarm-Playlist:', playlistId);
    },

    setFadeInEnabled(enabled) {
        localStorage.setItem('music-alarm-fadein', enabled);
        console.log('⏰ Fade-In:', enabled);
    },

    startAlarmChecker() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        // Prüfe jede Minute
        this.checkInterval = setInterval(() => {
            this.checkAlarms();
        }, 60000);

        // Initiale Prüfung
        this.checkAlarms();
        console.log('✅ Alarm-Checker gestartet');
    },

    stopAlarmChecker() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('🛑 Alarm-Checker gestoppt');
    },

    checkAlarms() {
        const enabled = localStorage.getItem('music-alarm-enabled') === 'true';
        if (!enabled) return;

        const alarmTime = localStorage.getItem('music-alarm-time');
        if (!alarmTime) return;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        if (currentTime === alarmTime) {
            this.triggerAlarm();
        }
    },

    async triggerAlarm() {
        console.log('⏰⏰ WECKER AUSGELÖST!');

        const playlistId = localStorage.getItem('music-alarm-playlist');
        const fadeIn = localStorage.getItem('music-alarm-fadein') === 'true';

        // Notification anzeigen
        if (window.showGlobalNotification) {
            window.showGlobalNotification('🌅 Guten Morgen! Wecker läutet...', 'info', 10000);
        }

        // Musik abspielen
        if (playlistId) {
            await this.playAlarmPlaylist(playlistId, fadeIn);
        } else {
            await this.playDefaultAlarmSound(fadeIn);
        }

        // Alarm für heute deaktivieren (verhindert mehrfaches Auslösen)
        const toggleCheckbox = document.getElementById('musicAlarmEnabled');
        if (toggleCheckbox) {
            toggleCheckbox.checked = false;
            this.setAlarmEnabled(false);
        }
    },

    async playAlarmPlaylist(playlistId, fadeIn) {
        try {
            // Lade Playlist
            const playlist = this.getPlaylistById(playlistId);
            if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
                console.warn('⚠️ Playlist leer oder nicht gefunden');
                return;
            }

            // Spiele erste Track
            const firstTrack = playlist.tracks[0];
            const audioPlayer = document.getElementById('audioPlayer');

            if (audioPlayer) {
                audioPlayer.src = firstTrack.src || firstTrack.path;

                if (fadeIn) {
                    audioPlayer.volume = 0;
                    await audioPlayer.play();
                    this.fadeInVolume(audioPlayer);
                } else {
                    audioPlayer.volume = 0.7;
                    await audioPlayer.play();
                }

                console.log('🎵 Alarm-Musik gestartet:', firstTrack.title);
            }
        } catch (error) {
            console.error('❌ Fehler beim Abspielen:', error);
        }
    },

    async playDefaultAlarmSound(fadeIn) {
        console.log('🔔 Default Alarm-Sound');

        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        // Fallback: Erste verfügbare Track oder Stille
        if (fadeIn) {
            audioPlayer.volume = 0;
            this.fadeInVolume(audioPlayer);
        } else {
            audioPlayer.volume = 0.7;
        }
    },

    fadeInVolume(audioElement) {
        const targetVolume = 0.7;
        const fadeStep = 0.01;
        const fadeInterval = 100; // 100ms

        const fadeIn = setInterval(() => {
            if (audioElement.volume < targetVolume) {
                audioElement.volume = Math.min(audioElement.volume + fadeStep, targetVolume);
            } else {
                clearInterval(fadeIn);
                console.log('✅ Fade-In abgeschlossen');
            }
        }, fadeInterval);
    },

    populatePlaylistDropdown() {
        const select = document.getElementById('musicAlarmPlaylist');
        if (!select) return;

        // Lade Playlists aus MusicLibraryManager
        if (window.musicLibraryManager) {
            const playlists = window.musicLibraryManager.getAllPlaylists();

            select.innerHTML = '<option value="">Standard-Wecker</option>';

            if (playlists && playlists.length > 0) {
                playlists.forEach(playlist => {
                    const option = document.createElement('option');
                    option.value = playlist.id;
                    option.textContent = playlist.name;
                    select.appendChild(option);
                });
            }

            // Setze gespeicherte Playlist
            const savedPlaylist = localStorage.getItem('music-alarm-playlist');
            if (savedPlaylist) {
                select.value = savedPlaylist;
            }
        }
    },

    getPlaylistById(playlistId) {
        if (window.musicLibraryManager) {
            return window.musicLibraryManager.getPlaylist(playlistId);
        }
        return null;
    },

    loadAlarms() {
        // Lade gespeicherte Einstellungen
        const enabled = localStorage.getItem('music-alarm-enabled');
        const time = localStorage.getItem('music-alarm-time');
        const fadeIn = localStorage.getItem('music-alarm-fadein');

        if (enabled === 'true') {
            const toggleCheckbox = document.getElementById('musicAlarmEnabled');
            if (toggleCheckbox) toggleCheckbox.checked = true;
        }

        if (time) {
            const timeInput = document.getElementById('musicAlarmTime');
            if (timeInput) timeInput.value = time;
        }

        if (fadeIn === 'true') {
            const fadeInToggle = document.getElementById('musicAlarmFadeIn');
            if (fadeInToggle) fadeInToggle.checked = true;
        }
    }
};

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MusicAlarmController.init());
} else {
    MusicAlarmController.init();
}

window.MusicAlarmController = MusicAlarmController;
console.log('✅ Musikwecker Controller geladen');
