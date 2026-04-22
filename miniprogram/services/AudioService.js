/**
 * 音效管理服务
 */
class AudioService {
  constructor() {
    this.sounds = {};
    this.enabled = true;
  }

  /** 预加载音效 */
  preload(name, src) {
    const audio = wx.createInnerAudioContext();
    audio.src = src;
    audio.volume = 0.6;
    this.sounds[name] = audio;
  }

  /** 播放音效 */
  play(name) {
    if (!this.enabled) return;
    const audio = this.sounds[name];
    if (audio) {
      audio.stop();
      audio.play();
    }
  }

  /** 开关音效 */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      Object.values(this.sounds).forEach(a => a.stop());
    }
  }

  /** 销毁所有音频 */
  destroy() {
    Object.values(this.sounds).forEach(a => a.destroy());
    this.sounds = {};
  }
}

module.exports = AudioService;
