// Plan of the floor in world units: x toward the entrance, y toward the viewer's left, z up. Rooms are interior plans and walls sit outside them. Pure data and helpers.

import type { DepartmentId } from '../../content/departments.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';

export type Side = 'front' | 'back' | 'left' | 'right';

export type Door = {
  readonly host: 'room' | 'bay';
  readonly side: Side;
  readonly along: number;
  readonly width: number;
  readonly hinge: 'low' | 'high';
  readonly leadsTo: 'corridor' | 'bay';
};

export type Room = {
  readonly id: DepartmentId;
  readonly plan: Plan;
  readonly bay?: Plan;
  readonly doors: readonly Door[];
};

export type Wall = {
  readonly plan: Plan;
  readonly height: number;
  readonly owners: readonly DepartmentId[];
};

export type Gap = { readonly centre: Plane; readonly width: number };

export const WALL_THICKNESS = 2.5;
export const TALL_WALL = 14;
const LOW_WALL = 8;
const BAY_WALL = 7;
const CORRIDOR_WIDTH = 16;

export const BASEBOARD: Plan = { x: -170, y: -115, w: 340, d: 230, r: 8 };
export const BUILDING: Plan = { x: -150, y: -95, w: 300, d: 190, r: 0 };

export const SIDE_NORMALS: Record<Side, Plane> = { front: [1, 0], back: [-1, 0], left: [0, 1], right: [0, -1] };
const DOOR_WIDTH = 10;
const OPENING_WIDTH = 16;
const PROBE_CLEARANCE = 2;

const plan = (x: number, y: number, w: number, d: number, r = 0): Plan => ({ x, y, w, d, r });
const door = (side: Side, along: number, hinge: Door['hinge'], width = DOOR_WIDTH): Door => ({
  host: 'room',
  side,
  along,
  width,
  hinge,
  leadsTo: 'corridor',
});

const IMAGING_BAY = plan(-112, 28.5, 26, 23.5);
const IMAGING_BAY_DOOR: Door = { host: 'bay', side: 'front', along: 40, width: 9, hinge: 'high', leadsTo: 'bay' };

export const ROOMS: readonly Room[] = [
  { id: 'gam', plan: plan(71, 10.5, 76.5, 82, 3), doors: [door('right', 132, 'low')] },
  { id: 'rdv', plan: plan(71, -92.5, 76.5, 82, 2), doors: [door('left', 132, 'high')] },
  { id: 'dpi', plan: plan(-14, -29, 66, 58, 4), doors: [door('front', 0, 'low')] },
  { id: 'sgl', plan: plan(-30.5, 48, 99, 44.5, 2), doors: [door('right', 24, 'high')] },
  {
    id: 'pacs-ris',
    plan: plan(-147.5, 28.5, 114.5, 64, 3.5),
    bay: IMAGING_BAY,
    doors: [door('front', 38, 'low'), IMAGING_BAY_DOOR],
  },
  { id: 'pharmacie', plan: plan(-30.5, -92.5, 99, 44.5, 2.5), doors: [door('left', 24, 'low')] },
  { id: 'bloc', plan: plan(-147.5, -92.5, 114.5, 64, 3.5), doors: [door('front', -38, 'high')] },
  { id: 'eai', plan: plan(-147.5, -26, 114.5, 52, 1.5), doors: [door('front', 0, 'low', 12)] },
];

export const SPUR: Plan = plan(68.5, -8, 79, CORRIDOR_WIDTH);
export const RING_FLOOR: Plan = plan(-30.5, -45.5, 99, 91);

export const CORRIDOR_PLANS: readonly Plan[] = [
  SPUR,
  plan(54.5, -45.5, 14, 91),
  plan(-30.5, -45.5, 14, 91),
  plan(-16.5, 31.5, 71, 14),
  plan(-16.5, -45.5, 71, 14),
];

export const ENTRANCE: Gap = { centre: [BUILDING.x + BUILDING.w - WALL_THICKNESS / 2, 0], width: OPENING_WIDTH };
const SPUR_OPENING: Gap = { centre: [69.75, 0], width: OPENING_WIDTH };

const wall = (x: number, y: number, w: number, d: number, height: number) => ({ plan: plan(x, y, w, d), height });

const WALL_LINES = [
  wall(-150, -95, 2.5, 190, LOW_WALL),
  wall(147.5, -95, 2.5, 190, LOW_WALL),
  wall(-147.5, -95, 295, 2.5, TALL_WALL),
  wall(-147.5, 92.5, 295, 2.5, LOW_WALL),
  wall(68.5, -92.5, 2.5, 185, LOW_WALL),
  wall(-33, -92.5, 2.5, 185, LOW_WALL),
  wall(71, 8, 76.5, 2.5, LOW_WALL),
  wall(71, -10.5, 76.5, 2.5, LOW_WALL),
  wall(-30.5, 45.5, 99, 2.5, LOW_WALL),
  wall(-30.5, -48, 99, 2.5, LOW_WALL),
  wall(-147.5, 26, 114.5, 2.5, LOW_WALL),
  wall(-147.5, -28.5, 114.5, 2.5, LOW_WALL),
  wall(52, -31.5, 2.5, 63, LOW_WALL),
  wall(-16.5, -31.5, 2.5, 63, LOW_WALL),
  wall(-14, 29, 66, 2.5, LOW_WALL),
  wall(-14, -31.5, 66, 2.5, LOW_WALL),
];

