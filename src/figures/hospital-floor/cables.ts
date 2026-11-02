// The cables at build time: each flow's legs bundled into lanes with rounded corners in world units, then projected by the one affine camera. Drawn after the trunking and before the walls, so furniture stands on them.

import { DEPARTMENTS } from '../../content/departments.ts';
import { protocolOf } from '../../content/network/protocols.ts';
import type { ProtocolInfo } from '../../content/network/protocols.ts';
import { groupSvg } from '../../iso/iso-kit.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { offsetsOf, shiftedPath } from './cableLanes.ts';
import { CABLE_LINES } from './cableRoutes.ts';
import type { CableLine } from './cableRoutes.ts';
import { nearestOnPolyline, stopShares } from './cableStops.ts';
import { at, polyline } from './camera.ts';
import { roundedPolyline } from './rounding.ts';

export const CABLE_HEIGHT = 0.4;
export const CORNER_RADIUS = 4;
const MIN_CORNER_RADIUS = 0.4;
const GATE_HALF_WIDTH = 1.4;
const GATE_HEIGHT = 3.4;
const SHARE_DIGITS = 4;

export type CableLeg = {
  readonly offsets: readonly number[];
  readonly corners: readonly Plane[];
  readonly path: readonly Plane[];
};

export type Cable = CableLine & {
  readonly colour: string;
  readonly textColour: string;
  readonly family: ProtocolInfo;
  readonly legs: readonly CableLeg[];
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

const transportOf = ({ transport, payload }: CableLine['flow']) => {
  if (transport === undefined) throw new Error(`Flow "${payload}" has no transport`);
  return transport;
};

function bundled(lines: readonly CableLine[]): Cable[] {
  const offsets = offsetsOf(lines.flatMap(({ centrelines }) => centrelines));
  let next = 0;
  return lines.map((line) => {
    const legs = line.centrelines.map((centre): CableLeg => {
      const legOffsets = offsets[next++]!;
      const corners = shiftedPath(centre, legOffsets);
      return { offsets: legOffsets, corners, path: roundedPolyline(corners, (vertex) => cornerRadiusAt(centre, corners, vertex)) };
    });
    const { colour, textColour } = DEPARTMENTS.find(({ id }) => id === line.source)!;
    return { ...line, colour, textColour, family: protocolOf(transportOf(line.flow)), legs };
  });
}

export const CABLES: readonly Cable[] = bundled(CABLE_LINES);

const dOf = (path: readonly Plane[]): string => polyline(path.map(([x, y]) => [x, y, CABLE_HEIGHT]));

export const stopsOf = ({ legs, stops }: Cable): number[] => stopShares(legs.map(({ path }) => path), stops, ([x, y]) => at([x, y, CABLE_HEIGHT]));

// A small gate straddling the cable where it crosses the firewall: two posts and a lintel, perpendicular to the way the cable runs.
function gateSvg({ legs, hops, stops }: Cable): string {
  const stop = stops[hops.findIndex(({ kind }) => kind === 'firewall')];
  if (stop === undefined || typeof stop.at === 'string') return '';
  const { point, direction } = nearestOnPolyline(legs[stop.leg]!.path, stop.at);
  const [sideX, sideY]: Plane = [-direction[1] * GATE_HALF_WIDTH, direction[0] * GATE_HALF_WIDTH];
  const post = ([px, py]: Plane, z: number): [number, number, number] => [px, py, z];
  const gate = polyline([
    post([point[0] - sideX, point[1] - sideY], CABLE_HEIGHT),
    post([point[0] - sideX, point[1] - sideY], GATE_HEIGHT),
    post([point[0] + sideX, point[1] + sideY], GATE_HEIGHT),
    post([point[0] + sideX, point[1] + sideY], CABLE_HEIGHT),
  ]);
  return `<path class="cable-gate-halo" d="${gate}"/><path class="cable-gate" d="${gate}"/>`;
}

const keyOf = ({ source, flow }: Cable): string => `${source}:${flow.payload}`;

function cableSvg(cable: Cable, index: number): string {
  const { source, target, colour, family, legs, external } = cable;
  const d = legs.map(({ path }) => dOf(path)).join('');
  return groupSvg([`<path class="cable-glow" d="${d}"/>`, `<path class="cable-core" d="${d}"/>`, gateSvg(cable), `<path class="cable-hit" d="${d}"/>`], {
    'data-cable': '',
    'data-from': source,
    'data-to': target,
    'data-flow': index,
    'data-family': family.id,
    'data-dash': family.dash.join(' '),
    'data-trace': keyOf(cable),
    'data-external': external ? '' : undefined,
    'data-stops': stopsOf(cable).map((share) => share.toFixed(SHARE_DIGITS)).join(','),
    style: `--room: ${colour}; --family: ${family.colour}; --dash: ${family.dash.length === 0 ? 'none' : family.dash.join(' ')}`,
  });
}

export const cablesSvg = (): string => groupSvg(CABLES.map(cableSvg), { 'data-cables': '' }) + groupSvg('', { 'data-packets': '' });
