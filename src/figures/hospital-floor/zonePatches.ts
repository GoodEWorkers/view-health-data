// Floor patches of the network layer: one round each biomedical device (hatched), the DMZ segment (dotted), and the fibre tray. The patterns keep zones apart without colour. Hidden until Réseau tints them.

import { groupSvg, slabOf } from '../../iso/iso-kit.ts';
import type { Plan } from '../../iso/iso-kit.ts';
import type { Zone } from '../../content/network/zones.ts';
import { PROJECTION, at, solid } from './camera.ts';
import { BIOMEDICAL_PATCHES, DMZ_PATCH, FIBRE_TRAY } from './networkGear.ts';
import { FLOOR_HEIGHT } from './structure.ts';
import { zoneColour, zoneTint } from './zoneColours.ts';

const PATCH_STEPS = 4;
const HATCH_PITCH = 2;
const DOT_PITCH = 2.2;
const DOT_RADIUS = 0.36;
const HATCH_WIDTH = 0.38;
const PATTERN_OPACITY = 0.7;
// Three segments across the tile, so the 45 degree lines meet across the tile edges.
const HATCH_LINES = [[-1, 1, 1, -1], [0, 2, 2, 0], [1, 3, 3, 1]].map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('');

export const ZONE_PATTERNS: Readonly<Partial<Record<Zone, string>>> = { 'biomedical-modalities': 'zone-hatch', dmz: 'zone-dots' };

// The patterns are drawn in world units and laid on the floor by the camera itself, so a hatch is 45 degrees on the floor, not on the screen.
const floorMatrix = (): string => {
  const [originX, originY] = at([0, 0, 0]);
  const [alongX] = at([1, 0, 0]);
  const [, alongY] = at([0, 1, 0]);
  return `matrix(${alongX - originX} 0 0 ${alongY - originY} 0 0)`;
};

const hatchPattern = (colour: string): string =>
  `<pattern id="${ZONE_PATTERNS['biomedical-modalities']}" patternUnits="userSpaceOnUse" width="${HATCH_PITCH}" height="${HATCH_PITCH}" patternTransform="${floorMatrix()}"><g stroke="${colour}" stroke-width="${HATCH_WIDTH}" stroke-opacity="${PATTERN_OPACITY}">${HATCH_LINES}</g></pattern>`;

const dotPattern = (colour: string): string =>
  `<pattern id="${ZONE_PATTERNS.dmz}" patternUnits="userSpaceOnUse" width="${DOT_PITCH}" height="${DOT_PITCH}" patternTransform="${floorMatrix()}"><circle cx="${DOT_PITCH / 2}" cy="${DOT_PITCH / 2}" r="${DOT_RADIUS}" fill="${colour}" fill-opacity="${PATTERN_OPACITY}"/></pattern>`;

export const zonePatternsSvg = (): string => `<defs>${hatchPattern(zoneColour('biomedical-modalities'))}${dotPattern(zoneColour('dmz'))}</defs>`;

const flat = (plan: Plan, className: string, overlay?: string): string => {
  const paths = slabOf(plan, 0, FLOOR_HEIGHT, PROJECTION, PATCH_STEPS);
  const pattern = overlay === undefined ? '' : `<path class="zone-pattern" d="${paths.fill}" fill="url(#${overlay})"/>`;
  return solid(paths, { tone: 'faint', flat: true, crease: 'none', className }) + pattern;
};

const patchSvg = (plan: Plan, zone: Zone): string =>
  groupSvg(flat(plan, 'zone-patch', ZONE_PATTERNS[zone]), { 'data-zone-patch': zone, style: `--zone: ${zoneColour(zone)}; --zone-tint: ${zoneTint(zone)}` });

export const zonePatchesSvg = (): string =>
  [...BIOMEDICAL_PATCHES.map((plan) => patchSvg(plan, 'biomedical-modalities')), patchSvg(DMZ_PATCH, 'dmz'), flat(FIBRE_TRAY, 'fibre-tray')].join('');
