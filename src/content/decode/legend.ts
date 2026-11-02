// The colour legend under the inspector, per file format: which token kinds share a swatch and the French word for it. The swatch is drawn by the same data-token rules as the code.

import type { EditorFormat, TokenKind } from '../syntax.ts';

export type LegendItem = { readonly kinds: readonly TokenKind[]; readonly label: string };

export const TOKEN_LEGENDS: Readonly<Record<EditorFormat, readonly LegendItem[]>> = {
  hl7: [
    { kinds: ['segment'], label: 'segment' },
    { kinds: ['field'], label: 'champ' },
    { kinds: ['time'], label: 'date' },
    { kinds: ['separator'], label: 'séparateur' },
  ],
  xml: [
    { kinds: ['tag'], label: 'élément' },
    { kinds: ['attribute'], label: 'attribut' },
    { kinds: ['value'], label: 'valeur' },
    { kinds: ['punctuation'], label: 'séparateur' },
  ],
  json: [
    { kinds: ['key'], label: 'clé' },
    { kinds: ['string'], label: 'valeur' },
    { kinds: ['number', 'literal'], label: 'nombre' },
    { kinds: ['punctuation'], label: 'séparateur' },
  ],
  dicom: [
    { kinds: ['tag'], label: 'balise' },
    { kinds: ['vr'], label: 'type' },
    { kinds: ['value'], label: 'valeur' },
    { kinds: ['comment'], label: 'nom' },
  ],
};
