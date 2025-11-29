/**
 * TIMER-CONTROLLER.JS
 * Alle Timer-Funktionen aus Timer.html - KEIN Inline-JS
 */
'use strict';

let timerStorage = [];
let timerCheckInterval = null;

function saveTimer(timer) {
    try {
        if (!timer.startTime || !timer.endTime) {
            throw new Error('Start- und Endzeit sind erforderlich');
        }

        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timer.startTime) || !timeRegex.test(timer.endTime)) {
            throw new Error('Ungültiges Zeitformat');
        }

        const timers = getTimers();
        timers.push(timer);
        timerStorage = timers;

        try {
            if (typeof Storage !== 'undefined') {
                localStorage.setItem('ledTimers', JSON.stringify(timers));
            }
        } catch (e) {
            console.warn('LocalStorage nicht verfügbar, verwende In-Memory-Speicher');
        }
    } catch (error) {
        console.error('Fehler beim Speichern des Timers:', error);
        throw error;
    }
}

function getTimers() {
    try {
        if (typeof Storage !== 'undefined') {
            const stored = localStorage.getItem('ledTimers');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    timerStorage = parsed;
                    return parsed;
                }
            }
        }
    } catch (error) {
        console.warn('Fehler beim Laden aus localStorage:', error);
    }
    return timerStorage;
}

function deleteTimer(timerId) {
    try {
        const timers = getTimers();
        const filtered = timers.filter(t => t.id !== timerId);
        timerStorage = filtered;

        if (typeof Storage !== 'undefined') {
            localStorage.setItem('ledTimers', JSON.stringify(filtered));
        }

        renderTimerList();
        if (window.showNotification) {
            window.showNotification('Timer gelöscht', 'info');
        }
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
    }
}

function renderTimerList() {
    const timersList = document.getElementById('timers-list');
    const timers = getTimers();

    if (!timersList) {
        console.error('❌ Timer-Liste Element nicht gefunden');
        return;
    }

    timersList.innerHTML = '';

    if (timers.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'color: rgba(255, 255, 255, 0.5); text-align: center; padding: 20px;';
        emptyMsg.textContent = 'Keine Timer gespeichert';
        timersList.appendChild(emptyMsg);
        return;
    }

    timers.forEach((timer) => {
        const days = timer.weekdays && timer.weekdays.length > 0
            ? timer.weekdays.join(', ')
            : 'Täglich';
        const actionText = timer.action === 'on'
            ? 'LEDs einschalten'
            : timer.action === 'off'
                ? 'LEDs ausschalten'
                : 'LEDs umschalten';

        const timerElement = document.createElement('div');
        timerElement.className = 'timer-item';

        const timerDetails = document.createElement('div');
        timerDetails.className = 'timer-details';

        const timerTime = document.createElement('div');
        timerTime.className = 'timer-time';
        timerTime.textContent = `${days} - ${timer.startTime} bis ${timer.endTime}`;

        const timerSettings = document.createElement('div');
        timerSettings.className = 'timer-settings';

        const actionSpan = document.createElement('span');
        actionSpan.textContent = `${timer.action === 'on' ? '🔌' : '⏻'} ${actionText}`;

        const timerActions = document.createElement('div');
        timerActions.className = 'timer-actions';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'timer-btn delete';
        deleteButton.textContent = '🗑️';
        deleteButton.onclick = () => deleteTimer(timer.id);

        timerSettings.appendChild(actionSpan);
        timerDetails.appendChild(timerTime);
        timerDetails.appendChild(timerSettings);
        timerActions.appendChild(deleteButton);
        timerElement.appendChild(timerDetails);
        timerElement.appendChild(timerActions);

        timersList.appendChild(timerElement);
    });
}

function startTimerCheck() {
    if (timerCheckInterval) {
        clearInterval(timerCheckInterval);
    }

    timerCheckInterval = setInterval(() => {
        try {
            checkTimers();
        } catch (error) {
            console.error('Fehler bei Timer-Überprüfung:', error);
        }
    }, 60000);

    try {
        checkTimers();
    } catch (error) {
        console.error('Fehler bei initialer Timer-Überprüfung:', error);
    }
}

