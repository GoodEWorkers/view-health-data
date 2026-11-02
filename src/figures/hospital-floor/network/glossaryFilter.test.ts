import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GLOSSARY } from '../../../content/network/glossary.ts';
import { matchesQuery, normalised, searchTextOf } from './glossaryFilter.ts';

const matching = (query: string): string[] => GLOSSARY.filter(({ term, definition }) => matchesQuery(searchTextOf(term, definition), query)).map(({ term }) => term);

describe('matchesQuery', () => {
  it('matches everything for an empty or blank query', () => {
    assert.equal(matching('').length, GLOSSARY.length);
    assert.equal(matching('   ').length, GLOSSARY.length);
  });

  it('ignores the case and the accents on both sides', () => {
    assert.equal(normalised('Réseau Étanche'), 'reseau etanche');
    assert.ok(matchesQuery(searchTextOf('VLAN', 'Réseau local virtuel'), 'RESEAU'));
    assert.ok(matchesQuery(searchTextOf('VLAN', 'Reseau local virtuel'), 'réseau'));
  });

  it('wants every word of the query', () => {
    assert.ok(matchesQuery(searchTextOf('MLLP', 'enveloppe TCP'), 'mllp tcp'));
    assert.ok(!matchesQuery(searchTextOf('MLLP', 'enveloppe TCP'), 'mllp dicom'));
  });

  it('finds the MLLP entry first among those that mention it, and none for a word nobody uses', () => {
    assert.ok(matching('MLLP').includes('MLLP'));
    assert.deepEqual(matching('zzzz'), []);
  });
});
