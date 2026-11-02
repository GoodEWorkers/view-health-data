import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatDate, formatDateTime, formatTime } from './time.ts';

describe('formatDate', () => {
  it('writes an HL7 or DICOM date in French', () => {
    assert.equal(formatDate('19580614'), '14 juin 1958');
  });

  it('writes an ISO date in French', () => {
    assert.equal(formatDate('1958-06-14'), '14 juin 1958');
  });

  it('writes the first of the month as « 1er »', () => {
    assert.equal(formatDate('20261101'), '1er novembre 2026');
  });

  it('returns what it cannot read unchanged', () => {
    assert.equal(formatDate('hier'), 'hier');
    assert.equal(formatDate('20261399'), '20261399');
  });
});

describe('formatDateTime', () => {
  it('writes an HL7 stamp with the minutes', () => {
    assert.equal(formatDateTime('202611020840'), '2 novembre 2026, 08:40');
  });

  it('writes an HL7 stamp with the seconds, dropping them', () => {
    assert.equal(formatDateTime('20261102084015'), '2 novembre 2026, 08:40');
  });

  it('writes an ISO stamp with its offset, keeping the written hour', () => {
    assert.equal(formatDateTime('2026-11-02T08:40:00+01:00'), '2 novembre 2026, 08:40');
  });

  it('writes a stamp with no time as a date', () => {
    assert.equal(formatDateTime('20261102'), '2 novembre 2026');
  });
});

describe('formatTime', () => {
  it('writes a DICOM time as hours and minutes', () => {
    assert.equal(formatTime('093000'), '09:30');
  });
});
