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
}
