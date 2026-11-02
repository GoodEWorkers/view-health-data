// EAI: the FHIR R4 Bundle the integration engine produces from the admission: a Patient with the INS under the FR Core test authority and an inpatient Encounter in bed 214-B. Laid out by hand so no line passes 56 characters.

import { MOCK_PATIENT } from '../screenMocks.ts';
import { INS_AUTHORITY_OID, INS_DIGITS } from './hl7.ts';

export const patientBundle = (): string =>
  [
    '{"resourceType": "Bundle", "type": "collection",',
    ' "entry": [',
    '  {"resource": {"resourceType": "Patient",',
    '    "identifier": [{"use": "official",',
    '      "type": {"coding": [{"code": "INS-NIR-TEST"}]},',
    `      "system": "urn:oid:${INS_AUTHORITY_OID}",`,
    `      "value": "${INS_DIGITS}"}],`,
    `    "name": [{"family": "${MOCK_PATIENT.lastName}", "given": ["${MOCK_PATIENT.firstName}"]}],`,
    `    "birthDate": "${MOCK_PATIENT.birthIso}"}},`,
    '  {"resource": {"resourceType": "Encounter",',
    '    "status": "in-progress", "class": {"code": "IMP"},',
    `    "subject": {"reference": "Patient/${MOCK_PATIENT.patientId}"},`,
    `    "period": {"start": "${MOCK_PATIENT.entryIso}"},`,
    `    "location": [{"location": {"display": "${MOCK_PATIENT.bed}"}}]}}`,
    ' ]}',
  ].join('\n');
