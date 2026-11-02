// The glossary filter: a query matches an entry when every word of it is in the term, its expansion or the definition, whatever the case and the accents (« reseau » finds « Réseau »). The search text is written at build time.

import type { GlossaryEntry } from '../../../content/network/glossary.ts';

type Searchable = Pick<GlossaryEntry, 'term' | 'expansion' | 'definition'>;

const MARKS = /\p{Diacritic}/gu;
const WORDS = /\s+/;

export const normalised = (text: string): string => text.normalize('NFD').replace(MARKS, '').toLowerCase();

export const searchTextOf = ({ term, expansion = '', definition }: Searchable): string => normalised(`${term} ${expansion} ${definition}`);

export const matchesQuery = (searchText: string, query: string): boolean => normalised(query).split(WORDS).filter(Boolean).every((word) => searchText.includes(word));