const BAY_WALLS = [
  plan(IMAGING_BAY.x - WALL_THICKNESS, IMAGING_BAY.y, WALL_THICKNESS, IMAGING_BAY.d),
  plan(IMAGING_BAY.x - WALL_THICKNESS, IMAGING_BAY.y + IMAGING_BAY.d, IMAGING_BAY.w + WALL_THICKNESS * 2, WALL_THICKNESS),
  plan(IMAGING_BAY.x + IMAGING_BAY.w, IMAGING_BAY.y, WALL_THICKNESS, IMAGING_BAY.d),
].map((bayPlan) => ({ plan: bayPlan, height: BAY_WALL }));

export const roomById = (id: DepartmentId): Room => {
  const room = ROOMS.find((candidate) => candidate.id === id);
  if (!room) throw new Error(`no room for ${id}`);
  return room;
};

export const overlaps = (first: Plan, second: Plan) =>
  first.x < second.x + second.w && second.x < first.x + first.w && first.y < second.y + second.d && second.y < first.y + first.d;

export const insideBuilding = ({ x, y, w, d }: Plan) =>
  x >= BUILDING.x + WALL_THICKNESS &&
  y >= BUILDING.y + WALL_THICKNESS &&
  x + w <= BUILDING.x + BUILDING.w - WALL_THICKNESS &&
  y + d <= BUILDING.y + BUILDING.d - WALL_THICKNESS;

const hostPlan = (room: Room, { host }: Door): Plan => {
  if (host === 'bay' && room.bay) return room.bay;
  return room.plan;
};

const edgePoint = ({ x, y, w, d }: Plan, side: Side, along: number): Plane => {
  if (side === 'front') return [x + w, along];
  if (side === 'back') return [x, along];
  if (side === 'left') return [along, y + d];
  return [along, y];
};

const alongVector = (side: Side): Plane => (side === 'front' || side === 'back' ? [0, 1] : [1, 0]);

export function doorSegment(room: Room, door: Door): { from: Plane; to: Plane } {
  const edge = edgePoint(hostPlan(room, door), door.side, door.along);
  const [ax, ay] = alongVector(door.side);
  const half = door.width / 2;
  return { from: [edge[0] - ax * half, edge[1] - ay * half], to: [edge[0] + ax * half, edge[1] + ay * half] };
}

export function doorOpening(room: Room, door: Door): Plane {
  const edge = edgePoint(hostPlan(room, door), door.side, door.along);
  const [nx, ny] = SIDE_NORMALS[door.side];
  const reach = door.leadsTo === 'bay' ? -PROBE_CLEARANCE : WALL_THICKNESS + PROBE_CLEARANCE;
  return [edge[0] + nx * reach, edge[1] + ny * reach];
}

export type DoorFrame = { readonly centre: Plane; readonly along: Plane; readonly inward: Plane };

export function doorFrame(room: Room, door: Door): DoorFrame {
  const edge = edgePoint(hostPlan(room, door), door.side, door.along);
  const [nx, ny] = SIDE_NORMALS[door.side];
  const half = WALL_THICKNESS / 2;
  return { centre: [edge[0] + nx * half, edge[1] + ny * half], along: alongVector(door.side), inward: [-nx, -ny] };
}

const doorGap = (room: Room, door: Door): Gap => ({ centre: doorFrame(room, door).centre, width: door.width });

const gapsOfDoors = () => ROOMS.flatMap((room) => room.doors.map((candidate) => doorGap(room, candidate)));

const covers = ({ x, y, w, d }: Plan, [px, py]: Plane) => px > x && px < x + w && py > y && py < y + d;

function cutAt(slab: Plan, gap: Gap): Plan[] {
  const runsAlongX = slab.w > slab.d;
  const start = runsAlongX ? slab.x : slab.y;
  const length = runsAlongX ? slab.w : slab.d;
  const centre = runsAlongX ? gap.centre[0] : gap.centre[1];
  const before = centre - gap.width / 2 - start;
  const after = start + length - (centre + gap.width / 2);
  const piece = (from: number, size: number) => (runsAlongX ? { ...slab, x: from, w: size } : { ...slab, y: from, d: size });
  return [
    ...(before > 0 ? [piece(start, before)] : []),
    ...(after > 0 ? [piece(start + length - after, after)] : []),
  ];
}

