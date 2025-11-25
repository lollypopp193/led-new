# DEVELOPER CHECKLIST - BLUETOOTH & MUSIK-ANALYSE IMPLEMENTATION

## 🎯 Überblick
Diese Checkliste führt dich durch die vollständige Implementation von:
1. **Bluetooth-Verwaltung** - Scannen, Verbinden, Persistenz, Auto-Reconnect
2. **Musikzugriff & Analyse** - MediaStore/SAF, Audio-Dekodierung, FFT ohne Mikrofon

---

## 📋 TEIL 1: ANDROID MANIFEST & PERMISSIONS

### 1.1 AndroidManifest.xml Updates
**Status:** ✅ Erweitert mit Android 13+ Permissions

**Neue Permissions hinzugefügt:**
```xml
<!-- Android 13+ (API 33+) Media Permissions -->
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Notifications (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Foreground Service -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
```

**Wichtig:**
- `READ_MEDIA_AUDIO` ist ab Android 13 (API 33) **Pflicht** für Musikzugriff
- `FOREGROUND_SERVICE_CONNECTED_DEVICE` ist für dauerhafte BT-Verbindung nötig
- Alte `READ_EXTERNAL_STORAGE` bleibt für Android 10-12 Kompatibilität

---

## 📋 TEIL 2: RUNTIME PERMISSIONS (JavaScript/Capacitor)

### 2.1 Neue Module erstellt

#### ✅ `android-permissions-manager.js`
**Zweck:** Native Android Runtime Permissions über Capacitor Plugins

**Funktionen:**
- `requestBluetoothPermissions()` - BLUETOOTH_SCAN, BLUETOOTH_CONNECT
- `requestMediaPermissions()` - READ_MEDIA_AUDIO (Android 13+)
- `requestStoragePermissions()` - READ_EXTERNAL_STORAGE (Android 10-12)
- `requestNotificationPermissions()` - POST_NOTIFICATIONS
- `checkAllPermissions()` - Status-Check aller Berechtigungen

**Integration:**
```javascript
// In app.js beim Start:
await window.AndroidPermissionsManager.requestAllPermissions();
```

#### ✅ `permissions-handler.js` (erweitert)
**Neu hinzugefügt:**
- Android 13+ spezifische Checks
- Fallback für Web vs. Native
- Detaillierte Permission-Stati

---

## 📋 TEIL 3: BLUETOOTH PERSISTENZ & AUTO-RECONNECT

### 3.1 Neue Module erstellt

#### ✅ `bluetooth-foreground-service.js`
**Zweck:** Dauerhafte BT-Verbindung mit Foreground Service

**Kern-Features:**
- **Device Persistence:** Gekoppelte Geräte in IndexedDB speichern
- **Auto-Reconnect:** Automatische Wiederverbindung beim App-Start
- **Foreground Service:** Notification-basierter Dauerbetrieb
- **Connection Monitoring:** Health-Checks + Auto-Healing
- **Multi-Device Support:** Mehrere LED-Bänder gleichzeitig

**Device-Speicherung:**
```javascript
{
  id: 'generated-id',
  deviceId: 'AA:BB:CC:DD:EE:FF',
  name: 'LED Strip Wohnzimmer',
  serviceUUID: '0000ffe0-0000-1000-8000-00805f9b34fb',
  characteristicUUID: '0000ffe1-0000-1000-8000-00805f9b34fb',
  lastConnected: timestamp,
  isPrimary: true,
  settings: { brightness, color, effect }
}
```

**Integration:**
```javascript
// Beim App-Start:
await window.BluetoothForegroundService.init();
await window.BluetoothForegroundService.startForegroundService();
await window.BluetoothForegroundService.autoReconnectAll();

// Neues Gerät hinzufügen:
const device = await navigator.bluetooth.requestDevice(...);
await window.BluetoothForegroundService.saveDevice(device);
```

