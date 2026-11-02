// The external partners, one per external flow of departments.ts: who runs them, how both ends prove who they are, what certification frames the exchange. Sources and assumptions: doc/sources.md (assumption 32).

import type { ExternalFlow, ExternalZone } from '../departments.ts';
import type { ProtocolFamily } from './protocols.ts';

export type Partner = {
  readonly id: string;
  readonly name: string;
  readonly operator: string;
  readonly path: ExternalZone;
  readonly family: ProtocolFamily;
  readonly identity: string;
  readonly certification: string;
  readonly explain: string;
};

export const PARTNERS: readonly Partner[] = [
  {
    id: 'insi',
    name: 'Téléservice INSi',
    operator: 'la Cnam (Assurance maladie)',
    path: 'proxy',
    family: 'https',
    identity: 'Le logiciel s\'authentifie par un certificat de l\'établissement (personne morale) ou une carte CPx, sur une connexion chiffrée par TLS.',
    certification: 'Le logiciel de l\'hôpital respecte le guide d\'implémentation de l\'INS publié par l\'ANS.',
    explain:
      'Le téléservice interroge le référentiel national d\'identité tenu par la Cnam : il rend l\'INS du patient ou vérifie celui qu\'on lui présente.',
  },
  {
    id: 'epmsi',
    name: 'e-PMSI (ATIH)',
    operator: 'l\'ATIH',
    path: 'proxy',
    family: 'https',
    identity: 'Un compte e-PMSI de l\'établissement (identifiant et mot de passe), sur une connexion chiffrée par TLS.',
    certification: 'Plateforme publique de l\'ATIH, ouverte aux seuls professionnels du secteur hospitalier.',
    explain: 'L\'hôpital y dépose ses résumés de sortie standardisés (RSS), les données du PMSI qui décrivent son activité.',
  },
  {
    id: 'grossiste',
    name: 'Grossiste-répartiteur',
    operator: 'le grossiste-répartiteur choisi par la pharmacie',
    path: 'proxy',
    family: 'https',
    identity: 'Un compte de la pharmacie à usage intérieur chez le grossiste, sur une connexion chiffrée par TLS.',
    certification: 'Le grossiste-répartiteur est un établissement pharmaceutique défini par le code de la santé publique.',
    explain: 'La pharmacie y commande médicaments et fournitures, que le grossiste stocke puis livre à l\'hôpital.',
  },
  {
    id: 'agenda',
    name: 'Agenda en ligne',
    operator: 'l\'éditeur de l\'agenda en ligne (par exemple Doctolib)',
    path: 'dmz',
    family: 'https',
    identity: 'Un compte de l\'établissement chez l\'éditeur ; chaque patient s\'identifie lui-même sur le site de prise de rendez-vous.',
    certification: 'Un éditeur qui héberge des données de santé doit être certifié HDS ; Doctolib l\'est depuis 2021.',
    explain: 'Les créneaux ouverts par le RDV sont publiés sur l\'agenda en ligne, et les rendez-vous pris par les patients reviennent à l\'hôpital.',
  },
  {
    id: 'dmp',
    name: 'DMP / Mon espace santé',
    operator: 'la Cnam et le ministère de la Santé',
    path: 'dmz',
    family: 'https',
    identity: 'Le logiciel s\'authentifie par OAuth2 avec une clé privée ; le professionnel qui dépose un document utilise sa carte CPS ou e-CPS.',
    certification: 'Le DPI respecte l\'exigence du Ségur du numérique : documents CDA R2 portant l\'INS du patient.',
    explain: 'Les documents de sortie, comme la lettre de liaison, rejoignent le dossier du patient, qui les retrouve dans Mon espace santé.',
  },
  {
    id: 'mssante',
    name: 'MSSanté',
    operator: 'un opérateur MSSanté référencé par l\'ANS',
    path: 'dmz',
    family: 'smtp',
    identity: 'Les opérateurs s\'authentifient entre eux par des certificats, dans des canaux TLS mutuels ; les adresses sont celles de professionnels et d\'organisations de santé.',
    certification: 'L\'espace de confiance MSSanté est géré par l\'ANS, qui référence les opérateurs.',
    explain: 'Le DPI envoie courriers et documents à un correspondant de santé : seuls des professionnels de l\'espace de confiance les reçoivent.',
  },
  {
    id: 'teleradiologie',
    name: 'Téléradiologie',
    operator: 'le prestataire de téléradiologie',
    path: 'vpn',
    family: 'dicom',
    identity: 'Le tunnel VPN authentifie les deux extrémités ; le radiologue distant se connecte avec un compte nominatif.',
    certification: 'La charte et le guide de téléradiologie du CNOM et du G4 encadrent l\'exercice à distance.',
    explain: 'Un radiologue distant interprète les images (télédiagnostic) ou donne son avis sur un cas (téléexpertise).',
  },
];

export const partnerOfExternal = ({ partner }: Pick<ExternalFlow, 'partner'>): Partner => {
  const found = PARTNERS.find(({ name }) => name === partner);
  if (found === undefined) throw new Error(`Unknown external partner: ${partner}`);
  return found;
};
