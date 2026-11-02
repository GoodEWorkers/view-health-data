import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { FOCUS_SCALE, FOCUS_SECONDS, focusQuad, stepFocus } from './focus.ts';
import type { Quad } from './homography.ts';

const BOUNDS = { x: 0, y: 0, width: 1000, height: 600 };
const WINDOW: Quad = [[400, 250], [600, 250], [600, 350], [400, 350]];
const TOLERANCE = 1e-9;

const widthOf = (quad: Quad): number => quad[1][0] - quad[0][0];
const centreOf = (quad: Quad): [number, number] => [(quad[0][0] + quad[2][0]) / 2, (quad[0][1] + quad[2][1]) / 2];

describe('focusQuad', () => {
  it('leaves the window as it is at progress 0', () => {
    assert.deepEqual(focusQuad(WINDOW, 0, BOUNDS), WINDOW);
  });

  it('grows the window 1.6 times about its centre at progress 1', () => {
    const grown = focusQuad(WINDOW, 1, BOUNDS);
    assert.ok(Math.abs(widthOf(grown) - 200 * FOCUS_SCALE) < TOLERANCE);
    assert.deepEqual(centreOf(grown), [500, 300]);
  });

  it('grows by the progress in between, centre unmoved', () => {
    const half = focusQuad(WINDOW, 0.5, BOUNDS);
    assert.ok(Math.abs(widthOf(half) - 200 * 1.3) < TOLERANCE);
    assert.deepEqual(centreOf(half), [500, 300]);
  });

  it('slides inside the stage when the grown window would stick out, flush with the edge at progress 1', () => {
    const nearEdge: Quad = [[850, 20], [990, 20], [990, 100], [850, 100]];
    const grown = focusQuad(nearEdge, 1, BOUNDS);
    assert.ok(Math.abs(grown[1][0] - 1000) < TOLERANCE, 'right edge on the bound');
    assert.ok(Math.abs(grown[0][1] - 0) < TOLERANCE, 'top edge on the bound');
    assert.ok(grown.every(([x, y]) => x >= -TOLERANCE && x <= 1000 + TOLERANCE && y >= -TOLERANCE && y <= 600 + TOLERANCE));
  });

  it('slides by the progress too, so the motion is one eased progress', () => {
    const nearEdge: Quad = [[850, 250], [990, 250], [990, 330], [850, 330]];
    const half = focusQuad(nearEdge, 0.5, BOUNDS);
    const full = focusQuad(nearEdge, 1, BOUNDS);
    const startCentre = centreOf(nearEdge)[0];
    assert.ok(Math.abs(centreOf(half)[0] - (startCentre + (centreOf(full)[0] - startCentre) / 2)) < TOLERANCE);
  });

  it('centres a window that grown is wider than the stage', () => {
    const wide: Quad = [[0, 100], [800, 100], [800, 300], [0, 300]];
    const grown = focusQuad(wide, 1, { x: 0, y: 0, width: 1000, height: 600 });
    assert.equal(centreOf(grown)[0], 500);
  });

  it('keeps the margin of the bounds', () => {
    const grown = focusQuad([[900, 10], [990, 10], [990, 60], [900, 60]], 1, { x: 8, y: 8, width: 984, height: 584 });
    assert.ok(grown.every(([x, y]) => x >= 8 - TOLERANCE && x <= 992 + TOLERANCE && y >= 8 - TOLERANCE));
  });
});

describe('stepFocus', () => {
  it('runs to the target in FOCUS_SECONDS and stops there', () => {
    assert.equal(stepFocus(0, 1, FOCUS_SECONDS, false), 1);
    assert.ok(Math.abs(stepFocus(0, 1, FOCUS_SECONDS / 2, false) - 0.5) < TOLERANCE);
    assert.equal(stepFocus(0.9, 1, 5, false), 1);
    assert.equal(stepFocus(0.1, 0, 5, false), 0);
  });

  it('reverses from wherever it is', () => {
    const middle = stepFocus(0, 1, FOCUS_SECONDS * 0.6, false);
    assert.ok(stepFocus(middle, 0, 0.05, false) < middle);
  });

  it('jumps under reduced motion', () => {
    assert.deepEqual([stepFocus(0.2, 1, 0.001, true), stepFocus(0.8, 0, 0.001, true)], [1, 0]);
  });
});
