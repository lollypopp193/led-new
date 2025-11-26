/**
 * EFFEKT-CONTROLLER.JS - VOLLSTÄNDIGE VERSION
 * Alle Effekt-Funktionen für LED-Steuerung - KEIN Inline-JS
 * 32 Effekte mit Hardware-Kommunikation
 */
'use strict';

/**
 * LED-Controller aus verschiedenen Kontexten abrufen
 * @returns {Object|null} LED-Controller Instanz oder null
 */
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

// Alle 32 verfügbaren Effekte
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
    { name: "Herzschlag", description: "Rhythmisches Pulsieren wie ein Herzschlag" },
    { name: "Spirale", description: "Spiralförmige Lichtbewegung" },
    { name: "Plasma", description: "Elektrische Plasma-ähnliche Effekte" },
    { name: "Konfetti", description: "Bunte fallende Konfetti-Partikel" },
    { name: "Sinus", description: "Mathematische Sinuswellen-Bewegung" },
    { name: "Fade", description: "Sanftes Ein- und Ausblenden" },
    { name: "Scanner", description: "Hin- und herwandernder Lichtbalken" },
    { name: "Twinkle", description: "Sanft twinkelnde Sterne" },
    { name: "Kometen", description: "Vorbeifliegende Kometen mit Schweif" },
    { name: "Feuerzauber", description: "Magische Feuereffekte" },
    { name: "Neonröhre", description: "Flackernde Neonröhren-Simulation" },
    { name: "Lasershow", description: "Schnelle Laserstrahl-Bewegungen" },
    { name: "Borealis", description: "Aurora Borealis Simulation" }
];

// Globale State-Variablen
let favoriten = {};
let globalSpeed = 5;
let activeEffect = null;

// DOM-Elemente (werden beim Init geladen)
let favoritesGrid, effektGrid, saveBtn, resetBtn, globalSpeedSlider, speedValue, notification;

/**
 * Initialisiert den Effekt-Controller
 * Lädt Einstellungen aus localStorage und setzt Event-Listener
 */
