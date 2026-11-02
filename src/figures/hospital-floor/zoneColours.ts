// The colour and the tint of each network zone as the floor needs them: the floor of a room, the patches that mark a biomedical device or the DMZ, the glow of the gear.

import type { DepartmentId } from '../../content/departments.ts';
import { EQUIPMENT } from '../../content/network/equipment.ts';
import { ZONES, zoneOfDevice } from '../../content/network/zones.ts';
import type { Zone } from '../../content/network/zones.ts';

const PERCENT = 100;

export const zoneColour = (zone: Zone): string => ZONES.find(({ id }) => id === zone)!.colour;

// The share of the zone colour in its floor fill, as a CSS percentage.
export const zoneTint = (zone: Zone): string => `${Math.round(ZONES.find(({ id }) => id === zone)!.tint * PERCENT)}%`;

const zoneOfRoom = (room: DepartmentId): Zone => zoneOfDevice(room, room === 'eai' ? 'server' : 'workstation');

export const roomZoneColour = (room: DepartmentId): string => zoneColour(zoneOfRoom(room));

export const roomZoneTint = (room: DepartmentId): string => zoneTint(zoneOfRoom(room));

// A piece of gear glows in the colour of its zone; the edge pieces (router, telecom box) belong to none and keep the neutral glow of the stylesheet.
export const equipmentColour = (id: string): string | undefined => {
  const zone = EQUIPMENT.find((item) => item.id === id)?.zone;
  return zone === undefined || zone === 'edge' ? undefined : zoneColour(zone);
};
