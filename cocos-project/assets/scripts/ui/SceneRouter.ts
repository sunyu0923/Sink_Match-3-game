/**
 * 简易场景路由（在同一个 Cocos Scene 内切换不同 UI 容器）
 */
import { Node } from 'cc';
import { HomeScene } from './HomeScene';
import { LevelScene } from './LevelScene';
import { GameScene } from './GameScene';

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

class SceneRouterImpl {
    private rootContainer: Node | null = null;
    private current: IScene | null = null;
    private currentType: SceneType | null = null;

    attach(rootContainer: Node): void {
        this.rootContainer = rootContainer;
    }

    goTo(type: SceneType, params?: any): void {
        if (!this.rootContainer) {
            console.error('[Router] root container not attached');
            return;
        }
        if (this.current) {
            this.current.onExit();
            this.current.rootNode.destroy();
            this.current = null;
        }
        let scene: IScene;
        switch (type) {
            case SceneType.HOME:   scene = new HomeScene(this.rootContainer); break;
            case SceneType.LEVELS: scene = new LevelScene(this.rootContainer); break;
            case SceneType.GAME:   scene = new GameScene(this.rootContainer); break;
            default: console.error('Unknown scene', type); return;
        }
        this.current = scene;
        this.currentType = type;
        scene.onEnter(params);
    }
}

export const SceneRouter = new SceneRouterImpl();
