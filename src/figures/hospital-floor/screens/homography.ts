// The projective map from a CSS box onto any quad, as one matrix3d: Heckbert's unit-square-to-quad solution scaled to the box. A quad lists top-left, top-right, bottom-right, bottom-left.

export type Corner = readonly [number, number];
export type Quad = readonly [Corner, Corner, Corner, Corner];

export type Homography = readonly [number, number, number, number, number, number, number, number];

const PARALLELOGRAM_EPSILON = 1e-9;
const MATRIX_DIGITS = 12;

export function homographyOfQuad([first, second, third, fourth]: Quad): Homography {
  const [x0, y0] = first;
  const [x1, y1] = second;
  const [x2, y2] = third;
  const [x3, y3] = fourth;
  const shearX = x0 - x1 + x2 - x3;
  const shearY = y0 - y1 + y2 - y3;
  if (Math.abs(shearX) < PARALLELOGRAM_EPSILON && Math.abs(shearY) < PARALLELOGRAM_EPSILON) {
    return [x1 - x0, x3 - x0, x0, y1 - y0, y3 - y0, y0, 0, 0];
  }
  const spanX1 = x1 - x2;
  const spanX2 = x3 - x2;
  const spanY1 = y1 - y2;
  const spanY2 = y3 - y2;
  const determinant = spanX1 * spanY2 - spanX2 * spanY1;
  if (Math.abs(determinant) < PARALLELOGRAM_EPSILON) throw new Error('a quad with three collinear corners has no homography');
  const perspectiveX = (shearX * spanY2 - spanX2 * shearY) / determinant;
  const perspectiveY = (spanX1 * shearY - shearX * spanY1) / determinant;
  return [
    x1 - x0 + perspectiveX * x1,
    x3 - x0 + perspectiveY * x3,
    x0,
    y1 - y0 + perspectiveX * y1,
    y3 - y0 + perspectiveY * y3,
    y0,
    perspectiveX,
    perspectiveY,
  ];
}

const entry = (value: number): string => String(Number(value.toPrecision(MATRIX_DIGITS)));

export function matrix3dOf(width: number, height: number, quad: Quad): string {
  const [a, b, c, d, e, f, g, h] = homographyOfQuad(quad);
  const columns = [a / width, d / width, 0, g / width, b / height, e / height, 0, h / height, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${columns.map(entry).join(',')})`;
}
