import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { asDevice, box, compose, paint, rect } from './parts.ts';

const plain = () => box(rect(0, 0, 4, 4), 0, 2);
const near = () => box(rect(30, 30, 4, 4), 0, 2);

describe('device parts', () => {
  it('wraps a device part in a data-device group where it is painted', () => {
    const svg = paint([asDevice(plain())]);
    assert.ok(svg.startsWith('<g data-device><g class="iso-solid"'));
    assert.ok(svg.endsWith('</g></g>'));
  });

  it('marks an anchor device so it can be told apart from its neighbours', () => {
    assert.ok(paint([asDevice(plain(), 'anchor')]).startsWith('<g data-device data-anchor>'));
    assert.ok(!paint([asDevice(plain())]).includes('data-anchor'));
  });

  it('leaves a part that is not a device untouched', () => {
    assert.ok(!paint([plain()]).includes('data-device'));
  });

  it('wraps a device nested in a composed part, and does not turn the composed part into a device', () => {
    const composed = compose([plain(), asDevice(near())]);
    assert.equal(composed.device, undefined);
    assert.equal(composed.svg.match(/<g data-device>/g)?.length, 1);
    assert.ok(composed.svg.indexOf('data-device') > composed.svg.indexOf('iso-solid'));
  });

  it('keeps the depth of the part it flags', () => {
    assert.equal(asDevice(plain()).depth, plain().depth);
  });
});
