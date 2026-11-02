import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId } from '../departments.ts';
import { EDITOR_FILES } from './index.ts';
import { ALL_FLOWS, FLOW_RANGE_KEYS, MAIN_RANGES, MAX_LABEL, RANGES, flowKey, rangesOfFlow } from './ranges.ts';

const IDS = DEPARTMENTS.map(({ id }) => id);
const linesOf = (id: DepartmentId, key: string): string[] => {
  const { lines: [from, to] } = RANGES[id].find((range) => range.key === key)!;
  return EDITOR_FILES[id].text.split('\n').slice(from - 1, to);
};

describe('the named ranges', () => {
  it('lie inside their file, in order, with unique keys and a main range that exists', () => {
    for (const id of IDS) {
      const count = EDITOR_FILES[id].text.split('\n').length;
      const keys = RANGES[id].map(({ key }) => key);
      assert.equal(new Set(keys).size, keys.length, `${id} keys`);
      assert.ok(keys.includes(MAIN_RANGES[id]), `${id} main range`);
      for (const { key, lines: [from, to] } of RANGES[id]) assert.ok(from >= 1 && from <= to && to <= count, `${id}/${key} lines ${from}-${to} of ${count}`);
    }
  });

  it('carry a label of at most 18 characters', () => {
    assert.equal(MAX_LABEL, 18);
    for (const id of IDS) for (const { key, label } of RANGES[id]) assert.ok(label.length > 0 && label.length <= MAX_LABEL, `${id}/${key}: "${label}"`);
  });

  it('are the lines they say: the PID, the movement, the OBX results, the INS identifier, the accession', () => {
    assert.ok(linesOf('gam', 'identity')[0]!.startsWith('PID|'));
    assert.ok(linesOf('gam', 'movement')[0]!.startsWith('ZBE|'));
    assert.ok(linesOf('gam', 'stay')[0]!.startsWith('PV1|'));
    assert.equal(linesOf('sgl', 'results').length, 6);
    assert.ok(linesOf('sgl', 'results').every((line) => line.startsWith('OBX|')));
    assert.ok(linesOf('eai', 'identifier').join('').includes('"system"') && linesOf('eai', 'identifier').join('').includes('"value"'));
    assert.ok(linesOf('dpi', 'patient').join('').includes('extension="'));
    assert.ok(linesOf('pacs-ris', 'study').join('').includes('AccessionNumber'));
    assert.ok(linesOf('pharmacie', 'amoxicillin')[0]!.startsWith('RXE|') && linesOf('pharmacie', 'amoxicillin')[0]!.includes('Amoxicilline'));
    assert.ok(linesOf('pharmacie', 'warfarin')[0]!.includes('Warfarine'));
    assert.ok(linesOf('bloc', 'document')[0]!.startsWith('TXA|'));
    assert.ok(linesOf('rdv', 'booking')[0]!.startsWith('SCH|'));
  });
});

describe('flows and ranges', () => {
  it('resolves every flow of every service to an existing range of its source file', () => {
    assert.equal(ALL_FLOWS.length, 24);
    for (const { from, flow } of ALL_FLOWS) {
      const { source, target } = rangesOfFlow(from, flow);
      assert.ok(RANGES[from].some(({ key }) => key === source), `${flowKey(from, flow)} -> ${source}`);
      if (target !== undefined) assert.ok(RANGES[flow.to].some(({ key }) => key === target), `${flowKey(from, flow)} lights ${target} in ${flow.to}`);
    }
  });

  it('falls back to the main range of the source for a flow with no entry of its own, which need not be its first range', () => {
    const flow = ALL_FLOWS.find(({ from, flow: candidate }) => from === 'dpi' && candidate.payload === 'Observations')!;
    assert.equal(FLOW_RANGE_KEYS[flowKey(flow.from, flow.flow)], undefined);
    assert.equal(rangesOfFlow(flow.from, flow.flow).source, 'body');
    assert.notEqual(RANGES.dpi[0]!.key, 'body');
  });

  it('keeps one key per flow and no entry for a flow that does not exist', () => {
    const keys = ALL_FLOWS.map(({ from, flow }) => flowKey(from, flow));
    assert.equal(new Set(keys).size, keys.length);
    for (const key of Object.keys(FLOW_RANGE_KEYS)) assert.ok(keys.includes(key), key);
  });

  it('lights the PID in the GAM and the INS of the CDA in the DPI for « Identité patient »', () => {
    const { from, flow } = ALL_FLOWS.find(({ from: id, flow: candidate }) => id === 'gam' && candidate.payload === 'Identité patient')!;
    assert.deepEqual(rangesOfFlow(from, flow), { source: 'identity', target: 'patient' });
  });

  it('lights only the source when the destination declares nothing for the payload', () => {
    const { from, flow } = ALL_FLOWS.find(({ from: id, flow: candidate }) => id === 'gam' && candidate.payload === 'Mouvements')!;
    assert.deepEqual(rangesOfFlow(from, flow), { source: 'movement' });
  });

  it('declares only payloads that a flow into that file carries', () => {
    for (const id of IDS) {
      const arriving = ALL_FLOWS.filter(({ flow }) => flow.to === id).map(({ flow }) => flow.payload);
      for (const { key, receives } of RANGES[id]) for (const payload of receives ?? []) assert.ok(arriving.includes(payload), `${id}/${key} receives "${payload}" that no flow brings`);
    }
  });

  it('gives each payload one range in a destination', () => {
    for (const id of IDS) {
      const payloads = RANGES[id].flatMap(({ receives }) => receives ?? []);
      assert.equal(new Set(payloads).size, payloads.length, id);
    }
  });
});
