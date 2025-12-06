/**
 * WEEKLY SCHEDULE CONTROLLER v1.0
 * Wochenpläne für automatische LED-Steuerung Mo-So
 */
'use strict';

class WeeklyScheduleController {
    constructor() {
        this.schedules = [];
        this.storageKey = 'weekly-schedules';
        this.dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        this.dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

        this.loadSchedules();
        console.log('✅ Weekly Schedule Controller initialisiert');
    }

    createSchedule(data) {
        const schedule = {
            id: 'sched_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: data.name || 'Neuer Wochenplan',
            enabled: data.enabled !== false,
            entries: data.entries || [],
            createdAt: Date.now()
        };

        this.schedules.push(schedule);
        this.save();
        console.log('✅ Wochenplan erstellt:', schedule.name);
        return schedule;
    }

    addEntry(scheduleId, entry) {
        const schedule = this.getSchedule(scheduleId);
        if (!schedule) return false;

        const newEntry = {
            id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            day: parseInt(entry.day), // 0=So, 1=Mo, ..., 6=Sa
            time: entry.time || '18:00',
            action: entry.action || 'color', // color, effect, scene, off
            data: entry.data || {},
            enabled: entry.enabled !== false
        };

        schedule.entries.push(newEntry);
        this.save();
        return newEntry;
    }

    /**
     * Beispiel für entry.data:
     * color: { r: 255, g: 100, b: 50, brightness: 80 }
     * effect: { effectId: 5, speed: 50 }
     * scene: { sceneId: 'scene_123' }
     * off: {}
     */

    deleteEntry(scheduleId, entryId) {
        const schedule = this.getSchedule(scheduleId);
        if (!schedule) return false;

        const idx = schedule.entries.findIndex(e => e.id === entryId);
        if (idx === -1) return false;

        schedule.entries.splice(idx, 1);
        this.save();
        return true;
    }

    deleteSchedule(scheduleId) {
        const idx = this.schedules.findIndex(s => s.id === scheduleId);
        if (idx === -1) return false;

        this.schedules.splice(idx, 1);
        this.save();
        console.log('🗑️ Wochenplan gelöscht');
        return true;
    }

    toggleSchedule(scheduleId) {
        const schedule = this.getSchedule(scheduleId);
        if (!schedule) return false;

        schedule.enabled = !schedule.enabled;
        this.save();
        return schedule.enabled;
    }

    toggleEntry(scheduleId, entryId) {
        const schedule = this.getSchedule(scheduleId);
        if (!schedule) return false;

        const entry = schedule.entries.find(e => e.id === entryId);
        if (!entry) return false;

        entry.enabled = !entry.enabled;
        this.save();
        return entry.enabled;
    }

    async executeEntry(entry) {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller || !controller.isConnected) {
                console.warn('⚠️ BLE nicht verbunden');
                return false;
            }

            console.log('⏰ Führe Wochenplan-Eintrag aus:', entry.action);

            switch (entry.action) {
                case 'color':
                    if (entry.data.brightness !== undefined) {
                        await controller.setBrightness(entry.data.brightness);
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    await controller.setColorRGB(
                        entry.data.r || 255,
                        entry.data.g || 255,
                        entry.data.b || 255
                    );
                    break;

                case 'effect':
                    await controller.setEffect(entry.data.effectId || 0);
                    break;

                case 'scene':
                    if (window.scenesManager && entry.data.sceneId) {
                        await window.scenesManager.activateScene(entry.data.sceneId);
                    }
                    break;

                case 'off':
                    await controller.setPower(false);
                    break;

                case 'on':
                    await controller.setPower(true);
                    break;

                default:
                    console.warn('⚠️ Unbekannte Aktion:', entry.action);
                    return false;
            }

            if (window.showNotification) {
                window.showNotification('⏰ Wochenplan: ' + entry.action, 'success');
            }

            return true;
        } catch (e) {
            console.error('❌ Fehler beim Ausführen:', e);
            return false;
        }
    }

    checkScheduledEntries() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const currentDay = now.getDay(); // 0=So, 1=Mo, ..., 6=Sa

        this.getActiveSchedules().forEach(schedule => {
            schedule.entries.forEach(entry => {
                if (entry.enabled && entry.day === currentDay && entry.time === currentTime) {
                    console.log('⏰ Führe geplanten Eintrag aus:', entry.action, 'am', this.dayNames[entry.day]);
                    this.executeEntry(entry);
                }
            });
        });
    }

    getSchedule(scheduleId) {
        return this.schedules.find(s => s.id === scheduleId);
    }

    getAllSchedules() {
        return this.schedules;
    }

    getActiveSchedules() {
        return this.schedules.filter(s => s.enabled);
    }

    getEntriesByDay(scheduleId, day) {
        const schedule = this.getSchedule(scheduleId);
        if (!schedule) return [];
        return schedule.entries.filter(e => e.day === day);
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.schedules));
        } catch (e) {
            console.error('❌ Speichern fehlgeschlagen:', e);
        }
    }

    loadSchedules() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.schedules = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('❌ Laden fehlgeschlagen:', e);
            this.schedules = [];
        }
    }
}

// Global verfügbar machen
window.WeeklyScheduleController = WeeklyScheduleController;
window.weeklyScheduleController = new WeeklyScheduleController();

// Minütliche Prüfung für geplante Einträge
setInterval(() => {
    if (window.weeklyScheduleController) {
        window.weeklyScheduleController.checkScheduledEntries();
    }
}, 60000); // Jede Minute

console.log('✅ Weekly Schedule Controller geladen');
