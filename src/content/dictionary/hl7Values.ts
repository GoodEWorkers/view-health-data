// The coded values of the eight files, in French: HL7 table values (ref HL7<table>:<value>), message types, units, LOINC document types and the national authorities named by their OID.

import type { DictionaryEntry } from './index.ts';

const TABLE_VALUES: readonly DictionaryEntry[] = [
  { ref: 'HL70001:M', label: 'Masculin' },
  { ref: 'HL70004:I', label: 'Hospitalisation', explain: 'Patient hospitalisé : la classe « inpatient » de la table HL7 0004.' },
  { ref: 'HL70078:L', label: 'Bas', explain: 'Résultat inférieur à la valeur de référence basse.' },
  { ref: 'HL70078:H', label: 'Élevé', explain: 'Résultat supérieur à la valeur de référence haute.' },
  { ref: 'HL70085:F', label: 'Résultat final', explain: 'Le résultat est validé et ne changera plus sans correction.' },
  { ref: 'HL70103:T', label: 'Entraînement', explain: 'Message de test ou de formation, à ne pas traiter comme des données réelles.' },
  { ref: 'HL70119:RE', label: 'Observations ou actes à suivre', explain: 'Code de contrôle de la commande : des observations ou des actes suivront.' },
  { ref: 'HL70123:F', label: 'Résultat final' },
  { ref: 'HL70125:NM', label: 'Numérique', explain: 'La valeur du résultat est un nombre.' },
  { ref: 'HL70125:ED', label: 'Document encapsulé', explain: 'La valeur du résultat est un document ou une image encodés dans le message.' },
  { ref: 'HL70136:N', label: 'Non' },
  { ref: 'HL70191:TEXT', label: 'Texte', explain: 'Le contenu du document est un texte lisible par une machine.' },
  { ref: 'HL70206:A', label: 'Ajout', explain: 'Le message ajoute cet élément.' },
  { ref: 'HL70211:UNICODE UTF-8', label: 'Unicode UTF-8' },
  { ref: 'HL70271:AU', label: 'Authentifié', explain: 'Le document a été relu et signé par son auteur.' },
  { ref: 'HL70278:Booked', label: 'Réservé' },
  { ref: 'ISO3166:FRA', label: 'France' },
  { ref: 'ISO639:FR', label: 'Français' },
  { ref: 'ZBE4:INSERT', label: 'Insertion d\'un nouveau mouvement', explain: 'Le mouvement est ajouté à la fin de la séquence des mouvements de la venue.' },
  { ref: 'ZBE9:HMS', label: 'Changement conjoint de l\'hébergement, de la responsabilité médicale et des soins' },
  { ref: 'UCUM:min', label: 'minutes' },
  { ref: 'UCUM:g', label: 'grammes' },
  { ref: 'UCUM:mg', label: 'milligrammes' },
  { ref: 'HL70335:TID', label: '3 fois par jour' },
  { ref: 'HL70335:QD', label: '1 fois par jour' },
];

const MESSAGE_TYPES: readonly DictionaryEntry[] = [
  { ref: 'MSG:ADT^A01', label: 'Admission d\'un patient', explain: 'ADT : mouvements de patients. A01 : admission ou début de venue.' },
  { ref: 'MSG:SIU^S12', label: 'Nouveau rendez-vous', explain: 'SIU : planification. S12 : notification de la réservation d\'un rendez-vous.' },
  { ref: 'MSG:ORU^R01', label: 'Résultats d\'observations', explain: 'ORU : résultats. R01 : résultats envoyés spontanément par le laboratoire.' },
  { ref: 'MSG:RDE^O11', label: 'Commande de médicaments encodée', explain: 'RDE : commande encodée par la pharmacie. O11 : prescription et traitement.' },
  { ref: 'MSG:MDM^T02', label: 'Nouveau document avec son contenu', explain: 'MDM : gestion de documents. T02 : notification d\'un document et de son contenu.' },
];

const CODES: readonly DictionaryEntry[] = [
  { ref: 'LN:11504-8', label: 'Compte rendu opératoire' },
  { ref: 'LN:34105-7', label: 'Lettre de liaison de sortie' },
  { ref: 'OID:1.2.250.1.213.1.4.10', label: 'autorité INS-NIR test', explain: 'Les INS fictifs de ce site sont attribués sous l\'autorité de test, jamais sous l\'autorité de production.' },
  { ref: 'OID:1.2.250.1.213.1.4.8', label: 'autorité INS-NIR' },
  { ref: 'ID:PI', label: 'Identifiant patient interne', explain: 'Type PI de la table HL7 0203 : l\'identifiant attribué par l\'établissement.' },
  { ref: 'ID:VN', label: 'Numéro de venue', explain: 'Type VN de la table HL7 0203.' },
  { ref: 'ID:AN', label: 'Numéro de compte', explain: 'Type AN de la table HL7 0203.' },
  { ref: 'ID:INS', label: 'INS', explain: 'Identité nationale de santé, l\'identifiant unique du patient dans tout le système de santé français.' },
  { ref: 'SYSTEM:LN', label: 'LOINC' },
  { ref: 'SYSTEM:ATC', label: 'ATC' },
  { ref: 'APP:GAM', label: 'Gestion administrative des malades' },
  { ref: 'APP:DPI', label: 'Dossier patient informatisé' },
  { ref: 'APP:RDV', label: 'Gestion des rendez-vous' },
  { ref: 'APP:GLIMS', label: 'Système de gestion de laboratoire' },
  { ref: 'APP:PHARMA', label: 'Pharmacie' },
  { ref: 'APP:OPROOM', label: 'Gestion du bloc opératoire' },
  { ref: 'POINT:CARDIO', label: 'Cardiologie' },
  { ref: 'POINT:BLOC', label: 'Bloc opératoire' },
  { ref: 'ROOM:CARDIO', label: 'chambre' },
  { ref: 'ROOM:BLOC', label: 'salle' },
];

export const HL7_VALUE_ENTRIES: readonly DictionaryEntry[] = [...TABLE_VALUES, ...MESSAGE_TYPES, ...CODES];
