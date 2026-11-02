// The stations a flow crosses, from the sending device to the EAI, the destination or the outside. HL7 v2 and DICOM flows transit the EAI (doc/sources.md, assumptions 3 and 31); a flow that leaves the hospital passes the firewall once.

import type { DepartmentId, ExternalFlow, Flow } from '../departments.ts';
import { equipmentOf } from './equipment.ts';
import type { EquipmentKind } from './equipment.ts';
import { partnerOfExternal } from './partners.ts';
import { acronymOf } from './rooms.ts';
import { zoneOfDevice, zonesOfFlow } from './zones.ts';
import type { DeviceKind, Zone } from './zones.ts';

export type HopKind = 'device' | 'switch' | 'core' | 'firewall' | 'eai' | 'router' | 'proxy' | 'vpn' | 'outside';

export type Hop = {
  readonly kind: HopKind;
  readonly room?: DepartmentId;
  readonly zone?: Zone | 'edge';
  readonly label: string;
  readonly detail: string;
};

const MODALITY_LABELS: Readonly<Partial<Record<DepartmentId, string>>> = {
  sgl: 'Automate d\'analyse',
  'pacs-ris': 'Scanner',
  bloc: 'Appareil d\'anesthésie',
};

function deviceHop(room: DepartmentId, device: DeviceKind): Hop {
  const zone = zoneOfDevice(room, device);
  if (device === 'modality') {
    return { kind: 'device', room, zone, label: MODALITY_LABELS[room] ?? 'Équipement biomédical', detail: 'Il est dans la zone biomédicale : son système ne se corrige pas comme un poste, donc tout ce qu\'il envoie passe par le pare-feu.' };
  }
  return { kind: 'device', room, zone, label: `Serveur ${acronymOf(room)}`, detail: `Le logiciel ${acronymOf(room)} tourne sur un serveur de la zone des serveurs du SIH, où il émet le message.` };
}

const stationOf = (kind: EquipmentKind & HopKind, room: DepartmentId): Hop => {
  const { zone, label, explain } = equipmentOf(kind, room);
  return { kind, room, zone, label, detail: explain };
};

const switchHop = (room: DepartmentId): Hop => stationOf('switch', room);
const coreHop = (): Hop => stationOf('core', 'eai');
const firewallHop = (): Hop => stationOf('firewall', 'eai');
const routerHop = (): Hop => stationOf('router', 'eai');

const eaiHop = (): Hop => ({
  kind: 'eai',
  room: 'eai',
  zone: 'hospital-servers',
  label: 'EAI',
  detail: 'L\'EAI reçoit le message, le contrôle, le trace pour pouvoir le rejouer, puis l\'achemine vers son destinataire.',
});

const EXIT_HOPS: Readonly<Record<ExternalFlow['zone'], Hop>> = {
  proxy: {
    kind: 'proxy',
    room: 'eai',
    zone: 'dmz',
    label: 'Proxy sortant',
    detail: 'Aucun serveur ne sort directement : le proxy relaie la connexion, authentifie la demande et la journalise.',
  },
  dmz: {
    kind: 'proxy',
    room: 'eai',
    zone: 'dmz',
    label: 'Relais de la DMZ',
    detail: 'Un relais placé en DMZ échange à la place du serveur interne : s\'il est compromis, on le reconstruit sans toucher aux serveurs.',
  },
  vpn: {
    kind: 'vpn',
    room: 'eai',
    zone: 'dmz',
    label: 'Tunnel VPN',
    detail: 'Le trafic est chiffré jusqu\'au correspondant : entre les deux extrémités du tunnel, personne ne lit les images.',
  },
};

const outsideHop = (flow: ExternalFlow): Hop => ({
  kind: 'outside',
  zone: 'edge',
  label: flow.partner,
  detail: `Exploité par ${partnerOfExternal(flow).operator}, hors de l'hôpital.`,
});

export function hopsOf(from: DepartmentId, flow: Flow): readonly Hop[] {
  const [source] = zonesOfFlow(from, flow);
  const origin =
    source === 'biomedical-modalities'
      ? [deviceHop(from, 'modality'), switchHop(from), coreHop(), firewallHop()]
      : [deviceHop(from, 'server'), coreHop()];
  if (flow.to === 'eai') return [...origin, eaiHop()];
  // A DICOMweb retrieval is a client asking a server: the DPI fetches the images from the PACS/RIS without the EAI (assumption 27).
  if (flow.transport === 'HTTPS') return [...origin, deviceHop(flow.to, 'server')];
  return [...origin, eaiHop(), coreHop(), deviceHop(flow.to, 'server')];
}

export const hopsOfExternal = (from: DepartmentId, flow: ExternalFlow): readonly Hop[] => [
  deviceHop(from, 'server'),
  coreHop(),
  firewallHop(),
  EXIT_HOPS[flow.zone],
  routerHop(),
  outsideHop(flow),
];
