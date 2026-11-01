import { insetPlan, sideRing } from '../../../iso/iso-kit.ts';
import type { Plan, Plane } from '../../../iso/iso-kit.ts';
import { PROJECTION, at, dots, line } from '../camera.ts';
import { fridge } from '../equipment.ts';
import { counter, keyboard, monitor } from '../furniture.ts';
import { box, compose, dotsOnTop, faceLine, faceRect, markup, rect, screwDots, sorted, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';
import { cart, cartDeckTop } from './carts.ts';

const SHELF_LEVELS = [1.5, 6, 10.5, 15];
const FRAME_THICKNESS = 0.8;
const BOARD_THICKNESS = 0.7;
const FRAME_HEIGHT = SHELF_LEVELS[SHELF_LEVELS.length - 1]! + 1;
const STOCKED_LEVELS = [1, 2];
const SHELF_LENGTH = 24;
const SHELF_DEPTH = 7;
const SHELF_ORIGINS_X = [-28, -1, 26];
const WALL_Y = -92.5;
const BOXES_PER_ROW = 3;
const BOX_WIDTH = 6.2;
const BOX_GAP = 1.2;

const COUNTER = rect(-8, -72, 40, 9, 0.6);
const COUNTER_HEIGHT = 10;
const HATCH_FROM = 13;
const HATCH_TO = 27;
const HATCH_BOTTOM = 3;
const HATCH_TOP = 8.6;
const FRIDGE_PLAN = rect(58, -66, 8, 8, 0.6);
const SAFE_PLAN = rect(-30, -84, 10, 8, 0.6);
const SAFE_HEIGHT = 11;
const TROLLEY_AT: Plane = [40, -80];
const TROLLEY_SIZE: Plane = [14, 8];

export function pharmacyParts(): Part[] {
  return [
    ...SHELF_ORIGINS_X.map((x) => racking(x)),
    dispensingCounter(),
    fridge(FRIDGE_PLAN, 'left'),
    controlledDrugSafe(),
    stockTrolley(),
  ];
}

function racking(x: number): Part {
  const screws = screwDots([[x + 2, WALL_Y + FRAME_THICKNESS], [x + SHELF_LENGTH - 2, WALL_Y + FRAME_THICKNESS]], FRAME_HEIGHT);
  const back = box(rect(x, WALL_Y, SHELF_LENGTH, FRAME_THICKNESS, 0.2), 0, FRAME_HEIGHT, { bevel: 0.2, trim: screws });
  const board = rect(x, WALL_Y + FRAME_THICKNESS, SHELF_LENGTH, SHELF_DEPTH - FRAME_THICKNESS, 0.2);
  const shelves = SHELF_LEVELS.map((level, index) =>
    compose([box(board, level, BOARD_THICKNESS, { bevel: 0.2 }), sorted(stockRow(board, level + BOARD_THICKNESS, index))]),
  );
  return compose([back, ...shelves]);
}

function stockRow(board: Plan, level: number, index: number): Part[] {
  if (!STOCKED_LEVELS.includes(index)) return [];
  return Array.from({ length: BOXES_PER_ROW }, (_, column) => {
    const slot = rect(board.x + 0.6 + column * (BOX_WIDTH + BOX_GAP), board.y + 0.5, BOX_WIDTH, board.d - 1, 0.3);
    const height = 3.2 + ((column + index) % 2);
    const label = line(faceRect(slot, 'left', 0.8, BOX_WIDTH - 0.8, level + 0.7, level + height - 0.7), { tone: 'faint' });
    return box(slot, level, height, { tone: (column + index) % 2 ? 'lo' : 'mid', bevel: 0.2, trim: label });
  });
}

function dispensingCounter(): Part {
  const body = insetPlan(COUNTER, 0.5);
  const anchor: [number, number, number] = [COUNTER.x + COUNTER.w / 2, COUNTER.y + COUNTER.d / 2, 0];
  const hatchEdge = line(faceRect(body, 'left', HATCH_FROM, HATCH_TO, HATCH_BOTTOM, HATCH_TOP), { tone: 'lo' });
  const hatchSlats = [5, 6.8].map((z) => faceLine(body, 'left', HATCH_FROM, HATCH_TO, z)).join('');
  const sill = box(rect(body.x + HATCH_FROM, body.y + body.d, HATCH_TO - HATCH_FROM, 1.4, 0.3), HATCH_BOTTOM - 0.6, 0.6, { tone: 'lo', bevel: 0.2 });
  const top = topOutline(COUNTER, COUNTER_HEIGHT, 1.2) + screwDots([[COUNTER.x + 1.6, COUNTER.y + 1.6], [COUNTER.x + COUNTER.w - 1.6, COUNTER.y + 1.6]], COUNTER_HEIGHT);
  const trayHoles = dotsOnTop(COUNTER.x + 32, COUNTER.y + 3.2, 3, 2, 1.2, COUNTER_HEIGHT + 0.6);
  const tray = box(rect(COUNTER.x + 31, COUNTER.y + 2.2, 5, 4.4, 0.4), COUNTER_HEIGHT, 0.6, { tone: 'lo', bevel: 0.2, trim: trayHoles });
  const riders = [monitor([COUNTER.x + 6, COUNTER.y + 4.5], COUNTER_HEIGHT, 'left'), keyboard([COUNTER.x + 10, COUNTER.y + 1.2], COUNTER_HEIGHT, 3.4, 9), tray];
  const hatch = markup(hatchEdge + line(hatchSlats, { tone: 'faint' }), [anchor[0], anchor[1], COUNTER_HEIGHT]);
  return compose([counter(COUNTER, COUNTER_HEIGHT), hatch, sill, markup(top, [anchor[0], anchor[1], COUNTER_HEIGHT]), ...riders], anchor);
}

function controlledDrugSafe(): Part {
  const { x, y, w, d } = SAFE_PLAN;
  const dialAt: [number, number, number] = [x + w / 2, y + d, SAFE_HEIGHT * 0.58];
  const dial = line(sideRing(dialAt, 1.8, 'y', PROJECTION, 16), { tone: 'lo' }) + dots([at(dialAt)], { size: 0.5, tone: 'hi' });
  const door = line(faceRect(SAFE_PLAN, 'left', 0.8, w - 0.8, 0.8, SAFE_HEIGHT - 0.8), { tone: 'faint' });
  const handle = box(rect(x + w - 2.8, y + d, 0.6, 0.6, 0.2), 4, 3, { tone: 'lo', bevel: 0 });
  return compose([box(SAFE_PLAN, 0, SAFE_HEIGHT, { tone: 'mid', trim: door + dial + topOutline(SAFE_PLAN, SAFE_HEIGHT, 1.2) }), handle]);
}

function stockTrolley(): Part {
  const [x, y] = TROLLEY_AT;
  const cartons = [0, 1, 2].map((index) => box(rect(x + 1 + index * 4.2, y + 1.4, 3.6, 5.2, 0.3), cartDeckTop, 2.2 + (index % 2), { bevel: 0.2 }));
  return cart(TROLLEY_AT, TROLLEY_SIZE, cartons);
}