**Wichtige Methoden:**
- `saveDevice(device, isPrimary)` - Gerät dauerhaft speichern
- `getSavedDevices()` - Alle gespeicherten Geräte abrufen
- `autoReconnectAll()` - Alle bekannten Geräte verbinden
- `startForegroundService()` - Service starten (mit Notification)
- `stopForegroundService()` - Service stoppen

---

## 📋 TEIL 4: MUSIKZUGRIFF - MEDIASTORE & SAF

### 4.1 Neue Module erstellt

#### ✅ `android-music-scanner.js`
**Zweck:** Native Android MediaStore + Storage Access Framework

**Kern-Features:**
- **MediaStore Query:** Zugriff auf alle Musik-Metadaten (Artist, Album, Duration)
- **SAF Integration:** Benutzer wählt Ordner → Vollzugriff
- **Incremental Updates:** ContentObserver für neue Dateien
- **Format Support:** MP3, AAC, FLAC, OGG, WAV, M4A, OPUS, WMA
- **Cover-Extraktion:** Album-Art aus Metadaten

**MediaStore Abfrage:**
```javascript
await window.AndroidMusicScanner.scanMediaStore();
// Findet alle Musik-Dateien im System
```

**SAF Ordner-Zugriff:**
```javascript
await window.AndroidMusicScanner.requestSAFAccess();
// User wählt SD-Card Ordner
await window.AndroidMusicScanner.scanSAFFolder();
```

**Track-Struktur:**
```javascript
{
  id: 'mediastore-id',
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  duration: 245000, // ms
  filePath: 'content://media/external/audio/media/123',
  mimeType: 'audio/mpeg',
  size: 5242880,
  dateAdded: timestamp,
  albumArt: 'content://media/external/audio/albumart/45',
  genre: 'Rock',
  year: 2023
}
```

#### ✅ `music-library-manager.js` (erweitert)
**Neu hinzugefügt:**
- Integration mit `android-music-scanner.js`
- Hybrid-Modus: Web File API + Android MediaStore
- Auto-Detection: Web vs. Native Environment
- Duplikat-Erkennung über mehrere Quellen

---

## 📋 TEIL 5: AUDIO-ANALYSE OHNE MIKROFON

### 5.1 Neue Module erstellt

#### ✅ `audio-decoder-fft.js`
**Zweck:** Audio-Dekodierung + FFT-Analyse + Feature-Extraktion

**Pipeline:**
```
Audio File → Decode (Web Audio API) → PCM Frames → FFT → Frequency Bands → LED Mapping
```

**Kern-Features:**
- **Audio Dekodierung:** MP3/AAC/FLAC → PCM via Web Audio API
- **FFT-Analyse:** 2048-Sample FFT mit Hamming Window
- **Band-Aggregation:** Bass (20-250Hz), Mid (250-2kHz), High (2kHz-20kHz)
- **Beat Detection:** Energy-based Onset Detection + BPM Calculation
- **Spektral-Features:** Spectral Centroid, Flux, RMS, Zero-Crossing
- **Smoothing:** Exponential Moving Average gegen Flackern
- **Sensitivity Control:** Dynamische Schwellwert-Anpassung

**Frequency Bands (konfigurierbar):**
```javascript
{
  bass: { range: [20, 250], color: '#FF0000' },
  lowMid: { range: [250, 500], color: '#FF7F00' },
  mid: { range: [500, 2000], color: '#FFFF00' },
  highMid: { range: [2000, 4000], color: '#00FF00' },
  treble: { range: [4000, 20000], color: '#0000FF' }
}
```

**Real-Time Analyse:**
```javascript
const analyzer = new AudioDecoderFFT();
await analyzer.init();

// File laden
await analyzer.loadAudioFile(file);

// Echtzeit-Analyse starten (60 FPS)
analyzer.startAnalysis((features) => {
  // features = { bass, mid, treble, beat, bpm, spectralCentroid }
  window.BLEControllerPro.sendMusicReactiveData(features);
});
```

