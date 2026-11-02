// The jack wires: where a socket sits on a bezel, the chain of cubic Béziers (clamped B-spline over lane waypoints) from a source's bottom plug to a target's top plug, and the plug drawing. Client-safe.

import type { Corner, Quad } from './homography.ts';

export const LOGICAL = { width: 416, height: 256 } as const;
export type Side = 'top' | 'bottom';
export type Curve = readonly [Corner, Corner, Corner, Corner];
export type WireEnd = { readonly point: Corner; readonly outward: Corner };

const SOCKET_MARGIN = 40;
const SOCKET_BAND = 6.5;
export const PLUG_LENGTH = 25;
export const LABEL_HEIGHT = 16;
const CURVE_MIDDLE = 0.5;
const LABEL_SAMPLES = 17;
const END_EPSILON = 1e-9;

export const socketCentre = (slot: number, count: number, side: Side): Corner => [
  SOCKET_MARGIN + ((slot + 1) / (count + 1)) * (LOGICAL.width - 2 * SOCKET_MARGIN),
  side === 'top' ? SOCKET_BAND : LOGICAL.height - SOCKET_BAND,
];

function pointInQuad([topLeft, topRight, bottomRight, bottomLeft]: Quad, [across, down]: Corner): Corner {
  const mix = (index: 0 | 1): number => {
    const top = topLeft[index] + (topRight[index] - topLeft[index]) * across;
    const bottom = bottomLeft[index] + (bottomRight[index] - bottomLeft[index]) * across;
    return top + (bottom - top) * down;
  };
  return [mix(0), mix(1)];
}

export const scaleOfQuad = ([topLeft, topRight]: Quad): number => Math.hypot(topRight[0] - topLeft[0], topRight[1] - topLeft[1]) / LOGICAL.width;

export const plugEnd = ({ point, outward }: WireEnd, reach: number): Corner => [point[0] + outward[0] * reach, point[1] + outward[1] * reach];

export function socketEnd(quad: Quad, side: Side, slot: number, count: number): WireEnd {
  const [x, y] = socketCentre(slot, count, side);
  const [topLeft, , , bottomLeft] = quad;
  const length = Math.hypot(bottomLeft[0] - topLeft[0], bottomLeft[1] - topLeft[1]) || 1;
  const sign = side === 'bottom' ? 1 : -1;
  return {
    point: pointInQuad(quad, [x / LOGICAL.width, y / LOGICAL.height]),
    outward: [(sign * (bottomLeft[0] - topLeft[0])) / length, (sign * (bottomLeft[1] - topLeft[1])) / length],
  };
}

export function curvePoint([first, second, third, fourth]: Curve, time: number): Corner {
  const rest = 1 - time;
  const weights = [rest ** 3, 3 * rest * rest * time, 3 * rest * time * time, time ** 3] as const;
  const along = (axis: 0 | 1): number => weights[0] * first[axis] + weights[1] * second[axis] + weights[2] * third[axis] + weights[3] * fourth[axis];
  return [along(0), along(1)];
}

const mixPoints = (first: Corner, second: Corner, share: number): Corner => [first[0] + (second[0] - first[0]) * share, first[1] + (second[1] - first[1]) * share];

export function splineCurves(controls: readonly Corner[]): Curve[] {
  const padded = [controls[0]!, controls[0]!, ...controls, controls.at(-1)!, controls.at(-1)!];
  return Array.from({ length: padded.length - 3 }, (_, index) => {
    const [a, b, c, d] = padded.slice(index, index + 4) as [Corner, Corner, Corner, Corner];
    const knot = (before: Corner, middle: Corner, after: Corner): Corner => [(before[0] + 4 * middle[0] + after[0]) / 6, (before[1] + 4 * middle[1] + after[1]) / 6];
    return [knot(a, b, c), mixPoints(b, c, 1 / 3), mixPoints(b, c, 2 / 3), knot(b, c, d)] as Curve;
  });
}

const round = (value: number): string => value.toFixed(1);
const pair = ([x, y]: Corner): string => `${round(x)} ${round(y)}`;

export const splinePath = (curves: readonly Curve[]): string =>
  `M${pair(curves[0]![0])}${curves.map(([, second, third, fourth]) => `C${pair(second)} ${pair(third)} ${pair(fourth)}`).join('')}`;

export function splinePoint(curves: readonly Curve[], time: number): Corner {
  const scaled = Math.min(curves.length - END_EPSILON, Math.max(0, time * curves.length));
  const index = Math.floor(scaled);
  return curvePoint(curves[index]!, scaled - index);
}

export function chordControls(start: Corner, finish: Corner, route: readonly Corner[], share: number, slack = 0): Corner[] {
  const targets = route.length > 0 ? route : [mixPoints(start, finish, CURVE_MIDDLE)];
  const along = (index: number): number => (index + 1) / (targets.length + 1);
  const hung = (point: Corner, time: number): Corner => [point[0], point[1] + slack * (1 - share) * Math.sin(Math.PI * time)];
  return [start, ...targets.map((point, index) => hung(mixPoints(mixPoints(start, finish, along(index)), point, share), along(index))), finish];
}

export type Box = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export const isInsideBox = ([x, y]: Corner, { x: left, y: top, width, height }: Box, margin = 0): boolean =>
  x > left - margin && x < left + width + margin && y > top - margin && y < top + height + margin;

export function labelPoint(curves: readonly Curve[], labelSize: Corner, screens: readonly Box[]): Corner {
  const [halfWidth, halfHeight] = [labelSize[0] / 2, labelSize[1] / 2];
  const covered = ([x, y]: Corner): boolean => screens.some((box) => isInsideBox([x - halfWidth, y], box) || isInsideBox([x + halfWidth, y], box) || isInsideBox([x, y - halfHeight], box) || isInsideBox([x, y + halfHeight], box));
  const times = Array.from({ length: LABEL_SAMPLES }, (_, index) => index / (LABEL_SAMPLES - 1)).sort((first, second) => Math.abs(first - CURVE_MIDDLE) - Math.abs(second - CURVE_MIDDLE));
  const points = times.map((time) => splinePoint(curves, time));
  return points.find((point) => !covered(point)) ?? points[0]!;
}

export const plugAngleDegrees = ([x, y]: Corner): number => (Math.atan2(-x, y) * 180) / Math.PI;

export const plugSvg = (): string =>
  '<g data-plug="">' +
  '<rect class="plug-tip" x="-1.6" y="-4" width="3.2" height="10.4" rx="1.6"/>' +
  '<rect class="plug-ring" x="-2.7" y="6.4" width="5.4" height="2.6"/>' +
  '<rect class="plug-body" x="-4.3" y="9" width="8.6" height="9.6" rx="1.8"/>' +
  `<path class="plug-relief" d="M-3 18.4L-1.5 ${PLUG_LENGTH}h3L3 18.4Z"/>` +
  '</g>';
