// Cable pills and device labels at build time, as upright SVG text in plate units. A pill sits mid-leg, slid along its cable out of rooms and away from other labels; each label holds one text per sheet layer.

import { DEPARTMENTS } from '../../content/departments.ts';
import type { Department, DepartmentId } from '../../content/departments.ts';
import { stationRows, wireTexts } from '../../content/layerLabels.ts';
import type { StationRow } from '../../content/layerLabels.ts';
import { SHEET_LAYERS } from '../../content/layers.ts';
import type { SheetLayerId } from '../../content/layers.ts';
import { groupSvg } from '../../iso/iso-kit.ts';
import type { Flat, Plane } from '../../iso/iso-kit.ts';
import { CABLES, CABLE_HEIGHT, CORNER_RADIUS } from './cables.ts';
import type { Cable } from './cables.ts';
import { at } from './camera.ts';
import { DEVICE_SCREENS } from './devices.ts';
import { ROOMS } from './model.ts';

const FONT_SIZE = 7.5;
const CHARACTER_WIDTH = 0.56 * FONT_SIZE;
const PILL_PADDING = { across: 3, along: 2.2 };
const PILL_RADIUS = 1.5;
const PILL_GAP = 1.2;
const SLIDE_STEP = 3;
const ROOM_COST = 220;
const LEG_RANK_COST = 40;
const CLASH_COST = 400;
const ROW_COST = 60;
const ROWS: readonly number[] = [0, 1, -1];
const LINE_HEIGHT = 8.6;
const LABEL_LIFT = 4;
const SCREEN_TOP = 6.5;

export type Box = { readonly centre: Flat; readonly width: number; readonly height: number };
export type Option = { readonly centre: Flat; readonly cost: number };
export type Candidate = { readonly options: readonly Option[]; readonly width: number; readonly height: number };

function overlapOf(first: Box, second: Box): number {
  const across = (first.width + second.width) / 2 + PILL_GAP - Math.abs(first.centre[0] - second.centre[0]);
  const along = (first.height + second.height) / 2 + PILL_GAP - Math.abs(first.centre[1] - second.centre[1]);
  return across > 0 && along > 0 ? CLASH_COST + across * along : 0;
}

export function placeBoxes(candidates: readonly Candidate[], obstacles: readonly Box[] = []): Flat[] {
  const placed: Box[] = [...obstacles];
  const centres: Flat[] = [];
  for (const { options, width, height } of candidates) {
    const scored = options.map(({ centre, cost }) => ({
      centre,
      score: placed.reduce((total, other) => total + overlapOf({ centre, width, height }, other), cost),
    }));
    const best = scored.reduce((least, next) => (next.score < least.score ? next : least));
    placed.push({ centre: best.centre, width, height });
    centres.push(best.centre);
  }
  return centres;
}

const textWidth = (text: string): number => text.length * CHARACTER_WIDTH;

const escapeText = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Leg = { readonly from: Plane; readonly to: Plane; readonly length: number };

const legsLongestFirst = ({ corners }: Cable): Leg[] =>
  corners
    .slice(1)
    .map((to, index): Leg => ({ from: corners[index]!, to, length: Math.hypot(to[0] - corners[index]![0], to[1] - corners[index]![1]) }))
    .sort((first, second) => second.length - first.length);

