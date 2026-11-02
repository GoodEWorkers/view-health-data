// Cuts the lines of a synthetic capture into the pieces a sheet colours: timestamp, addresses, flags, decoder note, hex with ASCII, and the framing (MLLP block bytes, DICOM PDU header, TLS ClientHello, ESP packets). Pure.

export type PieceKind = 'text' | 'stamp' | 'address' | 'flags' | 'note' | 'hex' | 'ascii' | 'frame';
export type Piece = { readonly kind: PieceKind; readonly text: string };
export type CaptureRow = { readonly number: number; readonly pieces: readonly Piece[] };

const PACKET_LINE = /^(\d{2}:\d{2}:\d{2}\.\d{6}) (IP) (\S+) > (\S+): (.*)$/;
const HEX_LINE = /^(\s*0x[0-9a-f]{4}:\s+)([0-9a-f ]+?)(\s{2,})(.*)$/;
const TCP_DETAIL = /^(Flags \[[^\]]*\], .*?length \d+)(?:: (.*))?$/;
const FRAMING_IN_NOTE: readonly RegExp[] = [/DICOM [A-Z-]+ \(PDU 0x[0-9a-f]{2}\)/, /TLS handshake \(0x16\), ClientHello.*/, /ESP\(spi=[^)]*\)/];
const MLLP_START = 0x0b;
const MLLP_END = [0x1c, 0x0d];
const PDU_HEADER_BYTES = 6;

const merge = (pieces: readonly Piece[]): Piece[] =>
  pieces.reduce<Piece[]>((merged, piece) => {
    const last = merged.at(-1);
    if (last?.kind === piece.kind) merged[merged.length - 1] = { kind: piece.kind, text: last.text + piece.text };
    else if (piece.text !== '') merged.push(piece);
    return merged;
  }, []);

function noteWithFraming(text: string, kind: PieceKind): Piece[] {
  const framing = FRAMING_IN_NOTE.map((pattern) => pattern.exec(text)).find((found) => found !== null);
  if (!framing) return [{ kind, text }];
  const [match] = framing;
  return [{ kind, text: text.slice(0, framing.index) }, { kind: 'frame', text: match }, { kind, text: text.slice(framing.index + match.length) }];
}

function packetPieces([, stamp, ip, source, destination, rest]: RegExpExecArray): Piece[] {
  const head: Piece[] = [{ kind: 'stamp', text: stamp! }, { kind: 'text', text: ` ${ip} ` }, { kind: 'address', text: source! }, { kind: 'text', text: ' > ' }, { kind: 'address', text: destination! }, { kind: 'text', text: ': ' }];
  const tcp = TCP_DETAIL.exec(rest!);
  if (!tcp) return [...head, ...noteWithFraming(rest!, 'note')];
  const [, flags, note] = tcp;
  return [...head, { kind: 'flags', text: flags! }, ...(note === undefined ? [] : [{ kind: 'text' as const, text: ': ' }, ...noteWithFraming(note, 'note')])];
}


// Which bytes of a hex row are framing: the first byte of an HL7 message (0x0B), its last two (0x1C 0x0D) and the six bytes of a DICOM PDU header.
function framingBytes(row: RegExpExecArray, note: string, isLastRow: boolean): ReadonlySet<number> {
  const [, , hex] = row;
  const bytes = hex!.replaceAll(' ', '').match(/../g)!.map((pair) => parseInt(pair, 16));
  const marked = new Set<number>();
  const startsPacket = row[1]!.includes('0x0000');
  if (startsPacket && note.startsWith('HL7') && bytes[0] === MLLP_START) marked.add(0);
  if (startsPacket && note.includes('(PDU 0x')) bytes.slice(0, PDU_HEADER_BYTES).forEach((_, index) => marked.add(index));
  if (isLastRow && note.startsWith('HL7') && bytes.length >= MLLP_END.length && MLLP_END.every((byte, index) => bytes[bytes.length - MLLP_END.length + index] === byte)) {
    MLLP_END.forEach((_, index) => marked.add(bytes.length - MLLP_END.length + index));
  }
  return marked;
}

function hexPieces(line: string, note: string, isLastRow: boolean): Piece[] {
  const row = HEX_LINE.exec(line);
  if (!row) return [{ kind: 'text', text: line }];
  const marked = framingBytes(row, note, isLastRow);
  let byteIndex = 0;
  const hexPart = [...row[2]!.matchAll(/([0-9a-f]{2})|( +)/g)].map(([text, byte]): Piece => {
    if (byte === undefined) return { kind: 'hex', text: text! };
    return { kind: marked.has(byteIndex++) ? 'frame' : 'hex', text: text! };
  });
  const ascii = [...row[4]!].map((character, index): Piece => ({ kind: marked.has(index) ? 'frame' : 'ascii', text: character }));
  return [{ kind: 'text', text: row[1]! }, ...hexPart, { kind: 'text', text: row[3]! }, ...ascii];
}

export function captureRows(lines: readonly string[]): CaptureRow[] {
  let note = '';
  return lines.map((line, index) => {
    const packetLine = PACKET_LINE.exec(line);
    if (packetLine) {
      note = TCP_DETAIL.exec(packetLine[5]!)?.[2] ?? '';
      return { number: index + 1, pieces: merge(packetPieces(packetLine)) };
    }
    const next = lines[index + 1];
    return { number: index + 1, pieces: merge(hexPieces(line, note, next === undefined || PACKET_LINE.test(next))) };
  });
}
