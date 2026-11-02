import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId, ExternalFlow, Transport } from '../departments.ts';
import { TRANSPORT_DETAILS, ZONE_LABELS } from '../layerLabels.ts';
import {
  EQUIPMENT,
  FIREWALL_RULES,
  GLOSSARY,
  PARTNERS,
  PROTOCOL_FAMILIES,
  ZONES,
  familyOf,
  partnerOfExternal,
  ruleForExternal,
  ruleForFlow,
  zoneOfDevice,
  zonesOfFlow,
} from './index.ts';

const HEX_COLOUR = /^#[0-9a-f]{6}$/;
const ENGLISH_WORDS =
  /\b(the|and|with|from|click|loading|error|settings|search|submit|cancel|save|delete|edit|login|logout|dashboard|workflow|workstations?|servers?|firewall|gateway|upload|download|devices?)\b/i;
const MIN_RULES = 10;
const MAX_RULES = 16;
const MIN_GLOSSARY_TERMS = 20;
const ROOMS = DEPARTMENTS.map(({ id }) => id);
const SOURCES_FILE = readFileSync(new URL('../../../doc/sources.md', import.meta.url), 'utf8');
const EXTERNAL_FLOWS: readonly (readonly [DepartmentId, ExternalFlow])[] = DEPARTMENTS.flatMap(({ id, network }) =>
  network.externalFlows.map((flow): readonly [DepartmentId, ExternalFlow] => [id, flow]),
);

describe('ZONES', () => {
  it('lists the four zones of departments.ts with the labels of layerLabels.ts', () => {
    assert.deepEqual(ZONES.map(({ id }) => id), ['user-workstations', 'hospital-servers', 'biomedical-modalities', 'dmz']);
    for (const { id, label } of ZONES) assert.equal(label, ZONE_LABELS[id], id);
  });

  it('gives every zone and every protocol family its own hex colour', () => {
    const colours = [...ZONES, ...PROTOCOL_FAMILIES].map(({ colour }) => colour);
    assert.ok(colours.every((colour) => HEX_COLOUR.test(colour)), colours.join(' '));
    assert.equal(new Set(colours).size, colours.length);
  });

  it('puts each kind of device in its zone, whatever the room', () => {
    assert.equal(zoneOfDevice('gam', 'workstation'), 'user-workstations');
    assert.equal(zoneOfDevice('sgl', 'modality'), 'biomedical-modalities');
    assert.equal(zoneOfDevice('eai', 'server'), 'hospital-servers');
  });

  it('starts a flow from the modality when it is native DICOM and from the server otherwise', () => {
    const [images] = DEPARTMENTS.find(({ id }) => id === 'pacs-ris')!.flows.filter(({ transport }) => transport === 'DICOM');
    assert.deepEqual(zonesOfFlow('pacs-ris', images!), ['biomedical-modalities', 'hospital-servers']);
    assert.deepEqual(zonesOfFlow('gam', DEPARTMENTS[0]!.flows[0]!), ['hospital-servers', 'hospital-servers']);
  });
});

describe('PROTOCOL_FAMILIES', () => {
  it('states which family travels in clear: HL7 v2 and DICOM do, HTTPS and SMTP do not', () => {
    const clear = PROTOCOL_FAMILIES.filter(({ encrypted }) => !encrypted).map(({ id }) => id);
    assert.deepEqual(clear, ['mllp', 'dicom']);
  });

  it('maps every transport to a family whose ports are the ones layerLabels.ts shows', () => {
    const transports = Object.keys(TRANSPORT_DETAILS) as Transport[];
    for (const transport of transports) {
      const family = PROTOCOL_FAMILIES.find(({ id }) => id === familyOf(transport))!;
      assert.ok(TRANSPORT_DETAILS[transport].ports.includes(family.ports), transport);
    }
  });
});

