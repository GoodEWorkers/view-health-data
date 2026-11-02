import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../../content/departments.ts';
import { VIEW_BOX } from '../camera.ts';
import { CABLE_LINES } from '../cableRoutes.ts';
import { isInsideBox } from './jackWires.ts';
import { LIFTED_RECTS } from './lift.ts';
import { withSag, wireDrafts, wiresIn } from './wires.ts';

const wires = wiresIn(VIEW_BOX);
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);

describe('wireDrafts', () => {
  it('lists one wire per flow in the order of the floor cables', () => {
    assert.equal(wires.length, TOTAL_FLOWS);
    wires.forEach((wire, index) => {
      assert.deepEqual([wire.source, wire.target, wire.flow, wire.index], [CABLE_LINES[index]!.source, CABLE_LINES[index]!.target, CABLE_LINES[index]!.flow, index]);
    });
    assert.equal(wireDrafts().length, TOTAL_FLOWS);
  });

  it('writes the label of the Logiciels layer on each wire', () => {
    assert.equal(wires[0]!.label, 'ADT^A01 · MLLP');
  });
});

describe('sockets', () => {
  it('give every wire its own slot on the bottom bezel of its source and the top bezel of its target', () => {
    for (const { id } of DEPARTMENTS) {
      const outgoing = wires.filter(({ source }) => source === id);
      const incoming = wires.filter(({ target }) => target === id);
      assert.deepEqual(outgoing.map(({ sourceSlot }) => sourceSlot).sort(), outgoing.map((_, slot) => slot), `${id} outgoing`);
      assert.deepEqual(incoming.map(({ targetSlot }) => targetSlot).sort(), incoming.map((_, slot) => slot), `${id} incoming`);
      assert.ok(outgoing.every(({ sourceCount }) => sourceCount === outgoing.length));
      assert.ok(incoming.every(({ targetCount }) => targetCount === incoming.length));
    }
  });

  it('are spaced from left to right by where the other end sits, so wires do not cross at the bezel', () => {
    const outgoing = wires.filter(({ source }) => source === 'dpi').sort((first, second) => first.sourceSlot - second.sourceSlot);
    const centres = outgoing.map(({ target }) => LIFTED_RECTS[target].x + LIFTED_RECTS[target].width / 2);
    assert.deepEqual(centres, [...centres].sort((first, second) => first - second));
  });
});

describe('routes', () => {
  it('keep clear of every floating screen', () => {
    for (const { index, route } of wires) {
      const hit = route.find((point) => Object.values(LIFTED_RECTS).some((box) => isInsideBox(point, box)));
      assert.equal(hit, undefined, `wire ${index} has a waypoint inside a screen`);
    }
  });

  it('leave a source below its bottom edge and reach a target above its top edge', () => {
    for (const { index, source, target, route } of wires.filter(({ route: points }) => points.length > 0)) {
      assert.ok(route[0]![1] >= LIFTED_RECTS[source].y + LIFTED_RECTS[source].height, `wire ${index} leaves ${source} from its top`);
      assert.ok(route.at(-1)![1] <= LIFTED_RECTS[target].y, `wire ${index} reaches ${target} from below`);
    }
  });

  it('were all found by the router, none is the fallback curve', () => {
    for (const { index, routed } of wires) assert.ok(routed, `wire ${index} fell back`);
  });
});

describe('withSag', () => {
  it('drops the middle of a long level run and leaves short runs and climbs alone', () => {
    assert.deepEqual(withSag([[0, 10], [100, 10], [100, 50]]), [[0, 10], [50, 12.5], [100, 10], [100, 50]]);
    assert.deepEqual(withSag([[0, 10], [10, 10]]), [[0, 10], [10, 10]]);
  });
});
