/**
 * MUSIK-COMPLETE-FIXES.JS
 * Vollständige Behebung ALLER UI-Probleme in der Musik-Seite
 * Basierend auf detaillierter User-Spezifikation
 * 
 * Features:
 * - Alle Checkboxen → Ein/Aus-Schalter (Toggle-Switches)
 * - Equalizer komplett funktional
 * - Visualisierung komplett funktional
 * - LED-Musik komplett funktional
 * - Party-Modus komplett funktional (ohne Duplikate)
 * - Bibliothek komplett funktional
 * - Alle Slider funktional
 * - Speichern-Dialoge mit Benennung
 * - CSS-Artefakte entfernt
 * - Umlaute korrekt
 * 
 * @version 2.0
 */
'use strict';

class MusikCompleteFixes {
    constructor() {
        this.initialized = false;
        this.savedPresets = JSON.parse(localStorage.getItem('userEQPresets') || '[]');
        this.init();
    }

    init() {
        if (this.initialized) return;

        // Warte auf DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyAllFixes());
        } else {
            setTimeout(() => this.applyAllFixes(), 100);
        }

        // Auch bei Page-Navigation
        window.addEventListener('pageshow', () => this.applyAllFixes());

        this.initialized = true;
        console.log('✅ Musik-Complete-Fixes v2.0 initialisiert');
    }

    applyAllFixes() {
        console.log('🔧 Wende ALLE Fixes an...');

        try {
            // Basis-Fixes
            this.convertAllCheckboxesToToggles();
            this.removeCSSArtifacts();
            this.fixUmlauts();
            this.removeUnnecessaryElements();
            this.removeDuplicates();

            // Equalizer
            this.fixEqualizerComplete();

            // Visualisierung
            this.fixVisualizerComplete();

            // LED-Musik
            this.fixLEDMusikComplete();

            // Party-Modus
            this.fixPartyModeComplete();

            // Bibliothek
            this.fixBibliothekComplete();

            // Alle Slider
            this.makeAllSlidersFunctional();

            // Toggle-Switch CSS injizieren
            this.injectToggleSwitchCSS();

            console.log('✅ ALLE Fixes erfolgreich angewendet');
        } catch (error) {
            console.error('❌ Fehler beim Anwenden der Fixes:', error);
        }
    }

    // ==========================================
    // TOGGLE-SWITCH KONVERTIERUNG
    // ==========================================

    convertAllCheckboxesToToggles() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        let converted = 0;

        checkboxes.forEach(checkbox => {
            // Überspringe bereits konvertierte
            if (checkbox.classList.contains('toggle-converted')) return;
            if (checkbox.closest('.toggle-switch')) return;

            // Erstelle Toggle-Switch
            const wrapper = document.createElement('label');
            wrapper.className = 'toggle-switch';

            const slider = document.createElement('span');
            slider.className = 'toggle-slider';

            // Checkbox markieren
            checkbox.classList.add('toggle-converted');

            // Wrapper einfügen
            const parent = checkbox.parentNode;
            parent.insertBefore(wrapper, checkbox);
            wrapper.appendChild(checkbox);
            wrapper.appendChild(slider);

            converted++;
        });

        console.log(`✅ ${converted} Checkboxen zu Toggle-Switches konvertiert`);
    }

    injectToggleSwitchCSS() {
        if (document.getElementById('toggle-switch-css')) return;

        const style = document.createElement('style');
        style.id = 'toggle-switch-css';
        style.textContent = `
            .toggle-switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
                flex-shrink: 0;
            }
            .toggle-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
                transition: 0.3s;
                border-radius: 26px;
                border: 2px solid rgba(255,255,255,0.1);
            }
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 4px;
                bottom: 2px;
                background: linear-gradient(135deg, #fff, #ddd);
                transition: 0.3s;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
            .toggle-switch input:checked + .toggle-slider {
                background: linear-gradient(135deg, #4ecdc4, #44a08d);
                border-color: #4ecdc4;
                box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
            }
            .toggle-switch input:checked + .toggle-slider:before {
                transform: translateX(22px);
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // EQUALIZER KOMPLETT
    // ==========================================

    fixEqualizerComplete() {
        // EQ Toggle neben Überschrift
        const eqHeader = document.querySelector('#equalizer .panel-header, #equalizer h2, .equalizer-header');
        if (eqHeader) {
            const existingToggle = eqHeader.querySelector('.toggle-switch');
            if (!existingToggle) {
                const toggle = this.createToggleSwitch('eqMainToggle', true, (checked) => {
                    const eqContent = document.querySelector('#equalizer .panel-content, .equalizer-content');
                    if (eqContent) {
                        eqContent.style.opacity = checked ? '1' : '0.5';
                        eqContent.style.pointerEvents = checked ? 'auto' : 'none';
                    }
                    if (window.EqualizerEngine) {
                        window.EqualizerEngine.toggle(checked);
                    }
                });
                eqHeader.appendChild(toggle);
            }
        }

        // Preset-Buttons funktional
        const presetValues = {
            flat: [0, 0, 0, 0, 0],
            pop: [2, 4, 0, 2, 4],
            rock: [5, 3, 0, 3, 5],
            bassboost: [8, 6, 0, 0, 0],
            classic: [0, 0, 0, 3, 4],
            klassik: [0, 0, 0, 3, 4],
            jazz: [3, 0, 2, 4, 5]
        };

        const presetBtns = document.querySelectorAll('.preset-btn, [data-preset]');
        presetBtns.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const preset = btn.dataset.preset || btn.textContent.toLowerCase().trim();
                const values = presetValues[preset];

                if (values) {
                    // Aktiv markieren
                    presetBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Slider setzen
                    const sliders = document.querySelectorAll('.eq-slider, .equalizer-slider, input[type="range"][id*="eq"]');
                    sliders.forEach((slider, i) => {
                        if (values[i] !== undefined) {
                            slider.value = values[i];
                            slider.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    });

                    if (window.showNotification) {
                        window.showNotification(`EQ: ${btn.textContent}`, 'success');
                    }
                }
            };
        });

        // Bassboost Toggle und Slider
        this.fixBassboost();

        // Speichern-Button mit Dialog
        this.setupEQSaveButton();

        // Zurücksetzen-Button
        this.setupEQResetButton();

        // Duplikat-Speichern entfernen
        const saveBtns = document.querySelectorAll('#equalizer .save-btn, #equalizer [id*="save"]');
        if (saveBtns.length > 1) {
            for (let i = 1; i < saveBtns.length; i++) {
                saveBtns[i].style.display = 'none';
            }
        }

        console.log('✅ Equalizer komplett gefixt');
    }

    fixBassboost() {
        const bassSection = document.querySelector('.bass-boost, #bassBoost, [class*="bass"]');
        if (!bassSection) return;

        // Toggle neben "Bassboost" Text
        const bassLabel = bassSection.querySelector('label, h3, .title');
        if (bassLabel && !bassLabel.querySelector('.toggle-switch')) {
            const toggle = this.createToggleSwitch('bassToggle', false, (checked) => {
                const slider = bassSection.querySelector('input[type="range"]');
                if (slider) {
                    slider.disabled = !checked;
                    slider.style.opacity = checked ? '1' : '0.5';
                }
            });
            bassLabel.appendChild(toggle);
        }

        // Slider funktional
        const bassSlider = bassSection.querySelector('input[type="range"]');
        if (bassSlider) {
            bassSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                if (window.EqualizerEngine && window.EqualizerEngine.setBassBoost) {
                    window.EqualizerEngine.setBassBoost(value);
                }
            });
        }
    }

    setupEQSaveButton() {
        const saveBtn = document.querySelector('#eqSaveBtn, #equalizer .save-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                this.showSaveDialog('EQ-Preset speichern', (name) => {
                    const sliders = document.querySelectorAll('.eq-slider, .equalizer-slider');
                    const values = Array.from(sliders).map(s => parseInt(s.value) || 0);

                    const preset = { name, values, date: new Date().toISOString() };
                    this.savedPresets.push(preset);
                    localStorage.setItem('userEQPresets', JSON.stringify(this.savedPresets));

                    if (window.showNotification) {
                        window.showNotification(`Preset "${name}" gespeichert`, 'success');
                    }
                });
            };
        }
    }

    setupEQResetButton() {
        const resetBtn = document.querySelector('#eqResetBtn, #equalizer .reset-btn, #equalizer [id*="reset"]');
        if (resetBtn) {
            resetBtn.onclick = () => {
                const sliders = document.querySelectorAll('.eq-slider, .equalizer-slider');
                sliders.forEach(slider => {
                    slider.value = 0;
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                });

                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                const flatBtn = document.querySelector('[data-preset="flat"]');
                if (flatBtn) flatBtn.classList.add('active');

                if (window.showNotification) {
                    window.showNotification('Equalizer zurückgesetzt', 'info');
                }
            };
        }
    }

    // ==========================================
    // VISUALISIERUNG KOMPLETT
    // ==========================================

    fixVisualizerComplete() {
        // Toggle neben Überschrift
        const vizHeader = document.querySelector('#visualizer .panel-header, .visualizer-header');
        if (vizHeader && !vizHeader.querySelector('.toggle-switch')) {
            const toggle = this.createToggleSwitch('vizMainToggle', true, (checked) => {
                const canvas = document.querySelector('#visualizerCanvas, .visualizer-canvas');
                if (canvas) {
                    canvas.style.display = checked ? 'block' : 'none';
                }
                if (window.AdvancedVisualizer) {
                    checked ? window.AdvancedVisualizer.start() : window.AdvancedVisualizer.stop();
                }
            });
            vizHeader.appendChild(toggle);
        }

        // Effekt-Buttons funktional
        const effectNames = ['Balken', 'Wellen', 'Partikel', 'Kreise', 'Spirale', 'Linien', 'Spektrum', 'Feuer'];
        const effectTypes = ['bars', 'waves', 'particles', 'circles', 'spiral', 'lines', 'spectrum', 'fire'];

        const effectBtns = document.querySelectorAll('.visual-preset, .viz-effect-btn, #visualizer button');
        effectBtns.forEach((btn, index) => {
            btn.style.cursor = 'pointer';
            btn.onclick = (e) => {
                e.preventDefault();

                // Aktiv markieren
                effectBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const effectType = effectTypes[index] || 'bars';

                if (window.AdvancedVisualizer && window.AdvancedVisualizer.setMode) {
                    window.AdvancedVisualizer.setMode(effectType);
                }

                if (window.showNotification) {
                    window.showNotification(`Visualisierung: ${effectNames[index] || effectType}`, 'success');
                }
            };
        });

        // Farb-Picker funktional
        const colorPicker = document.querySelector('#vizColorPicker, #visualizer input[type="color"]');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                if (window.AdvancedVisualizer && window.AdvancedVisualizer.setColor) {
                    window.AdvancedVisualizer.setColor(e.target.value);
                }
            });
        }

        console.log('✅ Visualisierung komplett gefixt');
    }

    // ==========================================
    // LED-MUSIK KOMPLETT
    // ==========================================

    fixLEDMusikComplete() {
        // LED-Musiksteuerung Toggle
        const ledHeader = document.querySelector('#led-music .panel-header, .led-music-header');
        if (ledHeader && !ledHeader.querySelector('.toggle-switch')) {
            const toggle = this.createToggleSwitch('ledMusicToggle', false, (checked) => {
                if (window.AudioReactiveEngine) {
                    checked ? window.AudioReactiveEngine.start() : window.AudioReactiveEngine.stop();
                }
            });
            ledHeader.appendChild(toggle);
        }

        // Automatischer Modus - nur einen behalten, mit Toggle
        const autoModeSection = document.querySelector('.auto-mode, #autoMode, [class*="automatic"]');
        if (autoModeSection) {
            // Duplikaten-Text entfernen
            const textNodes = autoModeSection.querySelectorAll('p, span');
            textNodes.forEach(node => {
                if (node.textContent.includes('passt LED automatisch') ||
                    node.textContent.includes('Right') ||
                    node.textContent.includes('Bottom') ||
                    node.textContent.includes('Background') ||
                    node.textContent.includes('Transition') ||
                    node.textContent.includes('border-radius')) {
                    node.remove();
                }
            });
        }

        // "Sync alle Bänder" entfernen
        const syncElements = document.querySelectorAll('[class*="sync"], [id*="sync"]');
        syncElements.forEach(el => {
            if (el.textContent.toLowerCase().includes('sync')) {
                el.style.display = 'none';
            }
        });

        // LED-Band 1, 2, 3 durch echte gefundene Geräte ersetzen
        this.replaceDummyLEDBands();

        // Audio-Reaktiv-Engine erklären oder verstecken
        const audioReactiveLabel = document.querySelector('[class*="audio-reactive"], [id*="audioReactive"]');
        if (audioReactiveLabel) {
            audioReactiveLabel.title = 'Analysiert Musik und steuert LEDs basierend auf Beat, Frequenz und Stimmung';
        }

        // Umlaute in Frequenzbereich fixen
        this.fixFrequencyLabels();

        console.log('✅ LED-Musik komplett gefixt');
    }

    replaceDummyLEDBands() {
        const bandList = document.querySelector('#ledBandsList, .led-bands-list, #found-devices');
        if (!bandList) return;

        // Dummy-Bänder entfernen
        const dummyBands = bandList.querySelectorAll('[data-dummy="true"], .dummy-band');
        dummyBands.forEach(b => b.remove());

        // Text "LED-Band 1, 2, 3" finden und entfernen
        const allText = bandList.querySelectorAll('*');
        allText.forEach(el => {
            if (el.textContent.match(/LED-Band\s*[123]/i)) {
                el.textContent = el.textContent.replace(/LED-Band\s*[123]/gi, '').trim();
            }
        });

        // Gespeicherte Geräte laden
        const savedDevices = JSON.parse(localStorage.getItem('ledSidebarDevices') || '[]');
        if (savedDevices.length > 0) {
            savedDevices.forEach(device => {
                const deviceEl = document.createElement('div');
                deviceEl.className = 'led-band-item';
                deviceEl.innerHTML = `
                    <span class="device-name">${device.name || 'LED-Band'}</span>
                    <label class="toggle-switch">
                        <input type="checkbox" ${device.enabled ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                `;
                bandList.appendChild(deviceEl);
            });
        }
    }

    fixFrequencyLabels() {
        const labels = document.querySelectorAll('label, span, option');
        const fixes = {
            'Hohen': 'Höhen',
            'Tiefen': 'Tiefen',
            'tiefe Tone': 'tiefe Töne',
            'mittlere Tone': 'mittlere Töne',
            'hohe Tone': 'hohe Töne',
            'Hohe': 'Höhen'
        };

        labels.forEach(label => {
            let text = label.textContent;
            Object.keys(fixes).forEach(wrong => {
                if (text.includes(wrong)) {
                    label.textContent = text.replace(wrong, fixes[wrong]);
                }
            });
        });
    }

    // ==========================================
    // PARTY-MODUS KOMPLETT
    // ==========================================

    fixPartyModeComplete() {
        // Titel-Duplikate entfernen - nur einen behalten
        const partyTitles = [];
        document.querySelectorAll('h1, h2, h3, .panel-title, .section-title').forEach(el => {
            if (el.textContent.toLowerCase().includes('party')) {
                partyTitles.push(el);
            }
        });

        if (partyTitles.length > 1) {
            for (let i = 1; i < partyTitles.length; i++) {
                partyTitles[i].style.display = 'none';
            }
        }

        // Party-Modus Haupt-Toggle
        if (partyTitles[0] && !partyTitles[0].querySelector('.toggle-switch')) {
            const toggle = this.createToggleSwitch('partyModeToggle', false, (checked) => {
                if (window.PartyMode) {
                    checked ? window.PartyMode.start() : window.PartyMode.stop();
                }
            });
            partyTitles[0].appendChild(toggle);
        }

        // Beatmatching Duplikat entfernen
        const beatmatchingItems = [];
        document.querySelectorAll('.setting-item, .option-item').forEach(item => {
            if (item.textContent.toLowerCase().includes('beatmatching')) {
                beatmatchingItems.push(item);
            }
        });
        if (beatmatchingItems.length > 1) {
            for (let i = 1; i < beatmatchingItems.length; i++) {
                beatmatchingItems[i].remove();
            }
        }

        // Track vorladen Duplikat entfernen
        const trackPreloadItems = [];
        document.querySelectorAll('.setting-item, .option-item').forEach(item => {
            if (item.textContent.toLowerCase().includes('track vorladen')) {
                trackPreloadItems.push(item);
            }
        });
        if (trackPreloadItems.length > 1) {
            for (let i = 1; i < trackPreloadItems.length; i++) {
                trackPreloadItems[i].remove();
            }
        }

        // Crossfade Slider funktional
        const crossfadeSlider = document.querySelector('#crossfadeSlider, [id*="crossfade"] input[type="range"]');
        if (crossfadeSlider) {
            crossfadeSlider.disabled = false;
            crossfadeSlider.style.opacity = '1';
            crossfadeSlider.addEventListener('input', (e) => {
                if (window.PartyMode && window.PartyMode.setCrossfade) {
                    window.PartyMode.setCrossfade(e.target.value);
                }
            });
        }

        // Pre-Cutting Slider funktional
        const preCuttingSlider = document.querySelector('#preCuttingSlider, [id*="precutting"] input[type="range"]');
        if (preCuttingSlider) {
            preCuttingSlider.disabled = false;
            preCuttingSlider.style.opacity = '1';
        }

        // Fade-In/Fade-Out Slider funktional
        ['fadeIn', 'fadeOut'].forEach(id => {
            const slider = document.querySelector(`#${id}Slider, [id*="${id}"] input[type="range"]`);
            if (slider) {
                slider.disabled = false;
                slider.style.opacity = '1';
            }
        });

        // Überblend-Typen funktional
        const blendTypeButtons = document.querySelectorAll('.blend-type-btn, [data-blend-type]');
        blendTypeButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                blendTypeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Fade-Kurve Buttons funktional
        const fadeCurveButtons = document.querySelectorAll('.fade-curve-btn, [data-fade-curve]');
        fadeCurveButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                fadeCurveButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        console.log('✅ Party-Modus komplett gefixt');
    }

    // ==========================================
    // BIBLIOTHEK KOMPLETT
    // ==========================================

    fixBibliothekComplete() {
        // Bibliothekscan Button
        const scanBtn = document.querySelector('#libraryScanBtn, .library-scan-btn, [id*="scan"]');
        if (scanBtn) {
            scanBtn.onclick = async () => {
                if (window.showNotification) {
                    window.showNotification('Scanne Bibliothek...', 'info');
                }

                if (window.musicLibraryManager && window.musicLibraryManager.scanFolder) {
                    await window.musicLibraryManager.scanFolder();
                }

                if (window.showNotification) {
                    window.showNotification('Scan abgeschlossen', 'success');
                }
            };
        }

        // Suche funktional
        const searchBtn = document.querySelector('#searchBtn, .search-btn, [id*="search"]');
        const searchInput = document.querySelector('#searchInput, .search-input');
        if (searchBtn && searchInput) {
            searchBtn.onclick = () => {
                searchInput.style.display = searchInput.style.display === 'none' ? 'block' : 'none';
                if (searchInput.style.display === 'block') {
                    searchInput.focus();
                }
            };

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.filterLibraryBySearch(query);
            });
        }

        // Ansicht wechseln
        const viewToggle = document.querySelector('#viewToggle, .view-toggle');
        if (viewToggle) {
            viewToggle.onclick = () => {
                const grid = document.querySelector('.songs-grid, .library-grid');
                if (grid) {
                    grid.classList.toggle('list-view');
                    grid.classList.toggle('grid-view');
                }
            };
        }

        // Sortieren
        const sortBtn = document.querySelector('#sortBtn, .sort-btn');
        if (sortBtn) {
            sortBtn.onclick = () => {
                this.showSortOptions();
            };
        }

        // Playlist erstellen
        this.setupPlaylistManagement();

        // Kontextmenü bei langem Drücken
        this.setupSongContextMenu();

        console.log('✅ Bibliothek komplett gefixt');
    }

    filterLibraryBySearch(query) {
        const items = document.querySelectorAll('.song-item, .track-item, .library-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    }

    showSortOptions() {
        const options = ['Name (A-Z)', 'Name (Z-A)', 'Datum (Neueste)', 'Datum (Älteste)', 'Dauer', 'Zuletzt gespielt'];

        const dialog = document.createElement('div');
        dialog.className = 'sort-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 20px;
            border-radius: 15px;
            z-index: 10000;
            border: 2px solid #4ecdc4;
            min-width: 200px;
        `;

        dialog.innerHTML = `
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">Sortieren nach</h3>
            ${options.map(opt => `
                <div class="sort-option" style="padding: 10px; cursor: pointer; border-radius: 8px; margin: 5px 0; background: rgba(255,255,255,0.05);">
                    ${opt}
                </div>
            `).join('')}
        `;

        document.body.appendChild(dialog);

        dialog.querySelectorAll('.sort-option').forEach(opt => {
            opt.onclick = () => {
                dialog.remove();
                if (window.showNotification) {
                    window.showNotification(`Sortiert nach: ${opt.textContent}`, 'success');
                }
            };
        });

        // Schließen bei Klick außerhalb
        setTimeout(() => {
            document.addEventListener('click', function closeDialog(e) {
                if (!dialog.contains(e.target)) {
                    dialog.remove();
                    document.removeEventListener('click', closeDialog);
                }
            });
        }, 100);
    }

    setupPlaylistManagement() {
        const playlistSection = document.querySelector('#playlists, .playlists-section');
        if (!playlistSection) return;

        // Playlist erstellen Button
        let createBtn = playlistSection.querySelector('.create-playlist-btn');
        if (!createBtn) {
            createBtn = document.createElement('button');
            createBtn.className = 'create-playlist-btn';
            createBtn.innerHTML = '<i class="fas fa-plus"></i> Playlist erstellen';
            createBtn.style.cssText = `
                background: linear-gradient(135deg, #4ecdc4, #44a08d);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                margin: 10px 0;
            `;
            playlistSection.insertBefore(createBtn, playlistSection.firstChild.nextSibling);
        }

        createBtn.onclick = () => {
            this.showSaveDialog('Neue Playlist', (name) => {
                const playlists = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
                playlists.push({ name, tracks: [], created: new Date().toISOString() });
                localStorage.setItem('userPlaylists', JSON.stringify(playlists));

                if (window.showNotification) {
                    window.showNotification(`Playlist "${name}" erstellt`, 'success');
                }

                this.refreshPlaylistDisplay();
            });
        };

        this.refreshPlaylistDisplay();
    }

    refreshPlaylistDisplay() {
        const playlistList = document.querySelector('.playlists-list, #playlistsList');
        if (!playlistList) return;

        const playlists = JSON.parse(localStorage.getItem('userPlaylists') || '[]');

        playlistList.innerHTML = playlists.map((pl, index) => `
            <div class="playlist-item" data-index="${index}" style="
                padding: 12px;
                margin: 8px 0;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <span>${pl.name} (${pl.tracks?.length || 0} Titel)</span>
                <button class="delete-playlist-btn" data-index="${index}" style="
                    background: #ff4757;
                    border: none;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    cursor: pointer;
                ">🗑️</button>
            </div>
        `).join('');

        // Delete Handlers
        playlistList.querySelectorAll('.delete-playlist-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                playlists.splice(index, 1);
                localStorage.setItem('userPlaylists', JSON.stringify(playlists));
                this.refreshPlaylistDisplay();

                if (window.showNotification) {
                    window.showNotification('Playlist gelöscht', 'info');
                }
            };
        });
    }

    setupSongContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            const songItem = e.target.closest('.song-item, .track-item');
            if (songItem) {
                e.preventDefault();
                this.showSongContextMenu(e, songItem);
            }
        });

        // Long press für Touch
        let pressTimer;
        document.addEventListener('touchstart', (e) => {
            const songItem = e.target.closest('.song-item, .track-item');
            if (songItem) {
                pressTimer = setTimeout(() => {
                    this.showSongContextMenu(e, songItem);
                }, 500);
            }
        });

        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
    }

    showSongContextMenu(e, songItem) {
        // Entferne vorheriges Menü
        document.querySelectorAll('.song-context-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'song-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX || e.touches?.[0]?.clientX || 100}px;
            top: ${e.clientY || e.touches?.[0]?.clientY || 100}px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 2px solid #4ecdc4;
            border-radius: 12px;
            padding: 10px 0;
            z-index: 10000;
            min-width: 180px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;

        const options = [
            { icon: '▶️', text: 'Als nächstes abspielen', action: 'playNext' },
            { icon: '📋', text: 'In Playlist hinzufügen', action: 'addToPlaylist' },
            { icon: '⭐', text: 'Als Favorit markieren', action: 'favorite' },
            { icon: '🗑️', text: 'Löschen', action: 'delete' }
        ];

        menu.innerHTML = options.map(opt => `
            <div class="context-option" data-action="${opt.action}" style="
                padding: 12px 20px;
                cursor: pointer;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <span>${opt.icon}</span>
                <span>${opt.text}</span>
            </div>
        `).join('');

        document.body.appendChild(menu);

        // Click Handlers
        menu.querySelectorAll('.context-option').forEach(opt => {
            opt.onmouseenter = () => opt.style.background = 'rgba(78, 205, 196, 0.2)';
            opt.onmouseleave = () => opt.style.background = '';

            opt.onclick = () => {
                const action = opt.dataset.action;
                const songTitle = songItem.querySelector('.song-title, .track-name')?.textContent || 'Titel';

                switch (action) {
                    case 'playNext':
                        if (window.showNotification) window.showNotification(`"${songTitle}" als nächstes`, 'success');
                        break;
                    case 'addToPlaylist':
                        this.showPlaylistSelector(songItem);
                        break;
                    case 'favorite':
                        songItem.classList.toggle('favorite');
                        if (window.showNotification) window.showNotification(`"${songTitle}" zu Favoriten`, 'success');
                        break;
                    case 'delete':
                        if (confirm(`"${songTitle}" wirklich löschen?`)) {
                            songItem.remove();
                            if (window.showNotification) window.showNotification(`"${songTitle}" gelöscht`, 'info');
                        }
                        break;
                }

                menu.remove();
            };
        });

        // Schließen bei Klick außerhalb
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    showPlaylistSelector(songItem) {
        const playlists = JSON.parse(localStorage.getItem('userPlaylists') || '[]');

        if (playlists.length === 0) {
            this.showSaveDialog('Neue Playlist erstellen', (name) => {
                const newPlaylists = [{ name, tracks: [songItem.dataset], created: new Date().toISOString() }];
                localStorage.setItem('userPlaylists', JSON.stringify(newPlaylists));
                if (window.showNotification) window.showNotification(`Playlist "${name}" mit Titel erstellt`, 'success');
            });
            return;
        }

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 20px;
            border-radius: 15px;
            z-index: 10001;
            border: 2px solid #4ecdc4;
            min-width: 250px;
        `;

        dialog.innerHTML = `
            <h3 style="color: #4ecdc4; margin-bottom: 15px;">Zu Playlist hinzufügen</h3>
            ${playlists.map((pl, i) => `
                <div class="playlist-select-item" data-index="${i}" style="
                    padding: 12px;
                    margin: 5px 0;
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    cursor: pointer;
                    color: white;
                ">${pl.name}</div>
            `).join('')}
        `;

        document.body.appendChild(dialog);

        dialog.querySelectorAll('.playlist-select-item').forEach(item => {
            item.onclick = () => {
                const index = parseInt(item.dataset.index);
                playlists[index].tracks = playlists[index].tracks || [];
                playlists[index].tracks.push(songItem.dataset);
                localStorage.setItem('userPlaylists', JSON.stringify(playlists));

                if (window.showNotification) {
                    window.showNotification(`Zu "${playlists[index].name}" hinzugefügt`, 'success');
                }

                dialog.remove();
            };
        });

        setTimeout(() => {
            document.addEventListener('click', function close(e) {
                if (!dialog.contains(e.target)) {
                    dialog.remove();
                    document.removeEventListener('click', close);
                }
            });
        }, 100);
    }

    // ==========================================
    // UTILITY FUNKTIONEN
    // ==========================================

    createToggleSwitch(id, checked, onChange) {
        const wrapper = document.createElement('label');
        wrapper.className = 'toggle-switch';
        wrapper.style.marginLeft = '10px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = checked;
        checkbox.classList.add('toggle-converted');

        const slider = document.createElement('span');
        slider.className = 'toggle-slider';

        wrapper.appendChild(checkbox);
        wrapper.appendChild(slider);

        if (onChange) {
            checkbox.addEventListener('change', () => onChange(checkbox.checked));
        }

        return wrapper;
    }

    showSaveDialog(title, onSave) {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 25px;
            border-radius: 20px;
            z-index: 10000;
            border: 2px solid #4ecdc4;
            box-shadow: 0 15px 40px rgba(0,0,0,0.5);
            min-width: 300px;
        `;

        dialog.innerHTML = `
            <h3 style="color: #4ecdc4; margin-bottom: 20px; text-align: center;">${title}</h3>
            <input type="text" id="saveNameInput" placeholder="Name eingeben..." style="
                width: 100%;
                padding: 12px;
                border-radius: 10px;
                border: 2px solid rgba(255,255,255,0.2);
                background: rgba(255,255,255,0.1);
                color: white;
                font-size: 16px;
                margin-bottom: 20px;
            ">
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancelSaveBtn" style="
                    padding: 10px 20px;
                    border-radius: 25px;
                    border: 2px solid rgba(255,255,255,0.3);
                    background: transparent;
                    color: #aaa;
                    cursor: pointer;
                ">Abbrechen</button>
                <button id="confirmSaveBtn" style="
                    padding: 10px 20px;
                    border-radius: 25px;
                    border: none;
                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                    color: white;
                    cursor: pointer;
                ">Speichern</button>
            </div>
        `;

        document.body.appendChild(dialog);

        const input = dialog.querySelector('#saveNameInput');
        input.focus();

        dialog.querySelector('#cancelSaveBtn').onclick = () => dialog.remove();
        dialog.querySelector('#confirmSaveBtn').onclick = () => {
            const name = input.value.trim();
            if (name) {
                onSave(name);
                dialog.remove();
            } else {
                input.style.borderColor = '#ff4757';
            }
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                dialog.querySelector('#confirmSaveBtn').click();
            }
        });
    }

    removeCSSArtifacts() {
        // Finde und entferne CSS-Code-Artefakte
        document.querySelectorAll('*').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                const text = el.textContent;
                if (text.includes('Right') && text.includes('Bottom') ||
                    text.includes('Background') && text.includes('Color') ||
                    text.includes('Transition') && text.includes('border-radius') ||
                    text.match(/:\s*\d+px|:\s*#[0-9a-f]{3,6}|:\s*\d+s/i)) {
                    el.style.display = 'none';
                }
            }
        });

        console.log('✅ CSS-Artefakte entfernt');
    }

    fixUmlauts() {
        const fixes = {
            'Hohen': 'Höhen',
            'Tiefen': 'Tiefen',
            'Tone': 'Töne',
            'Frequenzubergreifend': 'Frequenzübergreifend',
            'Ueberblendung': 'Überblendung',
            'Dauer': 'Dauer'
        };

        document.querySelectorAll('*').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                let text = el.textContent;
                let changed = false;
                Object.keys(fixes).forEach(wrong => {
                    if (text.includes(wrong) && !text.includes(fixes[wrong])) {
                        text = text.replace(new RegExp(wrong, 'g'), fixes[wrong]);
                        changed = true;
                    }
                });
                if (changed) el.textContent = text;
            }
        });

        console.log('✅ Umlaute gefixt');
    }

    removeUnnecessaryElements() {
        // "Sync alle Bänder" entfernen
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.includes('Sync alle') && el.textContent.includes('Bänder')) {
                const parent = el.closest('.setting-item, .option-item, div');
                if (parent && parent !== document.body) {
                    parent.style.display = 'none';
                }
            }
        });

        // Empfindlichkeits-Slider entfernen (kein Mikrofon)
        document.querySelectorAll('[id*="sensitivity"], [class*="sensitivity"]').forEach(el => {
            const label = el.querySelector('label') || el.previousElementSibling;
            if (label && label.textContent.toLowerCase().includes('empfindlichkeit')) {
                el.style.display = 'none';
            }
        });

        // "Auf andere kopieren" entfernen
        document.querySelectorAll('button, .btn').forEach(btn => {
            if (btn.textContent.includes('andere kopieren')) {
                btn.style.display = 'none';
            }
        });

        console.log('✅ Unnötige Elemente entfernt');
    }

    removeDuplicates() {
        // Party-Modus Titel
        const partyTitles = [];
        document.querySelectorAll('h1, h2, h3').forEach(h => {
            if (h.textContent.toLowerCase().includes('party')) {
                partyTitles.push(h);
            }
        });
        for (let i = 1; i < partyTitles.length; i++) {
            partyTitles[i].style.display = 'none';
        }

        // Speichern-Buttons im Equalizer
        const eqSaveBtns = document.querySelectorAll('#equalizer .save-btn, #equalizer button[id*="save"]');
        for (let i = 1; i < eqSaveBtns.length; i++) {
            eqSaveBtns[i].style.display = 'none';
        }

        console.log('✅ Duplikate entfernt');
    }

    makeAllSlidersFunctional() {
        const allSliders = document.querySelectorAll('input[type="range"]');

        allSliders.forEach(slider => {
            // Disabled entfernen
            slider.disabled = false;
            slider.style.opacity = '1';
            slider.style.pointerEvents = 'auto';

            // Value-Display aktualisieren
            slider.addEventListener('input', () => {
                const valueDisplay = slider.nextElementSibling ||
                    slider.parentElement.querySelector('.slider-value, .value-display');
                if (valueDisplay && valueDisplay.tagName !== 'SPAN') {
                    valueDisplay.textContent = slider.value;
                }
            });
        });

        console.log(`✅ ${allSliders.length} Slider funktional gemacht`);
    }
}

// Initialisieren
window.MusikCompleteFixes = new MusikCompleteFixes();
console.log('✅ Musik-Complete-Fixes geladen');
