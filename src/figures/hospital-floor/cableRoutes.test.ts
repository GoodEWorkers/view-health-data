import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { CABLE_LINES, cableBetween, routeToHub, withoutRedundantPoints } from './cableRoutes.ts';
import { deviceAnchor } from './devices.ts';
import { ROOMS, TRUNK_RUNS, WALL_THICKNESS, doorFrame, roomById } from './model.ts';
import { ROUTES } from './routes.ts';
import { snapped } from './trunkPaths.ts';

const SAMPLE_STEP = 0.25;
const TOLERANCE = 0.01;
const DOOR_PLANE_REACH = 0.3;
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);

const containsPoint = ({ x, y, w, d }: Plan, [px, py]: Plane, slack = 0) => px >= x - slack && px <= x + w + slack && py >= y - slack && py <= y + d + slack;
const inRoomOrDoorway = (point: Plane) => ROOMS.some(({ plan }) => containsPoint(plan, point, WALL_THICKNESS));

const samplesOf = (points: readonly Plane[]): Plane[] =>
  points.slice(1).flatMap(([toX, toY], index) => {
    const [fromX, fromY] = points[index]!;
    const count = Math.ceil(Math.hypot(toX - fromX, toY - fromY) / SAMPLE_STEP);
    return Array.from({ length: count + 1 }, (_, step): Plane => [fromX + ((toX - fromX) * step) / count, fromY + ((toY - fromY) * step) / count]);
  });

describe('cable centrelines', () => {
  it('draws one cable per flow, in the order of the flows', () => {
    assert.equal(CABLE_LINES.length, TOTAL_FLOWS);
    const expected = DEPARTMENTS.flatMap(({ id, flows }) => flows.map(({ to, payload }) => `${id}>${to}:${payload}`));
    assert.deepEqual(CABLE_LINES.map(({ source, target, flow }) => `${source}>${target}:${flow.payload}`), expected);
  });

  it('runs from the anchor of the sending room to the anchor of the receiving room', () => {
    for (const { source, target, points } of CABLE_LINES) {
      assert.deepEqual(points[0], deviceAnchor(source), `${source} start`);
      assert.deepEqual(points.at(-1), deviceAnchor(target), `${target} end`);
    }
  });

  it('keeps every leg axis-aligned, longer than zero and never doubling back', () => {
    for (const { source, target, points } of CABLE_LINES) {
      points.slice(1).forEach(([x, y], index) => {
        const [fromX, fromY] = points[index]!;
        assert.ok((x === fromX) !== (y === fromY), `${source}>${target} leg ${index}`);
      });
    }
    assert.throws(() => withoutRedundantPoints([[0, 0], [5, 0], [2, 0]]));
  });

  it('stays on the trunking wherever it is outside a room and its doorway', () => {
    for (const { source, target, points } of CABLE_LINES) {
      for (const point of samplesOf(points).filter((sample) => !inRoomOrDoorway(sample))) {
        assert.ok(TRUNK_RUNS.some((run) => containsPoint(run, point, TOLERANCE)), `${source}>${target} leaves the trunking at ${point}`);
      }
    }
  });

  it('crosses the door of the sending room and of the receiving room', () => {
    for (const { source, target, points } of CABLE_LINES) {
      for (const id of [source, target]) {
        const room = roomById(id);
        const door = room.doors.find(({ leadsTo }) => leadsTo === 'corridor')!;
        const { centre, along, inward } = doorFrame(room, door);
        const through = samplesOf(points).some(([x, y]) => {
          const [dx, dy] = [x - centre[0], y - centre[1]];
          return Math.abs(dx * inward[0] + dy * inward[1]) < DOOR_PLANE_REACH && Math.abs(dx * along[0] + dy * along[1]) <= door.width / 2;
        });
        assert.ok(through, `${source}>${target} misses the door of ${id}`);
      }
    }
  });

  it('sends every EAI-bound cable along the route of its room to the hub', () => {
    for (const { source, target, points } of CABLE_LINES.filter(({ target: to }) => to === 'eai')) {
      const cable = samplesOf(points);
      for (const [x, y] of samplesOf(ROUTES[source].map(snapped))) {
        assert.ok(cable.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < TOLERANCE), `${source}>${target} leaves its route at ${x},${y}`);
      }
    }
  });

  it('takes a room-to-room cable by the shorter way round the ring', () => {
    const toPharmacy = cableBetween('dpi', 'pharmacie');
    const viaHub = [...routeToHub('dpi'), ...routeToHub('pharmacie').reverse()];
    const length = (path: readonly Plane[]) => path.slice(1).reduce((total, [x, y], index) => total + Math.hypot(x - path[index]![0], y - path[index]![1]), 0);
    assert.ok(length(toPharmacy) < length(viaHub) / 2);
  });
});
