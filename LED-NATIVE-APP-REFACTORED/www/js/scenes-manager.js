/**
 * SCENES-MANAGER.JS v2.0 - ZERO TOLERANCE IMPLEMENTATION
 * Vollständige Szenen-Verwaltung mit Hardware-Integration
 */
'use strict';

class ScenesManager {
    constructor() {
        this.scenes = [];
        this.currentScene = null;
        this.storageKey = 'led-saved-scenes';
        this.categories = ['Entspannung', 'Party', 'Arbeit', 'Lesen', 'Schlafen', 'Romantisch', 'Gaming', 'Filme', 'Custom'];
        this.loadScenes();
        console.log('✅ Szenen-Manager: ' + this.scenes.length + ' Szenen geladen');
    }

    createScene(data) {
        try {
            if (!data || !data.name || !data.color) throw new Error('Name und Farbe erforderlich');
            const scene = {
                id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: String(data.name).trim(),
                description: String(data.description || '').trim(),
                color: { r: this.validate(data.color.r, 0, 255, 255), g: this.validate(data.color.g, 0, 255, 255), b: this.validate(data.color.b, 0, 255, 255) },
                effect: this.validate(data.effect, 0, 255, 0),
                brightness: this.validate(data.brightness, 0, 100, 100),
                speed: this.validate(data.speed, 0, 100, 50),
                devices: Array.isArray(data.devices) ? data.devices : [],
                favorite: Boolean(data.favorite),
                category: this.categories.includes(data.category) ? data.category : 'Custom',
                tags: Array.isArray(data.tags) ? data.tags : [],
                thumbnail: data.thumbnail || this.genThumb(data.color),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            this.scenes.push(scene);
            this.save();
            console.log('✅ Szene erstellt:', scene.name);
            this.notify('Szene "' + scene.name + '" erstellt', 'success');
            this.emit('scene-created', scene);
            return scene;
        } catch (e) {
            console.error('❌ Szene erstellen:', e);
            this.notify('Fehler beim Erstellen', 'error');
            throw e;
        }
    }

    updateScene(id, updates) {
        try {
            const s = this.getScene(id);
            if (!s) throw new Error('Szene nicht gefunden');
            if (updates.name) s.name = String(updates.name).trim();
            if (updates.description !== undefined) s.description = String(updates.description).trim();
            if (updates.color) { s.color.r = this.validate(updates.color.r, 0, 255, s.color.r); s.color.g = this.validate(updates.color.g, 0, 255, s.color.g); s.color.b = this.validate(updates.color.b, 0, 255, s.color.b); }
            if (updates.effect !== undefined) s.effect = this.validate(updates.effect, 0, 255, s.effect);
            if (updates.brightness !== undefined) s.brightness = this.validate(updates.brightness, 0, 100, s.brightness);
            if (updates.speed !== undefined) s.speed = this.validate(updates.speed, 0, 100, s.speed);
            if (updates.favorite !== undefined) s.favorite = Boolean(updates.favorite);
            if (updates.category) s.category = this.categories.includes(updates.category) ? updates.category : s.category;
            s.updatedAt = Date.now();
            this.save();
            console.log('✅ Szene aktualisiert:', s.name);
            this.emit('scene-updated', s);
            return s;
        } catch (e) {
            console.error('❌ Update:', e);
            return null;
        }
    }

    deleteScene(id) {
        try {
            const idx = this.scenes.findIndex(function (s) { return s.id === id; });
            if (idx === -1) throw new Error('Nicht gefunden');
            const s = this.scenes[idx];
            this.scenes.splice(idx, 1);
            this.save();
            if (this.currentScene && this.currentScene.id === id) this.currentScene = null;
            console.log('✅ Szene gelöscht:', s.name);
            this.emit('scene-deleted', { id: id, name: s.name });
            return true;
        } catch (e) {
            console.error('❌ Löschen:', e);
            return false;
        }
    }

    duplicateScene(id) {
        try {
            const orig = this.getScene(id);
            if (!orig) throw new Error('Nicht gefunden');
            const dup = { id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), name: orig.name + ' (Kopie)', description: orig.description, color: { r: orig.color.r, g: orig.color.g, b: orig.color.b }, effect: orig.effect, brightness: orig.brightness, speed: orig.speed, devices: orig.devices.slice(), favorite: false, category: orig.category, tags: orig.tags.slice(), thumbnail: orig.thumbnail, createdAt: Date.now(), updatedAt: Date.now() };
            this.scenes.push(dup);
            this.save();
            console.log('✅ Dupliziert:', dup.name);
            return dup;
        } catch (e) {
            console.error('❌ Duplizieren:', e);
            return null;
        }
    }

