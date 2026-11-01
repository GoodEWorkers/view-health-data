// A Part is svg plus a depth key. The painter sorts parts by depth, so what rests on another part is composed with it, and floor marks use GROUND_DEPTH.

import { cylinder, dotGrid, extrude, insetPlan, planOutline, slabOf } from '../../iso/iso-kit.ts';
import type { Plan, Plane, Point3, Tone } from '../../iso/iso-kit.ts';
import { PROJECTION, at, depth, dots, line, polyline, solid } from './camera.ts';

export type Part = { readonly svg: string; readonly depth: number };

export type Face = 'front' | 'left';

export type Style = {
  tone?: Tone;
  bevel?: number;
  steps?: number;
  crease?: Tone | 'none';
  inner?: string;
  trim?: string;
};

const DEFAULT_RADIUS = 0.5;
const DEFAULT_BEVEL = 0.4;
const DEFAULT_STEPS = 3;
const ROUND_STEPS = 14;
const SCREEN_INSET = 0.6;
const GROUND_MARK_HEIGHT = 0.1;

export const rect = (x: number, y: number, w: number, d: number, r = DEFAULT_RADIUS): Plan => ({ x, y, w, d, r });

export function box(plan: Plan, z: number, height: number, style: Style = {}): Part {
  const { tone = 'mid', bevel = DEFAULT_BEVEL, steps = DEFAULT_STEPS, crease, inner, trim = '' } = style;
  const paths = slabOf(plan, z, height, PROJECTION, steps, bevel);
  return {
    svg: solid(paths, { tone, crease, inner }) + trim,
    depth: depth([plan.x + plan.w / 2, plan.y + plan.d / 2, z + height / 2]),
  };
}

export function post(centre: Plane, radius: number, z: number, height: number, style: Style = {}): Part {
  const { tone = 'mid', bevel = 0, steps = ROUND_STEPS, crease, inner, trim = '' } = style;
  const paths = cylinder(centre[0], centre[1], radius, z, height, PROJECTION, steps, bevel);
  return { svg: solid(paths, { tone, crease, inner }) + trim, depth: depth([centre[0], centre[1], z + height / 2]) };
}

export function prism(ring: readonly Plane[], z: number, height: number, style: Style = {}): Part {
  const { tone = 'mid', bevel = 0, crease, inner, trim = '' } = style;
  const paths = extrude([...ring], z, height, PROJECTION, { convex: false, bevel });
  const [sumX, sumY] = ring.reduce(([sx, sy], [px, py]) => [sx + px, sy + py], [0, 0]);
  return { svg: solid(paths, { tone, crease, inner }) + trim, depth: depth([sumX / ring.length, sumY / ring.length, z + height / 2]) };
}

export function compose(parts: readonly Part[], anchor?: Point3): Part {
  const total = parts.reduce((sum, part) => sum + part.depth, 0);
  return { svg: parts.map((part) => part.svg).join(''), depth: anchor ? depth(anchor) : total / Math.max(1, parts.length) };
}

export const markup = (svg: string, anchor: Point3): Part => ({ svg, depth: depth(anchor) });

const GROUND_DEPTH = -1e6;

export const onGround = (part: Part): Part => ({ ...part, depth: GROUND_DEPTH });

export const isOnGround = (part: Part): boolean => part.depth === GROUND_DEPTH;

export const floorMark = (plan: Plan, tone: Tone = 'faint'): Part =>
  onGround(markup(line(planOutline(plan, GROUND_MARK_HEIGHT, PROJECTION, DEFAULT_STEPS), { tone }), [plan.x, plan.y, 0]));

const byDepthAscending = (parts: readonly Part[]): Part[] => [...parts].sort((first, second) => first.depth - second.depth);

export const sorted = (parts: readonly Part[]): Part => compose(byDepthAscending(parts));

export const stacked = (base: Part, riders: readonly Part[]): Part => compose([base, ...byDepthAscending(riders)]);

export const paint = (parts: readonly Part[]): string => byDepthAscending(parts).map((part) => part.svg).join('');

export const faceAt = (plan: Plan, face: Face, along: number, z: number): Point3 =>
  face === 'front' ? [plan.x + plan.w, plan.y + along, z] : [plan.x + along, plan.y + plan.d, z];

export const faceRect = (plan: Plan, face: Face, from: number, to: number, bottom: number, top: number) =>
  polyline([faceAt(plan, face, from, bottom), faceAt(plan, face, to, bottom), faceAt(plan, face, to, top), faceAt(plan, face, from, top)], true);

export const faceLine = (plan: Plan, face: Face, from: number, to: number, bottom: number, top = bottom) =>
  polyline([faceAt(plan, face, from, bottom), faceAt(plan, face, to, top)]);

export const faceLength = (plan: Plan, face: Face) => (face === 'front' ? plan.d : plan.w);

export const topOutline = (plan: Plan, z: number, inset: number, tone: Tone = 'faint') =>
  line(planOutline(insetPlan(plan, inset), z, PROJECTION, DEFAULT_STEPS), { tone });

export const screwDots = (points: readonly Plane[], z: number, size = 0.45) =>
  dots(points.map(([x, y]) => at([x, y, z])), { size });

export const dotsOnTop = (x: number, y: number, columns: number, rows: number, gap: number, z: number, tone: Tone = 'lo') =>
  dots(dotGrid(x, y, columns, rows, gap, z, PROJECTION), { size: 0.4, tone });

export const faceDots = (plan: Plan, face: Face, fromAlong: number, fromZ: number, columns: number, rows: number, gap: number) =>
  dots(
    Array.from({ length: columns * rows }, (_, index) =>
      at(faceAt(plan, face, fromAlong + (index % columns) * gap, fromZ + Math.floor(index / columns) * gap)),
    ),
    { size: 0.4, tone: 'lo' },
  );

export const screenOutline = (plan: Plan, face: Face, bottom: number, top: number) => {
  const length = faceLength(plan, face);
  return line(faceRect(plan, face, SCREEN_INSET, length - SCREEN_INSET, bottom + SCREEN_INSET, top - SCREEN_INSET), { tone: 'faint' });
};
