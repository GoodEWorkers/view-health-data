import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { INSPECTIONS } from './index.ts';
import type { Inspection } from './index.ts';
import { initialRefs } from './selection.ts';

const byId = (id: string): Inspection => INSPECTIONS.find((inspection) => inspection.id === id)!;
const rowCodes = (inspection: Inspection, refs: readonly string[]): string[] =>
  inspection.cards.flatMap(({ rows }) => rows).filter(({ ref }) => refs.includes(ref)).map(({ code }) => code);

describe('initialRefs', () => {
  it('selects the whole PID block when the main range is the PID line', () => {
    const gam = byId('gam');
    assert.deepEqual(gam.initial, [gam.cards[2]!.ref]);
  });

  it('selects the six OBX blocks of the results range', () => {
    const sgl = byId('sgl');
    assert.deepEqual(sgl.initial, sgl.cards.filter(({ code }) => code === 'OBX').map(({ ref }) => ref));
  });

  it('selects only the rows inside the range when the range cuts a block', () => {
    assert.deepEqual(rowCodes(byId('eai'), byId('eai').initial), ['Patient.identifier.system', 'Patient.identifier.value']);
    assert.deepEqual(rowCodes(byId('pacs-ris'), byId('pacs-ris').initial), ['(0008,0050)', '(0008,0060)']);
  });

  it('selects the paragraph row of the CDA body range', () => {
    assert.deepEqual(rowCodes(byId('dpi'), byId('dpi').initial).map((code) => code.split('/').at(-1)), ['paragraph']);
  });

  it('selects nothing for a range with no line', () => {
    assert.deepEqual(initialRefs(byId('gam'), [99, 99]), []);
  });

  it('selects a block of the file for every service', () => {
    for (const { id, initial } of INSPECTIONS) assert.ok(initial.length > 0, id);
  });
});
