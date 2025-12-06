/**
 * SUNRISE/SUNSET SIMULATION CONTROLLER v1.0
 * Sanfter Sonnenauf-/untergang für natürliches Aufwachen
 */
'use strict';

class SunriseSunsetController {
    constructor() {
        this.simulations = [];
        this.storageKey = 'sunrise-sunset-simulations';
        this.activeSimulation = null;
        this.simulationInterval = null;

        this.presets = {
            sunrise: {
                name: 'Sonnenaufgang',
                duration: 30, // Minuten
                colors: [
                    { r: 0, g: 0, b: 0, brightness: 0 },       // Dunkel
                    { r: 50, g: 10, b: 0, brightness: 10 },    // Tiefrot
                    { r: 150, g: 50, b: 0, brightness: 30 },   // Orange
                    { r: 255, g: 150, b: 50, brightness: 60 }, // Hellorange
                    { r: 255, g: 200, b: 100, brightness: 80 },// Gelb
                    { r: 255, g: 255, b: 200, brightness: 100 }// Warmweiß
                ]
            },
            sunset: {
                name: 'Sonnenuntergang',
                duration: 30,
                colors: [
                    { r: 255, g: 255, b: 200, brightness: 100 },// Warmweiß
                    { r: 255, g: 200, b: 100, brightness: 80 }, // Gelb
                    { r: 255, g: 150, b: 50, brightness: 60 },  // Hellorange
                    { r: 200, g: 80, b: 20, brightness: 40 },   // Orange
                    { r: 100, g: 30, b: 10, brightness: 20 },   // Dunkelorange
                    { r: 50, g: 10, b: 5, brightness: 5 },      // Tiefrot
                    { r: 0, g: 0, b: 0, brightness: 0 }         // Dunkel
                ]
            },
            naturalWake: {
                name: 'Natürliches Erwachen',
                duration: 45,
                colors: [
                    { r: 0, g: 0, b: 0, brightness: 0 },
                    { r: 30, g: 5, b: 0, brightness: 5 },
                    { r: 80, g: 20, b: 0, brightness: 15 },
                    { r: 150, g: 60, b: 10, brightness: 30 },
                    { r: 200, g: 120, b: 40, brightness: 50 },
                    { r: 240, g: 180, b: 80, brightness: 70 },
                    { r: 255, g: 220, b: 140, brightness: 90 },
                    { r: 255, g: 255, b: 255, brightness: 100 }
                ]
            },
            relaxingSunset: {
                name: 'Entspannender Sonnenuntergang',
                duration: 60,
                colors: [
                    { r: 255, g: 240, b: 220, brightness: 100 },
                    { r: 255, g: 200, b: 150, brightness: 85 },
                    { r: 255, g: 160, b: 80, brightness: 70 },
                    { r: 220, g: 100, b: 40, brightness: 55 },
                    { r: 180, g: 60, b: 20, brightness: 40 },
                    { r: 120, g: 30, b: 10, brightness: 25 },
                    { r: 60, g: 15, b: 5, brightness: 10 },
                    { r: 20, g: 5, b: 2, brightness: 3 },
                    { r: 0, g: 0, b: 0, brightness: 0 }
                ]
            }
        };

        this.loadSimulations();
        console.log('✅ Sunrise/Sunset Controller initialisiert');
    }

    createSimulation(data) {
        const sim = {
            id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: data.name || 'Neue Simulation',
            type: data.type || 'sunrise', // sunrise, sunset, custom
            preset: data.preset || 'sunrise',
            duration: parseInt(data.duration) || 30,
            time: data.time || '07:00',
            days: data.days || [1, 2, 3, 4, 5], // Mo-Fr
            enabled: data.enabled !== false,
            colors: data.colors || this.presets[data.preset || 'sunrise'].colors,
            createdAt: Date.now()
        };

        this.simulations.push(sim);
        this.save();
        console.log('✅ Simulation erstellt:', sim.name);
        return sim;
    }

    async startSimulation(simId) {
        const sim = this.getSimulation(simId);
        if (!sim) {
            console.error('❌ Simulation nicht gefunden');
            return false;
        }

        this.stopActiveSimulation();
        this.activeSimulation = sim;

        const totalSteps = sim.colors.length;
        const stepDuration = (sim.duration * 60 * 1000) / totalSteps; // ms pro Schritt
        let currentStep = 0;

        console.log('🌅 Starte Simulation:', sim.name, '(' + sim.duration + ' Min)');

        const runStep = async () => {
            if (currentStep >= totalSteps || !this.activeSimulation) {
                this.stopActiveSimulation();
                console.log('✅ Simulation beendet');
                if (window.showNotification) {
                    window.showNotification(sim.type === 'sunrise' ? '🌅 Guten Morgen!' : '🌇 Gute Nacht!', 'success');
                }
                return;
            }

            const color = sim.colors[currentStep];
            await this.sendColorToBLE(color.r, color.g, color.b, color.brightness);

            currentStep++;
            this.simulationInterval = setTimeout(runStep, stepDuration);
        };

        await runStep();
        return true;
    }

