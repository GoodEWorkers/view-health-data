import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { towardViewer } from '../../iso/iso-kit.ts';
import type { Plane } from '../../iso/iso-kit.ts';
import { hospitalFloorCard } from './build.ts';
import { PROJECTION, VIEW_BOX, at } from './camera.ts';
import { BUILDING, SIDE_NORMALS, TALL_WALL, WALL_THICKNESS, wallHeightAt } from './model.ts';
import type { Side } from './model.ts';

const MAX_SLOPE_DEGREES = 1;
const EDGE_ON_TOLERANCE = 0.01;
const MIN_PADDING = 16;
const MIN_FACING_SHARE = 0.9;
const SIDES: readonly Side[] = ['front', 'back', 'left', 'right'];
const HALF_WALL = WALL_THICKNESS / 2;

const OUTER_WALL_CENTRES: Record<Side, Plane> = {
  front: [BUILDING.x + BUILDING.w - HALF_WALL, 0],
  back: [BUILDING.x + HALF_WALL, 0],
  left: [0, BUILDING.y + BUILDING.d - HALF_WALL],
  right: [0, BUILDING.y + HALF_WALL],
};

const facing = ([nx, ny]: Plane): number => {
  const [vx, vy] = towardViewer(PROJECTION);
  return nx * vx + ny * vy;
};

const drawnBounds = (): { left: number; right: number; top: number; bottom: number } => {
  const card = hospitalFloorCard();
  const figure = card.slice(card.indexOf('<svg xmlns'), card.indexOf('</svg>'));
  const numbers = [...figure.matchAll(/ d="([^"]*)"/g)].flatMap(([, path]) => (path!.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
};

describe('camera', () => {
  it('runs the near long wall across the screen within the slope limit', () => {
    const nearY = BUILDING.y + BUILDING.d;
    const [fromX, fromY] = at([BUILDING.x, nearY, 0]);
    const [toX, toY] = at([BUILDING.x + BUILDING.w, nearY, 0]);
    const slope = (Math.atan2(toY - fromY, toX - fromX) * 180) / Math.PI;
    assert.ok(Math.abs(slope) <= MAX_SLOPE_DEGREES, `slope ${slope.toFixed(1)} degrees`);
  });

  it('turns the +y face to the viewer and the +x face edge-on', () => {
    assert.ok(facing(SIDE_NORMALS.left) >= MIN_FACING_SHARE);
    assert.ok(Math.abs(facing(SIDE_NORMALS.front)) < EDGE_ON_TOLERANCE);
  });

  it('makes exactly the outer walls on the far sides tall', () => {
    for (const side of SIDES) {
      const isFar = facing(SIDE_NORMALS[side]) < -EDGE_ON_TOLERANCE;
      assert.equal(wallHeightAt(OUTER_WALL_CENTRES[side]) === TALL_WALL, isFar, side);
    }
  });

  it('keeps everything drawn inside the view box with a padding', () => {
    const { left, right, top, bottom } = drawnBounds();
    const pads = [left, VIEW_BOX.width - right, top, VIEW_BOX.height - bottom];
    assert.ok(Math.min(...pads) >= MIN_PADDING, pads.map((pad) => pad.toFixed(1)).join(' '));
  });
});
