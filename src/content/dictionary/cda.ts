// The HL7 CDA R2 elements and attributes of the lettre de liaison, in French, by path from the root element (ClinicalDocument is the root and is left out). See doc/sources.md F39.

import type { DictionaryEntry } from './index.ts';

export const CDA_ROOT = 'ClinicalDocument';

export const CDA_ENTRIES: readonly DictionaryEntry[] = [
  { ref: 'ClinicalDocument', label: 'Document clinique', explain: 'L\'élément racine : tout le document. Son en-tête décrit le patient, l\'auteur et le type de document, puis un corps contient le texte.' },
  { ref: 'ClinicalDocument@xmlns', label: 'Espace de noms', render: 'text', explain: 'Dit à quel langage appartiennent les éléments : ici HL7 v3, sur lequel CDA est construit.' },
  { ref: 'templateId', label: 'Modèle de document', explain: 'Annonce le modèle ou le profil que le document prétend respecter. Ce n\'est pas l\'identifiant du document.' },
  { ref: 'templateId@root', label: 'Identifiant du modèle', explain: 'L\'identifiant (OID) du modèle de document.' },
  { ref: 'code', label: 'Type de document', explain: 'Le genre de document, désigné par un code.' },
  { ref: 'code@code', label: 'Code du type', render: 'code', explain: 'Le code LOINC du type de document : 34105-7 désigne une lettre de liaison de sortie (Hospital discharge summary).' },
  { ref: 'code@displayName', label: 'Libellé du type', explain: 'Le nom du type de document, en clair, pour l\'affichage.' },
  { ref: 'recordTarget', label: 'Patient', explain: 'La cible du dossier : le patient auquel le document appartient.' },
  { ref: 'recordTarget/patientRole', label: 'Rôle de patient', explain: 'Le rôle de patient de la personne : il regroupe ses identifiants et son identité.' },
  { ref: 'recordTarget/patientRole/id', label: 'Identifiant du patient', explain: 'Un identifiant du patient : l\'autorité qui l\'a attribué (root) et le numéro lui-même (extension).' },
  { ref: 'recordTarget/patientRole/id@root', label: 'Autorité d\'attribution', render: 'oid', explain: 'L\'OID de l\'autorité qui a attribué l\'identifiant : ici l\'autorité de l\'INS de test.' },
  { ref: 'recordTarget/patientRole/id@extension', label: 'Numéro', render: 'ins', explain: 'Le numéro de l\'identifiant dans le périmètre de l\'autorité : ici l\'INS du patient.' },
  { ref: 'recordTarget/patientRole/patient', label: 'Personne', explain: 'La personne qui est le patient.' },
  { ref: 'recordTarget/patientRole/patient/name', label: 'Nom', explain: 'Le nom du patient, tel qu\'il s\'affiche.' },
  { ref: 'author', label: 'Auteur', explain: 'Qui a rédigé le document : une personne ou une machine.' },
  { ref: 'author/assignedAuthor', label: 'Auteur désigné', explain: 'Le rôle d\'auteur de la personne : il porte son identité.' },
  { ref: 'author/assignedAuthor/assignedPerson', label: 'Personne auteur', explain: 'L\'humain qui a rédigé le document.' },
  { ref: 'author/assignedAuthor/assignedPerson/name', label: 'Nom de l\'auteur', explain: 'Le nom de l\'auteur, tel qu\'il s\'affiche.' },
  { ref: 'component', label: 'Contenu clinique', explain: 'Le corps du document : il contient le texte que le médecin a écrit.' },
  { ref: 'component/structuredBody', label: 'Corps structuré', explain: 'Un corps composé de sections.' },
  { ref: 'component/structuredBody/component', label: 'Composant', explain: 'Enveloppe d\'une section du corps.' },
  { ref: 'component/structuredBody/component/section', label: 'Section', explain: 'Un bloc du corps du document, avec son texte.' },
  { ref: 'component/structuredBody/component/section/text', label: 'Texte narratif', explain: 'Le texte destiné à être lu par une personne.' },
  { ref: 'component/structuredBody/component/section/text/paragraph', label: 'Paragraphe', explain: 'Un paragraphe du texte, comme dans une page web.' },
];
