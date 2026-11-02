// The wire model at build time: one wire per flow in departments.ts order (the order of the floor cables), its sockets on the two bezels spaced by where the other end sits, and its lane route through the gutters between the screens at rest.

import { DEPARTMENTS } from '../../../content/departments.ts';
import type { DepartmentId, Flow } from '../../../content/departments.ts';
import { wireTexts } from '../../../content/layerLabels.ts';
import type { Corner } from './homography.ts';
import { PLUG_LENGTH, plugEnd, scaleOfQuad, socketEnd } from './jackWires.ts';
import type { Box, WireEnd } from './jackWires.ts';
import { LIFTED_RECTS, quadOfRect } from './lift.ts';
import { routeWires } from './router.ts';
import type { Frame, Request } from './router.ts';

export type Wire = {
  readonly index: number;
  readonly source: DepartmentId;
  readonly target: DepartmentId;
  readonly flow: Flow;
  readonly label: string;
  readonly sourceSlot: number;
  readonly sourceCount: number;
  readonly targetSlot: number;
  readonly targetCount: number;
  readonly route: readonly Corner[];
  readonly routed: boolean;
};

type Draft = Omit<Wire, 'sourceSlot' | 'sourceCount' | 'targetSlot' | 'targetCount' | 'route' | 'routed'>;
type Slot = { readonly slot: number; readonly count: number };

const PLUG_BOX_HALF_WIDTH = 1.5;
const FALLBACK_PULL = 12;
const SAG_FROM_LENGTH = 24;
const SAG_RATIO = 0.05;
const MAX_SAG = 2.5;

const centreX = (id: DepartmentId): number => LIFTED_RECTS[id].x + LIFTED_RECTS[id].width / 2;

export const wireDrafts = (): Draft[] =>
  DEPARTMENTS.flatMap(({ id, flows }) => flows.map((flow) => ({ source: id, target: flow.to, flow, label: wireTexts([flow]).logiciels[0]! }))).map((draft, index) => ({ ...draft, index }));

function slotsOf(drafts: readonly Draft[], host: 'source' | 'target'): Map<number, Slot> {
  const other = host === 'source' ? 'target' : 'source';
  const slots = new Map<number, Slot>();
  for (const room of DEPARTMENTS) {
    const hosted = drafts.filter((draft) => draft[host] === room.id).sort((first, second) => centreX(first[other]) - centreX(second[other]) || first.index - second.index);
    hosted.forEach(({ index }, slot) => slots.set(index, { slot, count: hosted.length }));
  }
  return slots;
}

function endsOf(draft: Draft, sources: ReadonlyMap<number, Slot>, targets: ReadonlyMap<number, Slot>): { out: WireEnd; into: WireEnd; reach: number } {
  const [from, to] = [quadOfRect(LIFTED_RECTS[draft.source]), quadOfRect(LIFTED_RECTS[draft.target])];
  const [bottom, top] = [sources.get(draft.index)!, targets.get(draft.index)!];
  return { out: socketEnd(from, 'bottom', bottom.slot, bottom.count), into: socketEnd(to, 'top', top.slot, top.count), reach: PLUG_LENGTH * scaleOfQuad(from) };
}

function plugBoxes(drafts: readonly Draft[], sources: ReadonlyMap<number, Slot>, targets: ReadonlyMap<number, Slot>): Box[] {
  return drafts.flatMap((draft) => {
    const { out, into, reach } = endsOf(draft, sources, targets);
    const boxOf = (end: WireEnd): Box => {
      const tip = plugEnd(end, reach);
      return { x: Math.min(end.point[0], tip[0]) - PLUG_BOX_HALF_WIDTH, y: Math.min(end.point[1], tip[1]), width: 2 * PLUG_BOX_HALF_WIDTH, height: Math.abs(tip[1] - end.point[1]) };
    };
    return [boxOf(out), boxOf(into)];
  });
}

export function withSag(route: readonly Corner[]): Corner[] {
  return route.flatMap((point, index) => {
    const next = route[index + 1];
    const length = next !== undefined && Math.abs(next[1] - point[1]) < 1e-6 ? Math.abs(next[0] - point[0]) : 0;
    if (next === undefined || length < SAG_FROM_LENGTH) return [point];
    return [point, [(point[0] + next[0]) / 2, point[1] + Math.min(MAX_SAG, length * SAG_RATIO)] as Corner];
  });
}

export function wiresIn(frame: Frame): Wire[] {
  const drafts = wireDrafts();
  const [sources, targets] = [slotsOf(drafts, 'source'), slotsOf(drafts, 'target')];
  const requests = drafts.map((draft): Request => {
    const { out, into, reach } = endsOf(draft, sources, targets);
    return { from: plugEnd(out, reach), leave: out.outward, to: plugEnd(into, reach), arrive: [-into.outward[0], -into.outward[1]] };
  });
  const routes = routeWires(requests, [...Object.values(LIFTED_RECTS), ...plugBoxes(drafts, sources, targets)], frame);
  return drafts.map((draft, index) => {
    const { from, leave, to, arrive } = requests[index]!;
    const fallback: Corner[] = [from, [from[0] + leave[0] * FALLBACK_PULL, from[1] + leave[1] * FALLBACK_PULL], [to[0] - arrive[0] * FALLBACK_PULL, to[1] - arrive[1] * FALLBACK_PULL], to];
    const route = withSag(routes[index] ?? fallback).slice(1, -1);
    const { slot: sourceSlot, count: sourceCount } = sources.get(draft.index)!;
    const { slot: targetSlot, count: targetCount } = targets.get(draft.index)!;
    return { ...draft, sourceSlot, sourceCount, targetSlot, targetCount, route, routed: routes[index] !== null };
  });
}
