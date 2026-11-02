// The build-time markup of the wire layer: per wire a glow and core (pathLength 1, drawn by dash offset), a hit stroke, two plugs and the editor ranges its hover lights; per wire a label pill with a text for each layer.

import { DEPARTMENTS } from '../../../content/departments.ts';
import type { Department } from '../../../content/departments.ts';
import { rangesOfFlow } from '../../../content/messages/ranges.ts';
import { groupSvg } from '../../../iso/iso-kit.ts';
import { SHEET_LAYERS } from '../../../content/layers.ts';
import { LABEL_HEIGHT, plugSvg } from './jackWires.ts';
import type { Wire } from './wires.ts';

const LABEL_FONT_SIZE = 10;
const LABEL_CHARACTER_WIDTH = 0.58 * LABEL_FONT_SIZE;
const LABEL_PADDING = { across: 5 };
const LABEL_RADIUS = 2;

const departmentOf = (id: string): Department => DEPARTMENTS.find((department) => department.id === id)!;

const escapeText = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const labelWidthOf = (text: string): number => text.length * LABEL_CHARACTER_WIDTH + LABEL_PADDING.across * 2;

const routeAttribute = (route: Wire['route']): string => route.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export const wiresSvg = (wires: readonly Wire[]): string =>
  wires
    .map((wire) => {
      const { source, target } = rangesOfFlow(wire.source, wire.flow);
      return groupSvg(['<path class="wire-hit"/>', '<path class="wire-glow" pathLength="1"/>', '<path class="wire-core" pathLength="1"/>', plugSvg(), plugSvg()], {
        'data-wire': '',
        'data-room': wire.source,
        'data-from': wire.source,
        'data-to': wire.target,
        'data-flow': wire.index,
        'data-source-slot': wire.sourceSlot,
        'data-source-count': wire.sourceCount,
        'data-target-slot': wire.targetSlot,
        'data-target-count': wire.targetCount,
        'data-route': routeAttribute(wire.route),
        'data-source-range': source,
        'data-target-range': target,
        style: `--room: ${departmentOf(wire.source).colour}`,
      });
    })
    .join('');

export const wireLabelsSvg = (wires: readonly Wire[]): string =>
  wires
    .map(({ source, target, index, labels }) => {
      const { colour, textColour } = departmentOf(source);
      const widths = SHEET_LAYERS.map((layer) => labelWidthOf(labels[layer]));
      const variants = SHEET_LAYERS.map((layer, position) => {
        const width = widths[position]!;
        const pill = `<rect data-layer="${layer}" x="${(-width / 2).toFixed(1)}" y="${-LABEL_HEIGHT / 2}" width="${width.toFixed(1)}" height="${LABEL_HEIGHT}" rx="${LABEL_RADIUS}"/>`;
        const text = `<text data-layer="${layer}" font-size="${LABEL_FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${escapeText(labels[layer])}</text>`;
        return pill + text;
      });
      return groupSvg(variants, {
        'data-wire-label': '',
        'data-from': source,
        'data-to': target,
        'data-flow': index,
        'data-width': Math.max(...widths).toFixed(1),
        style: `--room: ${colour}; --room-text: ${textColour}`,
      });
    })
    .join('');
