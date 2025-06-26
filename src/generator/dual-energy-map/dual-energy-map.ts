import type { Tagged } from 'type-fest';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';
import { GrayscalePixelArray } from '../../utils/types/types';
import {
  registerEnergyMap,
  DualEnergyMapOptions,
} from '../energy-map-registry/energy-map-registry';

function getPixelIndex(x: number, y: number, width: number): number {
  return (y * width + x) * 4;
}

function getGrayscale(x: number, y: number, width: number, data: Uint8ClampedArray): number {
  if (x < 0 || x >= width || y < 0 || y >= Math.floor(data.length / (width * 4))) {
    return 0;
  }
  const i = getPixelIndex(x, y, width);

  return 0.299 * data[i]! + 0.587 * data[i + 1]! + (0.114 * data[i + 2]! * data[i + 3]!) / 255;
}

function getColorDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  data: Uint8ClampedArray
): number {
  if (
    x1 < 0 ||
    x1 >= width ||
    y1 < 0 ||
    y1 >= Math.floor(data.length / (width * 4)) ||
    x2 < 0 ||
    x2 >= width ||
    y2 < 0 ||
    y2 >= Math.floor(data.length / (width * 4))
  ) {
    return 0;
  }

  const i1 = getPixelIndex(x1, y1, width);
  const i2 = getPixelIndex(x2, y2, width);

  const dr = data[i1]! - data[i2]!;
  const dg = data[i1 + 1]! - data[i2 + 1]!;
  const db = data[i1 + 2]! - data[i2 + 2]!;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

type EnergyMapData = Tagged<Uint16Array, 'energyMapData'>;
type EnergyMapIndices = Tagged<Uint32Array, 'energyMapIndices'>;

const defaultOptions = {
  forwardEnergyWeight: 1.0,
};

type DualInstanceOptions = Required<Omit<DualEnergyMapOptions, 'algorithm' | 'maskData'>> & {
  maskData?: GrayscalePixelArray;
};

export class DualEnergyMap {
  #data: EnergyMapData[];
  #width: number;
  #height: number;
  #grayscaleMap: Uint8Array[];
  #originalIndices: EnergyMapIndices[];
  #imageData: ImageData;
  #options: DualInstanceOptions;

  constructor(options: DualEnergyMapOptions) {
    this.#options = { ...defaultOptions, ...options };
    this.#width = options.imageData.width;
    this.#height = options.imageData.height;
    this.#imageData = options.imageData;
    this.#data = new Array(this.#height);
    this.#grayscaleMap = new Array(this.#height);
    this.#originalIndices = new Array(this.#height);

    this.#fillOriginalIndices();
    this.#computeGrayscaleMap(options.imageData);
    this.#data = this.#computeFullEnergyMap();
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

  #computeBackwardEnergy(x: number, y: number): number {
    // Sobel operator for backward energy (gradient at current pixel)
    const y1 = Math.max(0, y - 1);
    const y3 = Math.min(this.#height - 1, y + 1);
    const x1 = Math.max(0, x - 1);
    const x3 = Math.min(this.#width - 1, x + 1);

    const prevRow = this.#grayscaleMap[y1]!;
    const currentRow = this.#grayscaleMap[y]!;
    const nextRow = this.#grayscaleMap[y3]!;

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

    return (gx < 0 ? -gx : gx) + (gy < 0 ? -gy : gy);
  }

  #computeForwardEnergy(x: number, y: number): number {
    // Forward energy: cost of connecting neighbors when this pixel is removed
    const data = this.#imageData.data;

    // Cost of connecting left and right neighbors
    const leftX = x - 1;
    const rightX = x + 1;
    const horizontalCost = getColorDistance(leftX, y, rightX, y, this.#width, data);

    // Cost of connecting top and bottom neighbors
    const topY = y - 1;
    const bottomY = y + 1;
    const verticalCost = getColorDistance(x, topY, x, bottomY, this.#width, data);

    // Additional costs for diagonal connections that may be created
    let diagonalCost = 0;
    if (leftX >= 0 && topY >= 0) {
      diagonalCost += getColorDistance(leftX, topY, rightX, y, this.#width, data);
    }
    if (rightX < this.#width && bottomY < this.#height) {
      diagonalCost += getColorDistance(rightX, bottomY, leftX, y, this.#width, data);
    }

    return horizontalCost + verticalCost + diagonalCost * 0.5;
  }

  #computeFullEnergyMap(
    width: number = this.#width,
    height: number = this.#height
  ): EnergyMapData[] {
    const energyMapData = new Array(height);

    for (let y = 0; y < height; y++) {
      energyMapData[y] = new Uint16Array(width) as EnergyMapData;

      for (let x = 0; x < width; x++) {
        const backwardEnergy = this.#computeBackwardEnergy(x, y);
        const forwardEnergy = this.#computeForwardEnergy(x, y);

        const totalEnergy = backwardEnergy + this.#options.forwardEnergyWeight * forwardEnergy;
        energyMapData[y]![x] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
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

    // Update image data for forward energy calculations
    const newImageData = new ImageData(this.#width, this.#height);
    let writeIndex = 0;

    for (let y = 0; y < this.#height; y++) {
      const seamX = xIndices[y]!;
      for (let x = 0; x < this.#width + 1; x++) {
        if (x !== seamX) {
          const readIndex = (y * (this.#width + 1) + x) * 4;
          newImageData.data[writeIndex] = this.#imageData.data[readIndex]!;
          newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1]!;
          newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2]!;
          newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3]!;
          writeIndex += 4;
        }
      }
    }

    this.#imageData = newImageData;

    // Recompute affected energy values around the removed seam
    const g = (colInNewCoord: number, removedOriginalIndex: number) =>
      colInNewCoord < removedOriginalIndex ? colInNewCoord : colInNewCoord + 1;

    for (let y = 0; y < this.#height; y++) {
      const removedColOrigIdx = xIndices[y]!;

      const columnsInNewDataToUpdate: number[] = [];
      if (removedColOrigIdx > 0) {
        columnsInNewDataToUpdate.push(removedColOrigIdx - 1);
      }
      if (removedColOrigIdx < this.#width) {
        columnsInNewDataToUpdate.push(removedColOrigIdx);
      }

      for (const xCurrent of columnsInNewDataToUpdate) {
        const backwardEnergy = this.#computeBackwardEnergy(xCurrent, y);
        const forwardEnergy = this.#computeForwardEnergy(xCurrent, y);
        const totalEnergy = backwardEnergy + this.#options.forwardEnergyWeight * forwardEnergy;
        this.#data[y]![xCurrent] = Math.min(65535, Math.max(0, Math.round(totalEnergy)));
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

    // Update image data by removing multiple seams
    const newImageData = new ImageData(this.#width, this.#height);
    let writeIndex = 0;

    for (let y = 0; y < this.#height; y++) {
      const indicesToRemove = seams.map((seamPath) => seamPath[y]!).sort((a, b) => a - b);
      let removeIndex = 0;

      for (let x = 0; x < this.#width + numSeamsToRemove; x++) {
        if (removeIndex < indicesToRemove.length && x === indicesToRemove[removeIndex]) {
          removeIndex++;
          continue;
        }

        const readIndex = (y * (this.#width + numSeamsToRemove) + x) * 4;
        newImageData.data[writeIndex] = this.#imageData.data[readIndex]!;
        newImageData.data[writeIndex + 1] = this.#imageData.data[readIndex + 1]!;
        newImageData.data[writeIndex + 2] = this.#imageData.data[readIndex + 2]!;
        newImageData.data[writeIndex + 3] = this.#imageData.data[readIndex + 3]!;
        writeIndex += 4;
      }
    }

    this.#imageData = newImageData;
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

if (typeof DUAL_ENERGY_MAP !== 'undefined' && DUAL_ENERGY_MAP) {
  registerEnergyMap('dual', DualEnergyMap);
}
