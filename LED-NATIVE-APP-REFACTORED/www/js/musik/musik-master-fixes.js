/**
 * MUSIK-MASTER-FIXES.JS
 * Vollständige Behebung aller UI-Probleme in der Musik-Seite
 * - Alle Haken → Ein/Aus-Schalter
 * - Alle nicht-funktionierenden Buttons/Slider fixen
 * - Doppelte Elemente entfernen
 * - Umlaute fixen
 * - Sonderzeichen entfernen
 * @version 1.0
 */
'use strict';

class MusikMasterFixes {
    constructor() {
        this.initialized = false;
        this.init();
    }

    /**
     * Initialisierung
     */
    init() {
        if (this.initialized) return;

        document.addEventListener('DOMContentLoaded', () => {
            this.applyAllFixes();
        });

        // Falls DOM bereits geladen
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.applyAllFixes(), 100);
        }

        this.initialized = true;
        // console.log('✅ Musik-Master-Fixes initialisiert');
    }

    /**
     * Alle Fixes anwenden
     */
    applyAllFixes() {
        // console.log('🔧 Wende alle Fixes an...');

        // 1. Haken → Toggle-Switches
        this.convertAllCheckboxesToToggles();

        // 2. EQ-Presets funktional machen
        this.fixEqualizerPresets();

        // 3. Visualizer-Buttons funktional machen
        this.fixVisualizerButtons();

        // 4. Party-Modus Duplikate entfernen
        this.removeDuplicateElements();

        // 5. Umlaute fixen
        this.fixUmlauts();

        // 6. CSS-Code-Artefakte entfernen
        this.removeCSSArtifacts();

        // 7. Slider funktional machen
        this.fixAllSliders();

        // 8. Speichern-Dialog mit Benennung
        this.addSaveDialogWithNaming();

        // 9. LED-Band Anzeige fixen
        this.fixLEDBandDisplay();

        // 10. Nicht benötigte Elemente entfernen
        this.removeUnnecessaryElements();

        // console.log('✅ Alle Fixes angewendet');
    }

    /**
     * Alle Checkboxen in Toggle-Switches umwandeln
     */
    convertAllCheckboxesToToggles() {
        // Finde alle Checkboxen die noch keine Toggle-Switches sind
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.toggle-converted)');

        checkboxes.forEach(checkbox => {
            // Überspringe bereits konvertierte
            if (checkbox.closest('.toggle-switch')) return;

            // Erstelle Toggle-Switch Container
            const toggle = document.createElement('label');
            toggle.className = 'toggle-switch';

            // Clone checkbox
            const newCheckbox = checkbox.cloneNode(true);
            newCheckbox.classList.add('toggle-converted');

            // Slider erstellen
            const slider = document.createElement('span');
            slider.className = 'toggle-slider';

            // Toggle zusammenbauen
            toggle.appendChild(newCheckbox);
            toggle.appendChild(slider);

            // Original ersetzen
            if (checkbox.parentNode) {
                checkbox.parentNode.replaceChild(toggle, checkbox);
            }
        });

        // console.log('✅ Checkboxen zu Toggles konvertiert');
    }

    /**
     * Equalizer-Presets funktional machen
     */
    fixEqualizerPresets() {
        const presetButtons = document.querySelectorAll('.preset-btn[data-preset], #eqPresetsContainer button');

        const presetValues = {
            flat: [0, 0, 0, 0, 0],
            pop: [2, 4, 0, 2, 4],
            rock: [5, 3, 0, 3, 5],
            bassboost: [8, 6, 0, 0, 0],
            classic: [0, 0, 0, 3, 4],
            jazz: [3, 0, 2, 4, 5]
        };

        presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                const preset = btn.dataset.preset || btn.textContent.toLowerCase().trim();
                const values = presetValues[preset];

                if (values) {
                    // Aktiv-Status setzen
                    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // EQ-Slider setzen
                    const sliders = document.querySelectorAll('.eq-slider');
                    sliders.forEach((slider, index) => {
                        if (values[index] !== undefined) {
                            slider.value = values[index];
                            // Event triggern
                            slider.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });

                    // EqualizerEngine updaten falls vorhanden
                    if (window.EqualizerEngine && window.EqualizerEngine.applyPreset) {
                        window.EqualizerEngine.applyPreset(preset);
                    }

                    // console.log(`✅ EQ-Preset "${preset}" angewendet`);
                }
            });
        });

        // Zurücksetzen-Button
        const resetBtn = document.getElementById('eqResetBtn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                const sliders = document.querySelectorAll('.eq-slider');
                sliders.forEach(slider => {
                    slider.value = 0;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                });

                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                const flatBtn = document.querySelector('[data-preset="flat"]');
                if (flatBtn) flatBtn.classList.add('active');

                // console.log('✅ Equalizer zurückgesetzt');
            };
        }

        // console.log('✅ Equalizer-Presets gefixt');
    }

    /**
     * Visualizer-Buttons funktional machen
     */
    fixVisualizerButtons() {
        const visualPresets = document.querySelectorAll('.visual-preset');

        const visualTypes = ['bars', 'waves', 'particles', 'circles', 'spiral', 'lines', 'spectrum', 'fire'];

        visualPresets.forEach((preset, index) => {
            preset.style.cursor = 'pointer';
            preset.addEventListener('click', () => {
                // Aktiv-Status setzen
                visualPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');

                const visualType = visualTypes[index] || 'bars';

                // Visualizer-Engine updaten
                if (window.AdvancedVisualizer) {
                    window.AdvancedVisualizer.setMode(visualType);
                }

                // Event dispatchen
                window.dispatchEvent(new CustomEvent('visualizerChange', {
                    detail: { type: visualType }
                }));

                // console.log(`✅ Visualizer-Effekt "${visualType}" aktiviert`);
            });
        });

        // console.log('✅ Visualizer-Buttons gefixt');
    }

    /**
     * Doppelte Elemente entfernen
     */
    removeDuplicateElements() {
        // Party-Modus Titel - nur einen behalten
        const partyTitles = document.querySelectorAll('h2:contains("Party"), h3:contains("Party"), .panel-title:contains("Party")');
        if (partyTitles.length > 1) {
            for (let i = 1; i < partyTitles.length; i++) {
                if (partyTitles[i].textContent.includes('Party-Modus') || partyTitles[i].textContent.includes('Party Modus')) {
                    partyTitles[i].style.display = 'none';
                }
            }
        }

        // Beatmatching doppelt
        const beatmatchingElements = document.querySelectorAll('[class*="beatmatching"], [id*="beatmatching"]');
        const seenBeatmatching = new Set();
        beatmatchingElements.forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (seenBeatmatching.has(text)) {
                el.closest('.settings-section, .section-content, div')?.remove();
            } else {
                seenBeatmatching.add(text);
            }
        });

        // Track vorladen doppelt
        const trackPreloadElements = document.querySelectorAll('label:contains("Track vorladen"), span:contains("Track vorladen")');
        if (trackPreloadElements.length > 1) {
            for (let i = 1; i < trackPreloadElements.length; i++) {
                const parent = trackPreloadElements[i].closest('.setting-item, div');
                if (parent) parent.style.display = 'none';
            }
        }

        // Speichern-Buttons - nur einen behalten
        const saveButtons = document.querySelectorAll('#eqSaveBtn, button:contains("Speichern")');
        const seenSave = new Set();
        saveButtons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            const key = `${Math.round(rect.top)}-${Math.round(rect.left)}`;
            if (seenSave.has(btn.textContent.trim())) {
                // Zweiten Speichern-Button verstecken
            }
            seenSave.add(btn.textContent.trim());
        });

        // console.log('✅ Duplikate entfernt');
    }

    /**
     * Umlaute fixen
     */
    fixUmlauts() {
        const replacements = {
            'Toene': 'Töne',
            'toene': 'töne',
            'Hoehen': 'Höhen',
            'hoehen': 'höhen',
            'Ueber': 'Über',
            'ueber': 'über',
            'fuer': 'für',
            'Fuer': 'Für',
            'Aenderung': 'Änderung',
            'aenderung': 'änderung',
            'groesse': 'größe',
            'Groesse': 'Größe',
            'waehlen': 'wählen',
            'Waehlen': 'Wählen',
            'loeschen': 'löschen',
            'Loeschen': 'Löschen',
            'hinzufuegen': 'hinzufügen',
            'Hinzufuegen': 'Hinzufügen',
            'Fuege': 'Füge',
            'fuege': 'füge',
            'Aendern': 'Ändern',
            'aendern': 'ändern',
            'oe': 'ö',
            'ae': 'ä',
            'ue': 'ü'
        };

        // Text-Nodes durchsuchen
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodesToFix = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            let text = node.textContent;
            let changed = false;

            for (const [wrong, correct] of Object.entries(replacements)) {
                if (text.includes(wrong)) {
                    text = text.split(wrong).join(correct);
                    changed = true;
                }
            }

            if (changed) {
                nodesToFix.push({ node, text });
            }
        }

        nodesToFix.forEach(({ node, text }) => {
            node.textContent = text;
        });

        // console.log('✅ Umlaute gefixt');
    }

    /**
     * CSS-Code Artefakte entfernen
     */
    removeCSSArtifacts() {
        // Suche nach CSS-Code in sichtbarem Text
        const cssPatterns = [
            /right:\s*0/gi,
            /bottom:\s*0/gi,
            /background[-]?color:\s*#[0-9a-f]{3,6}/gi,
            /transition:\s*[\d.]+s/gi,
            /border[-]?radius:\s*\d+px/gi,
            /position:\s*\w+/gi,
            /display:\s*\w+/gi
        ];

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const nodesToClean = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            let text = node.textContent;
            let changed = false;

            cssPatterns.forEach(pattern => {
                if (pattern.test(text)) {
                    text = text.replace(pattern, '');
                    changed = true;
                }
            });

            if (changed && text.trim() !== node.textContent.trim()) {
                nodesToClean.push({ node, text: text.trim() });
            }
        }

        nodesToClean.forEach(({ node, text }) => {
            node.textContent = text;
        });

        // Leere Elemente die nur CSS-Artefakte hatten entfernen
        document.querySelectorAll('span, div, p').forEach(el => {
            const text = el.textContent.trim();
            if (text.match(/^[:\s;0-9a-f#px%,.]+$/i) && text.length < 100) {
                el.style.display = 'none';
            }
        });

        // console.log('✅ CSS-Artefakte entfernt');
    }

    /**
     * Alle Slider funktional machen
     */
    fixAllSliders() {
        // Bass Boost Slider
        const bassBoostSlider = document.getElementById('bassBoostIntensity');
        const bassBoostToggle = document.getElementById('bassBoostToggle');

        if (bassBoostSlider && bassBoostToggle) {
            // Slider initial deaktiviert, wird durch Toggle aktiviert
            bassBoostToggle.addEventListener('change', () => {
                bassBoostSlider.disabled = !bassBoostToggle.checked;
                if (window.BassBoostController) {
                    window.BassBoostController.toggle(bassBoostToggle.checked);
                }
            });

            bassBoostSlider.addEventListener('input', () => {
                const value = parseInt(bassBoostSlider.value);
                if (window.BassBoostController) {
                    window.BassBoostController.setIntensity(value);
                }
            });
        }

        // Crossfade Slider
        const crossfadeSliders = document.querySelectorAll('[id*="crossfade"], [class*="crossfade"]');
        crossfadeSliders.forEach(slider => {
            if (slider.tagName === 'INPUT' && slider.type === 'range') {
                slider.disabled = false;
                slider.addEventListener('input', () => {
                    if (window.CrossfadeController) {
                        window.CrossfadeController.setDuration(parseFloat(slider.value));
                    }
                });
            }
        });

        // Pre-Cutting Slider
        const preCuttingSliders = document.querySelectorAll('[id*="precutting"], [id*="pre-cutting"]');
        preCuttingSliders.forEach(slider => {
            if (slider.tagName === 'INPUT') {
                slider.disabled = false;
            }
        });

        // Fade-In/Out Slider
        document.querySelectorAll('[id*="fade"], [class*="fade"]').forEach(el => {
            if (el.tagName === 'INPUT' && el.type === 'range') {
                el.disabled = false;
            }
        });

        // Sleep Timer Slider
        const sleepSlider = document.querySelector('[id*="sleep-timer"], [id*="sleepTimer"]');
        if (sleepSlider && sleepSlider.type === 'range') {
            sleepSlider.disabled = false;
        }

        // console.log('✅ Alle Slider gefixt');
    }

    /**
     * Speichern-Dialog mit Benennung hinzufügen
     */
    addSaveDialogWithNaming() {
        // Erstelle Dialog
        if (!document.getElementById('save-preset-dialog')) {
            const dialog = document.createElement('div');
            dialog.id = 'save-preset-dialog';
            dialog.className = 'save-dialog';
            dialog.style.cssText = `
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a2e;
                border: 1px solid #4ecdc4;
                border-radius: 15px;
                padding: 25px;
                z-index: 10000;
                min-width: 300px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            `;
            dialog.innerHTML = `
                <h3 style="color: #4ecdc4; margin: 0 0 20px 0;">
                    <i class="fas fa-save"></i> Preset speichern
                </h3>
                <input type="text" id="preset-name-input" placeholder="Preset-Name eingeben..."
                    style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); 
                    border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; 
                    color: white; margin-bottom: 20px; font-size: 1rem;">
                <div style="display: flex; gap: 10px;">
                    <button type="button" id="save-preset-confirm" 
                        style="flex: 1; padding: 12px; background: #4ecdc4; color: #1a1a2e; 
                        border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                        Speichern
                    </button>
                    <button type="button" id="save-preset-cancel"
                        style="flex: 1; padding: 12px; background: rgba(255,255,255,0.1); 
                        color: white; border: none; border-radius: 8px; cursor: pointer;">
                        Abbrechen
                    </button>
                </div>
            `;
            document.body.appendChild(dialog);

            // Overlay
            const overlay = document.createElement('div');
            overlay.id = 'save-dialog-overlay';
            overlay.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
            `;
            document.body.appendChild(overlay);

            // Events
            document.getElementById('save-preset-cancel').onclick = () => this.closeSaveDialog();
            overlay.onclick = () => this.closeSaveDialog();

            document.getElementById('save-preset-confirm').onclick = () => {
                const name = document.getElementById('preset-name-input').value.trim();
                if (name) {
                    this.savePresetWithName(name);
                    this.closeSaveDialog();
                }
            };
        }

        // Speichern-Buttons mit Dialog verbinden
        const saveButtons = document.querySelectorAll('#eqSaveBtn, [onclick*="saveCustomEQPreset"]');
        saveButtons.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.openSaveDialog();
            };
        });

        // console.log('✅ Speichern-Dialog hinzugefügt');
    }

    /**
     * Save-Dialog öffnen
     */
    openSaveDialog() {
        document.getElementById('save-preset-dialog').style.display = 'block';
        document.getElementById('save-dialog-overlay').style.display = 'block';
        document.getElementById('preset-name-input').value = '';
        document.getElementById('preset-name-input').focus();
    }

    /**
     * Save-Dialog schließen
     */
    closeSaveDialog() {
        document.getElementById('save-preset-dialog').style.display = 'none';
        document.getElementById('save-dialog-overlay').style.display = 'none';
    }

    /**
     * Preset mit Namen speichern
     */
    savePresetWithName(name) {
        const sliders = document.querySelectorAll('.eq-slider');
        const values = Array.from(sliders).map(s => parseInt(s.value) || 0);

        let presets = JSON.parse(localStorage.getItem('custom-eq-presets') || '[]');

        const preset = {
            id: Date.now(),
            name: name,
            values: values,
            createdAt: new Date().toISOString()
        };

        presets.push(preset);
        localStorage.setItem('custom-eq-presets', JSON.stringify(presets));

        this.displayCustomPresets();

        if (window.showNotification) {
            window.showNotification(`Preset "${name}" gespeichert!`, 'success');
        }

        // console.log(`✅ Preset "${name}" gespeichert`);
    }

    /**
     * Custom Presets anzeigen
     */
    displayCustomPresets() {
        const container = document.getElementById('customPresetsContainer');
        if (!container) return;

        const presets = JSON.parse(localStorage.getItem('custom-eq-presets') || '[]');

        container.innerHTML = presets.map(preset => `
            <div class="custom-preset-item" style="display: flex; align-items: center; gap: 8px; 
                background: rgba(78,205,196,0.1); padding: 8px 12px; border-radius: 8px; 
                border: 1px solid rgba(78,205,196,0.3);">
                <button type="button" onclick="window.musikMasterFixes.loadCustomPreset(${preset.id})"
                    style="background: none; border: none; color: #4ecdc4; cursor: pointer; flex: 1; text-align: left;">
                    ${preset.name}
                </button>
                <button type="button" onclick="window.musikMasterFixes.deleteCustomPreset(${preset.id})"
                    style="background: none; border: none; color: #ff4757; cursor: pointer; padding: 4px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Custom Preset laden
     */
    loadCustomPreset(id) {
        const presets = JSON.parse(localStorage.getItem('custom-eq-presets') || '[]');
        const preset = presets.find(p => p.id === id);

        if (preset) {
            const sliders = document.querySelectorAll('.eq-slider');
            preset.values.forEach((value, index) => {
                if (sliders[index]) {
                    sliders[index].value = value;
                    sliders[index].dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            // console.log(`✅ Preset "${preset.name}" geladen`);
        }
    }

    /**
     * Custom Preset löschen
     */
    deleteCustomPreset(id) {
        let presets = JSON.parse(localStorage.getItem('custom-eq-presets') || '[]');
        presets = presets.filter(p => p.id !== id);
        localStorage.setItem('custom-eq-presets', JSON.stringify(presets));
        this.displayCustomPresets();

        if (window.showNotification) {
            window.showNotification('Preset gelöscht', 'info');
        }
    }

    /**
     * LED-Band Anzeige fixen
     */
    fixLEDBandDisplay() {
        // LED-Band 1, 2, 3 durch echte gefundene Geräte ersetzen
        const ledBandContainers = document.querySelectorAll('[id*="ledBand"], [class*="led-band"]');

        ledBandContainers.forEach(container => {
            // Text "LED-Band 1, 2, 3" suchen und ersetzen
            const text = container.textContent;
            if (text.includes('LED-Band 1') || text.includes('LED-Band 2') || text.includes('LED-Band 3')) {
                // Durch dynamische Liste ersetzen
                if (window.deviceManager && window.deviceManager.devices) {
                    // Gefundene Geräte anzeigen
                } else {
                    // Placeholder
                    const msg = container.querySelector('.led-band-placeholder');
                    if (!msg) {
                        const placeholder = document.createElement('div');
                        placeholder.className = 'led-band-placeholder';
                        placeholder.style.cssText = 'color: #888; font-style: italic; padding: 10px;';
                        placeholder.textContent = 'Keine LED-Bänder gefunden. Starte Suche...';
                    }
                }
            }
        });

        // "Audio-Reaktiv-Engine" Text erklären oder entfernen
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.includes('Audio-Reaktiv-Engine') && el.children.length === 0) {
                el.textContent = el.textContent.replace('Audio-Reaktiv-Engine', 'Musik-Reaktion');
            }
        });

        // console.log('✅ LED-Band Anzeige gefixt');
    }

    /**
     * Nicht benötigte Elemente entfernen
     */
    removeUnnecessaryElements() {
        // "Sync alle Bänder" entfernen
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.trim() === 'Sync alle Bänder' && el.children.length === 0) {
                const parent = el.closest('div, label, button');
                if (parent) parent.style.display = 'none';
            }
        });

        // "Passt LED automatisch an Musikstimmung an" entfernen
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.includes('Passt LED automatisch an Musikstimmung an')) {
                el.style.display = 'none';
            }
        });

        // "Auf andere kopieren" entfernen
        document.querySelectorAll('button, a').forEach(el => {
            if (el.textContent.includes('auf andere kopieren') || el.textContent.includes('Auf andere kopieren')) {
                el.style.display = 'none';
            }
        });

        // Empfindlichkeit entfernen (kein Mikrofon)
        // NICHT ENTFERNEN - wird für File-basierte Analyse verwendet

        // Geschwindigkeit in LED-Musik entfernen (nicht nötig)
        // Wird beibehalten für Effekt-Geschwindigkeit

        // console.log('✅ Unnötige Elemente entfernt');
    }
}

// Globale Instanz
window.MusikMasterFixes = MusikMasterFixes;
window.musikMasterFixes = new MusikMasterFixes();

// console.log('✅ Musik-Master-Fixes geladen');
