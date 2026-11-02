import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { homographyOfQuad, matrix3dOf } from './homography.ts';
import type { Corner, Quad } from './homography.ts';

const TOLERANCE = 1e-6;
const BOX = { width: 200, height: 100 };
const SKEWED: Quad = [[12, 20], [150, 14], [172, 92], [24, 78]];
const PARALLELOGRAM: Quad = [[10, 20], [110, 30], [130, 80], [30, 70]];
const BOX_CORNERS: readonly Corner[] = [[0, 0], [BOX.width, 0], [BOX.width, BOX.height], [0, BOX.height]];

function applyMatrix3d(matrix: string, [x, y]: Corner): Corner {
  const [m11, m12, , m14, m21, m22, , m24, , , , , m41, m42, , m44] = matrix.slice('matrix3d('.length, -1).split(',').map(Number) as number[];
  const scale = m14! * x + m24! * y + m44!;
  return [(m11! * x + m21! * y + m41!) / scale, (m12! * x + m22! * y + m42!) / scale];
}

const assertClose = (actual: Corner, expected: Corner, message: string): void => {
  assert.ok(Math.abs(actual[0] - expected[0]) < TOLERANCE && Math.abs(actual[1] - expected[1]) < TOLERANCE, `${message}: ${actual} is not ${expected}`);
};

describe('matrix3dOf', () => {
  it('sends the four corners of the box to the four corners of a skewed quad', () => {
    const matrix = matrix3dOf(BOX.width, BOX.height, SKEWED);
    BOX_CORNERS.forEach((corner, index) => assertClose(applyMatrix3d(matrix, corner), SKEWED[index]!, `corner ${index}`));
  });

  it('sends the middle of the box to where the diagonals of the quad cross', () => {
    const [first, second, third, fourth] = SKEWED;
    const slopeOf = ([fromX, fromY]: Corner, [toX, toY]: Corner) => (toY - fromY) / (toX - fromX);
    const [slopeA, slopeB] = [slopeOf(first, third), slopeOf(second, fourth)];
    const crossX = (second[1] - first[1] + slopeA * first[0] - slopeB * second[0]) / (slopeA - slopeB);
    const crossY = first[1] + slopeA * (crossX - first[0]);
    assertClose(applyMatrix3d(matrix3dOf(BOX.width, BOX.height, SKEWED), [BOX.width / 2, BOX.height / 2]), [crossX, crossY], 'diagonals');
  });

  it('is the identity for a quad that is the box itself', () => {
    const matrix = matrix3dOf(BOX.width, BOX.height, [[0, 0], [BOX.width, 0], [BOX.width, BOX.height], [0, BOX.height]]);
    assert.equal(matrix, 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)');
  });

  it('stays affine, with no perspective term, for a parallelogram', () => {
    const [, , , , , , g, h] = homographyOfQuad(PARALLELOGRAM);
    assert.deepEqual([g, h], [0, 0]);
    const matrix = matrix3dOf(BOX.width, BOX.height, PARALLELOGRAM);
    BOX_CORNERS.forEach((corner, index) => assertClose(applyMatrix3d(matrix, corner), PARALLELOGRAM[index]!, `corner ${index}`));
  });

  it('carries a perspective term for a trapezoid', () => {
    const [, , , , , , g] = homographyOfQuad([[20, 0], [80, 0], [100, 50], [0, 50]]);
    assert.notEqual(g, 0);
  });

  it('refuses a quad whose corners are collinear', () => {
    assert.throws(() => homographyOfQuad([[0, 0], [10, 10], [20, 20], [5, 5]]), /collinear/);
  });
});
