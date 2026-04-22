const { pointInRect } = require('../../utils/math');

class InputHandler {
  constructor(engine) {
    this.engine = engine;
    this.touching = false;
  }

  onTouchStart(e) {
    if (this.engine.state !== 'PLAYING') return;

    const touch = e.touches[0];
    const x = touch.x;
    const y = touch.y;

    // 从最上层开始反向遍历，找到第一个可点击的厨具
    const items = this.engine.sinkPool.getVisibleItems();
    // 按层级降序 + y 降序排列（最上层最先检测）
    const sorted = items.slice().sort((a, b) => {
      if (a.layer !== b.layer) return b.layer - a.layer;
      return b.y - a.y;
    });

    for (const item of sorted) {
      if (!item.isClickable) continue;

      const halfW = (item.width * item.scale) / 2;
      const halfH = (item.height * item.scale) / 2;

      if (pointInRect(x, y, item.renderX - halfW, item.renderY - halfH, halfW * 2, halfH * 2)) {
        this.engine.pickUtensil(item);
        break;
      }
    }
  }

  onTouchMove(e) {
    // 暂不需要拖拽
  }

  onTouchEnd(e) {
    this.touching = false;
  }
}

module.exports = InputHandler;
