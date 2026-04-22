const app = getApp();

Page({
  data: {
    currentLevel: 1,
    totalStars: 0
  },

  onShow() {
    const currentLevel = app.storageService.getCurrentLevel();
    const levelStars = app.storageService.getLevelStars();
    const totalStars = Object.values(levelStars).reduce((sum, s) => sum + s, 0);
    this.setData({ currentLevel, totalStars });
  },

  onStartGame() {
    const level = this.data.currentLevel;
    wx.navigateTo({ url: `/pages/game/game?levelId=${level}` });
  },

  onSelectLevel() {
    wx.navigateTo({ url: '/pages/levels/levels' });
  },

  onShareAppMessage() {
    return {
      title: '水槽厨具消消乐 - 快来挑战！',
      path: '/pages/home/home'
    };
  }
});
