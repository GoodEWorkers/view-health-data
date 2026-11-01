// Pure helpers for the idle tour and the eased glow.

export type TourState = { readonly index: number; readonly elapsed: number };

export const wrapIndex = (index: number, count: number): number => ((index % count) + count) % count;

export const follow = (current: number, target: number, seconds: number, timeConstant: number): number =>
  target + (current - target) * Math.exp(-seconds / timeConstant);

export function advanceTour({ index, elapsed }: TourState, seconds: number, dwell: number, count: number): TourState {
  const total = elapsed + seconds;
  const steps = Math.floor(total / dwell);
  return { index: wrapIndex(index + steps, count), elapsed: total - steps * dwell };
}
