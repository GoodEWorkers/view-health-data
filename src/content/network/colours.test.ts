import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { fillOver, leastDistance, lightnessOf, VISIONS } from './cvd.ts';
import { PROTOCOL_FAMILIES } from './protocols.ts';
import { ZONES } from './zones.ts';

const MIN_DISTANCE = 20;
const SOURCES = readFileSync(new URL('../../../doc/sources.md', import.meta.url), 'utf8');

const zoneFills = ZONES.map(({ colour, tint }) => fillOver(colour, tint));

describe('the protocol family colours', () => {
  it('stay at least ΔE 20 apart for a normal viewer and for deuteranopia, protanopia and tritanopia', () => {
    const { distance, pair, vision } = leastDistance(PROTOCOL_FAMILIES.map(({ colour }) => colour));
    assert.ok(distance >= MIN_DISTANCE, `${pair.join(' and ')} come within ΔE ${distance.toFixed(1)} for ${vision}`);
    assert.equal(VISIONS.length, 4);
  });

  it('come with a dash pattern of their own that does not depend on colour, the first family being solid', () => {
    assert.deepEqual(PROTOCOL_FAMILIES.map(({ dash }) => dash.join(' ')), ['', '6 3', '1.5 3', '6 3 1.5 3']);
    assert.equal(new Set(PROTOCOL_FAMILIES.map(({ dash }) => dash.join(' '))).size, PROTOCOL_FAMILIES.length);
  });
});

describe('the zone fills', () => {
  it('stay at least ΔE 20 apart for a normal viewer and for the three deficiencies', () => {
    const { distance, pair, vision } = leastDistance(zoneFills);
    assert.ok(distance >= MIN_DISTANCE, `${pair.join(' and ')} come within ΔE ${distance.toFixed(1)} for ${vision}`);
  });

  it('grow darker from the workstations to the servers, the biomedical devices and the DMZ, so lightness tells them apart without hue', () => {
    const lightness = zoneFills.map(lightnessOf);
    assert.ok(lightness.every((value, index) => index === 0 || value < lightness[index - 1]!), lightness.join(' '));
  });

  it('take a share of their colour that grows with the same order, between a faint tint and a near solid fill', () => {
    const tints = ZONES.map(({ tint }) => tint);
    assert.ok(tints.every((tint, index) => tint > 0 && tint < 1 && (index === 0 || tint > tints[index - 1]!)), tints.join(' '));
  });
});

describe('fillOver', () => {
  it('gives the paper for no share and the colour for a whole share', () => {
    assert.equal(fillOver('#005191', 0), '#fbfbfa');
    assert.equal(fillOver('#005191', 1), '#005191');
    assert.equal(fillOver('#000000', 0.5), '#7e7e7d');
  });
});

describe('the sources of the colour work', () => {
  it('cite the colour-vision model and the palette in doc/sources.md', () => {
    assert.match(SOURCES, /Machado, Oliveira and Fernandes/);
    assert.match(SOURCES, /Okabe/);
  });
});
