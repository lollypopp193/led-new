/**
 * MEDIA SESSION CONTROLLER v1.0
 * Native Media Notifications & Lockscreen Controls
 */
'use strict';

class MediaSessionController {
    constructor() {
        this.isSupported = 'mediaSession' in navigator;
        this.currentTrack = null;
        this.init();
    }

    init() {
        if (!this.isSupported) {
            console.warn('⚠️ MediaSession API nicht verfügbar');
            return;
        }

        this.setupMediaSessionHandlers();
        // console.log('✅ Media Session Controller initialisiert');
    }

    setupMediaSessionHandlers() {
        if (!this.isSupported) return;

        // Play/Pause
        navigator.mediaSession.setActionHandler('play', () => {
            // console.log('▶️ MediaSession: Play');
            this.handlePlay();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            // console.log('⏸️ MediaSession: Pause');
            this.handlePause();
        });

        // Previous/Next Track
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            // console.log('⏮️ MediaSession: Previous Track');
            this.handlePreviousTrack();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            // console.log('⏭️ MediaSession: Next Track');
            this.handleNextTrack();
        });

        // Seek
        navigator.mediaSession.setActionHandler('seekto', (details) => {
            // console.log('⏩ MediaSession: Seek to', details.seekTime);
            this.handleSeek(details.seekTime);
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const seekOffset = details.seekOffset || 10;
            // console.log('⏪ MediaSession: Seek Backward', seekOffset);
            this.handleSeekBackward(seekOffset);
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const seekOffset = details.seekOffset || 10;
            // console.log('⏩ MediaSession: Seek Forward', seekOffset);
            this.handleSeekForward(seekOffset);
        });

        // Stop
        navigator.mediaSession.setActionHandler('stop', () => {
            // console.log('⏹️ MediaSession: Stop');
            this.handleStop();
        });

        // console.log('✅ MediaSession Handlers registriert');
    }

    /**
     * Update Metadata (Track Info, Album Art, etc.)
     */
    updateMetadata(trackInfo) {
        if (!this.isSupported) return;

        this.currentTrack = trackInfo;

        const metadata = {
            title: trackInfo.title || 'Unbekannter Titel',
            artist: trackInfo.artist || 'Unbekannter Interpret',
            album: trackInfo.album || '',
            artwork: []
        };

        // Artwork (Album Cover)
        if (trackInfo.artwork || trackInfo.cover) {
            const artworkUrl = trackInfo.artwork || trackInfo.cover;

            metadata.artwork = [
                { src: artworkUrl, sizes: '96x96', type: 'image/png' },
                { src: artworkUrl, sizes: '128x128', type: 'image/png' },
                { src: artworkUrl, sizes: '192x192', type: 'image/png' },
                { src: artworkUrl, sizes: '256x256', type: 'image/png' },
                { src: artworkUrl, sizes: '384x384', type: 'image/png' },
                { src: artworkUrl, sizes: '512x512', type: 'image/png' }
            ];
        } else {
            // Fallback: App Icon
            metadata.artwork = [
                { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' }
            ];
        }

        navigator.mediaSession.metadata = new MediaMetadata(metadata);
        // console.log('📀 Metadata aktualisiert:', metadata.title);
    }

    /**
     * Update Playback State
     */
    updatePlaybackState(state) {
        if (!this.isSupported) return;

        // States: 'none', 'paused', 'playing'
        navigator.mediaSession.playbackState = state;
        // console.log(`🎵 Playback State: ${state}`);
    }

    /**
     * Update Position State (für Seek-Bar)
     */
    updatePositionState(duration, position, playbackRate = 1.0) {
        if (!this.isSupported) return;

        try {
            navigator.mediaSession.setPositionState({
                duration: duration || 0,
                playbackRate: playbackRate,
                position: position || 0
            });
        } catch (error) {
            console.warn('⚠️ Position State Update fehlgeschlagen:', error);
        }
    }

    /**
     * Handler Implementations
     */
    handlePlay() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.play()
                .then(() => {
                    this.updatePlaybackState('playing');
                })
                .catch(error => {
                    console.error('❌ Play fehlgeschlagen:', error);
                });
        }

        // Trigger custom event
        this.dispatchEvent('play');
    }

    handlePause() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.pause();
            this.updatePlaybackState('paused');
        }

        this.dispatchEvent('pause');
    }

    handleStop() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            this.updatePlaybackState('none');
        }

        this.dispatchEvent('stop');
    }

    handleNextTrack() {
        // Call global next track function if available
        if (window.musikIntegration && window.musikIntegration.nextTrack) {
            window.musikIntegration.nextTrack();
        } else if (window.playNextTrack) {
            window.playNextTrack();
        }

        this.dispatchEvent('nexttrack');
    }

    handlePreviousTrack() {
        // Call global previous track function if available
        if (window.musikIntegration && window.musikIntegration.previousTrack) {
            window.musikIntegration.previousTrack();
        } else if (window.playPreviousTrack) {
            window.playPreviousTrack();
        }

        this.dispatchEvent('previoustrack');
    }

    handleSeek(time) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.currentTime = time;
            this.updatePositionState(
                audioPlayer.duration,
                audioPlayer.currentTime,
                audioPlayer.playbackRate
            );
        }

        this.dispatchEvent('seek', { time });
    }

    handleSeekBackward(offset) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - offset);
            this.updatePositionState(
                audioPlayer.duration,
                audioPlayer.currentTime,
                audioPlayer.playbackRate
            );
        }

        this.dispatchEvent('seekbackward', { offset });
    }

    handleSeekForward(offset) {
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) {
            audioPlayer.currentTime = Math.min(
                audioPlayer.duration,
                audioPlayer.currentTime + offset
            );
            this.updatePositionState(
                audioPlayer.duration,
                audioPlayer.currentTime,
                audioPlayer.playbackRate
            );
        }

        this.dispatchEvent('seekforward', { offset });
    }

    /**
     * Auto-Update Position State
     */
    startPositionUpdates() {
        if (!this.isSupported) return;

        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) return;

        // Update position every second
        this.positionUpdateInterval = setInterval(() => {
            if (audioPlayer.duration && !audioPlayer.paused) {
                this.updatePositionState(
                    audioPlayer.duration,
                    audioPlayer.currentTime,
                    audioPlayer.playbackRate
                );
            }
        }, 1000);

        // console.log('⏱️ Position Updates gestartet');
    }

    stopPositionUpdates() {
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
            this.positionUpdateInterval = null;
            // console.log('⏱️ Position Updates gestoppt');
        }
    }

    /**
     * Integration mit Audio Player
     */
    attachToAudioPlayer() {
        const audioPlayer = document.getElementById('audioPlayer');
        if (!audioPlayer) {
            console.warn('⚠️ Audio Player nicht gefunden');
            return;
        }

        // Play Event
        audioPlayer.addEventListener('play', () => {
            this.updatePlaybackState('playing');
            this.startPositionUpdates();
        });

        // Pause Event
        audioPlayer.addEventListener('pause', () => {
            this.updatePlaybackState('paused');
            this.stopPositionUpdates();
        });

        // Ended Event
        audioPlayer.addEventListener('ended', () => {
            this.updatePlaybackState('none');
            this.stopPositionUpdates();
        });

        // Time Update Event (für Position State)
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (audioPlayer.duration) {
                this.updatePositionState(
                    audioPlayer.duration,
                    audioPlayer.currentTime,
                    audioPlayer.playbackRate
                );
            }
        });

        // console.log('✅ Audio Player Integration aktiviert');
    }

    /**
     * Dispatch Custom Events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`mediasession-${eventName}`, {
            detail: detail,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Clear Metadata
     */
    clearMetadata() {
        if (!this.isSupported) return;

        navigator.mediaSession.metadata = null;
        this.updatePlaybackState('none');
        this.stopPositionUpdates();
        // console.log('🗑️ Metadata gelöscht');
    }

    /**
     * Get Current Track
     */
    getCurrentTrack() {
        return this.currentTrack;
    }

    /**
     * Check if API is supported
     */
    checkSupport() {
        return this.isSupported;
    }
}

// Initialize global media session controller
window.mediaSessionController = new MediaSessionController();

// Auto-attach to audio player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.mediaSessionController.attachToAudioPlayer();
        }, 500);
    });
} else {
    setTimeout(() => {
        window.mediaSessionController.attachToAudioPlayer();
    }, 500);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaSessionController;
}

// console.log('✅ Media Session Controller geladen');
