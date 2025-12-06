/**
 * Musik Panel Controller
 * Handles panel switching, EQ presets, and visualization effects
 * Extracted from inline JS in musik.html (Memory Rule: No Inline JS)
 * @version 1.0.0
 */

(function () {
    'use strict';

    // EQ Preset Values
    const eqPresetValues = {
        'flat': [0, 0, 0, 0, 0],
        'pop': [2, 4, 5, 3, 1],
        'rock': [5, 3, -1, 2, 5],
        'bassboost': [8, 6, 0, 0, 0],
        'classic': [-1, 2, 3, 2, -1],
        'jazz': [4, 2, -1, 2, 4]
    };

    /**
     * Show a specific panel and activate the corresponding button
     * @param {string} panelId - The ID of the panel to show
     * @param {HTMLElement} clickedBtn - The button that was clicked
     */
    function showPanel(panelId, clickedBtn) {
        // Deactivate all buttons
        document.querySelectorAll('.taskbar-btn').forEach(btn => btn.classList.remove('active'));
        // Activate clicked button
        if (clickedBtn) clickedBtn.classList.add('active');

        // Hide all panels
        document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));

        // Show selected panel
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            console.log('Panel aktiv:', panelId);
        }
    }

    /**
     * Select an EQ preset and apply values to sliders
     * @param {HTMLElement} btn - The preset button
     * @param {string} preset - The preset name
     */
    function selectEQPreset(btn, preset) {
        // Deactivate all buttons
        document.querySelectorAll('#eqPresetsContainer .preset-btn').forEach(b => b.classList.remove('active'));
        // Activate clicked button
        btn.classList.add('active');

        // Set slider values
        const values = eqPresetValues[preset];
        if (values) {
            const sliders = document.querySelectorAll('.eq-slider');
            sliders.forEach((slider, i) => {
                if (values[i] !== undefined) {
                    slider.value = values[i];
                }
            });
        }
        console.log('EQ Preset:', preset);
    }

    /**
     * Select a visualization effect
     * @param {HTMLElement} btn - The effect button
     * @param {string} effect - The effect name
     */
    function selectVisualEffect(btn, effect) {
        document.querySelectorAll('.visual-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        console.log('Visual Effekt:', effect);
    }

    /**
     * Reset EQ to flat values
     */
    function resetEQ() {
        document.querySelectorAll('.eq-slider').forEach(slider => {
            slider.value = 0;
        });
        document.querySelectorAll('#eqPresetsContainer .preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-preset="flat"]')?.classList.add('active');
        console.log('EQ zurückgesetzt');
    }

    /**
     * Save a custom EQ preset
     */
    function saveCustomEQPreset() {
        const name = prompt('Name für dein Preset:');
        if (!name || name.trim() === '') return;

        const values = [];
        document.querySelectorAll('.eq-slider').forEach(slider => {
            values.push(parseInt(slider.value));
        });

        // Save to LocalStorage
        try {
            let customPresets = JSON.parse(localStorage.getItem('customEQPresets') || '{}');
            customPresets[name] = values;
            localStorage.setItem('customEQPresets', JSON.stringify(customPresets));
            eqPresetValues[name] = values;

            // Create button with delete option
            createCustomPresetButton(name, values);
            alert('Preset "' + name + '" gespeichert!');
        } catch (error) {
            console.error('Fehler beim Speichern des EQ-Presets:', error);
            alert('Preset konnte nicht gespeichert werden.');
        }
    }

    /**
     * Create a custom preset button with delete option
     * @param {string} name - Preset name
     * @param {number[]} values - EQ values array
     */
    function createCustomPresetButton(name, values) {
        const container = document.getElementById('customPresetsContainer');
        if (!container) return;

        // Check if button already exists
        if (document.querySelector(`[data-custom-preset="${name}"]`)) return;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; display: inline-block;';
        wrapper.dataset.customPreset = name;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset-btn';
        btn.textContent = name;
        btn.onclick = function () {
            selectEQPreset(this, name);
        };

        // Delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #ff4444; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;';
        deleteBtn.onclick = function (e) {
            e.stopPropagation();
            if (confirm('Preset "' + name + '" löschen?')) {
                deleteCustomEQPreset(name);
            }
        };

        wrapper.appendChild(btn);
        wrapper.appendChild(deleteBtn);
        container.appendChild(wrapper);
    }

    /**
     * Delete a custom EQ preset
     * @param {string} name - Preset name to delete
     */
    function deleteCustomEQPreset(name) {
        try {
            let customPresets = JSON.parse(localStorage.getItem('customEQPresets') || '{}');
            delete customPresets[name];
            delete eqPresetValues[name];
            localStorage.setItem('customEQPresets', JSON.stringify(customPresets));

            // Remove button
            const wrapper = document.querySelector(`[data-custom-preset="${name}"]`);
            if (wrapper) wrapper.remove();
        } catch (error) {
            console.error('Fehler beim Löschen des EQ-Presets:', error);
        }
    }

    /**
     * Load saved custom presets on startup
     */
    function loadCustomEQPresets() {
        try {
            const customPresets = JSON.parse(localStorage.getItem('customEQPresets') || '{}');
            for (const [name, values] of Object.entries(customPresets)) {
                eqPresetValues[name] = values;
                createCustomPresetButton(name, values);
            }
        } catch (error) {
            console.error('Fehler beim Laden der EQ-Presets:', error);
        }
    }

    // Export to window for HTML onclick handlers
    window.showPanel = showPanel;
    window.selectEQPreset = selectEQPreset;
    window.selectVisualEffect = selectVisualEffect;
    window.resetEQ = resetEQ;
    window.saveCustomEQPreset = saveCustomEQPreset;
    window.createCustomPresetButton = createCustomPresetButton;
    window.deleteCustomEQPreset = deleteCustomEQPreset;
    window.loadCustomEQPresets = loadCustomEQPresets;
    window.eqPresetValues = eqPresetValues;

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', loadCustomEQPresets);
})();
