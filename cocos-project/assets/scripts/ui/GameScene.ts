/**
 * 主游戏场景：HUD / 盘子+队列条 / 水槽 / 道具栏
 * 布局参考截图：木质背景、目标气泡、圆形锅、盘子+解锁按钮、底部圆形道具按钮
 */
import { _decorator, Node, Vec3, Sprite, UITransform, tween, Tween, Color, Label } from 'cc';
import { GAME_CONSTANTS, GameState } from '../data/GameConstants';
import { LevelManager } from '../game/LevelManager';
import { GameLogic, GameSnapshot } from '../game/GameLogic';
import { UtensilEntity } from '../game/UtensilEntity';
import { UTENSILS_MAP } from '../data/UtensilConfig';
import { StorageService } from '../services/StorageService';
import { AdService } from '../services/AdService';
import { IScene, SceneRouter, SceneType } from './SceneRouter';
import { makeNode, makeLabel, makeRoundRect, makeCircle, makeSprite, loadSpriteFrame, loadFromAtlas, parseColor } from './UIKit';

const W = GAME_CONSTANTS.DESIGN_WIDTH;
const H = GAME_CONSTANTS.DESIGN_HEIGHT;

const HUD_H = 100;
const PLATE_BAR_H = 220;     // 盘子 + 队列两行
const TOOL_BAR_H = 140;
const SINK_TOP = (H / 2 - HUD_H - PLATE_BAR_H);
const SINK_BOTTOM = -H / 2 + TOOL_BAR_H;
const SINK_CENTER_Y = (SINK_TOP + SINK_BOTTOM) / 2;
const SINK_RADIUS_X = W * 0.46;
const SINK_RADIUS_Y = (SINK_TOP - SINK_BOTTOM) / 2 * 0.95;

export class GameScene implements IScene {
    rootNode: Node;
    private logic!: GameLogic;
    private timeAccum = 0;

    private utensilLayer!: Node;
    private utensilNodes: Map<number, Node> = new Map();
    private queueCells: Node[] = [];
    private plateNodes: Node[] = [];
    private goalLabels: Map<string, Label> = new Map();
    private goalGroup!: Node;
    private levelLabel!: Label;
    private timerLabel!: Label;

    private modalNode: Node | null = null;
    private updateScheduled = false;

    constructor(parent: Node) {
        this.rootNode = makeNode({ name: 'GameScene', width: W, height: H, parent });
    }

    onEnter(params?: { levelId: number }): void {
        const levelId = params?.levelId ?? StorageService.inst.getCurrentLevel();
        const cfg = LevelManager.getLevel(levelId) || LevelManager.getLevel(1)!;

        // 背景
        loadSpriteFrame('textures/bg/main_background').then(sf => {
            if (sf) makeSprite(sf, { name: 'BG', width: W, height: H, parent: this.rootNode });
            else makeRoundRect(W, H, 0, '#a8835a', { parent: this.rootNode });
        });

        // === 初始化逻辑 ===
        this.logic = new GameLogic({ cx: 0, cy: SINK_CENTER_Y, rx: SINK_RADIUS_X, ry: SINK_RADIUS_Y });
        this.logic.onChange((snap, evt) => this.onLogicChange(snap, evt));

        this.buildHUD(cfg.levelId, cfg.layerCount, cfg.goals);
        this.buildPlateBar();
        this.buildSink();
        this.buildToolBar();

        this.logic.loadLevel(cfg);
        this.scheduleUpdate();
    }

    onExit(): void {
        this.updateScheduled = false;
    }

