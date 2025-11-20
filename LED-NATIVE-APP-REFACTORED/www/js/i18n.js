/**
 * i18n - Internationalisierung für LED Native App
 * Unterstützt Deutsch (Standard) und Englisch
 */

const translations = {
    de: {
        // Allgemein
        'app.title': 'LED Control Pro',
        'app.loading': 'Lädt...',
        'app.error': 'Fehler',
        'app.success': 'Erfolg',
        'app.cancel': 'Abbrechen',
        'app.save': 'Speichern',
        'app.delete': 'Löschen',
        'app.reset': 'Zurücksetzen',
        'app.close': 'Schließen',
        'app.confirm': 'Bestätigen',

        // Navigation
        'nav.farbe': 'Farbe',
        'nav.effekt': 'Effekte',
        'nav.musik': 'Musik',
        'nav.timer': 'Timer',
        'nav.settings': 'Einstellungen',

        // Farbe
        'color.title': 'Farbauswahl',
        'color.rgb': 'RGB-Slider',
        'color.red': 'Rot (R)',
        'color.green': 'Grün (G)',
        'color.blue': 'Blau (B)',
        'color.brightness': 'Helligkeit',
        'color.saved': 'Gespeicherte Farben',
        'color.saveSuccess': 'Farbe gespeichert!',
        'color.deleteConfirm': 'Farbe wirklich löschen?',
        'color.deleteSuccess': 'Farbe gelöscht!',

        // Effekte
        'effect.title': 'LED-Effekte',
        'effect.speed': 'Geschwindigkeit',
        'effect.intensity': 'Intensität',
        'effect.preview': 'Vorschau',
        'effect.apply': 'Anwenden',
        'effect.feuer': 'Feuer',
        'effect.matrix': 'Matrix',
        'effect.nordlicht': 'Nordlicht',
        'effect.glitzer': 'Glitzer',
        'effect.lava': 'Lava',
        'effect.spirale': 'Spirale',
        'effect.komet': 'Komet',

        // Musik
        'music.title': 'Musik-Player',
        'music.play': 'Abspielen',
        'music.pause': 'Pause',
        'music.next': 'Nächster Titel',
        'music.previous': 'Vorheriger Titel',
        'music.shuffle': 'Zufallswiedergabe',
        'music.repeat': 'Wiederholen',
        'music.favorite': 'Zu Favoriten hinzufügen',
        'music.playlist': 'Wiedergabeliste',
        'music.library': 'Bibliothek',
        'music.nowPlaying': 'Wiedergegeben',
        'music.unknownArtist': 'Unbekannter Künstler',
        'music.unknownTitle': 'Unbekannter Titel',
        'music.unknownAlbum': 'Unbekanntes Album',

        // Equalizer
        'eq.title': 'Equalizer',
        'eq.enable': 'Equalizer aktivieren',
        'eq.preset': 'Preset',
        'eq.flat': 'Flat',
        'eq.pop': 'Pop',
        'eq.rock': 'Rock',
        'eq.bass': 'Bass Boost',
        'eq.jazz': 'Jazz',
        'eq.classical': 'Classic',
        'eq.savecustom': 'Eigenes Preset speichern',
        'eq.bassboost': 'Bass Boost',
        'eq.bassboostIntensity': 'Bass Boost Intensität',

        // LED-Musik
        'ledmusic.title': 'LED-Musik',
        'ledmusic.enable': 'LED-Musik Ein',
        'ledmusic.automatic': 'Automatikmodus',
        'ledmusic.syncAll': 'Sync alle Bänder',
        'ledmusic.bandCount': 'Anzahl aktiver LED-Bänder',
        'ledmusic.scan': 'LED-Bänder scannen',
        'ledmusic.bass': 'Bass',
        'ledmusic.mid': 'Mitten',
        'ledmusic.treble': 'Höhen',
        'ledmusic.frequency': 'Frequenzbereich',

        // Timer
        'timer.title': 'Timer & Automatisierung',
        'timer.new': 'Neuer Timer',
        'timer.time': 'Uhrzeit',
        'timer.action': 'Aktion',
        'timer.repeat': 'Wiederholung',
        'timer.enabled': 'Aktiviert',

        // Einstellungen
        'settings.title': 'Einstellungen',
        'settings.language': 'Sprache',
        'settings.theme': 'Design',
        'settings.bluetooth': 'Bluetooth',
        'settings.wled': 'WLED/WiFi',
        'settings.backup': 'Backup & Wiederherstellung',
        'settings.about': 'Über diese App',

        // Toast-Nachrichten
        'toast.colorSaved': 'Farbe gespeichert!',
        'toast.colorDeleted': 'Farbe gelöscht!',
        'toast.effectApplied': 'Effekt angewendet!',
        'toast.connected': 'Verbunden!',
        'toast.disconnected': 'Verbindung getrennt',
        'toast.error': 'Ein Fehler ist aufgetreten',
        'toast.saved': 'Gespeichert!',
    },

    en: {
        // General
        'app.title': 'LED Control Pro',
        'app.loading': 'Loading...',
        'app.error': 'Error',
        'app.success': 'Success',
        'app.cancel': 'Cancel',
        'app.save': 'Save',
        'app.delete': 'Delete',
        'app.reset': 'Reset',
        'app.close': 'Close',
        'app.confirm': 'Confirm',

        // Navigation
        'nav.farbe': 'Color',
        'nav.effekt': 'Effects',
        'nav.musik': 'Music',
        'nav.timer': 'Timer',
        'nav.settings': 'Settings',

        // Color
        'color.title': 'Color Selection',
        'color.rgb': 'RGB Sliders',
        'color.red': 'Red (R)',
        'color.green': 'Green (G)',
        'color.blue': 'Blue (B)',
        'color.brightness': 'Brightness',
        'color.saved': 'Saved Colors',
        'color.saveSuccess': 'Color saved!',
        'color.deleteConfirm': 'Really delete color?',
        'color.deleteSuccess': 'Color deleted!',

        // Effects
        'effect.title': 'LED Effects',
        'effect.speed': 'Speed',
        'effect.intensity': 'Intensity',
        'effect.preview': 'Preview',
        'effect.apply': 'Apply',
        'effect.feuer': 'Fire',
        'effect.matrix': 'Matrix',
        'effect.nordlicht': 'Aurora',
        'effect.glitzer': 'Sparkle',
        'effect.lava': 'Lava',
        'effect.spirale': 'Spiral',
        'effect.komet': 'Comet',

        // Music
        'music.title': 'Music Player',
        'music.play': 'Play',
        'music.pause': 'Pause',
        'music.next': 'Next Track',
        'music.previous': 'Previous Track',
        'music.shuffle': 'Shuffle',
        'music.repeat': 'Repeat',
        'music.favorite': 'Add to Favorites',
        'music.playlist': 'Playlist',
        'music.library': 'Library',
        'music.nowPlaying': 'Now Playing',
        'music.unknownArtist': 'Unknown Artist',
        'music.unknownTitle': 'Unknown Title',
        'music.unknownAlbum': 'Unknown Album',

        // Equalizer
        'eq.title': 'Equalizer',
        'eq.enable': 'Enable Equalizer',
        'eq.preset': 'Preset',
        'eq.flat': 'Flat',
        'eq.pop': 'Pop',
        'eq.rock': 'Rock',
        'eq.bass': 'Bass Boost',
        'eq.jazz': 'Jazz',
        'eq.classical': 'Classical',
        'eq.savecustom': 'Save Custom Preset',
        'eq.bassboost': 'Bass Boost',
        'eq.bassboostIntensity': 'Bass Boost Intensity',

        // LED-Music
        'ledmusic.title': 'LED Music',
        'ledmusic.enable': 'LED Music On',
        'ledmusic.automatic': 'Automatic Mode',
        'ledmusic.syncAll': 'Sync All Bands',
        'ledmusic.bandCount': 'Number of Active LED Bands',
        'ledmusic.scan': 'Scan LED Bands',
        'ledmusic.bass': 'Bass',
        'ledmusic.mid': 'Mids',
        'ledmusic.treble': 'Treble',
        'ledmusic.frequency': 'Frequency Range',

        // Timer
        'timer.title': 'Timer & Automation',
        'timer.new': 'New Timer',
        'timer.time': 'Time',
        'timer.action': 'Action',
        'timer.repeat': 'Repeat',
        'timer.enabled': 'Enabled',

        // Settings
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        'settings.bluetooth': 'Bluetooth',
        'settings.wled': 'WLED/WiFi',
        'settings.backup': 'Backup & Restore',
        'settings.about': 'About',

        // Toast Messages
        'toast.colorSaved': 'Color saved!',
        'toast.colorDeleted': 'Color deleted!',
        'toast.effectApplied': 'Effect applied!',
        'toast.connected': 'Connected!',
        'toast.disconnected': 'Disconnected',
        'toast.error': 'An error occurred',
        'toast.saved': 'Saved!',
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('app-language') || 'de';
        this.translations = translations;
    }

    /**
     * Ändert die aktuelle Sprache
     * @param {string} lang - Sprachcode (de, en)
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language "${lang}" not supported. Fallback to "de".`);
            lang = 'de';
        }

        this.currentLang = lang;
        localStorage.setItem('app-language', lang);

        // Aktualisiere alle [data-i18n] Elemente
        this.updateDOM();

        // Event für andere Module
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

        if (window.showGlobalNotification) {
            window.showGlobalNotification(
                lang === 'de' ? 'Sprache geändert: Deutsch' : 'Language changed: English',
                'success'
            );
        }
    }

    /**
     * Gibt Übersetzung für einen Key zurück
     * @param {string} key - Übersetzungsschlüssel
     * @param {object} params - Optionale Parameter für Platzhalter
     * @returns {string}
     */
    t(key, params = {}) {
        let text = this.translations[this.currentLang][key] || this.translations['de'][key] || key;

        // Platzhalter ersetzen
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`\{${param}\}`, 'g'), params[param]);
        });

        return text;
    }

    /**
     * Aktualisiert alle DOM-Elemente mit data-i18n Attribut
     */
    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = this.t(key);

            // Prüfe, ob es ein Input-Placeholder ist
            if (el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = text;
            }
            // Prüfe, ob es ein Title/Tooltip ist
            else if (el.hasAttribute('data-i18n-title')) {
                el.title = text;
            }
            // Ansonsten Text-Content
            else {
                el.textContent = text;
            }
        });
    }

    /**
     * Gibt die aktuelle Sprache zurück
     * @returns {string}
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Gibt alle verfügbaren Sprachen zurück
     * @returns {array}
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }
}

// Globale Instanz
const i18n = new I18n();

// Auto-Init beim Laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.updateDOM());
} else {
    i18n.updateDOM();
}

// Globaler Export
window.i18n = i18n;
window.__ = (key, params) => i18n.t(key, params); // Shortcut-Funktion

console.log('✅ i18n-System geladen - Sprache:', i18n.getCurrentLanguage());