function positionsAlong({ from, to, length }: Leg): Plane[] {
  const reach = Math.max(0, length / 2 - CORNER_RADIUS);
  const steps = Math.floor(reach / SLIDE_STEP);
  const unit: Plane = [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
  return Array.from({ length: steps * 2 + 1 }, (_, order) => {
    const distance = Math.ceil(order / 2) * SLIDE_STEP * (order % 2 === 1 ? 1 : -1);
    return [(from[0] + to[0]) / 2 + unit[0] * distance, (from[1] + to[1]) / 2 + unit[1] * distance];
  });
}

const inRoom = ([x, y]: Plane): boolean => ROOMS.some(({ plan }) => x > plan.x && x < plan.x + plan.w && y > plan.y && y < plan.y + plan.d);

const ROW_STEP = FONT_SIZE + PILL_PADDING.along * 2 + PILL_GAP;

function optionsAt(point: Plane, rank: number): Option[] {
  const [x, y] = at([point[0], point[1], CABLE_HEIGHT]);
  const cost = (inRoom(point) ? ROOM_COST : 0) + rank * LEG_RANK_COST;
  return ROWS.map((row) => ({ centre: [x, y + row * ROW_STEP], cost: cost + Math.abs(row) * ROW_COST }));
}

function textMarkup(layer: SheetLayerId, lines: readonly string[], [x, y]: Flat): string {
  const spans = lines.map((line, index) => `<tspan x="${x.toFixed(1)}" y="${(y + (index - (lines.length - 1)) * LINE_HEIGHT).toFixed(1)}">${escapeText(line)}</tspan>`);
  return `<text data-layer="${layer}" font-size="${FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${spans.join('')}</text>`;
}

function pillSvg({ source, target, colour }: Cable, texts: Readonly<Record<SheetLayerId, string>>, [x, y]: Flat): string {
  const variants = SHEET_LAYERS.map((layer) => {
    const width = textWidth(texts[layer]) + PILL_PADDING.across * 2;
    const height = FONT_SIZE + PILL_PADDING.along * 2;
    const box = `<rect data-layer="${layer}" x="${(x - width / 2).toFixed(1)}" y="${(y - height / 2).toFixed(1)}" width="${width.toFixed(1)}" height="${height.toFixed(1)}" rx="${PILL_RADIUS}"/>`;
    return box + textMarkup(layer, [texts[layer]], [x, y]);
  });
  return groupSvg(variants, { 'data-pill': '', 'data-from': source, 'data-to': target, style: `--room: ${colour}` });
}

function pillsSvg(): string {
  const texts = CABLES.map(({ flow }) => {
    const { logiciels, donnees, reseau } = wireTexts([flow]);
    return { logiciels: logiciels[0]!, donnees: donnees[0]!, reseau: reseau[0]! };
  });
  const candidates = CABLES.map((cable, index): Candidate => {
    const widest = Math.max(...SHEET_LAYERS.map((layer) => textWidth(texts[index]![layer])));
    const options = legsLongestFirst(cable).flatMap((leg, rank) => positionsAlong(leg).flatMap((point) => optionsAt(point, rank)));
    return { options, width: widest + PILL_PADDING.across * 2, height: FONT_SIZE + PILL_PADDING.along * 2 };
  });
  const centres = placeBoxes(candidates, deviceLabelBoxes());
  return CABLES.map((cable, index) => pillSvg(cable, texts[index]!, centres[index]!)).join('');
}

const DEVICE_LABEL_SHIFTS: Readonly<Record<DepartmentId, Flat>> = {
  gam: [0, 0],
  rdv: [0, 0],
  dpi: [0, 0],
  sgl: [0, 0],
  'pacs-ris': [0, 0],
  pharmacie: [0, 0],
  bloc: [0, 0],
  eai: [45, -4],
};

const detailsOf = (rows: readonly StationRow[]): string[] => rows.filter(({ kind }) => kind === 'detail').map(({ text }) => text);

type DeviceLabel = { readonly department: Department; readonly foot: Flat; readonly lines: Readonly<Record<SheetLayerId, readonly string[]>> };

const DEVICE_LABELS: readonly DeviceLabel[] = DEPARTMENTS.map((department) => {
  const { centre, z } = DEVICE_SCREENS[department.id];
  const [shiftX, shiftY] = DEVICE_LABEL_SHIFTS[department.id];
  const [x, y] = at([centre[0], centre[1], z + SCREEN_TOP + LABEL_LIFT]);
  const rows = stationRows(department);
  const lines = { logiciels: detailsOf(rows.logiciels), donnees: detailsOf(rows.donnees), reseau: detailsOf(rows.reseau) };
  return { department, foot: [x + shiftX, y + shiftY], lines };
});

function deviceLabelBoxes(): Box[] {
  return DEVICE_LABELS.flatMap(({ foot, lines }) =>
    SHEET_LAYERS.map((layer) => ({
      centre: [foot[0], foot[1] - ((lines[layer].length - 1) * LINE_HEIGHT) / 2] as Flat,
      width: Math.max(...lines[layer].map(textWidth)),
      height: lines[layer].length * LINE_HEIGHT,
    })),
  );
}

const deviceLabelsSvg = (): string =>
  DEVICE_LABELS.map(({ department, foot, lines }) =>
    groupSvg(
      SHEET_LAYERS.map((layer) => textMarkup(layer, lines[layer], foot)),
      { 'data-device-label': '', 'data-room-label': department.id, style: `--room: ${department.colour}` },
    ),
  ).join('');

export const labelsSvg = (): string => groupSvg(pillsSvg(), { 'data-cable-labels': '' }) + groupSvg(deviceLabelsSvg(), { 'data-device-labels': '' });
