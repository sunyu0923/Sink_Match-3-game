const LevelManager = require('../../game/systems/LevelManager');
const app = getApp();

Page({
  data: {
    levels: [],
    currentLevel: 1
  },

  onLoad() {
    const lm = new LevelManager();
    const currentLevel = app.storageService.getCurrentLevel();
    const levelStars = app.storageService.getLevelStars();

    const levels = [];
    for (let i = 1; i <= lm.getTotalLevels(); i++) {
      levels.push({
        id: i,
        stars: levelStars[i] || 0,
        unlocked: i <= currentLevel
      });
    }

    this.setData({ levels, currentLevel });
  },

  onLevelTap(e) {
    const id = e.currentTarget.dataset.id;
    const level = this.data.levels.find(l => l.id === id);
    if (level && level.unlocked) {
      wx.navigateTo({ url: `/pages/game/game?levelId=${id}` });
    }
  }
});
