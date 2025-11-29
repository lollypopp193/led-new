/**
 * SONDERZEICHEN REPLACER - Automatisches Ersetzen aller Umlaute beim Laden
 */
'use strict';

const SonderzeichenReplacer = {
    replacements: {
        'ae': 'ä',
        'oe': 'ö',
        'ue': 'ü',
        'AE': 'Ä',
        'OE': 'Ö',
        'UE': 'Ü',
        'Ae': 'Ä',
        'Oe': 'Ö',
        'Ue': 'Ü',
        'ss': 'ß'
    },

    replaceInString(str) {
        if (typeof str !== 'string') return str;

        let result = str;
        for (const [umlaut, replacement] of Object.entries(this.replacements)) {
            result = result.replace(new RegExp(umlaut, 'g'), replacement);
        }
        return result;
    },

    replaceInElement(element) {
        if (!element) return;

        // Text nodes
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            // Überspringe Script-Tags
            if (node.parentElement && node.parentElement.tagName !== 'SCRIPT') {
                textNodes.push(node);
            }
        }

        textNodes.forEach(textNode => {
            const original = textNode.textContent;
            const replaced = this.replaceInString(original);
            if (original !== replaced) {
                textNode.textContent = replaced;
            }
        });

        // Attributes (title, placeholder, aria-label, etc.)
        const attributes = ['title', 'placeholder', 'aria-label', 'alt', 'data-tooltip'];
        attributes.forEach(attr => {
            if (element.hasAttribute && element.hasAttribute(attr)) {
                const original = element.getAttribute(attr);
                const replaced = this.replaceInString(original);
                if (original !== replaced) {
                    element.setAttribute(attr, replaced);
                }
            }
        });

        // Rekursiv für alle Kinder
        if (element.children) {
            Array.from(element.children).forEach(child => {
                this.replaceInElement(child);
            });
        }
    },

    replaceInDocument() {
        console.log(' Ersetze Sonderzeichen im gesamten Dokument...');

        let count = 0;
        const startTime = Date.now();

        this.replaceInElement(document.body);

        const duration = Date.now() - startTime;
        console.log(` Sonderzeichen ersetzt in ${duration}ms`);
    },

    /**
     * Automatisch beim Laden ausführen
     */
    autoReplace() {
        // Warte bis DOM geladen
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.replaceInDocument(), 100);
            });
        } else {
            // DOM bereits geladen
            setTimeout(() => this.replaceInDocument(), 100);
        }
    }
};

window.SonderzeichenReplacer = SonderzeichenReplacer;

// Automatisch ausführen beim Laden
SonderzeichenReplacer.autoReplace();
