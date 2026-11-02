import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { colourDistance, deltaE76, labOf, leastDistance, rgbOfHex, simulate, VISIONS } from './cvd.ts';

const TOLERANCE = 0.6;
const GREYS = ['#000000', '#808080', '#d4d4d4', '#ffffff'];
const CLOSE = 30;

describe('rgbOfHex', () => {
  it('reads three channels and refuses anything else', () => {
    assert.deepEqual(rgbOfHex('#0072B2'), [0, 114, 178]);
    assert.throws(() => rgbOfHex('0072B2'));
    assert.throws(() => rgbOfHex('#07B'));
  });
});

describe('labOf and deltaE76', () => {
  it('puts white at L 100 and black at L 0, and neither has any chroma', () => {
    const [whiteL, whiteA, whiteB] = labOf([255, 255, 255]);
    assert.ok(Math.abs(whiteL - 100) < TOLERANCE && Math.abs(whiteA) < TOLERANCE && Math.abs(whiteB) < TOLERANCE);
    assert.equal(labOf([0, 0, 0])[0], 0);
  });

  it('is 0 for a colour with itself, symmetrical, and about 100 between black and white', () => {
    assert.equal(deltaE76([12, 130, 200], [12, 130, 200]), 0);
    assert.equal(deltaE76([10, 20, 30], [200, 100, 50]), deltaE76([200, 100, 50], [10, 20, 30]));
    assert.ok(Math.abs(deltaE76([0, 0, 0], [255, 255, 255]) - 100) < TOLERANCE);
  });
});

describe('simulate', () => {
  it('leaves normal vision untouched', () => {
    assert.deepEqual(simulate('#0072B2', 'normal').map(Math.round), [0, 114, 178]);
  });

  it('keeps greys grey for the three deficiencies, because every row of the matrices sums to 1', () => {
    for (const vision of VISIONS) {
      for (const grey of GREYS) {
        const [red, green, blue] = simulate(grey, vision);
        const [wantedRed] = rgbOfHex(grey);
        assert.ok(Math.abs(red - wantedRed) < TOLERANCE && Math.abs(green - wantedRed) < TOLERANCE && Math.abs(blue - wantedRed) < TOLERANCE, `${grey} ${vision}`);
      }
    }
  });

  it('turns a pure red into a dark yellow-brown for a protanope and a deuteranope, where red and green channels meet', () => {
    for (const vision of ['protanopia', 'deuteranopia'] as const) {
      const [red, green, blue] = simulate('#ff0000', vision);
      assert.ok(Math.abs(red - green) < CLOSE * 2 && blue < CLOSE, vision);
    }
  });

  it('turns a pure blue into a teal for a tritanope, and leaves a pure red almost as it is', () => {
    const [, green] = simulate('#0000ff', 'tritanopia');
    assert.ok(green > 100);
    assert.ok(simulate('#ff0000', 'tritanopia')[0] > 250);
  });
});

describe('colourDistance and leastDistance', () => {
  it('sees a red and a green close together as a deuteranope, but far apart as a normal viewer', () => {
    assert.ok(colourDistance('#d55e00', '#009e73', 'normal') > colourDistance('#d55e00', '#009e73', 'deuteranopia'));
  });

  it('names the pair and the vision that come nearest', () => {
    const { distance, pair, vision } = leastDistance(['#000000', '#ffffff', '#010101']);
    assert.deepEqual([...pair].sort(), ['#000000', '#010101']);
    assert.ok(distance < 1);
    assert.ok(VISIONS.includes(vision));
  });
});
