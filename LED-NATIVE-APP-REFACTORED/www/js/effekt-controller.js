/**
 * EFFEKT-CONTROLLER.JS
 * Alle Effekt-Funktionen aus Effekt.html - KEIN Inline-JS
 */
'use strict';

function getLEDController() {
    if (window.parent && window.parent.ledController) {
        return window.parent.ledController;
    }
    if (window.ledController) {
        return window.ledController;
    }
    if (window.top && window.top.ledController) {
        return window.top.ledController;
    }
    return null;
}

const effekte = [
    { name: "Welle", description: "Hin- und herbewegende Lichtwelle" },
    { name: "Regenbogen", description: "Sanfter Farbwechsel durch das Spektrum" },
    { name: "Feuer", description: "Flackernde Orange- und Rottöne" },
    { name: "Blitz", description: "Schnelle, helle Lichtblitze" },
    { name: "Pulsieren", description: "Rhythmisches Ein- und Ausatmen des Lichts" },
    { name: "Atmen", description: "Sanftes Ein- und Ausfaden" },
    { name: "Lauflicht", description: "Lichtpunkt wandert entlang des Strips" },
    { name: "Stroboskop", description: "Schnelle, rhythmische Blitze" },
    { name: "Farbverlauf", description: "Sanfter Übergang zwischen Farben" },
    { name: "Zufallsfarben", description: "Dynamische, zufällige Farbwechsel" },
    { name: "Disco", description: "Schnelle, bunte Lichtwechsel" },
    { name: "Polizei", description: "Blaue und rote Blitzlichter" },
    { name: "Meteorregen", description: "Fallende Lichtspuren wie Meteore" },
    { name: "Matrix", description: "Grüne fallende Lichtlinien" },
    { name: "Kristall", description: "Funkelnde kristalline Lichteffekte" },
    { name: "Nordlicht", description: "Sanfte grün-blaue Lichtwellen" },
    { name: "Lava", description: "Langsam fließende rot-orange Muster" },
    { name: "Unterwasser", description: "Blaue wellenförmige Bewegungen" },
    { name: "Glitzer", description: "Zufällig funkelnde Lichtpunkte" },
    { name: "Herzschlag", description: "Rhythmisches Pulsieren wie ein Herzschlag" }
];

let favoriten = {};
let globalSpeed = 5;
let activeEffect = null;

function initEffektController() {
    try {
        favoriten = JSON.parse(localStorage.getItem('favoriten')) || {};
        globalSpeed = localStorage.getItem('globalSpeed') || 5;
        activeEffect = localStorage.getItem('activeEffect') || null;
    } catch (error) {
        console.error('Fehler beim Laden der Einstellungen:', error);
    }

    const globalSpeedSlider = document.getElementById('globalSpeed');
    const speedValue = document.getElementById('speedValue');

    if (globalSpeedSlider && speedValue) {
        globalSpeedSlider.value = globalSpeed;
        speedValue.textContent = globalSpeed;

        globalSpeedSlider.addEventListener('input', async (e) => {
            globalSpeed = e.target.value;
            speedValue.textContent = globalSpeed;

            try {
                localStorage.setItem('globalSpeed', globalSpeed);
                updateAnimationSpeed(globalSpeed);

                const controller = getLEDController();
                if (controller && controller.isConnected) {
                    const brightness = Math.round((globalSpeed / 10) * 100);
                    await controller.setBrightness(brightness);
                    console.log(`✅ Geschwindigkeit ${globalSpeed} an Hardware gesendet`);
                }
            } catch (error) {
                console.error('Fehler beim Speichern der Geschwindigkeit:', error);
            }
        });
    }

    renderEffekte();
    console.log('✅ Effekt-Controller initialisiert');
}

