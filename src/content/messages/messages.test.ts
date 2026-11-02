import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId } from '../departments.ts';
import { MAX_COLUMNS, MAX_LINES, editorLines } from '../editorLines.ts';
import { IMAGING_WORKLIST, LAB_RESULTS, MOCK_PATIENT, PATIENT_APPOINTMENT, PRESCRIPTION_LINES } from '../screenMocks.ts';
import { PLACEHOLDER } from './operativeReport.ts';
import { EDITOR_FILES } from './index.ts';
import { INS_AUTHORITY, INS_DIGITS } from './hl7.ts';

const HL7_IDS: readonly DepartmentId[] = ['gam', 'rdv', 'sgl', 'pharmacie', 'bloc'];
const MESSAGE_TYPES: Readonly<Record<string, string>> = {
  gam: 'ADT^A01^ADT_A01',
  rdv: 'SIU^S12^SIU_S12',
  sgl: 'ORU^R01^ORU_R01',
  pharmacie: 'RDE^O11^RDE_O11',
  bloc: 'MDM^T02^MDM_T02',
};
const SEGMENT_ORDER: Readonly<Record<string, readonly string[]>> = {
  gam: ['MSH', 'EVN', 'PID', 'PV1', 'ZBE'],
  rdv: ['MSH', 'SCH', 'PID', 'RGS', 'AIS', 'AIP'],
  sgl: ['MSH', 'PID', 'OBR', 'OBX', 'OBX', 'OBX', 'OBX', 'OBX', 'OBX'],
  pharmacie: ['MSH', 'PID', 'ORC', 'RXE', 'RXR', 'ORC', 'RXE', 'RXR'],
  bloc: ['MSH', 'EVN', 'PID', 'PV1', 'TXA', 'OBX'],
};
const FILE_NAMES = [
  'ADT_A01_DURAND.hl7',
  'SIU_S12_DURAND.hl7',
  'LettreLiaison_DURAND.xml',
  'ORU_R01_DURAND.hl7',
  'CT_THORAX_DURAND.dcm',
  'RDE_O11_DURAND.hl7',
  'MDM_T02_DURAND.hl7',
  'Patient_DURAND.fhir.json',
];

const segmentsOf = (id: DepartmentId): string[][] => EDITOR_FILES[id].text.split('\n').map((line) => line.split('|'));
const field = (segment: readonly string[], number: number): string => segment[number] ?? '';

describe('EDITOR_FILES', () => {
  it('holds one file per service, with the eight names of the Données layer', () => {
    assert.deepEqual(DEPARTMENTS.map(({ id }) => EDITOR_FILES[id].name), FILE_NAMES);
  });

  it('keeps every line within 56 characters and every file within 16 lines once displayed', () => {
    for (const { id } of DEPARTMENTS) {
      const lines = editorLines(EDITOR_FILES[id]);
      assert.ok(lines.length <= MAX_LINES, `${id} has ${lines.length} lines`);
      lines.forEach(({ text }) => assert.ok(text.length <= MAX_COLUMNS, `${id}: "${text}" is ${text.length} characters`));
    }
  });

  it('tells the story of one synthetic patient: every file carries the name of the mocks', () => {
    for (const { id } of DEPARTMENTS) assert.ok(EDITOR_FILES[id].text.includes(MOCK_PATIENT.lastName), id);
  });
});

