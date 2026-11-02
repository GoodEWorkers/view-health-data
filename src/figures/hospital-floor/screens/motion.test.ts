import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { easeOut, mixQuads, ranksFrom } from './motion.ts';

describe('easeOut', () => {
  it('starts at 0 and ends at 1', () => {
    assert.ok(Math.abs(easeOut(0)) < 1e-9);
    assert.ok(Math.abs(easeOut(1) - 1) < 1e-9);
  });

  it('rises monotonically and front-loads the motion', () => {
    const samples = Array.from({ length: 21 }, (_, index) => easeOut(index / 20));
    samples.slice(1).forEach((sample, index) => assert.ok(sample >= samples[index]!, `step ${index}`));
    assert.ok(easeOut(0.25) > 0.25 && easeOut(0.5) > 0.7);
  });

  it('clamps outside the unit interval', () => {
    assert.deepEqual([easeOut(-1), easeOut(2)].map(Math.round), [0, 1]);
  });
});

describe('ranksFrom', () => {
  const centres = [[0, 0], [10, 0], [3, 0], [100, 0]] as const;

  it('gives the origin rank 0 and the others their order of distance from it', () => {
    assert.deepEqual(ranksFrom(centres, 1), [2, 0, 1, 3]);
  });

  it('breaks ties by position in the list, so every rank is used once', () => {
    assert.deepEqual(ranksFrom([[0, 0], [5, 0], [-5, 0]], 0), [0, 1, 2]);
  });

  it('starts from the first room when the origin is unknown', () => {
    assert.equal(ranksFrom(centres, 9)[0], 0);
  });
});

describe('mixQuads', () => {
  const from = [[0, 0], [2, 0], [2, 2], [0, 2]] as const;
  const to = [[10, 10], [20, 10], [20, 30], [10, 30]] as const;

  it('returns the ends at 0 and 1 and the middle between', () => {
    assert.deepEqual(mixQuads(from, to, 0), from);
    assert.deepEqual(mixQuads(from, to, 1), to);
    assert.deepEqual(mixQuads(from, to, 0.5)[2], [11, 16]);
  });
});
