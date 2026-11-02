// Synthetic content of the eight skeleton screens: invented people, invalid INS numbers, made-up dates and values. Nothing here is, or comes from, a real patient (CLAUDE.md, section 11).

export const MOCK_PATIENT = {
  lastName: 'DURAND',
  firstName: 'Martin',
  birth: '14/06/1958',
  age: '68 ans',
  ins: '1 80 99 99 123 456 78',
  stay: '25-004821',
  entryShort: '02/11 08:40',
  unit: 'Cardiologie',
  bed: '214-B',
  physician: 'Dr ROUX',
} as const;

export type Field = readonly [label: string, value: string];

export const GAM_IDENTITY: readonly Field[] = [
  ['Nom', MOCK_PATIENT.lastName],
  ['Prénom', MOCK_PATIENT.firstName],
  ['Né le', MOCK_PATIENT.birth],
  ['Sexe', 'Masculin'],
  ['INS', MOCK_PATIENT.ins],
];

export const GAM_ADMISSION: readonly Field[] = [
  ['Venue', MOCK_PATIENT.stay],
  ['Entrée', MOCK_PATIENT.entryShort],
  ['Mode', 'Programmée'],
  ['Unité', MOCK_PATIENT.unit],
  ['Lit', MOCK_PATIENT.bed],
];

export type Slot = { readonly day: number; readonly row: number; readonly span: number; readonly label: string };

export const AGENDA_DAYS: readonly string[] = ['Lun 02', 'Mar 03', 'Mer 04', 'Jeu 05', 'Ven 06'];
export const AGENDA_HOURS: readonly string[] = ['08h', '09h', '10h', '11h', '14h'];
export const AGENDA_SLOTS: readonly Slot[] = [
  { day: 0, row: 1, span: 1, label: 'Durand' },
  { day: 0, row: 3, span: 2, label: 'Leroy' },
  { day: 1, row: 0, span: 1, label: 'Petit' },
  { day: 1, row: 2, span: 1, label: 'Faure' },
  { day: 2, row: 1, span: 2, label: 'Girard' },
  { day: 2, row: 4, span: 1, label: 'Blanc' },
  { day: 3, row: 0, span: 2, label: 'Morel' },
  { day: 3, row: 3, span: 1, label: 'Lopez' },
  { day: 4, row: 1, span: 1, label: 'Roche' },
  { day: 4, row: 4, span: 1, label: 'Mercier' },
];

export const RECORD_TABS: readonly string[] = ['Synthèse', 'Observations', 'Prescriptions', 'Résultats'];
export const RECORD_ACTIVE_TAB = 'Observations';
export const RECORD_VITALS: readonly Field[] = [['TA', '128/76'], ['FC', '72 /min'], ['T°', '36,8 °C'], ['SpO₂', '97 %']];
export type Note = { readonly time: string; readonly author: string; readonly text: string };
export const RECORD_NOTES: readonly Note[] = [
  { time: '08:55', author: 'IDE Lemoine', text: 'Installé, douleur thoracique 2/10' },
  { time: '09:30', author: 'Dr Roux', text: 'ECG sans particularité, bilan prescrit' },
  { time: '10:10', author: 'IDE Lemoine', text: 'Prélèvements faits, à jeun depuis minuit' },
  { time: '10:45', author: 'Dr Roux', text: 'Scanner thorax à 11h30' },
];

export type LabResult = { readonly analysis: string; readonly value: string; readonly unit: string; readonly reference: string; readonly flag?: 'B' | 'H' };
export const LAB_RESULTS: readonly LabResult[] = [
  { analysis: 'Hémoglobine', value: '11,2', unit: 'g/dL', reference: '13,0 – 17,0', flag: 'B' },
  { analysis: 'Leucocytes', value: '7,4', unit: 'G/L', reference: '4,0 – 10,0' },
  { analysis: 'CRP', value: '48', unit: 'mg/L', reference: '< 5', flag: 'H' },
  { analysis: 'Créatinine', value: '84', unit: 'µmol/L', reference: '62 – 106' },
  { analysis: 'Potassium', value: '4,1', unit: 'mmol/L', reference: '3,5 – 5,0' },
  { analysis: 'Glycémie', value: '5,6', unit: 'mmol/L', reference: '3,9 – 6,1' },
];
export const LAB_STATUS = 'Validation biologique 10:42';

export type Exam = { readonly patient: string; readonly exam: string; readonly time: string; readonly status: string };
export const IMAGING_WORKLIST: readonly Exam[] = [
  { patient: 'DURAND M.', exam: 'Scanner thorax', time: '09:30', status: 'Réalisé' },
  { patient: 'LEROY C.', exam: 'IRM genou', time: '10:15', status: 'En cours' },
  { patient: 'PETIT H.', exam: 'Radio poignet', time: '10:40', status: 'Planifié' },
  { patient: 'FAURE E.', exam: 'Échographie', time: '11:05', status: 'Planifié' },
];
export const IMAGING_CAPTION = ['S2 · 148/312', 'L40 W400'] as const;

export type PrescriptionLine = { readonly drug: string; readonly dose: string; readonly duration: string };
export const PRESCRIPTION_LINES: readonly PrescriptionLine[] = [
  { drug: 'Amoxicilline', dose: '1 g · 3 / jour', duration: '7 jours' },
  { drug: 'Warfarine', dose: '5 mg · 1 / jour', duration: 'En continu' },
  { drug: 'Paracétamol', dose: '1 g · 3 / jour', duration: '5 jours' },
];
export const PRESCRIPTION_ALERT = ['Interaction', 'Warfarine + amoxicilline : INR à surveiller'] as const;

export type TheatreBlock = { readonly room: number; readonly from: number; readonly span: number; readonly label: string };
export const THEATRE_HOURS: readonly string[] = ['08h', '10h', '12h', '14h', '16h'];
export const THEATRE_ROOMS: readonly string[] = ['Salle 1', 'Salle 2', 'Salle 3', 'Salle 4'];
export const THEATRE_BLOCKS: readonly TheatreBlock[] = [
  { room: 0, from: 0, span: 2, label: 'Cholécystectomie' },
  { room: 0, from: 3, span: 2, label: 'Hernie inguinale' },
  { room: 1, from: 1, span: 2, label: 'Prothèse de genou' },
  { room: 2, from: 0, span: 1, label: 'Biopsie' },
  { room: 2, from: 2, span: 3, label: 'Césarienne programmée' },
  { room: 3, from: 3, span: 1, label: 'Nettoyage' },
];

export type Message = { readonly time: string; readonly type: string; readonly route: string; readonly status: 'Acquitté' | 'En attente' | 'Erreur' };
export const MESSAGES: readonly Message[] = [
  { time: '09:41:07', type: 'ADT^A01', route: 'GAM → DPI', status: 'Acquitté' },
  { time: '09:41:09', type: 'SIU^S12', route: 'RDV → DPI', status: 'Acquitté' },
  { time: '09:42:15', type: 'ORU^R01', route: 'SGL → DPI', status: 'Acquitté' },
  { time: '09:43:02', type: 'ORM^O01', route: 'DPI → PACS', status: 'En attente' },
  { time: '09:43:40', type: 'OMP^O09', route: 'DPI → Pharmacie', status: 'Erreur' },
];
export const MESSAGE_TOTALS: readonly Field[] = [['Reçus', '128'], ['Acquittés', '124'], ['En erreur', '1']];
