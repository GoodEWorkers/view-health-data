// The flows each file travels on, in one sentence per leg (« Envoyé au DPI et à l'EAI · HL7 v2 · MLLP »), read from the flows of departments.ts.

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId, Flow } from '../departments.ts';
import { dataFormat } from '../layerLabels.ts';

const TARGET_PHRASES: Readonly<Record<DepartmentId, string>> = {
  gam: 'à la GAM',
  rdv: 'au RDV',
  dpi: 'au DPI',
  sgl: 'au SGL',
  'pacs-ris': 'au PACS/RIS',
  pharmacie: 'à la Pharmacie',
  bloc: 'au Bloc',
  eai: 'à l\'EAI',
};

const CARRYING_PAYLOADS: Readonly<Record<DepartmentId, readonly string[]>> = {
  gam: ['Identité patient', 'ADT messages'],
  rdv: ['Consultations programmées', 'Scheduling'],
  dpi: [],
  sgl: ['Résultats d\'analyses', 'ORU messages'],
  'pacs-ris': ['Images', 'Images + metadata'],
  pharmacie: ['Prescriptions', 'Pharmacy messages'],
  bloc: ['Comptes-rendus opératoires', 'Surgical reports'],
  eai: [],
};

const CDA_PARTNERS: Readonly<Record<string, string>> = { 'DMP / Mon espace santé': 'au DMP / Mon espace santé', 'MSSanté': 'par MSSanté' };
const CDA_FORMAT = 'CDA R2';
const FHIR_LEG = 'Illustration : l\'EAI peut produire ce paquet FHIR R4 à partir d\'un message HL7 v2 · FHIR R4 · HTTPS';
const HL7_FORMAT = 'HL7 v2';

const andList = (items: readonly string[]): string => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`);

const formatOf = (flow: Flow): string => {
  const family = dataFormat(flow) ?? '';
  return family === HL7_FORMAT || !flow.messageType ? family : `${family} ${flow.messageType}`;
};

function legsOf(id: DepartmentId): string[] {
  const flows = DEPARTMENTS.find((department) => department.id === id)!.flows.filter(({ payload }) => CARRYING_PAYLOADS[id].includes(payload));
  const groups = new Map<string, Flow[]>();
  flows.forEach((flow) => groups.set(`${formatOf(flow)}|${flow.transport}`, [...(groups.get(`${formatOf(flow)}|${flow.transport}`) ?? []), flow]));
  return [...groups].map(([key, members]) => {
    const [format = '', transport = ''] = key.split('|');
    const details = [format, format.startsWith(transport) ? undefined : transport].filter(Boolean).join(' · ');
    return `Envoyé ${andList(members.map(({ to }) => TARGET_PHRASES[to]))} · ${details}`;
  });
}

function externalLegsOf(id: DepartmentId): string[] {
  return DEPARTMENTS.find((department) => department.id === id)!.network.externalFlows.flatMap(({ partner, transport }) =>
    CDA_PARTNERS[partner] ? [`Envoyé ${CDA_PARTNERS[partner]} · ${CDA_FORMAT} · ${transport}`] : [],
  );
}

export const FILE_TRAVEL: Readonly<Record<DepartmentId, readonly string[]>> = {
  gam: legsOf('gam'),
  rdv: legsOf('rdv'),
  dpi: externalLegsOf('dpi'),
  sgl: legsOf('sgl'),
  'pacs-ris': legsOf('pacs-ris'),
  pharmacie: legsOf('pharmacie'),
  bloc: legsOf('bloc'),
  eai: [FHIR_LEG],
};
