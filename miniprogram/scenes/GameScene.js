const GameEngine = require('../game/engine/GameEngine');
const LevelManager = require('../game/systems/LevelManager');
const { drawRoundRect, drawText, drawButton, drawStars, drawModalOverlay } = require('../ui/UIKit');

const EMOJI = {
  chopstick: '🥢', spoon: '🥄', fork: '🍴',
  spatula: '🔪', whisk: '🔄', ladle: '🥣',
  board: '🪵', rolling_pin: '📏'
};

class GameScene {
  constructor(screenW, screenH, globalData, goTo, params) {
    this.w = screenW;
    this.h = screenH;
    this.globalData = globalData;
    this.goTo = goTo;
    this.hitAreas = [];

    this.levelManager = new LevelManager();
    this.levelId = params.levelId || 1;

    // 布局常量
    this.HUD_H = 70;
    this.SLOT_H = 100;
    this.TOOL_H = 80;
    this.sinkH = screenH - this.HUD_H - this.SLOT_H - this.TOOL_H;
    this.sinkOffsetY = this.HUD_H;

    // 游戏状态（镜像 engine 数据，用于渲染）
    this.queue = [];
    this.plates = [null, null, null, null];
    this.plateUnlocked = [true, true, false, false];
    this.extraSlots = 0;
    this.goals = {};
    this.powerUps = globalData.storageService.getPowerUps();

    this.gameState = 'LOADING';
    this.showPauseModal = false;
    this.showResultModal = false;
    this.resultStars = 0;

    this._initEngine();
  }

  _initEngine() {
    const levelConfig = this.levelManager.getLevel(this.levelId);
    if (!levelConfig) return;

    // 创建离屏 ctx（使用主 canvas 的 ctx，渲染时用 save/translate 限定区域）
    // GameEngine 直接持有主 canvas ctx，Renderer 在水槽坐标系内绘制
    const { canvas } = this.globalData;
    const ctx = canvas.getContext('2d');

    this.engine = new GameEngine(ctx, this.w, this.sinkH);

    this.engine.onStateChange = (state) => {
      this.gameState = state;
      if (state === 'WIN') {
        const stars = this.levelManager.calculateStars(this.levelId, 0, 0);
        const storage = this.globalData.storageService;
        storage.setLevelStars(this.levelId, stars);
        storage.setCurrentLevel(this.levelId + 1);
        storage.addCoins(stars * 10);
        this.resultStars = stars;
        this.showResultModal = true;
      } else if (state === 'LOSE') {
        this.resultStars = 0;
        this.showResultModal = true;
      }
    };

    this.engine.onQueueChange = (queue, plates, plateUnlocked, extraSlots) => {
      this.queue = queue;
      this.plates = plates;
      this.plateUnlocked = plateUnlocked;
      this.extraSlots = extraSlots;
    };

    this.engine.onGoalChange = (goals) => {
      this.goals = goals;
    };

    this.engine.loadLevel(levelConfig);
    this.gameState = 'PLAYING';
    this.goals = Object.assign({}, levelConfig.goals);
  }

  update(dt) {
    if (this.engine && !this.showPauseModal && !this.showResultModal) {
      this.engine.update(dt);
    }
  }

  render(ctx) {
    const { w, h } = this;
    this.hitAreas = [];

    // 背景
    ctx.fillStyle = '#1a2e1f';
    ctx.fillRect(0, 0, w, h);

    this._renderHUD(ctx);
    this._renderSink(ctx);
    this._renderSlotBar(ctx);
    this._renderToolBar(ctx);

    if (this.showPauseModal) this._renderPauseModal(ctx);
    if (this.showResultModal) this._renderResultModal(ctx);
  }

  _renderHUD(ctx) {
    const { w, HUD_H } = this;

    drawRoundRect(ctx, 0, 0, w, HUD_H, 0, 'rgba(0,0,0,0.4)', null);

    // 暂停按钮
    this.hitAreas.push(
      drawButton(ctx, 10, 12, 50, 46, '⏸', { fill: 'rgba(255,255,255,0.15)', fontSize: 20 },
        () => { this.showPauseModal = true; if (this.engine) this.engine.pause(); })
    );

    // 关卡号
    drawText(ctx, `第 ${this.levelId} 关`, w / 2, HUD_H / 2, { size: 18, bold: true, color: '#fff' });

    // 目标（右侧）
    const goalEntries = Object.entries(this.goals);
    let gx = w - 14;
    for (let i = goalEntries.length - 1; i >= 0; i--) {
      const [type, count] = goalEntries[i];
      const emoji = EMOJI[type] || '?';
      const label = `${emoji}×${count}`;
      const tw = label.length * 10 + 4;
      gx -= tw;
      drawText(ctx, label, gx + tw / 2, HUD_H / 2,
        { size: 14, color: count > 0 ? '#ffe066' : '#88cc88' });
      gx -= 4;
    }
  }