function stopTimerCheck() {
    if (timerCheckInterval) {
        clearInterval(timerCheckInterval);
        timerCheckInterval = null;
    }
}

function checkTimers() {
    try {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0');

        const weekdays = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'];
        const currentDay = weekdays[now.getDay()];

        const timers = getTimers();

        timers.forEach((timer) => {
            try {
                if (timer.enabled === false) return;

                if (!timer.startTime || !timer.endTime) {
                    console.warn('Timer mit ungültigen Zeiten gefunden:', timer);
                    return;
                }

                if (!timer.weekdays || !Array.isArray(timer.weekdays)) {
                    console.warn('Timer ohne Wochentage:', timer);
                    return;
                }

                if (timer.weekdays.includes(currentDay)) {
                    if (currentTime === timer.startTime) {
                        executeLEDAction(timer.action, timer);
                    }
                }
            } catch (error) {
                console.error('Fehler bei Timer-Ausführung:', error);
            }
        });
    } catch (error) {
        console.error('Fehler bei checkTimers:', error);
    }
}

async function executeLEDAction(action, timer) {
    try {
        const controller = window.parent?.ledController || window.ledController;

        if (!controller || !controller.isConnected) {
            console.warn('⚠️ Keine BLE-Verbindung für Timer-Aktion');
            return false;
        }

        switch (action) {
            case 'on':
                await controller.turnOn();
                // console.log('✅ Timer: LEDs eingeschaltet');
                break;
            case 'off':
                await controller.turnOff();
                // console.log('✅ Timer: LEDs ausgeschaltet');
                break;
            case 'toggle':
                await controller.toggle();
                // console.log('✅ Timer: LEDs umgeschaltet');
                break;
        }

        if (window.showNotification) {
            window.showNotification(`Timer ausgeführt: ${action}`, 'success');
        }

        return true;
    } catch (error) {
        console.error('❌ Fehler bei LED-Aktion:', error);
        return false;
    }
}

function initTimerController() {
    const weekdayButtons = document.querySelectorAll('.weekday-btn');
    weekdayButtons.forEach((button) => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
        });
    });

    const actionModes = document.querySelectorAll('.action-mode');
    actionModes.forEach((mode) => {
        mode.addEventListener('click', () => {
            actionModes.forEach((m) => m.classList.remove('active'));
            mode.classList.add('active');
        });
    });

    const saveButton = document.getElementById('save-btn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const startTime = document.getElementById('start-time')?.value;
            const endTime = document.getElementById('end-time')?.value;

            if (!startTime || !endTime) {
                if (window.showNotification) {
                    window.showNotification('Bitte Start- und Endzeit eingeben!', 'error');
                }
                return;
            }

            const activeWeekdays = [];
            document.querySelectorAll('.weekday-btn.active').forEach((btn) => {
                activeWeekdays.push(btn.getAttribute('data-day'));
            });

            if (activeWeekdays.length === 0) {
                if (window.showNotification) {
                    window.showNotification('Bitte mindestens einen Wochentag auswählen!', 'error');
                }
                return;
            }

            const activeAction = document.querySelector('.action-mode.active');
            const action = activeAction ? activeAction.getAttribute('data-action') : 'on';

            const timer = {
                id: Date.now().toString(),
                startTime: startTime,
                endTime: endTime,
                weekdays: activeWeekdays,
                action: action,
                enabled: true,
                createdAt: new Date().toISOString()
            };

            saveTimer(timer);
            renderTimerList();

            if (window.showNotification) {
                window.showNotification('Timer erfolgreich gespeichert!', 'success');
            }
        });
    }

    renderTimerList();
    startTimerCheck();

    // console.log('✅ Timer-Controller initialisiert');
}

// Global Export
window.saveTimer = saveTimer;
window.getTimers = getTimers;
window.deleteTimer = deleteTimer;
window.renderTimerList = renderTimerList;
window.startTimerCheck = startTimerCheck;
window.stopTimerCheck = stopTimerCheck;
window.checkTimers = checkTimers;
window.executeLEDAction = executeLEDAction;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimerController);
} else {
    initTimerController();
}

// // console.log('✅ Timer-Controller geladen');