    // ===== HUD =====
    private buildHUD(levelId: number, layerCount: number, goals: Record<string, number>): void {
        const hud = makeNode({ name: 'HUD', parent: this.rootNode, x: 0, y: H / 2 - HUD_H / 2, width: W, height: HUD_H });

        // 暂停按钮
        const pauseBtn = makeCircle(28, '#5a4a3a', { parent: hud, x: -W / 2 + 50, y: 0 });
        makeLabel('II', { parent: pauseBtn.node, fontSize: 28, bold: true, color: '#FFE4B5' });
        pauseBtn.node.on(Node.EventType.TOUCH_END, () => this.showPauseModal());

        // 关卡号
        this.levelLabel = makeLabel(`第${levelId}关`, { parent: hud, x: -W / 2 + 160, y: 6, fontSize: 30, bold: true, color: '#5a3a1a' }).label;

        // 锅图标 + 层数
        makeLabel('🍳', { parent: hud, x: -W / 2 + 250, y: 6, fontSize: 28 });
        makeLabel(String(layerCount), { parent: hud, x: -W / 2 + 290, y: 6, fontSize: 28, bold: true, color: '#5a3a1a' });

        // 计时
        this.timerLabel = makeLabel('', { parent: hud, x: 0, y: -30, fontSize: 22, color: '#5a3a1a' }).label;

        // 金币
        const coinBg = makeRoundRect(120, 50, 25, '#5a4a3a', { parent: hud, x: W / 2 - 100, y: 0 });
        makeLabel('⭐', { parent: coinBg.node, x: -36, fontSize: 28 });
        makeLabel(String(StorageService.inst.getCoins()), { parent: coinBg.node, x: 10, fontSize: 24, bold: true, color: '#FFE4B5' });

        // 目标气泡（横向排列）
        this.goalGroup = makeNode({ name: 'Goals', parent: hud, x: -W / 2 + 80, y: -50, width: W, height: 60 });
        let offset = 0;
        for (const type in goals) {
            const def = UTENSILS_MAP[type];
            if (!def) continue;
            const bg = makeRoundRect(110, 50, 14, '#FFF3D6', { parent: this.goalGroup, x: offset + 55, y: 0 });
            // 动物图标
            loadFromAtlas(def.icon, def.atlasFrame).then(sf => {
                if (sf) {
                    makeSprite(sf, { parent: bg.node, x: -28, y: 4, width: 40, height: 40 });
                } else {
                    makeCircle(20, def.color, { parent: bg.node, x: -28, y: 4 });
                }
            });
            const lb = makeLabel(`×${goals[type]}`, { parent: bg.node, x: 14, y: 0, fontSize: 24, bold: true, color: '#5a3a1a' }).label;
            this.goalLabels.set(type, lb);
            offset += 120;
        }
    }

    // ===== 盘子 + 队列条 =====
    private buildPlateBar(): void {
        const barY = H / 2 - HUD_H - PLATE_BAR_H / 2;
        const bar = makeNode({ name: 'PlateBar', parent: this.rootNode, x: 0, y: barY, width: W, height: PLATE_BAR_H });

        // 盘子托盘背景（深色长条）
        makeRoundRect(W - 60, 130, 40, '#9c8064', { parent: bar, x: 0, y: 30 });

        // 盘子 4 个
        const plateSize = 110;
        const gap = 12;
        const totalWidth = plateSize * GAME_CONSTANTS.TOTAL_PLATES + gap * (GAME_CONSTANTS.TOTAL_PLATES - 1);
        const plateY = 30;
        let px = -totalWidth / 2 + plateSize / 2;
        for (let i = 0; i < GAME_CONSTANTS.TOTAL_PLATES; i++) {
            const plate = makeCircle(plateSize / 2, '#FFF8DC', { parent: bar, x: px, y: plateY });
            this.plateNodes.push(plate.node);
            // 锁定态用阴影 + 「解锁」标签
            const lockMask = makeCircle(plateSize / 2, '#3a3a3a', { parent: plate.node });
            lockMask.node.name = 'LockMask';
            const txt = makeLabel('🎬\n解锁', { parent: lockMask.node, fontSize: 18, bold: true, color: '#FFFFFF' });
            txt.node.name = 'LockText';
            (lockMask.node as any).__plateIdx = i;
            lockMask.node.on(Node.EventType.TOUCH_END, () => this.tryUnlockPlate(i));
            // 默认隐藏 lock，loadLevel 后根据 plate.locked 显示
            lockMask.node.active = false;
            // 点击盘子 → 把厨具放回队列
            plate.node.on(Node.EventType.TOUCH_END, () => {
                if (!lockMask.node.active) this.logic.moveFromPlate(i);
            });
            px += plateSize + gap;
        }

        // 队列条（底部小格子 7 个）
        const cellSize = 80;
        const cellGap = 6;
        const queueY = -55;
        const queueWidth = cellSize * GAME_CONSTANTS.QUEUE_CAPACITY + cellGap * (GAME_CONSTANTS.QUEUE_CAPACITY - 1);
        let qx = -queueWidth / 2 + cellSize / 2;
        for (let i = 0; i < GAME_CONSTANTS.QUEUE_CAPACITY; i++) {
            const cell = makeRoundRect(cellSize - 6, cellSize - 6, 12, '#D9D5C8', { parent: bar, x: qx, y: queueY });
            this.queueCells.push(cell.node);
            qx += cellSize + cellGap;
        }
    }

