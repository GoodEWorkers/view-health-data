// The hospital's own vocabulary: the systems of the floor, the places and people of the screens, and the clinical shorthand the skeleton windows show. The eight systems restate CLAUDE.md, Appendix C. Sources: F75, F77.

import type { GlossaryEntry } from './glossary.ts';

const HAS_UNIT_PAGE = 'https://www.has-sante.fr/jcms/c_1011366/fr/unite-fonctionnelle-uf';

export const HOSPITAL_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: 'SIH',
    expansion: 'Système d\'information hospitalier',
    definition: 'L\'ensemble des logiciels, des serveurs et du réseau qui font tourner l\'hôpital, de l\'admission du patient à la facturation.',
  },
  {
    term: 'EAI',
    expansion: 'Enterprise Application Integration',
    definition: 'Le moteur d\'intégration qui reçoit les messages de tous les logiciels, les contrôle, les transforme et les achemine. Il garde une trace de chacun pour pouvoir le rejouer.',
  },
  {
    term: 'GAM',
    expansion: 'Gestion Administrative des Malades',
    definition: 'Le logiciel de l\'accueil : il crée l\'identité du patient, enregistre chaque admission, chaque sortie et chaque mouvement de lit, puis en prévient les autres logiciels.',
  },
  {
    term: 'RDV',
    expansion: 'Gestion des rendez-vous',
    definition: 'Le logiciel qui planifie les consultations et les ressources (praticiens, salles) et tient les agendas à jour.',
  },
  {
    term: 'DPI',
    expansion: 'Dossier Patient Informatisé',
    definition: 'Le dossier médical numérique du patient dans l\'hôpital : données cliniques, observations, prescriptions, résultats et séjours.',
  },
  {
    term: 'SGL',
    expansion: 'Système de Gestion de Laboratoire',
    definition: 'Le logiciel du laboratoire de biologie : il suit les prescriptions d\'analyses, reçoit les résultats des automates et les transmet.',
  },
  {
    term: 'PACS/RIS',
    expansion: 'Picture Archiving and Communication System / Système d\'information radiologie',
    definition: 'Le PACS archive et distribue les images médicales ; le RIS gère la radiologie : rendez-vous, comptes-rendus et facturation.',
  },
  {
    term: 'CHU',
    expansion: 'Centre hospitalier universitaire',
    definition: 'Un grand hôpital public lié à une faculté de médecine, qui soigne, enseigne et fait de la recherche. « CHU-X » est le nom fictif de l\'hôpital de ce site.',
  },
  {
    term: 'UF',
    expansion: 'Unité fonctionnelle',
    definition: 'La plus petite unité de l\'organisation de l\'hôpital, où l\'activité est homogène : chaque mouvement d\'un patient nomme l\'unité fonctionnelle qui le prend en charge.',
    source: HAS_UNIT_PAGE,
  },
  {
    term: 'IDE',
    expansion: 'Infirmier diplômé d\'État',
    definition: 'Le soignant qui assure les soins infirmiers ; il rédige les notes de soins du dossier du patient.',
  },
  {
    term: 'ECG',
    expansion: 'Électrocardiogramme',
    definition: 'L\'enregistrement de l\'activité électrique du cœur.',
  },
  {
    term: 'CRP',
    expansion: 'Protéine C-réactive',
    definition: 'Un dosage sanguin dont la valeur monte quand l\'organisme a une inflammation ou une infection.',
  },
  {
    term: 'INR',
    expansion: 'International Normalized Ratio (rapport international normalisé)',
    definition: 'La mesure du temps de coagulation du sang, comparable d\'un laboratoire à l\'autre : on la surveille chez un patient sous anticoagulant, comme la warfarine.',
  },
  {
    term: 'FC',
    expansion: 'Fréquence cardiaque',
    definition: 'Le nombre de battements du cœur par minute, l\'une des constantes relevées sur le patient.',
  },
  {
    term: 'TA',
    expansion: 'Tension artérielle',
    definition: 'La pression du sang dans les artères, l\'une des constantes relevées sur le patient.',
  },
  {
    term: 'CT',
    expansion: 'Computed tomography (tomodensitométrie)',
    definition: 'Le scanner : un appareil de radiologie qui reconstitue des coupes du corps à partir de rayons X.',
  },
  {
    term: 'IRM',
    expansion: 'Imagerie par résonance magnétique',
    definition: 'L\'examen d\'imagerie qui utilise un champ magnétique, sans rayons X, pour voir l\'intérieur du corps.',
  },
  {
    term: 'Commutateur',
    definition: 'Équipement qui relie les ordinateurs d\'un même réseau local et peut séparer leur trafic en VLAN. Chaque salle en a un, le cœur de réseau relie les autres.',
  },
  {
    term: 'Onduleur',
    definition: 'Batterie qui alimente le matériel pendant une coupure d\'électricité : elle laisse le temps au groupe électrogène de démarrer ou aux serveurs de s\'arrêter proprement.',
  },
];
