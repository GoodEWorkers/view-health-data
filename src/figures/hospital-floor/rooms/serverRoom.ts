import { lineOnTop, sideArc } from '../../../iso/iso-kit.ts';
import type { Plane } from '../../../iso/iso-kit.ts';
import { PROJECTION, dots, line, at } from '../camera.ts';
import { rack } from '../equipment.ts';
import { chair, counter, keyboard, monitor, trolley } from '../furniture.ts';
import { box, compose, dotsOnTop, faceDots, faceRect, floorMark, markup, onGround, post, rect, sorted, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';

const RACK_HEIGHT = 22;
const RACK_PLANS = [-131, -119.5, -108].map((x) => rect(x, -25.8, 10, 9.5, 0.5));
const TRAY = rect(-131, -22.2, 33, 3, 0.3);
const TRAY_RUNG_PITCH = 3;
const UPS = rect(-146.5, -25, 13, 10, 0.8);
const UPS_HEIGHT = 10;
const AIR_CONDITIONER = rect(-70, -26, 14, 6, 0.8);
const AIR_BOTTOM = 3;
const AIR_HEIGHT = 6;
const PATCH_FRAME = rect(-146.5, 11, 8, 5.5, 0.5);
const PATCH_HEIGHT = 7.5;
const DESK = rect(-92, -25.8, 18, 8, 0.6);
const DESK_HEIGHT = 7.5;
const MAINTENANCE_CART_ORIGIN: Plane = [-122, 2];
const EXTINGUISHER_CENTRE: Plane = [-48, -23.5];
const COLD_AISLE_TILES = [-131, -119, -107].map((x) => rect(x, -15, 12, 7.5, 0.8));
const PERFORATION = { columns: 5, rows: 3, gap: 1.8, inset: 1.8, height: 0.1 };

export function serverRoomParts(): Part[] {
  return [
    ...COLD_AISLE_TILES.flatMap(perforatedTile),
    serverRacks(),
    upsCabinet(),
    airConditioner(),
    patchFrame(),
    maintenanceDesk(),
    maintenanceCart(),
    fireExtinguisher(),
  ];
}

function perforatedTile(tile: ReturnType<typeof rect>): Part[] {
  const { columns, rows, gap, inset, height } = PERFORATION;
  const holes = dotsOnTop(tile.x + inset, tile.y + inset, columns, rows, gap, height);
  return [floorMark(tile), onGround(markup(holes, [tile.x, tile.y, 0]))];
}

function serverRacks(): Part {
  const racks = RACK_PLANS.map((plan) => rack(plan, 'left'));
  const rungs = Array.from({ length: Math.floor(TRAY.w / TRAY_RUNG_PITCH) - 1 }, (_, index) => {
    const x = TRAY.x + (index + 1) * TRAY_RUNG_PITCH;
    return lineOnTop([x, TRAY.y], [x, TRAY.y + TRAY.d], RACK_HEIGHT + 0.8, PROJECTION);
  });
  const tray = box(TRAY, RACK_HEIGHT, 0.8, { tone: 'lo', bevel: 0.2, trim: line(rungs.join(''), { tone: 'faint' }) });
  return compose([sorted(racks), tray], [-114, -21, 11]);
}

function upsCabinet(): Part {
  const { x, y, w, d } = UPS;
  const display = line(faceRect(UPS, 'left', 2.2, 7.2, UPS_HEIGHT - 4, UPS_HEIGHT - 1.4), { tone: 'lo' });
  const leds = dots([0, 1, 2].map((index) => at([x + 9 + index * 1.2, y + d, UPS_HEIGHT - 2.7])), { size: 0.5, tone: 'hi' });
  const vents = faceDots(UPS, 'left', 2.4, 1.6, 7, 2, 1.1);
  const top = topOutline(UPS, UPS_HEIGHT, 1.2);
  const door = line(faceRect(UPS, 'left', 0.8, w - 0.8, 0.8, UPS_HEIGHT - 0.8), { tone: 'faint' });
  return box(UPS, 0, UPS_HEIGHT, { tone: 'mid', bevel: 0.5, trim: display + leds + vents + top + door });
}

function airConditioner(): Part {
  const { x, y, w, d } = AIR_CONDITIONER;
  const top = AIR_BOTTOM + AIR_HEIGHT;
  const louvres = Array.from({ length: 4 }, (_, index) => {
    const bottom = AIR_BOTTOM + 1.2 + index * 1.15;
    return faceRect(AIR_CONDITIONER, 'left', 1.6, w - 1.6, bottom, bottom + 0.55);
  });
  const backing = box(rect(x - 1.5, y, w + 3, 0.6, 0.2), AIR_BOTTOM - 1.8, AIR_HEIGHT + 3, { tone: 'lo', bevel: 0 });
  const brackets = [x + 2, x + w - 3].map((bracketX) => box(rect(bracketX, y, 1, 2.4, 0.2), AIR_BOTTOM - 1.6, 1.6, { tone: 'lo', bevel: 0 }));
  const unit = box(AIR_CONDITIONER, AIR_BOTTOM, AIR_HEIGHT, {
    tone: 'mid',
    bevel: 0.5,
    trim: line(louvres.join(''), { tone: 'faint' }) + topOutline(AIR_CONDITIONER, top, 1) + dots([at([x + w - 1.2, y + d, top - 1.2])], { size: 0.5, tone: 'hi' }),
  });
  return compose([backing, sorted(brackets), unit], [x + w / 2, y + d / 2, AIR_BOTTOM + 3]);
}

function patchFrame(): Part {
  const { x, y, w, d } = PATCH_FRAME;
  const slots = [2.2, 4.6].map((bottom) => faceRect(PATCH_FRAME, 'left', 1, w - 1, bottom, bottom + 1.2));
  const ports = faceDots(PATCH_FRAME, 'left', 1.6, 1.1, 6, 1, 1);
  const screws = dots([at([x + 1, y + d, PATCH_HEIGHT - 0.8]), at([x + w - 1, y + d, PATCH_HEIGHT - 0.8])], { size: 0.45 });
  const trim = line(slots.join(''), { tone: 'faint' }) + ports + topOutline(PATCH_FRAME, PATCH_HEIGHT, 0.9) + screws;
  return box(PATCH_FRAME, 0, PATCH_HEIGHT, { tone: 'mid', bevel: 0.4, trim });
}

function maintenanceDesk(): Part {
  const topZ = DESK_HEIGHT;
  const screen = monitor([DESK.x + 12, DESK.y + 2.6], topZ, 'left');
  const keys = keyboard([DESK.x + 5, DESK.y + 4], topZ, 3.4, 10);
  const stool = chair([DESK.x + 8, DESK.y + 14], 'right');
  return compose([counter(DESK, DESK_HEIGHT), sorted([screen, keys]), stool], [DESK.x + 9, DESK.y + 4, 4]);
}

function maintenanceCart(): Part {
  const [x, y] = MAINTENANCE_CART_ORIGIN;
  const shelfTop = 6.2;
  const toolbox = box(rect(x + 1.5, y + 1.6, 6, 4.8, 0.6), shelfTop, 2.2, { tone: 'lo', trim: topOutline(rect(x + 1.5, y + 1.6, 6, 4.8, 0.6), shelfTop + 2.2, 0.8) });
  const laptop = box(rect(x + 9, y + 1.8, 3.6, 4.4, 0.4), shelfTop, 0.5, { tone: 'mid', bevel: 0.2 });
  return compose([trolley(MAINTENANCE_CART_ORIGIN, [14, 8]), sorted([toolbox, laptop])], [x + 7, y + 4, 4]);
}

function fireExtinguisher(): Part {
  const [x, y] = EXTINGUISHER_CENTRE;
  return compose([
    post([x, y], 1.7, 0, 7, { tone: 'mid', steps: 12, inner: line(sideArc(x, y, 1.7, 5.2, PROJECTION, 12), { tone: 'faint' }) }),
    post([x, y], 0.8, 7, 1, { steps: 8 }),
    box(rect(x - 0.5, y - 0.5, 2.6, 1, 0.2), 8, 0.6, { tone: 'lo', bevel: 0 }),
  ]);
}
