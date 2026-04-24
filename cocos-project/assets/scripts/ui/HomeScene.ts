/**
 * 首页：标题 + 总星数 + 当前关卡 + 开始/选关按钮
 */
import { Node } from 'cc';
import { GAME_CONSTANTS } from '../data/GameConstants';
import { StorageService } from '../services/StorageService';
import { IScene, SceneRouter, SceneType } from './SceneRouter';
import { makeNode, makeLabel, makeRoundRect, loadSpriteFrame, loadFromAtlas, makeSprite } from './UIKit';

export class HomeScene implements IScene {
    rootNode: Node;
    constructor(parent: Node) {
        this.rootNode = makeNode({ name: 'HomeScene', width: GAME_CONSTANTS.DESIGN_WIDTH, height: GAME_CONSTANTS.DESIGN_HEIGHT, parent });
    }

    onEnter(): void {
        const W = GAME_CONSTANTS.DESIGN_WIDTH;
        const H = GAME_CONSTANTS.DESIGN_HEIGHT;

        // 背景（使用 login.jpg）
        loadSpriteFrame('textures/bg/login').then(sf => {
            if (sf) {
                const bg = makeSprite(sf, { name: 'BG', width: W, height: H, parent: this.rootNode });
                bg.node.setSiblingIndex(0);
            } else {
                makeRoundRect(W, H, 0, '#3a7d44', { parent: this.rootNode });
            }
        });

        // 标题
        makeLabel('水槽消消乐', { parent: this.rootNode, x: 0, y: H * 0.3, fontSize: 56, bold: true, color: '#FFF8DC' });
        makeLabel('厨具大挑战', { parent: this.rootNode, x: 0, y: H * 0.3 - 60, fontSize: 28, color: '#FFE4B5' });

        // 当前关卡 / 总星数
        const stars = StorageService.inst.getTotalStars();
        const lv = StorageService.inst.getCurrentLevel();
        makeLabel(`⭐ ${stars}    🏆 第 ${lv} 关`, { parent: this.rootNode, x: 0, y: 0, fontSize: 30, color: '#FFFFFF' });

        // 开始按钮
        this.makeBtn('开始游戏', '#FF8C42', 0, -180, () => {
            SceneRouter.goTo(SceneType.GAME, { levelId: lv });
        });

        // 选关按钮
        this.makeBtn('选择关卡', '#5a9e6f', 0, -290, () => {
            SceneRouter.goTo(SceneType.LEVELS);
        });

        // 版本号
        makeLabel('v1.0.0', { parent: this.rootNode, x: W / 2 - 60, y: -H / 2 + 30, fontSize: 18, color: '#FFFFFF80' });
    }

    private makeBtn(text: string, color: string, x: number, y: number, onClick: () => void): void {
        const w = 360, h = 90;
        const { node } = makeRoundRect(w, h, 24, color, { name: 'Btn', parent: this.rootNode, x, y });
        makeLabel(text, { parent: node, fontSize: 36, bold: true, color: '#FFFFFF' });
        node.on(Node.EventType.TOUCH_END, onClick);
    }

    onExit(): void { /* nothing */ }
}
