export type DepartmentId = 'gam' | 'rdv' | 'dpi' | 'sgl' | 'pacs-ris' | 'pharmacie' | 'bloc' | 'eai';

export type Protocol = 'HL7 v2' | 'DICOM';

export type Transport = 'MLLP' | 'DICOM' | 'HTTPS' | 'SMTP';

export type NetworkZone = 'user-workstations' | 'hospital-servers' | 'biomedical-modalities' | 'dmz';

export type ExternalZone = 'dmz' | 'vpn' | 'proxy';

export type Flow = {
  readonly to: DepartmentId;
  readonly payload: string;
  readonly protocol?: Protocol;
  // The most representative trigger event or DICOM service: one flow may carry several.
  readonly messageType?: string;
  readonly transport?: Transport;
};

// Not in flows: flows[].to is a room, and the figure counts one flow into the EAI per room.
export type ExternalFlow = {
  readonly external: true;
  readonly partner: string;
  readonly payload: string;
  readonly messageType?: string;
  readonly transport: Transport;
  readonly zone: ExternalZone;
};

export type SoftwareLayer = {
  readonly paragraph: string;
  readonly screens: readonly string[];
};

export type DataLayer = {
  readonly paragraph: string;
  readonly entities: readonly string[];
  readonly formats: readonly string[];
  readonly storage: readonly string[];
};

