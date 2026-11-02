// Reads back what the build wrote: each window with its start and end quads in viewBox units, each wire with its sockets, lane route and label, and the anchor computers of the floor.

import { DEPARTMENTS } from '../../../content/departments.ts';
import type { Corner, Quad } from './homography.ts';

export type ScreenView = {
  readonly element: HTMLElement;
  readonly shadow: HTMLElement;
  readonly start: Quad;
  readonly end: Quad;
  level: number;
  quad: Quad;
  progress: number;
  fade: number;
};

export type AnchorView = { readonly element: SVGElement; readonly room: number };

export type WireView = {
  readonly index: number;
  readonly group: SVGGElement;
  readonly paths: readonly SVGPathElement[];
  readonly strokes: readonly SVGPathElement[];
  readonly plugs: readonly SVGGElement[];
  readonly label: SVGGElement | null;
  readonly labelWidth: number;
  readonly source: number;
  readonly target: number;
  readonly sourceSlot: number;
  readonly sourceCount: number;
  readonly targetSlot: number;
  readonly targetCount: number;
  readonly route: readonly Corner[];
};

export const indexOfRoom = (id: string | undefined): number => DEPARTMENTS.findIndex((department) => department.id === id);

export const cornersOf = (text: string | undefined): Corner[] =>
  (text ?? '').split(' ').filter(Boolean).map((pair) => pair.split(',').map(Number) as unknown as Corner);

export function readScreens(layer: HTMLElement): ScreenView[] {
  return DEPARTMENTS.map(({ id }) => {
    const element = layer.querySelector<HTMLElement>(`[data-window="${id}"]`)!;
    const [start, end] = [cornersOf(element.dataset.start) as unknown as Quad, cornersOf(element.dataset.end) as unknown as Quad];
    return { element, shadow: layer.querySelector<HTMLElement>(`[data-shadow="${id}"]`)!, start, end, level: 0, quad: start, progress: 0, fade: 0 };
  });
}

export const readAnchors = (stage: HTMLElement): AnchorView[] =>
  [...stage.querySelectorAll<SVGElement>('[data-anchor]')].map((element) => ({ element, room: indexOfRoom(element.closest('[data-room]')?.getAttribute('data-room') ?? undefined) }));

export function readWires(layer: HTMLElement): WireView[] {
  return [...layer.querySelectorAll<SVGGElement>('[data-wire]')].map((group) => {
    const label = layer.querySelector<SVGGElement>(`[data-wire-label][data-flow="${group.dataset.flow}"]`);
    return {
      index: Number(group.dataset.flow),
      group,
      paths: [...group.querySelectorAll<SVGPathElement>('.wire-hit, .wire-glow, .wire-core')],
      strokes: [...group.querySelectorAll<SVGPathElement>('.wire-glow, .wire-core')],
      plugs: [...group.querySelectorAll<SVGGElement>('[data-plug]')],
      label,
      labelWidth: Number(label?.dataset.width ?? 0),
      source: indexOfRoom(group.dataset.from),
      target: indexOfRoom(group.dataset.to),
      sourceSlot: Number(group.dataset.sourceSlot),
      sourceCount: Number(group.dataset.sourceCount),
      targetSlot: Number(group.dataset.targetSlot),
      targetCount: Number(group.dataset.targetCount),
      route: cornersOf(group.dataset.route),
    };
  });
}
