import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detailRef, hoverRef, linkStart, pinRef } from './linkHover.ts';

describe('linkStart', () => {
  it('pins the refs of the main range and hovers nothing', () => {
    assert.deepEqual(linkStart(['B3']), { hover: null, pinned: ['B3'], initial: ['B3'] });
  });
});

describe('hoverRef', () => {
  it('sets and clears the hovered ref without touching the pin', () => {
    const state = hoverRef(linkStart(['B3']), 'R18');
    assert.equal(state.hover, 'R18');
    assert.deepEqual(state.pinned, ['B3']);
    assert.equal(hoverRef(state, null).hover, null);
  });
});

describe('pinRef', () => {
  it('replaces the pinned refs by the clicked one', () => {
    assert.deepEqual(pinRef(linkStart(['B4', 'B5']), 'R20').pinned, ['R20']);
  });

  it('goes back to the main range when the pinned ref is clicked again', () => {
    const pinned = pinRef(linkStart(['B3']), 'R20');
    assert.deepEqual(pinRef(pinned, 'R20').pinned, ['B3']);
  });
});

describe('detailRef', () => {
  it('describes the hovered ref first, then the first pinned one, else nothing', () => {
    assert.equal(detailRef(hoverRef(linkStart(['B3']), 'R9')), 'R9');
    assert.equal(detailRef(linkStart(['B3', 'B4'])), 'B3');
    assert.equal(detailRef(linkStart([])), null);
  });
});
