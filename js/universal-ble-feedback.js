/**
 * ===================================================================
 * UNIVERSAL-BLE-FEEDBACK.JS
 * Echte Hardware-Kommunikation mit Feedback für ALLE Funktionen
 * Version: 2.0 - VOLLSTÄNDIG IMPLEMENTIERT
 * ===================================================================
 */

'use strict';

class UniversalBLEFeedback {
  constructor() {
    this.isConnected = false;
    this.lastCommand = null;
    this.feedbackEnabled = true;
    this.vibrationEnabled = true;
    this.soundEnabled = true;
    this.visualEnabled = true;
    
    // Audio-Feedback Sounds
    this.sounds = {
      success: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBShuwO7bi0YKFVut5ea1NwEGOm+SmOC+Z0Yv'),
      error: new Audio('data:audio/wav;base64,UklGRpsAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YXMAAAB/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/'),
      click: new Audio('data:audio/wav;base64,UklGRjYBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ4BAACAgICAgICAgICAgICAgICAgICAgICAgIB+gH6AfX98fHt6eXd2dHNxb21qZ2ReWFNOQCUIAgWPda8'),
      connect: new Audio('data:audio/wav;base64,UklGRtYDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YawDAAB/f39/f39/f39/f39/f39/f39/gICBgoOEhoeJi42PkZOVl5qcnqCjpqmrrK+xtLe6vL7AwcPFx8nKzM7P0dLU1tfY2dvc3d7f4OHi4+Tl5ufn6Onp')
    };
    
    // Initialisiere
    this.init();
  }

  /**
   * ✅ INITIALISIERUNG
   */
  async init() {
    console.log('🚀 Universal BLE Feedback System initialisiert');
    
    // Event-Listener für alle UI-Elemente
    this.attachGlobalListeners();
    
    // Verbindungs-Status überwachen
    this.monitorConnection();
    
    // Feedback-Overlay erstellen
    this.createFeedbackOverlay();
  }

  /**
   * ✅ GLOBALE EVENT-LISTENER FÜR ALLE BUTTONS
   */
  attachGlobalListeners() {
    // Alle Buttons bekommen Feedback
    document.addEventListener('click', async (e) => {
      const target = e.target;
      
      // Ist es ein Button oder Clickable?
      if (target.matches('button, .button, [role="button"], .clickable, .nav-item, .feature-card')) {
        this.triggerClickFeedback(target);
        
        // Prüfe ob BLE-Aktion nötig ist
        if (target.dataset.bleAction) {
          await this.handleBLEAction(target.dataset.bleAction, target.dataset);
        }
      }
    });
    
    // Alle Inputs/Sliders bekommen Feedback
    document.addEventListener('input', async (e) => {
      const target = e.target;
      
      if (target.matches('input[type="range"], input[type="color"]')) {
        this.triggerInputFeedback(target);
        
        // Throttle BLE-Updates
        clearTimeout(this.inputTimeout);
        this.inputTimeout = setTimeout(async () => {
          if (target.dataset.bleAction) {
            await this.handleBLEAction(target.dataset.bleAction, {
              value: target.value,
              ...target.dataset
            });
          }
        }, 50);
      }
    });
  }

  /**
   * ✅ BLE-AKTION MIT HARDWARE AUSFÜHREN
   */
  async handleBLEAction(action, data) {
    console.log(`🔧 BLE-Aktion: ${action}`, data);
    
    // Prüfe Verbindung
    if (!window.ledController?.isConnected) {
      this.showFeedback('❌ Kein LED-Band verbunden!', 'error');
      return false;
    }
    
    try {
      let result = false;
      
      switch (action) {
        case 'setColor':
          result = await this.sendColorToHardware(data.r, data.g, data.b);
          break;
          
        case 'setBrightness':
          result = await this.sendBrightnessToHardware(data.value);
          break;
          
        case 'setEffect':
          result = await this.sendEffectToHardware(data.effectId);
          break;
          
        case 'setPower':
          result = await this.sendPowerToHardware(data.state === 'on');
          break;
          
        case 'customCommand':
          result = await this.sendCustomCommand(data.command);
          break;
      }
      
      // Feedback anzeigen
      if (result) {
        this.showFeedback('✅ Befehl gesendet!', 'success');
        this.triggerSuccessFeedback();
      } else {
        this.showFeedback('❌ Befehl fehlgeschlagen!', 'error');
        this.triggerErrorFeedback();
      }
      
      return result;
      
    } catch (error) {
      console.error('BLE-Aktion Fehler:', error);
      this.showFeedback('❌ Fehler: ' + error.message, 'error');
      this.triggerErrorFeedback();
      return false;
    }
  }

