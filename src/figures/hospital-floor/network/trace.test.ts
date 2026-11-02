import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DWELL_SECONDS, MIN_LEG_SECONDS, REST_SECONDS, TRACE_SECONDS, scheduleOf, walkAt } from './trace.ts';

const STOPS = [0, 0.2, 0.2, 0.6, 1];
const TOLERANCE = 1e-9;

describe('scheduleOf', () => {
  it('takes the whole trace to get from the first hop to the last one, dwell included', () => {
    const { arrivals } = scheduleOf(STOPS);
    assert.ok(Math.abs(arrivals.at(-1)! + DWELL_SECONDS - TRACE_SECONDS) < TOLERANCE);
  });

  it('gives a longer leg more time, and a leg of no length the minimum', () => {
    const { legSeconds } = scheduleOf(STOPS);
    assert.ok(Math.abs(legSeconds[1]! - MIN_LEG_SECONDS) < TOLERANCE);
    assert.ok(legSeconds[3]! > legSeconds[2]! && legSeconds[2]! > legSeconds[0]!);
  });
});

describe('walkAt', () => {
  it('starts on the first hop and dwells there', () => {
    assert.deepEqual(walkAt(STOPS, 0), { share: 0, hop: 0, visible: true });
    assert.equal(walkAt(STOPS, DWELL_SECONDS / 2).hop, 0);
  });

  it('runs along the cable between two hops, rising without going back', () => {
    const { arrivals, legSeconds } = scheduleOf(STOPS);
    const during = walkAt(STOPS, arrivals[0]! + DWELL_SECONDS + legSeconds[0]! / 2);
    assert.ok(during.share > 0 && during.share < 0.2);
    let before = -1;
    for (let at = 0; at < TRACE_SECONDS; at += 0.02) {
      const { share } = walkAt(STOPS, at);
      assert.ok(share >= before - TOLERANCE);
      before = share;
    }
  });

  it('names the hop it dwells at, so the panel can light it', () => {
    const { arrivals } = scheduleOf(STOPS);
    assert.deepEqual(arrivals.map((arrived) => walkAt(STOPS, arrived + DWELL_SECONDS / 2).hop), [0, 1, 2, 3, 4]);
  });

  it('switches hop at the moment it arrives, not before and not after', () => {
    const { arrivals } = scheduleOf(STOPS);
    const EDGE = 0.001;
    for (let hop = 1; hop < STOPS.length; hop++) {
      assert.equal(walkAt(STOPS, arrivals[hop]! - EDGE).hop, hop - 1, `just before hop ${hop}`);
      assert.equal(walkAt(STOPS, arrivals[hop]! + EDGE).hop, hop, `just after hop ${hop}`);
    }
  });

  it('leaves a station when the dwell is over: the packet is on its way, past the station', () => {
    const { arrivals, legSeconds } = scheduleOf(STOPS);
    for (const hop of [0, 3]) {
      const moving = walkAt(STOPS, arrivals[hop]! + DWELL_SECONDS + legSeconds[hop]! / 2);
      assert.ok(moving.share > STOPS[hop]! && moving.share < STOPS[hop + 1]!, `leg ${hop}`);
      assert.equal(moving.hop, hop);
    }
    assert.equal(walkAt(STOPS, arrivals[2]! + DWELL_SECONDS / 2).share, STOPS[2]);
    const JUST_AFTER_DWELL = 0.01;
    for (const hop of [0, 3]) assert.ok(walkAt(STOPS, arrivals[hop]! + DWELL_SECONDS + JUST_AFTER_DWELL).share > STOPS[hop]!, `dwell at hop ${hop} lasts too long`);
  });

  it('is hidden during the rest at the end, then starts again', () => {
    assert.equal(walkAt(STOPS, TRACE_SECONDS + REST_SECONDS / 2).visible, false);
    assert.deepEqual(walkAt(STOPS, TRACE_SECONDS + REST_SECONDS + 0.01), walkAt(STOPS, 0.01));
  });

  it('shows nothing for a cable with a single hop', () => {
    assert.equal(walkAt([0], 0.3).visible, false);
  });
});
