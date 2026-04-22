/**
 * 广告抽象层
 * 默认使用微信原生激励视频广告，预留第三方 SDK 扩展接口
 */
class AdService {
  constructor() {
    this.rewardedAd = null;
    this.provider = null; // 第三方 SDK provider
    this.adUnitId = '';
  }

  init(adUnitId) {
    this.adUnitId = adUnitId;

    if (typeof wx !== 'undefined' && wx.createRewardedVideoAd) {
      this.rewardedAd = wx.createRewardedVideoAd({
        adUnitId: adUnitId
      });

      this.rewardedAd.onError(err => {
        console.warn('[AdService] 广告加载失败:', err);
      });
    }
  }

  /**
   * 设置第三方广告 SDK provider
   * @param {Object} provider - 需实现 showRewardedAd(): Promise<boolean>
   */
  setProvider(provider) {
    this.provider = provider;
  }

  /**
   * 展示激励视频广告
   * @returns {Promise<boolean>} 是否完整观看
   */
  showRewardedAd() {
    // 如果有第三方 provider，优先使用
    if (this.provider && typeof this.provider.showRewardedAd === 'function') {
      return this.provider.showRewardedAd();
    }

    // 微信原生激励视频
    if (!this.rewardedAd) {
      console.warn('[AdService] 广告未初始化');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.rewardedAd.show().catch(() => {
        // 首次加载可能需要 load
        this.rewardedAd.load().then(() => this.rewardedAd.show()).catch(() => {
          resolve(false);
        });
      });

      // 监听关闭事件
      const onClose = (res) => {
        this.rewardedAd.offClose(onClose);
        resolve(res && res.isEnded);
      };
      this.rewardedAd.onClose(onClose);
    });
  }
}

module.exports = AdService;
