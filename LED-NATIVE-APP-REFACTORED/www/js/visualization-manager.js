/**
 * VISUALIZATION-MANAGER.JS
 * Musik-Visualisierung ohne schwarzen Bildschirm
 * Balken, Wellen, Partikel, Kreis, Spirale, Linie, Spektrum, Feuer
 * Direkt im Player-Bereich anzeigen
 */
'use strict';

class VisualizationManager {
    constructor() {
        this.currentMode = 'balken';
        this.isActive = false;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.audioData = [];
        this.init();
    }

    /**
     * Initialisiert den Visualization-Manager
     */
    init() {
        // console.log('🎨 Visualization-Manager initialisiert');
        this.setupCanvas();
    }

    /**
     * Erstellt Canvas im Player-Bereich
     */
    setupCanvas() {
        // Finde Player-Visualisierungs-Container
        let container = document.querySelector('.player-visualization, #player-visualization, [data-visualization]');

        if (!container) {
            console.warn('⚠️ Visualisierungs-Container nicht gefunden');
            return;
        }

        // Erstelle Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'visualization-canvas';
        this.canvas.style.cssText = `
            width: 100%;
            height: 200px;
            background: transparent;
            border-radius: 8px;
        `;

        container.innerHTML = ''; // Leere Container (entferne schwarzen Bildschirm)
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();

        // console.log('✅ Visualisierungs-Canvas erstellt');
    }

    /**
     * Passt Canvas-Größe an
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    /**
     * Startet Visualisierung
     * @param {string} mode - Visualisierungsmodus
     */
    start(mode = 'balken') {
        this.currentMode = mode;
        this.isActive = true;
        // console.log(`▶️ Visualisierung gestartet: ${mode}`);
        this.animate();
    }

    /**
     * Stoppt Visualisierung
     */
    stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.clearCanvas();
        // console.log('⏹️ Visualisierung gestoppt');
    }

    /**
     * Animation-Loop
     */
    animate() {
        if (!this.isActive) return;

        // Hole Audio-Daten
        if (window.audioReactiveEngine) {
            this.audioData = window.audioReactiveEngine.getFrequencyData() || [];
        }

        // Zeichne aktuelle Visualisierung
        this.draw();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Zeichnet Visualisierung
     */
    draw() {
        if (!this.ctx) return;

        this.clearCanvas();

        switch (this.currentMode) {
            case 'balken':
                this.drawBars();
                break;
            case 'wellen':
                this.drawWaves();
                break;
            case 'partikel':
                this.drawParticles();
                break;
            case 'kreis':
                this.drawCircle();
                break;
            case 'spirale':
                this.drawSpiral();
                break;
            case 'linie':
                this.drawLine();
                break;
            case 'spektrum':
                this.drawSpectrum();
                break;
            case 'feuer':
                this.drawFire();
                break;
            default:
                this.drawBars();
        }
    }

    /**
     * Zeichnet Balken-Visualisierung
     */
    drawBars() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const barCount = 32;
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
            const value = this.audioData[i] || 0;
            const barHeight = (value / 255) * height * 0.8;

            const hue = (i / barCount) * 360;
            this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;

            const x = i * barWidth;
            const y = height - barHeight;

            this.ctx.fillRect(x, y, barWidth - 2, barHeight);
        }
    }

    /**
     * Zeichnet Wellen-Visualisierung
     */
    drawWaves() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);

        const points = 64;
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const value = this.audioData[Math.floor(i * this.audioData.length / points)] || 0;
            const y = height / 2 + (value / 255 - 0.5) * height * 0.6;

            this.ctx.lineTo(x, y);
        }

        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    /**
     * Zeichnet Partikel-Visualisierung
     */
    drawParticles() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        for (let i = 0; i < this.audioData.length; i += 4) {
            const value = this.audioData[i] || 0;
            if (value > 100) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const radius = (value / 255) * 10;

                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 204, 0, ${value / 255})`;
                this.ctx.fill();
            }
        }
    }

    /**
     * Zeichnet Kreis-Visualisierung
     */
    drawCircle() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.3;

        const points = 64;
        this.ctx.beginPath();

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const value = this.audioData[Math.floor(i * this.audioData.length / points)] || 0;
            const radius = baseRadius + (value / 255) * 50;

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.strokeStyle = '#ffcc00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Zeichnet Spiral-Visualisierung
     */
    drawSpiral() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const centerX = width / 2;
        const centerY = height / 2;

        this.ctx.beginPath();

        for (let i = 0; i < this.audioData.length; i++) {
            const angle = (i / this.audioData.length) * Math.PI * 4;
            const value = this.audioData[i] || 0;
            const radius = (i / this.audioData.length) * Math.min(width, height) * 0.4;
            const offset = (value / 255) * 20;

            const x = centerX + Math.cos(angle) * (radius + offset);
            const y = centerY + Math.sin(angle) * (radius + offset);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Zeichnet Linien-Visualisierung
     */
    drawLine() {
        this.drawWaves(); // Alias für Wellen
    }

    /**
     * Zeichnet Spektrum-Visualisierung
     */
    drawSpectrum() {
        this.drawBars(); // Alias für Balken
    }

    /**
     * Zeichnet Feuer-Visualisierung
     */
    drawFire() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        for (let i = 0; i < this.audioData.length; i += 2) {
            const value = this.audioData[i] || 0;
            const x = (i / this.audioData.length) * width;
            const flameHeight = (value / 255) * height * 0.8;

            // Gradient von gelb nach rot
            const gradient = this.ctx.createLinearGradient(x, height, x, height - flameHeight);
            gradient.addColorStop(0, '#ff4500');
            gradient.addColorStop(0.5, '#ff6600');
            gradient.addColorStop(1, '#ffaa00');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, height - flameHeight, width / this.audioData.length * 2, flameHeight);
        }
    }

    /**
     * Löscht Canvas
     */
    clearCanvas() {
        if (!this.ctx) return;
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        this.ctx.clearRect(0, 0, width, height);
    }

    /**
     * Wechselt Visualisierungsmodus
     * @param {string} mode - Neuer Modus
     */
    switchMode(mode) {
        // console.log(`🎨 Wechsle Visualisierung: ${this.currentMode} → ${mode}`);
        this.currentMode = mode;
    }
}

// Global initialisieren
const visualizationManager = new VisualizationManager();
window.visualizationManager = visualizationManager;
window.VisualizationManager = VisualizationManager;

// Auto-Start wenn Musik spielt
document.addEventListener('musicPlaying', () => {
    if (!visualizationManager.isActive) {
        visualizationManager.start();
    }
});

document.addEventListener('musicPaused', () => {
    visualizationManager.stop();
});
