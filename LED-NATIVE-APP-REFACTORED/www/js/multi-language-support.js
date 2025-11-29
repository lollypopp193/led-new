/**
 * MULTI-LANGUAGE-SUPPORT.JS
 * Vollständige Übersetzungen für DE, EN, ES, FR
 * Automatisches Umschalten der gesamten App-Sprache
 */
'use strict';

class MultiLanguageSupport {
    constructor() {
        this.currentLanguage = 'de';
        this.translations = {};
        this.init();
    }

    /**
     * Initialisiert das Sprachsystem
     */
    init() {
        this.loadTranslations();
        this.detectLanguage();
        this.applyLanguage(this.currentLanguage);
        console.log(`🌐 Multi-Language-Support initialisiert: ${this.currentLanguage}`);
    }

    /**
     * Lädt alle Übersetzungen
     */
    loadTranslations() {
        this.translations = {
            de: {
                // Navigation
                farbe: 'Farbe',
                effekte: 'Effekte',
                musik: 'Musik',
                timer: 'Timer',
                einstellungen: 'Einstellungen',

                // Farbe
                farbworld: 'FarbWorld',
                helligkeit: 'Helligkeit',
                ein: 'Ein',
                aus: 'Aus',

                // Effekte
                effektworld: 'EffektWorld',
                geschwindigkeit: 'Geschwindigkeit',
                speichern: 'Speichern',
                zurücksetzen: 'Zurücksetzen',
                favoriten: 'Favoriten',

                // Musik
                musikworld: 'MusikWorld',
                player: 'Player',
                equalizer: 'Equalizer',
                visualisierung: 'Visualisierung',
                ledMusik: 'LED-Musik',
                partyModus: 'Party-Modus',
                bibliothek: 'Bibliothek',

                // Bibliothek
                interpreten: 'Interpreten',
                alben: 'Alben',
                titel: 'Titel',
                ordner: 'Ordner',
                genre: 'Genre',
                kürzlich: 'Kürzlich',
                favoriten: 'Favoriten',
                meistgespielt: 'Meistgespielt',
                playlist: 'Playlist',

                // Buttons
                abspielen: 'Abspielen',
                pause: 'Pause',
                weiter: 'Weiter',
                zurück: 'Zurück',
                suchen: 'Suchen',
                sortieren: 'Sortieren',

                // Einstellungen
                geräte: 'Geräte',
                geräte_suchen: 'Geräte suchen',
                automatisch_verbinden: 'Automatisch verbinden',
                benachrichtigungen: 'Benachrichtigungen',
                dunkelmodus: 'Dunkelmodus',
                sprache: 'Sprache',

                // Allgemein
                laden: 'Laden...',
                gespeichert: 'Gespeichert',
                fehler: 'Fehler',
                erfolgreich: 'Erfolgreich',
                abbrechen: 'Abbrechen',
                ok: 'OK'
            },

            en: {
                // Navigation
                farbe: 'Color',
                effekte: 'Effects',
                musik: 'Music',
                timer: 'Timer',
                einstellungen: 'Settings',

                // Color
                farbworld: 'ColorWorld',
                helligkeit: 'Brightness',
                ein: 'On',
                aus: 'Off',

                // Effects
                effektworld: 'EffectWorld',
                geschwindigkeit: 'Speed',
                speichern: 'Save',
                zurücksetzen: 'Reset',
                favoriten: 'Favorites',

                // Music
                musikworld: 'MusicWorld',
                player: 'Player',
                equalizer: 'Equalizer',
                visualisierung: 'Visualization',
                ledMusik: 'LED Music',
                partyModus: 'Party Mode',
                bibliothek: 'Library',

                // Library
                interpreten: 'Artists',
                alben: 'Albums',
                titel: 'Tracks',
                ordner: 'Folders',
                genre: 'Genres',
                kürzlich: 'Recent',
                favoriten: 'Favorites',
                meistgespielt: 'Most Played',
                playlist: 'Playlist',

                // Buttons
                abspielen: 'Play',
                pause: 'Pause',
                weiter: 'Next',
                zurück: 'Previous',
                suchen: 'Search',
                sortieren: 'Sort',

                // Settings
                geräte: 'Devices',
                geräte_suchen: 'Search Devices',
                automatisch_verbinden: 'Auto Connect',
                benachrichtigungen: 'Notifications',
                dunkelmodus: 'Dark Mode',
                sprache: 'Language',

                // General
                laden: 'Loading...',
                gespeichert: 'Saved',
                fehler: 'Error',
                erfolgreich: 'Success',
                abbrechen: 'Cancel',
                ok: 'OK'
            },

            es: {
                // Navegación
                farbe: 'Color',
                effekte: 'Efectos',
                musik: 'Música',
                timer: 'Temporizador',
                einstellungen: 'Ajustes',

                // Color
                farbworld: 'Mundo Color',
                helligkeit: 'Brillo',
                ein: 'Encendido',
                aus: 'Apagado',

                // Efectos
                effektworld: 'Mundo Efectos',
                geschwindigkeit: 'Velocidad',
                speichern: 'Guardar',
                zurücksetzen: 'Restablecer',
                favoriten: 'Favoritos',

                // Música
                musikworld: 'Mundo Música',
                player: 'Reproductor',
                equalizer: 'Ecualizador',
                visualisierung: 'Visualización',
                ledMusik: 'LED Música',
                partyModus: 'Modo Fiesta',
                bibliothek: 'Biblioteca',

                // Biblioteca
                interpreten: 'Artistas',
                alben: 'Álbumes',
                titel: 'Canciones',
                ordner: 'Carpetas',
                genre: 'Géneros',
                kürzlich: 'Reciente',
                favoriten: 'Favoritos',
                meistgespielt: 'Más Reproducido',
                playlist: 'Lista de Reproducción',

                // Botones
                abspielen: 'Reproducir',
                pause: 'Pausa',
                weiter: 'Siguiente',
                zurück: 'Anterior',
                suchen: 'Buscar',
                sortieren: 'Ordenar',

                // Ajustes
                geräte: 'Dispositivos',
                geräte_suchen: 'Buscar Dispositivos',
                automatisch_verbinden: 'Conexión Automática',
                benachrichtigungen: 'Notificaciones',
                dunkelmodus: 'Modo Oscuro',
                sprache: 'Idioma',

                // General
                laden: 'Cargando...',
                gespeichert: 'Guardado',
                fehler: 'Error',
                erfolgreich: 'Éxito',
                abbrechen: 'Cancelar',
                ok: 'OK'
            },

            fr: {
                // Navigation
                farbe: 'Couleur',
                effekte: 'Effets',
                musik: 'Musique',
                timer: 'Minuterie',
                einstellungen: 'Paramètres',

                // Couleur
                farbworld: 'Monde Couleur',
                helligkeit: 'Luminosité',
                ein: 'Activé',
                aus: 'Désactivé',

                // Effets
                effektworld: 'Monde Effets',
                geschwindigkeit: 'Vitesse',
                speichern: 'Enregistrer',
                zurücksetzen: 'Réinitialiser',
                favoriten: 'Favoris',

                // Musique
                musikworld: 'Monde Musique',
                player: 'Lecteur',
                equalizer: 'Égaliseur',
                visualisierung: 'Visualisation',
                ledMusik: 'LED Musique',
                partyModus: 'Mode Fête',
                bibliothek: 'Bibliothèque',

                // Bibliothèque
                interpreten: 'Artistes',
                alben: 'Albums',
                titel: 'Titres',
                ordner: 'Dossiers',
                genre: 'Genres',
                kürzlich: 'Récent',
                favoriten: 'Favoris',
                meistgespielt: 'Plus Joués',
                playlist: 'Liste de Lecture',

                // Boutons
                abspielen: 'Lecture',
                pause: 'Pause',
                weiter: 'Suivant',
                zurück: 'Précédent',
                suchen: 'Rechercher',
                sortieren: 'Trier',

                // Paramètres
                geräte: 'Appareils',
                geräte_suchen: 'Rechercher Appareils',
                automatisch_verbinden: 'Connexion Automatique',
                benachrichtigungen: 'Notifications',
                dunkelmodus: 'Mode Sombre',
                sprache: 'Langue',

                // Général
                laden: 'Chargement...',
                gespeichert: 'Enregistré',
                fehler: 'Erreur',
                erfolgreich: 'Succès',
                abbrechen: 'Annuler',
                ok: 'OK'
            }
        };
    }

