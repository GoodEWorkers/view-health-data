// PACS/RIS: a dcmdump-style listing of the CT thorax of the worklist's first exam: patient, study and image tags, with the accession number of the worklist.

import { IMAGING_WORKLIST, MOCK_PATIENT } from '../screenMocks.ts';

const FIRST_EXAM = IMAGING_WORKLIST[0]!;

type Tag = readonly [tag: string, vr: string, value: string, name: string];

const TAGS: readonly Tag[] = [
  ['(0008,0005)', 'CS', 'ISO_IR 100', 'SpecificCharacterSet'],
  ['(0008,0020)', 'DA', MOCK_PATIENT.entryStamp.slice(0, 8), 'StudyDate'],
  ['(0008,0030)', 'TM', `${FIRST_EXAM.time.replace(':', '')}00`, 'StudyTime'],
  ['(0008,0050)', 'SH', FIRST_EXAM.accession, 'AccessionNumber'],
  ['(0008,0060)', 'CS', 'CT', 'Modality'],
  ['(0008,0090)', 'PN', `${MOCK_PATIENT.physicianName}^${MOCK_PATIENT.physicianFirstName}`, 'ReferringPhysicianName'],
  ['(0008,1030)', 'LO', FIRST_EXAM.exam, 'StudyDescription'],
  ['(0010,0010)', 'PN', `${MOCK_PATIENT.lastName}^${MOCK_PATIENT.firstName}`, 'PatientName'],
  ['(0010,0020)', 'LO', MOCK_PATIENT.patientId, 'PatientID'],
  ['(0010,0030)', 'DA', MOCK_PATIENT.birthStamp, 'PatientBirthDate'],
  ['(0010,0040)', 'CS', 'M', 'PatientSex'],
  ['(0018,0050)', 'DS', '1.25', 'SliceThickness'],
  ['(0020,0011)', 'IS', '2', 'SeriesNumber'],
  ['(0028,0010)', 'US', '512', 'Rows'],
  ['(0028,0011)', 'US', '512', 'Columns'],
];

export const imagingDump = (): string =>
  TAGS.map(([tag, vr, value, name]) => `${tag} ${vr} [${value}] # ${name}`).join('\n');
