import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plane } from '../../iso/iso-kit.ts';
import { polylineLength, roundedPolyline } from './rounding.ts';

const EPSILON = 1e-9;
const RADIUS = 3;
const ALWAYS_ROUND = () => RADIUS;
const NEVER_ROUND = () => 0;
const RIGHT_ANGLE: Plane[] = [[0, 0], [10, 0], [10, 10]];

const near = (actual: number, expected: number, tolerance = EPSILON) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not ${expected}`);

describe('roundedPolyline', () => {
  it('keeps both ends and leaves straight runs untouched', () => {
    const rounded = roundedPolyline(RIGHT_ANGLE, ALWAYS_ROUND);
    assert.deepEqual(rounded[0], [0, 0]);
    assert.deepEqual(rounded.at(-1), [10, 10]);
    assert.ok(rounded.some(([x, y]) => x === 7 && y === 0));
    assert.ok(rounded.some(([x, y]) => x === 10 && y === 3));
  });

  it('rounds a right angle with an arc of the requested radius around its inside centre', () => {
    const arc = roundedPolyline(RIGHT_ANGLE, ALWAYS_ROUND).filter(([x, y]) => x > 7 && y < 3);
    assert.ok(arc.length > 3);
    arc.forEach(([x, y]) => near(Math.hypot(x - 7, y - 3), RADIUS));
  });

  it('shortens the path by exactly what a right-angle arc saves', () => {
    const saved = 2 * RADIUS - (Math.PI * RADIUS) / 2;
    near(polylineLength(RIGHT_ANGLE) - polylineLength(roundedPolyline(RIGHT_ANGLE, ALWAYS_ROUND)), saved, 0.02);
  });

  it('keeps a sharp corner when the radius is zero', () => {
    assert.deepEqual(roundedPolyline(RIGHT_ANGLE, NEVER_ROUND), RIGHT_ANGLE);
  });

  it('limits the arc to half of the shorter leg', () => {
    const rounded = roundedPolyline([[0, 0], [2, 0], [2, 20]], () => 10);
    assert.ok(rounded.some(([x, y]) => x === 1 && y === 0));
    assert.ok(rounded.every(([x]) => x >= 0 && x <= 2));
  });

  it('does not touch a vertex that continues straight', () => {
    const straight: Plane[] = [[0, 0], [5, 0], [10, 0]];
    assert.deepEqual(roundedPolyline(straight, ALWAYS_ROUND), straight);
  });

  it('asks for the radius of each vertex by its index', () => {
    const asked: number[] = [];
    roundedPolyline([[0, 0], [10, 0], [10, 10], [20, 10]], (index) => {
      asked.push(index);
      return RADIUS;
    });
    assert.deepEqual(asked, [1, 2]);
  });

  it('answers an empty line for no waypoints', () => {
    assert.deepEqual(roundedPolyline([], ALWAYS_ROUND), []);
  });
});