    // ===== 水槽 =====
    private buildSink(): void {
        const sinkNode = makeNode({ name: 'Sink', parent: this.rootNode, x: 0, y: SINK_CENTER_Y, width: SINK_RADIUS_X * 2, height: SINK_RADIUS_Y * 2 });

        // 锅边（深色）
        makeCircle(Math.max(SINK_RADIUS_X, SINK_RADIUS_Y) + 18, '#5a4a3a', { parent: sinkNode });
        // 锅内（浅色水面）
        makeCircle(Math.max(SINK_RADIUS_X, SINK_RADIUS_Y), '#f0e8d6', { parent: sinkNode });
        // 水面层（半透明）
        const water = makeCircle(Math.max(SINK_RADIUS_X, SINK_RADIUS_Y) - 10, '#d4e8e8', { parent: sinkNode });
        water.graphics.fillColor = parseColor('#c8d8d860');

        // 厨具容器
        this.utensilLayer = makeNode({ name: 'Utensils', parent: sinkNode, width: SINK_RADIUS_X * 2, height: SINK_RADIUS_Y * 2 });
    }

    // ===== 道具栏 =====
    private buildToolBar(): void {
        const tbY = -H / 2 + TOOL_BAR_H / 2;
        const bar = makeNode({ name: 'ToolBar', parent: this.rootNode, x: 0, y: tbY, width: W, height: TOOL_BAR_H });

        const positions = [-W / 4, 0, W / 4];
        const tools = [
            { key: 'addSlot' as const, label: '加菜碟', emoji: '🍽️', fn: () => this.usePowerUp('addSlot') },
            { key: 'remove' as const,  label: '移除',   emoji: '🪥', fn: () => this.usePowerUp('remove') },
            { key: 'shuffle' as const, label: '打乱',   emoji: '🥘', fn: () => this.usePowerUp('shuffle') }
        ];
        tools.forEach((t, i) => {
            const btn = makeCircle(50, '#5a4a3a', { parent: bar, x: positions[i], y: 10 });
            makeLabel(t.emoji, { parent: btn.node, fontSize: 36 });
            // 红色 + 标签
            const plus = makeCircle(15, '#E53935', { parent: btn.node, x: -38, y: 32 });
            makeLabel('+', { parent: plus.node, fontSize: 22, bold: true, color: '#FFFFFF' });
            makeLabel(t.label, { parent: bar, x: positions[i], y: -50, fontSize: 22, bold: true, color: '#5a3a1a' });
            btn.node.on(Node.EventType.TOUCH_END, t.fn);
        });
    }

    // ===== 逻辑 → UI 同步 =====
    private onLogicChange(snap: GameSnapshot, evt?: string): void {
        // 厨具节点同步
        if (evt === 'LEVEL_LOADED' || evt === 'PU_SHUFFLE') {
            this.rebuildUtensils();
        } else if (evt === 'PICK' || evt === 'PU_REMOVE') {
            // 飞入动画在 onPick 里处理，这里只清理已不可见的节点
            this.cleanupInvisible();
        }

        // 队列格子着色
        for (let i = 0; i < this.queueCells.length; i++) {
            const cell = this.queueCells[i];
            const item = snap.queue[i];
            // 移除旧 sprite
            const old = cell.getChildByName('QItem');
            if (old) old.destroy();
            if (item) {
                const def = UTENSILS_MAP[item.type];
                loadFromAtlas(def.icon, def.atlasFrame).then(sf => {
                    if (cell.isValid) {
                        const n = sf
                            ? makeSprite(sf, { name: 'QItem', parent: cell, width: 56, height: 56 }).node
                            : makeCircle(26, def.color, { name: 'QItem', parent: cell }).node;
                    }
                });
            }
        }

        // 盘子状态
        for (let i = 0; i < this.plateNodes.length; i++) {
            const lockMask = this.plateNodes[i].getChildByName('LockMask');
            if (lockMask) lockMask.active = snap.plates[i].locked;
        }

        // 目标数量
        for (const type in snap.goals) {
            const lb = this.goalLabels.get(type);
            if (lb) {
                const v = snap.goals[type];
                lb.string = `×${v}`;
                lb.color = v <= 0 ? new Color(120, 180, 120) : new Color(90, 58, 26);
            }
        }

        // 计时
        if (snap.timeLimit) {
            const remain = Math.max(0, Math.ceil(snap.timeLimit - snap.timeUsed));
            this.timerLabel.string = `⏱ ${remain}s`;
        } else {
            this.timerLabel.string = '';
        }

        // 胜负
        if (snap.state === GameState.WIN) this.showResultModal(true);
        if (snap.state === GameState.LOSE) this.showResultModal(false);
    }

