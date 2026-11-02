import type { Department, ExternalZone, Flow, NetworkZone, Transport } from './departments.ts';
import type { SheetLayerId } from './layers.ts';

type FlowDetails = Pick<Flow, 'payload' | 'protocol' | 'messageType' | 'transport'>;

type TransportDetails = {
  readonly standard?: string;
  readonly description: string;
  readonly ports: string;
};

export const ZONE_LABELS: Readonly<Record<NetworkZone | ExternalZone, string>> = {
  'user-workstations': 'Postes utilisateurs',
  'hospital-servers': 'Serveurs du SIH',
  'biomedical-modalities': 'Modalités biomédicales',
  dmz: 'DMZ',
  vpn: 'VPN',
  proxy: 'Proxy',
};

// Ports as registered at IANA (hl7, acr-nema, dicom, https, submission); sites may configure others.
export const TRANSPORT_DETAILS: Readonly<Record<Transport, TransportDetails>> = {
  MLLP: { standard: 'HL7 v2', description: 'messages HL7 v2 sur TCP', ports: 'port 2575' },
  DICOM: { standard: 'DICOM', description: 'images et requêtes DICOM sur TCP', ports: 'ports 104 ou 11112' },
  HTTPS: { description: 'échanges web chiffrés', ports: 'port 443' },
  SMTP: { description: 'messagerie sécurisée sur TLS', ports: 'port 587' },
};

const isDefined = (part: string | undefined): part is string => part !== undefined;

export const flowRowLabel = ({ payload, protocol, messageType, transport }: FlowDetails): string => {
  const details = [protocol, messageType, transport].filter(isDefined).join(', ');
  return details ? `${payload} (${details})` : payload;
};

export const wireLabel = ({ payload, messageType, transport }: FlowDetails): string =>
  [messageType ?? payload, transport].filter(isDefined).join(' · ');

export const flowInterface = ({ protocol, messageType, transport }: FlowDetails): string => {
  const standard = protocol ?? (transport ? TRANSPORT_DETAILS[transport].standard : undefined);
  return [standard, messageType].filter(isDefined).join(' ');
};

export const uniqueTransports = (flows: readonly Pick<Flow, 'transport'>[]): readonly Transport[] => [
  ...new Set(flows.flatMap(({ transport }) => (transport ? [transport] : []))),
];

const MESSAGE_FAMILIES: readonly (readonly [RegExp, string])[] = [
  [/^[A-Z]{3}\^[A-Z0-9]{3}$/, 'HL7 v2'],
  [/^(C-[A-Z]+|[A-Z]+-RS)$/, 'DICOM'],
  [/^CDA/, 'CDA'],
  [/^FHIR/, 'FHIR'],
];

export const dataFormat = ({ protocol, messageType, transport }: FlowDetails): string | undefined =>
  protocol ??
  MESSAGE_FAMILIES.find(([pattern]) => messageType !== undefined && pattern.test(messageType))?.[1] ??
  (transport ? TRANSPORT_DETAILS[transport].standard : undefined);

const dataWireLabel = (flow: FlowDetails): string => [flow.payload, dataFormat(flow)].filter(isDefined).join(' · ');

const networkWireLabel = ({ payload, transport }: FlowDetails): string =>
  transport ? `${transport} · ${TRANSPORT_DETAILS[transport].ports}` : payload;

export const wireTexts = (flows: readonly FlowDetails[]): Readonly<Record<SheetLayerId, readonly string[]>> => ({
  logiciels: flows.map(wireLabel),
  donnees: flows.map(dataWireLabel),
  reseau: flows.map(networkWireLabel),
});

export type StationRow = { readonly kind: 'name' | 'detail'; readonly text: string };

export const plainName = (text: string): string => text.replace(/\s*\(.*\)\s*$/, '');

const DATA_ENTITIES_SHOWN = 2;

export function stationRows({ acronym, roomName, softwareExamples, data, network }: Department): Readonly<Record<SheetLayerId, readonly StationRow[]>> {
  const name: StationRow[] = acronym === roomName ? [] : [{ kind: 'name', text: roomName }];
  const details = (texts: readonly string[]): StationRow[] => texts.map((text) => ({ kind: 'detail', text }));
  return {
    logiciels: [...name, ...details(softwareExamples.slice(0, 1).map(plainName))],
    donnees: details(data.entities.slice(0, DATA_ENTITIES_SHOWN).map(plainName)),
    reseau: details(network.zones.slice(0, 1).map((zone) => ZONE_LABELS[zone])),
  };
}
