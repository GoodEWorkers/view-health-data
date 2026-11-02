// Where the network gear stands, in world units. Wall switches hang on the far wall of their room; in the server room the trunking goes on as one straight bus through core, firewall, DMZ rack and router to the telecom box outside.

import type { Plan, Plane } from '../../iso/iso-kit.ts';
import type { DepartmentId } from '../../content/departments.ts';
import { RING_CENTRE, roomById, TILE_PANEL } from './model.ts';
import { rect } from './parts.ts';
import { RACK_HEIGHT, RACK_PLANS } from './rooms/serverRoom.ts';

export const SWITCH_SIZE = { width: 6, depth: 1.8, height: 2.4, bottom: 4.2 } as const;

const SWITCH_ALONG: Readonly<Record<DepartmentId, number>> = {
  gam: 114,
  rdv: 133,
  dpi: 9.4,
  sgl: 61.4,
  'pacs-ris': -58,
  pharmacie: 53,
  bloc: -98,
  eai: -44,
};

export const accessSwitchPlan = (room: DepartmentId): Plan => rect(SWITCH_ALONG[room], roomById(room).plan.y, SWITCH_SIZE.width, SWITCH_SIZE.depth, 0.3);

export const BUS_Y = 0;
const RACK_SIZE = { width: 10, depth: 9.5 };
const rackAt = (centreOfX: number): Plan => rect(centreOfX - RACK_SIZE.width / 2, BUS_Y - RACK_SIZE.depth / 2, RACK_SIZE.width, RACK_SIZE.depth, 0.5);

const EAI_RACK = RACK_PLANS[2]!;
const RACK_FACE_Y = EAI_RACK.y + EAI_RACK.d;

export const CORE_RACK = rackAt(-75);
export const DMZ_RACK = rackAt(-120);
export const FIREWALL_BOX = { plan: rect(-93, BUS_Y - 3.5, 8, 7, 0.6), plinthHeight: 0.8, height: 5 } as const;
export const CORE_UNIT = { plan: rect(CORE_RACK.x + 1.8, CORE_RACK.y + CORE_RACK.d, CORE_RACK.w - 3.6, 0.7, 0.2), bottom: 4.5, height: 2 } as const;

export const HUB: Plane = [TILE_PANEL.x, BUS_Y];
const centreX = ({ x, w }: Plan): number => x + w / 2;
export const STATION_X = { core: centreX(CORE_RACK), firewall: centreX(FIREWALL_BOX.plan), eai: centreX(EAI_RACK), dmz: centreX(DMZ_RACK) } as const;
export const GATE_X = FIREWALL_BOX.plan.x + FIREWALL_BOX.plan.w + 2;
export const RACK_BASE_Y = RACK_FACE_Y;
export const RACK_TOP_Z = RACK_HEIGHT;

export const ROUTER = { plan: rect(-145.5, BUS_Y - 5, 8, 10, 0.8), bottom: 0.6, height: 3 } as const;
export const TELECOM = { plinth: rect(-168.6, BUS_Y - 5.2, 10.2, 10.4, 0.8), body: rect(-167.8, BUS_Y - 4.4, 8.6, 8.8, 0.8), plinthHeight: 1, height: 10 } as const;
export const TELECOM_FOOT_X = TELECOM.plinth.x + TELECOM.plinth.w;
export const ROUTER_FACE_X = ROUTER.plan.x + ROUTER.plan.w;

export const WALL_OUTER_X = -150;
export const WALL_INNER_X = -147.5;
export const TRAY_WIDTH = 8;
export const FIBRE_TRAY = rect(TELECOM_FOOT_X, BUS_Y - TRAY_WIDTH / 2, WALL_OUTER_X - TELECOM_FOOT_X, TRAY_WIDTH, 0.8);

export const DMZ_PATCH = rect(-127.5, BUS_Y - 7, 15, 14, 3);
export const BIOMEDICAL_PATCHES: readonly Plan[] = [rect(-147, 29.2, 33, 52, 4), rect(-30, 49, 24, 18, 3), rect(-128, -68, 20, 21, 4)];

export const SCANNER_ROUTE: readonly Plane[] = [[-116, 36], [-116, 29.8], [-40, 29.8], [-40, RING_CENTRE.left]];
export const SCANNER_ROOM: DepartmentId = 'pacs-ris';
