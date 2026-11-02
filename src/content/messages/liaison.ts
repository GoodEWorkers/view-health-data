// DPI: the header of the CDA R2 lettre de liaison, cut to the elements that identify it: templateId, patient with the INS, author and a single section with one paragraph. Not a conformant CI-SIS document.

import { MOCK_PATIENT } from '../screenMocks.ts';
import { INS_AUTHORITY_OID, INS_DIGITS } from './hl7.ts';

const DISCHARGE_LETTER = '34105-7';
const TEMPLATE_OID = '1.2.250.1.213.1.1.1.1';

export const liaisonDocument = (): string =>
  [
    '<ClinicalDocument xmlns="urn:hl7-org:v3">',
    `  <templateId root="${TEMPLATE_OID}"/>`,
    `  <code code="${DISCHARGE_LETTER}" displayName="Lettre de liaison"/>`,
    '  <recordTarget><patientRole>',
    `    <id root="${INS_AUTHORITY_OID}"`,
    `        extension="${INS_DIGITS}"/>`,
    `    <patient><name>${MOCK_PATIENT.firstName} ${MOCK_PATIENT.lastName}</name></patient>`,
    '  </patientRole></recordTarget>',
    '  <author><assignedAuthor><assignedPerson>',
    `    <name>${MOCK_PATIENT.physician}</name>`,
    '  </assignedPerson></assignedAuthor></author>',
    '  <component><structuredBody><component><section>',
    '    <text><paragraph>Retour à domicile le 05/11/2026,',
    '    suivi cardiologique à un mois.</paragraph></text>',
    '  </section></component></structuredBody></component>',
    '</ClinicalDocument>',
  ].join('\n');
