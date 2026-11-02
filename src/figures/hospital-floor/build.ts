// Assembles Figure 1: baseboard, floors, numerals, zone patches and ground marks, trunking, cables with their packet layer, walls, selection outlines, standing furniture back to front, door leaves, then the labels on top.

import { figureSvg, plateHtml } from '../../iso/iso-kit.ts';
import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId } from '../../content/departments.ts';
import { DEFAULT_LAYER, layerById } from '../../content/layers.ts';
import { cablesSvg } from './cables.ts';
import { networkLegendHtml } from './networkLegend.ts';
import { networkParts } from './networkParts.ts';
import { labelsSvg } from './cableLabels.ts';
import { VIEW_BOX, depth } from './camera.ts';
import { isOnGround, paint } from './parts.ts';
import type { Part } from './parts.ts';
import { ROOMS } from './model.ts';
import { appointmentsParts } from './rooms/appointments.ts';
import { admissionsParts } from './rooms/admissions.ts';
import { imagingParts } from './rooms/imaging.ts';
import { laboratoryParts } from './rooms/laboratory.ts';
import { nursingStationParts } from './rooms/nursingStation.ts';
import { pharmacyParts } from './rooms/pharmacy.ts';
import { serverRoomParts } from './rooms/serverRoom.ts';
import { theatreParts } from './rooms/theatre.ts';
import { baseboardSvg } from './shell.ts';
import { floorsSvg, leavesSvg, numeralsSvg, roomGroup, selectionsSvg, trunkingSvg, wallsSvg } from './structure.ts';
import { zonePatchesSvg, zonePatternsSvg } from './zonePatches.ts';

const FIGURE_NUMBER = 'Fig. 1';
const READOUT = 'Huit salles, un étage';
export const SCREENS_MARKER = '<!--screens-->';
const FIGURE_LABEL =
  'Maquette d\'architecte d\'un étage d\'hôpital posée sur un socle et coupée bas, de sorte que chaque salle se voit d\'en haut. ' +
  'Huit salles reconnaissables à leur mobilier entourent un couloir en anneau, ' +
  'et des goulottes de câbles au sol desservent chaque porte et aboutissent dans la salle serveurs. ' +
  'Sur les couches logiciels, données et réseau, les équipements informatiques de chaque salle s\'allument et des câbles colorés les relient.';
const STAGE_LABEL = 'Maquette de l\'étage d\'hôpital. Les flèches du clavier permettent de passer d\'une des huit salles à la suivante.';

const ROOM_PARTS: Record<DepartmentId, () => readonly Part[]> = {
  gam: admissionsParts,
  rdv: appointmentsParts,
  dpi: nursingStationParts,
  sgl: laboratoryParts,
  'pacs-ris': imagingParts,
  pharmacie: pharmacyParts,
  bloc: theatreParts,
  eai: serverRoomParts,
};

const ROOM_KEYS = '<span class="iso-keys" data-keys="rooms">';

export function hospitalFloorCard(): string {
  const { title, hint } = layerById(DEFAULT_LAYER);
  const figure = figureSvg({
    width: VIEW_BOX.width,
    height: VIEW_BOX.height,
    label: FIGURE_LABEL,
    body: [
      zonePatternsSvg(),
      baseboardSvg(),
      floorsSvg(),
      numeralsSvg(),
      zonePatchesSvg(),
      roomPartsSvg(isOnGround),
      trunkingSvg(),
      cablesSvg(),
      wallsSvg(),
      selectionsSvg(),
      roomPartsSvg(isStanding),
      leavesSvg(),
      labelsSvg(),
    ],
  });
  const plate = plateHtml({
    fig: FIGURE_NUMBER,
    title,
    hint,
    readout: READOUT,
    keys: DEPARTMENTS.map(({ acronym, roomName }, index) => ({
      mark: 'raised',
      label: `${index + 1} ${acronym === roomName ? roomName : `${acronym} · ${roomName}`}`,
    })),
    body: `<div class="iso-stage" tabindex="0" role="group" aria-label="${STAGE_LABEL}">${figure}${SCREENS_MARKER}</div>`,
  });
  return plate.replace('<span class="iso-keys">', ROOM_KEYS).replace('</figcaption>', `${networkLegendHtml()}</figcaption>`);
}

const isStanding = (part: Part): boolean => !isOnGround(part);

function roomPartsSvg(keep: (part: Part) => boolean): string {
  const byRoomDepth = [...ROOMS].sort((first, second) => roomDepth(first.plan) - roomDepth(second.plan));
  return byRoomDepth.map(({ id }) => roomGroup(paint([...ROOM_PARTS[id](), ...networkParts(id)].filter(keep)), id)).join('');
}

const roomDepth = ({ x, y, w, d }: { x: number; y: number; w: number; d: number }) => depth([x + w / 2, y + d / 2, 0]);
