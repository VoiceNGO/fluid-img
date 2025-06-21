import { deterministicBinaryRnd } from '../../utils/deterministic-binary-rnd/deterministic-binary-rnd';
import { EnergyMap } from '../energy-map/energy-map';
import { BaseGenerator, BaseGeneratorOptions } from '../base-generator/base-generator';

/**
 * The general idea here is to create random, but deterministic seams for the entire image.  They
 * need to be deterministic so that we can ensure 100% image coverage, and that no 2 seams travel
 * through the same pixel.  Then we sort them by energy, and remove a batch of the lowest energy
 * seams.  We then restart the process from scratch until we have the desired number of seams.
 *
 * The random seams are created by a deterministic random number generator basically deciding if
 * every pair of pixels should continue straight down, or if they should be swapped with one
 * another.  Repeat for the entire image and voila, we have random deterministic seams.
 *
 * So the entire algorithm is O(n) where n is the number of pixels in the image.
 */

export type RandomGeneratorOptions = BaseGeneratorOptions & {
  batchPercentage?: number;
  minBatchSize?: number;
};

const defaultOptions: Required<PickOptional<RandomGeneratorOptions>> = {
  batchPercentage: 0.05,
  minBatchSize: 10,
};

export class RandomGenerator extends BaseGenerator {
  protected connections: Int8Array[] = [];
  protected options: Required<RandomGeneratorOptions>;

  constructor(options: RandomGeneratorOptions) {
    super(options);
    this.options = { ...defaultOptions, ...options };
  }

  setBatchPercentage(percentage: number): void {
    this.options.batchPercentage = percentage;
  }

  async generateSeamBatch(): Promise<void> {
    const energyMap = await this.energyMapPromise;
    const originalIndices = energyMap.originalIndices;
    const currentWidth = energyMap.width;
    const currentHeight = energyMap.height;
    this.generateConnections(currentWidth, currentHeight);
    const seams = Array.from({ length: currentWidth }, (_, ix) => this.getSeam(energyMap, ix));
    seams.sort((a, b) => a.energy - b.energy);

    const batchSize = Math.max(
      // the '>> 1 << 1' ensures that the batch size is even.
      (Math.ceil(currentWidth * this.options.batchPercentage) >> 1) << 1,
      Math.min(this.options.minBatchSize, currentWidth)
    );
    const batchSeams = seams.slice(0, batchSize);

    let seamIndex = this.generatedSeams;
    for (let i = 0; i < batchSeams.length; i++) {
      const seam = batchSeams[i]!;
      seam.seam.forEach((x, y) => {
        const originalIndex = originalIndices[y]![x]!;
        if (this.seamGrid[originalIndex] !== 65535) {
          throw new Error('Seam overlap detected');
        }
        this.seamGrid[originalIndex] = seamIndex;
      });
      seamIndex++;
    }

    energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
    this.generatedSeams += batchSeams.length;
  }

  protected generateConnections(width: number, height: number): void {
    const rndGenerator = deterministicBinaryRnd(width * height + 1);

    this.connections = Array.from({ length: height }, () => new Int8Array(width));
    const lastColIx = width - 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === lastColIx || rndGenerator(y * width + x)) {
          this.connections[y]![x] = 0;
        } else {
          this.connections[y]![x] = 1;
          this.connections[y]![x + 1] = -1;
          x++;
        }
      }
    }
  }

  protected getSeam(energyMap: EnergyMap, ix: number): { seam: Uint16Array; energy: number } {
    const height = energyMap.height;
    const seam = new Uint16Array(height);
    const energyMapData = energyMap.energyMap;
    let energy = 0;
    let lastX = ix;

    for (let y = 0; y < height; y++) {
      seam[y] = lastX = lastX + this.connections[y]![lastX]!;
      energy += energyMapData[y]![lastX]!;
    }

    return { seam, energy };
  }
}
