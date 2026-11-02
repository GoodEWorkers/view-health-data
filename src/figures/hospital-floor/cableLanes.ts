// Lanes of the cable bundles. Overlapping legs on one line share a bundle, ordered by where they first part ways so strands keep their side round corners. A bundle is centred on its line; its pitch shrinks to fit a door.

import type { Plane } from '../../iso/iso-kit.ts';

export const LANE_PITCH = 1.4;
export const MAX_HALF_WIDTH = 3;

type Turn = -1 | 0 | 1;
type End = 'low' | 'high';

export type Run = {
  readonly cable: number;
  readonly leg: number;
  readonly horizontal: boolean;
  readonly line: number;
  readonly low: number;
  readonly high: number;
  readonly forward: boolean;
  readonly lowTurn: Turn;
  readonly highTurn: Turn;
  readonly lowNext: number | null;
  readonly highNext: number | null;
};

const EPSILON = 1e-6;

const turnToward = (from: Plane, to: Plane, horizontal: boolean): Turn => Math.sign(horizontal ? to[1] - from[1] : to[0] - from[0]) as Turn;

export function runsOf(paths: readonly (readonly Plane[])[]): Run[] {
  const firstRunOf: number[] = [];
  let count = 0;
  paths.forEach((points, cable) => {
    firstRunOf[cable] = count;
    count += points.length - 1;
  });
  return paths.flatMap((points, cable) =>
    points.slice(1).map((end, leg): Run => {
      const start = points[leg]!;
      const horizontal = Math.abs(start[1] - end[1]) < EPSILON;
      const [from, to] = horizontal ? [start[0], end[0]] : [start[1], end[1]];
      const hasBefore = leg > 0;
      const hasAfter = leg + 2 < points.length;
      const before = hasBefore ? turnToward(start, points[leg - 1]!, horizontal) : 0;
      const after = hasAfter ? turnToward(end, points[leg + 2]!, horizontal) : 0;
      const beforeRun = hasBefore ? firstRunOf[cable]! + leg - 1 : null;
      const afterRun = hasAfter ? firstRunOf[cable]! + leg + 1 : null;
      const forward = from < to;
      return {
        cable,
        leg,
        horizontal,
        line: horizontal ? start[1] : start[0],
        low: Math.min(from, to),
        high: Math.max(from, to),
        forward,
        lowTurn: forward ? before : after,
        highTurn: forward ? after : before,
        lowNext: forward ? beforeRun : afterRun,
        highNext: forward ? afterRun : beforeRun,
      };
    }),
  );
}

export const sharesLine = (first: Run, second: Run): boolean => first.horizontal === second.horizontal && Math.abs(first.line - second.line) < EPSILON;

export const overlapping = (first: Run, second: Run): boolean =>
  sharesLine(first, second) && first.low < second.high - EPSILON && second.low < first.high - EPSILON;

// The side of a lane relative to the direction of travel does not change round a corner, so it links the sign of a pair's order from one run to the next.
const rightward = ({ horizontal }: Run, direction: number): number => (horizontal ? direction : -direction);

const endOf = (run: Run, end: End): number => (end === 'high' ? run.high : run.low);

const turnOf = (run: Run, end: End): Turn => (end === 'high' ? run.highTurn : run.lowTurn);

const nextOf = (run: Run, end: End): number | null => (end === 'high' ? run.highNext : run.lowNext);

// Side of the first run relative to the second (-1 negative, 1 positive, 0 nothing owed), decided where the two first part ways beyond the given end.
function sideBeyond(runs: readonly Run[], first: number, second: number, end: End): number {
  const [a, b] = [runs[first]!, runs[second]!];
  const [endA, endB] = [endOf(a, end), endOf(b, end)];
  const outward = end === 'high' ? 1 : -1;
  if (Math.abs(endA - endB) >= EPSILON) return (endA - endB) * outward < 0 ? turnOf(a, end) : -turnOf(b, end);
  const [turnA, turnB] = [turnOf(a, end), turnOf(b, end)];
  if (turnA !== turnB) return Math.sign(turnA - turnB);
  const [nextA, nextB] = [nextOf(a, end), nextOf(b, end)];
  if (turnA === 0 || nextA === null || nextB === null) return 0;
  const farEnd: End = turnA > 0 ? 'high' : 'low';
  return sideBeyond(runs, nextA, nextB, farEnd) * rightward(runs[nextA]!, turnA) * rightward(a, outward);
}

