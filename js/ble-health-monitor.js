/**
 * ===================================================================
 * BLE-HEALTH-MONITOR.JS
 * Erweiterte Fehlerbehandlung & Monitoring für BLE-Controller
 * ===================================================================
 *
 * Funktionen:
 * - Command Queue (verhindert Überschneidungen)
 * - Health Check (kontinuierliche Überwachung)
 * - Fehler-Statistik & Logging
 * - Automatische Diagnose & Auto-Fix
 *
 * ===================================================================
 */

'use strict';

// ===================================================================
// COMMAND QUEUE SYSTEM
// ===================================================================

class CommandQueue {
  constructor(bleController) {
    this.controller = bleController;
    this.queue = [];
    this.isProcessing = false;
    this.maxQueueSize = 50;
  }

  /**
   * Fügt Befehl zur Queue hinzu
   */
  async enqueue(command, priority = 'normal') {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn('⚠️ Command Queue voll - ältester Befehl wird verworfen');
      this.queue.shift();
    }

    const queueItem = {
      command,
      priority,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    // Priority Queue: High Priority nach vorne
    if (priority === 'high') {
      this.queue.unshift(queueItem);
    } else {
      this.queue.push(queueItem);
    }

    console.log(`📋 Befehl zur Queue hinzugefügt (${this.queue.length} in Queue)`);

    // Starte Verarbeitung falls noch nicht aktiv
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Verarbeitet Queue sequentiell
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        console.log(`⚙️ Verarbeite Befehl (${this.queue.length} verbleibend)`);

        const success = await this.controller.sendCommand(item.command);

        if (success) {
          // Erfolgreich - entferne aus Queue
          this.queue.shift();
        } else {
          // Fehlgeschlagen - Retry
          item.retries++;

          if (item.retries >= item.maxRetries) {
            console.error(`❌ Befehl nach ${item.maxRetries} Versuchen verworfen`);
            this.queue.shift();
          } else {
            console.warn(`⚠️ Retry ${item.retries}/${item.maxRetries}`);
            // An Ende der Queue verschieben für späteren Retry
            this.queue.push(this.queue.shift());
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('❌ Queue-Verarbeitung Fehler:', error);
        this.queue.shift();
      }
    }

    this.isProcessing = false;
    console.log('✅ Command Queue leer');
  }

  /**
   * Löscht Queue
   */
  clear() {
    this.queue = [];
    console.log('🗑️ Command Queue geleert');
  }

  /**
   * Queue-Status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      oldestCommand: this.queue[0] ? (Date.now() - this.queue[0].timestamp) : 0
    };
  }
}

// ===================================================================
// HEALTH CHECK SYSTEM
// ===================================================================

class HealthMonitor {
  constructor(bleController) {
    this.controller = bleController;
    this.interval = null;
    this.checkIntervalMs = 10000; // 10 Sekunden
    this.lastCheckTime = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
  }

  /**
   * Startet Health Check
   */
  start() {
    if (this.interval) {
      this.stop();
    }

    console.log('🏥 Health Monitor gestartet');

    this.interval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkIntervalMs);

    // Sofort ersten Check
    this.performHealthCheck();
  }

  /**
   * Stoppt Health Check
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🛑 Health Monitor gestoppt');
    }
  }

  /**
   * Führt Health Check durch
   */
  async performHealthCheck() {
    this.lastCheckTime = Date.now();

    if (!this.controller.isConnected) {
      console.warn('⚠️ Health Check: Nicht verbunden');
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        console.error('❌ Health Check: Zu viele Fehler - versuche Wiederverbindung');
        await this.controller.attemptReconnect();
        this.consecutiveFailures = 0;
      }
      return;
    }

    try {
      // Prüfe GATT-Verbindung
      if (!this.controller.device || !this.controller.device.gatt.connected) {
        console.warn('⚠️ Health Check: GATT getrennt');
        this.consecutiveFailures++;

        if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
          await this.controller.reconnect();
          this.consecutiveFailures = 0;
        }
        return;
      }

      // Verbindung OK
      console.log('✅ Health Check: Verbindung OK');
      this.consecutiveFailures = 0;

      // Zeige Statistik
      const stats = this.controller.stats;
      const uptime = stats.connectionStartTime ?
        Math.floor((Date.now() - stats.connectionStartTime) / 1000) : 0;
      const successRate = stats.commandsSent > 0 ?
        ((stats.commandsSent - stats.commandsFailed) / stats.commandsSent * 100).toFixed(1) : 100;

      console.log(`📊 Stats: ${stats.commandsSent} Befehle | ${successRate}% Erfolg | ${uptime}s Uptime`);

    } catch (error) {
      console.error('❌ Health Check Fehler:', error);
      this.consecutiveFailures++;
    }
  }

  /**
   * Health Status abrufen
   */
  getStatus() {
    return {
      isRunning: this.interval !== null,
      lastCheck: this.lastCheckTime,
      consecutiveFailures: this.consecutiveFailures,
      nextCheck: this.lastCheckTime ? this.lastCheckTime + this.checkIntervalMs : null
    };
  }
}

