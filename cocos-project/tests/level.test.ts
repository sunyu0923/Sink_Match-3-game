import { describe, it, assertEq, assertTrue } from './framework';
import { LevelManager } from '../assets/scripts/game/LevelManager';
import { LEVELS } from '../assets/scripts/data/LevelConfig';

describe('LevelManager', () => {
    it('has 20 levels', () => {
        assertEq(LevelManager.getTotalLevels(), 20);
    });

    it('all level goals sum to multiple of 3 (solvable)', () => {
        for (const lv of LEVELS) {
            let total = 0;
            for (const t in lv.goals) total += lv.goals[t];
            assertTrue(total % 3 === 0, `Level ${lv.levelId} goals sum (${total}) not divisible by 3`);
        }
    });

    it('all goal types are in utensilTypes', () => {
        for (const lv of LEVELS) {
            for (const t in lv.goals) {
                assertTrue(lv.utensilTypes.indexOf(t) >= 0, `Level ${lv.levelId} goal ${t} missing from utensilTypes`);
            }
        }
    });

    it('returns null for invalid id', () => {
        assertEq(LevelManager.getLevel(999), null);
    });

    it('calculateStars: 1 star when used powerUps > 0 and no time win', () => {
        const s = LevelManager.calculateStars(1, 1, 0);
        assertEq(s, 1);
    });

    it('calculateStars: 3 stars when no powerUps and no time limit', () => {
        const s = LevelManager.calculateStars(1, 0, 0); // level 1 has no timeLimit
        assertEq(s, 3);
    });

    it('calculateStars: 3 stars when fast & no powerUps with time limit', () => {
        const lv = LevelManager.getLevel(6)!; // timeLimit 180
        const s = LevelManager.calculateStars(6, 0, lv.timeLimit! * 0.4);
        assertEq(s, 3);
    });

    it('calculateStars: 2 stars when no powerUps but slow with time limit', () => {
        const lv = LevelManager.getLevel(6)!;
        const s = LevelManager.calculateStars(6, 0, lv.timeLimit! * 0.9);
        assertEq(s, 2);
    });
});
