import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../departments.ts';
import type { DepartmentId, ExternalFlow, Flow } from '../departments.ts';
import { admissionMessage } from '../messages/admission.ts';
import {
  captureOf,
  captureOfExternal,
  externalSheetOf,
  familyOf,
  flowSheetOf,
  hopsOf,
  hopsOfExternal,
  partnerOfExternal,
  ruleForExternal,
  ruleForFlow,
} from './index.ts';

const ENGLISH_WORDS =
  /\b(the|and|with|from|click|loading|error|settings|search|submit|cancel|save|delete|edit|login|logout|dashboard|workflow|workstations?|servers?|firewall|gateway|upload|download|devices?)\b/i;
const MIN_CAPTURE_LINES = 6;
const MAX_CAPTURE_LINES = 10;
const FIRST_DYNAMIC_PORT = 49152;
const TCP_LINE = /^\d{2}:\d{2}:\d{2}\.\d{6} IP \S+ > \S+: /;
const HEX_LINE = /^ {8}0x[0-9a-f]{4}: {2}[0-9a-f ]+ {2}.*$/;
const START_BLOCK = '0b';
const END_BLOCK_AND_RETURN = '1c0d';
// Start block, the carriage return that ends the last segment, end block, carriage return.
const FRAMING_BYTES = 4;
const MLLP_PORT = '.2575';
const DICOM_PORT = /\.(104|11112)[ :]/;

const ALL_FLOWS: readonly (readonly [DepartmentId, Flow])[] = DEPARTMENTS.flatMap(({ id, flows }) => flows.map((flow): readonly [DepartmentId, Flow] => [id, flow]));
const EXTERNAL_FLOWS: readonly (readonly [DepartmentId, ExternalFlow])[] = DEPARTMENTS.flatMap(({ id, network }) =>
  network.externalFlows.map((flow): readonly [DepartmentId, ExternalFlow] => [id, flow]),
);
const flowOf = (id: DepartmentId, payload: string): Flow => DEPARTMENTS.find((department) => department.id === id)!.flows.find((flow) => flow.payload === payload)!;
const externalOf = (partner: string): readonly [DepartmentId, ExternalFlow] => EXTERNAL_FLOWS.find(([, flow]) => flow.partner === partner)!;
const tcpLines = (lines: readonly string[]): string[] => lines.filter((line) => TCP_LINE.test(line));
const hexOf = (line: string): string => line.slice(line.indexOf(':') + 1).trim().split('  ')[0]!.replaceAll(' ', '');
const hexLines = (lines: readonly string[]): string[] => lines.filter((line) => HEX_LINE.test(line)).map(hexOf);
const addressOf = (endpoint: string): string => endpoint.split('.').slice(0, 4).join('.');
const isPrivate = (address: string): boolean => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address);
const isDocumentation = (address: string): boolean => address.startsWith('203.0.113.');
const endpointsOf = (line: string): string[] => {
  const [, source, destination] = /IP (\S+) > (\S+):/.exec(line)!;
  return [addressOf(source!), addressOf(destination!)];
};

describe('hopsOf', () => {
  it('starts every flow at a device of its room and ends at the EAI or at the device of the destination', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const hops = hopsOf(id, flow);
      assert.deepEqual([hops[0]?.kind, hops[0]?.room], ['device', id], `${id} ${flow.payload}`);
      const last = hops.at(-1)!;
      if (flow.to === 'eai') assert.equal(last.kind, 'eai', `${id} ${flow.payload}`);
      else assert.deepEqual([last.kind, last.room, hops.some(({ kind }) => kind === 'eai')], ['device', flow.to, flow.transport !== 'HTTPS'], `${id} ${flow.payload}`);
    }
  });

  it('passes the firewall exactly when the flow changes zone', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const passesFirewall = hopsOf(id, flow).some(({ kind }) => kind === 'firewall');
      assert.equal(passesFirewall, ruleForFlow(id, flow) !== undefined, `${id} ${flow.payload}`);
    }
  });

  it('sends the scanner images through its room switch, the core and the firewall before the EAI', () => {
    const kinds = hopsOf('pacs-ris', flowOf('pacs-ris', 'Images + metadata')).map(({ kind }) => kind);
    assert.deepEqual(kinds, ['device', 'switch', 'core', 'firewall', 'eai']);
  });

  it('lets the DPI fetch the DICOMweb images from the PACS/RIS without the EAI', () => {
    const kinds = hopsOf('pacs-ris', flowOf('pacs-ris', 'Images')).map(({ kind }) => kind);
    assert.deepEqual(kinds, ['device', 'core', 'device']);
  });

  it('keeps a message between two servers on the core and the EAI, in and out', () => {
    const hops = hopsOf('gam', DEPARTMENTS[0]!.flows[0]!);
    assert.deepEqual(hops.map(({ kind }) => kind), ['device', 'core', 'eai', 'core', 'device']);
    assert.ok(hops.every(({ label, detail }) => label.length > 0 && detail.length > 0));
  });
});

