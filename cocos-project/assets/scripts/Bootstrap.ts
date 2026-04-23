/**
 * 主入口：挂在 Main 场景的 Canvas 节点上。负责按当前 SceneType 构建 UI。
 */
import { _decorator, Component, view, screen, ResolutionPolicy } from 'cc';
import { GAME_CONSTANTS } from './data/GameConstants';
import { StorageService } from './services/StorageService';
import { AdService } from './services/AdService';
import { SceneRouter, SceneType } from './ui/SceneRouter';

const { ccclass, property } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    @property({ tooltip: '初始场景' })
    initialScene: SceneType = SceneType.HOME;

    onLoad(): void {
        // 设计分辨率自适应（FIT_WIDTH 或 FIT_HEIGHT 由屏幕长宽决定）
        view.setDesignResolutionSize(GAME_CONSTANTS.DESIGN_WIDTH, GAME_CONSTANTS.DESIGN_HEIGHT, ResolutionPolicy.SHOW_ALL);

        // 初始化服务
        StorageService.inst.init();
        AdService.inst.init('');   // 真实环境填广告位 ID

        SceneRouter.attach(this.node);
        SceneRouter.goTo(this.initialScene);
    }
}
