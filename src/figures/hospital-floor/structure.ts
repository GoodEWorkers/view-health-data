// Floors, room numerals lying on the floor under every object (ground marks, trunking, walls, furniture, door leaves). Furniture stays clear of near walls (+y side) because it is painted after them.

import { extrude, faceTextSvg, groupSvg, insetPlan, planOutline, slabOf, topMatrix } from '../../iso/iso-kit.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId } from '../../content/departments.ts';
import { PROJECTION, byDepth, line, polyline, solid } from './camera.ts';
import {
  CENTRE_LINES,
  ENTRANCE,
  RING_FLOOR,
  ROOMS,
  SPUR,
  THRESHOLD_DEPTH,
  TILE_PANEL,
  TRUNK_RUNS,
  doorFrame,
  thresholdCentre,
  wallHeightAt,
  wallsOf,
} from './model.ts';
import type { Door, DoorFrame, Room } from './model.ts';
import { roomZoneColour, roomZoneTint } from './zoneColours.ts';

const TINTED_FLOOR = 'room-floor';
export const FLOOR_HEIGHT = 0.1;
const FLOOR_OUTLINE_INSET = 1;
const NUMERAL_SHORT_SIDE_SHARE = 0.75;
// Digit height and width as shares of the font size; the width is a generous bound for a bold digit.
const DIGIT_HEIGHT_SHARE = 0.7;
export const DIGIT_WIDTH_SHARE = 0.65;
const LEAF_THICKNESS = 1.1;
const LEAF_SWING = (55 * Math.PI) / 180;
const LEAF_CLEARANCE = 0.3;
const LEAF_HEADROOM = 0.6;
const TILE_PITCH = 6;
const WALL_BEVEL = 0.4;

const flat = (plan: Plan, tone: 'lo' | 'faint', className?: string) =>
  solid(slabOf(plan, 0, FLOOR_HEIGHT, PROJECTION, 3), { tone, flat: true, crease: 'none', className });

const roomColour = (id: DepartmentId) => DEPARTMENTS.find((department) => department.id === id)!.colour;

export const roomGroup = (children: string, id: DepartmentId) => groupSvg(children, { 'data-room': id, style: `--room: ${roomColour(id)}; --zone: ${roomZoneColour(id)}; --zone-tint: ${roomZoneTint(id)}` });

export function floorsSvg(): string {
  const corridor = flat(SPUR, 'lo') + flat(RING_FLOOR, 'lo');
  return corridor + ROOMS.map((room) => roomGroup(roomFloor(room), room.id)).join('');
}

function roomFloor(room: Room): string {
  const outline = line(planOutline(insetPlan(room.plan, FLOOR_OUTLINE_INSET), FLOOR_HEIGHT, PROJECTION, 4), { tone: 'faint' });
  return flat(room.plan, 'lo', TINTED_FLOOR) + outline;
}

export function numeralsSvg(): string {
  return ROOMS.map((room) => roomGroup(numeralSvg(room), room.id)).join('');
}

// One size for the eight digits: three quarters of the short side of the smallest room, so each fits inside its walls.
export const NUMERAL_SIZE = NUMERAL_SHORT_SIDE_SHARE * Math.min(...ROOMS.map(({ plan: { w, d } }) => Math.min(w, d)));

export const numeralCentre = ({ plan: { x, y, w, d } }: Room): Plane => [x + w / 2, y + d / 2];

function numeralSvg(room: Room): string {
  const number = DEPARTMENTS.findIndex(({ id }) => id === room.id) + 1;
  const [centreX, centreY] = numeralCentre(room);
  const baseline: Plane = [centreX, centreY + (NUMERAL_SIZE * DIGIT_HEIGHT_SHARE) / 2];
  const text = faceTextSvg(topMatrix(baseline, FLOOR_HEIGHT, PROJECTION, 'x'), String(number), { size: NUMERAL_SIZE, tone: 'lo', anchor: 'middle' });
  return groupSvg(text, { class: 'room-numeral' });
}

export function trunkingSvg(): string {
  const runs = TRUNK_RUNS.map((run) => flat(run, 'faint')).join('');
  const thresholds = ROOMS.flatMap((room) =>
    room.doors.filter(isCorridorDoor).map((door) => roomGroup(flat(thresholdOf(room, door), 'faint', TINTED_FLOOR), room.id)),
  );
  return runs + thresholds.join('') + groupSvg(tilePanelSvg(), { 'data-room': 'eai' }) + centreLinesSvg();
}

const isCorridorDoor = (door: Door) => door.leadsTo === 'corridor';