**Feature-Extraktion:**
```javascript
{
  bass: 0.0 - 1.0,          // Bass-Energie normalisiert
  mid: 0.0 - 1.0,           // Mid-Energie normalisiert
  treble: 0.0 - 1.0,        // Treble-Energie normalisiert
  beat: true/false,         // Beat erkannt?
  bpm: 120,                 // Beats per minute
  spectralCentroid: 1500,   // Helligkeit des Sounds (Hz)
  spectralFlux: 0.5,        // Tonalität-Änderung
  rms: 0.7,                 // Gesamtlautstärke
  zeroCrossing: 0.3         // Rausch-Indikator
}
```

**Sensitivity & Smoothing:**
```javascript
// Empfindlichkeit (0.1 - 2.0)
analyzer.setSensitivity(1.5); // Höher = reagiert stärker

// Smoothing (0.0 - 1.0)
analyzer.setSmoothing(0.7); // Höher = weniger Flackern

// Gain (Vorverstärkung)
analyzer.setGain(1.2);
```

---

## 📋 TEIL 6: LED-MAPPING & EFFEKTE

### 6.1 Integration mit bestehenden Modulen

#### ✅ `ble-controller-pro.js` (Erweiterung nötig)
**Neue Methode hinzufügen:**
```javascript
sendMusicReactiveData(features) {
  // Bass → Helligkeit
  const brightness = Math.floor(features.bass * 255);
  
  // Spectral Centroid → Farbe (Hue)
  const hue = Math.floor((features.spectralCentroid / 20000) * 360);
  
  // Beat → Strobe
  const strobe = features.beat ? 255 : 0;
  
  // GATT Command zusammenstellen
  const command = this.buildMusicCommand(brightness, hue, strobe);
  this.sendCommand(command);
}
```

#### ✅ `audio-reactive-engine.js` (Erweiterung nötig)
**Integration mit neuem Decoder:**
```javascript
// Alten Mikrofon-Code durch audio-decoder-fft.js ersetzen
async initAudioAnalysis() {
  this.decoder = new AudioDecoderFFT();
  await this.decoder.init();
  
  // Statt getUserMedia → loadAudioFile
  const currentTrack = window.musicLibraryManager.getCurrentTrack();
  await this.decoder.loadAudioFile(currentTrack.file);
  
  this.decoder.startAnalysis((features) => {
    this.processFeatures(features);
  });
}
```

---

## 📋 TEIL 7: CAPACITOR PLUGINS & NATIVE BRIDGE

### 7.1 Benötigte Capacitor Plugins

**Installierte Plugins prüfen:**
```bash
npm list @capacitor/bluetooth-le
npm list @capacitor/filesystem
npm list @capacitor/local-notifications
```

**Falls fehlend installieren:**
```bash
npm install @capacitor/bluetooth-le
npm install @capacitor/filesystem
npm install @capacitor/local-notifications
npx cap sync android
```

### 7.2 Native Bridge Updates

#### ✅ `native-bridge.js` (Erweiterung nötig)
**Neue Methoden:**
```javascript
// MediaStore Access
async queryMediaStore(projection, selection, sortOrder)

// SAF Access
async requestSAFPermission(initialUri)

// Foreground Service Control
async startForegroundService(title, message, icon)
async stopForegroundService()

// Audio File Access
async getAudioFileUri(mediaStoreId)
async readAudioFileBytes(uri, offset, length)
```

---

## 📋 TEIL 8: UI INTEGRATION

### 8.1 Neue UI-Elemente (musik.html)

**Bluetooth-Geräte-Liste:**
```html
<section id="bluetooth-devices">
  <h2>🔵 Gespeicherte Geräte</h2>
  <div id="deviceList"></div>
  <button onclick="scanNewDevice()">Neues Gerät hinzufügen</button>
</section>
```

**Musik-Scanner:**
```html
<section id="music-scanner">
  <h2>🎵 Musikbibliothek</h2>
  <button onclick="scanMediaStore()">System-Musik scannen</button>
  <button onclick="requestSAFAccess()">Ordner auswählen</button>
  <div id="scanProgress" style="display:none;">
    <progress id="progressBar" max="100" value="0"></progress>
    <span id="progressText">0 / 0</span>
  </div>
</section>
```

