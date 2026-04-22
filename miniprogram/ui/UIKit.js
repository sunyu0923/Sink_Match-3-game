/**
 * Canvas 绘制辅助函数
 * 全部为无状态函数，每帧重绘。
 */

/**
 * 绘制圆角矩形
 * @returns {void}
 */
function drawRoundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle) {
  ctx.save();
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
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 绘制文字（居中）
 */
function drawText(ctx, text, x, y, style) {
  ctx.save();
  ctx.fillStyle = style.color || '#fff';
  ctx.font = `${style.bold ? 'bold ' : ''}${style.size || 16}px sans-serif`;
  ctx.textAlign = style.align || 'center';
  ctx.textBaseline = style.baseline || 'middle';
  if (style.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * 绘制按钮并返回 rect 供 hit-test
 * @returns {{ x, y, w, h, action }}
 */
function drawButton(ctx, x, y, w, h, label, style, action) {
  const fill = style.fill || '#5a9e6f';
  const textColor = style.textColor || '#fff';
  const fontSize = style.fontSize || 18;
  const r = style.radius !== undefined ? style.radius : 12;

  drawRoundRect(ctx, x, y, w, h, r, fill, style.stroke || null);
  drawText(ctx, label, x + w / 2, y + h / 2, { color: textColor, size: fontSize, bold: true });

  return { x, y, w, h, action };
}

/**
 * 绘制星星（0-3 颗）
 */
function drawStars(ctx, cx, y, stars, starSize) {
  const gap = starSize * 1.4;
  const startX = cx - gap;
  for (let i = 0; i < 3; i++) {
    const sx = startX + i * gap;
    ctx.save();
    ctx.font = `${starSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = i < stars ? 1 : 0.3;
    ctx.fillText('⭐', sx, y);
    ctx.restore();
  }
}

/**
 * 绘制半透明遮罩弹窗背景
 */
function drawModalOverlay(ctx, screenW, screenH) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, screenW, screenH);
  ctx.restore();
}

module.exports = { drawRoundRect, drawText, drawButton, drawStars, drawModalOverlay };
