/**
 * SLEEP TIMER & MUSIKWECKER CONTROLLER
 * Vollständige Implementierung mit Hardware-Integration
 */
'use strict';

const SleepTimerController = {
    // State
    sleepTimerActive: false,
    sleepTimerTimeout: null,
    sleepTimerDuration: 30, // Minuten
    sleepTimerAction: 'pause',
    alarmActive: false,
    alarmTime: null,
    alarmCheckInterval: null,

    /**
     * Initialisierung
     */
    init() {
        // console.log('🕐 Sleep Timer Controller initialisiert');

        // Sleep Timer Toggle
        const sleepTimerToggle = document.getElementById('sleepTimerEnabled');
        if (sleepTimerToggle) {
            sleepTimerToggle.addEventListener('change', (e) => {
                this.toggleSleepTimer(e.target.checked);
            });
        }

        // Sleep Timer Dauer Slider
        const durationSlider = document.getElementById('sleepTimerDuration');
        if (durationSlider) {
            durationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('sleepTimerDurationValue').textContent = `${value}min`;
                this.sleepTimerDuration = value;
            });
        }

        // Sleep Timer Aktion
        const actionSelect = document.getElementById('sleepTimerAction');
        if (actionSelect) {
            actionSelect.addEventListener('change', (e) => {
                this.sleepTimerAction = e.target.value;
            });
        }

        // Alarm Toggle
        const alarmToggle = document.getElementById('musicAlarmEnabled');
        if (alarmToggle) {
            alarmToggle.addEventListener('change', (e) => {
                this.toggleAlarm(e.target.checked);
            });
        }

        // Alarm Zeit
        const alarmTimeInput = document.getElementById('alarmTime');
        if (alarmTimeInput) {
            alarmTimeInput.addEventListener('change', (e) => {
                this.alarmTime = e.target.value;
                this.saveSettings();
            });
        }

        // Shake to Extend (falls Gerätesensor verfügbar)
        this.initShakeDetection();

        // Lade gespeicherte Einstellungen
        this.loadSettings();
    },

    /**
     * Sleep Timer Toggle
     */
    toggleSleepTimer(enabled) {
        const settings = document.getElementById('sleepTimerSettings');

        if (enabled) {
            this.startSleepTimer();
            if (settings) {
                settings.style.opacity = '1';
                settings.style.pointerEvents = 'auto';
            }
            // console.log(`⏰ Sleep Timer gestartet: ${this.sleepTimerDuration} Minuten`);
        } else {
            this.stopSleepTimer();
            if (settings) {
                settings.style.opacity = '0.5';
                settings.style.pointerEvents = 'none';
            }
            // console.log('⏰ Sleep Timer gestoppt');
        }
    },

    /**
     * Sleep Timer starten
     */
    startSleepTimer() {
        this.sleepTimerActive = true;
        const durationMs = this.sleepTimerDuration * 60 * 1000;

        this.sleepTimerTimeout = setTimeout(() => {
            this.executeSleepTimerAction();
        }, durationMs);

        // Benachrichtigung
        if (window.showGlobalNotification) {
            window.showGlobalNotification(
                `Sleep Timer: ${this.sleepTimerDuration} Minuten`,
                'info'
            );
        }

        this.saveSettings();
    },

    /**
     * Sleep Timer stoppen
     */
    stopSleepTimer() {
        this.sleepTimerActive = false;
        if (this.sleepTimerTimeout) {
            clearTimeout(this.sleepTimerTimeout);
            this.sleepTimerTimeout = null;
        }
        this.saveSettings();
    },

    /**
     * Sleep Timer Aktion ausführen
     */
    executeSleepTimerAction() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        switch (this.sleepTimerAction) {
            case 'pause':
                audioPlayer.pause();
                // console.log('⏸️ Sleep Timer: Musik pausiert');
                break;

            case 'stop':
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                // console.log('⏹️ Sleep Timer: Musik gestoppt');
                break;

            case 'fadeOut':
                this.fadeOutAudio(audioPlayer);
                // console.log('🔉 Sleep Timer: Fade-Out gestartet');
                break;
        }

        // Toggle zurücksetzen
        const toggle = document.getElementById('sleepTimerEnabled');
        if (toggle) toggle.checked = false;
        this.toggleSleepTimer(false);

        // Benachrichtigung
        if (window.showGlobalNotification) {
            window.showGlobalNotification('Sleep Timer abgelaufen', 'info');
        }
    },

    /**
     * Audio Fade-Out
     */
    fadeOutAudio(audioElement) {
        const originalVolume = audioElement.volume;
        const fadeSteps = 20;
        const stepDuration = 100; // ms
        const volumeStep = originalVolume / fadeSteps;

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            audioElement.volume = Math.max(0, originalVolume - (volumeStep * currentStep));

            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                audioElement.pause();
                audioElement.volume = originalVolume;
            }
        }, stepDuration);
    },

    /**
     * Alarm Toggle
     */
    toggleAlarm(enabled) {
        const settings = document.getElementById('musicAlarmSettings');

        if (enabled) {
            this.startAlarmCheck();
            if (settings) {
                settings.style.opacity = '1';
                settings.style.pointerEvents = 'auto';
            }
            // console.log(`⏰ Musikwecker aktiviert: ${this.alarmTime}`);
        } else {
            this.stopAlarmCheck();
            if (settings) {
                settings.style.opacity = '0.5';
                settings.style.pointerEvents = 'none';
            }
            // console.log('⏰ Musikwecker deaktiviert');
        }
    },

    /**
     * Alarm Check starten
     */
    startAlarmCheck() {
        this.alarmActive = true;

        // Prüfe jede Minute ob Weckzeit erreicht
        this.alarmCheckInterval = setInterval(() => {
            this.checkAlarm();
        }, 60000); // 1 Minute

        // Sofort prüfen
        this.checkAlarm();

        this.saveSettings();
    },

    /**
     * Alarm Check stoppen
     */
    stopAlarmCheck() {
        this.alarmActive = false;
        if (this.alarmCheckInterval) {
            clearInterval(this.alarmCheckInterval);
            this.alarmCheckInterval = null;
        }
        this.saveSettings();
    },

    /**
     * Alarm prüfen
     */
    checkAlarm() {
        if (!this.alarmTime) return;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        if (currentTime === this.alarmTime) {
            this.triggerAlarm();
        }
    },

    /**
     * Alarm auslösen
     */
    triggerAlarm() {
        // console.log('🔔 Musikwecker ausgelöst!');

        const audioPlayer = document.getElementById('audioPlayer');
        const fadeInCheckbox = document.getElementById('alarmFadeIn');
        const playlistSelect = document.getElementById('alarmPlaylist');

        // Playlist laden basierend auf Auswahl
        if (playlistSelect && playlistSelect.value !== 'current') {
            this.loadAlarmPlaylist(playlistSelect.value);
        }

        // Fade-In oder direkt abspielen
        if (audioPlayer) {
            if (fadeInCheckbox && fadeInCheckbox.checked) {
                this.fadeInAudio(audioPlayer);
            } else {
                audioPlayer.play();
            }
        }

        // Benachrichtigung
        if (window.showGlobalNotification) {
            window.showGlobalNotification('Musikwecker!', 'info');
        }

        // Vibration (falls verfügbar)
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Alarm deaktivieren
        const toggle = document.getElementById('musicAlarmEnabled');
        if (toggle) toggle.checked = false;
        this.toggleAlarm(false);
    },

    /**
     * Audio Fade-In
     */
    fadeInAudio(audioElement) {
        const targetVolume = audioElement.volume;
        const fadeSteps = 30;
        const stepDuration = 100; // ms
        const volumeStep = targetVolume / fadeSteps;

        audioElement.volume = 0;
        audioElement.play();

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            audioElement.volume = Math.min(targetVolume, volumeStep * currentStep);

            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
            }
        }, stepDuration);
    },

    /**
     * Alarm Playlist laden
     */
    loadAlarmPlaylist(type) {
        // console.log(`📻 Lade Alarm-Playlist: ${type}`);
        // Implementierung abhängig von playlist-System
        // Wird von music-library-manager.js gesteuert
    },

    /**
     * Shake Detection initialisieren
     */
    initShakeDetection() {
        if (!window.DeviceMotionEvent) return;

        let lastUpdate = 0;
        const threshold = 15;

        window.addEventListener('devicemotion', (e) => {
            const currentTime = Date.now();
            if (currentTime - lastUpdate < 100) return;

            const acceleration = e.accelerationIncludingGravity;
            const x = acceleration.x;
            const y = acceleration.y;
            const z = acceleration.z;

            const magnitude = Math.sqrt(x * x + y * y + z * z);

            if (magnitude > threshold && this.sleepTimerActive) {
                this.extendSleepTimer();
            }

            lastUpdate = currentTime;
        });
    },

    /**
     * Sleep Timer verlängern (durch Schütteln)
     */
    extendSleepTimer() {
        const shakeCheckbox = document.getElementById('sleepTimerShakeToExtend');
        if (!shakeCheckbox || !shakeCheckbox.checked) return;

        // Timer um 5 Minuten verlängern
        this.stopSleepTimer();
        this.sleepTimerDuration += 5;

        const durationSlider = document.getElementById('sleepTimerDuration');
        if (durationSlider) {
            durationSlider.value = this.sleepTimerDuration;
            document.getElementById('sleepTimerDurationValue').textContent =
                `${this.sleepTimerDuration}min`;
        }

        this.startSleepTimer();

        if (window.showGlobalNotification) {
            window.showGlobalNotification('Sleep Timer um 5min verlängert', 'info');
        }

        // console.log('📳 Sleep Timer durch Schütteln verlängert');
    },

    /**
     * Einstellungen speichern
     */
    saveSettings() {
        const settings = {
            sleepTimer: {
                active: this.sleepTimerActive,
                duration: this.sleepTimerDuration,
                action: this.sleepTimerAction
            },
            alarm: {
                active: this.alarmActive,
                time: this.alarmTime
            }
        };

        localStorage.setItem('timer-settings', JSON.stringify(settings));
    },

    /**
     * Einstellungen laden
     */
    loadSettings() {
        const stored = localStorage.getItem('timer-settings');
        if (!stored) return;

        try {
            const settings = JSON.parse(stored);

            if (settings.sleepTimer) {
                this.sleepTimerDuration = settings.sleepTimer.duration || 30;
                this.sleepTimerAction = settings.sleepTimer.action || 'pause';
            }

            if (settings.alarm) {
                this.alarmTime = settings.alarm.time;
                const alarmInput = document.getElementById('alarmTime');
                if (alarmInput && this.alarmTime) {
                    alarmInput.value = this.alarmTime;
                }
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Timer-Einstellungen:', error);
        }
    }
};

// Global verfügbar machen
window.SleepTimerController = SleepTimerController;
