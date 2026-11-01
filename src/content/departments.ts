export type DepartmentId = 'gam' | 'rdv' | 'dpi' | 'sgl' | 'pacs-ris' | 'pharmacie' | 'bloc' | 'eai';

export type Protocol = 'HL7 v2' | 'DICOM';

export type Flow = {
  readonly to: DepartmentId;
  readonly payload: string;
  readonly protocol?: Protocol;
};

export type Department = {
  readonly id: DepartmentId;
  readonly acronym: string;
  readonly name: string;
  readonly roomName: string;
  readonly colour: string;
  readonly functions: readonly string[];
  readonly flows: readonly Flow[];
  readonly summary: string;
  readonly softwareExamples: readonly string[];
};

export const DEPARTMENTS: readonly Department[] = [
  {
    id: 'gam',
    acronym: 'GAM',
    name: 'Gestion Administrative des Malades',
    roomName: 'Accueil / Admissions',
    colour: '#0284c7',
    functions: ['Identité patient', 'Admissions/Sorties', 'Mouvements'],
    flows: [
      { to: 'dpi', payload: 'Identité patient' },
      { to: 'dpi', payload: 'Mouvements' },
      { to: 'rdv', payload: 'Disponibilités' },
      { to: 'rdv', payload: 'Planning' },
      { to: 'eai', payload: 'ADT messages', protocol: 'HL7 v2' },
    ],
    summary:
      'Le hall Accueil / Admissions jouxte l\'entrée principale, où le personnel d\'accueil enregistre chaque arrivée et ouvre le séjour. La GAM (Gestion Administrative des Malades) crée l\'identité du patient et consigne chaque admission, chaque sortie et chaque mouvement de lit. Elle transmet l\'identité et les mouvements au DPI, les disponibilités et le planning au RDV, et alimente l\'EAI en ADT messages.',
    softwareExamples: ['M-GAM (Docaposte Santé)', 'Pastel (Mipih)', 'i-GAP (CPage)'],
  },
  {
    id: 'rdv',
    acronym: 'RDV',
    name: 'Gestion des rendez-vous',
    roomName: 'Rendez-vous',
    colour: '#ea7f12',
    functions: ['Planification', 'Consultations', 'Ressources'],
    flows: [
      { to: 'dpi', payload: 'Consultations programmées' },
      { to: 'eai', payload: 'Scheduling', protocol: 'HL7 v2' },
    ],
    summary:
      'Le bureau Rendez-vous comprend un comptoir équipé d\'un écran et d\'un téléphone, et un tableau de planification accroché au mur. Le RDV (Gestion des rendez-vous) planifie les consultations et réserve les ressources dont elles ont besoin. Il reçoit les disponibilités et le planning de la GAM, transmet les consultations programmées au DPI et alimente l\'EAI en Scheduling.',
    softwareExamples: ['Doctolib (Doctolib)', 'Maiia (Cegedim Santé)'],
  },
  {
    id: 'dpi',
    acronym: 'DPI',
    name: 'Dossier Patient Informatisé',
    roomName: 'Dossier patient / Poste de soins',
    colour: '#a21caf',
    functions: ['Données cliniques', 'Observations', 'Séjours'],
    flows: [
      { to: 'sgl', payload: 'Prescriptions' },
      { to: 'sgl', payload: 'Observations' },
      { to: 'pacs-ris', payload: 'Prescriptions d\'imagerie' },
      { to: 'pharmacie', payload: 'Prescriptions médicamenteuses' },
      { to: 'bloc', payload: 'Programmation' },
      { to: 'bloc', payload: 'Dossier anesthésie' },
      { to: 'eai', payload: 'Clinical data', protocol: 'HL7 v2' },
    ],
    summary:
      'Le poste de soins est le pivot de l\'étage, avec un bureau en îlot garni de postes de travail, une étagère de dossiers et une alcôve de deux lits d\'hospitalisation. Le DPI (Dossier Patient Informatisé) conserve les données cliniques, les observations et le séjour de chaque patient. Il reçoit des services les résultats, les images et les comptes-rendus, leur adresse les prescriptions et la programmation du bloc, et alimente l\'EAI en Clinical data.',
    softwareExamples: [
      'Easily (Hopsis)',
      'DxCare (Dedalus)',
      'Hopital Manager (Softway Medical)',
      'Maincare IC (Docaposte Santé)',
    ],
  },
  {
    id: 'sgl',
    acronym: 'SGL',
    name: 'Système de Gestion de Laboratoire',
    roomName: 'Laboratoire',
    colour: '#ca9a04',
    functions: ['Analyses', 'Résultats', 'Prescriptions bio'],
    flows: [
      { to: 'dpi', payload: 'Résultats d\'analyses' },
      { to: 'eai', payload: 'ORU messages', protocol: 'HL7 v2' },
    ],
    summary:
      'Le Laboratoire longe un grand côté de l\'étage, avec des paillasses, un automate d\'analyse, une centrifugeuse et un réfrigérateur à échantillons. Le SGL (Système de Gestion de Laboratoire) suit chaque échantillon, de la prescription de biologie jusqu\'au résultat validé. Il reçoit du DPI les prescriptions et les observations, lui renvoie les Résultats d\'analyses et alimente l\'EAI en ORU messages.',
    softwareExamples: ['GLIMS (Clinisys)', 'Hexalis (Dedalus)', 'TDNexLabs (Technidata)'],
  },
  {
    id: 'pacs-ris',
    acronym: 'PACS/RIS',
    name: 'Picture Archiving and Communication System / Système d\'information radiologie',
    roomName: 'Imagerie',
    colour: '#4f46e5',
    functions: ['Images médicales', 'Radiologie', 'Comptes-rendus', 'Prise de rendez-vous', 'Facturation'],
    flows: [
      { to: 'dpi', payload: 'Images' },
      { to: 'dpi', payload: 'Comptes-rendus' },
      { to: 'eai', payload: 'Images + metadata', protocol: 'DICOM' },
    ],
    summary:
      'Le service Imagerie, dans l\'angle du fond, abrite un scanner avec sa table d\'examen et une cabine de commande à vitre plombée. Le PACS/RIS archive les images médicales et pilote le circuit de radiologie, de la prise de rendez-vous au compte-rendu et à la facturation. Il reçoit du DPI les prescriptions d\'imagerie, lui renvoie les Images et les Comptes-rendus, et alimente l\'EAI en Images + metadata via DICOM.',
    softwareExamples: ['Xplore (EDL)', 'DeepUnity (Dedalus)', 'Enterprise Imaging (Agfa HealthCare)'],
  },
  {
    id: 'pharmacie',
    acronym: 'Pharmacie',
    name: 'Pharmacie',
    roomName: 'Pharmacie',
    colour: '#16a34a',
    functions: ['Prescriptions', 'Ordonnances', 'Stocks'],
    flows: [
      { to: 'dpi', payload: 'Prescriptions' },
      { to: 'dpi', payload: 'Interactions' },
      { to: 'eai', payload: 'Pharmacy messages', protocol: 'HL7 v2' },
    ],
    summary:
      'La Pharmacie borde l\'autre grand côté de l\'étage, avec des rayonnages, un guichet de dispensation, un réfrigérateur à médicaments et un chariot de stock. Son système valide les prescriptions et les ordonnances et tient le stock de chaque médicament. Il reçoit du DPI les prescriptions médicamenteuses, lui renvoie les Prescriptions et les Interactions, et alimente l\'EAI en Pharmacy messages.',
    softwareExamples: ['Pharma (Computer Engineering)', 'Copilote (Docaposte Santé)'],
  },
  {
    id: 'bloc',
    acronym: 'Bloc',
    name: 'Gestion Bloc Opératoire',
    roomName: 'Bloc opératoire',
    colour: '#0d9488',
    functions: ['Programmation', 'Interventions', 'Comptes-rendus'],
    flows: [
      { to: 'dpi', payload: 'Comptes-rendus opératoires' },
      { to: 'eai', payload: 'Surgical reports', protocol: 'HL7 v2' },
    ],
    summary:
      'Le Bloc opératoire est la salle d\'opération du fond, avec une table, un scialytique, un appareil d\'anesthésie et un lavabo chirurgical. Le Bloc (Gestion Bloc Opératoire) programme les interventions et consigne ce qui a été fait lors de chacune. Il reçoit du DPI la Programmation et le dossier d\'anesthésie, lui renvoie les Comptes-rendus opératoires et alimente l\'EAI en Surgical reports.',
    softwareExamples: ['OpRoom (Evolucare)', 'Hopital Manager (Softway Medical)'],
  },
  {
    id: 'eai',
    acronym: 'EAI',
    name: 'Enterprise Application Integration',
    roomName: 'Salle serveurs',
    colour: '#64748b',
    functions: ['Orchestration', 'Transformation', 'Routage'],
    flows: [],
    summary:
      'La Salle serveurs, au centre du fond, abrite des baies de serveurs, un panneau de brassage, un onduleur et un climatiseur, et les goulottes de câbles de l\'étage y aboutissent. L\'EAI (Enterprise Application Integration) reçoit les messages HL7 v2 et DICOM de tous les autres systèmes. Il les orchestre, les transforme et achemine chacun vers sa destination.',
    softwareExamples: ['Enovacom Integration Engine (Enovacom)', 'InterSystems IRIS for Health (InterSystems)'],
  },
];
