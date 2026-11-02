// The model the inspector draws: cards for the readable pane and tagged lines for the raw pane, linked by refs (B for a block, R for a row). Pure data, built by the four decoders.

import type { Token } from '../syntax.ts';

export type Row = {
  readonly ref: string;
  readonly code: string;
  readonly label: string;
  readonly value: string;
  readonly raw: string;
  readonly explain?: string;
  readonly group?: string;
};

export type Card = {
  readonly ref: string;
  readonly code: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly explain?: string;
  readonly lines: readonly number[];
  readonly rows: readonly Row[];
};

export type RawUnit = { readonly ref: string | null; readonly tokens: readonly Token[] };

export type RawLine = {
  readonly number: number;
  readonly indent: number;
  readonly block: string | null;
  readonly tag: string | null;
  readonly units: readonly RawUnit[];
};

export type DecodedFile = {
  readonly cards: readonly Card[];
  readonly lines: readonly RawLine[];
  readonly unresolved: readonly string[];
};

export const BLOCK_PREFIX = 'B';
export const ROW_PREFIX = 'R';

export const isRowRef = (ref: string): boolean => ref.startsWith(ROW_PREFIX);

export function appendUnit(units: RawUnit[], ref: string | null, tokens: readonly Token[]): void {
  const last = units.at(-1);
  if (last && last.ref === ref && ref === null) units[units.length - 1] = { ref, tokens: [...last.tokens, ...tokens] };
  else units.push({ ref, tokens });
}

const CODE_PARTS = /[/.]/;
const SHORT_CODE_PARTS = 3;

export function shortCode(code: string): string {
  const parts = code.split(CODE_PARTS);
  if (parts.length <= SHORT_CODE_PARTS || code.startsWith('(')) return code;
  const separator = code.includes('/') ? '/' : '.';
  return `…${separator}${parts.slice(-SHORT_CODE_PARTS + 1).join(separator)}`;
}
