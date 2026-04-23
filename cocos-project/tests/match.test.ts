import { describe, it, assertEq, assertTrue } from './framework';
import { MatchSystem } from '../assets/scripts/game/MatchSystem';

describe('MatchSystem', () => {
    it('returns null when queue empty', () => {
        const m = new MatchSystem();
        assertEq(m.check([]), null);
    });

    it('returns null when no 3 same', () => {
        const m = new MatchSystem();
        const r = m.check([
            { type: 'a', id: 1 },
            { type: 'b', id: 2 },
            { type: 'a', id: 3 }
        ]);
        assertEq(r, null);
    });

    it('detects 3 same and returns first 3 ids', () => {
        const m = new MatchSystem();
        const r = m.check([
            { type: 'a', id: 1 },
            { type: 'b', id: 2 },
            { type: 'a', id: 3 },
            { type: 'a', id: 4 }
        ]);
        assertEq(r, { type: 'a', matchedIds: [1, 3, 4] });
    });

    it('detects from any group', () => {
        const m = new MatchSystem();
        const r = m.check([
            { type: 'x', id: 1 },
            { type: 'y', id: 2 },
            { type: 'y', id: 3 },
            { type: 'y', id: 4 },
            { type: 'x', id: 5 }
        ]);
        assertTrue(r !== null);
        assertEq(r!.type, 'y');
        assertEq(r!.matchedIds.length, 3);
    });
});