    async activateScene(id) {
        try {
            const s = this.getScene(id);
            if (!s) throw new Error('Szene nicht gefunden');
            console.log('🎬 Aktiviere:', s.name);
            let ok = false;

            if (window.ledController && window.ledController.isConnected) {
                try {
                    ok = true;
                    await window.ledController.setBrightness(s.brightness);
                    await this.delay(100);
                    if (s.effect > 0) { await window.ledController.setEffect(s.effect); await this.delay(100); }
                    await window.ledController.setColorRGB(s.color.r, s.color.g, s.color.b);
                    console.log('✅ BLE: OK');
                } catch (e) { console.error('❌ BLE:', e); ok = false; }
            }

            if (!ok && window.ledDevice && window.ledDevice.isConnected && window.ledDevice.characteristic) {
                try {
                    ok = true;
                    const brCmd = new Uint8Array([0x7E, 0x00, 0x0E, s.brightness, 0x00, 0x00, 0x00, 0xEF]);
                    await window.ledDevice.characteristic.writeValue(brCmd);
                    await this.delay(100);
                    if (s.effect > 0) { const efCmd = new Uint8Array([0x7E, 0x00, 0x06 + s.effect, 0x05, 0x00, 0x00, 0x00, 0xEF]); await window.ledDevice.characteristic.writeValue(efCmd); await this.delay(100); }
                    const colCmd = new Uint8Array([0x7E, 0x00, 0x05, s.color.r, s.color.g, s.color.b, 0x00, 0xEF]);
                    await window.ledDevice.characteristic.writeValue(colCmd);
                    console.log('✅ Device: OK');
                } catch (e) { console.error('❌ Device:', e); ok = false; }
            }

            if (!ok && window.wledDevice && window.wledDevice.connected && window.wledDevice.ip) {
                try {
                    ok = true;
                    const url = 'http://' + window.wledDevice.ip + '/json/state';
                    const data = { on: true, bri: Math.round((s.brightness / 100) * 255), seg: [{ col: [[s.color.r, s.color.g, s.color.b]], fx: s.effect > 0 ? s.effect : 0 }] };
                    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                    console.log('✅ WLED: OK');
                } catch (e) { console.error('❌ WLED:', e); ok = false; }
            }

            if (!ok && typeof window.sendUniversalColor === 'function') {
                try { ok = true; await window.sendUniversalColor(s.color.r, s.color.g, s.color.b); console.log('✅ Universal: OK'); }
                catch (e) { console.error('❌ Universal:', e); ok = false; }
            }

            if (!ok) throw new Error('Keine Hardware-Verbindung');
            this.currentScene = s;
            console.log('✅ Aktiviert:', s.name);
            this.notify('Szene "' + s.name + '" aktiviert', 'success');
            this.emit('scene-activated', s);
            return true;
        } catch (e) {
            console.error('❌ Aktivierung:', e);
            this.notify(e.message || 'Aktivierung fehlgeschlagen', 'error');
            return false;
        }
    }

    async reloadCurrentScene() { if (!this.currentScene) return false; return await this.activateScene(this.currentScene.id); }

    toggleFavorite(id) {
        try {
            const s = this.getScene(id);
            if (!s) throw new Error('Nicht gefunden');
            s.favorite = !s.favorite;
            s.updatedAt = Date.now();
            this.save();
            console.log((s.favorite ? '⭐' : '☆') + ' ' + s.name);
            return s.favorite;
        } catch (e) { console.error('❌ Favorit:', e); return false; }
    }

    getFavorites() { return this.scenes.filter(function (s) { return s.favorite; }); }
    getScenesByCategory(cat) { return this.scenes.filter(function (s) { return s.category === cat; }); }
    getScenesByTag(tag) { return this.scenes.filter(function (s) { return s.tags.indexOf(tag) !== -1; }); }
    getAllTags() { const t = [], seen = {}; for (var i = 0; i < this.scenes.length; i++) { var st = this.scenes[i].tags; for (var j = 0; j < st.length; j++) { var tag = st[j]; if (!seen[tag]) { t.push(tag); seen[tag] = true; } } } return t.sort(); }

