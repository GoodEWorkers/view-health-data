// One cable centreline per flow, in world units: anchor device, room door, trunking, door and anchor of the receiving room. EAI-bound cables follow routes.ts to the hub; room-to-room cables take the shortest trunking path.

import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId, Flow } from '../../content/departments.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { deviceAnchor } from './devices.ts';
import { doorFrame, roomById } from './model.ts';
import { ROUTES } from './routes.ts';
import { snapped, trunkPath } from './trunkPaths.ts';

export type CableLine = {
  readonly source: DepartmentId;
  readonly target: DepartmentId;
  readonly flow: Flow;
  readonly flowIndex: number;
  readonly points: readonly Plane[];
};

const EPSILON = 1e-6;
const HUB_ID: DepartmentId = 'eai';

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

export function cableBetween(source: DepartmentId, target: DepartmentId): Plane[] {
  if (target === HUB_ID) return withoutRedundantPoints([...routeToHub(source), ...routeToHub(HUB_ID).reverse()]);
  const trunk = trunkPath(entryOf(source), entryOf(target));
  return withoutRedundantPoints([...insideRoom(source).slice(0, -1), ...trunk, ...insideRoom(target).slice(0, -1).reverse()]);
}

export const CABLE_LINES: readonly CableLine[] = DEPARTMENTS.flatMap(({ id, flows }) =>
  flows.map((flow, flowIndex): CableLine => ({ source: id, target: flow.to, flow, flowIndex, points: cableBetween(id, flow.to) })),
);
