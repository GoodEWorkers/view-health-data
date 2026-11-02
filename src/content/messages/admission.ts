// GAM: the ADT^A01 admission of the synthetic patient, shaped like the ANS PAM example (MSH 2.5^FRA^2.11, EVN, PID with the INS in PID-3, PV1, the ZBE movement segment).

import { MOCK_PATIENT } from '../screenMocks.ts';
import { FACILITY, FACILITY_NUMBER, facilityOf, messageHeader, patientSegment, physicianName, segment, visitNumber } from './hl7.ts';

const UNIT_CODE = '2301';
const MOVEMENT_ID = '001';

const unitOf = (): string => `${MOCK_PATIENT.unit}^^^^^${facilityOf('N')}^UF^^^${UNIT_CODE}`;

export const admissionMessage = (): string =>
  [
    messageHeader({ sending: 'GAM', receiving: 'DPI', stamp: MOCK_PATIENT.entryStamp, type: 'ADT^A01^ADT_A01', control: '3975', french: true, version: '2.5^FRA^2.11' }),
    segment('EVN', { 2: MOCK_PATIENT.entryStamp, 6: MOCK_PATIENT.entryStamp }),
    patientSegment(true),
    segment('PV1', {
      1: '1',
      2: 'I',
      3: `CARDIO^${MOCK_PATIENT.room}^${MOCK_PATIENT.bedLetter}^${facilityOf('M')}^O`,
      7: physicianName(),
      19: visitNumber(),
    }),
    segment('ZBE', { 1: `${MOVEMENT_ID}^${FACILITY}^${FACILITY_NUMBER}`, 2: MOCK_PATIENT.entryStamp, 4: 'INSERT', 5: 'N', 7: unitOf(), 8: unitOf(), 9: 'HMS' }),
  ].join('\n');