  _renderSink(ctx) {
    if (!this.engine || !this.engine.sinkPool) return;
    ctx.save();
    ctx.translate(0, this.sinkOffsetY);
    // 裁剪到水槽区域
    ctx.beginPath();
    ctx.rect(0, 0, this.w, this.sinkH);
    ctx.clip();
    this.engine.renderSink(ctx);
    ctx.restore();

    // 注册水槽触摸区域
    this.hitAreas.push({
      x: 0, y: this.sinkOffsetY, w: this.w, h: this.sinkH,
      action: null, isSink: true
    });
  }

  _renderSlotBar(ctx) {
    const { w, HUD_H, sinkH, SLOT_H } = this;
    const barY = HUD_H + sinkH;

    drawRoundRect(ctx, 0, barY, w, SLOT_H, 0, 'rgba(0,0,0,0.45)', null);

    // 队列格子（上排）
    const maxQueue = 7 + this.extraSlots;
    const cellSize = Math.min(38, (w - 12) / maxQueue - 4);
    const queueRowY = barY + 6;
    const totalQW = maxQueue * (cellSize + 4) - 4;
    let qx = (w - totalQW) / 2;

    for (let i = 0; i < maxQueue; i++) {
      const item = this.queue[i] || null;
      const fill = item ? '#4a7a55' : 'rgba(255,255,255,0.08)';
      drawRoundRect(ctx, qx, queueRowY, cellSize, cellSize, 6, fill, 'rgba(255,255,255,0.2)');
      if (item) {
        ctx.font = `${cellSize * 0.55}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(EMOJI[item.type] || '?', qx + cellSize / 2, queueRowY + cellSize / 2);
      }
      qx += cellSize + 4;
    }

    // 盘子格子（下排）
    const plateSize = Math.min(40, (w - 20) / 4 - 8);
    const plateRowY = barY + cellSize + 14;
    const totalPW = 4 * (plateSize + 8) - 8;
    let px = (w - totalPW) / 2;

    for (let i = 0; i < 4; i++) {
      const unlocked = this.plateUnlocked[i];
      const item = this.plates[i];
      const fill = unlocked ? (item ? '#5a9e6f' : 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.3)';
      const stroke = unlocked ? '#7dc87d' : '#333';
      drawRoundRect(ctx, px, plateRowY, plateSize, plateSize, 8, fill, stroke);

      if (!unlocked) {
        ctx.font = `${plateSize * 0.45}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', px + plateSize / 2, plateRowY + plateSize / 2);
        const idx = i;
        this.hitAreas.push({
          x: px, y: plateRowY, w: plateSize, h: plateSize,
          action: () => this._unlockPlate(idx)
        });
      } else if (item) {
        ctx.font = `${plateSize * 0.55}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(EMOJI[item.type] || '?', px + plateSize / 2, plateRowY + plateSize / 2);
        const idx = i;
        this.hitAreas.push({
          x: px, y: plateRowY, w: plateSize, h: plateSize,
          action: () => { if (this.engine) this.engine.moveFromPlate(idx); }
        });
      }
      px += plateSize + 8;
    }
  }

  _renderToolBar(ctx) {
    const { w, h, TOOL_H } = this;
    const barY = h - TOOL_H;

    drawRoundRect(ctx, 0, barY, w, TOOL_H, 0, 'rgba(0,0,0,0.5)', null);

    const tools = [
      { key: 'addSlot', icon: '➕', name: '加槽' },
      { key: 'remove', icon: '↩️', name: '移除' },
      { key: 'shuffle', icon: '🔀', name: '打乱' }
    ];

    const btnW = w / 3 - 12;
    const btnH = TOOL_H - 16;
    let tx = 8;

    for (const tool of tools) {
      const count = this.powerUps[tool.key] || 0;
      const fill = count > 0 ? '#2d5e3e' : '#1a2e22';
      drawRoundRect(ctx, tx, barY + 8, btnW, btnH, 10, fill, '#4a8a5a');

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tool.icon, tx + btnW / 2, barY + 8 + btnH * 0.4);

      drawText(ctx, tool.name, tx + btnW / 2, barY + 8 + btnH * 0.72,
        { size: 12, color: '#ccc' });

      // 数量徽章
      const badge = count > 0 ? String(count) : '+AD';
      drawRoundRect(ctx, tx + btnW - 22, barY + 8, 22, 18, 4,
        count > 0 ? '#e8a020' : '#888', null);
      drawText(ctx, badge, tx + btnW - 11, barY + 17, { size: 11, color: '#fff', bold: true });

      const k = tool.key;
      this.hitAreas.push({
        x: tx, y: barY + 8, w: btnW, h: btnH,
        action: () => this._usePowerUp(k)
      });

      tx += btnW + 12;
    }
  }

  _renderPauseModal(ctx) {
    const { w, h } = this;
    drawModalOverlay(ctx, w, h);

    const mw = w * 0.7, mh = 180;
    const mx = (w - mw) / 2, my = (h - mh) / 2;
    drawRoundRect(ctx, mx, my, mw, mh, 16, '#1e3d28', '#5ab870');
    drawText(ctx, '游戏暂停', w / 2, my + 40, { size: 20, bold: true, color: '#fff' });

    this.hitAreas.push(
      drawButton(ctx, mx + 16, my + 70, mw - 32, 44, '继续',
        { fill: '#5a9e6f', fontSize: 18 },
        () => { this.showPauseModal = false; if (this.engine) this.engine.resume(); })
    );
    this.hitAreas.push(
      drawButton(ctx, mx + 16, my + 122, mw - 32, 44, '退出',
        { fill: '#7a3030', fontSize: 18 },
        () => this.goTo('home', {}))
    );
  }

  _renderResultModal(ctx) {
    const { w, h } = this;
    drawModalOverlay(ctx, w, h);

    const win = this.gameState === 'WIN';
    const mw = w * 0.75, mh = win ? 240 : 200;
    const mx = (w - mw) / 2, my = (h - mh) / 2;
    drawRoundRect(ctx, mx, my, mw, mh, 16, '#1e3d28', '#5ab870');

    drawText(ctx, win ? '恭喜过关！' : '挑战失败', w / 2, my + 38,
      { size: 22, bold: true, color: win ? '#ffe066' : '#ff8888' });

    let btnY = my + 65;
    if (win) {
      const { drawStars } = require('../ui/UIKit');
      drawStars(ctx, w / 2, my + 72, this.resultStars, 20);
      btnY = my + 108;
    }

    this.hitAreas.push(
      drawButton(ctx, mx + 16, btnY, mw - 32, 44, '再试一次',
        { fill: '#5a9e6f', fontSize: 18 },
        () => this._retry())
    );

    if (win) {
      this.hitAreas.push(
        drawButton(ctx, mx + 16, btnY + 52, mw - 32, 44, '下一关',
          { fill: '#e8a020', fontSize: 18 },
          () => this._nextLevel())
      );
    }

    this.hitAreas.push(
      drawButton(ctx, mx + 16, btnY + (win ? 104 : 52), mw - 32, 44, '返回主页',
        { fill: '#7a3030', fontSize: 18 },
        () => this.goTo('home', {}))
    );
  }

  onTouch(type, x, y) {
    if (type !== 'start') return;

    // 检查 UI hitAreas（弹窗、按钮、盘子、道具）
    for (const area of this.hitAreas) {
      if (area.action && !area.isSink &&
          x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h) {
        area.action();
        return;
      }
    }

    // 检查水槽区域
    const sinkArea = this.hitAreas.find(a => a.isSink);
    if (sinkArea && x >= sinkArea.x && x <= sinkArea.x + sinkArea.w &&
        y >= sinkArea.y && y <= sinkArea.y + sinkArea.h) {
      const relX = x;
      const relY = y - this.sinkOffsetY;
      if (this.engine) {
        this.engine.inputHandler.hitTest(relX, relY);
      }
    }
  }

  _unlockPlate(index) {
    this.globalData.adService.showRewardedAd().then(completed => {
      if (completed && this.engine) this.engine.unlockPlate(index);
    });
  }

  _usePowerUp(type) {
    if (!this.engine) return;
    const storage = this.globalData.storageService;
    const hasItem = storage.usePowerUp(type);
    if (hasItem) {
      this._executePowerUp(type);
    } else {
      this.globalData.adService.showRewardedAd().then(completed => {
        if (completed) {
          storage.addPowerUp(type, 1);
          this._executePowerUp(type);
        }
      });
    }
    this.powerUps = storage.getPowerUps();
  }

  _executePowerUp(type) {
    if (!this.engine) return;
    if (type === 'addSlot') this.engine.powerUpAddSlots();
    else if (type === 'remove') this.engine.powerUpRemove();
    else if (type === 'shuffle') this.engine.powerUpShuffle();
  }

  _retry() {
    this.showResultModal = false;
    if (this.engine) this.engine.destroy();
    this.queue = [];
    this.plates = [null, null, null, null];
    this.gameState = 'LOADING';
    this._initEngine();
  }

  _nextLevel() {
    this.showResultModal = false;
    if (this.engine) this.engine.destroy();
    const nextId = this.levelId + 1;
    const nextConfig = this.levelManager.getLevel(nextId);
    if (nextConfig) {
      this.levelId = nextId;
      this.queue = [];
      this.plates = [null, null, null, null];
      this.powerUps = this.globalData.storageService.getPowerUps();
      this.gameState = 'LOADING';
      this._initEngine();
    } else {
      this.goTo('home', {});
    }
  }

  destroy() {
    if (this.engine) this.engine.destroy();
  }
}

module.exports = GameScene;
