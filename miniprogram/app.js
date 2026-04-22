const StorageService = require('./services/StorageService');
const AdService = require('./services/AdService');
const AudioService = require('./services/AudioService');

App({
  onLaunch() {
    this.storageService = new StorageService();
    this.adService = new AdService();
    this.audioService = new AudioService();

    this.storageService.init();
    // 广告单元 ID 上线前替换为真实值
    this.adService.init('adunit-placeholder');
  },

  globalData: {
    screenWidth: 0,
    screenHeight: 0,
    dpr: 1
  },

  onShow() {
    const sysInfo = wx.getWindowInfo();
    this.globalData.screenWidth = sysInfo.windowWidth;
    this.globalData.screenHeight = sysInfo.windowHeight;
    this.globalData.dpr = wx.getSystemInfoSync().pixelRatio;
  }
});
