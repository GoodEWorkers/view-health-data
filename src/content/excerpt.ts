// The excerpt a window shows: the lines of one named range of a file, soft-wrapped to the window's columns, with the neighbouring lines that fit and IDE-style fold markers for the lines left out. A range too tall for the window shows its first rows.

import { wrapDisplay } from './editorLines.ts';
import type { EditorFile } from './messages/index.ts';
import { tokenize } from './syntax.ts';
import type { Token } from './syntax.ts';

export const EXCERPT_COLUMNS = 23;
export const EXCERPT_ROWS = 7;

export type CodeLine = { readonly kind: 'code'; readonly number: number | null; readonly text: string; readonly tokens: readonly Token[]; readonly inRange: boolean };
export type FoldLine = { readonly kind: 'fold'; readonly text: string; readonly hidden: number };
export type ExcerptLine = CodeLine | FoldLine;
export type Excerpt = { readonly key: string; readonly label: string; readonly lines: readonly ExcerptLine[] };
export type ExcerptSize = { readonly columns?: number; readonly rows?: number };

const FOLD_MARK = '⋯';

export function foldText(hidden: number, format: EditorFile['format']): string {
  const plural = hidden > 1;
  const unit = format === 'hl7' ? `segment${plural ? 's' : ''} ${plural ? 'repliés' : 'replié'}` : `ligne${plural ? 's' : ''} ${plural ? 'repliées' : 'repliée'}`;
  return `${FOLD_MARK} ${hidden} ${unit}`;
}

const indentOf = (line: string): number => /^ */.exec(line)![0].length;

function dedented(file: EditorFile, [from, to]: readonly [number, number]): string[] {
  const lines = file.text.split('\n');
  const cut = Math.min(...lines.slice(from - 1, to).map(indentOf));
  return lines.map((line) => line.slice(Math.min(cut, indentOf(line))));
}

export function excerptOf(file: EditorFile, focusKey: string, { columns = EXCERPT_COLUMNS, rows = EXCERPT_ROWS }: ExcerptSize = {}): Excerpt {
  const range = file.ranges.find(({ key }) => key === focusKey) ?? file.ranges.find(({ key }) => key === file.mainRange) ?? file.ranges[0]!;
  const wrapped = dedented(file, range.lines).map((line) => wrapDisplay(file.format, line, columns));
  const count = wrapped.length;
  const rowsOf = (from: number, to: number): number => wrapped.slice(from - 1, to).reduce((total, chunks) => total + chunks.length, 0);
  const foldRows = (from: number, to: number): number => (from > 1 ? 1 : 0) + (to < count ? 1 : 0);
  const fits = (from: number, to: number): boolean => rowsOf(from, to) + foldRows(from, to) <= rows;

  let [first, last] = range.lines;
  while (last > first && !fits(first, last)) last--;
  const clipped = !fits(first, last);
  const visibleRows = clipped ? rows - (first > 1 ? 1 : 0) - 1 : Infinity;
  while (!clipped) {
    if (last < count && fits(first, last + 1)) last++;
    else if (first > 1 && fits(first - 1, last)) first--;
    else break;
  }

  const lines: ExcerptLine[] = [];
  if (first > 1) lines.push({ kind: 'fold', text: foldText(first - 1, file.format), hidden: first - 1 });
  for (let number = first; number <= last; number++) {
    const chunks = wrapped[number - 1]!.slice(0, number === first ? visibleRows : undefined);
    chunks.forEach((text, position) =>
      lines.push({ kind: 'code', number: position === 0 ? number : null, text, tokens: tokenize(file.format, text, position > 0), inRange: number >= range.lines[0] && number <= range.lines[1] }),
    );
  }
  const hiddenBelow = count - last + (clipped ? 1 : 0);
  if (hiddenBelow > 0) lines.push({ kind: 'fold', text: foldText(hiddenBelow, file.format), hidden: hiddenBelow });
  return { key: range.key, label: range.label, lines };
}
