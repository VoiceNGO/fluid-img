import { Matrix } from './matrix/matrix';

// prettier-ignore
export const gradientMagnitudeX = new Matrix(new Int8Array([
  -1, 0, 1,
  -2, 0, 2,
  -1, 0, 1,
]));

// prettier-ignore
export const gradientMagnitudeY = gradientMagnitudeX.rotate(90);
