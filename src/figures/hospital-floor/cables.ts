// The cables at build time: each flow's centreline bundled into lanes with rounded corners in world units, then projected by the one affine camera. Drawn after the trunking and before the walls, so furniture stands on them.

import { DEPARTMENTS } from '../../content/departments.ts';
import { groupSvg } from '../../iso/iso-kit.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { offsetsOf, shiftedPath } from './cableLanes.ts';
import { CABLE_LINES } from './cableRoutes.ts';
import type { CableLine } from './cableRoutes.ts';
import { polyline } from './camera.ts';
import { roundedPolyline } from './rounding.ts';

export const CABLE_HEIGHT = 0.4;
export const CORNER_RADIUS = 4;
const MIN_CORNER_RADIUS = 0.4;

export type Cable = CableLine & {
  readonly colour: string;
  readonly offsets: readonly number[];
  readonly corners: readonly Plane[];
  readonly path: readonly Plane[];
};

const unitOf = ([fromX, fromY]: Plane, [toX, toY]: Plane): Plane => [Math.sign(toX - fromX), Math.sign(toY - fromY)];

// A strand on the inside of a turn takes a tighter arc and one on the outside a wider one, so a bundle's corners stay concentric.
export function cornerRadiusAt(centre: readonly Plane[], corners: readonly Plane[], vertex: number): number {
  const [inX, inY] = unitOf(centre[vertex - 1]!, centre[vertex]!);
  const [outX, outY] = unitOf(centre[vertex]!, centre[vertex + 1]!);
  const shiftX = corners[vertex]![0] - centre[vertex]![0];
  const shiftY = corners[vertex]![1] - centre[vertex]![1];
  const inside = (shiftX * outX + shiftY * outY - (shiftX * inX + shiftY * inY)) / 2;
  return Math.max(MIN_CORNER_RADIUS, CORNER_RADIUS - inside);
}

function bundled(lines: readonly CableLine[]): Cable[] {
  const offsets = offsetsOf(lines.map(({ points }) => points));
  return lines.map((line, index) => {
    const corners = shiftedPath(line.points, offsets[index]!);
    const path = roundedPolyline(corners, (vertex) => cornerRadiusAt(line.points, corners, vertex));
    const colour = DEPARTMENTS.find(({ id }) => id === line.source)!.colour;
    return { ...line, colour, offsets: offsets[index]!, corners, path };
  });
}

export const CABLES: readonly Cable[] = bundled(CABLE_LINES);

const cableSvg = ({ source, target, colour, path }: Cable): string => {
  const d = polyline(path.map(([x, y]) => [x, y, CABLE_HEIGHT]));
  return groupSvg([`<path class="cable-glow" d="${d}"/>`, `<path class="cable-core" d="${d}"/>`], {
    'data-cable': '',
    'data-from': source,
    'data-to': target,
    style: `--room: ${colour}`,
  });
};

export const cablesSvg = (): string => groupSvg(CABLES.map(cableSvg), { 'data-cables': '' }) + groupSvg('', { 'data-packets': '' });
