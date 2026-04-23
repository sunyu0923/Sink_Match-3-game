/**
 * 游戏核心控制器（纯逻辑，可独立测试）
 * Cocos 层（GameScene）订阅事件，把状态映射到节点显示。
 */
import { LevelConfig } from '../data/LevelConfig';
import { GAME_CONSTANTS, GameState } from '../data/GameConstants';
import { SinkPool, SinkRegion } from './SinkPool';
import { MatchSystem, QueueItem } from './MatchSystem';
import { UtensilEntity } from './UtensilEntity';

export interface PlateState {
    item: QueueItem | null;
    locked: boolean;
}

export interface GameSnapshot {
    state: GameState;
    queue: QueueItem[];
    plates: PlateState[];
    goals: Record<string, number>;       // 剩余目标
    extraSlots: number;                  // 通过广告解锁的额外队列槽
    timeUsed: number;
    timeLimit: number | null;
}

type StateListener = (snap: GameSnapshot, eventType?: string) => void;

export class GameLogic {
    sinkPool: SinkPool;
    matchSystem = new MatchSystem();

    state: GameState = GameState.LOADING;
    queue: QueueItem[] = [];
    plates: PlateState[] = [];
    goals: Record<string, number> = {};
    extraSlots: number = 0;
    timeUsed: number = 0;
    usedPowerUps: number = 0;
    config!: LevelConfig;

    private listeners: StateListener[] = [];

    constructor(region: SinkRegion) {
        this.sinkPool = new SinkPool(region);
    }

    onChange(fn: StateListener): void { this.listeners.push(fn); }

    private emit(eventType?: string): void {
        const snap = this.snapshot();
        for (const fn of this.listeners) fn(snap, eventType);
    }

    snapshot(): GameSnapshot {
        return {
            state: this.state,
            queue: this.queue.slice(),
            plates: this.plates.map(p => ({ item: p.item, locked: p.locked })),
            goals: { ...this.goals },
            extraSlots: this.extraSlots,
            timeUsed: this.timeUsed,
            timeLimit: this.config?.timeLimit ?? null
        };
    }

    loadLevel(config: LevelConfig): void {
        this.config = config;
        this.queue = [];
        this.plates = [];
        for (let i = 0; i < GAME_CONSTANTS.TOTAL_PLATES; i++) {
            this.plates.push({ item: null, locked: i >= config.initialSlots });
        }
        this.goals = { ...config.goals };
        this.extraSlots = 0;
        this.timeUsed = 0;
        this.usedPowerUps = 0;
        this.sinkPool.generate(config);
        this.state = GameState.PLAYING;
        this.emit('LEVEL_LOADED');
    }

    /** 主循环 tick（仅 PLAYING 时累加计时） */
    tick(dt: number): void {
        if (this.state !== GameState.PLAYING) return;
        this.timeUsed += dt;
        if (this.config.timeLimit && this.timeUsed >= this.config.timeLimit) {
            this.toLose('TIMEOUT');
        }
    }

    /** 玩家点击厨具 → 加入队列 */
    pickUtensil(item: UtensilEntity): boolean {
        if (this.state !== GameState.PLAYING) return false;
        if (!item.isVisible || !item.isClickable) return false;
        if (!this.hasQueueRoom()) return false;

        this.sinkPool.removeItem(item);
        this.queue.push({ type: item.type, id: item.id });
        this.emit('PICK');
        this.checkMatch();
        if (this.state === GameState.PLAYING) this.checkLose();
        return true;
    }

    private hasQueueRoom(): boolean {
        return this.queue.length < GAME_CONSTANTS.QUEUE_CAPACITY + this.extraSlots;
    }

    private checkMatch(): void {
        let result = this.matchSystem.check(this.queue);
        while (result) {
            // 从 queue 移除
            this.queue = this.queue.filter(q => !result!.matchedIds.includes(q.id));
            // 同时清掉所有盘子里的同 id 项（理论上不会，但防御）
            for (const p of this.plates) {
                if (p.item && result.matchedIds.includes(p.item.id)) p.item = null;
            }
            // 更新目标
            if (this.goals[result.type] !== undefined) {
                this.goals[result.type] = Math.max(0, this.goals[result.type] - 3);
            }
            this.emit('MATCH');
            // 检查胜利
            if (this.isAllGoalsDone()) {
                this.toWin();
                return;
            }
            result = this.matchSystem.check(this.queue);
        }
    }

    private isAllGoalsDone(): boolean {
        return Object.values(this.goals).every(v => v <= 0);
    }

    private checkLose(): void {
        if (this.queue.length >= GAME_CONSTANTS.QUEUE_CAPACITY + this.extraSlots
            && this.plates.every(p => p.locked || p.item !== null)) {
            this.toLose('FULL');
        }
    }

    private toWin(): void {
        this.state = GameState.WIN;
        this.emit('WIN');
    }
    private toLose(reason: string): void {
        this.state = GameState.LOSE;
        this.emit('LOSE:' + reason);
    }

    /** 把队列中第 qIdx 项移到第 pIdx 个盘子 */
    moveToPlate(qIdx: number, pIdx: number): boolean {
        if (this.state !== GameState.PLAYING) return false;
        const q = this.queue[qIdx];
        const p = this.plates[pIdx];
        if (!q || !p || p.locked || p.item) return false;
        p.item = q;
        this.queue.splice(qIdx, 1);
        this.emit('MOVE_TO_PLATE');
        return true;
    }

    moveFromPlate(pIdx: number): boolean {
        if (this.state !== GameState.PLAYING) return false;
        const p = this.plates[pIdx];
        if (!p || !p.item) return false;
        if (!this.hasQueueRoom()) return false;
        this.queue.push(p.item);
        p.item = null;
        this.emit('MOVE_FROM_PLATE');
        this.checkMatch();
        return true;
    }

    unlockPlate(idx: number): boolean {
        const p = this.plates[idx];
        if (!p || !p.locked) return false;
        p.locked = false;
        this.emit('UNLOCK_PLATE');
        return true;
    }

    // ===== 道具 =====
    powerUpAddSlot(): boolean {
        this.extraSlots++;
        this.usedPowerUps++;
        this.emit('PU_ADD_SLOT');
        return true;
    }
    powerUpRemove(): boolean {
        // 移除队列最后一项放回水槽（顶层随机位置）
        if (this.queue.length === 0) return false;
        this.queue.pop();
        this.usedPowerUps++;
        this.emit('PU_REMOVE');
        return true;
    }
    powerUpShuffle(): boolean {
        this.sinkPool.shuffleItems();
        this.usedPowerUps++;
        this.emit('PU_SHUFFLE');
        return true;
    }

    pause(): void {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.emit('PAUSED');
        }
    }
    resume(): void {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.emit('RESUMED');
        }
    }
}
