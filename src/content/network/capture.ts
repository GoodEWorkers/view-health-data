// Synthetic packet captures of a flow, as an engineer would see them on the wire: addresses in RFC 1918 (and RFC 5737 beyond the hospital), the real port, the real framing. Sizes of non-HL7 packets are illustrative (doc/sources.md, assumption 33).

import type { DepartmentId, ExternalFlow, Flow } from '../departments.ts';
import { EDITOR_FILES } from '../messages/index.ts';
import { messageHeader, patientSegment } from '../messages/hl7.ts';
import { MOCK_PATIENT } from '../screenMocks.ts';
import { partnerOfExternal, PARTNERS } from './partners.ts';
import { familyOf } from './protocols.ts';
import { acronymOf, indexOfRoom } from './rooms.ts';
import { hexRow, packetLine, tailOffsets, tcpExchange } from './tcpdump.ts';
import type { Conversation, Endpoint, Segment } from './tcpdump.ts';

const FIRST_SERVER_HOST = 11;
const FIRST_MODALITY_HOST = 20;
const FIRST_DYNAMIC_PORT = 49200;
const PROXY_ADDRESS = '10.40.1.10';
const RELAY_ADDRESS = '10.40.1.20';
const HOSPITAL_PUBLIC_ADDRESS = '203.0.113.10';
const REMOTE_PUBLIC_ADDRESS = '203.0.113.80';
const FIRST_PARTNER_HOST = 100;
const HOSPITAL_DOMAIN = 'chu-x.example';
const PARTNER_HOSTS: Readonly<Record<string, string>> = {
  insi: 'insi.example',
  epmsi: 'epmsi.example',
  grossiste: 'commandes.example',
  agenda: 'agenda.example',
  dmp: 'dmp.example',
  mssante: 'smtp.mssante.example',
};

const START_BLOCK = '\x0b';
const END_BLOCK = '\x1c';
const CARRIAGE_RETURN = '\r';
const MSH_MESSAGE_TYPE_FIELD = 8;
const SYNTHETIC_CONTROL_ID = '9001';
const ACKNOWLEDGEMENT_ACCEPT = 'AA';

const MODALITY_AE_TITLE = 'SCANNER_CT';
const AE_TITLE_WIDTH = 16;
const PDU_HEADER_BYTES = 6;
const A_ASSOCIATE_RQ_PDU_LENGTH = 205;
const A_ASSOCIATE_AC_BYTES = 196;
const C_STORE_RQ_BYTES = 124;
const C_STORE_RSP_BYTES = 90;
const PROTOCOL_VERSION_BIT = 1;
const APPLICATION_CONTEXT = '1.2.840.10008.3.1.1.1';
const CT_IMAGE_STORAGE = '1.2.840.10008.5.1.4.1.1.2';

const CLIENT_HELLO_BYTES = 517;
const SERVER_HELLO_BYTES = 1290;
const APPLICATION_DATA_BYTES = 143;

const hostAt = (room: DepartmentId, port: number): Endpoint => ({ address: `10.20.1.${FIRST_SERVER_HOST + indexOfRoom(room)}`, port });
const clientPortOf = (room: DepartmentId): number => FIRST_DYNAMIC_PORT + indexOfRoom(room);
const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);

function messageOf(from: DepartmentId, flow: Flow): string {
  const file = EDITOR_FILES[from];
  const header = file.text.split('\n')[0] ?? '';
  const carriesFlowType = file.format === 'hl7' && flow.messageType !== undefined && header.split('|')[MSH_MESSAGE_TYPE_FIELD]?.startsWith(`${flow.messageType}^`);
  if (carriesFlowType) return file.text;
  const type = flow.messageType === undefined ? '' : `${flow.messageType}^${flow.messageType.replace('^', '_')}`;
  const synthetic = messageHeader({ sending: acronymOf(from), receiving: acronymOf(flow.to), stamp: MOCK_PATIENT.entryStamp, type, control: SYNTHETIC_CONTROL_ID });
  return [synthetic, patientSegment()].join('\n');
}

const mllpFrame = (message: string): Uint8Array => bytesOf(`${START_BLOCK}${message.replaceAll('\n', CARRIAGE_RETURN)}${CARRIAGE_RETURN}${END_BLOCK}${CARRIAGE_RETURN}`);