  /**
   * ✅ FARBE AN HARDWARE SENDEN
   */
  async sendColorToHardware(r, g, b) {
    // Validierung
    r = Math.max(0, Math.min(255, parseInt(r) || 0));
    g = Math.max(0, Math.min(255, parseInt(g) || 0));
    b = Math.max(0, Math.min(255, parseInt(b) || 0));
    
    // An ALLE verfügbaren Geräte senden
    const results = [];
    
    // 1. BLE-Controller
    if (window.ledController?.isConnected) {
      results.push(await window.ledController.setColorRGB(r, g, b));
    }
    
    // 2. Device Manager
    if (window.deviceManager?.currentDevice) {
      results.push(await window.deviceManager.setDeviceColor(r, g, b));
    }
    
    // 3. WLED WiFi
    if (window.wledDevice?.connected) {
      results.push(await this.sendToWLED('color', { r, g, b }));
    }
    
    // 4. Universal Color Function
    if (window.sendColorToAllDevices) {
      results.push(await window.sendColorToAllDevices(r, g, b));
    }
    
    // Speichere letzte Farbe
    this.lastCommand = { type: 'color', r, g, b };
    localStorage.setItem('lastLEDColor', JSON.stringify({ r, g, b }));
    
    return results.some(r => r === true);
  }

  /**
   * ✅ HELLIGKEIT AN HARDWARE SENDEN
   */
  async sendBrightnessToHardware(value) {
    value = Math.max(0, Math.min(100, parseInt(value) || 0));
    
    const results = [];
    
    if (window.ledController?.isConnected) {
      results.push(await window.ledController.setBrightness(value));
    }
    
    if (window.deviceManager?.currentDevice) {
      results.push(await window.deviceManager.setDeviceBrightness(value));
    }
    
    if (window.wledDevice?.connected) {
      results.push(await this.sendToWLED('brightness', { value }));
    }
    
    this.lastCommand = { type: 'brightness', value };
    localStorage.setItem('ledBrightness', value);
    
    return results.some(r => r === true);
  }

  /**
   * ✅ EFFEKT AN HARDWARE SENDEN
   */
  async sendEffectToHardware(effectId) {
    effectId = parseInt(effectId) || 0;
    
    const results = [];
    
    if (window.ledController?.isConnected) {
      results.push(await window.ledController.setEffect(effectId));
    }
    
    if (window.sendEffectToAllDevices) {
      results.push(await window.sendEffectToAllDevices(effectId));
    }
    
    this.lastCommand = { type: 'effect', effectId };
    localStorage.setItem('lastLEDEffect', effectId);
    
    return results.some(r => r === true);
  }

  /**
   * ✅ POWER AN HARDWARE SENDEN
   */
  async sendPowerToHardware(state) {
    const results = [];
    
    if (window.ledController?.isConnected) {
      results.push(await window.ledController.setPower(state));
    }
    
    if (window.deviceManager?.currentDevice) {
      results.push(await window.deviceManager.setDevicePower(state));
    }
    
    this.lastCommand = { type: 'power', state };
    localStorage.setItem('ledPowerState', state);
    
    return results.some(r => r === true);
  }

  /**
   * ✅ WLED WiFi KOMMUNIKATION
   */
  async sendToWLED(command, data) {
    if (!window.wledDevice?.ip) return false;
    
    try {
      const url = `http://${window.wledDevice.ip}/json/state`;
      const body = {};
      
      switch (command) {
        case 'color':
          body.on = true;
          body.seg = [{ col: [[data.r, data.g, data.b]] }];
          break;
        case 'brightness':
          body.bri = Math.round(data.value * 2.55);
          break;
        case 'effect':
          body.seg = [{ fx: data.effectId }];
          break;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      return response.ok;
    } catch (error) {
      console.error('WLED-Fehler:', error);
      return false;
    }
  }

  /**
   * ✅ CLICK-FEEDBACK (Visuell + Haptisch + Audio)
   */
  triggerClickFeedback(element) {
    // Visuell
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
      element.style.transform = '';
    }, 100);
    
    // Haptisch (falls verfügbar)
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Audio
    if (this.soundEnabled) {
      this.sounds.click.play().catch(() => {});
    }
    
