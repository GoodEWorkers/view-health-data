import { at, dots, line } from '../camera.ts';
import { anchorMonitor, chair, counter } from '../furniture.ts';
import type { Screen } from '../furniture.ts';
import { asDevice, box, compose, dotsOnTop, faceAt, faceLine, onGround, post, rect, sorted, stacked, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';

const COUNTER_PLAN = rect(84, -72, 42, 8, 0.6);
const COUNTER_HEIGHT = 9;
export const RDV_SCREEN: Screen = { centre: [COUNTER_PLAN.x + 16, COUNTER_PLAN.y + 4], z: COUNTER_HEIGHT, face: 'left' };
const WALL_FACE_Y = -92.5;
const BOARD = { x: 91, width: 38, bottom: 3.5, height: 9, frameThickness: 0.8, panelThickness: 0.4, columns: 6, rows: 4 };
const CARD_CELLS: readonly (readonly [number, number])[] = [[0, 3], [1, 1], [3, 2], [4, 0], [5, 2]];
const VISITOR_CHAIRS: readonly [number, number][] = [[96, -54], [108, -54]];
const STAFF_CHAIR: [number, number] = [105, -79];
const CABINET = { plan: rect(72, -91.5, 8, 8, 0.5), height: 12, drawers: 3 };
const RUGS = [rect(88, -61, 28, 19, 1.5), rect(121, -34, 21, 11, 1.5)];
const BIN_AT: [number, number] = [85, -87];
const RACK_AT: [number, number] = [124, -42];
const RACK_POCKETS: readonly number[] = [2.6, 5.2, 7.8];

export function appointmentsParts(): Part[] {
  return [
    ...RUGS.map(floorRug),
    plannerBoard(),
    serviceCounter(),
    ...VISITOR_CHAIRS.map((spot) => chair(spot, 'right')),
    chair(STAFF_CHAIR, 'left', 'lo'),
    filingCabinet(),
    wasteBin(),
    brochureRack(),
  ];
}

function floorRug(plan: ReturnType<typeof rect>): Part {
  const rug = box(plan, 0.1, 0.3, { tone: 'lo', bevel: 0, trim: topOutline(plan, 0.4, 1.4) });
  return onGround(rug);
}

function plannerBoard(): Part {
  const { x, width, bottom, height, frameThickness, panelThickness, columns, rows } = BOARD;
  const frame = rect(x, WALL_FACE_Y, width, frameThickness, 0.2);
  const panel = rect(x + 1, WALL_FACE_Y + frameThickness, width - 2, panelThickness, 0.1);
  const panelWidth = panel.w;
  const panelBottom = bottom + 1;
  const panelHeight = height - 2;
  const cellWidth = panelWidth / columns;
  const cellHeight = panelHeight / rows;
  const verticals = Array.from({ length: columns - 1 }, (_, index) =>
    faceLine(panel, 'left', (index + 1) * cellWidth, (index + 1) * cellWidth, panelBottom, panelBottom + panelHeight),
  );
  const horizontals = Array.from({ length: rows - 1 }, (_, index) =>
    faceLine(panel, 'left', 0, panelWidth, panelBottom + (index + 1) * cellHeight),
  );
  const screws = dots(
    [0.5, width - 0.5].flatMap((along) => [bottom + 0.5, bottom + height - 0.5].map((z) => at(faceAt(frame, 'left', along, z)))),
    { size: 0.45 },
  );
  const cards = CARD_CELLS.map(([column, row]) =>
    box(rect(panel.x + column * cellWidth + 0.5, panel.y + panel.d, cellWidth - 1, 0.3, 0.1), panelBottom + row * cellHeight + 0.35, cellHeight - 0.7, {
      tone: 'mid',
      bevel: 0,
    }),
  );
  return compose([
    box(frame, bottom, height, { bevel: 0.2, trim: screws }),
    box(panel, panelBottom, panelHeight, { bevel: 0, trim: line([...verticals, ...horizontals].join(''), { tone: 'faint' }) }),
    sorted(cards),
  ]);
}

function serviceCounter(): Part {
  return stacked(counter(COUNTER_PLAN, COUNTER_HEIGHT), [
    anchorMonitor(RDV_SCREEN),
    asDevice(telephone([COUNTER_PLAN.x + 29, COUNTER_PLAN.y + 1])),
  ]);
}

function telephone([x, y]: [number, number]): Part {
  const baseHeight = 1.2;
  const base = rect(x, y, 6, 6, 0.6);
  const top = COUNTER_HEIGHT + baseHeight;
  const cradles = [y + 0.7, y + 5.3 - 0.4].map((cradleY) => post([x + 4.5, cradleY + 0.2], 0.5, top, 0.9, { steps: 8 }));
  const handset = box(rect(x + 3.9, y + 0.4, 1.2, 5.2, 0.4), top + 0.9, 0.8, { bevel: 0.2 });
  const keypad = dotsOnTop(x + 0.7, y + 0.9, 3, 5, 0.9, top);
  return compose([box(base, COUNTER_HEIGHT, baseHeight, { bevel: 0.3, trim: keypad }), sorted(cradles), handset]);
}

function filingCabinet(): Part {
  const { plan, height, drawers } = CABINET;
  const drawerHeight = height / drawers;
  const seams = Array.from({ length: drawers - 1 }, (_, index) => faceLine(plan, 'left', 0, plan.w, (index + 1) * drawerHeight));
  const handles = Array.from({ length: drawers }, (_, index) => at(faceAt(plan, 'left', plan.w / 2, index * drawerHeight + drawerHeight / 2)));
  const trim = line(seams.join(''), { tone: 'faint' }) + dots(handles, { size: 0.5, tone: 'mid' }) + topOutline(plan, height, 0.9);
  return box(plan, 0, height, { bevel: 0.4, trim });
}

function wasteBin(): Part {
  return compose([
    post(BIN_AT, 1.7, 0, 3.6, { tone: 'lo', steps: 14 }),
    post(BIN_AT, 1.9, 3.6, 0.5, { tone: 'mid', steps: 14 }),
  ]);
}

function brochureRack(): Part {
  const [x, y] = RACK_AT;
  const base = box(rect(x - 1.5, y - 0.5, 8, 4.5, 0.4), 0, 0.6, { tone: 'lo' });
  const backPlan = rect(x, y, 6.4, 0.8, 0.2);
  const back = box(backPlan, 0.6, 9.4, { trim: line(faceLine(backPlan, 'left', 3.2, 3.2, 0.6, 10), { tone: 'faint' }) });
  const pockets = RACK_POCKETS.map((z) => box(rect(x, y + 0.8, 6.4, 1.6, 0.2), z, 1.1, { bevel: 0.2 }));
  return compose([base, back, sorted(pockets)]);
}
