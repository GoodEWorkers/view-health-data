// The refs selected when a file opens: the blocks whose lines all lie in the main range, and the rows seen on the range's lines inside the other blocks.

import { isRowRef } from './types.ts';
import type { DecodedFile } from './types.ts';

export function initialRefs({ cards, lines }: Pick<DecodedFile, 'cards' | 'lines'>, [from, to]: readonly [number, number]): string[] {
  const inRange = (number: number): boolean => number >= from && number <= to;
  const covered = cards.filter(({ lines: numbers }) => numbers.length > 0 && numbers.every(inRange));
  const blockRefs = covered.map(({ ref }) => ref);
  const rowRefs = lines
    .filter(({ number }) => inRange(number))
    .flatMap(({ units }) => units.flatMap(({ ref }) => (ref !== null && isRowRef(ref) ? [ref] : [])))
    .filter((ref) => !covered.some(({ rows }) => rows.some((row) => row.ref === ref)));
  return [...blockRefs, ...rowRefs].filter((ref, position, all) => all.indexOf(ref) === position);
}
