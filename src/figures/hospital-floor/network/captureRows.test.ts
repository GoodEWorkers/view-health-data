import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPARTMENTS } from '../../../content/departments.ts';
import { captureOf, captureOfExternal } from '../../../content/network/capture.ts';
import { captureRows } from './captureRows.ts';
import type { CaptureRow } from './captureRows.ts';

const flowOf = (room: string, payload: string) => DEPARTMENTS.find(({ id }) => id === room)!.flows.find((flow) => flow.payload === payload)!;
const framed = (rows: readonly CaptureRow[]): string[] => rows.flatMap(({ pieces }) => pieces.filter(({ kind }) => kind === 'frame').map(({ text }) => text));
const textOf = ({ pieces }: CaptureRow): string => pieces.map(({ text }) => text).join('');

describe('captureRows', () => {
  it('gives back every line unchanged, numbered from 1', () => {
    for (const lines of [captureOf('gam', flowOf('gam', 'Identité patient')), captureOf('pacs-ris', flowOf('pacs-ris', 'Images + metadata'))]) {
      const rows = captureRows(lines);
      assert.deepEqual(rows.map(textOf), lines);
      assert.deepEqual(rows.map(({ number }) => number), lines.map((_, index) => index + 1));
    }
  });

  it('colours the MLLP start byte of each message, then the end block and carriage return of the first one, and nothing else of the bytes', () => {
    const rows = captureRows(captureOf('gam', flowOf('gam', 'Identité patient')));
    const bytes = (row: CaptureRow): string[] => framed([row]).filter((text) => /^[0-9a-f]{2}$/.test(text));
    assert.deepEqual(rows.map(bytes).filter((found) => found.length > 0), [['0b'], ['1c', '0d'], ['0b']]);
    assert.ok(framed(rows).every((text) => /^[0-9a-f]{2}$/.test(text) || text === '.' || text === '..'));
  });

  it('colours the six bytes of the DICOM PDU header and the PDU named in the decoder note', () => {
    const rows = captureRows(captureOf('pacs-ris', flowOf('pacs-ris', 'Images + metadata')));
    const headerRow = rows.find(({ pieces }) => pieces.some(({ kind, text }) => kind === 'frame' && text === '0100'))!;
    const headerBytes = headerRow.pieces.filter(({ kind, text }) => kind === 'frame' && /^[0-9a-f]+$/.test(text)).map(({ text }) => text);
    assert.deepEqual(headerBytes, ['0100', '0000', '00cd']);
    assert.ok(framed(rows).includes('DICOM A-ASSOCIATE-RQ (PDU 0x01)'));
  });

  it('colours the ClientHello of a TLS handshake and the ESP packets of a VPN tunnel', () => {
    const tls = captureRows(captureOfExternal('gam', DEPARTMENTS[0]!.network.externalFlows[0]!));
    assert.equal(framed(tls).length, 1);
    assert.match(framed(tls)[0]!, /^TLS handshake \(0x16\), ClientHello legacy_version 0x0303, SNI /);
    const vpn = captureRows(captureOfExternal('pacs-ris', DEPARTMENTS.find(({ id }) => id === 'pacs-ris')!.network.externalFlows[0]!));
    assert.equal(framed(vpn).length, 3);
    assert.ok(framed(vpn).every((text) => text.startsWith('ESP(spi=')));
  });

  it('leaves a line that is neither a packet nor a hex row as plain text', () => {
    assert.deepEqual(captureRows(['rien à voir'])[0]!.pieces, [{ kind: 'text', text: 'rien à voir' }]);
  });
});
