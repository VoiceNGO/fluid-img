import type { Tagged } from 'type-fest';
import { deleteArrayIndices } from '../../utils/delete-array-indicies/delete-array-indicies';
import { GrayscalePixelArray } from '../../utils/types/types';
import {
  registerEnergyMap,
  BoundaryAwareEnergyMapOptions,
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

function getRegionVariance(
  centerX: number,
  centerY: number,
  radius: number,
  width: number,
  data: Uint8ClampedArray
): number {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;

      if (x >= 0 && x < width && y >= 0 && y < Math.floor(data.length / (width * 4))) {
        const gray = getGrayscale(x, y, width, data);
        sum += gray;
        sumSquares += gray * gray;
        count++;
      }
    }
  }

  if (count < 2) return 0;

  const mean = sum / count;
  const variance = sumSquares / count - mean * mean;
  return Math.sqrt(variance); // Return standard deviation
}

type EnergyMapData = Tagged<Uint16Array, 'energyMapData'>;
type EnergyMapIndices = Tagged<Uint32Array, 'energyMapIndices'>;

const defaultOptions = {
  boundaryPenaltyWeight: 5.0,
  uniformityThreshold: 10.0,
  edgeThreshold: 20.0,
};

type BoundaryAwareInstanceOptions = Required<
  Omit<BoundaryAwareEnergyMapOptions, 'algorithm' | 'maskData'>
> & {
  maskData?: GrayscalePixelArray;
};

export class BoundaryAwareEnergyMap {
  #data: EnergyMapData[];
  #width: number;
  #height: number;
  #grayscaleMap: Uint8Array[];
  #originalIndices: EnergyMapIndices[];
  #imageData: ImageData;
  #options: BoundaryAwareInstanceOptions;

  constructor(options: BoundaryAwareEnergyMapOptions) {
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

  #computeGradientEnergy(x: number, y: number): number {
    // Sobel operator for gradient energy
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

    const leftX = x - 1;
    const rightX = x + 1;
    const horizontalCost = getColorDistance(leftX, y, rightX, y, this.#width, data);

    const topY = y - 1;
    const bottomY = y + 1;
    const verticalCost = getColorDistance(x, topY, x, bottomY, this.#width, data);

    return horizontalCost + verticalCost;
  }

  #detectBoundaryPenalty(x: number, y: number): number {
    const data = this.#imageData.data;

    // Check if this pixel is on a meaningful edge
    const gradientEnergy = this.#computeGradientEnergy(x, y);
    if (gradientEnergy < this.#options.edgeThreshold * 0.3) {
      return 0; // Very weak edge, no penalty
    }

    // Check regions to the left and right
    const leftVariance = getRegionVariance(x - 3, y, 2, this.#width, data);
    const rightVariance = getRegionVariance(x + 3, y, 2, this.#width, data);

    // Check regions above and below
    const topVariance = getRegionVariance(x, y - 3, 2, this.#width, data);
    const bottomVariance = getRegionVariance(x, y + 3, 2, this.#width, data);

    let boundaryStrength = 0;

    // Strategy 1: Perfect boundaries (one side very uniform - like building vs sky)
    const minVariance = Math.min(leftVariance, rightVariance, topVariance, bottomVariance);
    if (minVariance < this.#options.uniformityThreshold * 0.5) {
      // Only very uniform regions count as perfect boundaries
      const uniformityFactor = Math.max(
        0,
        (this.#options.uniformityThreshold * 0.5 - minVariance) /
          (this.#options.uniformityThreshold * 0.5)
      );
      boundaryStrength = Math.max(boundaryStrength, uniformityFactor * 0.3);
    }

    // Strategy 2: Texture difference boundaries (different variance on each side - like building vs trees)
    const horizontalDiff = Math.abs(leftVariance - rightVariance);
    const verticalDiff = Math.abs(topVariance - bottomVariance);
    const maxTextureDiff = Math.max(horizontalDiff, verticalDiff);

    if (
      maxTextureDiff > this.#options.uniformityThreshold * 4 &&
      gradientEnergy > this.#options.edgeThreshold
    ) {
      // Much higher threshold for texture differences, and require strong gradient
      const textureFactor = Math.min(1, maxTextureDiff / (this.#options.uniformityThreshold * 8));
      boundaryStrength = Math.max(boundaryStrength, textureFactor * 0.2);
    }

    // Strategy 3: Strong edges get protection regardless (catch-all for missed boundaries)
    if (gradientEnergy > this.#options.edgeThreshold * 2.5) {
      // Only very strong edges get this protection
      const strongEdgeFactor = Math.min(1, gradientEnergy / (this.#options.edgeThreshold * 4));
      boundaryStrength = Math.max(boundaryStrength, strongEdgeFactor * 0.15);
    }

    if (boundaryStrength > 0) {
      // Much smaller base penalty
      const edgeFactor = Math.min(1, gradientEnergy / (this.#options.edgeThreshold * 2));
      return boundaryStrength * edgeFactor * 200; // Reduced from 1000 to 200
    }

    return 0;
  }

  #computeFullEnergyMap(
    width: number = this.#width,
    height: number = this.#height
  ): EnergyMapData[] {
    const energyMapData = new Array(height);

    for (let y = 0; y < height; y++) {
      energyMapData[y] = new Uint16Array(width) as EnergyMapData;

      for (let x = 0; x < width; x++) {
        const gradientEnergy = this.#computeGradientEnergy(x, y);
        const forwardEnergy = this.#computeForwardEnergy(x, y);
        const boundaryPenalty = this.#detectBoundaryPenalty(x, y);

        const totalEnergy =
          gradientEnergy + forwardEnergy + this.#options.boundaryPenaltyWeight * boundaryPenalty;
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
        const gradientEnergy = this.#computeGradientEnergy(xCurrent, y);
        const forwardEnergy = this.#computeForwardEnergy(xCurrent, y);
        const boundaryPenalty = this.#detectBoundaryPenalty(xCurrent, y);

        const totalEnergy =
          gradientEnergy + forwardEnergy + this.#options.boundaryPenaltyWeight * boundaryPenalty;
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

if (typeof BOUNDARY_AWARE_ENERGY_MAP !== 'undefined' && BOUNDARY_AWARE_ENERGY_MAP) {
  registerEnergyMap('boundary-aware', BoundaryAwareEnergyMap);
}