    createDefaultPresets() {
        const presets = [
            { name: 'Warmes Licht', description: 'Entspannend warm', color: { r: 255, g: 200, b: 100 }, effect: 0, brightness: 80, speed: 50, category: 'Entspannung', tags: ['warm', 'gemütlich'] },
            { name: 'Kaltes Weiß', description: 'Helles Arbeitslicht', color: { r: 255, g: 255, b: 255 }, effect: 0, brightness: 100, speed: 50, category: 'Arbeit', tags: ['hell', 'weiß'] },
            { name: 'Romantisch', description: 'Sanftes Rot', color: { r: 255, g: 50, b: 80 }, effect: 0, brightness: 40, speed: 50, category: 'Romantisch', tags: ['rot', 'dunkel'] },
            { name: 'Party', description: 'Bunter Party-Modus', color: { r: 255, g: 0, b: 255 }, effect: 10, brightness: 100, speed: 80, category: 'Party', tags: ['bunt', 'dynamisch'] },
            { name: 'Nachtlicht', description: 'Dezentes Blau', color: { r: 50, g: 100, b: 150 }, effect: 0, brightness: 20, speed: 50, category: 'Schlafen', tags: ['blau', 'nacht'] },
            { name: 'Gaming', description: 'Cyan Gaming', color: { r: 0, g: 255, b: 255 }, effect: 15, brightness: 90, speed: 70, category: 'Gaming', tags: ['cyan', 'energetisch'] },
            { name: 'Sonnenuntergang', description: 'Warmer Sonnenuntergang', color: { r: 255, g: 100, b: 50 }, effect: 0, brightness: 60, speed: 30, category: 'Entspannung', tags: ['orange', 'warm'] },
            { name: 'Ozean', description: 'Beruhigendes Blau', color: { r: 0, g: 150, b: 255 }, effect: 5, brightness: 70, speed: 40, category: 'Entspannung', tags: ['blau', 'wasser'] },
            { name: 'Wald', description: 'Natürliches Grün', color: { r: 50, g: 200, b: 80 }, effect: 0, brightness: 75, speed: 50, category: 'Entspannung', tags: ['grün', 'natur'] },
            { name: 'Disco', description: 'Stroboskop', color: { r: 255, g: 255, b: 255 }, effect: 20, brightness: 100, speed: 100, category: 'Party', tags: ['schnell', 'stroboskop'] }
        ];
        console.log('🎨 Erstelle ' + presets.length + ' Presets');
        for (var i = 0; i < presets.length; i++) { this.createScene(presets[i]); }
        console.log('✅ Presets erstellt');
    }

