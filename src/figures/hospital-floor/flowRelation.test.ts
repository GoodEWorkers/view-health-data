import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isHiddenByFocus, isRelated } from './flowRelation.ts';

const GAM_TO_DPI = { from: 'gam', to: 'dpi' };
const DPI_TO_EAI = { from: 'dpi', to: 'eai' };
const SGL_TO_OUTSIDE = { from: 'sgl', to: 'outside' };

describe('isRelated', () => {
  it('relates a flow to its source and to its destination', () => {
    assert.deepEqual([isRelated(GAM_TO_DPI, 'gam'), isRelated(GAM_TO_DPI, 'dpi')], [true, true]);
  });

  it('leaves a flow unrelated to any other room', () => {
    assert.equal(isRelated(GAM_TO_DPI, 'rdv'), false);
  });

  it('counts the EAI as the destination of an EAI-bound flow', () => {
    assert.equal(isRelated(DPI_TO_EAI, 'eai'), true);
  });

  it('relates an external flow to its source room only', () => {
    assert.deepEqual([isRelated(SGL_TO_OUTSIDE, 'sgl'), isRelated(SGL_TO_OUTSIDE, 'eai')], [true, false]);
  });

  it('relates nothing when no room is given', () => {
    assert.equal(isRelated(GAM_TO_DPI, undefined), false);
  });
});

describe('isHiddenByFocus', () => {
  it('hides nothing while no room is selected, whatever is focused', () => {
    assert.equal(isHiddenByFocus(GAM_TO_DPI, { focused: 'rdv', selected: undefined }), false);
  });

  it('hides a flow unrelated to the selected room', () => {
    assert.equal(isHiddenByFocus(GAM_TO_DPI, { focused: 'rdv', selected: 'rdv' }), true);
  });

  it('keeps a flow related to the selected room', () => {
    assert.equal(isHiddenByFocus(GAM_TO_DPI, { focused: 'gam', selected: 'gam' }), false);
  });

  it('keeps the flows of the room previewed over the selection', () => {
    assert.equal(isHiddenByFocus(GAM_TO_DPI, { focused: 'gam', selected: 'rdv' }), false);
  });

  it('hides a flow related to neither the selection nor the preview', () => {
    assert.equal(isHiddenByFocus(SGL_TO_OUTSIDE, { focused: 'gam', selected: 'rdv' }), true);
  });
});
