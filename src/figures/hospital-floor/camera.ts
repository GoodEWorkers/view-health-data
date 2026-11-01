// The one projection of Figure 1, fitted to the baseboard plus the tallest outer wall, and the drawing shorthands every module shares.

import { boxCorners, depthOf, dotsSvg, fitProjection, iso, lineSvg, pathOf, solidSvg } from '../../iso/iso-kit.ts';
import type { Flat, LineStyle, Point3, Projection, SolidPaths, SolidStyle, Tone } from '../../iso/iso-kit.ts';
import { BASEBOARD, BUILDING, TALL_WALL } from './model.ts';

export const VIEW_BOX = { width: 800, height: 458 } as const;
export const FEET_DEPTH = 17;

const AZIMUTH_DEGREES = 90;
const ELEVATION_DEGREES = 50;
const VIEW_PADDING = 20;

export const PROJECTION: Projection = fitProjection(
  [...boxCorners(BASEBOARD, -FEET_DEPTH, 0), ...boxCorners(BUILDING, 0, TALL_WALL)],
  VIEW_BOX.width,
  VIEW_BOX.height,
  { pad: VIEW_PADDING, azimuth: AZIMUTH_DEGREES, elevation: ELEVATION_DEGREES },
);

export const at = (point: Point3): Flat => iso(point, PROJECTION);

export const depth = (point: Point3): number => depthOf(point, PROJECTION);

export const byDepth = <Item>(items: readonly Item[], centreOf: (item: Item) => Point3): Item[] =>
  [...items].sort((first, second) => depth(centreOf(first)) - depth(centreOf(second)));

export const solid = (paths: SolidPaths, style?: SolidStyle) => solidSvg(paths, style);

export const line = (path: string, style?: LineStyle) => lineSvg(path, style);

export const dots = (points: Flat[], style?: { size?: number; tone?: Tone }) => dotsSvg(points, style);

export const polyline = (points: readonly Point3[], closed = false) => pathOf(points.map(at), closed);
