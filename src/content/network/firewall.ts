// The flow matrix of the internal firewall: one line per allowed protocol and port between two zones, then a deny-all. A modelling choice (doc/sources.md, assumption 30), shaped by ANSSI measure 19 and PA-066.

import type { DepartmentId, ExternalFlow, ExternalZone, Flow, Transport } from '../departments.ts';
import { familyOf } from './protocols.ts';
import type { ProtocolFamily } from './protocols.ts';
import { zonesOfFlow } from './zones.ts';
import type { Zone } from './zones.ts';

export type RuleEnd = Zone | 'outside' | 'any';

export type FirewallRule = {
  readonly id: number;
  readonly from: RuleEnd;
  readonly to: RuleEnd;
  readonly family: ProtocolFamily | 'any';
  readonly port: string;
  readonly service: string;
  readonly purpose: string;
  readonly action: 'allow' | 'deny';
  // Set on the rules an external exchange leaves by, to tell the proxy and the relay apart: both go servers to DMZ.
  readonly via?: ExternalZone;
};

export const FIREWALL_RULES: readonly FirewallRule[] = [
  {
    id: 1,
    from: 'user-workstations',
    to: 'hospital-servers',
    family: 'https',
    port: '443',
    service: 'Postes vers applications du SIH',
    purpose: 'Les postes ouvrent le DPI, la GAM ou le RDV sur leurs serveurs. Le pare-feu ne laisse passer que ce port.',
    action: 'allow',
  },
  {
    id: 2,
    from: 'biomedical-modalities',
    to: 'hospital-servers',
    family: 'dicom',
    port: '104 ou 11112',
    service: 'Modalités vers PACS/RIS et EAI',
    purpose: 'Le scanner envoie ses images (C-STORE) et demande sa liste de travail (C-FIND), en DICOM.',
    action: 'allow',
  },
  {
    id: 3,
    from: 'biomedical-modalities',
    to: 'hospital-servers',
    family: 'mllp',
    port: '2575',
    service: 'Automates et moniteurs vers SGL et DPI',
    purpose: 'Remonte les résultats des automates et les données des moniteurs quand l\'équipement, ou sa passerelle, parle HL7 v2.',
    action: 'allow',
  },
  {
    id: 4,
    from: 'hospital-servers',
    to: 'dmz',
    family: 'https',
    port: '443',
    service: 'Serveurs vers relais web de la DMZ',
    purpose: 'Les serveurs poussent vers la DMZ les créneaux de l\'agenda en ligne et les documents destinés au DMP et à Mon espace santé.',
    action: 'allow',
    via: 'dmz',
  },
  {
    id: 5,
    from: 'hospital-servers',
    to: 'dmz',
    family: 'smtp',
    port: '587',
    service: 'Serveurs vers relais MSSanté',
    purpose: 'Le DPI remet ses courriers de santé au relais de messagerie sécurisée placé en DMZ.',
    action: 'allow',
    via: 'dmz',
  },
  {
    id: 6,
    from: 'hospital-servers',
    to: 'dmz',
    family: 'https',
    port: 'port du proxy',
    service: 'Serveurs vers proxy sortant',
    purpose: 'Les appels à INSi, à e-PMSI et au grossiste-répartiteur ne sortent jamais directement : ils passent par le proxy de la DMZ.',
    action: 'allow',
    via: 'proxy',
  },
  {
    id: 7,
    from: 'hospital-servers',
    to: 'outside',
    family: 'dicom',
    port: '104 ou 11112, dans le tunnel',
    service: 'Téléradiologie par VPN',
    purpose: 'Les images partent vers le radiologue distant dans un tunnel VPN qui se termine sur le pare-feu.',
    action: 'allow',
    via: 'vpn',
  },
  {
    id: 8,
    from: 'dmz',
    to: 'outside',
    family: 'https',
    port: '443',
    service: 'DMZ vers partenaires web',
    purpose: 'Le proxy et le relais web joignent les partenaires en HTTPS : INSi, e-PMSI, grossiste-répartiteur, DMP et Mon espace santé.',
    action: 'allow',
  },
  {
    id: 9,
    from: 'dmz',
    to: 'outside',
    family: 'smtp',
    port: '587',
    service: 'Relais MSSanté vers opérateur',
    purpose: 'Le relais de messagerie transmet les courriers à l\'opérateur MSSanté, dans un canal chiffré.',
    action: 'allow',
  },
  {
    id: 10,
    from: 'outside',
    to: 'dmz',
    family: 'https',
    port: '443',
    service: 'Public vers agenda en ligne',
    purpose: 'Les patients atteignent l\'agenda en ligne par la DMZ ; ils n\'atteignent jamais un serveur du SIH.',
    action: 'allow',
  },
  {
    id: 11,
    from: 'biomedical-modalities',
    to: 'outside',
    family: 'any',
    port: 'tous',
    service: 'Biomédical vers Internet',
    purpose: 'Interdit : un appareil qu\'on ne peut pas corriger ne doit pas pouvoir joindre Internet.',
    action: 'deny',
  },
  {
    id: 12,
    from: 'any',
    to: 'any',
    family: 'any',
    port: 'tous',
    service: 'Tout le reste',
    purpose: 'Par défaut tout est refusé : un nouveau flux doit être demandé, justifié, puis ajouté à la matrice.',
    action: 'deny',
  },
];

const transportOf = ({ transport, payload }: Pick<Flow, 'transport' | 'payload'>): Transport => {
  if (transport === undefined) throw new Error(`Flow "${payload}" has no transport`);
  return transport;
};

const missingRule = (what: string): Error => new Error(`No firewall rule allows ${what}`);

export const ruleForFlow = (from: DepartmentId, flow: Flow): FirewallRule | undefined => {
  const [source, destination] = zonesOfFlow(from, flow);
  if (source === destination) return undefined;
  const family = familyOf(transportOf(flow));
  const rule = FIREWALL_RULES.find((candidate) => candidate.action === 'allow' && candidate.from === source && candidate.to === destination && candidate.family === family);
  if (rule === undefined) throw missingRule(`${family} from ${source} to ${destination}`);
  return rule;
};

export const ruleForExternal = (_from: DepartmentId, flow: ExternalFlow): FirewallRule => {
  const family = familyOf(flow.transport);
  const rule = FIREWALL_RULES.find((candidate) => candidate.via === flow.zone && candidate.family === family);
  if (rule === undefined) throw missingRule(`${family} through ${flow.zone} for ${flow.partner}`);
  return rule;
};
