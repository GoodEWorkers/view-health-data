// The timeline of Réseau in seconds, on the clock of the window sequence (2 s forward, 600 ms back): zones tint the floor, the gear glows in a wave from the server room, the cables draw themselves and close their gates.

import { cascadeBySeconds, cascadeByStep, progressAt } from '../screens/sequence.ts';
import type { Cascade, Span } from '../screens/sequence.ts';

export const ZONE_SPAN: Span = { from: 0, to: 0.9 };
export const WAVE_SPAN: Span = { from: 0.3, to: 1.1 };
export const DRAW_SPAN: Span = { from: 0.7, to: 2 };
export const CABLE_DRAW_SECONDS = 0.6;
export const GATE_SHARE = 0.8;

export type NetworkTimeline = { readonly wave: Cascade; readonly draw: Cascade };

export const networkTimelineOf = (gearCount: number, cableCount: number): NetworkTimeline => ({
  wave: cascadeByStep(WAVE_SPAN, gearCount, (WAVE_SPAN.to - WAVE_SPAN.from) / (2 * Math.max(1, gearCount - 1))),
  draw: cascadeBySeconds(DRAW_SPAN, cableCount, CABLE_DRAW_SECONDS),
});

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

export const zoneShowAt = (time: number): number => clamp((time - ZONE_SPAN.from) / (ZONE_SPAN.to - ZONE_SPAN.from));

// A halo that rises and falls as the wave passes a piece of gear: 0 before and after, 1 at the middle.
export const pulseAt = (progress: number): number => Math.sin(Math.PI * clamp(progress));

export const gateShowAt = (drawProgress: number): number => clamp((drawProgress - GATE_SHARE) / (1 - GATE_SHARE));

export const waveProgressAt = ({ wave }: NetworkTimeline, rank: number, time: number): number => progressAt(wave, rank, time);

export const drawProgressAt = ({ draw }: NetworkTimeline, index: number, time: number): number => progressAt(draw, index, time);

// The dash array that shows only the first part of a stroke that has a dash pattern: the pattern is followed as far as the revealed length, then one gap longer than the stroke.
export function revealedDashArray(pattern: readonly number[], revealed: number, total: number): string {
  if (revealed <= 0) return `0 ${total}`;
  if (revealed >= total) return pattern.length === 0 ? `${total} ${total}` : pattern.join(' ');
  if (pattern.length === 0) return `${revealed} ${total}`;
  const parts: number[] = [];
  let drawn = 0;
  for (let index = 0; drawn < revealed; index++) {
    const take = Math.min(pattern[index % pattern.length]!, revealed - drawn);
    parts.push(take);
    drawn += take;
  }
  if (parts.length % 2 === 0) parts.push(0);
  return [...parts, total].join(' ');
}
