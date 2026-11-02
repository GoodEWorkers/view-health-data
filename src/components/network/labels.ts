// The French fixed texts of the Réseau views that the content model does not carry: how a firewall rule names its ends, what the highlighted bytes of a capture are, the paths of an external exchange.

import type { ExternalZone } from '../../content/departments.ts';
import type { RuleEnd } from '../../content/network/firewall.ts';
import type { ProtocolFamily } from '../../content/network/protocols.ts';
import type { Zone } from '../../content/network/zones.ts';

export const END_LABELS: Readonly<Record<RuleEnd, string>> = {
  'user-workstations': 'Postes utilisateurs',
  'hospital-servers': 'Serveurs du SIH',
  'biomedical-modalities': 'Modalités biomédicales',
  dmz: 'DMZ',
  outside: 'Extérieur de l\'hôpital',
  any: 'Toute zone',
};

export const FRAMING_CAPTIONS: Readonly<Record<ProtocolFamily | 'vpn', string>> = {
  mllp: 'En surbrillance : l\'encadrement MLLP, octet 0x0B au début du message, octets 0x1C 0x0D à la fin.',
  dicom: 'En surbrillance : l\'en-tête de PDU, les six premiers octets de chaque unité DICOM.',
  https: 'En surbrillance : le ClientHello, premier message du chiffrement TLS.',
  smtp: 'En surbrillance : le ClientHello qui suit la commande STARTTLS.',
  vpn: 'En surbrillance : les paquets ESP, qui portent le trafic chiffré dans le tunnel.',
};

export const PATH_LABELS: Readonly<Record<ExternalZone, string>> = {
  proxy: 'Proxy sortant',
  dmz: 'Relais de la DMZ',
  vpn: 'Tunnel VPN',
};

// « outside » and « any » are ends of a rule that no zone colour stands for.
export const zoneOfEnd = (end: RuleEnd): Zone | undefined => (end === 'outside' || end === 'any' ? undefined : end);
