import { lineOnTop } from '../../iso/iso-kit.ts';
import type { Plan, Plane, Tone } from '../../iso/iso-kit.ts';
import { PROJECTION, at, dots, line } from './camera.ts';
import { counter } from './furniture.ts';
import { box, compose, faceAt, faceDots, faceLength, faceLine, faceRect, post, rect, sorted, topOutline } from './parts.ts';
import type { Face, Part } from './parts.ts';

const PANEL = 0.8;
const BOARD_THICKNESS = 0.7;
const BED = { length: 22, width: 10, baseBottom: 1.5, baseHeight: 2.5, mattressHeight: 2, headHeight: 8, footHeight: 4.5 };
const RACK = { height: 22, slotCount: 7, slotPitch: 1.7, slotHeight: 0.9 };
const FRIDGE_HANDLE = { height: 5, bottom: 8 };
const FRIDGE_SPLIT = 0.62;

export type ShelfFill = (board: Plan, level: number, index: number) => Part[];

export function shelfUnit(origin: Plane, length: number, depth: number, face: Face, levels: readonly number[], fill: ShelfFill = () => [], tone: Tone = 'mid'): Part {
  const [x, y] = origin;
  const top = levels[levels.length - 1]! + 1;
  const alongY = face === 'front';
  const backPlan = alongY ? rect(x, y, PANEL, length, 0.2) : rect(x, y, length, PANEL, 0.2);
  const endPlans = alongY
    ? [rect(x + PANEL, y, depth - PANEL, PANEL, 0.2), rect(x + PANEL, y + length - PANEL, depth - PANEL, PANEL, 0.2)]
    : [rect(x, y + PANEL, PANEL, depth - PANEL, 0.2), rect(x + length - PANEL, y + PANEL, PANEL, depth - PANEL, 0.2)];
  const boardPlan = alongY
    ? rect(x + PANEL, y + PANEL, depth - PANEL, length - PANEL * 2, 0.2)
    : rect(x + PANEL, y + PANEL, length - PANEL * 2, depth - PANEL, 0.2);
  const shelves = levels.map((level, index) =>
    compose([box(boardPlan, level, BOARD_THICKNESS, { tone, bevel: 0.2 }), sorted(fill(boardPlan, level + BOARD_THICKNESS, index))]),
  );
  const ends = endPlans.map((end) => box(end, 0, top, { tone, bevel: 0.2 }));
  return compose([box(backPlan, 0, top, { tone, bevel: 0.2 }), ...shelves, sorted(ends)]);
}

export function bed(origin: Plane, tone: Tone = 'hi'): Part {
  const [x, y] = origin;
  const { length, width, baseBottom, baseHeight, mattressHeight, headHeight, footHeight } = BED;
  const wheels = [0, 1].flatMap((sx) => [0, 1].map((sy) => post([x + 2 + sx * (length - 4), y + 1.6 + sy * (width - 3.2)], 0.8, 0, baseBottom, { tone: 'lo', steps: 8 })));
  const base = box(rect(x, y, length, width, 0.6), baseBottom, baseHeight, { tone });
  const head = box(rect(x, y, 1.2, width, 0.4), baseBottom, headHeight, { tone });
  const mattressTop = baseBottom + baseHeight + mattressHeight;
  const mattress = box(rect(x + 1.2, y + 0.7, length - 2.2, width - 1.4, 1), baseBottom + baseHeight, mattressHeight, {
    tone: 'mid',
    trim: line(lineOnTop([x + 7, y + 0.7], [x + 7, y + width - 0.7], mattressTop, PROJECTION), { tone: 'faint' }),
  });
  const foot = box(rect(x + length - 1, y, 1, width, 0.4), baseBottom, footHeight, { tone });
  return compose([sorted(wheels), base, head, mattress, foot]);
}

export const bedsideCabinet = ([x, y]: Plane): Part => counter(rect(x, y, 4.2, 4.2, 0.4), 6);

export function rack(plan: Plan, face: Face): Part {
  const { height, slotCount, slotPitch, slotHeight } = RACK;
  const length = faceLength(plan, face);
  const door = line(faceRect(plan, face, 0.8, length - 0.8, 0.8, height - 0.8), { tone: 'lo' });
  const slots = Array.from({ length: slotCount }, (_, index) => {
    const bottom = height - 3.4 - (index + 1) * slotPitch;
    return faceRect(plan, face, 1.8, length - 1.8, bottom, bottom + slotHeight);
  });
  const vents = faceDots(plan, face, length / 2 - 1.5, 2.2, 4, 3, 1);
  const handle = dots([at(faceAt(plan, face, length - 1.6, height / 2))], { size: 0.5, tone: 'hi' });
  const trim = door + line(slots.join(''), { tone: 'faint' }) + vents + handle + topOutline(plan, height, 1.2);
  return box(plan, 0, height, { tone: 'hi', bevel: 0.4, trim });
}

export function fridge(plan: Plan, face: Face, height = 18, tone: Tone = 'mid'): Part {
  const length = faceLength(plan, face);
  const door = line(faceRect(plan, face, 0.7, length - 0.7, 0.7, height - 0.7), { tone: 'lo' });
  const split = line(faceLine(plan, face, 0.7, length - 0.7, height * FRIDGE_SPLIT), { tone: 'lo' });
  const handlePlan = face === 'front' ? rect(plan.x + plan.w, plan.y + length - 2.4, 0.7, 0.7, 0.2) : rect(plan.x + length - 2.4, plan.y + plan.d, 0.7, 0.7, 0.2);
  const handle = box(handlePlan, FRIDGE_HANDLE.bottom, FRIDGE_HANDLE.height, { bevel: 0 });
  return compose([box(plan, 0, height, { tone, bevel: 0.4, trim: door + split }), handle]);
}
