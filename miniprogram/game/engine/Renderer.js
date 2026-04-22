const { lerp } = require('../../utils/math');

class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.w = width;
    this.h = height;
    this.time = 0;

    // 水槽参数 (2.5D 椭圆)
    this.sinkCx = width / 2;
    this.sinkCy = height * 0.55;
    this.sinkRx = width * 0.44;
    this.sinkRy = width * 0.38;

    // 预加载的图片缓存
    this.imageCache = {};
  }

  /** 加载厨具图片到缓存 */
  loadImage(canvas, type, src) {
    return new Promise((resolve, reject) => {
      const img = canvas.createImage();
      img.onload = () => {
        this.imageCache[type] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  /** 主渲染入口 */
  render(sinkPool, animationManager) {
    const ctx = this.ctx;
    this.time += 0.016; // ~60fps

    ctx.clearRect(0, 0, this.w, this.h);

    this._drawSinkBackground(ctx);
    this._drawWaterSurface(ctx);

    if (sinkPool) {
      this._drawUtensils(ctx, sinkPool);
    }

    this._drawSinkRim(ctx);
  }

  /** 绘制水槽背景（2.5D 椭圆盆） */
  _drawSinkBackground(ctx) {
    const { sinkCx, sinkCy, sinkRx, sinkRy } = this;

    ctx.save();

    // 水槽底部阴影
    ctx.beginPath();
    ctx.ellipse(sinkCx, sinkCy + 8, sinkRx + 4, sinkRy + 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // 水槽内壁 (深色)
    ctx.beginPath();
    ctx.ellipse(sinkCx, sinkCy, sinkRx, sinkRy, 0, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(
      sinkCx, sinkCy - sinkRy * 0.3, 0,
      sinkCx, sinkCy, sinkRx
    );
    innerGrad.addColorStop(0, '#d4c8a0');
    innerGrad.addColorStop(0.7, '#b8a878');
    innerGrad.addColorStop(1, '#8a7a58');
    ctx.fillStyle = innerGrad;
    ctx.fill();

    ctx.restore();
  }

  /** 绘制水面效果 */
  _drawWaterSurface(ctx) {
    const { sinkCx, sinkCy, sinkRx, sinkRy, time } = this;

    ctx.save();

    // 半透明水面
    ctx.beginPath();
    ctx.ellipse(sinkCx, sinkCy, sinkRx * 0.92, sinkRy * 0.92, 0, 0, Math.PI * 2);
    const waterGrad = ctx.createRadialGradient(
      sinkCx - sinkRx * 0.2, sinkCy - sinkRy * 0.3, 0,
      sinkCx, sinkCy, sinkRx * 0.9
    );
    waterGrad.addColorStop(0, 'rgba(220, 235, 220, 0.6)');
    waterGrad.addColorStop(0.5, 'rgba(200, 215, 200, 0.5)');
    waterGrad.addColorStop(1, 'rgba(180, 195, 180, 0.4)');
    ctx.fillStyle = waterGrad;
    ctx.fill();

    // 动态波纹
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3; i++) {
      const phase = time * (0.8 + i * 0.3) + i * 2.1;
      const waveRx = sinkRx * (0.3 + i * 0.2) + Math.sin(phase) * 8;
      const waveRy = sinkRy * (0.25 + i * 0.18) + Math.cos(phase * 0.7) * 5;
      const offsetX = Math.sin(phase * 0.5) * 6;
      const offsetY = Math.cos(phase * 0.4) * 4;

      ctx.beginPath();
      ctx.ellipse(sinkCx + offsetX, sinkCy + offsetY, waveRx, waveRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  /** 绘制厨具 */
  _drawUtensils(ctx, sinkPool) {
    // 按层级和 y 排序（远处先画）
    const items = sinkPool.getVisibleItems();
    items.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.y - b.y;
    });

    for (const item of items) {
      this._drawSingleUtensil(ctx, item);
    }
  }

  /** 绘制单个厨具 */
  _drawSingleUtensil(ctx, item) {
    const img = this.imageCache[item.type];

    // 透视缩放：y 越大（靠近底部）越大
    const perspectiveScale = lerp(0.7, 1.1, (item.renderY - (this.sinkCy - this.sinkRy)) / (this.sinkRy * 2));
    const totalScale = item.scale * perspectiveScale;

    const drawW = item.width * totalScale;
    const drawH = item.height * totalScale;
    const drawX = item.renderX - drawW / 2;
    const drawY = item.renderY - drawH / 2;

    ctx.save();
    ctx.translate(item.renderX, item.renderY);
    ctx.rotate(item.renderRotation);
    ctx.globalAlpha = item.alpha || 1;

    if (img) {
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      // 占位：彩色圆角矩形 + 类型名
      this._drawPlaceholder(ctx, item, drawW, drawH);
    }

    // 高亮描边（被选中）
    if (item.isHighlighted) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(-drawW / 2, -drawH / 2, drawW, drawH);
    }

    ctx.restore();
  }

  /** 占位图绘制（无美术资源时使用） */
  _drawPlaceholder(ctx, item, w, h) {
    const colors = {
      chopstick: '#8B4513',
      spoon: '#C0C0C0',
      fork: '#A9A9A9',
      spatula: '#2F4F4F',
      whisk: '#D2691E',
      ladle: '#708090',
      board: '#DEB887',
      rolling_pin: '#F5DEB3'
    };

    const icons = {
      chopstick: '🥢',
      spoon: '🥄',
      fork: '🍴',
      spatula: '🔪',
      whisk: '🔄',
      ladle: '🥣',
      board: '🪵',
      rolling_pin: '📏'
    };

    ctx.fillStyle = colors[item.type] || '#999';
    ctx.globalAlpha = (item.alpha || 1) * 0.85;

    // 圆角矩形（手动 arcTo，兼容微信小游戏）
    const r = 8;
    const x = -w / 2, y = -h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();

    // 边框
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Emoji 图标
    ctx.globalAlpha = item.alpha || 1;
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.min(w, h) * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icons[item.type] || '?', 0, 0);
  }

  /** 绘制水槽边缘（在厨具之上） */
  _drawSinkRim(ctx) {
    const { sinkCx, sinkCy, sinkRx, sinkRy } = this;

    ctx.save();

    // 外边缘
    ctx.beginPath();
    ctx.ellipse(sinkCx, sinkCy, sinkRx + 6, sinkRy + 6, 0, 0, Math.PI * 2);
    ctx.ellipse(sinkCx, sinkCy, sinkRx, sinkRy, 0, 0, Math.PI * 2, true);
    const rimGrad = ctx.createLinearGradient(sinkCx - sinkRx, sinkCy, sinkCx + sinkRx, sinkCy);
    rimGrad.addColorStop(0, '#a0a0a0');
    rimGrad.addColorStop(0.3, '#d0d0d0');
    rimGrad.addColorStop(0.5, '#e8e8e8');
    rimGrad.addColorStop(0.7, '#d0d0d0');
    rimGrad.addColorStop(1, '#a0a0a0');
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // 高光
    ctx.beginPath();
    ctx.ellipse(sinkCx, sinkCy - 2, sinkRx + 4, sinkRy + 4, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

module.exports = Renderer;