function thresholdOf(room: Room, door: Door): Plan {
  const middle = thresholdCentre(room, door);
  const alongX = Math.abs(doorFrame(room, door).along[0]) > 0;
  const width = door.width;
  return alongX
    ? { x: middle[0] - width / 2, y: middle[1] - THRESHOLD_DEPTH / 2, w: width, d: THRESHOLD_DEPTH, r: 0.4 }
    : { x: middle[0] - THRESHOLD_DEPTH / 2, y: middle[1] - width / 2, w: THRESHOLD_DEPTH, d: width, r: 0.4 };
}

function tilePanelSvg(): string {
  const { x, y, w, d } = TILE_PANEL;
  const columns = Array.from({ length: Math.round(w / TILE_PITCH) - 1 }, (_, index) => x + (index + 1) * TILE_PITCH);
  const rows = Array.from({ length: Math.round(d / TILE_PITCH) - 1 }, (_, index) => y + (index + 1) * TILE_PITCH);
  const seams = [
    ...columns.map((column) => polyline([[column, y, FLOOR_HEIGHT], [column, y + d, FLOOR_HEIGHT]])),
    ...rows.map((row) => polyline([[x, row, FLOOR_HEIGHT], [x + w, row, FLOOR_HEIGHT]])),
  ];
  return flat(TILE_PANEL, 'faint') + line(seams.join(''), { tone: 'faint' });
}

function centreLinesSvg(): string {
  const spur = polyline(CENTRE_LINES.spur.map(([x, y]) => [x, y, FLOOR_HEIGHT]));
  const ring = polyline(CENTRE_LINES.ring.map(([x, y]) => [x, y, FLOOR_HEIGHT]), true);
  return line(spur, { tone: 'lo' }) + line(ring, { tone: 'lo' });
}

export function wallsSvg(): string {
  const walls = byDepth(wallsOf(), ({ plan, height }) => [plan.x + plan.w / 2, plan.y + plan.d / 2, height / 2]);
  return walls
    .map(({ plan, height, owners }) => {
      const slab = solid(slabOf(plan, 0, height, PROJECTION, 1, WALL_BEVEL), { tone: 'mid' });
      return owners.length ? groupSvg(slab, { 'data-room': owners.join(' ') }) : slab;
    })
    .join('');
}

type Leaf = { readonly ring: Plane[]; readonly height: number; readonly middle: Plane; readonly room: string };

type Hanging = { readonly jambOffset: number; readonly length: number; readonly hinge: Door['hinge']; readonly room: string };

function leafOf(frame: DoorFrame, { jambOffset, length: reach, hinge, room }: Hanging, height: number): Leaf {
  const { centre, along, inward } = frame;
  const sign = hinge === 'low' ? 1 : -1;
  const origin: Plane = [centre[0] - along[0] * sign * jambOffset, centre[1] - along[1] * sign * jambOffset];
  const direction: Plane = [
    Math.cos(LEAF_SWING) * along[0] * sign + Math.sin(LEAF_SWING) * inward[0],
    Math.cos(LEAF_SWING) * along[1] * sign + Math.sin(LEAF_SWING) * inward[1],
  ];
  const length = reach - LEAF_CLEARANCE;
  const [px, py] = [-direction[1] * (LEAF_THICKNESS / 2), direction[0] * (LEAF_THICKNESS / 2)];
  const tip: Plane = [origin[0] + direction[0] * length, origin[1] + direction[1] * length];
  return {
    ring: [
      [origin[0] + px, origin[1] + py],
      [tip[0] + px, tip[1] + py],
      [tip[0] - px, tip[1] - py],
      [origin[0] - px, origin[1] - py],
    ],
    height,
    middle: [(origin[0] + tip[0]) / 2, (origin[1] + tip[1]) / 2],
    room,
  };
}

function allLeaves(): Leaf[] {
  const roomLeaves = ROOMS.flatMap((room) =>
    room.doors.map((door) => {
      const frame = doorFrame(room, door);
      const hanging: Hanging = { jambOffset: door.width / 2, length: door.width, hinge: door.hinge, room: room.id };
      return leafOf(frame, hanging, wallHeightAt(frame.centre) - LEAF_HEADROOM);
    }),
  );
  const entranceFrame: DoorFrame = { centre: ENTRANCE.centre, along: [0, 1], inward: [-1, 0] };
  const entranceHeight = wallHeightAt(ENTRANCE.centre) - LEAF_HEADROOM;
  const half = ENTRANCE.width / 2;
  const hangings = (['low', 'high'] as const).map((hinge): Hanging => ({ jambOffset: half, length: half, hinge, room: 'gam' }));
  return [...roomLeaves, ...hangings.map((hanging) => leafOf(entranceFrame, hanging, entranceHeight))];
}

export function leavesSvg(): string {
  return byDepth(allLeaves(), ({ middle, height }) => [middle[0], middle[1], height / 2])
    .map(({ ring, height, room }) => groupSvg(solid(extrude(ring, 0, height, PROJECTION, { bevel: 0.3 }), { tone: 'mid' }), { 'data-room': room }))
    .join('');
}
