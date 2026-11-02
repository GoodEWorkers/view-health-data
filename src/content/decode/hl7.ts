// Decodes an HL7 v2 message: one block per segment, one row per non-empty field. MSH counts its fields from 2 because the field separator itself is MSH-1.

import { lookup } from '../dictionary/index.ts';
import { hl7Tokens } from '../syntax.ts';
import { renderValue } from './render.ts';
import { BLOCK_PREFIX, ROW_PREFIX, appendUnit } from './types.ts';
import type { Card, DecodedFile, RawLine, RawUnit, Row } from './types.ts';

const FIELD_SEPARATOR = '|';
const HEADER_SEGMENT = 'MSH';
const FIRST_HEADER_FIELD = 2;
const FIRST_FIELD = 1;
const ANALYSIS_NAME = 1;
const NUMERIC_VALUE = 'NM';

const componentOf = (field: string | undefined, index: number): string => (field ?? '').split('^')[index] ?? '';

function subtitleOf(segment: string, fields: readonly string[]): string | undefined {
  if (segment === 'OBX') {
    const flag = lookup(`HL70078:${fields[8] ?? ''}`)?.label;
    const value = fields[2] === NUMERIC_VALUE ? [renderValue('decimal', fields[5] ?? '', { fields }), fields[6]].filter(Boolean).join(' ') : '';
    return [componentOf(fields[3], ANALYSIS_NAME), value, flag?.toLowerCase()].filter(Boolean).join(' · ');
  }
  return segment === 'RXE' ? componentOf(fields[2], ANALYSIS_NAME) : undefined;
}

export function decodeHl7(text: string): DecodedFile {
  const cards: Card[] = [];
  const lines: RawLine[] = [];
  const unresolved: string[] = [];
  let rowCount = 0;

  text.split('\n').forEach((source, index) => {
    const number = index + 1;
    const block = `${BLOCK_PREFIX}${number}`;
    const [segment = '', ...values] = source.split(FIELD_SEPARATOR);
    const entry = lookup(segment);
    if (!entry) unresolved.push(segment);
    const first = segment === HEADER_SEGMENT ? FIRST_HEADER_FIELD : FIRST_FIELD;
    const fields: string[] = [];
    values.forEach((raw, position) => (fields[position + first] = raw));

    const units: RawUnit[] = [{ ref: block, tokens: [{ kind: 'segment', text: segment }] }];
    const rows: Row[] = [];
    values.forEach((raw, position) => {
      appendUnit(units, null, [{ kind: 'separator', text: FIELD_SEPARATOR }]);
      if (raw === '') return;
      const code = `${segment}-${position + first}`;
      const field = lookup(code);
      if (!field) unresolved.push(code);
      const ref = `${ROW_PREFIX}${++rowCount}`;
      rows.push({ ref, code, label: field?.label ?? code, value: renderValue(field?.render, raw, { fields }), raw, ...(field?.explain ? { explain: field.explain } : {}) });
      units.push({ ref, tokens: hl7Tokens(raw, true) });
    });

    const subtitle = subtitleOf(segment, fields);
    cards.push({ ref: block, code: segment, title: entry?.label ?? segment, ...(subtitle ? { subtitle } : {}), ...(entry?.explain ? { explain: entry.explain } : {}), lines: [number], rows });
    lines.push({ number, indent: 0, block, tag: entry?.label ?? segment, units });
  });
  return { cards, lines, unresolved };
}
