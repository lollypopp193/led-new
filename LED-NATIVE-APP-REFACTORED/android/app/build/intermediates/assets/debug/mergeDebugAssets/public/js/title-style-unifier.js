/**
 * TITLE-STYLE-UNIFIER.JS
 * Einheitliches Design für alle Titel (FarbWorld, EffektWorld, MusikWorld, TimerWorld, Einstellungen)
 * Alle Titel im Timer-Style (gleiche Farbe, Schriftart, Animation)
 */
'use strict';

class TitleStyleUnifier {
    constructor() {
        this.timerStyle = null;
        this.init();
    }

    /**
     * Initialisiert den Title-Style-Unifier
     */
    init() {
        console.log('🎨 Title-Style-Unifier initialisiert');
        this.extractTimerStyle();
        this.applyUnifiedStyles();
        this.observeDOM();
    }

    /**
     * Extrahiert Timer-Style als Referenz
     */
    extractTimerStyle() {
        // Timer-Style als Referenz
        this.timerStyle = {
            color: '#ffcc00',
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '0 0 20px rgba(255, 204, 0, 0.5)',
            fontFamily: '"Inter", "SF Pro Display", -apple-system, sans-serif'
        };
    }

    /**
     * Wendet einheitliche Styles auf alle Titel an
     */
    applyUnifiedStyles() {
        // Erstelle globale Styles
        this.injectGlobalStyles();

        // Finde und style alle Titel
        this.styleFarbWorld();
        this.styleEffektWorld();
        this.styleMusikWorld();
        this.styleTimerWorld();
        this.styleEinstellungen();
    }

    /**
     * Injiziert globale CSS-Styles
     */
    injectGlobalStyles() {
        const style = document.createElement('style');
        style.id = 'unified-title-styles';
        style.textContent = `
            /* Einheitliche Titel-Styles */
            .app-title,
            .page-title,
            .section-title-main,
            h1.main-title {
                color: #ffcc00 !important;
                font-size: 2.5rem !important;
                font-weight: 700 !important;
                text-align: center !important;
                margin-bottom: 20px !important;
                text-transform: uppercase !important;
                letter-spacing: 2px !important;
                text-shadow: 0 0 20px rgba(255, 204, 0, 0.5) !important;
                font-family: "Inter", "SF Pro Display", -apple-system, sans-serif !important;
                padding: 10px 0 !important;
                position: relative !important;
            }

            /* Animation für Titel */
            .app-title::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 100px;
                height: 3px;
                background: linear-gradient(90deg, transparent, #ffcc00, transparent);
                border-radius: 2px;
            }

            /* FarbWorld spezifisch */
            .farbe-title,
            [data-page="farbe"] h1,
            [data-page="farbe"] .app-header h1 {
                color: #ffcc00 !important;
            }

            /* EffektWorld spezifisch */
            .effekt-title,
            [data-page="effekt"] h1,
            [data-page="effekt"] .app-header h1,
            .app-title {
                color: #ffcc00 !important;
            }

            /* MusikWorld spezifisch */
            .musik-title,
            [data-page="musik"] h1,
            [data-page="musik"] .page-header h1 {
                color: #ffcc00 !important;
            }

            /* Einstellungen */
            .einstellungen-title,
            [data-page="einstellungen"] h1 {
                color: #ffcc00 !important;
                border: none !important; /* Entferne Umrandung */
            }

            /* Entferne alte Umrandungen */
            h1, h2.section-title {
                border: none !important;
                outline: none !important;
            }
        `;

        const oldStyle = document.getElementById('unified-title-styles');
        if (oldStyle) oldStyle.remove();

        document.head.appendChild(style);
    }

    /**
     * Styled FarbWorld-Titel
     */
    styleFarbWorld() {
        const titles = document.querySelectorAll('[data-page="farbe"] h1, .farbe-title');
        titles.forEach(title => {
            this.applyTimerStyle(title);
            if (!title.textContent.includes('World')) {
                title.textContent = 'FarbWorld';
            }
        });
    }

    /**
     * Styled EffektWorld-Titel
     */
    styleEffektWorld() {
        const titles = document.querySelectorAll('[data-page="effekt"] h1, .effekt-title, .app-title');
        titles.forEach(title => {
            this.applyTimerStyle(title);
            // EffektWorld bleibt wie es ist (bereits korrekt)
        });
    }

    /**
     * Styled MusikWorld-Titel
     */
    styleMusikWorld() {
        const titles = document.querySelectorAll('[data-page="musik"] h1, .musik-title');
        titles.forEach(title => {
            this.applyTimerStyle(title);

            // Ändere Text zu "MusikWorld" falls noch anders
            if (title.textContent.trim() === 'Musik' || title.textContent.includes('Musik World')) {
                title.textContent = 'MusikWorld';
            }
        });
    }

    /**
     * Styled TimerWorld-Titel
     */
    styleTimerWorld() {
        const titles = document.querySelectorAll('[data-page="timer"] h1, .timer-title');
        titles.forEach(title => {
            this.applyTimerStyle(title);
            // Timer ist bereits korrekt gestyled (Referenz)
        });
    }

    /**
     * Styled Einstellungen-Titel
     */
    styleEinstellungen() {
        const titles = document.querySelectorAll('[data-page="einstellungen"] h1, .einstellungen-title');
        titles.forEach(title => {
            this.applyTimerStyle(title);

            // Entferne Umrandung
            title.style.border = 'none';
            title.style.outline = 'none';

            // Text bleibt "Einstellungen"
        });
    }

    /**
     * Wendet Timer-Style auf ein Element an
     * @param {HTMLElement} element - Zu stylendes Element
     */
    applyTimerStyle(element) {
        if (!element) return;

        Object.assign(element.style, this.timerStyle);
        element.classList.add('app-title');

        console.log(`🎨 Timer-Style angewendet auf: ${element.textContent}`);
    }

    /**
     * Überwacht DOM für neue Titel
     */
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Prüfe auf neue Titel
                        const newTitles = node.querySelectorAll?.('h1, .app-title, .page-title') || [];
                        newTitles.forEach(title => {
                            this.applyTimerStyle(title);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Global initialisieren
let titleStyleUnifier;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        titleStyleUnifier = new TitleStyleUnifier();
        window.titleStyleUnifier = titleStyleUnifier;
    });
} else {
    titleStyleUnifier = new TitleStyleUnifier();
    window.titleStyleUnifier = titleStyleUnifier;
}

window.TitleStyleUnifier = TitleStyleUnifier;
