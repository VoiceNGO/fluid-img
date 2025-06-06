import { deterministicBinaryRnd } from '../../utils/deterministic-binary-rnd/deterministic-binary-rnd';
import { EnergyMap2D } from '../energy-map/energy-map';
import { loadImage } from '../../utils/load-image/load-image';
import { SeamGenerator, SeamPixelPriorityGrid, URLString } from '../../utils/seam-spec/seam-spec';

const rnd = deterministicBinaryRnd(4695947);

export class RandomGenerator implements SeamGenerator {
  #energyMap: EnergyMap2D;
  #seamGrid: SeamPixelPriorityGrid;
  #generatedSeams = 0;
  #batchPercentage = 0.1;
  #width: number;

  constructor(imageData: ImageData) {
    this.#width = imageData.width;
    this.#energyMap = new EnergyMap2D(imageData);
    this.#seamGrid = new Uint16Array(imageData.width * imageData.height).fill(
      0
    ) as SeamPixelPriorityGrid;
  }

  setBatchPercentage(percentage: number): void {
    this.#batchPercentage = percentage;
  }

  #generateSeamBatch(): void {
    const currentWidth = this.#energyMap.width;
    const seams = new Array(currentWidth).map((_, ix) => this.#getSeam(ix));
    seams.sort((a, b) => a.energy - b.energy);
    const batchSize = Math.floor(currentWidth * this.#batchPercentage);
    const batchSeams = seams.slice(0, batchSize);
    this.#energyMap.removeSeams(batchSeams.map((seam) => seam.seam));
    let seamIndex = this.#generatedSeams;
    for (let i = 0; i < batchSeams.length; i++) {
      const seam = batchSeams[i]!;
      seam.seam.forEach((ix) => {
        this.#seamGrid[seamIndex] = ix;
        seamIndex++;
      });
    }
    this.#generatedSeams += batchSeams.length;
  }

  #getSeam(ix: number): { seam: Uint16Array; energy: number } {
    const width = this.#energyMap.width;
    const height = this.#energyMap.height;
    const seam = new Uint16Array(height);
    const energyMap = this.#energyMap.energyMap;
    let energy = 0;
    let lastX = ix;
    for (let y = 0; y < height; y++) {
      const swap = rnd(y * width + lastX) ? 1 : -1;
      if (swap) {
        seam[y] = lastX = ix % 2 ? ix - 1 : ix + 1;
      } else {
        seam[y] = lastX = ix;
      }
      energy += energyMap[y]![lastX]!;
    }
    return { seam, energy };
  }

  async generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid> {
    if (this.#width < minSeams) {
      throw new Error(`Cannot generate ${minSeams} seams for image with width ${this.#width}`);
    }
    while (this.#generatedSeams < minSeams) {
      this.#generateSeamBatch();
    }
    return this.#seamGrid;
  }
}

export async function createRandomGenerator(imageSrc: URLString): Promise<RandomGenerator> {
  const image = await loadImage(imageSrc);
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  return new RandomGenerator(imageData);
}
