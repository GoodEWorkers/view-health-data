// The filter of the glossary: a query matches an entry when every word of it appears in the term or the definition, whatever the case and the accents (« reseau » finds « Réseau »). The text to search is written at build time next to each entry.

const MARKS = /\p{Diacritic}/gu;
const WORDS = /\s+/;

export const normalised = (text: string): string => text.normalize('NFD').replace(MARKS, '').toLowerCase();

export const searchTextOf = (term: string, definition: string): string => normalised(`${term} ${definition}`);

export const matchesQuery = (searchText: string, query: string): boolean => normalised(query).split(WORDS).filter(Boolean).every((word) => searchText.includes(word));
