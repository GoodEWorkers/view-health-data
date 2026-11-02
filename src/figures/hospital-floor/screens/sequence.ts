// The timeline of the windows, in seconds: glow wave, wires drawing, windows opening (one clock, forward on entry and back on exit), then on Données each window loading and turning to its editor.

export type Span = { readonly from: number; readonly to: number };
export type Cascade = { readonly from: number; readonly step: number; readonly seconds: number };

export const GLOW_SPAN: Span = { from: 0, to: 0.5 };
export const DRAW_SPAN: Span = { from: 0.4, to: 1.3 };
export const OPEN_SPAN: Span = { from: 0.9, to: 2 };
export const GLOW_STEP_SECONDS = 0.04;
export const WIRE_DRAW_SECONDS = 0.5;
export const OPEN_STEP_SECONDS = 0.07;
export const REVERSE_SECONDS = 0.6;
export const FADE_SECONDS = 0.2;
export const LOAD_SECONDS = 0.5;
export const LOAD_STEP_SECONDS = 0.04;
export const TOTAL_SECONDS = Math.max(GLOW_SPAN.to, DRAW_SPAN.to, OPEN_SPAN.to);

export const cascadeByStep = ({ from, to }: Span, count: number, step: number): Cascade => ({ from, step, seconds: to - from - (count - 1) * step });

export const cascadeBySeconds = ({ from, to }: Span, count: number, seconds: number): Cascade => ({
  from,
  step: count > 1 ? (to - from - seconds) / (count - 1) : 0,
  seconds,
});

export const progressAt = ({ from, step, seconds }: Cascade, rank: number, time: number): number =>
  Math.min(1, Math.max(0, (time - from - rank * step) / seconds));

export type Timeline = { readonly glow: Cascade; readonly draw: Cascade; readonly open: Cascade };

export const timelineOf = (roomCount: number, wireCount: number): Timeline => ({
  glow: cascadeByStep(GLOW_SPAN, roomCount, GLOW_STEP_SECONDS),
  draw: cascadeBySeconds(DRAW_SPAN, wireCount, WIRE_DRAW_SECONDS),
  open: cascadeByStep(OPEN_SPAN, roomCount, OPEN_STEP_SECONDS),
});

export function advanceTime(time: number, forward: boolean, seconds: number, reduced: boolean): number {
  const speed = TOTAL_SECONDS / (reduced ? FADE_SECONDS : forward ? TOTAL_SECONDS : REVERSE_SECONDS);
  return forward ? Math.min(TOTAL_SECONDS, time + seconds * speed) : Math.max(0, time - seconds * speed);
}

export type ViewMode = 'skeleton' | 'loading' | 'editor';

export function viewAt(seconds: number, rank: number): { readonly mode: ViewMode; readonly progress: number } {
  const local = seconds - rank * LOAD_STEP_SECONDS;
  if (local < 0) return { mode: 'skeleton', progress: 0 };
  if (local < LOAD_SECONDS) return { mode: 'loading', progress: local / LOAD_SECONDS };
  return { mode: 'editor', progress: 1 };
}

export const loadingEndsAt = (windowCount: number): number => LOAD_SECONDS + (windowCount - 1) * LOAD_STEP_SECONDS;
