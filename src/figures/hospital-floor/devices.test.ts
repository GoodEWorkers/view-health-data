import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { hospitalFloorCard } from './build.ts';
import { at, polyline } from './camera.ts';
import { DEVICE_SCREENS, deviceAnchor, screenQuadOf, screenQuadOnPlate } from './devices.ts';
import { roomById, wallsOf } from './model.ts';

const SCREEN_TOLERANCE = 0.05;
const PANEL_REACH = 1;
const inside = ({ x, y, w, d }: Plan, [px, py]: Plane) => px > x && px < x + w && py > y && py < y + d;

const GROUP_TAG = /<g[ >]|<\/g>/g;

function groupsOpenedBy(markup: string, opening: string): string[] {
  const groups: string[] = [];
  for (let from = markup.indexOf(opening); from >= 0; from = markup.indexOf(opening, from + 1)) {
    let depth = 0;
    for (const tag of markup.slice(from).matchAll(GROUP_TAG)) {
      depth += tag[0] === '</g>' ? -1 : 1;
      if (depth === 0) {
        groups.push(markup.slice(from, from + tag.index + tag[0].length));
        break;
      }
    }
  }
  return groups;
}

describe('device anchors', () => {
  it('puts every anchor inside its room, clear of every wall', () => {
    for (const { id } of DEPARTMENTS) {
      const anchor = deviceAnchor(id);
      assert.ok(inside(roomById(id).plan, anchor), `${id} anchor is outside its room`);
      assert.ok(!wallsOf().some(({ plan }) => inside(plan, anchor)), `${id} anchor is inside a wall`);
    }
  });

  it('places the screen quad in one vertical plane, above the desk, centred on the anchor', () => {
    for (const { id } of DEPARTMENTS) {
      const quad = screenQuadOf(id);
      const { centre, z, face } = DEVICE_SCREENS[id];
      assert.equal(quad.length, 4);
      const spread = face === 'front' ? 1 : 0;
      const fixed = 1 - spread;
      assert.ok(quad.every((point) => Math.abs(point[fixed]! - quad[0]![fixed]!) < SCREEN_TOLERANCE), `${id} quad is not planar`);
      assert.ok(Math.abs(quad[0]![fixed]! - centre[fixed]!) < PANEL_REACH, `${id} quad is off its monitor`);
      assert.ok(quad.every((point) => point[2] > z));
      const middle = quad.reduce((sum, point) => sum + point[spread]!, 0) / quad.length;
      assert.ok(Math.abs(middle - centre[spread]!) < SCREEN_TOLERANCE, `${id} quad is not centred`);
    }
  });

  it('projects the quad with the one camera', () => {
    for (const { id } of DEPARTMENTS) assert.deepEqual(screenQuadOnPlate(id), screenQuadOf(id).map(at));
  });

  it('draws one anchor device per room whose screen face is the quad', () => {
    const card = hospitalFloorCard();
    for (const { id } of DEPARTMENTS) {
      const anchors = groupsOpenedBy(card, `<g data-room="${id}"`).flatMap((group) => groupsOpenedBy(group, '<g data-device data-anchor>'));
      assert.equal(anchors.length, 1, `${id} anchors`);
      const markup = anchors[0]!;
      assert.ok(markup.includes(`<path data-screen d="${polyline(screenQuadOf(id), true)}"`), `${id} screen is not the quad`);
    }
  });
});
