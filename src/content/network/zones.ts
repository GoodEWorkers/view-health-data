// The four network zones of the hospital, their colours and the zone of each kind of device. Zone design is a modelling choice (doc/sources.md, assumptions 28 and 29), backed by ANSSI measure 19.

import type { DepartmentId, Flow, NetworkZone } from '../departments.ts';
import { ZONE_LABELS } from '../layerLabels.ts';

export type Zone = NetworkZone;

export type DeviceKind = 'workstation' | 'modality' | 'server';

export type ZoneInfo = {
  readonly id: Zone;
  readonly label: string;
  readonly short: string;
  readonly colour: string;
  // The share of the colour in the fill of the floor it tints: lighter zones have the paler fill, the DMZ the darkest, so the four fills stay apart without hue (cvd.ts, doc/sources.md F50).
  readonly tint: number;
  readonly explain: string;
};

type ZoneDraft = Omit<ZoneInfo, 'label'>;

const DRAFTS: readonly ZoneDraft[] = [
  {
    id: 'user-workstations',
    short: 'Postes',
    colour: '#a5b6cf',
    tint: 0.22,
    explain:
      'Les ordinateurs du personnel : accueil, soins, secrétariats. Ce sont les machines les plus exposées (messagerie, navigation, clés USB), donc on les tient à l\'écart des serveurs : un poste compromis ne doit pas ouvrir la porte aux serveurs.',
  },
  {
    id: 'hospital-servers',
    short: 'Serveurs',
    colour: '#3b506c',
    tint: 0.45,
    explain:
      'Les serveurs du système d\'information hospitalier : applications métier, bases de données et EAI. C\'est la zone de confiance où les messages HL7 v2 circulent en clair sur le port 2575.',
  },
  {
    id: 'biomedical-modalities',
    short: 'Biomédical',
    colour: '#78353c',
    tint: 0.67,
    explain:
      'Scanner, automates de laboratoire, moniteurs et appareils d\'anesthésie. Un tel appareil vit souvent plus longtemps que son système d\'exploitation et ne peut pas toujours être corrigé : on l\'isole du reste du réseau et on filtre strictement ses flux.',
  },
  {
    id: 'dmz',
    short: 'DMZ',
    colour: '#a42b10',
    tint: 0.79,
    explain:
      'La zone tampon entre l\'hôpital et Internet : le proxy et les relais y vivent, si bien qu\'aucun serveur interne ne parle directement à Internet. Elle est considérée comme sacrifiable : si un relais est compromis, on le reconstruit sans toucher au reste.',
  },
];

export const ZONES: readonly ZoneInfo[] = DRAFTS.map((draft) => ({ ...draft, label: ZONE_LABELS[draft.id] }));

const DEVICE_ZONES: Readonly<Record<DeviceKind, Zone>> = {
  workstation: 'user-workstations',
  modality: 'biomedical-modalities',
  server: 'hospital-servers',
};

// The room is part of the contract so a room could one day place a device elsewhere; today the kind decides.
export const zoneOfDevice = (_room: DepartmentId, device: DeviceKind): Zone => DEVICE_ZONES[device];

// Between applications a flow runs server to server; the one native DICOM flow is pushed by the room's modality, the scanner.
export const zonesOfFlow = (from: DepartmentId, flow: Flow): readonly [Zone, Zone] => [
  zoneOfDevice(from, flow.transport === 'DICOM' ? 'modality' : 'server'),
  zoneOfDevice(flow.to, 'server'),
];
