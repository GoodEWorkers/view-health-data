import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { hospitalFloorCard } from './build.ts';
import { ROOMS } from './model.ts';
import { DIGIT_WIDTH_SHARE, NUMERAL_SIZE, numeralCentre, numeralsSvg } from './structure.ts';

const DIGIT_HEIGHT_SHARE = 0.7;
const SHORT_SIDE_SHARE = 0.75;

describe('the room numerals', () => {
  it('share one size, three quarters of the short side of the smallest room', () => {
    const smallest = Math.min(...ROOMS.map(({ plan }) => Math.min(plan.w, plan.d)));
    assert.equal(NUMERAL_SIZE, SHORT_SIDE_SHARE * smallest);
    const sizes = [...numeralsSvg().matchAll(/font-size="([\d.]+)"/g)].map(([, size]) => Number(size));
    assert.equal(sizes.length, DEPARTMENTS.length);
    assert.ok(sizes.every((size) => size === sizes[0]));
  });

  it('are centred on the main plan of their room and each digit lies inside its walls', () => {
    for (const room of ROOMS) {
      const [centreX, centreY] = numeralCentre(room);
      assert.deepEqual([centreX, centreY], [room.plan.x + room.plan.w / 2, room.plan.y + room.plan.d / 2]);
      const [halfWidth, halfHeight] = [(NUMERAL_SIZE * DIGIT_WIDTH_SHARE) / 2, (NUMERAL_SIZE * DIGIT_HEIGHT_SHARE) / 2];
      assert.ok(centreX - halfWidth > room.plan.x && centreX + halfWidth < room.plan.x + room.plan.w, `${room.id} width`);
      assert.ok(centreY - halfHeight > room.plan.y && centreY + halfHeight < room.plan.y + room.plan.d, `${room.id} depth`);
    }
  });

  it('are painted on the floor right after it, before the zone patches and ground marks, the trunking and the cables', () => {
    const card = hospitalFloorCard();
    const numerals = card.indexOf('class="room-numeral"');
    const floors = [...card.matchAll(/class="iso-solid room-floor"/g)].slice(0, DEPARTMENTS.length).map((found) => found.index!);
    assert.ok(floors.every((floor) => floor < numerals));
    assert.ok(numerals < card.indexOf('data-zone-patch'));
    assert.ok(card.indexOf('data-zone-patch') < card.indexOf('data-cables'));
    assert.ok(numerals < card.indexOf('data-cables'));
  });
});
