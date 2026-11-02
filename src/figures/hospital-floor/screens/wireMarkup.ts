// The build-time markup of the wire layer: one group per wire with its glow, core (both pathLength 1, so the draw is a dash offset), wide hit stroke and two plugs, and one label pill per wire above the screens.

import { DEPARTMENTS } from '../../../content/departments.ts';
import { groupSvg } from '../../../iso/iso-kit.ts';
import { LABEL_HEIGHT, plugSvg } from './jackWires.ts';
import type { Wire } from './wires.ts';

const LABEL_FONT_SIZE = 10;
const LABEL_CHARACTER_WIDTH = 0.58 * LABEL_FONT_SIZE;
const LABEL_PADDING = { across: 5 };
const LABEL_RADIUS = 2;

const colourOf = (id: string): string => DEPARTMENTS.find((department) => department.id === id)!.colour;

const escapeText = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const labelWidthOf = (text: string): number => text.length * LABEL_CHARACTER_WIDTH + LABEL_PADDING.across * 2;

const routeAttribute = (route: Wire['route']): string => route.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export const wiresSvg = (wires: readonly Wire[]): string =>
  wires
    .map((wire) =>
      groupSvg(['<path class="wire-hit"/>', '<path class="wire-glow" pathLength="1"/>', '<path class="wire-core" pathLength="1"/>', plugSvg(), plugSvg()], {
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
        style: `--room: ${colourOf(wire.source)}`,
      }),
    )
    .join('');

export const wireLabelsSvg = (wires: readonly Wire[]): string =>
  wires
    .map(({ source, target, index, label }) => {
      const width = labelWidthOf(label);
      const pill = `<rect x="${(-width / 2).toFixed(1)}" y="${-LABEL_HEIGHT / 2}" width="${width.toFixed(1)}" height="${LABEL_HEIGHT}" rx="${LABEL_RADIUS}"/>`;
      const text = `<text font-size="${LABEL_FONT_SIZE}" text-anchor="middle" dominant-baseline="central">${escapeText(label)}</text>`;
      return groupSvg(pill + text, {
        'data-wire-label': '',
        'data-from': source,
        'data-to': target,
        'data-flow': index,
        'data-width': width.toFixed(1),
        style: `--room: ${colourOf(source)}`,
      });
    })
    .join('');
