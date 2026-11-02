// The one-sentence plain-French summary of each file, written from the synthetic patient and the mocks so that it never drifts from the file.

import type { DepartmentId } from '../departments.ts';
import { IMAGING_WORKLIST, LAB_RESULTS, MOCK_PATIENT, PATIENT_APPOINTMENT } from '../screenMocks.ts';
import { formatDate, formatDateTime } from './time.ts';

const patient = `${MOCK_PATIENT.firstName} ${MOCK_PATIENT.lastName}`;
const lowerFirst = (text: string): string => (text === text.toUpperCase() ? text : `${text.charAt(0).toLowerCase()}${text.slice(1)}`);
const flagged = LAB_RESULTS.filter(({ flag }) => flag !== undefined);
const flaggedText = flagged.map(({ analysis, flag }) => `${lowerFirst(analysis)} ${flag === 'B' ? 'basse' : 'élevée'}`).join(', ');
const exam = IMAGING_WORKLIST[0]!;

export const FILE_SUMMARIES: Readonly<Record<DepartmentId, string>> = {
  gam: `Ce message annonce l'admission de ${patient} en ${lowerFirst(MOCK_PATIENT.unit)}, lit ${MOCK_PATIENT.bed}.`,
  rdv: `Ce message réserve la ${lowerFirst(PATIENT_APPOINTMENT.reason)} de ${patient} avec le ${MOCK_PATIENT.physician}, le ${formatDateTime(PATIENT_APPOINTMENT.stamp)} (${PATIENT_APPOINTMENT.minutes} minutes).`,
  dpi: `Ce document est la lettre de liaison de ${patient} : retour à domicile le 5 novembre 2026, avec un suivi cardiologique à un mois.`,
  sgl: `Ce message transmet ${LAB_RESULTS.length} résultats de biologie de ${patient}, dont ${flagged.length} hors des valeurs de référence : ${flaggedText}.`,
  'pacs-ris': `Ce fichier est l'en-tête du ${lowerFirst(exam.exam)} de ${patient} du ${formatDate(MOCK_PATIENT.entryStamp)} : l'examen, le patient et la taille de l'image. L'image elle-même est stockée à part.`,
  pharmacie: `Ce message transmet deux prescriptions de ${patient}, l'amoxicilline et la warfarine, deux médicaments dont l'association demande de surveiller l'INR.`,
  bloc: `Ce message annonce le compte-rendu opératoire de ${patient} ; le document lui-même est joint sous forme encodée.`,
  eai: `Ce fichier est la version FHIR de l'admission de ${patient} : la fiche du patient avec son INS, puis sa venue en hospitalisation, lit ${MOCK_PATIENT.bed}.`,
};
