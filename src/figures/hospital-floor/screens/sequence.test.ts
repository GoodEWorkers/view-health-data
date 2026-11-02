import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DRAW_SPAN, FADE_SECONDS, GLOW_SPAN, OPEN_SPAN, REVERSE_SECONDS, TOTAL_SECONDS, advanceTime, cascadeBySeconds, cascadeByStep, progressAt, timelineOf } from './sequence.ts';

const ROOMS = 8;
const WIRES = 24;
const TOLERANCE = 1e-9;
const timeline = timelineOf(ROOMS, WIRES);

describe('the three phases', () => {
  it('start and end where the choreography says: glow 0 to 0.5 s, wires 0.4 to 1.3 s, windows 0.9 to 2.0 s', () => {
    assert.deepEqual([GLOW_SPAN, DRAW_SPAN, OPEN_SPAN], [{ from: 0, to: 0.5 }, { from: 0.4, to: 1.3 }, { from: 0.9, to: 2 }]);
  });

  it('overlap, so the wires start drawing before the glow is done and the windows before the wires are', () => {
    assert.ok(DRAW_SPAN.from < GLOW_SPAN.to && OPEN_SPAN.from < DRAW_SPAN.to);
  });

  it('take two seconds at most in all, and 600 ms to run back', () => {
    assert.equal(TOTAL_SECONDS, 2);
    assert.equal(REVERSE_SECONDS, 0.6);
  });

  it('begin with the first item at the start of the span and end with the last item exactly at its end', () => {
    for (const [name, cascade, span] of [['glow', timeline.glow, GLOW_SPAN], ['draw', timeline.draw, DRAW_SPAN], ['open', timeline.open, OPEN_SPAN]] as const) {
      const last = name === 'draw' ? WIRES - 1 : ROOMS - 1;
      assert.equal(progressAt(cascade, 0, span.from), 0, `${name} first item before it starts`);
      assert.ok(progressAt(cascade, 0, span.from + 0.01) > 0, `${name} first item moves right after the start`);
      assert.ok(Math.abs(progressAt(cascade, last, span.to) - 1) < TOLERANCE, `${name} last item is done at the end`);
      assert.ok(progressAt(cascade, last, span.to - 0.01) < 1, `${name} last item is not done before the end`);
      assert.equal(progressAt(cascade, last, span.from), 0, `${name} last item has not moved at the start`);
    }
  });
});

describe('the cascades', () => {
  it('space the glow 40 ms apart and the windows 70 ms apart, the windows taking what is left of their span', () => {
    assert.ok(Math.abs(timeline.glow.step - 0.04) < TOLERANCE);
    assert.ok(Math.abs(timeline.open.step - 0.07) < TOLERANCE);
    assert.ok(Math.abs(timeline.open.seconds - (OPEN_SPAN.to - OPEN_SPAN.from - 7 * 0.07)) < TOLERANCE);
  });

  it('draw each wire for half a second and spread the starts so the last one ends with the span', () => {
    assert.equal(timeline.draw.seconds, 0.5);
    assert.ok(Math.abs(timeline.draw.from + (WIRES - 1) * timeline.draw.step + timeline.draw.seconds - DRAW_SPAN.to) < TOLERANCE);
  });

  it('give a single item the whole span', () => {
    assert.equal(cascadeBySeconds(DRAW_SPAN, 1, 0.5).step, 0);
    assert.ok(Math.abs(cascadeByStep(OPEN_SPAN, 1, 0.07).seconds - (OPEN_SPAN.to - OPEN_SPAN.from)) < TOLERANCE);
  });

  it('hold an item at 0 before its start and at 1 after its end', () => {
    assert.deepEqual([progressAt(timeline.open, 3, 0), progressAt(timeline.open, 3, 5)], [0, 1]);
  });
});

describe('advanceTime', () => {
  const run = (from: number, forward: boolean, reduced: boolean, seconds: number): number => {
    let time = from;
    for (let frame = 0; frame < Math.round(seconds * 1000); frame++) time = advanceTime(time, forward, 0.001, reduced);
    return time;
  };

  it('plays the whole sequence forward in real time', () => {
    assert.ok(Math.abs(run(0, true, false, TOTAL_SECONDS) - TOTAL_SECONDS) < 1e-6);
    assert.ok(run(0, true, false, 1) < TOTAL_SECONDS);
  });

  it('plays it back in 600 ms', () => {
    assert.ok(Math.abs(run(TOTAL_SECONDS, false, false, REVERSE_SECONDS)) < 1e-6);
    assert.ok(run(TOTAL_SECONDS, false, false, REVERSE_SECONDS - 0.05) > 0);
  });

  it('plays it in a fade under reduced motion, both ways', () => {
    assert.ok(Math.abs(run(0, true, true, FADE_SECONDS) - TOTAL_SECONDS) < 1e-6);
    assert.ok(Math.abs(run(TOTAL_SECONDS, false, true, FADE_SECONDS)) < 1e-6);
  });

  it('never leaves the timeline', () => {
    assert.equal(advanceTime(TOTAL_SECONDS, true, 5, false), TOTAL_SECONDS);
    assert.equal(advanceTime(0, false, 5, false), 0);
  });

  it('reverses from wherever it is, without a jump', () => {
    const middle = advanceTime(0, true, 0.9, false);
    assert.equal(middle, 0.9);
    assert.ok(advanceTime(middle, false, 0.01, false) < middle);
  });
});
