// The network gear as solids: wall access switches, the core and firewall on the rack row, the WAN router, the telecom box and the covers of the fibre trunking. Each part rests on the wall, a rack, the floor or a plinth.

import type { Plan } from '../../iso/iso-kit.ts';
import type { DepartmentId } from '../../content/departments.ts';
import { at, dots, line } from './camera.ts';
import { rack } from './equipment.ts';
import { BUS_Y, CORE_RACK, CORE_UNIT, DMZ_RACK, FIREWALL_BOX, RACK_TOP_Z, ROUTER, SWITCH_SIZE, TELECOM, TRAY_WIDTH, WALL_INNER_X, WALL_OUTER_X, accessSwitchPlan } from './networkGear.ts';
import { asEquipment, box, compose, dotsOnTop, faceAt, faceRect, post, rect, sorted, topOutline } from './parts.ts';
import type { Part } from './parts.ts';

const EAR_WIDTH = 0.6;
const EAR_DEPTH = 0.5;
const PORT_PITCH = 0.78;
const PORT_DOT = 0.34;
const LED_DOT = 0.42;
const FOOT_RADIUS = 0.55;
const COVER_HEIGHT = 1.4;
const COVER_INSIDE_LENGTH = 2;
const COVER_OUTSIDE_LENGTH = 3;
const COVER_MARGIN = 0.7;

const cornersOnTop = (plan: Plan, z: number): [number, number][] =>
  [plan.x + 0.9, plan.x + plan.w - 0.9].flatMap((x) => [plan.y + 0.9, plan.y + plan.d - 0.9].map((y) => at([x, y, z])));

const portDots = (plan: Plan, from: number, count: number, z: number, pitch = PORT_PITCH) =>
  dots(Array.from({ length: count }, (_, index) => at(faceAt(plan, 'left', from + index * pitch, z))), { size: PORT_DOT, tone: 'hi' });

const ledDots = (plan: Plan, positions: readonly number[], z: number) => dots(positions.map((along) => at(faceAt(plan, 'left', along, z))), { size: LED_DOT, tone: 'mid' });

function ears(plan: Plan, bottom: number, height: number): Part[] {
  const [left, right] = [plan.x - EAR_WIDTH, plan.x + plan.w];
  return [left, right].map((x) => {
    const ear = rect(x, plan.y, EAR_WIDTH, EAR_DEPTH, 0.15);
    const screw = dots([at([x + EAR_WIDTH / 2, ear.y + ear.d, bottom + height / 2])], { size: 0.38 });
    return box(ear, bottom + 0.3, height - 0.6, { tone: 'lo', bevel: 0.1, trim: screw });
  });
}

export function accessSwitch(room: DepartmentId): Part {
  const plan = accessSwitchPlan(room);
  const { width, height, bottom } = SWITCH_SIZE;
  const centre = plan.x + width / 2;
  const slot = line(faceRect(plan, 'left', 0.7, width - 0.7, bottom + 0.45, bottom + 1.35), { tone: 'faint' });
  const trim = slot + portDots(plan, 1, 6, bottom + 0.9) + ledDots(plan, [width - 1.3, width - 0.8], bottom + 1.85) + topOutline(plan, bottom + height, 0.5);
  const body = box(plan, bottom, height, { tone: 'mid', bevel: 0.2, trim });
  const gland = post([centre, plan.y + plan.d / 2], 0.5, bottom - 0.8, 0.8, { tone: 'lo', steps: 8 });
  const riser = post([centre, plan.y + plan.d / 2], 0.3, 0, bottom - 0.8, { tone: 'lo', steps: 6 });
  return asEquipment(compose([riser, gland, ...ears(plan, bottom, height), body], [centre, plan.y + 0.9, bottom]), `switch-${room}`);
}

export function coreCabinet(): Part {
  const { plan, bottom, height } = CORE_UNIT;
  const width = plan.w;
  const slot = line(faceRect(plan, 'left', 0.5, width - 0.5, bottom + 0.35, bottom + 1.65), { tone: 'faint' });
  const rows = portDots(plan, 1, 6, bottom + 0.75, 0.74) + portDots(plan, 1, 6, bottom + 1.25, 0.74);
  const trim = slot + rows + ledDots(plan, [width - 0.9], bottom + 1.0) + topOutline(plan, bottom + height, 0.4);
  const unit = [...ears(plan, bottom, height), box(plan, bottom, height, { tone: 'mid', bevel: 0.15, trim })];
  return asEquipment(compose([rack(CORE_RACK, 'left'), ...unit], [CORE_RACK.x + CORE_RACK.w / 2, CORE_RACK.y + CORE_RACK.d / 2, RACK_TOP_Z / 2]), 'core-eai');
}

export const dmzRack = (): Part => rack(DMZ_RACK, 'left');