function initEffektController() {
    // LocalStorage laden
    try {
        favoriten = JSON.parse(localStorage.getItem("favoriten")) || {};
        globalSpeed = localStorage.getItem("globalSpeed") || 5;
        activeEffect = localStorage.getItem("activeEffect") || null;
    } catch (error) {
        console.error("Fehler beim Laden der Einstellungen:", error);
    }

    // DOM-Elemente holen
    favoritesGrid = document.getElementById("favoritesGrid");
    effektGrid = document.getElementById("effektGrid");
    saveBtn = document.getElementById("saveBtn");
    resetBtn = document.getElementById("resetBtn");
    globalSpeedSlider = document.getElementById("globalSpeed");
    speedValue = document.getElementById("speedValue");
    notification = document.getElementById("notification");

    if (!globalSpeedSlider || !speedValue) {
        console.warn("Effekt-Controller DOM-Elemente nicht gefunden");
        return;
    }

    // Geschwindigkeit UI setzen
    globalSpeedSlider.value = globalSpeed;
    speedValue.textContent = globalSpeed;

    // Geschwindigkeits-Slider Event
    globalSpeedSlider.addEventListener("input", async (e) => {
        globalSpeed = e.target.value;
        speedValue.textContent = globalSpeed;

        try {
            localStorage.setItem("globalSpeed", globalSpeed);
            updateAnimationSpeed(globalSpeed);

            // An Hardware senden
            const controller = getLEDController();
            if (controller && controller.isConnected) {
                const brightness = Math.round((globalSpeed / 10) * 100);
                const success = await controller.setBrightness(brightness);

                if (success) {
                    console.log(`Geschwindigkeit ${globalSpeed} an Hardware gesendet (als Helligkeit ${brightness}%)`);
                    showNotification(`Geschwindigkeit ${globalSpeed} gesetzt`, "success");
                } else {
                    console.warn("Fehler beim Senden der Geschwindigkeit");
                }
            } else {
                console.warn("Keine BLE-Verbindung für Geschwindigkeit");
            }
        } catch (error) {
            console.error("Fehler beim Speichern der Geschwindigkeit:", error);
        }
    });

    // Save-Button Event
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            try {
                const settings = {
                    favoriten: favoriten,
                    globalSpeed: globalSpeed,
                    activeEffect: activeEffect,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem("effektSettings", JSON.stringify(settings));
                showNotification("Einstellungen erfolgreich gespeichert!");
            } catch (error) {
                console.error("Fehler beim Speichern:", error);
                showNotification("Fehler beim Speichern der Einstellungen");
            }
        });
    }

    // Reset-Button Event
    if (resetBtn) {
        resetBtn.addEventListener("click", async () => {
            const confirmReset = confirm("Möchten Sie wirklich alle Einstellungen zurücksetzen?");
            if (!confirmReset) return;

            favoriten = {};
            globalSpeed = 5;
            activeEffect = null;

            globalSpeedSlider.value = globalSpeed;
            speedValue.textContent = globalSpeed;

            try {
                localStorage.setItem("favoriten", JSON.stringify(favoriten));
                localStorage.setItem("globalSpeed", globalSpeed);
                localStorage.removeItem("activeEffect");
                localStorage.removeItem("effektSettings");
            } catch (error) {
                console.error("Fehler beim Zurücksetzen:", error);
            }

            updateAnimationSpeed(globalSpeed);

            // Hardware-Reset
            let controller = null;
            if (window.parent && window.parent !== window && window.parent.bleController) {
                controller = window.parent.bleController;
            } else if (window.bleController) {
                controller = window.bleController;
            }

            if (controller && controller.isConnected) {
                try {
                    await controller.setPower(false);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await controller.setPower(true);
                    await controller.setColorRGB(255, 255, 255);
                    console.log("Hardware wurde zurückgesetzt");
                } catch (error) {
                    console.error("Fehler beim Hardware-Reset:", error);
                }
            }

            renderEffekte();
            showNotification("Alle Einstellungen zurückgesetzt");
        });
    }

    // Initiales Rendern
    renderEffekte();
    updateAnimationSpeed(globalSpeed);

    // Aktiven Effekt wiederherstellen
    if (activeEffect) {
        sendEffectToBLE(activeEffect, globalSpeed);
    }

    console.log("✅ Effekt-Controller vollständig initialisiert (32 Effekte)");
}

/**
 * Favoriten-Status eines Effekts umschalten
 * @param {string} effectName - Name des Effekts
 * @param {Event} event - Click-Event
 */
function toggleFavorite(effectName, event) {
    event.stopPropagation();

    if (favoriten[effectName]) {
        delete favoriten[effectName];
        console.log(`${effectName} aus Favoriten entfernt`);
        showNotification(`${effectName} aus Favoriten entfernt`, "info");
    } else {
        favoriten[effectName] = true;
        console.log(`${effectName} zu Favoriten hinzugefügt`);
        showNotification(`${effectName} zu Favoriten hinzugefügt`, "success");
    }

    try {
        localStorage.setItem("favoriten", JSON.stringify(favoriten));
        console.log("Favoriten in localStorage gespeichert");
    } catch (error) {
        console.error("Fehler beim Speichern der Favoriten:", error);
        showNotification("Fehler beim Speichern der Favoriten", "error");
    }

    renderEffekte();
}

/**
 * Animationsgeschwindigkeit anpassen
 * @param {number} speed - Geschwindigkeit 1-10
 */
function updateAnimationSpeed(speed) {
    const speedFactor = (11 - speed) / 5;
    const style = document.createElement("style");
    style.id = "dynamic-animation-speed";

    const oldStyle = document.getElementById("dynamic-animation-speed");
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

    console.log(`Aktualisiere Animation-Speed auf ${speed} (Factor: ${speedFactor}s)`);
    document.querySelectorAll(".effect-animation").forEach((el) => {
        el.style.animation = "none";
        setTimeout(() => {
            el.style.animation = "";
        }, 10);
    });
}

/**
 * Rendert alle Effekt-Karten in Favoriten/Alle-Grids
 */
