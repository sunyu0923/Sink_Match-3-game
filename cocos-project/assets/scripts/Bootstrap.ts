/**
 * 主入口：挂在 Main 场景的 Canvas 节点上。负责按当前 SceneType 构建 UI。
 */
import { _decorator, Component, view, ResolutionPolicy } from 'cc';
import { GAME_CONSTANTS } from './data/GameConstants';
import { StorageService } from './services/StorageService';
import { AdService } from './services/AdService';
import { SceneRouter, SceneType } from './ui/SceneRouter';
import { HomeScene } from './ui/HomeScene';
import { LevelScene } from './ui/LevelScene';
import { GameScene } from './ui/GameScene';

const { ccclass, property } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    @property({ tooltip: '初始场景' })
    initialScene: SceneType = SceneType.HOME;

    onLoad(): void {
        console.log('[Bootstrap] onLoad, initialScene =', this.initialScene);
        // 设计分辨率自适应（FIT_WIDTH 或 FIT_HEIGHT 由屏幕长宽决定）
        view.setDesignResolutionSize(GAME_CONSTANTS.DESIGN_WIDTH, GAME_CONSTANTS.DESIGN_HEIGHT, ResolutionPolicy.SHOW_ALL);

        // 初始化服务
        StorageService.inst.init();
        AdService.inst.init('');   // 真实环境填广告位 ID

        // 注册场景工厂（避免 SceneRouter ↔ Scene 循环依赖）
        SceneRouter.register(SceneType.HOME,   (parent) => new HomeScene(parent));
        SceneRouter.register(SceneType.LEVELS, (parent) => new LevelScene(parent));
        SceneRouter.register(SceneType.GAME,   (parent) => new GameScene(parent));

        SceneRouter.attach(this.node);
        console.log('[Bootstrap] router attached, goTo =', this.initialScene);
        SceneRouter.goTo(this.initialScene);
    }
}
