import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { GROW_SECONDS, HUB_RATE_DIVISOR, LAUNCH_SECONDS, VANISH_SECONDS, scaleAt, streamsFor } from './packetMotion.ts';

const indexOf = (id: string) => DEPARTMENTS.findIndex((department) => department.id === id);
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);
const DURATION = 3;
const EPSILON = 1e-9;

describe('streamsFor', () => {
  it('gives an active room one stream per outgoing flow, in flow order', () => {
    const streams = streamsFor(indexOf('rdv'));
    assert.deepEqual(streams.map(({ source, flow }) => [source, flow]), [
      [indexOf('rdv'), 0],
      [indexOf('rdv'), 1],
    ]);
  });

  it('launches each flow every launch interval and staggers the first launches evenly', () => {
    const streams = streamsFor(indexOf('dpi'));
    assert.equal(streams.length, 7);
    streams.forEach(({ interval, firstLaunch }, order) => {
      assert.equal(interval, LAUNCH_SECONDS);
      assert.ok(Math.abs(firstLaunch - (order * LAUNCH_SECONDS) / 7) < EPSILON);
    });
  });

  it('runs every flow of every room at a third of the rate when the server room is active', () => {
    const streams = streamsFor(indexOf('eai'));
    assert.equal(streams.length, TOTAL_FLOWS);
    assert.ok(streams.every(({ interval }) => interval === LAUNCH_SECONDS * HUB_RATE_DIVISOR));
    assert.equal(new Set(streams.map(({ firstLaunch }) => firstLaunch)).size, TOTAL_FLOWS);
  });

  it('starts the first flow at once', () => {
    assert.equal(streamsFor(indexOf('gam'))[0]!.firstLaunch, 0);
  });
});

describe('scaleAt', () => {
  it('is invisible at launch and full size once grown', () => {
    assert.equal(scaleAt(0, DURATION), 0);
    assert.equal(scaleAt(GROW_SECONDS, DURATION), 1);
  });

  it('stays full size in flight', () => {
    assert.equal(scaleAt(DURATION / 2, DURATION), 1);
  });

  it('shrinks to nothing within the vanish time after arrival, quickly at first', () => {
    assert.equal(scaleAt(DURATION, DURATION), 1);
    assert.ok(scaleAt(DURATION + VANISH_SECONDS / 2, DURATION) < 0.5);
    assert.equal(scaleAt(DURATION + VANISH_SECONDS, DURATION), 0);
  });
});
