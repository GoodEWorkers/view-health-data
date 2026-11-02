// The standards the messages and files follow: HL7 v2 message types and segments, CDA, FHIR, DICOM, the code systems and the data formats. Facts and sources: doc/sources.md (F1 to F5, F15 to F19, F64 to F72).

import type { GlossaryEntry } from './glossary.ts';

const HL7_ADMISSION_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch03.html';
const HL7_ORDER_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch04.html';
const HL7_RESULT_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch07.html';
const HL7_DOCUMENT_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch09.html';
const HL7_SCHEDULING_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch10.html';
const HL7_MESSAGE_CHAPTER = 'https://www.hl7.eu/HL7v2x/v251/std251/ch02.html';
const DICOM_SERVICES = 'https://dicom.nema.org/medical/dicom/current/output/chtml/part07/chapter_9.html';
const DICOM_WEB = 'https://dicom.nema.org/medical/dicom/current/output/chtml/part18/chapter_10.html';
const DICOM_NETWORK = 'https://dicom.nema.org/medical/dicom/current/output/chtml/part08/chapter_9.html';

export const STANDARDS_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: 'HL7 v2',
    expansion: 'Health Level Seven, version 2',
    definition: 'Standard de messages de santé : un texte découpé en segments (MSH, PID, OBX…) dont les champs sont séparés par des barres verticales. Un ADT annonce une admission, un ORU rend un résultat.',
    source: HL7_MESSAGE_CHAPTER,
  },
  {
    term: 'ADT',
    expansion: 'Admit, Discharge, Transfer',
    definition: 'Le message HL7 v2 qui annonce un événement du séjour : A01 l\'admission, A02 le transfert, A03 la sortie, A08 la mise à jour de l\'identité.',
    source: HL7_ADMISSION_CHAPTER,
  },
  {
    term: 'ORM',
    expansion: 'General order message',
    definition: 'Le message HL7 v2 de commande générale, par exemple une demande d\'examen d\'imagerie (ORM^O01).',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'OML',
    expansion: 'Laboratory order message',
    definition: 'Le message HL7 v2 qui transmet une commande d\'analyses au laboratoire (OML^O21).',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'OMP',
    expansion: 'Pharmacy/treatment order message',
    definition: 'Le message HL7 v2 qui transmet à la pharmacie une prescription de médicaments ou de traitement (OMP^O09).',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'RDE',
    expansion: 'Pharmacy/treatment encoded order message',
    definition: 'Le message HL7 v2 par lequel la pharmacie renvoie la prescription sous une forme codée : médicament, dose et rythme de prise (RDE^O11).',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'RRE',
    expansion: 'Encoded order acknowledgment message',
    definition: 'Le message HL7 v2 qui accuse réception d\'une prescription codée (RRE^O12).',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'ORU',
    expansion: 'Unsolicited observation message',
    definition: 'Le message HL7 v2 qui rend des résultats sans qu\'on les ait demandés dans ce message : ceux d\'un laboratoire, par exemple (ORU^R01).',
    source: HL7_RESULT_CHAPTER,
  },
  {
    term: 'SIU',
    expansion: 'Schedule Information Unsolicited',
    definition: 'Le message HL7 v2 par lequel un logiciel d\'agenda annonce une modification de son planning, comme une nouvelle réservation (SIU^S12).',
    source: HL7_SCHEDULING_CHAPTER,
  },
  {
    term: 'MDM',
    expansion: 'Medical Document Management',
    definition: 'Le message HL7 v2 qui annonce un document, nouveau ou modifié, avec ou sans son contenu : un compte-rendu opératoire, par exemple (MDM^T02).',
    source: HL7_DOCUMENT_CHAPTER,
  },
  {
    term: 'MSH',
    expansion: 'Message header segment',
    definition: 'Le segment d\'en-tête de tout message HL7 v2 : qui l\'envoie, qui le reçoit, de quel type il est et dans quelle version.',
    source: HL7_MESSAGE_CHAPTER,
  },
  {
    term: 'PID',
    expansion: 'Patient identification segment',
    definition: 'Le segment HL7 v2 qui porte l\'identité du patient : identifiants, nom, date de naissance et sexe.',
    source: HL7_ADMISSION_CHAPTER,
  },
  {
    term: 'PV1',
    expansion: 'Patient visit segment',
    definition: 'Le segment HL7 v2 qui décrit la venue du patient : sa classe, son lieu, son médecin et le numéro de venue.',
    source: HL7_ADMISSION_CHAPTER,
  },
  {
    term: 'OBX',
    expansion: 'Observation/result segment',
    definition: 'Le segment HL7 v2 qui porte une observation : l\'analyse, sa valeur, son unité et les valeurs normales, à raison d\'une ligne par résultat.',
    source: HL7_RESULT_CHAPTER,
  },
  {
    term: 'TQ1',
    expansion: 'Timing/quantity segment',
    definition: 'Le segment HL7 v2 qui indique quand et à quel rythme une prestation ou un traitement a lieu ; il remplace d\'anciens champs de durée et de rythme.',
    source: HL7_ORDER_CHAPTER,
  },
  {
    term: 'ZBE',
    definition: 'Le segment propre à la France, une extension du profil PAM : il décrit le mouvement du patient, par exemple son entrée dans une unité.',
    source: 'https://github.com/Interop-Sante/ihe.iti.pam.fr',
  },
  {
    term: 'CDA',
    expansion: 'Clinical Document Architecture',
    definition: 'Le format HL7 des documents cliniques, en XML : il fixe la structure d\'une lettre de liaison ou d\'un compte-rendu pour que d\'autres logiciels les lisent. La version utilisée en France est la CDA R2.',
    source: 'https://www.hl7.org/implement/standards/product_brief.cfm?product_id=7',
  },
  {
    term: 'FHIR',
    expansion: 'Fast Healthcare Interoperability Resources',
    definition: 'Standard HL7 d\'échange de données de santé sous forme de ressources (Patient, Encounter…) en JSON ou en XML, par des API web. L\'API de Mon espace santé en est un exemple.',
    source: 'https://hl7.org/fhir/R4/',
  },
  {
    term: 'FR Core',
    definition: 'Le guide de HL7 France qui fixe l\'usage de FHIR en France : profils du patient, des professionnels et des structures, et extensions françaises comme l\'INS.',
    source: 'https://hl7.fr/ig/fhir/core/',
  },
  {
    term: 'DICOM',
    expansion: 'Digital Imaging and Communications in Medicine',
    definition: 'Standard des images médicales : il décrit le fichier d\'image et le dialogue réseau (association, envoi C-STORE, liste de travail C-FIND). Port 104 ou 11112.',
    source: DICOM_NETWORK,
  },
  {
    term: 'C-STORE',
    definition: 'Le service DICOM par lequel un appareil, comme le scanner, envoie une image à un serveur d\'images.',
    source: DICOM_SERVICES,
  },
  {
    term: 'C-FIND',
    definition: 'Le service DICOM de recherche : l\'appareil l\'utilise pour demander sa liste de travail, c\'est-à-dire les examens à réaliser.',
    source: DICOM_SERVICES,
  },
  {
    term: 'PDU',
    expansion: 'Protocol Data Unit',
    definition: 'L\'unité de message du protocole DICOM : un premier PDU ouvre l\'association entre deux appareils, puis d\'autres portent les données.',
    source: DICOM_NETWORK,
  },
  {
    term: 'SR',
    expansion: 'Structured Report',
    definition: 'Le compte-rendu structuré de DICOM : un rapport d\'examen rangé en rubriques que les logiciels savent lire, échangé comme une image.',
    source: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part03/sect_A.35.html',
  },
  {
    term: 'WADO-RS',
    definition: 'Le service d\'images de DICOM sur le web : un logiciel récupère une image par une simple requête web, c\'est ainsi que le DPI ouvre les images du PACS.',
    source: DICOM_WEB,
  },
  {
    term: 'IHE',
    expansion: 'Integrating the Healthcare Enterprise',
    definition: 'L\'initiative internationale qui écrit des profils d\'usage de HL7 et de DICOM, pour que des logiciels de fournisseurs différents échangent vraiment.',
    source: 'https://profiles.ihe.net/ITI/TF/Volume1/ch-1.html',
  },
  {
    term: 'PAM',
    expansion: 'Patient Administration Management',
    definition: 'Le profil IHE qui cadre les messages HL7 v2 d\'identité, de venue et de mouvement du patient ; la France y ajoute une extension nationale.',
    source: 'https://github.com/Interop-Sante/ihe.iti.pam.fr',
  },
  {
    term: 'LOINC',
    expansion: 'Logical Observation Identifiers Names and Codes',
    definition: 'La nomenclature internationale des examens et des mesures : un code désigne une analyse sans ambiguïté, 718-7 par exemple l\'hémoglobine.',
    source: 'https://www.regenstrief.org/real-world-solutions/loinc/',
  },
  {
    term: 'ATC',
    expansion: 'Anatomical Therapeutic Chemical',
    definition: 'La classification des médicaments de l\'Organisation mondiale de la santé : chaque substance a son code, J01CA04 pour l\'amoxicilline.',
    source: 'https://www.who.int/tools/atc-ddd-toolkit/atc-classification',
  },
  {
    term: 'OID',
    expansion: 'Object identifier',
    definition: 'Un identifiant mondial unique, fait de nombres séparés par des points, qui nomme une autorité, un modèle de document ou une nomenclature. L\'INS est toujours accompagné de l\'OID de l\'autorité qui l\'a attribué.',
    source: 'https://esante.gouv.fr/sites/default/files/media/document/ANS_Guide%20gestion%20OID_V0.1_0.pdf',
  },
  {
    term: 'URN',
    expansion: 'Uniform Resource Name',
    definition: 'Un identifiant durable qui ne dépend pas d\'un lieu : dans les documents FHIR, « urn:oid: » suivi d\'un OID désigne l\'autorité qui a attribué un identifiant.',
    source: 'https://www.rfc-editor.org/rfc/rfc8141.html',
  },
  {
    term: 'UTF-8',
    expansion: 'Unicode Transformation Format, 8 bits',
    definition: 'Le codage de caractères qui permet d\'écrire les lettres accentuées et tous les alphabets dans un message ou un fichier.',
    source: 'https://www.rfc-editor.org/rfc/rfc3629.html',
  },
  {
    term: 'ISO',
    expansion: 'Organisation internationale de normalisation',
    definition: 'L\'organisme qui publie des normes internationales, comme l\'alphabet latin n° 1 (ISO 8859-1) ou les codes de pays.',
  },
  {
    term: 'JSON',
    expansion: 'JavaScript Object Notation',
    definition: 'Un format de texte pour échanger des données structurées, lisible par les personnes comme par les logiciels.',
    source: 'https://www.rfc-editor.org/rfc/rfc8259.html',
  },
  {
    term: 'XML',
    expansion: 'Extensible Markup Language',
    definition: 'Un format de texte à balises pour échanger des données et des documents, comme ceux de CDA.',
    source: 'https://www.w3.org/TR/xml/',
  },
  {
    term: 'PDF',
    expansion: 'Portable Document Format',
    definition: 'Le format de document figé et imprimable, utilisé pour les comptes-rendus et les lettres de sortie.',
  },
  {
    term: 'API',
    expansion: 'Application Programming Interface',
    definition: 'L\'interface par laquelle un logiciel en appelle un autre : l\'API de Mon espace santé reçoit les documents que l\'hôpital lui envoie.',
  },
];
