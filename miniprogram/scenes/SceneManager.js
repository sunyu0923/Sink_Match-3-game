class SceneManager {
  constructor(canvas, screenW, screenH, dpr, globalData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screenW = screenW;
    this.screenH = screenH;
    this.dpr = dpr;
    this.globalData = globalData;
    this.currentScene = null;
    this.lastTime = Date.now();
    this._loop();
  }

  _loop() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.screenW, this.screenH);

    if (this.currentScene) {
      this.currentScene.update(dt);
      this.currentScene.render(ctx);
    }

    ctx.restore();

    requestAnimationFrame(() => this._loop());
  }

  goTo(sceneName, params) {
    if (this.currentScene && typeof this.currentScene.destroy === 'function') {
      this.currentScene.destroy();
    }

    const HomeScene = require('./HomeScene');
    const LevelScene = require('./LevelScene');
    const GameScene = require('./GameScene');

    const map = { home: HomeScene, levels: LevelScene, game: GameScene };
    const SceneClass = map[sceneName];
    if (!SceneClass) return;

    this.currentScene = new SceneClass(
      this.screenW, this.screenH, this.globalData,
      (name, p) => this.goTo(name, p),
      params || {}
    );
  }

  onTouch(type, x, y) {
    if (this.currentScene && typeof this.currentScene.onTouch === 'function') {
      this.currentScene.onTouch(type, x, y);
    }
  }
}

module.exports = SceneManager;
