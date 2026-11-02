// Pure rules of the data packets: which cables an active room launches packets on, and how a packet's size follows its age.

import { DEPARTMENTS } from '../../content/departments.ts';

export const LAUNCH_SECONDS = 0.7;
export const HUB_RATE_DIVISOR = 3;
export const GROW_SECONDS = 0.15;
export const VANISH_SECONDS = 0.25;

const HUB_INDEX = DEPARTMENTS.findIndex(({ id }) => id === 'eai');
const EASE_POWER = 2;

export type Stream = {
  readonly source: number;
  readonly flow: number;
  readonly interval: number;
  readonly firstLaunch: number;
};

export function streamsFor(activeIndex: number): Stream[] {
  const showsAll = activeIndex === HUB_INDEX;
  const sources = showsAll ? DEPARTMENTS.map((_, index) => index) : [activeIndex];
  const interval = showsAll ? LAUNCH_SECONDS * HUB_RATE_DIVISOR : LAUNCH_SECONDS;
  const flows = sources.flatMap((source) => (DEPARTMENTS[source]?.flows ?? []).map((_, flow) => ({ source, flow })));
  return flows.map((flow, order) => ({ ...flow, interval, firstLaunch: (order * interval) / flows.length }));
}

const unit = (value: number): number => Math.min(1, Math.max(0, value));

const easedOut = (share: number): number => 1 - (1 - unit(share)) ** EASE_POWER;

export const scaleAt = (age: number, duration: number): number =>
  Math.min(easedOut(age / GROW_SECONDS), 1 - easedOut((age - duration) / VANISH_SECONDS));
