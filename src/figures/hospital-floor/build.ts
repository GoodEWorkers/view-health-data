// Assembles Figure 1: baseboard, floors, flat ground marks, room numerals, trunking, walls, standing furniture room by room from back to front, then door leaves.

import { figureSvg, groupSvg, plateHtml } from '../../iso/iso-kit.ts';
import { DEPARTMENTS } from '../../content/departments.ts';
import type { DepartmentId } from '../../content/departments.ts';
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
import { floorsSvg, leavesSvg, numeralsSvg, trunkingSvg, wallsSvg } from './structure.ts';

const FIGURE_NUMBER = 'Fig. 1';
const TITLE = 'Plan de l\'hôpital';
const HINT = 'Survolez une salle ou utilisez les flèches';
const READOUT = 'Huit salles, un étage';
const FIGURE_LABEL =
  'Maquette d\'architecte d\'un étage d\'hôpital posée sur un socle et coupée bas, de sorte que chaque salle se voit d\'en haut. ' +
  'Huit salles reconnaissables à leur mobilier entourent un couloir en anneau, ' +
  'et des goulottes de câbles au sol desservent chaque porte et aboutissent dans la salle serveurs.';
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

export function hospitalFloorCard(): string {
  const figure = figureSvg({
    width: VIEW_BOX.width,
    height: VIEW_BOX.height,
    label: FIGURE_LABEL,
    body: [baseboardSvg(), floorsSvg(), roomPartsSvg(isOnGround), numeralsSvg(), trunkingSvg(), wallsSvg(), roomPartsSvg(isStanding), leavesSvg()],
  });
  return plateHtml({
    fig: FIGURE_NUMBER,
    title: TITLE,
    hint: HINT,
    readout: READOUT,
    keys: DEPARTMENTS.map(({ acronym, roomName }, index) => ({
      mark: 'raised',
      label: `${index + 1} ${acronym === roomName ? roomName : `${acronym} · ${roomName}`}`,
    })),
    body: `<div class="iso-stage" tabindex="0" role="group" aria-label="${STAGE_LABEL}">${figure}</div>`,
  });
}

const isStanding = (part: Part): boolean => !isOnGround(part);

function roomPartsSvg(keep: (part: Part) => boolean): string {
  const byRoomDepth = [...ROOMS].sort((first, second) => roomDepth(first.plan) - roomDepth(second.plan));
  return byRoomDepth.map(({ id }) => groupSvg(paint(ROOM_PARTS[id]().filter(keep)), { 'data-room': id })).join('');
}

const roomDepth = ({ x, y, w, d }: { x: number; y: number; w: number; d: number }) => depth([x + w / 2, y + d / 2, 0]);
