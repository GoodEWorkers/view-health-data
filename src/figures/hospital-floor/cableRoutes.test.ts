import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { hopsOf } from '../../content/network/hops.ts';
import type { Plan, Plane } from '../../iso/iso-kit.ts';
import { CABLE_LINES, OUTSIDE, routeToHub, withoutRedundantPoints } from './cableRoutes.ts';
import type { ExternalLine, InternalLine } from './cableRoutes.ts';
import { deviceAnchor } from './devices.ts';
import { BUS_Y, DMZ_PATCH, GATE_X, RACK_BASE_Y, ROUTER, SCANNER_ROUTE, STATION_X, TELECOM_FOOT_X } from './networkGear.ts';
import { BUILDING, ROOMS, TRUNK_RUNS, WALL_THICKNESS, doorFrame, roomById } from './model.ts';
import { ROUTES } from './routes.ts';
import { snapped } from './trunkPaths.ts';

const SAMPLE_STEP = 0.25;
const TOLERANCE = 0.01;
const DOOR_PLANE_REACH = 0.3;
const TOTAL_FLOWS = DEPARTMENTS.reduce((total, { flows }) => total + flows.length, 0);
const TOTAL_EXTERNAL_FLOWS = DEPARTMENTS.reduce((total, { network }) => total + network.externalFlows.length, 0);
const SERVER_ROOM = roomById('eai').plan;

const internal = CABLE_LINES.filter((line): line is InternalLine => !line.external);
const external = CABLE_LINES.filter((line): line is ExternalLine => line.external);

const containsPoint = ({ x, y, w, d }: Plan, [px, py]: Plane, slack = 0) => px >= x - slack && px <= x + w + slack && py >= y - slack && py <= y + d + slack;
const inRoomOrDoorway = (point: Plane) => ROOMS.some(({ plan }) => containsPoint(plan, point, WALL_THICKNESS));

const samplesOf = (points: readonly Plane[]): Plane[] =>
  points.slice(1).flatMap(([toX, toY], index) => {
    const [fromX, fromY] = points[index]!;
    const count = Math.ceil(Math.hypot(toX - fromX, toY - fromY) / SAMPLE_STEP);
    return Array.from({ length: count + 1 }, (_, step): Plane => [fromX + ((toX - fromX) * step) / count, fromY + ((toY - fromY) * step) / count]);
  });

