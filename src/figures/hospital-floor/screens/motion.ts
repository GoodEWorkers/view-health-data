// The pure motion of the floating screens: the site's ease-out curve, the rank of each room by distance from the room the sequence spreads from, and the mix of two quads.

import type { Corner, Quad } from './homography.ts';

const EASE = { x1: 0.32, y1: 0.72, x2: 0, y2: 1 } as const;
const SOLVER_STEPS = 12;
const SOLVER_EPSILON = 1e-6;

const bezier = (first: number, second: number, t: number): number => 3 * first * t * (1 - t) ** 2 + 3 * second * t * t * (1 - t) + t ** 3;

export function easeOut(time: number): number {
  const wanted = Math.min(1, Math.max(0, time));
  let low = 0;
  let high = 1;
  let guess = wanted;
  for (let step = 0; step < SOLVER_STEPS && Math.abs(bezier(EASE.x1, EASE.x2, guess) - wanted) > SOLVER_EPSILON; step++) {
    if (bezier(EASE.x1, EASE.x2, guess) < wanted) low = guess;
    else high = guess;
    guess = (low + high) / 2;
  }
  return bezier(EASE.y1, EASE.y2, guess);
}

export function ranksFrom(centres: readonly Corner[], origin: number): number[] {
  const [originX, originY] = centres[origin] ?? centres[0]!;
  const nearestFirst = centres
    .map(([x, y], index) => ({ index, distance: Math.hypot(x - originX, y - originY) }))
    .sort((first, second) => first.distance - second.distance);
  const ranks: number[] = [];
  nearestFirst.forEach(({ index }, rank) => (ranks[index] = rank));
  return ranks;
}

export function mixQuads(from: Quad, to: Quad, progress: number): Quad {
  const mix = ([fromX, fromY]: Corner, [toX, toY]: Corner): Corner => [fromX + (toX - fromX) * progress, fromY + (toY - fromY) * progress];
  return [mix(from[0], to[0]), mix(from[1], to[1]), mix(from[2], to[2]), mix(from[3], to[3])];
}
