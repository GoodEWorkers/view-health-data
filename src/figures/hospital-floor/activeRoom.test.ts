import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isActiveRoom, isRoomRequest } from './activeRoom.ts';

describe('isActiveRoom', () => {
  it('accepts a room index with its engaged flag', () => {
    assert.ok(isActiveRoom({ index: 3, engaged: false }));
  });

  it('refuses anything else a page script could dispatch', () => {
    for (const value of [null, 'gam', { index: '3', engaged: true }, { index: 1.5, engaged: true }, { index: 2 }, { engaged: true }]) {
      assert.equal(isActiveRoom(value), false, JSON.stringify(value));
    }
  });
});

describe('isRoomRequest', () => {
  it('accepts a pin with an index, a release and a sync', () => {
    assert.ok(isRoomRequest({ action: 'pin', index: 2 }));
    assert.ok(isRoomRequest({ action: 'release' }));
    assert.ok(isRoomRequest({ action: 'sync' }));
  });

  it('refuses a pin without an integer index and unknown actions', () => {
    for (const value of [{ action: 'pin' }, { action: 'pin', index: 'a' }, { action: 'hover', index: 1 }, undefined, 4]) {
      assert.equal(isRoomRequest(value), false, JSON.stringify(value));
    }
  });
});
