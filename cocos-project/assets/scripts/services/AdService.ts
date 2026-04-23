/**
 * 广告服务（微信小游戏激励视频，可注入第三方 provider）
 */
declare const wx: any;

export interface AdProvider {
    showRewardedAd(): Promise<boolean>;
}

export class AdService {
    private static _inst: AdService;
    public static get inst(): AdService {
        if (!this._inst) this._inst = new AdService();
        return this._inst;
    }

    private rewardedAd: any = null;
    private provider: AdProvider | null = null;
    private adUnitId: string = '';

    init(adUnitId: string): void {
        this.adUnitId = adUnitId;
        if (typeof wx === 'undefined' || !wx.createRewardedVideoAd) return;
        try {
            this.rewardedAd = wx.createRewardedVideoAd({ adUnitId });
            this.rewardedAd.onError((err: any) => console.warn('[Ad] error', err));
        } catch (e) {
            console.warn('[Ad] create failed', e);
        }
    }

    setProvider(provider: AdProvider): void { this.provider = provider; }

    async showRewardedAd(): Promise<boolean> {
        if (this.provider) {
            try { return await this.provider.showRewardedAd(); }
            catch { return false; }
        }
        if (!this.rewardedAd) {
            // 非微信环境（编辑器预览）：模拟成功
            console.log('[Ad] mock reward (non-wx env)');
            return true;
        }
        return new Promise<boolean>((resolve) => {
            const handler = (res: any) => {
                this.rewardedAd.offClose(handler);
                resolve(!!res?.isEnded);
            };
            this.rewardedAd.onClose(handler);
            this.rewardedAd.show().catch(() => {
                this.rewardedAd.load().then(() => this.rewardedAd.show()).catch(() => resolve(false));
            });
        });
    }
}