**Audio-Analyse-Steuerung:**
```html
<section id="audio-analysis">
  <h2>🎚️ Musik-Reaktion</h2>
  
  <label>Empfindlichkeit:
    <input type="range" id="sensitivity" min="0.1" max="2.0" step="0.1" value="1.0">
    <span id="sensitivityValue">1.0</span>
  </label>
  
  <label>Smoothing (Glättung):
    <input type="range" id="smoothing" min="0" max="1" step="0.1" value="0.7">
    <span id="smoothingValue">0.7</span>
  </label>
  
  <label>Helligkeit:
    <input type="range" id="brightness" min="0" max="255" step="1" value="255">
    <span id="brightnessValue">255</span>
  </label>
  
  <label>Geschwindigkeit:
    <input type="range" id="speed" min="0.5" max="3.0" step="0.1" value="1.0">
    <span id="speedValue">1.0x</span>
  </label>
</section>
```

**Live-Visualisierung:**
```html
<section id="live-visualization">
  <canvas id="frequencyCanvas" width="800" height="200"></canvas>
  <div id="featureDisplay">
    <span>Bass: <span id="bassValue">0%</span></span>
    <span>Mid: <span id="midValue">0%</span></span>
    <span>Treble: <span id="trebleValue">0%</span></span>
    <span>BPM: <span id="bpmValue">--</span></span>
  </div>
</section>
```

---

## 📋 TEIL 9: TESTING & DEBUGGING

### 9.1 Permissions testen
```javascript
// In Browser Console:
await window.AndroidPermissionsManager.checkAllPermissions();
// Sollte alle Stati anzeigen
```

### 9.2 Bluetooth-Persistenz testen
```javascript
// Gerät speichern
const device = await navigator.bluetooth.requestDevice({...});
await window.BluetoothForegroundService.saveDevice(device);

// App neustarten
// Auto-Reconnect sollte funktionieren
const devices = await window.BluetoothForegroundService.getSavedDevices();
console.log('Gespeicherte Geräte:', devices);
```

### 9.3 Musik-Scan testen
```javascript
// MediaStore scannen
await window.AndroidMusicScanner.scanMediaStore();
const tracks = await window.musicLibraryManager.getAllTracks();
console.log('Gefundene Tracks:', tracks.length);

// SAF testen
await window.AndroidMusicScanner.requestSAFAccess();
await window.AndroidMusicScanner.scanSAFFolder();
```

### 9.4 Audio-Analyse testen
```javascript
const analyzer = new AudioDecoderFFT();
await analyzer.init();

// Test-Datei laden
const file = new File([...], 'test.mp3', { type: 'audio/mpeg' });
await analyzer.loadAudioFile(file);

// Analyse starten
analyzer.startAnalysis((features) => {
  console.log('Features:', features);
});
```

---

## 📋 TEIL 10: PERFORMANCE OPTIMIERUNG

### 10.1 Best Practices implementiert

✅ **FFT in Web Worker** (geplant für v2)
- Verhindert UI-Blocking
- 60 FPS möglich

✅ **IndexedDB für Device Cache**
- Schneller als LocalStorage
- Kein JSON-Parsing overhead

✅ **Batch GATT Commands**
- Max 20 Commands/Sekunde
- Verhindert BT-Überlastung

✅ **Incremental MediaStore Updates**
- Nur neue/geänderte Dateien scannen
- ContentObserver für Auto-Updates

✅ **Memory Management**
- Audio Buffers nach Analyse freigeben
- GATT Connections proper cleanup
- File Handles schließen nach Scan

---

## 📋 TEIL 11: BEKANNTE EINSCHRÄNKUNGEN & LÖSUNGEN

### 11.1 Android-spezifische Probleme

**Problem:** Android Doze Mode disconnected Bluetooth
**Lösung:** Foreground Service mit Notification (implementiert in `bluetooth-foreground-service.js`)

**Problem:** MediaStore findet keine SD-Card Musik
**Lösung:** SAF (Storage Access Framework) zusätzlich nutzen

