import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import { EQUIPMENT } from '../../content/network/equipment.ts';
import type { Plan } from '../../iso/iso-kit.ts';
import { BASEBOARD, BUILDING, WALL_THICKNESS, doorSegment, overlaps, roomById } from './model.ts';
import {
  BIOMEDICAL_PATCHES,
  CORE_RACK,
  DMZ_PATCH,
  DMZ_RACK,
  FIBRE_TRAY,
  FIREWALL_BOX,
  GATE_X,
  ROUTER,
  STATION_X,
  SWITCH_SIZE,
  TELECOM,
  TELECOM_FOOT_X,
  WALL_INNER_X,
  WALL_OUTER_X,
  accessSwitchPlan,
} from './networkGear.ts';
import { RACK_PLANS, UPS } from './rooms/serverRoom.ts';

const inside = (inner: Plan, outer: Plan): boolean => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.d <= outer.y + outer.d;
const SERVER_ROOM = roomById('eai').plan;
const EAR_ALLOWANCE = 0.6;

describe('the wall switches', () => {
  it('hang on the far wall of their room, inside it, one per room', () => {
    for (const { id } of DEPARTMENTS) {
      const plan = accessSwitchPlan(id);
      const room = roomById(id).plan;
      assert.equal(plan.y, room.y, `${id} is not against the far wall`);
      assert.ok(plan.x - EAR_ALLOWANCE >= room.x && plan.x + plan.w + EAR_ALLOWANCE <= room.x + room.w, `${id} switch leaves its room`);
    }
  });

  it('stay clear of every door of their room, which cuts the wall', () => {
    for (const { id } of DEPARTMENTS) {
      const plan = accessSwitchPlan(id);
      for (const door of roomById(id).doors) {
        const { from, to } = doorSegment(roomById(id), door);
        const [low, high] = [Math.min(from[0], to[0]), Math.max(from[0], to[0])];
        const onFarWall = Math.abs(from[1] - plan.y) < WALL_THICKNESS;
        assert.ok(!onFarWall || plan.x + plan.w + EAR_ALLOWANCE <= low || plan.x - EAR_ALLOWANCE >= high, `${id} switch sits in a door`);
      }
    }
  });

  it('are small enough to be a box on a wall: their top stays under the lowest wall', () => {
    assert.ok(SWITCH_SIZE.bottom + SWITCH_SIZE.height <= 8);
  });
});

describe('the server room gear', () => {
  const gear: readonly Plan[] = [CORE_RACK, DMZ_RACK, FIREWALL_BOX.plan, ROUTER.plan];

  it('stands inside the server room, clear of the existing racks and the UPS and of each other', () => {
    for (const plan of gear) {
      assert.ok(inside(plan, SERVER_ROOM));
      for (const existing of [...RACK_PLANS, UPS]) assert.ok(!overlaps(plan, existing));
    }
    gear.forEach((plan, index) => gear.slice(index + 1).forEach((other) => assert.ok(!overlaps(plan, other))));
  });

  it('lines the stations of the bus up from the door to the wall, in the order of the hops, with the gate in the open between the core and the firewall', () => {
    const firewallEast = FIREWALL_BOX.plan.x + FIREWALL_BOX.plan.w;
    assert.ok(STATION_X.core > GATE_X && GATE_X > firewallEast && FIREWALL_BOX.plan.x > STATION_X.eai);
    assert.ok(STATION_X.eai > STATION_X.dmz && STATION_X.dmz > ROUTER.plan.x + ROUTER.plan.w);
    assert.ok(GATE_X < CORE_RACK.x, 'the gate is not under the core rack');
  });

  it('puts the DMZ patch round the DMZ rack, inside the server room', () => {
    assert.ok(inside(DMZ_RACK, DMZ_PATCH) && inside(DMZ_PATCH, SERVER_ROOM));
  });
});

describe('the biomedical patches', () => {
  it('lie each inside one of the rooms that hold a biomedical device', () => {
    const hosts = ['pacs-ris', 'sgl', 'bloc'] as const;
    BIOMEDICAL_PATCHES.forEach((patch, index) => assert.ok(inside(patch, roomById(hosts[index]!).plan), `patch ${index}`));
  });

  it('belong to the rooms whose access switch is biomedical', () => {
    const biomedicalRooms = EQUIPMENT.filter(({ kind, zone }) => kind === 'switch' && zone === 'biomedical-modalities').map(({ room }) => room);
    assert.deepEqual(biomedicalRooms, ['sgl', 'pacs-ris', 'bloc']);
  });
});

describe('the telecom box and the fibre', () => {
  it('stands outside the building, on the baseboard, with its door toward the viewer', () => {
    const { plinth } = TELECOM;
    assert.ok(plinth.x + plinth.w < BUILDING.x && inside(plinth, BASEBOARD));
  });

  it('is joined to the server room by a tray that ends on the box and on the outer wall, through that wall', () => {
    assert.equal(FIBRE_TRAY.x, TELECOM_FOOT_X);
    assert.equal(FIBRE_TRAY.x + FIBRE_TRAY.w, WALL_OUTER_X);
    assert.equal(WALL_INNER_X - WALL_OUTER_X, WALL_THICKNESS);
    assert.ok(SERVER_ROOM.x === WALL_INNER_X && ROUTER.plan.x > WALL_INNER_X);
  });

  it('keeps the bus line on the middle of the router, the tray and the telecom box', () => {
    const centre = (plan: Plan): number => plan.y + plan.d / 2;
    assert.ok([ROUTER.plan, FIBRE_TRAY, TELECOM.plinth, TELECOM.body].every((plan) => Math.abs(centre(plan) - 0) < 0.01));
  });
});
