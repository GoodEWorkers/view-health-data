import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../../content/departments.ts';
import { screenQuadOnPlate } from '../devices.ts';
import { INSET, LIFTED_RECTS, LIFT, liftedRectOf, quadOfRect, roomRectOf, screenAspectOf, startQuadOf } from './lift.ts';
import type { Rect } from './lift.ts';

const TOLERANCE = 1e-6;
const IDS = DEPARTMENTS.map(({ id }) => id);
const WIDTH_LIMITED = ['gam', 'rdv'] as const;

const apart = (first: Rect, second: Rect): boolean =>
  first.x + first.width <= second.x || second.x + second.width <= first.x || first.y + first.height <= second.y || second.y + second.height <= first.y;

describe('the floating rectangles', () => {
  it('lie inside the projected plan rectangle of their room, one inset from its edges', () => {
    for (const id of IDS) {
      const [room, rect] = [roomRectOf(id), LIFTED_RECTS[id]];
      assert.ok(rect.x >= room.x + INSET / 2 - TOLERANCE, `${id} left`);
      assert.ok(rect.y >= room.y + INSET / 2 - TOLERANCE, `${id} top`);
      assert.ok(rect.x + rect.width <= room.x + room.width - INSET / 2 + TOLERANCE, `${id} right`);
      assert.ok(rect.y + rect.height <= room.y + room.height - INSET / 2 + TOLERANCE, `${id} bottom`);
    }
  });

  it('never overlap one another', () => {
    IDS.forEach((first, index) => IDS.slice(index + 1).forEach((second) => assert.ok(apart(LIFTED_RECTS[first], LIFTED_RECTS[second]), `${first} and ${second} overlap`)));
  });

  it('keep the aspect of the monitor screen they rise from, the same for all eight', () => {
    const aspects = IDS.map(screenAspectOf);
    aspects.forEach((aspect) => assert.ok(Math.abs(aspect - aspects[0]!) < TOLERANCE));
    for (const id of IDS) assert.ok(Math.abs(LIFTED_RECTS[id].width / LIFTED_RECTS[id].height - screenAspectOf(id)) < TOLERANCE, id);
  });

  it('take the room width minus the inset where the room is deep enough', () => {
    for (const id of WIDTH_LIMITED) assert.ok(Math.abs(LIFTED_RECTS[id].width - (roomRectOf(id).width - INSET)) < TOLERANCE, id);
  });

  it('fill the room height instead where the room is shallow, so they stay inside it', () => {
    const shallow = LIFTED_RECTS.sgl;
    assert.ok(shallow.width < roomRectOf('sgl').width - INSET);
    assert.ok(Math.abs(shallow.height - (roomRectOf('sgl').height - INSET)) < TOLERANCE);
  });

  it('float above the centre of a room with height to spare, by the lift', () => {
    for (const id of WIDTH_LIMITED) {
      const [room, rect] = [roomRectOf(id), LIFTED_RECTS[id]];
      assert.ok(Math.abs(room.y + room.height / 2 - (rect.y + rect.height / 2) - LIFT) < TOLERANCE, id);
    }
  });
});

describe('startQuadOf', () => {
  it('lists the projected monitor screen from its top-left corner clockwise', () => {
    for (const id of IDS) {
      const [bottomLeft, bottomRight, topRight, topLeft] = screenQuadOnPlate(id);
      assert.deepEqual(startQuadOf(id), [topLeft, topRight, bottomRight, bottomLeft]);
    }
  });

  it('starts flatter than it ends: the face is foreshortened by the camera', () => {
    const [topLeft, , , bottomLeft] = startQuadOf('dpi');
    const start = (bottomLeft[1] - topLeft[1]) / (startQuadOf('dpi')[1][0] - topLeft[0]);
    assert.ok(start < 1 / screenAspectOf('dpi'));
  });
});

describe('quadOfRect', () => {
  it('lists the corners from the top-left clockwise', () => {
    assert.deepEqual(quadOfRect({ x: 1, y: 2, width: 3, height: 4 }), [[1, 2], [4, 2], [4, 6], [1, 6]]);
  });
});

describe('liftedRectOf', () => {
  it('is what LIFTED_RECTS holds', () => {
    assert.deepEqual(liftedRectOf('bloc'), LIFTED_RECTS.bloc);
  });
});
