// Decodes a dcmdump-style listing: one row and one raw unit per tag line; tags are grouped into blocks by what they describe.

import { lookup } from '../dictionary/index.ts';
import { dicomTokens } from '../syntax.ts';
import { renderValue } from './render.ts';
import { BLOCK_PREFIX, ROW_PREFIX } from './types.ts';
import type { Card, DecodedFile, RawLine, Row } from './types.ts';

const TAG_LINE = /^(\(\w{4},\w{4}\)) \w{2} \[(.*)\] # \w+$/;

const BLOCK_OF_TAG: Readonly<Record<string, string>> = {
  '(0008,0005)': 'Encodage',
  '(0008,0020)': 'Examen',
  '(0008,0030)': 'Examen',
  '(0008,0050)': 'Examen',
  '(0008,0060)': 'Examen',
  '(0008,0090)': 'Examen',
  '(0008,1030)': 'Examen',
  '(0010,0010)': 'Patient',
  '(0010,0020)': 'Patient',
  '(0010,0030)': 'Patient',
  '(0010,0040)': 'Patient',
  '(0018,0050)': 'Série',
  '(0020,0011)': 'Série',
  '(0028,0010)': 'Image',
  '(0028,0011)': 'Image',
};

export function decodeDicom(text: string): DecodedFile {
  const lines: RawLine[] = [];
  const unresolved: string[] = [];
  const blocks: { ref: string; title: string; numbers: number[]; rows: Row[] }[] = [];

  text.split('\n').forEach((source, index) => {
    const number = index + 1;
    const [, tag = '', raw = ''] = TAG_LINE.exec(source) ?? [];
    const entry = lookup(tag);
    if (!entry) unresolved.push(tag || source);
    const title = BLOCK_OF_TAG[tag] ?? 'Autre';
    const isNewBlock = blocks.at(-1)?.title !== title;
    if (isNewBlock) blocks.push({ ref: `${BLOCK_PREFIX}${blocks.length + 1}`, title, numbers: [], rows: [] });
    const block = blocks.at(-1)!;
    const ref = `${ROW_PREFIX}${number}`;
    block.numbers.push(number);
    block.rows.push({ ref, code: tag, label: entry?.label ?? tag, value: renderValue(entry?.render, raw, { fields: [] }), raw, ...(entry?.explain ? { explain: entry.explain } : {}) });
    lines.push({ number, indent: 0, block: block.ref, tag: isNewBlock ? title : null, units: [{ ref, tokens: dicomTokens(source) }] });
  });

  const cards: Card[] = blocks.map(({ ref, title, numbers, rows }) => ({ ref, code: rows.length > 1 ? `${rows[0]!.code} … ${rows.at(-1)!.code}` : rows[0]!.code, title, lines: numbers, rows }));
  return { cards, lines, unresolved };
}
