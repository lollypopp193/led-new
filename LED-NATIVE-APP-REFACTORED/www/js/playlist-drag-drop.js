/**
 * PLAYLIST DRAG & DROP v1.0
 * Ermöglicht Sortierung von Songs in Playlists per Drag & Drop
 */
'use strict';

class PlaylistDragDrop {
    constructor() {
        this.draggedElement = null;
        this.draggedIndex = null;
        this.currentPlaylist = null;
        this.init();
    }

    init() {
        console.log('✅ Playlist Drag & Drop initialisiert');
    }

    /**
     * Aktiviert Drag & Drop für eine Playlist
     * @param {string} playlistId - Container Element ID
     * @param {Array} songs - Array von Songs
     * @param {Function} onReorder - Callback nach Neuordnung
     */
    enableForPlaylist(playlistId, songs, onReorder) {
        const container = document.getElementById(playlistId);
        if (!container) {
            console.warn('Container nicht gefunden:', playlistId);
            return;
        }

        this.currentPlaylist = {
            id: playlistId,
            songs: songs,
            onReorder: onReorder
        };

        // Finde alle Song-Items
        const songItems = container.querySelectorAll('.song-item, .playlist-song-item');

        songItems.forEach((item, index) => {
            this.makeDraggable(item, index);
        });

        console.log(`📋 Drag & Drop aktiviert für ${songItems.length} Songs`);
    }

    makeDraggable(element, index) {
        element.setAttribute('draggable', 'true');
        element.style.cursor = 'move';
        element.dataset.index = index;

        // Drag Start
        element.addEventListener('dragstart', (e) => {
            this.draggedElement = element;
            this.draggedIndex = parseInt(element.dataset.index);

            element.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.innerHTML);

            // Visual Feedback
            element.classList.add('dragging');
        });

        // Drag End
        element.addEventListener('dragend', (e) => {
            element.style.opacity = '1';
            element.classList.remove('dragging');

            // Remove all drag-over classes
            const items = element.parentElement.querySelectorAll('.song-item, .playlist-song-item');
            items.forEach(item => {
                item.classList.remove('drag-over');
            });
        });

        // Drag Over
        element.addEventListener('dragover', (e) => {
            if (e.preventDefault) {
                e.preventDefault();
            }

            e.dataTransfer.dropEffect = 'move';

            if (element !== this.draggedElement) {
                element.classList.add('drag-over');
            }

            return false;
        });

        // Drag Enter
        element.addEventListener('dragenter', (e) => {
            if (element !== this.draggedElement) {
                element.classList.add('drag-over');
            }
        });

        // Drag Leave
        element.addEventListener('dragleave', (e) => {
            element.classList.remove('drag-over');
        });

        // Drop
        element.addEventListener('drop', (e) => {
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            element.classList.remove('drag-over');

            if (this.draggedElement !== element) {
                const targetIndex = parseInt(element.dataset.index);
                this.reorderSongs(this.draggedIndex, targetIndex);
            }

            return false;
        });
    }

    reorderSongs(fromIndex, toIndex) {
        if (!this.currentPlaylist) return;

        const songs = [...this.currentPlaylist.songs];

        // Entferne Song an alter Position
        const [movedSong] = songs.splice(fromIndex, 1);

        // Füge an neuer Position ein
        songs.splice(toIndex, 0, movedSong);

        console.log(`🔄 Song verschoben: ${fromIndex} → ${toIndex}`);

        // Update UI
        this.updateUI(songs);

        // Callback
        if (this.currentPlaylist.onReorder) {
            this.currentPlaylist.onReorder(songs);
        }

        // Update songs array
        this.currentPlaylist.songs = songs;
    }

    updateUI(songs) {
        const container = document.getElementById(this.currentPlaylist.id);
        if (!container) return;

        // Re-render song list
        const items = container.querySelectorAll('.song-item, .playlist-song-item');

        // Update data-index
        items.forEach((item, newIndex) => {
            item.dataset.index = newIndex;
        });

        // Visual feedback
        if (window.showGlobalNotification) {
            window.showGlobalNotification('✓ Reihenfolge geändert', 'success', 2000);
        }
    }

    /**
     * Deaktiviert Drag & Drop
     */
    disable() {
        if (!this.currentPlaylist) return;

        const container = document.getElementById(this.currentPlaylist.id);
        if (!container) return;

        const songItems = container.querySelectorAll('.song-item, .playlist-song-item');

        songItems.forEach(item => {
            item.setAttribute('draggable', 'false');
            item.style.cursor = 'default';

            // Remove event listeners by cloning
            const clone = item.cloneNode(true);
            item.parentNode.replaceChild(clone, item);
        });

        this.currentPlaylist = null;
        console.log('🛑 Drag & Drop deaktiviert');
    }

    /**
     * Fügt CSS-Styles für Drag & Drop hinzu
     */
    static addStyles() {
        if (document.getElementById('playlist-drag-drop-styles')) return;

        const style = document.createElement('style');
        style.id = 'playlist-drag-drop-styles';
        style.textContent = `
            /* Drag & Drop Styles */
            .song-item[draggable="true"],
            .playlist-song-item[draggable="true"] {
                transition: all 0.2s ease;
            }

            .song-item.dragging,
            .playlist-song-item.dragging {
                opacity: 0.4;
                transform: scale(0.95);
            }

            .song-item.drag-over,
            .playlist-song-item.drag-over {
                border-top: 3px solid #FFD700;
                margin-top: 3px;
            }

            .song-item[draggable="true"]:hover,
            .playlist-song-item[draggable="true"]:hover {
                background: rgba(255, 215, 0, 0.1);
            }

            /* Drag Handle Icon */
            .drag-handle {
                cursor: move;
                color: #888;
                margin-right: 10px;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .song-item:hover .drag-handle,
            .playlist-song-item:hover .drag-handle {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

// Add styles on load
PlaylistDragDrop.addStyles();

// Initialize global instance
window.playlistDragDrop = new PlaylistDragDrop();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlaylistDragDrop;
}

console.log('✅ Playlist Drag & Drop geladen');
