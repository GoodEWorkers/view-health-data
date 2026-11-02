import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Corner, Quad } from './homography.ts';
import { matrix3dOf } from './homography.ts';
import { LOGICAL, chordControls, curvePoint, labelPoint, plugAngleDegrees, plugSvg, scaleOfQuad, socketCentre, socketEnd, splineCurves, splinePath, splinePoint } from './jackWires.ts';

const TOLERANCE = 1e-6;
const SCREEN: Quad = [[100, 50], [100 + LOGICAL.width, 50], [100 + LOGICAL.width, 50 + LOGICAL.height], [100, 50 + LOGICAL.height]];
const close = (actual: Corner, expected: Corner): boolean => Math.abs(actual[0] - expected[0]) < TOLERANCE && Math.abs(actual[1] - expected[1]) < TOLERANCE;

describe('socketCentre', () => {
  it('spaces sockets evenly along a bezel and centres a single one', () => {
    assert.equal(socketCentre(0, 1, 'top')[0], LOGICAL.width / 2);
    const xs = [0, 1, 2].map((slot) => socketCentre(slot, 3, 'bottom')[0]);
    assert.ok(Math.abs(xs[1]! - xs[0]! - (xs[2]! - xs[1]!)) < TOLERANCE);
    assert.ok(Math.abs((xs[0]! + xs[2]!) / 2 - LOGICAL.width / 2) < TOLERANCE);
  });

  it('puts top sockets at the top bezel and bottom sockets at the bottom bezel', () => {
    assert.ok(socketCentre(0, 1, 'top')[1] < LOGICAL.height / 2);
    assert.ok(socketCentre(0, 1, 'bottom')[1] > LOGICAL.height / 2);
  });
});

describe('socketEnd', () => {
  it('lands on the socket of an unscaled screen and points off the bezel', () => {
    const [x, y] = socketCentre(1, 3, 'bottom');
    const end = socketEnd(SCREEN, 'bottom', 1, 3);
    assert.ok(close(end.point, [100 + x, 50 + y]));
    assert.deepEqual(end.outward, [0, 1]);
    assert.deepEqual(socketEnd(SCREEN, 'top', 0, 1).outward, [-0, -1]);
  });

  it('follows a screen that is scaled', () => {
    const half: Quad = [[0, 0], [LOGICAL.width / 2, 0], [LOGICAL.width / 2, LOGICAL.height / 2], [0, LOGICAL.height / 2]];
    assert.ok(Math.abs(scaleOfQuad(half) - 0.5) < TOLERANCE);
    const [x, y] = socketCentre(0, 2, 'top');
    assert.ok(close(socketEnd(half, 'top', 0, 2).point, [x / 2, y / 2]));
  });

  it('lands where the CSS matrix puts the socket ring', () => {
    const skewed: Quad = [[10, 20], [250, 30], [240, 160], [0, 150]];
    const [x, y] = socketCentre(0, 1, 'bottom');
    const [a, b, , , c, d, , , , , , , e, f] = matrix3dOf(LOGICAL.width, LOGICAL.height, skewed).slice('matrix3d('.length, -1).split(',').map(Number) as number[];
    assert.ok(close(socketEnd(skewed, 'bottom', 0, 1).point, [a! * x + c! * y + e!, b! * x + d! * y + f!]));
  });
});

describe('splineCurves', () => {
  const controls: Corner[] = [[0, 0], [0, 40], [60, 40], [60, 80]];

  it('starts on the first control and ends on the last', () => {
    const curves = splineCurves(controls);
    assert.deepEqual(curves[0]![0], controls[0]);
    assert.deepEqual(curves.at(-1)![3], controls.at(-1));
  });

  it('is continuous from one curve to the next', () => {
    const curves = splineCurves(controls);
    curves.slice(1).forEach((curve, index) => assert.ok(close(curve[0], curves[index]![3])));
  });

  it('leaves the first control along the first leg and stays inside the control polygon', () => {
    const curves = splineCurves(controls);
    assert.equal(curves[0]![1][0], 0);
    for (let time = 0; time <= 1; time += 0.05) {
      const [x, y] = splinePoint(curves, time);
      assert.ok(x >= -TOLERANCE && x <= 60 + TOLERANCE && y >= -TOLERANCE && y <= 80 + TOLERANCE);
    }
  });

  it('writes an M followed by one C per curve', () => {
    const curves = splineCurves(controls);
    assert.equal(splinePath(curves).match(/C/g)?.length, curves.length);
    assert.ok(splinePath(curves).startsWith('M0.0 0.0C'));
  });
});

describe('curvePoint', () => {
  it('runs from the first point to the last and bows toward the controls', () => {
    const curve = [[0, 0], [0, 10], [10, 10], [10, 0]] as const;
    assert.deepEqual([curvePoint(curve, 0), curvePoint(curve, 1)], [[0, 0], [10, 0]]);
    assert.deepEqual(curvePoint(curve, 0.5), [5, 7.5]);
  });
});

describe('chordControls', () => {
  const route: Corner[] = [[0, 50], [100, 50]];

  it('is a straight chord at share 0 and the route at share 1', () => {
    const chord = chordControls([0, 0], [100, 0], route, 0);
    assert.ok(chord.slice(1, -1).every(([, y]) => y === 0));
    assert.deepEqual(chordControls([0, 0], [100, 0], route, 1).slice(1, -1), route);
  });

  it('hangs the chord by the slack, most in the middle, and not at all once the route is reached', () => {
    const [near, middle, far] = chordControls([0, 0], [100, 0], [[25, 0], [50, 0], [75, 0]], 0, 10).slice(1, -1);
    assert.ok(middle![1] > near![1] && middle![1] > far![1]);
    assert.ok(Math.abs(middle![1] - 10) < 1e-9);
    assert.deepEqual(chordControls([0, 0], [100, 0], [[50, 30]], 1, 10)[1], [50, 30]);
  });

  it('hangs a wire that has no route from the middle of its chord', () => {
    assert.deepEqual(chordControls([0, 0], [100, 0], [], 0, 8), [[0, 0], [50, 8], [100, 0]]);
    assert.deepEqual(chordControls([0, 0], [100, 0], [], 1, 8), [[0, 0], [50, 0], [100, 0]]);
  });
});

describe('labelPoint', () => {
  const curves = splineCurves([[0, 0], [100, 0]]);

  it('sits at the middle of the wire when nothing covers it', () => {
    assert.deepEqual(labelPoint(curves, [20, 10], []), splinePoint(curves, 0.5));
  });

  it('slides along the wire out from under a screen', () => {
    const covered = { x: 40, y: -20, width: 20, height: 40 };
    const [x] = labelPoint(curves, [20, 10], [covered]);
    assert.ok(x < 40 - 10 || x > 60 + 10, `label at ${x}`);
  });
});

describe('plug', () => {
  it('points along its wire: no turn for a plug on a bottom bezel, half a turn on a top one', () => {
    assert.equal(Math.abs(plugAngleDegrees([0, 1])), 0);
    assert.equal(Math.abs(plugAngleDegrees([0, -1])), 180);
  });

  it('draws a tip, a ring, a body and a strain relief', () => {
    for (const part of ['plug-tip', 'plug-ring', 'plug-body', 'plug-relief']) assert.ok(plugSvg().includes(part), part);
  });
});
