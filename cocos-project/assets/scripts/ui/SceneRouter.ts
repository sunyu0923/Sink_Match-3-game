/**
 * 简易场景路由（在同一个 Cocos Scene 内切换不同 UI 容器）
 */
import { Node } from 'cc';

export enum SceneType {
    HOME = 'home',
    LEVELS = 'levels',
    GAME = 'game'
}

export interface IScene {
    onEnter(params?: any): void;
    onExit(): void;
    rootNode: Node;
}

type SceneFactory = (parent: Node) => IScene;

class SceneRouterImpl {
    private rootContainer: Node | null = null;
    private current: IScene | null = null;
    private currentType: SceneType | null = null;
    private factories: Map<SceneType, SceneFactory> = new Map();

    register(type: SceneType, factory: SceneFactory): void {
        this.factories.set(type, factory);
    }

    attach(rootContainer: Node): void {
        this.rootContainer = rootContainer;
    }

    goTo(type: SceneType, params?: any): void {
        if (!this.rootContainer) {
            console.error('[Router] root container not attached');
            return;
        }
        const factory = this.factories.get(type);
        if (!factory) {
            console.error('[Router] no factory registered for', type);
            return;
        }
        let nextScene: IScene | null = null;
        try {
            nextScene = factory(this.rootContainer);
            nextScene.onEnter(params);
        } catch (err) {
            console.error('[Router] failed to enter scene:', type, err);
            if (nextScene?.rootNode?.isValid) nextScene.rootNode.destroy();
            return;
        }

        const prev = this.current;
        this.current = nextScene;
        this.currentType = type;
        console.log('[Router] switched to:', type, params ?? {});

        if (prev) {
            try {
                prev.onExit();
            } catch (err) {
                console.warn('[Router] previous scene onExit error:', err);
            }
            if (prev.rootNode?.isValid) prev.rootNode.destroy();
        }
    }
}

export const SceneRouter = new SceneRouterImpl();