describe('EQUIPMENT', () => {
  it('has unique ids and one access switch in each of the eight rooms', () => {
    assert.equal(new Set(EQUIPMENT.map(({ id }) => id)).size, EQUIPMENT.length);
    const switches = EQUIPMENT.filter(({ kind }) => kind === 'switch').map(({ room }) => room);
    assert.deepEqual(switches, ROOMS);
  });

  it('keeps core, firewall, router, UPS and the outside telecom box in the server room', () => {
    for (const kind of ['core', 'firewall', 'router', 'ups', 'telecom'] as const) {
      const found = EQUIPMENT.filter((item) => item.kind === kind);
      assert.equal(found.length, 1, kind);
      assert.equal(found[0]!.room, 'eai', kind);
    }
    assert.equal(EQUIPMENT.find(({ kind }) => kind === 'telecom')!.zone, 'edge');
  });

  it('sits each piece in a zone its room belongs to, or at the edge', () => {
    for (const { id, room, zone } of EQUIPMENT) {
      if (zone === 'edge') continue;
      assert.ok(DEPARTMENTS.find((department) => department.id === room)!.network.zones.includes(zone), id);
    }
  });

  it('is referenced by every department through network.equipmentIds, and every id resolves', () => {
    const known = new Set(EQUIPMENT.map(({ id }) => id));
    const referenced = new Set<string>();
    for (const { id, network } of DEPARTMENTS) {
      assert.ok(network.equipmentIds.length > 0, id);
      for (const equipmentId of network.equipmentIds) {
        assert.ok(known.has(equipmentId), `${id}: ${equipmentId}`);
        referenced.add(equipmentId);
      }
    }
    assert.deepEqual([...known].filter((id) => !referenced.has(id)), []);
  });

  it('gives each room its own access switch first and writes one resilience sentence', () => {
    for (const { id, network } of DEPARTMENTS) {
      const first = EQUIPMENT.find(({ id: equipmentId }) => equipmentId === network.equipmentIds[0])!;
      assert.deepEqual([first.kind, first.room], ['switch', id]);
      assert.equal(network.resilience.split(/(?<=[.!?])\s+/).length, 1, id);
      assert.ok(network.resilience.endsWith('.'), id);
    }
  });
});

describe('FIREWALL_RULES', () => {
  const zoneIds: readonly string[] = ZONES.map(({ id }) => id);

  it('holds ten to sixteen numbered rules and ends with a deny-all sentinel', () => {
    assert.ok(FIREWALL_RULES.length >= MIN_RULES && FIREWALL_RULES.length <= MAX_RULES, String(FIREWALL_RULES.length));
    assert.deepEqual(FIREWALL_RULES.map(({ id }) => id), FIREWALL_RULES.map((_, index) => index + 1));
    const last = FIREWALL_RULES.at(-1)!;
    assert.deepEqual([last.from, last.to, last.family, last.action], ['any', 'any', 'any', 'deny']);
    assert.equal(FIREWALL_RULES.filter(({ from }) => from === 'any').length, 1);
  });

  it('names only existing zones, protocol families and actions', () => {
    const families: readonly string[] = PROTOCOL_FAMILIES.map(({ id }) => id);
    for (const { id, from, to, family, action } of FIREWALL_RULES) {
      for (const end of [from, to]) assert.ok(end === 'outside' || end === 'any' || zoneIds.includes(end), `rule ${id}: ${end}`);
      assert.ok(family === 'any' || families.includes(family), `rule ${id}: ${family}`);
      assert.ok(action === 'allow' || action === 'deny', `rule ${id}`);
    }
  });

  it('denies biomedical equipment any access to the outside', () => {
    const rule = FIREWALL_RULES.find(({ from, to }) => from === 'biomedical-modalities' && to === 'outside')!;
    assert.equal(rule.action, 'deny');
  });

  it('answers a rule exactly for the flows that change zone, and the rule matches them', () => {
    let crossings = 0;
    for (const { id, flows } of DEPARTMENTS) {
      for (const flow of flows) {
        const [source, destination] = zonesOfFlow(id, flow);
        const rule = ruleForFlow(id, flow);
        if (source === destination) {
          assert.equal(rule, undefined, `${id} to ${flow.to} ${flow.payload}`);
          continue;
        }
        crossings += 1;
        assert.deepEqual([rule?.from, rule?.to, rule?.family, rule?.action], [source, destination, familyOf(flow.transport!), 'allow']);
      }
    }
    assert.equal(crossings, 1, 'only the DICOM images of the scanner cross a zone');
  });

  it('answers a rule for every external flow: proxy and DMZ stop in the DMZ, the VPN leaves', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) {
      const rule = ruleForExternal(id, flow);
      assert.equal(rule.action, 'allow', flow.partner);
      assert.equal(rule.family, familyOf(flow.transport), flow.partner);
      assert.deepEqual([rule.from, rule.to], ['hospital-servers', flow.zone === 'vpn' ? 'outside' : 'dmz'], flow.partner);
    }
    assert.equal(new Set(EXTERNAL_FLOWS.map(([id, flow]) => ruleForExternal(id, flow).id)).size, 4);
  });
});

