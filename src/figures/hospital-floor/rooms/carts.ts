import type { Plane } from '../../../iso/iso-kit.ts';
import { box, compose, post, rect, sorted } from '../parts.ts';
import type { Part } from '../parts.ts';

const WHEEL = { radius: 0.9, height: 2.2, inset: 1.6 };
const DECK_THICKNESS = 0.8;

export const cartDeckTop = WHEEL.height + DECK_THICKNESS;

export function cart([x, y]: Plane, [length, width]: Plane, loads: Part[]): Part {
  const { radius, height, inset } = WHEEL;
  const wheels = [0, 1].flatMap((sx) =>
    [0, 1].map((sy) => post([x + inset + sx * (length - inset * 2), y + inset + sy * (width - inset * 2)], radius, 0, height, { tone: 'lo', steps: 8 })),
  );
  const deck = box(rect(x, y, length, width, 0.8), height, DECK_THICKNESS, { bevel: 0.3 });
  return compose([sorted(wheels), deck, sorted(loads)], [x + length / 2, y + width / 2, 0]);
}
