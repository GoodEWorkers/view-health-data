// Plain-French definitions of the terms the Réseau layer uses, from the hospital's side. A source is the page that backs the definition; every URL is listed in doc/sources.md.

export type GlossaryEntry = { readonly term: string; readonly definition: string; readonly source?: string };

const ANSSI_HYGIENE = 'https://messervices.cyber.gouv.fr/documents-guides/guide_hygiene_informatique_anssi.pdf';
const ANSSI_GATEWAY = 'https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-passerelle_internet_securisee-v3.pdf';
const ANSM_GUIDE = 'https://ansm.sante.fr/uploads/2022/09/23/20220923-recommandations-ansm-cybersecurite-des-dmil.pdf';
const CARE_PLAN = 'https://esante.gouv.fr/sites/default/files/media_entity/documents/doc-programme-care-231214-20h_pap%5B17%5D.pdf';

export const GLOSSARY: readonly GlossaryEntry[] = [
  {
    term: 'SIH',
    definition: 'Système d\'information hospitalier : l\'ensemble des logiciels, des serveurs et du réseau qui font tourner l\'hôpital, de l\'admission du patient à la facturation.',
  },
  {
    term: 'EAI',
    definition: 'Enterprise Application Integration : le moteur d\'intégration qui reçoit les messages de tous les logiciels, les contrôle, les transforme et les achemine. Il garde une trace de chacun pour pouvoir le rejouer.',
  },
  {
    term: 'HL7 v2',
    definition: 'Standard de messages de santé : un texte découpé en segments (MSH, PID, OBX…) dont les champs sont séparés par des barres verticales. Un ADT annonce une admission, un ORU rend un résultat.',
    source: 'https://www.hl7.eu/HL7v2x/v251/std251/ch02.html',
  },
  {
    term: 'MLLP',
    definition: 'Minimal Lower Layer Protocol : l\'enveloppe qui délimite un message HL7 v2 sur une connexion TCP, par trois octets (0x0B au début, 0x1C puis 0x0D à la fin). Elle n\'ajoute ni chiffrement ni authentification.',
    source: 'https://web.archive.org/web/20031005202343/http://www.hl7.org/Special/IG/final.pdf',
  },
  {
    term: 'DICOM',
    definition: 'Standard des images médicales : il décrit le fichier d\'image et le dialogue réseau (association, envoi C-STORE, liste de travail C-FIND). Port 104 ou 11112.',
    source: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part08/chapter_9.html',
  },
  {
    term: 'FHIR',
    definition: 'Standard HL7 d\'échange de données de santé sous forme de ressources (Patient, Encounter…) en JSON ou en XML, par des API web. L\'API de Mon espace santé en est un exemple.',
    source: 'https://hl7.org/fhir/R4/',
  },
  {
    term: 'VLAN',
    definition: 'Réseau local virtuel : un même commutateur est découpé en plusieurs réseaux logiques étanches. L\'ANSSI s\'en sert, avec des sous-réseaux dédiés, pour former des zones.',
    source: ANSSI_HYGIENE,
  },
  {
    term: 'DMZ',
    definition: 'Zone démilitarisée : un petit sous-réseau entre deux zones de confiance différentes, filtré de part et d\'autre par des pare-feu. Placée entre l\'hôpital et Internet, elle abrite les relais et le proxy.',
    source: ANSSI_GATEWAY,
  },
  {
    term: 'Pare-feu',
    definition: 'Équipement qui filtre les connexions entre zones : zone d\'origine, zone de destination, protocole et port. Ce qui n\'est pas explicitement autorisé est refusé.',
    source: ANSSI_HYGIENE,
  },
  {
    term: 'Proxy',
    definition: 'Serveur mandataire : il relaie les accès web à la place des serveurs, authentifie la demande et la journalise. Aucun serveur de l\'hôpital ne va directement sur Internet.',
    source: ANSSI_GATEWAY,
  },
  {
    term: 'VPN',
    definition: 'Réseau privé virtuel : un tunnel chiffré entre deux extrémités, ici l\'hôpital et un correspondant. L\'ANSM le propose pour protéger les échanges d\'un dispositif médical connecté.',
    source: ANSM_GUIDE,
  },
  {
    term: 'TLS',
    definition: 'Transport Layer Security : chiffre et authentifie une connexion TCP. HTTPS est du HTTP dans TLS ; le nom du serveur demandé (SNI) circule en clair dans le premier message, le ClientHello.',
    source: 'https://www.rfc-editor.org/rfc/rfc8446.html',
  },
  {
    term: 'HDS',
    definition: 'Hébergeur de données de santé : prestataire certifié pour conserver des données de santé pour le compte d\'un établissement. L\'hôpital qui externalise son hébergement doit s\'adresser à un hébergeur certifié.',
    source: 'https://esante.gouv.fr/sites/default/files/media_entity/documents/referentiel_certification_hds---fr--v2.pdf',
  },
  {
    term: 'INS',
    definition: 'Identité nationale de santé : le matricule INS du patient (NIR ou NIA) et cinq traits d\'identité issus de l\'état civil. Les données de santé doivent s\'y référer depuis 2021.',
    source: 'https://esante.gouv.fr/produits-services/referentiel-ins',
  },
  {
    term: 'INSi',
    definition: 'Le téléservice de l\'Assurance maladie qui rend l\'INS d\'un patient, ou vérifie celui qu\'on lui présente, à partir des bases de référence de l\'état civil.',
    source: 'https://esante.gouv.fr/produits-services/referentiel-ins',
  },
  {
    term: 'DMP',
    definition: 'Dossier médical partagé : le dossier de santé numérique du patient, intégré à Mon espace santé. Les établissements y déposent leurs documents de sortie avec une carte CPS ou e-CPS.',
    source: 'https://www.cnil.fr/fr/lespace-numerique-de-sante-ens-ou-mon-espace-sante-et-le-dossier-medical-partage-dmp-questions',
  },
  {
    term: 'MSSanté',
    definition: 'Messagerie sécurisée de santé : un espace de confiance géré par l\'ANS, où des opérateurs référencés font échanger des professionnels et des organisations de santé.',
    source: 'https://esante.gouv.fr/strategie-nationale/mssante',
  },
  {
    term: 'PGSSI-S',
    definition: 'Politique générale de sécurité des systèmes d\'information de santé : le corpus de référentiels et de guides de l\'ANS qui fixe les exigences de sécurité du secteur.',
    source: 'https://esante.gouv.fr/securite/politique-generale-de-securite-des-systemes-d-information-de-sante',
  },
  {
    term: 'ANSSI',
    definition: 'Agence nationale de la sécurité des systèmes d\'information : elle publie les guides de référence, comme le guide d\'hygiène informatique (42 mesures) et les recommandations sur l\'interconnexion à Internet.',
    source: ANSSI_HYGIENE,
  },
  {
    term: 'CaRE',
    definition: 'Cybersécurité, accélération et résilience des établissements : le programme national de 2023 à 2027, en quatre axes, pour que les établissements de santé résistent aux attaques et s\'en relèvent vite.',
    source: CARE_PLAN,
  },
  {
    term: 'CERT Santé',
    definition: 'Le centre d\'alerte et de réponse aux incidents de sécurité du secteur de la santé, rattaché à l\'ANS : il publie des alertes et reçoit les déclarations d\'incident des établissements.',
    source: 'https://cyberveille.esante.gouv.fr/',
  },
  {
    term: 'Ségur',
    definition: 'Ségur du numérique en santé : le programme national qui impose aux logiciels de l\'hôpital, comme le DPI, de produire des documents normalisés (CDA R2) portant l\'INS, et de les envoyer au DMP et par MSSanté.',
    source: 'https://esante.gouv.fr/segur/hopital',
  },
  {
    term: 'Mode dégradé',
    definition: 'Façon de travailler avec un accès réduit quand un élément tombe en panne : papier, ressaisie, équipement utilisé seul. L\'hôpital le prépare pour continuer à soigner pendant une panne ou une attaque.',
    source: ANSM_GUIDE,
  },
  {
    term: 'PRA / PCA',
    definition: 'Plan de continuité d\'activité (PCA) : continuer à travailler pendant l\'incident. Plan de reprise d\'activité (PRA) : redémarrer ensuite, à partir de sauvegardes. Le programme CaRE les réunit dans un kit « PCRA ».',
    source: CARE_PLAN,
  },
  {
    term: 'Matrice de flux',
    definition: 'Le tableau de chaque flux autorisé : zone d\'origine, zone de destination, protocole et port. C\'est le contenu du pare-feu ; l\'ANSM demande aux fabricants d\'en fournir une pour leurs dispositifs connectés.',
    source: ANSM_GUIDE,
  },
  {
    term: 'CPx',
    definition: 'Les cartes à puce de la famille de la carte de professionnel de santé (CPS), qui authentifient leur porteur auprès des services nationaux comme INSi.',
    source: 'https://gnius.esante.gouv.fr/sites/default/files/2021-05/INS_Guide%20implementation_VD_0.pdf',
  },
  {
    term: 'PMSI',
    definition: 'Programme de médicalisation des systèmes d\'information : le recueil de l\'activité des hôpitaux, que chaque établissement transmet à l\'ATIH par la plateforme e-PMSI.',
    source: 'https://www.epmsi.atih.sante.fr/welcomeEpmsi.do',
  },
  {
    term: 'Commutateur',
    definition: 'Équipement qui relie les ordinateurs d\'un même réseau local et peut séparer leur trafic en VLAN. Chaque salle en a un, le cœur de réseau relie les autres.',
  },
  {
    term: 'Onduleur',
    definition: 'Batterie qui alimente le matériel pendant une coupure d\'électricité : elle laisse le temps au groupe électrogène de démarrer ou aux serveurs de s\'arrêter proprement.',
  },
  {
    term: 'Dax, 2021',
    definition: 'Dans la nuit du 8 au 9 février 2021, un rançongiciel met hors service tout le réseau informatique du centre hospitalier de Dax.',
    source: 'https://france3-regions.franceinfo.fr/nouvelle-aquitaine/landes/dax/cyberattaque-de-l-hopital-de-dax-une-rancon-demandee-pour-decrypter-les-donnees-1950808.html',
  },
  {
    term: 'Corbeil-Essonnes, 2022',
    definition: 'Le week-end du 20 au 21 août 2022, un rançongiciel frappe le centre hospitalier Sud Francilien de Corbeil-Essonnes, dont les urgences fonctionnent en mode dégradé.',
    source: 'https://www.lemagit.fr/actualites/252524082/Derriere-la-cyberattaque-au-centre-hospitalier-Sud-Francilien-LockBit',
  },
];
