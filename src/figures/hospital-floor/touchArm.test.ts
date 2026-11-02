import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { tapStep } from './touchArm.ts';

describe('a touch tap', () => {
  it('only previews a target the first time and arms it', () => {
    assert.deepEqual(tapStep(null, true, 'room:dpi'), { armed: 'room:dpi', activates: false });
  });

  it('activates the armed target on the second tap and disarms', () => {
    assert.deepEqual(tapStep('room:dpi', true, 'room:dpi'), { armed: null, activates: true });
  });

  it('previews another target instead and moves the arm to it', () => {
    assert.deepEqual(tapStep('room:dpi', true, 'cable:gam'), { armed: 'cable:gam', activates: false });
  });

  it('activates at once on a target that carries its own tap, and disarms', () => {
    assert.deepEqual(tapStep('room:dpi', true, null), { armed: null, activates: true });
  });
});

describe('a mouse, pen or keyboard click', () => {
  it('always activates and never arms', () => {
    assert.deepEqual(tapStep(null, false, 'room:dpi'), { armed: null, activates: true });
  });

  it('clears an arm left by an earlier touch', () => {
    assert.deepEqual(tapStep('room:dpi', false, 'room:sgl'), { armed: null, activates: true });
  });
});
