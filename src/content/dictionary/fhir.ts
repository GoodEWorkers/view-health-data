// The FHIR R4 keys of the Bundle (Bundle, Patient with its INS identifier, inpatient Encounter), in French, by path from the resource; plus the coded values they carry. See doc/sources.md F31, F32 and F40.

import type { DictionaryEntry } from './index.ts';

const BUNDLE_ENTRIES: readonly DictionaryEntry[] = [
  { ref: 'Bundle', label: 'Paquet', explain: 'Un Bundle FHIR est un paquet de ressources transportées ensemble.' },
  { ref: 'Bundle.resourceType', label: 'Type de ressource', explain: 'Chaque objet FHIR commence par son type.' },
  { ref: 'Bundle.type', label: 'Type de paquet', render: 'table:FHIRBundleType', explain: 'La raison d\'être du paquet : ici une simple collection de ressources, sans obligation de traitement.' },
  { ref: 'Bundle.entry', label: 'Entrées', explain: 'La liste des éléments du paquet.' },
  { ref: 'Bundle.entry.resource', label: 'Ressource', explain: 'Le contenu d\'une entrée : une ressource FHIR, ici un patient puis une venue.' },
];

const PATIENT_ENTRIES: readonly DictionaryEntry[] = [
  { ref: 'Patient', label: 'Patient', explain: 'La ressource FHIR qui décrit une personne soignée.' },
  { ref: 'Patient.resourceType', label: 'Type de ressource', explain: 'Chaque objet FHIR commence par son type.' },
  { ref: 'Patient.identifier', label: 'Identifiant', explain: 'Un identifiant du patient. Il y en a souvent plusieurs : ici l\'INS.' },
  { ref: 'Patient.identifier.use', label: 'Usage', render: 'table:FHIRIdentifierUse', explain: 'À quoi sert l\'identifiant : usuel, officiel, temporaire, secondaire ou ancien.' },
  { ref: 'Patient.identifier.type', label: 'Type', explain: 'Le type de l\'identifiant, sous forme de code.' },
  { ref: 'Patient.identifier.type.coding', label: 'Codage', explain: 'Un code du type, pris dans un système de codes.' },
  { ref: 'Patient.identifier.type.coding.code', label: 'Code du type', render: 'table:FRCoreIdType', explain: 'Le code du type d\'identifiant, défini par le profil français FR Core.' },
  { ref: 'Patient.identifier.system', label: 'Autorité d\'attribution', render: 'oid', explain: 'L\'espace de noms de la valeur : ici l\'OID de l\'autorité de l\'INS de test, écrit en URN.' },
  { ref: 'Patient.identifier.value', label: 'Valeur', render: 'ins', explain: 'Le numéro de l\'identifiant, unique dans son espace de noms.' },
  { ref: 'Patient.name', label: 'Nom', explain: 'Un nom du patient.' },
  { ref: 'Patient.name.family', label: 'Nom de famille', explain: 'La partie du nom qui se transmet dans la famille.' },
  { ref: 'Patient.name.given', label: 'Prénom', explain: 'Le prénom. FHIR dit « given », donné, car l\'ordre des noms varie selon les cultures.' },
  { ref: 'Patient.birthDate', label: 'Date de naissance', render: 'date', explain: 'Écrite année-mois-jour.' },
];

const ENCOUNTER_ENTRIES: readonly DictionaryEntry[] = [
  { ref: 'Encounter', label: 'Venue', explain: 'La ressource FHIR qui décrit une rencontre entre le patient et l\'hôpital : un séjour ou une consultation.' },
  { ref: 'Encounter.resourceType', label: 'Type de ressource', explain: 'Chaque objet FHIR commence par son type.' },
  { ref: 'Encounter.status', label: 'Statut', render: 'table:FHIREncounterStatus', explain: 'Où en est la venue : prévue, arrivée, en cours, terminée, annulée…' },
  { ref: 'Encounter.class', label: 'Classe', explain: 'La catégorie de la venue : hospitalisation, ambulatoire, urgences, domicile…' },
  { ref: 'Encounter.class.code', label: 'Code de la classe', render: 'table:FHIRActCode', explain: 'Le code de la classe, pris dans le système HL7 v3 ActCode.' },
  { ref: 'Encounter.subject', label: 'Patient concerné', explain: 'Le patient présent pendant la venue.' },
  { ref: 'Encounter.subject.reference', label: 'Référence', render: 'reference', explain: 'Un renvoi vers la ressource du patient : son type puis son identifiant.' },
  { ref: 'Encounter.period', label: 'Période', explain: 'Le début et la fin de la venue.' },
  { ref: 'Encounter.period.start', label: 'Début', render: 'datetime', explain: 'Le début de la venue, avec le décalage horaire.' },
  { ref: 'Encounter.location', label: 'Lieux', explain: 'Les lieux où le patient est passé pendant la venue.' },
  { ref: 'Encounter.location.location', label: 'Lieu', explain: 'Un renvoi vers le lieu où la venue se déroule.' },
  { ref: 'Encounter.location.location.display', label: 'Nom du lieu', explain: 'Le nom du lieu, pour l\'affichage : ici le lit.' },
];

const VALUE_ENTRIES: readonly DictionaryEntry[] = [
  { ref: 'FHIRBundleType:collection', label: 'Collection', explain: 'Un ensemble de ressources réunies pour être distribuées ensemble.' },
  { ref: 'FHIRIdentifierUse:official', label: 'Officiel', explain: 'L\'identifiant considéré comme officiel pour le patient.' },
  { ref: 'FRCoreIdType:INS-NIR-TEST', label: 'INS du patient fictif de test', explain: 'Le code que FR Core réserve à l\'INS d\'un patient fictif, utilisé pour les tests.' },
  { ref: 'FHIREncounterStatus:in-progress', label: 'En cours', explain: 'La venue a commencé et le patient est présent.' },
  { ref: 'FHIRActCode:IMP', label: 'Hospitalisation', explain: 'Venue d\'un patient admis dans un lieu où il passe au moins une nuit, avec chambre, repas et soins continus.' },
];

export const FHIR_ENTRIES: readonly DictionaryEntry[] = [...BUNDLE_ENTRIES, ...PATIENT_ENTRIES, ...ENCOUNTER_ENTRIES, ...VALUE_ENTRIES];
