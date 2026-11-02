// Lookups on the eight rooms of departments.ts shared by the hops, the captures and the sheets.

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId } from '../departments.ts';

export const indexOfRoom = (room: DepartmentId): number => DEPARTMENTS.findIndex(({ id }) => id === room);

export const acronymOf = (room: DepartmentId): string => DEPARTMENTS[indexOfRoom(room)]!.acronym;