const travel = ({ forward }: Run): number => (forward ? 1 : -1);

function tieSide(a: Run, b: Run): number {
  return a.cable < b.cable ? rightward(a, travel(a)) : -rightward(b, travel(b));
}

export function sideOf(runs: readonly Run[], first: number, second: number): number {
  const low = sideBeyond(runs, first, second, 'low');
  const high = sideBeyond(runs, first, second, 'high');
  const decided = low * high < 0 ? 0 : low || high;
  return decided || tieSide(runs[first]!, runs[second]!);
}

export function assignSlots(runs: readonly Run[]): number[] {
  const slots: number[] = Array(runs.length).fill(-1);
  const owedBefore = (index: number): number[] =>
    runs.flatMap((other, otherIndex) =>
      otherIndex !== index && overlapping(runs[index]!, other) && sideOf(runs, otherIndex, index) < 0 ? [otherIndex] : [],
    );
  const waiting = new Set(runs.keys());
  while (waiting.size > 0) {
    const unmet = (index: number): number => owedBefore(index).filter((before) => slots[before]! < 0).length;
    const index = [...waiting].reduce((fewest, candidate) => (unmet(candidate) < unmet(fewest) ? candidate : fewest));
    const taken = new Set(runs.flatMap((other, otherIndex) => (slots[otherIndex]! >= 0 && overlapping(runs[index]!, other) ? [slots[otherIndex]!] : [])));
    let slot = Math.max(-1, ...owedBefore(index).map((before) => slots[before]!)) + 1;
    while (taken.has(slot)) slot += 1;
    slots[index] = slot;
    waiting.delete(index);
  }
  return slots;
}

function bundlesOf(runs: readonly Run[]): number[][] {
  const byLine = Map.groupBy(runs.map((_, index) => index), (index) => `${runs[index]!.horizontal}:${runs[index]!.line.toFixed(3)}`);
  return [...byLine.values()].flatMap((indices) => {
    const sorted = [...indices].sort((first, second) => runs[first]!.low - runs[second]!.low);
    const bundles: number[][] = [];
    let reach = -Infinity;
    for (const index of sorted) {
      if (runs[index]!.low < reach - EPSILON) bundles.at(-1)!.push(index);
      else bundles.push([index]);
      reach = Math.max(reach, runs[index]!.high);
    }
    return bundles;
  });
}

export function offsetsOfRuns(runs: readonly Run[], slots: readonly number[]): number[] {
  const offsets: number[] = [];
  for (const bundle of bundlesOf(runs)) {
    const used = bundle.map((index) => slots[index]!);
    const middle = (Math.min(...used) + Math.max(...used)) / 2;
    const widest = Math.max(...used.map((slot) => Math.abs(slot - middle)));
    const pitch = widest === 0 ? LANE_PITCH : Math.min(LANE_PITCH, MAX_HALF_WIDTH / widest);
    bundle.forEach((index) => {
      offsets[index] = (slots[index]! - middle) * pitch;
    });
  }
  return offsets;
}

export type Offsets = readonly (readonly number[])[];

export function offsetsOf(paths: readonly (readonly Plane[])[]): Offsets {
  const runs = runsOf(paths);
  const offsets = offsetsOfRuns(runs, assignSlots(runs));
  return paths.map((_, cable) => runs.flatMap((run, index) => (run.cable === cable ? [offsets[index]!] : [])));
}

export function shiftedPath(points: readonly Plane[], offsets: readonly number[]): Plane[] {
  const shiftOf = (leg: number, axis: 0 | 1): number | undefined => {
    const start = points[leg]!;
    const end = points[leg + 1]!;
    const runsAlongX = Math.abs(start[1] - end[1]) < EPSILON;
    return (axis === 1) === runsAlongX ? offsets[leg] : undefined;
  };
  return points.map(([x, y], index) => {
    const legs = [index - 1, index].filter((leg) => leg >= 0 && leg < offsets.length);
    const shifts = (axis: 0 | 1) => legs.map((leg) => shiftOf(leg, axis)).find((shift) => shift !== undefined) ?? 0;
    return [x + shifts(0), y + shifts(1)];
  });
}