export type NetworkLayer = {
  readonly paragraph: string;
  readonly zones: readonly NetworkZone[];
  readonly externalFlows: readonly ExternalFlow[];
  // Ids of EQUIPMENT (network/equipment.ts), the access switch of the room first.
  readonly equipmentIds: readonly string[];
  readonly resilience: string;
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
  readonly software: SoftwareLayer;
  readonly data: DataLayer;
  readonly network: NetworkLayer;
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
      { to: 'dpi', payload: 'Identité patient', messageType: 'ADT^A01', transport: 'MLLP' },
      { to: 'dpi', payload: 'Mouvements', messageType: 'ADT^A02', transport: 'MLLP' },
      { to: 'rdv', payload: 'Disponibilités', transport: 'MLLP' },
      { to: 'rdv', payload: 'Planning', messageType: 'SIU^S12', transport: 'MLLP' },
      { to: 'eai', payload: 'ADT messages', protocol: 'HL7 v2', messageType: 'ADT^A01', transport: 'MLLP' },
    ],
    summary:
      'Le hall Accueil / Admissions jouxte l\'entrée principale, où le personnel d\'accueil enregistre chaque arrivée et ouvre le séjour. La GAM (Gestion Administrative des Malades) crée l\'identité du patient et consigne chaque admission, chaque sortie et chaque mouvement de lit. Elle transmet l\'identité et les mouvements au DPI, les disponibilités et le planning au RDV, et alimente l\'EAI en ADT messages.',
    softwareExamples: ['M-GAM (Docaposte Santé)', 'Pastel (Mipih)', 'i-GAP (CPage)'],
    software: {
      paragraph:
        'La GAM est le référentiel d\'identité du patient : elle crée l\'identité, ouvre le séjour, puis prévient les autres logiciels à chaque admission, transfert ou sortie. Elle le fait par des messages HL7 v2 de type ADT, dont l\'usage est cadré en France par le profil IHE PAM.',
      screens: ['Fiche d\'identité', 'Admission du patient', 'Planning des lits', 'Mouvements du jour'],
    },
    data: {
      paragraph:
        'La GAM détient trois familles de données : l\'identité du patient (dont l\'INS), sa venue et ses mouvements de lit. Elles naissent dans sa base applicative, puis l\'EAI les diffuse au DPI et au RDV dans des messages ADT, qui portent l\'identité dans le segment PID et le mouvement dans le segment ZBE.',
      entities: ['Identité patient (dont l\'INS)', 'Venue / séjour', 'Mouvement de lit'],
      formats: [
        'ADT^A01 : admission en hospitalisation',
        'ADT^A04 : arrivée en consultation externe',
        'ADT^A08 : mise à jour de l\'identité',
        'ADT^A02 : transfert',
        'ADT^A03 : sortie',
      ],
      storage: ['Base applicative de la GAM', 'Copie de l\'identité dans chaque système'],
    },
    network: {
      paragraph:
        'Les postes d\'accueil sont sur le réseau des postes utilisateurs et joignent le serveur de la GAM, hébergé sur le réseau des serveurs du système d\'information hospitalier (SIH), à travers un pare-feu interne. Les messages ADT vers le DPI et l\'EAI restent entre serveurs du SIH. Seuls l\'appel à INSi et l\'envoi des données PMSI sortent de l\'hôpital, par un proxy.',
      zones: ['user-workstations', 'hospital-servers'],
      externalFlows: [
        { external: true, partner: 'Téléservice INSi', payload: 'Récupération et vérification de l\'INS', transport: 'HTTPS', zone: 'proxy' },
        { external: true, partner: 'e-PMSI (ATIH)', payload: 'Transmission des données PMSI', transport: 'HTTPS', zone: 'proxy' },
      ],
      equipmentIds: ['switch-gam'],
      resilience:
        'L\'accueil continue en mode dégradé si le réseau tombe : admissions notées sur papier puis ressaisies, les identités déjà copiées dans chaque système restant consultables.',
    },
  },
  {
    id: 'rdv',
    acronym: 'RDV',
    name: 'Gestion des rendez-vous',
    roomName: 'Rendez-vous',
    colour: '#ea7f12',
    functions: ['Planification', 'Consultations', 'Ressources'],
    flows: [
      { to: 'dpi', payload: 'Consultations programmées', messageType: 'SIU^S12', transport: 'MLLP' },
      { to: 'eai', payload: 'Scheduling', protocol: 'HL7 v2', messageType: 'SIU^S12', transport: 'MLLP' },
    ],
    summary:
      'Le bureau Rendez-vous comprend un comptoir équipé d\'un écran et d\'un téléphone, et un tableau de planification accroché au mur. Le RDV (Gestion des rendez-vous) planifie les consultations et réserve les ressources dont elles ont besoin. Il reçoit les disponibilités et le planning de la GAM, transmet les consultations programmées au DPI et alimente l\'EAI en Scheduling.',
    softwareExamples: ['Doctolib (Doctolib)', 'Maiia (Cegedim Santé)'],
    software: {
      paragraph:
        'Le RDV planifie les consultations et réserve les ressources dont elles ont besoin : salle, équipement ou praticien. Il publie chaque rendez-vous au DPI et à l\'EAI par des messages HL7 v2 de type SIU, et s\'appuie sur un agenda en ligne pour la prise de rendez-vous par le patient.',
      screens: ['Agenda du praticien', 'Planning des ressources', 'Prise de rendez-vous'],
    },
    data: {
      paragraph:
        'Le RDV gère des rendez-vous, les créneaux qui les accueillent et les ressources qu\'ils mobilisent. Un rendez-vous réservé devient un message SIU^S12 envoyé au DPI, tandis que les créneaux ouverts à la réservation sont publiés vers l\'agenda en ligne.',
      entities: ['Rendez-vous', 'Créneau disponible', 'Ressource (salle, équipement, praticien)'],
      formats: ['SIU^S12 : nouveau rendez-vous', 'Échange web (HTTPS) avec l\'agenda en ligne'],
      storage: ['Base applicative du RDV (agendas)', 'Copie des créneaux dans l\'agenda en ligne'],
    },
    network: {
      paragraph:
        'Les postes du comptoir sont sur le réseau des postes utilisateurs, l\'agenda du RDV sur les serveurs du SIH. L\'agenda en ligne est ouvert au public : il passe par la DMZ, une zone tampon placée entre le réseau interne et Internet. Les messages SIU vers le DPI et l\'EAI, eux, restent entre serveurs.',
      zones: ['user-workstations', 'hospital-servers'],
      externalFlows: [
        { external: true, partner: 'Agenda en ligne', payload: 'Créneaux et rendez-vous des patients', transport: 'HTTPS', zone: 'dmz' },
      ],
      equipmentIds: ['switch-rdv'],
      resilience:
        'Si le réseau tombe, le comptoir passe en mode dégradé avec un planning papier, ressaisi au retour du réseau.',
    },
  },
  {
    id: 'dpi',
    acronym: 'DPI',
    name: 'Dossier Patient Informatisé',
    roomName: 'Dossier patient / Poste de soins',
    colour: '#a21caf',
    functions: ['Données cliniques', 'Observations', 'Séjours'],
    flows: [
      { to: 'sgl', payload: 'Prescriptions', messageType: 'OML^O21', transport: 'MLLP' },
      { to: 'sgl', payload: 'Observations', messageType: 'ORU^R01', transport: 'MLLP' },
      { to: 'pacs-ris', payload: 'Prescriptions d\'imagerie', messageType: 'ORM^O01', transport: 'MLLP' },
      { to: 'pharmacie', payload: 'Prescriptions médicamenteuses', messageType: 'OMP^O09', transport: 'MLLP' },
      { to: 'bloc', payload: 'Programmation', messageType: 'SIU^S12', transport: 'MLLP' },
      { to: 'bloc', payload: 'Dossier anesthésie', messageType: 'MDM^T02', transport: 'MLLP' },
      { to: 'eai', payload: 'Clinical data', protocol: 'HL7 v2', messageType: 'ORU^R01', transport: 'MLLP' },
    ],
    summary:
      'Le poste de soins est le pivot de l\'étage, avec un bureau en îlot garni de postes de travail, une étagère de dossiers et une alcôve de deux lits d\'hospitalisation. Le DPI (Dossier Patient Informatisé) conserve les données cliniques, les observations et le séjour de chaque patient. Il reçoit des services les résultats, les images et les comptes-rendus, leur adresse les prescriptions et la programmation du bloc, et alimente l\'EAI en Clinical data.',
    softwareExamples: [
      'Easily (Hopsis)',
      'DxCare (Dedalus)',
      'Hopital Manager (Softway Medical)',
      'Maincare IC (Docaposte Santé)',
    ],
    software: {
      paragraph:
        'Le DPI est le pivot clinique : médecins, infirmiers et secrétaires y consultent et complètent le dossier du patient. Il adresse les prescriptions aux services par des messages HL7 v2 (OML^O21, ORM^O01, OMP^O09) et reçoit en retour résultats, images et comptes-rendus. Il produit aussi les documents de sortie, partagés avec le DMP et par MSSanté.',
      screens: ['Dossier patient', 'Prescriptions', 'Résultats de biologie', 'Lettre de liaison de sortie'],
    },
    data: {
      paragraph:
        'Le DPI concentre les données cliniques : observations, prescriptions, résultats et documents. Les données structurées vivent dans sa base, les documents dans un serveur de documents, en PDF ou en CDA R2. Tout ce qui vient des services lui parvient par l\'EAI.',
      entities: ['Observation', 'Prescription', 'Résultat', 'Compte-rendu', 'Venue / séjour'],
      formats: [
        'ORU^R01 : résultats reçus',
        'MDM^T02 : comptes-rendus et documents',
        'PDF et CDA R2 : documents de sortie',
        'FHIR : API de Mon espace santé',
      ],
      storage: ['Base applicative du DPI', 'Serveur de documents (PDF, CDA R2)'],
    },
    network: {
      paragraph:
        'Les postes de soins sont sur le réseau des postes utilisateurs et accèdent au DPI à travers un pare-feu interne, le DPI et ses bases étant sur les serveurs du SIH. Ses échanges avec les services restent entre serveurs, en MLLP pour l\'essentiel. Vers l\'extérieur, les documents partent vers le DMP et Mon espace santé, ainsi que vers les correspondants par MSSanté, en passant par la DMZ.',
      zones: ['user-workstations', 'hospital-servers'],
      externalFlows: [
        { external: true, partner: 'DMP / Mon espace santé', payload: 'Documents de santé au format CDA R2', transport: 'HTTPS', zone: 'dmz' },
        { external: true, partner: 'MSSanté', payload: 'Courriers et documents de santé', transport: 'SMTP', zone: 'dmz' },
      ],
      equipmentIds: ['switch-dpi'],
      resilience:
        'Le DPI est le service le plus critique : s\'il tombe, les soins passent en mode dégradé sur dossiers papier, et ce sont les sauvegardes déconnectées du réseau qui permettent la reprise.',
    },
  },
  {
    id: 'sgl',
    acronym: 'SGL',
    name: 'Système de Gestion de Laboratoire',
    roomName: 'Laboratoire',
    colour: '#ca9a04',
    functions: ['Analyses', 'Résultats', 'Prescriptions bio'],
    flows: [
      { to: 'dpi', payload: 'Résultats d\'analyses', messageType: 'ORU^R01', transport: 'MLLP' },
      { to: 'eai', payload: 'ORU messages', protocol: 'HL7 v2', messageType: 'ORU^R01', transport: 'MLLP' },
    ],
    summary:
      'Le Laboratoire longe un grand côté de l\'étage, avec des paillasses, un automate d\'analyse, une centrifugeuse et un réfrigérateur à échantillons. Le SGL (Système de Gestion de Laboratoire) suit chaque échantillon, de la prescription de biologie jusqu\'au résultat validé. Il reçoit du DPI les prescriptions et les observations, lui renvoie les Résultats d\'analyses et alimente l\'EAI en ORU messages.',
    softwareExamples: ['GLIMS (Clinisys)', 'Hexalis (Dedalus)', 'TDNexLabs (Technidata)'],
    software: {
      paragraph:
        'Le SGL suit chaque échantillon, de la prescription de biologie jusqu\'au résultat validé par le biologiste. Il reçoit les prescriptions du DPI en HL7 v2 (OML^O21), dialogue avec les automates d\'analyse et renvoie les résultats par messages ORU^R01.',
      screens: ['Liste de travail', 'Suivi des échantillons', 'Validation biologique'],
    },
    data: {
      paragraph:
        'Le SGL conserve les échantillons, leurs analyses et les résultats validés. Les résultats partent vers le DPI en ORU^R01, et le compte-rendu de biologie peut aussi être transmis sous forme de document CDA R2.',
      entities: ['Prescription de biologie', 'Échantillon', 'Analyse', 'Résultat validé'],
      formats: ['OML^O21 : prescription reçue', 'ORU^R01 : résultat envoyé', 'CDA R2 : compte-rendu de biologie'],
      storage: ['Base applicative du SGL', 'Copie du résultat dans le DPI'],
    },
    network: {
      paragraph:
        'L\'automate d\'analyse est un équipement biomédical : il est rattaché à son propre réseau, séparé des serveurs par un pare-feu interne. Le SGL échange ensuite avec le DPI et l\'EAI en MLLP, sur les serveurs du SIH. Il n\'a pas d\'échange externe direct, les résultats destinés à l\'extérieur passant par le DPI.',
      zones: ['hospital-servers', 'biomedical-modalities'],
      externalFlows: [],
      equipmentIds: ['switch-sgl'],
      resilience:
        'Si le réseau tombe, le laboratoire passe en mode dégradé : résultats reportés à la main, puis ressaisis ou remontés au retour du réseau.',
    },
  },
  {
    id: 'pacs-ris',
    acronym: 'PACS/RIS',
    name: 'Picture Archiving and Communication System / Système d\'information radiologie',
    roomName: 'Imagerie',
    colour: '#4f46e5',
    functions: ['Images médicales', 'Radiologie', 'Comptes-rendus', 'Prise de rendez-vous', 'Facturation'],
    flows: [
      { to: 'dpi', payload: 'Images', protocol: 'DICOM', messageType: 'WADO-RS', transport: 'HTTPS' },
      { to: 'dpi', payload: 'Comptes-rendus', messageType: 'MDM^T02', transport: 'MLLP' },
      { to: 'eai', payload: 'Images + metadata', protocol: 'DICOM', messageType: 'C-STORE', transport: 'DICOM' },
    ],
    summary:
      'Le service Imagerie, dans l\'angle du fond, abrite un scanner avec sa table d\'examen et une cabine de commande à vitre plombée. Le PACS/RIS archive les images médicales et pilote le circuit de radiologie, de la prise de rendez-vous au compte-rendu et à la facturation. Il reçoit du DPI les prescriptions d\'imagerie, lui renvoie les Images et les Comptes-rendus, et alimente l\'EAI en Images + metadata via DICOM.',
    softwareExamples: ['Xplore (EDL)', 'DeepUnity (Dedalus)', 'Enterprise Imaging (Agfa HealthCare)'],
    software: {
      paragraph:
        'Le RIS gère le circuit de l\'examen : rendez-vous, liste de travail du scanner, compte-rendu et facturation. Le PACS archive les images DICOM produites par les modalités et les met à disposition des lecteurs. Le RIS reçoit la prescription du DPI en HL7 v2 (ORM^O01) et lui renvoie le compte-rendu (MDM^T02).',
      screens: ['Planning des salles', 'Liste de travail des examens', 'Visionneuse d\'images', 'Compte-rendu du radiologue'],
    },
    data: {
      paragraph:
        'Un examen produit deux familles de données : des images, archivées dans le PACS, et un compte-rendu, rédigé dans le RIS. Les images circulent en DICOM avec leurs métadonnées ; le compte-rendu part vers le DPI en HL7 v2, en PDF ou en CDA R2.',
      entities: ['Examen', 'Image', 'Compte-rendu', 'Prescription d\'imagerie'],
      formats: [
        'DICOM C-STORE : envoi des images',
        'DICOM C-FIND : liste de travail',
        'DICOM SR : compte-rendu structuré',
        'ORM^O01 : prescription reçue',
        'MDM^T02 : compte-rendu envoyé',
      ],
      storage: ['Archive d\'images du PACS', 'Base applicative du RIS'],
    },
    network: {
      paragraph:
        'Le scanner est une modalité biomédicale : il reste sur un réseau dédié, d\'où ses images et ses demandes de liste de travail traversent un pare-feu interne vers le PACS/RIS, en DICOM. Le PACS/RIS lui-même est sur les serveurs du SIH, et ses échanges avec le DPI et l\'EAI y restent. La téléradiologie sort par un VPN.',
      zones: ['biomedical-modalities', 'hospital-servers'],
      externalFlows: [
        { external: true, partner: 'Téléradiologie', payload: 'Images pour interprétation à distance', messageType: 'C-STORE', transport: 'DICOM', zone: 'vpn' },
      ],
      equipmentIds: ['switch-pacs-ris'],
      resilience:
        'Si le réseau tombe, l\'imagerie passe en mode dégradé : le scanner reste utilisable seul, et les images rejoignent le PACS au retour du réseau.',
    },
  },
  {
    id: 'pharmacie',
    acronym: 'Pharmacie',
    name: 'Pharmacie',
    roomName: 'Pharmacie',
    colour: '#16a34a',
    functions: ['Prescriptions', 'Ordonnances', 'Stocks'],
    flows: [
      { to: 'dpi', payload: 'Prescriptions', messageType: 'RDE^O11', transport: 'MLLP' },
      { to: 'dpi', payload: 'Interactions', messageType: 'RRE^O12', transport: 'MLLP' },
      { to: 'eai', payload: 'Pharmacy messages', protocol: 'HL7 v2', messageType: 'RDE^O11', transport: 'MLLP' },
    ],
    summary:
      'La Pharmacie borde l\'autre grand côté de l\'étage, avec des rayonnages, un guichet de dispensation, un réfrigérateur à médicaments et un chariot de stock. Son système valide les prescriptions et les ordonnances et tient le stock de chaque médicament. Il reçoit du DPI les prescriptions médicamenteuses, lui renvoie les Prescriptions et les Interactions, et alimente l\'EAI en Pharmacy messages.',
    softwareExamples: ['Pharma (Computer Engineering)', 'Copilote (Docaposte Santé)'],
    software: {
      paragraph:
        'Le logiciel de la pharmacie analyse les prescriptions médicamenteuses reçues du DPI, prépare la dispensation et tient le stock de chaque médicament. Il reçoit la prescription en HL7 v2 (OMP^O09) et renvoie au DPI la prescription validée (RDE^O11) ainsi que les alertes d\'interactions.',
      screens: ['Analyse pharmaceutique', 'Dispensation', 'Gestion des stocks', 'Commandes'],
    },
    data: {
      paragraph:
        'La pharmacie gère les prescriptions, les ordonnances de sortie et le stock de chaque médicament. La prescription validée est renvoyée au DPI dans un message RDE^O11, tandis que les stocks restent dans la base du logiciel de pharmacie.',
      entities: ['Prescription', 'Ordonnance', 'Stock de médicaments', 'Commande'],
      formats: ['OMP^O09 : prescription reçue', 'RDE^O11 : prescription validée', 'RRE^O12 : retour de validation'],
      storage: ['Base applicative de la pharmacie', 'Prescription validée : copie dans le DPI'],
    },
    network: {
      paragraph:
        'Les postes du guichet sont sur le réseau des postes utilisateurs, le logiciel de pharmacie et sa base sur les serveurs du SIH, derrière un pare-feu interne. Les échanges avec le DPI et l\'EAI sont des messages HL7 v2 en MLLP. Les commandes au grossiste-répartiteur sortent par un proxy.',
      zones: ['user-workstations', 'hospital-servers'],
      externalFlows: [
        { external: true, partner: 'Grossiste-répartiteur', payload: 'Commandes de médicaments', transport: 'HTTPS', zone: 'proxy' },
      ],
      equipmentIds: ['switch-pharmacie'],
      resilience:
        'Si le réseau tombe, la pharmacie dispense en mode dégradé avec les ordonnances papier et ressaisit ensuite les mouvements de stock.',
    },
  },
  {
    id: 'bloc',
    acronym: 'Bloc',
    name: 'Gestion Bloc Opératoire',
    roomName: 'Bloc opératoire',
    colour: '#0d9488',
    functions: ['Programmation', 'Interventions', 'Comptes-rendus'],
    flows: [
      { to: 'dpi', payload: 'Comptes-rendus opératoires', messageType: 'MDM^T02', transport: 'MLLP' },
      { to: 'eai', payload: 'Surgical reports', protocol: 'HL7 v2', messageType: 'MDM^T02', transport: 'MLLP' },
    ],
    summary:
      'Le Bloc opératoire est la salle d\'opération du fond, avec une table, un scialytique, un appareil d\'anesthésie et un lavabo chirurgical. Le Bloc (Gestion Bloc Opératoire) programme les interventions et consigne ce qui a été fait lors de chacune. Il reçoit du DPI la Programmation et le dossier d\'anesthésie, lui renvoie les Comptes-rendus opératoires et alimente l\'EAI en Surgical reports.',
    softwareExamples: ['OpRoom (Evolucare)', 'Hopital Manager (Softway Medical)'],
    software: {
      paragraph:
        'Le logiciel de bloc programme les interventions, affecte salles et équipes, puis consigne ce qui a été fait. Il reçoit du DPI la programmation (SIU^S12) et le dossier d\'anesthésie, et lui renvoie le compte-rendu opératoire (MDM^T02).',
      screens: ['Planning des blocs', 'Feuille de bloc', 'Compte-rendu opératoire'],
    },
    data: {
      paragraph:
        'Le bloc gère des interventions programmées, un dossier d\'anesthésie et un compte-rendu opératoire. Le compte-rendu est transmis au DPI en MDM^T02, sous forme de document PDF ou CDA R2, et peut ensuite alimenter le DMP.',
      entities: ['Intervention programmée', 'Dossier d\'anesthésie', 'Compte-rendu opératoire'],
      formats: ['SIU^S12 : programmation reçue', 'MDM^T02 : dossier et compte-rendu', 'PDF et CDA R2 : documents'],
      storage: ['Base applicative du bloc', 'Compte-rendu : copie dans le DPI'],
    },
    network: {
      paragraph:
        'L\'appareil d\'anesthésie est un équipement biomédical : il reste sur son réseau dédié, séparé du reste par un pare-feu interne. Le logiciel de bloc, sur les serveurs du SIH, échange avec le DPI et l\'EAI en MLLP. Il n\'a pas d\'échange externe direct.',
      zones: ['biomedical-modalities', 'hospital-servers'],
      externalFlows: [],
      equipmentIds: ['switch-bloc'],
      resilience:
        'Si le réseau tombe, le bloc continue d\'opérer en mode dégradé : l\'appareil d\'anesthésie fonctionne isolé et les comptes-rendus sont rédigés sur papier, puis ressaisis.',
    },
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
    software: {
      paragraph:
        'L\'EAI est le moteur d\'intégration : il reçoit chaque message HL7 v2 ou DICOM, le contrôle, le transforme au format attendu et l\'achemine vers le bon destinataire. Les équipes informatiques y surveillent les interfaces et rejouent les messages en erreur.',
      screens: ['Supervision des interfaces', 'Journal des messages', 'Rejeu des messages en erreur'],
    },
    data: {
      paragraph:
        'L\'EAI ne possède pas les données médicales : il les fait transiter. Tous les messages passent par lui, ce qui le place au centre des échanges, tandis que le DPI reste le pivot clinique. Il ne garde qu\'une trace des messages pour pouvoir les rejouer.',
      entities: ['Message en transit', 'Règle de routage', 'Trace du message'],
      formats: ['HL7 v2 : ADT, SIU, ORM, OML, OMP, ORU, RDE, MDM', 'DICOM : images et métadonnées'],
      storage: ['File d\'attente de messages', 'Journal des échanges'],
    },
    network: {
      paragraph:
        'L\'EAI est au centre du réseau des serveurs du SIH : chaque système lui envoie ses messages, en MLLP pour HL7 v2 et en DICOM pour les images. Ces échanges restent à l\'intérieur de la zone des serveurs. Les échanges avec l\'extérieur sont relayés par une passerelle placée en DMZ.',
      zones: ['hospital-servers', 'dmz'],
      externalFlows: [],
      equipmentIds: ['switch-eai', 'core-eai', 'firewall-eai', 'router-eai', 'telecom-eai', 'ups-eai'],
      resilience:
        'La salle serveurs tient sur un onduleur et sur un cœur de réseau doublé, et si l\'EAI s\'arrête les services passent en mode dégradé, leurs messages attendant en file d\'attente d\'être rejoués.',
    },
  },
];
