import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isRoomRequest, isRoomSelection } from './activeRoom.ts';

describe('isRoomSelection', () => {
  it('accepts a room index or no room at all', () => {
    assert.ok(isRoomSelection({ selected: 3 }));
    assert.ok(isRoomSelection({ selected: null }));
  });

  it('refuses anything else a page script could dispatch', () => {
    for (const value of [null, 'gam', { selected: '3' }, { selected: 1.5 }, { index: 2 }, {}, undefined]) {
      assert.equal(isRoomSelection(value), false, JSON.stringify(value));
    }
  });
});

describe('isRoomRequest', () => {
  it('accepts a select with an index, a deselect and a sync', () => {
    assert.ok(isRoomRequest({ action: 'select', index: 2 }));
    assert.ok(isRoomRequest({ action: 'deselect' }));
    assert.ok(isRoomRequest({ action: 'sync' }));
  });

  it('refuses a select without an integer index, the old pin and release, and unknown actions', () => {
    for (const value of [{ action: 'select' }, { action: 'select', index: 'a' }, { action: 'pin', index: 1 }, { action: 'release' }, { action: 'hover', index: 1 }, undefined, 4]) {
      assert.equal(isRoomRequest(value), false, JSON.stringify(value));
    }
  });
});
