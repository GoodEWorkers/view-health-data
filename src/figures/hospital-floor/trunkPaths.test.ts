import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Plane } from '../../iso/iso-kit.ts';
import { RING_CENTRE } from './model.ts';
import { ROUTES } from './routes.ts';
import { snapped, trunkPath } from './trunkPaths.ts';

const lengthOf = (path: readonly Plane[]) => path.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - path[index]![0], y - path[index]![1]), 0);

const entry = (id: keyof typeof ROUTES) => ROUTES[id][0]!;

describe('trunkPath', () => {
  it('goes from one threshold to another along axis-aligned legs', () => {
    const path = trunkPath(entry('dpi'), entry('sgl'));
    assert.deepEqual(path[0], snapped(entry('dpi')));
    assert.deepEqual(path.at(-1), snapped(entry('sgl')));
    path.slice(1).forEach(([x, y], index) => assert.ok(x === path[index]![0] || y === path[index]![1]));
  });

  it('takes the ring side nearer to the target, so the load is shared', () => {
    const toPharmacy = trunkPath(entry('dpi'), entry('pharmacie'));
    assert.ok(toPharmacy.some(([, y]) => y === RING_CENTRE.right));
    assert.ok(!toPharmacy.some(([, y]) => y === RING_CENTRE.left));
    const toLaboratory = trunkPath(entry('dpi'), entry('sgl'));
    assert.ok(toLaboratory.some(([, y]) => y === RING_CENTRE.left));
  });

  it('runs straight between the two doors on the spur', () => {
    const path = trunkPath(entry('gam'), entry('rdv'));
    assert.equal(path.length, 3);
    assert.ok(path.every(([x]) => x === path[0]![0]));
  });

  it('is as long one way as the other', () => {
    assert.ok(Math.abs(lengthOf(trunkPath(entry('bloc'), entry('gam'))) - lengthOf(trunkPath(entry('gam'), entry('bloc')))) < 1e-9);
  });

  it('refuses a point that is not on the trunking', () => {
    assert.throws(() => trunkPath([0, 0], entry('gam')));
  });
});
