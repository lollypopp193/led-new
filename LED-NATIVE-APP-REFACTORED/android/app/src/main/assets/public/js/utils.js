/**
 * UTILS.JS
 * Gemeinsame Utility-Funktionen für die gesamte App
 * Verhindert Code-Duplikation
 */
'use strict';

/**
 * Escaped HTML-Sonderzeichen um XSS zu verhindern
 * @param {string} text - Der zu escapende Text
 * @returns {string} Der escaped Text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export für globalen Zugriff
window.escapeHtml = escapeHtml;
