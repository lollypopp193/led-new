/**
 * ADVANCED VISUALIZER v1.0
 * Erweiterte Audio-Visualisierung mit Canvas
 */
'use strict';

class AdvancedVisualizer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.analyser = null;
        this.audioContext = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.animationId = null;
        this.isRunning = false;
        this.mode = 'bars'; // bars, circle, wave, particles
        this.particles = [];
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupAudioContext();
        console.log('✅ Advanced Visualizer initialisiert');
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualizerCanvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 1;
            opacity: 0.6;
        `;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');

        // FIX: Canvas Context Loss Handler (bei App-Suspend)
        this.canvas.addEventListener('webglcontextlost', (event) => {
            console.warn('⚠️ Canvas Context Lost');
            event.preventDefault();
            this.stop();
        });

        this.canvas.addEventListener('webglcontextrestored', () => {
            console.log('✅ Canvas Context Restored');
            this.ctx = this.canvas.getContext('2d');
            if (this.isRunning) {
                this.start(this.mode);
            }
        });

        // Resize handling
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    setupAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
        } catch (error) {
            console.warn('⚠️ Web Audio API nicht verfügbar:', error);
        }
    }

    connectAudioElement(audioElement) {
        if (!this.audioContext || !this.analyser) {
            console.warn('⚠️ Audio Context nicht verfügbar');
            return;
        }

        try {
            const source = this.audioContext.createMediaElementSource(audioElement);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            console.log('✅ Audio Element verbunden');
        } catch (error) {
            console.warn('⚠️ Audio bereits verbunden oder Fehler:', error);
        }
    }

    start(mode = 'bars') {
        if (this.isRunning) return;

        this.mode = mode;
        this.isRunning = true;

        // Add canvas to DOM
        if (!document.body.contains(this.canvas)) {
            document.body.appendChild(this.canvas);
        }

        // Resume audio context if suspended
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.animate();
        console.log(`🎨 Visualizer gestartet (${mode})`);
    }

    stop() {
        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Clear canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        console.log('⏹️ Visualizer gestoppt');
    }

    animate() {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw based on mode
        switch (this.mode) {
            case 'bars':
                this.drawBars();
                break;
            case 'circle':
                this.drawCircle();
                break;
            case 'wave':
                this.drawWave();
                break;
            case 'particles':
                this.drawParticles();
                break;
            default:
                this.drawBars();
        }
    }

    drawBars() {
        const barWidth = (this.canvas.width / this.bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * this.canvas.height;

            // Gradient
            const gradient = this.ctx.createLinearGradient(0, this.canvas.height - barHeight, 0, this.canvas.height);
            gradient.addColorStop(0, `hsl(${i * 2}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${i * 2}, 100%, 30%)`);

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    drawCircle() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 150;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        for (let i = 0; i < this.bufferLength; i++) {
            const angle = (Math.PI * 2 * i) / this.bufferLength;
            const barHeight = (this.dataArray[i] / 255) * 100;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);

            const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `hsl(${i * 2}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${i * 2}, 100%, 70%)`);

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }

    drawWave() {
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.beginPath();

        const sliceWidth = this.canvas.width / this.bufferLength;
        let x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = (v * this.canvas.height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();

        // Mirror
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.beginPath();
        x = 0;

        for (let i = 0; i < this.bufferLength; i++) {
            const v = this.dataArray[i] / 128.0;
            const y = this.canvas.height - (v * this.canvas.height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }

    drawParticles() {
        // Create particles based on audio
        const average = this.dataArray.reduce((a, b) => a + b, 0) / this.bufferLength;

        if (average > 50) {
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    radius: Math.random() * 5 + 2,
                    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                    life: 100
                });
            }
        }

        // Update and draw particles
        this.particles = this.particles.filter(p => p.life > 0);

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 100;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    setMode(mode) {
        this.mode = mode;
        console.log(`🎨 Visualizer Mode: ${mode}`);
    }

    setOpacity(opacity) {
        this.canvas.style.opacity = opacity;
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
}

// Initialize global visualizer
window.advancedVisualizer = new AdvancedVisualizer();

// Auto-connect to audio player
setTimeout(() => {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        window.advancedVisualizer.connectAudioElement(audioPlayer);
    }
}, 1000);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedVisualizer;
}

console.log('✅ Advanced Visualizer geladen');
console.log('🎨 Modes: bars, circle, wave, particles');
