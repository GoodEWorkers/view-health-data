import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Corner } from './homography.ts';
import type { Box } from './jackWires.ts';
import { routeWires } from './router.ts';
import type { Request } from './router.ts';

const FRAME = { width: 200, height: 120 };
const DOWN: Corner = [0, 1];
const WALL: Box = { x: 0, y: 55, width: 140, height: 10 };
const ACROSS: Request = { from: [20, 30], leave: DOWN, to: [180, 90], arrive: DOWN };

const inside = ([x, y]: Corner, { x: left, y: top, width, height }: Box): boolean => x > left && x < left + width && y > top && y < top + height;

const sampled = (corners: readonly Corner[]): Corner[] =>
  corners.slice(1).flatMap(([toX, toY], index) => {
    const [fromX, fromY] = corners[index]!;
    return Array.from({ length: 41 }, (_, step): Corner => [fromX + ((toX - fromX) * step) / 40, fromY + ((toY - fromY) * step) / 40]);
  });

describe('routeWires', () => {
  it('connects the two ends, leaving along the heading and arriving along the other', () => {
    const [route] = routeWires([ACROSS], [], FRAME);
    assert.deepEqual([route![0], route!.at(-1)], [ACROSS.from, ACROSS.to]);
    assert.equal(route![1]![0], ACROSS.from[0], 'first leg is vertical');
    assert.equal(route!.at(-2)![0], ACROSS.to[0], 'last leg is vertical');
  });

  it('goes around a wall that closes the straight way', () => {
    const [route] = routeWires([ACROSS], [WALL], FRAME);
    assert.ok(route);
    assert.ok(sampled(route).every((point) => !inside(point, WALL)), 'the route enters the wall');
  });

  it('answers null for a request that cannot get out', () => {
    const cage: Box[] = [{ x: 0, y: 40, width: 200, height: 12 }, { x: 0, y: 8, width: 200, height: 12 }, { x: 0, y: 20, width: 10, height: 20 }, { x: 30, y: 20, width: 170, height: 20 }];
    assert.deepEqual(routeWires([{ from: [20, 30], leave: DOWN, to: [180, 90], arrive: DOWN }], cage, FRAME), [null]);
  });

  it('keeps two wires that run the same way on lanes of their own', () => {
    const request = (shift: number): Request => ({ from: [20 + shift, 30], leave: DOWN, to: [180 - shift, 90], arrive: DOWN });
    const [first, second] = routeWires([request(0), request(4)], [WALL], FRAME);
    const levelRuns = (route: readonly Corner[]) => route.slice(1).flatMap(([x, y], index) => (route[index]![1] === y ? [{ y, from: Math.min(x, route[index]![0]), to: Math.max(x, route[index]![0]) }] : []));
    const clashes = levelRuns(first!).filter((run) => levelRuns(second!).some((other) => other.y === run.y && other.from < run.to && run.from < other.to));
    assert.deepEqual(clashes, [], 'the wires share a horizontal lane');
  });

  it('keeps the route inside the frame', () => {
    const [route] = routeWires([ACROSS], [WALL], FRAME);
    assert.ok(route!.every(([x, y]) => x > 0 && x < FRAME.width && y > 0 && y < FRAME.height));
  });
});
