import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MOCK_PATIENT } from '../screenMocks.ts';
import { INSPECTIONS } from './index.ts';

const GAM_SUMMARY = 'Ce message annonce l\'admission de Martin DURAND en cardiologie, lit 214-B.';

describe('the summaries', () => {
  it('say in one sentence what the GAM file is', () => {
    assert.equal(INSPECTIONS[0]!.summary, GAM_SUMMARY);
  });

  it('name the synthetic patient in every file and end with a full stop', () => {
    for (const { id, summary } of INSPECTIONS) {
      assert.ok(summary.includes(`${MOCK_PATIENT.firstName} ${MOCK_PATIENT.lastName}`), id);
      assert.ok(summary.endsWith('.'), id);
    }
  });

  it('count the abnormal lab results from the mocks', () => {
    const sgl = INSPECTIONS.find(({ id }) => id === 'sgl')!;
    assert.ok(sgl.summary.includes('dont 2 hors des valeurs de référence : hémoglobine basse, CRP élevée'));
  });
});

describe('the travel lines', () => {
  const travelOf = (id: string): readonly string[] => INSPECTIONS.find((inspection) => inspection.id === id)!.travel;

  it('say where an HL7 v2 message goes, over which format and transport', () => {
    assert.deepEqual(travelOf('gam'), ['Envoyé au DPI et à l\'EAI · HL7 v2 · MLLP']);
  });

  it('give one line per transport for the DICOM flows', () => {
    assert.deepEqual(travelOf('pacs-ris'), ['Envoyé au DPI · DICOM WADO-RS · HTTPS', 'Envoyé à l\'EAI · DICOM C-STORE']);
  });

  it('send the CDA letter to the DMP and by MSSanté', () => {
    assert.deepEqual(travelOf('dpi'), ['Envoyé au DMP / Mon espace santé · CDA R2 · HTTPS', 'Envoyé par MSSanté · CDA R2 · SMTP']);
  });

  it('give every file at least one line', () => {
    for (const { id, travel } of INSPECTIONS) assert.ok(travel.length > 0, id);
  });
});
