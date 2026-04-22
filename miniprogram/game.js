const StorageService = require('./services/StorageService');
const AdService = require('./services/AdService');
const AudioService = require('./services/AudioService');
const SceneManager = require('./scenes/SceneManager');

const storageService = new StorageService();
const adService = new AdService();
const audioService = new AudioService();

storageService.init();
adService.init('adunit-placeholder');

const sysInfo = wx.getSystemInfoSync();
const screenW = sysInfo.windowWidth;
const screenH = sysInfo.windowHeight;
const dpr = sysInfo.pixelRatio;

const canvas = wx.createCanvas();
canvas.width = screenW * dpr;
canvas.height = screenH * dpr;

const globalData = {
  storageService,
  adService,
  audioService,
  screenW,
  screenH,
  dpr,
  canvas
};

module.exports = globalData;

const sceneManager = new SceneManager(canvas, screenW, screenH, dpr, globalData);

wx.onTouchStart(e => sceneManager.onTouch('start', e.touches[0].clientX, e.touches[0].clientY));
wx.onTouchMove(e => sceneManager.onTouch('move', e.touches[0].clientX, e.touches[0].clientY));
wx.onTouchEnd(() => sceneManager.onTouch('end', 0, 0));

sceneManager.goTo('home');
