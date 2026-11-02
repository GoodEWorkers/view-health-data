// Rounded corners of a polyline, ported from the retired metro map's geometry: each vertex is replaced by an arc whose tangent length is capped at half of the shorter neighbouring leg. Pure, in whatever units the points use.

import type { Plane } from '../../iso/iso-kit.ts';

const ARC_STEPS_PER_QUARTER_TURN = 8;
const NO_TURN = 1e-6;
const REVERSAL = Math.PI - 1e-3;

export const distanceBetween = ([fromX, fromY]: Plane, [toX, toY]: Plane): number => Math.hypot(toX - fromX, toY - fromY);

const unitFrom = (from: Plane, to: Plane): Plane => {
  const length = distanceBetween(from, to);
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
};

function arcAround(centre: Plane, radius: number, startAngle: number, sweep: number): Plane[] {
  const steps = Math.max(2, Math.ceil((Math.abs(sweep) / (Math.PI / 2)) * ARC_STEPS_PER_QUARTER_TURN));
  return Array.from({ length: steps + 1 }, (_, step) => {
    const angle = startAngle + (sweep * step) / steps;
    return [centre[0] + radius * Math.cos(angle), centre[1] + radius * Math.sin(angle)];
  });
}

function cornerAt(previous: Plane, vertex: Plane, next: Plane, radius: number): Plane[] {
  const incoming = unitFrom(previous, vertex);
  const outgoing = unitFrom(vertex, next);
  const turn = Math.acos(Math.min(1, Math.max(-1, incoming[0] * outgoing[0] + incoming[1] * outgoing[1])));
  if (radius <= 0 || turn < NO_TURN || turn > REVERSAL) return [vertex];

  const reachOfArc = Math.tan(turn / 2);
  const tangent = Math.min(radius * reachOfArc, distanceBetween(previous, vertex) / 2, distanceBetween(vertex, next) / 2);
  const arcRadius = tangent / reachOfArc;
  const start: Plane = [vertex[0] - incoming[0] * tangent, vertex[1] - incoming[1] * tangent];
  const side = Math.sign(incoming[0] * outgoing[1] - incoming[1] * outgoing[0]);
  const centre: Plane = [start[0] - incoming[1] * side * arcRadius, start[1] + incoming[0] * side * arcRadius];
  return arcAround(centre, arcRadius, Math.atan2(start[1] - centre[1], start[0] - centre[0]), side * turn);
}

export function roundedPolyline(waypoints: readonly Plane[], radiusAt: (vertexIndex: number) => number): Plane[] {
  const inner = waypoints.slice(1, -1).flatMap((vertex, index) => cornerAt(waypoints[index]!, vertex, waypoints[index + 2]!, radiusAt(index + 1)));
  const first = waypoints[0];
  const last = waypoints.at(-1);
  return first && last ? [first, ...inner, last] : [];
}

export const polylineLength = (points: readonly Plane[]): number =>
  points.slice(1).reduce((total, point, index) => total + distanceBetween(points[index]!, point), 0);
