const { drawRoundRect, drawText, drawButton } = require('../ui/UIKit');

class HomeScene {
  constructor(screenW, screenH, globalData, goTo) {
    this.w = screenW;
    this.h = screenH;
    this.globalData = globalData;
    this.goTo = goTo;
    this.hitAreas = [];

    const storage = globalData.storageService;
    this.currentLevel = storage.getCurrentLevel();
    const levelStars = storage.getLevelStars();
    this.totalStars = Object.values(levelStars).reduce((s, v) => s + v, 0);
  }

  update(dt) {}

  render(ctx) {
    const { w, h } = this;
    this.hitAreas = [];

    // 背景渐变
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#3a7d44');
    bg.addColorStop(1, '#1a3d22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 标题
    drawText(ctx, '水槽消消乐', w / 2, h * 0.18, { size: 36, bold: true, color: '#fff', shadow: true });
    drawText(ctx, '厨具大挑战', w / 2, h * 0.26, { size: 20, color: '#c8f0c8', shadow: true });

    // 装饰 emoji
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍳', w / 2, h * 0.38);

    // 统计栏
    drawRoundRect(ctx, w * 0.15, h * 0.48, w * 0.7, 52, 12, 'rgba(0,0,0,0.25)', null);
    drawText(ctx, `⭐ ${this.totalStars}`, w * 0.33, h * 0.48 + 26, { size: 18, color: '#ffe066' });
    drawText(ctx, `🏆 第${this.currentLevel}关`, w * 0.67, h * 0.48 + 26, { size: 18, color: '#ffe066' });

    // 开始按钮
    const btnW = w * 0.6;
    const btnH = 54;
    const btnX = (w - btnW) / 2;

    this.hitAreas.push(
      drawButton(ctx, btnX, h * 0.60, btnW, btnH, '开始游戏', { fill: '#e8a020', fontSize: 20 },
        () => this.goTo('game', { levelId: this.currentLevel }))
    );

    this.hitAreas.push(
      drawButton(ctx, btnX, h * 0.60 + btnH + 18, btnW, btnH, '选择关卡',
        { fill: '#3a7d44', stroke: '#7dc87d', fontSize: 20 },
        () => this.goTo('levels', {}))
    );

    // 版本号
    drawText(ctx, 'v1.0.0', w / 2, h * 0.94, { size: 12, color: 'rgba(255,255,255,0.4)' });
  }

  onTouch(type, x, y) {
    if (type !== 'start') return;
    for (const area of this.hitAreas) {
      if (x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        area.action();
        return;
      }
    }
  }

  destroy() {}
}

module.exports = HomeScene;
