// One cable per flow in world units, following its hops: device, room door, trunking to the hub, then the bus of the server room to the end station; a message for another room returns by a second leg. An external flow runs on to the telecom box.

import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId, ExternalFlow, Flow } from '../../content/departments.ts';
import { hopsOf, hopsOfExternal } from '../../content/network/hops.ts';
import type { Hop } from '../../content/network/hops.ts';
import { zonesOfFlow } from '../../content/network/zones.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { deviceAnchor } from './devices.ts';
import { doorFrame, roomById } from './model.ts';
import { BUS_Y, GATE_X, RACK_BASE_Y, ROUTER_FACE_X, SCANNER_ROUTE, SCANNER_ROOM, STATION_X, TELECOM_FOOT_X, accessSwitchPlan } from './networkGear.ts';
import { ROUTES } from './routes.ts';
import { snapped } from './trunkPaths.ts';

export const OUTSIDE = 'outside';

export type Stop = { readonly leg: number; readonly at: 'start' | 'end' | Plane };

type LineBase = {
  readonly source: DepartmentId;
  readonly flowIndex: number;
  readonly hops: readonly Hop[];
  readonly centrelines: readonly (readonly Plane[])[];
  readonly stops: readonly Stop[];
};

export type InternalLine = LineBase & { readonly external: false; readonly target: DepartmentId; readonly flow: Flow };
export type ExternalLine = LineBase & { readonly external: true; readonly target: typeof OUTSIDE; readonly flow: ExternalFlow };
export type CableLine = InternalLine | ExternalLine;

const EPSILON = 1e-6;
const CORE_STATION: Plane = [STATION_X.core, BUS_Y];
const FIREWALL_STATION: Plane = [GATE_X, BUS_Y];
const DMZ_STATION: Plane = [STATION_X.dmz, BUS_Y];
const ROUTER_STATION: Plane = [ROUTER_FACE_X, BUS_Y];
const SWITCH_STATION_REACH = 0.9;

const samePoint = (first: Plane, second: Plane): boolean => Math.abs(first[0] - second[0]) < EPSILON && Math.abs(first[1] - second[1]) < EPSILON;

const directionOf = ([fromX, fromY]: Plane, [toX, toY]: Plane): Plane => [Math.sign(toX - fromX), Math.sign(toY - fromY)];

export function withoutRedundantPoints(points: readonly Plane[]): Plane[] {
  const distinct = points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]!));
  return distinct.filter((point, index) => {
    if (index === 0 || index === distinct.length - 1) return true;
    const [inX, inY] = directionOf(distinct[index - 1]!, point);
    const [outX, outY] = directionOf(point, distinct[index + 1]!);
    if (inX * outX + inY * outY < 0) throw new Error(`a cable doubles back at ${point}`);
    return inX !== outX || inY !== outY;
  });
}

const entryOf = (id: DepartmentId): Plane => ROUTES[id][0]!;

function interiorCorner(id: DepartmentId, anchor: Plane): Plane {
  const room = roomById(id);
  const door = room.doors.find(({ leadsTo }) => leadsTo === 'corridor')!;
  const [inwardX, inwardY] = doorFrame(room, door).inward;
  const [entryX, entryY] = entryOf(id);
  const depth = (anchor[0] - entryX) * inwardX + (anchor[1] - entryY) * inwardY;
  return snapped([entryX + inwardX * depth, entryY + inwardY * depth]);
}

const insideRoom = (id: DepartmentId): Plane[] => {
  const anchor = deviceAnchor(id);
  return [anchor, interiorCorner(id, anchor), snapped(entryOf(id))];
};

export function routeToHub(id: DepartmentId): Plane[] {
  return withoutRedundantPoints([...insideRoom(id).slice(0, -1), ...ROUTES[id].map(snapped)]);
}

type Terminal = 'core' | 'eai';

// A message that stops at the core ends under the core rack; one for the EAI turns north to the foot of the EAI rack.
const tailTo = (terminal: Terminal): Plane[] => (terminal === 'core' ? [[STATION_X.core, BUS_Y]] : [[STATION_X.eai, BUS_Y], [STATION_X.eai, RACK_BASE_Y]]);

const startsAtModality = (from: DepartmentId, flow: Flow): boolean => from === SCANNER_ROOM && zonesOfFlow(from, flow)[0] === 'biomedical-modalities';

const originRoute = (from: DepartmentId, flow: Flow): Plane[] =>
  startsAtModality(from, flow) ? withoutRedundantPoints([...SCANNER_ROUTE, ...ROUTES[from].map(snapped)]) : routeToHub(from);

function switchStation(room: DepartmentId): Plane {
  const { x, y, w, d } = accessSwitchPlan(room);
  return [x + w / 2, y + d / 2 + SWITCH_STATION_REACH];
}

function internalStop({ kind, room }: Hop, index: number, hops: readonly Hop[], legCount: number): Stop {
  const eaiAt = hops.findIndex((hop) => hop.kind === 'eai');
  if (index === 0) return { leg: 0, at: 'start' };
  if (index === hops.length - 1) return { leg: legCount - 1, at: 'end' };
  if (kind === 'switch') return { leg: 0, at: switchStation(room!) };
  if (kind === 'firewall') return { leg: 0, at: FIREWALL_STATION };
  if (kind === 'eai' || (kind === 'core' && eaiAt < 0)) return { leg: 0, at: 'end' };
  return { leg: eaiAt >= 0 && index > eaiAt ? 1 : 0, at: CORE_STATION };
}

function internalLine(from: DepartmentId, flow: Flow, flowIndex: number): InternalLine {
  const hops = hopsOf(from, flow);
  const terminal: Terminal = hops.some(({ kind }) => kind === 'eai') ? 'eai' : 'core';
  const out = withoutRedundantPoints([...originRoute(from, flow), ...tailTo(terminal)]);
  const back = flow.to === 'eai' ? [] : [withoutRedundantPoints([...tailTo(terminal).reverse(), ...routeToHub(flow.to).reverse()])];
  const centrelines = [out, ...back];
  const stops = hops.map((hop, index) => internalStop(hop, index, hops, centrelines.length));
  return { source: from, target: flow.to, flow, flowIndex, external: false, hops, centrelines, stops };
}

function externalStop({ kind }: Hop, index: number, hops: readonly Hop[]): Stop {
  if (index === 0) return { leg: 0, at: 'start' };
  if (index === hops.length - 1) return { leg: 0, at: 'end' };
  const stations: Partial<Record<Hop['kind'], Plane>> = { core: CORE_STATION, firewall: FIREWALL_STATION, proxy: DMZ_STATION, vpn: DMZ_STATION, router: ROUTER_STATION };
  return { leg: 0, at: stations[kind]! };
}

function externalLine(from: DepartmentId, flow: ExternalFlow, flowIndex: number): ExternalLine {
  const hops = hopsOfExternal(from, flow);
  const centrelines = [withoutRedundantPoints([...routeToHub(from), [TELECOM_FOOT_X, BUS_Y]])];
  return { source: from, target: OUTSIDE, flow, flowIndex, external: true, hops, centrelines, stops: hops.map((hop, index) => externalStop(hop, index, hops)) };
}

export const CABLE_LINES: readonly CableLine[] = [
  ...DEPARTMENTS.flatMap(({ id, flows }) => flows.map((flow, flowIndex) => internalLine(id, flow, flowIndex))),
  ...DEPARTMENTS.flatMap(({ id, network }) => network.externalFlows.map((flow, flowIndex) => externalLine(id, flow, flowIndex))),
];