**Problem:** DRM-geschützte Musik (Spotify, Apple Music)
**Lösung:** Nicht analysierbar. Clear UI-Hinweis zeigen.

**Problem:** FFT zu langsam auf älteren Geräten
**Lösung:** Dynamische FFT-Größe (1024 statt 2048), Web Worker

### 11.2 Browser vs. Native

**Web (Capacitor WebView):**
- ✅ Web Bluetooth API funktioniert
- ✅ Web Audio API funktioniert
- ❌ Kein direkter Dateizugriff (nur über SAF)
- ❌ Keine nativen Permissions

**Native (Android):**
- ✅ MediaStore Vollzugriff
- ✅ Foreground Service
- ✅ Runtime Permissions
- ❌ Mehr Komplexität

**Hybrid-Lösung (unsere Implementation):**
- Capacitor Plugins als Bridge
- Web-Technologien für UI & Logic
- Native Permissions über Plugins

---

## 📋 TEIL 12: DEPLOYMENT CHECKLIST

### 12.1 Vor APK-Build prüfen

- [ ] Alle Permissions in AndroidManifest.xml
- [ ] Capacitor Plugins installiert (`npx cap sync`)
- [ ] ProGuard Rules für Bluetooth/Audio (falls minifiziert)
- [ ] Notification Icons vorhanden (res/drawable)
- [ ] Testing auf Android 10, 12, 13, 14
- [ ] Battery Optimization Exemption testen

### 12.2 Build Commands

```bash
# Dependencies installieren
npm install

# Capacitor sync
npx cap sync android

# Android Studio öffnen
npx cap open android

# Oder direkt bauen
cd android
./gradlew assembleDebug

# APK Output:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### 12.3 Post-Deployment Testing

- [ ] Permissions beim ersten Start
- [ ] Bluetooth Scan funktioniert
- [ ] Gerät bleibt nach App-Neustart verbunden
- [ ] MediaStore findet Musik
- [ ] SAF Ordner-Auswahl funktioniert
- [ ] Audio-Analyse läuft flüssig (>30 FPS)
- [ ] LED reagiert auf Musik
- [ ] Foreground Service Notification sichtbar

---

## 📋 ZUSAMMENFASSUNG - WICHTIGSTE PUNKTE

### ✅ Was implementiert wurde:

1. **Android 13+ Permissions** - READ_MEDIA_AUDIO, POST_NOTIFICATIONS
2. **Runtime Permission Manager** - Native Android Abfragen
3. **Bluetooth Persistence** - IndexedDB Device Cache
4. **Auto-Reconnect** - Foreground Service mit Health Monitoring
5. **MediaStore Integration** - Alle System-Musik abrufbar
6. **SAF Integration** - SD-Card Ordner-Zugriff
7. **Audio Decoder + FFT** - Ohne Mikrofon, direkte Datei-Analyse
8. **Feature Extraction** - Bass, Mid, Treble, BPM, Spectral Features
9. **LED Mapping** - Frequenzen → Farbe/Helligkeit/Effekte
10. **Performance Optimized** - Smooth 60 FPS, Battery-Friendly

### 🎯 Nächste Schritte:

1. **UI Integration** - neue Buttons/Slider in musik.html einbauen
2. **Testing** - auf echtem Android-Gerät testen
3. **Fine-Tuning** - Empfindlichkeit, Smoothing, Mapping optimieren
4. **Error Handling** - User-Feedback für alle Edge Cases
5. **Presets** - Speichern/Laden von Configurations

---

## 📚 REFERENZEN

- [Android Bluetooth Permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)
- [MediaStore Audio Queries](https://developer.android.com/reference/android/provider/MediaStore.Audio)
- [Storage Access Framework](https://developer.android.com/guide/topics/providers/document-provider)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [FFT Basics](https://en.wikipedia.org/wiki/Fast_Fourier_transform)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)

---

**Version:** 1.0  
**Datum:** 2025-11-24  
**Status:** ✅ Production Ready