describe('hopsOfExternal', () => {
  it('starts at a device, passes the firewall and the router, and ends outside', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) {
      const kinds = hopsOfExternal(id, flow).map(({ kind }) => kind);
      assert.deepEqual([kinds[0], kinds.includes('firewall'), kinds.at(-2), kinds.at(-1)], ['device', true, 'router', 'outside'], flow.partner);
    }
  });

  it('puts the proxy, the DMZ relay or the VPN tunnel between the firewall and the router', () => {
    const middle = (partner: string): string[] => {
      const [id, flow] = externalOf(partner);
      return hopsOfExternal(id, flow).map(({ kind }) => kind).slice(3, -2);
    };
    assert.deepEqual(middle('Téléservice INSi'), ['proxy']);
    assert.deepEqual(middle('DMP / Mon espace santé'), ['proxy']);
    assert.deepEqual(middle('Téléradiologie'), ['vpn']);
  });

  it('names the partner at the far end', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) assert.equal(hopsOfExternal(id, flow).at(-1)!.label, flow.partner);
  });
});

describe('captureOf', () => {
  it('writes six to ten lines, each a tcpdump line or a hex line, for every flow', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const lines = captureOf(id, flow);
      assert.ok(lines.length >= MIN_CAPTURE_LINES && lines.length <= MAX_CAPTURE_LINES, `${id} ${flow.payload}: ${lines.length}`);
      for (const line of lines) assert.ok(TCP_LINE.test(line) || HEX_LINE.test(line), `${id} ${flow.payload}: ${line}`);
    }
  });

  it('uses private addresses and a dynamic client port', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const lines = tcpLines(captureOf(id, flow));
      for (const line of lines) assert.ok(endpointsOf(line).every(isPrivate), `${id} ${flow.payload}: ${line}`);
      const [source] = /IP (\S+) >/.exec(lines[0]!)!.slice(1);
      assert.ok(Number(source!.split('.')[4]) >= FIRST_DYNAMIC_PORT, `${id} ${flow.payload}: client port of ${source}`);
    }
  });

  it('frames an MLLP message with 0x0B before the MSH and 0x1C 0x0D after the last segment, on port 2575', () => {
    for (const [id, flow] of ALL_FLOWS.filter(([, { transport }]) => transport === 'MLLP')) {
      const lines = captureOf(id, flow);
      for (const line of tcpLines(lines)) assert.ok(line.includes(MLLP_PORT), `${id} ${flow.payload}: ${line}`);
      const firstPush = lines.findIndex((line) => line.includes('Flags [P.]'));
      const secondPush = lines.findIndex((line, index) => index > firstPush && line.includes('Flags [P.]'));
      const [message, acknowledgement] = [lines.slice(firstPush, secondPush), lines.slice(secondPush)].map(hexLines);
      assert.ok(message![0]!.startsWith(`${START_BLOCK}4d5348`), `${id} ${flow.payload} start`);
      assert.ok(message!.join('').endsWith(END_BLOCK_AND_RETURN), `${id} ${flow.payload} end`);
      assert.ok(acknowledgement![0]!.startsWith(`${START_BLOCK}4d5348`), `${id} ${flow.payload} acknowledgement`);
    }
  });

  it('counts the length of the ADT^A01 as one start byte, the message with a carriage return per segment, and two end bytes', () => {
    const message = new TextEncoder().encode(admissionMessage().replaceAll('\n', '\r')).length;
    const [line] = tcpLines(captureOf('gam', DEPARTMENTS[0]!.flows[0]!)).filter((text) => text.includes('Flags [P.]'));
    assert.match(line!, new RegExp(`length ${message + FRAMING_BYTES}`));
  });

  it('answers the first MLLP message with an ACK whose MSA repeats the control id', () => {
    const lines = captureOf('gam', DEPARTMENTS[0]!.flows[0]!);
    const pushes = tcpLines(lines).filter((line) => line.includes('Flags [P.]'));
    assert.equal(pushes.length, 2);
    assert.ok(endpointsOf(pushes[0]!)[0] === endpointsOf(pushes[1]!)[1]);
    assert.ok(lines.some((line) => line.includes('ACK')), 'an ACK is annotated');
  });

  it('numbers the bytes of each side from 1 and acknowledges what the other side sent', () => {
    const lengthOf = (line: string): number => Number(/length (\d+)/.exec(line)![1]);
    const [push, answer] = tcpLines(captureOf('gam', DEPARTMENTS[0]!.flows[0]!)).filter((line) => line.includes('Flags [P.]'));
    assert.match(push!, new RegExp(`seq 1:${lengthOf(push!) + 1}, ack 1,`));
    assert.match(answer!, new RegExp(`seq 1:${lengthOf(answer!) + 1}, ack ${lengthOf(push!) + 1},`));
  });

  it('shows an A-ASSOCIATE-RQ and then a C-STORE-RQ for DICOM, on a DICOM port', () => {
    const lines = captureOf('pacs-ris', flowOf('pacs-ris', 'Images + metadata'));
    const text = lines.join('\n');
    assert.ok(text.indexOf('A-ASSOCIATE-RQ') > -1 && text.indexOf('A-ASSOCIATE-RQ') < text.indexOf('C-STORE-RQ'));
    for (const line of tcpLines(lines)) assert.match(line, DICOM_PORT);
    assert.ok(hexLines(lines)[0]!.startsWith('0100000000cd0001'), 'PDU type 01, length 205, protocol version 1');
  });

  it('shows a TLS ClientHello with its SNI on port 443 for the DICOMweb images, the DPI being the client', () => {
    const lines = captureOf('pacs-ris', flowOf('pacs-ris', 'Images'));
    assert.ok(lines.some((line) => line.includes('ClientHello') && line.includes('SNI')));
    const [syn] = tcpLines(lines);
    assert.match(syn!, /> \S+\.443: Flags \[S\]/);
  });
});

