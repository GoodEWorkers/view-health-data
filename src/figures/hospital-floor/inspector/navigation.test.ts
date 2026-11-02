import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isInspectorRequest, isInspectorState } from './inspectorChannel.ts';
import { neighbourIndex, stepOfKey } from './navigation.ts';

const FILE_COUNT = 8;

describe('neighbourIndex', () => {
  it('goes to the next and the previous file', () => {
    assert.equal(neighbourIndex(2, 1, FILE_COUNT), 3);
    assert.equal(neighbourIndex(2, -1, FILE_COUNT), 1);
  });

  it('wraps from the last file to the first and back', () => {
    assert.equal(neighbourIndex(FILE_COUNT - 1, 1, FILE_COUNT), 0);
    assert.equal(neighbourIndex(0, -1, FILE_COUNT), FILE_COUNT - 1);
  });
});

describe('stepOfKey', () => {
  it('maps Left and Right to previous and next and ignores every other key', () => {
    assert.equal(stepOfKey('ArrowLeft'), -1);
    assert.equal(stepOfKey('ArrowRight'), 1);
    for (const key of ['ArrowUp', 'ArrowDown', 'Enter', 'a', 'Escape']) assert.equal(stepOfKey(key), undefined, key);
  });
});

describe('isInspectorRequest', () => {
  it('accepts an open with an integer index and a close', () => {
    assert.ok(isInspectorRequest({ action: 'open', index: 3 }));
    assert.ok(isInspectorRequest({ action: 'close' }));
  });

  it('refuses anything else a page script could dispatch', () => {
    for (const value of [null, 'close', { action: 'open' }, { action: 'open', index: '2' }, { action: 'toggle' }, { action: 'open', index: 1.5 }]) {
      assert.equal(isInspectorRequest(value), false, JSON.stringify(value));
    }
  });
});

describe('isInspectorState', () => {
  it('accepts an open file index and null for closed', () => {
    assert.ok(isInspectorState({ index: 0 }));
    assert.ok(isInspectorState({ index: null }));
  });

  it('refuses a missing or non-integer index', () => {
    for (const value of [{}, { index: 'a' }, { index: 1.5 }, 4]) assert.equal(isInspectorState(value), false, JSON.stringify(value));
  });
});