function renderEffekte() {
    if (!favoritesGrid || !effektGrid) return;

    // Grids leeren
    while (favoritesGrid.firstChild) {
        favoritesGrid.removeChild(favoritesGrid.firstChild);
    }
    while (effektGrid.firstChild) {
        effektGrid.removeChild(effektGrid.firstChild);
    }

    // Effekte rendern
    effekte.forEach((effekt) => {
        const card = createEffektCard(effekt, favoriten[effekt.name]);
        if (favoriten[effekt.name]) {
            favoritesGrid.appendChild(card);
        } else {
            effektGrid.appendChild(card);
        }
    });
}

/**
 * Erstellt eine Effekt-Karte
 * @param {Object} effekt - Effekt-Daten
 * @param {boolean} isFavorite - Ist Favorit?
 * @returns {HTMLElement} Effekt-Karte
 */
function createEffektCard(effekt, isFavorite = false) {
    const card = document.createElement("div");
    card.className = "effekt-card";

    const animationClass = getAnimationClass(effekt.name);

    card.innerHTML = `
        <div class="effekt-image effekt-preview ${animationClass}">
            <div class="favorite-badge ${isFavorite ? "active" : ""}" onclick="toggleFavorite('${effekt.name}', event)">
                <i class="fas fa-star"></i>
            </div>
        </div>
        <div class="effekt-info">
            <h3 class="effekt-name">${effekt.name}</h3>
            <p class="effekt-description">${effekt.description}</p>
        </div>
    `;

    card.addEventListener("click", async () => {
        console.log(`Effekt-Karte "${effekt.name}" geklickt!`);
        await selectEffekt(effekt.name);
    });

    return card;
}

/**
 * Effekt auswählen und an Hardware senden
 * @param {string} effectName - Name des Effekts
 */
async function selectEffekt(effectName) {
    document.querySelectorAll(".effekt-tile").forEach((tile) => {
        tile.classList.remove("active");
    });

    activeEffect = effectName;

    const activeTile = document.querySelector(`.effekt-tile[data-effect="${effectName}"]`);
    if (activeTile) {
        activeTile.classList.add("active");
    }

    console.log(`User klickt Effekt "${effectName}" - LED zeigt Effekt!`);
    const success = await sendEffectToBLE(effectName, globalSpeed);

    if (!success) {
        if (activeTile) {
            activeTile.classList.remove("active");
        }
        activeEffect = null;
    }
}

/**
 * Holt CSS-Animations-Klasse für Effekt
 * @param {string} effectName - Effekt-Name
 * @returns {string} CSS-Klasse
 */
function getAnimationClass(effectName) {
    const animationMap = {
        Welle: "effect-welle",
        Regenbogen: "effect-regenbogen",
        Feuer: "effect-feuer",
        Blitz: "effect-blitz",
        Pulsieren: "effect-pulsieren",
        Atmen: "effect-atmen",
        Lauflicht: "effect-lauflicht",
        Stroboskop: "effect-stroboskop",
        Farbverlauf: "effect-farbverlauf",
        Zufallsfarben: "effect-zufallsfarben",
        Disco: "effect-disco",
        Polizei: "effect-polizei",
        Meteorregen: "effect-meteorregen",
        Matrix: "effect-matrix",
        Kristall: "effect-kristall",
        Nordlicht: "effect-nordlicht",
        Lava: "effect-lava",
        Unterwasser: "effect-unterwasser",
        Glitzer: "effect-glitzer",
        Herzschlag: "effect-herzschlag",
        Spirale: "effect-spirale",
        Plasma: "effect-plasma",
        Konfetti: "effect-konfetti",
        Sinus: "sinus",
        Fade: "fade",
        Scanner: "scanner",
        Twinkle: "twinkle",
        Kometen: "kometen",
        Feuerzauber: "feuerzauber",
        Neonröhre: "neonroehre",
        Lasershow: "lasershow",
        Borealis: "borealis"
    };

    return animationMap[effectName] || "effect-default";
}

