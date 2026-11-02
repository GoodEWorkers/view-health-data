// What the HL7 v2 generators share: the segment builder, the message header and the patient identification of the synthetic patient, with the INS under the assigning authority of the ANS examples.

import { MOCK_PATIENT } from '../screenMocks.ts';

export const FACILITY = 'CHU-X';
export const FACILITY_NUMBER = '000897406';
export const INS_AUTHORITY = 'ASIP-SANTE-INS-NIR&1.2.250.1.213.1.4.10&ISO';
export const INS_AUTHORITY_OID = '1.2.250.1.213.1.4.10';
export const INS_DIGITS = MOCK_PATIENT.ins.replaceAll(' ', '');

const ENCODING_CHARACTERS = '^~\\&';
const PROCESSING_TRAINING = 'T';
const INS_AUTHORITY_START = '20101207';

export const facilityOf = (kind: string): string => `${FACILITY}&${FACILITY_NUMBER}&${kind}`;

export const hl7Date = (iso: string): string => iso.replaceAll('-', '');

export function segment(id: string, fields: Readonly<Record<number, string>>): string {
  const last = Math.max(...Object.keys(fields).map(Number));
  return [id, ...Array.from({ length: last }, (_, index) => fields[index + 1] ?? '')].join('|');
}

type Header = { readonly sending: string; readonly receiving: string; readonly stamp: string; readonly type: string; readonly control: string; readonly version?: string; readonly french?: boolean };

export function messageHeader({ sending, receiving, stamp, type, control, version = '2.5', french = false }: Header): string {
  const head = ['MSH', ENCODING_CHARACTERS, sending, FACILITY, receiving, FACILITY, stamp, '', type, control, PROCESSING_TRAINING, version];
  return (french ? [...head, '', '', '', '', 'FRA', 'UNICODE UTF-8', 'FR', '', '2.11^IHE_FRANCE-2.11-PAM'] : head).join('|');
}

export const patientIdentifiers = (): string =>
  `${MOCK_PATIENT.patientId}^^^${facilityOf('N')}^PI~${INS_DIGITS}^^^${INS_AUTHORITY}^INS^^${INS_AUTHORITY_START}`;

export const patientName = (): string => `${MOCK_PATIENT.lastName}^${MOCK_PATIENT.firstName}^${MOCK_PATIENT.firstName}^^^^L`;

export const visitNumber = (): string => `${MOCK_PATIENT.stay}^^^${facilityOf('M')}^VN`;

export const physicianName = (): string => `${MOCK_PATIENT.physicianName}^${MOCK_PATIENT.physicianFirstName}^^^Dr`;

export const patientSegment = (withAccount = false): string => {
  const identification: Record<number, string> = { 1: '1', 3: patientIdentifiers(), 5: patientName(), 7: MOCK_PATIENT.birthStamp, 8: 'M' };
  if (withAccount) identification[18] = `${MOCK_PATIENT.stay}^^^${facilityOf('M')}^AN`;
  return segment('PID', identification);
};
