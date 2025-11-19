
/**
 * Globale Typdefinitionen für LED Native App
 * Hilft der IDE, globale Variablen zu erkennen und Fehler zu vermeiden.
 */

interface Window {
    // Controller Instanzen
    bleController: any;
    ledController: any;
    deviceManager: any;
    eventManager: any;
    scenesManager: any;
    musicLibrary: any;
    musicPlayer: any;
    musicUIController: any;
    NativeBridge: any;
    LEDAbstractionLayer: any;

    // Globale Funktionen aus app.js
    connectBluetooth: () => Promise<void>;
    sendColorToLED: (r: number, g: number, b: number) => Promise<boolean>;
    sendEffectToLED: (effectId: number, speed: number, intensity: number) => Promise<boolean>;
    setBrightnessLED: (brightness: number) => Promise<boolean>;
    toggleLEDPower: (isOn: boolean) => Promise<boolean>;
    setGlobalCurrentColor: (color: {r: number, g: number, b: number}) => void;
    navigateTo: (pageId: string) => void;
    updateBLEStatus: (isConnected: boolean) => void;
    deleteSavedColor: (index: number) => void;

    // Globale Variablen
    currentColor: {r: number, g: number, b: number};
}

// Globale Variablen auch direkt verfügbar machen
declare var bleController: any;
declare var ledController: any;
declare var deviceManager: any;
declare var eventManager: any;
declare var scenesManager: any;
declare var musicLibrary: any;
declare var musicPlayer: any;
declare var musicUIController: any;
declare var NativeBridge: any;
declare var LEDAbstractionLayer: any;
declare var currentColor: {r: number, g: number, b: number};

// Externe Bibliotheken
declare var Capacitor: any;
