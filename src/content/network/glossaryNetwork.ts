// The Réseau layer's vocabulary: the zones and the equipment that filter, the protocols the flows ride on, and the security mechanisms around them. Facts and sources: doc/sources.md (F23, F25, F45, F47, F64).

import type { GlossaryEntry } from './glossary.ts';

const ANSSI_HYGIENE = 'https://messervices.cyber.gouv.fr/documents-guides/guide_hygiene_informatique_anssi.pdf';
const ANSSI_GATEWAY = 'https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-passerelle_internet_securisee-v3.pdf';
const ANSM_GUIDE = 'https://ansm.sante.fr/uploads/2022/09/23/20220923-recommandations-ansm-cybersecurite-des-dmil.pdf';

export const NETWORK_ENTRIES: readonly GlossaryEntry[] = [
  {
    term: 'MLLP',
    expansion: 'Minimal Lower Layer Protocol',
    definition: 'L\'enveloppe qui délimite un message HL7 v2 sur une connexion TCP, par trois octets (0x0B au début, 0x1C puis 0x0D à la fin). Elle n\'ajoute ni chiffrement ni authentification.',
    source: 'https://web.archive.org/web/20031005202343/http://www.hl7.org/Special/IG/final.pdf',
  },
  {
    term: 'VLAN',
    expansion: 'Réseau local virtuel',
    definition: 'Un même commutateur est découpé en plusieurs réseaux logiques étanches. L\'ANSSI s\'en sert, avec des sous-réseaux dédiés, pour former des zones.',
    source: ANSSI_HYGIENE,
  },
  {
    term: 'DMZ',
    expansion: 'Zone démilitarisée',
    definition: 'Un petit sous-réseau entre deux zones de confiance différentes, filtré de part et d\'autre par des pare-feu. Placée entre l\'hôpital et Internet, elle abrite les relais et le proxy.',
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
    expansion: 'Réseau privé virtuel',
    definition: 'Un tunnel chiffré entre deux extrémités, ici l\'hôpital et un correspondant. L\'ANSM le propose pour protéger les échanges d\'un dispositif médical connecté.',
    source: ANSM_GUIDE,
  },
  {
    term: 'IPsec',
    expansion: 'Internet Protocol Security',
    definition: 'La famille de protocoles qui chiffre et authentifie les paquets IP : elle sert à bâtir un tunnel VPN entre deux sites.',
    source: 'https://www.rfc-editor.org/rfc/rfc4301.html',
  },
  {
    term: 'Matrice de flux',
    definition: 'Le tableau de chaque flux autorisé : zone d\'origine, zone de destination, protocole et port. C\'est le contenu du pare-feu ; l\'ANSM demande aux fabricants d\'en fournir une pour leurs dispositifs connectés.',
    source: ANSM_GUIDE,
  },
  {
    term: 'WAN',
    expansion: 'Wide Area Network',
    definition: 'Le réseau étendu qui relie l\'hôpital à l\'extérieur : le routeur de sortie le raccorde à l\'opérateur.',
  },
  {
    term: 'IP',
    expansion: 'Internet Protocol',
    definition: 'Le protocole qui donne une adresse à chaque machine et fait voyager les paquets de données d\'un réseau à l\'autre. À l\'hôpital, les adresses internes sont privées (RFC 1918).',
    source: 'https://www.rfc-editor.org/rfc/rfc791.html',
  },
  {
    term: 'TCP',
    expansion: 'Transmission Control Protocol',
    definition: 'Le protocole qui ouvre une connexion fiable entre deux machines et livre les données dans l\'ordre ; HL7 v2, DICOM et le web circulent par-dessus.',
    source: 'https://www.rfc-editor.org/rfc/rfc9293.html',
  },
  {
    term: 'HTTP / HTTPS',
    expansion: 'Hypertext Transfer Protocol (Secure)',
    definition: 'Le protocole du web. HTTPS est HTTP dans une connexion chiffrée par TLS, au port 443 : c\'est le protocole des échanges avec l\'extérieur.',
    source: 'https://www.rfc-editor.org/rfc/rfc9110.html',
  },
  {
    term: 'SMTP',
    expansion: 'Simple Mail Transfer Protocol',
    definition: 'Le protocole qui transporte le courrier électronique d\'un serveur à l\'autre ; MSSanté le protège par TLS, au port 587.',
    source: 'https://www.rfc-editor.org/rfc/rfc5321.html',
  },
  {
    term: 'STARTTLS',
    definition: 'La commande qui fait passer une connexion SMTP en clair à une connexion chiffrée par TLS.',
    source: 'https://www.rfc-editor.org/rfc/rfc3207.html',
  },
  {
    term: 'TLS',
    expansion: 'Transport Layer Security',
    definition: 'Chiffre et authentifie une connexion TCP. HTTPS est du HTTP dans TLS ; le nom du serveur demandé (SNI) circule en clair dans le premier message, le ClientHello.',
    source: 'https://www.rfc-editor.org/rfc/rfc8446.html',
  },
  {
    term: 'SNI',
    expansion: 'Server Name Indication',
    definition: 'L\'extension de TLS par laquelle le client nomme le serveur qu\'il veut joindre, ce qui permet à plusieurs sites de partager une même adresse.',
    source: 'https://www.rfc-editor.org/rfc/rfc6066.html',
  },
  {
    term: 'OAuth2',
    definition: 'Le cadre d\'autorisation par lequel un logiciel obtient un accès limité à un service web : l\'hôpital s\'en sert pour déposer des documents sur Mon espace santé.',
    source: 'https://www.rfc-editor.org/rfc/rfc6749.html',
  },
  {
    term: 'RFC',
    expansion: 'Request for Comments',
    definition: 'Les documents numérotés qui décrivent les protocoles d\'Internet. La RFC 1918 réserve les adresses privées utilisées à l\'intérieur de l\'hôpital.',
    source: 'https://www.rfc-editor.org/rfc/rfc1918.html',
  },
  {
    term: 'USB',
    expansion: 'Universal Serial Bus',
    definition: 'La prise standard des clés et des périphériques : branchée sur un poste, une clé peut y introduire un logiciel malveillant.',
  },
];
