import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { CORRIDOR_PLANS, TRUNK_RUNS, doorFrame, doorOpening, roomById } from './model.ts';
import type { Room } from './model.ts';
import { ROUTES, routeLength } from './routes.ts';

const CORRIDOR_ROOMS = DEPARTMENTS.filter(({ id }) => id !== 'eai').map(({ id }) => roomById(id));
const MAX_DOOR_OFFSET = 1.5;
const SAMPLE_STEP = 0.5;
const TRUNK_TOLERANCE = 0.01;

const containsPoint = ({ x, y, w, d }: Plan, [px, py]: Plane, slack = 0) =>
  px >= x - slack && px <= x + w + slack && py >= y - slack && py <= y + d + slack;

const legsOf = (route: readonly Plane[]) => route.slice(1).map((end, index) => [route[index]!, end] as const);

const distance = ([fromX, fromY]: Plane, [toX, toY]: Plane) => Math.hypot(toX - fromX, toY - fromY);

const samplesOf = ([from, to]: readonly [Plane, Plane]): Plane[] => {
  const count = Math.ceil(distance(from, to) / SAMPLE_STEP);
  return Array.from({ length: count + 1 }, (_, step) => [
    from[0] + ((to[0] - from[0]) * step) / count,
    from[1] + ((to[1] - from[1]) * step) / count,
  ]);
};

const corridorDoorOf = ({ doors }: Room) => doors.find(({ leadsTo }) => leadsTo === 'corridor')!;

describe('trunking routes', () => {
  it('starts every route in the corridor just outside its room door', () => {
    for (const room of CORRIDOR_ROOMS) {
      const [start] = ROUTES[room.id];
      const opening = doorOpening(room, corridorDoorOf(room));
      assert.ok(distance(start!, opening) <= MAX_DOOR_OFFSET, `${room.id} starts ${distance(start!, opening)} from its door`);
      assert.ok(CORRIDOR_PLANS.some((corridor) => containsPoint(corridor, start!)), `${room.id} starts outside the corridor`);
    }
  });

  it('ends every route inside the server room and passes through its door', () => {
    const server = roomById('eai');
    const doorCentre = doorFrame(server, corridorDoorOf(server)).centre;
    for (const room of CORRIDOR_ROOMS) {
      const route = ROUTES[room.id];
      assert.ok(containsPoint(server.plan, route.at(-1)!), `${room.id} ends outside the server room`);
      const crossesDoor = legsOf(route).some((leg) => samplesOf(leg).some((point) => distance(point, doorCentre) <= SAMPLE_STEP));
      assert.ok(crossesDoor, `${room.id} never crosses the server room door`);
    }
  });

  it('makes the server room route the single point every other route ends on', () => {
    assert.equal(ROUTES.eai.length, 1);
    for (const room of CORRIDOR_ROOMS) assert.deepEqual(ROUTES[room.id].at(-1), ROUTES.eai[0]);
  });

  it('keeps every leg axis-aligned and longer than zero', () => {
    for (const { id } of CORRIDOR_ROOMS) {
      for (const [from, to] of legsOf(ROUTES[id])) {
        assert.ok(from[0] === to[0] || from[1] === to[1], `${id} has a diagonal leg`);
        assert.ok(distance(from, to) > 0, `${id} has an empty leg`);
      }
    }
  });

  it('stays on the cable trunking along its whole length', () => {
    for (const { id } of CORRIDOR_ROOMS) {
      for (const leg of legsOf(ROUTES[id])) {
        for (const point of samplesOf(leg)) {
          assert.ok(TRUNK_RUNS.some((run) => containsPoint(run, point, TRUNK_TOLERANCE)), `${id} leaves the trunking at ${point}`);
        }
      }
    }
  });

  it('sums leg lengths in world units', () => {
    assert.equal(routeLength(ROUTES.sgl), 134.5);
    assert.equal(routeLength(ROUTES.eai), 0);
  });
});
