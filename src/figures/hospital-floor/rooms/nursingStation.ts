import { at, dots, line } from '../camera.ts';
import { bed, bedsideCabinet, shelfUnit } from '../equipment.ts';
import { counter, keyboard, monitor } from '../furniture.ts';
import { box, compose, faceAt, faceLine, faceRect, markup, onGround, post, rect, stacked, topOutline } from '../parts.ts';
import type { Part } from '../parts.ts';

const BED_X = -13.5;
const BED_ROWS: readonly number[] = [-29, -8.6];
const CABINET_ROWS: readonly number[] = [-18.6, -13.6];
const SHELF = { origin: [32, -28.6] as [number, number], length: 20, depth: 6, levels: [1, 9.5, 18] as const };
const BINDER = { count: 8, depth: 4.6, width: 1.9, pitch: 2.28, shortHeight: 6, taller: 1 };
const DESK = { plan: rect(10.5, -1, 31, 10, 0.8), height: 7.5 };
const WORKSTATION_COLUMNS: readonly number[] = [16.5, 26, 35.5];
const MATS = [rect(10.5, -6, 38, 28, 2), rect(-13.5, -29, 24, 31, 2)];
const SUPPLY = { plan: rect(16, -28.6, 16, 6, 0.6), height: 9 };
const FOLDER = { count: 3, width: 6.4, depth: 4.6, thickness: 0.7 };
const STOOL = { y: 14, base: 1.6, stem: 0.5, seat: 2.2, seatHeight: 4.2 };

export function nursingStationParts(): Part[] {
  return [...MATS.map(floorMat), ...bayUnits(), supplyCounter(), recordsShelf(), islandDesk(), ...WORKSTATION_COLUMNS.map(stool)];
}

function bayUnits(): Part[] {
  const [first, second] = BED_ROWS as [number, number];
  const [firstCabinet, secondCabinet] = CABINET_ROWS as [number, number];
  return [
    compose([bed([BED_X, first]), bedsideUnit(firstCabinet)]),
    compose([bedsideUnit(secondCabinet), bed([BED_X, second])]),
  ];
}

function bedsideUnit(y: number): Part {
  const plan = rect(BED_X, y, 4.2, 4.2, 0.4);
  const body = rect(plan.x + 0.5, plan.y + 0.5, 3.2, 3.2, 0.3);
  const drawerSeam = line(faceLine(body, 'left', 0, 3.2, 3), { tone: 'faint' });
  const pulls = dots([1.5, 4.5].map((z) => at(faceAt(body, 'left', 1.6, z))), { size: 0.45, tone: 'mid' });
  return compose([bedsideCabinet([plan.x, plan.y]), { svg: drawerSeam + pulls + topOutline(plan, 6, 0.8), depth: 0 }], [plan.x + 2, plan.y + 2, 3]);
}

function recordsShelf(): Part {
  const { origin, length, depth, levels } = SHELF;
  return shelfUnit(origin, length, depth, 'left', levels, (board, z, index) => {
    if (index === 0) return binders(board, z);
    if (index === 1) return boxFiles(board, z);
    return folders(board, z);
  });
}

function binders(board: { x: number; y: number }, z: number): Part[] {
  const { count, depth, width, pitch, shortHeight, taller } = BINDER;
  return Array.from({ length: count }, (_, index) => {
    const height = shortHeight + (index % 2) * taller;
    const plan = rect(board.x + 0.3 + index * pitch, board.y + 0.4, width, depth, 0.1);
    const spine = line(faceRect(plan, 'left', 0.3, width - 0.3, height - 4.2, height - 2.2), { tone: 'faint' });
    return box(plan, z, height, { bevel: 0.15, trim: spine });
  });
}

function boxFiles(board: { x: number; y: number }, z: number): Part[] {
  return [0, 1].map((index) => {
    const plan = rect(board.x + 1 + index * 7, board.y + 0.5, 5.5, 5, 0.2);
    const grip = line(faceRect(plan, 'left', 1.6, 3.9, 3.2, 4.2), { tone: 'faint' });
    return box(plan, z, 5.5, { bevel: 0.2, trim: grip });
  });
}

function supplyCounter(): Part {
  const { plan, height } = SUPPLY;
  const pump = [plan.x + 3.5, plan.y + 3];
  const sanitiser = compose([
    post([pump[0]!, pump[1]!], 1, height, 3, { tone: 'lo', steps: 10 }),
    box(rect(pump[0]! - 0.5, pump[1]! - 0.5, 2.6, 1, 0.3), height + 3, 0.7, { bevel: 0 }),
  ]);
  const tray = box(rect(plan.x + 8, plan.y + 1, 6, 4, 0.4), height, 0.8, { tone: 'lo', trim: topOutline(rect(plan.x + 8, plan.y + 1, 6, 4), height + 0.8, 0.8) });
  return stacked(counter(plan, height), [sanitiser, tray]);
}

function folders(board: { x: number; y: number }, z: number): Part[] {
  const { count, width, depth, thickness } = FOLDER;
  return Array.from({ length: count }, (_, index) =>
    box(rect(board.x + 1.5 + (index % 2) * 0.3, board.y + 0.5 + (index % 2) * 0.4, width, depth, 0.2), z + index * thickness, thickness, { bevel: 0.1 }),
  );
}

function floorMat(plan: ReturnType<typeof rect>): Part {
  const mat = box(plan, 0.1, 0.3, { tone: 'lo', bevel: 0, trim: topOutline(plan, 0.4, 1.4) });
  return onGround(mat);
}

function islandDesk(): Part {
  const { plan, height } = DESK;
  const stations = WORKSTATION_COLUMNS.flatMap((x) => [
    monitor([x, plan.y + 3], height, 'left'),
    keyboard([x - 4, plan.y + 5], height, 3.4, 8),
  ]);
  return stacked(counter(plan, height), [markup(topOutline(plan, height, 1.2), [plan.x, plan.y, height]), ...stations]);
}

function stool(x: number): Part {
  const { y, base, stem, seat, seatHeight } = STOOL;
  return compose([
    post([x, y], base, 0, 0.5, { tone: 'lo' }),
    post([x, y], stem, 0.5, seatHeight - 0.5, { steps: 8 }),
    post([x, y], seat, seatHeight, 1, { bevel: 0.3 }),
  ]);
}
