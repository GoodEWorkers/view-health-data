import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { listInFrench } from './listInFrench.ts';

describe('listInFrench', () => {
  it('returns a single item as it is', () => {
    assert.equal(listInFrench(['Doctolib (Doctolib)']), 'Doctolib (Doctolib)');
  });

  it('joins two items with ou', () => {
    assert.equal(listInFrench(['Pastel (Mipih)', 'i-GAP (CPage)']), 'Pastel (Mipih) ou i-GAP (CPage)');
  });

  it('separates leading items with commas and puts ou before the last of three', () => {
    assert.equal(
      listInFrench(['Easily (Hopsis)', 'DxCare (Dedalus)', 'Hopital Manager (Softway Medical)']),
      'Easily (Hopsis), DxCare (Dedalus) ou Hopital Manager (Softway Medical)',
    );
  });

  it('returns an empty string for no items', () => {
    assert.equal(listInFrench([]), '');
  });
});
