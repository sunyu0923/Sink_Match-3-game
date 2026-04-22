const Renderer = require('./Renderer');
const InputHandler = require('./InputHandler');
const AnimationManager = require('./AnimationManager');
const MatchSystem = require('../systems/MatchSystem');
const PhysicsLite = require('../systems/PhysicsLite');
const SinkPool = require('../entities/SinkPool');

const STATE = {
  LOADING: 'LOADING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  WIN: 'WIN',
  LOSE: 'LOSE'
};

class GameEngine {
  constructor(canvas, canvasWidth, canvasHeight, dpr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.dpr = dpr;

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    this.ctx.scale(dpr, dpr);

    this.state = STATE.LOADING;
    this.lastTime = 0;
    this.rafId = null;

    // 子系统
    this.renderer = new Renderer(this.ctx, canvasWidth, canvasHeight);
    this.inputHandler = new InputHandler(this);
    this.animationManager = new AnimationManager();
    this.matchSystem = new MatchSystem();
    this.physicsLite = new PhysicsLite();
    this.sinkPool = null;

    // 游戏数据
    this.levelConfig = null;
    this.queue = [];          // 队列中的厨具 [{type, id}]
    this.plates = [];         // 盘子中的厨具 [null, null, null, null]
    this.plateUnlocked = [];  // 盘子解锁状态 [true, true, false, false]
    this.goals = {};          // 剩余目标 {type: count}
    this.extraSlots = 0;      // 临时扩容格子数

    // 回调
    this.onStateChange = null;  // (newState, data) => {}
    this.onQueueChange = null;  // (queue, plates) => {}
    this.onGoalChange = null;   // (goals) => {}
  }

  /** 加载关卡并开始 */
  loadLevel(levelConfig) {
    this.levelConfig = levelConfig;
    this.state = STATE.LOADING;

    // 初始化槽位
    this.queue = [];
    this.extraSlots = 0;
    this.plates = new Array(4).fill(null);
    this.plateUnlocked = [];
    for (let i = 0; i < 4; i++) {
      this.plateUnlocked.push(i < (levelConfig.initialSlots || 2));
    }

    // 初始化目标
    this.goals = Object.assign({}, levelConfig.goals);

    // 生成水槽中的厨具
    this.sinkPool = new SinkPool(this.width, this.height);
    this.sinkPool.generate(levelConfig);

    this.physicsLite.init(this.sinkPool.items);

    this.state = STATE.PLAYING;
    this._notifyStateChange();
    this._notifyQueueChange();
    this._notifyGoalChange();

    this.lastTime = Date.now();
    this._loop();
  }

  _loop() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;

    if (this.state === STATE.PLAYING) {
      this.physicsLite.update(dt, this.sinkPool.items);
      this.animationManager.update(dt);
    }

    this.renderer.render(this.sinkPool, this.animationManager);

    this.rafId = this.canvas.requestAnimationFrame(() => this._loop());
  }

  /** 暂停/恢复 */
  pause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      this._notifyStateChange();
    }
  }

  resume() {
    if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.lastTime = Date.now();
      this._notifyStateChange();
    }
  }

  /** 玩家点击拾取厨具 */
  pickUtensil(item) {
    if (this.state !== STATE.PLAYING) return;
    if (!item || !item.isClickable) return;

    const maxQueue = 7 + this.extraSlots;
    if (this.queue.length >= maxQueue) return; // 队列满

    // 从水槽移除
    this.sinkPool.removeItem(item);

    // 加入队列
    this.queue.push({ type: item.type, id: item.id });
    this._notifyQueueChange();

    // 检查匹配
    this._checkMatch();
  }

  /** 检查并执行消除 */
  _checkMatch() {
    const result = this.matchSystem.check(this.queue);
    if (result) {
      // 从队列中移除匹配的 3 个
      const matchedIds = new Set(result.matchedIds);
      this.queue = this.queue.filter(item => !matchedIds.has(item.id));

      // 更新目标
      if (this.goals[result.type] !== undefined) {
        this.goals[result.type] = Math.max(0, this.goals[result.type] - 3);
      }
      this._notifyGoalChange();
      this._notifyQueueChange();

      // 检查胜利
      const allDone = Object.values(this.goals).every(v => v <= 0);
      if (allDone) {
        this.state = STATE.WIN;
        this._notifyStateChange();
        return;
      }

      // 递归检查（可能连消）
      this._checkMatch();
    } else {
      // 没有匹配，检查失败
      this._checkLose();
    }
  }

  _checkLose() {
    const maxQueue = 7 + this.extraSlots;
    if (this.queue.length >= maxQueue) {
      // 检查盘子是否有空位
      const hasEmptyPlate = this.plates.some((p, i) => p === null && this.plateUnlocked[i]);
      if (!hasEmptyPlate) {
        this.state = STATE.LOSE;
        this._notifyStateChange();
      }
    }
  }

  // --- 盘子操作 ---

  /** 从队列移到盘子 */
  moveToPlate(queueIndex, plateIndex) {
    if (!this.plateUnlocked[plateIndex] || this.plates[plateIndex] !== null) return;
    if (queueIndex < 0 || queueIndex >= this.queue.length) return;

    this.plates[plateIndex] = this.queue.splice(queueIndex, 1)[0];
    this._notifyQueueChange();
  }

  /** 从盘子放回队列 */
  moveFromPlate(plateIndex) {
    if (this.plates[plateIndex] === null) return;
    const maxQueue = 7 + this.extraSlots;
    if (this.queue.length >= maxQueue) return;

    this.queue.push(this.plates[plateIndex]);
    this.plates[plateIndex] = null;
    this._notifyQueueChange();
    this._checkMatch();
  }

  /** 解锁盘子 */
  unlockPlate(plateIndex) {
    if (plateIndex >= 0 && plateIndex < 4) {
      this.plateUnlocked[plateIndex] = true;
      this._notifyQueueChange();
    }
  }

  // --- 道具 ---

  /** 加厨具牌：扩容 3 格 */
  powerUpAddSlots() {
    if (this.state !== STATE.PLAYING) return false;
    this.extraSlots += 3;
    this._notifyQueueChange();
    return true;
  }

  /** 移除：从队列移除最后一个厨具放回水槽 */
  powerUpRemove() {
    if (this.state !== STATE.PLAYING || this.queue.length === 0) return false;
    const removed = this.queue.pop();
    this.sinkPool.returnItem(removed);
    this._notifyQueueChange();
    return true;
  }

  /** 打乱：水槽中厨具重新随机排列 */
  powerUpShuffle() {
    if (this.state !== STATE.PLAYING) return false;
    this.sinkPool.shuffleItems();
    return true;
  }

  // --- 触摸事件入口 ---

  handleTouchStart(e) {
    this.inputHandler.onTouchStart(e);
  }

  handleTouchMove(e) {
    this.inputHandler.onTouchMove(e);
  }

  handleTouchEnd(e) {
    this.inputHandler.onTouchEnd(e);
  }

  // --- 通知回调 ---

  _notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state, {
        goals: this.goals,
        queue: this.queue,
        plates: this.plates
      });
    }
  }

  _notifyQueueChange() {
    if (this.onQueueChange) {
      this.onQueueChange(this.queue, this.plates, this.plateUnlocked, this.extraSlots);
    }
  }

  _notifyGoalChange() {
    if (this.onGoalChange) {
      this.onGoalChange(this.goals);
    }
  }

  /** 销毁 */
  destroy() {
    if (this.rafId) {
      this.canvas.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

GameEngine.STATE = STATE;

module.exports = GameEngine;
