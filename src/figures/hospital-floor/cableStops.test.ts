import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plane } from '../../iso/iso-kit.ts';
import { nearestOnPolyline, stopShares } from './cableStops.ts';

const L_SHAPE: Plane[] = [[0, 0], [10, 0], [10, 10]];

describe('nearestOnPolyline', () => {
  it('projects a station beside a leg onto that leg and tells the way the cable runs there', () => {
    const { point, direction, length } = nearestOnPolyline(L_SHAPE, [4, 3]);
    assert.deepEqual([point, direction, length], [[4, 0], [1, 0], 4]);
  });

  it('measures the length from the start of the polyline round a corner', () => {
    assert.equal(nearestOnPolyline(L_SHAPE, [12, 6]).length, 16);
  });

  it('clamps a station beyond the end to the last point', () => {
    assert.deepEqual(nearestOnPolyline(L_SHAPE, [10, 30]).point, [10, 10]);
  });
});

describe('stopShares', () => {
  const second: Plane[] = [[10, 10], [10, 0], [0, 0]];

  it('places start and end stops at the ends of their leg, as a share of both legs together', () => {
    assert.deepEqual(stopShares([L_SHAPE, second], [{ leg: 0, at: 'start' }, { leg: 0, at: 'end' }, { leg: 1, at: 'end' }]), [0, 0.5, 1]);
  });

  it('places a station stop at the nearest point of its own leg', () => {
    assert.deepEqual(stopShares([L_SHAPE, second], [{ leg: 1, at: [5, 2] }]), [0.875]);
  });

  it('never goes backwards, even when a station sits near an earlier part of the cable', () => {
    const shares = stopShares([L_SHAPE], [{ leg: 0, at: [10, 10] }, { leg: 0, at: [2, 1] }]);
    assert.deepEqual(shares, [1, 1]);
  });

  it('measures in the projected space when asked to', () => {
    const doubled = stopShares([L_SHAPE], [{ leg: 0, at: [10, 0] }], ([x, y]) => [x * 2, y]);
    assert.deepEqual(doubled, [20 / 30]);
  });
});