    stopActiveSimulation() {
        if (this.simulationInterval) {
            clearTimeout(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.activeSimulation = null;
        console.log('🛑 Simulation gestoppt');
    }

    async sendColorToBLE(r, g, b, brightness) {
        try {
            const controller = window.ledController || window.BLEControllerPro || window.bleController;
            if (!controller || !controller.isConnected) {
                console.warn('⚠️ BLE nicht verbunden');
                return false;
            }

            await controller.setBrightness(brightness);
            await new Promise(resolve => setTimeout(resolve, 100));
            await controller.setColorRGB(r, g, b);

            return true;
        } catch (e) {
            console.error('❌ BLE Fehler:', e);
            return false;
        }
    }

    deleteSimulation(simId) {
        const idx = this.simulations.findIndex(s => s.id === simId);
        if (idx === -1) return false;

        this.simulations.splice(idx, 1);
        this.save();
        console.log('🗑️ Simulation gelöscht');
        return true;
    }

    toggleSimulation(simId) {
        const sim = this.getSimulation(simId);
        if (!sim) return false;

        sim.enabled = !sim.enabled;
        this.save();
        return sim.enabled;
    }

    getSimulation(simId) {
        return this.simulations.find(s => s.id === simId);
    }

    getAllSimulations() {
        return this.simulations;
    }

    getActiveSimulations() {
        return this.simulations.filter(s => s.enabled);
    }

    checkScheduledSimulations() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const currentDay = now.getDay(); // 0=So, 1=Mo, ...

        this.getActiveSimulations().forEach(sim => {
            if (sim.time === currentTime && sim.days.includes(currentDay)) {
                console.log('⏰ Starte geplante Simulation:', sim.name);
                this.startSimulation(sim.id);
            }
        });
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.simulations));
        } catch (e) {
            console.error('❌ Speichern fehlgeschlagen:', e);
        }
    }

    loadSimulations() {
        try {
            const data = localStorage.getItem(this.storageKey);
            this.simulations = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('❌ Laden fehlgeschlagen:', e);
            this.simulations = [];
        }
    }
}

// Global verfügbar machen
window.SunriseSunsetController = SunriseSunsetController;
window.sunriseSunsetController = new SunriseSunsetController();

// Stündliche Prüfung für geplante Simulationen
setInterval(() => {
    if (window.sunriseSunsetController) {
        window.sunriseSunsetController.checkScheduledSimulations();
    }
}, 60000); // Jede Minute prüfen

// UI-Integration
function initSunriseUI() {
    const createBtn = document.getElementById('createSunriseBtn');
    const listContainer = document.getElementById('sunriseList');

    if (!createBtn || !listContainer) return;

    createBtn.addEventListener('click', () => {
        const name = prompt('Name der Simulation:');
        if (!name) return;

        const type = confirm('Sonnenaufgang? (Abbrechen = Sonnenuntergang)') ? 'sunrise' : 'sunset';
        const duration = prompt('Dauer in Minuten:', '30');
        const time = prompt('Startzeit (HH:MM):', '07:00');

        if (duration && time) {
            window.sunriseSunsetController.createSimulation(name, type, parseInt(duration), time);
            renderSunriseList();
        }
    });

    renderSunriseList();
}

function renderSunriseList() {
    const listContainer = document.getElementById('sunriseList');
    if (!listContainer) return;

    const simulations = window.sunriseSunsetController.getAllSimulations();

    if (simulations.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">Keine Simulationen vorhanden</p>';
        return;
    }

    listContainer.innerHTML = simulations.map(sim => `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${sim.name}</strong>
                <div style="font-size: 0.9em; color: #aaa;">${sim.type === 'sunrise' ? '🌅 Aufgang' : '🌇 Untergang'} | ${sim.duration}min | ${sim.scheduledTime || 'Manuell'}</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.sunriseSunsetController.startSimulation('${sim.id}')" style="padding: 8px 12px; background: #4ecdc4; border: none; border-radius: 5px; cursor: pointer;">Start</button>
                <button onclick="window.sunriseSunsetController.deleteSimulation('${sim.id}'); renderSunriseList();" style="padding: 8px 12px; background: #e74c3c; border: none; border-radius: 5px; cursor: pointer;">Löschen</button>
            </div>
        </div>
    `).join('');
}

window.initSunriseUI = initSunriseUI;
window.renderSunriseList = renderSunriseList;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSunriseUI);
} else {
    initSunriseUI();
}

console.log('✅ Sunrise/Sunset Controller geladen');
