import { GrayscalePixelArray } from '../../utils/types/types';

export function getGrayscaleImageData<AsRows extends boolean>(
  imageData: ImageData,
  asRows: AsRows,
  useLinearApproximation = false
): AsRows extends true ? Uint8Array[] : GrayscalePixelArray {
  const { data, width, height } = imageData;
  const grayscaleData = asRows ? new Array(height) : new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const currentArray = asRows ? (grayscaleData[y] = new Uint8Array(width)) : grayscaleData;

    for (let x = 0; x < width; x++) {
      const ix = (rowOffset + x) * 4;
      const r = data[ix];
      const g = data[ix + 1];
      const b = data[ix + 2];
      const a = data[ix + 3];

      let gray;
      if (useLinearApproximation) {
        gray = (((r! + g! + b!) / 3) * a!) / 255;
      } else {
        gray = ((0.299 * r! + 0.587 * g! + 0.114 * b!) * a!) / 255;
      }

      currentArray[asRows ? x : rowOffset + x] = gray;
    }
  }

  return grayscaleData as any;
}
