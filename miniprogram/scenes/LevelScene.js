const LevelManager = require('../game/systems/LevelManager');
const { drawRoundRect, drawText, drawButton, drawStars } = require('../ui/UIKit');

class LevelScene {
  constructor(screenW, screenH, globalData, goTo) {
    this.w = screenW;
    this.h = screenH;
    this.globalData = globalData;
    this.goTo = goTo;
    this.hitAreas = [];

    const lm = new LevelManager();
    const storage = globalData.storageService;
    const currentLevel = storage.getCurrentLevel();
    const levelStars = storage.getLevelStars();

    this.levels = [];
    for (let i = 1; i <= lm.getTotalLevels(); i++) {
      this.levels.push({ id: i, stars: levelStars[i] || 0, unlocked: i <= currentLevel });
    }
  }

  update(dt) {}

  render(ctx) {
    const { w, h } = this;
    this.hitAreas = [];

    // 背景
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1a3d22');
    bg.addColorStop(1, '#0d1f11');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // 顶部导航
    drawText(ctx, '选择关卡', w / 2, 36, { size: 20, bold: true, color: '#fff' });
    this.hitAreas.push(
      drawButton(ctx, 12, 12, 60, 44, '◀ 返回', { fill: 'rgba(255,255,255,0.15)', fontSize: 14 },
        () => this.goTo('home', {}))
    );

    // 关卡网格：4列
    const cols = 4;
    const topOffset = 72;
    const padding = 10;
    const cellW = (w - padding * (cols + 1)) / cols;
    const cellH = cellW * 1.1;

    for (let i = 0; i < this.levels.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cellW + padding);
      const y = topOffset + row * (cellH + padding);
      const lv = this.levels[i];

      const fill = lv.unlocked ? '#2d6e3e' : '#1a2e1f';
      const stroke = lv.unlocked ? '#5ab870' : '#2d4030';

      drawRoundRect(ctx, x, y, cellW, cellH, 10, fill, stroke);

      // 关卡号
      drawText(ctx, String(lv.id), x + cellW / 2, y + cellH * 0.35,
        { size: 18, bold: true, color: lv.unlocked ? '#fff' : '#456040' });

      if (lv.unlocked) {
        drawStars(ctx, x + cellW / 2, y + cellH * 0.72, lv.stars, 12);
      } else {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', x + cellW / 2, y + cellH * 0.65);
      }

      if (lv.unlocked) {
        this.hitAreas.push({ x, y, w: cellW, h: cellH, action: () => this.goTo('game', { levelId: lv.id }) });
      }
    }
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

module.exports = LevelScene;
