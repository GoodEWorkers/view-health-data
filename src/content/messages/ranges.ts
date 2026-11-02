// The named ranges of the eight files, the range each flow lights in its source file and the payloads a range receives. Line numbers are those of the full file.

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId, Flow } from '../departments.ts';

export type EditorRange = { readonly key: string; readonly lines: readonly [from: number, to: number]; readonly label: string; readonly receives?: readonly string[] };

export const MAX_LABEL = 18;

export const RANGES: Readonly<Record<DepartmentId, readonly EditorRange[]>> = {
  gam: [
    { key: 'identity', lines: [3, 3], label: 'Identité + INS' },
    { key: 'stay', lines: [4, 4], label: 'Séjour et lit' },
    { key: 'movement', lines: [5, 5], label: 'Mouvement de lit' },
  ],
  rdv: [
    { key: 'booking', lines: [2, 2], label: 'Rendez-vous', receives: ['Planning'] },
    { key: 'patient', lines: [3, 3], label: 'Patient' },
    { key: 'service', lines: [5, 5], label: 'Service' },
    { key: 'practitioner', lines: [6, 6], label: 'Praticien', receives: ['Disponibilités'] },
  ],
  dpi: [
    { key: 'patient', lines: [5, 6], label: 'INS du patient', receives: ['Identité patient'] },
    { key: 'author', lines: [10, 10], label: 'Auteur' },
    {
      key: 'body',
      lines: [13, 14],
      label: 'Contenu clinique',
      receives: ['Consultations programmées', 'Résultats d\'analyses', 'Images', 'Comptes-rendus', 'Prescriptions', 'Interactions', 'Comptes-rendus opératoires'],
    },
  ],
  sgl: [
    { key: 'patient', lines: [2, 2], label: 'Patient' },
    { key: 'order', lines: [3, 3], label: 'Demande', receives: ['Prescriptions', 'Observations'] },
    { key: 'results', lines: [4, 9], label: 'Résultats' },
  ],
  'pacs-ris': [
    { key: 'study', lines: [4, 5], label: 'Examen', receives: ['Prescriptions d\'imagerie'] },
    { key: 'patient', lines: [8, 9], label: 'Patient' },
    { key: 'image', lines: [14, 15], label: 'Image' },
  ],
  pharmacie: [
    { key: 'patient', lines: [2, 2], label: 'Patient' },
    { key: 'amoxicillin', lines: [4, 4], label: 'Amoxicilline', receives: ['Prescriptions médicamenteuses'] },
    { key: 'warfarin', lines: [7, 7], label: 'Warfarine' },
  ],
  bloc: [
    { key: 'patient', lines: [3, 3], label: 'Patient' },
    { key: 'document', lines: [5, 5], label: 'Compte-rendu', receives: ['Programmation', 'Dossier anesthésie'] },
    { key: 'payload', lines: [6, 6], label: 'Document encodé' },
  ],
  eai: [
    { key: 'patient', lines: [3, 9], label: 'Patient', receives: ['Clinical data', 'ORU messages', 'Images + metadata', 'Pharmacy messages', 'Surgical reports'] },
    { key: 'identifier', lines: [6, 7], label: 'Identifiant INS', receives: ['ADT messages'] },
    { key: 'encounter', lines: [10, 14], label: 'Séjour', receives: ['Scheduling'] },
  ],
};

export const MAIN_RANGES: Readonly<Record<DepartmentId, string>> = {
  gam: 'identity',
  rdv: 'booking',
  dpi: 'body',
  sgl: 'results',
  'pacs-ris': 'study',
  pharmacie: 'amoxicillin',
  bloc: 'document',
  eai: 'identifier',
};

export const FLOW_RANGE_KEYS: Readonly<Record<string, string>> = {
  'gam→Identité patient': 'identity',
  'gam→Mouvements': 'movement',
  'gam→Disponibilités': 'stay',
  'gam→Planning': 'stay',
  'gam→ADT messages': 'identity',
  'pacs-ris→Images': 'image',
  'pacs-ris→Images + metadata': 'image',
  'pharmacie→Interactions': 'warfarin',
};

export const flowKey = (from: DepartmentId, { payload }: Flow): string => `${from}→${payload}`;

export type FlowRanges = { readonly source: string; readonly target?: string };

export function rangesOfFlow(from: DepartmentId, flow: Flow): FlowRanges {
  const target = RANGES[flow.to].find(({ receives }) => receives?.includes(flow.payload))?.key;
  const source = FLOW_RANGE_KEYS[flowKey(from, flow)] ?? MAIN_RANGES[from];
  return target === undefined ? { source } : { source, target };
}

export const ALL_FLOWS: readonly { readonly from: DepartmentId; readonly flow: Flow }[] = DEPARTMENTS.flatMap(({ id, flows }) => flows.map((flow) => ({ from: id, flow })));
