// Where along a cable each of its hops sits: the nearest point of a polyline to a station, and the share of the cable's length at which every hop is reached. Pure, in whatever units the points use.

import type { Plane } from '../../iso/iso-kit.ts';
import { distanceBetween, polylineLength } from './rounding.ts';

export type Nearest = { readonly point: Plane; readonly direction: Plane; readonly length: number };

export type StopAt = 'start' | 'end' | Plane;

const FIRST_SEGMENT = 0;

export function nearestOnPolyline(points: readonly Plane[], target: Plane): Nearest {
  let best: Nearest = { point: points[0]!, direction: [1, 0], length: 0 };
  let bestDistance = Infinity;
  let walked = 0;
  for (let index = FIRST_SEGMENT; index < points.length - 1; index++) {
    const [from, to] = [points[index]!, points[index + 1]!];
    const span = distanceBetween(from, to);
    const direction: Plane = span === 0 ? [1, 0] : [(to[0] - from[0]) / span, (to[1] - from[1]) / span];
    const along = Math.min(span, Math.max(0, (target[0] - from[0]) * direction[0] + (target[1] - from[1]) * direction[1]));
    const point: Plane = [from[0] + direction[0] * along, from[1] + direction[1] * along];
    const distance = distanceBetween(point, target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { point, direction, length: walked + along };
    }
    walked += span;
  }
  return best;
}

export type LegStop = { readonly leg: number; readonly at: StopAt };

// Lengths are taken leg by leg, so a jump between two legs counts for nothing, as in an SVG path made of several subpaths.
export function stopShares(legs: readonly (readonly Plane[])[], stops: readonly LegStop[], project: (point: Plane) => Plane = (point) => point): number[] {
  const polylines = legs.map((leg) => leg.map(project));
  const lengths = polylines.map(polylineLength);
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let previous = 0;
  return stops.map(({ leg, at }) => {
    const before = lengths.slice(0, leg).reduce((sum, length) => sum + length, 0);
    const within = at === 'start' ? 0 : at === 'end' ? lengths[leg]! : nearestOnPolyline(polylines[leg]!, project(at)).length;
    previous = Math.max(previous, (before + within) / total);
    return previous;
  });
}
