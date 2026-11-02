// Focus on a window: it grows about its centre by FOCUS_SCALE and slides just enough to stay inside the stage, on the same eased progress the live loop steps. Pure, in stage pixels.

import type { Corner, Quad } from './homography.ts';

export const FOCUS_SCALE = 1.6;
export const FOCUS_SECONDS = 0.35;
export const STAGE_MARGIN = 8;

export type Bounds = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

const extent = (quad: Quad, axis: 0 | 1): [number, number] => {
  const values = quad.map((corner) => corner[axis]);
  return [Math.min(...values), Math.max(...values)];
};

function shiftInside(low: number, high: number, min: number, max: number): number {
  if (high - low >= max - min) return (min + max) / 2 - (low + high) / 2;
  if (low < min) return min - low;
  return high > max ? max - high : 0;
}

export function focusQuad(quad: Quad, progress: number, bounds: Bounds, factor = FOCUS_SCALE): Quad {
  const [[left, right], [top, bottom]] = [extent(quad, 0), extent(quad, 1)];
  const [centreX, centreY] = [(left + right) / 2, (top + bottom) / 2];
  const half = (factor * (right - left)) / 2;
  const tall = (factor * (bottom - top)) / 2;
  const shiftX = shiftInside(centreX - half, centreX + half, bounds.x, bounds.x + bounds.width) * progress;
  const shiftY = shiftInside(centreY - tall, centreY + tall, bounds.y, bounds.y + bounds.height) * progress;
  const scale = 1 + (factor - 1) * progress;
  const grow = ([x, y]: Corner): Corner => [centreX + (x - centreX) * scale + shiftX, centreY + (y - centreY) * scale + shiftY];
  return [grow(quad[0]), grow(quad[1]), grow(quad[2]), grow(quad[3])];
}

export function stepFocus(level: number, target: 0 | 1, seconds: number, jump: boolean): number {
  if (jump) return target;
  const step = seconds / FOCUS_SECONDS;
  return target === 1 ? Math.min(1, level + step) : Math.max(0, level - step);
}
