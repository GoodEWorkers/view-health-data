// SGL: the ORU^R01 of the biology results shown on the GLIMS screen, one OBX per result with its unit, reference range and abnormal flag.

import { LAB_RESULTS, MOCK_PATIENT } from '../screenMocks.ts';
import { messageHeader, patientSegment, segment } from './hl7.ts';

const LOINC: Readonly<Record<string, string>> = {
  Hémoglobine: '718-7',
  Leucocytes: '6690-2',
  CRP: '1988-5',
  Créatinine: '14682-9',
  Potassium: '2823-3',
  Glycémie: '14749-6',
};
const REPORT_CODE = '11502-2^CR d\'examens biologiques^LN';
const RESULT_STAMP = '202611021042';
const ACCESSION = 'GL26-1187';

const decimal = (text: string): string => text.replaceAll(',', '.');
const range = (reference: string): string => decimal(reference).replaceAll(' ', '').replace('–', '-');

export const resultsMessage = (): string =>
  [
    messageHeader({ sending: 'GLIMS', receiving: 'DPI', stamp: RESULT_STAMP, type: 'ORU^R01^ORU_R01', control: '5102' }),
    patientSegment(),
    segment('OBR', { 1: '1', 3: ACCESSION, 4: REPORT_CODE, 7: MOCK_PATIENT.entryStamp, 25: 'F' }),
    ...LAB_RESULTS.map(({ analysis, value, unit, reference, flag }, index) =>
      segment('OBX', { 1: String(index + 1), 2: 'NM', 3: `${LOINC[analysis]}^${analysis}^LN`, 5: decimal(value), 6: unit, 7: range(reference), 8: flag === 'B' ? 'L' : (flag ?? ''), 11: 'F' }),
    ),
  ].join('\n');
