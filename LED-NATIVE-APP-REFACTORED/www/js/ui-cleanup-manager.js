/**
 * UI-CLEANUP-MANAGER.JS
 * Entfernt überflüssige UI-Elemente automatisch
 * Scannen-Buttons, Starten-Buttons, Verarbeitet-Texte, etc.
 */
'use strict';

class UICleanupManager {
    constructor() {
        this.elementsToRemove = [];
        this.textsToHide = [];
        this.init();
    }

    /**
     * Initialisiert den Cleanup-Manager
     */
    init() {
        console.log('🧹 UI-Cleanup-Manager gestartet');
        this.defineCleanupRules();
        this.performCleanup();
        this.observeDOM();
    }

    /**
     * Definiert Cleanup-Regeln
     */
    defineCleanupRules() {
        // Buttons die entfernt werden sollen
        this.buttonsToRemove = [
            'LED-Bänder scannen',
            'Musikanalyse starten',
            'Party-Modus starten',
            'Frequenzanalyse starten',
            'led-baender-scannen',
            'musik-analyse-starten',
            'party-modus-starten',
            'scannen-button',
            'starten-button'
        ];

        // Texte die versteckt werden sollen
        this.textsToHide = [
            'Verarbeitet',
            'Null',
            'Abbrechen',
            'Bitte warten',
            'Wird geladen'
        ];

        // Sections die entfernt werden sollen
        this.sectionsToRemove = [
            'Hierarchische Gruppen',
            'Pixel-Level-Kontrolle',
            'UI & Personalisierung',
            'Performance & Fehlerbehandlung',
            'LED-Bänder-Konfiguration',
            'LED-Bänder-Steuerung',
            'Schütteln verlängert Timer'
        ];

        // Texte die ersetzt werden sollen
        this.textReplacements = [
            { from: 'nahtlos', to: '' },
            { from: 'aktivieren', to: '' },
            { from: '(nahtlos)', to: '' },
            { from: 'DJ-Überblendung nahtlos', to: 'DJ-Überblendung' }
        ];
    }

    /**
     * Führt Cleanup durch
     */
    performCleanup() {
        this.removeButtons();
        this.hideTexts();
        this.removeSections();
        this.replaceTexts();
        this.fixVisualizationBlackScreen();
        console.log('✅ UI-Cleanup abgeschlossen');
    }

    /**
     * Entfernt überflüssige Buttons
     */
    removeButtons() {
        // Finde Buttons nach Text-Inhalt
        this.buttonsToRemove.forEach(buttonText => {
            const buttons = Array.from(document.querySelectorAll('button'));
            buttons.forEach(button => {
                if (button.textContent.includes(buttonText) || button.id.includes(buttonText)) {
                    console.log(`🗑️ Entferne Button: ${buttonText}`);
                    button.style.display = 'none'; // Verstecken statt löschen (Rückwärtskompatibilität)
                }
            });
        });

        // Finde Buttons nach ID
        const buttonIds = [
            'led-baender-scannen-btn',
            'musikanalyse-btn',
            'party-mode-start-btn',
            'scan-button',
            'start-button'
        ];

        buttonIds.forEach(id => {
            const button = document.getElementById(id);
            if (button) {
                console.log(`🗑️ Entferne Button (ID): ${id}`);
                button.style.display = 'none';
            }
        });
    }

    /**
     * Versteckt bestimmte Texte
     */
    hideTexts() {
        // Alle Text-Nodes durchsuchen
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            this.textsToHide.forEach(hideText => {
                if (node.nodeValue && node.nodeValue.includes(hideText)) {
                    // Verstecke Parent-Element
                    let parent = node.parentElement;
                    if (parent && !parent.classList.contains('ui-hidden')) {
                        console.log(`👻 Verstecke Text: "${hideText}"`);
                        parent.classList.add('ui-hidden');
                        parent.style.display = 'none';
                    }
                }
            });
        }
    }

    /**
     * Entfernt Sections
     */
    removeSections() {
        this.sectionsToRemove.forEach(sectionName => {
            // Finde Section-Header
            const headers = Array.from(document.querySelectorAll('h2, h3, h4, .section-title'));
            headers.forEach(header => {
                if (header.textContent.includes(sectionName)) {
                    // Finde Parent-Section
                    const section = header.closest('section, .section, .settings-section');
                    if (section) {
                        console.log(`🗑️ Entferne Section: ${sectionName}`);
                        section.style.display = 'none';
                    } else {
                        // Kein Section-Container → Header selbst verstecken
                        header.style.display = 'none';
                    }
                }
            });
        });
    }

    /**
     * Ersetzt Texte
     */
    replaceTexts() {
        this.textReplacements.forEach(({ from, to }) => {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue && node.nodeValue.includes(from)) {
                    console.log(`✏️ Ersetze Text: "${from}" → "${to}"`);
                    node.nodeValue = node.nodeValue.replace(new RegExp(from, 'g'), to);
                }
            }
        });
    }

    /**
     * Behebt Visualisierung Blackscreen
     */
    fixVisualizationBlackScreen() {
        // Finde schwarze Bildschirme in Visualisierung
        const blackScreens = document.querySelectorAll('.visualization-preview, .visualization-screen, .viz-canvas');

        blackScreens.forEach(screen => {
            // Wenn Screen leer/schwarz ist und nicht gebraucht wird
            if (screen.children.length === 0 && !screen.textContent.trim()) {
                console.log('🖤 Entferne schwarzen Bildschirm in Visualisierung');
                screen.style.display = 'none';
            }
        });

        // Spezifisch für Musik-Visualisierung
        const vizSections = document.querySelectorAll('[data-section="visualisierung"]');
        vizSections.forEach(section => {
            const blackDiv = section.querySelector('div[style*="background: black"], div[style*="background:#000"]');
            if (blackDiv && blackDiv.children.length === 0) {
                console.log('🖤 Entferne schwarzen Bildschirm in Musik-Visualisierung');
                blackDiv.style.display = 'none';
            }
        });
    }

    /**
     * Überwacht DOM für neue Elemente
     */
    observeDOM() {
        const observer = new MutationObserver((mutations) => {
            let needsCleanup = false;

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        needsCleanup = true;
                    }
                });
            });

            if (needsCleanup) {
                // Verzögert ausführen um DOM-Updates abzuwarten
                setTimeout(() => this.performCleanup(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Fügt Custom-Styles hinzu
     */
    addStyles() {
        const style = document.createElement('style');
        style.id = 'ui-cleanup-styles';
        style.textContent = `
            .ui-hidden {
                display: none !important;
            }

            /* Verstecke bestimmte System-Meldungen */
            [data-message="verarbeitet"],
            [data-status="loading"],
            .processing-message,
            .loading-indicator {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }
}

// Global initialisieren
let uiCleanupManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        uiCleanupManager = new UICleanupManager();
        window.uiCleanupManager = uiCleanupManager;
    });
} else {
    uiCleanupManager = new UICleanupManager();
    window.uiCleanupManager = uiCleanupManager;
}

window.UICleanupManager = UICleanupManager;