function acknowledgementOf(message: string): string {
  const fields = (message.split('\n')[0] ?? '').split('|');
  const [sendingApplication = '', , , , stamped = '', , type = '', control = '', , version = ''] = fields.slice(2);
  const trigger = type.split('^')[1] ?? '';
  const header = messageHeader({ sending: 'EAI', receiving: sendingApplication, stamp: stamped, type: `ACK^${trigger}^ACK`, control: `A${control}`, version });
  return [header, `MSA|${ACKNOWLEDGEMENT_ACCEPT}|${control}`].join('\n');
}

function mllpLines(from: DepartmentId, flow: Flow, conversation: Conversation): string[] {
  const message = messageOf(from, flow);
  const type = (message.split('\n')[0] ?? '').split('|')[MSH_MESSAGE_TYPE_FIELD] ?? '';
  const [family = '', event = ''] = type.split('^');
  const frame = mllpFrame(message);
  const acknowledgement = mllpFrame(acknowledgementOf(message));
  const segments: readonly Segment[] = [
    { sender: 'client', bytes: frame.length, note: ['HL7', [family, event].filter(Boolean).join('^')].filter(Boolean).join(' '), rows: [0, 16, ...tailOffsets(frame)].map((offset) => hexRow(frame, offset)) },
    { sender: 'server', bytes: acknowledgement.length, note: ['HL7 ACK', event].filter(Boolean).join('^'), rows: [hexRow(acknowledgement, 0)] },
  ];
  return tcpExchange(conversation, segments);
}

const aeTitle = (text: string): string => text.padEnd(AE_TITLE_WIDTH, ' ');

function associateRequestHeader(called: string): Uint8Array {
  const length = [24, 16, 8, 0].map((shift) => (A_ASSOCIATE_RQ_PDU_LENGTH >> shift) & 0xff);
  return Uint8Array.from([0x01, 0x00, ...length, 0x00, PROTOCOL_VERSION_BIT, 0x00, 0x00, ...bytesOf(aeTitle(called)), ...bytesOf(aeTitle(MODALITY_AE_TITLE))]);
}

function dicomLines(flow: Flow, conversation: Conversation): string[] {
  const called = `${flow.to.toUpperCase().replace('-', '_')}_SCP`;
  const header = associateRequestHeader(called);
  const segments: readonly Segment[] = [
    {
      sender: 'client',
      bytes: PDU_HEADER_BYTES + A_ASSOCIATE_RQ_PDU_LENGTH,
      note: `DICOM A-ASSOCIATE-RQ (PDU 0x01), called AE ${called}, calling AE ${MODALITY_AE_TITLE}, context ${APPLICATION_CONTEXT}`,
      rows: [hexRow(header, 0), hexRow(header, 16)],
    },
    { sender: 'server', bytes: A_ASSOCIATE_AC_BYTES, note: 'DICOM A-ASSOCIATE-AC (PDU 0x02), presentation context 1 accepted' },
    { sender: 'client', bytes: C_STORE_RQ_BYTES, note: `DICOM P-DATA-TF (PDU 0x04) C-STORE-RQ, CT Image Storage ${CT_IMAGE_STORAGE}, message ID 1` },
    { sender: 'server', bytes: C_STORE_RSP_BYTES, note: 'DICOM P-DATA-TF (PDU 0x04) C-STORE-RSP, status 0x0000 (Success)' },
  ];
  return tcpExchange(conversation, segments);
}

const tlsSegments = (host: string): readonly Segment[] => [
  { sender: 'client', bytes: CLIENT_HELLO_BYTES, note: `TLS handshake (0x16), ClientHello legacy_version 0x0303, SNI ${host}` },
  { sender: 'server', bytes: SERVER_HELLO_BYTES, note: 'TLS handshake (0x16), ServerHello' },
  { sender: 'client', bytes: APPLICATION_DATA_BYTES, note: 'TLS application_data (0x17), encrypted' },
];