function toggleFavorite(effectName, event) {
    if (event) event.stopPropagation();

    if (favoriten[effectName]) {
        delete favoriten[effectName];
        console.log(`❌ ${effectName} aus Favoriten entfernt`);
    } else {
        favoriten[effectName] = true;
        console.log(`⭐ ${effectName} zu Favoriten hinzugefügt`);
    }

    try {
        localStorage.setItem('favoriten', JSON.stringify(favoriten));
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Favoriten:', error);
    }

    renderEffekte();
}

function updateAnimationSpeed(speed) {
    const speedFactor = (11 - speed) / 5;
    const style = document.createElement('style');
    style.id = 'dynamic-animation-speed';

    const oldStyle = document.getElementById('dynamic-animation-speed');
    if (oldStyle) {
        oldStyle.remove();
    }

    style.textContent = `
        .effect-animation {
            animation-duration: ${speedFactor}s !important;
        }
        .effect-animation::before,
        .effect-animation::after {
            animation-duration: ${speedFactor}s !important;
        }
    `;

    document.head.appendChild(style);

    document.querySelectorAll('.effect-animation').forEach((el) => {
        el.style.animation = 'none';
        setTimeout(() => {
            el.style.animation = '';
        }, 10);
    });
}

function renderEffekte() {
    const favoritesGrid = document.getElementById('favoritesGrid');
    const effektGrid = document.getElementById('effektGrid');

    if (!favoritesGrid || !effektGrid) return;

    favoritesGrid.innerHTML = '';
    effektGrid.innerHTML = '';

    effekte.forEach(effekt => {
        const isFavorite = favoriten[effekt.name];
        const card = createEffektCard(effekt, isFavorite);

        if (isFavorite) {
            favoritesGrid.appendChild(card);
        } else {
            effektGrid.appendChild(card);
        }
    });
}

function createEffektCard(effekt, isFavorite) {
    const card = document.createElement('div');
    card.className = 'effect-card';
    card.innerHTML = `
        <div class="effect-animation"></div>
        <div class="effect-content">
            <h3 class="effect-name">${effekt.name}</h3>
            <p class="effect-description">${effekt.description}</p>
            <button class="toggle-favorite-btn" data-effekt-name="${effekt.name}">
                ${isFavorite ? '⭐' : '☆'}
            </button>
        </div>
    `;

    card.addEventListener('click', async () => {
        await applyEffect(effekt.name);
    });

    return card;
}

async function applyEffect(effectName) {
    const controller = getLEDController();
    if (!controller || !controller.isConnected) {
        console.warn('⚠️ Keine BLE-Verbindung');
        if (window.showNotification) {
            window.showNotification('Bitte erst Bluetooth verbinden!', 'warning');
        }
        return;
    }

    try {
        await controller.setEffect(effectName);
        activeEffect = effectName;
        localStorage.setItem('activeEffect', effectName);
        console.log(`✅ Effekt ${effectName} angewendet`);

        if (window.showNotification) {
            window.showNotification(`Effekt ${effectName} aktiviert`, 'success');
        }
    } catch (error) {
        console.error('❌ Fehler beim Anwenden des Effekts:', error);
        if (window.showNotification) {
            window.showNotification('Fehler beim Anwenden des Effekts', 'error');
        }
    }
}

// Event Delegation
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('toggle-favorite-btn') ||
        event.target.closest('.toggle-favorite-btn')) {
        const button = event.target.classList.contains('toggle-favorite-btn')
            ? event.target
            : event.target.closest('.toggle-favorite-btn');
        const effectName = button.getAttribute('data-effekt-name');
        if (effectName) {
            toggleFavorite(effectName, event);
        }
    }
});

// Global Export
window.getLEDController = getLEDController;
window.toggleFavorite = toggleFavorite;
window.updateAnimationSpeed = updateAnimationSpeed;
window.renderEffekte = renderEffekte;
window.applyEffect = applyEffect;
window.effekte = effekte;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffektController);
} else {
    initEffektController();
}

// console.log('✅ Effekt-Controller geladen');
