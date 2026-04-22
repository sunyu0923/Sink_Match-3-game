const { Easing, lerp } = require('../../utils/math');

class AnimationManager {
  constructor() {
    this.animations = [];
  }

  /**
   * 添加缓动动画
   * @param {Object} target - 要动画的对象
   * @param {Object} props - 目标属性 {x: 100, y: 200, alpha: 0}
   * @param {number} duration - 持续时间（秒）
   * @param {string} easing - 缓动类型
   * @param {Function} onComplete - 完成回调
   */
  add(target, props, duration, easing = 'easeOutQuad', onComplete = null) {
    const startProps = {};
    for (const key of Object.keys(props)) {
      startProps[key] = target[key];
    }

    this.animations.push({
      target,
      startProps,
      endProps: props,
      duration,
      elapsed: 0,
      easingFn: Easing[easing] || Easing.linear,
      onComplete
    });
  }

  update(dt) {
    const completed = [];

    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.elapsed += dt;
      const t = Math.min(anim.elapsed / anim.duration, 1);
      const easedT = anim.easingFn(t);

      for (const key of Object.keys(anim.endProps)) {
        anim.target[key] = lerp(anim.startProps[key], anim.endProps[key], easedT);
      }

      if (t >= 1) {
        completed.push(i);
        if (anim.onComplete) anim.onComplete();
      }
    }

    // 移除已完成的动画 (从后往前)
    for (const i of completed) {
      this.animations.splice(i, 1);
    }
  }

  /** 是否有动画正在播放 */
  isPlaying() {
    return this.animations.length > 0;
  }

  /** 清空所有动画 */
  clear() {
    this.animations = [];
  }
}

module.exports = AnimationManager;
