// TODO: Test Sobel energy calculation using sqrt(Gx^2 + Gy^2) and adjust normalization for comparison.
// Current method uses abs(Gx) + abs(Gy).
import type { Tagged } from 'type-fest';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';

function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

function getGrayscale(x: number, y: number, width: number, data: Uint8ClampedArray): number {
  if (x < 0 || x >= width || y < 0 || y >= Math.floor(data.length / (width * 4))) {
    return 0;
  }
  const i = getPixelIndex(x, y, width);

  return 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
}

type EnergyMapData = Tagged<Uint8Array, 'energyMapData'>;
type EnergyMapIndices = Tagged<Uint32Array, 'energyMapIndices'>;

export class EnergyMap2D {
  #data: EnergyMapData[];
  #width: number;
  #height: number;
  #grayscaleMap: Uint8Array[];
  #originalIndices: EnergyMapIndices[];

  constructor(imageData: ImageData) {
    this.#width = imageData.width;
    this.#height = imageData.height;
    this.#data = new Array(this.#height);
    this.#grayscaleMap = new Array(this.#height);
    this.#originalIndices = new Array(this.#height);

    this.#fillOriginalIndices();
    this.#computeGrayscaleMap(imageData);
    this.#computeFullEnergyMap();
  }

  #fillOriginalIndices(): void {
    for (let y = 0; y < this.#height; y++) {
      this.#originalIndices[y] = new Uint32Array(this.#width) as EnergyMapIndices;
      for (let x = 0; x < this.#width; x++) {
        this.#originalIndices[y]![x] = y * this.#width + x;
      }
    }
  }

  #computeGrayscaleMap(imageData: ImageData): void {
    for (let y = 0; y < this.#height; y++) {
      this.#grayscaleMap[y] = new Uint8Array(this.#width);
      for (let x = 0; x < this.#width; x++) {
        this.#grayscaleMap[y]![x] = getGrayscale(x, y, this.#width, imageData.data);
      }
    }
  }

  #computeFullEnergyMap(): void {
    this.#data = new Array(this.#height);

    for (let y = 0; y < this.#height; y++) {
      this.#data[y] = new Uint8Array(this.#width) as EnergyMapData;

      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(this.#height - 1, y + 1);
      const prevRow = this.#grayscaleMap[y1]!;
      const currentRow = this.#grayscaleMap[y]!;
      const nextRow = this.#grayscaleMap[y3]!;

      for (let x = 0; x < this.#width; x++) {
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(this.#width - 1, x + 1);

        const gx =
          -prevRow[x1]! +
          prevRow[x3]! +
          -currentRow[x1]! * 2 +
          currentRow[x3]! * 2 +
          -nextRow[x1]! +
          nextRow[x3]!;

        const gy =
          -prevRow[x1]! +
          -prevRow[x]! * 2 +
          -prevRow[x3]! +
          nextRow[x1]! +
          nextRow[x]! * 2 +
          nextRow[x3]!;

        const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
        this.#data[y]![x] = totalEnergy >> 3;
      }
    }
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get energyMap(): readonly EnergyMapData[] {
    return this.#data;
  }

  get originalIndices(): readonly EnergyMapIndices[] {
    return this.#originalIndices;
  }

  removeSeam(xIndices: Uint16Array): void {
    for (let y = 0; y < this.#height; y++) {
      const xToRemove = xIndices[y]!;
      this.#data[y] = deleteArrayIndices(this.#data[y]!, [xToRemove]);
      this.#originalIndices[y] = deleteArrayIndices(this.#originalIndices[y]!, [xToRemove]);
    }
    this.#width--;

    const g = (colInNewCoord: number, removedOriginalIndex: number) =>
      colInNewCoord < removedOriginalIndex ? colInNewCoord : colInNewCoord + 1;

    for (let y = 0; y < this.#height; y++) {
      const removedColOrigIdx = xIndices[y]!;

      // Cache row references with clamping
      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(this.#height - 1, y + 1);
      const prevRow = this.#grayscaleMap[y1]!;
      const currentRow = this.#grayscaleMap[y]!;
      const nextRow = this.#grayscaleMap[y3]!;

      const columnsInNewDataToUpdate: number[] = [];
      if (removedColOrigIdx > 0) {
        columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
      }
      if (removedColOrigIdx < this.#width) {
        columnsInNewDataToUpdate.push(removedColOrigIdx);
      }

      for (const xCurrent of columnsInNewDataToUpdate) {
        const x1 = Math.max(0, g(xCurrent - 1, removedColOrigIdx));
        const x3 = Math.min(this.#grayscaleMap[0]!.length - 1, g(xCurrent + 1, removedColOrigIdx));
        const xCenter = g(xCurrent, removedColOrigIdx);

        const gx =
          -prevRow[x1]! +
          prevRow[x3]! +
          -currentRow[x1]! * 2 +
          currentRow[x3]! * 2 +
          -nextRow[x1]! +
          nextRow[x3]!;

        const gy =
          -prevRow[x1]! +
          -prevRow[xCenter]! * 2 +
          -prevRow[x3]! +
          nextRow[x1]! +
          nextRow[xCenter]! * 2 +
          nextRow[x3]!;

        const totalEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
        this.#data[y]![xCurrent] = totalEnergy >> 3;
      }
    }
  }

  removeSeams(seams: Uint16Array[]): void {
    if (seams.length === 0) {
      return;
    }

    const numSeamsToRemove = seams.length;

    for (let y = 0; y < this.#height; y++) {
      const indicesToRemoveForRow: number[] = seams
        .map((seamPath) => seamPath[y]!)
        .sort((a, b) => a - b);

      this.#data[y] = deleteArrayIndices(this.#data[y]!, indicesToRemoveForRow);
      this.#grayscaleMap[y] = deleteArrayIndices(this.#grayscaleMap[y]!, indicesToRemoveForRow);
      this.#originalIndices[y] = deleteArrayIndices(
        this.#originalIndices[y]!,
        indicesToRemoveForRow
      );
    }

    this.#width -= numSeamsToRemove;

    this.#computeFullEnergyMap();
  }
}
