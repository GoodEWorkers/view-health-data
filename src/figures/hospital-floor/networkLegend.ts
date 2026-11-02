// The legend rows of Réseau: the four zones with the tint and pattern they have on the floor, the four protocol families with the dash pattern of their cables, each with its port. They replace the room keys.

import { fillOver } from '../../content/network/cvd.ts';
import { PROTOCOL_FAMILIES } from '../../content/network/protocols.ts';
import { ZONES } from '../../content/network/zones.ts';
import { ZONE_PATTERNS } from './zonePatches.ts';

const SWATCH = { width: 14, height: 10, radius: 2 };
const LINE = { width: 26, height: 6, stroke: 2.4, margin: 1.2 };

const key = (swatch: string, colour: string, label: string): string => `<span class="iso-key" style="--key: ${colour}">${swatch}${label}</span>`;

const zoneSwatch = ({ id, colour, tint }: (typeof ZONES)[number]): string => {
  const pattern = ZONE_PATTERNS[id];
  const rect = (fill: string, stroke = ''): string =>
    `<rect x="0.5" y="0.5" width="${SWATCH.width - 1}" height="${SWATCH.height - 1}" rx="${SWATCH.radius}" fill="${fill}"${stroke}/>`;
  return `<svg class="key-patch" viewBox="0 0 ${SWATCH.width} ${SWATCH.height}" width="${SWATCH.width}" height="${SWATCH.height}" aria-hidden="true">${rect(fillOver(colour, tint), ` stroke="${colour}" stroke-opacity="0.6"`)}${pattern === undefined ? '' : rect(`url(#${pattern})`)}</svg>`;
};

const familySwatch = ({ colour, dash }: (typeof PROTOCOL_FAMILIES)[number]): string =>
  `<svg class="key-line" viewBox="0 0 ${LINE.width} ${LINE.height}" width="${LINE.width}" height="${LINE.height}" aria-hidden="true"><line x1="${LINE.margin}" y1="${LINE.height / 2}" x2="${LINE.width - LINE.margin}" y2="${LINE.height / 2}" stroke="${colour}" stroke-width="${LINE.stroke}" stroke-linecap="round"${dash.length === 0 ? '' : ` stroke-dasharray="${dash.join(' ')}"`}/></svg>`;

export const networkLegendHtml = (): string =>
  '<span class="legend-network">' +
  `<span class="iso-keys" data-keys="zones">${ZONES.map((zone) => key(zoneSwatch(zone), zone.colour, zone.label)).join('')}</span>` +
  `<span class="iso-keys" data-keys="families">${PROTOCOL_FAMILIES.map((family) => key(familySwatch(family), family.colour, `${family.label} · ${family.ports}`)).join('')}</span>` +
  '</span>';
