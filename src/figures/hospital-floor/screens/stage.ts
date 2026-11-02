// The letterbox of the floor drawing in its stage: the SVG keeps its aspect (xMidYMid meet), so a viewBox point lands at the offset plus the scale times the point, in CSS pixels of the stage.

import type { Corner, Quad } from './homography.ts';

export type ViewBox = { readonly width: number; readonly height: number };
export type Fit = { readonly scale: number; readonly offsetX: number; readonly offsetY: number };

export function fitViewBox(boxWidth: number, boxHeight: number, view: ViewBox, originX = 0, originY = 0): Fit {
  const scale = Math.min(boxWidth / view.width, boxHeight / view.height);
  return { scale, offsetX: originX + (boxWidth - view.width * scale) / 2, offsetY: originY + (boxHeight - view.height * scale) / 2 };
}

export const toStage = ({ scale, offsetX, offsetY }: Fit, [x, y]: Corner): Corner => [offsetX + x * scale, offsetY + y * scale];

export const quadToStage = (fit: Fit, [first, second, third, fourth]: Quad): Quad => [toStage(fit, first), toStage(fit, second), toStage(fit, third), toStage(fit, fourth)];
