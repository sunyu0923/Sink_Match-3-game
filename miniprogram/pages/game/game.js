const GameEngine = require('../../game/engine/GameEngine');
const LevelManager = require('../../game/systems/LevelManager');

const app = getApp();

Page({
  data: {
    levelId: 1,
    levelConfig: null,
    gameState: 'LOADING',
    queue: [],
    plates: [null, null, null, null],
    plateUnlocked: [true, true, false, false],
    extraSlots: 0,
    goals: {},
    powerUps: { addSlot: 1, remove: 1, shuffle: 1 },
    showPauseModal: false,
    showResultModal: false,
    resultStars: 0,
    canvasWidth: 0,
    canvasHeight: 0
  },

  engine: null,
  levelManager: null,

  onLoad(options) {
    this.levelManager = new LevelManager();
    const levelId = parseInt(options.levelId) || 1;

    const sysInfo = wx.getWindowInfo();
    const canvasWidth = sysInfo.windowWidth;
    // Canvas 占屏幕中间 55% 区域
    const canvasHeight = Math.floor(sysInfo.windowHeight * 0.55);

    const levelConfig = this.levelManager.getLevel(levelId);
    const powerUps = app.storageService.getPowerUps();

    this.setData({
      levelId,
      levelConfig,
      canvasWidth,
      canvasHeight,
      powerUps,
      goals: levelConfig ? Object.assign({}, levelConfig.goals) : {}
    });
  },

  onReady() {
    this._initCanvas();
  },

  _initCanvas() {
    const query = wx.createSelectorQuery();
    query.select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return;

        const canvas = res[0].node;
        const dpr = wx.getSystemInfoSync().pixelRatio;

        this.engine = new GameEngine(
          canvas,
          this.data.canvasWidth,
          this.data.canvasHeight,
          dpr
        );

        // 绑定回调
        this.engine.onStateChange = (state, data) => this._onGameStateChange(state, data);
        this.engine.onQueueChange = (queue, plates, plateUnlocked, extraSlots) => {
          this.setData({ queue, plates, plateUnlocked, extraSlots });
        };
        this.engine.onGoalChange = (goals) => {
          this.setData({ goals });
        };

        // 加载关卡
        if (this.data.levelConfig) {
          this.engine.loadLevel(this.data.levelConfig);
          this.setData({ gameState: 'PLAYING' });
        }
      });
  },

  _onGameStateChange(state, data) {
    this.setData({ gameState: state });

    if (state === 'WIN') {
      const stars = this.levelManager.calculateStars(this.data.levelId, 0, 0);
      app.storageService.setLevelStars(this.data.levelId, stars);
      app.storageService.setCurrentLevel(this.data.levelId + 1);
      app.storageService.addCoins(stars * 10);
      this.setData({ showResultModal: true, resultStars: stars });
    } else if (state === 'LOSE') {
      this.setData({ showResultModal: true, resultStars: 0 });
    }
  },

  // --- 触摸事件 ---
  onCanvasTouchStart(e) {
    if (this.engine) this.engine.handleTouchStart(e);
  },
  onCanvasTouchMove(e) {
    if (this.engine) this.engine.handleTouchMove(e);
  },
  onCanvasTouchEnd(e) {
    if (this.engine) this.engine.handleTouchEnd(e);
  },

  // --- HUD 事件 ---
  onPause() {
    if (this.engine) this.engine.pause();
    this.setData({ showPauseModal: true });
  },
  onResume() {
    if (this.engine) this.engine.resume();
    this.setData({ showPauseModal: false });
  },
  onBackToHome() {
    if (this.engine) this.engine.destroy();
    wx.navigateBack();
  },

  // --- 槽位事件 ---
  onUnlockPlate(e) {
    const { index } = e.detail;
    app.adService.showRewardedAd().then(completed => {
      if (completed && this.engine) {
        this.engine.unlockPlate(index);
      }
    });
  },

  onPlateClick(e) {
    const { index } = e.detail;
    if (this.engine) {
      // 如果盘子有厨具，放回队列；否则不操作
      if (this.data.plates[index]) {
        this.engine.moveFromPlate(index);
      }
    }
  },

  // --- 道具事件 ---
  onPowerUp(e) {
    const { type } = e.detail;
    if (!this.engine) return;

    // 先尝试使用存储的道具
    const hasItem = app.storageService.usePowerUp(type);

    if (hasItem) {
      this._executePowerUp(type);
      this.setData({ powerUps: app.storageService.getPowerUps() });
    } else {
      // 没有道具，看广告获取
      app.adService.showRewardedAd().then(completed => {
        if (completed) {
          app.storageService.addPowerUp(type, 1);
          this._executePowerUp(type);
          this.setData({ powerUps: app.storageService.getPowerUps() });
        }
      });
    }
  },

  _executePowerUp(type) {
    switch (type) {
      case 'addSlot': this.engine.powerUpAddSlots(); break;
      case 'remove': this.engine.powerUpRemove(); break;
      case 'shuffle': this.engine.powerUpShuffle(); break;
    }
  },

  // --- 结算 ---
  onNextLevel() {
    this.setData({ showResultModal: false });
    if (this.engine) this.engine.destroy();

    const nextId = this.data.levelId + 1;
    const nextConfig = this.levelManager.getLevel(nextId);
    if (nextConfig) {
      this.setData({
        levelId: nextId,
        levelConfig: nextConfig,
        goals: Object.assign({}, nextConfig.goals),
        powerUps: app.storageService.getPowerUps()
      });
      this._initCanvas();
    } else {
      wx.navigateBack();
    }
  },

  onRetry() {
    this.setData({ showResultModal: false });
    if (this.engine) this.engine.destroy();
    this._initCanvas();
  },

  onUnload() {
    if (this.engine) this.engine.destroy();
  }
});
