# LED-NATIVE-APP: Memories & Installationsanleitung

## Memories (automatisch gesammelt)

### 1. Arbeitsordner-Regel
- **Hauptarbeitsordner:**
  `/mnt/4A3C303D3C30267B/eigene apps/endgültig led/new/Files_downloaded_by_AirDroid/GIT HUB VERSION/led-new`
  → Nur hier arbeiten, alle Änderungen hier!
- **Backup-Ordner:**
  `/mnt/4A3C303D3C30267B/eigene apps/endgültig led/new/Files_downloaded_by_AirDroid/led new`
  → Nur als Backup, niemals bearbeiten außer auf explizite Anweisung!

### 2. Git-Workflow
- Nach jeder Änderung automatisch:
  1. `git add .`
  2. `git commit -m "Beschreibung"`
  3. `git push origin main`
- Repo: https://github.com/lollypopp193/led-new.git
- Branch: main

### 3. Dateistruktur
- **Wichtige Dateien:**
  - index.html, pages/*.html, js/*.js, css/*.css, manifest.json, sw.js
- **Config-Dateien:**
  - .eslintrc.json, .htmlhintrc, .prettierrc, .editorconfig, .cspell.json, .gitignore
- **Ignorieren:**
  - node_modules/, package-lock.json, eslint.config.js

### 4. Capacitor Native App
- Capacitor Core & Android installiert
- Native Plugins: Filesystem, App, SplashScreen, StatusBar, Bluetooth LE
- capacitor-bridge.js & native-bridge.js für Web/Native-Kompatibilität
- android/ Ordner: Native Projekt
- www/: Build für App
- capacitor.config.json: Konfiguration
- Testen: test-native-app.html
- APK-Build: android/app/build/outputs/apk/debug/app-debug.apk

### 5. Entwicklungsstandards
- Jede Funktion klar getestet und dokumentiert
- Keine halben Lösungen, keine doppelten Funktionen
- Modular, nachvollziehbar, saubere Architektur
- UI/UX: logisch, barrierefrei, konsistent
- Sicherheit: Keine Passwörter im Code, nur notwendige Berechtigungen
- Jeder Commit muss Tests bestehen

---

## Installationsanleitung

### Voraussetzungen
- **Node.js** (empfohlen: LTS Version)
- **npm** (wird mit Node installiert)
- **Android Studio** (für Native Build & Emulator)
- **Git** (für Updates & Workflow)

### Installation
1. Terminal öffnen
2. In den Projektordner wechseln:
   ```
   cd LED-NATIVE-APP-CLEAN
   ```
3. Abhängigkeiten installieren:
   ```
   npm install
   ```

### Native Android APK bauen
1. In den android-Ordner wechseln:
   ```
   cd android
   ```
2. APK bauen:
   ```
   ./gradlew assembleDebug
   ```
3. Die fertige APK findest du unter:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. APK aufs Handy kopieren & installieren

### Wichtige npm-Dependencies (aus package.json)
- @capacitor/android
- @capacitor/app
- @capacitor/core
- @capacitor/filesystem
- @capacitor/haptics
- @capacitor/keyboard
- @capacitor/splash-screen
- @capacitor/status-bar
- @capacitor-community/bluetooth-le
- @capacitor/cli (dev)

### Sonstiges
- Keine weiteren Dateien oder Schritte nötig!
- Für Fragen: https://github.com/lollypopp193/led-new

---

**Dieses Dokument enthält alle wichtigen Regeln, Memories und Installationsinfos für das Projekt.**
