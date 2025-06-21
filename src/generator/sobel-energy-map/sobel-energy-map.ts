// TODO: Test Sobel energy calculation using sqrt(Gx^2 + Gy^2) and adjust normalization for comparison.
// Current method uses abs(Gx) + abs(Gy).
import type { Tagged } from 'type-fest';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';
import { getGrayscaleImageData } from '../grayscale/grayscale';
import { GrayscalePixelArray } from '../../utils/types/types';

type EnergyMapData = Tagged<Uint16Array, 'energyMapData'>;
type EnergyMapIndices = Tagged<Uint32Array, 'energyMapIndices'>;

export class SobelEnergyMap {
  #data: EnergyMapData[];
  #width: number;
  #height: number;
  #grayscaleMap: Uint8Array[];
  #originalIndices: EnergyMapIndices[];
  #maskData: GrayscalePixelArray | undefined;

  constructor(imageData: ImageData, maskData?: GrayscalePixelArray) {
    this.#width = imageData.width;
    this.#height = imageData.height;
    this.#data = new Array(this.#height);
    this.#originalIndices = new Array(this.#height);
    this.#maskData = maskData;

    this.#grayscaleMap = getGrayscaleImageData(imageData, true);
    this.#fillOriginalIndices();
    this.#data = this.#computeFullEnergyMap();
  }

  #getMaskEnergy(y: number, x: number): number {
    if (!this.#maskData) {
      return 255;
    }
    const originalIndex = this.#originalIndices[y]![x]!;
    return this.#maskData[originalIndex]!;
  }

  #fillOriginalIndices(): void {
    for (let y = 0; y < this.#height; y++) {
      this.#originalIndices[y] = new Uint32Array(this.#width) as EnergyMapIndices;
      for (let x = 0; x < this.#width; x++) {
        this.#originalIndices[y]![x] = y * this.#width + x;
      }
    }
  }

  #computeFullEnergyMap(
    width: number = this.#width,
    height: number = this.#height
  ): EnergyMapData[] {
    const energyMapData: EnergyMapData[] = new Array(height);

    for (let y = 0; y < height; y++) {
      energyMapData[y] = new Uint16Array(width) as EnergyMapData;

      const y1 = Math.max(0, y - 1);
      const y3 = Math.min(height - 1, y + 1);
      const prevRow = this.#grayscaleMap[y1]!;
      const currentRow = this.#grayscaleMap[y]!;
      const nextRow = this.#grayscaleMap[y3]!;

      for (let x = 0; x < width; x++) {
        const x1 = Math.max(0, x - 1);
        const x3 = Math.min(width - 1, x + 1);

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

        const sobelEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
        const maskEnergy = this.#getMaskEnergy(y, x);
        energyMapData[y]![x] = sobelEnergy * (maskEnergy / 255);
      }
    }

    return energyMapData;
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

        const sobelEnergy = (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
        const maskEnergy = this.#getMaskEnergy(y, xCurrent);
        this.#data[y]![xCurrent] = sobelEnergy + maskEnergy;
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

    this.#data = this.#computeFullEnergyMap();
  }

  getEnergyMapAsImageData(width: number = this.#width, height: number = this.#height): ImageData {
    const energyMapData = this.#computeFullEnergyMap(width, height);

    // Find min and max energy values for normalization
    let minEnergy = Infinity;
    let maxEnergy = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const energy = energyMapData[y]![x]!;
        if (energy < minEnergy) minEnergy = energy;
        if (energy > maxEnergy) maxEnergy = energy;
      }
    }

    const energyRange = maxEnergy - minEnergy;
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const energy = energyMapData[y]![x]!;

        // Normalize energy to 0-255 range
        const normalizedEnergy =
          energyRange > 0 ? Math.round(((energy - minEnergy) / energyRange) * 255) : 0;

        // Set RGB channels to the same value for grayscale
        data[index] = normalizedEnergy; // R
        data[index + 1] = normalizedEnergy; // G
        data[index + 2] = normalizedEnergy; // B
        data[index + 3] = 255; // A (100% alpha)
      }
    }

    return imageData;
  }
}