    searchScenes(query) {
        if (!query || !query.trim()) return this.scenes;
        const q = query.toLowerCase();
        return this.scenes.filter(function (s) { return s.name.toLowerCase().indexOf(q) !== -1 || s.description.toLowerCase().indexOf(q) !== -1 || s.category.toLowerCase().indexOf(q) !== -1 || s.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; }); });
    }

    filterScenes(filters) {
        var filtered = this.scenes.slice();
        if (filters.category) filtered = filtered.filter(function (s) { return s.category === filters.category; });
        if (filters.favorite !== undefined) filtered = filtered.filter(function (s) { return s.favorite === filters.favorite; });
        if (filters.tags && filters.tags.length > 0) filtered = filtered.filter(function (s) { return filters.tags.some(function (t) { return s.tags.indexOf(t) !== -1; }); });
        if (filters.minBrightness !== undefined) filtered = filtered.filter(function (s) { return s.brightness >= filters.minBrightness; });
        if (filters.maxBrightness !== undefined) filtered = filtered.filter(function (s) { return s.brightness <= filters.maxBrightness; });
        return filtered;
    }

    sortScenes(sortBy, order) {
        sortBy = sortBy || 'name';
        order = order || 'asc';
        const sorted = this.scenes.slice();
        const mult = order === 'asc' ? 1 : -1;
        sorted.sort(function (a, b) {
            switch (sortBy) {
                case 'name': return mult * a.name.localeCompare(b.name);
                case 'created': return mult * (a.createdAt - b.createdAt);
                case 'updated': return mult * (a.updatedAt - b.updatedAt);
                case 'brightness': return mult * (a.brightness - b.brightness);
                case 'category': return mult * a.category.localeCompare(b.category);
                default: return 0;
            }
        });
        return sorted;
    }

    exportScenes(sceneIds) {
        var toExport = this.scenes;
        if (sceneIds && sceneIds.length > 0) toExport = this.scenes.filter(function (s) { return sceneIds.indexOf(s.id) !== -1; });
        const data = { version: '1.0', exportDate: Date.now(), scenes: toExport };
        return JSON.stringify(data, null, 2);
    }

    importScenes(jsonString, overwrite) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.scenes || !Array.isArray(data.scenes)) throw new Error('Ungültiges Format');
            if (overwrite) this.scenes = [];
            var count = 0;
            for (var i = 0; i < data.scenes.length; i++) {
                var s = data.scenes[i];
                var newScene = { id: 'scene_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), name: s.name, description: s.description, color: s.color, effect: s.effect, brightness: s.brightness, speed: s.speed, devices: s.devices, favorite: s.favorite, category: s.category, tags: s.tags, thumbnail: s.thumbnail, createdAt: Date.now(), updatedAt: Date.now() };
                this.scenes.push(newScene);
                count++;
            }
            this.save();
            console.log('✅ ' + count + ' Szenen importiert');
            this.notify(count + ' Szenen importiert', 'success');
            return count;
        } catch (e) {
            console.error('❌ Import:', e);
            this.notify('Import fehlgeschlagen', 'error');
            return 0;
        }
    }

    downloadScenes(sceneIds) {
        const json = this.exportScenes(sceneIds);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'led-scenes-' + Date.now() + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('✅ Szenen exportiert');
        this.notify('Szenen exportiert', 'success');
    }

    save() {
        try { localStorage.setItem(this.storageKey, JSON.stringify(this.scenes)); console.log('💾 Gespeichert: ' + this.scenes.length); }
        catch (e) { console.error('❌ Speichern:', e); this.notify('Speichern fehlgeschlagen', 'error'); }
    }

    loadScenes() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) { this.scenes = JSON.parse(saved); console.log('📂 Geladen: ' + this.scenes.length); }
            else { console.log('📂 Keine Szenen, erstelle Presets'); this.createDefaultPresets(); }
        } catch (e) { console.error('❌ Laden:', e); this.scenes = []; }
    }

    clearAllScenes() {
        if (!confirm('Wirklich ALLE Szenen löschen?')) return false;
        this.scenes = [];
        this.currentScene = null;
        this.save();
        console.log('🗑️ Alle gelöscht');
        this.notify('Alle Szenen gelöscht', 'info');
        return true;
    }

    getScene(id) { return this.scenes.find(function (s) { return s.id === id; }) || null; }
    getAllScenes() { return this.scenes.slice(); }
    getSceneCount() { return this.scenes.length; }
    getCurrentScene() { return this.currentScene; }
    validate(val, min, max, def) { const n = parseInt(val); if (isNaN(n)) return def; return Math.max(min, Math.min(max, n)); }

    genThumb(color) {
        if (!color) return '';
        try {
            const c = document.createElement('canvas');
            c.width = 100;
            c.height = 100;
            const ctx = c.getContext('2d');
            ctx.fillStyle = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
            ctx.fillRect(0, 0, 100, 100);
            return c.toDataURL('image/png');
        } catch (e) { console.error('Thumbnail:', e); return ''; }
    }

    delay(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

    emit(name, detail) {
        try {
            const evt = new CustomEvent(name, { detail: detail, bubbles: true, cancelable: true });
            window.dispatchEvent(evt);
        } catch (e) { console.error('Event:', e); }
    }

    notify(msg, type) { if (typeof window.showGlobalNotification === 'function') window.showGlobalNotification(msg, type); }
}

window.ScenesManager = ScenesManager;
window.scenesManager = new ScenesManager();
console.log('✅ Szenen-Manager global verfügbar als window.scenesManager');

window.addEventListener('scene-activated', function (e) { console.log('🎬 Event: Szene aktiviert -', e.detail.name); });

if (typeof module !== 'undefined' && module.exports) module.exports = ScenesManager;
