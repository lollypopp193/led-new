/**
 * UMLAUT-FIXER.JS
 * Ersetzt falsche Umlaut-Codierungen (UE, AE, OE) durch echte deutsche Umlaute
 * Automatische Korrektur beim Laden aller HTML-Inhalte
 */
'use strict';

(function () {
    /**
     * Umlaut-Mapping für Ersetzungen
     */
    const umlautMap = {
        'UE': 'Ü',
        'Ue': 'Ü',
        'ue': 'ü',
        'AE': 'Ä',
        'Ae': 'Ä',
        'ae': 'ä',
        'OE': 'Ö',
        'Oe': 'Ö',
        'oe': 'ö',
        'SS': 'ß'
    };

    /**
     * Korrigiert Umlaute in einem Text
     * @param {string} text - Text mit falschen Umlauten
     * @returns {string} Korrigierter Text
     */
    function fixUmlauts(text) {
        if (!text || typeof text !== 'string') return text;

        let fixedText = text;

        // Ersetze alle Umlaut-Kombinationen
        for (const [wrong, correct] of Object.entries(umlautMap)) {
            // Nur ersetzen wenn es ein ganzes Wort/Teil ist, nicht in URLs
            const regex = new RegExp(`(?<!\\w)${wrong}(?!\\w)|(?<=\\s)${wrong}|${wrong}(?=\\s)|^${wrong}|${wrong}$`, 'g');
            fixedText = fixedText.replace(regex, correct);
        }

        return fixedText;
    }

    /**
     * Durchsucht und korrigiert alle Text-Nodes im DOM
     * @param {Element} element - Root-Element zum Durchsuchen
     */
    function fixDOMUmlauts(element = document.body) {
        if (!element) return;

        // Text-Nodes durchsuchen
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodesToFix = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue && node.nodeValue.trim()) {
                nodesToFix.push(node);
            }
        }

        // Korrigiere alle gefundenen Text-Nodes
        nodesToFix.forEach(textNode => {
            const originalText = textNode.nodeValue;
            const fixedText = fixUmlauts(originalText);
            if (originalText !== fixedText) {
                textNode.nodeValue = fixedText;
                console.log(`Umlaut korrigiert: "${originalText}" → "${fixedText}"`);
            }
        });

        // Korrigiere auch Attribute (title, placeholder, aria-label, etc.)
        const elementsWithText = element.querySelectorAll('[title], [placeholder], [aria-label], [data-text]');
        elementsWithText.forEach(el => {
            ['title', 'placeholder', 'aria-label', 'data-text'].forEach(attr => {
                if (el.hasAttribute(attr)) {
                    const originalValue = el.getAttribute(attr);
                    const fixedValue = fixUmlauts(originalValue);
                    if (originalValue !== fixedValue) {
                        el.setAttribute(attr, fixedValue);
                        console.log(`Attribut korrigiert: ${attr}="${originalValue}" → "${fixedValue}"`);
                    }
                }
            });
        });
    }

    /**
     * Überwacht DOM-Änderungen und korrigiert neue Umlaute
     */
    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        fixDOMUmlauts(node);
                    } else if (node.nodeType === Node.TEXT_NODE && node.nodeValue && node.nodeValue.trim()) {
                        const originalText = node.nodeValue;
                        const fixedText = fixUmlauts(originalText);
                        if (originalText !== fixedText) {
                            node.nodeValue = fixedText;
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        console.log('✅ Umlaut-Observer aktiv');
    }

    /**
     * Initialisiert den Umlaut-Fixer
     */
    function init() {
        console.log('🔧 Umlaut-Fixer startet...');

        // Sofortige Korrektur
        fixDOMUmlauts();

        // Observer für zukünftige Änderungen
        observeDOM();

        console.log('✅ Umlaut-Fixer erfolgreich initialisiert');
    }

    // Auto-Init beim DOM-Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Global exportieren
    window.fixUmlauts = fixUmlauts;
    window.fixDOMUmlauts = fixDOMUmlauts;
})();
