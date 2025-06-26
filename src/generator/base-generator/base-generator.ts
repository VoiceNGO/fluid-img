import { EnergyMap } from '../energy-map/energy-map';
import { ImageLoader } from '../../utils/image-loader/image-loader';
import { GrayscalePixelArray, SeamGenerator, SeamPixelPriorityGrid } from '../../utils/types/types';
import { getGrayscaleImageData } from '../grayscale/grayscale';

export type BaseGeneratorOptions = {
  imageLoader: ImageLoader;
  maskLoader?: ImageLoader;
};

export abstract class BaseGenerator implements SeamGenerator {
  protected imageLoader: ImageLoader;
  protected maskLoader?: ImageLoader;
  protected energyMapPromise: Promise<EnergyMap>;
  protected seamGrid: SeamPixelPriorityGrid = new Uint16Array() as SeamPixelPriorityGrid;
  protected generatedSeams = 0;

  constructor(options: BaseGeneratorOptions) {
    this.imageLoader = options.imageLoader;
    this.maskLoader = options.maskLoader;
    this.energyMapPromise = this.createEnergyMap();
  }

  async getImageData(): Promise<ImageData> {
    return this.imageLoader.imageData;
  }

  async getImage(): Promise<HTMLImageElement> {
    return this.imageLoader.image;
  }

  protected async createEnergyMap(): Promise<EnergyMap> {
    const imageData = await this.imageLoader.imageData;
    const maskData = await this.getMaskData();

    this.seamGrid = new Uint16Array(imageData.width * imageData.height).fill(
      65535
    ) as SeamPixelPriorityGrid;

    return new EnergyMap({ imageData, maskData });
  }

  abstract generateSeamBatch(): Promise<void>;

  protected async getMaskData(): Promise<GrayscalePixelArray | undefined> {
    if (!this.maskLoader) return undefined;

    const maskData = await this.maskLoader.imageData;
    return getGrayscaleImageData(maskData, false);
  }

  async generateSeamGrid(minSeams: number): Promise<SeamPixelPriorityGrid> {
    const { width } = await this.imageLoader.image;

    if (width < minSeams) {
      throw new Error(`Cannot generate ${minSeams} seams for image with width ${width}`);
    }

    while (this.generatedSeams < minSeams) {
      await this.generateSeamBatch();
    }

    return this.seamGrid;
  }
}
