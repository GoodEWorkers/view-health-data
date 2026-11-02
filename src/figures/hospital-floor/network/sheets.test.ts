import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../../content/departments.ts';
import { CABLES } from '../cables.ts';
import { FLOW_ENTRIES, flowKey, zoneLook } from './sheets.ts';

const TOTAL = DEPARTMENTS.reduce((sum, { flows, network }) => sum + flows.length + network.externalFlows.length, 0);

describe('FLOW_ENTRIES', () => {
  it('holds one entry per flow with a key nobody else has', () => {
    assert.equal(FLOW_ENTRIES.length, TOTAL);
    assert.equal(new Set(FLOW_ENTRIES.map(({ key }) => key)).size, TOTAL);
  });

  it('carries the keys the cables of the floor carry, so a click finds its sheet', () => {
    const cableKeys = CABLES.map(({ source, flow }) => flowKey(source, flow.payload)).sort();
    assert.deepEqual(FLOW_ENTRIES.map(({ key }) => key).sort(), cableKeys);
  });

  it('keeps each room together, its internal flows before its external ones', () => {
    for (const { id, flows, network } of DEPARTMENTS) {
      const keys = FLOW_ENTRIES.filter(({ room }) => room === id).map(({ key, external }) => `${external ? 'x' : 'i'}:${key}`);
      const expected = [...flows.map(({ payload }) => `i:${flowKey(id, payload)}`), ...network.externalFlows.map(({ payload }) => `x:${flowKey(id, payload)}`)];
      assert.deepEqual(keys, expected);
    }
  });

  it('writes a title and a list of hops for each sheet, and the colour of the cable family', () => {
    for (const { sheet, family } of FLOW_ENTRIES) assert.ok(sheet.title.includes('→') && sheet.hops.length >= 3 && family.colour.startsWith('#'));
  });
});

describe('zoneLook', () => {
  it('names a zone and gives its colour, and the edge a neutral look', () => {
    assert.deepEqual(zoneLook('dmz'), { label: 'DMZ', colour: '#a42b10' });
    assert.equal(zoneLook('edge').label, 'Bordure du réseau');
    assert.equal(zoneLook(undefined), zoneLook('edge'));
  });
});