// ===================================================================
// ERROR LOGGER
// ===================================================================

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.warningThreshold = 10; // Warnung bei 10 Fehlern in 1 Min
  }

  /**
   * Loggt Fehler
   */
  log(error, context = '') {
    const errorEntry = {
      message: error.message || String(error),
      context: context,
      timestamp: Date.now(),
      stack: error.stack
    };

    this.errors.push(errorEntry);

    // Begrenze Array-Größe
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Prüfe Fehlerrate
    this.checkErrorRate();

    console.error(`🐛 [${context}] ${errorEntry.message}`);
  }

  /**
   * Prüft Fehlerrate
   */
  checkErrorRate() {
    const oneMinuteAgo = Date.now() - 60000;
    const recentErrors = this.errors.filter(e => e.timestamp > oneMinuteAgo);

    if (recentErrors.length >= this.warningThreshold) {
      console.warn(`⚠️ WARNUNG: ${recentErrors.length} Fehler in der letzten Minute!`);

      if (window.showGlobalNotification) {
        window.showGlobalNotification(
          `Viele Fehler erkannt (${recentErrors.length}/min). Bitte Verbindung prüfen!`,
          'warning'
        );
      }
    }
  }

  /**
   * Gibt letzte Fehler zurück
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count).reverse();
  }

  /**
   * Löscht Fehlerlog
   */
  clear() {
    this.errors = [];
    console.log('🗑️ Fehlerlog gelöscht');
  }

  /**
   * Exportiert Fehlerlog
   */
  export() {
    const data = {
      timestamp: new Date().toISOString(),
      totalErrors: this.errors.length,
      errors: this.errors
    };

    return JSON.stringify(data, null, 2);
  }
}

// ===================================================================
// AUTO-FIX SYSTEM
// ===================================================================

class AutoFix {
  constructor(bleController) {
    this.controller = bleController;
    this.fixAttempts = 0;
    this.maxFixAttempts = 3;
  }

  /**
   * Versucht automatische Fehlerbehebung
   */
  async attemptFix(errorType) {
    if (this.fixAttempts >= this.maxFixAttempts) {
      console.error('❌ Auto-Fix: Maximale Versuche erreicht');
      return false;
    }

    this.fixAttempts++;
    console.log(`🔧 Auto-Fix Versuch ${this.fixAttempts}/${this.maxFixAttempts}: ${errorType}`);

    switch (errorType) {
      case 'connection_lost':
        return await this.fixConnectionLost();

      case 'gatt_error':
        return await this.fixGattError();

      case 'timeout':
        return await this.fixTimeout();

      case 'command_failed':
        return await this.fixCommandFailed();

      default:
        console.warn('⚠️ Auto-Fix: Unbekannter Fehlertyp');
        return false;
    }
  }

  /**
   * Fix: Verbindung verloren
   */
  async fixConnectionLost() {
    console.log('🔧 Fix: Wiederverbindung...');
    return await this.controller.attemptReconnect();
  }

  /**
   * Fix: GATT Fehler
   */
  async fixGattError() {
    console.log('🔧 Fix: GATT Reset...');

    try {
      if (this.controller.device && this.controller.device.gatt) {
        await this.controller.device.gatt.disconnect();
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await this.controller.reconnect();
      }
    } catch (error) {
      console.error('❌ GATT Fix fehlgeschlagen:', error);
    }

    return false;
  }

  /**
   * Fix: Timeout
   */
  async fixTimeout() {
    console.log('🔧 Fix: Retry nach Timeout...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true; // Retry wird vom Command Queue System gemacht
  }

  /**
   * Fix: Befehl fehlgeschlagen
   */
  async fixCommandFailed() {
    console.log('🔧 Fix: Verbindungsprüfung...');

    if (!this.controller.device || !this.controller.device.gatt.connected) {
      return await this.fixConnectionLost();
    }

    return true;
  }

  /**
   * Reset Fix-Counter
   */
  reset() {
    this.fixAttempts = 0;
  }
}

// ===================================================================
// GLOBALE INSTANZEN
// ===================================================================

window.addEventListener('load', function () {
  if (window.bleController) {
    // Command Queue
    window.bleCommandQueue = new CommandQueue(window.bleController);

    // Health Monitor
    window.bleHealthMonitor = new HealthMonitor(window.bleController);

    // Error Logger
    window.bleErrorLogger = new ErrorLogger();

    // Auto-Fix
    window.bleAutoFix = new AutoFix(window.bleController);

    console.log('✅ BLE Health Monitor Systeme geladen');
    console.log('   - Command Queue: window.bleCommandQueue');
    console.log('   - Health Monitor: window.bleHealthMonitor');
    console.log('   - Error Logger: window.bleErrorLogger');
    console.log('   - Auto-Fix: window.bleAutoFix');

    // Starte Health Monitor automatisch wenn verbunden
    if (window.bleController.isConnected) {
      window.bleHealthMonitor.start();
    }
  }
});

// ===================================================================
// EXPORT
// ===================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CommandQueue,
    HealthMonitor,
    ErrorLogger,
    AutoFix
  };
}
