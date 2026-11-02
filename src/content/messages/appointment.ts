// RDV: the SIU^S12 booking of the synthetic patient's consultation (HL7 v2.5.1 chapter 10: MSH, SCH, PID, RGS, then the AIS service and AIP personnel resources).

import { PATIENT_APPOINTMENT } from '../screenMocks.ts';
import { messageHeader, patientSegment, physicianName, segment } from './hl7.ts';

const BOOKING_STAMP = '202611011520';
const SERVICE_CODE = 'CARD01';
const MINUTES_UNIT = 'min';

export const appointmentMessage = (): string => {
  const { stamp, minutes, reason } = PATIENT_APPOINTMENT;
  return [
    messageHeader({ sending: 'RDV', receiving: 'DPI', stamp: BOOKING_STAMP, type: 'SIU^S12^SIU_S12', control: '4120' }),
    segment('SCH', { 2: '14^RDV', 7: `CONSULT^${reason}`, 9: String(minutes), 10: MINUTES_UNIT, 11: `^^${minutes}^${stamp}`, 16: physicianName(), 25: 'Booked' }),
    patientSegment(),
    segment('RGS', { 1: '1', 2: 'A' }),
    segment('AIS', { 1: '1', 2: 'A', 3: `${SERVICE_CODE}^${reason}`, 4: stamp, 7: String(minutes), 8: MINUTES_UNIT }),
    segment('AIP', { 1: '1', 2: 'A', 3: physicianName(), 4: '1^Praticien', 6: stamp, 9: String(minutes), 10: MINUTES_UNIT }),
  ].join('\n');
};
