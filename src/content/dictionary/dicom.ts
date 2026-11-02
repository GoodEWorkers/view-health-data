// The DICOM data elements of the CT thorax listing, named in French after DICOM PS3.6 table 6-1 (name, keyword, VR); the two coded values come from PS3.3 C.12 and C.7.3. See doc/sources.md F34 and F39.

import type { DictionaryEntry } from './index.ts';

export const DICOM_ENTRIES: readonly DictionaryEntry[] = [
  { ref: '(0008,0005)', label: 'Jeu de caractères', render: 'table:(0008,0005)', explain: 'Comment les lettres accentuées sont codées dans ce fichier.' },
  { ref: '(0008,0020)', label: 'Date de l\'examen', render: 'date', explain: 'Le jour où l\'examen a commencé.' },
  { ref: '(0008,0030)', label: 'Heure de l\'examen', render: 'time', explain: 'L\'heure à laquelle l\'examen a commencé.' },
  { ref: '(0008,0050)', label: 'Numéro d\'accession', explain: 'Le numéro de l\'examen dans le service d\'imagerie : c\'est lui qui relie l\'image à la demande et au compte rendu.' },
  { ref: '(0008,0060)', label: 'Modalité', render: 'table:(0008,0060)', explain: 'Le type d\'appareil qui a produit l\'image : scanner, IRM, radiographie, échographie…' },
  { ref: '(0008,0090)', label: 'Médecin prescripteur', render: 'name', explain: 'Le médecin qui a demandé l\'examen.' },
  { ref: '(0008,1030)', label: 'Description de l\'examen', explain: 'Le libellé de l\'examen, en clair.' },
  { ref: '(0010,0010)', label: 'Nom du patient', render: 'name', explain: 'Le nom, puis le prénom, séparés par ^. C\'est l\'un des éléments qui permettent de rattacher l\'image au bon patient.' },
  { ref: '(0010,0020)', label: 'Identifiant du patient', explain: 'L\'identifiant du patient dans l\'établissement.' },
  { ref: '(0010,0030)', label: 'Date de naissance', render: 'date', explain: 'Écrite sans séparateur : année, mois, jour.' },
  { ref: '(0010,0040)', label: 'Sexe', render: 'table:(0010,0040)', explain: 'M pour masculin, F pour féminin, O pour autre.' },
  { ref: '(0018,0050)', label: 'Épaisseur de coupe', render: 'millimetres', explain: 'L\'épaisseur de chaque coupe du scanner, en millimètres.' },
  { ref: '(0020,0011)', label: 'Numéro de série', explain: 'Une série est un ensemble d\'images acquises ensemble ; l\'examen peut en contenir plusieurs.' },
  { ref: '(0028,0010)', label: 'Lignes', render: 'pixels', explain: 'La hauteur de l\'image, en pixels.' },
  { ref: '(0028,0011)', label: 'Colonnes', render: 'pixels', explain: 'La largeur de l\'image, en pixels.' },
  { ref: '(0008,0005):ISO_IR 100', label: 'Latin 1', explain: 'Alphabet latin n° 1 (ISO 8859-1), qui contient les lettres accentuées du français.' },
  { ref: '(0008,0060):CT', label: 'Scanner', explain: 'Tomodensitométrie (CT, computed tomography).' },
  { ref: '(0010,0040):M', label: 'Masculin' },
];