const smtpSegments = (host: string): readonly Segment[] => {
  const capabilities = `250-${host}\r\n250 STARTTLS\r\n`;
  return [
    { sender: 'server', bytes: bytesOf(`220 ${host} ESMTP\r\n`).length, note: `SMTP 220 ${host} ESMTP` },
    { sender: 'client', bytes: bytesOf(`EHLO ${HOSPITAL_DOMAIN}\r\n`).length, note: `SMTP EHLO ${HOSPITAL_DOMAIN}` },
    { sender: 'server', bytes: bytesOf(capabilities).length, note: 'SMTP 250 STARTTLS' },
    { sender: 'client', bytes: bytesOf('STARTTLS\r\n').length, note: 'SMTP STARTTLS' },
    { sender: 'server', bytes: bytesOf('220 Ready to start TLS\r\n').length, note: 'SMTP 220 Ready to start TLS' },
    { sender: 'client', bytes: CLIENT_HELLO_BYTES, note: `TLS handshake (0x16), ClientHello legacy_version 0x0303, SNI ${host}` },
  ];
};

export function captureOf(from: DepartmentId, flow: Flow): readonly string[] {
  if (flow.transport === undefined) throw new Error(`Flow "${flow.payload}" has no transport`);
  const family = familyOf(flow.transport);
  // The capture is the first leg, the sender to the EAI: a message for another room still carries that room in MSH-5, which is how the EAI routes it.
  if (family === 'mllp') return mllpLines(from, flow, { client: hostAt(from, clientPortOf(from)), server: hostAt('eai', 2575) });
  if (family === 'dicom') {
    const scanner: Endpoint = { address: `10.30.1.${FIRST_MODALITY_HOST + indexOfRoom(from)}`, port: clientPortOf(from) };
    return dicomLines(flow, { client: scanner, server: hostAt(flow.to, 11112) });
  }
  if (family === 'https') {
    // WADO-RS: the receiving system opens the connection and fetches, so the DPI is the TLS client of the PACS/RIS.
    const conversation: Conversation = { client: hostAt(flow.to, clientPortOf(flow.to)), server: hostAt(from, 443) };
    return tcpExchange(conversation, tlsSegments(`${from}.${HOSPITAL_DOMAIN}`));
  }
  throw new Error(`No internal ${family} flow is modelled`);
}

function vpnLines(): string[] {
  const initiator = `${HOSPITAL_PUBLIC_ADDRESS}.500`;
  const responder = `${REMOTE_PUBLIC_ADDRESS}.500`;
  const tunnel = (packet: number, spi: string, sequence: number, bytes: number, outbound: boolean): string =>
    packetLine(packet, outbound ? HOSPITAL_PUBLIC_ADDRESS : REMOTE_PUBLIC_ADDRESS, outbound ? REMOTE_PUBLIC_ADDRESS : HOSPITAL_PUBLIC_ADDRESS, `ESP(spi=${spi},seq=0x${sequence.toString(16)}), length ${bytes}`);
  return [
    packetLine(0, initiator, responder, 'UDP, length 296: IKEv2 IKE_SA_INIT request'),
    packetLine(1, responder, initiator, 'UDP, length 312: IKEv2 IKE_SA_INIT response'),
    packetLine(2, initiator, responder, 'UDP, length 240: IKEv2 IKE_AUTH request'),
    packetLine(3, responder, initiator, 'UDP, length 224: IKEv2 IKE_AUTH response'),
    tunnel(4, '0x1c2d3e4f', 1, 132, true),
    tunnel(5, '0x5a6b7c8d', 1, 100, false),
    tunnel(6, '0x1c2d3e4f', 2, 1476, true),
  ];
}

export function captureOfExternal(from: DepartmentId, flow: ExternalFlow): readonly string[] {
  if (flow.zone === 'vpn') return vpnLines();
  const partner = partnerOfExternal(flow);
  const host = PARTNER_HOSTS[partner.id];
  if (host === undefined) throw new Error(`No host name for partner ${partner.id}`);
  const source = flow.zone === 'proxy' ? PROXY_ADDRESS : RELAY_ADDRESS;
  const port = flow.transport === 'SMTP' ? 587 : 443;
  const conversation: Conversation = {
    client: { address: source, port: clientPortOf(from) },
    server: { address: `203.0.113.${FIRST_PARTNER_HOST + PARTNERS.indexOf(partner)}`, port },
  };
  return tcpExchange(conversation, flow.transport === 'SMTP' ? smtpSegments(host) : tlsSegments(host));
}
