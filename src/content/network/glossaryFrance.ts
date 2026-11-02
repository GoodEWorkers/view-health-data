// The French frame of the exchanges: the agencies, the national services and identifiers, the security programmes and two incidents. Facts and sources: doc/sources.md (F12, F14, F53 to F62, F73, F74, F76).

import type { GlossaryEntry } from './glossary.ts';

const ANSSI_HYGIENE = 'https://messervices.cyber.gouv.fr/documents-guides/guide_hygiene_informatique_anssi.pdf';
const ANSM_GUIDE = 'https://ansm.sante.fr/uploads/2022/09/23/20220923-recommandations-ansm-cybersecurite-des-dmil.pdf';
const CARE_PLAN = 'https://esante.gouv.fr/sites/default/files/media_entity/documents/doc-programme-care-231214-20h_pap%5B17%5D.pdf';
const INS_PAGE = 'https://esante.gouv.fr/produits-services/referentiel-ins';

export const FRANCE_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: 'ANS',
    expansion: 'Agence du numérique en santé',
    definition: 'L\'agence nationale du numérique en santé : elle délivre les cartes CPS, gère l\'espace de confiance MSSanté et publie les référentiels de sécurité et d\'interopérabilité.',
    source: 'https://esante.gouv.fr/',
  },
  {
    term: 'ANSM',
    expansion: 'Agence nationale de sécurité du médicament et des produits de santé',
    definition: 'L\'agence publique qui veille à la sécurité des médicaments et des produits de santé ; elle publie des recommandations de cybersécurité pour les dispositifs médicaux connectés.',
    source: 'https://ansm.sante.fr/',
  },
  {
    term: 'ANSSI',
    expansion: 'Agence nationale de la sécurité des systèmes d\'information',
    definition: 'Elle publie les guides de référence, comme le guide d\'hygiène informatique (42 mesures) et les recommandations sur l\'interconnexion à Internet.',
    source: ANSSI_HYGIENE,
  },
  {
    term: 'ATIH',
    expansion: 'Agence technique de l\'information sur l\'hospitalisation',
    definition: 'L\'agence qui collecte les données d\'activité des hôpitaux, dont celles du PMSI, par la plateforme e-PMSI.',
    source: 'https://www.atih.sante.fr/',
  },
  {
    term: 'CNOM',
    expansion: 'Conseil national de l\'Ordre des médecins',
    definition: 'L\'instance qui coordonne l\'Ordre des médecins et veille aux principes d\'éthique de la profession ; il a publié avec le G4 le guide et la charte de téléradiologie.',
    source: 'https://www.conseil-national.medecin.fr/',
  },
  {
    term: 'CPS',
    expansion: 'Carte de professionnel de santé',
    definition: 'La carte d\'identité professionnelle électronique du secteur de la santé : elle prouve l\'identité et les qualifications de son titulaire. L\'e-CPS en est la version sur téléphone.',
    source: 'https://esante.gouv.fr/produits-services/cartes-de-professionnels-de-sante',
  },
  {
    term: 'CPx',
    definition: 'Les cartes à puce de la famille de la carte de professionnel de santé (CPS), qui authentifient leur porteur auprès des services nationaux comme INSi.',
    source: 'https://gnius.esante.gouv.fr/sites/default/files/2021-05/INS_Guide%20implementation_VD_0.pdf',
  },
  {
    term: 'INS',
    expansion: 'Identité nationale de santé',
    definition: 'Le matricule INS du patient (NIR ou NIA) et cinq traits d\'identité issus de l\'état civil. Les données de santé doivent s\'y référer depuis 2021.',
    source: INS_PAGE,
  },
  {
    term: 'INSi',
    definition: 'Le téléservice de l\'Assurance maladie qui rend l\'INS d\'un patient, ou vérifie celui qu\'on lui présente, à partir des bases de référence de l\'état civil.',
    source: INS_PAGE,
  },
  {
    term: 'NIR',
    expansion: 'Numéro d\'inscription au répertoire',
    definition: 'Le numéro de sécurité sociale : treize chiffres (sexe, année et mois de naissance, lieu, numéro d\'ordre) et une clé de deux chiffres. C\'est le matricule INS d\'un patient qui en a un.',
    source: 'https://www.net-entreprises.fr/glossaire/nir-numero-dinscription-au-repertoire/',
  },
  {
    term: 'NIA',
    expansion: 'Numéro d\'identification d\'attente',
    definition: 'Le numéro provisoire d\'un assuré qui n\'a pas encore de NIR : il tient lieu de matricule INS tant que le NIR n\'est pas attribué.',
    source: INS_PAGE,
  },
  {
    term: 'DMP',
    expansion: 'Dossier médical partagé',
    definition: 'Le dossier de santé numérique du patient, intégré à Mon espace santé. Les établissements y déposent leurs documents de sortie avec une carte CPS ou e-CPS.',
    source: 'https://www.cnil.fr/fr/lespace-numerique-de-sante-ens-ou-mon-espace-sante-et-le-dossier-medical-partage-dmp-questions',
  },
  {
    term: 'MSSanté',
    expansion: 'Messagerie sécurisée de santé',
    definition: 'Un espace de confiance géré par l\'ANS, où des opérateurs référencés font échanger des professionnels et des organisations de santé.',
    source: 'https://esante.gouv.fr/strategie-nationale/mssante',
  },
  {
    term: 'PMSI',
    expansion: 'Programme de médicalisation des systèmes d\'information',
    definition: 'Le recueil de l\'activité des hôpitaux, que chaque établissement transmet à l\'ATIH par la plateforme e-PMSI.',
    source: 'https://www.epmsi.atih.sante.fr/welcomeEpmsi.do',
  },
  {
    term: 'RSS',
    expansion: 'Résumé de sortie standardisé',
    definition: 'Le résumé que l\'hôpital établit pour chaque séjour et envoie à l\'ATIH : c\'est la donnée de base du PMSI.',
    source: 'https://www.atih.sante.fr/mco/presentation',
  },
  {
    term: 'HDS',
    expansion: 'Hébergeur de données de santé',
    definition: 'Prestataire certifié pour conserver des données de santé pour le compte d\'un établissement. L\'hôpital qui externalise son hébergement doit s\'adresser à un hébergeur certifié.',
    source: 'https://esante.gouv.fr/sites/default/files/media_entity/documents/referentiel_certification_hds---fr--v2.pdf',
  },
  {
    term: 'PGSSI-S',
    expansion: 'Politique générale de sécurité des systèmes d\'information de santé',
    definition: 'Le corpus de référentiels et de guides de l\'ANS qui fixe les exigences de sécurité du secteur.',
    source: 'https://esante.gouv.fr/securite/politique-generale-de-securite-des-systemes-d-information-de-sante',
  },
  {
    term: 'CaRE',
    expansion: 'Cybersécurité, accélération et résilience des établissements',
    definition: 'Le programme national de 2023 à 2027, en quatre axes, pour que les établissements de santé résistent aux attaques et s\'en relèvent vite.',
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
    expansion: 'Plan de reprise d\'activité / Plan de continuité d\'activité',
    definition: 'Le PCA permet de continuer à travailler pendant l\'incident, le PRA de redémarrer ensuite, à partir de sauvegardes. Le programme CaRE les réunit dans un kit national de plan de continuité et de reprise d\'activité.',
    source: CARE_PLAN,
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
