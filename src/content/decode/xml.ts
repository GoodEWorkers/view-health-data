// Decodes the CDA document: each child of the root element is a block, each attribute and each text node is a row, found by a token walk over the whole file. Paths are relative to the root.

import { CDA_ROOT } from '../dictionary/cda.ts';
import { lookup } from '../dictionary/index.ts';
import type { RenderKind } from '../dictionary/index.ts';
import { xmlTokens } from '../syntax.ts';
import type { Token } from '../syntax.ts';
import { renderValue } from './render.ts';
import { BLOCK_PREFIX, ROW_PREFIX, appendUnit } from './types.ts';
import type { Card, DecodedFile, RawLine, RawUnit, Row } from './types.ts';

type RowDraft = { ref: string; code: string; raw: string; render?: RenderKind; label: string; explain?: string };
type BlockDraft = { ref: string; path: string; lines: Set<number>; rows: RowDraft[] };

const CLOSING = '</';
const OPENING = '<';
const SELF_CLOSING = '/>';
const TEXT_JOINER = ' ';

export function decodeXml(source: string): DecodedFile {
  const unresolved: string[] = [];
  const blocks: BlockDraft[] = [];
  const stack: string[] = [];
  const textRows = new Map<string, RowDraft>();
  let rowCount = 0;

  const pathOf = (): string => (stack.length === 1 ? CDA_ROOT : stack.slice(1).join('/'));
  const blockNow = (): BlockDraft => (stack.length >= 2 ? blocks.at(-1)! : blocks[0]!);
  const known = (path: string): ReturnType<typeof lookup> => {
    const entry = lookup(path);
    if (!entry) unresolved.push(path);
    return entry;
  };
  const newRow = (code: string, raw: string, block: BlockDraft): RowDraft => {
    const entry = known(code);
    const row: RowDraft = { ref: `${ROW_PREFIX}${++rowCount}`, code, raw, label: entry?.label ?? code, ...(entry?.render ? { render: entry.render } : {}), ...(entry?.explain ? { explain: entry.explain } : {}) };
    block.rows.push(row);
    return row;
  };

  const lines: RawLine[] = source.split('\n').map((sourceLine, index) => {
    const number = index + 1;
    const indent = /^ */.exec(sourceLine)![0].length;
    const units: RawUnit[] = [];
    let attribute: Token[] = [];
    let attributeName = '';
    let firstBlock: BlockDraft | undefined;
    let isClosing = false;

    const emit = (ref: string | null, tokens: readonly Token[], block: BlockDraft): void => {
      firstBlock ??= block;
      block.lines.add(number);
      appendUnit(units, ref, tokens);
    };

    xmlTokens(sourceLine.slice(indent)).forEach((token) => {
      if (token.kind === 'tag' && token.text.startsWith(CLOSING)) {
        emit(blockNow().ref, [token], blockNow());
        isClosing = true;
      } else if (token.kind === 'tag' && token.text.startsWith(OPENING)) {
        stack.push(token.text.slice(OPENING.length));
        if (stack.length <= 2) blocks.push({ ref: `${BLOCK_PREFIX}${blocks.length + 1}`, path: pathOf(), lines: new Set(), rows: [] });
        known(pathOf());
        emit(blockNow().ref, [token], blockNow());
      } else if (token.kind === 'tag') {
        emit(blockNow().ref, [token], blockNow());
        if (token.text === SELF_CLOSING || isClosing) stack.pop();
        isClosing = false;
      } else if (token.kind === 'attribute') {
        [attribute, attributeName] = [[token], token.text];
      } else if (attribute.length > 0 && token.kind === 'punctuation') {
        attribute.push(token);
      } else if (attribute.length > 0 && token.kind === 'value') {
        const row = newRow(`${pathOf()}@${attributeName}`, token.text.slice(1, -1), blockNow());
        emit(row.ref, [...attribute, token], blockNow());
        attribute = [];
      } else if (token.kind === 'text' && token.text.trim() !== '') {
        const path = pathOf();
        const row = textRows.get(path) ?? newRow(path, '', blockNow());
        textRows.set(path, row);
        row.raw = [row.raw, token.text.trim()].filter(Boolean).join(TEXT_JOINER);
        emit(row.ref, [token], blockNow());
      } else emit(null, [token], blockNow());
    });
    return { number, indent, block: firstBlock?.ref ?? null, tag: null, units };
  });

  const cards: Card[] = blocks.map(({ ref, path, lines: numbers, rows }) => {
    const entry = lookup(path);
    const finished: Row[] = rows.map(({ ref: rowRef, code, raw, render, label, explain }) => ({ ref: rowRef, code, label, raw, value: renderValue(render, raw, { fields: [] }), ...(explain ? { explain } : {}) }));
    return { ref, code: path, title: entry?.label ?? path, ...(entry?.explain ? { explain: entry.explain } : {}), lines: [...numbers].sort((first, second) => first - second), rows: finished };
  });
  const firstLineOf = new Map(cards.map(({ ref, lines: numbers }) => [ref, numbers[0]]));
  return { cards, lines: lines.map((line) => ({ ...line, tag: firstLineOf.get(line.block ?? '') === line.number ? cards.find(({ ref }) => ref === line.block)!.title : null })), unresolved };
}
