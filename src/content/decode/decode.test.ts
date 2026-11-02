import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../departments.ts';
import { MOCK_PATIENT } from '../screenMocks.ts';
import { TOKEN_LEGENDS } from './legend.ts';
import { INSPECTIONS } from './index.ts';
import type { Inspection } from './index.ts';
import { isRowRef, shortCode } from './types.ts';

const byId = (id: string): Inspection => INSPECTIONS.find((inspection) => inspection.id === id)!;
const rowsOf = ({ cards }: Inspection) => cards.flatMap(({ rows }) => rows);
const lineText = ({ indent, units }: Inspection['lines'][number]): string => ' '.repeat(indent) + units.flatMap(({ tokens }) => tokens.map(({ text }) => text)).join('');
const nonEmptyHl7Fields = (text: string): number => text.split('\n').reduce((total, line) => total + line.split('|').slice(1).filter((field) => field !== '').length, 0);

describe('the inspections', () => {
  it('hold one per service, in the order of the floor', () => {
    assert.deepEqual(INSPECTIONS.map(({ id }) => id), DEPARTMENTS.map(({ id }) => id));
  });

  it('resolve every segment, field, tag, element and key of the eight files in the dictionary', () => {
    for (const { id, unresolved } of INSPECTIONS) assert.deepEqual(unresolved, [], id);
  });

  it('rebuild every line of the file exactly from the raw units, nothing folded', () => {
    for (const inspection of INSPECTIONS) {
      assert.deepEqual(inspection.lines.map(lineText), inspection.file.text.split('\n'), inspection.id);
    }
  });

  it('give every non-empty HL7 field a row', () => {
    for (const inspection of INSPECTIONS.filter(({ file }) => file.format === 'hl7')) {
      assert.equal(rowsOf(inspection).length, nonEmptyHl7Fields(inspection.file.text), inspection.id);
    }
  });

  it('link every row to a unit of the raw pane and every unit to a row or a block', () => {
    for (const { id, cards, lines } of INSPECTIONS) {
      const unitRefs = new Set(lines.flatMap(({ units }) => units.flatMap(({ ref }) => (ref ? [ref] : []))));
      const cardRefs = new Set(cards.map(({ ref }) => ref));
      const rowRefs = new Set(cards.flatMap(({ rows }) => rows.map(({ ref }) => ref)));
      rowRefs.forEach((ref) => assert.ok(unitRefs.has(ref), `${id}: row ${ref} has no raw unit`));
      unitRefs.forEach((ref) => assert.ok(isRowRef(ref) ? rowRefs.has(ref) : cardRefs.has(ref), `${id}: unit ${ref} has no card or row`));
    }
  });

  it('give every line a block and every block one tag on its first line', () => {
    for (const { id, cards, lines } of INSPECTIONS) {
      cards.forEach(({ ref, lines: numbers }) => {
        const tagged = lines.filter(({ block, tag }) => block === ref && tag !== null).map(({ number }) => number);
        assert.equal(tagged[0], numbers[0], `${id} ${ref}`);
      });
    }
  });

  it('render no date or time row as digits', () => {
    for (const inspection of INSPECTIONS) {
      rowsOf(inspection).filter(({ label }) => /^(Date|Début|Heure)/.test(label)).forEach(({ value, code }) => assert.ok(!/\d{6,}/.test(value), `${inspection.id} ${code}: ${value}`));
    }
  });
});

describe('the GAM admission', () => {
  const rows = rowsOf(byId('gam'));
  const valueOf = (code: string): string => rows.find((row) => row.code === code)?.value ?? '';

  it('shows the INS, grouped, with its authority', () => {
    assert.ok(valueOf('PID-3').includes(`INS ${MOCK_PATIENT.ins} (autorité INS-NIR test)`));
  });

  it('shows the bed, the room and the unit of the visit', () => {
    assert.equal(valueOf('PV1-3'), 'Cardiologie, chambre 214, lit B');
  });

  it('shows the name, the birth date and the admission date in French', () => {
    assert.equal(valueOf('PID-5'), 'DURAND Martin');
    assert.equal(valueOf('PID-7'), '14 juin 1958');
    assert.equal(valueOf('EVN-2'), '2 novembre 2026, 08:40');
  });

  it('expands the patient class', () => {
    assert.equal(valueOf('PV1-2'), 'Hospitalisation (I)');
  });

  it('carries the explanation of each field it has one for', () => {
    assert.ok(rows.find((row) => row.code === 'PID-3')?.explain?.includes('INS'));
  });
});

