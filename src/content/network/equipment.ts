// The network equipment: one access switch per room; in the server room the core, firewall, WAN router and UPS; the operator box outside. Placement and redundancy are modelling choices (doc/sources.md, assumptions 29 and 34).

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId } from '../departments.ts';
import type { Zone } from './zones.ts';

export type EquipmentKind = 'switch' | 'core' | 'firewall' | 'router' | 'telecom' | 'ups';

export type Equipment = {
  readonly id: string;
  readonly room: DepartmentId;
  readonly kind: EquipmentKind;
  readonly label: string;
  readonly zone: Zone | 'edge';
  readonly explain: string;
};

const WORKSTATION_SWITCH =
  'Raccorde les ordinateurs de la salle au réseau de l\'étage. Chaque port est affecté à un réseau virtuel (VLAN) : le trafic des postes ne se mélange pas à celui des serveurs.';
const BIOMEDICAL_SWITCH =
  'Raccorde les équipements biomédicaux de la salle dans un VLAN réservé, qui ne joint le reste du réseau qu\'à travers le pare-feu.';
const SERVER_SWITCH = 'Raccorde les baies de serveurs de la salle au cœur de réseau : toutes les applications du SIH y sont branchées.';

const ACCESS_SWITCH_ZONES: Readonly<Record<DepartmentId, readonly [Zone, string]>> = {
  gam: ['user-workstations', WORKSTATION_SWITCH],
  rdv: ['user-workstations', WORKSTATION_SWITCH],
  dpi: ['user-workstations', WORKSTATION_SWITCH],
  sgl: ['biomedical-modalities', BIOMEDICAL_SWITCH],
  'pacs-ris': ['biomedical-modalities', BIOMEDICAL_SWITCH],
  pharmacie: ['user-workstations', WORKSTATION_SWITCH],
  bloc: ['biomedical-modalities', BIOMEDICAL_SWITCH],
  eai: ['hospital-servers', SERVER_SWITCH],
};

const accessSwitches: readonly Equipment[] = DEPARTMENTS.map(({ id, roomName }) => {
  const [zone, explain] = ACCESS_SWITCH_ZONES[id];
  return { id: `switch-${id}`, room: id, kind: 'switch', label: `Commutateur d'accès · ${roomName}`, zone, explain };
});

export const EQUIPMENT: readonly Equipment[] = [
  ...accessSwitches,
  {
    id: 'core-eai',
    room: 'eai',
    kind: 'core',
    label: 'Cœur de réseau',
    zone: 'hospital-servers',
    explain:
      'Le commutateur central où aboutissent tous les commutateurs d\'accès. Il est doublé : si l\'un tombe, l\'autre prend le relais. Tout le trafic entre deux zones y est dirigé vers le pare-feu.',
  },
  {
    id: 'firewall-eai',
    room: 'eai',
    kind: 'firewall',
    label: 'Pare-feu',
    zone: 'dmz',
    explain:
      'Il applique la matrice de flux : chaque règle autorise un protocole et un port d\'une zone vers une autre, et tout le reste est refusé. Il a une patte dans chaque zone, y compris la DMZ où se trouvent le proxy et les relais.',
  },
  {
    id: 'router-eai',
    room: 'eai',
    kind: 'router',
    label: 'Routeur de sortie (WAN)',
    zone: 'edge',
    explain: 'Relie l\'hôpital à son opérateur : c\'est le dernier équipement de l\'hôpital avant le boîtier de l\'opérateur.',
  },
  {
    id: 'ups-eai',
    room: 'eai',
    kind: 'ups',
    label: 'Onduleur',
    zone: 'hospital-servers',
    explain:
      'Alimente la salle serveurs et le réseau pendant une coupure d\'électricité : quelques minutes pour que le groupe électrogène démarre ou que les serveurs s\'arrêtent proprement.',
  },
  {
    id: 'telecom-eai',
    room: 'eai',
    kind: 'telecom',
    label: 'Boîtier opérateur',
    zone: 'edge',
    explain: 'Le point d\'arrivée de la liaison de l\'opérateur, hors du bâtiment. Au-delà commence Internet.',
  },
];

export const equipmentOf = (kind: EquipmentKind, room: DepartmentId): Equipment => {
  const found = EQUIPMENT.find((item) => item.kind === kind && item.room === room);
  if (found === undefined) throw new Error(`No ${kind} in room ${room}`);
  return found;
};
