import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TOTAL_SECONDS } from '../screens/sequence.ts';
import { CABLE_DRAW_SECONDS, DRAW_SPAN, GATE_SHARE, WAVE_SPAN, ZONE_SPAN, drawProgressAt, gateShowAt, networkTimelineOf, pulseAt, revealedDashArray, waveProgressAt, zoneShowAt } from './networkSequence.ts';

const GEAR = 13;
const CABLES = 31;
const TOLERANCE = 1e-9;
const timeline = networkTimelineOf(GEAR, CABLES);

describe('the phases of the Réseau layer', () => {
  it('fit in the two seconds of the window sequence, the cables drawing last', () => {
    assert.ok([ZONE_SPAN, WAVE_SPAN, DRAW_SPAN].every(({ to }) => to <= TOTAL_SECONDS));
    assert.equal(DRAW_SPAN.to, TOTAL_SECONDS);
  });

  it('start the cables before the wave is over and the wave before the zones are done', () => {
    assert.ok(DRAW_SPAN.from < WAVE_SPAN.to && WAVE_SPAN.from < ZONE_SPAN.to);
  });
});

describe('zoneShowAt', () => {
  it('goes from 0 to 1 over the zone span and stays there', () => {
    assert.deepEqual([zoneShowAt(0), zoneShowAt(ZONE_SPAN.to), zoneShowAt(TOTAL_SECONDS)], [0, 1, 1]);
    assert.ok(Math.abs(zoneShowAt(ZONE_SPAN.to / 2) - 0.5) < TOLERANCE);
  });
});

describe('the wave of the gear', () => {
  it('reaches the nearest piece first and the farthest last, each at the end of the wave span at the latest', () => {
    assert.ok(waveProgressAt(timeline, 0, WAVE_SPAN.from + 0.05) > waveProgressAt(timeline, GEAR - 1, WAVE_SPAN.from + 0.05));
    assert.ok(Math.abs(waveProgressAt(timeline, GEAR - 1, WAVE_SPAN.to) - 1) < TOLERANCE);
  });

  it('lights a halo that rises and falls with the progress', () => {
    assert.deepEqual([pulseAt(0), pulseAt(1)].map((value) => Math.round(value * 1e6)), [0, 0]);
    assert.equal(pulseAt(0.5), 1);
    assert.equal(pulseAt(-3), 0);
  });
});

describe('the drawing of the cables', () => {
  it('takes the cables one after the other, the last one finishing at the end of the sequence', () => {
    assert.equal(drawProgressAt(timeline, 0, DRAW_SPAN.from), 0);
    assert.ok(drawProgressAt(timeline, 0, DRAW_SPAN.from + 0.1) > 0);
    assert.ok(Math.abs(drawProgressAt(timeline, CABLES - 1, DRAW_SPAN.to) - 1) < TOLERANCE);
    assert.equal(drawProgressAt(timeline, CABLES - 1, DRAW_SPAN.from), 0);
    assert.equal(timeline.draw.seconds, CABLE_DRAW_SECONDS);
  });

  it('closes the gate of a cable only once the cable is nearly drawn', () => {
    assert.deepEqual([gateShowAt(0), gateShowAt(GATE_SHARE), gateShowAt(1)], [0, 0, 1]);
    assert.ok(gateShowAt((1 + GATE_SHARE) / 2) > 0 && gateShowAt((1 + GATE_SHARE) / 2) < 1);
  });
});

describe('revealedDashArray', () => {
  it('shows a solid stroke up to the revealed length and hides the rest', () => {
    assert.equal(revealedDashArray([], 5, 20), '5 20');
  });

  it('shows nothing before the start and the pattern itself once the stroke is fully drawn', () => {
    assert.equal(revealedDashArray([6, 3], 0, 20), '0 20');
    assert.equal(revealedDashArray([6, 3], 20, 20), '6 3');
    assert.equal(revealedDashArray([], 20, 20), '20 20');
  });

  it('follows the pattern as far as the revealed length, cutting the dash or the gap it stops in', () => {
    assert.equal(revealedDashArray([6, 3], 4, 20), '4 20');
    assert.equal(revealedDashArray([6, 3], 7.5, 20), '6 1.5 0 20');
    assert.equal(revealedDashArray([6, 3], 10, 20), '6 3 1 20');
    assert.equal(revealedDashArray([6, 3, 1.5, 3], 11, 40), '6 3 1.5 0.5 0 40');
  });

  it('always makes an even number of entries, so the browser does not repeat the array', () => {
    for (let revealed = 0.5; revealed < 30; revealed += 0.7) assert.equal(revealedDashArray([6, 3, 1.5, 3], revealed, 60).split(' ').length % 2, 0, String(revealed));
  });
});