    /**
     * Erkennt System-Sprache
     */
    detectLanguage() {
        const saved = localStorage.getItem('app-language');
        if (saved && this.translations[saved]) {
            this.currentLanguage = saved;
            return;
        }

        const browserLang = navigator.language.toLowerCase().split('-')[0];
        if (this.translations[browserLang]) {
            this.currentLanguage = browserLang;
        } else {
            this.currentLanguage = 'de'; // Default
        }
    }

    /**
     * Wendet Sprache an
     * @param {string} lang - Sprach-Code (de, en, es, fr)
     */
    applyLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`❌ Sprache nicht gefunden: ${lang}`);
            return;
        }

        this.currentLanguage = lang;
        localStorage.setItem('app-language', lang);

        // Übersetze alle Elemente mit data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translations[lang][key];
            if (translation) {
                el.textContent = translation;
            }
        });

        // Übersetze Platzhalter
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.translations[lang][key];
            if (translation) {
                el.placeholder = translation;
            }
        });

        // Übersetze Titel
        const titles = document.querySelectorAll('[data-i18n-title]');
        titles.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = this.translations[lang][key];
            if (translation) {
                el.title = translation;
            }
        });

        console.log(`🌐 Sprache angewendet: ${lang.toUpperCase()}`);

        // Event für andere Module
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    /**
     * Holt Übersetzung für Key
     * @param {string} key - Übersetzungs-Key
     * @returns {string} Übersetzter Text
     */
    translate(key) {
        return this.translations[this.currentLanguage][key] || key;
    }

    /**
     * Wechselt Sprache
     * @param {string} lang - Neue Sprache
     */
    switchLanguage(lang) {
        console.log(`🌐 Wechsle Sprache zu: ${lang.toUpperCase()}`);
        this.applyLanguage(lang);

        // Reload page um alle Texte neu zu laden
        window.location.reload();
    }

    /**
     * Zeigt Sprach-Auswahl-Dialog
     */
    showLanguageSelector() {
        const languages = [
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' }
        ];

        const dialog = document.createElement('div');
        dialog.className = 'language-selector-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay" onclick="this.parentElement.remove()"></div>
            <div class="dialog-content">
                <h3>Sprache wählen / Select Language</h3>
                <div class="language-options">
                    ${languages.map(lang => `
                        <button class="language-option ${lang.code === this.currentLanguage ? 'active' : ''}" 
                                onclick="window.multiLang.switchLanguage('${lang.code}')">
                            <span class="flag">${lang.flag}</span>
                            <span class="lang-name">${lang.name}</span>
                            ${lang.code === this.currentLanguage ? '<i class="fas fa-check"></i>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }
}

// Global initialisieren
const multiLang = new MultiLanguageSupport();
window.multiLang = multiLang;
window.MultiLanguageSupport = MultiLanguageSupport;
