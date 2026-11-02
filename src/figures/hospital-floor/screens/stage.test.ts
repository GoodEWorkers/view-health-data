import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fitViewBox, quadToStage, toStage } from './stage.ts';

const VIEW = { width: 800, height: 400 };

describe('fitViewBox', () => {
  it('letterboxes a wide drawing in a tall stage: full width, bands above and below', () => {
    assert.deepEqual(fitViewBox(1600, 1000, VIEW), { scale: 2, offsetX: 0, offsetY: 100 });
  });

  it('pillarboxes it in a wide stage: full height, bands left and right', () => {
    assert.deepEqual(fitViewBox(2000, 400, VIEW), { scale: 1, offsetX: 600, offsetY: 0 });
  });

  it('shifts the bands by the origin of the SVG box inside the stage', () => {
    assert.deepEqual(fitViewBox(800, 400, VIEW, 30, 12), { scale: 1, offsetX: 30, offsetY: 12 });
  });
});

describe('toStage', () => {
  it('sends the corners of the view box to the corners of the drawn area', () => {
    const fit = fitViewBox(1600, 1000, VIEW);
    assert.deepEqual([toStage(fit, [0, 0]), toStage(fit, [800, 400])], [[0, 100], [1600, 900]]);
  });

  it('maps every corner of a quad', () => {
    const fit = { scale: 2, offsetX: 10, offsetY: 5 };
    assert.deepEqual(quadToStage(fit, [[0, 0], [1, 0], [1, 1], [0, 1]]), [[10, 5], [12, 5], [12, 7], [10, 7]]);
  });
});
