// The one list of each room's anchor device: a screen-bearing workstation monitor. Cables end under it and a later zoom lands on its screen face, whose four corners are exported in world and plate units.

import type { DepartmentId } from '../../content/departments.ts';
import type { Flat, Plane, Point3 } from '../../iso/iso-kit.ts';
import { at } from './camera.ts';
import { monitorScreen } from './furniture.ts';
import type { Screen } from './furniture.ts';
import { GAM_SCREEN } from './rooms/admissions.ts';
import { RDV_SCREEN } from './rooms/appointments.ts';
import { PACS_SCREEN } from './rooms/imaging.ts';
import { SGL_SCREEN } from './rooms/laboratory.ts';
import { DPI_SCREEN } from './rooms/nursingStation.ts';
import { PHARMACY_SCREEN } from './rooms/pharmacy.ts';
import { EAI_SCREEN } from './rooms/serverRoom.ts';
import { BLOC_SCREEN } from './rooms/theatre.ts';

export const DEVICE_SCREENS: Readonly<Record<DepartmentId, Screen>> = {
  gam: GAM_SCREEN,
  rdv: RDV_SCREEN,
  dpi: DPI_SCREEN,
  sgl: SGL_SCREEN,
  'pacs-ris': PACS_SCREEN,
  pharmacie: PHARMACY_SCREEN,
  bloc: BLOC_SCREEN,
  eai: EAI_SCREEN,
};

export const deviceAnchor = (id: DepartmentId): Plane => DEVICE_SCREENS[id].centre;

export const screenQuadOf = (id: DepartmentId): readonly Point3[] => monitorScreen(DEVICE_SCREENS[id]);

export const screenQuadOnPlate = (id: DepartmentId): readonly Flat[] => screenQuadOf(id).map(at);
