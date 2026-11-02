import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatIns, renderValue } from './render.ts';

const NO_FIELDS = { fields: [] };
const PID_3 = '0058214^^^CHU-X&000897406&N^PI~180999912345678^^^ASIP-SANTE-INS-NIR&1.2.250.1.213.1.4.10&ISO^INS^^20101207';

describe('formatIns', () => {
  it('groups the 15 digits as the INS is written', () => {
    assert.equal(formatIns('180999912345678'), '1 80 99 99 123 456 78');
  });

  it('leaves anything that is not 15 digits alone', () => {
    assert.equal(formatIns('12345'), '12345');
  });
});

describe('renderValue', () => {
  it('writes each identifier of PID-3 on its own line, the INS with its authority', () => {
    assert.equal(
      renderValue('identifiers', PID_3, NO_FIELDS),
      'Identifiant patient interne 0058214 (CHU-X, n° 000897406)\nINS 1 80 99 99 123 456 78 (autorité INS-NIR test)',
    );
  });

  it('writes a name family first, then the given name', () => {
    assert.equal(renderValue('name', 'DURAND^Martin^Martin^^^^L', NO_FIELDS), 'DURAND Martin');
  });

  it('writes a practitioner with the title first', () => {
    assert.equal(renderValue('practitioner', 'ROUX^Hugues^^^Dr', NO_FIELDS), 'Dr Hugues ROUX');
  });

  it('writes a location as unit, room and bed, with the word of the unit', () => {
    assert.equal(renderValue('location', 'CARDIO^214^B^CHU-X&000897406&M^O', NO_FIELDS), 'Cardiologie, chambre 214, lit B');
    assert.equal(renderValue('location', 'BLOC^S1^^CHU-X&000897406&M^O', NO_FIELDS), 'Bloc opératoire, salle S1');
  });

  it('expands an HL7 table value and keeps the code', () => {
    assert.equal(renderValue('table:HL70004', 'I', NO_FIELDS), 'Hospitalisation (I)');
    assert.equal(renderValue('table:HL70078', 'L', NO_FIELDS), 'Bas (L)');
  });

  it('keeps an unknown table value as it is', () => {
    assert.equal(renderValue('table:HL70004', 'Z', NO_FIELDS), 'Z');
  });

  it('expands a LOINC or ATC code with its label and system', () => {
    assert.equal(renderValue('code', '718-7^Hémoglobine^LN', NO_FIELDS), 'Hémoglobine (LOINC 718-7)');
    assert.equal(renderValue('code', 'J01CA04^Amoxicilline^ATC', NO_FIELDS), 'Amoxicilline (ATC J01CA04)');
    assert.equal(renderValue('code', '11504-8', NO_FIELDS), 'Compte rendu opératoire (LOINC 11504-8)');
  });

  it('writes a dosing rhythm and its start', () => {
    assert.equal(renderValue('timing', '^TID^^202611020840', NO_FIELDS), '3 fois par jour (TID) · à partir du 2 novembre 2026, 08:40');
  });

  it('writes a decimal number with a comma and a reference range with « à »', () => {
    assert.equal(renderValue('observation', '11.2', { fields: ['', '1', 'NM'] }), '11,2');
    assert.equal(renderValue('range', '13.0-17.0', NO_FIELDS), '13,0 à 17,0');
    assert.equal(renderValue('range', '<5', NO_FIELDS), '< 5');
  });

  it('never prints the payload of an encapsulated document', () => {
    const value = renderValue('observation', '^text^XML^Base64^UEQ5NGJXd[...]', { fields: ['', '1', 'ED'] });
    assert.equal(value, 'Document XML encodé en Base64, contenu abrégé');
  });

  it('names the message type in French and keeps its code', () => {
    assert.equal(renderValue('messageType', 'ADT^A01^ADT_A01', NO_FIELDS), 'Admission d\'un patient (ADT^A01)');
  });

  it('writes the French extension of the version', () => {
    assert.equal(renderValue('version', '2.5^FRA^2.11', NO_FIELDS), 'HL7 v2.5, extension française 2.11');
    assert.equal(renderValue('version', '2.5', NO_FIELDS), 'HL7 v2.5');
  });

  it('names an OID by its authority', () => {
    assert.equal(renderValue('oid', 'urn:oid:1.2.250.1.213.1.4.10', NO_FIELDS), 'autorité INS-NIR test (1.2.250.1.213.1.4.10)');
  });
});
