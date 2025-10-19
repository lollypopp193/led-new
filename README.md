# 🌟 Lights Space World - LED Controller App

Eine moderne, progressive Web-App zur Steuerung von LED-Strips über Bluetooth BLE.

## 🚀 Features

- **🎨 Farbsteuerung** - RGB-Farbrad, Slider und vordefinierte Farben
- **✨ LED-Effekte** - Welle, Feuer, Matrix, Plasma und mehr
- **🎵 Musik-Integration** - Audio-reaktive LED-Synchronisation
- **⏰ Timer-System** - Zeitgesteuerte Automatisierung
- **⚙️ Einstellungen** - BLE-Konfiguration und Geräte-Management
- **💾 Backup** - Sicherung aller Einstellungen

## 📱 Mobile Nutzung

### Mit Termux (Android)
```bash
pkg install python -y
cd /storage/[pfad-zur-app]
python -m http.server 8080
```
Dann öffne: `http://localhost:8080`

### Wichtig für Bluetooth
- Benötigt HTTPS oder Chrome Flags
- Chrome: `chrome://flags` → "Insecure origins treated as secure" → `http://127.0.0.1:5500`

## 🛠️ Technologie-Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Bluetooth:** Web Bluetooth API
- **Audio:** Web Audio API
- **Storage:** LocalStorage
- **PWA:** Service Worker, Manifest

## 📁 Projekt-Struktur

```
led-new/
├── index.html          # Hauptapp mit Navigation
├── Farbe.html         # Farbsteuerung
├── Effekt.html        # LED-Effekte
├── musik.html         # Musik-Player & Sync
├── Timer.html         # Timer-System
├── Einstellungen.html # Konfiguration
├── backup.html        # Backup-System
├── js/               # JavaScript-Module
│   ├── app.js
│   ├── ble-controller-pro.js
│   ├── device-manager.js
│   ├── audio-reactive-engine.js
│   └── ...
├── css/              # Styles
│   └── shared-styles.css
└── manifest.json     # PWA-Konfiguration
```

## 🔧 Unterstützte LED-Controller

- **ELK-BLEDOM** (Standard BLE RGB Controller)
- **Generic BLE** LED Strips
- **WLED** (WiFi-basiert, in Vorbereitung)

## 🚀 Installation

1. **Clone Repository:**
```bash
git clone [repository-url]
cd led-new
```

2. **Lokaler Server starten:**
```bash
# Python
python -m http.server 8080

# Node.js
npx http-server -p 8080

# VS Code
Live Server Extension nutzen
```

3. **Browser öffnen:**
```
http://localhost:8080
```

## 📝 Lizenz

MIT License - Siehe LICENSE Datei für Details

## 🤝 Beitragen

Pull Requests sind willkommen! Für größere Änderungen bitte erst ein Issue öffnen.

## 📞 Support

Bei Fragen oder Problemen bitte ein Issue auf GitHub erstellen.

---

**Entwickelt mit ❤️ für die perfekte LED-Kontrolle**
