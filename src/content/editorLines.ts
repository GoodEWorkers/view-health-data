// The lines the editor shows: the file's lines as written, except that an HL7 segment too long for the window is broken before a field separator and its continuation lines are indented and carry no line number, as a soft-wrapping editor does.

import { tokenize } from './syntax.ts';
import type { EditorFormat, Token } from './syntax.ts';

export const MAX_COLUMNS = 56;
export const MAX_LINES = 16;
const CONTINUATION_INDENT = '  ';

export type EditorLine = { readonly number: number | null; readonly text: string; readonly tokens: readonly Token[] };

const SEPARATORS_AFTER_FIELD = ['~', '^', '&'];
const FIELD_BREAK_SHARE = 0.6;
const CONTINUATION_INDENT_CAP = 6;
const SPACE_BREAK_BEFORE: Readonly<Record<EditorFormat, string>> = { hl7: '', xml: ' <', json: ' ', dicom: '[#' };
const BREAK_AFTER: Readonly<Record<EditorFormat, string>> = { hl7: '', xml: '.', json: '.', dicom: '' };

const breakPoint = (rest: string, room: number): number => {
  const field = rest.lastIndexOf('|', room);
  if (field > room * FIELD_BREAK_SHARE) return field;
  const afterSpace = rest.lastIndexOf(' ', room - 1) + 1;
  const inside = Math.max(field, afterSpace, ...SEPARATORS_AFTER_FIELD.map((separator) => rest.lastIndexOf(separator, room)));
  return inside > 0 ? inside : room;
};

export function wrapSegment(line: string, width = MAX_COLUMNS): string[] {
  const chunks: string[] = [];
  let rest = line;
  for (let room = width; rest.length > room; room = width - CONTINUATION_INDENT.length) {
    const at = breakPoint(rest, room);
    chunks.push(rest.slice(0, at));
    rest = rest.slice(at);
  }
  return [...chunks, rest];
}

function wrapAtSpaces(format: EditorFormat, line: string, width: number): string[] {
  const indent = /^ */.exec(line)![0].length;
  const continuation = ' '.repeat(Math.min(indent + CONTINUATION_INDENT.length, CONTINUATION_INDENT_CAP));
  const lines: string[] = [];
  let rest = line;
  while (rest.length > width) {
    const floor = /^ */.exec(rest)![0].length;
    const candidates = Array.from({ length: width - floor }, (_, offset) => floor + 1 + offset).filter((at) => SPACE_BREAK_BEFORE[format].includes(rest[at]!) || (BREAK_AFTER[format] !== '' && BREAK_AFTER[format].includes(rest[at - 1]!)));
    const cut = candidates.length > 0 ? Math.max(...candidates) : width;
    lines.push(rest.slice(0, cut).trimEnd());
    rest = continuation + rest.slice(cut).trimStart();
  }
  return [...lines, rest];
}

export function wrapDisplay(format: EditorFormat, line: string, width: number): string[] {
  if (format !== 'hl7') return wrapAtSpaces(format, line, width);
  return wrapSegment(line, width).map((chunk, position) => (position === 0 ? chunk : `${CONTINUATION_INDENT}${chunk}`));
}

export function editorLines({ format, text }: { readonly format: EditorFormat; readonly text: string }): EditorLine[] {
  return text.split('\n').flatMap((source, index) => {
    const chunks = format === 'hl7' ? wrapSegment(source) : [source];
    return chunks.map((chunk, position): EditorLine => {
      const shown = position === 0 ? chunk : `${CONTINUATION_INDENT}${chunk}`;
      return { number: position === 0 ? index + 1 : null, text: shown, tokens: tokenize(format, shown, position > 0) };
    });
  });
}
