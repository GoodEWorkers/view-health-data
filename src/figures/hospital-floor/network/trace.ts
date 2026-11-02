// The walk of one packet along a cable, hop by hop: it dwells a moment at every station and runs between two stations for a time that grows with their distance, the whole pass taking TRACE_SECONDS, then a short rest before it starts again. Pure.

export const TRACE_SECONDS = 1.6;
export const REST_SECONDS = 0.35;
export const DWELL_SECONDS = 0.1;
export const MIN_LEG_SECONDS = 0.08;

export type Walk = { readonly share: number; readonly hop: number; readonly visible: boolean };

const smoothstep = (value: number): number => value * value * (3 - 2 * value);

export type Schedule = { readonly arrivals: readonly number[]; readonly legSeconds: readonly number[] };

export function scheduleOf(stops: readonly number[]): Schedule {
  const legs = stops.slice(1).map((stop, index) => stop - stops[index]!);
  const travel = TRACE_SECONDS - DWELL_SECONDS * stops.length - MIN_LEG_SECONDS * legs.length;
  const reach = legs.reduce((sum, leg) => sum + leg, 0);
  const legSeconds = legs.map((leg) => MIN_LEG_SECONDS + (reach > 0 ? (leg / reach) * Math.max(0, travel) : 0));
  const arrivals: number[] = [0];
  legSeconds.forEach((seconds, index) => arrivals.push(arrivals[index]! + DWELL_SECONDS + seconds));
  return { arrivals, legSeconds };
}

export function walkAt(stops: readonly number[], seconds: number): Walk {
  const last = stops.length - 1;
  if (last < 1) return { share: stops[0] ?? 0, hop: 0, visible: false };
  const { arrivals, legSeconds } = scheduleOf(stops);
  const cycle = arrivals[last]! + DWELL_SECONDS + REST_SECONDS;
  const time = ((seconds % cycle) + cycle) % cycle;
  for (let hop = last; hop >= 0; hop--) {
    const arrived = arrivals[hop]!;
    if (time < arrived) continue;
    if (time < arrived + DWELL_SECONDS || hop === last) return { share: stops[hop]!, hop, visible: hop < last || time < arrived + DWELL_SECONDS };
    const progress = (time - arrived - DWELL_SECONDS) / legSeconds[hop]!;
    return { share: stops[hop]! + (stops[hop + 1]! - stops[hop]!) * smoothstep(Math.min(1, progress)), hop, visible: true };
  }
  return { share: stops[0]!, hop: 0, visible: true };
}
