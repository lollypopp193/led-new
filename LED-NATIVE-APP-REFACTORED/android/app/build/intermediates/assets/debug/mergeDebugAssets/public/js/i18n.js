/**
 * i18n - Internationalisierung für LED Native App v3.0
 * Unterstützt Deutsch, Englisch, Spanisch, Französisch
 * AUTO-AKTIVIERT beim App-Start
 */

const i18n = {
    currentLanguage: 'de',
    fallbackLanguage: 'de',

    init() {
        // Auto-Erkennung Browser-Sprache
        const browserLang = (navigator.language || navigator.userLanguage || 'de').split('-')[0];
        const savedLang = localStorage.getItem('app-language');
        this.currentLanguage = savedLang || (this.translations[browserLang] ? browserLang : this.fallbackLanguage);
        console.log(`🌍 i18n aktiviert: ${this.currentLanguage}`);
    },

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('app-language', lang);
            this.updateDOM();
            console.log(`🌍 Sprache geändert: ${lang}`);
        }
    },

    t(key) {
        return this.translations[this.currentLanguage][key] || this.translations[this.fallbackLanguage][key] || key;
    },

    updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
    },

    translations: {}
};

i18n.translations = {
    de: {
        // Allgemein
        'app.title': 'LED Control Pro',
        'app.loading': 'Laedt...',
        'app.error': 'Fehler',
        'app.success': 'Erfolg',
        'app.cancel': 'Abbrechen',
        'app.save': 'Speichern',
        'app.delete': 'Loeschen',
        'app.reset': 'Zurücksetzen',
        'app.close': 'Schliessen',
        'app.confirm': 'Bestaetigen',

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
    },

    // Spanisch
    es: {
        // General
        'app.title': 'LED Control Pro',
        'app.loading': 'Cargando...',
        'app.error': 'Error',
        'app.success': 'Exito',
        'app.cancel': 'Cancelar',
        'app.save': 'Guardar',
        'app.delete': 'Eliminar',
        'app.reset': 'Restablecer',
        'app.close': 'Cerrar',
        'app.confirm': 'Confirmar',

        // Navigation
        'nav.farbe': 'Color',
        'nav.effekt': 'Efectos',
        'nav.musik': 'Musica',
        'nav.timer': 'Temporizador',
        'nav.settings': 'Ajustes',

        // Color
        'color.title': 'Seleccion de Color',
        'color.rgb': 'Controles RGB',
        'color.red': 'Rojo (R)',
        'color.green': 'Verde (G)',
        'color.blue': 'Azul (B)',
        'color.brightness': 'Brillo',
        'color.saved': 'Colores Guardados',
        'color.saveSuccess': 'Color guardado!',
        'color.deleteConfirm': 'Eliminar color?',
        'color.deleteSuccess': 'Color eliminado!',

        // Effects
        'effect.title': 'Efectos LED',
        'effect.speed': 'Velocidad',
        'effect.intensity': 'Intensidad',
        'effect.preview': 'Vista previa',
        'effect.apply': 'Aplicar',
        'effect.feuer': 'Fuego',
        'effect.matrix': 'Matrix',
        'effect.nordlicht': 'Aurora',
        'effect.glitzer': 'Brillo',
        'effect.lava': 'Lava',
        'effect.spirale': 'Espiral',
        'effect.komet': 'Cometa',

        // Music
        'music.title': 'Reproductor de Musica',
        'music.play': 'Reproducir',
        'music.pause': 'Pausar',
        'music.next': 'Siguiente',
        'music.previous': 'Anterior',
        'music.shuffle': 'Aleatorio',
        'music.repeat': 'Repetir',
        'music.favorite': 'Favorito',
        'music.playlist': 'Lista',
        'music.library': 'Biblioteca',
        'music.nowPlaying': 'Reproduciendo',
        'music.unknownArtist': 'Artista Desconocido',
        'music.unknownTitle': 'Titulo Desconocido',
        'music.unknownAlbum': 'Album Desconocido',

        // Equalizer
        'eq.title': 'Ecualizador',
        'eq.enable': 'Activar Ecualizador',
        'eq.preset': 'Ajuste predefinido',
        'eq.flat': 'Plano',
        'eq.pop': 'Pop',
        'eq.rock': 'Rock',
        'eq.bass': 'Refuerzo de Graves',
        'eq.jazz': 'Jazz',
        'eq.classical': 'Clasica',
        'eq.savecustom': 'Guardar Ajuste Personal',
        'eq.bassboost': 'Refuerzo de Graves',
        'eq.bassboostIntensity': 'Intensidad del Refuerzo',

        // LED-Music
        'ledmusic.title': 'LED Musica',
        'ledmusic.enable': 'LED Musica Activado',
        'ledmusic.automatic': 'Modo Automatico',
        'ledmusic.syncAll': 'Sincronizar Todo',
        'ledmusic.bandCount': 'Numero de Bandas LED',
        'ledmusic.scan': 'Escanear Bandas LED',
        'ledmusic.bass': 'Graves',
        'ledmusic.mid': 'Medios',
        'ledmusic.treble': 'Agudos',
        'ledmusic.frequency': 'Rango de Frecuencia',

        // Timer
        'timer.title': 'Temporizador y Automatizacion',
        'timer.new': 'Nuevo Temporizador',
        'timer.time': 'Hora',
        'timer.action': 'Accion',
        'timer.repeat': 'Repetir',
        'timer.enabled': 'Activado',

        // Settings
        'settings.title': 'Ajustes',
        'settings.language': 'Idioma',
        'settings.theme': 'Tema',
        'settings.bluetooth': 'Bluetooth',
        'settings.wled': 'WLED/WiFi',
        'settings.backup': 'Copia de Seguridad',
        'settings.about': 'Acerca de',

        // Toast
        'toast.colorSaved': 'Color guardado!',
        'toast.colorDeleted': 'Color eliminado!',
        'toast.effectApplied': 'Efecto aplicado!',
        'toast.connected': 'Conectado!',
        'toast.disconnected': 'Desconectado',
        'toast.error': 'Ocurrio un error',
        'toast.saved': 'Guardado!',
    },

    // Französisch
    fr: {
        // General
        'app.title': 'LED Control Pro',
        'app.loading': 'Chargement...',
        'app.error': 'Erreur',
        'app.success': 'Succes',
        'app.cancel': 'Annuler',
        'app.save': 'Enregistrer',
        'app.delete': 'Supprimer',
        'app.reset': 'Reinitialiser',
        'app.close': 'Fermer',
        'app.confirm': 'Confirmer',

        // Navigation
        'nav.farbe': 'Couleur',
        'nav.effekt': 'Effets',
        'nav.musik': 'Musique',
        'nav.timer': 'Minuteur',
        'nav.settings': 'Parametres',

        // Color
        'color.title': 'Selection de Couleur',
        'color.rgb': 'Controles RGB',
        'color.red': 'Rouge (R)',
        'color.green': 'Vert (G)',
        'color.blue': 'Bleu (B)',
        'color.brightness': 'Luminosite',
        'color.saved': 'Couleurs Enregistrees',
        'color.saveSuccess': 'Couleur enregistree!',
        'color.deleteConfirm': 'Supprimer la couleur?',
        'color.deleteSuccess': 'Couleur supprimee!',

        // Effects
        'effect.title': 'Effets LED',
        'effect.speed': 'Vitesse',
        'effect.intensity': 'Intensite',
        'effect.preview': 'Apercu',
        'effect.apply': 'Appliquer',
        'effect.feuer': 'Feu',
        'effect.matrix': 'Matrix',
        'effect.nordlicht': 'Aurore',
        'effect.glitzer': 'Paillettes',
        'effect.lava': 'Lave',
        'effect.spirale': 'Spirale',
        'effect.komet': 'Comete',

        // Music
        'music.title': 'Lecteur de Musique',
        'music.play': 'Lire',
        'music.pause': 'Pause',
        'music.next': 'Suivant',
        'music.previous': 'Precedent',
        'music.shuffle': 'Aleatoire',
        'music.repeat': 'Repeter',
        'music.favorite': 'Favori',
        'music.playlist': 'Liste',
        'music.library': 'Bibliotheque',
        'music.nowPlaying': 'Lecture en cours',
        'music.unknownArtist': 'Artiste Inconnu',
        'music.unknownTitle': 'Titre Inconnu',
        'music.unknownAlbum': 'Album Inconnu',

        // Equalizer
        'eq.title': 'Egaliseur',
        'eq.enable': 'Activer Egaliseur',
        'eq.preset': 'Preset',
        'eq.flat': 'Plat',
        'eq.pop': 'Pop',
        'eq.rock': 'Rock',
        'eq.bass': 'Renforcement Basses',
        'eq.jazz': 'Jazz',
        'eq.classical': 'Classique',
        'eq.savecustom': 'Enregistrer Preset',
        'eq.bassboost': 'Renforcement Basses',
        'eq.bassboostIntensity': 'Intensite du Renforcement',

        // LED-Music
        'ledmusic.title': 'LED Musique',
        'ledmusic.enable': 'LED Musique Active',
        'ledmusic.automatic': 'Mode Automatique',
        'ledmusic.syncAll': 'Synchroniser Tout',
        'ledmusic.bandCount': 'Nombre de Bandes LED',
        'ledmusic.scan': 'Scanner Bandes LED',
        'ledmusic.bass': 'Basses',
        'ledmusic.mid': 'Mediums',
        'ledmusic.treble': 'Aigus',
        'ledmusic.frequency': 'Plage de Frequence',

        // Timer
        'timer.title': 'Minuteur et Automatisation',
        'timer.new': 'Nouveau Minuteur',
        'timer.time': 'Heure',
        'timer.action': 'Action',
        'timer.repeat': 'Repeter',
        'timer.enabled': 'Active',

        // Settings
        'settings.title': 'Parametres',
        'settings.language': 'Langue',
        'settings.theme': 'Theme',
        'settings.bluetooth': 'Bluetooth',
        'settings.wled': 'WLED/WiFi',
        'settings.backup': 'Sauvegarde et Restauration',
        'settings.about': 'A propos',

        // Toast
        'toast.colorSaved': 'Couleur enregistree!',
        'toast.colorDeleted': 'Couleur supprimee!',
        'toast.effectApplied': 'Effet applique!',
        'toast.connected': 'Connecte!',
        'toast.disconnected': 'Deconnecte',
        'toast.error': 'Une erreur est survenue',
        'toast.saved': 'Enregistre!',
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('app-language') || 'de';
        this.translations = translations;
    }

    /**
     * Ändert die aktuelle Sprache
     * @param {string} lang - Sprachcode (de, en, es, fr)
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

        const messages = {
            'de': 'Sprache geaendert: Deutsch',
            'en': 'Language changed: English',
            'es': 'Idioma cambiado: Espanol',
            'fr': 'Langue modifiee: Francais'
        };

        if (window.showGlobalNotification) {
            window.showGlobalNotification(
                messages[lang] || messages['de'],
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

// Auto-Init beim Laden
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        i18n.init();
        i18n.updateDOM();
    });
} else {
    i18n.init();
    i18n.updateDOM();
}

// Globaler Export
window.i18n = i18n;
window.__ = (key) => i18n.t(key); // Shortcut-Funktion
window.setLanguage = (lang) => i18n.setLanguage(lang); // Helper für UI

console.log('✅ i18n-System v3.0 geladen - Sprache:', i18n.currentLanguage);
