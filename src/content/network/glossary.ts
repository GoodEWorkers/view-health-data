// Plain-French definitions of the terms and acronyms a visitor meets, from the hospital's side, sorted for the glossary view. A source is the page that backs the definition; every URL is listed in doc/sources.md.

import { FRANCE_ENTRIES } from './glossaryFrance.ts';
import { HOSPITAL_ENTRIES } from './glossaryHospital.ts';
import { NETWORK_ENTRIES } from './glossaryNetwork.ts';
import { STANDARDS_ENTRIES } from './glossaryStandards.ts';

export type GlossaryEntry = {
  readonly term: string;
  // The spelled-out acronym, shown next to the term and searched with it.
  readonly expansion?: string;
  readonly definition: string;
  readonly source?: string;
};

const COLLATOR = new Intl.Collator('fr', { sensitivity: 'base' });

export const GLOSSARY: readonly GlossaryEntry[] = [...HOSPITAL_ENTRIES, ...STANDARDS_ENTRIES, ...NETWORK_ENTRIES, ...FRANCE_ENTRIES].sort((first, second) =>
  COLLATOR.compare(first.term, second.term),
);
