import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tooltipPlacement } from './tooltip.ts';

const CARD = { width: 200, height: 40 };
const VIEWPORT = { width: 1000, height: 600 };

describe('tooltipPlacement', () => {
  it('sits to the lower right of the pointer when there is room', () => {
    assert.deepEqual(tooltipPlacement({ x: 100, y: 100 }, CARD, VIEWPORT), { x: 116, y: 116 });
  });

  it('flips to the left of the pointer near the right edge', () => {
    assert.deepEqual(tooltipPlacement({ x: 950, y: 100 }, CARD, VIEWPORT), { x: 734, y: 116 });
  });

  it('flips above the pointer near the bottom edge', () => {
    assert.deepEqual(tooltipPlacement({ x: 100, y: 580 }, CARD, VIEWPORT), { x: 116, y: 524 });
  });

  it('never leaves the top and left edges of the viewport', () => {
    assert.deepEqual(tooltipPlacement({ x: 990, y: 2 }, { width: 2000, height: 40 }, VIEWPORT), { x: 8, y: 18 });
  });
});
