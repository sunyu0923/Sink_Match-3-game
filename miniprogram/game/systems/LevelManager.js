const levelsData = require('../data/levels');

class LevelManager {
  constructor() {
    this.levels = levelsData;
  }

  /**
   * 获取指定关卡配置
   * @param {number} levelId - 关卡 ID（从 1 开始）
   * @returns {Object|null}
   */
  getLevel(levelId) {
    return this.levels.find(l => l.levelId === levelId) || null;
  }

  /** 获取总关卡数 */
  getTotalLevels() {
    return this.levels.length;
  }

  /**
   * 计算关卡星级
   * @param {number} levelId
   * @param {number} remainingItems - 剩余未消除数
   * @param {number} timeUsed - 用时（秒）
   * @returns {number} 1-3 星
   */
  calculateStars(levelId, remainingItems, timeUsed) {
    const config = this.getLevel(levelId);
    if (!config) return 1;

    // 基础：通关就是 1 星
    let stars = 1;

    // 没有剩余道具使用 → 2 星
    if (remainingItems === 0) stars = 2;

    // 有时间限制的关卡，用时少于 60% → 3 星
    if (config.timeLimit) {
      if (timeUsed < config.timeLimit * 0.6) stars = 3;
    } else {
      // 无时间限制，通关即 3 星（简单关）或看效率
      stars = 3;
    }

    return stars;
  }
}

module.exports = LevelManager;
