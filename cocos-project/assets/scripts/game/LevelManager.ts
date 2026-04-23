/**
 * 关卡管理（纯逻辑）
 */
import { LEVELS, LevelConfig } from '../data/LevelConfig';

export class LevelManager {
    static getLevel(levelId: number): LevelConfig | null {
        return LEVELS.find(l => l.levelId === levelId) || null;
    }
    static getTotalLevels(): number {
        return LEVELS.length;
    }
    /**
     * 计算星级
     * @param remainingPowerUps 剩余道具数（用于2星判定，越多越好）
     * @param timeUsed 使用时间（秒）
     */
    static calculateStars(levelId: number, usedPowerUps: number, timeUsed: number): 1 | 2 | 3 {
        const lv = this.getLevel(levelId);
        if (!lv) return 1;
        let stars: 1 | 2 | 3 = 1;
        if (usedPowerUps === 0) stars = 2;
        if (lv.timeLimit) {
            if (usedPowerUps === 0 && timeUsed < lv.timeLimit * 0.6) stars = 3;
        } else {
            if (usedPowerUps === 0) stars = 3;
        }
        return stars;
    }
}
