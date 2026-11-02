import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { EQUIPMENT } from '../../content/network/equipment.ts';
import { PROTOCOL_FAMILIES } from '../../content/network/protocols.ts';
import { ZONES } from '../../content/network/zones.ts';
import { hospitalFloorCard } from './build.ts';
import { networkLegendHtml } from './networkLegend.ts';
import { networkParts } from './networkParts.ts';
import { zonePatchesSvg } from './zonePatches.ts';
import { equipmentColour, roomZoneColour, zoneColour } from './zoneColours.ts';

const card = hospitalFloorCard();
const idsIn = (markup: string): string[] => [...markup.matchAll(/data-equipment="([^"]+)"/g)].map(([, id]) => id!);

describe('the network gear in the card', () => {
  it('draws every piece of equipment of the content model exactly once, under the id it has there', () => {
    assert.deepEqual(idsIn(card).sort(), EQUIPMENT.map(({ id }) => id).sort());
  });

  it('puts a switch in every room and the rest of the gear in the server room only', () => {
    for (const { id } of DEPARTMENTS) {
      const parts = networkParts(id).map(({ svg }) => svg).join('');
      assert.ok(parts.length > 0);
    }
    assert.equal(networkParts('gam').length, 1);
    assert.ok(networkParts('eai').length > 5);
  });

  it('wraps each piece in a device group that carries the colour of its zone, but not the edge pieces', () => {
    for (const { id, zone } of EQUIPMENT) {
      const group = card.match(new RegExp(`<g data-device data-equipment="${id}"([^>]*)>`))![1]!;
      assert.equal(group.includes('--gear'), zone !== 'edge', id);
    }
  });

  it('stays out of the way of the line check: no seam or rule line of the gear that is not a closed outline or a short slot', () => {
    assert.ok(!networkParts('eai').some(({ svg }) => svg.includes('data-free')));
  });
});

describe('the zone colours of the floor', () => {
  it('tints the floor of the server room with the server zone and every other room with the workstation zone', () => {
    assert.equal(roomZoneColour('eai'), zoneColour('hospital-servers'));
    for (const { id } of DEPARTMENTS.filter(({ id: room }) => room !== 'eai')) assert.equal(roomZoneColour(id), zoneColour('user-workstations'));
    assert.ok(card.includes(`--zone: ${zoneColour('hospital-servers')}`));
  });

  it('gives each piece of gear the colour of its zone', () => {
    assert.equal(equipmentColour('firewall-eai'), zoneColour('dmz'));
    assert.equal(equipmentColour('switch-bloc'), zoneColour('biomedical-modalities'));
    assert.equal(equipmentColour('router-eai'), undefined);
    assert.equal(equipmentColour('inconnu'), undefined);
  });

  it('draws a patch for each biomedical device and the DMZ, each in its zone colour, and the fibre tray', () => {
    const patches = zonePatchesSvg();
    assert.equal(patches.match(/data-zone-patch="biomedical-modalities"/g)?.length, 3);
    assert.equal(patches.match(/data-zone-patch="dmz"/g)?.length, 1);
    assert.ok(patches.includes(`--zone: ${zoneColour('biomedical-modalities')}`) && patches.includes(`--zone: ${zoneColour('dmz')}`));
    assert.equal(patches.match(/class="iso-solid fibre-tray"/g)?.length, 1);
  });

  it('keeps the biomedical colour at least 30 degrees of hue away from every room colour, so a patch never reads as a room', () => {
    const hueOf = (hex: string): number => {
      const [red, green, blue] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255);
      const [max, min] = [Math.max(red!, green!, blue!), Math.min(red!, green!, blue!)];
      const hue = max === red ? (green! - blue!) / (max - min) : max === green ? 2 + (blue! - red!) / (max - min) : 4 + (red! - green!) / (max - min);
      return (hue * 60 + 360) % 360;
    };
    const MIN_HUE_GAP = 30;
    for (const { colour } of DEPARTMENTS) {
      // A grey has no hue to be mistaken for.
      if (Number.isNaN(hueOf(colour))) continue;
      const gap = Math.abs(hueOf(zoneColour('biomedical-modalities')) - hueOf(colour));
      assert.ok(Math.min(gap, 360 - gap) >= MIN_HUE_GAP, colour);
    }
  });
});

describe('networkLegendHtml', () => {
  const legend = networkLegendHtml();

  it('shows the four zones as swatches and the four families as lines with their ports', () => {
    assert.equal(legend.match(/class="key-patch"/g)?.length, ZONES.length);
    assert.equal(legend.match(/class="key-line"/g)?.length, PROTOCOL_FAMILIES.length);
    for (const { label, ports } of PROTOCOL_FAMILIES) assert.ok(legend.includes(`${label} · ${ports}`));
    for (const { label, colour } of ZONES) assert.ok(legend.includes(`style="--key: ${colour}"><svg class="key-patch"`) && legend.includes(`</svg>${label}</span>`));
  });

  it('gives each swatch the pattern its zone has on the floor: hatching for the biomedical devices, dots for the DMZ, none for the others', () => {
    const swatches = legend.match(/<svg class="key-patch".*?<\/svg>/g)!;
    assert.deepEqual(swatches.map((swatch) => /url\(#([a-z-]+)\)/.exec(swatch)?.[1]), [undefined, undefined, 'zone-hatch', 'zone-dots']);
  });

  it('gives each family line the dash pattern its cables have', () => {
    const lines = legend.match(/<svg class="key-line".*?<\/svg>/g)!;
    assert.deepEqual(lines.map((line) => /stroke-dasharray="([^"]*)"/.exec(line)?.[1]), [undefined, '6 3', '1.5 3', '6 3 1.5 3']);
  });
});

describe('zonePatchesSvg and zonePatternsSvg', () => {
  it('lays a hatch pattern on the biomedical patches and a dot pattern on the DMZ patch, both defined once in the figure in the zone colour', () => {
    const card = hospitalFloorCard();
    assert.equal(card.match(/<pattern id="zone-hatch"/g)?.length, 1);
    assert.equal(card.match(/<pattern id="zone-dots"/g)?.length, 1);
    assert.ok(card.includes(`stroke="${zoneColour('biomedical-modalities')}"`) && card.includes(`fill="${zoneColour('dmz')}"`));
    assert.equal(zonePatchesSvg().match(/fill="url\(#zone-hatch\)"/g)?.length, 3);
    assert.equal(zonePatchesSvg().match(/fill="url\(#zone-dots\)"/g)?.length, 1);
  });

  it('puts the patterns before everything else in the figure, so every shape can refer to them', () => {
    const card = hospitalFloorCard();
    assert.ok(card.indexOf('<pattern id="zone-hatch"') < card.indexOf('data-zone-patch'));
  });
});
