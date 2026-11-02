// The sheet shown when a cable of the Réseau layer is hovered: what the flow is, its protocol stack, the firewall rule, the stations it crosses, a capture, what a blockage does and how it is watched.

import type { DepartmentId, ExternalFlow, Flow, Transport } from '../departments.ts';
import { flowInterface, TRANSPORT_DETAILS } from '../layerLabels.ts';
import { captureOf, captureOfExternal } from './capture.ts';
import { ruleForExternal, ruleForFlow } from './firewall.ts';
import type { FirewallRule } from './firewall.ts';
import { hopsOf, hopsOfExternal } from './hops.ts';
import type { Hop } from './hops.ts';
import { partnerOfExternal } from './partners.ts';
import { protocolOf } from './protocols.ts';
import type { ProtocolFamily, ProtocolInfo } from './protocols.ts';
import { acronymOf } from './rooms.ts';

export type StackRow = { readonly layer: string; readonly value: string };

export type FlowSheet = {
  readonly title: string;
  readonly summary: string;
  readonly stack: readonly StackRow[];
  readonly rule: FirewallRule | undefined;
  readonly hops: readonly Hop[];
  readonly capture: readonly string[];
  readonly ifBlocked: string;
  readonly monitoring: string;
};

type ExitPath = ExternalFlow['zone'];

const FRAMINGS: Readonly<Record<ProtocolFamily, string>> = {
  mllp: 'MLLP : octet 0x0B au début, octets 0x1C 0x0D à la fin',
  dicom: 'DICOM Upper Layer : association, puis unités de données (PDU)',
  https: 'TLS, puis HTTP',
  smtp: 'SMTP, puis STARTTLS',
};

const CLEAR_SECURITY = 'Aucun chiffrement : le contenu se lit tel quel sur le réseau';
const TLS_SECURITY = 'Chiffré par TLS';
const VPN_SECURITY = 'Chiffré par le tunnel VPN : DICOM seul ne chiffre rien';

const REFUSALS: Readonly<Record<ProtocolFamily, string>> = {
  mllp: 'l\'équipement n\'enverrait plus ses résultats',
  dicom: 'le scanner n\'enverrait plus ses images et l\'examen resterait invisible pour les médecins',
  https: 'les postes n\'atteindraient plus les applications',
  smtp: 'le courrier de santé resterait chez l\'émetteur',
};

const EXIT_SENTENCES: Readonly<Record<ExitPath, (rule: FirewallRule) => string>> = {
  proxy: ({ id }) => `Le serveur ne sort jamais directement : la demande passe par le proxy de la DMZ, qui la journalise (règle n° ${id}).`,
  dmz: ({ id }) => `L'échange est relayé par une passerelle de la DMZ : aucun serveur interne n'est exposé à Internet (règle n° ${id}).`,
  vpn: ({ id }) => `Les images partent dans un tunnel VPN chiffré, qui se termine sur le pare-feu (règle n° ${id}).`,
};

const EXIT_COMPONENTS: Readonly<Record<ExitPath, string>> = { proxy: 'proxy', dmz: 'relais de la DMZ', vpn: 'concentrateur VPN' };

const NETWORK_ROWS: Readonly<Record<ExitPath, string>> = {
  proxy: 'IP · de l\'adresse privée de la DMZ vers l\'adresse publique du partenaire',
  dmz: 'IP · de l\'adresse privée de la DMZ vers l\'adresse publique du partenaire',
  vpn: 'IP · tunnel IPsec entre deux adresses publiques',
};

const EAI_WATCH =
  'L\'équipe informatique suit l\'échange dans la Supervision des interfaces de l\'EAI : journal des messages, files d\'attente et messages en erreur à rejouer.';

type FlowDetails = Pick<Flow, 'payload' | 'protocol' | 'messageType' | 'transport'>;

const interfaceOf = (flow: FlowDetails, family: ProtocolInfo): string => flowInterface(flow) || family.label;

// "HL7 v2 ADT^A01 (MLLP)" names its transport; "DICOM C-STORE" and "HTTPS" already do.
const withTransport = (application: string, transport: Transport): string => (application.includes(transport) ? application : `${application} (${transport})`);

const applicationRow = (flow: FlowDetails, family: ProtocolInfo): string => flowInterface(flow) || `${family.label} : ${flow.payload}`;

type StackParts = { readonly application: string; readonly family: ProtocolInfo; readonly transport: Transport; readonly security: string; readonly network: string };

const stackOf = ({ application, family, transport, security, network }: StackParts): readonly StackRow[] => [
  { layer: 'Application', value: application },
  { layer: 'Encadrement', value: FRAMINGS[family.id] },
  { layer: 'Sécurité', value: security },
  { layer: 'Transport', value: `TCP · ${TRANSPORT_DETAILS[transport].ports}` },
  { layer: 'Réseau', value: network },
];

