/**
 * 三消匹配（纯逻辑，无 Cocos 依赖）
 */

export interface QueueItem {
    type: string;
    id: number;
}

export interface MatchResult {
    type: string;
    matchedIds: number[];   // 命中的 3 个 id
}

export class MatchSystem {
    /**
     * 检查队列是否存在 ≥3 个相同 type 的厨具，返回需消除的前 3 个 id。
     */
    check(queue: QueueItem[]): MatchResult | null {
        const groups: Record<string, number[]> = {};
        for (const item of queue) {
            (groups[item.type] = groups[item.type] || []).push(item.id);
        }
        for (const type in groups) {
            const ids = groups[type];
            if (ids.length >= 3) {
                return { type, matchedIds: ids.slice(0, 3) };
            }
        }
        return null;
    }
}
