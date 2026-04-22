const { pointInRect } = require('../../utils/math');

class InputHandler {
  constructor(engine) {
    this.engine = engine;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * 外部调用：传入相对水槽区域的坐标
   * @param {number} x - 相对水槽左上角的 x
   * @param {number} y - 相对水槽左上角的 y
   */
  hitTest(x, y) {
    if (this.engine.state !== 'PLAYING') return;

    const items = this.engine.sinkPool.getVisibleItems();
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

  onTouchStart(e) {
    const touch = e.touches[0];
    this.hitTest(touch.x - this.offsetX, touch.y - this.offsetY);
  }

  onTouchMove(e) {}

  onTouchEnd(e) {}
}

module.exports = InputHandler;