describe('captureOfExternal', () => {
  it('writes six to ten lines for every external flow, from private to documentation addresses', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) {
      const lines = captureOfExternal(id, flow);
      assert.ok(lines.length >= MIN_CAPTURE_LINES && lines.length <= MAX_CAPTURE_LINES, `${flow.partner}: ${lines.length}`);
      for (const line of tcpLines(lines)) assert.ok(endpointsOf(line).every((address) => isPrivate(address) || isDocumentation(address)), `${flow.partner}: ${line}`);
    }
  });

  it('shows the SNI of the partner for the HTTPS exchanges through the proxy and the DMZ', () => {
    for (const partner of ['Téléservice INSi', 'e-PMSI (ATIH)', 'Grossiste-répartiteur', 'Agenda en ligne', 'DMP / Mon espace santé']) {
      const lines = captureOfExternal(...externalOf(partner));
      assert.ok(lines.some((line) => line.includes('ClientHello') && line.includes('SNI')), partner);
      assert.ok(tcpLines(lines).every((line) => line.includes('.443')), partner);
    }
  });

  it('shows STARTTLS on port 587 for MSSanté, then the ClientHello', () => {
    const lines = captureOfExternal(...externalOf('MSSanté'));
    assert.ok(tcpLines(lines).every((line) => line.includes('.587')));
    const text = lines.join('\n');
    assert.ok(text.indexOf('STARTTLS') > -1 && text.indexOf('STARTTLS') < text.indexOf('ClientHello'));
  });

  it('shows only IKE and ESP, never the DICOM it protects, for the VPN', () => {
    const text = captureOfExternal(...externalOf('Téléradiologie')).join('\n');
    assert.ok(text.includes('IKE_SA_INIT') && text.includes('ESP(spi=') && text.includes('.500'));
    assert.ok(!text.includes('C-STORE') && !text.includes('A-ASSOCIATE'));
  });
});

