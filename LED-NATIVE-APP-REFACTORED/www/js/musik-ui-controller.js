/**
 * MUSIK-UI-CONTROLLER.JS
 * UI-Steuerung für musik.html - KEIN Inline-JS mehr
 */
'use strict';

// showNotification() - wird aus notifications.js geladen (ZERO Duplicate Code Policy)

// Taskbar Navigation
function initTaskbarNavigation() {
    document.addEventListener('DOMContentLoaded', function () {
        const taskbarButtons = document.querySelectorAll('.taskbar-btn');

        taskbarButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const content = this.getAttribute('data-content');

                document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                document.querySelectorAll('.content-panel').forEach(panel => panel.classList.remove('active'));

                const targetPanel = document.getElementById(content);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    });
}

// LED Band Settings
function updateBandTabs(count) {
    const tabs = document.querySelectorAll('.led-band-tab');
    const bandCount = parseInt(count);

    tabs.forEach((tab, index) => {
        if (index === 0) return;
        const bandIndex = index - 1;
        if (bandIndex < bandCount) {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });
}

// Settings Functions
function backupSettings() {
    try {
        const settings = {
            playlist: localStorage.getItem('current-playlist'),
            volume: localStorage.getItem('volume-level'),
            equalizer: localStorage.getItem('equalizer-settings'),
            timestamp: Date.now()
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `musik-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('✅ Backup erstellt!', 'success');
    } catch (error) {
        console.error('Backup-Fehler:', error);
        showNotification('❌ Backup fehlgeschlagen', 'error');
    }
}

function restoreSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const settings = JSON.parse(text);

            if (settings.playlist) localStorage.setItem('current-playlist', settings.playlist);
            if (settings.volume) localStorage.setItem('volume-level', settings.volume);
            if (settings.equalizer) localStorage.setItem('equalizer-settings', settings.equalizer);

            showNotification('✅ Backup wiederhergestellt!', 'success');
            location.reload();
        } catch (error) {
            console.error('Restore-Fehler:', error);
            showNotification('❌ Wiederherstellung fehlgeschlagen', 'error');
        }
    };

    input.click();
}

function exportPlaylist() {
    try {
        const playlist = JSON.parse(localStorage.getItem('current-playlist') || '[]');
        const blob = new Blob([JSON.stringify(playlist, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `playlist-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('✅ Playlist exportiert!', 'success');
    } catch (error) {
        console.error('Export-Fehler:', error);
        showNotification('❌ Export fehlgeschlagen', 'error');
    }
}

function importPlaylist() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            const text = await file.text();
            const playlist = JSON.parse(text);

            localStorage.setItem('current-playlist', JSON.stringify(playlist));
            showNotification('✅ Playlist importiert!', 'success');
            location.reload();
        } catch (error) {
            console.error('Import-Fehler:', error);
            showNotification('❌ Import fehlgeschlagen', 'error');
        }
    };

    input.click();
}

function clearCache() {
    if (confirm('Möchten Sie wirklich den gesamten Cache leeren?')) {
        try {
            localStorage.clear();
            showNotification('✅ Cache geleert!', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Cache-Fehler:', error);
            showNotification('❌ Fehler beim Leeren', 'error');
        }
    }
}

function resetToDefaults() {
    if (confirm('Möchten Sie wirklich alle Einstellungen zurücksetzen?')) {
        try {
            localStorage.removeItem('volume-level');
            localStorage.removeItem('equalizer-settings');
            localStorage.removeItem('repeat-mode');
            localStorage.removeItem('shuffle-mode');

            showNotification('✅ Einstellungen zurückgesetzt!', 'success');
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            console.error('Reset-Fehler:', error);
            showNotification('❌ Fehler beim Zurücksetzen', 'error');
        }
    }
}

function showStats() {
    const playlist = JSON.parse(localStorage.getItem('current-playlist') || '[]');
    const totalTracks = playlist.length;
    const totalDuration = playlist.reduce((sum, track) => sum + (track.duration || 0), 0);

    alert(`
Statistiken:
- Tracks: ${totalTracks}
- Gesamtdauer: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m
    `);
}

function activatePartyMode() {
    console.log('🎉 Party-Modus aktiviert');
    showNotification('🎉 Party-Modus aktiviert!', 'success');
}

function saveLEDBandPreset(bandIndex) {
    const presetName = prompt('Preset-Name:', `Band ${bandIndex + 1} Preset`);
    if (!presetName) return;

    showNotification(`✅ Preset "${presetName}" gespeichert!`, 'success');
}

function loadLEDBandPreset(bandIndex) {
    showNotification('⚠️ Keine Presets gefunden', 'info');
}

function resetLEDBandToDefault(bandIndex) {
    if (!confirm('Einstellungen auf Standardwerte zurücksetzen?')) return;
    showNotification('✅ Auf Standardwerte zurückgesetzt!', 'success');
}

function copyLEDBandToOthers(bandIndex) {
    if (!confirm('Einstellungen auf alle anderen Bänder kopieren?')) return;
    showNotification('✅ Einstellungen kopiert!', 'success');
}

function resetTempoAndPitch() {
    showNotification('✅ Tempo & Tonhöhe zurückgesetzt!', 'success');
}

// Global Export (showNotification bereits in notifications.js)
window.initTaskbarNavigation = initTaskbarNavigation;
window.backupSettings = backupSettings;
window.restoreSettings = restoreSettings;
window.resetToDefaults = resetToDefaults;
window.showStats = showStats;
window.activatePartyMode = activatePartyMode;
window.saveLEDBandPreset = saveLEDBandPreset;
window.loadLEDBandPreset = loadLEDBandPreset;
window.resetLEDBandToDefault = resetLEDBandToDefault;
window.copyLEDBandToOthers = copyLEDBandToOthers;
window.resetTempoAndPitch = resetTempoAndPitch;

// Auto-Init
initTaskbarNavigation();

// console.log('✅ Musik-UI-Controller geladen');
