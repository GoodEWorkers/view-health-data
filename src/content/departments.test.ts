import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';

const SENTENCE_BREAK = /(?<=[.!?])\s+/;
const HEX_COLOUR = /^#[0-9a-f]{6}$/;

describe('departments', () => {
  it('lists the eight systems of the source diagram in reading order', () => {
    assert.deepEqual(
      DEPARTMENTS.map(({ id }) => id),
      ['gam', 'rdv', 'dpi', 'sgl', 'pacs-ris', 'pharmacie', 'bloc', 'eai'],
    );
  });

  it('names a known department at the end of every flow', () => {
    const known = new Set(DEPARTMENTS.map(({ id }) => id));
    for (const { id, flows } of DEPARTMENTS) {
      for (const { to } of flows) assert.ok(known.has(to) && to !== id, `${id} flows to ${to}`);
    }
  });

  it('sends every system except the EAI to the EAI once, and the EAI sends nothing', () => {
    for (const { id, flows } of DEPARTMENTS) {
      const intoEai = flows.filter(({ to }) => to === 'eai');
      assert.equal(intoEai.length, id === 'eai' ? 0 : 1, id);
    }
    assert.deepEqual(DEPARTMENTS.find(({ id }) => id === 'eai')?.flows, []);
  });

  it('uses DICOM for the imaging flow into the EAI and HL7 v2 for the others', () => {
    for (const { id, flows } of DEPARTMENTS) {
      const [intoEai] = flows.filter(({ to }) => to === 'eai');
      if (intoEai) assert.equal(intoEai.protocol, id === 'pacs-ris' ? 'DICOM' : 'HL7 v2', id);
    }
  });

  it('writes a summary of two or three sentences for each system', () => {
    for (const { id, summary } of DEPARTMENTS) {
      const sentences = summary.split(SENTENCE_BREAK).length;
      assert.ok(sentences >= 2 && sentences <= 3, `${id} has ${sentences} sentences`);
    }
  });

  it('gives each system its own six-digit hex colour', () => {
    const colours = DEPARTMENTS.map(({ colour }) => colour);
    assert.ok(colours.every((colour) => HEX_COLOUR.test(colour)), colours.join(' '));
    assert.equal(new Set(colours).size, DEPARTMENTS.length);
  });
});