describe('flowSheetOf', () => {
  const stackOf = (layer: string, sheet: { stack: readonly { layer: string; value: string }[] }): string => sheet.stack.find((row) => row.layer === layer)?.value ?? '';

  it('gathers the rule, the hops and the capture the other modules give, with a title naming both ends', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const sheet = flowSheetOf(id, flow);
      assert.deepEqual([sheet.rule, sheet.hops, sheet.capture], [ruleForFlow(id, flow), hopsOf(id, flow), captureOf(id, flow)]);
      const acronyms = DEPARTMENTS.filter((department) => department.id === id || department.id === flow.to).map(({ acronym }) => acronym);
      for (const acronym of acronyms) assert.ok(sheet.title.includes(acronym), `${id}: ${sheet.title}`);
      assert.ok(sheet.title.includes(flow.payload), sheet.title);
    }
  });

  it('says in the stack whether the flow is encrypted, matching its family', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const security = stackOf('Sécurité', flowSheetOf(id, flow));
      const clear = familyOf(flow.transport!) === 'mllp' || familyOf(flow.transport!) === 'dicom';
      assert.equal(/^Aucun chiffrement/.test(security), clear, `${id} ${flow.payload}: ${security}`);
    }
  });

  it('tells the MLLP story: port 2575, in clear, inside the server zone, with no rule', () => {
    const sheet = flowSheetOf('gam', DEPARTMENTS[0]!.flows[0]!);
    assert.equal(sheet.rule, undefined);
    assert.match(sheet.summary, /2575/);
    assert.match(sheet.summary, /en clair/);
    assert.match(sheet.summary, /zone des serveurs/);
    assert.match(stackOf('Transport', sheet), /TCP.*2575/);
  });

  it('names the firewall rule that lets the scanner images through, and what a missing rule does', () => {
    const flow = flowOf('pacs-ris', 'Images + metadata');
    const sheet = flowSheetOf('pacs-ris', flow);
    assert.match(sheet.summary, new RegExp(`règle n° ${ruleForFlow('pacs-ris', flow)!.id}\\b`));
    assert.match(sheet.ifBlocked, /pare-feu/);
  });

  it('writes a consequence and a way to watch it for every flow, in French', () => {
    for (const [id, flow] of ALL_FLOWS) {
      const { title, summary, stack, hops, ifBlocked, monitoring } = flowSheetOf(id, flow);
      assert.ok(ifBlocked.length > 0 && monitoring.length > 0, `${id} ${flow.payload}`);
      const french = [summary, ifBlocked, monitoring, ...stack.flatMap(({ layer, value }) => [layer, value]), ...hops.flatMap(({ label, detail }) => [label, detail])];
      for (const text of french) assert.doesNotMatch(text, ENGLISH_WORDS, `${title}: ${text}`);
    }
  });
});

describe('externalSheetOf', () => {
  it('gives every external flow its rule, hops, capture, identity and certification', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) {
      const sheet = externalSheetOf(id, flow);
      const partner = partnerOfExternal(flow);
      assert.deepEqual([sheet.rule, sheet.hops, sheet.capture], [ruleForExternal(id, flow), hopsOfExternal(id, flow), captureOfExternal(id, flow)]);
      assert.ok(sheet.title.includes(flow.partner) && sheet.summary.includes(flow.partner), flow.partner);
      assert.equal(sheet.stack.find(({ layer }) => layer === 'Identité')?.value, partner.identity, flow.partner);
      assert.equal(sheet.stack.find(({ layer }) => layer === 'Certification')?.value, partner.certification, flow.partner);
    }
  });

  it('writes the exit path in the summary: proxy, relay in the DMZ, or VPN tunnel', () => {
    assert.match(externalSheetOf(...externalOf('Téléservice INSi')).summary, /proxy/);
    assert.match(externalSheetOf(...externalOf('MSSanté')).summary, /DMZ/);
    assert.match(externalSheetOf(...externalOf('Téléradiologie')).summary, /VPN/);
  });

  it('is written in French without English interface words', () => {
    for (const [id, flow] of EXTERNAL_FLOWS) {
      const { summary, stack, hops, ifBlocked, monitoring } = externalSheetOf(id, flow);
      const french = [summary, ifBlocked, monitoring, ...stack.flatMap(({ layer, value }) => [layer, value]), ...hops.flatMap(({ label, detail }) => [label, detail])];
      for (const text of french) assert.doesNotMatch(text, ENGLISH_WORDS, `${flow.partner}: ${text}`);
    }
  });
});
