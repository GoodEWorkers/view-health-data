import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sheetTransform } from './sheet.ts';

describe('sheetTransform', () => {
  it('lowers the sheet by its full rise when it has not started', () => {
    assert.equal(sheetTransform(0), 'translate3d(0, 40.0px, 0)');
  });

  it('lowers it by half the rise halfway', () => {
    assert.equal(sheetTransform(0.5), 'translate3d(0, 20.0px, 0)');
  });

  it('leaves no transform once it has arrived, so its text stays crisp', () => {
    assert.equal(sheetTransform(1), 'none');
  });
});
