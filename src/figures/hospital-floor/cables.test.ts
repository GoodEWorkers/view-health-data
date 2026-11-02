import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../content/departments.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { MAX_HALF_WIDTH } from './cableLanes.ts';
import { CABLES, CABLE_HEIGHT, CORNER_RADIUS, cablesSvg, cornerRadiusAt } from './cables.ts';
import { deviceAnchor } from './devices.ts';
import { BUILDING } from './model.ts';

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
  it('colours each cable with the colour of its sending room', () => {
    for (const { source, colour } of CABLES) assert.equal(colour, DEPARTMENTS.find(({ id }) => id === source)!.colour);
  });

  it('ends each cable beside the anchor device of its two rooms, within a bundle width', () => {
    for (const { source, target, path } of CABLES) {
      for (const [id, end] of [[source, path[0]!], [target, path.at(-1)!]] as const) {
        const [anchorX, anchorY] = deviceAnchor(id);
        assert.ok(Math.abs(end[0] - anchorX) <= END_REACH && Math.abs(end[1] - anchorY) <= END_REACH, `${source}>${target} misses ${id}`);
      }
    }
  });

  it('keeps every point of every cable inside the building', () => {
    for (const { source, target, path } of CABLES) {
      for (const [x, y] of path) {
        assert.ok(x > BUILDING.x && x < BUILDING.x + BUILDING.w && y > BUILDING.y && y < BUILDING.y + BUILDING.d, `${source}>${target} leaves the building`);
      }
    }
  });

  it('rounds every corner into several points', () => {
    for (const { corners, path } of CABLES) assert.ok(path.length > corners.length);
  });
});

describe('cablesSvg', () => {
  const svg = cablesSvg();

  it('draws a glow stroke under a core stroke in each cable, tagged with its two rooms', () => {
    assert.equal(svg.match(/<g data-cable=""/g)?.length, CABLES.length);
    assert.ok(svg.includes('<g data-cable="" data-from="gam" data-to="dpi" data-flow="0" style="--room: #0284c7"><path class="cable-glow" d="M'));
    assert.equal(svg.match(/data-flow="\d+"/g)?.length, CABLES.length);
    assert.equal(svg.match(/class="cable-glow" d="([^"]+)"\/><path class="cable-core" d="\1"/g)?.length, CABLES.length);
  });

  it('puts every cable on the floor at the cable height, never on the kit line class', () => {
    assert.ok(CABLE_HEIGHT > 0 && CABLE_HEIGHT < 1);
    assert.ok(!svg.includes('iso-line'));
  });

  it('is followed by the empty layer the packets are drawn into', () => {
    assert.ok(svg.endsWith('<g data-packets=""></g>'));
  });
});
