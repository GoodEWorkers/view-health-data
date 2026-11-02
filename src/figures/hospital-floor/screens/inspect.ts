// The inspector's motion, pure and in stage pixels: its panel grows from the quad of the window it opens from to the stage rectangle on one eased progress, while the window hands over to it and the other windows and the wires fade out on the linear level.

import type { Bounds } from './focus.ts';
import type { Quad } from './homography.ts';
import { mixQuads } from './motion.ts';

export const INSPECT_SECONDS = 0.45;
export const INSPECT_REDUCED_SECONDS = 0.2;
export const INSPECT_MARGIN = 16;
export const HANDOVER_SHARE = 0.35;
export const BACKDROP_SHARE = 0.5;

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const smoothstep = (value: number): number => clamp(value) * clamp(value) * (3 - 2 * clamp(value));

export const inspectBounds = (stageWidth: number, stageHeight: number): Bounds => ({
  x: INSPECT_MARGIN,
  y: INSPECT_MARGIN,
  width: Math.max(0, stageWidth - 2 * INSPECT_MARGIN),
  height: Math.max(0, stageHeight - 2 * INSPECT_MARGIN),
});

export const rectQuad = ({ x, y, width, height }: Bounds): Quad => [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];

export const inspectQuad = (windowQuad: Quad, progress: number, bounds: Bounds): Quad => mixQuads(windowQuad, rectQuad(bounds), progress);

export function stepInspect(level: number, target: 0 | 1, seconds: number, reduced: boolean): number {
  const step = seconds / (reduced ? INSPECT_REDUCED_SECONDS : INSPECT_SECONDS);
  return target === 1 ? Math.min(1, level + step) : Math.max(0, level - step);
}

export const panelOpacity = (level: number): number => smoothstep(level / HANDOVER_SHARE);

export const windowOpacity = (level: number): number => 1 - smoothstep(level / HANDOVER_SHARE);

export const backdropOpacity = (level: number): number => 1 - smoothstep(level / BACKDROP_SHARE);

export type InspectFades = { readonly panel: number; readonly opener: number; readonly backdrop: number };

export const inspectFades = (level: number, reduced: boolean): InspectFades =>
  reduced ? { panel: level, opener: 1 - level, backdrop: 1 - level } : { panel: panelOpacity(level), opener: windowOpacity(level), backdrop: backdropOpacity(level) };
