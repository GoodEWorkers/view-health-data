import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { advanceTour, follow, wrapIndex } from './tour.ts';

const DWELL = 2.8;
const ROOM_COUNT = 8;

describe('wrapIndex', () => {
  it('wraps past the last room back to the first', () => {
    assert.equal(wrapIndex(8, ROOM_COUNT), 0);
  });

  it('wraps before the first room to the last', () => {
    assert.equal(wrapIndex(-1, ROOM_COUNT), 7);
  });
});

describe('follow', () => {
  it('moves part of the way toward the target in one step', () => {
    const next = follow(0, 1, 0.3, 0.3);
    assert.ok(next > 0.6 && next < 0.7, String(next));
  });

  it('gives the same result for two half steps as for one whole step', () => {
    const half = follow(follow(0, 1, 0.1, 0.3), 1, 0.1, 0.3);
    assert.ok(Math.abs(half - follow(0, 1, 0.2, 0.3)) < 1e-12);
  });

  it('stays at the target once there', () => {
    assert.equal(follow(1, 1, 5, 0.3), 1);
  });
});

describe('advanceTour', () => {
  it('stays on the room until the dwell time has passed', () => {
    assert.deepEqual(advanceTour({ index: 2, elapsed: 0 }, 2.7, DWELL, ROOM_COUNT).index, 2);
  });

  it('moves to the next room when the dwell time is reached', () => {
    const next = advanceTour({ index: 2, elapsed: 2.5 }, 0.5, DWELL, ROOM_COUNT);
    assert.equal(next.index, 3);
    assert.ok(Math.abs(next.elapsed - 0.2) < 1e-9);
  });

  it('skips several rooms after a long pause and wraps around', () => {
    assert.equal(advanceTour({ index: 6, elapsed: 0 }, DWELL * 3 + 0.1, DWELL, ROOM_COUNT).index, 1);
  });
});