export function firewallAppliance(): Part {
  const { plan, plinthHeight, height } = FIREWALL_BOX;
  const bottom = plinthHeight;
  const top = bottom + height;
  const base = box(rect(plan.x - 0.6, plan.y - 0.6, plan.w + 1.2, plan.d + 1.2, 0.7), 0, plinthHeight, { tone: 'lo', bevel: 0.2, trim: dots(cornersOnTop(rect(plan.x - 0.6, plan.y - 0.6, plan.w + 1.2, plan.d + 1.2, 0.7), plinthHeight), { size: 0.4 }) });
  const bezel = line(faceRect(plan, 'left', 0.6, plan.w - 0.6, bottom + 0.6, top - 0.6), { tone: 'lo' });
  const leds = dots(Array.from({ length: 6 }, (_, index) => at(faceAt(plan, 'left', 1.3 + index * 1, top - 1.3))), { size: LED_DOT + 0.08, tone: 'hi' });
  const vents = line([1.3, 2.1].map((offset) => faceRect(plan, 'left', 1.2, plan.w - 1.2, bottom + offset, bottom + offset + 0.5)).join(''), { tone: 'faint' });
  const trim = bezel + vents + leds + portDots(plan, 1.3, 5, bottom + 3.2, 1.3) + topOutline(plan, top, 0.6) + dotsOnTop(plan.x + 1.2, plan.y + 1.2, 6, 4, 1.1, top);
  return asEquipment(compose([base, box(plan, bottom, height, { tone: 'hi', bevel: 0.3, trim })], [plan.x + plan.w / 2, plan.y + plan.d / 2, bottom + 1]), 'firewall-eai');
}

export function wanRouter(): Part {
  const { plan, bottom, height } = ROUTER;
  const top = bottom + height;
  const feet = [plan.x + 1.2, plan.x + plan.w - 1.2].flatMap((x) => [plan.y + 1.2, plan.y + plan.d - 1.2].map((y) => post([x, y], FOOT_RADIUS, 0, bottom, { tone: 'lo', steps: 8, bevel: 0 })));
  const slot = line(faceRect(plan, 'left', 0.8, plan.w - 0.8, bottom + 0.5, bottom + 1.2), { tone: 'faint' });
  const trim = slot + portDots(plan, 1.2, 5, bottom + 0.85, 0.95) + ledDots(plan, [plan.w - 1.6, plan.w - 1], bottom + 2.1) + topOutline(plan, top, 0.9) + dotsOnTop(plan.x + 2, plan.y + 2, 4, 5, 1.4, top);
  const body = box(plan, bottom, height, { tone: 'hi', bevel: 0.3, trim });
  return asEquipment(compose([sorted(feet), body], [plan.x + plan.w / 2, plan.y + plan.d / 2, bottom + 1]), 'router-eai');
}

export function telecomBox(): Part {
  const { plinth, body, plinthHeight, height } = TELECOM;
  const top = plinthHeight + height;
  const door = line(faceRect(body, 'left', 0.8, body.w - 0.8, 0.8, height - 0.8), { tone: 'lo' });
  const louvres = [1.4, 2.4, 3.4].map((bottom) => faceRect(body, 'left', 1.6, body.w - 1.6, bottom, bottom + 0.5));
  const lock = dots([at(faceAt(body, 'left', body.w - 1.6, plinthHeight + height / 2))], { size: 0.5, tone: 'hi' });
  const leds = dots([0, 1, 2].map((index) => at(faceAt(body, 'left', 1.6 + index * 1.1, plinthHeight + height - 1.5))), { size: LED_DOT, tone: 'mid' });
  const cabinet = box(body, plinthHeight, height, { tone: 'mid', bevel: 0.4, trim: door + line(louvres.join(''), { tone: 'faint' }) + lock + leds + topOutline(body, top, 1.1) });
  const cap = box(rect(body.x - 0.5, body.y - 0.5, body.w + 1, body.d + 1, 0.8), top, 0.8, { tone: 'lo', bevel: 0.25, trim: topOutline(rect(body.x - 0.5, body.y - 0.5, body.w + 1, body.d + 1, 0.8), top + 0.8, 0.7) });
  const base = box(plinth, 0, plinthHeight, { tone: 'lo', bevel: 0.2, trim: dots(cornersOnTop(plinth, plinthHeight), { size: 0.45 }) });
  return asEquipment(compose([base, cabinet, cap]), 'telecom-eai');
}

function cover(x: number, length: number): Part {
  const plan = rect(x, BUS_Y - TRAY_WIDTH / 2 - COVER_MARGIN, length, TRAY_WIDTH + COVER_MARGIN * 2, 0.5);
  const screws = dots(cornersOnTop(plan, COVER_HEIGHT), { size: 0.4 });
  return box(plan, 0, COVER_HEIGHT, { tone: 'lo', bevel: 0.2, trim: topOutline(plan, COVER_HEIGHT, 0.5) + screws });
}

const fibreCovers = (): Part[] => [cover(WALL_INNER_X, COVER_INSIDE_LENGTH), cover(WALL_OUTER_X - COVER_OUTSIDE_LENGTH, COVER_OUTSIDE_LENGTH)];

export const networkParts = (room: DepartmentId): Part[] =>
  room === 'eai' ? [accessSwitch(room), coreCabinet(), firewallAppliance(), dmzRack(), wanRouter(), telecomBox(), ...fibreCovers()] : [accessSwitch(room)];
