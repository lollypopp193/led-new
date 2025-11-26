# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

## [3.0.0] - 2024-11-26

### ✨ Added - Neue Features

**Auto-Start Manager:**
- Automatische Berechtigungsanfragen beim App-Start (Bluetooth → Standort → Speicher → Audio)
- BLE Auto-Connect zu gespeicherten Geräten
- BLE Auto-Scan im Hintergrund (5 Sekunden)
- Musik-Bibliothek Auto-Scan (Android MediaStore)
- Intro wird nach erstem Start übersprungen
- "Szene erstellt/geladen" Benachrichtigungen werden beim Start versteckt

**Genre-Erkennung:**
- 12 Musik-Genres statt 4: Dubstep, Drum'n'Bass, Hardstyle, Hardcore, Uptempo, House, Electronic, Rock, Pop, Jazz, Classic, Unknown
- BPM-basierte Erkennung für elektronische Genres
- Bass/Treble/Mid/Vocal-Ratio-Analyse
- History-basierte Stabilisierung (30 Samples)

**Slider Live-Werte v3.0:**
- Zeit-Formate: Sekunden (0.0s), Minuten:Sekunden (5:30), Stunden:Minuten:Sekunden (1:30:00)
- dB-Format mit +/- Vorzeichen für Equalizer (-12dB bis +12dB)
- Prozent-Format für Helligkeit, Lautstärke, Empfindlichkeit
- Multiplikator-Format für Geschwindigkeit (0.5x bis 3.0x)
- Auto-Erkennung anhand Slider-ID
- DOM-Observer für dynamisch hinzugefügte Slider
- Visuelles Feedback beim Bewegen

### 🔧 Changed - Änderungen

**UI-Cleanup:**
- "LED-Bänder scannen" Button entfernt (Auto-Scan beim Start)
- "Nahtlose" aus "Nahtlose Überblendung" entfernt → "Überblendung"
- "Nahtlose" aus "Nahtlose Wiedergabe" entfernt → "Wiedergabe"
- "Hierarchische Gruppen" Section entfernt (unnötig)
- "Pixel-Level-Kontrolle" Section entfernt (unnötig)

**Umlaut-Fixes:**
- 15+ Umlaut-Ersetzungen: ausgewählt, Nächster, hinzufügen, Zurücksetzen, Intensität, Glättung, Wähle, möchtest, Lautstärke, überblendung, für, Künstler, ändern, geändert, Verstärkt, Bässe
- Alle UE→Ü, AE→Ä, OE→Ö korrekt dargestellt

**Module-Integration:**
- 12 Core-Module in alle Sub-Pages integriert (farbe.html, effekt.html, musik.html, timer.html, einstellungen.html)
- umlaut-fixer.js, toggle-switch-manager.js, slider-live-values.js, ui-cleanup-manager.js, multi-language-support.js, ble-error-fixer.js, title-style-unifier.js, visualization-manager.js, music-library-navigation.js, playlist-manager.js, led-sidebar-swipe.js, auto-start-manager.js

### 🐛 Fixed - Bugfixes

- BLE-Scan Button entfernt - jetzt automatisch beim Start
- Slider-Werte werden jetzt live angezeigt
- Umlaute werden korrekt dargestellt
- Genre-Erkennung funktioniert für alle Musikrichtungen
- Auto-Connect zu gespeicherten BLE-Geräten funktioniert

### 🚀 Performance

- Command-Batching für BLE (max. 50 Befehle/Sekunde)
- Debouncing für Slider (50ms Verzögerung)
- Throttling für Audio-Analyse
- DOM-Observer mit Performance-Optimierung

### 📱 Commits

1. **d881deb** - Core-Module in alle Pages integriert
2. **6386976** - Umlaute korrigiert + UI-Cleanup
3. **629ef0c** - Genre-Erkennung massiv erweitert (12 Genres)
4. **031a183 + 49dd464** - Slider Live-Werte v3.0
5. **b9328be** - Auto-Start Manager + Auto-Connect + Auto-Scan

---

## [2.0.0] - 2024-11-XX

### Added
- Musik-Reaktiv Engine ohne Mikrofon
- Multi-Band LED-Steuerung (1-10 Bänder)
- Equalizer mit Bass-Boost
- Crossfade-Controller
- Sleep-Timer
- Szenen-System

### Changed
- Komplette Code-Refaktorierung
- Modular aufgebaut (71 JS-Dateien)
- Zero Tolerance Policy implementiert

### Fixed
- BLE-Verbindungsprobleme
- Performance-Optimierungen
- Memory-Leaks behoben

---

## [1.0.0] - 2024-XX-XX

### Added
- Initiales Release
- Basis LED-Steuerung
- Farb-Picker
- Effekte
- Timer
- Einstellungen
- Bluetooth LE Unterstützung
