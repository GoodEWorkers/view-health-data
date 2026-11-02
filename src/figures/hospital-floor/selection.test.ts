import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { escape, focusIn, focusOut, hover, leave, select, setTourEnabled, startInteraction, stepSelection, tourTick, viewOf } from './selection.ts';
import type { Interaction } from './selection.ts';

const ROOM_COUNT = 8;
const DWELL = 2.8;
const TOURING: Interaction = setTourEnabled(startInteraction(), true);

describe('start', () => {
  it('has nothing highlighted and nothing selected until the tour is enabled', () => {
    assert.deepEqual(viewOf(startInteraction()), { highlighted: null, selected: null, tourRunning: false });
  });

  it('highlights the tour room once the tour is enabled and nobody is there', () => {
    assert.deepEqual(viewOf(TOURING), { highlighted: 0, selected: null, tourRunning: true });
  });
});

describe('hover', () => {
  it('highlights the hovered room and pauses the tour without selecting', () => {
    assert.deepEqual(viewOf(hover(TOURING, 4)), { highlighted: 4, selected: null, tourRunning: false });
  });

  it('never changes the selected room, whichever room is hovered', () => {
    const selected = select(TOURING, 2);
    for (const room of [0, 2, 5, null]) assert.equal(viewOf(hover(selected, room)).selected, 2, String(room));
  });

  it('highlights another room over the selected one while hovering it', () => {
    assert.equal(viewOf(hover(select(TOURING, 2), 5)).highlighted, 5);
  });

  it('pauses the tour on empty parts of the figure, with no room highlighted', () => {
    assert.deepEqual(viewOf(hover(TOURING, null)), { highlighted: null, selected: null, tourRunning: false });
  });
});

describe('leave', () => {
  it('returns to the tour when nothing is selected', () => {
    assert.deepEqual(viewOf(leave(hover(TOURING, 4))), { highlighted: 0, selected: null, tourRunning: true });
  });

  it('falls back to the selected room, and the tour stays stopped', () => {
    assert.deepEqual(viewOf(leave(hover(select(TOURING, 3), 6))), { highlighted: 3, selected: 3, tourRunning: false });
  });

  it('restarts the dwell of the tour room', () => {
    const away = leave(hover(tourTick(TOURING, 2, DWELL, ROOM_COUNT), 1));
    assert.equal(away.tour.elapsed, 0);
  });
});

describe('click', () => {
  it('selects the room and stops the tour, even with the pointer away', () => {
    assert.deepEqual(viewOf(leave(select(hover(TOURING, 4), 4))), { highlighted: 4, selected: 4, tourRunning: false });
  });

  it('moves the selection to another room', () => {
    assert.equal(viewOf(select(select(TOURING, 1), 6)).selected, 6);
  });
});

describe('key focus on a legend key', () => {
  it('highlights the focused room without selecting it', () => {
    assert.deepEqual(viewOf(focusIn(TOURING, 5)), { highlighted: 5, selected: null, tourRunning: false });
  });

  it('lets a hovered room win over the focused key', () => {
    assert.equal(viewOf(hover(focusIn(TOURING, 5), 2)).highlighted, 2);
  });

  it('pauses the tour for focus elsewhere in the figure and resumes it on blur', () => {
    assert.equal(viewOf(focusIn(TOURING, null)).tourRunning, false);
    assert.equal(viewOf(focusOut(focusIn(TOURING, null))).tourRunning, true);
  });

  it('keeps the selection when focus leaves', () => {
    assert.equal(viewOf(focusOut(focusIn(select(TOURING, 3), 6))).selected, 3);
  });
});

describe('arrow keys', () => {
  it('select the first room going forward and the last going backward when nothing is selected', () => {
    assert.equal(stepSelection(TOURING, 1, ROOM_COUNT).selected, 0);
    assert.equal(stepSelection(TOURING, -1, ROOM_COUNT).selected, 7);
  });

  it('move the selection by one and wrap around both ends', () => {
    assert.equal(stepSelection(select(TOURING, 3), 1, ROOM_COUNT).selected, 4);
    assert.equal(stepSelection(select(TOURING, 7), 1, ROOM_COUNT).selected, 0);
    assert.equal(stepSelection(select(TOURING, 0), -1, ROOM_COUNT).selected, 7);
  });

  it('stop the tour after the first selection', () => {
    assert.equal(viewOf(stepSelection(TOURING, 1, ROOM_COUNT)).tourRunning, false);
  });
});

describe('escape', () => {
  it('clears the selection and restarts the tour from a fresh dwell', () => {
    const cleared = escape(select(tourTick(TOURING, 2, DWELL, ROOM_COUNT), 5));
    assert.deepEqual(viewOf(cleared), { highlighted: 0, selected: null, tourRunning: true });
    assert.equal(cleared.tour.elapsed, 0);
  });

  it('leaves the tour stopped while the pointer is still on the figure', () => {
    assert.equal(viewOf(escape(hover(select(TOURING, 5), 5))).tourRunning, false);
  });

  it('changes nothing when nothing is selected', () => {
    assert.equal(escape(TOURING), TOURING);
  });
});

describe('tour tick', () => {
  it('moves to the next room after the dwell while the tour runs', () => {
    assert.equal(viewOf(tourTick(TOURING, DWELL + 0.1, DWELL, ROOM_COUNT)).highlighted, 1);
  });

  it('does nothing once a room is selected', () => {
    const selected = select(TOURING, 4);
    assert.equal(tourTick(selected, 10, DWELL, ROOM_COUNT), selected);
  });

  it('does nothing while the pointer is on the figure', () => {
    const hovering = hover(TOURING, null);
    assert.equal(tourTick(hovering, 10, DWELL, ROOM_COUNT), hovering);
  });

  it('does nothing while the tour is disabled, offscreen or under reduced motion', () => {
    const idle = startInteraction();
    assert.equal(tourTick(idle, 10, DWELL, ROOM_COUNT), idle);
  });
});
