import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import {
  BUILDING,
  CORRIDOR_PLANS,
  ROOMS,
  doorOpening,
  doorSegment,
  insideBuilding,
  overlaps,
  roomById,
} from './model.ts';
import type { Plan } from '../../iso/iso-kit.ts';

const EDGE_TOLERANCE = 1e-6;

const plan = (x: number, y: number, w: number, d: number): Plan => ({ x, y, w, d, r: 0 });

const containsPoint = ({ x, y, w, d }: Plan, [px, py]: readonly [number, number]) =>
  px > x && px < x + w && py > y && py < y + d;

const onPlanEdge = ({ x, y, w, d }: Plan, [px, py]: readonly [number, number]) => {
  const withinX = px >= x - EDGE_TOLERANCE && px <= x + w + EDGE_TOLERANCE;
  const withinY = py >= y - EDGE_TOLERANCE && py <= y + d + EDGE_TOLERANCE;
  const onVerticalEdge = [x, x + w].some((edge) => Math.abs(px - edge) < EDGE_TOLERANCE);
  const onHorizontalEdge = [y, y + d].some((edge) => Math.abs(py - edge) < EDGE_TOLERANCE);
  return (withinY && onVerticalEdge) || (withinX && onHorizontalEdge);
};

describe('overlaps', () => {
  it('is false for plans that only share an edge', () => {
    assert.equal(overlaps(plan(0, 0, 10, 10), plan(10, 0, 10, 10)), false);
  });

  it('is true for plans sharing an area', () => {
    assert.equal(overlaps(plan(0, 0, 10, 10), plan(9, 9, 10, 10)), true);
  });
});

describe('floor model', () => {
  it('gives every department exactly one room', () => {
    for (const { id } of DEPARTMENTS) {
      assert.equal(ROOMS.filter((room) => room.id === id).length, 1, id);
    }
    assert.equal(ROOMS.length, DEPARTMENTS.length);
  });

  it('keeps every room plan inside the building plan', () => {
    for (const { id, plan: roomPlan, bay } of ROOMS) {
      assert.ok(insideBuilding(roomPlan), `${id} leaves the building`);
      if (bay) assert.ok(insideBuilding(bay) && overlaps(bay, roomPlan), `${id} bay leaves its room`);
    }
    assert.ok(BUILDING.w > 0 && BUILDING.d > 0);
  });

  it('never lets two room plans overlap', () => {
    for (const first of ROOMS) {
      for (const second of ROOMS.filter((room) => room.id > first.id)) {
        assert.equal(overlaps(first.plan, second.plan), false, `${first.id} overlaps ${second.id}`);
      }
    }
  });

  it('puts every door on its host wall and opens it onto the corridor or the bay', () => {
    for (const room of ROOMS) {
      for (const door of room.doors) {
        const host = door.host === 'bay' ? room.bay : room.plan;
        assert.ok(host, `${room.id} door names a missing host`);
        const { from, to } = doorSegment(room, door);
        assert.ok(onPlanEdge(host, from) && onPlanEdge(host, to), `${room.id} door is off its wall`);
        const opening = doorOpening(room, door);
        const target = door.leadsTo === 'bay' && room.bay ? [room.bay] : CORRIDOR_PLANS;
        assert.ok(target.some((area) => containsPoint(area, opening)), `${room.id} door opens onto nothing`);
      }
    }
  });

  it('gives each room one corridor door and Imagerie one more onto its bay', () => {
    for (const room of ROOMS) {
      const corridorDoors = room.doors.filter((door) => door.leadsTo === 'corridor');
      const bayDoors = room.doors.filter((door) => door.leadsTo === 'bay');
      assert.equal(corridorDoors.length, 1, `${room.id} corridor doors`);
      assert.equal(bayDoors.length, room.id === 'pacs-ris' ? 1 : 0, `${room.id} bay doors`);
    }
  });

  it('finds a room by its department id', () => {
    assert.equal(roomById('eai').id, 'eai');
  });
});