describe('the HL7 v2 messages', () => {
  it('start with an MSH that has the right message type in MSH-9, the HL7 2.5 family and the encoding characters', () => {
    for (const id of HL7_IDS) {
      const [header] = segmentsOf(id);
      assert.equal(header![0], 'MSH', id);
      assert.equal(field(header!, 1), '^~\\&', `${id} encoding characters`);
      assert.equal(field(header!, 8), MESSAGE_TYPES[id], id);
      assert.ok(field(header!, 11).startsWith('2.5'), `${id} version`);
    }
  });

  it('hold the segments of their trigger event, in order', () => {
    for (const id of HL7_IDS) assert.deepEqual(segmentsOf(id).map(([segmentId]) => segmentId), SEGMENT_ORDER[id], id);
  });

  it('write the ADT^A01 the way IHE France PAM does: version 2.5^FRA^2.11, INS in PID-3 under the French authority, unit and bed in PV1, ZBE movement', () => {
    const [header, , pid, pv1, zbe] = segmentsOf('gam') as [string[], string[], string[], string[], string[]];
    assert.equal(field(header, 11), '2.5^FRA^2.11');
    assert.equal(field(header, 20), '2.11^IHE_FRANCE-2.11-PAM');
    assert.ok(field(pid, 3).includes(`${INS_DIGITS}^^^${INS_AUTHORITY}^INS`));
    assert.equal(field(pv1, 3).split('^').slice(0, 3).join('^'), `CARDIO^${MOCK_PATIENT.room}^${MOCK_PATIENT.bedLetter}`);
    assert.equal(field(pv1, 7).split('^')[0], MOCK_PATIENT.physicianName);
    assert.ok(field(pv1, 19).startsWith(MOCK_PATIENT.stay));
    assert.equal(field(zbe, 4), 'INSERT');
    assert.ok(field(zbe, 7).includes('^UF^'));
  });

  it('identify the patient the same way in every message: INS, name, birth date and sex from the mocks', () => {
    for (const id of HL7_IDS) {
      const pid = segmentsOf(id).find(([segmentId]) => segmentId === 'PID')!;
      assert.ok(field(pid, 3).includes(MOCK_PATIENT.patientId) && field(pid, 3).includes(INS_DIGITS), id);
      assert.ok(field(pid, 5).startsWith(`${MOCK_PATIENT.lastName}^${MOCK_PATIENT.firstName}`), id);
      assert.equal(field(pid, 7), MOCK_PATIENT.birthStamp, id);
      assert.equal(field(pid, 8), 'M', id);
    }
  });

  it('keep the INS a 15-digit number that no real person can hold: its month is 99', () => {
    assert.match(INS_DIGITS, /^\d{15}$/);
    assert.equal(INS_DIGITS.slice(3, 5), '99');
  });

  it('book the consultation of the agenda in the SIU^S12: SCH timing, AIS service and AIP physician', () => {
    const [, sch, , , ais, aip] = segmentsOf('rdv') as string[][];
    assert.equal(field(sch!, 11), `^^${PATIENT_APPOINTMENT.minutes}^${PATIENT_APPOINTMENT.stamp}`);
    assert.equal(field(ais!, 4), PATIENT_APPOINTMENT.stamp);
    assert.ok(field(aip!, 3).startsWith(MOCK_PATIENT.physicianName));
  });

  it('carry one OBX per GLIMS result with its value, unit, reference range and flag', () => {
    const observations = segmentsOf('sgl').filter(([segmentId]) => segmentId === 'OBX');
    assert.equal(observations.length, LAB_RESULTS.length);
    observations.forEach((obx, index) => {
      const { analysis, value, unit, flag } = LAB_RESULTS[index]!;
      assert.equal(field(obx, 2), 'NM');
      assert.ok(field(obx, 3).includes(`^${analysis}^LN`));
      assert.equal(field(obx, 5), value.replace(',', '.'));
      assert.equal(field(obx, 6), unit);
      assert.equal(field(obx, 8), flag === 'B' ? 'L' : (flag ?? ''));
      assert.equal(field(obx, 11), 'F');
    });
  });

  it('write the reference ranges with decimal points, as HL7 numbers', () => {
    const ranges = segmentsOf('sgl').filter(([segmentId]) => segmentId === 'OBX').map((obx) => field(obx, 7));
    assert.deepEqual(ranges, ['13.0-17.0', '4.0-10.0', '<5', '62-106', '3.5-5.0', '3.9-6.1']);
  });

  it('encode the two interacting drugs of the pharmacy screen, each with an ORC, an RXE with its ATC code and an RXR route', () => {
    const encoded = segmentsOf('pharmacie');
    const drugs = encoded.filter(([segmentId]) => segmentId === 'RXE').map((rxe) => field(rxe, 2));
    assert.deepEqual(drugs, ['J01CA04^Amoxicilline^ATC', 'B01AA03^Warfarine^ATC']);
    assert.ok(PRESCRIPTION_LINES.some(({ atc }) => atc === 'J01CA04'));
    encoded.filter(([segmentId]) => segmentId === 'RXR').forEach((rxr) => assert.ok(field(rxr, 1).startsWith('PO^')));
  });

  it('carry the compte-rendu opératoire as an ED observation whose payload is a marked placeholder', () => {
    const observation = segmentsOf('bloc').find(([segmentId]) => segmentId === 'OBX')!;
    assert.equal(field(observation, 2), 'ED');
    assert.ok(field(observation, 5).includes(PLACEHOLDER));
    const txa = segmentsOf('bloc').find(([segmentId]) => segmentId === 'TXA')!;
    assert.equal(field(txa, 17), 'AU');
  });
});

