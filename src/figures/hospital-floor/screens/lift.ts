// Where each room's screen floats: the largest frontal rectangle, in the monitor's aspect, that fits the room's projected plan rectangle with an inset and room above and below for the jack plugs; and the quad it rises from. All in viewBox units.

import type { DepartmentId } from '../../../content/departments.ts';
import { DEPARTMENTS } from '../../../content/departments.ts';
import type { Flat, Point3 } from '../../../iso/iso-kit.ts';
import { at } from '../camera.ts';
import { screenQuadOf } from '../devices.ts';
import { roomById } from '../model.ts';
import type { Quad } from './homography.ts';

export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export const INSET = 4;
export type Clearance = { readonly top: number; readonly bottom: number };

const NO_CLEARANCE: Clearance = { top: 0, bottom: 0 };
// Rooms stacked with only a wall between them, in the left column, need a gutter for the plugs and lanes of the wires between them.
export const CLEARANCES: Readonly<Partial<Record<DepartmentId, Clearance>>> = {
  bloc: { top: 0, bottom: 6 },
  eai: { top: 16, bottom: 0 },
  'pacs-ris': { top: 6, bottom: 0 },
};
export const LIFT = 6;

const distance = (from: Point3, to: Point3): number => Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);

export function roomRectOf(id: DepartmentId): Rect {
  const { x, y, w, d } = roomById(id).plan;
  const corners = [at([x, y, 0]), at([x + w, y, 0]), at([x + w, y + d, 0]), at([x, y + d, 0])];
  const left = Math.min(...corners.map(([cornerX]) => cornerX));
  const top = Math.min(...corners.map(([, cornerY]) => cornerY));
  return { x: left, y: top, width: Math.max(...corners.map(([cornerX]) => cornerX)) - left, height: Math.max(...corners.map(([, cornerY]) => cornerY)) - top };
}

export function screenAspectOf(id: DepartmentId): number {
  const [bottomLeft, bottomRight, , topLeft] = screenQuadOf(id) as readonly [Point3, Point3, Point3, Point3];
  return distance(bottomLeft, bottomRight) / distance(bottomLeft, topLeft);
}

export function startQuadOf(id: DepartmentId): Quad {
  const [bottomLeft, bottomRight, topRight, topLeft] = screenQuadOf(id).map(at) as [Flat, Flat, Flat, Flat];
  return [topLeft, topRight, bottomRight, bottomLeft];
}

export function liftedRectOf(id: DepartmentId): Rect {
  const room = roomRectOf(id);
  const aspect = screenAspectOf(id);
  const { top, bottom } = CLEARANCES[id] ?? NO_CLEARANCE;
  const margin = INSET / 2;
  const availableWidth = room.width - INSET;
  const availableHeight = room.height - INSET - top - bottom;
  const width = Math.min(availableWidth, availableHeight * aspect);
  const height = width / aspect;
  const slack = (availableHeight - height) / 2;
  return {
    x: room.x + (room.width - width) / 2,
    y: room.y + margin + top + slack - Math.min(LIFT, slack),
    width,
    height,
  };
}

export const quadOfRect = ({ x, y, width, height }: Rect): Quad => [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];

export const LIFTED_RECTS: Readonly<Record<DepartmentId, Rect>> = Object.fromEntries(DEPARTMENTS.map(({ id }) => [id, liftedRectOf(id)])) as Record<DepartmentId, Rect>;