    private rebuildUtensils(): void {
        this.utensilLayer.removeAllChildren();
        this.utensilNodes.clear();
        for (const it of this.logic.sinkPool.getVisible()) {
            this.spawnUtensilNode(it);
        }
    }

    private spawnUtensilNode(it: UtensilEntity): void {
        const def = UTENSILS_MAP[it.type];
        const node = makeNode({ name: 'U_' + it.id, parent: this.utensilLayer, width: it.width, height: it.height });
        node.setPosition(it.x, it.y, 0);
        node.setSiblingIndex(it.layer * 1000 + Math.floor((-it.y + 1000)));
        loadFromAtlas(def.icon, def.atlasFrame).then(sf => {
            if (!node.isValid) return;
            if (sf) {
                makeSprite(sf, { parent: node, width: it.width, height: it.height });
            } else {
                makeCircle(Math.min(it.width, it.height) / 2.4, def.color, { parent: node });
                makeLabel(def.name[0], { parent: node, fontSize: 22, bold: true, color: '#FFFFFF' });
            }
        });
        node.on(Node.EventType.TOUCH_END, () => {
            const ok = this.logic.pickUtensil(it);
            if (ok) {
                this.flyToQueue(node, it.type);
            }
        });
        this.utensilNodes.set(it.id, node);
    }

    private cleanupInvisible(): void {
        for (const it of this.logic.sinkPool.items) {
            if (!it.isVisible) {
                const n = this.utensilNodes.get(it.id);
                if (n && n.isValid && !n.getComponent('FLYING')) {
                    // 已飞走的节点会通过 flyToQueue 销毁
                }
            }
        }
    }

    private flyToQueue(node: Node, type: string): void {
        // 找到队列最近一个空格子
        const idx = Math.max(0, this.logic.queue.findIndex(q => q.type === type && q.id === Array.from(this.utensilNodes.entries()).find(([id, n]) => n === node)?.[0]));
        const targetCell = this.queueCells[Math.min(this.queueCells.length - 1, idx >= 0 ? idx : 0)];
        // 转换坐标到 utensilLayer 局部
        const worldPos = targetCell.getWorldPosition();
        const localPos = this.utensilLayer.inverseTransformPoint(new Vec3(), worldPos);
        tween(node)
            .to(GAME_CONSTANTS.FLY_DURATION, { position: localPos, scale: new Vec3(0.6, 0.6, 1) }, { easing: 'cubicOut' })
            .call(() => { if (node.isValid) node.destroy(); })
            .start();
    }

    // ===== 主循环 =====
    private scheduleUpdate(): void {
        this.updateScheduled = true;
        const tick = (dt: number) => {
            if (!this.updateScheduled || !this.rootNode.isValid) return;
            this.timeAccum += dt;
            // 浮动
            for (const it of this.logic.sinkPool.getVisible()) {
                it.updateFloat(this.timeAccum);
                const n = this.utensilNodes.get(it.id);
                if (n && n.isValid) {
                    n.setPosition(it.x, it.y + it.renderOffsetY, 0);
                    n.setRotationFromEuler(0, 0, it.renderRotation * 180 / Math.PI);
                }
            }
            this.logic.tick(dt);
            this.rootNode.scene && requestAnimationFrame(() => tick(1 / 60));
        };
        requestAnimationFrame(() => tick(1 / 60));
    }

