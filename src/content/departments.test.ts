import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from './departments.ts';
import type { Department } from './departments.ts';
import { ZONE_LABELS } from './layerLabels.ts';

const SENTENCE_BREAK = /(?<=[.!?])\s+/;
const HEX_COLOUR = /^#[0-9a-f]{6}$/;
const SOFTWARE_EXAMPLE = /^.+ \(.+\)$/;
const MIN_SOFTWARE_EXAMPLES = 2;
const MAX_SOFTWARE_EXAMPLES = 4;
const HL7_MESSAGE_TYPE = /^[A-Z]{3}\^[A-Z]\d{2}$/;
const DICOM_SERVICES = ['C-STORE', 'C-FIND', 'C-MOVE', 'WADO-RS'];
const MAX_LIST_ITEMS = 5;
const MAX_LIST_ITEM_LENGTH = 90;
const ENGLISH_WORDS =
  /\b(the|and|with|from|click|loading|error|settings|search|submit|cancel|save|delete|edit|login|logout|dashboard|workflow|workstations?|servers?|firewall|gateway|upload|download|devices?)\b/i;

const layerLists = ({ software, data }: Department): readonly (readonly string[])[] => [
  software.screens,
  data.entities,
  data.formats,
  data.storage,
];

const layerParagraphs = ({ software, data, network }: Department): readonly string[] => [
  software.paragraph,
  data.paragraph,
  network.paragraph,
];

const layerStrings = (department: Department): readonly string[] => [
  ...layerParagraphs(department),
  ...layerLists(department).flat(),
  ...department.network.zones.map((zone) => ZONE_LABELS[zone]),
  ...department.network.externalFlows.flatMap(({ partner, payload }) => [partner, payload]),
];

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

  it('names two to four software examples as Product (Vendor) for each system', () => {
    for (const { id, softwareExamples } of DEPARTMENTS) {
      const count = softwareExamples.length;
      assert.ok(count >= MIN_SOFTWARE_EXAMPLES && count <= MAX_SOFTWARE_EXAMPLES, `${id} has ${count} examples`);
      for (const example of softwareExamples) assert.match(example, SOFTWARE_EXAMPLE, id);
    }
  });

  it('gives each system its own six-digit hex colour', () => {
    const colours = DEPARTMENTS.map(({ colour }) => colour);
    assert.ok(colours.every((colour) => HEX_COLOUR.test(colour)), colours.join(' '));
    assert.equal(new Set(colours).size, DEPARTMENTS.length);
  });

  it('writes a paragraph of two or three sentences for each of the three layers', () => {
    for (const department of DEPARTMENTS) {
      for (const paragraph of layerParagraphs(department)) {
        const sentences = paragraph.split(SENTENCE_BREAK).length;
        assert.ok(sentences >= 2 && sentences <= 3, `${department.id} has ${sentences} sentences in "${paragraph}"`);
      }
    }
  });

  it('gives each layer one to five short list items and no empty list', () => {
    for (const department of DEPARTMENTS) {
      for (const items of [...layerLists(department), department.network.zones]) {
        assert.ok(items.length >= 1 && items.length <= MAX_LIST_ITEMS, `${department.id} has ${items.length} items`);
        for (const item of items) assert.ok(item.length <= MAX_LIST_ITEM_LENGTH, `${department.id}: ${item}`);
      }
    }
  });

  it('gives every HL7 v2 flow a message type shaped like ADT^A01', () => {
    for (const { id, flows } of DEPARTMENTS) {
      for (const { payload, protocol, messageType } of flows) {
        if (protocol === 'HL7 v2') assert.match(messageType ?? '', HL7_MESSAGE_TYPE, `${id} ${payload}`);
      }
    }
  });

  it('shapes every message type as an HL7 v2 trigger or a DICOM service', () => {
    for (const { id, flows, network } of DEPARTMENTS) {
      for (const { payload, messageType } of [...flows, ...network.externalFlows]) {
        if (messageType === undefined) continue;
        const isKnown = HL7_MESSAGE_TYPE.test(messageType) || DICOM_SERVICES.includes(messageType);
        assert.ok(isKnown, `${id} ${payload}: ${messageType}`);
      }
    }
  });

  it('marks every external flow as external and names its partner, transport and zone', () => {
    for (const { id, network } of DEPARTMENTS) {
      for (const flow of network.externalFlows) {
        assert.equal(flow.external, true, `${id} ${flow.payload}`);
        assert.ok(flow.partner.length > 0 && flow.transport.length > 0 && flow.zone.length > 0, `${id} ${flow.payload}`);
      }
    }
  });

  it('describes external exchanges for the rooms that talk to the outside', () => {
    const withExternalFlows = DEPARTMENTS.filter(({ network }) => network.externalFlows.length > 0).map(({ id }) => id);
    assert.deepEqual(withExternalFlows, ['gam', 'rdv', 'dpi', 'pacs-ris', 'pharmacie']);
  });

  it('writes the layers in French without English interface words', () => {
    for (const department of DEPARTMENTS) {
      for (const text of layerStrings(department)) assert.doesNotMatch(text, ENGLISH_WORDS, `${department.id}: ${text}`);
    }
  });
});
