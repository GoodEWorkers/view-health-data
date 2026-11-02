import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GLOSSARY } from './glossary.ts';

const COLLATOR = new Intl.Collator('fr', { sensitivity: 'base' });

describe('GLOSSARY order and shape', () => {
  it('is sorted alphabetically, whatever the case and the accents', () => {
    const terms = GLOSSARY.map(({ term }) => term);
    assert.deepEqual(terms, [...terms].sort(COLLATOR.compare));
  });

  it('keeps the spelled-out acronym out of the definition', () => {
    const repeated = GLOSSARY.filter(({ expansion, definition }) => expansion !== undefined && definition.toLowerCase().startsWith(expansion.toLowerCase()));
    assert.deepEqual(repeated.map(({ term }) => term), []);
  });
});
