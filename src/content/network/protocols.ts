// The four protocol families the hospital carries on its wires, with the port, whether the content is encrypted, and what to tell a visitor. Ports are the IANA registrations (doc/sources.md, F20, F41).

import type { Transport } from '../departments.ts';

export type ProtocolFamily = 'mllp' | 'dicom' | 'https' | 'smtp';

export type ProtocolInfo = {
  readonly id: ProtocolFamily;
  readonly label: string;
  readonly colour: string;
  // Stroke dash pattern of the cable in plate units, the cue that does not depend on colour: empty is a solid line.
  readonly dash: readonly number[];
  readonly ports: string;
  readonly encrypted: boolean;
  readonly explain: string;
};

export const PROTOCOL_FAMILIES: readonly ProtocolInfo[] = [
  {
    id: 'mllp',
    label: 'HL7 v2 sur MLLP',
    colour: '#005191',
    dash: [],
    ports: '2575',
    encrypted: false,
    explain:
      'Les messages HL7 v2 voyagent sur TCP, encadrés par trois octets : 0x0B au début, 0x1C puis 0x0D à la fin. Rien n\'est chiffré ni authentifié, ce qui n\'est acceptable qu\'à l\'intérieur des zones de confiance.',
  },
  {
    id: 'dicom',
    label: 'DICOM',
    colour: '#e59500',
    dash: [6, 3],
    ports: '104 ou 11112',
    encrypted: false,
    explain:
      'Les images et leurs requêtes (envoi, liste de travail) voyagent sur TCP, port 104 ou 11112. Par défaut rien n\'est chiffré ; une variante sur TLS existe, enregistrée au port 2762.',
  },
  {
    id: 'https',
    label: 'HTTPS',
    colour: '#209265',
    dash: [1.5, 3],
    ports: '443',
    encrypted: true,
    explain:
      'Les échanges web sont chiffrés par TLS : un observateur du réseau voit le nom du serveur demandé (SNI) mais pas le contenu. C\'est le protocole des échanges avec l\'extérieur.',
  },
  {
    id: 'smtp',
    label: 'SMTP sécurisé',
    colour: '#cc81b4',
    dash: [6, 3, 1.5, 3],
    ports: '587',
    encrypted: true,
    explain:
      'La messagerie sécurisée de santé (MSSanté) dépose les courriers au port 587 et les protège par TLS, entre opérateurs comme entre l\'établissement et son opérateur.',
  },
];

const FAMILY_OF_TRANSPORT: Readonly<Record<Transport, ProtocolFamily>> = {
  MLLP: 'mllp',
  DICOM: 'dicom',
  HTTPS: 'https',
  SMTP: 'smtp',
};

export const familyOf = (transport: Transport): ProtocolFamily => FAMILY_OF_TRANSPORT[transport];

export const protocolOf = (transport: Transport): ProtocolInfo => PROTOCOL_FAMILIES.find(({ id }) => id === familyOf(transport))!;
