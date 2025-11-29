/**
 * SLEEP TIMER UI CONTROLLER - Vollständige Implementierung
 * @version 1.0.0
 */
'use strict';

const SleepTimerUI = {
    timerId: null,
    remainingMs: 0,
    enabled: false,

    init() {
        // console.log('💤 Sleep Timer UI initialisiert');
        this.attachEventListeners();
        this.loadSettings();
    },

    attachEventListeners() {
        // Sleep Timer Toggle
        const toggleCheckbox = document.getElementById('sleepTimerEnabled');
        if (toggleCheckbox) {
            toggleCheckbox.addEventListener('change', (e) => {
                this.enabled = e.target.checked;
                this.updateUI();

                if (this.enabled) {
                    this.startTimer();
                } else {
                    this.stopTimer();
                }
            });
        }

        // Dauer Slider
        const durationSlider = document.getElementById('sleepTimerDuration');
        const durationValue = document.getElementById('sleepTimerDurationValue');

        if (durationSlider && durationValue) {
            durationSlider.addEventListener('input', (e) => {
                const minutes = parseInt(e.target.value);
                durationValue.textContent = minutes + ' Min';
                this.remainingMs = minutes * 60 * 1000;
                localStorage.setItem('sleep-timer-duration', minutes);
            });
        }

        // Aktion Dropdown
        const actionSelect = document.getElementById('sleepTimerAction');
        if (actionSelect) {
            actionSelect.addEventListener('change', (e) => {
                const action = e.target.value;
                localStorage.setItem('sleep-timer-action', action);
                // console.log('✅ Sleep Timer Aktion:', action);
            });
        }

        // Schütteln verlängern
        const extendCheckbox = document.getElementById('sleepTimerExtendOnShake');
        if (extendCheckbox) {
            extendCheckbox.addEventListener('change', (e) => {
                const extend = e.target.checked;
                localStorage.setItem('sleep-timer-extend-shake', extend);

                if (extend) {
                    this.initShakeDetection();
                }
            });
        }
    },

    startTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
        }

        const durationSlider = document.getElementById('sleepTimerDuration');
        const minutes = durationSlider ? parseInt(durationSlider.value) : 30;
        this.remainingMs = minutes * 60 * 1000;

        // console.log(`⏰ Sleep Timer gestartet: ${minutes} Min`);

        this.timerId = setInterval(() => {
            this.remainingMs -= 1000;

            if (this.remainingMs <= 0) {
                this.executeAction();
                this.stopTimer();
            } else {
                this.updateRemainingDisplay();
            }
        }, 1000);

        if (window.showGlobalNotification) {
            window.showGlobalNotification(`Sleep Timer: ${minutes} Min`, 'info');
        }
    },

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.enabled = false;
        const toggleCheckbox = document.getElementById('sleepTimerEnabled');
        if (toggleCheckbox) {
            toggleCheckbox.checked = false;
        }

        this.updateRemainingDisplay();
        // console.log('🛑 Sleep Timer gestoppt');
    },

    executeAction() {
        const actionSelect = document.getElementById('sleepTimerAction');
        const action = actionSelect ? actionSelect.value : 'pause';

        // console.log('🎬 Sleep Timer Aktion:', action);

        switch (action) {
            case 'pause':
                this.pauseMusic();
                break;
            case 'stop':
                this.stopMusic();
                break;
            case 'fade-out':
                this.fadeOutMusic();
                break;
            default:
                this.pauseMusic();
        }

        if (window.showGlobalNotification) {
            window.showGlobalNotification('Sleep Timer abgelaufen', 'info', 5000);
        }
    },

    pauseMusic() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.pause();
            // console.log('⏸️ Musik pausiert');
        }
    },

    stopMusic() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            // console.log('⏹️ Musik gestoppt');
        }
    },

    fadeOutMusic() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        const fadeInterval = 100;
        const fadeStep = 0.05;

        const fadeOut = setInterval(() => {
            if (audioPlayer.volume > fadeStep) {
                audioPlayer.volume -= fadeStep;
            } else {
                audioPlayer.volume = 0;
                audioPlayer.pause();
                clearInterval(fadeOut);
                // console.log('🔉 Musik ausgefadet');
            }
        }, fadeInterval);
    },

    updateRemainingDisplay() {
        const displayElement = document.getElementById('sleepTimerRemaining');
        if (!displayElement) return;

        if (this.remainingMs <= 0 || !this.enabled) {
            displayElement.textContent = '--';
            return;
        }

        const minutes = Math.floor(this.remainingMs / 60000);
        const seconds = Math.floor((this.remainingMs % 60000) / 1000);
        displayElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    updateUI() {
        const container = document.getElementById('sleepTimerContainer');
        if (container) {
            container.style.opacity = this.enabled ? '1' : '0.6';
        }
    },

    initShakeDetection() {
        if (!window.DeviceMotionEvent) {
            console.warn('⚠️ DeviceMotion nicht verfügbar');
            return;
        }

        let lastX = 0, lastY = 0, lastZ = 0;
        const threshold = 15;

        window.addEventListener('devicemotion', (e) => {
            if (!this.enabled || !e.accelerationIncludingGravity) return;

            const x = e.accelerationIncludingGravity.x;
            const y = e.accelerationIncludingGravity.y;
            const z = e.accelerationIncludingGravity.z;

            const change = Math.abs(x + y + z - lastX - lastY - lastZ);

            if (change > threshold) {
                // console.log('📳 Schütteln erkannt - Timer verlängert');
                this.remainingMs += 5 * 60 * 1000; // +5 Min

                if (window.showGlobalNotification) {
                    window.showGlobalNotification('Timer um 5 Min verlängert', 'info');
                }
            }

            lastX = x;
            lastY = y;
            lastZ = z;
        });
    },

    loadSettings() {
        const savedDuration = localStorage.getItem('sleep-timer-duration');
        if (savedDuration) {
            const slider = document.getElementById('sleepTimerDuration');
            const valueDisplay = document.getElementById('sleepTimerDurationValue');
            if (slider) slider.value = savedDuration;
            if (valueDisplay) valueDisplay.textContent = savedDuration + ' Min';
        }

        const savedAction = localStorage.getItem('sleep-timer-action');
        if (savedAction) {
            const actionSelect = document.getElementById('sleepTimerAction');
            if (actionSelect) actionSelect.value = savedAction;
        }

        const savedExtend = localStorage.getItem('sleep-timer-extend-shake');
        if (savedExtend === 'true') {
            const extendCheckbox = document.getElementById('sleepTimerExtendOnShake');
            if (extendCheckbox) {
                extendCheckbox.checked = true;
                this.initShakeDetection();
            }
        }
    }
};

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SleepTimerUI.init());
} else {
    SleepTimerUI.init();
}

window.SleepTimerUI = SleepTimerUI;
// console.log('✅ Sleep Timer UI Controller geladen');
