import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INSPECT_MARGIN, INSPECT_REDUCED_SECONDS, INSPECT_SECONDS, backdropOpacity, inspectBounds, inspectFades, inspectQuad, panelOpacity, rectQuad, stepInspect, windowOpacity } from './inspect.ts';
import type { Quad } from './homography.ts';

const WINDOW: Quad = [[400, 250], [600, 250], [600, 350], [400, 350]];
const BOUNDS = inspectBounds(1000, 600);

describe('inspectBounds', () => {
  it('covers the stage inside a margin that leaves the dimmed floor to click', () => {
    assert.deepEqual(BOUNDS, { x: INSPECT_MARGIN, y: INSPECT_MARGIN, width: 1000 - 2 * INSPECT_MARGIN, height: 600 - 2 * INSPECT_MARGIN });
  });

  it('never goes negative on a stage smaller than its margins', () => {
    assert.deepEqual(inspectBounds(10, 10), { x: INSPECT_MARGIN, y: INSPECT_MARGIN, width: 0, height: 0 });
  });
});

describe('inspectQuad', () => {
  it('starts on the window and ends on the stage rectangle', () => {
    assert.deepEqual(inspectQuad(WINDOW, 0, BOUNDS), WINDOW);
    assert.deepEqual(inspectQuad(WINDOW, 1, BOUNDS), rectQuad(BOUNDS));
  });

  it('is half way between at progress one half', () => {
    const [[leftX, topY]] = inspectQuad(WINDOW, 0.5, BOUNDS);
    assert.equal(leftX, (400 + INSPECT_MARGIN) / 2);
    assert.equal(topY, (250 + INSPECT_MARGIN) / 2);
  });
});

describe('stepInspect', () => {
  it('opens in 450 ms', () => {
    assert.equal(INSPECT_SECONDS, 0.45);
    assert.equal(stepInspect(0, 1, INSPECT_SECONDS, false), 1);
    assert.ok(stepInspect(0, 1, INSPECT_SECONDS / 2, false) < 1);
  });

  it('closes by the same clock, never below zero', () => {
    assert.equal(stepInspect(1, 0, INSPECT_SECONDS / 2, false), 0.5);
    assert.equal(stepInspect(0.1, 0, INSPECT_SECONDS, false), 0);
  });

  it('fades in 200 ms under reduced motion', () => {
    assert.equal(stepInspect(0, 1, INSPECT_REDUCED_SECONDS, true), 1);
  });
});

describe('the hand-over', () => {
  it('shows the window alone at level 0 and the panel alone once the level passes the hand-over', () => {
    assert.equal(windowOpacity(0), 1);
    assert.equal(panelOpacity(0), 0);
    assert.equal(windowOpacity(0.5), 0);
    assert.equal(panelOpacity(0.5), 1);
  });

  it('keeps the two summing to one half way through, so nothing flashes', () => {
    assert.ok(Math.abs(windowOpacity(0.1) + panelOpacity(0.1) - 1) < 1e-9);
  });

  it('fades the other windows and the wires out before the panel is full size', () => {
    assert.equal(backdropOpacity(0), 1);
    assert.equal(backdropOpacity(0.5), 0);
    assert.equal(backdropOpacity(1), 0);
  });
});

describe('inspectFades', () => {
  it('hands over by the smooth ramps with motion', () => {
    assert.deepEqual(inspectFades(0.5, false), { panel: 1, opener: 0, backdrop: 0 });
  });

  it('fades everything linearly under reduced motion, with no overlap of panel and opener', () => {
    const { panel, opener, backdrop } = inspectFades(0.25, true);
    assert.equal(panel + opener, 1);
    assert.equal(backdrop, opener);
  });
});