describe('the other formats', () => {
  it('names the DICOM tags and decodes their values', () => {
    const rows = rowsOf(byId('pacs-ris'));
    assert.equal(rows.find((row) => row.code === '(0010,0010)')?.label, 'Nom du patient');
    assert.equal(rows.find((row) => row.code === '(0008,0060)')?.value, 'Scanner (CT)');
    assert.equal(rows.find((row) => row.code === '(0028,0010)')?.value, '512 pixels');
  });

  it('splits the DICOM listing into the examen, the patient, the series and the image', () => {
    assert.deepEqual(byId('pacs-ris').cards.map(({ title }) => title), ['Encodage', 'Examen', 'Patient', 'Série', 'Image']);
  });

  it('reads the CDA document: INS root and extension, patient, author, paragraph', () => {
    const rows = rowsOf(byId('dpi'));
    assert.equal(rows.find((row) => row.code === 'recordTarget/patientRole/id@extension')?.value, MOCK_PATIENT.ins);
    assert.equal(rows.find((row) => row.code === 'recordTarget/patientRole/patient/name')?.value, 'Martin DURAND');
    assert.ok(rows.find((row) => row.code.endsWith('paragraph'))?.value.includes('suivi cardiologique à un mois'));
  });

  it('joins a CDA paragraph written on two lines into one row', () => {
    const rows = rowsOf(byId('dpi')).filter((row) => row.code.endsWith('paragraph'));
    assert.equal(rows.length, 1);
    assert.ok(byId('dpi').lines.filter(({ units }) => units.some(({ ref }) => ref === rows[0]!.ref)).length === 2);
  });

  it('makes one block per child of the CDA root', () => {
    assert.deepEqual(byId('dpi').cards.map(({ code }) => code), ['ClinicalDocument', 'templateId', 'code', 'recordTarget', 'author', 'component']);
  });

  it('reads the FHIR Bundle by resource, with the identifier rows grouped', () => {
    const { cards } = byId('eai');
    assert.deepEqual(cards.map(({ code }) => code), ['Bundle', 'Patient', 'Encounter']);
    const identifier = cards[1]!.rows.filter(({ group }) => group === 'Identifiant');
    assert.deepEqual(identifier.map(({ code }) => code), ['Patient.identifier.use', 'Patient.identifier.type.coding.code', 'Patient.identifier.system', 'Patient.identifier.value']);
    assert.equal(identifier.at(-1)!.value, MOCK_PATIENT.ins);
  });

  it('expands the FHIR encounter class and its period', () => {
    const rows = rowsOf(byId('eai'));
    assert.equal(rows.find((row) => row.code === 'Encounter.class.code')?.value, 'Hospitalisation (IMP)');
    assert.equal(rows.find((row) => row.code === 'Encounter.period.start')?.value, '2 novembre 2026, 08:40');
  });

  it('flags the abnormal lab results in the card subtitle', () => {
    const subtitles = byId('sgl').cards.map(({ subtitle }) => subtitle);
    assert.ok(subtitles.includes('Hémoglobine · 11,2 g/dL · bas'));
    assert.ok(subtitles.includes('CRP · 48 mg/L · élevé'));
  });
});

describe('the colour legend', () => {
  it('names every token colour the raw pane of each file uses', () => {
    for (const { id, file, lines } of INSPECTIONS) {
      const legended = new Set(TOKEN_LEGENDS[file.format].flatMap(({ kinds }) => kinds));
      const used = new Set(lines.flatMap(({ units }) => units.flatMap(({ tokens }) => tokens.map(({ kind }) => kind))));
      used.delete('text');
      used.forEach((kind) => assert.ok(legended.has(kind), `${id}: ${kind}`));
    }
  });
});

describe('shortCode', () => {
  it('keeps a short code whole', () => {
    assert.equal(shortCode('PID-5'), 'PID-5');
    assert.equal(shortCode('(0010,0010)'), '(0010,0010)');
    assert.equal(shortCode('Patient.birthDate'), 'Patient.birthDate');
  });

  it('keeps the last two parts of a long CDA path or FHIR path', () => {
    assert.equal(shortCode('component/structuredBody/component/section/text/paragraph'), '…/text/paragraph');
    assert.equal(shortCode('Encounter.location.location.display'), '….location.display');
  });
});
