const UtensilItem = require('./UtensilItem');
const { randomRange, shuffle, pointInEllipse } = require('../../utils/math');

class SinkPool {
  /**
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  constructor(canvasWidth, canvasHeight) {
    this.w = canvasWidth;
    this.h = canvasHeight;
    this.items = [];

    // 水槽区域参数（与 Renderer 保持一致）
    this.cx = canvasWidth / 2;
    this.cy = canvasHeight * 0.55;
    this.rx = canvasWidth * 0.44;
    this.ry = canvasWidth * 0.38;
  }

  /**
   * 根据关卡配置生成厨具
   * @param {Object} config - 关卡配置
   */
  generate(config) {
    this.items = [];

    const { goals, layerCount } = config;
    const typeList = [];

    // 按目标生成类型列表 (每种都是 3 的倍数)
    for (const [type, count] of Object.entries(goals)) {
      for (let i = 0; i < count; i++) {
        typeList.push(type);
      }
    }

    // 打乱顺序
    const shuffled = shuffle(typeList);

    // 分配层级
    const itemsPerLayer = Math.ceil(shuffled.length / layerCount);

    for (let i = 0; i < shuffled.length; i++) {
      const layer = Math.floor(i / itemsPerLayer);
      const pos = this._randomPositionInSink(layer);
      const item = new UtensilItem(shuffled[i], pos.x, pos.y, layer);
      this.items.push(item);
    }

    // 更新遮挡关系
    this._updateClickableStates();
  }

  /** 在水槽椭圆区域内随机取一个位置 */
  _randomPositionInSink(layer) {
    const margin = 0.75; // 留边距
    let x, y;
    let attempts = 0;

    do {
      x = this.cx + randomRange(-this.rx * margin, this.rx * margin);
      y = this.cy + randomRange(-this.ry * margin, this.ry * margin);
      attempts++;
    } while (!pointInEllipse(x, y, this.cx, this.cy, this.rx * margin, this.ry * margin) && attempts < 50);

    // 上层稍微偏向中心
    if (layer > 0) {
      const centerPull = 0.15 * layer;
      x = x + (this.cx - x) * centerPull;
      y = y + (this.cy - y) * centerPull;
    }

    return { x, y };
  }

  /** 获取所有可见的厨具 */
  getVisibleItems() {
    return this.items.filter(item => item.isVisible);
  }

  /** 从水槽中移除一个厨具 */
  removeItem(item) {
    item.isVisible = false;
    item.isClickable = false;
    this._updateClickableStates();
  }

  /** 把厨具放回水槽（道具：移除） */
  returnItem(queueItem) {
    // 找到对应的原始 item 并恢复
    const original = this.items.find(it => it.id === queueItem.id);
    if (original) {
      original.isVisible = true;
      // 重新随机位置（放到最上层）
      const maxLayer = Math.max(...this.items.filter(i => i.isVisible).map(i => i.layer), 0);
      const pos = this._randomPositionInSink(maxLayer);
      original.x = pos.x;
      original.y = pos.y;
      original.renderX = pos.x;
      original.renderY = pos.y;
      original.layer = maxLayer;
      this._updateClickableStates();
    }
  }

  /** 打乱所有可见厨具的位置（道具：打乱） */
  shuffleItems() {
    const visible = this.getVisibleItems();
    const positions = visible.map(item => ({
      x: item.x,
      y: item.y,
      layer: item.layer
    }));
    const shuffledPositions = shuffle(positions);

    visible.forEach((item, i) => {
      item.x = shuffledPositions[i].x;
      item.y = shuffledPositions[i].y;
      item.layer = shuffledPositions[i].layer;
      item.renderX = item.x;
      item.renderY = item.y;
    });

    this._updateClickableStates();
  }

  /** 更新所有厨具的可点击状态 */
  _updateClickableStates() {
    const visible = this.getVisibleItems();
    for (const item of visible) {
      item.updateClickable(visible);
    }
  }
}

module.exports = SinkPool;
