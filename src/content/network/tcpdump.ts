// Pure printers for synthetic tcpdump-style lines: a TCP conversation with relative sequence numbers, and the hex and ASCII rows of a payload. Line shapes follow the tcpdump manual page (doc/sources.md, F46).

export type Endpoint = { readonly address: string; readonly port: number };
export type Conversation = { readonly client: Endpoint; readonly server: Endpoint };
export type Side = 'client' | 'server';

export type Segment = {
  readonly sender: Side;
  readonly bytes: number;
  readonly note?: string;
  readonly rows?: readonly string[];
};

const CLOCK = '09:41:07';
const FIRST_MICROSECOND = 120431;
const MICROSECONDS_PER_PACKET = 233;
const CLIENT_INITIAL_SEQUENCE = 2901584937;
const SERVER_INITIAL_SEQUENCE = 1130472855;
const WINDOWS: Readonly<Record<Side, number>> = { client: 502, server: 509 };
const BYTES_PER_ROW = 16;
const HEX_COLUMN_WIDTH = 39;
const ROW_INDENT = ' '.repeat(8);
const FIRST_PRINTABLE = 0x20;
const LAST_PRINTABLE = 0x7e;

export const stamp = (packet: number): string => `${CLOCK}.${String(FIRST_MICROSECOND + packet * MICROSECONDS_PER_PACKET).padStart(6, '0')}`;

const endpointText = ({ address, port }: Endpoint): string => `${address}.${port}`;

export const packetLine = (packet: number, source: string, destination: string, detail: string): string => `${stamp(packet)} IP ${source} > ${destination}: ${detail}`;

export function hexRow(bytes: Uint8Array, offset: number): string {
  const row = Array.from(bytes.slice(offset, offset + BYTES_PER_ROW));
  const hex = row.map((byte) => byte.toString(16).padStart(2, '0'));
  const groups = Array.from({ length: Math.ceil(hex.length / 2) }, (_, index) => hex.slice(index * 2, index * 2 + 2).join(''));
  const ascii = row.map((byte) => (byte >= FIRST_PRINTABLE && byte <= LAST_PRINTABLE ? String.fromCharCode(byte) : '.')).join('');
  return `${ROW_INDENT}0x${offset.toString(16).padStart(4, '0')}:  ${groups.join(' ').padEnd(HEX_COLUMN_WIDTH)}  ${ascii}`;
}

// The rows holding the last two bytes, so an MLLP end block (0x1C 0x0D) is always shown whole.
export const tailOffsets = (bytes: Uint8Array): readonly number[] => [...new Set([bytes.length - 2, bytes.length - 1].map((index) => Math.floor(index / BYTES_PER_ROW) * BYTES_PER_ROW))];

export function tcpExchange({ client, server }: Conversation, segments: readonly Segment[]): string[] {
  const ends: Readonly<Record<Side, readonly [Endpoint, Endpoint]>> = { client: [client, server], server: [server, client] };
  const line = (packet: number, sender: Side, detail: string): string => packetLine(packet, endpointText(ends[sender][0]), endpointText(ends[sender][1]), detail);
  const lines = [
    line(0, 'client', `Flags [S], seq ${CLIENT_INITIAL_SEQUENCE}, win ${WINDOWS.client}, length 0`),
    line(1, 'server', `Flags [S.], seq ${SERVER_INITIAL_SEQUENCE}, ack ${CLIENT_INITIAL_SEQUENCE + 1}, win ${WINDOWS.server}, length 0`),
    line(2, 'client', `Flags [.], ack 1, win ${WINDOWS.client}, length 0`),
  ];
  const sent: Record<Side, number> = { client: 0, server: 0 };
  segments.forEach(({ sender, bytes, note, rows = [] }, index) => {
    const peer: Side = sender === 'client' ? 'server' : 'client';
    const detail = `Flags [P.], seq ${sent[sender] + 1}:${sent[sender] + bytes + 1}, ack ${sent[peer] + 1}, win ${WINDOWS[sender]}, length ${bytes}`;
    lines.push(line(3 + index, sender, note === undefined ? detail : `${detail}: ${note}`), ...rows);
    sent[sender] += bytes;
  });
  return lines;
}
