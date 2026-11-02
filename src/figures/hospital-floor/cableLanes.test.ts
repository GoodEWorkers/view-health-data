import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plane } from '../../iso/iso-kit.ts';
import { CABLE_LINES } from './cableRoutes.ts';
import { LANE_PITCH, MAX_HALF_WIDTH, offsetsOf, overlapping, runsOf, shiftedPath } from './cableLanes.ts';

const EPSILON = 1e-6;
const LEG = 20;
const MOST_CROSSINGS_IN_THE_LAYOUT = 240;
const EAST_THEN_SOUTH: Plane[] = [[0, 0], [LEG, 0], [LEG, 10]];
const EAST_THEN_NORTH: Plane[] = [[0, 0], [LEG, 0], [LEG, -10]];

type Segment = readonly [Plane, Plane];

const segmentsOf = (points: readonly Plane[]): Segment[] => points.slice(1).map((end, index) => [points[index]!, end]);

function crosses([p, q]: Segment, [r, s]: Segment): boolean {
  const denominator = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
  if (Math.abs(denominator) < EPSILON) return false;
  const along = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / denominator;
  const across = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / denominator;
  return along > EPSILON && along < 1 - EPSILON && across > EPSILON && across < 1 - EPSILON;
}

function crossingCount(paths: readonly (readonly Plane[])[]): number {
  const offsets = offsetsOf(paths);
  const drawn = paths.map((points, index) => segmentsOf(shiftedPath(points, offsets[index]!)));
  return drawn.reduce((total, first, index) => total + drawn.slice(index + 1).reduce((sum, second) => sum + first.flatMap((a) => second.filter((b) => crosses(a, b))).length, 0), 0);
}

describe('offsetsOf', () => {
  it('leaves a lone cable on its centreline', () => {
    assert.deepEqual(offsetsOf([EAST_THEN_SOUTH]), [[0, 0]]);
  });

  it('centres two cables that share a leg half a pitch either side', () => {
    const [first, second] = offsetsOf([EAST_THEN_SOUTH, EAST_THEN_SOUTH]);
    assert.ok(Math.abs(Math.abs(first![0]! - second![0]!) - LANE_PITCH) < EPSILON);
    assert.ok(Math.abs(first![0]! + second![0]!) < EPSILON);
  });

  it('keeps three cables one pitch apart with the middle one on the line', () => {
    const lanes = offsetsOf([EAST_THEN_SOUTH, EAST_THEN_SOUTH, EAST_THEN_SOUTH]).map(([first]) => first!).sort((a, b) => a - b);
    assert.ok(lanes.every((lane, index) => index === 0 || Math.abs(lane - lanes[index - 1]! - LANE_PITCH) < EPSILON));
    assert.ok(Math.abs(lanes[1]!) < EPSILON);
  });

  it('shrinks the pitch so a wide bundle still fits between the posts of a door', () => {
    const lanes = offsetsOf(Array.from({ length: 16 }, () => EAST_THEN_SOUTH)).map(([first]) => first!);
    assert.ok(Math.max(...lanes) - Math.min(...lanes) <= 2 * MAX_HALF_WIDTH + EPSILON);
    assert.equal(new Set(lanes.map((lane) => lane.toFixed(6))).size, 16);
  });

  it('keeps a strand on the side it leaves toward, so strands parting ways do not cross', () => {
    const [south, north] = offsetsOf([EAST_THEN_SOUTH, EAST_THEN_NORTH]);
    assert.ok(south![0]! > north![0]!);
    assert.equal(crossingCount([EAST_THEN_SOUTH, EAST_THEN_NORTH]), 0);
  });

  it('keeps strands that turn the same way concentric, whatever their order of arrival', () => {
    const shorter: Plane[] = [[5, 0], [LEG, 0], [LEG, 6]];
    assert.equal(crossingCount([EAST_THEN_SOUTH, shorter, EAST_THEN_SOUTH]), 0);
    assert.equal(crossingCount([shorter, EAST_THEN_SOUTH, EAST_THEN_SOUTH, shorter]), 0);
  });

  it('keeps a cable and its reverse apart on every shared leg without crossing', () => {
    const back = [...EAST_THEN_SOUTH].reverse();
    assert.equal(crossingCount([EAST_THEN_SOUTH, back]), 0);
    assert.equal(crossingCount([back, EAST_THEN_SOUTH, back, EAST_THEN_SOUTH]), 0);
  });

  it('gives no two cables the same lane on an overlapping leg of the real layout', () => {
    const paths = CABLE_LINES.flatMap(({ centrelines }) => centrelines);
    const runs = runsOf(paths);
    const offsets = offsetsOf(paths);
    const offsetOfRun = (index: number) => offsets[runs[index]!.cable]![runs[index]!.leg]!;
    runs.forEach((first, firstIndex) => {
      runs.slice(firstIndex + 1).forEach((second, offset) => {
        if (overlapping(first, second)) assert.ok(Math.abs(offsetOfRun(firstIndex) - offsetOfRun(firstIndex + 1 + offset)) > EPSILON);
      });
    });
  });

  it('crosses no more than the measured number of strands in the real layout, where the way back to a room and the way out to the telecom box share the trunking', () => {
    assert.ok(crossingCount(CABLE_LINES.flatMap(({ centrelines }) => centrelines)) <= MOST_CROSSINGS_IN_THE_LAYOUT);
  });

  it('assigns the same lanes every time it is asked', () => {
    const paths = CABLE_LINES.flatMap(({ centrelines }) => centrelines);
    assert.deepEqual(offsetsOf(paths), offsetsOf(paths));
  });
});

describe('shiftedPath', () => {
  it('moves each leg sideways by its offset and joins the legs at their crossing', () => {
    assert.deepEqual(shiftedPath(EAST_THEN_SOUTH, [2, -3]), [[0, 2], [LEG - 3, 2], [LEG - 3, 10]]);
  });
});
