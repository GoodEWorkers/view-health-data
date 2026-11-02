// The eight files the Données layer opens in the windows, one per service, all about the same synthetic patient.

import type { DepartmentId } from '../departments.ts';
import type { EditorFormat } from '../syntax.ts';
import { admissionMessage } from './admission.ts';
import { appointmentMessage } from './appointment.ts';
import { patientBundle } from './bundle.ts';
import { imagingDump } from './imaging.ts';
import { liaisonDocument } from './liaison.ts';
import { operativeReportMessage } from './operativeReport.ts';
import { prescriptionMessage } from './prescription.ts';
import { MAIN_RANGES, RANGES } from './ranges.ts';
import type { EditorRange } from './ranges.ts';
import { resultsMessage } from './results.ts';

export type EditorFile = {
  readonly name: string;
  readonly format: EditorFormat;
  readonly badge: string;
  readonly text: string;
  readonly ranges: readonly EditorRange[];
  readonly mainRange: string;
};

type Draft = Omit<EditorFile, 'ranges' | 'mainRange'>;

const withRanges = (id: DepartmentId, draft: Draft): EditorFile => ({ ...draft, ranges: RANGES[id], mainRange: MAIN_RANGES[id] });

const HL7_BADGE = 'HL7 v2.5';

export const EDITOR_FILES: Readonly<Record<DepartmentId, EditorFile>> = {
  gam: withRanges('gam', { name: 'ADT_A01_DURAND.hl7', format: 'hl7', badge: HL7_BADGE, text: admissionMessage() }),
  rdv: withRanges('rdv', { name: 'SIU_S12_DURAND.hl7', format: 'hl7', badge: HL7_BADGE, text: appointmentMessage() }),
  dpi: withRanges('dpi', { name: 'LettreLiaison_DURAND.xml', format: 'xml', badge: 'CDA R2', text: liaisonDocument() }),
  sgl: withRanges('sgl', { name: 'ORU_R01_DURAND.hl7', format: 'hl7', badge: HL7_BADGE, text: resultsMessage() }),
  'pacs-ris': withRanges('pacs-ris', { name: 'CT_THORAX_DURAND.dcm', format: 'dicom', badge: 'DICOM', text: imagingDump() }),
  pharmacie: withRanges('pharmacie', { name: 'RDE_O11_DURAND.hl7', format: 'hl7', badge: HL7_BADGE, text: prescriptionMessage() }),
  bloc: withRanges('bloc', { name: 'MDM_T02_DURAND.hl7', format: 'hl7', badge: HL7_BADGE, text: operativeReportMessage() }),
  eai: withRanges('eai', { name: 'Patient_DURAND.fhir.json', format: 'json', badge: 'FHIR R4', text: patientBundle() }),
};
