// Centreline of the cable trunking from each room's corridor threshold to the hub inside the server room: the one path every flow of that room rides. World units, axis-aligned legs.

import type { DepartmentId } from '../../content/departments.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { RING_CENTRE, ROOMS, TILE_PANEL, thresholdCentre } from './model.ts';
import type { Door, Room } from './model.ts';

export type Route = readonly Plane[];

type RingSide = 'left' | 'right';
type SpokeRoomId = Exclude<DepartmentId, 'eai'>;

const HUB: Plane = [TILE_PANEL.x, 0];
const BACK_JUNCTION: Plane = [RING_CENTRE.back, 0];

const viaBack = (side: RingSide): Plane[] => [[RING_CENTRE.back, RING_CENTRE[side]], BACK_JUNCTION, HUB];
const aroundRing = (side: RingSide): Plane[] => [[RING_CENTRE.front, 0], [RING_CENTRE.front, RING_CENTRE[side]], ...viaBack(side)];

const WAYPOINTS: Record<SpokeRoomId, (threshold: Plane) => Plane[]> = {
  gam: ([x]) => [[x, 0], ...aroundRing('left')],
  rdv: ([x]) => [[x, 0], ...aroundRing('right')],
  dpi: () => aroundRing('left'),
  sgl: ([x]) => [[x, RING_CENTRE.left], ...viaBack('left')],
  pharmacie: ([x]) => [[x, RING_CENTRE.right], ...viaBack('right')],
  'pacs-ris': ([, y]) => [[RING_CENTRE.back, y], BACK_JUNCTION, HUB],
  bloc: ([, y]) => [[RING_CENTRE.back, y], BACK_JUNCTION, HUB],
};

function corridorDoorOf({ id, doors }: Room): Door {
  const door = doors.find(({ leadsTo }) => leadsTo === 'corridor');
  if (!door) throw new Error(`no corridor door for ${id}`);
  return door;
}

function routeOf(room: Room): Route {
  if (room.id === 'eai') return [HUB];
  const threshold = thresholdCentre(room, corridorDoorOf(room));
  return [threshold, ...WAYPOINTS[room.id](threshold)];
}

export const ROUTES = Object.fromEntries(ROOMS.map((room) => [room.id, routeOf(room)])) as Record<DepartmentId, Route>;

export const routeLength = (route: Route): number =>
  route.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - route[index]![0], y - route[index]![1]), 0);
