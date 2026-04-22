class PhysicsLite {
  constructor() {
    this.time = 0;
  }

  init(items) {
    this.time = 0;
  }

  /**
   * 更新所有厨具的浮动动画
   * @param {number} dt - 帧间隔（秒）
   * @param {Array} items - UtensilItem 列表
   */
  update(dt, items) {
    this.time += dt;
    for (const item of items) {
      if (!item.isVisible) continue;
      item.updateFloat(this.time);
    }
  }
}

module.exports = PhysicsLite;
