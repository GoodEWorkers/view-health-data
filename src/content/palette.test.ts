import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';
import { colourDistance, contrastRatio, deltaE76, fillOver, lightnessOf, PAPER, rgbOfHex, VISIONS } from './network/cvd.ts';
import { MIN_NUMERAL_CONTRAST, MIN_TEXT_CONTRAST, NUMERAL_STATES, numeralOver, TEXT_TINT, textColourOf } from './roomText.ts';

const MIN_DISTANCE = 18;
const MAX_DRIFT = 5;
const OKABE_ITO: Readonly<Record<string, string>> = {
  gam: '#0072b2',
  rdv: '#e69f00',
  dpi: '#cc79a7',
  sgl: '#f0e442',
  'pacs-ris': '#56b4e9',
  pharmacie: '#009e73',
  bloc: '#d55e00',
  eai: '#4a4a4a',
};
const SOURCES = readFileSync(new URL('../../doc/sources.md', import.meta.url), 'utf8');
const FLOOR_CSS = readFileSync(new URL('../components/HospitalFloor.astro', import.meta.url), 'utf8');

const pairs = DEPARTMENTS.flatMap((first, index) => DEPARTMENTS.slice(index + 1).map((second) => [first, second] as const));

const declared = (property: string): number => {
  const [, amount, percent] = new RegExp(`--${property}: ([\\d.]+)(%?);`).exec(FLOOR_CSS)!;
  return Number(amount) / (percent === '%' ? 100 : 1);
};
const sum = (first: number, second: number): number => Number((first + second).toFixed(2));

describe('the eight room colours', () => {
  it('make 28 pairs', () => {
    assert.equal(pairs.length, 28);
  });

  for (const vision of VISIONS) {
    it(`stay at least ΔE ${MIN_DISTANCE} apart in every pair for ${vision}`, () => {
      for (const [first, second] of pairs) {
        const distance = colourDistance(first.colour, second.colour, vision);
        assert.ok(distance >= MIN_DISTANCE, `${first.id} and ${second.id} come within ΔE ${distance.toFixed(1)}`);
      }
    });
  }

  it(`stay within ΔE ${MAX_DRIFT} of the Okabe and Ito colour of their room, so the logical association holds`, () => {
    for (const { id, colour } of DEPARTMENTS) {
      const drift = deltaE76(rgbOfHex(colour), rgbOfHex(OKABE_ITO[id]!));
      assert.ok(drift <= MAX_DRIFT, `${id} drifts ΔE ${drift.toFixed(1)} from ${OKABE_ITO[id]}`);
    }
  });
});

describe('the room text colours', () => {
  const tints = DEPARTMENTS.map(({ colour }) => fillOver(colour, TEXT_TINT));

  it(`read at ${MIN_TEXT_CONTRAST}:1 on paper and on the tint of every room`, () => {
    for (const { id, textColour } of DEPARTMENTS) {
      assert.ok(contrastRatio(textColour, PAPER) >= MIN_TEXT_CONTRAST, `${id} on paper`);
      for (const tint of tints) assert.ok(contrastRatio(textColour, tint) >= MIN_TEXT_CONTRAST, `${id} on ${tint}`);
    }
  });

  it(`keep the floor numeral at ${MIN_NUMERAL_CONTRAST}:1 against its tinted floor, at rest and lit`, () => {
    for (const { id, colour, textColour } of DEPARTMENTS) {
      for (const { tint, opacity } of NUMERAL_STATES) {
        const floor = fillOver(colour, tint);
        const ratio = contrastRatio(numeralOver(textColour, floor, opacity), floor);
        assert.ok(ratio >= MIN_NUMERAL_CONTRAST, `${id} at ${tint}: ${ratio.toFixed(2)}`);
      }
    }
  });

  it('follow the tints and opacities the floor stylesheet declares', () => {
    const [rest, lit] = NUMERAL_STATES;
    assert.deepEqual(rest, { tint: declared('floor-tint-rest'), opacity: declared('numeral-opacity-rest') });
    assert.deepEqual(lit, { tint: sum(declared('floor-tint-rest'), declared('floor-tint-gain')), opacity: sum(declared('numeral-opacity-rest'), declared('numeral-opacity-gain')) });
  });

  it('are the room colour darkened, never lightened, and a colour that already reads is left as it is', () => {
    for (const { colour, textColour } of DEPARTMENTS) assert.ok(lightnessOf(textColour) <= lightnessOf(colour) + 0.5, colour);
    assert.equal(textColourOf('#000000'), '#000000');
    assert.notEqual(textColourOf('#f4e846'), '#f4e846');
  });
});

describe('the sources of the palette', () => {
  it('cite the Okabe and Ito set and the WCAG contrast ratios in doc/sources.md', () => {
    assert.match(SOURCES, /Okabe/);
    assert.match(SOURCES, /WCAG/);
  });
});
