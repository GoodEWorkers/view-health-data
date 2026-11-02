// Decodes the FHIR Bundle: each resource is a block, each key that holds a value is a row, found by a token walk with a stack of objects and arrays. Paths are FHIR paths without array indexes.

import { lookup } from '../dictionary/index.ts';
import type { RenderKind } from '../dictionary/index.ts';
import { jsonTokens } from '../syntax.ts';
import type { Token } from '../syntax.ts';
import { renderValue } from './render.ts';
import { BLOCK_PREFIX, ROW_PREFIX } from './types.ts';
import type { Card, DecodedFile, RawLine, RawUnit, Row } from './types.ts';

type RowDraft = Row & { render?: RenderKind };
type BlockDraft = { ref: string; title: string; rows: RowDraft[] };
type Frame = { path: string; block: BlockDraft; array: boolean; keyStart: number; rowRef: string | null };
type Flat = { line: number; token: Token };

const RESOURCE_TYPE = 'resourceType';
const OPENERS = ['{', '['];
const CLOSERS = ['}', ']'];

const unquoted = (text: string): string => (text.startsWith('"') ? text.slice(1, -1) : text);
const isSpace = ({ token }: Flat): boolean => token.kind === 'text';

export function decodeJson(source: string): DecodedFile {
  const unresolved: string[] = [];
  const blocks: BlockDraft[] = [];
  const frames: Frame[] = [];
  const lineBlock = new Map<number, string>();
  const keyedLines = new Set<number>();
  let rowCount = 0;

  const flat: Flat[] = source.split('\n').flatMap((sourceLine, index) => {
    const indent = /^ */.exec(sourceLine)![0].length;
    return jsonTokens(sourceLine.slice(indent)).map((token) => ({ line: index + 1, token }));
  });
  const refs: (string | null)[] = flat.map(() => null);
  const startBlock = (title: string): BlockDraft => {
    const block = { ref: `${BLOCK_PREFIX}${blocks.length + 1}`, title, rows: [] };
    blocks.push(block);
    return block;
  };
  const known = (path: string): ReturnType<typeof lookup> => {
    const entry = lookup(path);
    if (!entry) unresolved.push(path);
    return entry;
  };
  const nextValueIndex = (from: number): number => {
    let at = from + 1;
    while (isSpace(flat[at]!) || flat[at]!.token.text === ':') at++;
    return at;
  };
  const addRow = (frame: Frame, path: string, raw: string, line: number): string => {
    const entry = known(path);
    const [resource = '', first = '', second] = path.split('.');
    const group = second ? lookup(`${resource}.${first}`)?.label : undefined;
    const row: RowDraft = { ref: `${ROW_PREFIX}${++rowCount}`, code: path, label: entry?.label ?? path, value: '', raw, ...(entry?.explain ? { explain: entry.explain } : {}), ...(group ? { group } : {}), ...(entry?.render ? { render: entry.render } : {}) };
    frame.block.rows.push(row);
    lineBlock.set(line, frame.block.ref);
    keyedLines.add(line);
    return row.ref;
  };

  let pendingKey: { name: string; index: number } | null = null;
  for (let at = 0; at < flat.length; at++) {
    const { line, token } = flat[at]!;
    const frame = frames.at(-1);
    if (isSpace(flat[at]!)) continue;
    if (OPENERS.includes(token.text)) {
      const key = pendingKey;
      pendingKey = null;
      const block = frame?.block ?? startBlock('');
      frames.push({ path: frame && key ? `${frame.path}.${key.name}` : (frame?.path ?? ''), block, array: token.text === '[', keyStart: key?.index ?? -1, rowRef: null });
      refs[at] = block.ref;
      if (!keyedLines.has(line)) lineBlock.set(line, block.ref);
    } else if (CLOSERS.includes(token.text) && frame) {
      refs[at] = frame.rowRef ?? frame.block.ref;
      if (!keyedLines.has(line)) lineBlock.set(line, frame.block.ref);
      frames.pop();
    } else if (token.kind === 'key' && frame) {
      const name = unquoted(token.text);
      const valueAt = nextValueIndex(at);
      if (OPENERS.includes(flat[valueAt]!.token.text)) {
        known(`${frame.path}.${name}`);
        for (let index = at; index < valueAt; index++) refs[index] = frame.block.ref;
        lineBlock.set(line, frame.block.ref);
        keyedLines.add(line);
        pendingKey = { name, index: at };
        continue;
      }
      const raw = unquoted(flat[valueAt]!.token.text);
      if (name === RESOURCE_TYPE) {
        frame.path = raw;
        if (frame.block.title !== '') frame.block = startBlock(raw);
        frame.block.title = raw;
      }
      const ref = addRow(frame, `${frame.path}.${name}`, raw, line);
      for (let index = at; index <= valueAt; index++) refs[index] = ref;
      at = valueAt;
    } else if (frame?.array && token.kind !== 'punctuation') {
      const ref = addRow(frame, frame.path, unquoted(token.text), line);
      for (let index = Math.max(frame.keyStart, 0); index <= at; index++) refs[index] = ref;
      frame.rowRef = ref;
    } else if (frame) refs[at] = frame.block.ref;
  }

  flat.forEach((item, at) => {
    if (!isSpace(item)) return;
    const [before, after] = [flat[at - 1], flat[at + 1]];
    const sameLine = before?.line === item.line && after?.line === item.line;
    refs[at] = sameLine && refs[at - 1] === refs[at + 1] ? (refs[at - 1] ?? null) : null;
  });

  const rowsOf = (block: BlockDraft): Row[] => block.rows.map(({ render, ...row }) => ({ ...row, value: renderValue(render, row.raw, { fields: [] }) }));
  const cards: Card[] = blocks.map((block) => {
    const entry = lookup(block.title);
    return { ref: block.ref, code: block.title, title: entry?.label ?? block.title, ...(entry?.explain ? { explain: entry.explain } : {}), lines: [...lineBlock].filter(([, ref]) => ref === block.ref).map(([line]) => line).sort((first, second) => first - second), rows: rowsOf(block) };
  });
  const lines: RawLine[] = source.split('\n').map((sourceLine, index) => {
    const number = index + 1;
    const units: RawUnit[] = [];
    flat.forEach((item, at) => {
      if (item.line !== number) return;
      const last = units.at(-1);
      if (last && last.ref === refs[at]) units[units.length - 1] = { ref: last.ref, tokens: [...last.tokens, item.token] };
      else units.push({ ref: refs[at] ?? null, tokens: [item.token] });
    });
    const block = lineBlock.get(number) ?? null;
    const isRunStart = block !== null && lineBlock.get(number - 1) !== block;
    return { number, indent: /^ */.exec(sourceLine)![0].length, block, tag: isRunStart ? (cards.find(({ ref }) => ref === block)?.title ?? null) : null, units };
  });
  return { cards, lines, unresolved };
}
