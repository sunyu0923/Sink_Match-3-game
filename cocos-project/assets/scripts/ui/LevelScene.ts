/**
 * 关卡选择：4 列网格
 */
import { Node } from 'cc';
import { GAME_CONSTANTS } from '../data/GameConstants';
import { StorageService } from '../services/StorageService';
import { LevelManager } from '../game/LevelManager';
import { IScene, SceneRouter, SceneType } from './SceneRouter';
import { makeNode, makeLabel, makeRoundRect } from './UIKit';

export class LevelScene implements IScene {
    rootNode: Node;
    constructor(parent: Node) {
        this.rootNode = makeNode({ name: 'LevelScene', width: GAME_CONSTANTS.DESIGN_WIDTH, height: GAME_CONSTANTS.DESIGN_HEIGHT, parent });
    }

    onEnter(): void {
        const W = GAME_CONSTANTS.DESIGN_WIDTH;
        const H = GAME_CONSTANTS.DESIGN_HEIGHT;
        // 背景
        makeRoundRect(W, H, 0, '#1a3d22', { parent: this.rootNode });

        // 标题 + 返回
        makeLabel('选择关卡', { parent: this.rootNode, x: 0, y: H / 2 - 60, fontSize: 40, bold: true, color: '#FFFFFF' });
        const back = makeRoundRect(80, 60, 16, '#5a9e6f', { parent: this.rootNode, x: -W / 2 + 60, y: H / 2 - 60 });
        makeLabel('◀', { parent: back.node, fontSize: 32, color: '#FFFFFF' });
        back.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.HOME));

        // 网格
        const cols = 4;
        const padding = 20;
        const cellW = (W - padding * (cols + 1)) / cols;
        const cellH = cellW * 1.1;
        const total = LevelManager.getTotalLevels();
        const currentMax = StorageService.inst.getCurrentLevel();
        const stars = StorageService.inst.getLevelStars();

        const startX = -W / 2 + padding + cellW / 2;
        const startY = H / 2 - 130 - cellH / 2;

        for (let i = 0; i < total; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (cellW + padding);
            const y = startY - row * (cellH + padding);
            const id = i + 1;
            const unlocked = id <= currentMax;
            const fill = unlocked ? '#2d6e3e' : '#1a2e1f';
            const cell = makeRoundRect(cellW, cellH, 14, fill, { parent: this.rootNode, x, y });
            if (unlocked) {
                makeLabel(String(id), { parent: cell.node, fontSize: 36, bold: true, color: '#FFFFFF' });
                const s = stars[id] || 0;
                makeLabel('⭐'.repeat(s) + '☆'.repeat(3 - s), { parent: cell.node, fontSize: 18, y: -cellH / 2 + 18, color: '#FFD700' });
                cell.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.GAME, { levelId: id }));
            } else {
                makeLabel('🔒', { parent: cell.node, fontSize: 36, color: '#888888' });
                makeLabel(String(id), { parent: cell.node, fontSize: 18, y: -cellH / 2 + 18, color: '#666666' });
            }
        }
    }
    onExit(): void {}
}
