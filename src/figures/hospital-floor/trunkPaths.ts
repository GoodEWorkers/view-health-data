// The cable trunking as a graph: every route to the hub plus the whole ring, split wherever one run meets another. Shortest path between two room thresholds, in world units, along the trunking centrelines.

import type { Plane } from '../../iso/iso-kit.ts';
import { CENTRE_LINES, RING_CENTRE } from './model.ts';
import { ROUTES } from './routes.ts';

const EPSILON = 1e-6;
const SNAP_REACH = 0.75;
const RING_COLUMNS: readonly number[] = [RING_CENTRE.front, RING_CENTRE.back];
const RING_ROWS: readonly number[] = [RING_CENTRE.left, RING_CENTRE.right];

const snapTo = (value: number, lines: readonly number[]): number => lines.find((line) => Math.abs(line - value) <= SNAP_REACH) ?? value;

export const snapped = ([x, y]: Plane): Plane => [snapTo(x, RING_COLUMNS), snapTo(y, RING_ROWS)];

const keyOf = ([x, y]: Plane): string => `${x.toFixed(3)},${y.toFixed(3)}`;

const distance = ([fromX, fromY]: Plane, [toX, toY]: Plane): number => Math.hypot(toX - fromX, toY - fromY);

const onSegment = (point: Plane, [fromX, fromY]: Plane, [toX, toY]: Plane): boolean =>
  point[0] >= Math.min(fromX, toX) - EPSILON &&
  point[0] <= Math.max(fromX, toX) + EPSILON &&
  point[1] >= Math.min(fromY, toY) - EPSILON &&
  point[1] <= Math.max(fromY, toY) + EPSILON;

type Graph = { readonly nodes: ReadonlyMap<string, Plane>; readonly links: ReadonlyMap<string, ReadonlyMap<string, number>> };

function graphOf(polylines: readonly (readonly Plane[])[]): Graph {
  const nodes = new Map(polylines.flat().map((point) => [keyOf(point), point] as const));
  const links = new Map<string, Map<string, number>>([...nodes.keys()].map((key) => [key, new Map()]));
  for (const polyline of polylines) {
    for (const [index, from] of polyline.slice(0, -1).entries()) {
      const to = polyline[index + 1]!;
      const along = [...nodes.values()].filter((point) => onSegment(point, from, to)).sort((first, second) => distance(from, first) - distance(from, second));
      along.slice(1).forEach((next, step) => {
        const [firstKey, nextKey] = [keyOf(along[step]!), keyOf(next)];
        const length = distance(along[step]!, next);
        links.get(firstKey)!.set(nextKey, length);
        links.get(nextKey)!.set(firstKey, length);
      });
    }
  }
  return { nodes, links };
}

const TRUNK_POLYLINES: readonly (readonly Plane[])[] = [
  ...Object.values(ROUTES).map((route) => route.map(snapped)),
  [...CENTRE_LINES.ring, CENTRE_LINES.ring[0]].map(([x, y]) => snapped([x, y])),
];

const TRUNK = graphOf(TRUNK_POLYLINES);

export function trunkPath(from: Plane, to: Plane, { nodes, links }: Graph = TRUNK): Plane[] {
  const [start, goal] = [keyOf(snapped(from)), keyOf(snapped(to))];
  if (!nodes.has(start) || !nodes.has(goal)) throw new Error(`${start} or ${goal} is not on the trunking`);
  const best = new Map<string, number>([[start, 0]]);
  const before = new Map<string, string>();
  const open = new Set([start]);
  while (open.size > 0) {
    const current = [...open].reduce((nearest, key) => (best.get(key)! < best.get(nearest)! ? key : nearest));
    open.delete(current);
    if (current === goal) break;
    for (const [next, length] of links.get(current)!) {
      const total = best.get(current)! + length;
      if (total < (best.get(next) ?? Infinity) - EPSILON) {
        best.set(next, total);
        before.set(next, current);
        open.add(next);
      }
    }
  }
  if (!best.has(goal)) throw new Error(`no trunking from ${start} to ${goal}`);
  const path: Plane[] = [];
  for (let key: string | undefined = goal; key !== undefined; key = before.get(key)) path.unshift(nodes.get(key)!);
  return path;
}
