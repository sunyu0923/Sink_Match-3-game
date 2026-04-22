const KEYS = {
  CURRENT_LEVEL: 'sink_match_currentLevel',
  LEVEL_STARS: 'sink_match_levelStars',
  COINS: 'sink_match_coins',
  POWER_UPS: 'sink_match_powerUps',
  SETTINGS: 'sink_match_settings'
};

const DEFAULTS = {
  currentLevel: 1,
  levelStars: {},
  coins: 0,
  powerUps: { addSlot: 3, remove: 3, shuffle: 3 },
  settings: { sound: true, music: true }
};

class StorageService {
  init() {
    // 初始化默认值（不覆盖已有数据）
    for (const [prop, key] of Object.entries({
      currentLevel: KEYS.CURRENT_LEVEL,
      levelStars: KEYS.LEVEL_STARS,
      coins: KEYS.COINS,
      powerUps: KEYS.POWER_UPS,
      settings: KEYS.SETTINGS
    })) {
      const existing = wx.getStorageSync(key);
      if (existing === '' || existing === undefined || existing === null) {
        wx.setStorageSync(key, DEFAULTS[prop]);
      }
    }
  }

  // --- 当前关卡 ---

  getCurrentLevel() {
    return wx.getStorageSync(KEYS.CURRENT_LEVEL) || DEFAULTS.currentLevel;
  }

  setCurrentLevel(level) {
    const cur = this.getCurrentLevel();
    if (level > cur) {
      wx.setStorageSync(KEYS.CURRENT_LEVEL, level);
    }
  }

  // --- 星级 ---

  getLevelStars() {
    return wx.getStorageSync(KEYS.LEVEL_STARS) || {};
  }

  setLevelStars(levelId, stars) {
    const all = this.getLevelStars();
    const prev = all[levelId] || 0;
    if (stars > prev) {
      all[levelId] = stars;
      wx.setStorageSync(KEYS.LEVEL_STARS, all);
    }
  }

  // --- 金币 ---

  getCoins() {
    return wx.getStorageSync(KEYS.COINS) || 0;
  }

  addCoins(amount) {
    const cur = this.getCoins();
    wx.setStorageSync(KEYS.COINS, cur + amount);
  }

  spendCoins(amount) {
    const cur = this.getCoins();
    if (cur < amount) return false;
    wx.setStorageSync(KEYS.COINS, cur - amount);
    return true;
  }

  // --- 道具 ---

  getPowerUps() {
    return wx.getStorageSync(KEYS.POWER_UPS) || DEFAULTS.powerUps;
  }

  usePowerUp(type) {
    const ups = this.getPowerUps();
    if ((ups[type] || 0) <= 0) return false;
    ups[type]--;
    wx.setStorageSync(KEYS.POWER_UPS, ups);
    return true;
  }

  addPowerUp(type, count = 1) {
    const ups = this.getPowerUps();
    ups[type] = (ups[type] || 0) + count;
    wx.setStorageSync(KEYS.POWER_UPS, ups);
  }

  // --- 设置 ---

  getSettings() {
    return wx.getStorageSync(KEYS.SETTINGS) || DEFAULTS.settings;
  }

  updateSettings(partial) {
    const settings = this.getSettings();
    Object.assign(settings, partial);
    wx.setStorageSync(KEYS.SETTINGS, settings);
  }
}

module.exports = StorageService;
