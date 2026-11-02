// Pharmacie: the RDE^O11 encoded order for the two drugs of the interaction alert, each an ORC, an RXE with its timing and ATC code, and an RXR route.

import { MOCK_PATIENT, PRESCRIPTION_LINES } from '../screenMocks.ts';
import { messageHeader, patientSegment, physicianName, segment } from './hl7.ts';

const INTERACTING = ['Amoxicilline', 'Warfarine'];
const ORDER_STAMP = '202611021105';
const ROUTE = 'PO^Voie orale^HL70162';
const TIMINGS: Readonly<Record<number, string>> = { 1: 'QD', 3: 'TID' };

const orderOf = ({ drug, atc, amount, unit, timesPerDay }: (typeof PRESCRIPTION_LINES)[number], index: number): string[] => [
  segment('ORC', { 1: 'RE', 2: `OP-884${index + 1}`, 3: `PH-330${index + 2}`, 9: ORDER_STAMP, 12: physicianName() }),
  segment('RXE', { 1: `^${TIMINGS[timesPerDay]}^^${MOCK_PATIENT.entryStamp}`, 2: `${atc}^${drug}^ATC`, 3: amount, 5: unit }),
  segment('RXR', { 1: ROUTE }),
];

export const prescriptionMessage = (): string =>
  [
    messageHeader({ sending: 'PHARMA', receiving: 'DPI', stamp: ORDER_STAMP, type: 'RDE^O11^RDE_O11', control: '6231' }),
    patientSegment(),
    ...PRESCRIPTION_LINES.filter(({ drug }) => INTERACTING.includes(drug)).flatMap(orderOf),
  ].join('\n');
