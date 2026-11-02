import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId } from '../../content/departments.ts';
import { familyOf, PROTOCOL_FAMILIES } from '../../content/network/protocols.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { MAX_HALF_WIDTH } from './cableLanes.ts';
import { CABLES, CABLE_HEIGHT, CORNER_RADIUS, cablesSvg, cornerRadiusAt, stopsOf } from './cables.ts';
import { deviceAnchor } from './devices.ts';
import { BUILDING } from './model.ts';
import { SCANNER_ROUTE, TELECOM_FOOT_X } from './networkGear.ts';

const TURN: Plane[] = [[0, 0], [10, 0], [10, 10]];
const SHIFT = 1;
const END_REACH = MAX_HALF_WIDTH + 0.1;

describe('cornerRadiusAt', () => {
  it('uses the base radius for a strand on the centreline', () => {
    assert.equal(cornerRadiusAt(TURN, TURN, 1), CORNER_RADIUS);
  });

  it('tightens the arc of a strand on the inside of the turn and widens it on the outside', () => {
    const inside: Plane[] = [[0, SHIFT], [10 - SHIFT, SHIFT], [10 - SHIFT, 10]];
    const outside: Plane[] = [[0, -SHIFT], [10 + SHIFT, -SHIFT], [10 + SHIFT, 10]];
    assert.equal(cornerRadiusAt(TURN, inside, 1), CORNER_RADIUS - SHIFT);
    assert.equal(cornerRadiusAt(TURN, outside, 1), CORNER_RADIUS + SHIFT);
  });
});

describe('CABLES', () => {
  it('keeps the colour of the sending room and takes the colour of the protocol family of its transport', () => {
    for (const { source, colour, family, flow } of CABLES) {
      assert.equal(colour, DEPARTMENTS.find(({ id }) => id === source)!.colour);
      assert.equal(family.id, PROTOCOL_FAMILIES.find(({ id }) => id === familyOf(flow.transport!))!.id);
    }
  });

  it('starts each cable beside its sending device, within a bundle width', () => {
    for (const { source, flow, legs } of CABLES) {
      const [startX, startY] = legs[0]!.path[0]!;
      const [wantedX, wantedY] = source === 'pacs-ris' && flow.transport === 'DICOM' && !('external' in flow) ? SCANNER_ROUTE[0]! : deviceAnchor(source);
      assert.ok(Math.abs(startX - wantedX) <= END_REACH && Math.abs(startY - wantedY) <= END_REACH, `${source} ${flow.payload} misses its device`);
    }
  });

  it('ends an internal cable beside the device of the receiving room when it returns there, and an external one at the telecom box', () => {
    for (const { source, target, legs, external } of CABLES) {
      const [endX, endY] = legs.at(-1)!.path.at(-1)!;
      if (external) assert.ok(Math.abs(endX - TELECOM_FOOT_X) <= END_REACH, `${source} external end`);
      else if (target !== 'eai') {
        const [anchorX, anchorY] = deviceAnchor(target as DepartmentId);
        assert.ok(Math.abs(endX - anchorX) <= END_REACH && Math.abs(endY - anchorY) <= END_REACH, `${source}>${target} misses ${target}`);
      }
    }
  });

  it('keeps every point of every internal cable inside the building', () => {
    for (const { source, target, legs } of CABLES.filter(({ external }) => !external)) {
      for (const [x, y] of legs.flatMap(({ path }) => path)) {
        assert.ok(x > BUILDING.x && x < BUILDING.x + BUILDING.w && y > BUILDING.y && y < BUILDING.y + BUILDING.d, `${source}>${target} leaves the building`);
      }
    }
  });

  it('takes the external cables out of the building to the telecom box and nowhere else', () => {
    for (const { legs } of CABLES.filter(({ external }) => external)) assert.ok(legs[0]!.path.some(([x]) => x < BUILDING.x));
  });

  it('rounds every corner of every leg into several points', () => {
    for (const { legs } of CABLES) for (const { corners, path } of legs) assert.ok(path.length > corners.length);
  });

  it('gives one share of the cable length to each hop, rising from the start to the end', () => {
    for (const cable of CABLES) {
      const shares = stopsOf(cable);
      assert.equal(shares.length, cable.hops.length);
      assert.ok(shares.every((share, index) => share >= 0 && share <= 1 && (index === 0 || share >= shares[index - 1]!)));
      assert.equal(shares[0], 0);
      assert.equal(shares.at(-1), 1);
    }
  });
});

describe('cablesSvg', () => {
  const svg = cablesSvg();
  const groups = svg.match(/<g data-cable="".*?<\/g>/g) ?? [];

  it('draws a glow stroke under a core stroke in each cable, tagged with its rooms, family, trace key and colours', () => {
    assert.equal(groups.length, CABLES.length);
    assert.ok(svg.includes('<g data-cable="" data-from="gam" data-to="dpi" data-flow="0" data-family="mllp" data-dash="" data-trace="gam:Identité patient"'));
    assert.ok(svg.includes('style="--room: #0284c7; --family: #005191; --dash: none"'));
    assert.equal(svg.match(/class="cable-glow" d="([^"]+)"\/><path class="cable-core" d="\1"/g)?.length, CABLES.length);
    assert.equal(svg.match(/data-flow="\d+"/g)?.length, CABLES.length);
  });

  it('marks the external cables and gives each cable the length shares of its hops', () => {
    assert.equal(svg.match(/data-external=""/g)?.length, CABLES.filter(({ external }) => external).length);
    for (const cable of CABLES) assert.ok(svg.includes(`data-stops="${stopsOf(cable).map((share) => share.toFixed(4)).join(',')}"`));
  });

  it('draws a gate on exactly the cables whose hops pass the firewall, and an invisible wider stroke to hover every cable', () => {
    const throughFirewall = CABLES.filter(({ hops }) => hops.some(({ kind }) => kind === 'firewall')).length;
    assert.equal(svg.match(/class="cable-gate"/g)?.length, throughFirewall);
    assert.equal(svg.match(/class="cable-gate-halo"/g)?.length, throughFirewall);
    assert.equal(svg.match(/class="cable-hit"/g)?.length, CABLES.length);
  });

  it('gives each cable the dash pattern of its family, solid for HL7 v2 and dashed, dotted or dash-dot for the others', () => {
    for (const cable of CABLES) {
      const dash = cable.family.dash.join(' ');
      assert.ok(svg.includes(`data-dash="${dash}"`) && svg.includes(`--dash: ${dash === '' ? 'none' : dash}"`), cable.family.id);
    }
    assert.ok(svg.includes('data-dash="6 3 1.5 3"') && svg.includes('data-dash="1.5 3"') && svg.includes('data-dash="6 3"'));
  });

  it('puts every cable on the floor at the cable height, never on the kit line class', () => {
    assert.ok(CABLE_HEIGHT > 0 && CABLE_HEIGHT < 1);
    assert.ok(!svg.includes('iso-line'));
  });

  it('is followed by the empty layer the packets are drawn into', () => {
    assert.ok(svg.endsWith('<g data-packets=""></g>'));
  });
});
