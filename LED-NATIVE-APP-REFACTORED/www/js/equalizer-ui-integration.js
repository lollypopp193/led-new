/**
 * EQUALIZER UI INTEGRATION - Verbindet Equalizer-Engine mit musik.html UI
 */
(function () {
    'use strict';

    let eq = null;
    let audioElement = null;
    let isConnected = false;

    // Warte bis DOM geladen ist
    document.addEventListener('DOMContentLoaded', function () {
        // console.log('🎛️ Initializing Equalizer UI...');

        // Equalizer-Engine laden
        if (window.equalizerEngine) {
            eq = window.equalizerEngine;
        } else {
            console.error('❌ Equalizer Engine nicht gefunden!');
            return;
        }

        // Audio-Element suchen (wird vom Music Player erstellt)
        setTimeout(initializeEqualizerUI, 1000);
    });

    function initializeEqualizerUI() {
        // Audio-Element finden
        audioElement = document.querySelector('audio') || document.getElementById('musicPlayer');

        if (audioElement) {
            connectEqualizer();
        }

        // UI Event-Listener
        setupPresetButtons();
        setupSliders();
        setupBassBoost();
        setupToggle();
        setupSaveButtons();
    }

    async function connectEqualizer() {
        if (!eq || !audioElement || isConnected) return;

        try {
            isConnected = await eq.connect(audioElement);
            if (isConnected) {
                // console.log('✅ Equalizer verbunden mit Audio-Element');
            }
        } catch (err) {
            console.error('❌ Equalizer-Verbindung fehlgeschlagen:', err);
        }
    }

    function setupPresetButtons() {
        const presetBtns = document.querySelectorAll('.preset-btn');

        presetBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const presetName = this.textContent.trim();

                // Skip Speichern/Zurücksetzen Buttons
                if (presetName === 'Speichern') {
                    saveCustomPreset();
                    return;
                }

                if (presetName === 'Zurücksetzen') {
                    resetEqualizer();
                    return;
                }

                // Preset anwenden
                applyPreset(presetName);

                // Active-State setzen
                presetBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // console.log('✅ Preset-Buttons verbunden:', presetBtns.length);
    }

    function setupSliders() {
        const sliders = document.querySelectorAll('.eq-slider');

        sliders.forEach((slider, index) => {
            slider.addEventListener('input', function () {
                if (!eq) return;

                const value = parseFloat(this.value);
                eq.setFrequency(index, value);

                // Preset auf "Custom" setzen wenn manuell geändert
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            });
        });

        // console.log('✅ EQ-Sliders verbunden:', sliders.length);
    }

    function setupBassBoost() {
        const toggle = document.getElementById('bassBoostToggle');
        const slider = document.getElementById('bassBoostIntensity');
        const valueDisplay = document.getElementById('bassBoostValue');

        if (toggle) {
            toggle.addEventListener('change', function () {
                const enabled = this.checked;

                if (slider) {
                    slider.disabled = !enabled;
                }

                if (eq) {
                    const intensity = slider ? parseFloat(slider.value) : 0;
                    eq.setBassBoost(enabled, intensity);
                }
            });
        }

        if (slider) {
            slider.addEventListener('input', function () {
                const value = parseFloat(this.value);

                if (valueDisplay) {
                    valueDisplay.textContent = value + 'dB';
                }

                if (eq && toggle && toggle.checked) {
                    eq.setBassBoost(true, value);
                }
            });
        }

        // console.log('✅ Bass-Boost UI verbunden');
    }

    function setupToggle() {
        const toggle = document.getElementById('eqToggle');

        if (toggle) {
            toggle.addEventListener('change', function () {
                if (eq) {
                    eq.toggleEnabled(this.checked);
                }
            });
        }
    }

    function setupSaveButtons() {
        // Diese werden über setupPresetButtons behandelt
    }

    function applyPreset(presetName) {
        if (!eq) return;

        const values = eq.applyPreset(presetName);

        if (values) {
            // UI-Slider aktualisieren
            const sliders = document.querySelectorAll('.eq-slider');
            sliders.forEach((slider, index) => {
                if (values[index] !== undefined) {
                    slider.value = values[index];
                }
            });

            // console.log('✅ Preset angewendet:', presetName, values);
        }
    }

    function resetEqualizer() {
        if (!eq) return;

        eq.reset();

        // UI-Slider zurücksetzen
        const sliders = document.querySelectorAll('.eq-slider');
        sliders.forEach(slider => {
            slider.value = 0;
        });

        // Bass-Boost zurücksetzen
        const bbToggle = document.getElementById('bassBoostToggle');
        const bbSlider = document.getElementById('bassBoostIntensity');
        const bbValue = document.getElementById('bassBoostValue');

        if (bbToggle) bbToggle.checked = false;
        if (bbSlider) { bbSlider.value = 0; bbSlider.disabled = true; }
        if (bbValue) bbValue.textContent = '0dB';

        // Flat-Preset aktivieren
        applyPreset('Flat');
        document.querySelectorAll('.preset-btn').forEach(b => {
            if (b.textContent.trim() === 'Flat') {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        // console.log('🔄 Equalizer zurückgesetzt');
    }

    function saveCustomPreset() {
        const name = prompt('Gib einen Namen für dein Custom-Preset ein:');

        if (!name || name.trim() === '') {
            alert('Kein Name eingegeben!');
            return;
        }

        if (eq && eq.saveCustomPreset(name.trim())) {
            alert('✅ Preset "' + name + '" gespeichert!');

            // Preset-Button hinzufügen
            addCustomPresetButton(name.trim());
        } else {
            alert('❌ Speichern fehlgeschlagen!');
        }
    }

    function addCustomPresetButton(name) {
        const customContainer = document.getElementById('customPresetsContainer');
        if (!customContainer) return;

        // Prüfen ob Button bereits existiert
        if (customContainer.querySelector(`[data-custom-preset="${name}"]`)) return;

        // Container für Button + Löschen
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; align-items: center; gap: 4px;';
        wrapper.dataset.customPreset = name;

        // Preset-Button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'padding: 6px 12px; background: rgba(78, 205, 196, 0.2); border: 1px solid #4ecdc4; color: #4ecdc4; border-radius: 6px; cursor: pointer; font-size: 0.85em;';
        btn.textContent = name;

        // Event-Listener für Anwenden
        btn.addEventListener('click', function () {
            if (eq && eq.customPresets[name]) {
                const values = eq.customPresets[name];
                values.forEach((val, idx) => eq.setFrequency(idx, val));

                // UI Slider updaten
                const sliders = document.querySelectorAll('.eq-slider');
                sliders.forEach((slider, idx) => {
                    if (values[idx] !== undefined) slider.value = values[idx];
                });

                // Active-State bei Haupt-Presets entfernen
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));

                // Visuelles Feedback
                btn.style.background = 'rgba(78, 205, 196, 0.5)';
                setTimeout(() => btn.style.background = 'rgba(78, 205, 196, 0.2)', 300);
            }
        });

        // Löschen-Button
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.style.cssText = 'padding: 4px 8px; background: rgba(255, 107, 107, 0.2); border: 1px solid #ff6b6b; color: #ff6b6b; border-radius: 4px; cursor: pointer; font-size: 0.75em;';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.title = 'Löschen';

        deleteBtn.addEventListener('click', function () {
            if (confirm('Preset "' + name + '" löschen?')) {
                if (eq && eq.deleteCustomPreset(name)) {
                    wrapper.remove();
                    updateCustomPresetsEmptyState();
                    // console.log('✅ Preset gelöscht:', name);
                }
            }
        });

        wrapper.appendChild(btn);
        wrapper.appendChild(deleteBtn);
        customContainer.appendChild(wrapper);

        updateCustomPresetsEmptyState();
    }

    function updateCustomPresetsEmptyState() {
        const customContainer = document.getElementById('customPresetsContainer');
        if (!customContainer) return;

        // Zähle echte Preset-Elemente (nicht den Empty-State)
        const presetCount = customContainer.querySelectorAll('[data-custom-preset]').length;

        // Entferne existierende Empty-State
        const existingEmpty = customContainer.querySelector('.custom-presets-empty');
        if (existingEmpty) existingEmpty.remove();

        if (presetCount === 0) {
            const empty = document.createElement('span');
            empty.className = 'custom-presets-empty';
            empty.style.cssText = 'color: #666; font-size: 0.85em; font-style: italic;';
            empty.textContent = 'Keine eigenen Presets gespeichert';
            customContainer.appendChild(empty);
        }
    }

    // Custom-Presets beim Start laden
    function loadCustomPresetsUI() {
        if (!eq) return;

        Object.keys(eq.customPresets).forEach(name => {
            addCustomPresetButton(name);
        });

        // // console.log('✅ Custom-Presets geladen:', Object.keys(eq.customPresets).length);
    }

    // Audio-Element Observer (falls später erstellt)
    function observeAudioElement() {
        const observer = new MutationObserver(function () {
            if (!isConnected) {
                audioElement = document.querySelector('audio');
                if (audioElement) {
                    connectEqualizer();
                    loadCustomPresetsUI();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    observeAudioElement();

    // Global verfügbar machen
    window.equalizerUI = {
        applyPreset,
        resetEqualizer,
        saveCustomPreset,
        connectEqualizer,
        loadCustomPresetsUI,
        updateCustomPresetsEmptyState
    };

    // Globale Funktion für onclick im HTML
    window.saveCustomEQPreset = saveCustomPreset;

    // Beim Start Custom-Presets laden und Empty-State setzen
    setTimeout(() => {
        loadCustomPresetsUI();
        updateCustomPresetsEmptyState();
    }, 1500);

    // console.log('✅ Equalizer UI Integration geladen');
})();