function internalSummary(from: DepartmentId, flow: Flow, transport: Transport, family: ProtocolInfo, rule: FirewallRule | undefined): string {
  const lead = `« ${flow.payload} » : ${acronymOf(from)} vers ${acronymOf(flow.to)}, en ${withTransport(interfaceOf(flow, family), transport)}, ${TRANSPORT_DETAILS[transport].ports}.`;
  if (rule !== undefined) {
    const clear = family.encrypted ? '' : ' Rien n\'est chiffré, ce qui reste acceptable parce que le trafic ne quitte pas les zones internes de l\'hôpital.';
    return `${lead} L'équipement biomédical est dans une zone à part : le pare-feu ne laisse passer son trafic que par la règle n° ${rule.id} (${rule.service}).${clear}`;
  }
  if (transport === 'HTTPS') {
    return `${lead} Le système destinataire ouvre lui-même la connexion et va chercher les images sans passer par l'EAI : l'échange reste dans la zone des serveurs, sans pare-feu à traverser, et il est chiffré par TLS.`;
  }
  const viaEai = flow.to === 'eai' ? 'L\'EAI le reçoit, le trace puis le route.' : `Il transite par l'EAI, qui le trace puis l'achemine vers son destinataire (${acronymOf(flow.to)}).`;
  return `${lead} Tout reste dans la zone des serveurs du SIH : aucun pare-feu à traverser, et le message circule en clair, ce qui n'est acceptable qu'entre zones de confiance. ${viaEai}`;
}

function internalBlocked(rule: FirewallRule | undefined, transport: Transport, family: ProtocolInfo): string {
  if (rule !== undefined) {
    return `Si la règle n° ${rule.id} manquait ou était retirée, le pare-feu refuserait la connexion : ${REFUSALS[family.id]}. Le refus apparaîtrait dans son journal.`;
  }
  if (transport === 'HTTPS') return 'Si le serveur d\'images ne répond plus, l\'application destinataire n\'affiche plus les images et l\'imagerie passe en mode dégradé.';
  return 'Si le cœur de réseau ou l\'EAI ne répond plus, le message reste en file d\'attente et l\'équipe d\'exploitation le rejoue depuis l\'EAI au retour du réseau ; en attendant, chaque service travaille en mode dégradé avec ses copies locales.';
}

function internalMonitoring(rule: FirewallRule | undefined, transport: Transport): string {
  if (rule !== undefined) return 'Le pare-feu journalise chaque connexion acceptée ou refusée ; l\'équipe informatique la rapproche du journal des messages de l\'EAI.';
  if (transport === 'HTTPS') return 'Le journal du serveur web du PACS/RIS garde la trace des requêtes d\'images ; l\'EAI, lui, ne voit pas cet échange.';
  return EAI_WATCH;
}

export function flowSheetOf(from: DepartmentId, flow: Flow): FlowSheet {
  const transport = flow.transport;
  if (transport === undefined) throw new Error(`Flow "${flow.payload}" has no transport`);
  const family = protocolOf(transport);
  const rule = ruleForFlow(from, flow);
  return {
    title: `${acronymOf(from)} → ${acronymOf(flow.to)} · ${flow.payload}`,
    summary: internalSummary(from, flow, transport, family, rule),
    stack: stackOf({ application: applicationRow(flow, family), family, transport, security: family.encrypted ? TLS_SECURITY : CLEAR_SECURITY, network: 'IP · adresses privées (RFC 1918)' }),
    rule,
    hops: hopsOf(from, flow),
    capture: captureOf(from, flow),
    ifBlocked: internalBlocked(rule, transport, family),
    monitoring: internalMonitoring(rule, transport),
  };
}

export function externalSheetOf(from: DepartmentId, flow: ExternalFlow): FlowSheet {
  const family = protocolOf(flow.transport);
  const partner = partnerOfExternal(flow);
  const rule = ruleForExternal(from, flow);
  const security = family.encrypted ? TLS_SECURITY : VPN_SECURITY;
  const lead = `« ${flow.payload} » : ${acronymOf(from)} vers ${flow.partner}, en ${withTransport(interfaceOf(flow, family), flow.transport)}, ${TRANSPORT_DETAILS[flow.transport].ports}.`;
  return {
    title: `${acronymOf(from)} → ${flow.partner} · ${flow.payload}`,
    summary: `${lead} ${EXIT_SENTENCES[flow.zone](rule)} ${partner.explain}`,
    stack: [
      ...stackOf({ application: applicationRow(flow, family), family, transport: flow.transport, security, network: NETWORK_ROWS[flow.zone] }),
      { layer: 'Identité', value: partner.identity },
      { layer: 'Certification', value: partner.certification },
    ],
    rule,
    hops: hopsOfExternal(from, flow),
    capture: captureOfExternal(from, flow),
    ifBlocked: `Si le pare-feu refuse la sortie (règle n° ${rule.id} retirée) ou si le partenaire ne répond plus, l'échange attend et l'établissement applique ses procédures de mode dégradé. Les échanges internes continuent, car ils ne dépendent pas d'Internet.`,
    monitoring: `Le pare-feu journalise chaque connexion sortante, et le ${EXIT_COMPONENTS[flow.zone]} en garde la trace. Le CERT Santé publie les alertes de sécurité pour les établissements et reçoit leurs déclarations d'incident.`,
  };
}
