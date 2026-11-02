import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CDA_ENTRIES } from './cda.ts';
import { DICOM_ENTRIES } from './dicom.ts';
import { FHIR_ENTRIES } from './fhir.ts';
import { HL7_ENTRIES } from './hl7.ts';
import { renderValue } from '../decode/render.ts';
import { ALL_ENTRIES, lookup } from './index.ts';

describe('the dictionary', () => {
  it('has no ref twice', () => {
    const refs = ALL_ENTRIES.map(({ ref }) => ref);
    assert.deepEqual(refs.filter((ref, position) => refs.indexOf(ref) !== position), []);
  });

  it('gives every entry a French label', () => {
    for (const { ref, label } of ALL_ENTRIES) assert.ok(label.trim().length > 0, ref);
  });

  it('explains every segment, field, tag, element and key (values may go without)', () => {
    const described = [...HL7_ENTRIES, ...DICOM_ENTRIES.filter(({ ref }) => !ref.includes(':')), ...CDA_ENTRIES, ...FHIR_ENTRIES.filter(({ ref }) => !ref.includes(':'))];
    for (const { ref, explain } of described) assert.ok((explain ?? '').length > 0, ref);
  });

  it('names the fifteen HL7 segments of the eight files', () => {
    const segments = ['MSH', 'EVN', 'PID', 'PV1', 'ZBE', 'SCH', 'RGS', 'AIS', 'AIP', 'OBR', 'OBX', 'ORC', 'RXE', 'RXR', 'TXA'];
    segments.forEach((segment) => assert.ok(lookup(segment), segment));
  });

  it('names the fifteen DICOM tags of the listing, with the tag as ref', () => {
    assert.equal(DICOM_ENTRIES.filter(({ ref }) => /^\(\w{4},\w{4}\)$/.test(ref)).length, 15);
  });

  it('names only render kinds the decoder can draw', () => {
    const kinds = new Set(ALL_ENTRIES.flatMap(({ render }) => (render ? [render] : [])));
    kinds.forEach((kind) => assert.doesNotThrow(() => renderValue(kind, 'x', { fields: [] }), kind));
  });
});