describe('the CDA R2 lettre de liaison', () => {
  const { text } = EDITOR_FILES.dpi;

  it('is balanced XML under a ClinicalDocument root', () => {
    const open: string[] = [];
    for (const [, closing, name, selfClosing] of text.matchAll(/<(\/?)([\w:.-]+)[^>]*?(\/?)>/g)) {
      if (selfClosing) continue;
      if (closing) assert.equal(open.pop(), name, `</${name}> closes the wrong tag`);
      else open.push(name!);
    }
    assert.deepEqual(open, []);
    assert.ok(text.startsWith('<ClinicalDocument ') && text.endsWith('</ClinicalDocument>'));
  });

  it('names a template, the INS of the patient under the French authority, an author and one section with one paragraph', () => {
    assert.match(text, /<templateId root="[\d.]+"\/>/);
    assert.ok(text.includes(`extension="${INS_DIGITS}"`) && text.includes('root="1.2.250.1.213.1.4.10"'));
    assert.ok(text.includes('<author>') && text.includes(MOCK_PATIENT.physician));
    assert.equal(text.match(/<section>/g)?.length, 1);
    assert.equal(text.match(/<paragraph>/g)?.length, 1);
  });
});

describe('the DICOM listing', () => {
  const lines = EDITOR_FILES['pacs-ris'].text.split('\n');

  it('lists 14 to 18 tags, each line starting with a (gggg,eeee) tag', () => {
    assert.ok(lines.length >= 14 && lines.length <= 18);
    lines.forEach((line) => assert.match(line, /^\(\w{4},\w{4}\)/));
  });

  it('describes the CT thorax of the worklist for the synthetic patient', () => {
    const text = lines.join('\n');
    assert.ok(text.includes(`(0010,0010) PN [${MOCK_PATIENT.lastName}^${MOCK_PATIENT.firstName}]`));
    assert.ok(text.includes('(0008,0060) CS [CT]'));
    assert.ok(text.includes(`[${IMAGING_WORKLIST[0]!.accession}]`));
    assert.ok(text.includes(`[${IMAGING_WORKLIST[0]!.exam}]`));
    assert.ok(text.includes(`[${MOCK_PATIENT.birthStamp}]`));
  });
});

type FhirPatient = {
  resourceType: 'Patient';
  identifier: { use: string; system: string; value: string; type: { coding: { code: string }[] } }[];
  name: { family: string; given: string[] }[];
  birthDate: string;
};
type FhirEncounter = {
  resourceType: 'Encounter';
  class: { code: string };
  period: { start: string };
  location: { location: { display: string } }[];
  subject: { reference: string };
};

describe('the FHIR R4 bundle', () => {
  const bundle = JSON.parse(EDITOR_FILES.eai.text) as { resourceType: string; type: string; entry: [{ resource: FhirPatient }, { resource: FhirEncounter }] };

  it('parses as JSON: a Bundle of a Patient and an Encounter', () => {
    assert.equal(bundle.resourceType, 'Bundle');
    assert.deepEqual(bundle.entry.map(({ resource }) => resource.resourceType), ['Patient', 'Encounter']);
  });

  it('gives the Patient the INS under the French FR Core test system, a name and a birth date', () => {
    const patient = bundle.entry[0].resource;
    assert.deepEqual([patient.identifier[0].system, patient.identifier[0].value, patient.identifier[0].use], ['urn:oid:1.2.250.1.213.1.4.10', INS_DIGITS, 'official']);
    assert.equal(patient.identifier[0].type.coding[0].code, 'INS-NIR-TEST');
    assert.deepEqual(patient.name[0], { family: MOCK_PATIENT.lastName, given: [MOCK_PATIENT.firstName] });
    assert.equal(patient.birthDate, MOCK_PATIENT.birthIso);
  });

  it('gives the Encounter an inpatient class, a period from the admission and the bed', () => {
    const encounter = bundle.entry[1].resource;
    assert.equal(encounter.class.code, 'IMP');
    assert.equal(encounter.period.start, MOCK_PATIENT.entryIso);
    assert.equal(encounter.location[0].location.display, MOCK_PATIENT.bed);
    assert.equal(encounter.subject.reference, `Patient/${MOCK_PATIENT.patientId}`);
  });
});