describe('PARTNERS', () => {
  it('has one partner for each external flow of departments.ts, none left over', () => {
    const wanted = new Set(EXTERNAL_FLOWS.map(([, { partner }]) => partner));
    assert.deepEqual(new Set(PARTNERS.map(({ name }) => name)), wanted);
    assert.equal(new Set(PARTNERS.map(({ id }) => id)).size, PARTNERS.length);
  });

  it('agrees with its flow on the path and the family', () => {
    for (const [, flow] of EXTERNAL_FLOWS) {
      const partner = partnerOfExternal(flow);
      assert.equal(partner.path, flow.zone, flow.partner);
      assert.equal(partner.family, familyOf(flow.transport), flow.partner);
      for (const text of [partner.operator, partner.identity, partner.certification, partner.explain]) assert.ok(text.length > 0, flow.partner);
    }
  });

  it('throws on a partner nobody declared', () => {
    const stranger: ExternalFlow = { external: true, partner: 'Inconnu', payload: 'x', transport: 'HTTPS', zone: 'proxy' };
    assert.throws(() => partnerOfExternal(stranger), /Inconnu/);
  });
});

describe('GLOSSARY', () => {
  const TERMS = ['SIH', 'EAI', 'HL7 v2', 'MLLP', 'DICOM', 'FHIR', 'VLAN', 'DMZ', 'Pare-feu', 'Proxy', 'VPN', 'TLS', 'HDS', 'INS', 'INSi', 'DMP', 'MSSanté', 'PGSSI-S', 'ANSSI', 'CaRE', 'CERT Santé', 'Ségur', 'Mode dégradé', 'PRA / PCA'];

  it('defines at least twenty distinct terms, including the ones the layer talks about', () => {
    assert.ok(GLOSSARY.length >= MIN_GLOSSARY_TERMS);
    assert.equal(new Set(GLOSSARY.map(({ term }) => term.toLowerCase())).size, GLOSSARY.length);
    const defined = GLOSSARY.map(({ term }) => term);
    for (const term of TERMS) assert.ok(defined.includes(term), term);
  });

  it('cites only sources that doc/sources.md lists', () => {
    for (const { term, source } of GLOSSARY) {
      if (source !== undefined) assert.ok(source.startsWith('https://') && SOURCES_FILE.includes(source), `${term}: ${source}`);
    }
  });
});

describe('the French of the Réseau content', () => {
  it('avoids English interface words', () => {
    const texts = [
      ...ZONES.flatMap(({ label, short, explain }) => [label, short, explain]),
      ...PROTOCOL_FAMILIES.flatMap(({ label, ports, explain }) => [label, ports, explain]),
      ...EQUIPMENT.flatMap(({ label, explain }) => [label, explain]),
      ...FIREWALL_RULES.flatMap(({ port, service, purpose }) => [port, service, purpose]),
      ...PARTNERS.flatMap(({ name, operator, identity, certification, explain }) => [name, operator, identity, certification, explain]),
      ...GLOSSARY.flatMap(({ term, definition }) => [term, definition]),
      ...DEPARTMENTS.map(({ network }) => network.resilience),
    ];
    for (const text of texts) assert.doesNotMatch(text, ENGLISH_WORDS, text);
  });
});
