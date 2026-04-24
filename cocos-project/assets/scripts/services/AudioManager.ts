/**
 * 音频管理（基于 Cocos AudioSource 全局单例 + 简单池）
 */
import { AudioClip, AudioSource, Node, director, resources } from 'cc';

export class AudioManager {
    private static _inst: AudioManager;
    public static get inst(): AudioManager {
        if (!this._inst) this._inst = new AudioManager();
        return this._inst;
    }

    private clips: Map<string, AudioClip> = new Map();
    private source: AudioSource | null = null;
    private enabled: boolean = true;

    private ensureSource(): AudioSource {
        if (this.source) return this.source;
        const scene = director.getScene();
        const node = new Node('__AudioMgr__');
        scene?.addChild(node);
        director.addPersistRootNode(node);
        this.source = node.addComponent(AudioSource);
        return this.source;
    }

    preload(name: string, path: string): Promise<void> {
        return new Promise((resolve) => {
            resources.load(path, AudioClip, (err, clip) => {
                if (!err && clip) this.clips.set(name, clip);
                resolve();
            });
        });
    }

    play(name: string, volume = 0.6): void {
        if (!this.enabled) return;
        const clip = this.clips.get(name);
        if (!clip) return;
        const src = this.ensureSource();
        src.playOneShot(clip, volume);
    }

    setEnabled(enabled: boolean): void { this.enabled = enabled; }

    /** 预加载所有游戏音效（来自 kaixinxiaoxiaole 资源） */
    async preloadAll(): Promise<void> {
        // BGM
        await this.preload('bgm_game', 'audio/gamescenebgm');
        await this.preload('bgm_world', 'audio/worldscenebgm');
        // 交互音效
        await this.preload('click', 'audio/click.bubble');
        await this.preload('swap', 'audio/swap');
        await this.preload('drop', 'audio/drop');
        // 消除音效 1-8
        for (let i = 1; i <= 8; i++) {
            await this.preload(`eliminate${i}`, `audio/eliminate${i}`);
        }
        // 连击音效
        for (const n of [3, 5, 7, 9, 11]) {
            await this.preload(`combo${n}`, `audio/contnuousMatch${n}`);
        }
    }

    playBGM(name: string = 'bgm_game'): void {
        if (!this.enabled) return;
        const clip = this.clips.get(name);
        if (!clip) return;
        const src = this.ensureSource();
        src.clip = clip;
        src.loop = true;
        src.play();
    }

    stopBGM(): void {
        if (this.source) this.source.stop();
    }
}