    // ===== 道具 =====
    private usePowerUp(key: 'addSlot' | 'remove' | 'shuffle'): void {
        if (!StorageService.inst.usePowerUp(key)) {
            // 余量为0，可考虑播广告增加
            console.log('[PowerUp] empty:', key);
            return;
        }
        switch (key) {
            case 'addSlot': this.logic.powerUpAddSlot(); break;
            case 'remove':  this.logic.powerUpRemove(); break;
            case 'shuffle': this.logic.powerUpShuffle(); break;
        }
    }

    // ===== 解锁盘子 =====
    private async tryUnlockPlate(idx: number): Promise<void> {
        const ok = await AdService.inst.showRewardedAd();
        if (ok) this.logic.unlockPlate(idx);
    }

    // ===== 弹窗 =====
    private showPauseModal(): void {
        if (this.modalNode) return;
        this.logic.pause();
        this.modalNode = makeNode({ name: 'Modal', parent: this.rootNode, width: W, height: H });
        makeRoundRect(W, H, 0, '#00000099', { parent: this.modalNode });
        const card = makeRoundRect(500, 380, 30, '#FFF8DC', { parent: this.modalNode });
        makeLabel('暂停', { parent: card.node, y: 130, fontSize: 44, bold: true, color: '#5a3a1a' });
        const cont = makeRoundRect(360, 80, 20, '#FF8C42', { parent: card.node, y: 20 });
        makeLabel('继续游戏', { parent: cont.node, fontSize: 32, bold: true, color: '#FFFFFF' });
        cont.node.on(Node.EventType.TOUCH_END, () => this.closeModal(true));
        const exit = makeRoundRect(360, 80, 20, '#888888', { parent: card.node, y: -90 });
        makeLabel('返回首页', { parent: exit.node, fontSize: 32, bold: true, color: '#FFFFFF' });
        exit.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.HOME));
    }

    private closeModal(resume: boolean): void {
        if (this.modalNode) { this.modalNode.destroy(); this.modalNode = null; }
        if (resume) this.logic.resume();
    }

    private showResultModal(win: boolean): void {
        if (this.modalNode) return;
        this.modalNode = makeNode({ name: 'Result', parent: this.rootNode, width: W, height: H });
        makeRoundRect(W, H, 0, '#00000099', { parent: this.modalNode });
        const card = makeRoundRect(560, 460, 30, '#FFF8DC', { parent: this.modalNode });
        makeLabel(win ? '🎉 胜利！' : '💧 失败', { parent: card.node, y: 160, fontSize: 48, bold: true, color: '#5a3a1a' });
        if (win) {
            const stars = LevelManager.calculateStars(this.logic.config.levelId, this.logic.usedPowerUps, this.logic.timeUsed);
            StorageService.inst.setLevelStars(this.logic.config.levelId, stars);
            StorageService.inst.setCurrentLevel(this.logic.config.levelId + 1);
            StorageService.inst.addCoins(stars * 10);
            makeLabel('⭐'.repeat(stars) + '☆'.repeat(3 - stars), { parent: card.node, y: 80, fontSize: 56, color: '#FFD700' });
            makeLabel(`+${stars * 10} 金币`, { parent: card.node, y: 10, fontSize: 28, color: '#5a3a1a' });
            const next = makeRoundRect(360, 80, 20, '#5a9e6f', { parent: card.node, y: -80 });
            makeLabel('下一关', { parent: next.node, fontSize: 32, bold: true, color: '#FFFFFF' });
            next.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.GAME, { levelId: this.logic.config.levelId + 1 }));
        } else {
            const retry = makeRoundRect(360, 80, 20, '#FF8C42', { parent: card.node, y: 10 });
            makeLabel('再试一次', { parent: retry.node, fontSize: 32, bold: true, color: '#FFFFFF' });
            retry.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.GAME, { levelId: this.logic.config.levelId }));
        }
        const home = makeRoundRect(360, 80, 20, '#888888', { parent: card.node, y: -180 });
        makeLabel('返回首页', { parent: home.node, fontSize: 32, bold: true, color: '#FFFFFF' });
        home.node.on(Node.EventType.TOUCH_END, () => SceneRouter.goTo(SceneType.HOME));
    }
}