/**
 * Zeigt Benachrichtigung an
 * @param {string} message - Nachricht
 * @param {string} type - Typ (success, error, info, warning)
 */
function showNotification(message, type = "success") {
    if (!notification) return;

    const content = notification.querySelector(".notification-content");
    if (content) {
        content.textContent = message;
    }
    notification.classList.add("active");

    setTimeout(() => {
        notification.classList.remove("active");
    }, 3000);
}

/**
 * Sendet Effekt an Hardware via BLE
 * @param {string} effectName - Effekt-Name
 * @param {number} speed - Geschwindigkeit 1-10
 * @returns {Promise<boolean>} Erfolg
 */
async function sendEffectToBLE(effectName, speed) {
    try {
        let controller = null;

        if (window.parent && window.parent !== window) {
            controller = window.parent.bleController;
            console.log("Effekt nutzt Parent bleController");
        } else if (window.bleController) {
            controller = window.bleController;
            console.log("Effekt nutzt lokalen bleController");
        }

        if (!controller) {
            console.error("KRITISCH: Kein bleController verfügbar!");
            showNotification("FEHLER: Bluetooth-Controller nicht gefunden!", "error");
            return false;
        }

        if (!controller.isConnected) {
            console.warn("Bluetooth nicht verbunden");
            showNotification("Bitte erst Bluetooth in Einstellungen verbinden!", "warning");
            return false;
        }

        // Effekt-ID holen
        let effectId = 1;

        if (window.parent && window.parent.APP_CONFIG && window.parent.APP_CONFIG.EFFECT_IDS) {
            effectId = window.parent.APP_CONFIG.EFFECT_IDS[effectName] || 1;
        } else if (window.APP_CONFIG && window.APP_CONFIG.EFFECT_IDS) {
            effectId = window.APP_CONFIG.EFFECT_IDS[effectName] || 1;
        } else {
            // Lokale Effekt-IDs (1-32)
            const localEffectIds = {
                Welle: 1, Regenbogen: 2, Feuer: 3, Blitz: 4, Pulsieren: 5, Atmen: 6,
                Lauflicht: 7, Stroboskop: 8, Farbverlauf: 9, Zufallsfarben: 10, Disco: 11, Polizei: 12,
                Meteorregen: 13, Matrix: 14, Kristall: 15, Nordlicht: 16, Lava: 17, Unterwasser: 18,
                Glitzer: 19, Herzschlag: 20, Spirale: 21, Plasma: 22, Konfetti: 23, Sinus: 24,
                Fade: 25, Scanner: 26, Twinkle: 27, Kometen: 28, Feuerzauber: 29, Neonröhre: 30,
                Lasershow: 31, Borealis: 32
            };
            effectId = localEffectIds[effectName] || 1;
        }

        console.log(`Sende Effekt "${effectName}" (ID: ${effectId}, Speed: ${speed}) an Hardware...`);

        const success = await controller.setEffect(effectId);

        if (success) {
            const brightness = Math.round((speed / 10) * 100);
            await controller.setBrightness(brightness);

            console.log(`Effekt "${effectName}" erfolgreich an LED gesendet!`);
            showNotification(`Effekt "${effectName}" aktiviert!`, "success");

            localStorage.setItem("activeEffect", effectName);
            localStorage.setItem("effectSpeed", speed);

            return true;
        } else {
            console.error("Effekt konnte nicht gesendet werden");
            showNotification("Fehler beim Senden des Effekts", "error");
            return false;
        }
    } catch (error) {
        console.error("Hardware-Fehler beim Effekt:", error);
        showNotification(`Fehler: ${error.message}`, "error");
        return false;
    }
}

// Global Exports
window.getLEDController = getLEDController;
window.toggleFavorite = toggleFavorite;
window.updateAnimationSpeed = updateAnimationSpeed;
window.renderEffekte = renderEffekte;
window.selectEffekt = selectEffekt;
window.sendEffectToBLE = sendEffectToBLE;
window.showNotification = showNotification;
window.effekte = effekte;

// Auto-Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEffektController);
} else {
    initEffektController();
}