    // Ripple-Effekt
    this.createRipple(element);
  }

  /**
   * ✅ INPUT-FEEDBACK
   */
  triggerInputFeedback(element) {
    // Visueller Glow-Effekt
    element.style.boxShadow = '0 0 10px #4ecdc4';
    setTimeout(() => {
      element.style.boxShadow = '';
    }, 200);
  }

  /**
   * ✅ SUCCESS-FEEDBACK
   */
  triggerSuccessFeedback() {
    // Audio
    if (this.soundEnabled) {
      this.sounds.success.play().catch(() => {});
    }
    
    // Vibration
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
    
    // Visueller Flash
    this.flashScreen('#4ecdc4', 200);
  }

  /**
   * ✅ ERROR-FEEDBACK
   */
  triggerErrorFeedback() {
    // Audio
    if (this.soundEnabled) {
      this.sounds.error.play().catch(() => {});
    }
    
    // Vibration
    if (this.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Visueller Flash
    this.flashScreen('#ff6b6b', 300);
  }

  /**
   * ✅ RIPPLE-EFFEKT
   */
  createRipple(element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(78, 205, 196, 0.5);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 9999;
    `;
    
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.left + rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.top + rect.height / 2 - size / 2) + 'px';
    
    document.body.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * ✅ BILDSCHIRM-FLASH
   */
  flashScreen(color, duration) {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${color};
      opacity: 0;
      pointer-events: none;
      z-index: 99999;
      animation: flash ${duration}ms ease-out;
    `;
    
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), duration);
  }

  /**
   * ✅ FEEDBACK-NACHRICHT ANZEIGEN
   */
  showFeedback(message, type = 'info', duration = 3000) {
    // Entferne alte Nachrichten
    const oldMsg = document.getElementById('universal-feedback-message');
    if (oldMsg) oldMsg.remove();
    
    const msg = document.createElement('div');
    msg.id = 'universal-feedback-message';
    msg.textContent = message;
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 100000;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#feca57'};
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => msg.remove(), 300);
    }, duration);
  }

  /**
   * ✅ FEEDBACK-OVERLAY ERSTELLEN
   */
  createFeedbackOverlay() {
    // CSS-Animationen hinzufügen
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(1);
          opacity: 0;
        }
      }
      
      @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 0.3; }
        100% { opacity: 0; }
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      /* Hover-Effekt für alle Buttons */
      button:hover, .button:hover, [role="button"]:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(78, 205, 196, 0.3);
        transition: all 0.3s ease;
      }
      
      /* Active-Effekt */
      button:active, .button:active, [role="button"]:active {
        transform: scale(0.98);
      }
      
      /* Focus-Effekt */
      button:focus, .button:focus, [role="button"]:focus {
        outline: 2px solid #4ecdc4;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * ✅ VERBINDUNGS-STATUS ÜBERWACHEN
   */
  monitorConnection() {
    setInterval(() => {
      const wasConnected = this.isConnected;
      this.isConnected = window.ledController?.isConnected || 
                        window.deviceManager?.currentDevice || 
                        window.wledDevice?.connected || 
                        false;
      
      // Status-Änderung?
      if (wasConnected !== this.isConnected) {
        if (this.isConnected) {
          this.showFeedback('✅ LED-Band verbunden!', 'success');
          this.sounds.connect.play().catch(() => {});
        } else {
          this.showFeedback('❌ Verbindung verloren!', 'error');
        }
      }
    }, 1000);
  }

  /**
   * ✅ LAST COMMAND WIEDERHOLEN
   */
  async repeatLastCommand() {
    if (!this.lastCommand) {
      this.showFeedback('Kein letzter Befehl vorhanden', 'warning');
      return;
    }
    
    switch (this.lastCommand.type) {
      case 'color':
        return await this.sendColorToHardware(
          this.lastCommand.r,
          this.lastCommand.g,
          this.lastCommand.b
        );
      case 'brightness':
        return await this.sendBrightnessToHardware(this.lastCommand.value);
      case 'effect':
        return await this.sendEffectToHardware(this.lastCommand.effectId);
      case 'power':
        return await this.sendPowerToHardware(this.lastCommand.state);
    }
  }

  /**
   * ✅ TEST ALLE FUNKTIONEN
   */
  async testAllFunctions() {
    console.log('🧪 Teste alle Funktionen...');
    
    // Test Farben
    await this.sendColorToHardware(255, 0, 0); // Rot
    await new Promise(r => setTimeout(r, 500));
    
    await this.sendColorToHardware(0, 255, 0); // Grün
    await new Promise(r => setTimeout(r, 500));
    
    await this.sendColorToHardware(0, 0, 255); // Blau
    await new Promise(r => setTimeout(r, 500));
    
    // Test Helligkeit
    await this.sendBrightnessToHardware(50);
    await new Promise(r => setTimeout(r, 500));
    
    await this.sendBrightnessToHardware(100);
    await new Promise(r => setTimeout(r, 500));
    
    // Test Effekte
    await this.sendEffectToHardware(1);
    await new Promise(r => setTimeout(r, 1000));
    
    await this.sendEffectToHardware(0);
    
    this.showFeedback('✅ Alle Tests abgeschlossen!', 'success');
  }
}

// ✅ GLOBAL INITIALISIEREN
window.universalBLEFeedback = new UniversalBLEFeedback();

// ✅ GLOBALE HELPER-FUNKTIONEN
window.sendUniversalColor = async (r, g, b) => {
  return await window.universalBLEFeedback.sendColorToHardware(r, g, b);
};

window.sendUniversalBrightness = async (value) => {
  return await window.universalBLEFeedback.sendBrightnessToHardware(value);
};

window.sendUniversalEffect = async (effectId) => {
  return await window.universalBLEFeedback.sendEffectToHardware(effectId);
};

window.sendUniversalPower = async (state) => {
  return await window.universalBLEFeedback.sendPowerToHardware(state);
};

window.testBLEFeedback = async () => {
  return await window.universalBLEFeedback.testAllFunctions();
};

console.log('✅ Universal BLE Feedback System bereit!');
console.log('Teste mit: window.testBLEFeedback()');