function cutWall(slab: Plan, gaps: readonly Gap[]): Plan[] {
  return gaps.reduce<Plan[]>(
    (pieces, gap) => pieces.flatMap((piece) => (covers(piece, gap.centre) ? cutAt(piece, gap) : [piece])),
    [slab],
  );
}

const grown = ({ x, y, w, d, r }: Plan, by: number): Plan => ({ x: x - by, y: y - by, w: w + by * 2, d: d + by * 2, r });

const ownersOf = (slab: Plan): DepartmentId[] =>
  ROOMS.filter((room) => !overlaps(slab, room.plan) && overlaps(slab, grown(room.plan, WALL_THICKNESS))).map(
    (room) => room.id,
  );

const MIN_PIECE = 0.01;

function splitAtRoomEdges(slab: Plan): Plan[] {
  const runsAlongX = slab.w > slab.d;
  const start = runsAlongX ? slab.x : slab.y;
  const end = start + (runsAlongX ? slab.w : slab.d);
  const edges = ROOMS.filter((room) => ownersOf(slab).includes(room.id)).flatMap(({ plan: { x, y, w, d } }) =>
    runsAlongX ? [x, x + w] : [y, y + d],
  );
  const bounds = [start, ...[...new Set(edges)].filter((edge) => edge > start + MIN_PIECE && edge < end - MIN_PIECE).sort((a, b) => a - b), end];
  return bounds.slice(1).map((to, index) => {
    const from = bounds[index]!;
    return runsAlongX ? { ...slab, x: from, w: to - from } : { ...slab, y: from, d: to - from };
  });
}

export function wallsOf(): Wall[] {
  const gaps = [ENTRANCE, SPUR_OPENING, ...gapsOfDoors()];
  const shell = WALL_LINES.flatMap(({ plan: slab, height }) =>
    cutWall(slab, gaps)
      .flatMap(splitAtRoomEdges)
      .map((piece): Wall => ({ plan: piece, height, owners: ownersOf(piece) })),
  );
  const bay = BAY_WALLS.flatMap(({ plan: slab, height }) =>
    cutWall(slab, gaps).map((piece): Wall => ({ plan: piece, height, owners: ['pacs-ris'] })),
  );
  return [...shell, ...bay];
}

export const wallHeightAt = ([px, py]: Plane): number => {
  const host = [...WALL_LINES, ...BAY_WALLS].find(({ plan: slab }) => covers(grown(slab, 0.01), [px, py]));
  return host ? host.height : LOW_WALL;
};

const TRUNK_WIDTH = 3;
const RING_CENTRE = { front: 61.5, back: -23.5, left: 38.5, right: -38.5 } as const;
const SPUR_END_X = 147.5;
const TILE_PANEL_X = -66;

const trunkBetween = ([fromX, fromY]: Plane, [toX, toY]: Plane): Plan => {
  const half = TRUNK_WIDTH / 2;
  if (fromX === toX) return plan(fromX - half, Math.min(fromY, toY) - half, TRUNK_WIDTH, Math.abs(toY - fromY) + TRUNK_WIDTH);
  return plan(Math.min(fromX, toX) - half, fromY - half, Math.abs(toX - fromX) + TRUNK_WIDTH, TRUNK_WIDTH);
};

export const TRUNK_RUNS: readonly Plan[] = [
  trunkBetween([132, 8], [132, 0]),
  trunkBetween([132, -8], [132, 0]),
  trunkBetween([24, 45.5], [24, RING_CENTRE.left]),
  trunkBetween([24, -45.5], [24, RING_CENTRE.right]),
  trunkBetween([-30.5, 38], [RING_CENTRE.back, 38]),
  trunkBetween([-30.5, -38], [RING_CENTRE.back, -38]),
  trunkBetween([TILE_PANEL_X, 0], [RING_CENTRE.back, 0]),
  trunkBetween([RING_CENTRE.back, RING_CENTRE.left], [RING_CENTRE.front, RING_CENTRE.left]),
  trunkBetween([RING_CENTRE.back, RING_CENTRE.right], [RING_CENTRE.front, RING_CENTRE.right]),
  trunkBetween([RING_CENTRE.front, RING_CENTRE.right], [RING_CENTRE.front, RING_CENTRE.left]),
  trunkBetween([RING_CENTRE.back, RING_CENTRE.right], [RING_CENTRE.back, RING_CENTRE.left]),
  trunkBetween([SPUR_END_X - 2, 0], [54.5, 0]),
];

export const CENTRE_LINES = {
  spur: [[SPUR_END_X, 0], [54.5, 0]],
  ring: [
    [RING_CENTRE.back, RING_CENTRE.right],
    [RING_CENTRE.front, RING_CENTRE.right],
    [RING_CENTRE.front, RING_CENTRE.left],
    [RING_CENTRE.back, RING_CENTRE.left],
  ],
} as const;

export const TILE_PANEL: Plan = plan(TILE_PANEL_X, -9, 36, 18, 0.5);
