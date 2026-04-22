let _idCounter = 0;

class UtensilItem {
  /**
   * @param {string} type - 厨具类型 (chopstick, spoon, etc.)
   * @param {number} x - 初始 x 坐标
   * @param {number} y - 初始 y 坐标
   * @param {number} layer - 堆叠层级 (0=最底层)
   */
  constructor(type, x, y, layer = 0) {
    this.id = ++_idCounter;
    this.type = type;

    // 逻辑坐标
    this.x = x;
    this.y = y;
    this.rotation = (Math.random() - 0.5) * 0.6; // 随机微旋转
    this.layer = layer;
    this.scale = 1;
    this.alpha = 1;

    // 渲染坐标（含浮动动画偏移）
    this.renderX = x;
    this.renderY = y;
    this.renderRotation = this.rotation;

    // 尺寸（像素）
    this.width = 60;
    this.height = 60;

    // 状态
    this.isVisible = true;
    this.isClickable = true;
    this.isHighlighted = false;

    // 浮动动画参数
    this.floatSpeed = 0.5 + Math.random() * 0.5;
    this.floatAmplitude = 2 + Math.random() * 3;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.rotateAmplitude = 0.02 + Math.random() * 0.03;
  }

  /** 更新浮动动画 */
  updateFloat(time) {
    const t = time * this.floatSpeed + this.floatPhase;
    this.renderX = this.x + Math.sin(t * 0.7) * (this.floatAmplitude * 0.5);
    this.renderY = this.y + Math.sin(t) * this.floatAmplitude;
    this.renderRotation = this.rotation + Math.sin(t * 0.5) * this.rotateAmplitude;
  }

  /** 更新遮挡关系中的可点击状态 */
  updateClickable(itemsAbove) {
    if (!this.isVisible) {
      this.isClickable = false;
      return;
    }
    // 检查是否被上层物品遮挡
    this.isClickable = !itemsAbove.some(other => {
      if (other.layer <= this.layer || !other.isVisible) return false;
      const dx = Math.abs(other.x - this.x);
      const dy = Math.abs(other.y - this.y);
      return dx < (this.width + other.width) * 0.3 && dy < (this.height + other.height) * 0.3;
    });
  }
}

module.exports = UtensilItem;