describe('cable centrelines', () => {
  it('draws one cable per internal flow in the order of the flows, then one per external flow', () => {
    assert.equal(CABLE_LINES.length, TOTAL_FLOWS + TOTAL_EXTERNAL_FLOWS);
    const expected = DEPARTMENTS.flatMap(({ id, flows }) => flows.map(({ to, payload }) => `${id}>${to}:${payload}`));
    assert.deepEqual(internal.map(({ source, target, flow }) => `${source}>${target}:${flow.payload}`), expected);
    assert.deepEqual(external.map(({ target }) => target), Array(TOTAL_EXTERNAL_FLOWS).fill(OUTSIDE));
  });

  it('starts at the anchor of the sending room, or at the scanner for the flow the modality pushes', () => {
    for (const { source, flow, centrelines } of internal) {
      const pushedByScanner = source === 'pacs-ris' && flow.transport === 'DICOM';
      assert.deepEqual(centrelines[0]![0], pushedByScanner ? SCANNER_ROUTE[0] : deviceAnchor(source), `${source} ${flow.payload}`);
    }
    for (const { source, centrelines } of external) assert.deepEqual(centrelines[0]![0], deviceAnchor(source), `${source} external`);
  });

  it('returns to the receiving anchor by a second leg exactly when the flow goes to another room than the EAI', () => {
    for (const { source, target, flow, centrelines } of internal) {
      assert.equal(centrelines.length, target === 'eai' ? 1 : 2, `${source}>${target}:${flow.payload}`);
      if (target !== 'eai') assert.deepEqual(centrelines[1]!.at(-1), deviceAnchor(target));
    }
  });

  it('keeps every leg axis-aligned, longer than zero and never doubling back', () => {
    for (const { source, target, centrelines } of CABLE_LINES) {
      for (const points of centrelines) {
        points.slice(1).forEach(([x, y], index) => {
          const [fromX, fromY] = points[index]!;
          assert.ok((x === fromX) !== (y === fromY), `${source}>${target} leg ${index}`);
        });
      }
    }
    assert.throws(() => withoutRedundantPoints([[0, 0], [5, 0], [2, 0]]));
  });

  it('stays on the trunking wherever it is outside a room and its doorway, except on the fibre outside the building', () => {
    for (const { source, target, centrelines } of CABLE_LINES) {
      for (const point of centrelines.flatMap(samplesOf).filter((sample) => !inRoomOrDoorway(sample) && sample[0] > BUILDING.x)) {
        assert.ok(TRUNK_RUNS.some((run) => containsPoint(run, point, TOLERANCE)), `${source}>${target} leaves the trunking at ${point}`);
      }
    }
  });

  it('crosses the door of the sending room and, for internal flows, of the receiving room', () => {
    for (const { source, target, centrelines } of internal) {
      for (const id of [source, target]) {
        const room = roomById(id);
        const door = room.doors.find(({ leadsTo }) => leadsTo === 'corridor')!;
        const { centre, along, inward } = doorFrame(room, door);
        const through = centrelines.flatMap(samplesOf).some(([x, y]) => {
          const [dx, dy] = [x - centre[0], y - centre[1]];
          return Math.abs(dx * inward[0] + dy * inward[1]) < DOOR_PLANE_REACH && Math.abs(dx * along[0] + dy * along[1]) <= door.width / 2;
        });
        assert.ok(through, `${source}>${target} misses the door of ${id}`);
      }
    }
  });

  it('sends every cable along the route of its sending room to the hub, then along the rack row', () => {
    for (const { source, flow, centrelines } of internal.filter(({ source: from, flow: sent }) => !(from === 'pacs-ris' && sent.transport === 'DICOM'))) {
      const cable = samplesOf(centrelines[0]!);
      for (const [x, y] of samplesOf(ROUTES[source].map(snapped))) {
        assert.ok(cable.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < TOLERANCE), `${source} ${flow.payload} leaves its route at ${x},${y}`);
      }
    }
  });

  it('ends a message for the EAI at the foot of the EAI rack and one that stops at the core under the core rack', () => {
    for (const { hops, centrelines } of internal) {
      const reachesEai = hops.some(({ kind }) => kind === 'eai');
      assert.deepEqual(centrelines[0]!.at(-1), reachesEai ? [STATION_X.eai, RACK_BASE_Y] : [STATION_X.core, BUS_Y]);
    }
  });

  it('sends the traffic of a biomedical device through its room switch along the wall', () => {
    const scanner = internal.find(({ source, flow }) => source === 'pacs-ris' && flow.transport === 'DICOM')!;
    assert.deepEqual(scanner.hops.map(({ kind }) => kind), ['device', 'switch', 'core', 'firewall', 'eai']);
    assert.ok(SCANNER_ROUTE.every(([, y]) => y >= roomById('pacs-ris').plan.y));
    assert.ok(internal.filter(({ hops }) => hops.some(({ kind }) => kind === 'switch')).length === 1);
  });

  it('takes an external flow past the core and the firewall, through the DMZ patch and the router, to the telecom box', () => {
    for (const { source, hops, centrelines } of external) {
      const [leg] = centrelines;
      assert.deepEqual(leg!.at(-1)![0], TELECOM_FOOT_X, source);
      assert.ok(samplesOf(leg!).some((point) => containsPoint(DMZ_PATCH, point)), `${source} misses the DMZ patch`);
      assert.ok(samplesOf(leg!).some(([x, y]) => x < ROUTER.plan.x + ROUTER.plan.w && Math.abs(y - (ROUTER.plan.y + ROUTER.plan.d / 2)) < 1), `${source} misses the router`);
      assert.deepEqual(hops.map(({ kind }) => kind).filter((kind) => kind === 'firewall'), ['firewall']);
    }
  });

  it('puts every station of the bus inside the server room, in the order of the hops', () => {
    assert.ok(Object.values(STATION_X).every((x) => containsPoint(SERVER_ROOM, [x, BUS_Y])));
    assert.ok(STATION_X.core > GATE_X && GATE_X > STATION_X.eai && STATION_X.eai > STATION_X.dmz && STATION_X.dmz > ROUTER.plan.x + ROUTER.plan.w);
  });

  it('gives a stop to every hop and walks forward through the legs', () => {
    for (const { hops, stops, centrelines } of CABLE_LINES) {
      assert.equal(stops.length, hops.length);
      assert.ok(stops.every(({ leg }, index) => leg < centrelines.length && (index === 0 || leg >= stops[index - 1]!.leg)));
    }
  });

  it('builds the same hops as the content model for every internal flow', () => {
    for (const { source, flow, hops } of internal) assert.deepEqual(hops, hopsOf(source, flow));
  });

  it('routes a room to the hub without doubling back', () => {
    for (const { id } of DEPARTMENTS) assert.doesNotThrow(() => routeToHub(id));
  });
});
