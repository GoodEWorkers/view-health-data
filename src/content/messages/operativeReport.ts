// Bloc: the MDM^T02 that carries the compte-rendu opératoire. The document is an ED observation whose payload is a placeholder, never a real binary.

import { facilityOf, messageHeader, patientSegment, physicianName, segment, visitNumber } from './hl7.ts';

const REPORT_STAMP = '202611021410';
const SURGICAL_NOTE = '11504-8^CR opératoire^LN';
const DOCUMENT_ID = 'CRO-26-0231';
export const PLACEHOLDER = '[...]';

export const operativeReportMessage = (): string =>
  [
    messageHeader({ sending: 'OPROOM', receiving: 'DPI', stamp: REPORT_STAMP, type: 'MDM^T02^MDM_T02', control: '7345' }),
    segment('EVN', { 2: REPORT_STAMP }),
    patientSegment(),
    segment('PV1', { 1: '1', 2: 'I', 3: `BLOC^S1^^${facilityOf('M')}^O`, 19: visitNumber() }),
    segment('TXA', { 1: '1', 2: '11504-8', 3: 'TEXT', 4: REPORT_STAMP, 9: physicianName(), 12: DOCUMENT_ID, 17: 'AU' }),
    segment('OBX', { 1: '1', 2: 'ED', 3: SURGICAL_NOTE, 5: `^text^XML^Base64^UEQ5NGJXd${PLACEHOLDER}`, 11: 'F' }),
  ].join('\n');
