/**
 * EINSTELLUNGEN-FIXES.JS
 * Behebt alle Probleme in der Einstellungen-Seite
 * - Sonderzeichen fixen
 * - Alle Haken → Ein/Aus-Schalter
 * - Alle Slider funktional
 * - Performance-Sektion entfernen (läuft automatisch)
 * 
 * @version 1.0
 */
'use strict';

class EinstellungenFixes {
    constructor() {
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.applyFixes());
        } else {
            setTimeout(() => this.applyFixes(), 100);
        }
        // console.log('✅ Einstellungen-Fixes initialisiert');
    }

    applyFixes() {
        // console.log('🔧 Wende Einstellungen-Fixes an...');

        this.fixSonderzeichen();
        this.convertAllCheckboxesToToggles();
        this.makeAllSlidersFunctional();
        this.removePerformanceSection();
        this.fixBluetoothIcon();
        this.setupSleepTimer();
        this.setupMusicAlarm();
        this.fixNotificationSettings();
        this.fixWidgetSettings();
        this.fixUISettings();
        this.injectToggleCSS();

        // console.log('✅ Einstellungen-Fixes angewendet');
    }

    fixSonderzeichen() {
        const fixes = {
            // Bluetooth-Icon Fix
            '□': '',
            '☐': '',
            // Umlaute
            'Erweiterte Benachrichtigungen': 'Erweiterte Benachrichtigungen',
            'Rich-Notifikation': 'Rich-Notification',
            'Notifikationsstil': 'Benachrichtigungsstil',
            // Fehlende Buchstaben
            'Ger te': 'Geräte',
            'Anzeige': 'Anzeige',
            'L schen': 'Löschen',
            'Hinzuf gen': 'Hinzufügen'
        };

        document.querySelectorAll('*').forEach(el => {
            if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                let text = el.textContent;
                let changed = false;
                Object.keys(fixes).forEach(wrong => {
                    if (text.includes(wrong)) {
                        text = text.replace(new RegExp(wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fixes[wrong]);
                        changed = true;
                    }
                });
                if (changed) el.textContent = text;
            }
        });

        // Spezielle Zeichen vor "Bluetooth" entfernen
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent.includes('Bluetooth')) {
                el.innerHTML = el.innerHTML.replace(/[□☐✗✕☒]?\s*Bluetooth/g, '<i class="fab fa-bluetooth-b"></i> Bluetooth');
            }
        });

        // console.log('✅ Sonderzeichen gefixt');
    }

    convertAllCheckboxesToToggles() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        let converted = 0;

        checkboxes.forEach(checkbox => {
            if (checkbox.classList.contains('toggle-converted')) return;
            if (checkbox.closest('.toggle-switch')) return;

            const wrapper = document.createElement('label');
            wrapper.className = 'toggle-switch';

            const slider = document.createElement('span');
            slider.className = 'toggle-slider';

            checkbox.classList.add('toggle-converted');

            const parent = checkbox.parentNode;
            parent.insertBefore(wrapper, checkbox);
            wrapper.appendChild(checkbox);
            wrapper.appendChild(slider);

            converted++;
        });

        // console.log(`✅ ${converted} Checkboxen zu Toggle-Switches konvertiert`);
    }

    makeAllSlidersFunctional() {
        const sliders = document.querySelectorAll('input[type="range"]');

        sliders.forEach(slider => {
            slider.disabled = false;
            slider.style.opacity = '1';
            slider.style.pointerEvents = 'auto';

            // Value-Anzeige aktualisieren
            slider.addEventListener('input', () => {
                const display = slider.parentElement.querySelector('.value, .slider-value');
                if (display) {
                    display.textContent = slider.value;
                }
            });
        });

        // console.log(`✅ ${sliders.length} Slider funktional gemacht`);
    }

    removePerformanceSection() {
        // Performance und Fehlerbehandlung entfernen - läuft automatisch
        const sections = document.querySelectorAll('.settings-section, .section');
        sections.forEach(section => {
            const title = section.querySelector('h2, h3, .section-title');
            if (title && (
                title.textContent.toLowerCase().includes('performance') ||
                title.textContent.toLowerCase().includes('fehlerbehandlung') ||
                title.textContent.toLowerCase().includes('ram') ||
                title.textContent.toLowerCase().includes('cpu')
            )) {
                section.style.display = 'none';
            }
        });

        // Einzelne RAM/CPU Einträge
        document.querySelectorAll('.setting-item, .option-item').forEach(item => {
            if (item.textContent.toLowerCase().includes('ram') ||
                item.textContent.toLowerCase().includes('cpu') ||
                item.textContent.toLowerCase().includes('optimierung')) {
                item.style.display = 'none';
            }
        });

        // console.log('✅ Performance-Sektion entfernt (läuft automatisch im Hintergrund)');
    }

    fixBluetoothIcon() {
        // Ersetze kaputte Icons vor "Bluetooth"
        document.querySelectorAll('*').forEach(el => {
            if (el.innerHTML && el.innerHTML.includes('Bluetooth')) {
                el.innerHTML = el.innerHTML.replace(
                    /[□☐✗✕☒⊠⬜]\s*(Bluetooth)/gi,
                    '<i class="fab fa-bluetooth-b" style="color: #4ecdc4;"></i> $1'
                );
            }
        });
    }

    setupSleepTimer() {
        const sleepSection = document.querySelector('#sleepTimer, [class*="sleep"]');
        if (!sleepSection) return;

        // Slider funktional machen
        const slider = sleepSection.querySelector('input[type="range"]');
        if (slider) {
            slider.disabled = false;
            slider.addEventListener('input', (e) => {
                const minutes = e.target.value;
                const display = sleepSection.querySelector('.time-display, .value');
                if (display) {
                    display.textContent = `${minutes} Minuten`;
                }
            });
        }

        // Toggle für Sleep Timer
        const header = sleepSection.querySelector('h3, .title, label');
        if (header && !header.querySelector('.toggle-switch')) {
            const toggle = this.createToggle('sleepTimerToggle', false, (checked) => {
                if (window.SleepTimerController) {
                    checked ? window.SleepTimerController.start() : window.SleepTimerController.stop();
                }
            });
            header.appendChild(toggle);
        }
    }

    setupMusicAlarm() {
        const alarmSection = document.querySelector('#musicAlarm, [class*="alarm"], [class*="wecker"]');
        if (!alarmSection) return;

        // Zeit-Input funktional
        const timeInput = alarmSection.querySelector('input[type="time"]');
        if (timeInput) {
            timeInput.addEventListener('change', (e) => {
                localStorage.setItem('musicAlarmTime', e.target.value);
            });

            // Gespeicherte Zeit laden
            const savedTime = localStorage.getItem('musicAlarmTime');
            if (savedTime) timeInput.value = savedTime;
        }

        // Playlist-Selector
        const playlistSelect = alarmSection.querySelector('select');
        if (playlistSelect) {
            // Playlists laden
            const playlists = JSON.parse(localStorage.getItem('userPlaylists') || '[]');
            playlistSelect.innerHTML = '<option value="">Playlist auswählen...</option>';
            playlists.forEach((pl, i) => {
                playlistSelect.innerHTML += `<option value="${i}">${pl.name}</option>`;
            });
        }

        // Sanfteinblenden Toggle
        const fadeLabel = alarmSection.querySelector('[class*="fade"], label');
        if (fadeLabel && fadeLabel.textContent.toLowerCase().includes('sanft')) {
            if (!fadeLabel.querySelector('.toggle-switch')) {
                const toggle = this.createToggle('fadeInToggle', true);
                fadeLabel.appendChild(toggle);
            }
        }
    }

    fixNotificationSettings() {
        // Alle Notification-bezogenen Einstellungen
        const notifItems = document.querySelectorAll('.setting-item, .option-item');

        notifItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes('benachrichtigung') ||
                text.includes('notification') ||
                text.includes('miniplayer') ||
                text.includes('sperrbildschirm')) {

                // Sicherstellen, dass Toggle vorhanden
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.closest('.toggle-switch')) {
                    const wrapper = document.createElement('label');
                    wrapper.className = 'toggle-switch';

                    const slider = document.createElement('span');
                    slider.className = 'toggle-slider';

                    checkbox.classList.add('toggle-converted');
                    checkbox.parentNode.insertBefore(wrapper, checkbox);
                    wrapper.appendChild(checkbox);
                    wrapper.appendChild(slider);
                }
            }
        });

        // Notifikationsstil Buttons funktional
        const styleButtons = document.querySelectorAll('[data-notif-style], .notif-style-btn');
        styleButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                styleButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                localStorage.setItem('notificationStyle', btn.dataset.notifStyle || btn.textContent.toLowerCase());
            };
        });
    }

    fixWidgetSettings() {
        // Widget-Einstellungen
        const widgetSection = document.querySelector('[class*="widget"], #widgets');
        if (!widgetSection) return;

        // Widget-Theme Buttons funktional
        const themeButtons = widgetSection.querySelectorAll('button, .theme-btn');
        themeButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });
    }

    fixUISettings() {
        // UI & Personalisierung
        const uiSection = document.querySelector('[class*="personali"], [class*="ui-settings"]');
        if (!uiSection) return;

        // Haupt-Toggle für UI-Sektion
        const header = uiSection.querySelector('h3, .section-title');
        if (header && !header.querySelector('.toggle-switch')) {
            const toggle = this.createToggle('uiSettingsToggle', true, (checked) => {
                const content = uiSection.querySelector('.section-content, .settings-list');
                if (content) {
                    content.style.display = checked ? '' : 'none';
                }
            });
            header.appendChild(toggle);
        }

        // Layout-Stil Buttons
        const layoutButtons = document.querySelectorAll('[data-layout], .layout-btn');
        layoutButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                layoutButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Farbschema Buttons
        const colorButtons = document.querySelectorAll('[data-color-scheme], .color-scheme-btn');
        colorButtons.forEach(btn => {
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                colorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const scheme = btn.dataset.colorScheme || btn.textContent.toLowerCase();
                document.body.setAttribute('data-theme', scheme);
            };
        });
    }

    createToggle(id, checked, onChange) {
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

    injectToggleCSS() {
        if (document.getElementById('einstellungen-toggle-css')) return;

        const style = document.createElement('style');
        style.id = 'einstellungen-toggle-css';
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

            /* Fix für komische Zeichen */
            .setting-item i.fab,
            .setting-item i.fas {
                color: #4ecdc4;
                margin-right: 8px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialisieren
window.EinstellungenFixes = new EinstellungenFixes();
// console.log('✅ Einstellungen-Fixes geladen');
