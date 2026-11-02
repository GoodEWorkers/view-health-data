// Colour-vision checks: an sRGB colour as a deuteranope, protanope or tritanope sees it (Machado et al. 2009, severity 1.0, on linear RGB) and the distance of two colours in CIE Lab (ΔE76). Pure.

export type Vision = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type Rgb = readonly [number, number, number];

type Matrix = readonly [Rgb, Rgb, Rgb];

export const VISIONS: readonly Vision[] = ['normal', 'deuteranopia', 'protanopia', 'tritanopia'];

const IDENTITY: Matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const MATRICES: Readonly<Record<Vision, Matrix>> = {
  normal: IDENTITY,
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

const HEX_CHANNELS = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const CHANNEL_MAX = 255;
const LINEAR_KNEE = 0.04045;
const LINEAR_SLOPE = 12.92;
const GAMMA = 2.4;
const GAMMA_OFFSET = 0.055;
// D65 white point and the sRGB to XYZ matrix, rows X, Y and Z.
const WHITE: Rgb = [0.95047, 1, 1.08883];
const XYZ: Matrix = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];
const LAB_KNEE = 0.008856;
const LAB_SLOPE = 7.787;
const LAB_OFFSET = 16 / 116;

export const rgbOfHex = (hex: string): Rgb => {
  const found = HEX_CHANNELS.exec(hex);
  if (found === null) throw new Error(`Not a hex colour: ${hex}`);
  return [parseInt(found[1]!, 16), parseInt(found[2]!, 16), parseInt(found[3]!, 16)];
};

const toLinear = (channel: number): number => {
  const unit = channel / CHANNEL_MAX;
  return unit <= LINEAR_KNEE ? unit / LINEAR_SLOPE : ((unit + GAMMA_OFFSET) / (1 + GAMMA_OFFSET)) ** GAMMA;
};

const fromLinear = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value));
  const unit = clamped <= LINEAR_KNEE / LINEAR_SLOPE ? clamped * LINEAR_SLOPE : (1 + GAMMA_OFFSET) * clamped ** (1 / GAMMA) - GAMMA_OFFSET;
  return unit * CHANNEL_MAX;
};

const multiply = (matrix: Matrix, [first, second, third]: Rgb): Rgb =>
  matrix.map(([a, b, c]) => a * first + b * second + c * third) as unknown as Rgb;

export const simulate = (hex: string, vision: Vision): Rgb => {
  const linear = rgbOfHex(hex).map(toLinear) as unknown as Rgb;
  return multiply(MATRICES[vision], linear).map(fromLinear) as unknown as Rgb;
};

const labPart = (ratio: number): number => (ratio > LAB_KNEE ? Math.cbrt(ratio) : LAB_SLOPE * ratio + LAB_OFFSET);

export function labOf(rgb: Rgb): Rgb {
  const [x, y, z] = multiply(XYZ, rgb.map(toLinear) as unknown as Rgb).map((part, index) => labPart(part / WHITE[index]!));
  return [116 * y! - 16, 500 * (x! - y!), 200 * (y! - z!)];
}

export const deltaE76 = (first: Rgb, second: Rgb): number => Math.hypot(...labOf(first).map((part, index) => part - labOf(second)[index]!));

export const PAPER = '#fbfbfa';

const hexOf = (rgb: Rgb): string => `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

// The fill a colour makes when it takes the given share of a paper background, as the floor tints do.
export const fillOver = (colour: string, share: number, paper: string = PAPER): string => {
  const [front, back] = [rgbOfHex(colour), rgbOfHex(paper)];
  return hexOf(front.map((channel, index) => channel * share + back[index]! * (1 - share)) as unknown as Rgb);
};

export const lightnessOf = (hex: string): number => labOf(rgbOfHex(hex))[0];

export const colourDistance = (first: string, second: string, vision: Vision): number => deltaE76(simulate(first, vision), simulate(second, vision));

// The smallest distance between any two of the colours, over all four visions, with the pair that is nearest.
export function leastDistance(colours: readonly string[]): { readonly distance: number; readonly pair: readonly [string, string]; readonly vision: Vision } {
  let least = { distance: Infinity, pair: ['', ''] as readonly [string, string], vision: 'normal' as Vision };
  colours.forEach((first, index) =>
    colours.slice(index + 1).forEach((second) =>
      VISIONS.forEach((vision) => {
        const distance = colourDistance(first, second, vision);
        if (distance < least.distance) least = { distance, pair: [first, second], vision };
      }),
    ),
  );
  return least;
}
