/**
 * 本地存储服务（兼容微信小游戏 wx.setStorageSync 与 Cocos sys.localStorage）
 */
import { sys } from 'cc';

const KEYS = {
    CURRENT_LEVEL: 'sink_match_currentLevel',
    LEVEL_STARS:   'sink_match_levelStars',
    COINS:         'sink_match_coins',
    POWER_UPS:     'sink_match_powerUps',
    SETTINGS:      'sink_match_settings'
};

export interface PowerUps {
    addSlot: number;
    remove:  number;
    shuffle: number;
}

export interface Settings {
    sound: boolean;
    music: boolean;
}

declare const wx: any;

function lsGet(key: string): string | null {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const v = wx.getStorageSync(key);
        return v === '' ? null : v;
    }
    return sys.localStorage.getItem(key);
}

function lsSet(key: string, value: string): void {
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
        wx.setStorageSync(key, value);
        return;
    }
    sys.localStorage.setItem(key, value);
}

export class StorageService {
    private static _inst: StorageService;
    public static get inst(): StorageService {
        if (!this._inst) {
            this._inst = new StorageService();
            this._inst.init();
        }
        return this._inst;
    }

    init(): void {
        if (lsGet(KEYS.CURRENT_LEVEL) === null) lsSet(KEYS.CURRENT_LEVEL, '1');
        if (lsGet(KEYS.LEVEL_STARS)   === null) lsSet(KEYS.LEVEL_STARS, '{}');
        if (lsGet(KEYS.COINS)         === null) lsSet(KEYS.COINS, '0');
        if (lsGet(KEYS.POWER_UPS)     === null) lsSet(KEYS.POWER_UPS, JSON.stringify({ addSlot: 3, remove: 3, shuffle: 3 }));
        if (lsGet(KEYS.SETTINGS)      === null) lsSet(KEYS.SETTINGS, JSON.stringify({ sound: true, music: true }));
    }

    getCurrentLevel(): number {
        return parseInt(lsGet(KEYS.CURRENT_LEVEL) || '1', 10);
    }
    setCurrentLevel(level: number): void {
        const cur = this.getCurrentLevel();
        if (level > cur) lsSet(KEYS.CURRENT_LEVEL, String(level));
    }

    getLevelStars(): Record<number, number> {
        try { return JSON.parse(lsGet(KEYS.LEVEL_STARS) || '{}'); }
        catch { return {}; }
    }
    setLevelStars(levelId: number, stars: number): void {
        const map = this.getLevelStars();
        if (!map[levelId] || stars > map[levelId]) {
            map[levelId] = stars;
            lsSet(KEYS.LEVEL_STARS, JSON.stringify(map));
        }
    }
    getTotalStars(): number {
        const map = this.getLevelStars();
        let total = 0;
        Object.values(map).forEach(v => total += v);
        return total;
    }

    getCoins(): number { return parseInt(lsGet(KEYS.COINS) || '0', 10); }
    addCoins(n: number): void { lsSet(KEYS.COINS, String(this.getCoins() + n)); }
    spendCoins(n: number): boolean {
        const c = this.getCoins();
        if (c < n) return false;
        lsSet(KEYS.COINS, String(c - n));
        return true;
    }

    getPowerUps(): PowerUps {
        try { return JSON.parse(lsGet(KEYS.POWER_UPS) || '{}'); }
        catch { return { addSlot: 0, remove: 0, shuffle: 0 }; }
    }
    usePowerUp(type: keyof PowerUps): boolean {
        const p = this.getPowerUps();
        if ((p[type] || 0) <= 0) return false;
        p[type]--;
        lsSet(KEYS.POWER_UPS, JSON.stringify(p));
        return true;
    }
    addPowerUp(type: keyof PowerUps, count = 1): void {
        const p = this.getPowerUps();
        p[type] = (p[type] || 0) + count;
        lsSet(KEYS.POWER_UPS, JSON.stringify(p));
    }

    getSettings(): Settings {
        try { return JSON.parse(lsGet(KEYS.SETTINGS) || '{}'); }
        catch { return { sound: true, music: true }; }
    }
    updateSettings(partial: Partial<Settings>): void {
        const s = { ...this.getSettings(), ...partial };
        lsSet(KEYS.SETTINGS, JSON.stringify(s));
    }
}
