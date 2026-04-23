import { describe, it, assertEq, assertTrue } from './framework';
import { GameLogic } from '../assets/scripts/game/GameLogic';
import { LevelManager } from '../assets/scripts/game/LevelManager';
import { GameState, GAME_CONSTANTS } from '../assets/scripts/data/GameConstants';

function newLogic() {
    return new GameLogic({ cx: 0, cy: 0, rx: 300, ry: 200 });
}

describe('GameLogic', () => {
    it('loads level 1 and enters PLAYING', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        assertEq(g.state, GameState.PLAYING);
        assertTrue(g.sinkPool.getVisible().length > 0);
        assertEq(g.queue.length, 0);
        assertEq(g.plates.length, GAME_CONSTANTS.TOTAL_PLATES);
    });

    it('plates: first 2 unlocked, last 2 locked', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        assertEq(g.plates[0].locked, false);
        assertEq(g.plates[1].locked, false);
        assertEq(g.plates[2].locked, true);
        assertEq(g.plates[3].locked, true);
    });

    it('pickUtensil moves item from sink to queue', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        const before = g.sinkPool.getVisible().length;
        const item = g.sinkPool.getVisible().find(i => i.isClickable)!;
        const ok = g.pickUtensil(item);
        assertTrue(ok);
        assertEq(g.sinkPool.getVisible().length, before - 1);
    });

    it('three-match auto-eliminates and reduces goal', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        // 找 3 个 chopstick 类型
        const chops = g.sinkPool.getVisible().filter(i => i.type === 'chopstick').slice(0, 3);
        assertTrue(chops.length === 3);
        // 强制设置可点击（避免被遮挡）
        chops.forEach(c => { c.isClickable = true; c.layer = 99; });
        const goalBefore = g.goals.chopstick;
        for (const c of chops) g.pickUtensil(c);
        assertEq(g.queue.length, 0); // 三消后队列清空
        assertEq(g.goals.chopstick, goalBefore - 3);
    });

    it('wins when all goals cleared', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!); // chopstick 3 + spoon 3
        // 把所有目标厨具都点掉
        const types = ['chopstick', 'spoon'];
        for (const t of types) {
            const items = g.sinkPool.getVisible().filter(i => i.type === t).slice(0, 3);
            items.forEach(c => { c.isClickable = true; c.layer = 99; });
            for (const c of items) g.pickUtensil(c);
        }
        assertEq(g.state, GameState.WIN);
    });

    it('powerUpAddSlot increases capacity', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        assertEq(g.extraSlots, 0);
        g.powerUpAddSlot();
        assertEq(g.extraSlots, 1);
    });

    it('powerUpRemove pops last queue item', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        const item = g.sinkPool.getVisible()[0];
        item.isClickable = true;
        g.pickUtensil(item);
        assertEq(g.queue.length, 1);
        g.powerUpRemove();
        assertEq(g.queue.length, 0);
    });

    it('pause/resume transitions state', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        g.pause();
        assertEq(g.state, GameState.PAUSED);
        g.resume();
        assertEq(g.state, GameState.PLAYING);
    });

    it('emits events to subscribers', () => {
        const g = newLogic();
        const events: string[] = [];
        g.onChange((_, evt) => evt && events.push(evt));
        g.loadLevel(LevelManager.getLevel(1)!);
        assertTrue(events.includes('LEVEL_LOADED'));
    });

    it('moveToPlate moves queue item onto plate', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        const item = g.sinkPool.getVisible().find(i => i.type === 'chopstick')!;
        item.isClickable = true;
        g.pickUtensil(item);
        const ok = g.moveToPlate(0, 0);
        assertTrue(ok);
        assertEq(g.queue.length, 0);
        assertTrue(g.plates[0].item !== null);
    });

    it('moveFromPlate returns item to queue and re-checks match', () => {
        const g = newLogic();
        g.loadLevel(LevelManager.getLevel(1)!);
        const item = g.sinkPool.getVisible().find(i => i.type === 'chopstick')!;
        item.isClickable = true;
        g.pickUtensil(item);
        g.moveToPlate(0, 0);
        const ok = g.moveFromPlate(0);
        assertTrue(ok);
        assertEq(g.queue.length, 1);
        assertEq(g.plates[0].item, null);
    });
});
