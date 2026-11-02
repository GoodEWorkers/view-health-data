// The text colour of a room: its colour darkened toward ink until it reads on paper, on the room tints and as the floor numeral (WCAG 2 contrast, doc/sources.md F63). Pure.

import { contrastRatio, fillOver, hexOf, INK, PAPER, rgbOfHex } from './network/cvd.ts';
import type { Rgb } from './network/cvd.ts';

export const MIN_TEXT_CONTRAST = 4.5;
export const MIN_NUMERAL_CONTRAST = 3;
// The strongest room tint any text sits on: title bars use 16 percent, editor rows 14.
export const TEXT_TINT = 0.2;
// The floor tint and the numeral opacity of a room at rest and lit: --floor-tint-rest plus --floor-tint-gain, --numeral-opacity-rest plus --numeral-opacity-gain, in HospitalFloor.astro.
export const NUMERAL_STATES: readonly { readonly tint: number; readonly opacity: number }[] = [
  { tint: 0.16, opacity: 0.6 },
  { tint: 0.42, opacity: 0.8 },
];

const CHANNEL_MAX = 255;
const INK_STEPS = 100;

// What `mix-blend-mode: multiply` at the given opacity leaves of a floor under a numeral.
export const numeralOver = (numeral: string, floor: string, opacity: number): string => {
  const [front, back] = [rgbOfHex(numeral), rgbOfHex(floor)];
  return hexOf(back.map((channel, index) => channel * (1 - opacity) + (opacity * channel * front[index]!) / CHANNEL_MAX) as unknown as Rgb);
};

const readsAsText = (text: string, room: string): boolean =>
  contrastRatio(text, PAPER) >= MIN_TEXT_CONTRAST && contrastRatio(text, fillOver(room, TEXT_TINT)) >= MIN_TEXT_CONTRAST;

const readsAsNumeral = (text: string, room: string): boolean =>
  NUMERAL_STATES.every(({ tint, opacity }) => {
    const floor = fillOver(room, tint);
    return contrastRatio(numeralOver(text, floor, opacity), floor) >= MIN_NUMERAL_CONTRAST;
  });

export function textColourOf(room: string): string {
  for (let step = 0; step <= INK_STEPS; step++) {
    const candidate = fillOver(INK, step / INK_STEPS, room);
    if (readsAsText(candidate, room) && readsAsNumeral(candidate, room)) return candidate;
  }
  return INK;
}
