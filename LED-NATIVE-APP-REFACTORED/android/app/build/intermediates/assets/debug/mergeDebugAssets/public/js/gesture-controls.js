/**
 * GESTURE CONTROLS v1.0
 * Touch-Gesten für intuitive Steuerung
 */
'use strict';

class GestureControls {
    constructor() {
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.swipeThreshold = 50;
        this.doubleTapDelay = 300;
        this.lastTap = 0;
        this.isEnabled = true;
        this.gestures = new Map();
        this.init();
    }

    init() {
        this.setupTouchListeners();
        this.registerDefaultGestures();
        console.log('✅ Gesture Controls initialisiert');
    }

    setupTouchListeners() {
        document.addEventListener('touchstart', (e) => {
            if (!this.isEnabled) return;
            this.handleTouchStart(e);
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (!this.isEnabled) return;
            this.handleTouchEnd(e);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!this.isEnabled) return;
            this.handleTouchMove(e);
        }, { passive: false });
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchMove(e) {
        // Prevent default for custom gestures
        if (this.shouldPreventDefault(e)) {
            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;

        this.detectGesture();
    }

    shouldPreventDefault(e) {
        // Don't prevent default for inputs
        if (e.target.matches('input, textarea, select')) {
            return false;
        }
        return true;
    }

    detectGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Swipe detection
        if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.executeGesture('swipe-right');
                } else {
                    this.executeGesture('swipe-left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.executeGesture('swipe-down');
                } else {
                    this.executeGesture('swipe-up');
                }
            }
        } else {
            // Tap detection
            this.detectTap();
        }
    }

    detectTap() {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTap;

        if (timeSinceLastTap < this.doubleTapDelay && timeSinceLastTap > 0) {
            this.executeGesture('double-tap');
            this.lastTap = 0;
        } else {
            this.lastTap = now;
            setTimeout(() => {
                if (this.lastTap === now) {
                    this.executeGesture('single-tap');
                }
            }, this.doubleTapDelay);
        }
    }

    registerDefaultGestures() {
        // ENTFERNT: Swipe Left/Right für Track-Wechsel
        // Diese interferieren mit der LED-Sidebar
        // Track-Wechsel NUR über Buttons
        
        // Swipe Left: DEAKTIVIERT - LED-Sidebar nutzt horizontal swipe
        // Swipe Right: DEAKTIVIERT - LED-Sidebar nutzt horizontal swipe

        // Swipe Up: Volume Up
        this.registerGesture('swipe-up', {
            name: 'Volume Up',
            handler: () => {
                console.log('👆 Gesture: Swipe Up → Volume Up');
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.volume = Math.min(1, audioPlayer.volume + 0.1);
                    this.showGestureFeedback(`🔊 Volume: ${Math.round(audioPlayer.volume * 100)}%`);
                }
            }
        });

        // Swipe Down: Volume Down
        this.registerGesture('swipe-down', {
            name: 'Volume Down',
            handler: () => {
                console.log('👆 Gesture: Swipe Down → Volume Down');
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.volume = Math.max(0, audioPlayer.volume - 0.1);
                    this.showGestureFeedback(`🔉 Volume: ${Math.round(audioPlayer.volume * 100)}%`);
                }
            }
        });

        // Double Tap: Play/Pause
        this.registerGesture('double-tap', {
            name: 'Play/Pause',
            handler: () => {
                console.log('👆 Gesture: Double Tap → Play/Pause');
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                        this.showGestureFeedback('▶️ Play');
                    } else {
                        audioPlayer.pause();
                        this.showGestureFeedback('⏸️ Pause');
                    }
                }
            }
        });

        console.log(`✅ ${this.gestures.size} Standard-Gesten registriert`);
    }

    registerGesture(type, gesture) {
        this.gestures.set(type, {
            type,
            name: gesture.name,
            handler: gesture.handler
        });
    }

    executeGesture(type) {
        const gesture = this.gestures.get(type);

        if (!gesture) {
            return;
        }

        try {
            gesture.handler();
        } catch (error) {
            console.error(`❌ Gesture fehlgeschlagen: ${type}`, error);

            if (window.globalErrorHandler) {
                window.globalErrorHandler.handleError(error, `Gesture: ${type}`);
            }
        }
    }

    showGestureFeedback(message) {
        // Remove existing feedback
        const existing = document.getElementById('gestureFeedback');
        if (existing) {
            existing.remove();
        }

        const feedback = document.createElement('div');
        feedback.id = 'gestureFeedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #FFD700;
            padding: 20px 40px;
            border-radius: 15px;
            font-size: 24px;
            font-weight: bold;
            z-index: 100000;
            pointer-events: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            animation: gestureFadeInOut 1s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gestureFadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;

        if (!document.getElementById('gestureFeedbackStyles')) {
            style.id = 'gestureFeedbackStyles';
            document.head.appendChild(style);
        }

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 1000);
    }

    enable() {
        this.isEnabled = true;
        console.log('✅ Gesture Controls aktiviert');
    }

    disable() {
        this.isEnabled = false;
        console.log('⛔ Gesture Controls deaktiviert');
    }

    getAllGestures() {
        return Array.from(this.gestures.values());
    }

    removeGesture(type) {
        this.gestures.delete(type);
    }
}

// Initialize global gesture controls
window.gestureControls = new GestureControls();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GestureControls;
}

console.log('✅ Gesture Controls geladen');
console.log('👆 Gestures: Swipe Left/Right (Track), Up/Down (Volume), Double-Tap (Play/Pause)');
