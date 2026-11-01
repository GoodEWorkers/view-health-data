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
      'The Accueil / Admissions hall sits beside the main entrance, where reception staff register each arrival and open the stay. The GAM (Gestion Administrative des Malades) creates the patient identity and records every admission, discharge and bed movement. It hands identity and movements to the DPI and availabilities and planning to RDV, and sends ADT messages to the EAI.',
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
      'The Rendez-vous office has a counter with a screen and a telephone, and a planner board on the wall. The RDV (Gestion des rendez-vous) plans consultations and books the resources they need. It receives availabilities and planning from the GAM, passes scheduled consultations to the DPI and sends Scheduling messages to the EAI.',
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
      'The nursing station is the hub of the floor, with an island desk of workstations, a shelf of records and a bay with two ward beds. The DPI (Dossier Patient Informatisé) holds the clinical data, the observations and the stay of every patient. It receives results, images and reports from the services, sends them prescriptions and the operating programme, and copies Clinical data to the EAI.',
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
      'The Laboratoire runs along one long side of the floor, with benches, an analyser, a centrifuge and a sample fridge. The SGL (Système de Gestion de Laboratoire) tracks every sample from the biology prescription to the validated result. It consumes prescriptions and observations from the DPI, returns Résultats d\'analyses to it and sends ORU messages to the EAI.',
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
      'The Imagerie suite in the back corner holds a CT scanner with its patient table and a lead-glass control bay. The PACS/RIS stores the medical images and runs the radiology workflow, from booking to report and billing. It takes imaging prescriptions from the DPI, returns Images and Comptes-rendus, and sends images with metadata to the EAI over DICOM.',
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
      'The Pharmacie lines the other long side of the floor with shelving, a dispensing hatch, a drug fridge and a stock trolley. Its system validates prescriptions and ordonnances and keeps the stock of every drug. It receives medication prescriptions from the DPI, returns Prescriptions and Interactions, and sends Pharmacy messages to the EAI.',
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
      'The Bloc opératoire is the operating theatre at the back, with a table, a surgical lamp, an anaesthesia machine and a scrub sink. The Bloc (Gestion Bloc Opératoire) schedules interventions and records what was done in each one. It receives Programmation and the anaesthesia file from the DPI, returns operative reports, and sends Surgical reports to the EAI.',
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
      'The Salle serveurs at the back centre holds server racks, a patch panel, a UPS and an air-conditioning unit, and the floor trunking ends here. The EAI (Enterprise Application Integration) receives the HL7 v2 and DICOM messages of every other system. It orchestrates them, transforms them and routes each one to its destination.',
  },
];
